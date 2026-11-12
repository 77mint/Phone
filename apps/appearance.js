(function() {
  var lockEnabled = localStorage.getItem('lockEnabled') === 'true';
  var fontSize = parseInt(localStorage.getItem('fontSize')) || 16;
  
  var tabTheme = document.getElementById('tabTheme');
  var tabIcon = document.getElementById('tabIcon');
  var contentTheme = document.getElementById('contentTheme');
  var contentIcon = document.getElementById('contentIcon');
  
  var toggleLock = document.getElementById('toggleLock');
  var lockWallSection = document.getElementById('lockWallSection');
  var btnLockWall = document.getElementById('btnLockWall');
  var btnDeskWall = document.getElementById('btnDeskWall');
  var inputLockWall = document.getElementById('inputLockWall');
  var inputDeskWall = document.getElementById('inputDeskWall');
  
  var sliderFontSize = document.getElementById('sliderFontSize');
  var fontSizeValue = document.getElementById('fontSizeValue');
  var btnFont = document.getElementById('btnFont');
  var inputFont = document.getElementById('inputFont');
  
  function switchTab(tab) {
    if (tab === 'theme') {
      tabTheme.classList.add('active');
      tabIcon.classList.remove('active');
      contentTheme.classList.add('active');
      contentIcon.classList.remove('active');
    } else {
      tabIcon.classList.add('active');
      tabTheme.classList.remove('active');
      contentIcon.classList.add('active');
      contentTheme.classList.remove('active');
    }
  }
  
  tabTheme.addEventListener('click', function() { switchTab('theme'); });
  tabIcon.addEventListener('click', function() { switchTab('icon'); });
  
  function updateLockUI() {
    if (lockEnabled) {
      toggleLock.classList.add('on');
      lockWallSection.style.display = 'block';
    } else {
      toggleLock.classList.remove('on');
      lockWallSection.style.display = 'none';
    }
  }
  
  toggleLock.addEventListener('click', function() {
    lockEnabled = !lockEnabled;
    localStorage.setItem('lockEnabled', lockEnabled);
    updateLockUI();
  });
  
  btnLockWall.addEventListener('click', function() {
    inputLockWall.click();
  });
  
  inputLockWall.addEventListener('change', function(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      localStorage.setItem('lockWallpaper', ev.target.result);
      alert('锁屏壁纸已设置');
    };
    reader.readAsDataURL(file);
  });
  
  btnDeskWall.addEventListener('click', function() {
    inputDeskWall.click();
  });
  
  inputDeskWall.addEventListener('change', function(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      localStorage.setItem('deskWallpaper', ev.target.result);
      var wall = document.getElementById('wallpaper');
      wall.style.backgroundImage = 'url(' + ev.target.result + ')';
      alert('桌面壁纸已更新');
    };
    reader.readAsDataURL(file);
  });
  
  function updateFontSize(val) {
    fontSize = val;
    fontSizeValue.textContent = val;
    var track = sliderFontSize.querySelector('.slider-track');
    var percent = (val - 12) / (24 - 12) * 100;
    track.style.width = percent + '%';
    document.body.style.fontSize = val + 'px';
    localStorage.setItem('fontSize', val);
  }
  
  sliderFontSize.addEventListener('click', function(e) {
    var rect = this.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var percent = x / rect.width;
    var val = Math.round(12 + percent * (24 - 12));
    updateFontSize(val);
  });
  
  btnFont.addEventListener('click', function() {
    inputFont.click();
  });
  
  inputFont.addEventListener('change', function(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      var fontName = 'CustomFont';
      var style = document.createElement('style');
      style.textContent = '@font-face { font-family: "' + fontName + '"; src: url(' + ev.target.result + '); }';
      document.head.appendChild(style);
      document.body.style.fontFamily = fontName + ', -apple-system, sans-serif';
      localStorage.setItem('customFont', ev.target.result);
      alert('字体已应用');
    };
    reader.readAsDataURL(file);
  });
  
  updateLockUI();
  updateFontSize(fontSize);
  
  var savedDeskWall = localStorage.getItem('deskWallpaper');
  if (savedDeskWall) {
    document.getElementById('wallpaper').style.backgroundImage = 'url(' + savedDeskWall + ')';
  }
  
  var savedFont = localStorage.getItem('customFont');
  if (savedFont) {
    var fontName = 'CustomFont';
    var style = document.createElement('style');
    style.textContent = '@font-face { font-family: "' + fontName + '"; src: url(' + savedFont + '); }';
    document.head.appendChild(style);
    document.body.style.fontFamily = fontName + ', -apple-system, sans-serif';
  }
})();