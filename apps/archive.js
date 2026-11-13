(function () {
  var root = document.getElementById('app-archive');
  if (!root) return;

  var CHARS_KEY = 'phone_archive_chars';

  var charAvatarCache = {};
  var editingCharId = '';
  var tempCharAvatar = '';
  var currentSubTab = 'info';
  var tempGender = '女';
  var tempNpcs = [];
  var openNpcIds = {};
  var netCharId = '';
  var selectedNpcId = '';

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

  root.innerHTML =
    '<div class="ar-shell" id="arShell">' +
      '<div class="ar-header">' +
        '<div class="ar-header-left">' +
          '<div class="mu-back-sm ar-back" data-close-app>' +
            '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>' +
          '</div>' +
          '<div class="ar-title" id="arHomeTitle">Char</div>' +
        '</div>' +
        '<div class="ar-add-btn" id="arAddCharBtn">' +
          '<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>' +
          '<span>新建</span>' +
        '</div>' +
      '</div>' +

      '<div class="ar-body">' +
        '<div class="ar-home-panel active" id="arPanelChar">' +
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
          '<div class="ar-close-circle" id="arCloseEditor">' + SVG_CLOSE + '</div>' +
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

      '<div class="ar-toast" id="arToast"></div>' +
      '<input type="file" id="arInputCharAvatar" accept="image/*" style="display:none;">' +
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

  function renderCharsList() {
    var list = getChars();
    var box = document.getElementById('arCharList');
    if (!list.length) {
      box.innerHTML =
        '<div class="ar-empty">' +
          '<div class="ar-empty-title">还没有角色档案</div>' +
          '<div class="ar-empty-sub">点击右上角「+ 新建」添加第一个角色</div>' +
        '</div>';
      return;
    }

    box.innerHTML = list.map(function (c) {
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
              (c.handle ? '<span class="ar-card-tag">' + escapeHtml(c.handle) + '</span>' : '') +
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
      ? '<div class="ar-net-pills">' + list.map(function (c) {
          var cname = c.name || c.nickname || '未命名';
          var on = c.id === activeChar.id ? ' active' : '';
          return '<div class="ar-net-pill' + on + '" data-net-char="' + escapeHtml(c.id) + '">' + escapeHtml(cname) + '</div>';
        }).join('') + '</div>'
      : '';

    var centerName = activeChar.name || activeChar.nickname || '主角';
    var centerAv = charAvatarCache[activeChar.id] || '';
    var centerStyle = 'left:50%;top:50%;';
    var centerCircleStyle = centerAv ? 'background-image:url(\'' + centerAv + '\');' : '';

    var linesSvg = '';
    var nodesHtml =
      '<div class="ar-net-node is-center" style="' + centerStyle + '" data-net-center="' + escapeHtml(activeChar.id) + '">' +
        '<div class="ar-net-circle' + (centerAv ? ' has-img' : '') + '" style="' + centerCircleStyle + '">' + escapeHtml(centerName.slice(0, 1)) + '</div>' +
        '<div class="ar-net-label">' + escapeHtml(centerName) + '</div>' +
      '</div>';

    npcs.forEach(function (npc, idx) {
      var angle = (Math.PI * 2 * idx) / npcs.length - Math.PI / 2;
      var rx = 34;
      var ry = 34;
      var xPct = 50 + rx * Math.cos(angle);
      var yPct = 50 + ry * Math.sin(angle);
      var sel = selectedNpcId === npc.id ? ' selected' : '';
      var nName = npc.name || 'NPC';

      linesSvg += '<line x1="50%" y1="50%" x2="' + xPct.toFixed(1) + '%" y2="' + yPct.toFixed(1) + '%" stroke="#d1d1d6" stroke-width="1.5" stroke-dasharray="4 3" />';
      nodesHtml +=
        '<div class="ar-net-node' + sel + '" style="left:' + xPct.toFixed(1) + '%;top:' + yPct.toFixed(1) + '%;" data-net-npc="' + escapeHtml(npc.id) + '">' +
          '<div class="ar-net-circle">' + escapeHtml(nName.slice(0, 1)) + '</div>' +
          '<div class="ar-net-label">' + escapeHtml(nName) + '</div>' +
        '</div>';
    });

    var detailHtml = '';
    if (!npcs.length) {
      detailHtml =
        '<div class="ar-net-detail">' +
          '<div class="ar-net-detail-title">' + escapeHtml(centerName) + ' 的交际圈</div>' +
          '<div class="ar-net-detail-desc">该角色暂未添加 NPC，去「Char → 交际」里添加后会自动连线到这里。</div>' +
        '</div>';
    } else {
      var targetNpc = npcs.find(function (n) { return n.id === selectedNpcId; }) || npcs[0];
      selectedNpcId = targetNpc.id;
      detailHtml =
        '<div class="ar-net-detail">' +
          '<div class="ar-net-detail-title">' + escapeHtml(targetNpc.name || '未命名 NPC') + '</div>' +
          '<div class="ar-net-detail-desc">' + escapeHtml(targetNpc.desc || '暂无详细关系描述') + '</div>' +
        '</div>';
    }

    box.innerHTML =
      pillsHtml +
      '<div class="ar-net-card">' +
        '<div class="ar-net-stage">' +
          '<svg class="ar-net-svg">' + linesSvg + '</svg>' +
          nodesHtml +
        '</div>' +
      '</div>' +
      detailHtml;
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
      var dEl = document.getElementById('ar_npc_desc_' + npc.id);
      if (nEl) npc.name = nEl.value.trim();
      if (dEl) npc.desc = dEl.value;
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
      return (
        '<div class="ar-npc-card' + (isOpen ? ' open' : '') + '">' +
          '<div class="ar-npc-head" data-toggle-npc="' + escapeHtml(npc.id) + '">' +
            '<div class="ar-npc-name">' + escapeHtml(npc.name || '未命名 NPC') + '</div>' +
            '<svg class="ar-npc-chevron" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>' +
          '</div>' +
          '<div class="ar-npc-body">' +
            '<div class="ar-input-box"><input type="text" class="ar-input" id="ar_npc_name_' + escapeHtml(npc.id) + '" value="' + escapeHtml(npc.name) + '" placeholder="NPC 名字"></div>' +
            '<div class="ar-input-box"><textarea class="ar-textarea" style="min-height:110px;" id="ar_npc_desc_' + escapeHtml(npc.id) + '" placeholder="写下该 NPC 的身份、性格与和主角的关系...">' + escapeHtml(npc.desc) + '</textarea></div>' +
            '<div class="ar-npc-del" data-del-npc="' + escapeHtml(npc.id) + '">删除该 NPC</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  function initLoad() {
    var list = getChars();
    Promise.all(list.map(function (c) {
      return PhoneDB.get('archive_char_avatar_' + c.id).then(function (u) {
        if (u) charAvatarCache[c.id] = u;
      });
    })).then(function () {
      renderCharsList();
      renderNetwork();
    });
  }

  initLoad();

  // 主页底栏切换（Char / 关系网）
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

  document.getElementById('arGenderSeg').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-gender]');
    if (!btn) return;
    tempGender = btn.getAttribute('data-gender');
    syncGenderUI();
  });

  document.getElementById('arAddNpcBtn').addEventListener('click', function () {
    syncNpcInputs();
    var nid = 'npc_' + Date.now();
    tempNpcs.push({ id: nid, name: '新 NPC', desc: '' });
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
    var head = e.target.closest('[data-toggle-npc]');
    if (head) {
      syncNpcInputs();
      var tid = head.getAttribute('data-toggle-npc');
      openNpcIds[tid] = !openNpcIds[tid];
      renderNpcList();
    }
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