(function () {
  var root = document.getElementById('app-api');
  if (!root) return;

  var STORAGE_KEY = 'phone_api_config_v2';
  var PRESETS_KEY = 'phone_api_llm_presets';
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

  var TRANSLATE_MODES = [
    { id: 'free', label: '免费内置' },
    { id: 'reuse_llm', label: '复用语言模型' },
    { id: 'custom', label: '自定义接口' }
  ];

  var ALL_LANGUAGES = [
    { code: 'zh-CN', label: '简体中文' },
    { code: 'zh-TW', label: '繁體中文' },
    { code: 'en', label: 'English' },
    { code: 'ja', label: '日本語' },
    { code: 'ko', label: '한국어' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'es', label: 'Español' },
    { code: 'ru', label: 'Русский' },
    { code: 'it', label: 'Italiano' },
    { code: 'pt', label: 'Português' },
    { code: 'th', label: 'ไทย' },
    { code: 'vi', label: 'Tiếng Việt' },
    { code: 'ar', label: 'العربية' }
  ];

  var IMAGE_SIZES = ['1024x1024', '1024x1536', '1536x1024'];
  var VOICE_SPEEDS = ['0.85', '1.0', '1.15'];

  function createEmptySlot(modKey) {
    var list = PROVIDERS[modKey] || PROVIDERS.llm;
    return {
      mode: modKey === 'translate' ? 'free' : '',
      type: list[0].id,
      url: '',
      key: '',
      model: '',
      voiceId: '',
      groupId: '',
      speed: '1.0',
      size: '1024x1024',
      targetLang: 'zh-CN'
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
        activePresetId: item.activePresetId || '',
        primary: Object.assign(createEmptySlot(m.key), item.primary || {}),
        backupEnabled: !!item.backupEnabled,
        backup: Object.assign(createEmptySlot(m.key), item.backup || {})
      };
      if (m.key === 'translate' && !out[m.key].primary.mode) {
        out[m.key].primary.mode = 'free';
      }
      if (m.key === 'translate' && out[m.key].primary.targetLang === '简体中文') {
        out[m.key].primary.targetLang = 'zh-CN';
      }
    });
    return out;
  }

  function saveAllConfigs(cfg) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  }

  function loadLlmPresets() {
    try {
      var arr = JSON.parse(localStorage.getItem(PRESETS_KEY) || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function saveLlmPresets(list) {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(list));
  }

  function loadLogs() {
    try {
      var arr = JSON.parse(localStorage.getItem(LOGS_KEY) || '[]');
      return Array.isArray(arr) ? arr.slice(0, 10) : [];
    } catch (e) {
      return [];
    }
  }

  function analyzeError(rawMsg) {
    var msg = String(rawMsg || '').toLowerCase();
    if (msg.indexOf('401') !== -1 || msg.indexOf('unauthorized') !== -1 || msg.indexOf('invalid api key') !== -1 || msg.indexOf('incorrect api key') !== -1) {
      return 'Key 无效、已过期，或复制时多带了空格。';
    }
    if (msg.indexOf('403') !== -1 || msg.indexOf('forbidden') !== -1 || msg.indexOf('quota') !== -1 || msg.indexOf('insufficient') !== -1) {
      return '账号余额不足、无权限，或被 Cloudflare / 风控拦截。';
    }
    if (msg.indexOf('404') !== -1 || msg.indexOf('not found') !== -1) {
      return '接口路径不对，请检查地址末尾是否多写或漏写了 /v1。';
    }
    if (msg.indexOf('429') !== -1 || msg.indexOf('rate limit') !== -1) {
      return '请求太快或额度达到上限，建议稍等几秒或切换副 API。';
    }
    if (msg.indexOf('500') !== -1 || msg.indexOf('502') !== -1 || msg.indexOf('503') !== -1 || msg.indexOf('504') !== -1) {
      return '反代或官方服务器临时过载/抽风，可稍后再试或切换备用组。';
    }
    if (msg.indexOf('failed to fetch') !== -1 || msg.indexOf('load failed') !== -1 || msg.indexOf('networkerror') !== -1) {
      return '网络连不上或跨域（CORS）被浏览器拦截：请检查网址拼写、是否 https，或反代是否允许网页跨域。';
    }
    if (msg.indexOf('abort') !== -1 || msg.indexOf('timeout') !== -1) {
      return '请求超时，当前节点或反代响应太慢。';
    }
    return '接口返回异常，请对照上方原报错检查地址、Key 或模型名。';
  }

  function appendLog(entry) {
    var logs = loadLogs();
    var now = new Date();
    var hh = String(now.getHours()).padStart(2, '0');
    var mm = String(now.getMinutes()).padStart(2, '0');
    var ss = String(now.getSeconds()).padStart(2, '0');
    var raw = entry.rawError || entry.detail || '';
    var analysis = entry.analysis || (entry.ok ? '' : analyzeError(raw));
    logs.unshift({
      time: hh + ':' + mm + ':' + ss,
      module: entry.module || 'LLM',
      ok: !!entry.ok,
      raw: raw,
      analysis: analysis
    });
    if (logs.length > 10) logs = logs.slice(0, 10);
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  }

  function getLangLabel(codeOrLabel) {
    var found = ALL_LANGUAGES.find(function (l) { return l.code === codeOrLabel || l.label === codeOrLabel; });
    return found ? found.label : (codeOrLabel || '简体中文');
  }

  function getLangCode(codeOrLabel) {
    var found = ALL_LANGUAGES.find(function (l) { return l.code === codeOrLabel || l.label === codeOrLabel; });
    return found ? found.code : (codeOrLabel || 'zh-CN');
  }

  function freeTranslate(text, targetLang) {
    var tl = getLangCode(targetLang);
    var gUrl = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=' + encodeURIComponent(tl) + '&dt=t&q=' + encodeURIComponent(text);
    return fetch(gUrl)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        if (Array.isArray(data) && Array.isArray(data[0])) {
          return data[0].map(function (seg) { return seg[0] || ''; }).join('');
        }
        throw new Error('返回格式异常');
      })
      .catch(function () {
        var mmUrl = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(text) + '&langpair=autodetect|' + encodeURIComponent(tl);
        return fetch(mmUrl)
          .then(function (r) { return r.json(); })
          .then(function (res) {
            if (res && res.responseData && res.responseData.translatedText) {
              return res.responseData.translatedText;
            }
            throw new Error('免费翻译接口暂不可用');
          });
      });
  }

  window.PhoneAPI = {
    getConfig: function (moduleKey) {
      var all = loadAllConfigs();
      return all[moduleKey] || null;
    },
    addLog: appendLog,
    translate: function (text, targetLang) {
      var all = loadAllConfigs();
      var tCfg = all.translate && all.translate.primary;
      var lang = targetLang || (tCfg && tCfg.targetLang) || 'zh-CN';
      return freeTranslate(text, lang);
    }
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

  function buildLlmPresetsBar(c) {
    var presets = loadLlmPresets();
    var chips = presets.map(function (p) {
      var on = c.activePresetId === p.id ? ' active' : '';
      return (
        '<div class="api-preset-chip' + on + '" data-load-preset="' + escapeHtml(p.id) + '">' +
          '<span>' + escapeHtml(p.name) + '</span>' +
          '<span class="api-preset-del" data-del-preset="' + escapeHtml(p.id) + '">×</span>' +
        '</div>'
      );
    }).join('');

    return (
      '<div class="api-preset-bar">' +
        '<div class="api-field-label">已保存配置组</div>' +
        (chips ? '<div class="api-preset-chips">' + chips + '</div>' : '<div class="api-switch-sub">暂无保存组，填好下方后起个名字保存即可</div>') +
        '<div class="api-preset-save-row">' +
          '<div class="api-input-box" style="flex:1;">' +
            '<input type="text" class="api-input" id="apiLlmPresetName" placeholder="配置组名称（如：Kiro反代）">' +
          '</div>' +
          '<div class="api-mini-action" id="apiSavePresetBtn" style="padding:10px 14px;border-radius:14px;">存为组</div>' +
        '</div>' +
      '</div>'
    );
  }

  function buildTranslateBody(c) {
    var slot = c.primary;
    var modeHtml = TRANSLATE_MODES.map(function (md) {
      var on = slot.mode === md.id ? ' active' : '';
      return '<div class="api-seg-btn' + on + '" data-pick-prop="translate" data-slot="primary" data-prop="mode" data-val="' + md.id + '">' + md.label + '</div>';
    }).join('');

    var langOptions = ALL_LANGUAGES.map(function (lg) {
      var sel = getLangCode(slot.targetLang) === lg.code ? ' selected' : '';
      return '<option value="' + lg.code + '"' + sel + '>' + lg.label + '</option>';
    }).join('');

    var html =
      '<div class="api-slot-box">' +
        '<div>' +
          '<div class="api-field-label">1. 翻译方式</div>' +
          '<div class="api-seg">' + modeHtml + '</div>' +
        '</div>' +
        '<div>' +
          '<div class="api-field-label">2. 目标语言（源语言自动识别，全语种支持）</div>' +
          '<div class="api-input-box">' +
            '<select class="api-select" id="apiTranslateLangSelect">' + langOptions + '</select>' +
          '</div>' +
        '</div>';

    if (slot.mode === 'free') {
      html +=
        '<div class="api-switch-row">' +
          '<div>' +
            '<div class="api-switch-text">已内置免费翻译引擎</div>' +
            '<div class="api-switch-sub">无需填写 Key，任意语言均可互译</div>' +
          '</div>' +
        '</div>' +
        '<div>' +
          '<div class="api-field-label">试翻一句</div>' +
          '<div class="api-input-box">' +
            '<input type="text" class="api-input" id="apiTranslateSampleInput" placeholder="输入任意外语或中文试试翻译">' +
          '</div>' +
        '</div>';
    } else if (slot.mode === 'reuse_llm') {
      var llmCfg = configs.llm && configs.llm.primary;
      var llmTip = (llmCfg && llmCfg.url) ? ('当前将复用：' + getProviderObj('llm', llmCfg.type).label + (llmCfg.model ? ' · ' + llmCfg.model : '')) : '请先在上方「语言模型 LLM」填写地址与 Key';
      html +=
        '<div class="api-switch-row">' +
          '<div>' +
            '<div class="api-switch-text">自动复用语言模型配置</div>' +
            '<div class="api-switch-sub">' + escapeHtml(llmTip) + '</div>' +
          '</div>' +
        '</div>';
    } else {
      html += buildSlotFields('translate', 'primary', slot, true);
    }

    html += '</div>';

    if (slot.mode === 'custom') {
      html +=
        '<div class="api-switch-row">' +
          '<div>' +
            '<div class="api-switch-text">副 API</div>' +
            '<div class="api-switch-sub">开启后展开备用接口</div>' +
          '</div>' +
          '<div class="api-switch' + (c.backupEnabled ? ' on' : '') + '" data-toggle-backup="translate"><div class="api-switch-thumb"></div></div>' +
        '</div>' +
        '<div class="api-sub-section' + (c.backupEnabled ? ' open' : '') + '">' +
          '<div class="api-sub-badge">副 API 配置</div>' +
          buildSlotFields('translate', 'backup', c.backup, true) +
        '</div>';
    }

    return html;
  }

  function buildSlotFields(modKey, prefix, slot, skipTranslateExtras) {
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

    html += '</div>';
    return html;
  }

  function syncInputsToState(modKey) {
    var cfg = configs[modKey];
    if (!cfg) return;
    if (modKey === 'translate') {
      var sel = document.getElementById('apiTranslateLangSelect');
      if (sel) cfg.primary.targetLang = sel.value;
    }
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
      var subText = '未配置';
      var subCls = 'api-card-sub';

      if (m.key === 'translate') {
        subCls += ' configured';
        var langName = getLangLabel(c.primary.targetLang);
        if (c.primary.mode === 'free') {
          subText = '免费内置 · ' + langName;
        } else if (c.primary.mode === 'reuse_llm') {
          subText = '复用语言模型 · ' + langName;
        } else if (c.primary.url || c.primary.key) {
          subText = prov.label + ' · ' + langName;
        } else {
          subText = '自定义接口（未填地址）';
        }
      } else if (c.primary.url || c.primary.key) {
        subCls += ' configured';
        subText = prov.label +
          (c.primary.model ? ' · ' + c.primary.model : '') +
          (c.backupEnabled ? ' · 已开副API' : '');
      }

      var bodyInner = '';
      if (m.key === 'translate') {
        bodyInner = buildTranslateBody(c);
      } else {
        bodyInner =
          (m.key === 'llm' ? buildLlmPresetsBar(c) : '') +
          buildSlotFields(m.key, 'primary', c.primary, false) +
          '<div class="api-switch-row">' +
            '<div>' +
              '<div class="api-switch-text">副 API</div>' +
              '<div class="api-switch-sub">开启后展开备用接口</div>' +
            '</div>' +
            '<div class="api-switch' + (c.backupEnabled ? ' on' : '') + '" data-toggle-backup="' + m.key + '"><div class="api-switch-thumb"></div></div>' +
          '</div>' +
          '<div class="api-sub-section' + (c.backupEnabled ? ' open' : '') + '">' +
            '<div class="api-sub-badge">副 API 配置</div>' +
            buildSlotFields(m.key, 'backup', c.backup, false) +
          '</div>';
      }

      var testLabel = (m.key === 'translate' && c.primary.mode === 'free') ? '测试翻译' : '测试连接';

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
            bodyInner +
            '<div class="api-test-msg" id="api_msg_' + m.key + '"></div>' +
            '<div class="api-actions">' +
              '<div class="api-btn-secondary" data-test-mod="' + m.key + '">' + testLabel + '</div>' +
              '<div class="api-btn-primary" data-save-mod="' + m.key + '">保存配置</div>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    var logsOpen = openKey === 'logs';
    var logSub = logs.length ? ('最近 ' + logs.length + ' 条 · 最新 ' + logs[0].time) : '暂无记录';
    var logBodyHtml = !logs.length
      ? '<div class="api-log-empty">暂无调用记录</div>'
      : '<div class="api-log-list">' + logs.map(function (l) {
          return (
            '<div class="api-log-item">' +
              '<div class="api-log-top">' +
                '<span class="api-log-mod' + (l.ok ? '' : ' err') + '">' + escapeHtml(l.module) + ' · ' + (l.ok ? '成功' : '失败') + '</span>' +
                '<span class="api-log-time">' + escapeHtml(l.time) + '</span>' +
              '</div>' +
              '<div class="api-log-raw">' + (l.ok ? escapeHtml(l.raw) : ('原报错：' + escapeHtml(l.raw))) + '</div>' +
              (l.analysis ? '<div class="api-log-analysis">分析：' + escapeHtml(l.analysis) + '</div>' : '') +
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

  function readHttpError(r) {
    return r.text().then(function (txt) {
      var snippet = (txt || '').replace(/\s+/g, ' ').trim().slice(0, 180);
      return 'HTTP ' + r.status + (snippet ? ' - ' + snippet : '');
    }).catch(function () {
      return 'HTTP ' + r.status;
    });
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
        if (!r.ok) return readHttpError(r).then(function (e) { throw new Error(e); });
        return r.json();
      })
      .then(function (data) {
        var list = [];
        if (Array.isArray(data.data)) {
          list = data.data.map(function (x) { return x.id; }).filter(Boolean);
        } else if (Array.isArray(data.models)) {
          list = data.models.map(function (x) { return (x.name || '').replace(/^models\//, ''); }).filter(Boolean);
        }
        if (!list.length) throw new Error('接口未返回可用模型列表');
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
        msgEl.textContent = '拉取失败：' + err.message;
        appendLog({
          module: modKey.toUpperCase(),
          ok: false,
          rawError: err.message
        });
      });
  }

  function testConnection(modKey) {
    syncInputsToState(modKey);
    var msgEl = document.getElementById('api_msg_' + modKey);

    if (modKey === 'translate' && configs.translate.primary.mode === 'free') {
      var lang = configs.translate.primary.targetLang || 'zh-CN';
      var sampleInput = document.getElementById('apiTranslateSampleInput');
      var sample = (sampleInput && sampleInput.value.trim()) || (lang === 'en' ? '晚上好，小手机！' : 'Good evening, have a nice day!');
      msgEl.className = 'api-test-msg show';
      msgEl.textContent = '正在翻译...';
      var tStart = Date.now();
      freeTranslate(sample, lang)
        .then(function (resText) {
          var ms = Date.now() - tStart;
          msgEl.className = 'api-test-msg show ok';
          msgEl.textContent = '译文：' + resText + '（' + ms + 'ms）';
          appendLog({
            module: 'TRANSLATE',
            ok: true,
            rawError: '免费翻译测试成功（' + ms + 'ms）'
          });
        })
        .catch(function (err) {
          msgEl.className = 'api-test-msg show err';
          msgEl.textContent = '翻译失败：' + err.message;
          appendLog({
            module: 'TRANSLATE',
            ok: false,
            rawError: err.message
          });
        });
      return;
    }

    var slot = (modKey === 'translate' && configs.translate.primary.mode === 'reuse_llm')
      ? configs.llm.primary
      : configs[modKey].primary;
    var mod = MODULES.find(function (m) { return m.key === modKey; });
    var prov = getProviderObj(modKey === 'translate' && configs.translate.primary.mode === 'reuse_llm' ? 'llm' : modKey, slot.type);
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
        if (!r.ok) return readHttpError(r).then(function (e) { throw new Error(e); });
        var ms = Date.now() - start;
        msgEl.className = 'api-test-msg show ok';
        msgEl.textContent = '连接成功（' + ms + 'ms）';
        appendLog({
          module: mod.tag,
          ok: true,
          rawError: '测试连通成功 · ' + prov.label + ' · ' + ms + 'ms'
        });
      })
      .catch(function (err) {
        var ms = Date.now() - start;
        var rawErr = err.message || String(err);
        var tip = analyzeError(rawErr);
        msgEl.className = 'api-test-msg show err';
        msgEl.textContent = '失败（' + ms + 'ms）：' + tip;
        appendLog({
          module: mod.tag,
          ok: false,
          rawError: rawErr,
          analysis: tip
        });
      });
  }

  renderAll();

  root.addEventListener('change', function (e) {
    if (e.target && e.target.id === 'apiTranslateLangSelect') {
      configs.translate.primary.targetLang = e.target.value;
      saveAllConfigs(configs);
    }
  });

  root.addEventListener('click', function (e) {
    var delPresetBtn = e.target.closest('[data-del-preset]');
    if (delPresetBtn) {
      e.stopPropagation();
      var delId = delPresetBtn.getAttribute('data-del-preset');
      var list = loadLlmPresets().filter(function (p) { return p.id !== delId; });
      saveLlmPresets(list);
      if (configs.llm.activePresetId === delId) configs.llm.activePresetId = '';
      saveAllConfigs(configs);
      renderAll();
      return;
    }

    var loadPresetBtn = e.target.closest('[data-load-preset]');
    if (loadPresetBtn) {
      var pid = loadPresetBtn.getAttribute('data-load-preset');
      var hit = loadLlmPresets().find(function (p) { return p.id === pid; });
      if (hit) {
        configs.llm = {
          activePresetId: hit.id,
          primary: Object.assign(createEmptySlot('llm'), hit.primary || {}),
          backupEnabled: !!hit.backupEnabled,
          backup: Object.assign(createEmptySlot('llm'), hit.backup || {})
        };
        saveAllConfigs(configs);
        renderAll();
        var msgEl = document.getElementById('api_msg_llm');
        if (msgEl) {
          msgEl.className = 'api-test-msg show ok';
          msgEl.textContent = '已切换到配置组：' + hit.name;
        }
      }
      return;
    }

    if (e.target.closest('#apiSavePresetBtn')) {
      syncInputsToState('llm');
      var nameEl = document.getElementById('apiLlmPresetName');
      var pName = nameEl ? nameEl.value.trim() : '';
      if (!pName) {
        var prov = getProviderObj('llm', configs.llm.primary.type);
        pName = prov.label + (configs.llm.primary.model ? ' · ' + configs.llm.primary.model : '');
      }
      var presets = loadLlmPresets();
      var newId = 'llm_' + Date.now();
      presets.unshift({
        id: newId,
        name: pName,
        primary: JSON.parse(JSON.stringify(configs.llm.primary)),
        backupEnabled: configs.llm.backupEnabled,
        backup: JSON.parse(JSON.stringify(configs.llm.backup))
      });
      saveLlmPresets(presets);
      configs.llm.activePresetId = newId;
      saveAllConfigs(configs);
      renderAll();
      var lMsg = document.getElementById('api_msg_llm');
      if (lMsg) {
        lMsg.className = 'api-test-msg show ok';
        lMsg.textContent = '已保存配置组「' + pName + '」';
      }
      return;
    }

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
      if (mk === 'llm') configs.llm.activePresetId = '';
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