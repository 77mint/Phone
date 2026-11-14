(function () {
  var root = document.getElementById('app-memory');
  if (!root) return;

  var LIST_KEY = 'phone_memory_list_v1';
  var CFG_KEY = 'phone_memory_cfg_v1';

  var EMBED_PRESETS = [
    { id: 'sf', label: '硅基流动 (免费)', url: 'https://api.siliconflow.cn/v1', model: 'BAAI/bge-m3' },
    { id: 'gemini', label: 'Gemini (免费)', url: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'text-embedding-004' },
    { id: 'mistral', label: 'Mistral (免费)', url: 'https://api.mistral.ai/v1', model: 'mistral-embed' },
    { id: 'cohere', label: 'Cohere (免费)', url: 'https://api.cohere.ai/compatibility/v1', model: 'embed-multilingual-v3.0' }
  ];

  var memories = loadList();
  var cfg = loadCfg();
  var currentTab = 'settings'; // 默认首页：设置 | 次页：记忆本
  var filterCharId = 'all';
  var editingId = '';
  var modalCharId = 'global';
  var modalPinned = false;
  var fetchedSumModels = [];
  var fetchedEmbedModels = [];

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
        autoSummarize: !!raw.autoSummarize,
        autoEvery: Number(raw.autoEvery) || 15,
        topK: Number(raw.topK) || 4,
        sumUrl: raw.sumUrl || '',
        sumKey: raw.sumKey || '',
        sumModel: raw.sumModel || '',
        embedEnabled: !!raw.embedEnabled,
        embedUrl: raw.embedUrl || '',
        embedKey: raw.embedKey || '',
        embedModel: raw.embedModel || ''
      };
    } catch (e) {
      return {
        autoEnabled: true,
        autoSummarize: false,
        autoEvery: 15,
        topK: 4,
        sumUrl: '',
        sumKey: '',
        sumModel: '',
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

  function normalizeBaseUrl(rawUrl) {
    return String(rawUrl || '').trim().replace(/\/+$/, '').replace(/\/(chat\/completions|embeddings|models)$/i, '');
  }

  function fetchModelsList(rawUrl, apiKey) {
    var base = normalizeBaseUrl(rawUrl);
    var key = String(apiKey || '').trim();
    if (!base) return Promise.reject(new Error('请先填写 Base URL'));

    var headers = {};
    if (key) headers['Authorization'] = 'Bearer ' + key;

    return fetch(base + '/models', { headers: headers }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) {
          throw new Error((data && data.error && data.error.message) || ('拉取失败 ' + res.status));
        }
        var arr = Array.isArray(data && data.data) ? data.data : (Array.isArray(data) ? data : []);
        var ids = arr.map(function (m) { return m.id || m.name || ''; }).filter(Boolean);
        if (!ids.length) throw new Error('未返回可用模型');
        return ids;
      });
    });
  }

  function callSummaryAPI(promptText) {
    var base = normalizeBaseUrl(cfg.sumUrl);
    var key = (cfg.sumKey || '').trim();
    var model = (cfg.sumModel || '').trim();
    if (!base || !key || !model) {
      return Promise.reject(new Error('请先填写完整总结 API 信息'));
    }

    return fetch(base + '/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        temperature: 0.3,
        messages: [{ role: 'user', content: promptText }]
      })
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) {
          throw new Error((data && data.error && data.error.message) || ('请求失败 ' + res.status));
        }
        var content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
        if (!content) throw new Error('接口未返回内容');
        return content.trim();
      });
    });
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
    var base = normalizeBaseUrl(cfg.embedUrl);
    var key = (cfg.embedKey || '').trim();
    var model = (cfg.embedModel || '').trim();
    if (!base || !key || !model) {
      return Promise.reject(new Error('请先填写完整向量接口信息'));
    }

    return fetch(base + '/embeddings', {
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

  function filterMeaningfulLines(msgs, charName) {
    var fillerRe = /^(哈哈+|嗯+|哦+|好[的啊呀]?|行|可以|早安?|晚安|在吗|睡了吗|拜拜|ok|okay)[！!。.~～]*$/i;
    var lines = [];
    msgs.forEach(function (m) {
      var txt = String(m.content || '').replace(/\s+/g, ' ').trim();
      if (!txt || txt.length <= 2 || fillerRe.test(txt)) return;
      var who = m.role === 'user' ? 'User' : charName;
      lines.push(who + '：' + txt);
    });
    return lines;
  }

  function autoCapture(params) {
    if (!cfg.autoEnabled) return Promise.resolve(null);
    var p = params || {};
    var charId = p.charId || 'global';
    var charName = p.charName || getCharName(charId);
    var msgs = Array.isArray(p.messages) ? p.messages : [];
    if (!msgs.length) return Promise.resolve(null);

    var lines = filterMeaningfulLines(msgs, charName);
    if (!lines.length) return Promise.resolve(null);
    var transcript = lines.join('\n');

    if (cfg.autoSummarize) {
      var prompt =
        '请将以下对话提炼为 1-2 句长期记忆，仅保留时间、地点、核心事件、约定或重要情绪，明确写出人名（不使用代词）：\n\n' +
        transcript;

      var hasCustomSum = !!(cfg.sumUrl && cfg.sumKey && cfg.sumModel);
      var runner = hasCustomSum
        ? callSummaryAPI(prompt)
        : (typeof p.callLLM === 'function' ? Promise.resolve(p.callLLM(prompt)) : Promise.reject(new Error('no_llm')));

      return runner.then(function (summary) {
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
          '<div class="mm-title" id="mmTitle">记忆设置</div>' +
        '</div>' +
        '<div class="mm-header-actions">' +
          '<button class="mm-pill-btn" id="mmAddBtn" type="button" style="display:none;">+ 新建</button>' +
        '</div>' +
      '</div>' +

      '<div class="mm-body">' +
        '<div class="mm-panel active" id="mmPanelSettings"></div>' +
        '<div class="mm-panel" id="mmPanelBook"></div>' +
      '</div>' +

      '<div class="lg-bottom-bar mm-bottom-bar" id="mmBottomBar">' +
        '<div class="mm-tab-indicator"></div>' +
        '<div class="mm-tab active" data-mm-tab="settings">设置</div>' +
        '<div class="mm-tab" data-mm-tab="book">记忆本</div>' +
      '</div>' +

      '<div class="mm-modal" id="mmModal">' +
        '<div class="mm-dialog">' +
          '<div class="mm-dialog-head">' +
            '<div class="mm-dialog-title" id="mmModalTitle">新建记忆</div>' +
            '<div class="mm-icon-circle" id="mmCloseModal">' +
              '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
            '</div>' +
          '</div>' +
          '<div class="mm-label">归属角色</div>' +
          '<div class="mm-char-chips" id="mmModalCharChips"></div>' +
          '<div class="mm-field">' +
            '<div class="mm-label">记忆内容</div>' +
            '<div class="mm-input-box"><textarea class="mm-textarea" id="mmModalContent" placeholder="记录事件时间、人物与关键内容"></textarea></div>' +
          '</div>' +
          '<div class="mm-row" style="margin-top:12px;">' +
            '<span class="mm-label" style="margin:0;">设为置顶记忆（优先保留）</span>' +
            '<button class="mm-switch" id="mmModalPinSwitch" type="button"><div class="mm-switch-thumb"></div></button>' +
          '</div>' +
          '<button class="mm-primary-btn" id="mmSaveBtn" type="button">保存</button>' +
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
          '<div class="mm-empty-title">暂无记忆</div>' +
          '<div class="mm-empty-sub">开启自动记忆后，对话记录将自动保存至此；也可点击右上角「+ 新建」手动录入。</div>' +
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
    var sumModelsHtml = fetchedSumModels.length
      ? '<div class="mm-models-box">' + fetchedSumModels.map(function (id) {
          var on = cfg.sumModel === id ? ' active' : '';
          return '<button class="mm-model-chip' + on + '" data-pick-sum-model="' + escapeHtml(id) + '" type="button">' + escapeHtml(id) + '</button>';
        }).join('') + '</div>'
      : '';

    var embedModelsHtml = fetchedEmbedModels.length
      ? '<div class="mm-models-box">' + fetchedEmbedModels.map(function (id) {
          var on = cfg.embedModel === id ? ' active' : '';
          return '<button class="mm-model-chip' + on + '" data-pick-embed-model="' + escapeHtml(id) + '" type="button">' + escapeHtml(id) + '</button>';
        }).join('') + '</div>'
      : '';

    box.innerHTML =
      '<div class="mm-card">' +
        '<div class="mm-row">' +
          '<div>' +
            '<div class="mm-row-title">自动记忆</div>' +
            '<div class="mm-row-sub">达到设定轮数时自动保存关键对话（本地处理，不产生接口费用）</div>' +
          '</div>' +
          '<button class="mm-switch' + (cfg.autoEnabled ? ' on' : '') + '" id="mmAutoSwitch" type="button"><div class="mm-switch-thumb"></div></button>' +
        '</div>' +

        '<div class="mm-row" style="margin-top:14px;padding-top:14px;border-top:1px solid #f2f2f7;">' +
          '<div>' +
            '<div class="mm-row-title">AI 摘要总结</div>' +
            '<div class="mm-row-sub">默认关闭；开启后将调用下方总结 API 提炼记忆内容</div>' +
          '</div>' +
          '<button class="mm-switch' + (cfg.autoSummarize ? ' on' : '') + '" id="mmSummarizeSwitch" type="button"><div class="mm-switch-thumb"></div></button>' +
        '</div>' +

        (cfg.autoSummarize ? (
          '<div style="margin-top:12px;padding-top:12px;border-top:1px solid #f2f2f7;">' +
            '<div class="mm-label">总结模型 API（留空则复用主配置中的副 API）</div>' +
            '<div class="mm-field">' +
              '<div class="mm-label">Base URL</div>' +
              '<div class="mm-input-box"><input type="text" class="mm-input" id="mmSumUrl" value="' + escapeHtml(cfg.sumUrl) + '" placeholder="https://api.siliconflow.cn/v1"></div>' +
            '</div>' +
            '<div class="mm-field">' +
              '<div class="mm-label">API Key</div>' +
              '<div class="mm-input-box"><input type="password" class="mm-input" id="mmSumKey" value="' + escapeHtml(cfg.sumKey) + '" placeholder="sk-..."></div>' +
            '</div>' +
            '<div class="mm-field">' +
              '<div class="mm-label">模型名称</div>' +
              '<div class="mm-input-box">' +
                '<input type="text" class="mm-input" id="mmSumModel" value="' + escapeHtml(cfg.sumModel) + '" placeholder="输入或点击右侧拉取">' +
                '<button class="mm-fetch-btn" id="mmFetchSumBtn" type="button">拉取模型</button>' +
              '</div>' +
              sumModelsHtml +
            '</div>' +
            '<button class="mm-action-btn" id="mmTestSumBtn" type="button" style="width:100%;margin-top:12px;">测试连接</button>' +
          '</div>'
        ) : '') +

        '<div class="mm-field">' +
          '<div class="mm-label">记录周期</div>' +
          '<div class="mm-seg">' +
            [10, 15, 20].map(function (n) {
              return '<button class="mm-seg-btn' + (cfg.autoEvery === n ? ' active' : '') + '" data-set-every="' + n + '" type="button">每 ' + n + ' 句</button>';
            }).join('') +
          '</div>' +
        '</div>' +

        '<div class="mm-field">' +
          '<div class="mm-label">每次检索条数</div>' +
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
            '<div class="mm-row-title">向量检索 (Embedding)</div>' +
            '<div class="mm-row-sub">默认关闭（使用本地检索）；开启并配置向量模型可提升语义匹配精度</div>' +
          '</div>' +
          '<button class="mm-switch' + (cfg.embedEnabled ? ' on' : '') + '" id="mmEmbedSwitch" type="button"><div class="mm-switch-thumb"></div></button>' +
        '</div>' +

        (cfg.embedEnabled ? (
          '<div>' +
            '<div class="mm-preset-grid">' +
              EMBED_PRESETS.map(function (p) {
                return '<button class="mm-preset-btn" data-embed-preset="' + p.id + '" type="button">' + escapeHtml(p.label) + '</button>';
              }).join('') +
            '</div>' +
            '<div class="mm-field">' +
              '<div class="mm-label">Base URL</div>' +
              '<div class="mm-input-box"><input type="text" class="mm-input" id="mmEmbedUrl" value="' + escapeHtml(cfg.embedUrl) + '" placeholder="https://api.siliconflow.cn/v1"></div>' +
            '</div>' +
            '<div class="mm-field">' +
              '<div class="mm-label">API Key</div>' +
              '<div class="mm-input-box"><input type="password" class="mm-input" id="mmEmbedKey" value="' + escapeHtml(cfg.embedKey) + '" placeholder="sk-..."></div>' +
            '</div>' +
            '<div class="mm-field">' +
              '<div class="mm-label">向量模型</div>' +
              '<div class="mm-input-box">' +
                '<input type="text" class="mm-input" id="mmEmbedModel" value="' + escapeHtml(cfg.embedModel) + '" placeholder="BAAI/bge-m3">' +
                '<button class="mm-fetch-btn" id="mmFetchEmbedBtn" type="button">拉取模型</button>' +
              '</div>' +
              embedModelsHtml +
            '</div>' +
            '<div class="mm-btn-row">' +
              '<button class="mm-action-btn" id="mmTestEmbedBtn" type="button">测试连接</button>' +
              '<button class="mm-action-btn is-dark" id="mmSyncVecBtn" type="button">补全向量</button>' +
            '</div>' +
          '</div>'
        ) : '') +
      '</div>' +

      '<div class="mm-card" style="text-align:center;">' +
        '<button class="mm-mini-btn is-danger" id="mmClearAllBtn" type="button" style="padding:8px 18px;font-size:13px;">清空全部本地记忆</button>' +
      '</div>';

    var sumUrlEl = document.getElementById('mmSumUrl');
    var sumKeyEl = document.getElementById('mmSumKey');
    var sumModelEl = document.getElementById('mmSumModel');
    if (sumUrlEl) sumUrlEl.addEventListener('input', function () { cfg.sumUrl = sumUrlEl.value; saveCfg(); });
    if (sumKeyEl) sumKeyEl.addEventListener('input', function () { cfg.sumKey = sumKeyEl.value; saveCfg(); });
    if (sumModelEl) sumModelEl.addEventListener('input', function () { cfg.sumModel = sumModelEl.value; saveCfg(); });

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

    document.getElementById('mmModalTitle').textContent = memObj ? '编辑记忆' : '新建记忆';
    document.getElementById('mmModalContent').value = memObj ? (memObj.content || '') : '';
    document.getElementById('mmModalPinSwitch').classList.toggle('on', modalPinned);
    renderModalChips();
    document.getElementById('mmModal').classList.add('open');
  }

  function switchTab(tab) {
    currentTab = tab;
    var isBook = tab === 'book';
    document.getElementById('mmWrap').classList.toggle('is-subtab', isBook);
    document.getElementById('mmBottomBar').classList.toggle('is-book', isBook);
    document.getElementById('mmTitle').textContent = isBook ? '记忆本' : '记忆设置';
    document.getElementById('mmAddBtn').style.display = isBook ? 'inline-flex' : 'none';
    document.getElementById('mmPanelSettings').classList.toggle('active', !isBook);
    document.getElementById('mmPanelBook').classList.toggle('active', isBook);
    root.querySelectorAll('.mm-tab').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-mm-tab') === tab);
    });
    if (isBook) renderBookPanel();
    else renderSettingsPanel();
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
    if (e.target.closest('#mmSummarizeSwitch')) {
      cfg.autoSummarize = !cfg.autoSummarize;
      saveCfg();
      renderSettingsPanel();
      return;
    }
    if (e.target.closest('#mmFetchSumBtn')) {
      showToast('正在拉取模型...');
      fetchModelsList(cfg.sumUrl, cfg.sumKey).then(function (list) {
        fetchedSumModels = list;
        renderSettingsPanel();
        showToast('已拉取 ' + list.length + ' 个模型');
      }).catch(function (err) {
        showToast((err && err.message) ? err.message : '拉取失败');
      });
      return;
    }
    var sumChip = e.target.closest('[data-pick-sum-model]');
    if (sumChip) {
      cfg.sumModel = sumChip.getAttribute('data-pick-sum-model');
      saveCfg();
      renderSettingsPanel();
      return;
    }
    if (e.target.closest('#mmTestSumBtn')) {
      showToast('正在测试总结 API...');
      callSummaryAPI('只回复：ok').then(function () {
        showToast('连接成功');
      }).catch(function (err) {
        showToast((err && err.message) ? err.message : '连接失败');
      });
      return;
    }
    if (e.target.closest('#mmEmbedSwitch')) {
      cfg.embedEnabled = !cfg.embedEnabled;
      saveCfg();
      renderSettingsPanel();
      return;
    }
    var presetBtn = e.target.closest('[data-embed-preset]');
    if (presetBtn) {
      var pid = presetBtn.getAttribute('data-embed-preset');
      var found = EMBED_PRESETS.find(function (p) { return p.id === pid; });
      if (found) {
        cfg.embedUrl = found.url;
        cfg.embedModel = found.model;
        fetchedEmbedModels = [];
        saveCfg();
        renderSettingsPanel();
        showToast('已填入 ' + found.label + '，填写 Key 即可');
      }
      return;
    }
    if (e.target.closest('#mmFetchEmbedBtn')) {
      showToast('正在拉取模型...');
      fetchModelsList(cfg.embedUrl, cfg.embedKey).then(function (list) {
        list.sort(function (a, b) {
          var ae = /embed|bge/i.test(a) ? 0 : 1;
          var be = /embed|bge/i.test(b) ? 0 : 1;
          return ae - be;
        });
        fetchedEmbedModels = list;
        renderSettingsPanel();
        showToast('已拉取 ' + list.length + ' 个模型');
      }).catch(function (err) {
        showToast((err && err.message) ? err.message : '拉取失败');
      });
      return;
    }
    var embedChip = e.target.closest('[data-pick-embed-model]');
    if (embedChip) {
      cfg.embedModel = embedChip.getAttribute('data-pick-embed-model');
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
      showToast('正在测试向量连接...');
      fetchEmbedding('测试记忆连通性').then(function (vec) {
        showToast('连接成功（维度 ' + vec.length + '）');
      }).catch(function (err) {
        showToast((err && err.message) ? err.message : '连接失败');
      });
      return;
    }
    if (e.target.closest('#mmSyncVecBtn')) {
      var pending = memories.filter(function (m) { return !m.hasVector && m.content; });
      if (!pending.length) {
        showToast('所有记忆均已建立向量');
        return;
      }
      showToast('正在补全 ' + pending.length + ' 条向量...');
      Promise.all(pending.map(buildVectorForMemory)).then(function () {
        renderBookPanel();
        showToast('向量补全完成');
      });
      return;
    }
    if (e.target.closest('#mmClearAllBtn')) {
      if (!memories.length) {
        showToast('暂无记忆可清空');
        return;
      }
      if (!confirm('确定要清空全部本地记忆吗？此操作不可撤销。')) return;
      var old = memories.slice();
      memories = [];
      saveList();
      if (window.PhoneDB) {
        old.forEach(function (m) { window.PhoneDB.del('memory_vec_' + m.id); });
      }
      showToast('已清空全部本地记忆');
    }
  });

  renderSettingsPanel();
})();