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
          '<div class="lg-row">' +
            '<div class="lg-row-main">' +
              '<div class="lg-label">字体大小</div>' +
            '</div>' +
            '<div class="font-seg" id="fontSeg">' +
              '<div class="font-seg-btn" data-size="13">小</div>' +
              '<div class="font-seg-btn" data-size="15">中</div>' +
              '<div class="font-seg-btn" data-size="18">大</div>' +
            '</div>' +
          '</div>' +
          '<div class="lg-row" id="rowFontFile">' +
            '<div class="lg-row-main">' +
              '<div class="lg-label">字体</div>' +
              '<div class="lg-sub" id="fontNameSub">系统默认（点击上传 ttf/otf/woff）</div>' +
            '</div>' +
            '<div class="lg-row-right">' +
              '<div class="mini-btn" id="resetFont" style="display:none;">恢复默认</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="tab-panel" id="panel-icons">' +
        '<div class="lg-card"><div class="empty-tip">图标样式暂未设置</div></div>' +
      '</div>' +
    '</div>' +
    '<div class="lg-bottom-bar">' +
      '<div class="lg-tab active" data-tab="theme">主题</div>' +
      '<div class="lg-tab" data-tab="icons">图标</div>' +
    '</div>' +
    '<input type="file" id="inputLockWall" accept="image/*" style="display:none;">' +
    '<input type="file" id="inputHomeWall" accept="image/*" style="display:none;">' +
    '<input type="file" id="inputFont" accept=".ttf,.otf,.woff,.woff2,font/*" style="display:none;">';

  var tabs = root.querySelectorAll('.lg-tab');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      var target = tab.getAttribute('data-tab');
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

  var fontBtns = root.querySelectorAll('.font-seg-btn');
  var savedSize = localStorage.getItem('phone_font_size') || '15';
  if (savedSize !== '13' && savedSize !== '15' && savedSize !== '18') savedSize = '15';

  function syncFontSize(sz) {
    fontBtns.forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-size') === sz);
    });
    document.documentElement.style.setProperty('--app-font-size', sz + 'px');
  }
  syncFontSize(savedSize);

  fontBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var sz = btn.getAttribute('data-size');
      localStorage.setItem('phone_font_size', sz);
      syncFontSize(sz);
    });
  });

  var rowFontFile = document.getElementById('rowFontFile');
  var fontNameSub = document.getElementById('fontNameSub');
  var resetFont = document.getElementById('resetFont');
  var inputFont = document.getElementById('inputFont');

  function syncFontLabel(name) {
    if (name) {
      fontNameSub.textContent = name;
      resetFont.style.display = 'inline-block';
    } else {
      fontNameSub.textContent = '系统默认（点击上传 ttf/otf/woff）';
      resetFont.style.display = 'none';
    }
  }

  syncFontLabel(localStorage.getItem('phone_font_name') || '');

  rowFontFile.addEventListener('click', function (e) {
    if (e.target === resetFont) return;
    inputFont.click();
  });

  inputFont.addEventListener('change', function () {
    var file = this.files && this.files[0];
    if (!file) return;
    file.arrayBuffer().then(function (buf) {
      PhoneDB.set('custom_font', buf);
      localStorage.setItem('phone_font_name', file.name);
      syncFontLabel(file.name);
      if (window.applyCustomFont) window.applyCustomFont(buf);
    });
    this.value = '';
  });

  resetFont.addEventListener('click', function (e) {
    e.stopPropagation();
    PhoneDB.del('custom_font');
    localStorage.removeItem('phone_font_name');
    syncFontLabel('');
    document.documentElement.style.removeProperty('--app-font');
  });
})();