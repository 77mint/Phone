(function () {
  var root = document.getElementById('app-memory');
  if (!root) return;

  var LIST_KEY = 'phone_memory_list_v1';
  var CFG_KEY = 'phone_memory_cfg_v1';

  var memories = loadList();
  var cfg = loadCfg();
  var currentTab = 'book'; // 'book' | 'settings'
  var filterCharId = 'all';
  var editingId = '';
  var modalCharId = 'global';
  var modalPinned = false;

  function loadList() {
    try {
      var arr = JSON.parse(localStorage.getItem(LIST_KEY) || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function saveList() {
    localStorage.setItem(LIST_KEY, JSON.stringify(memories));
  }

  function loadCfg() {
    try {
      var raw = JSON.parse(localStorage.getItem(CFG_KEY) || '{}');
      return {
        autoEnabled: raw.autoEnabled !== false,
        autoEvery: Number(raw.autoEvery) || 15,
        topK: Number(raw.topK) || 4,
        embedEnabled: !!raw.embedEnabled,
        embedUrl: raw.embedUrl || '',
        embedKey: raw.embedKey || '',
        embedModel: raw.embedModel || ''
      };
    } catch (e) {
      return {
        autoEnabled: true,
        autoEvery: 15,
        topK: 4,
        embedEnabled: false,
        embedUrl: '',
        embedKey: '',
        embedModel: ''
      };
    }
  }

  function saveCfg() {
    localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getCharsList() {
    return (window.PhoneArchive && window.PhoneArchive.getChars)
      ? window.PhoneArchive.getChars()
      : [];
  }

  function getCharName(charId) {
    if (!charId || charId === 'global') return '通用';
    var list = getCharsList();
    var c = list.find(function (x) { return x.id === charId; });
    return c ? (c.name || c.nickname || '未命名') : '已删除角色';
  }

  function formatDate(ts) {
    var d = new Date(ts || Date.now());
    return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' +
      String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  /* ====== 向量计算 & 本地智能检索 ====== */
  function cosineSim(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || !a.length) return 0;
    var dot = 0, na = 0, nb = 0;
    for (var i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    var denom = Math.sqrt(na) * Math.sqrt(nb);
    return denom ? dot / denom : 0;
  }

  function fetchEmbedding(text) {
    var url = (cfg.embedUrl || '').trim();
    var key = (cfg.embedKey || '').trim();
    var model = (cfg.embedModel || '').trim();
    if (!url || !key || !model) {
      return Promise.reject(new Error('请先填写完整向量接口信息'));
    }

    return fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        input: String(text || '').slice(0, 2000)
      })
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) {
          throw new Error((data && data.error && data.error.message) || ('请求失败 ' + res.status));
        }
        var vec = data && data.data && data.data[0] && data.data[0].embedding;
        if (!Array.isArray(vec)) throw new Error('返回格式不包含 embedding 向量');
        return vec;
      });
    });
  }

  function makeBigrams(str) {
    var clean = String(str || '').toLowerCase().replace(/[^\u4e00-\u9fffa-z0-9]/g, '');
    var set = {};
    for (var i = 0; i < clean.length; i++) {
      set[clean[i]] = true;
      if (i + 1 < clean.length) set[clean.slice(i, i + 2)] = true;
    }
    return Object.keys(set);
  }

  function localScore(query, item) {
    var qTokens = makeBigrams(query);
    if (!qTokens.length) return item.pinned ? 1 : 0;
    var target = String(item.content || '').toLowerCase();
    var hits = 0;
    qTokens.forEach(function (t) {
      if (target.indexOf(t) !== -1) hits += (t.length > 1 ? 2 : 0.6);
    });
    var score = hits / Math.max(4, qTokens.length);
    if (item.pinned) score += 0.35;
    return score;
  }

  function buildVectorForMemory(item) {
    if (!cfg.embedEnabled || !cfg.embedUrl || !cfg.embedKey || !cfg.embedModel) {
      return Promise.resolve(false);
    }
    return fetchEmbedding(item.content).then(function (vec) {
      item.hasVector = true;
      saveList();
      if (window.PhoneDB) {
        return window.PhoneDB.set('memory_vec_' + item.id, vec).then(function () { return true; });
      }
      return true;
    }).catch(function () {
      return false;
    });
  }

  function addMemoryItem(opts) {
    var item = {
      id: 'mem_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      charId: opts.charId || 'global',
      content: String(opts.content || '').trim(),
      pinned: !!opts.pinned,
      source: opts.source || 'manual',
      hasVector: false,
      createdAt: opts.createdAt || Date.now()
    };
    if (!item.content) return Promise.resolve(null);
    memories.unshift(item);
    saveList();
    return buildVectorForMemory(item).then(function () {
      if (currentTab === 'book') renderBookPanel();
      return item;
    });
  }

  function searchMemories(queryText, options) {
    var opts = options || {};
    var charId = opts.charId || '';
    var topK = opts.topK || cfg.topK || 4;

    var pool = memories.filter(function (m) {
      if (!m.content) return false;
      if (!charId) return true;
      return m.charId === charId || m.charId === 'global';
    });
    if (!pool.length) return Promise.resolve([]);

    var pinnedList = pool.filter(function (m) { return m.pinned; });
    var normalList = pool.filter(function (m) { return !m.pinned; });

    function fallbackLocal() {
      var scored = normalList.map(function (m) {
        return { item: m, score: localScore(queryText, m) };
      }).sort(function (a, b) {
        if (b.score !== a.score) return b.score - a.score;
        return (b.item.createdAt || 0) - (a.item.createdAt || 0);
      });
      var remain = Math.max(0, topK - pinnedList.length);
      return pinnedList.concat(scored.slice(0, remain).map(function (x) { return x.item; }));
    }

    if (!cfg.embedEnabled || !cfg.embedUrl || !cfg.embedKey || !cfg.embedModel || !window.PhoneDB) {
      return Promise.resolve(fallbackLocal());
    }

    return fetchEmbedding(queryText).then(function (qVec) {
      return Promise.all(normalList.map(function (m) {
        return window.PhoneDB.get('memory_vec_' + m.id).then(function (vec) {
          if (Array.isArray(vec) && vec.length) {
            return { item: m, score: cosineSim(qVec, vec) };
          }
          return { item: m, score: localScore(queryText, m) * 0.4 };
        });
      })).then(function (scored) {
        scored.sort(function (a, b) { return b.score - a.score; });
        var remain = Math.max(0, topK - pinnedList.length);
        return pinnedList.concat(scored.slice(0, remain).map(function (x) { return x.item; }));
      });
    }).catch(function () {
      return fallbackLocal();
    });
  }

  /* 供 iMessage / 线下在达到设定轮数时后台静默调用 */
  function autoCapture(params) {
    if (!cfg.autoEnabled) return Promise.resolve(null);
    var p = params || {};
    var charId = p.charId || 'global';
    var charName = p.charName || getCharName(charId);
    var msgs = Array.isArray(p.messages) ? p.messages : [];
    if (!msgs.length) return Promise.resolve(null);

    var transcript = msgs.map(function (m) {
      var who = m.role === 'user' ? 'User' : charName;
      return who + '：' + String(m.content || '').trim();
    }).join('\n');

    if (typeof p.callLLM === 'function') {
      var prompt =
        '请把下面这段对话提炼成 1-2 句极简长期记忆（只保留时间、地点、核心事件、承诺或重要情绪，去掉寒暄水话，必须写清人名，不要用“他/她”指代）：\n\n' +
        transcript;
      return Promise.resolve(p.callLLM(prompt)).then(function (summary) {
        var text = String(summary || '').trim();
        if (!text) return null;
        return addMemoryItem({ charId: charId, content: text, source: 'auto' });
      }).catch(function () {
        return addMemoryItem({
          charId: charId,
          content: transcript.slice(0, 260),
          source: 'auto'
        });
      });
    }

    return addMemoryItem({
      charId: charId,
      content: transcript.slice(0, 260),
      source: 'auto'
    });
  }

  window.PhoneMemory = {
    getConfig: function () { return Object.assign({}, cfg); },
    getMemories: function (charId) {
      return charId ? memories.filter(function (m) { return m.charId === charId || m.charId === 'global'; }) : memories.slice();
    },
    addMemory: addMemoryItem,
    search: searchMemories,
    autoCapture: autoCapture
  };

  /* ====== UI 渲染 ====== */
  var toastTimer = null;
  function showToast(msg) {
    var el = document.getElementById('mmToast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.classList.remove('show');
    }, 2000);
  }

  root.innerHTML =
    '<div class="mm-wrap" id="mmWrap">' +
      '<div class="mm-header">' +
        '<div class="mm-header-left">' +
          '<div class="mu-back-sm mm-back" data-close-app>' +
            '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>' +
          '</div>' +
          '<div class="mm-title" id="mmTitle">记忆</div>' +
        '</div>' +
        '<div class="mm-header-actions">' +
          '<button class="mm-pill-btn" id="mmAddBtn" type="button">+ 新建</button>' +
        '</div>' +
      '</div>' +

      '<div class="mm-body">' +
        '<div class="mm-panel active" id="mmPanelBook"></div>' +
        '<div class="mm-panel" id="mmPanelSettings"></div>' +
      '</div>' +

      '<div class="lg-bottom-bar mm-bottom-bar" id="mmBottomBar">' +
        '<div class="mm-tab-indicator"></div>' +
        '<div class="mm-tab active" data-mm-tab="book">记忆本</div>' +
        '<div class="mm-tab" data-mm-tab="settings">设置</div>' +
      '</div>' +

      '<div class="mm-modal" id="mmModal">' +
        '<div class="mm-dialog">' +
          '<div class="mm-dialog-head">' +
            '<div class="mm-dialog-title" id="mmModalTitle">记一条记忆</div>' +
            '<div class="mm-icon-circle" id="mmCloseModal">' +
              '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
            '</div>' +
          '</div>' +
          '<div class="mm-label">归属角色</div>' +
          '<div class="mm-char-chips" id="mmModalCharChips"></div>' +
          '<div class="mm-field">' +
            '<div class="mm-label">记忆内容（尽量写清人名和具体事件）</div>' +
            '<div class="mm-input-box"><textarea class="mm-textarea" id="mmModalContent" placeholder="例如：11月3日雨夜，某某把黑伞留给了 User，两人约好下周去吃火锅。"></textarea></div>' +
          '</div>' +
          '<div class="mm-row" style="margin-top:12px;">' +
            '<span class="mm-label" style="margin:0;">置顶为重要记忆（优先保留）</span>' +
            '<button class="mm-switch" id="mmModalPinSwitch" type="button"><div class="mm-switch-thumb"></div></button>' +
          '</div>' +
          '<button class="mm-primary-btn" id="mmSaveBtn" type="button">保存记忆</button>' +
        '</div>' +
      '</div>' +

      '<div class="mm-toast" id="mmToast"></div>' +
    '</div>';

  function renderBookPanel() {
    var box = document.getElementById('mmPanelBook');
    var chars = getCharsList();

    var pillsHtml = '<div class="mm-pills-row">' +
      '<div class="mm-filter-pill' + (filterCharId === 'all' ? ' active' : '') + '" data-mm-filter="all">全部</div>' +
      '<div class="mm-filter-pill' + (filterCharId === 'global' ? ' active' : '') + '" data-mm-filter="global">通用</div>' +
      chars.map(function (c) {
        var on = filterCharId === c.id ? ' active' : '';
        return '<div class="mm-filter-pill' + on + '" data-mm-filter="' + escapeHtml(c.id) + '">' + escapeHtml(c.name || c.nickname || '未命名') + '</div>';
      }).join('') +
    '</div>';

    var filtered = filterCharId === 'all'
      ? memories.slice()
      : memories.filter(function (m) { return m.charId === filterCharId; });

    filtered.sort(function (a, b) {
      if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    if (!filtered.length) {
      box.innerHTML = pillsHtml +
        '<div class="mm-empty">' +
          '<div class="mm-empty-title">还没有记忆</div>' +
          '<div class="mm-empty-sub">平时不用手动管，开启自动记忆后聊天会自动记在这里；也可以点右上角「+ 新建」提前写入重要设定。</div>' +
        '</div>';
      return;
    }

    box.innerHTML = pillsHtml + '<div class="mm-list">' + filtered.map(function (m) {
      return (
        '<div class="mm-card">' +
          '<div class="mm-card-top">' +
            '<div class="mm-tags">' +
              (m.pinned ? '<span class="mm-tag is-pin">置顶</span>' : '') +
              '<span class="mm-tag">' + escapeHtml(getCharName(m.charId)) + '</span>' +
              '<span class="mm-tag">' + (m.hasVector ? '向量' : '本地') + '</span>' +
            '</div>' +
            '<span class="mm-date">' + escapeHtml(formatDate(m.createdAt)) + '</span>' +
          '</div>' +
          '<div class="mm-content">' + escapeHtml(m.content) + '</div>' +
          '<div class="mm-card-foot">' +
            '<button class="mm-mini-btn' + (m.pinned ? ' is-active' : '') + '" data-mm-pin="' + escapeHtml(m.id) + '" type="button">' + (m.pinned ? '已置顶' : '置顶') + '</button>' +
            '<div class="mm-foot-actions">' +
              '<button class="mm-mini-btn" data-mm-edit="' + escapeHtml(m.id) + '" type="button">编辑</button>' +
              '<button class="mm-mini-btn is-danger" data-mm-del="' + escapeHtml(m.id) + '" type="button">删除</button>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('') + '</div>';
  }

  function renderSettingsPanel() {
    var box = document.getElementById('mmPanelSettings');
    box.innerHTML =
      '<div class="mm-card">' +
        '<div class="mm-row">' +
          '<div>' +
            '<div class="mm-row-title">聊天自动记事</div>' +
            '<div class="mm-row-sub">打开后不用手动总结，聊满轮数自动记进记忆本</div>' +
          '</div>' +
          '<button class="mm-switch' + (cfg.autoEnabled ? ' on' : '') + '" id="mmAutoSwitch" type="button"><div class="mm-switch-thumb"></div></button>' +
        '</div>' +

        '<div class="mm-field">' +
          '<div class="mm-label">每隔几句自动记一次</div>' +
          '<div class="mm-seg">' +
            [10, 15, 20].map(function (n) {
              return '<button class="mm-seg-btn' + (cfg.autoEvery === n ? ' active' : '') + '" data-set-every="' + n + '" type="button">' + n + ' 句</button>';
            }).join('') +
          '</div>' +
        '</div>' +

        '<div class="mm-field">' +
          '<div class="mm-label">每次聊天捞取最相关的几条记忆</div>' +
          '<div class="mm-seg">' +
            [3, 4, 6].map(function (k) {
              return '<button class="mm-seg-btn' + (cfg.topK === k ? ' active' : '') + '" data-set-topk="' + k + '" type="button">' + k + ' 条</button>';
            }).join('') +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="mm-card">' +
        '<div class="mm-row">' +
          '<div>' +
            '<div class="mm-row-title">启用向量模型（可选加强）</div>' +
            '<div class="mm-row-sub">不开也能直接用本地检索；配了硅基流动等免费向量接口后按意思检索更准</div>' +
          '</div>' +
          '<button class="mm-switch' + (cfg.embedEnabled ? ' on' : '') + '" id="mmEmbedSwitch" type="button"><div class="mm-switch-thumb"></div></button>' +
        '</div>' +

        (cfg.embedEnabled ? (
          '<div>' +
            '<div class="mm-field">' +
              '<div class="mm-label">向量接口地址 (Embeddings URL)</div>' +
              '<div class="mm-input-box"><input type="text" class="mm-input" id="mmEmbedUrl" value="' + escapeHtml(cfg.embedUrl) + '" placeholder="https://api.siliconflow.cn/v1/embeddings"></div>' +
            '</div>' +
            '<div class="mm-field">' +
              '<div class="mm-label">API Key</div>' +
              '<div class="mm-input-box"><input type="password" class="mm-input" id="mmEmbedKey" value="' + escapeHtml(cfg.embedKey) + '" placeholder="sk-..."></div>' +
            '</div>' +
            '<div class="mm-field">' +
              '<div class="mm-label">向量模型名</div>' +
              '<div class="mm-input-box"><input type="text" class="mm-input" id="mmEmbedModel" value="' + escapeHtml(cfg.embedModel) + '" placeholder="BAAI/bge-m3"></div>' +
            '</div>' +
            '<div class="mm-btn-row">' +
              '<button class="mm-action-btn" id="mmTestEmbedBtn" type="button">测试连通</button>' +
              '<button class="mm-action-btn is-dark" id="mmSyncVecBtn" type="button">补全旧记忆向量</button>' +
            '</div>' +
          '</div>'
        ) : '') +
      '</div>';

    var urlEl = document.getElementById('mmEmbedUrl');
    var keyEl = document.getElementById('mmEmbedKey');
    var modelEl = document.getElementById('mmEmbedModel');
    if (urlEl) urlEl.addEventListener('input', function () { cfg.embedUrl = urlEl.value; saveCfg(); });
    if (keyEl) keyEl.addEventListener('input', function () { cfg.embedKey = keyEl.value; saveCfg(); });
    if (modelEl) modelEl.addEventListener('input', function () { cfg.embedModel = modelEl.value; saveCfg(); });
  }

  function renderModalChips() {
    var chars = getCharsList();
    var html = '<div class="mm-char-chip' + (modalCharId === 'global' ? ' active' : '') + '" data-modal-char="global">通用</div>';
    html += chars.map(function (c) {
      var on = modalCharId === c.id ? ' active' : '';
      return '<div class="mm-char-chip' + on + '" data-modal-char="' + escapeHtml(c.id) + '">' + escapeHtml(c.name || c.nickname || '未命名') + '</div>';
    }).join('');
    document.getElementById('mmModalCharChips').innerHTML = html;
  }

  function openModal(memObj) {
    editingId = memObj ? memObj.id : '';
    modalCharId = memObj ? (memObj.charId || 'global') : (filterCharId !== 'all' ? filterCharId : 'global');
    modalPinned = memObj ? !!memObj.pinned : false;

    document.getElementById('mmModalTitle').textContent = memObj ? '编辑记忆' : '记一条记忆';
    document.getElementById('mmModalContent').value = memObj ? (memObj.content || '') : '';
    document.getElementById('mmModalPinSwitch').classList.toggle('on', modalPinned);
    renderModalChips();
    document.getElementById('mmModal').classList.add('open');
  }

  function switchTab(tab) {
    currentTab = tab;
    var isSet = tab === 'settings';
    document.getElementById('mmWrap').classList.toggle('is-subtab', isSet);
    document.getElementById('mmBottomBar').classList.toggle('is-settings', isSet);
    document.getElementById('mmTitle').textContent = isSet ? '记忆设置' : '记忆';
    document.getElementById('mmPanelBook').classList.toggle('active', !isSet);
    document.getElementById('mmPanelSettings').classList.toggle('active', isSet);
    root.querySelectorAll('.mm-tab').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-mm-tab') === tab);
    });
    if (isSet) renderSettingsPanel();
    else renderBookPanel();
  }

  root.querySelectorAll('.mm-tab').forEach(function (el) {
    el.addEventListener('click', function () {
      switchTab(el.getAttribute('data-mm-tab'));
    });
  });

  document.getElementById('mmAddBtn').addEventListener('click', function () {
    openModal(null);
  });

  document.getElementById('mmCloseModal').addEventListener('click', function () {
    document.getElementById('mmModal').classList.remove('open');
  });

  document.getElementById('mmModalCharChips').addEventListener('click', function (e) {
    var chip = e.target.closest('[data-modal-char]');
    if (!chip) return;
    modalCharId = chip.getAttribute('data-modal-char');
    renderModalChips();
  });

  document.getElementById('mmModalPinSwitch').addEventListener('click', function () {
    modalPinned = !modalPinned;
    this.classList.toggle('on', modalPinned);
  });

  document.getElementById('mmSaveBtn').addEventListener('click', function () {
    var text = document.getElementById('mmModalContent').value.trim();
    if (!text) {
      showToast('请填写记忆内容');
      return;
    }
    document.getElementById('mmModal').classList.remove('open');

    if (editingId) {
      var target = memories.find(function (m) { return m.id === editingId; });
      if (target) {
        target.charId = modalCharId;
        target.content = text;
        target.pinned = modalPinned;
        target.hasVector = false;
        saveList();
        renderBookPanel();
        buildVectorForMemory(target).then(renderBookPanel);
        showToast('已更新记忆');
      }
    } else {
      addMemoryItem({
        charId: modalCharId,
        content: text,
        pinned: modalPinned,
        source: 'manual'
      }).then(function () {
        showToast('已保存记忆');
      });
    }
  });

  document.getElementById('mmPanelBook').addEventListener('click', function (e) {
    var pill = e.target.closest('[data-mm-filter]');
    if (pill) {
      filterCharId = pill.getAttribute('data-mm-filter');
      renderBookPanel();
      return;
    }

    var pinBtn = e.target.closest('[data-mm-pin]');
    if (pinBtn) {
      var pid = pinBtn.getAttribute('data-mm-pin');
      var m = memories.find(function (x) { return x.id === pid; });
      if (m) {
        m.pinned = !m.pinned;
        saveList();
        renderBookPanel();
      }
      return;
    }

    var editBtn = e.target.closest('[data-mm-edit]');
    if (editBtn) {
      var eid = editBtn.getAttribute('data-mm-edit');
      var target = memories.find(function (x) { return x.id === eid; });
      if (target) openModal(target);
      return;
    }

    var delBtn = e.target.closest('[data-mm-del]');
    if (delBtn) {
      var did = delBtn.getAttribute('data-mm-del');
      memories = memories.filter(function (x) { return x.id !== did; });
      saveList();
      if (window.PhoneDB) window.PhoneDB.del('memory_vec_' + did);
      renderBookPanel();
      showToast('已删除');
    }
  });

  document.getElementById('mmPanelSettings').addEventListener('click', function (e) {
    if (e.target.closest('#mmAutoSwitch')) {
      cfg.autoEnabled = !cfg.autoEnabled;
      saveCfg();
      renderSettingsPanel();
      return;
    }
    if (e.target.closest('#mmEmbedSwitch')) {
      cfg.embedEnabled = !cfg.embedEnabled;
      saveCfg();
      renderSettingsPanel();
      return;
    }
    var everyBtn = e.target.closest('[data-set-every]');
    if (everyBtn) {
      cfg.autoEvery = parseInt(everyBtn.getAttribute('data-set-every'), 10) || 15;
      saveCfg();
      renderSettingsPanel();
      return;
    }
    var topkBtn = e.target.closest('[data-set-topk]');
    if (topkBtn) {
      cfg.topK = parseInt(topkBtn.getAttribute('data-set-topk'), 10) || 4;
      saveCfg();
      renderSettingsPanel();
      return;
    }
    if (e.target.closest('#mmTestEmbedBtn')) {
      showToast('正在测试向量接口...');
      fetchEmbedding('测试记忆连通性').then(function (vec) {
        showToast('连通成功（维度 ' + vec.length + '）');
      }).catch(function (err) {
        showToast((err && err.message) ? err.message : '连接失败');
      });
      return;
    }
    if (e.target.closest('#mmSyncVecBtn')) {
      var pending = memories.filter(function (m) { return !m.hasVector && m.content; });
      if (!pending.length) {
        showToast('所有记忆都已建立向量');
        return;
      }
      showToast('正在补全 ' + pending.length + ' 条向量...');
      Promise.all(pending.map(buildVectorForMemory)).then(function () {
        renderBookPanel();
        showToast('向量补全完成');
      });
    }
  });

  renderBookPanel();
})();