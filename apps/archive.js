(function () {
  var root = document.getElementById('app-archive');
  if (!root) return;

  var CHARS_KEY = 'phone_archive_chars';
  var GROUPS_KEY = 'phone_archive_groups';

  var charAvatarCache = {};
  var npcAvatarCache = {};
  var editingCharId = '';
  var tempCharAvatar = '';
  var currentSubTab = 'info';
  var tempGender = '女';
  var tempGroup = 'Default';
  var tempNpcs = [];
  var openNpcIds = {};
  var activeGroupFilter = '全部';
  var netCharId = '';
  var selectedNpcId = '';
  var pickingNpcAvatarId = '';

  var SUB_TAB_INDEX = { info: 0, mask: 1, social: 2 };
  var HANDLE_PREFIX = ['velvet', 'noir', 'mori', 'echo', 'luna', 'soren', 'mint', 'ash', 'kuro', 'vivi', 'lune', 'zen', 'iris', 'sol'];
  var HANDLE_SUFFIX = ['09x', '404', 'k2', '77', '99', '01', 'v8', '33', 'x7', '24'];

  function genHandle() {
    var p = HANDLE_PREFIX[Math.floor(Math.random() * HANDLE_PREFIX.length)];
    var s = HANDLE_SUFFIX[Math.floor(Math.random() * HANDLE_SUFFIX.length)];
    var sep = Math.random() > 0.5 ? '.' : '_';
    return '@' + p + sep + s;
  }

  function genPassword() {
    var chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789@#';
    var out = '';
    for (var i = 0; i < 8; i++) {
      out += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return out;
  }

  function getGroups() {
    try {
      var arr = JSON.parse(localStorage.getItem(GROUPS_KEY) || '["Default"]');
      if (!Array.isArray(arr) || !arr.length) return ['Default'];
      if (arr.indexOf('Default') === -1) arr.unshift('Default');
      return arr;
    } catch (e) {
      return ['Default'];
    }
  }

  function saveGroups(list) {
    localStorage.setItem(GROUPS_KEY, JSON.stringify(list));
  }

  function getChars() {
    try {
      var arr = JSON.parse(localStorage.getItem(CHARS_KEY) || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function saveChars(list) {
    localStorage.setItem(CHARS_KEY, JSON.stringify(list));
  }

  window.PhoneArchive = {
    getChars: getChars,
    getGroups: getGroups,
    getCharById: function (id) {
      return getChars().find(function (c) { return c.id === id; }) || null;
    }
  };

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  var SVG_USER = '<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
  var SVG_CLOSE = '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  var SVG_CHEVRON = '<svg class="ar-chevron" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>';
  var SVG_EXPORT = '<svg viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>';
  var SVG_IMPORT = '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>';

  root.innerHTML =
    '<div class="ar-shell" id="arShell">' +
      '<div class="ar-header">' +
        '<div class="ar-header-left">' +
          '<div class="mu-back-sm ar-back" data-close-app>' +
            '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>' +
          '</div>' +
          '<div class="ar-title" id="arHomeTitle">Char</div>' +
        '</div>' +
        '<div class="ar-header-actions">' +
          '<div class="ar-add-btn" id="arImportBtn">' + SVG_IMPORT + '<span>导入</span></div>' +
          '<div class="ar-add-btn" id="arAddCharBtn">' +
            '<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>' +
            '<span>新建</span>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="ar-body">' +
        '<div class="ar-home-panel active" id="arPanelChar">' +
          '<div class="ar-pills-row" id="arGroupFilterBar"></div>' +
          '<div class="ar-list" id="arCharList"></div>' +
        '</div>' +
        '<div class="ar-home-panel" id="arPanelNetwork">' +
          '<div id="arNetworkContent"></div>' +
        '</div>' +
      '</div>' +

      '<div class="lg-bottom-bar ar-bottom-bar" id="arBottomBar">' +
        '<div class="ar-tab-indicator"></div>' +
        '<div class="ar-tab active" data-ar-home="char">Char</div>' +
        '<div class="ar-tab" data-ar-home="network">关系网</div>' +
      '</div>' +

      '<div class="ar-editor" id="arEditor">' +
        '<div class="ar-editor-head">' +
          '<div class="ar-top-tabs" id="arTopTabs">' +
            '<div class="ar-top-indicator" id="arTopIndicator"></div>' +
            '<div class="ar-top-tab active" data-ar-page="info">资料</div>' +
            '<div class="ar-top-tab" data-ar-page="mask">面具</div>' +
            '<div class="ar-top-tab" data-ar-page="social">交际</div>' +
          '</div>' +
          '<div class="ar-editor-actions">' +
            '<div class="ar-icon-circle" id="arExportBtn" title="导出">' + SVG_EXPORT + '</div>' +
            '<div class="ar-icon-circle" id="arCloseEditor">' + SVG_CLOSE + '</div>' +
          '</div>' +
        '</div>' +

        '<div class="ar-editor-viewport">' +
          '<div class="ar-pages-track" id="arPagesTrack">' +
            '<div class="ar-page">' +
              '<div class="ar-form-card">' +
                '<div class="ar-avatar-picker">' +
                  '<div class="ar-avatar-lg" id="arCharAvatarBox">' + SVG_USER + '</div>' +
                  '<div class="ar-avatar-hint">点击上传头像</div>' +
                '</div>' +
                '<div>' +
                  '<div class="ar-field-label">网名</div>' +
                  '<div class="ar-input-box"><input type="text" class="ar-input" id="arCharNickname" placeholder="社媒展示昵称"></div>' +
                '</div>' +
                '<div>' +
                  '<div class="ar-field-label">签名</div>' +
                  '<div class="ar-input-box"><input type="text" class="ar-input" id="arCharBio" placeholder="个人简介 / 个性签名"></div>' +
                '</div>' +
                '<div>' +
                  '<div class="ar-field-label">账号</div>' +
                  '<div class="ar-input-box">' +
                    '<input type="text" class="ar-input" id="arCharHandle" placeholder="@handle">' +
                    '<div class="ar-rand-btn" id="arRandHandleBtn">随机</div>' +
                  '</div>' +
                '</div>' +
                '<div>' +
                  '<div class="ar-field-label">密码</div>' +
                  '<div class="ar-input-box">' +
                    '<input type="text" class="ar-input" id="arCharPassword" placeholder="登录密码">' +
                    '<div class="ar-rand-btn" id="arRandPwdBtn">随机</div>' +
                  '</div>' +
                '</div>' +
                '<div>' +
                  '<div class="ar-field-label">分组</div>' +
                  '<div class="ar-group-chips" id="arEditorGroupChips"></div>' +
                  '<div class="ar-input-box">' +
                    '<input type="text" class="ar-input" id="arNewGroupInput" placeholder="输入新分组名">' +
                    '<div class="ar-rand-btn" id="arAddGroupBtn">+ 添加</div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +

            '<div class="ar-page">' +
              '<div class="ar-form-card">' +
                '<div>' +
                  '<div class="ar-field-label">姓名</div>' +
                  '<div class="ar-input-box"><input type="text" class="ar-input" id="arCharName" placeholder="角色真实姓名"></div>' +
                '</div>' +
                '<div>' +
                  '<div class="ar-field-label">年龄</div>' +
                  '<div class="ar-input-box"><input type="text" class="ar-input" id="arCharAge" placeholder="例如：23"></div>' +
                '</div>' +
                '<div>' +
                  '<div class="ar-field-label">性别</div>' +
                  '<div class="ar-seg" id="arGenderSeg">' +
                    '<div class="ar-seg-btn" data-gender="男">男</div>' +
                    '<div class="ar-seg-btn active" data-gender="女">女</div>' +
                    '<div class="ar-seg-btn" data-gender="其他">其他</div>' +
                  '</div>' +
                '</div>' +
                '<div>' +
                  '<div class="ar-field-label">人设</div>' +
                  '<div class="ar-input-box"><textarea class="ar-textarea" id="arCharPersona" placeholder="外貌特征、性格、说话语气、背景故事等"></textarea></div>' +
                '</div>' +
              '</div>' +
            '</div>' +

            '<div class="ar-page">' +
              '<div class="ar-npc-add" id="arAddNpcBtn">' +
                '<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>' +
                '<span>添加 NPC</span>' +
              '</div>' +
              '<div class="ar-npc-list" id="arNpcList"></div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="ar-editor-foot">' +
          '<div class="ar-danger-btn" id="arDeleteCharBtn" style="display:none;">删除</div>' +
          '<div class="ar-primary-btn" id="arSaveCharBtn">保存档案</div>' +
        '</div>' +
      '</div>' +

      '<div class="ar-modal" id="arExportModal">' +
        '<div class="ar-dialog">' +
          '<div class="ar-dialog-close" id="arCloseExportModal">' + SVG_CLOSE + '</div>' +
          '<div class="ar-dialog-title">选择导出格式</div>' +
          '<div class="ar-export-list">' +
            '<div class="ar-export-opt" data-export-fmt="json">' +
              '<div class="ar-export-name">JSON 完整备份</div>' +
              '<div class="ar-export-desc">含全部资料、人设、NPC 及所有头像图片</div>' +
            '</div>' +
            '<div class="ar-export-opt" data-export-fmt="png">' +
              '<div class="ar-export-name">PNG 角色卡图</div>' +
              '<div class="ar-export-desc">可存相册/进酒馆，含完整扩展数据与 NPC</div>' +
            '</div>' +
            '<div class="ar-export-opt" data-export-fmt="md">' +
              '<div class="ar-export-name">Markdown 文本版</div>' +
              '<div class="ar-export-desc">排版整齐的纯文字设定，适合备忘录阅读</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="ar-toast" id="arToast"></div>' +
      '<input type="file" id="arInputCharAvatar" accept="image/*" style="display:none;">' +
      '<input type="file" id="arInputNpcAvatar" accept="image/*" style="display:none;">' +
      '<input type="file" id="arInputImport" accept=".json,.png,application/json,image/png" style="display:none;">' +
    '</div>';

  var toastTimer = null;
  function showToast(msg) {
    var el = document.getElementById('arToast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.classList.remove('show');
    }, 1800);
  }

  /* ====== PNG tEXt 元数据读写 + CRC32 ====== */
  var CRC_TABLE = (function () {
    var table = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[n] = c >>> 0;
    }
    return table;
  })();

  function crc32(bytes) {
    var c = 0xffffffff;
    for (var i = 0; i < bytes.length; i++) {
      c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function utf8ToB64(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }

  function b64ToUtf8(b64) {
    return decodeURIComponent(escape(atob(b64)));
  }

  function buildPngWithChara(pngBuf, jsonStr) {
    var src = new Uint8Array(pngBuf);
    var b64 = utf8ToB64(jsonStr);
    var keyBytes = [99, 104, 97, 114, 97, 0]; // "chara\0"
    var textBytes = new Uint8Array(keyBytes.length + b64.length);
    for (var i = 0; i < keyBytes.length; i++) textBytes[i] = keyBytes[i];
    for (var j = 0; j < b64.length; j++) textBytes[keyBytes.length + j] = b64.charCodeAt(j);

    var typeAndData = new Uint8Array(4 + textBytes.length);
    typeAndData[0] = 116; typeAndData[1] = 69; typeAndData[2] = 88; typeAndData[3] = 116; // tEXt
    typeAndData.set(textBytes, 4);

    var chunk = new Uint8Array(12 + textBytes.length);
    var dv = new DataView(chunk.buffer);
    dv.setUint32(0, textBytes.length);
    chunk.set(typeAndData, 4);
    dv.setUint32(8 + textBytes.length, crc32(typeAndData));

    var pos = 8;
    while (pos + 12 <= src.length) {
      var len = (src[pos] << 24) | (src[pos + 1] << 16) | (src[pos + 2] << 8) | src[pos + 3];
      var type = String.fromCharCode(src[pos + 4], src[pos + 5], src[pos + 6], src[pos + 7]);
      if (type === 'IEND') break;
      pos += 12 + len;
    }

    var out = new Uint8Array(src.length + chunk.length);
    out.set(src.slice(0, pos), 0);
    out.set(chunk, pos);
    out.set(src.slice(pos), pos + chunk.length);
    return new Blob([out], { type: 'image/png' });
  }

  function extractCharaFromPng(buf) {
    var bytes = new Uint8Array(buf);
    var pos = 8;
    while (pos + 12 <= bytes.length) {
      var dv = new DataView(bytes.buffer, pos, 8);
      var len = dv.getUint32(0);
      var type = String.fromCharCode(bytes[pos + 4], bytes[pos + 5], bytes[pos + 6], bytes[pos + 7]);
      if (type === 'tEXt') {
        var data = bytes.slice(pos + 8, pos + 8 + len);
        var nul = data.indexOf(0);
        if (nul > 0) {
          var kw = String.fromCharCode.apply(null, data.slice(0, nul));
          if (kw === 'chara') {
            var b64 = '';
            for (var i = nul + 1; i < data.length; i++) b64 += String.fromCharCode(data[i]);
            return JSON.parse(b64ToUtf8(b64));
          }
        }
      }
      if (type === 'IEND') break;
      pos += 12 + len;
    }
    return null;
  }

  function createCardPngBuffer(avatarDataUrl, titleText) {
    return new Promise(function (resolve) {
      var canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 800;
      var ctx = canvas.getContext('2d');

      function finishCanvas() {
        canvas.toBlob(function (blob) {
          blob.arrayBuffer().then(resolve);
        }, 'image/png');
      }

      if (avatarDataUrl) {
        var img = new Image();
        img.onload = function () {
          var scale = Math.max(600 / img.width, 800 / img.height);
          var w = img.width * scale;
          var h = img.height * scale;
          ctx.drawImage(img, (600 - w) / 2, (800 - h) / 2, w, h);
          finishCanvas();
        };
        img.onerror = function () {
          drawFallback();
        };
        img.src = avatarDataUrl;
      } else {
        drawFallback();
      }

      function drawFallback() {
        ctx.fillStyle = '#111111';
        ctx.fillRect(0, 0, 600, 800);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 54px -apple-system, PingFang SC, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(titleText || 'Char', 300, 380);
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.font = '24px -apple-system, PingFang SC, sans-serif';
        ctx.fillText('CHARACTER ARCHIVE', 300, 450);
        finishCanvas();
      }
    });
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 3000);
  }

  function gatherEditorBundle() {
    syncNpcInputs();
    var npcsWithAvatars = tempNpcs.map(function (n) {
      var copy = JSON.parse(JSON.stringify(n));
      if (copy.hasSocial && npcAvatarCache[copy.id]) {
        copy.avatar = npcAvatarCache[copy.id];
      }
      return copy;
    });
    return {
      format: 'xiaoshouji_archive_v1',
      exportedAt: new Date().toISOString(),
      char: {
        id: editingCharId || ('char_' + Date.now()),
        avatar: tempCharAvatar || '',
        nickname: document.getElementById('arCharNickname').value.trim(),
        bio: document.getElementById('arCharBio').value.trim(),
        handle: document.getElementById('arCharHandle').value.trim(),
        password: document.getElementById('arCharPassword').value.trim(),
        group: tempGroup || 'Default',
        name: document.getElementById('arCharName').value.trim(),
        age: document.getElementById('arCharAge').value.trim(),
        gender: tempGender,
        persona: document.getElementById('arCharPersona').value.trim(),
        npcs: npcsWithAvatars
      }
    };
  }

  function exportAsJson(bundle, safeName) {
    var blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json;charset=utf-8' });
    downloadBlob(blob, safeName + '.json');
    showToast('已导出 JSON 完整备份');
  }

  function exportAsMd(bundle, safeName) {
    var c = bundle.char;
    var lines = [
      '# ' + (c.name || c.nickname || '未命名角色'),
      '',
      '## 资料',
      '- **网名**：' + (c.nickname || '未填写'),
      '- **签名**：' + (c.bio || '未填写'),
      '- **账号**：' + (c.handle || '未填写'),
      '- **密码**：' + (c.password || '未填写'),
      '- **分组**：' + (c.group || 'Default'),
      '',
      '## 面具',
      '- **姓名**：' + (c.name || '未填写'),
      '- **年龄**：' + (c.age || '未填写'),
      '- **性别**：' + (c.gender || '未填写'),
      '',
      '### 人设',
      c.persona || '（暂无）',
      '',
      '## 交际（NPC）'
    ];
    if (!c.npcs.length) {
      lines.push('（暂无关联 NPC）');
    } else {
      c.npcs.forEach(function (n, idx) {
        lines.push('### ' + (idx + 1) + '. ' + (n.name || '未命名 NPC') + (n.relation ? '（' + n.relation + '）' : ''));
        lines.push(n.desc || '（暂无描述）');
        if (n.hasSocial) {
          lines.push('- **社交账号**：' + (n.handle || '未填') + (n.bio ? '｜签名：' + n.bio : ''));
        } else {
          lines.push('- **社交账号**：未设置');
        }
        lines.push('');
      });
    }
    var blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    downloadBlob(blob, safeName + '.md');
    showToast('已导出 Markdown 文本');
  }

  function exportAsPng(bundle, safeName) {
    var c = bundle.char;
    var tavernV2 = {
      spec: 'chara_card_v2',
      spec_version: '2.0',
      data: {
        name: c.name || c.nickname || '未命名角色',
        description: c.persona || '',
        personality: c.bio || '',
        scenario: '',
        first_mes: '',
        mes_example: '',
        creator_notes: 'Exported from 小手机档案',
        tags: [c.group || 'Default'],
        extensions: {
          xiaoshouji_archive: bundle
        }
      }
    };
    showToast('正在生成角色卡图...');
    createCardPngBuffer(c.avatar, c.name || c.nickname).then(function (buf) {
      var pngBlob = buildPngWithChara(buf, JSON.stringify(tavernV2));
      downloadBlob(pngBlob, safeName + '.png');
      showToast('已导出 PNG 角色卡');
    });
  }

  function importParsedData(parsed, fallbackAvatarUrl) {
    var cData = null;
    if (parsed && parsed.format === 'xiaoshouji_archive_v1' && parsed.char) {
      cData = parsed.char;
    } else if (parsed && parsed.data && parsed.data.extensions && parsed.data.extensions.xiaoshouji_archive && parsed.data.extensions.xiaoshouji_archive.char) {
      cData = parsed.data.extensions.xiaoshouji_archive.char;
    } else if (parsed && (parsed.data || parsed.name)) {
      var d = parsed.data || parsed;
      cData = {
        avatar: fallbackAvatarUrl || '',
        nickname: d.name || '导入角色',
        bio: d.personality || '',
        handle: genHandle(),
        password: genPassword(),
        group: (Array.isArray(d.tags) && d.tags[0]) ? d.tags[0] : 'Default',
        name: d.name || '',
        age: '',
        gender: '女',
        persona: [d.description, d.scenario].filter(Boolean).join('\n\n'),
        npcs: []
      };
    }

    if (!cData) {
      showToast('无法识别该文件格式');
      return;
    }

    var newId = 'char_' + Date.now();
    var targetGroup = cData.group || 'Default';
    var groups = getGroups();
    if (groups.indexOf(targetGroup) === -1) {
      groups.push(targetGroup);
      saveGroups(groups);
    }

    var cleanNpcs = (Array.isArray(cData.npcs) ? cData.npcs : []).map(function (n, idx) {
      var nid = 'npc_' + Date.now() + '_' + idx;
      if (n.avatar) {
        npcAvatarCache[nid] = n.avatar;
        PhoneDB.set('archive_npc_avatar_' + nid, n.avatar);
      }
      return {
        id: nid,
        name: n.name || 'NPC',
        relation: n.relation || '',
        desc: n.desc || '',
        hasSocial: !!n.hasSocial,
        handle: n.handle || '',
        bio: n.bio || ''
      };
    });

    var newChar = {
      id: newId,
      nickname: cData.nickname || cData.name || '导入角色',
      bio: cData.bio || '',
      handle: cData.handle || genHandle(),
      password: cData.password || genPassword(),
      group: targetGroup,
      name: cData.name || '',
      age: cData.age || '',
      gender: cData.gender || '女',
      persona: cData.persona || '',
      npcs: cleanNpcs,
      updatedAt: Date.now()
    };

    var list = getChars();
    list.unshift(newChar);
    saveChars(list);

    var avUrl = cData.avatar || fallbackAvatarUrl || '';
    if (avUrl) {
      charAvatarCache[newId] = avUrl;
      PhoneDB.set('archive_char_avatar_' + newId, avUrl);
    }

    netCharId = newId;
    selectedNpcId = '';
    renderCharsList();
    renderNetwork();
    showToast('已导入「' + (newChar.name || newChar.nickname) + '」');
  }

  function renderCharsList() {
    var list = getChars();
    var groups = getGroups();
    var filterBar = document.getElementById('arGroupFilterBar');
    filterBar.innerHTML = ['全部'].concat(groups).map(function (g) {
      var on = activeGroupFilter === g ? ' active' : '';
      return '<div class="ar-pill-btn' + on + '" data-filter-group="' + escapeHtml(g) + '">' + escapeHtml(g) + '</div>';
    }).join('');

    var filtered = activeGroupFilter === '全部'
      ? list
      : list.filter(function (c) { return (c.group || 'Default') === activeGroupFilter; });

    var box = document.getElementById('arCharList');
    if (!filtered.length) {
      box.innerHTML =
        '<div class="ar-empty">' +
          '<div class="ar-empty-title">' + (list.length ? '该分组暂无角色' : '还没有角色档案') + '</div>' +
          '<div class="ar-empty-sub">点击右上角「+ 新建」或「导入」添加角色</div>' +
        '</div>';
      return;
    }

    box.innerHTML = filtered.map(function (c) {
      var av = charAvatarCache[c.id] || '';
      var avCls = 'ar-avatar' + (av ? ' has-img' : '');
      var avStyle = av ? ' style="background-image:url(\'' + av + '\')"' : '';
      var displayName = c.name || c.nickname || '未命名';
      var firstChar = displayName.slice(0, 1);
      var sub = c.bio || c.persona || '点击编辑档案';

      return (
        '<div class="ar-card" data-edit-char="' + escapeHtml(c.id) + '">' +
          '<div class="' + avCls + '"' + avStyle + '>' + escapeHtml(firstChar) + '</div>' +
          '<div class="ar-card-info">' +
            '<div class="ar-card-top">' +
              '<div class="ar-card-name">' + escapeHtml(displayName) + '</div>' +
              '<span class="ar-card-tag">' + escapeHtml(c.group || 'Default') + '</span>' +
            '</div>' +
            '<div class="ar-card-sub">' + escapeHtml(sub) + '</div>' +
          '</div>' +
          SVG_CHEVRON +
        '</div>'
      );
    }).join('');
  }

  function renderNetwork() {
    var list = getChars();
    var box = document.getElementById('arNetworkContent');
    if (!list.length) {
      box.innerHTML =
        '<div class="ar-empty">' +
          '<div class="ar-empty-title">暂无关系网</div>' +
          '<div class="ar-empty-sub">先在「Char」页面新建并保存角色，这里会自动生成关系图谱</div>' +
        '</div>';
      return;
    }

    var activeChar = list.find(function (c) { return c.id === netCharId; }) || list[0];
    netCharId = activeChar.id;
    var npcs = Array.isArray(activeChar.npcs) ? activeChar.npcs : [];

    var pillsHtml = list.length > 1
      ? '<div class="ar-pills-row">' + list.map(function (c) {
          var cname = c.name || c.nickname || '未命名';
          var on = c.id === activeChar.id ? ' active' : '';
          return '<div class="ar-pill-btn' + on + '" data-net-char="' + escapeHtml(c.id) + '">' + escapeHtml(cname) + '</div>';
        }).join('') + '</div>'
      : '';

    var centerName = activeChar.name || activeChar.nickname || '主角';
    var centerAv = charAvatarCache[activeChar.id] || '';
    var centerCircleStyle = centerAv ? 'background-image:url(\'' + centerAv + '\');' : '';

    var linesSvg = '';
    var relLabelsHtml = '';
    var nodesHtml =
      '<div class="ar-net-node is-center" style="left:50%;top:50%;" data-net-center="' + escapeHtml(activeChar.id) + '">' +
        '<div class="ar-net-circle' + (centerAv ? ' has-img' : '') + '" style="' + centerCircleStyle + '">' + escapeHtml(centerName.slice(0, 1)) + '</div>' +
        '<div class="ar-net-label">' + escapeHtml(centerName) + '</div>' +
      '</div>';

    npcs.forEach(function (npc, idx) {
      var angle = (Math.PI * 2 * idx) / npcs.length - Math.PI / 2;
      var rx = 36;
      var ry = 36;
      var xPct = 50 + rx * Math.cos(angle);
      var yPct = 50 + ry * Math.sin(angle);
      var midX = (50 + xPct) / 2;
      var midY = (50 + yPct) / 2;
      var sel = selectedNpcId === npc.id ? ' selected' : '';
      var nName = npc.name || 'NPC';
      var nAv = npc.hasSocial ? (npcAvatarCache[npc.id] || '') : '';
      var nAvStyle = nAv ? 'background-image:url(\'' + nAv + '\');' : '';

      linesSvg += '<line x1="50%" y1="50%" x2="' + xPct.toFixed(1) + '%" y2="' + yPct.toFixed(1) + '%" stroke="#d1d1d6" stroke-width="1.5" stroke-dasharray="4 3" />';
      if (npc.relation) {
        relLabelsHtml += '<div class="ar-net-rel" style="left:' + midX.toFixed(1) + '%;top:' + midY.toFixed(1) + '%;">' + escapeHtml(npc.relation) + '</div>';
      }
      nodesHtml +=
        '<div class="ar-net-node' + sel + '" style="left:' + xPct.toFixed(1) + '%;top:' + yPct.toFixed(1) + '%;" data-net-npc="' + escapeHtml(npc.id) + '">' +
          '<div class="ar-net-circle' + (nAv ? ' has-img' : '') + '" style="' + nAvStyle + '">' +
            escapeHtml(nName.slice(0, 1)) +
            (npc.hasSocial ? '<span class="ar-net-social-dot"></span>' : '') +
          '</div>' +
          '<div class="ar-net-label">' + escapeHtml(nName) + '</div>' +
        '</div>';
    });

    box.innerHTML =
      pillsHtml +
      '<div class="ar-net-card">' +
        '<div class="ar-net-stage">' +
          '<svg class="ar-net-svg">' + linesSvg + '</svg>' +
          relLabelsHtml +
          nodesHtml +
        '</div>' +
      '</div>';
  }

  function renderEditorGroups() {
    var groups = getGroups();
    document.getElementById('arEditorGroupChips').innerHTML = groups.map(function (g) {
      var on = tempGroup === g ? ' active' : '';
      return '<div class="ar-group-chip' + on + '" data-pick-group="' + escapeHtml(g) + '">' + escapeHtml(g) + '</div>';
    }).join('');
  }

  function syncGenderUI() {
    root.querySelectorAll('#arGenderSeg .ar-seg-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-gender') === tempGender);
    });
  }

  function switchSubTab(page) {
    currentSubTab = page;
    var idx = SUB_TAB_INDEX[page] || 0;
    document.getElementById('arTopIndicator').style.transform = 'translateX(' + (idx * 100) + '%)';
    document.getElementById('arPagesTrack').style.transform = 'translateX(-' + (idx * 33.3333) + '%)';
    root.querySelectorAll('#arTopTabs .ar-top-tab').forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-ar-page') === page);
    });
  }

  function syncNpcInputs() {
    tempNpcs.forEach(function (npc) {
      var nEl = document.getElementById('ar_npc_name_' + npc.id);
      var rEl = document.getElementById('ar_npc_rel_' + npc.id);
      var dEl = document.getElementById('ar_npc_desc_' + npc.id);
      var hEl = document.getElementById('ar_npc_handle_' + npc.id);
      var bEl = document.getElementById('ar_npc_bio_' + npc.id);
      if (nEl) npc.name = nEl.value.trim();
      if (rEl) npc.relation = rEl.value.trim();
      if (dEl) npc.desc = dEl.value;
      if (hEl) npc.handle = hEl.value.trim();
      if (bEl) npc.bio = bEl.value.trim();
    });
  }

  function renderNpcList() {
    var box = document.getElementById('arNpcList');
    if (!tempNpcs.length) {
      box.innerHTML = '<div class="ar-empty" style="padding:32px 20px;"><div class="ar-empty-sub">暂无关联 NPC，点击上方添加</div></div>';
      return;
    }
    box.innerHTML = tempNpcs.map(function (npc) {
      var isOpen = !!openNpcIds[npc.id];
      var nAv = npcAvatarCache[npc.id] || '';
      var nAvCls = 'ar-avatar-lg sm' + (nAv ? ' has-img' : '');
      var nAvStyle = nAv ? ' style="background-image:url(\'' + nAv + '\')"' : '';

      return (
        '<div class="ar-npc-card' + (isOpen ? ' open' : '') + '">' +
          '<div class="ar-npc-head" data-toggle-npc="' + escapeHtml(npc.id) + '">' +
            '<div class="ar-npc-head-left">' +
              '<div class="ar-npc-name">' + escapeHtml(npc.name || '未命名 NPC') + '</div>' +
              (npc.relation ? '<span class="ar-card-tag">' + escapeHtml(npc.relation) + '</span>' : '') +
            '</div>' +
            '<svg class="ar-npc-chevron" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>' +
          '</div>' +
          '<div class="ar-npc-body">' +
            '<div class="ar-input-box"><input type="text" class="ar-input" id="ar_npc_name_' + escapeHtml(npc.id) + '" value="' + escapeHtml(npc.name) + '" placeholder="NPC 名字"></div>' +
            '<div class="ar-input-box"><input type="text" class="ar-input" id="ar_npc_rel_' + escapeHtml(npc.id) + '" value="' + escapeHtml(npc.relation || '') + '" placeholder="关系（如：父女、青梅竹马、宿敌）"></div>' +
            '<div class="ar-input-box"><textarea class="ar-textarea" style="min-height:105px;" id="ar_npc_desc_' + escapeHtml(npc.id) + '" placeholder="写下该 NPC 的身份、性格与和主角的故事...">' + escapeHtml(npc.desc) + '</textarea></div>' +
            '<div class="ar-npc-social-box' + (npc.hasSocial ? ' open' : '') + '">' +
              '<div class="ar-avatar-picker">' +
                '<div class="' + nAvCls + '" data-npc-avatar="' + escapeHtml(npc.id) + '"' + nAvStyle + '>' + SVG_USER + '</div>' +
                '<div class="ar-avatar-hint">点击上传 NPC 头像</div>' +
              '</div>' +
              '<div class="ar-input-box">' +
                '<input type="text" class="ar-input" id="ar_npc_handle_' + escapeHtml(npc.id) + '" value="' + escapeHtml(npc.handle || '') + '" placeholder="@社媒ID">' +
                '<div class="ar-rand-btn" data-npc-rand="' + escapeHtml(npc.id) + '">随机</div>' +
              '</div>' +
              '<div class="ar-input-box">' +
                '<input type="text" class="ar-input" id="ar_npc_bio_' + escapeHtml(npc.id) + '" value="' + escapeHtml(npc.bio || '') + '" placeholder="社媒个性签名">' +
              '</div>' +
            '</div>' +
            '<div class="ar-npc-foot">' +
              '<div class="ar-npc-del" data-del-npc="' + escapeHtml(npc.id) + '">删除该 NPC</div>' +
              '<div class="ar-switch-inline" data-toggle-npc-social="' + escapeHtml(npc.id) + '">' +
                '<span class="ar-switch-inline-label">设置社交账号</span>' +
                '<div class="ar-switch' + (npc.hasSocial ? ' on' : '') + '"><div class="ar-switch-thumb"></div></div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  function initLoad() {
    var list = getChars();
    var tasks = [];
    list.forEach(function (c) {
      tasks.push(PhoneDB.get('archive_char_avatar_' + c.id).then(function (u) {
        if (u) charAvatarCache[c.id] = u;
      }));
      if (Array.isArray(c.npcs)) {
        c.npcs.forEach(function (n) {
          tasks.push(PhoneDB.get('archive_npc_avatar_' + n.id).then(function (u) {
            if (u) npcAvatarCache[n.id] = u;
          }));
        });
      }
    });
    Promise.all(tasks).then(function () {
      renderCharsList();
      renderNetwork();
    });
  }

  initLoad();

  var shellEl = document.getElementById('arShell');
  var bottomBar = document.getElementById('arBottomBar');
  var homeTitle = document.getElementById('arHomeTitle');

  function switchHomeTab(target) {
    var isNet = target === 'network';
    root.querySelectorAll('.ar-tab').forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-ar-home') === target);
    });
    bottomBar.classList.toggle('is-network', isNet);
    shellEl.classList.toggle('is-subtab', isNet);
    homeTitle.textContent = isNet ? '关系网' : 'Char';
    document.getElementById('arPanelChar').classList.toggle('active', !isNet);
    document.getElementById('arPanelNetwork').classList.toggle('active', isNet);
    if (isNet) renderNetwork();
  }

  root.querySelectorAll('.ar-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      switchHomeTab(tab.getAttribute('data-ar-home'));
    });
  });

  var editorEl = document.getElementById('arEditor');
  function openEditor(charObj) {
    editingCharId = charObj ? charObj.id : '';
    tempCharAvatar = charObj ? (charAvatarCache[charObj.id] || '') : '';
    tempGender = (charObj && charObj.gender) ? charObj.gender : '女';
    tempGroup = (charObj && charObj.group) ? charObj.group : 'Default';
    tempNpcs = (charObj && Array.isArray(charObj.npcs)) ? JSON.parse(JSON.stringify(charObj.npcs)) : [];
    openNpcIds = {};

    document.getElementById('arCharNickname').value = charObj ? (charObj.nickname || '') : '';
    document.getElementById('arCharBio').value = charObj ? (charObj.bio || '') : '';
    document.getElementById('arCharHandle').value = charObj ? (charObj.handle || genHandle()) : genHandle();
    document.getElementById('arCharPassword').value = charObj ? (charObj.password || genPassword()) : genPassword();

    document.getElementById('arCharName').value = charObj ? (charObj.name || '') : '';
    document.getElementById('arCharAge').value = charObj ? (charObj.age || '') : '';
    document.getElementById('arCharPersona').value = charObj ? (charObj.persona || '') : '';
    syncGenderUI();
    renderEditorGroups();

    document.getElementById('arDeleteCharBtn').style.display = charObj ? 'flex' : 'none';

    var avBox = document.getElementById('arCharAvatarBox');
    if (tempCharAvatar) {
      avBox.style.backgroundImage = 'url("' + tempCharAvatar + '")';
      avBox.classList.add('has-img');
    } else {
      avBox.style.backgroundImage = '';
      avBox.classList.remove('has-img');
    }

    renderNpcList();
    switchSubTab('info');
    editorEl.classList.add('open');
  }

  document.getElementById('arAddCharBtn').addEventListener('click', function () {
    openEditor(null);
  });

  document.getElementById('arImportBtn').addEventListener('click', function () {
    document.getElementById('arInputImport').click();
  });

  document.getElementById('arInputImport').addEventListener('change', function () {
    var file = this.files && this.files[0];
    if (!file) return;
    var isPng = /\.png$/i.test(file.name) || file.type === 'image/png';
    if (isPng) {
      file.arrayBuffer().then(function (buf) {
        var parsed = extractCharaFromPng(buf);
        var reader = new FileReader();
        reader.onload = function () {
          importParsedData(parsed, reader.result);
        };
        reader.readAsDataURL(file);
      }).catch(function () {
        showToast('PNG 角色卡解析失败');
      });
    } else {
      var reader = new FileReader();
      reader.onload = function () {
        try {
          importParsedData(JSON.parse(reader.result), '');
        } catch (e) {
          showToast('JSON 格式有误');
        }
      };
      reader.readAsText(file, 'utf-8');
    }
    this.value = '';
  });

  var exportModal = document.getElementById('arExportModal');
  document.getElementById('arExportBtn').addEventListener('click', function () {
    exportModal.classList.add('open');
  });
  document.getElementById('arCloseExportModal').addEventListener('click', function () {
    exportModal.classList.remove('open');
  });
  exportModal.addEventListener('click', function (e) {
    var opt = e.target.closest('[data-export-fmt]');
    if (!opt) return;
    var fmt = opt.getAttribute('data-export-fmt');
    var bundle = gatherEditorBundle();
    var safeName = (bundle.char.name || bundle.char.nickname || 'char').replace(/[\\/:*?"<>|]/g, '_');
    exportModal.classList.remove('open');
    if (fmt === 'json') exportAsJson(bundle, safeName);
    else if (fmt === 'md') exportAsMd(bundle, safeName);
    else if (fmt === 'png') exportAsPng(bundle, safeName);
  });

  document.getElementById('arCloseEditor').addEventListener('click', function () {
    editorEl.classList.remove('open');
  });

  document.getElementById('arTopTabs').addEventListener('click', function (e) {
    var tab = e.target.closest('[data-ar-page]');
    if (!tab) return;
    if (currentSubTab === 'social') syncNpcInputs();
    switchSubTab(tab.getAttribute('data-ar-page'));
  });

  document.getElementById('arRandHandleBtn').addEventListener('click', function () {
    document.getElementById('arCharHandle').value = genHandle();
  });

  document.getElementById('arRandPwdBtn').addEventListener('click', function () {
    document.getElementById('arCharPassword').value = genPassword();
  });

  document.getElementById('arEditorGroupChips').addEventListener('click', function (e) {
    var chip = e.target.closest('[data-pick-group]');
    if (!chip) return;
    tempGroup = chip.getAttribute('data-pick-group');
    renderEditorGroups();
  });

  document.getElementById('arAddGroupBtn').addEventListener('click', function () {
    var inp = document.getElementById('arNewGroupInput');
    var name = inp.value.trim();
    if (!name) return;
    var groups = getGroups();
    if (groups.indexOf(name) === -1) {
      groups.push(name);
      saveGroups(groups);
    }
    tempGroup = name;
    inp.value = '';
    renderEditorGroups();
    showToast('已添加分组「' + name + '」');
  });

  document.getElementById('arGroupFilterBar').addEventListener('click', function (e) {
    var pill = e.target.closest('[data-filter-group]');
    if (!pill) return;
    activeGroupFilter = pill.getAttribute('data-filter-group');
    renderCharsList();
  });

  document.getElementById('arGenderSeg').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-gender]');
    if (!btn) return;
    tempGender = btn.getAttribute('data-gender');
    syncGenderUI();
  });

  document.getElementById('arAddNpcBtn').addEventListener('click', function () {
    syncNpcInputs();
    var nid = 'npc_' + Date.now();
    tempNpcs.push({ id: nid, name: '新 NPC', relation: '', desc: '', hasSocial: false, handle: genHandle(), bio: '' });
    openNpcIds[nid] = true;
    renderNpcList();
  });

  document.getElementById('arNpcList').addEventListener('click', function (e) {
    var delBtn = e.target.closest('[data-del-npc]');
    if (delBtn) {
      syncNpcInputs();
      var did = delBtn.getAttribute('data-del-npc');
      tempNpcs = tempNpcs.filter(function (n) { return n.id !== did; });
      delete openNpcIds[did];
      renderNpcList();
      return;
    }
    var socialToggle = e.target.closest('[data-toggle-npc-social]');
    if (socialToggle) {
      syncNpcInputs();
      var sid = socialToggle.getAttribute('data-toggle-npc-social');
      var target = tempNpcs.find(function (n) { return n.id === sid; });
      if (target) {
        target.hasSocial = !target.hasSocial;
        if (target.hasSocial && !target.handle) target.handle = genHandle();
        renderNpcList();
      }
      return;
    }
    var randBtn = e.target.closest('[data-npc-rand]');
    if (randBtn) {
      var rid = randBtn.getAttribute('data-npc-rand');
      var hEl = document.getElementById('ar_npc_handle_' + rid);
      if (hEl) hEl.value = genHandle();
      return;
    }
    var avBtn = e.target.closest('[data-npc-avatar]');
    if (avBtn) {
      pickingNpcAvatarId = avBtn.getAttribute('data-npc-avatar');
      document.getElementById('arInputNpcAvatar').click();
      return;
    }
    var head = e.target.closest('[data-toggle-npc]');
    if (head) {
      syncNpcInputs();
      var tid = head.getAttribute('data-toggle-npc');
      openNpcIds[tid] = !openNpcIds[tid];
      renderNpcList();
    }
  });

  document.getElementById('arInputNpcAvatar').addEventListener('change', function () {
    var file = this.files && this.files[0];
    if (!file || !pickingNpcAvatarId) return;
    var nid = pickingNpcAvatarId;
    var reader = new FileReader();
    reader.onload = function () {
      npcAvatarCache[nid] = reader.result;
      PhoneDB.set('archive_npc_avatar_' + nid, reader.result);
      syncNpcInputs();
      renderNpcList();
    };
    reader.readAsDataURL(file);
    this.value = '';
  });

  document.getElementById('arCharList').addEventListener('click', function (e) {
    var card = e.target.closest('[data-edit-char]');
    if (!card) return;
    var cid = card.getAttribute('data-edit-char');
    var target = getChars().find(function (c) { return c.id === cid; });
    if (target) openEditor(target);
  });

  document.getElementById('arNetworkContent').addEventListener('click', function (e) {
    var pill = e.target.closest('[data-net-char]');
    if (pill) {
      netCharId = pill.getAttribute('data-net-char');
      selectedNpcId = '';
      renderNetwork();
      return;
    }
    var npcNode = e.target.closest('[data-net-npc]');
    if (npcNode) {
      selectedNpcId = npcNode.getAttribute('data-net-npc');
      renderNetwork();
    }
  });

  document.getElementById('arCharAvatarBox').addEventListener('click', function () {
    document.getElementById('arInputCharAvatar').click();
  });

  document.getElementById('arInputCharAvatar').addEventListener('change', function () {
    var file = this.files && this.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      tempCharAvatar = reader.result;
      var avBox = document.getElementById('arCharAvatarBox');
      avBox.style.backgroundImage = 'url("' + tempCharAvatar + '")';
      avBox.classList.add('has-img');
    };
    reader.readAsDataURL(file);
    this.value = '';
  });

  document.getElementById('arSaveCharBtn').addEventListener('click', function () {
    syncNpcInputs();
    var nickname = document.getElementById('arCharNickname').value.trim();
    var name = document.getElementById('arCharName').value.trim();
    if (!name && !nickname) {
      showToast('请至少填写网名或姓名');
      return;
    }
    var list = getChars();
    var id = editingCharId || ('char_' + Date.now());
    var obj = {
      id: id,
      nickname: nickname,
      bio: document.getElementById('arCharBio').value.trim(),
      handle: document.getElementById('arCharHandle').value.trim(),
      password: document.getElementById('arCharPassword').value.trim(),
      group: tempGroup || 'Default',
      name: name,
      age: document.getElementById('arCharAge').value.trim(),
      gender: tempGender,
      persona: document.getElementById('arCharPersona').value.trim(),
      npcs: tempNpcs,
      updatedAt: Date.now()
    };

    var idx = list.findIndex(function (c) { return c.id === id; });
    if (idx !== -1) list[idx] = obj;
    else list.unshift(obj);
    saveChars(list);

    if (tempCharAvatar) {
      charAvatarCache[id] = tempCharAvatar;
      PhoneDB.set('archive_char_avatar_' + id, tempCharAvatar);
    }
    netCharId = id;
    selectedNpcId = '';
    editorEl.classList.remove('open');
    renderCharsList();
    renderNetwork();
    showToast('已保存并更新关系网');
  });

  document.getElementById('arDeleteCharBtn').addEventListener('click', function () {
    if (!editingCharId) return;
    var list = getChars().filter(function (c) { return c.id !== editingCharId; });
    saveChars(list);
    delete charAvatarCache[editingCharId];
    PhoneDB.del('archive_char_avatar_' + editingCharId);
    editorEl.classList.remove('open');
    renderCharsList();
    renderNetwork();
    showToast('已删除档案');
  });
})();