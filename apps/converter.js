(function () {
  var root = document.getElementById('app-converter');
  if (!root) return;

  var CFG_KEY = 'phone_converter_cfg_v1';
  var cfg = loadCfg();
  var currentTab = 'image'; // 'image' | 'font'
  var currentMode = cfg.mode === 'github' ? 'github' : 'catbox';
  var qualityVal = cfg.quality || 85;
  var customFontName = cfg.fontName || '';
  var lastImageResult = null;
  var lastFontResult = null;
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
    cfg.fontName = customFontName;
    localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
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

  function modeLabel(mode, isFont) {
    if (mode === 'github') return '个人 GitHub';
    return isFont ? '公共托管' : '公共图床';
  }

  function arrayBufferToBase64(buffer) {
    var bytes = new Uint8Array(buffer);
    var chunkSize = 0x8000;
    var chunks = [];
    for (var i = 0; i < bytes.length; i += chunkSize) {
      chunks.push(String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize)));
    }
    return btoa(chunks.join(''));
  }

  function strToBase64(str) {
    return btoa(unescape(encodeURIComponent(str)));
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
    }, 2200);
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
        description: 'File host for Phone',
        private: false,
        auto_init: true
      })
    }).then(function (res) {
      return res.ok || res.status === 422;
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
      renderActivePanel();
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
            renderActivePanel();
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
      renderActivePanel();
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
          throw new Error((data && data.error) || '公共托管上传失败');
        }
        return data.url;
      });
    });
  }

  function putGithubFile(token, repo, branch, filePath, base64Content, rawSizeBytes) {
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
          message: 'upload via Phone',
          content: base64Content,
          branch: branch
        })
      }).then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) {
            throw new Error((data && data.message) || ('GitHub 返回错误 ' + res.status));
          }
          if (rawSizeBytes && rawSizeBytes > 20 * 1024 * 1024) {
            return 'https://raw.githubusercontent.com/' + repo + '/' + branch + '/' + filePath;
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

  function checkGithubConfig() {
    var token = (cfg.ghToken || '').trim();
    var repo = (cfg.ghRepo || '').trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\/+$/, '');
    var branch = (cfg.ghBranch || 'main').trim() || 'main';
    if (!token) throw new Error('请先点击上方按钮登录 GitHub');
    if (!repo || repo.indexOf('/') === -1) throw new Error('请填写正确的「用户名/仓库名」');
    return { token: token, repo: repo, branch: branch };
  }

  function renderGithubCardHtml() {
    if (currentMode !== 'github') return '';
    if (!cfg.ghToken) {
      return (
        '<div class="cv-card">' +
          '<div class="cv-label">个人 GitHub 仓库</div>' +
          '<div class="cv-hint" style="margin-top:0;">点下面按钮跳转到 GitHub 授权同意后会自动返回，不用手动复制任何密钥。</div>' +
          '<button class="cv-primary-btn" id="cvGhLoginBtn" type="button">跳转登录 GitHub</button>' +
        '</div>'
      );
    }
    return (
      '<div class="cv-card">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">' +
          '<div>' +
            '<div style="font-weight:700;color:#111111;">已登录 GitHub' + (cfg.ghUser ? '（' + escapeHtml(cfg.ghUser) + '）' : '') + '</div>' +
            '<div class="cv-hint" style="margin-top:2px;">文件将直接上传到你自己的仓库</div>' +
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
      '</div>'
    );
  }

  function bindGithubInputs() {
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
      '</div>' +

      '<div class="cv-body">' +
        '<div class="cv-panel active" id="cvPanelImage"></div>' +
        '<div class="cv-panel" id="cvPanelFont"></div>' +
      '</div>' +

      '<div class="lg-bottom-bar cv-bottom-bar" id="cvBottomBar">' +
        '<div class="cv-tab-indicator"></div>' +
        '<div class="cv-tab active" data-cv-tab="image">图片</div>' +
        '<div class="cv-tab" data-cv-tab="font">字体</div>' +
      '</div>' +

      '<div class="cv-toast" id="cvToast"></div>' +
      '<input type="file" id="cvImageInput" accept="image/*" style="display:none;">' +
      '<input type="file" id="cvFontInput" accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2" style="display:none;">' +
    '</div>';

  function renderImagePanel() {
    var box = document.getElementById('cvPanelImage');
    var hintText = currentMode === 'catbox'
      ? '免登录直接上传到公共图床，不占用你的 GitHub，所有人打开小手机都能直接用。'
      : '登录你自己的 GitHub 后，图片只存在你自己的公开仓库里，互不干扰。';

    var resultHtml = '';
    if (lastImageResult) {
      resultHtml =
        '<div class="cv-card">' +
          '<div class="cv-label">转换结果</div>' +
          '<div class="cv-preview-wrap">' +
            '<img class="cv-thumb" src="' + escapeHtml(lastImageResult.preview || lastImageResult.url) + '" alt="">' +
            '<div class="cv-result-meta">' +
              '<div class="cv-result-name">' + escapeHtml(lastImageResult.name) + '</div>' +
              '<div class="cv-result-sub">' + escapeHtml(modeLabel(lastImageResult.mode, false)) + ' · ' + escapeHtml(lastImageResult.sizeText) + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="cv-url-box">' + escapeHtml(lastImageResult.url) + '</div>' +
          '<div class="cv-copy-grid">' +
            '<button class="cv-copy-btn is-dark" data-img-copy="raw" type="button">复制直链</button>' +
            '<button class="cv-copy-btn" data-img-copy="md" type="button">Markdown</button>' +
            '<button class="cv-copy-btn" data-img-copy="html" type="button">HTML &lt;img&gt;</button>' +
            '<button class="cv-copy-btn" data-img-copy="css" type="button">CSS url()</button>' +
          '</div>' +
        '</div>';
    }

    box.innerHTML =
      '<div class="cv-card">' +
        '<div class="cv-label">上传方式</div>' +
        '<div class="cv-seg">' +
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

      renderGithubCardHtml() +

      '<div class="cv-card">' +
        '<div class="cv-drop" id="cvPickImageBtn">' +
          '<div class="cv-drop-icon">' +
            '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>' +
          '</div>' +
          '<div class="cv-drop-title">' + (isBusy ? '正在上传中，请稍候...' : '点击从相册选择图片') + '</div>' +
          '<div class="cv-drop-sub">上传后自动生成 https:// 图片链接</div>' +
        '</div>' +
      '</div>' +

      resultHtml;

    bindGithubInputs();

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

  function renderFontPanel() {
    var box = document.getElementById('cvPanelFont');
    var hintText = currentMode === 'catbox'
      ? '支持 .ttf / .otf / .woff / .woff2，最大支持 200MB（33MB 大字体选这个即可），自动生成 .css 引入链接。'
      : '传到你自己的 GitHub 仓库并自动生成 .css 文件（GitHub 限制单文件不超过 25MB）。';

    var resultHtml = '';
    if (lastFontResult) {
      var previewFamily = lastFontResult.previewFamily || 'sans-serif';
      resultHtml =
        '<div class="cv-card">' +
          '<div class="cv-label">字体转换结果</div>' +
          '<div class="cv-preview-wrap">' +
            '<div class="cv-font-badge">Aa</div>' +
            '<div class="cv-result-meta">' +
              '<div class="cv-result-name">' + escapeHtml(lastFontResult.name) + '</div>' +
              '<div class="cv-result-sub">字体名：' + escapeHtml(lastFontResult.fontFamily) + ' · ' + escapeHtml(lastFontResult.sizeText) + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="cv-font-preview" style="font-family:\'' + escapeHtml(previewFamily) + '\', sans-serif;">山川湖海，月色温柔 · Abc 123456</div>' +
          '<div class="cv-url-box">&lt;link rel="stylesheet" href="' + escapeHtml(lastFontResult.cssUrl) + '"&gt;</div>' +
          '<div class="cv-copy-grid">' +
            '<button class="cv-copy-btn is-dark" data-font-copy="link" type="button">复制 &lt;link&gt;</button>' +
            '<button class="cv-copy-btn" data-font-copy="import" type="button">复制 @import</button>' +
            '<button class="cv-copy-btn" data-font-copy="cssurl" type="button">复制 .css 网址</button>' +
            '<button class="cv-copy-btn" data-font-copy="raw" type="button">复制字体直链</button>' +
          '</div>' +
        '</div>';
    }

    box.innerHTML =
      '<div class="cv-card">' +
        '<div class="cv-label">托管方式</div>' +
        '<div class="cv-seg">' +
          '<button class="cv-seg-btn' + (currentMode === 'catbox' ? ' active' : '') + '" data-set-mode="catbox" type="button">公共托管</button>' +
          '<button class="cv-seg-btn' + (currentMode === 'github' ? ' active' : '') + '" data-set-mode="github" type="button">个人仓库</button>' +
        '</div>' +
        '<div class="cv-hint">' + hintText + '</div>' +
        '<div class="cv-field">' +
          '<div class="cv-label">字体名称 font-family（可选，默认用文件名）</div>' +
          '<div class="cv-input-box"><input type="text" class="cv-input" id="cvFontNameInput" value="' + escapeHtml(customFontName) + '" placeholder="例如：MyFont"></div>' +
        '</div>' +
      '</div>' +

      renderGithubCardHtml() +

      '<div class="cv-card">' +
        '<div class="cv-drop" id="cvPickFontBtn">' +
          '<div class="cv-drop-icon">' +
            '<svg viewBox="0 0 24 24"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>' +
          '</div>' +
          '<div class="cv-drop-title">' + (isBusy ? '正在上传字体，大文件请稍候...' : '点击选择字体文件') + '</div>' +
          '<div class="cv-drop-sub">支持 .ttf / .otf / .woff / .woff2</div>' +
        '</div>' +
      '</div>' +

      resultHtml;

    bindGithubInputs();

    var fontNameEl = document.getElementById('cvFontNameInput');
    if (fontNameEl) {
      fontNameEl.addEventListener('input', function () {
        customFontName = fontNameEl.value;
        saveCfg();
      });
    }
  }

  function renderActivePanel() {
    if (currentTab === 'font') renderFontPanel();
    else renderImagePanel();
  }

  function switchTab(tab) {
    currentTab = tab;
    var isFont = tab === 'font';
    document.getElementById('cvWrap').classList.toggle('is-subtab', isFont);
    document.getElementById('cvBottomBar').classList.toggle('is-font', isFont);
    document.getElementById('cvTitle').textContent = isFont ? '字体转换' : '转换器';
    document.getElementById('cvPanelImage').classList.toggle('active', !isFont);
    document.getElementById('cvPanelFont').classList.toggle('active', isFont);

    root.querySelectorAll('.cv-tab').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-cv-tab') === tab);
    });
    renderActivePanel();
  }

  root.querySelectorAll('.cv-tab').forEach(function (el) {
    el.addEventListener('click', function () {
      if (isBusy) return;
      switchTab(el.getAttribute('data-cv-tab'));
    });
  });

  root.addEventListener('click', function (e) {
    var modeBtn = e.target.closest('[data-set-mode]');
    if (modeBtn && !isBusy) {
      currentMode = modeBtn.getAttribute('data-set-mode');
      saveCfg();
      renderActivePanel();
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
      renderActivePanel();
      showToast('已退出 GitHub 登录');
      return;
    }

    if (e.target.closest('#cvPickImageBtn')) {
      if (!isBusy) document.getElementById('cvImageInput').click();
      return;
    }

    if (e.target.closest('#cvPickFontBtn')) {
      if (!isBusy) document.getElementById('cvFontInput').click();
      return;
    }

    var imgCopyBtn = e.target.closest('[data-img-copy]');
    if (imgCopyBtn && lastImageResult) {
      var fmt = imgCopyBtn.getAttribute('data-img-copy');
      var u = lastImageResult.url;
      if (fmt === 'raw') copyText(u, '直链');
      else if (fmt === 'md') copyText('[' + u + ']', 'Markdown');
      else if (fmt === 'html') copyText('<img src="' + u + '" alt="">', 'HTML');
      else if (fmt === 'css') copyText('url("' + u + '")', 'CSS');
      return;
    }

    var fontCopyBtn = e.target.closest('[data-font-copy]');
    if (fontCopyBtn && lastFontResult) {
      var fFmt = fontCopyBtn.getAttribute('data-font-copy');
      var cu = lastFontResult.cssUrl;
      var ru = lastFontResult.rawUrl;
      if (fFmt === 'link') copyText('<link rel="stylesheet" href="' + cu + '">', '<link> 代码');
      else if (fFmt === 'import') copyText('@import url("' + cu + '");', '@import 代码');
      else if (fFmt === 'cssurl') copyText(cu, '.css 网址');
      else if (fFmt === 'raw') copyText(ru, '字体直链');
    }
  });

  document.getElementById('cvImageInput').addEventListener('change', function () {
    var file = this.files && this.files[0];
    this.value = '';
    if (!file || isBusy) return;

    isBusy = true;
    renderActivePanel();

    processImageFile(file, qualityVal).then(function (processed) {
      var uploadTask;
      if (currentMode === 'github') {
        var g = checkGithubConfig();
        var base64 = processed.dataUrl.split(',')[1] || '';
        var filePath = 'images/' + Date.now() + '_' + Math.random().toString(36).slice(2, 6) + '.' + processed.ext;
        uploadTask = putGithubFile(g.token, g.repo, g.branch, filePath, base64, processed.blob.size);
      } else {
        var cleanName = (file.name ? file.name.replace(/\.[^.]+$/, '') : 'image') + '.' + processed.ext;
        uploadTask = uploadToCatbox(processed.blob, cleanName);
      }

      return uploadTask.then(function (url) {
        lastImageResult = {
          name: file.name || 'image.' + processed.ext,
          mode: currentMode,
          url: url,
          preview: processed.dataUrl,
          sizeText: formatSize(processed.blob.size)
        };
        isBusy = false;
        renderActivePanel();
        showToast('上传成功，已生成链接');
      });
    }).catch(function (err) {
      isBusy = false;
      renderActivePanel();
      showToast((err && err.message) ? err.message : '上传失败');
    });
  });

  document.getElementById('cvFontInput').addEventListener('change', function () {
    var file = this.files && this.files[0];
    this.value = '';
    if (!file || isBusy) return;

    if (currentMode === 'github' && file.size > 25 * 1024 * 1024) {
      showToast('超过 GitHub 25MB 限制，请切到「公共托管」上传');
      return;
    }

    var rawBaseName = (file.name || 'CustomFont').replace(/\.[^.]+$/, '').replace(/["'\\\r\n;{}]/g, '').trim() || 'CustomFont';
    var fontFamily = (customFontName || '').replace(/["'\\\r\n;{}]/g, '').trim() || rawBaseName;
    var ext = (file.name.split('.').pop() || 'ttf').toLowerCase();

    isBusy = true;
    renderActivePanel();

    file.arrayBuffer().then(function (buf) {
      var previewFamily = 'CvPreview_' + Date.now();
      var previewPromise = Promise.resolve();
      try {
        var face = new FontFace(previewFamily, buf);
        previewPromise = face.load().then(function (loaded) {
          document.fonts.add(loaded);
        }).catch(function () {});
      } catch (e) {}

      var uploadPromise;
      if (currentMode === 'github') {
        var g = checkGithubConfig();
        var stamp = Date.now() + '_' + Math.random().toString(36).slice(2, 6);
        var fontPath = 'fonts/' + stamp + '.' + ext;
        var cssPath = 'fonts/' + stamp + '.css';
        var b64Font = arrayBufferToBase64(buf);

        uploadPromise = putGithubFile(g.token, g.repo, g.branch, fontPath, b64Font, file.size).then(function (rawUrl) {
          var cssText = '@font-face {\n  font-family: "' + fontFamily + '";\n  src: url("' + rawUrl + '");\n  font-display: swap;\n}\n';
          return putGithubFile(g.token, g.repo, g.branch, cssPath, strToBase64(cssText), cssText.length).then(function (cssUrl) {
            return { rawUrl: rawUrl, cssUrl: cssUrl };
          });
        });
      } else {
        uploadPromise = uploadToCatbox(file, file.name || ('font.' + ext)).then(function (rawUrl) {
          var cssUrl = window.location.origin + '/api/font.css?url=' + encodeURIComponent(rawUrl) + '&name=' + encodeURIComponent(fontFamily);
          return { rawUrl: rawUrl, cssUrl: cssUrl };
        });
      }

      return Promise.all([previewPromise, uploadPromise]).then(function (results) {
        var urls = results[1];
        lastFontResult = {
          name: file.name || ('font.' + ext),
          fontFamily: fontFamily,
          previewFamily: previewFamily,
          mode: currentMode,
          rawUrl: urls.rawUrl,
          cssUrl: urls.cssUrl,
          sizeText: formatSize(file.size)
        };
        isBusy = false;
        renderActivePanel();
        showToast('字体上传成功，已生成 .css 链接');
      });
    }).catch(function (err) {
      isBusy = false;
      renderActivePanel();
      showToast((err && err.message) ? err.message : '字体上传失败');
    });
  });

  renderActivePanel();
  handleOAuthCallback();
})();