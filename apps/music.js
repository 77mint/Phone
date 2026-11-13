(function () {
  var root = document.getElementById('app-music');
  if (!root) return;

  var DEFAULT_API_BASE = 'https://api-enhanced-ashen-one-33.vercel.app';
  function getApiBase() {
    return (localStorage.getItem('music_api_base') || DEFAULT_API_BASE).replace(/\/+$/, '');
  }

  var SVG_NOTE = '<svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>';
  var SVG_PLAY = '<svg viewBox="0 0 24 24"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>';
  var SVG_PAUSE = '<svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" rx="1"></rect><rect x="14" y="4" width="4" height="16" rx="1"></rect></svg>';
  var SVG_NEXT = '<svg viewBox="0 0 24 24"><polygon points="5 4 15 12 5 20 5 4"></polygon><rect x="17" y="4" width="2.5" height="16" rx="1"></rect></svg>';
  var SVG_PREV = '<svg viewBox="0 0 24 24"><polygon points="19 4 9 12 19 20 19 4"></polygon><rect x="4.5" y="4" width="2.5" height="16" rx="1"></rect></svg>';

  /* 对照你发的三张图：列表循环 / 单曲循环(1在内) / 平滑S形随机 */
  var SVG_MODE_LOOP =
    '<svg viewBox="0 0 24 24">' +
      '<path d="M17 4l3 3-3 3"></path>' +
      '<path d="M4 12V9a4 4 0 0 1 4-4h12"></path>' +
      '<path d="M7 20l-3-3 3-3"></path>' +
      '<path d="M20 12v3a4 4 0 0 1-4 4H4"></path>' +
    '</svg>';
  var SVG_MODE_ONE =
    '<svg viewBox="0 0 24 24">' +
      '<path d="M17 4l3 3-3 3"></path>' +
      '<path d="M4 12V9a4 4 0 0 1 4-4h12"></path>' +
      '<path d="M7 20l-3-3 3-3"></path>' +
      '<path d="M20 12v3a4 4 0 0 1-4 4H4"></path>' +
      '<path d="M11.5 10l1.2-1v6"></path>' +
    '</svg>';
  var SVG_MODE_SHUFFLE =
    '<svg viewBox="0 0 24 24">' +
      '<path d="M3 7h3.2c2.5 0 3.8 10 7.6 10H20"></path>' +
      '<path d="M3 17h3.2c2.5 0 3.8-10 7.6-10H20"></path>' +
      '<polyline points="17.5 4.5 20.5 7 17.5 9.5"></polyline>' +
      '<polyline points="17.5 14.5 20.5 17 17.5 19.5"></polyline>' +
    '</svg>';

  var START_SONGS = [
    { title: '红尘客栈', sub: '周杰伦', cls: 'mu-c1', id: '', pic: '' },
    { title: '太聪明', sub: '陈绮贞', cls: 'mu-c2', id: '', pic: '' },
    { title: 'Die For You', sub: 'The Weeknd', cls: 'mu-c3', id: '', pic: '' }
  ];

  var PLAYLISTS = [
    { title: '小半', sub: '陈粒 · 小梦大半', cls: 'mu-c4', pid: '', pic: '' },
    { title: 'Girl Power', sub: '流行女声精选', cls: 'mu-c5', pid: '', pic: '' },
    { title: '深夜耳机', sub: 'R&B / 氛围感', cls: 'mu-c6', pid: '', pic: '' },
    { title: '白噪音与钢琴', sub: '专注学习歌单', cls: 'mu-c7', pid: '', pic: '' }
  ];

  var ARTISTS = [
    { name: '周杰伦', tag: '周', cls: 'mu-a1', pic: '' },
    { name: '陈绮贞', tag: '陈', cls: 'mu-a2', pic: '' },
    { name: 'The Weeknd', tag: 'W', cls: 'mu-a3', pic: '' },
    { name: '方大同', tag: '方', cls: 'mu-a4', pic: '' },
    { name: 'Taylor Swift', tag: 'T', cls: 'mu-a5', pic: '' }
  ];

  var queueSongs = START_SONGS.slice();

  function shuffleArr(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function buildRectCards(list) {
    var s = '';
    list.forEach(function (item) {
      var cls = item.cls || 'mu-c4';
      var hasArt = item.pic ? ' has-art' : '';
      var bgStyle = item.pic ? ' style="background-image:url(\'' + item.pic + '\')"' : '';
      s +=
        '<div class="mu-rect-card" data-song-id="' + (item.id || '') + '" data-song-title="' + item.title + '" data-song-sub="' + item.sub + '" data-song-cls="' + cls + '" data-song-pic="' + (item.pic || '') + '">' +
          '<div class="mu-rect-cover ' + cls + hasArt + '"' + bgStyle + '>' + SVG_NOTE + '</div>' +
          '<div class="mu-rect-info">' +
            '<div class="mu-rect-title">' + item.title + '</div>' +
            '<div class="mu-rect-sub">' + item.sub + '</div>' +
          '</div>' +
          '<div class="mu-rect-play">' + SVG_PLAY + '</div>' +
        '</div>';
    });
    return s;
  }

  function buildQueueRows(list, activeIndex) {
    var s = '';
    list.forEach(function (item, idx) {
      var cls = item.cls || 'mu-c4';
      var hasArt = item.pic ? ' has-art' : '';
      var bgStyle = item.pic ? ' style="background-image:url(\'' + item.pic + '\')"' : '';
      var isCur = idx === activeIndex;
      s +=
        '<div class="mu-q-row' + (isCur ? ' playing' : '') + '" data-song-id="' + (item.id || '') + '" data-song-title="' + item.title + '" data-song-sub="' + item.sub + '" data-song-cls="' + cls + '" data-song-pic="' + (item.pic || '') + '">' +
          '<div class="mu-q-cover ' + cls + hasArt + '"' + bgStyle + '>' + SVG_NOTE + '</div>' +
          '<div class="mu-q-info">' +
            '<div class="mu-q-title">' + item.title + '</div>' +
            '<div class="mu-q-sub">' + item.sub + '</div>' +
          '</div>' +
          '<div class="mu-q-badge">' + (isCur ? '播放中' : '') + '</div>' +
        '</div>';
    });
    return s;
  }

  function buildPlaylistCards(list) {
    var s = '';
    list.forEach(function (item) {
      var hasArt = item.pic ? ' has-art' : '';
      var bgStyle = item.pic ? ' style="background-image:url(\'' + item.pic + '\')"' : '';
      s +=
        '<div class="mu-card" data-playlist-id="' + (item.pid || '') + '" data-playlist-name="' + item.title + '">' +
          '<div class="mu-cover ' + (item.cls || 'mu-c4') + hasArt + '"' + bgStyle + '>' + item.title + '</div>' +
          '<div class="mu-card-title">' + item.title + '</div>' +
          '<div class="mu-card-sub">' + item.sub + '</div>' +
        '</div>';
    });
    return s;
  }

  function buildArtistCards(list) {
    var s = '';
    list.forEach(function (a) {
      var hasArt = a.pic ? ' has-art' : '';
      var bgStyle = a.pic ? ' style="background-image:url(\'' + a.pic + '\')"' : '';
      s +=
        '<div class="mu-artist">' +
          '<div class="mu-artist-pic ' + (a.cls || 'mu-a1') + hasArt + '"' + bgStyle + '>' + a.tag + '</div>' +
          '<div class="mu-artist-name">' + a.name + '</div>' +
        '</div>';
    });
    return s;
  }

  root.innerHTML =
    '<div class="mu-body">' +
      '<div class="mu-panel active" id="mu-panel-home">' +
        '<div class="mu-top-bar">' +
          '<div class="mu-back-sm" data-close-app>' +
            '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>' +
          '</div>' +
          '<div class="mu-pills">' +
            '<div class="mu-pill active">全部</div>' +
            '<div class="mu-pill">音乐</div>' +
            '<div class="mu-pill">歌单</div>' +
            '<div class="mu-pill">电台</div>' +
          '</div>' +
        '</div>' +
        '<div class="mu-sec-title">开始收听</div>' +
        '<div class="mu-listen-list" id="muStartList">' + buildRectCards(START_SONGS) + '</div>' +
        '<div class="mu-sec-title">精选推荐歌单</div>' +
        '<div class="mu-shelf" id="muPlaylistShelf">' + buildPlaylistCards(PLAYLISTS) + '</div>' +
        '<div class="mu-sec-title">推荐艺人</div>' +
        '<div class="mu-shelf" id="muArtistShelf">' + buildArtistCards(ARTISTS) + '</div>' +
      '</div>' +
      '<div class="mu-panel" id="mu-panel-search">' +
        '<div class="mu-search-wrap">' +
          '<div class="mu-big-title">搜索</div>' +
          '<div class="mu-search-box">' +
            '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>' +
            '<input type="text" class="mu-search-input" id="muSearchInput" placeholder="艺人、歌曲、歌词以及更多内容">' +
          '</div>' +
          '<div class="mu-search-results" id="muSearchResults"></div>' +
        '</div>' +
      '</div>' +
      '<div class="mu-panel" id="mu-panel-mine">' +
        '<div class="mu-mine-wrap">' +
          '<div class="mu-mine-card" id="muCardProfile">' +
            '<div class="mu-profile-row">' +
              '<div class="mu-avatar" id="muAvatar">' + SVG_NOTE + '</div>' +
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
                '<div class="mu-profile-sub" id="muLoginSub">未登录（点击登录）</div>' +
              '</div>' +
              '<svg class="mu-arrow" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="mu-mini-player" id="muMiniBar">' +
      '<div class="mu-mini-cover" id="muMiniCover">' + SVG_NOTE + '</div>' +
      '<div class="mu-mini-info" id="muMiniTitle">未在播放</div>' +
      '<div class="mu-mini-actions">' +
        '<div class="mu-mini-ctrl" id="muMiniPlay">' + SVG_PLAY + '</div>' +
        '<div class="mu-mini-ctrl" id="muMiniNext">' + SVG_NEXT + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="mu-bottom-bar tab-0" id="muBottomBar">' +
      '<div class="mu-tab-indicator"></div>' +
      '<div class="mu-tab active" data-mu-tab="home" data-idx="0">主页</div>' +
      '<div class="mu-tab" data-mu-tab="search" data-idx="1">搜索</div>' +
      '<div class="mu-tab" data-mu-tab="mine" data-idx="2">我的</div>' +
    '</div>' +
    '<div class="mu-player-sheet" id="muPlayerSheet">' +
      '<div class="mu-ps-grab-wrap" id="muPsClose"><div class="mu-ps-grab"></div></div>' +
      '<div class="mu-ps-stage" id="muPsStage">' +
        '<div class="mu-ps-art" id="muPsArt">' + SVG_NOTE + '</div>' +
        '<div class="mu-ps-lyrics" id="muPsLyrics"><div class="mu-lyric-line">点击封面查看歌词</div></div>' +
        '<div id="muBackCoverBtn" style="display:none;position:absolute;top:6px;right:0;z-index:5;padding:4px 10px;border-radius:999px;background:rgba(0,0,0,0.06);color:#666;font-size:12px;">封面</div>' +
      '</div>' +
      '<div>' +
        '<div class="mu-ps-meta">' +
          '<div class="mu-ps-title" id="muPsTitle">未在播放</div>' +
          '<div class="mu-ps-sub" id="muPsSub">点击歌曲开始播放</div>' +
        '</div>' +
        '<div class="mu-ps-prog">' +
          '<div class="mu-ps-bar" id="muPsBar"><div class="mu-ps-bar-fill" id="muPsProgFill"></div></div>' +
          '<div class="mu-ps-times"><span id="muPsCur">--:--</span><span id="muPsDur">--:--</span></div>' +
        '</div>' +
      '</div>' +
      '<div class="mu-ps-ctrls">' +
        '<div class="mu-ps-btn" id="muPsPrev">' + SVG_PREV + '</div>' +
        '<div class="mu-ps-btn main" id="muPsPlay">' + SVG_PLAY + '</div>' +
        '<div class="mu-ps-btn" id="muPsNext">' + SVG_NEXT + '</div>' +
      '</div>' +
      '<div>' +
        '<div class="mu-ps-vol">' +
          '<svg viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon></svg>' +
          '<input type="range" class="mu-vol-range" id="muVolRange" min="0" max="1" step="0.01" value="0.8">' +
          '<svg viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.5 8.5a5 5 0 0 1 0 7"></path></svg>' +
        '</div>' +
        '<div class="mu-ps-footer">' +
          '<div class="mu-ps-fbtn" id="muPsModeBtn">' + SVG_MODE_LOOP + '</div>' +
          '<div class="mu-ps-fbtn" id="muPsQueueBtn"><svg viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><circle cx="4" cy="6" r="1"></circle><circle cx="4" cy="12" r="1"></circle><circle cx="4" cy="18" r="1"></circle></svg></div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="mu-modal" id="muQueueModal">' +
      '<div class="mu-sheet">' +
        '<div class="mu-sheet-head">' +
          '<div class="mu-sheet-title">播放列表</div>' +
          '<div class="mu-sheet-btn primary" id="muCloseQueue">关闭</div>' +
        '</div>' +
        '<div class="mu-queue-list" id="muQueueList"></div>' +
      '</div>' +
    '</div>' +
    '<div class="mu-modal center" id="muProfileModal">' +
      '<div class="mu-dialog">' +
        '<div class="mu-dialog-close" id="muCancelProfile">×</div>' +
        '<div class="mu-dialog-title">编辑资料</div>' +
        '<div class="mu-sheet-avatar-wrap">' +
          '<div class="mu-sheet-avatar" id="muSheetAvatar">' + SVG_NOTE + '</div>' +
          '<div class="mu-profile-sub">点击头像从相册上传</div>' +
        '</div>' +
        '<div class="mu-input-card">' +
          '<input type="text" class="mu-text-input" id="muNameInput" placeholder="输入你的名字">' +
        '</div>' +
        '<div class="mu-primary-btn" id="muSaveProfile">保存</div>' +
      '</div>' +
    '</div>' +
    '<div class="mu-modal center" id="muLoginModal">' +
      '<div class="mu-dialog">' +
        '<div class="mu-dialog-close" id="muCloseLogin">×</div>' +
        '<div class="mu-dialog-title">登录网易云音乐</div>' +
        '<div class="mu-seg-4" id="muLoginTabs">' +
          '<div class="mu-seg-tab active" data-ltab="sms">验证码</div>' +
          '<div class="mu-seg-tab" data-ltab="pwd">密码</div>' +
          '<div class="mu-seg-tab" data-ltab="cookie">Cookie</div>' +
          '<div class="mu-seg-tab" data-ltab="qr">扫码</div>' +
        '</div>' +
        '<div class="mu-login-panel active" id="ltab-sms">' +
          '<div class="mu-input-card"><input type="tel" class="mu-text-input" id="muSmsPhone" placeholder="手机号"></div>' +
          '<div class="mu-input-card">' +
            '<input type="text" class="mu-text-input" id="muSmsCode" placeholder="短信验证码">' +
            '<div class="mu-code-btn" id="muSendCodeBtn">获取验证码</div>' +
          '</div>' +
          '<div class="mu-primary-btn" id="muSmsLoginBtn">登录</div>' +
        '</div>' +
        '<div class="mu-login-panel" id="ltab-pwd">' +
          '<div class="mu-input-card"><input type="tel" class="mu-text-input" id="muPwdPhone" placeholder="手机号"></div>' +
          '<div class="mu-input-card"><input type="password" class="mu-text-input" id="muPwdPass" placeholder="密码"></div>' +
          '<div class="mu-primary-btn" id="muPwdLoginBtn">登录</div>' +
        '</div>' +
        '<div class="mu-login-panel" id="ltab-cookie">' +
          '<div class="mu-input-card"><input type="text" class="mu-text-input" id="muCookieInput" placeholder="粘贴网易云 Cookie"></div>' +
          '<div class="mu-primary-btn" id="muCookieLoginBtn">保存登录</div>' +
        '</div>' +
        '<div class="mu-login-panel" id="ltab-qr">' +
          '<div class="mu-qr-box">' +
            '<img class="mu-qr-img" id="muQrImg">' +
            '<div class="mu-primary-btn" id="muGetQrBtn">获取登录二维码</div>' +
          '</div>' +
        '</div>' +
        '<div class="mu-dialog-tip" id="muLoginTip">未注册的手机号将自动创建账号</div>' +
        '<div class="mu-dialog-tip" id="muLogoutBtn" style="color:#111;display:none;">退出当前账号</div>' +
      '</div>' +
    '</div>' +
    '<input type="file" id="muAvatarInput" accept="image/*" style="display:none;">' +
    '<audio id="muAudio" preload="none"></audio>';

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

  var audio = document.getElementById('muAudio');
  var miniTitle = document.getElementById('muMiniTitle');
  var miniCover = document.getElementById('muMiniCover');
  var miniPlay = document.getElementById('muMiniPlay');
  var psStage = document.getElementById('muPsStage');
  var psArt = document.getElementById('muPsArt');
  var psLyrics = document.getElementById('muPsLyrics');
  var backCoverBtn = document.getElementById('muBackCoverBtn');
  var psTitle = document.getElementById('muPsTitle');
  var psSub = document.getElementById('muPsSub');
  var psPlay = document.getElementById('muPsPlay');
  var psProgFill = document.getElementById('muPsProgFill');
  var psCur = document.getElementById('muPsCur');
  var psDur = document.getElementById('muPsDur');
  var playerSheet = document.getElementById('muPlayerSheet');
  var volRange = document.getElementById('muVolRange');
  var modeBtn = document.getElementById('muPsModeBtn');

  var currentIdx = -1;
  var isPlaying = false;
  var playMode = 0; // 0: 顺序/列表循环, 1: 单曲循环, 2: 随机播放
  var parsedLyrics = [];
  var lastLyricIdx = -1;
  var manualScrollUntil = 0;

  function renderModeBtn() {
    if (playMode === 0) modeBtn.innerHTML = SVG_MODE_LOOP;
    else if (playMode === 1) modeBtn.innerHTML = SVG_MODE_ONE;
    else modeBtn.innerHTML = SVG_MODE_SHUFFLE;
  }

  modeBtn.addEventListener('click', function () {
    playMode = (playMode + 1) % 3;
    renderModeBtn();
  });

  function applyVolume(v) {
    var num = Math.max(0, Math.min(1, parseFloat(v)));
    audio.volume = num;
    audio.muted = (num === 0);
    var pct = Math.round(num * 100);
    volRange.style.background = 'linear-gradient(90deg, #111111 ' + pct + '%, rgba(0,0,0,0.12) ' + pct + '%)';
  }
  var savedVol = localStorage.getItem('music_volume');
  if (savedVol !== null) volRange.value = savedVol;
  applyVolume(volRange.value);
  volRange.addEventListener('input', function () {
    localStorage.setItem('music_volume', this.value);
    applyVolume(this.value);
  });

  function setLyricsVisible(show) {
    psStage.classList.toggle('lyrics-on', show);
    backCoverBtn.style.display = show ? 'block' : 'none';
  }

  function loadLyrics(songId) {
    parsedLyrics = [];
    lastLyricIdx = -1;
    if (!songId) {
      psLyrics.innerHTML = '<div class="mu-lyric-line">暂无歌词</div>';
      return;
    }
    psLyrics.innerHTML = '<div class="mu-lyric-line">正在加载歌词...</div>';
    fetch(getApiBase() + '/lyric?id=' + songId)
      .then(function (r) { return r.json(); })
      .then(function (res) {
        var raw = res.lrc && res.lrc.lyric;
        if (!raw) {
          psLyrics.innerHTML = '<div class="mu-lyric-line">暂无歌词</div>';
          return;
        }
        var lines = [];
        raw.split('\n').forEach(function (line) {
          var m = line.match(/\[(\d+):(\d+(?:\.\d+)?)\](.*)/);
          if (m) {
            var txt = m[3].trim();
            if (txt) lines.push({ time: parseInt(m[1], 10) * 60 + parseFloat(m[2]), text: txt });
          }
        });
        parsedLyrics = lines;
        if (!lines.length) {
          psLyrics.innerHTML = '<div class="mu-lyric-line">纯音乐，请欣赏</div>';
          return;
        }
        psLyrics.innerHTML = lines.map(function (l, i) {
          return '<div class="mu-lyric-line" data-lrc-idx="' + i + '" data-lrc-time="' + l.time + '">' + l.text + '</div>';
        }).join('');
      }).catch(function () {
        psLyrics.innerHTML = '<div class="mu-lyric-line">歌词加载失败</div>';
      });
  }

  psArt.addEventListener('click', function () {
    setLyricsVisible(true);
  });

  backCoverBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    setLyricsVisible(false);
  });

  psLyrics.addEventListener('touchstart', function () {
    manualScrollUntil = Date.now() + 4500;
  }, { passive: true });
  psLyrics.addEventListener('scroll', function () {
    manualScrollUntil = Date.now() + 4500;
  }, { passive: true });

  psLyrics.addEventListener('click', function (e) {
    var line = e.target.closest('.mu-lyric-line[data-lrc-time]');
    if (line) {
      e.stopPropagation();
      var t = parseFloat(line.getAttribute('data-lrc-time'));
      if (!isNaN(t)) {
        audio.currentTime = t;
        manualScrollUntil = 0;
        if (audio.paused && audio.src) {
          isPlaying = true;
          audio.play().catch(function () {});
          syncPlayIcons();
        }
      }
      return;
    }
    setLyricsVisible(false);
  });

  function syncPlayIcons() {
    var icon = isPlaying ? SVG_PAUSE : SVG_PLAY;
    miniPlay.innerHTML = icon;
    psPlay.innerHTML = icon;
  }

  function applyArt(el, baseCls, pic) {
    if (pic) {
      el.className = baseCls + ' has-art';
      el.style.backgroundImage = 'url("' + pic + '")';
    } else {
      el.className = baseCls;
      el.style.backgroundImage = '';
    }
  }

  function playSongObj(item) {
    miniTitle.textContent = item.title + (item.sub ? ' - ' + item.sub : '');
    psTitle.textContent = item.title;
    psSub.textContent = item.sub || '';
    applyArt(miniCover, 'mu-mini-cover ' + (item.cls || 'mu-c1'), item.pic);
    applyArt(psArt, 'mu-ps-art ' + (item.cls || 'mu-c1'), item.pic);
    isPlaying = true;
    syncPlayIcons();
    loadLyrics(item.id);

    if (item.id) {
      var base = getApiBase();
      var cookie = localStorage.getItem('music_netease_cookie') || '';
      fetch(base + '/song/url/v1?id=' + item.id + '&level=standard' + (cookie ? '&cookie=' + encodeURIComponent(cookie) : ''))
        .then(function (r) { return r.json(); })
        .then(function (u) {
          var mp3 = u.data && u.data[0] && u.data[0].url;
          if (mp3) {
            audio.src = mp3.replace(/^http:\/\//, 'https://');
            audio.play().catch(function () {});
          }
        }).catch(function () {});
    }
  }

  function playByIndex(idx) {
    if (!queueSongs.length) return;
    if (idx < 0) idx = queueSongs.length - 1;
    if (idx >= queueSongs.length) idx = 0;
    currentIdx = idx;
    playSongObj(queueSongs[idx]);
  }

  function playNextAuto() {
    if (!queueSongs.length) return;
    if (playMode === 1) {
      audio.currentTime = 0;
      audio.play().catch(function () {});
    } else if (playMode === 2 && queueSongs.length > 1) {
      var r = Math.floor(Math.random() * queueSongs.length);
      if (r === currentIdx) r = (r + 1) % queueSongs.length;
      playByIndex(r);
    } else {
      playByIndex(currentIdx + 1);
    }
  }

  function togglePlay() {
    if (currentIdx === -1 && miniTitle.textContent === '未在播放') {
      playByIndex(0);
      return;
    }
    isPlaying = !isPlaying;
    if (audio.src) {
      if (isPlaying) audio.play().catch(function () {});
      else audio.pause();
    }
    syncPlayIcons();
  }

  audio.addEventListener('ended', playNextAuto);

  root.addEventListener('click', function (e) {
    var songEl = e.target.closest('[data-song-title]');
    if (songEl) {
      var item = {
        id: songEl.getAttribute('data-song-id') || '',
        title: songEl.getAttribute('data-song-title'),
        sub: songEl.getAttribute('data-song-sub') || '',
        cls: songEl.getAttribute('data-song-cls') || 'mu-c1',
        pic: songEl.getAttribute('data-song-pic') || ''
      };
      var found = queueSongs.findIndex(function (x) { return x.title === item.title; });
      if (found !== -1) currentIdx = found;
      else {
        queueSongs.unshift(item);
        currentIdx = 0;
      }
      playSongObj(item);
      document.getElementById('muQueueModal').classList.remove('open');
      return;
    }

    var plEl = e.target.closest('[data-playlist-id]');
    if (plEl) {
      var pid = plEl.getAttribute('data-playlist-id');
      if (!pid) return;
      fetch(getApiBase() + '/playlist/track/all?id=' + pid + '&limit=15')
        .then(function (r) { return r.json(); })
        .then(function (res) {
          var tracks = res.songs || [];
          if (!tracks.length) return;
          queueSongs = tracks.map(function (t) {
            return {
              id: t.id,
              title: t.name,
              sub: (t.ar || []).map(function (a) { return a.name; }).join('/'),
              pic: t.al && t.al.picUrl ? t.al.picUrl.replace(/^http:\/\//, 'https://') + '?param=600y600' : '',
              cls: 'mu-c4'
            };
          });
          playByIndex(0);
        }).catch(function () {});
    }
  });

  miniPlay.addEventListener('click', function (e) { e.stopPropagation(); togglePlay(); });
  document.getElementById('muMiniNext').addEventListener('click', function (e) { e.stopPropagation(); playNextAuto(); });
  psPlay.addEventListener('click', togglePlay);
  document.getElementById('muPsNext').addEventListener('click', playNextAuto);
  document.getElementById('muPsPrev').addEventListener('click', function () { playByIndex(currentIdx - 1); });

  document.getElementById('muPsBar').addEventListener('click', function (e) {
    if (!audio.duration) return;
    var rect = this.getBoundingClientRect();
    var ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * audio.duration;
  });

  document.getElementById('muMiniBar').addEventListener('click', function () { playerSheet.classList.add('open'); });
  document.getElementById('muPsClose').addEventListener('click', function () { playerSheet.classList.remove('open'); });

  var psStartY = 0;
  var psDy = 0;
  playerSheet.addEventListener('touchstart', function (e) {
    if (e.target.closest('#muVolRange') || e.target.closest('#muPsLyrics')) return;
    psStartY = e.touches[0].clientY;
    psDy = 0;
    playerSheet.style.transition = 'none';
  }, { passive: true });
  playerSheet.addEventListener('touchmove', function (e) {
    if (!psStartY) return;
    psDy = e.touches[0].clientY - psStartY;
    if (psDy > 0) playerSheet.style.transform = 'translateY(' + psDy + 'px)';
  }, { passive: true });
  playerSheet.addEventListener('touchend', function () {
    if (!psStartY) return;
    playerSheet.style.transition = 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)';
    if (psDy > 75) playerSheet.classList.remove('open');
    playerSheet.style.transform = '';
    psStartY = 0;
  });

  var muQueueModal = document.getElementById('muQueueModal');
  var muQueueList = document.getElementById('muQueueList');
  document.getElementById('muPsQueueBtn').addEventListener('click', function () {
    muQueueList.innerHTML = buildQueueRows(queueSongs, currentIdx);
    muQueueModal.classList.add('open');
  });
  document.getElementById('muCloseQueue').addEventListener('click', function () { muQueueModal.classList.remove('open'); });

  function fmtTime(sec) {
    if (!sec || isNaN(sec)) return '--:--';
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  audio.addEventListener('timeupdate', function () {
    if (!audio.duration) return;
    psProgFill.style.width = (audio.currentTime / audio.duration * 100) + '%';
    psCur.textContent = fmtTime(audio.currentTime);
    psDur.textContent = fmtTime(audio.duration);
    if (parsedLyrics.length) {
      var curT = audio.currentTime;
      var activeIdx = 0;
      for (var i = 0; i < parsedLyrics.length; i++) {
        if (curT >= parsedLyrics[i].time) activeIdx = i;
      }
      if (activeIdx !== lastLyricIdx) {
        lastLyricIdx = activeIdx;
        var lrcEls = psLyrics.querySelectorAll('.mu-lyric-line');
        lrcEls.forEach(function (el, idx) {
          var on = idx === activeIdx;
          el.classList.toggle('active', on);
          if (on && psStage.classList.contains('lyrics-on') && Date.now() > manualScrollUntil) {
            el.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
        });
      }
    }
  });

  (function hydrateHomeFromApi() {
    var base = getApiBase();
    Promise.all(START_SONGS.map(function (s) {
      return fetch(base + '/cloudsearch?keywords=' + encodeURIComponent(s.title + ' ' + s.sub) + '&limit=1')
        .then(function (r) { return r.json(); })
        .then(function (res) {
          var hit = res.result && res.result.songs && res.result.songs[0];
          if (hit) {
            s.id = hit.id;
            if (hit.al && hit.al.picUrl) {
              s.pic = hit.al.picUrl.replace(/^http:\/\//, 'https://') + '?param=600y600';
            }
          }
        }).catch(function () {});
    })).then(function () {
      document.getElementById('muStartList').innerHTML = buildRectCards(START_SONGS);
      queueSongs = START_SONGS.slice();
    });

    fetch(base + '/personalized?limit=24')
      .then(function (r) { return r.json(); })
      .then(function (res) {
        var list = shuffleArr(res.result || []).slice(0, 6);
        if (!list.length) return;
        var pls = list.map(function (p, i) {
          return {
            pid: p.id,
            title: p.name,
            sub: '歌单 · ' + Math.round((p.playCount || 10000) / 10000) + '万播放',
            pic: (p.picUrl || '').replace(/^http:\/\//, 'https://') + '?param=600y600',
            cls: 'mu-c' + ((i % 7) + 1)
          };
        });
        document.getElementById('muPlaylistShelf').innerHTML = buildPlaylistCards(pls);
      }).catch(function () {});

    fetch(base + '/top/artists?offset=0&limit=30')
      .then(function (r) { return r.json(); })
      .then(function (res) {
        var list = shuffleArr(res.artists || []).slice(0, 6);
        if (!list.length) return;
        var ars = list.map(function (a, i) {
          return {
            name: a.name,
            tag: a.name.slice(0, 1),
            pic: (a.img1v1Url || a.picUrl || '').replace(/^http:\/\//, 'https://') + '?param=600y600',
            cls: 'mu-a' + ((i % 5) + 1)
          };
        });
        document.getElementById('muArtistShelf').innerHTML = buildArtistCards(ars);
      }).catch(function () {});
  })();

  var muSearchInput = document.getElementById('muSearchInput');
  var muSearchResults = document.getElementById('muSearchResults');
  var searchTimer = null;

  muSearchInput.addEventListener('input', function () {
    var kw = this.value.trim();
    clearTimeout(searchTimer);
    if (!kw) {
      muSearchResults.innerHTML = '';
      return;
    }
    var base = getApiBase();
    searchTimer = setTimeout(function () {
      fetch(base + '/cloudsearch?keywords=' + encodeURIComponent(kw) + '&limit=15')
        .then(function (r) { return r.json(); })
        .then(function (res) {
          var songs = (res.result && res.result.songs) || [];
          if (!songs.length) {
            muSearchResults.innerHTML = '<div class="mu-profile-sub">没有搜到相关歌曲</div>';
            return;
          }
          var mapped = songs.map(function (s) {
            return {
              id: s.id,
              title: s.name,
              sub: (s.ar || []).map(function (a) { return a.name; }).join('/'),
              pic: s.al && s.al.picUrl ? s.al.picUrl.replace(/^http:\/\//, 'https://') + '?param=600y600' : '',
              cls: 'mu-c4'
            };
          });
          muSearchResults.innerHTML = buildRectCards(mapped);
        }).catch(function () {});
    }, 350);
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

  muSheetAvatar.addEventListener('click', function () { muAvatarInput.click(); });
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

  document.getElementById('muCancelProfile').addEventListener('click', function () { muProfileModal.classList.remove('open'); });
  document.getElementById('muSaveProfile').addEventListener('click', function () {
    var newName = muNameInput.value.trim();
    localStorage.setItem('music_user_name', newName);
    if (tempAvatarUrl) PhoneDB.set('music_user_avatar', tempAvatarUrl);
    syncProfileUI(newName, tempAvatarUrl);
    muProfileModal.classList.remove('open');
  });

  var muLoginModal = document.getElementById('muLoginModal');
  var muLoginTip = document.getElementById('muLoginTip');
  var muLoginSub = document.getElementById('muLoginSub');
  var muLogoutBtn = document.getElementById('muLogoutBtn');
  var muQrImg = document.getElementById('muQrImg');
  var qrTimer = null;

  function syncLoginStatus() {
    var cookie = localStorage.getItem('music_netease_cookie');
    muLoginSub.textContent = cookie ? '已登录网易云音乐' : '未登录（点击登录）';
    muLogoutBtn.style.display = cookie ? 'block' : 'none';
  }
  syncLoginStatus();

  function finishLogin(ck) {
    localStorage.setItem('music_netease_cookie', ck);
    syncLoginStatus();
    muLoginTip.textContent = '登录成功！';
    fetch(getApiBase() + '/login/status?cookie=' + encodeURIComponent(ck))
      .then(function (r) { return r.json(); })
      .then(function (st) {
        var prof = st.data && st.data.profile;
        if (prof) {
          if (!localStorage.getItem('music_user_name') && prof.nickname) {
            localStorage.setItem('music_user_name', prof.nickname);
          }
          var av = prof.avatarUrl ? prof.avatarUrl.replace(/^http:\/\//, 'https://') : '';
          syncProfileUI(localStorage.getItem('music_user_name') || prof.nickname, tempAvatarUrl || av);
        }
      }).catch(function () {});
    setTimeout(function () { muLoginModal.classList.remove('open'); }, 800);
  }

  root.querySelectorAll('.mu-seg-tab').forEach(function (t) {
    t.addEventListener('click', function () {
      root.querySelectorAll('.mu-seg-tab').forEach(function (x) { x.classList.remove('active'); });
      t.classList.add('active');
      var target = t.getAttribute('data-ltab');
      root.querySelectorAll('.mu-login-panel').forEach(function (p) {
        p.classList.toggle('active', p.id === 'ltab-' + target);
      });
    });
  });

  document.getElementById('muCardLogin').addEventListener('click', function () {
    muLoginTip.textContent = '未注册的手机号将自动创建账号';
    muLoginModal.classList.add('open');
  });

  document.getElementById('muCloseLogin').addEventListener('click', function () {
    clearInterval(qrTimer);
    muLoginModal.classList.remove('open');
  });

  muLogoutBtn.addEventListener('click', function () {
    clearInterval(qrTimer);
    localStorage.removeItem('music_netease_cookie');
    muQrImg.style.display = 'none';
    muLoginTip.textContent = '已退出登录';
    syncLoginStatus();
  });

  document.getElementById('muSendCodeBtn').addEventListener('click', function () {
    var phoneNum = document.getElementById('muSmsPhone').value.trim();
    if (!phoneNum) { muLoginTip.textContent = '请先输入手机号'; return; }
    muLoginTip.textContent = '正在发送验证码...';
    fetch(getApiBase() + '/captcha/sent?phone=' + encodeURIComponent(phoneNum))
      .then(function (r) { return r.json(); })
      .then(function (res) {
        muLoginTip.textContent = res.code === 200 ? '验证码已发送' : (res.message || '发送失败，可改用扫码或Cookie');
      }).catch(function () { muLoginTip.textContent = '发送失败'; });
  });

  document.getElementById('muSmsLoginBtn').addEventListener('click', function () {
    var phoneNum = document.getElementById('muSmsPhone').value.trim();
    var code = document.getElementById('muSmsCode').value.trim();
    if (!phoneNum || !code) { muLoginTip.textContent = '请输入手机号和验证码'; return; }
    muLoginTip.textContent = '正在登录...';
    fetch(getApiBase() + '/login/cellphone?phone=' + encodeURIComponent(phoneNum) + '&captcha=' + encodeURIComponent(code))
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res.code === 200 && res.cookie) finishLogin(res.cookie);
        else muLoginTip.textContent = res.message || '登录失败，建议改用扫码或Cookie';
      }).catch(function () { muLoginTip.textContent = '登录请求失败'; });
  });

  document.getElementById('muPwdLoginBtn').addEventListener('click', function () {
    var phoneNum = document.getElementById('muPwdPhone').value.trim();
    var pass = document.getElementById('muPwdPass').value;
    if (!phoneNum || !pass) { muLoginTip.textContent = '请输入手机号和密码'; return; }
    muLoginTip.textContent = '正在登录...';
    fetch(getApiBase() + '/login/cellphone?phone=' + encodeURIComponent(phoneNum) + '&password=' + encodeURIComponent(pass))
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res.code === 200 && res.cookie) finishLogin(res.cookie);
        else muLoginTip.textContent = res.message || '登录失败，建议改用扫码或Cookie';
      }).catch(function () { muLoginTip.textContent = '登录请求失败'; });
  });

  document.getElementById('muCookieLoginBtn').addEventListener('click', function () {
    var ck = document.getElementById('muCookieInput').value.trim();
    if (!ck) { muLoginTip.textContent = '请粘贴 Cookie'; return; }
    finishLogin(ck);
  });

  document.getElementById('muGetQrBtn').addEventListener('click', function () {
    var base = getApiBase();
    clearInterval(qrTimer);
    muLoginTip.textContent = '正在获取二维码...';
    fetch(base + '/login/qr/key?timestamp=' + Date.now())
      .then(function (r) { return r.json(); })
      .then(function (res) {
        var key = res.data && res.data.unikey;
        if (!key) throw new Error('no key');
        return fetch(base + '/login/qr/create?key=' + key + '&qrimg=true&timestamp=' + Date.now())
          .then(function (r) { return r.json(); })
          .then(function (qrRes) {
            muQrImg.src = qrRes.data.qrimg;
            muQrImg.style.display = 'block';
            muLoginTip.textContent = '请用网易云音乐 App 扫码确认';
            qrTimer = setInterval(function () {
              fetch(base + '/login/qr/check?key=' + key + '&timestamp=' + Date.now())
                .then(function (r) { return r.json(); })
                .then(function (chk) {
                  if (chk.code === 800) {
                    clearInterval(qrTimer);
                    muLoginTip.textContent = '二维码已过期，请重新获取';
                  } else if (chk.code === 802) {
                    muLoginTip.textContent = '已扫码，请在手机上点击确认';
                  } else if (chk.code === 803) {
                    clearInterval(qrTimer);
                    finishLogin(chk.cookie || '1');
                  }
                }).catch(function () {});
            }, 2500);
          });
      }).catch(function () { muLoginTip.textContent = '二维码获取失败'; });
  });
})();