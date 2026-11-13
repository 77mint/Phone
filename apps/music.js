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
                '<div class="mu-profile-sub" id="muLoginSub">未登录（点击扫码登录）</div>' +
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
      '<div>' +
        '<div class="mu-ps-art" id="muPsArt">' + SVG_NOTE + '</div>' +
        '<div class="mu-ps-meta">' +
          '<div class="mu-ps-title" id="muPsTitle">未在播放</div>' +
          '<div class="mu-ps-sub" id="muPsSub">点击歌曲开始播放</div>' +
        '</div>' +
        '<div class="mu-ps-prog">' +
          '<div class="mu-ps-bar"><div class="mu-ps-bar-fill" id="muPsProgFill"></div></div>' +
          '<div class="mu-ps-times"><span id="muPsCur">--:--</span><span id="muPsDur">--:--</span></div>' +
        '</div>' +
      '</div>' +
      '<div>' +
        '<div class="mu-ps-ctrls">' +
          '<div class="mu-ps-btn" id="muPsPrev">' + SVG_PREV + '</div>' +
          '<div class="mu-ps-btn main" id="muPsPlay">' + SVG_PLAY + '</div>' +
          '<div class="mu-ps-btn" id="muPsNext">' + SVG_NEXT + '</div>' +
        '</div>' +
        '<div class="mu-ps-vol">' +
          '<svg viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon></svg>' +
          '<div class="mu-ps-vol-track"><div class="mu-ps-vol-fill"></div></div>' +
          '<svg viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.5 8.5a5 5 0 0 1 0 7"></path></svg>' +
        '</div>' +
        '<div class="mu-ps-footer">' +
          '<div class="mu-ps-fbtn"><svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></div>' +
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
    '<div class="mu-modal" id="muProfileModal">' +
      '<div class="mu-sheet">' +
        '<div class="mu-sheet-head">' +
          '<div class="mu-sheet-btn" id="muCancelProfile">取消</div>' +
          '<div class="mu-sheet-title">编辑资料</div>' +
          '<div class="mu-sheet-btn primary" id="muSaveProfile">保存</div>' +
        '</div>' +
        '<div class="mu-sheet-avatar-wrap">' +
          '<div class="mu-sheet-avatar" id="muSheetAvatar">' + SVG_NOTE + '</div>' +
          '<div class="mu-profile-sub">点击头像从相册上传</div>' +
        '</div>' +
        '<div class="mu-input-card">' +
          '<input type="text" class="mu-text-input" id="muNameInput" placeholder="输入你的名字">' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="mu-modal" id="muLoginModal">' +
      '<div class="mu-sheet">' +
        '<div class="mu-sheet-head">' +
          '<div class="mu-sheet-btn" id="muCloseLogin">关闭</div>' +
          '<div class="mu-sheet-title">扫码登录网易云</div>' +
          '<div class="mu-sheet-btn primary" id="muLogoutBtn">退出</div>' +
        '</div>' +
        '<div class="mu-qr-box">' +
          '<img class="mu-qr-img" id="muQrImg">' +
          '<div class="mu-profile-sub" id="muQrStatus">点击下方获取网易云二维码</div>' +
          '<div class="mu-qr-btn" id="muGetQrBtn">获取登录二维码</div>' +
        '</div>' +
        '<div class="mu-input-card" style="margin-top:8px;">' +
          '<input type="text" class="mu-text-input" id="muApiInput" placeholder="接口地址（已内置默认）">' +
        '</div>' +
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
  var psArt = document.getElementById('muPsArt');
  var psTitle = document.getElementById('muPsTitle');
  var psSub = document.getElementById('muPsSub');
  var psPlay = document.getElementById('muPsPlay');
  var psProgFill = document.getElementById('muPsProgFill');
  var psCur = document.getElementById('muPsCur');
  var psDur = document.getElementById('muPsDur');
  var playerSheet = document.getElementById('muPlayerSheet');

  var currentIdx = -1;
  var isPlaying = false;

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

  audio.addEventListener('ended', function () {
    playByIndex(currentIdx + 1);
  });

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
      var base = getApiBase();
      fetch(base + '/playlist/track/all?id=' + pid + '&limit=15')
        .then(function (r) { return r.json(); })
        .then(function (res) {
          var tracks = res.songs || [];
          if (!tracks.length) return;
          queueSongs = tracks.map(function (t) {
            return {
              id: t.id,
              title: t.name,
              sub: (t.ar || []).map(function (a) { return a.name; }).join('/'),
              pic: t.al && t.al.picUrl ? t.al.picUrl.replace(/^http:\/\//, 'https://') + '?param=300y300' : '',
              cls: 'mu-c4'
            };
          });
          playByIndex(0);
        }).catch(function () {});
    }
  });

  miniPlay.addEventListener('click', function (e) { e.stopPropagation(); togglePlay(); });
  document.getElementById('muMiniNext').addEventListener('click', function (e) { e.stopPropagation(); playByIndex(currentIdx + 1); });
  psPlay.addEventListener('click', togglePlay);
  document.getElementById('muPsNext').addEventListener('click', function () { playByIndex(currentIdx + 1); });
  document.getElementById('muPsPrev').addEventListener('click', function () { playByIndex(currentIdx - 1); });

  document.getElementById('muMiniBar').addEventListener('click', function () { playerSheet.classList.add('open'); });
  document.getElementById('muPsClose').addEventListener('click', function () { playerSheet.classList.remove('open'); });

  var psStartY = 0;
  var psDy = 0;
  playerSheet.addEventListener('touchstart', function (e) {
    psStartY = e.touches[0].clientY;
    psDy = 0;
    playerSheet.style.transition = 'none';
  }, { passive: true });
  playerSheet.addEventListener('touchmove', function (e) {
    psDy = e.touches[0].clientY - psStartY;
    if (psDy > 0) playerSheet.style.transform = 'translateY(' + psDy + 'px)';
  }, { passive: true });
  playerSheet.addEventListener('touchend', function () {
    playerSheet.style.transition = 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)';
    if (psDy > 75) playerSheet.classList.remove('open');
    playerSheet.style.transform = '';
  });

  var muQueueModal = document.getElementById('muQueueModal');
  var muQueueList = document.getElementById('muQueueList');
  document.getElementById('muPsQueueBtn').addEventListener('click', function () {
    muQueueList.innerHTML = buildRectCards(queueSongs);
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
  });

  /* 启动自动拉取首页真实封面与歌单 */
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
              s.pic = hit.al.picUrl.replace(/^http:\/\//, 'https://') + '?param=300y300';
            }
          }
        }).catch(function () {});
    })).then(function () {
      document.getElementById('muStartList').innerHTML = buildRectCards(START_SONGS);
      queueSongs = START_SONGS.slice();
    });

    fetch(base + '/personalized?limit=6')
      .then(function (r) { return r.json(); })
      .then(function (res) {
        var list = res.result || [];
        if (!list.length) return;
        var pls = list.map(function (p, i) {
          return {
            pid: p.id,
            title: p.name,
            sub: '歌单 · ' + Math.round((p.playCount || 10000) / 10000) + '万播放',
            pic: (p.picUrl || '').replace(/^http:\/\//, 'https://') + '?param=300y300',
            cls: 'mu-c' + ((i % 7) + 1)
          };
        });
        document.getElementById('muPlaylistShelf').innerHTML = buildPlaylistCards(pls);
      }).catch(function () {});

    fetch(base + '/top/artists?offset=0&limit=6')
      .then(function (r) { return r.json(); })
      .then(function (res) {
        var list = res.artists || [];
        if (!list.length) return;
        var ars = list.map(function (a, i) {
          return {
            name: a.name,
            tag: a.name.slice(0, 1),
            pic: (a.img1v1Url || a.picUrl || '').replace(/^http:\/\//, 'https://') + '?param=240y240',
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
              pic: s.al && s.al.picUrl ? s.al.picUrl.replace(/^http:\/\//, 'https://') + '?param=300y300' : '',
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
  var muApiInput = document.getElementById('muApiInput');
  var muQrImg = document.getElementById('muQrImg');
  var muQrStatus = document.getElementById('muQrStatus');
  var muLoginSub = document.getElementById('muLoginSub');
  var qrTimer = null;

  function syncLoginStatus() {
    var cookie = localStorage.getItem('music_netease_cookie');
    muLoginSub.textContent = cookie ? '已登录网易云音乐' : '未登录（点击扫码登录）';
  }
  syncLoginStatus();

  document.getElementById('muCardLogin').addEventListener('click', function () {
    muApiInput.value = getApiBase();
    muLoginModal.classList.add('open');
  });

  document.getElementById('muCloseLogin').addEventListener('click', function () {
    clearInterval(qrTimer);
    muLoginModal.classList.remove('open');
  });

  document.getElementById('muLogoutBtn').addEventListener('click', function () {
    clearInterval(qrTimer);
    localStorage.removeItem('music_netease_cookie');
    muQrImg.style.display = 'none';
    muQrStatus.textContent = '已退出登录';
    syncLoginStatus();
  });

  document.getElementById('muGetQrBtn').addEventListener('click', function () {
    var base = (muApiInput.value.trim() || DEFAULT_API_BASE).replace(/\/+$/, '');
    localStorage.setItem('music_api_base', base);
    clearInterval(qrTimer);
    muQrStatus.textContent = '正在获取二维码...';

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
            muQrStatus.textContent = '请用网易云音乐 App 扫码确认';
            qrTimer = setInterval(function () {
              fetch(base + '/login/qr/check?key=' + key + '&timestamp=' + Date.now())
                .then(function (r) { return r.json(); })
                .then(function (chk) {
                  if (chk.code === 800) {
                    clearInterval(qrTimer);
                    muQrStatus.textContent = '二维码已过期，请重新点击获取';
                  } else if (chk.code === 802) {
                    muQrStatus.textContent = '已扫码，请在手机上点击确认';
                  } else if (chk.code === 803) {
                    clearInterval(qrTimer);
                    var ck = chk.cookie || '1';
                    localStorage.setItem('music_netease_cookie', ck);
                    muQrStatus.textContent = '登录成功！';
                    syncLoginStatus();
                    fetch(base + '/login/status?cookie=' + encodeURIComponent(ck))
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
                  }
                }).catch(function () {});
            }, 2500);
          });
      }).catch(function () {
        muQrStatus.textContent = '接口连接失败，请稍后重试';
      });
  });
})();