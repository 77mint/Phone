/* =========================================================
   Chat 联系人页（仿微信通讯录独立模块）
   - 不改动 apps/chat.js / apps/chat.css，独立接管联系人 tab
   - 仅保留：顶部添加好友 + 搜索 + A-Z/# 字母分组 + 右侧索引条 + 底部总人数
   ========================================================= */
(function () {
  var LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
  var PINYIN_BOUNDS = '啊芭擦搭蛾发噶哈击喀垃妈拿哦啪期然撒塌挖昔压匝'.split('');
  var PINYIN_LETTERS = 'ABCDEFGHJKLMNOPQRSTWXYZ'.split('');
  var INDEX_ITEMS = ['🔍'].concat(LETTERS).concat(['#']);

  var keyword = '';
  var activeLetter = '';
  var rendering = false;

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getCharInitial(str) {
    var s = String(str || '').trim();
    if (!s) return '#';
    var ch = s.charAt(0);
    if (/^[a-zA-Z]$/.test(ch)) return ch.toUpperCase();
    if (/^[\u4e00-\u9fa5]$/.test(ch)) {
      try {
        for (var i = PINYIN_BOUNDS.length - 1; i >= 0; i--) {
          if (ch.localeCompare(PINYIN_BOUNDS[i], 'zh-CN') >= 0) {
            return PINYIN_LETTERS[i];
          }
        }
      } catch (e) {}
    }
    return '#';
  }

  function getContactsData() {
    var chars = [];
    var ids = [];
    try {
      if (window.PhoneArchive && typeof window.PhoneArchive.getChars === 'function') {
        chars = window.PhoneArchive.getChars() || [];
      }
      if (window.PhoneChat && typeof window.PhoneChat.getContactIds === 'function') {
        ids = window.PhoneChat.getContactIds() || [];
      }
    } catch (e) {}
    var idSet = new Set(ids);
    return chars.filter(function (c) { return idSet.has(c.id); });
  }

  function getDisplayName(c) {
    return (c && (c.name || c.nickname)) || '未命名';
  }

  function getAvatarHtml(c) {
    var name = getDisplayName(c);
    var fallback = (c && c.id === 'assistant-shuixiaojiu') ? '九' : name.slice(0, 1);
    var av = '';
    try {
      if (window.PhoneArchive && typeof window.PhoneArchive.getCharAvatar === 'function') {
        av = window.PhoneArchive.getCharAvatar(c.id) || '';
      }
    } catch (e) {}
    if (!av && c && c.avatar) av = c.avatar;
    if (av) {
      return '<div class="ctc-avatar"><img src="' + escapeHtml(av) + '" onerror="this.parentNode.textContent=\'' + escapeHtml(fallback) + '\'" alt=""></div>';
    }
    return '<div class="ctc-avatar">' + escapeHtml(fallback) + '</div>';
  }

  function ensureTopbarAddBtn() {
    var topbar = document.querySelector('#app-chat .ct-topbar');
    if (!topbar || document.getElementById('ctcAddFriendBtn')) return;
    var btn = document.createElement('button');
    btn.className = 'ctc-add-btn';
    btn.id = 'ctcAddFriendBtn';
    btn.setAttribute('aria-label', '添加朋友');
    btn.innerHTML =
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>' +
        '<circle cx="8.5" cy="7" r="4"/>' +
        '<line x1="20" y1="8" x2="20" y2="14"/>' +
        '<line x1="23" y1="11" x2="17" y2="11"/>' +
      '</svg>';
    btn.addEventListener('click', function () {
      var trigger = document.getElementById('ctMenuAddContact');
      if (trigger) trigger.click();
    });
    topbar.appendChild(btn);
  }

  function isContactsTabActive() {
    var tab = document.querySelector('#app-chat .ct-tab-btn[data-tab="contacts"]');
    return !!(tab && tab.classList.contains('active'));
  }

  function renderWeChatContacts(keepFocus) {
    var appEl = document.querySelector('#app-chat .ct-app');
    var scroll = document.getElementById('ctMainScroll');
    if (!appEl || !scroll) return;

    ensureTopbarAddBtn();

    if (!isContactsTabActive()) {
      appEl.classList.remove('is-contacts-tab');
      return;
    }

    appEl.classList.add('is-contacts-tab');
    rendering = true;

    // 保留原版列表隐藏镜像，用于触发原本的详细资料弹窗
    var mirrorHtml = '';
    var existingMirror = scroll.querySelector('.ctc-legacy-mirror');
    if (existingMirror) {
      mirrorHtml = existingMirror.outerHTML;
    } else {
      mirrorHtml = '<div class="ctc-legacy-mirror" style="display:none;">' + scroll.innerHTML + '</div>';
    }

    var allContacts = getContactsData();
    var filtered = allContacts.filter(function (c) {
      if (!keyword) return true;
      return getDisplayName(c).toLowerCase().indexOf(keyword) !== -1;
    });

    var groups = {};
    filtered.forEach(function (c) {
      var letter = getCharInitial(getDisplayName(c));
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(c);
    });

    var orderedKeys = Object.keys(groups).sort(function (a, b) {
      if (a === '#') return 1;
      if (b === '#') return -1;
      return a.localeCompare(b);
    });

    orderedKeys.forEach(function (k) {
      groups[k].sort(function (a, b) {
        return getDisplayName(a).localeCompare(getDisplayName(b), 'zh-CN');
      });
    });

    var listHtml = '';
    if (filtered.length === 0) {
      listHtml = '<div class="ctc-empty">' + (keyword ? '没有找到匹配的联系人' : '还没有联系人，点右上角图标添加') + '</div>';
    } else {
      orderedKeys.forEach(function (k) {
        listHtml += '<div class="ctc-sec-head" data-ctc-sec="' + k + '">' + k + '</div>';
        listHtml += '<div class="ctc-sec-group">';
        groups[k].forEach(function (c) {
          listHtml +=
            '<div class="ctc-row" data-ctc-id="' + escapeHtml(c.id) + '">' +
              getAvatarHtml(c) +
              '<div class="ctc-name">' + escapeHtml(getDisplayName(c)) + '</div>' +
            '</div>';
        });
        listHtml += '</div>';
      });
      listHtml += '<div class="ctc-total">' + filtered.length + ' 位联系人</div>';
    }

    var indexHtml = INDEX_ITEMS.map(function (item) {
      var label = item === '🔍'
        ? '<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'
        : item;
      var cls = 'ctc-index-item' + (activeLetter === item ? ' active' : '');
      return '<div class="' + cls + '" data-ctc-idx="' + item + '">' + label + '</div>';
    }).join('');

    scroll.innerHTML =
      mirrorHtml +
      '<div class="ctc-wrap">' +
        '<div class="ctc-search-bar">' +
          '<div class="ctc-search-box ' + (keyword ? 'has-val' : '') + '" id="ctcSearchBox">' +
            '<div class="ctc-search-placeholder">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
              '<span>搜索</span>' +
            '</div>' +
            '<input class="ctc-search-input" id="ctcSearchInput" value="' + escapeHtml(keyword) + '">' +
          '</div>' +
        '</div>' +
        '<div class="ctc-list-scroll" id="ctcListScroll">' + listHtml + '</div>' +
        '<div class="ctc-index-bar" id="ctcIndexBar">' + indexHtml + '</div>' +
        '<div class="ctc-index-toast" id="ctcIndexToast"></div>' +
      '</div>';

    bindContactsEvents(keepFocus);
    rendering = false;
  }

  function jumpToLetter(letter, showBubble) {
    var listScroll = document.getElementById('ctcListScroll');
    var toast = document.getElementById('ctcIndexToast');
    var bar = document.getElementById('ctcIndexBar');
    if (!listScroll) return;

    activeLetter = letter;
    if (bar) {
      bar.querySelectorAll('.ctc-index-item').forEach(function (el) {
        el.classList.toggle('active', el.getAttribute('data-ctc-idx') === letter);
      });
    }

    if (letter === '🔍') {
      listScroll.scrollTop = 0;
      var inp = document.getElementById('ctcSearchInput');
      if (inp) inp.focus();
      if (toast) toast.classList.remove('show');
      return;
    }

    if (showBubble && toast) {
      toast.textContent = letter;
      toast.classList.add('show');
    }

    var target = listScroll.querySelector('[data-ctc-sec="' + letter + '"]');
    if (target) {
      listScroll.scrollTop = target.offsetTop;
    }
  }

  function bindContactsEvents(keepFocus) {
    var searchBox = document.getElementById('ctcSearchBox');
    var searchInput = document.getElementById('ctcSearchInput');
    var listScroll = document.getElementById('ctcListScroll');
    var indexBar = document.getElementById('ctcIndexBar');
    var toast = document.getElementById('ctcIndexToast');

    if (searchInput) {
      if (keepFocus) {
        searchBox.classList.add('is-focus');
        searchInput.focus();
        searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
      }
      searchInput.addEventListener('focus', function () {
        searchBox.classList.add('is-focus');
      });
      searchInput.addEventListener('blur', function () {
        searchBox.classList.remove('is-focus');
      });
      searchInput.addEventListener('input', function (e) {
        keyword = e.target.value.trim().toLowerCase();
        renderWeChatContacts(true);
      });
    }

    if (listScroll) {
      listScroll.querySelectorAll('.ctc-row[data-ctc-id]').forEach(function (row) {
        row.addEventListener('click', function () {
          var cid = row.getAttribute('data-ctc-id');
          var mirrorRow = document.querySelector('#ctMainScroll .ctc-legacy-mirror [data-contact-id="' + cid + '"]');
          if (mirrorRow) mirrorRow.click();
        });
      });
    }

    if (indexBar) {
      var pickFromPoint = function (clientY, showBubble) {
        var rect = indexBar.getBoundingClientRect();
        var ratio = (clientY - rect.top) / (rect.height || 1);
        var idx = Math.max(0, Math.min(INDEX_ITEMS.length - 1, Math.floor(ratio * INDEX_ITEMS.length)));
        jumpToLetter(INDEX_ITEMS[idx], showBubble);
      };

      indexBar.addEventListener('touchstart', function (e) {
        if (e.cancelable) e.preventDefault();
        if (e.touches[0]) pickFromPoint(e.touches[0].clientY, true);
      }, { passive: false });

      indexBar.addEventListener('touchmove', function (e) {
        if (e.cancelable) e.preventDefault();
        if (e.touches[0]) pickFromPoint(e.touches[0].clientY, true);
      }, { passive: false });

      indexBar.addEventListener('touchend', function () {
        if (toast) toast.classList.remove('show');
      });

      indexBar.addEventListener('click', function (e) {
        var item = e.target.closest('.ctc-index-item');
        if (item) jumpToLetter(item.getAttribute('data-ctc-idx'), false);
      });
    }
  }

  function init() {
    var scroll = document.getElementById('ctMainScroll');
    if (!scroll) return;
    var observer = new MutationObserver(function () {
      if (rendering) return;
      if (isContactsTabActive()) {
        if (!scroll.querySelector('.ctc-wrap')) renderWeChatContacts(false);
      } else {
        var appEl = document.querySelector('#app-chat .ct-app');
        if (appEl) appEl.classList.remove('is-contacts-tab');
      }
    });
    observer.observe(scroll, { childList: true });
    renderWeChatContacts(false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
