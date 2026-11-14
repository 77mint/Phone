var phone = document.getElementById('phone');

function fitPhone() {
  if (window.navigator.standalone !== true) {
    phone.style.height = '';
    return;
  }
  var portrait = window.matchMedia('(orientation: portrait)').matches;
  var screenH = portrait
    ? Math.max(screen.width, screen.height)
    : Math.min(screen.width, screen.height);
  phone.style.height = Math.max(window.innerHeight, screenH) + 'px';
}

fitPhone();
window.addEventListener('resize', fitPhone);
window.addEventListener('orientationchange', fitPhone);
window.addEventListener('pageshow', fitPhone);
setTimeout(fitPhone, 300);
setTimeout(fitPhone, 1000);

window.PhoneDB = (function () {
  var dbPromise = null;
  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      var req = indexedDB.open('XiaoShouJiDB', 1);
      req.onupgradeneeded = function () {
        req.result.createObjectStore('kv');
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
    return dbPromise;
  }
  return {
    get: function (key) {
      return open().then(function (db) {
        return new Promise(function (resolve) {
          var tx = db.transaction('kv', 'readonly');
          var req = tx.objectStore('kv').get(key);
          req.onsuccess = function () { resolve(req.result || ''); };
          req.onerror = function () { resolve(''); };
        });
      }).catch(function () { return ''; });
    },
    set: function (key, val) {
      return open().then(function (db) {
        return new Promise(function (resolve) {
          var tx = db.transaction('kv', 'readwrite');
          tx.oncomplete = function () { resolve(); };
          tx.onerror = function () { resolve(); };
          tx.objectStore('kv').put(val, key);
        });
      }).catch(function () {});
    },
    del: function (key) {
      return open().then(function (db) {
        return new Promise(function (resolve) {
          var tx = db.transaction('kv', 'readwrite');
          tx.oncomplete = function () { resolve(); };
          tx.onerror = function () { resolve(); };
          tx.objectStore('kv').delete(key);
        });
      }).catch(function () {});
    }
  };
})();

window.applyHomeWallpaper = function (url) {
  var wp = document.getElementById('wallpaper');
  if (wp) wp.style.backgroundImage = url ? 'url("' + url + '")' : '';
};

window.applyLockWallpaper = function (url) {
  var lwp = document.getElementById('lockWallpaper');
  if (lwp) lwp.style.backgroundImage = url ? 'url("' + url + '")' : '';
};

window.applyCustomFont = function (buf, familyId) {
  if (!buf) {
    document.documentElement.style.removeProperty('--app-font');
    return;
  }
  var name = familyId || 'CustomUserFont';
  try {
    var face = new FontFace(name, buf);
    face.load().then(function (loaded) {
      document.fonts.add(loaded);
      document.documentElement.style.setProperty('--app-font', '"' + name + '", -apple-system, "PingFang SC", sans-serif');
    }).catch(function () {});
  } catch (e) {}
};

window.applyAppIcon = function (appId, url) {
  var icons = document.querySelectorAll('.app[data-app="' + appId + '"] .app-icon');
  icons.forEach(function (el) {
    var svg = el.querySelector('svg');
    if (url) {
      el.style.background = 'url("' + url + '") center/cover no-repeat';
      if (svg) svg.style.display = 'none';
      el.classList.add('has-custom-icon');
    } else {
      var def = el.getAttribute('data-default-icon') || '';
      if (def) {
        el.style.background = 'url("' + def + '") center/cover no-repeat';
        if (svg) svg.style.display = 'none';
        el.classList.add('has-custom-icon');
      } else {
        el.style.background = '#ffffff';
        if (svg) svg.style.display = '';
        el.classList.remove('has-custom-icon');
      }
    }
  });
};

window.applyHomeScreenIcon = function (url) {
  var link = document.querySelector('link[rel="apple-touch-icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'apple-touch-icon';
    document.head.appendChild(link);
  }
  if (url) link.href = url;
  else link.removeAttribute('href');
};

(function initTheme() {
  var size = localStorage.getItem('phone_font_size');
  if (size) document.documentElement.style.setProperty('--app-font-size', size + 'px');
  PhoneDB.get('home_wallpaper').then(window.applyHomeWallpaper);
  PhoneDB.get('lock_wallpaper').then(window.applyLockWallpaper);
  PhoneDB.get('home_screen_icon').then(function (url) {
    if (url) window.applyHomeScreenIcon(url);
  });
  ['appearance', 'api', 'books', 'offline', 'archive', 'presets', 'lorebook', 'beautify', 'memory', 'takeout', 'appstore', 'games', 'shopping', 'chat', 'netflix', 'converter', 'imessage', 'photos', 'music', 'settings'].forEach(function (id) {
    PhoneDB.get('icon_' + id).then(function (url) {
      if (url) window.applyAppIcon(id, url);
    });
  });
  var activeFontId = localStorage.getItem('phone_active_font_id');
  if (activeFontId) {
    PhoneDB.get('font_' + activeFontId).then(function (buf) {
      if (buf) window.applyCustomFont(buf, activeFontId);
    });
  }
})();

(function initHomePages() {
  var pages = document.getElementById('homePages');
  var dots = document.querySelectorAll('#pageDots .page-dot');
  if (!pages || !dots.length) return;

  function syncDots() {
    var w = pages.clientWidth || 1;
    var idx = Math.round(pages.scrollLeft / w);
    dots.forEach(function (d, i) {
      d.classList.toggle('active', i === idx);
    });
  }

  pages.addEventListener('scroll', syncDots, { passive: true });
  dots.forEach(function (d) {
    d.addEventListener('click', function () {
      var idx = parseInt(d.getAttribute('data-page'), 10) || 0;
      pages.scrollTo({ left: idx * (pages.clientWidth || 0), behavior: 'smooth' });
    });
  });
})();

document.addEventListener('click', function (e) {
  var appBtn = e.target.closest('.app[data-app]');
  if (appBtn) {
    var id = 'app-' + appBtn.getAttribute('data-app');
    var screen = document.getElementById(id);
    if (screen && screen.children.length > 0) screen.classList.add('open');
    return;
  }
  var closeBtn = e.target.closest('[data-close-app]');
  if (closeBtn) {
    var parent = closeBtn.closest('.app-screen');
    if (parent) parent.classList.remove('open');
  }
});

(function initLockScreen() {
  var lock = document.getElementById('lockScreen');
  if (!lock) return;
  var lockTime = document.getElementById('lockTime');
  var lockDate = document.getElementById('lockDate');
  var weeks = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

  function updateClock() {
    var d = new Date();
    var hh = String(d.getHours()).padStart(2, '0');
    var mm = String(d.getMinutes()).padStart(2, '0');
    lockTime.textContent = hh + ':' + mm;
    lockDate.textContent = (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + weeks[d.getDay()];
  }
  updateClock();
  setInterval(updateClock, 10000);

  window.showLockScreen = function () {
    updateClock();
    lock.style.transform = '';
    lock.classList.add('active');
  };

  if (localStorage.getItem('phone_lock_enabled') === '1') {
    window.showLockScreen();
  }

  var startY = 0;
  var dy = 0;
  lock.addEventListener('touchstart', function (e) {
    startY = e.touches[0].clientY;
    dy = 0;
    lock.style.transition = 'none';
  }, { passive: true });

  lock.addEventListener('touchmove', function (e) {
    dy = e.touches[0].clientY - startY;
    if (dy < 0) lock.style.transform = 'translateY(' + dy + 'px)';
  }, { passive: true });

  lock.addEventListener('touchend', function () {
    lock.style.transition = 'transform 0.28s ease';
    if (dy < -70) {
      lock.style.transform = 'translateY(-100%)';
      setTimeout(function () {
        lock.classList.remove('active');
        lock.style.transform = '';
      }, 280);
    } else {
      lock.style.transform = '';
    }
  });
})();