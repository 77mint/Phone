(function () {
  var root = document.getElementById('app-lorebook');
  if (!root) return;

  var BOOKS_KEY = 'phone_lorebooks_v1';
  var activeBookId = '';
  var openEntryIds = {};

  function getBooks() {
    try {
      var arr = JSON.parse(localStorage.getItem(BOOKS_KEY) || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function saveBooks(list) {
    localStorage.setItem(BOOKS_KEY, JSON.stringify(list));
  }

  // 供后续 iMessage / 线下 等模块扫描匹配世界书词条
  window.PhoneLorebook = {
    getBooks: getBooks,
    matchContext: function (text) {
      var haystack = String(text || '').toLowerCase();
      var books = getBooks().filter(function (b) { return b.enabled; });
      var matched = [];
      books.forEach(function (b) {
        (b.entries || []).forEach(function (e) {
          if (!e.enabled || !e.content) return;
          if (e.constant) {
            matched.push(e);
            return;
          }
          var keys = String(e.keys || '').split(/[,，\n]+/).map(function (k) {
            return k.trim().toLowerCase();
          }).filter(Boolean);
          var hit = keys.some(function (k) { return haystack.indexOf(k) !== -1; });
          if (hit) matched.push(e);
        });
      });
      return matched;
    }
  };

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  var SVG_CLOSE = '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  var SVG_EXPORT = '<svg viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>';
  var SVG_IMPORT = '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>';

  root.innerHTML =
    '<div class="lb-shell">' +
      '<div class="lb-header">' +
        '<div class="lb-header-left">' +
          '<div class="mu-back-sm" data-close-app>' +
            '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>' +
          '</div>' +
          '<div class="lb-title">世界书</div>' +
        '</div>' +
        '<div class="lb-header-actions">' +
          '<div class="lb-pill-btn" id="lbImportBtn">' + SVG_IMPORT + '<span>导入</span></div>' +
          '<div class="lb-pill-btn" id="lbNewBookBtn">' +
            '<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>' +
            '<span>新建</span>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="lb-body">' +
        '<div class="lb-list" id="lbBookList"></div>' +
      '</div>' +

      '<div class="lb-detail" id="lbDetail">' +
        '<div class="lb-detail-head">' +
          '<input type="text" class="lb-detail-title-input" id="lbDetailTitleInput" placeholder="世界书名称">' +
          '<div class="lb-detail-actions">' +
            '<div class="lb-icon-circle" id="lbExportBookBtn" title="导出">' + SVG_EXPORT + '</div>' +
            '<div class="lb-icon-circle" id="lbCloseDetail">' + SVG_CLOSE + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="lb-detail-body">' +
          '<div class="lb-add-entry-btn" id="lbAddEntryBtn">' +
            '<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>' +
            '<span>添加词条</span>' +
          '</div>' +
          '<div class="lb-entry-list" id="lbEntryList"></div>' +
          '<div class="lb-book-del-wrap">' +
            '<div class="lb-book-del-btn" id="lbDeleteBookBtn">删除这本世界书</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="lb-modal" id="lbNewModal">' +
        '<div class="lb-dialog">' +
          '<div class="lb-dialog-close" id="lbCloseNewModal">' + SVG_CLOSE + '</div>' +
          '<div class="lb-dialog-title">新建世界书</div>' +
          '<div class="lb-input-box"><input type="text" class="lb-input" id="lbNewBookName" placeholder="输入世界书名称"></div>' +
          '<div class="lb-primary-btn" id="lbCreateBookBtn">创建</div>' +
        '</div>' +
      '</div>' +

      '<div class="lb-toast" id="lbToast"></div>' +
      '<input type="file" id="lbInputImport" accept=".json,application/json" style="display:none;">' +
    '</div>';

  var toastTimer = null;
  function showToast(msg) {
    var el = document.getElementById('lbToast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.classList.remove('show');
    }, 1800);
  }

  function renderBookList() {
    var books = getBooks();
    var listEl = document.getElementById('lbBookList');
    if (!books.length) {
      listEl.innerHTML =
        '<div class="lb-empty">' +
          '<div class="lb-empty-title">还没有世界书</div>' +
          '<div class="lb-empty-sub">点击右上角「+ 新建」或直接「导入」酒馆世界书 JSON</div>' +
        '</div>';
      return;
    }

    listEl.innerHTML = books.map(function (b) {
      var count = (b.entries || []).length;
      var activeCount = (b.entries || []).filter(function (e) { return e.enabled; }).length;
      return (
        '<div class="lb-book-card" data-open-book="' + escapeHtml(b.id) + '">' +
          '<div class="lb-book-info">' +
            '<div class="lb-book-name">' + escapeHtml(b.name || '未命名世界书') + '</div>' +
            '<div class="lb-book-sub">共 ' + count + ' 条词条 · 已启用 ' + activeCount + ' 条</div>' +
          '</div>' +
          '<div class="lb-switch' + (b.enabled ? ' on' : '') + '" data-toggle-book="' + escapeHtml(b.id) + '">' +
            '<div class="lb-switch-thumb"></div>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  function syncActiveEntriesInputs() {
    var books = getBooks();
    var book = books.find(function (b) { return b.id === activeBookId; });
    if (!book) return;
    var titleEl = document.getElementById('lbDetailTitleInput');
    if (titleEl && titleEl.value.trim()) book.name = titleEl.value.trim();

    (book.entries || []).forEach(function (entry) {
      var tEl = document.getElementById('lb_e_title_' + entry.id);
      var kEl = document.getElementById('lb_e_keys_' + entry.id);
      var dEl = document.getElementById('lb_e_depth_' + entry.id);
      var cEl = document.getElementById('lb_e_content_' + entry.id);
      if (tEl) entry.title = tEl.value.trim();
      if (kEl) entry.keys = kEl.value;
      if (dEl) entry.depth = Math.max(0, parseInt(dEl.value || '4', 10) || 0);
      if (cEl) entry.content = cEl.value;
    });
    saveBooks(books);
  }

  function renderDetailEntries() {
    var books = getBooks();
    var book = books.find(function (b) { return b.id === activeBookId; });
    if (!book) return;
    document.getElementById('lbDetailTitleInput').value = book.name || '';

    var listEl = document.getElementById('lbEntryList');
    var entries = book.entries || [];
    if (!entries.length) {
      listEl.innerHTML = '<div class="lb-empty" style="padding:32px 20px;"><div class="lb-empty-sub">暂无词条，点击上方「+ 添加词条」开始设定</div></div>';
      return;
    }

    listEl.innerHTML = entries.map(function (e) {
      var isOpen = !!openEntryIds[e.id];
      var lightCls = !e.enabled ? 'off' : (e.constant ? 'blue' : 'green');
      var posLabel = e.position === 'before' ? '角色前' : (e.position === 'depth' ? ('深度 ' + (e.depth || 4)) : '角色后');

      return (
        '<div class="lb-entry-card' + (isOpen ? ' open' : '') + '">' +
          '<div class="lb-entry-head" data-toggle-entry="' + escapeHtml(e.id) + '">' +
            '<div class="lb-entry-head-left">' +
              '<span class="lb-light ' + lightCls + '"></span>' +
              '<div class="lb-entry-title">' + escapeHtml(e.title || '未命名词条') + '</div>' +
              '<span class="lb-entry-badge">' + escapeHtml(posLabel) + '</span>' +
            '</div>' +
            '<div class="lb-switch' + (e.enabled ? ' on' : '') + '" data-toggle-entry-enable="' + escapeHtml(e.id) + '">' +
              '<div class="lb-switch-thumb"></div>' +
            '</div>' +
          '</div>' +
          '<div class="lb-entry-body">' +
            '<div>' +
              '<div class="lb-field-label">词条名称</div>' +
              '<div class="lb-input-box"><input type="text" class="lb-input" id="lb_e_title_' + escapeHtml(e.id) + '" value="' + escapeHtml(e.title) + '" placeholder="如：城市背景 / 特殊规则"></div>' +
            '</div>' +
            '<div>' +
              '<div class="lb-field-label">触发方式</div>' +
              '<div class="lb-seg">' +
                '<div class="lb-seg-btn' + (!e.constant ? ' active' : '') + '" data-set-const="' + escapeHtml(e.id) + '" data-val="0">关键词触发（绿灯）</div>' +
                '<div class="lb-seg-btn' + (e.constant ? ' active' : '') + '" data-set-const="' + escapeHtml(e.id) + '" data-val="1">常驻生效（蓝灯）</div>' +
              '</div>' +
            '</div>' +
            (!e.constant ? (
              '<div>' +
                '<div class="lb-field-label">关键词（用逗号隔开）</div>' +
                '<div class="lb-input-box"><input type="text" class="lb-input" id="lb_e_keys_' + escapeHtml(e.id) + '" value="' + escapeHtml(e.keys || '') + '" placeholder="例如：钟楼, 怀表, 深夜"></div>' +
              '</div>'
            ) : '') +
            '<div>' +
              '<div class="lb-field-label">插入位置</div>' +
              '<div class="lb-seg">' +
                '<div class="lb-seg-btn' + (e.position === 'before' ? ' active' : '') + '" data-set-pos="' + escapeHtml(e.id) + '" data-val="before">角色前</div>' +
                '<div class="lb-seg-btn' + (e.position === 'after' ? ' active' : '') + '" data-set-pos="' + escapeHtml(e.id) + '" data-val="after">角色后</div>' +
                '<div class="lb-seg-btn' + (e.position === 'depth' ? ' active' : '') + '" data-set-pos="' + escapeHtml(e.id) + '" data-val="depth">深度插入</div>' +
              '</div>' +
            '</div>' +
            (e.position === 'depth' ? (
              '<div>' +
                '<div class="lb-field-label">插入深度（Depth，默认 4）</div>' +
                '<div class="lb-input-box"><input type="number" class="lb-input" id="lb_e_depth_' + escapeHtml(e.id) + '" value="' + (e.depth !== undefined ? e.depth : 4) + '" min="0" max="99"></div>' +
              '</div>'
            ) : '') +
            '<div>' +
              '<div class="lb-field-label">设定内容</div>' +
              '<div class="lb-input-box"><textarea class="lb-textarea" id="lb_e_content_' + escapeHtml(e.id) + '" placeholder="写下具体世界观、事件或补充规则...">' + escapeHtml(e.content || '') + '</textarea></div>' +
            '</div>' +
            '<div class="lb-entry-foot">' +
              '<div class="lb-del-btn" data-del-entry="' + escapeHtml(e.id) + '">删除词条</div>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  function exportBookJson(book) {
    var entriesObj = {};
    (book.entries || []).forEach(function (e, idx) {
      var posNum = e.position === 'before' ? 0 : (e.position === 'depth' ? 4 : 1);
      entriesObj[String(idx)] = {
        uid: idx,
        key: String(e.keys || '').split(/[,，\n]+/).map(function (x) { return x.trim(); }).filter(Boolean),
        keysecondary: [],
        comment: e.title || '',
        content: e.content || '',
        constant: !!e.constant,
        selective: true,
        order: 100 - idx,
        position: posNum,
        disable: !e.enabled,
        depth: e.depth !== undefined ? e.depth : 4
      };
    });
    var payload = {
      name: book.name || '世界书',
      entries: entriesObj
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = (book.name || 'lorebook').replace(/[\\/:*?"<>|]/g, '_') + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 3000);
    showToast('已导出世界书 JSON');
  }

  function importBookJson(rawObj, fallbackName) {
    var rawEntries = [];
    if (rawObj && rawObj.entries && !Array.isArray(rawObj.entries) && typeof rawObj.entries === 'object') {
      rawEntries = Object.keys(rawObj.entries).map(function (k) { return rawObj.entries[k]; });
    } else if (rawObj && Array.isArray(rawObj.entries)) {
      rawEntries = rawObj.entries;
    } else if (Array.isArray(rawObj)) {
      rawEntries = rawObj;
    }

    if (!rawEntries.length) {
      showToast('未识别到有效词条');
      return;
    }

    var mapped = rawEntries.map(function (item, idx) {
      var keysArr = Array.isArray(item.key) ? item.key : (item.keys ? String(item.keys).split(/[,，]+/) : []);
      var pos = 'after';
      if (item.position === 0 || item.position === 'before') pos = 'before';
      else if (item.position === 4 || item.position === 'depth') pos = 'depth';

      return {
        id: 'ent_' + Date.now() + '_' + idx,
        title: item.comment || item.title || ('词条 ' + (idx + 1)),
        keys: keysArr.join(', '),
        constant: !!item.constant,
        enabled: item.disable !== undefined ? !item.disable : (item.enabled !== undefined ? !!item.enabled : true),
        position: pos,
        depth: item.depth !== undefined ? item.depth : 4,
        content: item.content || ''
      };
    });

    var books = getBooks();
    books.unshift({
      id: 'lb_' + Date.now(),
      name: (rawObj && rawObj.name) ? rawObj.name : (fallbackName || '导入的世界书'),
      enabled: true,
      entries: mapped
    });
    saveBooks(books);
    renderBookList();
    showToast('已导入 ' + mapped.length + ' 条词条');
  }

  renderBookList();

  var newModal = document.getElementById('lbNewModal');
  var detailEl = document.getElementById('lbDetail');

  document.getElementById('lbNewBookBtn').addEventListener('click', function () {
    document.getElementById('lbNewBookName').value = '';
    newModal.classList.add('open');
  });
  document.getElementById('lbCloseNewModal').addEventListener('click', function () {
    newModal.classList.remove('open');
  });
  document.getElementById('lbCreateBookBtn').addEventListener('click', function () {
    var name = document.getElementById('lbNewBookName').value.trim() || '新建世界书';
    var books = getBooks();
    var id = 'lb_' + Date.now();
    books.unshift({ id: id, name: name, enabled: true, entries: [] });
    saveBooks(books);
    newModal.classList.remove('open');
    renderBookList();
    activeBookId = id;
    openEntryIds = {};
    renderDetailEntries();
    detailEl.classList.add('open');
  });

  document.getElementById('lbImportBtn').addEventListener('click', function () {
    document.getElementById('lbInputImport').click();
  });

  document.getElementById('lbInputImport').addEventListener('change', function () {
    var file = this.files && this.files[0];
    if (!file) return;
    var baseName = file.name.replace(/\.json$/i, '');
    var reader = new FileReader();
    reader.onload = function () {
      try {
        importBookJson(JSON.parse(reader.result), baseName);
      } catch (e) {
        showToast('JSON 格式有误');
      }
    };
    reader.readAsText(file, 'utf-8');
    this.value = '';
  });

  document.getElementById('lbBookList').addEventListener('click', function (e) {
    var sw = e.target.closest('[data-toggle-book]');
    if (sw) {
      e.stopPropagation();
      var tid = sw.getAttribute('data-toggle-book');
      var books = getBooks();
      var b = books.find(function (x) { return x.id === tid; });
      if (b) {
        b.enabled = !b.enabled;
        saveBooks(books);
        renderBookList();
      }
      return;
    }
    var card = e.target.closest('[data-open-book]');
    if (card) {
      activeBookId = card.getAttribute('data-open-book');
      openEntryIds = {};
      renderDetailEntries();
      detailEl.classList.add('open');
    }
  });

  document.getElementById('lbCloseDetail').addEventListener('click', function () {
    syncActiveEntriesInputs();
    detailEl.classList.remove('open');
    renderBookList();
  });

  document.getElementById('lbDetailTitleInput').addEventListener('blur', function () {
    syncActiveEntriesInputs();
    renderBookList();
  });

  document.getElementById('lbExportBookBtn').addEventListener('click', function () {
    syncActiveEntriesInputs();
    var book = getBooks().find(function (b) { return b.id === activeBookId; });
    if (book) exportBookJson(book);
  });

  document.getElementById('lbDeleteBookBtn').addEventListener('click', function () {
    var books = getBooks().filter(function (b) { return b.id !== activeBookId; });
    saveBooks(books);
    detailEl.classList.remove('open');
    renderBookList();
    showToast('已删除世界书');
  });

  document.getElementById('lbAddEntryBtn').addEventListener('click', function () {
    syncActiveEntriesInputs();
    var books = getBooks();
    var book = books.find(function (b) { return b.id === activeBookId; });
    if (!book) return;
    var eid = 'ent_' + Date.now();
    book.entries = book.entries || [];
    book.entries.unshift({
      id: eid,
      title: '新词条',
      keys: '',
      constant: false,
      enabled: true,
      position: 'after',
      depth: 4,
      content: ''
    });
    saveBooks(books);
    openEntryIds[eid] = true;
    renderDetailEntries();
  });

  document.getElementById('lbEntryList').addEventListener('input', function () {
    syncActiveEntriesInputs();
  });

  document.getElementById('lbEntryList').addEventListener('click', function (e) {
    var sw = e.target.closest('[data-toggle-entry-enable]');
    if (sw) {
      e.stopPropagation();
      syncActiveEntriesInputs();
      var eid = sw.getAttribute('data-toggle-entry-enable');
      var books = getBooks();
      var book = books.find(function (b) { return b.id === activeBookId; });
      var entry = book && (book.entries || []).find(function (x) { return x.id === eid; });
      if (entry) {
        entry.enabled = !entry.enabled;
        saveBooks(books);
        renderDetailEntries();
      }
      return;
    }

    var constBtn = e.target.closest('[data-set-const]');
    if (constBtn) {
      syncActiveEntriesInputs();
      var cid = constBtn.getAttribute('data-set-const');
      var cVal = constBtn.getAttribute('data-val') === '1';
      var books2 = getBooks();
      var book2 = books2.find(function (b) { return b.id === activeBookId; });
      var entry2 = book2 && (book2.entries || []).find(function (x) { return x.id === cid; });
      if (entry2) {
        entry2.constant = cVal;
        saveBooks(books2);
        renderDetailEntries();
      }
      return;
    }

    var posBtn = e.target.closest('[data-set-pos]');
    if (posBtn) {
      syncActiveEntriesInputs();
      var pid = posBtn.getAttribute('data-set-pos');
      var pVal = posBtn.getAttribute('data-val');
      var books3 = getBooks();
      var book3 = books3.find(function (b) { return b.id === activeBookId; });
      var entry3 = book3 && (book3.entries || []).find(function (x) { return x.id === pid; });
      if (entry3) {
        entry3.position = pVal;
        saveBooks(books3);
        renderDetailEntries();
      }
      return;
    }

    var delBtn = e.target.closest('[data-del-entry]');
    if (delBtn) {
      syncActiveEntriesInputs();
      var did = delBtn.getAttribute('data-del-entry');
      var books4 = getBooks();
      var book4 = books4.find(function (b) { return b.id === activeBookId; });
      if (book4) {
        book4.entries = (book4.entries || []).filter(function (x) { return x.id !== did; });
        saveBooks(books4);
        delete openEntryIds[did];
        renderDetailEntries();
      }
      return;
    }

    var head = e.target.closest('[data-toggle-entry]');
    if (head) {
      syncActiveEntriesInputs();
      var tid = head.getAttribute('data-toggle-entry');
      openEntryIds[tid] = !openEntryIds[tid];
      renderDetailEntries();
    }
  });
})();