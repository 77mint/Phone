(function () {
  var root = document.getElementById('app-api');
  if (!root) return;

  var STORAGE_KEY = 'phone_api_config_v2';
  var LOGS_KEY = 'phone_api_logs';

  var MODULES = [
    { key: 'llm', title: '语言模型', tag: 'LLM' },
    { key: 'voice', title: '语音模型', tag: 'VOICE' },
    { key: 'image', title: '生图模型', tag: 'IMAGE' },
    { key: 'translate', title: '翻译模型', tag: 'TRANSLATE' }
  ];

  var PROVIDERS = {
    llm: [
      { id: 'openai', label: 'OpenAI', placeholder: 'https://api.openai.com/v1 或反代地址' },
      { id: 'google', label: 'Google', placeholder: 'https://generativelanguage.googleapis.com 或反代' },
      { id: 'anthropic', label: 'Anthropic', placeholder: 'https://api.anthropic.com 或反代地址' },
      { id: 'custom', label: '自定义兼容', placeholder: '填写完整兼容接口地址（如 https://.../v1）' }
    ],
    voice: [
      { id: 'minimax', label: 'MiniMax', placeholder: 'https://api.minimaxi.com（或海外/反代地址）' },
      { id: 'elevenlabs', label: 'ElevenLabs', placeholder: 'https://api.elevenlabs.io' },
      { id: 'fishaudio', label: 'Fish Audio', placeholder: 'https://api.fish.audio' },
      { id: 'openai_tts', label: 'OpenAI TTS', placeholder: 'https://api.openai.com/v1' },
      { id: 'custom', label: '自定义兼容', placeholder: '填写兼容语音接口地址' }
    ],
    image: [
      { id: 'openai', label: 'OpenAI', placeholder: 'https://api.openai.com/v1 或反代地址' },
      { id: 'google', label: 'Google', placeholder: 'https://generativelanguage.googleapis.com' },
      { id: 'flux', label: 'Flux / Fal', placeholder: 'https://fal.run 或兼容生图地址' },
      { id: 'custom', label: '自定义兼容', placeholder: '填写兼容生图接口地址' }
    ],
    translate: [
      { id: 'openai', label: 'OpenAI', placeholder: 'https://api.openai.com/v1 或反代地址' },
      { id: 'google', label: 'Google', placeholder: 'https://generativelanguage.googleapis.com' },
      { id: 'anthropic', label: 'Anthropic', placeholder: 'https://api.anthropic.com 或反代地址' },
      { id: 'custom', label: '自定义兼容', placeholder: '填写兼容翻译接口地址' }
    ]
  };

  var IMAGE_SIZES = ['1024x1024', '1024x1536', '1536x1024'];
  var TRANSLATE_LANGS = ['简体中文', 'English', '日本語'];
  var VOICE_SPEEDS = ['0.85', '1.0', '1.15'];

  function createEmptySlot(modKey) {
    var list = PROVIDERS[modKey] || PROVIDERS.llm;
    return {
      type: list[0].id,
      url: '',
      key: '',
      model: '',
      voiceId: '',
      groupId: '',
      speed: '1.0',
      size: '1024x1024',
      targetLang: '简体中文'
    };
  }

  function loadAllConfigs() {
    var out = {};
    var raw = {};
    try {
      raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {};
    } catch (e) {}
    MODULES.forEach(function (m) {
      var item = raw[m.key] || {};
      out[m.key] = {
        primary: Object.assign(createEmptySlot(m.key), item.primary || {}),
        backupEnabled: !!item.backupEnabled,
        backup: Object.assign(createEmptySlot(m.key), item.backup || {})
      };
    });
    return out;
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
  }

  window.PhoneAPI = {
    getConfig: function (moduleKey) {
      var all = loadAllConfigs();
      return all[moduleKey] || null;
    },
    addLog: appendLog
  };

  var SVG_CHEVRON = '<svg class="api-chevron" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>';
  var SVG_EYE = '<svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';

  root.innerHTML =
    '<div class="api-shell">' +
      '<div class="api-header">' +
        '<div class="app-back" data-close-app>' +
          '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>' +
        '</div>' +
      '</div>' +
      '<div class="api-body">' +
        '<div class="api-list" id="apiAccordionList"></div>' +
      '</div>' +
    '</div>';

  var openKey = '';
  var configs = loadAllConfigs();

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getProviderObj(modKey, typeId) {
    var list = PROVIDERS[modKey] || PROVIDERS.llm;
    return list.find(function (x) { return x.id === typeId; }) || list[0];
  }

  function buildSlotFields(modKey, prefix, slot) {
    var provList = PROVIDERS[modKey] || PROVIDERS.llm;
    var prov = getProviderObj(modKey, slot.type);

    var segHtml = provList.map(function (p) {
      var active = slot.type === p.id ? ' active' : '';
      return '<div class="api-seg-btn' + active + '" data-pick-type="' + modKey + '" data-slot="' + prefix + '" data-val="' + p.id + '">' + p.label + '</div>';
    }).join('');

    var html =
      '<div class="api-slot-box">' +
        '<div>' +
          '<div class="api-field-label">1. 类型</div>' +
          '<div class="api-seg">' + segHtml + '</div>' +
        '</div>' +
        '<div>' +
          '<div class="api-field-label">2. 地址</div>' +
          '<div class="api-input-box">' +
            '<input type="url" class="api-input" id="api_' + modKey + '_' + prefix + '_url" value="' + escapeHtml(slot.url) + '" placeholder="' + escapeHtml(prov.placeholder) + '">' +
          '</div>' +
        '</div>' +
        '<div>' +
          '<div class="api-field-label">3. Key</div>' +
          '<div class="api-input-box">' +
            '<input type="password" class="api-input" id="api_' + modKey + '_' + prefix + '_key" value="' + escapeHtml(slot.key) + '" placeholder="粘贴 API Key">' +
            '<div class="api-eye-btn" data-eye="api_' + modKey + '_' + prefix + '_key">' + SVG_EYE + '</div>' +
          '</div>' +
        '</div>';

    if (modKey === 'voice') {
      var voicePlaceholder = slot.type === 'fishaudio' ? '输入 reference_id' : '输入 voice_id（如 English_expressive_narrator）';
      var modelPlaceholder = slot.type === 'minimax' ? 'speech-02-hd / speech-02-turbo' : (slot.type === 'elevenlabs' ? 'eleven_v4 / eleven_multilingual_v2' : (slot.type === 'fishaudio' ? 's2 / s1' : 'tts-1'));
      var speedHtml = VOICE_SPEEDS.map(function (sp) {
        var on = slot.speed === sp ? ' active' : '';
        return '<div class="api-seg-btn' + on + '" data-pick-prop="' + modKey + '" data-slot="' + prefix + '" data-prop="speed" data-val="' + sp + '">' + sp + 'x</div>';
      }).join('');

      html +=
        '<div>' +
          '<div class="api-field-label">4. 音色 ID</div>' +
          '<div class="api-input-box">' +
            '<input type="text" class="api-input" id="api_' + modKey + '_' + prefix + '_voiceId" value="' + escapeHtml(slot.voiceId) + '" placeholder="' + voicePlaceholder + '">' +
          '</div>' +
        '</div>' +
        '<div>' +
          '<div class="api-field-label">5. 语音模型</div>' +
          '<div class="api-input-box">' +
            '<input type="text" class="api-input" id="api_' + modKey + '_' + prefix + '_model" value="' + escapeHtml(slot.model) + '" placeholder="' + modelPlaceholder + '">' +
          '</div>' +
        '</div>' +
        '<div>' +
          '<div class="api-field-label">6. 语速</div>' +
          '<div class="api-seg">' + speedHtml + '</div>' +
        '</div>';

      if (slot.type === 'minimax') {
        html +=
          '<div>' +
            '<div class="api-field-label">7. Group ID（MiniMax 选填）</div>' +
            '<div class="api-input-box">' +
              '<input type="text" class="api-input" id="api_' + modKey + '_' + prefix + '_groupId" value="' + escapeHtml(slot.groupId) + '" placeholder="如接口需要则填写 Group ID">' +
            '</div>' +
          '</div>';
      }
    } else {
      var canPull = modKey === 'llm' || modKey === 'translate' || modKey === 'image';
      html +=
        '<div>' +
          '<div class="api-field-label">4. 模型</div>' +
          '<div class="api-input-box">' +
            '<input type="text" class="api-input" id="api_' + modKey + '_' + prefix + '_model" value="' + escapeHtml(slot.model) + '" placeholder="手动填写或点右侧拉取">' +
            (canPull ? '<div class="api-mini-action" data-pull="' + modKey + '" data-slot="' + prefix + '">拉取</div>' : '') +
          '</div>' +
          '<div class="api-model-chips" id="api_' + modKey + '_' + prefix + '_chips"></div>' +
        '</div>';
    }

    if (modKey === 'image') {
      var sizeHtml = IMAGE_SIZES.map(function (sz) {
        var on = slot.size === sz ? ' active' : '';
        return '<div class="api-seg-btn' + on + '" data-pick-prop="' + modKey + '" data-slot="' + prefix + '" data-prop="size" data-val="' + sz + '">' + sz + '</div>';
      }).join('');
      html +=
        '<div>' +
          '<div class="api-field-label">5. 默认尺寸</div>' +
          '<div class="api-seg">' + sizeHtml + '</div>' +
        '</div>';
    }

    if (modKey === 'translate') {
      var langHtml = TRANSLATE_LANGS.map(function (lg) {
        var on = slot.targetLang === lg ? ' active' : '';
        return '<div class="api-seg-btn' + on + '" data-pick-prop="' + modKey + '" data-slot="' + prefix + '" data-prop="targetLang" data-val="' + lg + '">' + lg + '</div>';
      }).join('');
      html +=
        '<div>' +
          '<div class="api-field-label">5. 目标语言</div>' +
          '<div class="api-seg">' + langHtml + '</div>' +
        '</div>';
    }

    html += '</div>';
    return html;
  }

  function syncInputsToState(modKey) {
    var cfg = configs[modKey];
    if (!cfg) return;
    ['primary', 'backup'].forEach(function (prefix) {
      ['url', 'key', 'model', 'voiceId', 'groupId'].forEach(function (field) {
        var el = document.getElementById('api_' + modKey + '_' + prefix + '_' + field);
        if (el) cfg[prefix][field] = el.value.trim();
      });
    });
  }

  function renderAll() {
    var logs = loadLogs();
    var listEl = document.getElementById('apiAccordionList');

    var html = MODULES.map(function (m) {
      var c = configs[m.key];
      var isOpen = openKey === m.key;
      var prov = getProviderObj(m.key, c.primary.type);
      var hasCfg = !!(c.primary.url || c.primary.key);
      var subText = '未配置';
      var subCls = 'api-card-sub';
      if (hasCfg) {
        subCls += ' configured';
        subText = prov.label +
          (c.primary.model ? ' · ' + c.primary.model : '') +
          (c.backupEnabled ? ' · 已开副API' : '');
      }

      return (
        '<div class="api-card' + (isOpen ? ' open' : '') + '" data-card="' + m.key + '">' +
          '<div class="api-card-head" data-toggle-card="' + m.key + '">' +
            '<div class="api-card-main">' +
              '<div class="api-card-title-row">' +
                '<span class="api-card-title">' + m.title + '</span>' +
                '<span class="api-card-tag">' + m.tag + '</span>' +
              '</div>' +
              '<div class="' + subCls + '">' + escapeHtml(subText) + '</div>' +
            '</div>' +
            SVG_CHEVRON +
          '</div>' +
          '<div class="api-card-body">' +
            buildSlotFields(m.key, 'primary', c.primary) +
            '<div class="api-switch-row">' +
              '<div>' +
                '<div class="api-switch-text">副 API</div>' +
                '<div class="api-switch-sub">开启后展开备用接口</div>' +
              '</div>' +
              '<div class="api-switch' + (c.backupEnabled ? ' on' : '') + '" data-toggle-backup="' + m.key + '"><div class="api-switch-thumb"></div></div>' +
            '</div>' +
            '<div class="api-sub-section' + (c.backupEnabled ? ' open' : '') + '">' +
              '<div class="api-sub-badge">副 API 配置</div>' +
              buildSlotFields(m.key, 'backup', c.backup) +
            '</div>' +
            '<div class="api-test-msg" id="api_msg_' + m.key + '"></div>' +
            '<div class="api-actions">' +
              '<div class="api-btn-secondary" data-test-mod="' + m.key + '">测试连接</div>' +
              '<div class="api-btn-primary" data-save-mod="' + m.key + '">保存配置</div>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    var logsOpen = openKey === 'logs';
    var logSub = logs.length ? ('共 ' + logs.length + ' 条记录 · 最近 ' + logs[0].time) : '暂无记录';
    var logBodyHtml = !logs.length
      ? '<div class="api-log-empty">暂无调用记录</div>'
      : '<div class="api-log-list">' + logs.map(function (l) {
          return (
            '<div class="api-log-item">' +
              '<div class="api-log-top">' +
                '<span class="api-log-mod">' + escapeHtml(l.module) + ' · ' + (l.ok ? '成功' : '失败') + '</span>' +
                '<span class="api-log-time">' + escapeHtml(l.time) + '</span>' +
              '</div>' +
              '<div class="api-log-detail">' + escapeHtml(l.detail) + '</div>' +
            '</div>'
          );
        }).join('') + '</div>' +
        '<div class="api-actions"><div class="api-btn-secondary" id="apiClearLogsBtn">清空日志</div></div>';

    html +=
      '<div class="api-card' + (logsOpen ? ' open' : '') + '" data-card="logs">' +
        '<div class="api-card-head" data-toggle-card="logs">' +
          '<div class="api-card-main">' +
            '<div class="api-card-title-row">' +
              '<span class="api-card-title">API调用日志</span>' +
            '</div>' +
            '<div class="api-card-sub">' + escapeHtml(logSub) + '</div>' +
          '</div>' +
          SVG_CHEVRON +
        '</div>' +
        '<div class="api-card-body">' + logBodyHtml + '</div>' +
      '</div>';

    listEl.innerHTML = html;
  }

  function normalizeBaseUrl(raw, type) {
    var u = (raw || '').trim().replace(/\/+$/, '');
    if (!u) return '';
    if ((type === 'openai' || type === 'custom' || type === 'openai_tts') && !/\/v\d+$/i.test(u) && u.indexOf('/v1/') === -1) {
      u += '/v1';
    }
    return u;
  }

  function pullModels(modKey, prefix) {
    syncInputsToState(modKey);
    var slot = configs[modKey][prefix];
    var msgEl = document.getElementById('api_msg_' + modKey);
    var chipsEl = document.getElementById('api_' + modKey + '_' + prefix + '_chips');
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
          return '<div class="api-model-chip' + on + '" data-pick-chip="' + modKey + '" data-slot="' + prefix + '" data-val="' + escapeHtml(id) + '">' + escapeHtml(id) + '</div>';
        }).join('');
        chipsEl.classList.add('show');
        msgEl.className = 'api-test-msg show ok';
        msgEl.textContent = '已拉取 ' + list.length + ' 个模型，点击即可填入';
      })
      .catch(function (err) {
        msgEl.className = 'api-test-msg show err';
        msgEl.textContent = '拉取失败（' + err.message + '），可直接手动填写模型名';
      });
  }

  function testConnection(modKey) {
    syncInputsToState(modKey);
    var slot = configs[modKey].primary;
    var mod = MODULES.find(function (m) { return m.key === modKey; });
    var prov = getProviderObj(modKey, slot.type);
    var msgEl = document.getElementById('api_msg_' + modKey);
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
    } else if (slot.type === 'elevenlabs') {
      endpoint = base.replace(/\/+$/, '') + '/v1/voices';
      headers['xi-api-key'] = slot.key;
    } else if (slot.type === 'fishaudio') {
      endpoint = base.replace(/\/+$/, '') + '/model';
      headers['Authorization'] = 'Bearer ' + slot.key;
    } else {
      endpoint = base + '/models';
      headers['Authorization'] = 'Bearer ' + slot.key;
    }

    fetch(endpoint, { headers: headers })
      .then(function (r) {
        var ms = Date.now() - start;
        if (!r.ok) throw new Error('HTTP ' + r.status);
        msgEl.className = 'api-test-msg show ok';
        msgEl.textContent = '连接成功（' + ms + 'ms）';
        appendLog({
          module: mod.tag,
          ok: true,
          detail: '测试连通成功 · ' + prov.label + ' · ' + ms + 'ms'
        });
      })
      .catch(function (err) {
        var ms = Date.now() - start;
        msgEl.className = 'api-test-msg show err';
        msgEl.textContent = '连接失败：' + err.message + '（' + ms + 'ms）';
        appendLog({
          module: mod.tag,
          ok: false,
          detail: '测试失败：' + err.message + ' · ' + prov.label
        });
      });
  }

  renderAll();

  root.addEventListener('click', function (e) {
    var head = e.target.closest('[data-toggle-card]');
    if (head) {
      if (openKey && openKey !== 'logs') syncInputsToState(openKey);
      var k = head.getAttribute('data-toggle-card');
      openKey = openKey === k ? '' : k;
      renderAll();
      return;
    }

    var typeBtn = e.target.closest('[data-pick-type]');
    if (typeBtn) {
      var mk = typeBtn.getAttribute('data-pick-type');
      var sl = typeBtn.getAttribute('data-slot');
      var val = typeBtn.getAttribute('data-val');
      syncInputsToState(mk);
      configs[mk][sl].type = val;
      renderAll();
      return;
    }

    var propBtn = e.target.closest('[data-pick-prop]');
    if (propBtn) {
      var pMk = propBtn.getAttribute('data-pick-prop');
      var pSl = propBtn.getAttribute('data-slot');
      var prop = propBtn.getAttribute('data-prop');
      var pVal = propBtn.getAttribute('data-val');
      syncInputsToState(pMk);
      configs[pMk][pSl][prop] = pVal;
      renderAll();
      return;
    }

    var bkSwitch = e.target.closest('[data-toggle-backup]');
    if (bkSwitch) {
      var bMk = bkSwitch.getAttribute('data-toggle-backup');
      syncInputsToState(bMk);
      configs[bMk].backupEnabled = !configs[bMk].backupEnabled;
      renderAll();
      return;
    }

    var eyeBtn = e.target.closest('[data-eye]');
    if (eyeBtn) {
      var inp = document.getElementById(eyeBtn.getAttribute('data-eye'));
      if (inp) inp.type = inp.type === 'password' ? 'text' : 'password';
      return;
    }

    var pullBtn = e.target.closest('[data-pull]');
    if (pullBtn) {
      pullModels(pullBtn.getAttribute('data-pull'), pullBtn.getAttribute('data-slot'));
      return;
    }

    var chip = e.target.closest('[data-pick-chip]');
    if (chip) {
      var cMk = chip.getAttribute('data-pick-chip');
      var cSl = chip.getAttribute('data-slot');
      var cVal = chip.getAttribute('data-val');
      configs[cMk][cSl].model = cVal;
      var mInp = document.getElementById('api_' + cMk + '_' + cSl + '_model');
      if (mInp) mInp.value = cVal;
      chip.parentElement.querySelectorAll('.api-model-chip').forEach(function (x) {
        x.classList.toggle('active', x === chip);
      });
      return;
    }

    var testBtn = e.target.closest('[data-test-mod]');
    if (testBtn) {
      testConnection(testBtn.getAttribute('data-test-mod'));
      return;
    }

    var saveBtn = e.target.closest('[data-save-mod]');
    if (saveBtn) {
      var sMk = saveBtn.getAttribute('data-save-mod');
      syncInputsToState(sMk);
      saveAllConfigs(configs);
      renderAll();
      var msgEl = document.getElementById('api_msg_' + sMk);
      if (msgEl) {
        msgEl.className = 'api-test-msg show ok';
        msgEl.textContent = '配置已保存';
      }
      return;
    }

    if (e.target.closest('#apiClearLogsBtn')) {
      localStorage.setItem(LOGS_KEY, '[]');
      renderAll();
    }
  });
})();