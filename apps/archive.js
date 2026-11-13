(function () {
  var root = document.getElementById('app-archive');
  if (!root) return;

  var CHARS_KEY = 'phone_archive_chars';

  var charAvatarCache = {};
  var editingCharId = '';
  var tempCharAvatar = '';

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
    '<div class="ar-shell">' +
      '<div class="ar-header">' +
        '<div class="ar-header-left">' +
          '<div class="mu-back-sm" data-close-app>' +
            '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>' +
          '</div>' +
          '<div class="ar-title">档案</div>' +
        '</div>' +
        '<div class="ar-add-btn" id="arAddCharBtn">' +
          '<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>' +
          '<span>新建</span>' +
        '</div>' +
      '</div>' +

      '<div class="ar-body">' +
        '<div class="ar-list" id="arCharList"></div>' +
      '</div>' +

      '<div class="ar-modal" id="arCharModal">' +
        '<div class="ar-dialog">' +
          '<div class="ar-dialog-head">' +
            '<div class="ar-dialog-title" id="arModalTitle">新建角色</div>' +
            '<div class="ar-dialog-close" id="arCloseModal">' + SVG_CLOSE + '</div>' +
          '</div>' +
          '<div class="ar-dialog-body">' +
            '<div class="ar-avatar-picker">' +
              '<div class="ar-avatar-lg" id="arCharAvatarBox">' + SVG_USER + '</div>' +
              '<div class="ar-avatar-hint">点击上传角色头像</div>' +
            '</div>' +
            '<div>' +
              '<div class="ar-field-label">姓名</div>' +
              '<div class="ar-input-box"><input type="text" class="ar-input" id="arCharName" placeholder="输入角色名字"></div>' +
            '</div>' +
            '<div>' +
              '<div class="ar-field-label">昵称 / 称呼</div>' +
              '<div class="ar-input-box"><input type="text" class="ar-input" id="arCharAlias" placeholder="小名、英文名或备注称呼"></div>' +
            '</div>' +
            '<div>' +
              '<div class="ar-field-label">身份 / 关系</div>' +
              '<div class="ar-input-box"><input type="text" class="ar-input" id="arCharRelation" placeholder="例如：室友、青梅竹马、上司"></div>' +
            '</div>' +
            '<div>' +
              '<div class="ar-field-label">性格与人设</div>' +
              '<div class="ar-input-box"><textarea class="ar-textarea" id="arCharPersona" placeholder="性格、说话语气、外貌特征"></textarea></div>' +
            '</div>' +
            '<div>' +
              '<div class="ar-field-label">背景故事</div>' +
              '<div class="ar-input-box"><textarea class="ar-textarea" id="arCharBg" placeholder="过往经历、与你的渊源"></textarea></div>' +
            '</div>' +
            '<div>' +
              '<div class="ar-field-label">备注 / 禁忌</div>' +
              '<div class="ar-input-box"><textarea class="ar-textarea" id="arCharNotes" placeholder="雷点、口癖、特殊设定等"></textarea></div>' +
            '</div>' +
          '</div>' +
          '<div class="ar-dialog-foot">' +
            '<div class="ar-danger-btn" id="arDeleteCharBtn" style="display:none;">删除</div>' +
            '<div class="ar-primary-btn" id="arSaveCharBtn" style="flex:1.4;">保存档案</div>' +
          '</div>' +
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
      var firstChar = (c.name || '?').slice(0, 1);
      var sub = c.persona || c.background || '点击编辑角色设定';

      return (
        '<div class="ar-card" data-edit-char="' + escapeHtml(c.id) + '">' +
          '<div class="' + avCls + '"' + avStyle + '>' + escapeHtml(firstChar) + '</div>' +
          '<div class="ar-card-info">' +
            '<div class="ar-card-top">' +
              '<div class="ar-card-name">' + escapeHtml(c.name) + '</div>' +
              (c.relation ? '<span class="ar-card-tag">' + escapeHtml(c.relation) + '</span>' : '') +
            '</div>' +
            '<div class="ar-card-sub">' + escapeHtml(sub) + '</div>' +
          '</div>' +
          SVG_CHEVRON +
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
    })).then(renderCharsList);
  }

  initLoad();

  var charModal = document.getElementById('arCharModal');
  function openCharModal(charObj) {
    editingCharId = charObj ? charObj.id : '';
    tempCharAvatar = charObj ? (charAvatarCache[charObj.id] || '') : '';
    document.getElementById('arModalTitle').textContent = charObj ? '编辑角色' : '新建角色';
    document.getElementById('arCharName').value = charObj ? (charObj.name || '') : '';
    document.getElementById('arCharAlias').value = charObj ? (charObj.alias || '') : '';
    document.getElementById('arCharRelation').value = charObj ? (charObj.relation || '') : '';
    document.getElementById('arCharPersona').value = charObj ? (charObj.persona || '') : '';
    document.getElementById('arCharBg').value = charObj ? (charObj.background || '') : '';
    document.getElementById('arCharNotes').value = charObj ? (charObj.notes || '') : '';
    document.getElementById('arDeleteCharBtn').style.display = charObj ? 'flex' : 'none';

    var avBox = document.getElementById('arCharAvatarBox');
    if (tempCharAvatar) {
      avBox.style.backgroundImage = 'url("' + tempCharAvatar + '")';
      avBox.classList.add('has-img');
    } else {
      avBox.style.backgroundImage = '';
      avBox.classList.remove('has-img');
    }
    charModal.classList.add('open');
  }

  document.getElementById('arAddCharBtn').addEventListener('click', function () {
    openCharModal(null);
  });

  document.getElementById('arCloseModal').addEventListener('click', function () {
    charModal.classList.remove('open');
  });

  document.getElementById('arCharList').addEventListener('click', function (e) {
    var card = e.target.closest('[data-edit-char]');
    if (!card) return;
    var cid = card.getAttribute('data-edit-char');
    var target = getChars().find(function (c) { return c.id === cid; });
    if (target) openCharModal(target);
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
    var name = document.getElementById('arCharName').value.trim();
    if (!name) {
      showToast('请先填写角色姓名');
      return;
    }
    var list = getChars();
    var id = editingCharId || ('char_' + Date.now());
    var obj = {
      id: id,
      name: name,
      alias: document.getElementById('arCharAlias').value.trim(),
      relation: document.getElementById('arCharRelation').value.trim(),
      persona: document.getElementById('arCharPersona').value.trim(),
      background: document.getElementById('arCharBg').value.trim(),
      notes: document.getElementById('arCharNotes').value.trim(),
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
    charModal.classList.remove('open');
    renderCharsList();
    showToast('角色档案已保存');
  });

  document.getElementById('arDeleteCharBtn').addEventListener('click', function () {
    if (!editingCharId) return;
    var list = getChars().filter(function (c) { return c.id !== editingCharId; });
    saveChars(list);
    delete charAvatarCache[editingCharId];
    PhoneDB.del('archive_char_avatar_' + editingCharId);
    charModal.classList.remove('open');
    renderCharsList();
    showToast('已删除角色');
  });
})();