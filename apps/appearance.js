(function () {
  var root = document.getElementById('app-appearance');
  if (!root) return;

  var APPS_LIST = [
    { id: 'appearance', name: '外观', emoji: '🎨', bg: 'bg-3' },
    { id: 'api', name: 'API', emoji: '🔌', bg: 'bg-3' },
    { id: 'books', name: '图书', emoji: '📖', bg: 'bg-3' },
    { id: 'music', name: '音乐', emoji: '🎵', bg: 'bg-3' },
    { id: 'archive', name: '档案', emoji: '🗂️', bg: 'bg-3' },
    { id: 'presets', name: '预设', emoji: '📁', bg: 'bg-3' },
    { id: 'lorebook', name: '世界书', emoji: '📘', bg: 'bg-3' },
    { id: 'memory', name: '记忆', emoji: '🧠', bg: 'bg-3' },
    { id: 'takeout', name: '小团外卖', emoji: '🛍️', bg: 'bg-3' },
    { id: 'converter', name: '转换器', emoji: '🔄', bg: 'bg-3' },
    { id: 'offline', name: '线下', emoji: '📍', bg: 'bg-3' },
    { id: 'beautify', name: '美化', emoji: '✨', bg: 'bg-3' },
    { id: 'photos', name: '照片', emoji: '🖼️', bg: 'bg-3' },
    { id: 'settings', name: '设置', emoji: '⚙️', bg: 'bg-3' },
    { id: 'appstore', name: 'App Store', emoji: '🅰️', bg: 'bg-3' },
    { id: 'games', name: '游戏', emoji: '🎮', bg: 'bg-3' },
    { id: 'shopping', name: '购物', emoji: '🛒', bg: 'bg-3' },
    { id: 'chat', name: 'Chat', emoji: '💬', bg: 'bg-3' },
    { id: 'netflix', name: 'Netflix', emoji: '🎬', bg: 'bg-3' },
    { id: 'imessage', name: 'iMessage', emoji: '💭', bg: 'bg-3' }
  ];

  root.innerHTML =
    '<div class="app-header">' +
      '<div class="app-back" data-close-app>' +
        '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>' +
      '</div>' +
    '</div>' +
    '<div class="app-body">' +
      '<div class="tab-panel active" id="panel-theme">' +
        '<div class="lg-card">' +
          '<div class="lg-row">' +
            '<div class="lg-row-main">' +
              '<div class="lg-label">开启锁屏</div>' +
              '<div class="lg-sub" id="lockStatusSub">已关闭</div>' +
            '</div>' +
            '<div class="lg-row-right">' +
              '<div class="mini-btn" id="btnPreviewLock" style="display:none;">预览</div>' +
              '<div class="lg-switch" id="switchLock"><div class="lg-switch-thumb"></div></div>' +
            '</div>' +
          '</div>' +
          '<div class="lg-row hidden" id="rowLockWall">' +
            '<div class="lg-row-main">' +
              '<div class="lg-label">锁屏壁纸</div>' +
              '<div class="lg-sub" id="lockWallSub">默认纯白（点击上传）</div>' +
            '</div>' +
            '<div class="lg-row-right">' +
              '<div class="mini-btn" id="resetLockWall" style="display:none;">恢复默认</div>' +
              '<div class="wall-thumb" id="thumbLockWall"></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="lg-card">' +
          '<div class="lg-row" id="rowHomeWall">' +
            '<div class="lg-row-main">' +
              '<div class="lg-label">桌面壁纸</div>' +
              '<div class="lg-sub" id="homeWallSub">默认纯白（点击上传）</div>' +
            '</div>' +
            '<div class="lg-row-right">' +
              '<div class="mini-btn" id="resetHomeWall" style="display:none;">恢复默认</div>' +
              '<div class="wall-thumb" id="thumbHomeWall"></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="lg-card">' +
          '<div class="lg-row lg-row-col">' +
            '<div class="lg-label">字体大小</div>' +
            '<div class="ios-size-row">' +
              '<span class="ios-size-a-sm">小</span>' +
              '<div class="ios-slider-box">' +
                '<div class="ios-slider-dots"><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>' +
                '<input type="range" class="ios-range" id="fontSizeRange" min="12" max="18" step="1" value="15">' +
              '</div>' +
              '<span class="ios-size-a-lg">大</span>' +
            '</div>' +
          '</div>' +
          '<div class="lg-row" id="rowFontToggle">' +
            '<div class="lg-row-main">' +
              '<div class="lg-label">字体</div>' +
              '<div class="lg-sub" id="fontActiveSub">系统默认</div>' +
            '</div>' +
            '<div class="lg-row-right">' +
              '<svg class="chevron" id="fontChevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg>' +
            '</div>' +
          '</div>' +
          '<div class="font-accordion" id="fontAccordion"></div>' +
        '</div>' +
      '</div>' +
      '<div class="tab-panel" id="panel-icons">' +
        '<div class="lg-card home-icon-card">' +
          '<div class="home-icon-head">' +
            '<div class="home-icon-title">主屏图标</div>' +
          '</div>' +
          '<div class="home-icon-desc">更换「添加到主屏幕」时显示的图标。</div>' +
          '<div class="home-icon-boxes">' +
            '<div class="home-icon-slot">' +
              '<div class="icon-upload-box" id="btnUploadHomeIcon">+</div>' +
              '<div class="home-icon-slot-label">上传</div>' +
            '</div>' +
            '<div class="home-icon-slot">' +
              '<div class="icon-default-box" id="boxDefaultHomeIcon">小手机<span class="icon-reset-badge" id="resetHomeIcon">×</span></div>' +
              '<div class="home-icon-slot-label" id="labelHomeIcon">默认</div>' +
            '</div>' +
          '</div>' +
          '<div class="home-icon-note">换完需要重新「添加到主屏幕」才会在桌面生效。</div>' +
        '</div>' +
        '<div class="icon-sec-row">' +
          '<div class="icon-sec-title" id="iconSecTitle">应用图标</div>' +
          '<div class="icon-sec-actions">' +
            '<div class="icon-pack-btn" id="btnImportIconPack">导入 PNG</div>' +
            '<div class="icon-pack-btn" id="btnExportIconPack">导出 PNG</div>' +
          '</div>' +
        '</div>' +
        '<div class="lg-card">' +
          '<div class="icon-grid" id="iconGrid"></div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="lg-bottom-bar" id="lgBottomBar">' +
      '<div class="lg-tab-indicator"></div>' +
      '<div class="lg-tab active" data-tab="theme">主题</div>' +
      '<div class="lg-tab" data-tab="icons">图标</div>' +
    '</div>' +
    '<div class="icon-pack-modal" id="iconPackModal">' +
      '<div class="icon-pack-sheet">' +
        '<div class="icon-pack-sheet-title">图标包已生成（PNG）</div>' +
        '<div class="icon-pack-sheet-tip">长按下方图片即可存进相册；发给别人后，对方点「导入 PNG」就能一键换成同款图标。</div>' +
        '<div class="icon-pack-preview-wrap">' +
          '<img class="icon-pack-preview-img" id="iconPackPreviewImg" alt="图标包">' +
        '</div>' +
        '<div class="icon-pack-sheet-btns">' +
          '<div class="icon-pack-action" id="btnCloseIconPack">关闭</div>' +
          '<div class="icon-pack-action primary" id="btnSaveIconPack">保存 / 分享</div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<input type="file" id="inputLockWall" accept="image/*" style="display:none;">' +
    '<input type="file" id="inputHomeWall" accept="image/*" style="display:none;">' +
    '<input type="file" id="inputFont" accept=".ttf,.otf,.woff,.woff2,font/*" multiple style="display:none;">' +
    '<input type="file" id="inputHomeScreenIcon" accept="image/*" style="display:none;">' +
    '<input type="file" id="inputAppIcon" accept="image/*" style="display:none;">' +
    '<input type="file" id="inputIconPack" accept="image/*" style="display:none;">';

  var bottomBar = document.getElementById('lgBottomBar');
  var backBtn = root.querySelector('.app-back');
  var tabs = root.querySelectorAll('.lg-tab');
  var iconTabLoaded = false;

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      var target = tab.getAttribute('data-tab');
      bottomBar.classList.toggle('is-icons', target === 'icons');
      if (backBtn) backBtn.style.display = target === 'icons' ? 'none' : '';
      root.querySelectorAll('.tab-panel').forEach(function (p) {
        p.classList.toggle('active', p.id === 'panel-' + target);
      });
      if (target === 'icons' && !iconTabLoaded) {
        iconTabLoaded = true;
        PhoneDB.get('home_screen_icon').then(syncHomeScreenIconUI);
        renderIconGrid();
      }
    });
  });

  var switchLock = document.getElementById('switchLock');
  var rowLockWall = document.getElementById('rowLockWall');
  var lockStatusSub = document.getElementById('lockStatusSub');
  var btnPreviewLock = document.getElementById('btnPreviewLock');

  function syncLockUI(enabled) {
    switchLock.classList.toggle('on', enabled);
    rowLockWall.classList.toggle('hidden', !enabled);
    btnPreviewLock.style.display = enabled ? 'inline-block' : 'none';
    lockStatusSub.textContent = enabled ? '已开启' : '已关闭';
  }

  var lockOn = localStorage.getItem('phone_lock_enabled') === '1';
  syncLockUI(lockOn);

  switchLock.addEventListener('click', function () {
    lockOn = !lockOn;
    localStorage.setItem('phone_lock_enabled', lockOn ? '1' : '0');
    syncLockUI(lockOn);
  });

  btnPreviewLock.addEventListener('click', function (e) {
    e.stopPropagation();
    if (window.showLockScreen) window.showLockScreen();
  });

  var thumbLockWall = document.getElementById('thumbLockWall');
  var resetLockWall = document.getElementById('resetLockWall');
  var lockWallSub = document.getElementById('lockWallSub');
  var inputLockWall = document.getElementById('inputLockWall');

  var thumbHomeWall = document.getElementById('thumbHomeWall');
  var resetHomeWall = document.getElementById('resetHomeWall');
  var homeWallSub = document.getElementById('homeWallSub');
  var inputHomeWall = document.getElementById('inputHomeWall');

  function updateWallThumb(thumb, resetBtn, subEl, dataUrl) {
    if (dataUrl) {
      thumb.style.backgroundImage = 'url("' + dataUrl + '")';
      resetBtn.style.display = 'inline-block';
      subEl.textContent = '已设置自定义壁纸';
    } else {
      thumb.style.backgroundImage = '';
      resetBtn.style.display = 'none';
      subEl.textContent = '默认纯白（点击上传）';
    }
  }

  PhoneDB.get('lock_wallpaper').then(function (val) {
    updateWallThumb(thumbLockWall, resetLockWall, lockWallSub, val);
  });
  PhoneDB.get('home_wallpaper').then(function (val) {
    updateWallThumb(thumbHomeWall, resetHomeWall, homeWallSub, val);
  });

  rowLockWall.addEventListener('click', function (e) {
    if (e.target === resetLockWall) return;
    inputLockWall.click();
  });
  document.getElementById('rowHomeWall').addEventListener('click', function (e) {
    if (e.target === resetHomeWall) return;
    inputHomeWall.click();
  });

  function readImageAsDataUrl(file, cb) {
    var reader = new FileReader();
    reader.onload = function () { cb(reader.result); };
    reader.readAsDataURL(file);
  }

  inputLockWall.addEventListener('change', function () {
    var file = this.files && this.files[0];
    if (!file) return;
    readImageAsDataUrl(file, function (url) {
      PhoneDB.set('lock_wallpaper', url);
      if (window.applyLockWallpaper) window.applyLockWallpaper(url);
      updateWallThumb(thumbLockWall, resetLockWall, lockWallSub, url);
    });
    this.value = '';
  });

  resetLockWall.addEventListener('click', function (e) {
    e.stopPropagation();
    PhoneDB.del('lock_wallpaper');
    if (window.applyLockWallpaper) window.applyLockWallpaper('');
    updateWallThumb(thumbLockWall, resetLockWall, lockWallSub, '');
  });

  inputHomeWall.addEventListener('change', function () {
    var file = this.files && this.files[0];
    if (!file) return;
    readImageAsDataUrl(file, function (url) {
      PhoneDB.set('home_wallpaper', url);
      if (window.applyHomeWallpaper) window.applyHomeWallpaper(url);
      updateWallThumb(thumbHomeWall, resetHomeWall, homeWallSub, url);
    });
    this.value = '';
  });

  resetHomeWall.addEventListener('click', function (e) {
    e.stopPropagation();
    PhoneDB.del('home_wallpaper');
    if (window.applyHomeWallpaper) window.applyHomeWallpaper('');
    updateWallThumb(thumbHomeWall, resetHomeWall, homeWallSub, '');
  });

  var fontSizeRange = document.getElementById('fontSizeRange');
  var savedSize = localStorage.getItem('phone_font_size') || '15';
  fontSizeRange.value = savedSize;
  document.documentElement.style.setProperty('--app-font-size', savedSize + 'px');

  fontSizeRange.addEventListener('input', function () {
    var v = this.value;
    localStorage.setItem('phone_font_size', v);
    document.documentElement.style.setProperty('--app-font-size', v + 'px');
  });

  var rowFontToggle = document.getElementById('rowFontToggle');
  var fontChevron = document.getElementById('fontChevron');
  var fontAccordion = document.getElementById('fontAccordion');
  var fontActiveSub = document.getElementById('fontActiveSub');
  var inputFont = document.getElementById('inputFont');

  function getFontsList() {
    try { return JSON.parse(localStorage.getItem('phone_fonts_list') || '[]'); }
    catch (e) { return []; }
  }
  function saveFontsList(list) {
    localStorage.setItem('phone_fonts_list', JSON.stringify(list));
  }

  function renderFontList() {
    var list = getFontsList();
    var activeId = localStorage.getItem('phone_active_font_id') || '';
    var activeItem = list.find(function (f) { return f.id === activeId; });
    fontActiveSub.textContent = activeItem ? activeItem.name : '系统默认';

    var html =
      '<div class="font-item ' + (!activeId ? 'active' : '') + '" data-font-id="">' +
        '<div class="font-item-name">系统默认</div>' +
        '<div class="font-item-actions"><span class="font-check">✓</span></div>' +
      '</div>';

    list.forEach(function (f) {
      html +=
        '<div class="font-item ' + (activeId === f.id ? 'active' : '') + '" data-font-id="' + f.id + '">' +
          '<div class="font-item-name">' + f.name + '</div>' +
          '<div class="font-item-actions">' +
            '<span class="font-del" data-del-font="' + f.id + '">删除</span>' +
            '<span class="font-check">✓</span>' +
          '</div>' +
        '</div>';
    });

    html += '<div class="font-add-btn" id="btnAddFont">+ 上传字体（ttf / otf / woff）</div>';
    fontAccordion.innerHTML = html;
  }

  renderFontList();

  rowFontToggle.addEventListener('click', function () {
    var isOpen = fontAccordion.classList.toggle('open');
    fontChevron.classList.toggle('open', isOpen);
  });

  fontAccordion.addEventListener('click', function (e) {
    if (e.target.id === 'btnAddFont') {
      inputFont.click();
      return;
    }
    var delId = e.target.getAttribute('data-del-font');
    if (delId) {
      e.stopPropagation();
      var list = getFontsList().filter(function (f) { return f.id !== delId; });
      saveFontsList(list);
      PhoneDB.del('font_' + delId);
      if (localStorage.getItem('phone_active_font_id') === delId) {
        localStorage.removeItem('phone_active_font_id');
        if (window.applyCustomFont) window.applyCustomFont('');
      }
      renderFontList();
      return;
    }
    var item = e.target.closest('.font-item');
    if (item) {
      var fid = item.getAttribute('data-font-id');
      if (!fid) {
        localStorage.removeItem('phone_active_font_id');
        if (window.applyCustomFont) window.applyCustomFont('');
        renderFontList();
      } else {
        localStorage.setItem('phone_active_font_id', fid);
        PhoneDB.get('font_' + fid).then(function (buf) {
          if (buf && window.applyCustomFont) window.applyCustomFont(buf, fid);
          renderFontList();
        });
      }
    }
  });

  inputFont.addEventListener('change', function () {
    var files = Array.prototype.slice.call(this.files || []);
    if (!files.length) return;
    var list = getFontsList();
    var chain = Promise.resolve();
    files.forEach(function (file, idx) {
      chain = chain.then(function () {
        return file.arrayBuffer().then(function (buf) {
          var id = 'f_' + Date.now() + '_' + idx;
          list.push({ id: id, name: file.name });
          PhoneDB.set('font_' + id, buf);
          localStorage.setItem('phone_active_font_id', id);
          if (window.applyCustomFont) window.applyCustomFont(buf, id);
        });
      });
    });
    chain.then(function () {
      saveFontsList(list);
      renderFontList();
    });
    this.value = '';
  });

  var boxDefaultHomeIcon = document.getElementById('boxDefaultHomeIcon');
  var labelHomeIcon = document.getElementById('labelHomeIcon');
  var resetHomeIcon = document.getElementById('resetHomeIcon');
  var inputHomeScreenIcon = document.getElementById('inputHomeScreenIcon');

  function syncHomeScreenIconUI(url) {
    if (url) {
      boxDefaultHomeIcon.style.backgroundImage = 'url("' + url + '")';
      boxDefaultHomeIcon.classList.add('has-img');
      labelHomeIcon.textContent = '已设置';
    } else {
      boxDefaultHomeIcon.style.backgroundImage = '';
      boxDefaultHomeIcon.classList.remove('has-img');
      labelHomeIcon.textContent = '默认';
    }
  }

  document.getElementById('btnUploadHomeIcon').addEventListener('click', function () {
    inputHomeScreenIcon.click();
  });

  inputHomeScreenIcon.addEventListener('change', function () {
    var file = this.files && this.files[0];
    if (!file) return;
    readImageAsDataUrl(file, function (url) {
      PhoneDB.set('home_screen_icon', url);
      if (window.applyHomeScreenIcon) window.applyHomeScreenIcon(url);
      syncHomeScreenIconUI(url);
    });
    this.value = '';
  });

  resetHomeIcon.addEventListener('click', function (e) {
    e.stopPropagation();
    PhoneDB.del('home_screen_icon');
    if (window.applyHomeScreenIcon) window.applyHomeScreenIcon('');
    syncHomeScreenIconUI('');
  });

  var iconGrid = document.getElementById('iconGrid');
  var inputAppIcon = document.getElementById('inputAppIcon');
  var editingAppId = '';

  function setGridBoxPreview(box, app, url) {
    if (url) {
      box.style.backgroundImage = 'url("' + url + '")';
      box.style.fontSize = '0';
      box.classList.add('has-img');
    } else {
      box.style.backgroundImage = '';
      box.style.fontSize = '';
      box.classList.remove('has-img');
    }
  }

  function renderIconGrid() {
    var html = '';
    APPS_LIST.forEach(function (app) {
      html +=
        '<div class="icon-grid-item" data-icon-app="' + app.id + '">' +
          '<div class="icon-grid-box ' + app.bg + '" id="gridIcon-' + app.id + '">' +
            app.emoji +
            '<span class="icon-reset-badge" data-reset-icon="' + app.id + '">×</span>' +
          '</div>' +
          '<div class="icon-grid-name">' + app.name + '</div>' +
        '</div>';
    });
    iconGrid.innerHTML = html;

    APPS_LIST.forEach(function (app) {
      PhoneDB.get('icon_' + app.id).then(function (url) {
        var box = document.getElementById('gridIcon-' + app.id);
        if (box) setGridBoxPreview(box, app, url);
      });
    });
  }

  iconGrid.addEventListener('click', function (e) {
    var resetId = e.target.getAttribute('data-reset-icon');
    if (resetId) {
      e.stopPropagation();
      PhoneDB.del('icon_' + resetId);
      if (window.applyAppIcon) window.applyAppIcon(resetId, '');
      var box = document.getElementById('gridIcon-' + resetId);
      var appObj = APPS_LIST.find(function (a) { return a.id === resetId; });
      if (box) setGridBoxPreview(box, appObj, '');
      return;
    }
    var item = e.target.closest('.icon-grid-item');
    if (item) {
      editingAppId = item.getAttribute('data-icon-app');
      inputAppIcon.click();
    }
  });

  inputAppIcon.addEventListener('change', function () {
    var file = this.files && this.files[0];
    if (!file || !editingAppId) return;
    var targetId = editingAppId;
    readImageAsDataUrl(file, function (url) {
      PhoneDB.set('icon_' + targetId, url);
      if (window.applyAppIcon) window.applyAppIcon(targetId, url);
      var box = document.getElementById('gridIcon-' + targetId);
      var appObj = APPS_LIST.find(function (a) { return a.id === targetId; });
      if (box) setGridBoxPreview(box, appObj, url);
    });
    this.value = '';
  });

  /* ===== 一键导出 / 导入整张 PNG 图标包（4×5 固定网格） ===== */
  var PACK_COLS = 4;
  var PACK_ROWS = 5;
  var EXPORT_CELL = 256;
  var IMPORT_CELL = 192;

  var btnExportIconPack = document.getElementById('btnExportIconPack');
  var btnImportIconPack = document.getElementById('btnImportIconPack');
  var inputIconPack = document.getElementById('inputIconPack');
  var iconSecTitle = document.getElementById('iconSecTitle');

  var iconPackModal = document.getElementById('iconPackModal');
  var iconPackPreviewImg = document.getElementById('iconPackPreviewImg');
  var btnCloseIconPack = document.getElementById('btnCloseIconPack');
  var btnSaveIconPack = document.getElementById('btnSaveIconPack');
  var lastExportDataUrl = '';
  var lastExportBlob = null;

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error('load failed')); };
      img.src = src;
    });
  }

  function drawCoverImage(ctx, img, dx, dy, dw, dh) {
    var iw = img.naturalWidth || img.width;
    var ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;
    var scale = Math.max(dw / iw, dh / ih);
    var sw = dw / scale;
    var sh = dh / scale;
    var sx = (iw - sw) / 2;
    var sy = (ih - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  }

  function drawDefaultIconTile(ctx, app, dx, dy, size) {
    ctx.save();
    ctx.fillStyle = '#e5e5ea';
    ctx.fillRect(dx, dy, size, size);
    ctx.fillStyle = '#111111';
    ctx.font = Math.round(size * 0.48) + 'px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(app.emoji, dx + size / 2, dy + size / 2 + size * 0.03);
    ctx.restore();
  }

  btnExportIconPack.addEventListener('click', function () {
    btnExportIconPack.textContent = '生成中...';
    var canvas = document.createElement('canvas');
    canvas.width = PACK_COLS * EXPORT_CELL;
    canvas.height = PACK_ROWS * EXPORT_CELL;
    var ctx = canvas.getContext('2d');

    Promise.all(APPS_LIST.map(function (app) {
      return PhoneDB.get('icon_' + app.id);
    })).then(function (urls) {
      return Promise.all(APPS_LIST.map(function (app, idx) {
        var col = idx % PACK_COLS;
        var row = Math.floor(idx / PACK_COLS);
        var dx = col * EXPORT_CELL;
        var dy = row * EXPORT_CELL;
        var url = urls[idx];
        if (!url) {
          drawDefaultIconTile(ctx, app, dx, dy, EXPORT_CELL);
          return Promise.resolve();
        }
        return loadImage(url).then(function (img) {
          drawCoverImage(ctx, img, dx, dy, EXPORT_CELL, EXPORT_CELL);
        }).catch(function () {
          drawDefaultIconTile(ctx, app, dx, dy, EXPORT_CELL);
        });
      }));
    }).then(function () {
      lastExportDataUrl = canvas.toDataURL('image/png');
      iconPackPreviewImg.src = lastExportDataUrl;
      iconPackModal.classList.add('open');
      btnExportIconPack.textContent = '导出 PNG';
      if (canvas.toBlob) {
        canvas.toBlob(function (blob) { lastExportBlob = blob; }, 'image/png');
      } else {
        lastExportBlob = null;
      }
    }).catch(function () {
      btnExportIconPack.textContent = '导出 PNG';
    });
  });

  btnCloseIconPack.addEventListener('click', function () {
    iconPackModal.classList.remove('open');
  });

  iconPackModal.addEventListener('click', function (e) {
    if (e.target === iconPackModal) iconPackModal.classList.remove('open');
  });

  btnSaveIconPack.addEventListener('click', function () {
    if (!lastExportDataUrl) return;
    if (navigator.share && navigator.canShare && lastExportBlob) {
      var shareFile = new File([lastExportBlob], 'phone-icons.png', { type: 'image/png' });
      if (navigator.canShare({ files: [shareFile] })) {
        navigator.share({ files: [shareFile], title: '小手机图标包' }).catch(function () {});
        return;
      }
    }
    var a = document.createElement('a');
    a.href = lastExportDataUrl;
    a.download = 'phone-icons.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

  btnImportIconPack.addEventListener('click', function () {
    inputIconPack.click();
  });

  inputIconPack.addEventListener('change', function () {
    var file = this.files && this.files[0];
    if (!file) return;
    btnImportIconPack.textContent = '导入中...';

    var objUrl = URL.createObjectURL(file);
    loadImage(objUrl).then(function (img) {
      URL.revokeObjectURL(objUrl);
      var iw = img.naturalWidth || img.width;
      var ih = img.naturalHeight || img.height;
      var cellW = iw / PACK_COLS;
      var cellH = ih / PACK_ROWS;

      var tileCanvas = document.createElement('canvas');
      tileCanvas.width = IMPORT_CELL;
      tileCanvas.height = IMPORT_CELL;
      var tileCtx = tileCanvas.getContext('2d');

      var chain = Promise.resolve();
      APPS_LIST.forEach(function (app, idx) {
        var col = idx % PACK_COLS;
        var row = Math.floor(idx / PACK_COLS);
        var sx = col * cellW;
        var sy = row * cellH;
        tileCtx.clearRect(0, 0, IMPORT_CELL, IMPORT_CELL);
        tileCtx.drawImage(img, sx, sy, cellW, cellH, 0, 0, IMPORT_CELL, IMPORT_CELL);
        var tileUrl = tileCanvas.toDataURL('image/png');

        if (window.applyAppIcon) window.applyAppIcon(app.id, tileUrl);
        var box = document.getElementById('gridIcon-' + app.id);
        if (box) setGridBoxPreview(box, app, tileUrl);

        chain = chain.then(function () {
          return PhoneDB.set('icon_' + app.id, tileUrl);
        });
      });

      return chain;
    }).then(function () {
      btnImportIconPack.textContent = '导入 PNG';
      iconSecTitle.textContent = '应用图标（已导入 20 个）';
      setTimeout(function () {
        iconSecTitle.textContent = '应用图标';
      }, 2500);
    }).catch(function () {
      URL.revokeObjectURL(objUrl);
      btnImportIconPack.textContent = '导入 PNG';
    });
    this.value = '';
  });
})();