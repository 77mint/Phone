/* =========================================================
   Chat 朋友圈页（仿微信朋友圈独立模块）
   - 不改动 apps/chat.js / apps/chat.css，独立接管朋友圈 tab
   - 无左上角返回键；右上角相机可发动态；封面默认白色点击可上传
   ========================================================= */
(function () {
  var STORAGE_MOMENTS_KEY = 'chat_moments_v1';
  var DB_COVER_KEY = 'moments_cover';

  var rendering = false;
  var coverUrl = '';
  var coverLoaded = false;
  var openPopId = '';

  var draftImages = [];
  var draftLocation = '';
  var draftMention = '';
  var draftVisibility = '公开';

  function loadPosts() {
    try {
      var raw = localStorage.getItem(STORAGE_MOMENTS_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function savePosts(list) {
    try {
      localStorage.setItem(STORAGE_MOMENTS_KEY, JSON.stringify(list));
    } catch (e) {}
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatTime(ts) {
    if (!ts) return '刚刚';
    var diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return '刚刚';
    if (diff < 3600) return Math.floor(diff / 60) + '分钟前';
    if (diff < 86400) return Math.floor(diff / 3600) + '小时前';
    var d = new Date(ts);
    return (d.getMonth() + 1) + '月' + d.getDate() + '日';
  }

  function compressPhoto(file) {
    return new Promise(function (resolve) {
      var objUrl = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(objUrl);
        var maxSide = 900;
        var w = img.naturalWidth || img.width;
        var h = img.naturalHeight || img.height;
        if (w > maxSide || h > maxSide) {
          if (w >= h) { h = Math.round(h * maxSide / w); w = maxSide; }
          else { w = Math.round(w * maxSide / h); h = maxSide; }
        }
        var c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = function () {
        URL.revokeObjectURL(objUrl);
        resolve('');
      };
      img.src = objUrl;
    });
  }

  function isMomentsTabActive() {
    var tab = document.querySelector('#app-chat .ct-tab-btn[data-tab="moments"]');
    return !!(tab && tab.classList.contains('active'));
  }

  function ensureComposerAndInputs() {
    var appEl = document.querySelector('#app-chat .ct-app');
    if (!appEl || document.getElementById('ctmComposeView')) return;

    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="ctm-compose" id="ctmComposeView">' +
        '<div class="ctm-compose-head">' +
          '<button class="ctm-compose-cancel" id="ctmComposeCancel">取消</button>' +
          '<div class="ctm-compose-title">发表动态</div>' +
          '<button class="ctm-compose-send" id="ctmComposeSend">发表</button>' +
        '</div>' +
        '<div class="ctm-compose-body">' +
          '<textarea class="ctm-compose-textarea" id="ctmComposeText" placeholder="这一刻的想法..."></textarea>' +
          '<div class="ctm-compose-imgs" id="ctmComposeImgs"></div>' +
          '<div class="ctm-compose-opts">' +
            '<div class="ctm-opt-row" id="ctmOptLocation">' +
              '<div class="ctm-opt-left">' +
                '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>' +
                '<span>所在位置</span>' +
              '</div>' +
              '<div class="ctm-opt-right"><span id="ctmOptLocVal"></span><span>›</span></div>' +
            '</div>' +
            '<div class="ctm-opt-row" id="ctmOptMention">' +
              '<div class="ctm-opt-left">' +
                '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/></svg>' +
                '<span>提醒谁看</span>' +
              '</div>' +
              '<div class="ctm-opt-right"><span id="ctmOptMentionVal"></span><span>›</span></div>' +
            '</div>' +
            '<div class="ctm-opt-row" id="ctmOptVisibility">' +
              '<div class="ctm-opt-left">' +
                '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' +
                '<span>谁可以看</span>' +
              '</div>' +
              '<div class="ctm-opt-right"><span id="ctmOptVisVal">公开</span><span>›</span></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<input type="file" id="ctmCoverInput" accept="image/*" style="display:none;">' +
      '<input type="file" id="ctmPostImgInput" accept="image/*" multiple style="display:none;">';

    while (wrap.firstChild) {
      appEl.appendChild(wrap.firstChild);
    }

    bindComposerEvents();
  }

  function syncSendBtn() {
    var txt = (document.getElementById('ctmComposeText').value || '').trim();
    var btn = document.getElementById('ctmComposeSend');
    if (btn) btn.classList.toggle('ready', txt.length > 0 || draftImages.length > 0);
  }

  function renderDraftImages() {
    var box = document.getElementById('ctmComposeImgs');
    if (!box) return;
    var html = draftImages.map(function (src, idx) {
      return '<div class="ctm-compose-thumb">' +
        '<img src="' + escapeHtml(src) + '" alt="">' +
        '<span class="ctm-compose-img-del" data-del-img="' + idx + '">×</span>' +
      '</div>';
    }).join('');
    if (draftImages.length < 9) {
      html += '<div class="ctm-compose-add" id="ctmAddPostImg">+</div>';
    }
    box.innerHTML = html;
    syncSendBtn();
  }

  function openComposer() {
    ensureComposerAndInputs();
    draftImages = [];
    draftLocation = '';
    draftMention = '';
    draftVisibility = '公开';
    document.getElementById('ctmComposeText').value = '';
    document.getElementById('ctmOptLocVal').textContent = '';
    document.getElementById('ctmOptMentionVal').textContent = '';
    document.getElementById('ctmOptVisVal').textContent = '公开';
    renderDraftImages();
    document.getElementById('ctmComposeView').classList.add('open');
  }

  function bindComposerEvents() {
    document.getElementById('ctmComposeCancel').addEventListener('click', function () {
      document.getElementById('ctmComposeView').classList.remove('open');
    });

    document.getElementById('ctmComposeText').addEventListener('input', syncSendBtn);

    document.getElementById('ctmComposeImgs').addEventListener('click', function (e) {
      var delIdx = e.target.getAttribute('data-del-img');
      if (delIdx !== null) {
        draftImages.splice(Number(delIdx), 1);
        renderDraftImages();
        return;
      }
      if (e.target.id === 'ctmAddPostImg') {
        document.getElementById('ctmPostImgInput').click();
      }
    });

    document.getElementById('ctmPostImgInput').addEventListener('change', function () {
      var files = Array.prototype.slice.call(this.files || []).slice(0, 9 - draftImages.length);
      this.value = '';
      if (!files.length) return;
      Promise.all(files.map(compressPhoto)).then(function (urls) {
        urls.forEach(function (u) {
          if (u && draftImages.length < 9) draftImages.push(u);
        });
        renderDraftImages();
      });
    });

    document.getElementById('ctmOptLocation').addEventListener('click', function () {
      var val = prompt('输入所在位置（留空则不显示）', draftLocation);
      if (val === null) return;
      draftLocation = val.trim();
      document.getElementById('ctmOptLocVal').textContent = draftLocation;
    });

    document.getElementById('ctmOptMention').addEventListener('click', function () {
      var val = prompt('提醒谁看（输入名字，留空则不提醒）', draftMention);
      if (val === null) return;
      draftMention = val.trim();
      document.getElementById('ctmOptMentionVal').textContent = draftMention;
    });

    document.getElementById('ctmOptVisibility').addEventListener('click', function () {
      draftVisibility = draftVisibility === '公开' ? '仅自己' : '公开';
      document.getElementById('ctmOptVisVal').textContent = draftVisibility;
    });

    document.getElementById('ctmComposeSend').addEventListener('click', function () {
      var text = (document.getElementById('ctmComposeText').value || '').trim();
      if (!text && !draftImages.length) return;
      var posts = loadPosts();
      posts.unshift({
        id: 'mom-' + Date.now(),
        sender: 'me',
        authorName: '我',
        text: text,
        images: draftImages.slice(),
        location: draftLocation,
        mention: draftMention,
        visibility: draftVisibility,
        likes: [],
        comments: [],
        time: Date.now()
      });
      savePosts(posts);
      document.getElementById('ctmComposeView').classList.remove('open');
      renderMoments();
    });

    document.getElementById('ctmCoverInput').addEventListener('change', function () {
      var file = this.files && this.files[0];
      this.value = '';
      if (!file) return;
      compressPhoto(file).then(function (url) {
        if (!url) return;
        coverUrl = url;
        if (window.PhoneDB) PhoneDB.set(DB_COVER_KEY, url);
        renderMoments();
      });
    });
  }

  function renderMoments() {
    var appEl = document.querySelector('#app-chat .ct-app');
    var scroll = document.getElementById('ctMainScroll');
    if (!appEl || !scroll) return;

    ensureComposerAndInputs();

    if (!isMomentsTabActive()) {
      appEl.classList.remove('is-moments-tab');
      return;
    }

    appEl.classList.add('is-moments-tab');
    rendering = true;

    if (!coverLoaded && window.PhoneDB) {
      coverLoaded = true;
      PhoneDB.get(DB_COVER_KEY).then(function (val) {
        if (val) {
          coverUrl = val;
          if (isMomentsTabActive()) renderMoments();
        }
      });
    }

    var posts = loadPosts();
    var feedHtml = '';
    if (!posts.length) {
      feedHtml = '<div class="ctm-empty">还没有动态<br>点右上角相机图标发一条朋友圈吧</div>';
    } else {
      feedHtml = posts.map(function (p) {
        var isMe = p.sender === 'me';
        var imgs = Array.isArray(p.images) ? p.images : [];
        var imgsHtml = '';
        if (imgs.length) {
          imgsHtml = '<div class="ctm-post-imgs ' + (imgs.length === 1 ? 'is-single' : '') + '">' +
            imgs.map(function (src) {
              return '<img class="ctm-post-img" src="' + escapeHtml(src) + '" alt="">';
            }).join('') +
          '</div>';
        }
        var likes = Array.isArray(p.likes) ? p.likes : [];
        var comments = Array.isArray(p.comments) ? p.comments : [];
        var hasLiked = likes.indexOf('我') !== -1;

        var socialHtml = '';
        if (likes.length || comments.length) {
          socialHtml = '<div class="ctm-social-box">';
          if (likes.length) {
            socialHtml += '<div class="ctm-likes-row"><span>♡</span><span>' + escapeHtml(likes.join('，')) + '</span></div>';
          }
          if (comments.length) {
            socialHtml += '<div class="ctm-comments-list">' + comments.map(function (cm) {
              return '<div class="ctm-comment-item"><span class="ctm-comment-name">' + escapeHtml(cm.author) + '：</span>' + escapeHtml(cm.text) + '</div>';
            }).join('') + '</div>';
          }
          socialHtml += '</div>';
        }

        var avText = escapeHtml((p.authorName || '我').slice(0, 1));
        var avHtml = p.avatar
          ? '<div class="ctm-post-avatar"><img src="' + escapeHtml(p.avatar) + '" alt=""></div>'
          : '<div class="ctm-post-avatar">' + avText + '</div>';

        return '<div class="ctm-post" data-post-id="' + escapeHtml(p.id) + '">' +
          avHtml +
          '<div class="ctm-post-body">' +
            '<div class="ctm-post-author">' + escapeHtml(p.authorName || '我') + '</div>' +
            (p.text ? '<div class="ctm-post-text">' + escapeHtml(p.text) + '</div>' : '') +
            imgsHtml +
            (p.location ? '<div class="ctm-post-loc">' + escapeHtml(p.location) + '</div>' : '') +
            '<div class="ctm-post-meta">' +
              '<div class="ctm-post-meta-left">' +
                '<span>' + escapeHtml(formatTime(p.time)) + '</span>' +
                (p.visibility === '仅自己' ? '<span>仅自己可见</span>' : '') +
                (isMe ? '<span class="ctm-post-del" data-del-post="' + escapeHtml(p.id) + '">删除</span>' : '') +
              '</div>' +
              '<button class="ctm-more-btn" data-pop-btn="' + escapeHtml(p.id) + '" aria-label="操作">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/></svg>' +
              '</button>' +
              '<div class="ctm-action-pop ' + (openPopId === p.id ? 'open' : '') + '">' +
                '<button class="ctm-pop-btn" data-like-post="' + escapeHtml(p.id) + '">' + (hasLiked ? '取消' : '赞') + '</button>' +
                '<div class="ctm-pop-sep"></div>' +
                '<button class="ctm-pop-btn" data-comment-post="' + escapeHtml(p.id) + '">评论</button>' +
              '</div>' +
            '</div>' +
            socialHtml +
          '</div>' +
        '</div>';
      }).join('');
    }

    var coverStyle = coverUrl ? ' style="background-image:url(\'' + escapeHtml(coverUrl) + '\');"' : '';
    var coverCls = 'ctm-cover-area' + (coverUrl ? ' has-cover' : '');

    scroll.innerHTML =
      '<div class="ctm-wrap">' +
        '<div class="' + coverCls + '" id="ctmCoverArea"' + coverStyle + '>' +
          '<div class="ctm-cover-hint">点击更换封面</div>' +
          '<button class="ctm-camera-btn" id="ctmCameraBtn" aria-label="发朋友圈">' +
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' +
              '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>' +
              '<circle cx="12" cy="13" r="4"/>' +
            '</svg>' +
          '</button>' +
        '</div>' +
        '<div class="ctm-me-corner">' +
          '<div class="ctm-me-name">我</div>' +
          '<div class="ctm-me-avatar">我</div>' +
        '</div>' +
        '<div class="ctm-feed">' + feedHtml + '</div>' +
      '</div>';

    bindMomentsEvents();
    rendering = false;
  }

  function bindMomentsEvents() {
    var coverArea = document.getElementById('ctmCoverArea');
    var cameraBtn = document.getElementById('ctmCameraBtn');
    var wrap = document.querySelector('#ctMainScroll .ctm-wrap');

    if (cameraBtn) {
      cameraBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        openComposer();
      });
    }

    if (coverArea) {
      coverArea.addEventListener('click', function () {
        document.getElementById('ctmCoverInput').click();
      });
    }

    if (wrap) {
      wrap.addEventListener('click', function (e) {
        var popBtn = e.target.closest('[data-pop-btn]');
        if (popBtn) {
          e.stopPropagation();
          var pid = popBtn.getAttribute('data-pop-btn');
          openPopId = (openPopId === pid) ? '' : pid;
          renderMoments();
          return;
        }

        var likeBtn = e.target.closest('[data-like-post]');
        if (likeBtn) {
          e.stopPropagation();
          var lid = likeBtn.getAttribute('data-like-post');
          var posts = loadPosts();
          var target = posts.find(function (p) { return p.id === lid; });
          if (target) {
            if (!Array.isArray(target.likes)) target.likes = [];
            var idx = target.likes.indexOf('我');
            if (idx === -1) target.likes.push('我');
            else target.likes.splice(idx, 1);
            savePosts(posts);
          }
          openPopId = '';
          renderMoments();
          return;
        }

        var cmtBtn = e.target.closest('[data-comment-post]');
        if (cmtBtn) {
          e.stopPropagation();
          var cid = cmtBtn.getAttribute('data-comment-post');
          openPopId = '';
          var txt = prompt('写评论');
          if (txt && txt.trim()) {
            var posts2 = loadPosts();
            var target2 = posts2.find(function (p) { return p.id === cid; });
            if (target2) {
              if (!Array.isArray(target2.comments)) target2.comments = [];
              target2.comments.push({ author: '我', text: txt.trim() });
              savePosts(posts2);
            }
          }
          renderMoments();
          return;
        }

        var delBtn = e.target.closest('[data-del-post]');
        if (delBtn) {
          e.stopPropagation();
          var did = delBtn.getAttribute('data-del-post');
          if (!confirm('删除这条动态？')) return;
          var next = loadPosts().filter(function (p) { return p.id !== did; });
          savePosts(next);
          renderMoments();
          return;
        }

        if (openPopId) {
          openPopId = '';
          renderMoments();
        }
      });
    }
  }

  function init() {
    var scroll = document.getElementById('ctMainScroll');
    if (!scroll) return;
    var observer = new MutationObserver(function () {
      if (rendering) return;
      if (isMomentsTabActive()) {
        if (!scroll.querySelector('.ctm-wrap')) renderMoments();
      } else {
        var appEl = document.querySelector('#app-chat .ct-app');
        if (appEl) appEl.classList.remove('is-moments-tab');
      }
    });
    observer.observe(scroll, { childList: true });
    renderMoments();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
