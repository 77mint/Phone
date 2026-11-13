(function () {
  var root = document.getElementById('app-api');
  if (!root) return;

  var STORAGE_KEY = 'phone_api_config';
  var LOGS_KEY = 'phone_api_logs';

  var MODULES = [
    { key: 'llm', title: '语言模型', tag: 'LLM' },
    { key: 'voice', title: '语音模型', tag: 'VOICE' },
    { key: 'image', title: '生图模型', tag: 'IMAGE' },
    { key: 'translate', title: '翻译模型', tag: 'TRANSLATE' }
  ];

  var TYPES = [
    { id: 'openai', label: 'OpenAI', placeholder: 'https://api.openai.com/v1 或反代地址' },
    { id: 'google', label: 'Google', placeholder: 'https://generativelanguage.googleapis.com 或反代' },
    { id: 'anthropic', label: 'A社', placeholder: 'https://api.anthropic.com 或反代地址' },
    { id: 'custom', label: '自定义兼容', placeholder: '填写完整兼容接口地址（如 https://.../v1）' }
  ];

  function createEmptySlot() {
    return { type: 'openai', url: '', key: '', model: '' };
  }

  function loadAllConfigs() {
    try {
      var raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      var out = {};
      MODULES.forEach(function (m) {
        var item = raw[m.key] || {};
        out[m.key] = {
          primary: Object.assign(createEmptySlot(), item.primary || {}),
          backupEnabled: !!item.backupEnabled,
          backup: Object.assign(createEmptySlot(), item.backup || {})
        };
      });
      return out;
    } catch (e) {
      var fallback = {};
      MODULES.forEach(function (m) {
        fallback[m.key] = { primary: createEmptySlot(), backupEnabled: false, backup: createEmptySlot() };
      });
      return fallback;
    }
  }

  function saveAllConfigs(cfg) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  }

  function loadLogs() {
    try {
      var arr = JSON.parse(localStorage.getItem(LOGS_KEY) || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function appendLog(entry) {
    var logs = loadLogs();
    var now = new Date();
    var hh = String(now.getHours()).padStart(2, '0');
    var mm = String(now.getMinutes()).padStart(2, '0');
    var ss = String(now.getSeconds()).padStart(2, '0');
    logs.unshift({
      time: hh + ':' + mm + ':' + ss,
      module: entry.module || 'LLM',
      ok: !!entry.ok,
      detail: entry.detail || ''
    });
    if (logs.length > 50) logs = logs.slice(0, 50);
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
    renderHomeCards();
  }

  window.PhoneAPI = {
    getConfig: function (moduleKey) {
      var all = loadAllConfigs();
      return all[moduleKey] || null;
    },
    addLog: appendLog
  };

  var SVG_CHEVRON = '<svg class="api-chevron" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>';
  var SVG_CLOSE = '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  var SVG_EYE = '<svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';

  root.innerHTML =
    '<div class="api-shell">' +
      '<div class="api-header">' +
        '<div class="app-back" data-close-app>' +
          '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>' +
        '</div>' +
      '</div>' +
      '<div class="api-body">' +
        '<div class="api-list" id="apiHomeList"></div>' +
      '</div>' +

      '<div class="api-modal" id="apiConfigModal">' +
        '<div class="api-dialog">' +
          '<div class="api-dialog-head">' +
            '<div class="api-dialog-title-wrap">' +
              '<span class="api-dialog-title" id="apiModalTitle">语言模型</span>' +
              '<span class="api-dialog-tag" id="apiModalTag">LLM</span>' +
            '</div>' +
            '<div class="api-dialog-close" id="apiCloseConfig">' + SVG_CLOSE + '</div>' +
          '</div>' +
          '<div class="api-dialog-body">' +
            '<div id="apiPrimaryFields"></div>' +
            '<div class="api-switch-row">' +
              '<div>' +
                '<div class="api-switch-text">副 API</div>' +
                '<div class="api-switch-sub">开启后可配置备用接口</div>' +
              '</div>' +
              '<div class="api-switch" id="apiBackupSwitch"><div class="api-switch-thumb"></div></div>' +
            '</div>' +
            '<div class="api-sub-section" id="apiBackupSection">' +
              '<div class="api-sub-badge">副 API 配置</div>' +
              '<div id="apiBackupFields"></div>' +
            '</div>' +
            '<div class="api-test-msg" id="apiTestMsg"></div>' +
          '</div>' +
          '<div class="api-dialog-foot">' +
            '<div class="api-btn-secondary" id="apiTestBtn">测试连接</div>' +
            '<div class="api-btn-primary" id="apiSaveBtn">保存配置</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="api-modal" id="apiLogsModal">' +
        '<div class="api-dialog">' +
          '<div class="api-dialog-head">' +
            '<div class="api-dialog-title-wrap">' +
              '<span class="api-dialog-title">API调用日志</span>' +
            '</div>' +
            '<div class="api-dialog-close" id="apiCloseLogs">' + SVG_CLOSE + '</div>' +
          '</div>' +
          '<div class="api-dialog-body" id="apiLogsBody"></div>' +
          '<div class="api-dialog-foot">' +
            '<div class="api-btn-secondary" id="apiClearLogsBtn">清空日志</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  var activeModuleKey = '';
  var draftState = null;

  function typeLabel(typeId) {
    var t = TYPES.find(function (x) { return x.id === typeId; });
    return t ? t.label : 'OpenAI';
  }

  function typePlaceholder(typeId) {
    var t = TYPES.find(function (x) { return x.id === typeId; });
    return t ? t.placeholder : TYPES[0].placeholder;
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderHomeCards() {
    var cfg = loadAllConfigs();
    var logs = loadLogs();
    var listEl = document.getElementById('apiHomeList');

    var html = MODULES.map(function (m) {
      var c = cfg[m.key];
      var hasUrl = !!(c.primary.url && c.primary.url.trim());
      var hasKey = !!(c.primary.key && c.primary.key.trim());
      var subText = '未配置';
      var subCls = 'api-card-sub';
      if (hasUrl || hasKey) {
        subCls += ' configured';
        subText = typeLabel(c.primary.type) +
          (c.primary.model ? ' · ' + c.primary.model : '') +
          (c.backupEnabled ? ' · 已开副API' : '');
      }
      return (
        '<div class="api-card" data-api-module="' + m.key + '">' +
          '<div class="api-card-main">' +
            '<div class="api-card-title-row">' +
              '<span class="api-card-title">' + m.title + '</span>' +
              '<span class="api-card-tag">' + m.tag + '</span>' +
            '</div>' +
            '<div class="' + subCls + '">' + escapeHtml(subText) + '</div>' +
          '</div>' +
          SVG_CHEVRON +
        '</div>'
      );
    }).join('');

    var logSub = logs.length ? ('共 ' + logs.length + ' 条记录 · 最近 ' + logs[0].time) : '暂无记录';
    html +=
      '<div class="api-card" id="apiOpenLogsCard">' +
        '<div class="api-card-main">' +
          '<div class="api-card-title-row">' +
            '<span class="api-card-title">API调用日志</span>' +
          '</div>' +
          '<div class="api-card-sub">' + escapeHtml(logSub) + '</div>' +
        '</div>' +
        SVG_CHEVRON +
      '</div>';

    listEl.innerHTML = html;
  }

  function buildSlotHtml(prefix, slot) {
    var segHtml = TYPES.map(function (t) {
      var active = slot.type === t.id ? ' active' : '';
      return '<div class="api-type-btn' + active + '" data-slot="' + prefix + '" data-type="' + t.id + '">' + t.label + '</div>';
    }).join('');

    return (
      '<div>' +
        '<div class="api-field-label">1. 类型</div>' +
        '<div class="api-type-seg">' + segHtml + '</div>' +
      '</div>' +
      '<div>' +
        '<div class="api-field-label">2. 地址</div>' +
        '<div class="api-input-box">' +
          '<input type="url" class="api-input" id="api_' + prefix + '_url" value="' + escapeHtml(slot.url) + '" placeholder="' + escapeHtml(typePlaceholder(slot.type)) + '">' +
        '</div>' +
      '</div>' +
      '<div>' +
        '<div class="api-field-label">3. Key</div>' +
        '<div class="api-input-box">' +
          '<input type="password" class="api-input" id="api_' + prefix + '_key" value="' + escapeHtml(slot.key) + '" placeholder="粘贴 API Key">' +
          '<div class="api-eye-btn" data-toggle-eye="api_' + prefix + '_key">' + SVG_EYE + '</div>' +
        '</div>' +
      '</div>' +
      '<div>' +
        '<div class="api-field-label">4. 模型</div>' +
        '<div class="api-input-box">' +
          '<input type="text" class="api-input" id="api_' + prefix + '_model" value="' + escapeHtml(slot.model) + '" placeholder="手动填写或点右侧拉取">' +
          '<div class="api-mini-action" data-fetch-models="' + prefix + '">拉取</div>' +
        '</div>' +
        '<div class="api-model-chips" id="api_' + prefix + '_chips"></div>' +
      '</div>'
    );
  }

  function syncDraftFromInputs() {
    if (!draftState) return;
    ['primary', 'backup'].forEach(function (prefix) {
      var urlEl = document.getElementById('api_' + prefix + '_url');
      var keyEl = document.getElementById('api_' + prefix + '_key');
      var modelEl = document.getElementById('api_' + prefix + '_model');
      if (urlEl) draftState[prefix].url = urlEl.value.trim();
      if (keyEl) draftState[prefix].key = keyEl.value.trim();
      if (modelEl) draftState[prefix].model = modelEl.value.trim();
    });
  }

  function renderModalForm() {
    document.getElementById('apiPrimaryFields').innerHTML = buildSlotHtml('primary', draftState.primary);
    document.getElementById('apiBackupFields').innerHTML = buildSlotHtml('backup', draftState.backup);
    document.getElementById('apiBackupSwitch').classList.toggle('on', draftState.backupEnabled);
    document.getElementById('apiBackupSection').classList.toggle('open', draftState.backupEnabled);
  }

  function normalizeBaseUrl(raw, type) {
    var u = (raw || '').trim().replace(/\/+$/, '');
    if (!u) return '';
    if ((type === 'openai' || type === 'custom') && !/\/v\d+$/i.test(u) && u.indexOf('/v1/') === -1) {
      u += '/v1';
    }
    return u;
  }

  function fetchModelsForSlot(prefix) {
    syncDraftFromInputs();
    var slot = draftState[prefix];
    var msgEl = document.getElementById('apiTestMsg');
    var chipsEl = document.getElementById('api_' + prefix + '_chips');
    var base = normalizeBaseUrl(slot.url, slot.type);

    if (!base) {
      msgEl.className = 'api-test-msg show err';
      msgEl.textContent = '请先填写地址再拉取模型';
      return;
    }

    msgEl.className = 'api-test-msg show';
    msgEl.textContent = '正在拉取模型列表...';

    var endpoint = '';
    var headers = {};
    if (slot.type === 'google') {
      endpoint = base.replace(/\/+$/, '') + '/v1beta/models' + (slot.key ? '?key=' + encodeURIComponent(slot.key) : '');
    } else if (slot.type === 'anthropic') {
      endpoint = base.replace(/\/+$/, '') + '/v1/models';
      if (slot.key) {
        headers['x-api-key'] = slot.key;
        headers['anthropic-version'] = '2023-06-01';
      }
    } else {
      endpoint = base + '/models';
      if (slot.key) headers['Authorization'] = 'Bearer ' + slot.key;
    }

    fetch(endpoint, { headers: headers })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        var list = [];
        if (Array.isArray(data.data)) {
          list = data.data.map(function (x) { return x.id; }).filter(Boolean);
        } else if (Array.isArray(data.models)) {
          list = data.models.map(function (x) { return (x.name || '').replace(/^models\//, ''); }).filter(Boolean);
        }
        if (!list.length) throw new Error('未返回模型列表');
        chipsEl.innerHTML = list.slice(0, 30).map(function (id) {
          var on = slot.model === id ? ' active' : '';
          return '<div class="api-model-chip' + on + '" data-pick-slot="' + prefix + '" data-pick-model="' + escapeHtml(id) + '">' + escapeHtml(id) + '</div>';
        }).join('');
        chipsEl.classList.add('show');
        msgEl.className = 'api-test-msg show ok';
        msgEl.textContent = '已拉取 ' + list.length + ' 个模型，点击即可选用';
      })
      .catch(function (err) {
        msgEl.className = 'api-test-msg show err';
        msgEl.textContent = '拉取失败（' + err.message + '），可直接手动填写模型名';
      });
  }

  function testPrimaryConnection() {
    syncDraftFromInputs();
    var slot = draftState.primary;
    var msgEl = document.getElementById('apiTestMsg');
    var mod = MODULES.find(function (m) { return m.key === activeModuleKey; });
    var modTag = mod ? mod.tag : 'API';
    var base = normalizeBaseUrl(slot.url, slot.type);

    if (!base || !slot.key) {
      msgEl.className = 'api-test-msg show err';
      msgEl.textContent = '请先填写地址和 Key';
      return;
    }

    msgEl.className = 'api-test-msg show';
    msgEl.textContent = '正在测试连接...';
    var start = Date.now();

    var endpoint = '';
    var headers = {};
    if (slot.type === 'google') {
      endpoint = base.replace(/\/+$/, '') + '/v1beta/models?key=' + encodeURIComponent(slot.key);
    } else if (slot.type === 'anthropic') {
      endpoint = base.replace(/\/+$/, '') + '/v1/models';
      headers['x-api-key'] = slot.key;
      headers['anthropic-version'] = '2023-06-01';
    } else {
      endpoint = base + '/models';
      headers['Authorization'] = 'Bearer ' + slot.key;
    }

    fetch(endpoint, { headers: headers })
      .then(function (r) {
        var ms = Date.now() - start;
        if (!r.ok) throw new Error('HTTP ' + r.status);
        msgEl.className = 'api-test-msg show ok';
        msgEl.textContent = '连接成功（耗时 ' + ms + 'ms）';
        appendLog({
          module: modTag,
          ok: true,
          detail: '测试连通成功 · ' + typeLabel(slot.type) + ' · ' + ms + 'ms'
        });
      })
      .catch(function (err) {
        var ms = Date.now() - start;
        msgEl.className = 'api-test-msg show err';
        msgEl.textContent = '连接失败：' + err.message + '（' + ms + 'ms）';
        appendLog({
          module: modTag,
          ok: false,
          detail: '测试失败：' + err.message + ' · ' + (base || '未填地址')
        });
      });
  }

  function renderLogsModal() {
    var logs = loadLogs();
    var body = document.getElementById('apiLogsBody');
    if (!logs.length) {
      body.innerHTML = '<div class="api-log-empty">暂无调用记录</div>';
      return;
    }
    body.innerHTML = '<div class="api-log-list">' + logs.map(function (l) {
      return (
        '<div class="api-log-item">' +
          '<div class="api-log-top">' +
            '<span class="api-log-mod">' + escapeHtml(l.module) + ' · ' + (l.ok ? '成功' : '失败') + '</span>' +
            '<span class="api-log-time">' + escapeHtml(l.time) + '</span>' +
          '</div>' +
          '<div class="api-log-detail">' + escapeHtml(l.detail) + '</div>' +
        '</div>'
      );
    }).join('') + '</div>';
  }

  renderHomeCards();

  var configModal = document.getElementById('apiConfigModal');
  var logsModal = document.getElementById('apiLogsModal');

  root.addEventListener('click', function (e) {
    var card = e.target.closest('[data-api-module]');
    if (card) {
      activeModuleKey = card.getAttribute('data-api-module');
      var mod = MODULES.find(function (m) { return m.key === activeModuleKey; });
      var all = loadAllConfigs();
      draftState = JSON.parse(JSON.stringify(all[activeModuleKey]));
      document.getElementById('apiModalTitle').textContent = mod.title;
      document.getElementById('apiModalTag').textContent = mod.tag;
      document.getElementById('apiTestMsg').className = 'api-test-msg';
      renderModalForm();
      configModal.classList.add('open');
      return;
    }

    if (e.target.closest('#apiOpenLogsCard')) {
      renderLogsModal();
      logsModal.classList.add('open');
      return;
    }

    var typeBtn = e.target.closest('.api-type-btn');
    if (typeBtn) {
      syncDraftFromInputs();
      var slotName = typeBtn.getAttribute('data-slot');
      var newType = typeBtn.getAttribute('data-type');
      draftState[slotName].type = newType;
      renderModalForm();
      return;
    }

    var eyeBtn = e.target.closest('[data-toggle-eye]');
    if (eyeBtn) {
      var input = document.getElementById(eyeBtn.getAttribute('data-toggle-eye'));
      if (input) input.type = input.type === 'password' ? 'text' : 'password';
      return;
    }

    var fetchBtn = e.target.closest('[data-fetch-models]');
    if (fetchBtn) {
      fetchModelsForSlot(fetchBtn.getAttribute('data-fetch-models'));
      return;
    }

    var chip = e.target.closest('[data-pick-model]');
    if (chip) {
      var pSlot = chip.getAttribute('data-pick-slot');
      var pModel = chip.getAttribute('data-pick-model');
      var mInput = document.getElementById('api_' + pSlot + '_model');
      if (mInput) mInput.value = pModel;
      draftState[pSlot].model = pModel;
      chip.parentElement.querySelectorAll('.api-model-chip').forEach(function (c) {
        c.classList.toggle('active', c === chip);
      });
    }
  });

  document.getElementById('apiBackupSwitch').addEventListener('click', function () {
    syncDraftFromInputs();
    draftState.backupEnabled = !draftState.backupEnabled;
    renderModalForm();
  });

  document.getElementById('apiCloseConfig').addEventListener('click', function () {
    configModal.classList.remove('open');
  });

  document.getElementById('apiTestBtn').addEventListener('click', testPrimaryConnection);

  document.getElementById('apiSaveBtn').addEventListener('click', function () {
    syncDraftFromInputs();
    var all = loadAllConfigs();
    all[activeModuleKey] = draftState;
    saveAllConfigs(all);
    renderHomeCards();
    configModal.classList.remove('open');
  });

  document.getElementById('apiCloseLogs').addEventListener('click', function () {
    logsModal.classList.remove('open');
  });

  document.getElementById('apiClearLogsBtn').addEventListener('click', function () {
    localStorage.setItem(LOGS_KEY, '[]');
    renderLogsModal();
    renderHomeCards();
  });
})();