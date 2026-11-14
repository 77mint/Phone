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
        '<div class="icon-sec-row">' +
          '<div class="icon-sec-title" id="iconPacksTitle">图标包</div>' +
          '<div class="icon-sec-actions">' +
            '<div class="icon-pack-btn" id="btnSaveCurrentPack">保存当前</div>' +
            '<div class="icon-pack-btn" id="btnAddPackFile">+ 上传</div>' +
          '</div>' +
        '</div>' +
        '<div class="lg-card" id="iconPacksCard"></div>' +
        '<div class="lg-card">' +
          '<div class="icon-clear-btn" id="btnClearAllIcons">一键清空图标</div>' +
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
    '<input type="file" id="inputIconPack" accept="image/*" style="display:none;">' +
    '<input type="file" id="inputAddPackFile" accept="image/*" style="display:none;">';

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
        renderIconPacks();
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

  /* ===== 一键导出 / 导入整张淡灰 PNG 图标包（4×5 固定网格） ===== */
  var PACK_COLS = 4;
  var PACK_ROWS = 5;
  var EXPORT_CELL = 200;
  var EXPORT_GAP = 36;
  var EXPORT_PAD = 48;
  var EXPORT_RADIUS = 44;
  var EXPORT_W = EXPORT_PAD * 2 + PACK_COLS * EXPORT_CELL + (PACK_COLS - 1) * EXPORT_GAP;
  var EXPORT_H = EXPORT_PAD * 2 + PACK_ROWS * EXPORT_CELL + (PACK_ROWS - 1) * EXPORT_GAP;
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

  function traceRoundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
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

  function drawRoundedTile(ctx, dx, dy, size, r, drawContent) {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 5;
    traceRoundRect(ctx, dx, dy, size, size, r);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();

    ctx.save();
    traceRoundRect(ctx, dx, dy, size, size, r);
    ctx.clip();
    drawContent();
    ctx.restore();
  }

  function drawDefaultIconTile(ctx, app, dx, dy, size) {
    drawRoundedTile(ctx, dx, dy, size, EXPORT_RADIUS, function () {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(dx, dy, size, size);
      ctx.fillStyle = '#111111';
      ctx.font = Math.round(size * 0.46) + 'px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(app.emoji, dx + size / 2, dy + size / 2 + size * 0.03);
    });
  }

  function buildCurrentPackCanvas() {
    var canvas = document.createElement('canvas');
    canvas.width = EXPORT_W;
    canvas.height = EXPORT_H;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f2f2f7';
    ctx.fillRect(0, 0, EXPORT_W, EXPORT_H);

    return Promise.all(APPS_LIST.map(function (app) {
      return PhoneDB.get('icon_' + app.id);
    })).then(function (urls) {
      return Promise.all(APPS_LIST.map(function (app, idx) {
        var col = idx % PACK_COLS;
        var row = Math.floor(idx / PACK_COLS);
        var dx = EXPORT_PAD + col * (EXPORT_CELL + EXPORT_GAP);
        var dy = EXPORT_PAD + row * (EXPORT_CELL + EXPORT_GAP);
        var url = urls[idx];
        if (!url) {
          drawDefaultIconTile(ctx, app, dx, dy, EXPORT_CELL);
          return Promise.resolve();
        }
        return loadImage(url).then(function (img) {
          drawRoundedTile(ctx, dx, dy, EXPORT_CELL, EXPORT_RADIUS, function () {
            drawCoverImage(ctx, img, dx, dy, EXPORT_CELL, EXPORT_CELL);
          });
        }).catch(function () {
          drawDefaultIconTile(ctx, app, dx, dy, EXPORT_CELL);
        });
      }));
    }).then(function () {
      return canvas;
    });
  }

  function isPaddedGrayPack(img) {
    var iw = img.naturalWidth || img.width;
    var ih = img.naturalHeight || img.height;
    if (Math.abs((iw / ih) - (EXPORT_W / EXPORT_H)) < 0.008) return true;
    try {
      var probe = document.createElement('canvas');
      probe.width = 4;
      probe.height = 4;
      var pctx = probe.getContext('2d');
      pctx.drawImage(img, 0, 0, 4, 4, 0, 0, 4, 4);
      var d = pctx.getImageData(1, 1, 1, 1).data;
      return d[3] > 240 && d[0] >= 235 && d[1] >= 235 && d[2] >= 240;
    } catch (e) {
      return false;
    }
  }

  function applyPackFromImageSrc(src) {
    return loadImage(src).then(function (img) {
      var iw = img.naturalWidth || img.width;
      var ih = img.naturalHeight || img.height;
      var padded = isPaddedGrayPack(img);

      var padX = padded ? iw * (EXPORT_PAD / EXPORT_W) : 0;
      var padY = padded ? ih * (EXPORT_PAD / EXPORT_H) : 0;
      var gapX = padded ? iw * (EXPORT_GAP / EXPORT_W) : 0;
      var gapY = padded ? ih * (EXPORT_GAP / EXPORT_H) : 0;
      var cellW = padded ? iw * (EXPORT_CELL / EXPORT_W) : (iw / PACK_COLS);
      var cellH = padded ? ih * (EXPORT_CELL / EXPORT_H) : (ih / PACK_ROWS);

      var tileCanvas = document.createElement('canvas');
      tileCanvas.width = IMPORT_CELL;
      tileCanvas.height = IMPORT_CELL;
      var tileCtx = tileCanvas.getContext('2d');

      var chain = Promise.resolve();
      APPS_LIST.forEach(function (app, idx) {
        var col = idx % PACK_COLS;
        var row = Math.floor(idx / PACK_COLS);
        var sx = padX + col * (cellW + gapX);
        var sy = padY + row * (cellH + gapY);
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
    });
  }

  btnExportIconPack.addEventListener('click', function () {
    btnExportIconPack.textContent = '生成中...';
    buildCurrentPackCanvas().then(function (canvas) {
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
    applyPackFromImageSrc(objUrl).then(function () {
      URL.revokeObjectURL(objUrl);
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

  /* ===== 图标包存放区 & 一键清空 ===== */
  var iconPacksCard = document.getElementById('iconPacksCard');
  var iconPacksTitle = document.getElementById('iconPacksTitle');
  var btnSaveCurrentPack = document.getElementById('btnSaveCurrentPack');
  var btnAddPackFile = document.getElementById('btnAddPackFile');
  var inputAddPackFile = document.getElementById('inputAddPackFile');
  var btnClearAllIcons = document.getElementById('btnClearAllIcons');

  function getSavedPacks() {
    return PhoneDB.get('icon_packs_list').then(function (val) {
      return Array.isArray(val) ? val : [];
    });
  }

  function renderIconPacks() {
    getSavedPacks().then(function (packs) {
      if (!packs.length) {
        iconPacksCard.innerHTML = '<div class="icon-packs-empty">还没有存图标包，点右上角「保存当前」或「+ 上传」就能存进这里。</div>';
        return;
      }
      var html = '<div class="icon-packs-grid">';
      packs.forEach(function (p) {
        html +=
          '<div class="icon-pack-card" data-pack-id="' + p.id + '">' +
            '<div class="icon-pack-thumb" style="background-image:url(\'' + p.png + '\');">' +
              '<span class="icon-pack-del" data-del-pack="' + p.id + '">×</span>' +
            '</div>' +
            '<div class="icon-pack-name">' + p.name + '</div>' +
          '</div>';
      });
      html += '</div>';
      iconPacksCard.innerHTML = html;
    });
  }

  btnSaveCurrentPack.addEventListener('click', function () {
    getSavedPacks().then(function (packs) {
      var name = prompt('给这个图标包起个名字', '图标包 ' + (packs.length + 1));
      if (name === null) return;
      name = name.trim() || ('图标包 ' + (packs.length + 1));
      btnSaveCurrentPack.textContent = '保存中...';
      buildCurrentPackCanvas().then(function (canvas) {
        var png = canvas.toDataURL('image/png');
        packs.unshift({ id: 'pack_' + Date.now(), name: name, png: png });
        return PhoneDB.set('icon_packs_list', packs);
      }).then(function () {
        btnSaveCurrentPack.textContent = '保存当前';
        renderIconPacks();
      }).catch(function () {
        btnSaveCurrentPack.textContent = '保存当前';
      });
    });
  });

  btnAddPackFile.addEventListener('click', function () {
    inputAddPackFile.click();
  });

  inputAddPackFile.addEventListener('change', function () {
    var file = this.files && this.files[0];
    if (!file) return;
    btnAddPackFile.textContent = '上传中...';
    readImageAsDataUrl(file, function (url) {
      getSavedPacks().then(function (packs) {
        var defaultName = file.name.replace(/\.[^.]+$/, '') || ('图标包 ' + (packs.length + 1));
        var name = prompt('给这个图标包起个名字', defaultName);
        if (name === null) {
          btnAddPackFile.textContent = '+ 上传';
          return;
        }
        name = name.trim() || defaultName;
        packs.unshift({ id: 'pack_' + Date.now(), name: name, png: url });
        return PhoneDB.set('icon_packs_list', packs).then(function () {
          btnAddPackFile.textContent = '+ 上传';
          renderIconPacks();
        });
      }).catch(function () {
        btnAddPackFile.textContent = '+ 上传';
      });
    });
    this.value = '';
  });

  iconPacksCard.addEventListener('click', function (e) {
    var delId = e.target.getAttribute('data-del-pack');
    if (delId) {
      e.stopPropagation();
      getSavedPacks().then(function (packs) {
        var next = packs.filter(function (p) { return p.id !== delId; });
        return PhoneDB.set('icon_packs_list', next);
      }).then(renderIconPacks);
      return;
    }
    var card = e.target.closest('.icon-pack-card');
    if (!card) return;
    var pid = card.getAttribute('data-pack-id');
    getSavedPacks().then(function (packs) {
      var found = packs.find(function (p) { return p.id === pid; });
      if (!found) return;
      iconPacksTitle.textContent = '图标包（应用中...）';
      return applyPackFromImageSrc(found.png).then(function () {
        iconPacksTitle.textContent = '图标包（已应用：' + found.name + '）';
        setTimeout(function () {
          iconPacksTitle.textContent = '图标包';
        }, 2500);
      });
    });
  });

  btnClearAllIcons.addEventListener('click', function () {
    if (!confirm('确定要清空所有应用图标，恢复成默认图标吗？\n（已保存的图标包不会被删掉）')) return;
    var chain = Promise.resolve();
    APPS_LIST.forEach(function (app) {
      if (window.applyAppIcon) window.applyAppIcon(app.id, '');
      var box = document.getElementById('gridIcon-' + app.id);
      if (box) setGridBoxPreview(box, app, '');
      chain = chain.then(function () {
        return PhoneDB.del('icon_' + app.id);
      });
    });
    chain.then(function () {
      iconSecTitle.textContent = '应用图标（已清空）';
      setTimeout(function () {
        iconSecTitle.textContent = '应用图标';
      }, 2500);
    });
  });
})();