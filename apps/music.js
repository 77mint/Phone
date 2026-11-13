(function () {
  var root = document.getElementById('app-music');
  if (!root) return;

  var ARTISTS = [
    { name: '陈粒', tag: '陈' },
    { name: '草东没有派对', tag: '草' },
    { name: '方大同', tag: '方' },
    { name: 'Taylor Swift', tag: 'T' },
    { name: 'Justin Bieber', tag: 'J' }
  ];

  var PLAYLISTS = [
    { title: '小半', sub: '陈粒 · 小梦大半', cls: 'mu-c1' },
    { title: 'Girl Power', sub: '流行女声精选', cls: 'mu-c2' },
    { title: '深夜耳机', sub: 'R&B / 氛围感', cls: 'mu-c3' },
    { title: '白噪音与钢琴', sub: '专注学习歌单', cls: 'mu-c4' }
  ];

  var NEW_SONGS = [
    { title: 'AGAIN!', sub: 'LUCY · 单曲', cls: 'mu-c5' },
    { title: '春风十里', sub: '鹿先森乐队', cls: 'mu-c6' },
    { title: 'Love Story', sub: 'Taylor Swift', cls: 'mu-c2' },
    { title: '特别的人', sub: '方大同', cls: 'mu-c1' }
  ];

  var CATEGORIES = [
    { name: '年度艺人', cls: 'mu-c1' },
    { name: '国语流行', cls: 'mu-c3' },
    { name: 'K-Pop', cls: 'mu-c2' },
    { name: '国际流行', cls: 'mu-c5' },
    { name: '粤语经典', cls: 'mu-c4' },
    { name: '嘻哈 / R&B', cls: 'mu-c6' }
  ];

  var artistsHtml = '';
  ARTISTS.forEach(function (a) {
    artistsHtml +=
      '<div class="mu-artist">' +
        '<div class="mu-artist-pic">' + a.tag + '</div>' +
        '<div class="mu-artist-name">' + a.name + '</div>' +
      '</div>';
  });

  function buildCards(list) {
    var s = '';
    list.forEach(function (item) {
      s +=
        '<div class="mu-card" data-song="' + item.title + ' - ' + item.sub + '">' +
          '<div class="mu-cover ' + item.cls + '">' + item.title + '</div>' +
          '<div class="mu-card-title">' + item.title + '</div>' +
          '<div class="mu-card-sub">' + item.sub + '</div>' +
        '</div>';
    });
    return s;
  }

  var catsHtml = '';
  CATEGORIES.forEach(function (c) {
    catsHtml += '<div class="mu-cat-card ' + c.cls + '">' + c.name + '</div>';
  });

  root.innerHTML =
    '<div class="mu-header">' +
      '<div class="app-back" data-close-app>' +
        '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>' +
      '</div>' +
    '</div>' +
    '<div class="mu-body">' +
      '<div class="mu-panel active" id="mu-panel-home">' +
        '<div class="mu-pills">' +
          '<div class="mu-pill active">全部</div>' +
          '<div class="mu-pill">音乐</div>' +
          '<div class="mu-pill">歌单</div>' +
          '<div class="mu-pill">电台</div>' +
        '</div>' +
        '<div class="mu-sec-title">推荐艺人</div>' +
        '<div class="mu-shelf">' + artistsHtml + '</div>' +
        '<div class="mu-sec-title">精选推荐歌单</div>' +
        '<div class="mu-shelf">' + buildCards(PLAYLISTS) + '</div>' +
        '<div class="mu-sec-title">每日新歌</div>' +
        '<div class="mu-shelf">' + buildCards(NEW_SONGS) + '</div>' +
      '</div>' +
      '<div class="mu-panel" id="mu-panel-search">' +
        '<div class="mu-search-wrap">' +
          '<div class="mu-big-title">搜索</div>' +
          '<div class="mu-search-box">' +
            '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>' +
            '<input type="text" class="mu-search-input" id="muSearchInput" placeholder="艺人、歌曲、歌词以及更多内容">' +
          '</div>' +
          '<div class="mu-cat-grid" id="muCatGrid">' + catsHtml + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="mu-panel" id="mu-panel-mine">' +
        '<div class="mu-mine-wrap">' +
          '<div class="mu-mine-card" id="muCardProfile">' +
            '<div class="mu-profile-row">' +
              '<div class="mu-avatar" id="muAvatar">♪</div>' +
              '<div class="mu-profile-info">' +
                '<div class="mu-profile-name" id="muUserName">点击设置昵称</div>' +
                '<div class="mu-profile-sub">编辑头像与资料</div>' +
              '</div>' +
              '<svg class="mu-arrow" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>' +
            '</div>' +
          '</div>' +
          '<div class="mu-mine-card" id="muCardLogin">' +
            '<div class="mu-login-row">' +
              '<div class="mu-profile-info">' +
                '<div class="mu-profile-name">登录网易云音乐</div>' +
                '<div class="mu-profile-sub" id="muLoginSub">未登录（可免登录听歌，或绑定接口同步歌单）</div>' +
              '</div>' +
              '<svg class="mu-arrow" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="mu-mini-player">' +
      '<div class="mu-mini-cover">♪</div>' +
      '<div class="mu-mini-info" id="muMiniTitle">未在播放</div>' +
      '<div class="mu-mini-ctrl" id="muMiniPlay">▶</div>' +
    '</div>' +
    '<div class="mu-bottom-bar tab-0" id="muBottomBar">' +
      '<div class="mu-tab-indicator"></div>' +
      '<div class="mu-tab active" data-mu-tab="home" data-idx="0">主页</div>' +
      '<div class="mu-tab" data-mu-tab="search" data-idx="1">搜索</div>' +
      '<div class="mu-tab" data-mu-tab="mine" data-idx="2">我的</div>' +
    '</div>' +
    '<div class="mu-modal" id="muProfileModal">' +
      '<div class="mu-sheet">' +
        '<div class="mu-sheet-head">' +
          '<div class="mu-sheet-btn" id="muCancelProfile">取消</div>' +
          '<div class="mu-sheet-title">编辑资料</div>' +
          '<div class="mu-sheet-btn primary" id="muSaveProfile">保存</div>' +
        '</div>' +
        '<div class="mu-sheet-avatar-wrap">' +
          '<div class="mu-sheet-avatar" id="muSheetAvatar">♪</div>' +
          '<div class="mu-profile-sub">点击头像从相册上传</div>' +
        '</div>' +
        '<div class="mu-input-card">' +
          '<input type="text" class="mu-text-input" id="muNameInput" placeholder="输入你的名字">' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<input type="file" id="muAvatarInput" accept="image/*" style="display:none;">';

  var bottomBar = document.getElementById('muBottomBar');
  var tabs = root.querySelectorAll('.mu-tab');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      var target = tab.getAttribute('data-mu-tab');
      var idx = tab.getAttribute('data-idx');
      bottomBar.className = 'mu-bottom-bar tab-' + idx;
      root.querySelectorAll('.mu-panel').forEach(function (p) {
        p.classList.toggle('active', p.id === 'mu-panel-' + target);
      });
    });
  });

  root.querySelectorAll('.mu-pill').forEach(function (pill) {
    pill.addEventListener('click', function () {
      root.querySelectorAll('.mu-pill').forEach(function (p) { p.classList.remove('active'); });
      pill.classList.add('active');
    });
  });

  var miniTitle = document.getElementById('muMiniTitle');
  var miniPlay = document.getElementById('muMiniPlay');
  var isPlaying = false;

  root.addEventListener('click', function (e) {
    var card = e.target.closest('.mu-card[data-song]');
    if (card) {
      miniTitle.textContent = card.getAttribute('data-song');
      isPlaying = true;
      miniPlay.textContent = '⏸';
    }
  });

  miniPlay.addEventListener('click', function () {
    isPlaying = !isPlaying;
    miniPlay.textContent = isPlaying ? '⏸' : '▶';
  });

  var muSearchInput = document.getElementById('muSearchInput');
  var muCatGrid = document.getElementById('muCatGrid');
  muSearchInput.addEventListener('input', function () {
    var kw = this.value.trim().toLowerCase();
    muCatGrid.querySelectorAll('.mu-cat-card').forEach(function (c) {
      c.style.display = (!kw || c.textContent.toLowerCase().indexOf(kw) !== -1) ? 'flex' : 'none';
    });
  });

  var muAvatar = document.getElementById('muAvatar');
  var muUserName = document.getElementById('muUserName');
  var muProfileModal = document.getElementById('muProfileModal');
  var muSheetAvatar = document.getElementById('muSheetAvatar');
  var muNameInput = document.getElementById('muNameInput');
  var muAvatarInput = document.getElementById('muAvatarInput');
  var tempAvatarUrl = '';

  function syncProfileUI(name, avatarUrl) {
    muUserName.textContent = name || '点击设置昵称';
    if (avatarUrl) {
      muAvatar.style.backgroundImage = 'url("' + avatarUrl + '")';
      muAvatar.classList.add('has-img');
    } else {
      muAvatar.style.backgroundImage = '';
      muAvatar.classList.remove('has-img');
    }
  }

  var savedName = localStorage.getItem('music_user_name') || '';
  PhoneDB.get('music_user_avatar').then(function (url) {
    tempAvatarUrl = url || '';
    syncProfileUI(savedName, url);
  });

  document.getElementById('muCardProfile').addEventListener('click', function () {
    muNameInput.value = localStorage.getItem('music_user_name') || '';
    if (tempAvatarUrl) {
      muSheetAvatar.style.backgroundImage = 'url("' + tempAvatarUrl + '")';
      muSheetAvatar.classList.add('has-img');
    } else {
      muSheetAvatar.style.backgroundImage = '';
      muSheetAvatar.classList.remove('has-img');
    }
    muProfileModal.classList.add('open');
  });

  muSheetAvatar.addEventListener('click', function () {
    muAvatarInput.click();
  });

  muAvatarInput.addEventListener('change', function () {
    var file = this.files && this.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      tempAvatarUrl = reader.result;
      muSheetAvatar.style.backgroundImage = 'url("' + tempAvatarUrl + '")';
      muSheetAvatar.classList.add('has-img');
    };
    reader.readAsDataURL(file);
    this.value = '';
  });

  document.getElementById('muCancelProfile').addEventListener('click', function () {
    muProfileModal.classList.remove('open');
  });

  document.getElementById('muSaveProfile').addEventListener('click', function () {
    var newName = muNameInput.value.trim();
    localStorage.setItem('music_user_name', newName);
    if (tempAvatarUrl) PhoneDB.set('music_user_avatar', tempAvatarUrl);
    syncProfileUI(newName, tempAvatarUrl);
    muProfileModal.classList.remove('open');
  });

  document.getElementById('muCardLogin').addEventListener('click', function () {
    var sub = document.getElementById('muLoginSub');
    sub.textContent = '接口待接入（后续在 API 或此处填入网易云接口即可扫码登录）';
  });
})();