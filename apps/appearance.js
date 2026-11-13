(function () {
  var root = document.getElementById('app-appearance');
  if (!root) return;

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
        '<div class="lg-card"><div class="empty-tip">图标样式暂未设置</div></div>' +
      '</div>' +
    '</div>' +
    '<div class="lg-bottom-bar" id="lgBottomBar">' +
      '<div class="lg-tab-indicator"></div>' +
      '<div class="lg-tab active" data-tab="theme">主题</div>' +
      '<div class="lg-tab" data-tab="icons">图标</div>' +
    '</div>' +
    '<input type="file" id="inputLockWall" accept="image/*" style="display:none;">' +
    '<input type="file" id="inputHomeWall" accept="image/*" style="display:none;">' +
    '<input type="file" id="inputFont" accept=".ttf,.otf,.woff,.woff2,font/*" multiple style="display:none;">';

  var bottomBar = document.getElementById('lgBottomBar');
  var tabs = root.querySelectorAll('.lg-tab');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      var target = tab.getAttribute('data-tab');
      bottomBar.classList.toggle('is-icons', target === 'icons');
      root.querySelectorAll('.tab-panel').forEach(function (p) {
        p.classList.toggle('active', p.id === 'panel-' + target);
      });
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
})();