(function () {
  var root = document.getElementById('app-books');
  if (!root) return;

  var DEFAULT_BOOKS = [
    {
      id: 'bk_little_prince',
      title: '小王子',
      author: '安托万·德·圣-埃克苏佩里',
      isbn: '9780156012195',
      cover: 'https://covers.openlibrary.org/b/isbn/9780156012195-L.jpg'
    },
    {
      id: 'bk_moon_sixpence',
      title: '月亮与六便士',
      author: '毛姆',
      isbn: '9780141187136',
      cover: 'https://covers.openlibrary.org/b/isbn/9780141187136-L.jpg'
    },
    {
      id: 'bk_pride_prejudice',
      title: '傲慢与偏见',
      author: '简·奥斯汀',
      isbn: '9780141439518',
      cover: 'https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg'
    },
    {
      id: 'bk_walden',
      title: '瓦尔登湖',
      author: '亨利·戴维·梭罗',
      isbn: '9780140390445',
      cover: 'https://covers.openlibrary.org/b/isbn/9780140390445-L.jpg'
    },
    {
      id: 'bk_1984',
      title: '1984',
      author: '乔治·奥威尔',
      isbn: '9780451524935',
      cover: 'https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg'
    }
  ];

  var ARC_LEN = 339.292;
  var customCoverMap = {};
  var editingCoverBookId = '';
  var tempGoalMinutes = 60;

  function getBooks() {
    try {
      var saved = JSON.parse(localStorage.getItem('phone_books_list') || 'null');
      if (Array.isArray(saved) && saved.length) return saved;
    } catch (e) {}
    return DEFAULT_BOOKS.slice();
  }

  function saveBooks(list) {
    localStorage.setItem('phone_books_list', JSON.stringify(list));
  }

  function getRecentIds(books) {
    try {
      var arr = JSON.parse(localStorage.getItem('phone_books_recent') || 'null');
      if (Array.isArray(arr) && arr.length) {
        var valid = arr.filter(function (id) {
          return books.some(function (b) { return b.id === id; });
        });
        books.forEach(function (b) {
          if (valid.indexOf(b.id) === -1) valid.push(b.id);
        });
        return valid;
      }
    } catch (e) {}
    return books.map(function (b) { return b.id; });
  }

  function setRecentTop(bookId) {
    var books = getBooks();
    var recent = getRecentIds(books).filter(function (id) { return id !== bookId; });
    recent.unshift(bookId);
    localStorage.setItem('phone_books_recent', JSON.stringify(recent));
  }

  function getGoalMinutes() {
    var v = parseInt(localStorage.getItem('phone_books_goal_min') || '60', 10);
    return isNaN(v) || v < 5 ? 60 : v;
  }

  function getTodayMinutes() {
    var todayKey = new Date().toISOString().slice(0, 10);
    var savedDate = localStorage.getItem('phone_books_today_date');
    if (savedDate !== todayKey) return 0;
    var m = parseInt(localStorage.getItem('phone_books_today_min') || '0', 10);
    return isNaN(m) ? 0 : m;
  }

  function formatDuration(mins) {
    var h = Math.floor(mins / 60);
    var m = mins % 60;
    return h + ':' + String(m).padStart(2, '0');
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  root.innerHTML =
    '<div class="bk-shell">' +
      '<div class="bk-header">' +
        '<div class="bk-header-left">' +
          '<div class="mu-back-sm bk-back" data-close-app>' +
            '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>' +
          '</div>' +
          '<div class="bk-title" id="bkHeaderTitle">主页</div>' +
        '</div>' +
        '<div class="bk-import-btn" id="bkImportBtn">' +
          '<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>' +
          '<span>导入</span>' +
        '</div>' +
      '</div>' +

      '<div class="bk-body">' +
        '<div class="bk-panel active" id="bkPanelHome">' +
          '<div class="bk-shelf-wrap">' +
            '<div class="bk-shelf-row" id="bkShelfRow"></div>' +
            '<div class="bk-shelf-ledge"></div>' +
          '</div>' +

          '<div class="bk-goal-card">' +
            '<div class="bk-goal-heading">阅读目标</div>' +
            '<div class="bk-goal-desc">坚持每天阅读，提升你的数据，以激励你读完更多图书。</div>' +
            '<div class="bk-arc-box">' +
              '<svg class="bk-arc-svg" viewBox="0 0 260 150">' +
                '<path d="M 22 130 A 108 108 0 0 1 238 130" fill="none" stroke="#ececf1" stroke-width="10" stroke-linecap="round"></path>' +
                '<path id="bkHomeArcFill" d="M 22 130 A 108 108 0 0 1 238 130" fill="none" stroke="#111111" stroke-width="10" stroke-linecap="round" stroke-dasharray="339.292" stroke-dashoffset="339.292" style="opacity:0;"></path>' +
              '</svg>' +
              '<div class="bk-arc-inner">' +
                '<div class="bk-arc-label">今日阅读进度</div>' +
                '<div class="bk-arc-time" id="bkHomeTime">0:00</div>' +
                '<div class="bk-arc-target-btn" id="bkOpenGoalModal">' +
                  '<span id="bkHomeTargetText">(目标 60 分钟)</span>' +
                  '<svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div class="bk-continue-btn" id="bkContinueBtn">' +
              '<div class="bk-continue-main">继续阅读</div>' +
              '<div class="bk-continue-sub" id="bkContinueTitle">小王子</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="bk-panel" id="bkPanelLibrary">' +
          '<div class="bk-lib-grid" id="bkLibGrid"></div>' +
        '</div>' +
      '</div>' +

      '<div class="lg-bottom-bar bk-bottom-bar" id="bkBottomBar">' +
        '<div class="bk-tab-indicator"></div>' +
        '<div class="bk-tab active" data-bk-tab="home">主页</div>' +
        '<div class="bk-tab" data-bk-tab="library">书库</div>' +
      '</div>' +

      '<div class="bk-goal-modal" id="bkGoalModal">' +
        '<div class="bk-goal-modal-top">' +
          '<div class="bk-close-circle" id="bkCloseGoalModal">' +
            '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
          '</div>' +
        '</div>' +
        '<div class="bk-goal-modal-body">' +
          '<div class="bk-arc-box">' +
            '<svg class="bk-arc-svg" viewBox="0 0 260 150">' +
              '<path d="M 22 130 A 108 108 0 0 1 238 130" fill="none" stroke="#ececf1" stroke-width="10" stroke-linecap="round"></path>' +
              '<path id="bkModalArcFill" d="M 22 130 A 108 108 0 0 1 238 130" fill="none" stroke="#111111" stroke-width="10" stroke-linecap="round" stroke-dasharray="339.292" stroke-dashoffset="339.292" style="opacity:0;"></path>' +
            '</svg>' +
            '<div class="bk-arc-inner">' +
              '<div class="bk-arc-time" id="bkModalTime">0:00</div>' +
              '<div class="bk-arc-target-btn" style="cursor:default;"><span id="bkModalTargetText">(目标 60 分钟)</span></div>' +
            '</div>' +
          '</div>' +
          '<div class="bk-goal-divider"></div>' +
          '<div class="bk-modal-stat-title">今日阅读进度</div>' +
          '<div class="bk-modal-stat-blue" id="bkModalRemainText">还需 60 分钟</div>' +
          '<div class="bk-modal-stat-sub" id="bkModalSubText">你正朝着每日目标奋进</div>' +
        '</div>' +
        '<div class="bk-goal-modal-actions">' +
          '<div class="bk-share-btn" id="bkShareBtn">分享</div>' +
          '<div class="bk-adjust-btn" id="bkOpenAdjustModal">调整目标</div>' +
        '</div>' +
      '</div>' +

      '<div class="bk-center-modal" id="bkAdjustModal">' +
        '<div class="bk-dialog">' +
          '<div class="bk-dialog-close" id="bkCloseAdjustModal">' +
            '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
          '</div>' +
          '<div class="bk-dialog-title">设定每日阅读目标</div>' +
          '<div class="bk-stepper">' +
            '<div class="bk-step-btn" id="bkStepMinus">' +
              '<svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"></line></svg>' +
            '</div>' +
            '<div class="bk-step-val" id="bkStepVal">60 分钟</div>' +
            '<div class="bk-step-btn" id="bkStepPlus">' +
              '<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>' +
            '</div>' +
          '</div>' +
          '<div class="bk-presets" id="bkPresets">' +
            '<div class="bk-preset-chip" data-min="15">15分钟</div>' +
            '<div class="bk-preset-chip" data-min="30">30分钟</div>' +
            '<div class="bk-preset-chip" data-min="45">45分钟</div>' +
            '<div class="bk-preset-chip" data-min="60">60分钟</div>' +
            '<div class="bk-preset-chip" data-min="90">90分钟</div>' +
            '<div class="bk-preset-chip" data-min="120">120分钟</div>' +
          '</div>' +
          '<div class="bk-save-btn" id="bkSaveGoalBtn">保存目标</div>' +
        '</div>' +
      '</div>' +

      '<div class="bk-toast" id="bkToast"></div>' +
      '<input type="file" id="bkInputCover" accept="image/*" style="display:none;">' +
      '<input type="file" id="bkInputTxt" accept=".txt,text/plain" style="display:none;">' +
    '</div>';

  var toastTimer = null;
  function showToast(msg) {
    var el = document.getElementById('bkToast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.classList.remove('show');
    }, 1800);
  }

  function buildCoverHtml(book) {
    var url = customCoverMap[book.id] || book.cover || '';
    var hasClass = url ? ' has-cover' : '';
    var bgStyle = url ? ' style="background-image:url(\'' + url + '\');"' : '';
    return (
      '<div class="bk-cover-3d' + hasClass + '"' + bgStyle + '>' +
        '<div class="bk-cover-fallback">' +
          '<div class="bk-fb-title">' + escapeHtml(book.title) + '</div>' +
          '<div class="bk-fb-author">' + escapeHtml(book.author || '本地图书') + '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function renderShelfAndGoal() {
    var books = getBooks();
    var recentIds = getRecentIds(books);
    var five = recentIds.slice(0, 5).map(function (id) {
      return books.find(function (b) { return b.id === id; });
    }).filter(Boolean);

    // 排列为：小 小 大 小 小（中间是最近翻开的第 1 本）
    var ordered = [];
    if (five.length >= 5) {
      ordered = [
        { book: five[1], size: 'is-small' },
        { book: five[2], size: 'is-small' },
        { book: five[0], size: 'is-big' },
        { book: five[3], size: 'is-small' },
        { book: five[4], size: 'is-small' }
      ];
    } else {
      five.forEach(function (b, idx) {
        ordered.push({ book: b, size: idx === 0 ? 'is-big' : 'is-small' });
      });
    }

    var shelfEl = document.getElementById('bkShelfRow');
    shelfEl.innerHTML = ordered.map(function (item) {
      return (
        '<div class="bk-book-slot ' + item.size + '" data-shelf-book="' + item.book.id + '">' +
          buildCoverHtml(item.book) +
        '</div>'
      );
    }).join('');

    var topBook = five[0] || books[0];
    document.getElementById('bkContinueTitle').textContent = topBook ? topBook.title : '暂无图书';

    var goal = getGoalMinutes();
    var today = getTodayMinutes();
    var remain = Math.max(0, goal - today);
    var pct = Math.min(1, today / goal);
    var offset = ARC_LEN * (1 - pct);

    var timeStr = formatDuration(today);
    document.getElementById('bkHomeTime').textContent = timeStr;
    document.getElementById('bkHomeTargetText').textContent = '(目标 ' + goal + ' 分钟)';
    document.getElementById('bkModalTime').textContent = timeStr;
    document.getElementById('bkModalTargetText').textContent = '(目标 ' + goal + ' 分钟)';
    document.getElementById('bkModalRemainText').textContent = remain > 0 ? ('还需 ' + remain + ' 分钟') : '今日目标已完成';
    document.getElementById('bkModalSubText').textContent = remain > 0 ? '你正朝着每日目标奋进' : '已达成今日阅读计划';

    ['bkHomeArcFill', 'bkModalArcFill'].forEach(function (id) {
      var arc = document.getElementById(id);
      if (!arc) return;
      arc.style.strokeDashoffset = String(offset);
      arc.style.opacity = today > 0 ? '1' : '0';
    });
  }

  function renderLibrary() {
    var books = getBooks();
    var grid = document.getElementById('bkLibGrid');
    grid.innerHTML = books.map(function (b) {
      return (
        '<div class="bk-lib-item" data-lib-book="' + b.id + '">' +
          '<div class="bk-lib-cover-wrap">' +
            buildCoverHtml(b) +
            '<div class="bk-lib-edit-cover" data-edit-cover="' + b.id + '">' +
              '<svg viewBox="0 0 24 24"><path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>' +
            '</div>' +
          '</div>' +
          '<div class="bk-lib-name">' + escapeHtml(b.title) + '</div>' +
          '<div class="bk-lib-author">' + escapeHtml(b.author || '本地导入') + '</div>' +
        '</div>'
      );
    }).join('');
  }

  function loadCustomCovers() {
    var books = getBooks();
    return Promise.all(books.map(function (b) {
      return PhoneDB.get('book_cover_' + b.id).then(function (url) {
        if (url) customCoverMap[b.id] = url;
      });
    }));
  }

  loadCustomCovers().then(function () {
    renderShelfAndGoal();
    renderLibrary();
  });

  // Tab 切换
  var bottomBar = document.getElementById('bkBottomBar');
  var headerTitle = document.getElementById('bkHeaderTitle');
  var importBtn = document.getElementById('bkImportBtn');

  root.querySelectorAll('.bk-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      root.querySelectorAll('.bk-tab').forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      var target = tab.getAttribute('data-bk-tab');
      var isLib = target === 'library';
      bottomBar.classList.toggle('is-library', isLib);
      headerTitle.textContent = isLib ? '书库' : '主页';
      importBtn.classList.toggle('show', isLib);
      document.getElementById('bkPanelHome').classList.toggle('active', !isLib);
      document.getElementById('bkPanelLibrary').classList.toggle('active', isLib);
    });
  });

  // 点击书架或书库书籍 -> 设为最近阅读（放到中间大位）
  root.addEventListener('click', function (e) {
    var editBtn = e.target.closest('[data-edit-cover]');
    if (editBtn) {
      e.stopPropagation();
      editingCoverBookId = editBtn.getAttribute('data-edit-cover');
      document.getElementById('bkInputCover').click();
      return;
    }
    var shelfBook = e.target.closest('[data-shelf-book]');
    if (shelfBook) {
      var sid = shelfBook.getAttribute('data-shelf-book');
      setRecentTop(sid);
      renderShelfAndGoal();
      var sb = getBooks().find(function (x) { return x.id === sid; });
      if (sb) showToast('已切换到《' + sb.title + '》（阅读器待开发）');
      return;
    }
    var libBook = e.target.closest('[data-lib-book]');
    if (libBook) {
      var lid = libBook.getAttribute('data-lib-book');
      setRecentTop(lid);
      renderShelfAndGoal();
      var lb = getBooks().find(function (x) { return x.id === lid; });
      if (lb) showToast('已将《' + lb.title + '》置顶到主页书架');
    }
  });

  document.getElementById('bkContinueBtn').addEventListener('click', function () {
    var title = document.getElementById('bkContinueTitle').textContent;
    showToast('《' + title + '》阅读器将在下一步开发');
  });

  // p2 目标弹窗
  var goalModal = document.getElementById('bkGoalModal');
  document.getElementById('bkOpenGoalModal').addEventListener('click', function () {
    renderShelfAndGoal();
    goalModal.classList.add('open');
  });
  document.getElementById('bkCloseGoalModal').addEventListener('click', function () {
    goalModal.classList.remove('open');
  });

  document.getElementById('bkShareBtn').addEventListener('click', function () {
    var goal = getGoalMinutes();
    var today = getTodayMinutes();
    var text = '今日阅读进度：' + today + ' / ' + goal + ' 分钟';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showToast('已复制阅读进度');
      }).catch(function () {
        showToast(text);
      });
    } else {
      showToast(text);
    }
  });

  // 调整目标弹窗
  var adjustModal = document.getElementById('bkAdjustModal');
  function syncAdjustUI() {
    document.getElementById('bkStepVal').textContent = tempGoalMinutes + ' 分钟';
    document.querySelectorAll('#bkPresets .bk-preset-chip').forEach(function (chip) {
      var m = parseInt(chip.getAttribute('data-min'), 10);
      chip.classList.toggle('active', m === tempGoalMinutes);
    });
  }

  document.getElementById('bkOpenAdjustModal').addEventListener('click', function () {
    tempGoalMinutes = getGoalMinutes();
    syncAdjustUI();
    adjustModal.classList.add('open');
  });
  document.getElementById('bkCloseAdjustModal').addEventListener('click', function () {
    adjustModal.classList.remove('open');
  });
  document.getElementById('bkStepMinus').addEventListener('click', function () {
    tempGoalMinutes = Math.max(5, tempGoalMinutes - 5);
    syncAdjustUI();
  });
  document.getElementById('bkStepPlus').addEventListener('click', function () {
    tempGoalMinutes = Math.min(240, tempGoalMinutes + 5);
    syncAdjustUI();
  });
  document.getElementById('bkPresets').addEventListener('click', function (e) {
    var chip = e.target.closest('.bk-preset-chip');
    if (!chip) return;
    tempGoalMinutes = parseInt(chip.getAttribute('data-min'), 10);
    syncAdjustUI();
  });
  document.getElementById('bkSaveGoalBtn').addEventListener('click', function () {
    localStorage.setItem('phone_books_goal_min', String(tempGoalMinutes));
    adjustModal.classList.remove('open');
    renderShelfAndGoal();
    showToast('每日目标已设为 ' + tempGoalMinutes + ' 分钟');
  });

  // 自定义封面上传
  document.getElementById('bkInputCover').addEventListener('change', function () {
    var file = this.files && this.files[0];
    if (!file || !editingCoverBookId) return;
    var bid = editingCoverBookId;
    var reader = new FileReader();
    reader.onload = function () {
      var url = reader.result;
      customCoverMap[bid] = url;
      PhoneDB.set('book_cover_' + bid, url);
      renderShelfAndGoal();
      renderLibrary();
      showToast('封面已更新');
    };
    reader.readAsDataURL(file);
    this.value = '';
  });

  // 导入本地 TXT
  importBtn.addEventListener('click', function () {
    document.getElementById('bkInputTxt').click();
  });

  document.getElementById('bkInputTxt').addEventListener('change', function () {
    var file = this.files && this.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var id = 'bk_local_' + Date.now();
      var title = file.name.replace(/\.txt$/i, '');
      var books = getBooks();
      books.unshift({
        id: id,
        title: title,
        author: '本地导入',
        cover: ''
      });
      saveBooks(books);
      PhoneDB.set('book_text_' + id, reader.result || '');
      setRecentTop(id);
      renderShelfAndGoal();
      renderLibrary();
      showToast('已导入《' + title + '》');
    };
    reader.readAsText(file, 'utf-8');
    this.value = '';
  });
})();