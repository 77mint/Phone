(function () {
  var root = document.getElementById('app-api');
  if (!root) return;

  var STORAGE_KEY = 'phone_api_config_v2';
  var PRESETS_KEY = 'phone_api_bundle_presets';
  var OLD_LLM_PRESETS_KEY = 'phone_api_llm_presets';
  var LOGS_KEY = 'phone_api_logs';
  var MAX_LOGS = 30;

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
        primary: Object.assign(createEmptySlot(m.key), item.primary || {}),
        backupEnabled: !!item.backupEnabled,
        autoRetry: !!item.autoRetry,
        stream: item.stream !== undefined ? !!item.stream : true,
        temperature: typeof item.temperature === 'number' ? item.temperature : 0.8,
        backup: Object.assign(createEmptySlot(m.key), item.backup || {})
      };
      if (m.key === 'translate' && !out[m.key].primary.mode) {
        out[m.key].primary.mode = 'free';
      }
      if (m.key === 'translate' && out[m.key].primary.targetLang === '简体中文') {
        out[m.key].primary.targetLang = 'zh-CN';
      }
    });
    out._activeBundleId = raw._activeBundleId || '';
    return out;
  }

  function saveAllConfigs(cfg) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  }

  function loadBundlePresets() {
    var arr = [];
    try {
      arr = JSON.parse(localStorage.getItem(PRESETS_KEY) || '[]');
      if (!Array.isArray(arr)) arr = [];
    } catch (e) { arr = []; }

    if (!arr.length) {
      try {
        var oldArr = JSON.parse(localStorage.getItem(OLD_LLM_PRESETS_KEY) || '[]');
        if (Array.isArray(oldArr) && oldArr.length) {
          arr = oldArr.map(function (o) {
            return {
              id: o.id || ('b_' + Date.now()),
              name: o.name || '已保存配置',
              modules: {
                llm: {
                  primary: Object.assign(createEmptySlot('llm'), o.primary || {}),
                  backupEnabled: !!o.backupEnabled,
                  autoRetry: !!o.autoRetry,
                  stream: true,
                  temperature: 0.8,
                  backup: Object.assign(createEmptySlot('llm'), o.backup || {})
                }
              }
            };
          });
          localStorage.setItem(PRESETS_KEY, JSON.stringify(arr));
        }
      } catch (e) {}
    }
    return arr;
  }

  function saveBundlePresets(list) {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(list));
  }

  function loadLogs() {
    try {
      var arr = JSON.parse(localStorage.getItem(LOGS_KEY) || '[]');
      return Array.isArray(arr) ? arr.slice(0, MAX_LOGS) : [];
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
      return '接口路径不对（若为查额度，则说明该中转站未开放查余额接口）。';
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
      source: entry.source || '接口调用',
      ok: !!entry.ok,
      raw: raw,
      analysis: analysis
    });
    if (logs.length > MAX_LOGS) logs = logs.slice(0, MAX_LOGS);
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
    '<div class="api-shell" id="apiShell">' +
      '<div class="api-header">' +
        '<div class="app-back" data-close-app>' +
          '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>' +
        '</div>' +
        '<div class="api-header-title">API调用日志</div>' +
        '<div class="api-clear-top" id="apiClearLogsBtn">清空</div>' +
      '</div>' +
      '<div class="api-body">' +
        '<div class="api-panel active" id="apiPanelConfig">' +
          '<div class="api-list" id="apiAccordionList"></div>' +
        '</div>' +
        '<div class="api-panel" id="apiPanelLogs">' +
          '<div class="api-logs-page" id="apiLogsPageList"></div>' +
        '</div>' +
      '</div>' +
      '<div class="lg-bottom-bar api-bottom-bar" id="apiBottomBar">' +
        '<div class="api-tab-indicator"></div>' +
        '<div class="api-tab active" data-api-tab="config">配置</div>' +
        '<div class="api-tab" data-api-tab="logs">日志</div>' +
      '</div>' +
    '</div>';

  var openCards = {};
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

  function buildPresetsCard() {
    var presets = loadBundlePresets();
    var isOpen = !!openCards.presets;
    var activePreset = presets.find(function (p) { return p.id === configs._activeBundleId; });
    var subText = presets.length
      ? ('共 ' + presets.length + ' 组' + (activePreset ? (' · 当前：' + activePreset.name) : ''))
      : '暂无保存组（点击展开保存当前配置）';

    var listHtml = !presets.length
      ? '<div class="api-switch-sub" style="padding:4px 0;">填好上面的语言、语音或生图模型后，在这里起个名字就能打包存成一组（没填的模块不会空覆盖）。</div>'
      : '<div class="api-preset-list">' + presets.map(function (p) {
          var isAct = configs._activeBundleId === p.id;
          var mods = p.modules || {};
          var tags = [];
          if (mods.llm) tags.push('LLM' + (mods.llm.primary && mods.llm.primary.model ? '(' + mods.llm.primary.model + ')' : ''));
          if (mods.voice) tags.push('VOICE');
          if (mods.image) tags.push('IMAGE');
          var meta = tags.length ? tags.join(' · ') : '空配置';
          return (
            '<div class="api-preset-row' + (isAct ? ' active' : '') + '">' +
              '<div class="api-preset-info">' +
                '<div class="api-preset-name">' + escapeHtml(p.name) + '</div>' +
                '<div class="api-preset-meta">' + escapeHtml(meta) + '</div>' +
              '</div>' +
              '<div class="api-preset-btns">' +
                '<div class="api-preset-use" data-load-preset="' + escapeHtml(p.id) + '">' + (isAct ? '已启用' : '启用') + '</div>' +
                '<div class="api-preset-del" data-del-preset="' + escapeHtml(p.id) + '">×</div>' +
              '</div>' +
            '</div>'
          );
        }).join('') + '</div>';

    var bodyHtml =
      '<div class="api-preset-save-row" style="padding-top:10px;">' +
        '<div class="api-input-box" style="flex:1;">' +
          '<input type="text" class="api-input" id="apiBundleName" placeholder="配置组名称（如：聚梦主力）">' +
        '</div>' +
        '<div class="api-mini-action" id="apiSavePresetBtn" style="padding:10px 14px;border-radius:14px;">保存当前</div>' +
      '</div>' +
      listHtml +
      '<div class="api-test-msg" id="api_msg_presets"></div>';

    return (
      '<div class="api-card' + (isOpen ? ' open' : '') + '" data-card="presets">' +
        '<div class="api-card-head" data-toggle-card="presets">' +
          '<div class="api-card-main">' +
            '<div class="api-card-title-row">' +
              '<span class="api-card-title">已保存配置组</span>' +
              '<span class="api-card-tag">PRESETS</span>' +
            '</div>' +
            '<div class="api-card-sub' + (presets.length ? ' configured' : '') + '">' + escapeHtml(subText) + '</div>' +
          '</div>' +
          SVG_CHEVRON +
        '</div>' +
        '<div class="api-card-body">' + bodyHtml + '</div>' +
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
      html += buildSlotFields('translate', 'primary', slot);
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
          buildSlotFields('translate', 'backup', c.backup) +
        '</div>';
    }

    return html;
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

  function syncAllOpenInputs() {
    MODULES.forEach(function (m) {
      if (openCards[m.key]) syncInputsToState(m.key);
    });
  }

  function renderLogsTab() {
    var logs = loadLogs();
    var container = document.getElementById('apiLogsPageList');
    if (!logs.length) {
      container.innerHTML = '<div class="api-log-empty-card">暂无调用记录（最近 30 条真实请求与报错分析会显示在这里）</div>';
      return;
    }
    container.innerHTML = logs.map(function (l) {
      return (
        '<div class="api-log-card">' +
          '<div class="api-log-top">' +
            '<span class="api-log-mod' + (l.ok ? '' : ' err') + '">' + escapeHtml(l.module) + ' · ' + (l.ok ? '成功' : '失败') + '</span>' +
            '<span class="api-log-time">' + escapeHtml(l.time) + '</span>' +
          '</div>' +
          (l.source ? '<div class="api-log-source">来源：' + escapeHtml(l.source) + '</div>' : '') +
          '<div class="api-log-raw">' + (l.ok ? escapeHtml(l.raw) : ('原报错：' + escapeHtml(l.raw))) + '</div>' +
          (l.analysis ? '<div class="api-log-analysis">分析：' + escapeHtml(l.analysis) + '</div>' : '') +
        '</div>'
      );
    }).join('');
  }

  function renderAll() {
    var listEl = document.getElementById('apiAccordionList');
    var html = '';

    MODULES.forEach(function (m) {
      var c = configs[m.key];
      var isOpen = !!openCards[m.key];
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
        var llmExtra = '';
        if (m.key === 'llm') {
          var tempVal = Number(c.temperature !== undefined ? c.temperature : 0.8).toFixed(1);
          llmExtra =
            '<div class="api-switch-row" style="flex-direction:column;align-items:stretch;gap:8px;">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;">' +
                '<div class="api-switch-text">温度（Temperature）</div>' +
                '<div class="api-switch-text" id="apiLlmTempVal">' + tempVal + '</div>' +
              '</div>' +
              '<input type="range" id="apiLlmTempRange" min="0" max="2" step="0.1" value="' + tempVal + '" style="width:100%;accent-color:#111111;">' +
              '<div class="api-switch-sub" style="margin-top:0;">越低越严谨，越高越有想象力（推荐 0.7 ~ 1.0）</div>' +
            '</div>' +
            '<div class="api-switch-row">' +
              '<div>' +
                '<div class="api-switch-text">流式输出</div>' +
                '<div class="api-switch-sub">开启后回复实时逐字显示</div>' +
              '</div>' +
              '<div class="api-switch' + (c.stream ? ' on' : '') + '" data-toggle-stream="llm"><div class="api-switch-thumb"></div></div>' +
            '</div>';
        }

        bodyInner =
          buildSlotFields(m.key, 'primary', c.primary) +
          llmExtra +
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
          '<div class="api-switch-row">' +
            '<div>' +
              '<div class="api-switch-text">失败自动重试</div>' +
              '<div class="api-switch-sub">主接口报错时仅重试 1 次（有副 API 优先切副 API）</div>' +
            '</div>' +
            '<div class="api-switch' + (c.autoRetry ? ' on' : '') + '" data-toggle-retry="' + m.key + '"><div class="api-switch-thumb"></div></div>' +
          '</div>';
      }

      var testLabel = (m.key === 'translate' && c.primary.mode === 'free') ? '测试翻译' : '测试连接';
      var showQuota = m.key === 'llm' || m.key === 'voice' || m.key === 'image';

      html +=
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
              (showQuota ? '<div class="api-btn-secondary" data-quota-mod="' + m.key + '">查额度</div>' : '') +
              '<div class="api-btn-primary" data-save-mod="' + m.key + '">保存配置</div>' +
            '</div>' +
          '</div>' +
        '</div>';
    });

    html += buildPresetsCard();
    listEl.innerHTML = html;
    renderLogsTab();
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
    msgEl.textContent = '正在拉取模型列表（0 扣费）...';

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
          source: '拉取模型列表',
          ok: false,
          rawError: err.message
        });
        renderLogsTab();
      });
  }

  function checkQuota(modKey) {
    syncInputsToState(modKey);
    var slot = configs[modKey].primary;
    var mod = MODULES.find(function (m) { return m.key === modKey; });
    var msgEl = document.getElementById('api_msg_' + modKey);
    var rawUrl = (slot.url || '').trim().replace(/\/+$/, '');

    if (!rawUrl || !slot.key) {
      msgEl.className = 'api-test-msg show err';
      msgEl.textContent = '请先填写地址和 Key 再查额度';
      return;
    }

    var rootUrl = rawUrl.replace(/\/v\d+$/i, '');
    msgEl.className = 'api-test-msg show';
    msgEl.textContent = '正在查询剩余额度...';

    var headers = { 'Authorization': 'Bearer ' + slot.key };
    var subUrl = rootUrl + '/v1/dashboard/billing/subscription';

    var now = new Date();
    var endD = new Date(now.getTime() + 86400000);
    var startStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-01';
    var endStr = endD.getFullYear() + '-' + String(endD.getMonth() + 1).padStart(2, '0') + '-' + String(endD.getDate()).padStart(2, '0');
    var usageUrl = rootUrl + '/v1/dashboard/billing/usage?start_date=' + startStr + '&end_date=' + endStr;

    fetch(subUrl, { headers: headers })
      .then(function (r) {
        if (!r.ok) return readHttpError(r).then(function (e) { throw new Error(e); });
        return r.json();
      })
      .then(function (subData) {
        var total = Number(subData.hard_limit_usd || subData.system_hard_limit_usd || 0);
        return fetch(usageUrl, { headers: headers })
          .then(function (ur) { return ur.ok ? ur.json() : { total_usage: 0 }; })
          .then(function (uData) {
            var used = Number(uData.total_usage || 0) / 100;
            var txt = '';
            if (total >= 100000) {
              txt = '总额度：无限 / 按量 · 已用：$' + used.toFixed(2);
            } else {
              var remain = Math.max(0, total - used);
              txt = '总额 $' + total.toFixed(2) + ' · 已用 $' + used.toFixed(2) + ' · 剩余 $' + remain.toFixed(2);
            }
            msgEl.className = 'api-test-msg show ok';
            msgEl.textContent = txt;
            appendLog({
              module: mod.tag,
              source: '查询剩余额度',
              ok: true,
              rawError: txt
            });
            renderLogsTab();
          });
      })
      .catch(function (err) {
        msgEl.className = 'api-test-msg show err';
        msgEl.textContent = '该站点未开放接口查余额，请到中转站后台查看';
        appendLog({
          module: mod.tag,
          source: '查询剩余额度',
          ok: false,
          rawError: err.message || String(err),
          analysis: '该中转站或官方接口未开放 Key 查余额权限，属于正常现象，请直接登录中转站网页查看。'
        });
        renderLogsTab();
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
            source: '免费内置翻译测试（0 扣费）',
            ok: true,
            rawError: '译文：' + resText + '（' + ms + 'ms）'
          });
          renderLogsTab();
        })
        .catch(function (err) {
          msgEl.className = 'api-test-msg show err';
          msgEl.textContent = '翻译失败：' + err.message;
          appendLog({
            module: 'TRANSLATE',
            source: '免费内置翻译测试',
            ok: false,
            rawError: err.message
          });
          renderLogsTab();
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
    msgEl.textContent = '正在测试连接（仅查接口，0 扣费）...';
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
        msgEl.textContent = '连接成功（' + ms + 'ms，未消耗对话额度）';
        appendLog({
          module: mod.tag,
          source: '测试连接（仅查 /models，0 扣费）',
          ok: true,
          rawError: '测试连通成功 · ' + prov.label + ' · ' + ms + 'ms'
        });
        renderLogsTab();
      })
      .catch(function (err) {
        var ms = Date.now() - start;
        var rawErr = err.message || String(err);
        var tip = analyzeError(rawErr);
        msgEl.className = 'api-test-msg show err';
        msgEl.textContent = '失败（' + ms + 'ms）：' + tip;
        appendLog({
          module: mod.tag,
          source: '测试连接（仅查 /models，0 扣费）',
          ok: false,
          rawError: rawErr,
          analysis: tip
        });
        renderLogsTab();
      });
  }

  renderAll();

  // 底栏切换（配置 / 日志）
  var shellEl = document.getElementById('apiShell');
  var bottomBar = document.getElementById('apiBottomBar');
  root.querySelectorAll('.api-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      var target = tab.getAttribute('data-api-tab');
      var isLogs = target === 'logs';
      root.querySelectorAll('.api-tab').forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      bottomBar.classList.toggle('is-logs', isLogs);
      shellEl.classList.toggle('is-subtab', isLogs);
      document.getElementById('apiPanelConfig').classList.toggle('active', !isLogs);
      document.getElementById('apiPanelLogs').classList.toggle('active', isLogs);
      if (isLogs) renderLogsTab();
    });
  });

  root.addEventListener('input', function (e) {
    if (e.target && e.target.id === 'apiLlmTempRange') {
      var val = parseFloat(e.target.value);
      configs.llm.temperature = isNaN(val) ? 0.8 : val;
      var txtEl = document.getElementById('apiLlmTempVal');
      if (txtEl) txtEl.textContent = configs.llm.temperature.toFixed(1);
    }
  });

  root.addEventListener('change', function (e) {
    if (e.target && e.target.id === 'apiTranslateLangSelect') {
      configs.translate.primary.targetLang = e.target.value;
      saveAllConfigs(configs);
    }
    if (e.target && e.target.id === 'apiLlmTempRange') {
      saveAllConfigs(configs);
    }
  });

  root.addEventListener('click', function (e) {
    var delPresetBtn = e.target.closest('[data-del-preset]');
    if (delPresetBtn) {
      e.stopPropagation();
      var delId = delPresetBtn.getAttribute('data-del-preset');
      var list = loadBundlePresets().filter(function (p) { return p.id !== delId; });
      saveBundlePresets(list);
      if (configs._activeBundleId === delId) configs._activeBundleId = '';
      saveAllConfigs(configs);
      renderAll();
      return;
    }

    var loadPresetBtn = e.target.closest('[data-load-preset]');
    if (loadPresetBtn) {
      var pid = loadPresetBtn.getAttribute('data-load-preset');
      var hit = loadBundlePresets().find(function (p) { return p.id === pid; });
      if (hit && hit.modules) {
        ['llm', 'voice', 'image'].forEach(function (k) {
          if (hit.modules[k]) {
            configs[k] = {
              primary: Object.assign(createEmptySlot(k), hit.modules[k].primary || {}),
              backupEnabled: !!hit.modules[k].backupEnabled,
              autoRetry: !!hit.modules[k].autoRetry,
              stream: hit.modules[k].stream !== undefined ? !!hit.modules[k].stream : true,
              temperature: typeof hit.modules[k].temperature === 'number' ? hit.modules[k].temperature : 0.8,
              backup: Object.assign(createEmptySlot(k), hit.modules[k].backup || {})
            };
          }
        });
        configs._activeBundleId = hit.id;
        saveAllConfigs(configs);
        renderAll();
        var msgEl = document.getElementById('api_msg_presets');
        if (msgEl) {
          msgEl.className = 'api-test-msg show ok';
          msgEl.textContent = '已启用配置组「' + hit.name + '」';
        }
      }
      return;
    }

    if (e.target.closest('#apiSavePresetBtn')) {
      syncAllOpenInputs();
      var bundleMods = {};
      ['llm', 'voice', 'image'].forEach(function (k) {
        var p = configs[k].primary;
        if ((p.url && p.url.trim()) || (p.key && p.key.trim())) {
          bundleMods[k] = JSON.parse(JSON.stringify(configs[k]));
        }
      });

      var nameEl = document.getElementById('apiBundleName');
      var pName = nameEl ? nameEl.value.trim() : '';
      if (!Object.keys(bundleMods).length) {
        var warnEl = document.getElementById('api_msg_presets');
        if (warnEl) {
          warnEl.className = 'api-test-msg show err';
          warnEl.textContent = '请先在上面至少填写一个模型的地址或 Key';
        }
        return;
      }
      if (!pName) {
        var firstK = Object.keys(bundleMods)[0];
        var prov = getProviderObj(firstK, bundleMods[firstK].primary.type);
        pName = prov.label + (bundleMods[firstK].primary.model ? ' · ' + bundleMods[firstK].primary.model : '');
      }

      var presets = loadBundlePresets();
      var newId = 'b_' + Date.now();
      presets.unshift({
        id: newId,
        name: pName,
        modules: bundleMods
      });
      saveBundlePresets(presets);
      configs._activeBundleId = newId;
      saveAllConfigs(configs);
      renderAll();
      var lMsg = document.getElementById('api_msg_presets');
      if (lMsg) {
        lMsg.className = 'api-test-msg show ok';
        lMsg.textContent = '已保存配置组「' + pName + '」';
      }
      return;
    }

    var head = e.target.closest('[data-toggle-card]');
    if (head) {
      syncAllOpenInputs();
      var k = head.getAttribute('data-toggle-card');
      openCards[k] = !openCards[k];
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
      configs._activeBundleId = '';
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

    var stSwitch = e.target.closest('[data-toggle-stream]');
    if (stSwitch) {
      syncInputsToState('llm');
      configs.llm.stream = !configs.llm.stream;
      saveAllConfigs(configs);
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

    var rtSwitch = e.target.closest('[data-toggle-retry]');
    if (rtSwitch) {
      var rMk = rtSwitch.getAttribute('data-toggle-retry');
      syncInputsToState(rMk);
      configs[rMk].autoRetry = !configs[rMk].autoRetry;
      saveAllConfigs(configs);
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

    var quotaBtn = e.target.closest('[data-quota-mod]');
    if (quotaBtn) {
      checkQuota(quotaBtn.getAttribute('data-quota-mod'));
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
      renderLogsTab();
    }
  });
})();