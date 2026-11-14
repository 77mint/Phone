(function () {
  var root = document.getElementById('app-converter');
  if (!root) return;

  var CFG_KEY = 'phone_converter_cfg_v1';
  var HIST_KEY = 'phone_converter_history_v1';
  var MAX_HIST = 40;

  var cfg = loadCfg();
  var historyList = loadHistory();
  var currentTab = 'convert';
  var currentMode = cfg.mode === 'github' ? 'github' : 'catbox';
  var qualityVal = cfg.quality || 85;
  var lastResult = null;
  var isBusy = false;

  function loadCfg() {
    try {
      var obj = JSON.parse(localStorage.getItem(CFG_KEY) || '{}');
      return (obj && typeof obj === 'object') ? obj : {};
    } catch (e) {
      return {};
    }
  }

  function saveCfg() {
    cfg.mode = currentMode;
    cfg.quality = qualityVal;
    localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
  }

  function loadHistory() {
    try {
      var arr = JSON.parse(localStorage.getItem(HIST_KEY) || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function saveHistory() {
    localStorage.setItem(HIST_KEY, JSON.stringify(historyList.slice(0, MAX_HIST)));
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatSize(bytes) {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  function modeLabel(mode) {
    return mode === 'github' ? '个人 GitHub' : '公共图床';
  }

  var toastTimer = null;
  function showToast(msg) {
    var el = document.getElementById('cvToast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.classList.remove('show');
    }, 2000);
  }

  function copyText(text, label) {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showToast('已复制' + (label || '内容'));
      }).catch(function () {
        fallbackCopy(text, label);
      });
    } else {
      fallbackCopy(text, label);
    }
  }

  function fallbackCopy(text, label) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast('已复制' + (label || '内容'));
    } catch (e) {
      showToast('复制失败，请手动长按复制');
    }
    document.body.removeChild(ta);
  }

  function ensureGithubRepo(token, repoNameOnly) {
    return fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: repoNameOnly,
        description: 'Image host for Phone',
        private: false,
        auto_init: true
      })
    }).then(function (res) {
      if (res.ok || res.status === 422) return true;
      return false;
    }).catch(function () {
      return false;
    });
  }

  function handleOAuthCallback() {
    var hash = window.location.hash || '';
    if (!hash) return;

    if (hash.indexOf('gh_token=') !== -1) {
      var m = hash.match(/gh_token=([^&]+)/);
      var token = m ? decodeURIComponent(m[1]) : '';
      history.replaceState(null, '', window.location.pathname + window.location.search);
      if (!token) return;

      cfg.ghToken = token;
      currentMode = 'github';
      saveCfg();
      root.classList.add('open');
      renderConvertPanel();
      showToast('正在同步 GitHub 账号...');

      fetch('https://api.github.com/user', {
        headers: {
          'Authorization': 'Bearer ' + token,
          'Accept': 'application/vnd.github+json'
        }
      }).then(function (res) {
        return res.json();
      }).then(function (user) {
        if (user && user.login) {
          cfg.ghUser = user.login;
          if (!cfg.ghRepo) cfg.ghRepo = user.login + '/phone-images';
          if (!cfg.ghBranch) cfg.ghBranch = 'main';
          saveCfg();
          ensureGithubRepo(token, 'phone-images').then(function () {
            renderConvertPanel();
            showToast('已登录 GitHub：' + user.login);
          });
        }
      }).catch(function () {
        showToast('已登录 GitHub');
      });
    } else if (hash.indexOf('gh_error=') !== -1) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
      currentMode = 'github';
      saveCfg();
      root.classList.add('open');
      renderConvertPanel();
      showToast('GitHub 登录未完成，请重试');
    }
  }

  function processImageFile(file, qualityPercent) {
    return new Promise(function (resolve, reject) {
      if (qualityPercent >= 100) {
        var r0 = new FileReader();
        r0.onload = function () {
          resolve({ blob: file, dataUrl: r0.result, ext: (file.name.split('.').pop() || 'png').toLowerCase() });
        };
        r0.onerror = function () { reject(new Error('读取图片失败')); };
        r0.readAsDataURL(file);
        return;
      }

      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          var maxSide = 2048;
          var w = img.width;
          var h = img.height;
          if (w > maxSide || h > maxSide) {
            var ratio = Math.min(maxSide / w, maxSide / h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
          }
          var canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);

          var q = Math.min(0.98, Math.max(0.4, qualityPercent / 100));
          var dataUrl = canvas.toDataURL('image/jpeg', q);

          canvas.toBlob(function (blob) {
            if (!blob) {
              reject(new Error('图片压缩失败'));
              return;
            }
            resolve({ blob: blob, dataUrl: dataUrl, ext: 'jpg' });
          }, 'image/jpeg', q);
        };
        img.onerror = function () { reject(new Error('图片格式不支持')); };
        img.src = reader.result;
      };
      reader.onerror = function () { reject(new Error('读取图片失败')); };
      reader.readAsDataURL(file);
    });
  }

  function uploadToCatbox(blob, filename) {
    var fd = new FormData();
    fd.append('file', blob, filename);
    return fetch('/api/upload', {
      method: 'POST',
      body: fd
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok || !data || !data.ok || !data.url) {
          throw new Error((data && data.error) || '公共图床上传失败');
        }
        return data.url;
      });
    });
  }

  function uploadToGithub(dataUrl, ext) {
    var token = (cfg.ghToken || '').trim();
    var repo = (cfg.ghRepo || '').trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\/+$/, '');
    var branch = (cfg.ghBranch || 'main').trim() || 'main';

    if (!token) {
      return Promise.reject(new Error('请先点击上方按钮登录 GitHub'));
    }
    if (!repo || repo.indexOf('/') === -1) {
      return Promise.reject(new Error('请填写正确的「用户名/仓库名」'));
    }

    var base64 = dataUrl.split(',')[1] || '';
    var filePath = 'images/' + Date.now() + '_' + Math.random().toString(36).slice(2, 6) + '.' + ext;
    var apiUrl = 'https://api.github.com/repos/' + repo + '/contents/' + filePath;

    function doPut() {
      return fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'upload image via Phone',
          content: base64,
          branch: branch
        })
      }).then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) {
            throw new Error((data && data.message) || ('GitHub 返回错误 ' + res.status));
          }
          return 'https://cdn.jsdelivr.net/gh/' + repo + '@' + branch + '/' + filePath;
        });
      });
    }

    return doPut().catch(function (err) {
      if (err && String(err.message).indexOf('Not Found') !== -1) {
        var repoOnly = repo.split('/')[1];
        return ensureGithubRepo(token, repoOnly).then(function () {
          return doPut();
        });
      }
      throw err;
    });
  }

  root.innerHTML =
    '<div class="cv-wrap" id="cvWrap">' +
      '<div class="cv-header">' +
        '<div class="cv-header-left">' +
          '<div class="mu-back-sm cv-back" data-close-app>' +
            '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>' +
          '</div>' +
          '<div class="cv-title" id="cvTitle">转换器</div>' +
        '</div>' +
        '<button class="cv-pill-btn" id="cvClearHistBtn" type="button" style="display:none;">清空</button>' +
      '</div>' +

      '<div class="cv-body">' +
        '<div class="cv-panel active" id="cvPanelConvert"></div>' +
        '<div class="cv-panel" id="cvPanelHistory"></div>' +
      '</div>' +

      '<div class="lg-bottom-bar cv-bottom-bar" id="cvBottomBar">' +
        '<div class="cv-tab-indicator"></div>' +
        '<div class="cv-tab active" data-cv-tab="convert">转换</div>' +
        '<div class="cv-tab" data-cv-tab="history">记录</div>' +
      '</div>' +

      '<div class="cv-toast" id="cvToast"></div>' +
      '<input type="file" id="cvFileInput" accept="image/*" style="display:none;">' +
    '</div>';

  function renderConvertPanel() {
    var box = document.getElementById('cvPanelConvert');
    var hintText = currentMode === 'catbox'
      ? '免登录直接上传到公共图床，不占用你的 GitHub，所有人打开小手机都能直接用。'
      : '登录你自己的 GitHub 后，图片只存在你自己的公开仓库里，互不干扰。';

    var ghFormHtml = '';
    if (currentMode === 'github') {
      if (!cfg.ghToken) {
        ghFormHtml =
          '<div class="cv-card">' +
            '<div class="cv-label">个人 GitHub 图床</div>' +
            '<div class="cv-hint" style="margin-top:0;">点下面按钮跳转到 GitHub 授权同意后会自动返回，不用手动复制任何密钥。</div>' +
            '<button class="cv-primary-btn" id="cvGhLoginBtn" type="button">跳转登录 GitHub</button>' +
          '</div>';
      } else {
        ghFormHtml =
          '<div class="cv-card">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">' +
              '<div>' +
                '<div style="font-weight:700;color:#111111;">已登录 GitHub' + (cfg.ghUser ? '（' + escapeHtml(cfg.ghUser) + '）' : '') + '</div>' +
                '<div class="cv-hint" style="margin-top:2px;">图片将直接上传到你自己的仓库</div>' +
              '</div>' +
              '<button class="cv-mini-btn is-danger" id="cvGhLogoutBtn" type="button">退出</button>' +
            '</div>' +
            '<div class="cv-field">' +
              '<div class="cv-label">存放仓库（默认自动建好 phone-images）</div>' +
              '<div class="cv-input-box"><input type="text" class="cv-input" id="cvGhRepo" value="' + escapeHtml(cfg.ghRepo || '') + '" placeholder="用户名/phone-images"></div>' +
            '</div>' +
            '<div class="cv-field">' +
              '<div class="cv-label">分支（默认 main）</div>' +
              '<div class="cv-input-box"><input type="text" class="cv-input" id="cvGhBranch" value="' + escapeHtml(cfg.ghBranch || 'main') + '" placeholder="main"></div>' +
            '</div>' +
          '</div>';
      }
    }

    var resultHtml = '';
    if (lastResult) {
      resultHtml =
        '<div class="cv-card">' +
          '<div class="cv-label">转换结果</div>' +
          '<div class="cv-preview-wrap">' +
            '<img class="cv-thumb" src="' + escapeHtml(lastResult.preview || lastResult.url) + '" alt="">' +
            '<div class="cv-result-meta">' +
              '<div class="cv-result-name">' + escapeHtml(lastResult.name) + '</div>' +
              '<div class="cv-result-sub">' + escapeHtml(modeLabel(lastResult.mode)) + ' · ' + escapeHtml(lastResult.sizeText) + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="cv-url-box">' + escapeHtml(lastResult.url) + '</div>' +
          '<div class="cv-copy-grid">' +
            '<button class="cv-copy-btn is-dark" data-copy-fmt="raw" type="button">复制直链</button>' +
            '<button class="cv-copy-btn" data-copy-fmt="md" type="button">Markdown</button>' +
            '<button class="cv-copy-btn" data-copy-fmt="html" type="button">HTML &lt;img&gt;</button>' +
            '<button class="cv-copy-btn" data-copy-fmt="css" type="button">CSS url()</button>' +
          '</div>' +
        '</div>';
    }

    box.innerHTML =
      '<div class="cv-card">' +
        '<div class="cv-label">转换方式</div>' +
        '<div class="cv-seg is-2">' +
          '<button class="cv-seg-btn' + (currentMode === 'catbox' ? ' active' : '') + '" data-set-mode="catbox" type="button">公共图床</button>' +
          '<button class="cv-seg-btn' + (currentMode === 'github' ? ' active' : '') + '" data-set-mode="github" type="button">个人仓库</button>' +
        '</div>' +
        '<div class="cv-hint">' + hintText + '</div>' +
        '<div class="cv-range-row">' +
          '<span class="cv-label" style="margin:0;white-space:nowrap;">压缩画质</span>' +
          '<input type="range" id="cvQualityRange" min="50" max="100" step="5" value="' + qualityVal + '">' +
          '<span class="cv-range-val" id="cvQualityText">' + (qualityVal >= 100 ? '原图' : qualityVal + '%') + '</span>' +
        '</div>' +
      '</div>' +

      ghFormHtml +

      '<div class="cv-card">' +
        '<div class="cv-drop" id="cvPickBtn">' +
          '<div class="cv-drop-icon">' +
            '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>' +
          '</div>' +
          '<div class="cv-drop-title">' + (isBusy ? '正在上传中，请稍候...' : '点击从相册选择图片') + '</div>' +
          '<div class="cv-drop-sub">上传后自动生成 https:// 图片链接</div>' +
        '</div>' +
      '</div>' +

      resultHtml;

    var ghRepoEl = document.getElementById('cvGhRepo');
    var ghBranchEl = document.getElementById('cvGhBranch');
    if (ghRepoEl) {
      ghRepoEl.addEventListener('input', function () {
        cfg.ghRepo = ghRepoEl.value;
        saveCfg();
      });
    }
    if (ghBranchEl) {
      ghBranchEl.addEventListener('input', function () {
        cfg.ghBranch = ghBranchEl.value;
        saveCfg();
      });
    }

    var rangeEl = document.getElementById('cvQualityRange');
    var rangeText = document.getElementById('cvQualityText');
    if (rangeEl) {
      rangeEl.addEventListener('input', function () {
        qualityVal = parseInt(rangeEl.value, 10) || 85;
        rangeText.textContent = qualityVal >= 100 ? '原图' : (qualityVal + '%');
        saveCfg();
      });
    }
  }

  function renderHistoryPanel() {
    var box = document.getElementById('cvPanelHistory');
    if (!historyList.length) {
      box.innerHTML =
        '<div class="cv-empty">' +
          '<div class="cv-empty-title">还没有转换记录</div>' +
          '<div class="cv-empty-sub">上传生成的 https:// 链接会自动保存在这里</div>' +
        '</div>';
      return;
    }

    box.innerHTML = '<div class="cv-history-list">' + historyList.map(function (item) {
      return (
        '<div class="cv-hist-card">' +
          '<img class="cv-thumb" style="width:46px;height:46px;border-radius:11px;" src="' + escapeHtml(item.url) + '" alt="">' +
          '<div class="cv-hist-info">' +
            '<div class="cv-hist-url">' + escapeHtml(item.url) + '</div>' +
            '<div class="cv-hist-meta">' + escapeHtml(modeLabel(item.mode)) + ' · ' + escapeHtml(item.time || '') + '</div>' +
          '</div>' +
          '<div class="cv-hist-actions">' +
            '<button class="cv-mini-btn" data-hist-copy="' + escapeHtml(item.id) + '" type="button">复制</button>' +
            '<button class="cv-mini-btn is-danger" data-hist-del="' + escapeHtml(item.id) + '" type="button">删</button>' +
          '</div>' +
        '</div>'
      );
    }).join('') + '</div>';
  }

  function switchTab(tab) {
    currentTab = tab;
    var isHist = tab === 'history';
    document.getElementById('cvWrap').classList.toggle('is-subtab', isHist);
    document.getElementById('cvBottomBar').classList.toggle('is-history', isHist);
    document.getElementById('cvTitle').textContent = isHist ? '转换记录' : '转换器';
    document.getElementById('cvClearHistBtn').style.display = isHist ? 'inline-flex' : 'none';
    document.getElementById('cvPanelConvert').classList.toggle('active', !isHist);
    document.getElementById('cvPanelHistory').classList.toggle('active', isHist);

    root.querySelectorAll('.cv-tab').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-cv-tab') === tab);
    });
    if (isHist) renderHistoryPanel();
  }

  root.querySelectorAll('.cv-tab').forEach(function (el) {
    el.addEventListener('click', function () {
      switchTab(el.getAttribute('data-cv-tab'));
    });
  });

  document.getElementById('cvClearHistBtn').addEventListener('click', function () {
    if (!historyList.length) return;
    if (!confirm('确定清空全部转换记录吗？')) return;
    historyList = [];
    saveHistory();
    renderHistoryPanel();
    showToast('记录已清空');
  });

  document.getElementById('cvPanelConvert').addEventListener('click', function (e) {
    var modeBtn = e.target.closest('[data-set-mode]');
    if (modeBtn && !isBusy) {
      currentMode = modeBtn.getAttribute('data-set-mode');
      saveCfg();
      renderConvertPanel();
      return;
    }

    if (e.target.closest('#cvGhLoginBtn')) {
      window.location.href = '/api/github/login';
      return;
    }

    if (e.target.closest('#cvGhLogoutBtn')) {
      cfg.ghToken = '';
      cfg.ghUser = '';
      saveCfg();
      renderConvertPanel();
      showToast('已退出 GitHub 登录');
      return;
    }

    var pickBtn = e.target.closest('#cvPickBtn');
    if (pickBtn) {
      if (isBusy) return;
      document.getElementById('cvFileInput').click();
      return;
    }

    var copyBtn = e.target.closest('[data-copy-fmt]');
    if (copyBtn && lastResult) {
      var fmt = copyBtn.getAttribute('data-copy-fmt');
      var u = lastResult.url;
      if (fmt === 'raw') copyText(u, '直链');
      else if (fmt === 'md') copyText('[' + u + ']', 'Markdown');
      else if (fmt === 'html') copyText('<img src="' + u + '" alt="">', 'HTML');
      else if (fmt === 'css') copyText('url("' + u + '")', 'CSS');
    }
  });

  document.getElementById('cvPanelHistory').addEventListener('click', function (e) {
    var copyBtn = e.target.closest('[data-hist-copy]');
    if (copyBtn) {
      var hid = copyBtn.getAttribute('data-hist-copy');
      var found = historyList.find(function (x) { return x.id === hid; });
      if (found) copyText(found.url, '直链');
      return;
    }
    var delBtn = e.target.closest('[data-hist-del]');
    if (delBtn) {
      var did = delBtn.getAttribute('data-hist-del');
      historyList = historyList.filter(function (x) { return x.id !== did; });
      saveHistory();
      renderHistoryPanel();
    }
  });

  document.getElementById('cvFileInput').addEventListener('change', function () {
    var file = this.files && this.files[0];
    this.value = '';
    if (!file || isBusy) return;

    isBusy = true;
    renderConvertPanel();

    processImageFile(file, qualityVal).then(function (processed) {
      var uploadTask = currentMode === 'github'
        ? uploadToGithub(processed.dataUrl, processed.ext)
        : uploadToCatbox(processed.blob, (file.name ? file.name.replace(/\.[^.]+$/, '') : 'image') + '.' + processed.ext);

      return uploadTask.then(function (url) {
        lastResult = {
          name: file.name || 'image.' + processed.ext,
          mode: currentMode,
          url: url,
          preview: processed.dataUrl,
          sizeText: formatSize(processed.blob.size)
        };
        var now = new Date();
        var timeStr = (now.getMonth() + 1) + '/' + now.getDate() + ' ' +
          String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
        historyList.unshift({
          id: 'cv_' + Date.now(),
          url: url,
          mode: currentMode,
          time: timeStr
        });
        saveHistory();
        isBusy = false;
        renderConvertPanel();
        showToast('上传成功，已生成链接');
      });
    }).catch(function (err) {
      isBusy = false;
      renderConvertPanel();
      showToast((err && err.message) ? err.message : '上传失败');
    });
  });

  renderConvertPanel();
  handleOAuthCallback();
})();