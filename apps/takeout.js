(function () {
  var root = document.getElementById('app-takeout');
  if (!root) return;

  var STORES_KEY = 'phone_takeout_stores_v1';
  var ORDERS_KEY = 'phone_takeout_orders_v1';

  var CATEGORIES = [
    { id: 'all', name: '全部', mealQuery: 'Chicken', icon: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>' },
    { id: 'breakfast', name: '早餐', mealQuery: 'Breakfast', icon: '<svg viewBox="0 0 24 24"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>' },
    { id: 'lunch', name: '午餐', mealQuery: 'Beef', icon: '<svg viewBox="0 0 24 24"><path d="M3 12h18"/><path d="M5 12a7 7 0 0 0 14 0"/><path d="M8 21h8"/></svg>' },
    { id: 'dinner', name: '晚餐', mealQuery: 'Pork', icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/></svg>' },
    { id: 'supper', name: '夜宵', mealQuery: 'Lamb', icon: '<svg viewBox="0 0 24 24"><path d="M12 2c1 4-2 6-2 10a4 4 0 0 0 8 0c0-3-2-5-2-8"/><path d="M7 14a5 5 0 0 0 10 0"/></svg>' },
    { id: 'milktea', name: '奶茶', mealQuery: 'Dessert', icon: '<svg viewBox="0 0 24 24"><path d="M7 8h10l-1 13H8L7 8z"/><path d="M5 8h14"/><path d="M12 2l2 6"/></svg>' },
    { id: 'dessert', name: '甜点', mealQuery: 'Dessert', icon: '<svg viewBox="0 0 24 24"><path d="M4 14h16v6H4z"/><path d="M4 14c0-3 3-5 8-5s8 2 8 5"/><circle cx="12" cy="6" r="2"/></svg>' },
    { id: 'japanese', name: '日料', mealQuery: 'Seafood', icon: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="9" ry="5"/><circle cx="12" cy="12" r="2"/></svg>' },
    { id: 'korean', name: '韩料', mealQuery: 'Chicken', icon: '<svg viewBox="0 0 24 24"><path d="M4 10h16a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6z"/><line x1="7" y1="20" x2="17" y2="20"/></svg>' },
    { id: 'market', name: '超市', mealQuery: 'Vegetarian', icon: '<svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>' }
  ];

  var STORE_TEMPLATES = {
    breakfast: { name: '晨光豆浆手作铺', dishes: ['现磨热豆浆', '流心蛋煎饼', '黄金油条', '鲜肉小笼包'] },
    lunch: { name: '一碗热饭 · 简餐', dishes: ['黑椒牛肉饭', '照烧鸡腿饭', '番茄滑蛋盖饭', '酸辣土豆丝'] },
    dinner: { name: '巷口小炒馆', dishes: ['小炒黄牛肉', '糖醋里脊', '蒜蓉西兰花', '砂锅排骨汤'] },
    supper: { name: '深夜炭火烧烤', dishes: ['炭烤羊肉串', '蒜蓉烤茄子', '脆皮鸡翅', '冰镇酸梅汤'] },
    milktea: { name: '山茶花制茶局', dishes: ['芝士多肉葡萄', '烤椰生打拿铁', '黑糖波波牛乳', '茉莉奶绿'] },
    dessert: { name: '白日梦甜品屋', dishes: ['草莓千层蛋糕', '焦糖布丁', '抹茶巴斯克', '海盐奶油泡芙'] },
    japanese: { name: '月见居酒屋', dishes: ['三文鱼刺身拼盘', '豚骨拉面', '炙烤鳗鱼饭', '抹茶大福'] },
    korean: { name: '首尔夜食屋', dishes: ['芝士火鸡面', '蜂蜜炸鸡', '泡菜肥牛锅', '鱼饼年糕'] },
    market: { name: '24H 便利超市', dishes: ['冰镇气泡水', '海苔脆片', '鲜切水果盒', '关东煮拼盘'] }
  };

  var stores = loadJson(STORES_KEY, []);
  var orders = loadJson(ORDERS_KEY, []);
  var currentTab = 'home'; // 'home' | 'orders'
  var activeCat = 'all';
  var activeStoreId = '';
  var cart = {};
  var tempStoreCover = '';
  var tempNewCat = 'lunch';
  var tempPayTarget = 'self';
  var isBusy = false;

  function loadJson(key, fallback) {
    try {
      var val = JSON.parse(localStorage.getItem(key) || 'null');
      return Array.isArray(val) ? val : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function saveStores() {
    localStorage.setItem(STORES_KEY, JSON.stringify(stores));
  }

  function saveOrders() {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function catLabel(catId) {
    var c = CATEGORIES.find(function (x) { return x.id === catId; });
    return c ? c.name : '午餐';
  }

  var toastTimer = null;
  function showToast(msg) {
    var el = document.getElementById('tkToast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.classList.remove('show');
    }, 2000);
  }

  function fetchFoodPhotos(catId, count) {
    var catObj = CATEGORIES.find(function (c) { return c.id === catId; }) || CATEGORIES[0];
    var url = 'https://www.themealdb.com/api/json/v1/1/filter.php?c=' + encodeURIComponent(catObj.mealQuery || 'Chicken');
    return fetch(url).then(function (res) {
      return res.json();
    }).then(function (data) {
      var meals = Array.isArray(data && data.meals) ? data.meals : [];
      if (!meals.length) return [];
      var shuffled = meals.slice().sort(function () { return Math.random() - 0.5; });
      return shuffled.slice(0, count).map(function (m) {
        return m.strMealThumb ? (m.strMealThumb + '/medium') : '';
      }).filter(Boolean);
    }).catch(function () {
      return [];
    });
  }

  function generateStoreForCategory(catId) {
    var targetCat = (catId && catId !== 'all') ? catId : 'lunch';
    var tpl = STORE_TEMPLATES[targetCat] || STORE_TEMPLATES.lunch;
    isBusy = true;
    renderHomePanel();

    fetchFoodPhotos(targetCat, 5).then(function (photos) {
      var storeId = 'st_' + Date.now();
      var dishes = tpl.dishes.map(function (dName, idx) {
        return {
          id: 'ds_' + Date.now() + '_' + idx,
          name: dName,
          price: 16 + Math.floor(Math.random() * 28),
          desc: '招牌现做 · 好评热卖',
          img: photos[idx + 1] || photos[0] || ''
        };
      });

      stores.unshift({
        id: storeId,
        name: tpl.name,
        category: targetCat,
        cover: photos[0] || '',
        score: (4.7 + Math.random() * 0.25).toFixed(1),
        deliveryMin: 22 + Math.floor(Math.random() * 18),
        deliveryFee: Math.random() > 0.5 ? 0 : 3,
        dishes: dishes
      });
      saveStores();
      isBusy = false;
      renderHomePanel();
      showToast('已生成「' + tpl.name + '」');
    });
  }

  root.innerHTML =
    '<div class="tk-wrap" id="tkWrap">' +
      '<div class="tk-header">' +
        '<div class="tk-header-left">' +
          '<div class="mu-back-sm tk-back" data-close-app>' +
            '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>' +
          '</div>' +
          '<div class="tk-title" id="tkTitle">小团外卖</div>' +
        '</div>' +
        '<div class="tk-header-actions">' +
          '<button class="tk-pill-btn" id="tkNewStoreBtn" type="button">+ 开新店</button>' +
        '</div>' +
      '</div>' +

      '<div class="tk-body">' +
        '<div class="tk-panel active" id="tkPanelHome"></div>' +
        '<div class="tk-panel" id="tkPanelOrders"></div>' +
      '</div>' +

      '<div class="lg-bottom-bar tk-bottom-bar" id="tkBottomBar">' +
        '<div class="tk-tab-indicator"></div>' +
        '<div class="tk-tab active" data-tk-tab="home">点外卖</div>' +
        '<div class="tk-tab" data-tk-tab="orders">订单</div>' +
      '</div>' +

      '<div class="tk-detail" id="tkDetail"></div>' +

      '<div class="tk-modal" id="tkStoreModal">' +
        '<div class="tk-dialog">' +
          '<div class="tk-dialog-head">' +
            '<div class="tk-dialog-title">开一家新店</div>' +
            '<button class="tk-icon-circle" id="tkCloseStoreModal" type="button">' +
              '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
            '</button>' +
          '</div>' +
          '<div class="tk-label">店铺名称</div>' +
          '<div class="tk-input-box"><input type="text" class="tk-input" id="tkNewStoreName" placeholder="例如：街角手作奶茶"></div>' +
          '<div class="tk-field">' +
            '<div class="tk-label">所属分类</div>' +
            '<div class="tk-chips" id="tkNewCatChips"></div>' +
          '</div>' +
          '<div class="tk-field">' +
            '<div class="tk-label">店铺招牌图（可贴链接或相册选图，留空自动配图）</div>' +
            '<div class="tk-input-box">' +
              '<input type="text" class="tk-input" id="tkNewStoreImgUrl" placeholder="https://... 或点右侧选图">' +
              '<button class="tk-btn" id="tkPickStoreImgBtn" type="button" style="padding:5px 10px;font-size:12px;">相册</button>' +
            '</div>' +
          '</div>' +
          '<button class="tk-primary-btn" id="tkSaveStoreBtn" type="button">创建店铺</button>' +
        '</div>' +
      '</div>' +

      '<div class="tk-modal" id="tkCheckoutModal">' +
        '<div class="tk-dialog">' +
          '<div class="tk-dialog-head">' +
            '<div class="tk-dialog-title">确认下单</div>' +
            '<button class="tk-icon-circle" id="tkCloseCheckoutModal" type="button">' +
              '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
            '</button>' +
          '</div>' +
          '<div class="tk-label">点给谁 / 谁来付</div>' +
          '<div class="tk-chips" id="tkPayTargetChips"></div>' +
          '<div class="tk-field">' +
            '<div class="tk-label">备注（可选）</div>' +
            '<div class="tk-input-box"><input type="text" class="tk-input" id="tkOrderNote" placeholder="例如：少冰半糖，放门口就行"></div>' +
          '</div>' +
          <button class="tk-primary-btn" id="tkSubmitOrderBtn" type="button">提交订单</button>
        '</div>' +
      '</div>' +

      '<div class="tk-toast" id="tkToast"></div>' +
      '<input type="file" id="tkFileStoreImg" accept="image/*" style="display:none;">' +
    '</div>';

  function renderHomePanel() {
    var box = document.getElementById('tkPanelHome');
    var catsHtml = '<div class="tk-cats-card">' + CATEGORIES.map(function (c) {
      var on = activeCat === c.id ? ' active' : '';
      return (
        '<div class="tk-cat-item' + on + '" data-tk-cat="' + c.id + '">' +
          '<div class="tk-cat-icon">' + c.icon + '</div>' +
          '<div class="tk-cat-name">' + escapeHtml(c.name) + '</div>' +
        '</div>'
      );
    }).join('') + '</div>';

    var filtered = activeCat === 'all'
      ? stores
      : stores.filter(function (s) { return s.category === activeCat; });

    var secTitle = activeCat === 'all' ? '为你推荐' : (catLabel(activeCat) + '推荐');
    var listHtml = '';
    if (!filtered.length) {
      listHtml =
        '<div class="tk-empty">' +
          '<div class="tk-empty-title">「' + escapeHtml(catLabel(activeCat)) + '」暂无店铺</div>' +
          '<div class="tk-empty-sub">点下面按钮自动生成一家带高清美食图的店铺，或自己开一家</div>' +
          '<div class="tk-empty-btns">' +
            '<button class="tk-btn is-dark" id="tkGenStoreBtn" type="button">' + (isBusy ? '正在配图中...' : '一键开店（自动配图）') + '</button>' +
            '<button class="tk-btn" id="tkEmptyNewBtn" type="button">手动开店</button>' +
          '</div>' +
        '</div>';
    } else {
      listHtml = '<div class="tk-store-list">' + filtered.map(function (s) {
        var coverStyle = s.cover ? ' style="background-image:url(\'' + escapeHtml(s.cover) + '\');"' : '';
        var feeTxt = s.deliveryFee ? ('配送费 ¥' + s.deliveryFee) : '免配送费';
        var thumbsHtml = (s.dishes || []).slice(0, 4).map(function (d) {
          return '<div class="tk-dish-chip">' +
            (d.img ? '<img src="' + escapeHtml(d.img) + '" alt="">' : '') +
            '<span>' + escapeHtml(d.name) + '</span>' +
          '</div>';
        }).join('');

        return (
          '<div class="tk-store-card" data-open-store="' + escapeHtml(s.id) + '">' +
            '<div class="tk-store-cover"' + coverStyle + '>' +
              '<span class="tk-store-badge">' + escapeHtml(catLabel(s.category)) + '</span>' +
            '</div>' +
            '<div class="tk-store-info">' +
              '<div class="tk-store-top">' +
                '<div class="tk-store-name">' + escapeHtml(s.name) + '</div>' +
                '<div class="tk-store-score">★ ' + escapeHtml(s.score || '4.9') + '</div>' +
              '</div>' +
              '<div class="tk-store-meta">约 ' + (s.deliveryMin || 28) + ' 分钟送达 · ' + feeTxt + '</div>' +
              (thumbsHtml ? '<div class="tk-dish-thumbs">' + thumbsHtml + '</div>' : '') +
            '</div>' +
          '</div>'
        );
      }).join('') + '</div>';
    }

    box.innerHTML =
      catsHtml +
      '<div class="tk-sec-head">' +
        '<div class="tk-sec-title">' + escapeHtml(secTitle) + '</div>' +
        '<div class="tk-sec-action" id="tkQuickGenBtn">' + (isBusy ? '生成中...' : '+ 随机逛一家新店') + '</div>' +
      '</div>' +
      listHtml;
  }

  function renderStoreDetail() {
    var detailEl = document.getElementById('tkDetail');
    var s = stores.find(function (x) { return x.id === activeStoreId; });
    if (!s) return;

    var coverStyle = s.cover ? ' style="background-image:url(\'' + escapeHtml(s.cover) + '\');"' : '';
    var dishes = s.dishes || [];
    var totalCount = 0;
    var totalPrice = 0;
    dishes.forEach(function (d) {
      var q = cart[d.id] || 0;
      totalCount += q;
      totalPrice += q * (Number(d.price) || 0);
    });
    if (totalCount > 0) totalPrice += (Number(s.deliveryFee) || 0);

    var dishesHtml = dishes.map(function (d) {
      var q = cart[d.id] || 0;
      return (
        '<div class="tk-dish-card">' +
          '<img class="tk-dish-img" src="' + escapeHtml(d.img || s.cover || '') + '" alt="">' +
          '<div class="tk-dish-body">' +
            '<div>' +
              '<div class="tk-dish-name">' + escapeHtml(d.name) + '</div>' +
              '<div class="tk-dish-desc">' + escapeHtml(d.desc || '现点现做') + '</div>' +
            '</div>' +
            '<div class="tk-dish-foot">' +
              '<div class="tk-dish-price">¥' + (Number(d.price) || 0) + '</div>' +
              '<div class="tk-qty-ctrl">' +
                (q > 0 ? '<button class="tk-qty-btn" data-qty-minus="' + escapeHtml(d.id) + '" type="button">-</button>' : '') +
                (q > 0 ? '<span style="font-weight:700;min-width:16px;text-align:center;">' + q + '</span>' : '') +
                '<button class="tk-qty-btn is-add" data-qty-add="' + escapeHtml(d.id) + '" type="button">+</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    detailEl.innerHTML =
      '<div class="tk-detail-banner"' + coverStyle + '>' +
        '<div class="tk-detail-overlay">' +
          '<div class="tk-detail-topbar">' +
            '<button class="tk-icon-circle" id="tkDelStoreBtn" type="button" title="删除店铺">' +
              '<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>' +
            '</button>' +
            '<button class="tk-icon-circle" id="tkCloseDetailBtn" type="button">' +
              '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
            '</button>' +
          '</div>' +
          '<div>' +
            '<div class="tk-detail-title">' + escapeHtml(s.name) + '</div>' +
            '<div class="tk-detail-sub">' + escapeHtml(catLabel(s.category)) + ' · 约 ' + (s.deliveryMin || 28) + ' 分钟 · ' + (s.deliveryFee ? ('配送 ¥' + s.deliveryFee) : '免配送费') + '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="tk-detail-scroll">' + dishesHtml + '</div>' +
      (totalCount > 0 ? (
        '<div class="tk-cart-bar">' +
          '<div><span style="font-weight:700;font-size:17px;">¥' + totalPrice + '</span> <span style="font-size:12px;opacity:0.75;">已选 ' + totalCount + ' 件</span></div>' +
          '<button class="tk-cart-pay" id="tkOpenCheckoutBtn" type="button">去下单</button>' +
        '</div>'
      ) : '');
  }

  function renderOrdersPanel() {
    var box = document.getElementById('tkPanelOrders');
    if (!orders.length) {
      box.innerHTML =
        '<div class="tk-empty">' +
          '<div class="tk-empty-title">暂无外卖订单</div>' +
          '<div class="tk-empty-sub">去「点外卖」选一家喜欢的店下单吧</div>' +
        '</div>';
      return;
    }

    box.innerHTML = orders.map(function (o) {
      var itemText = (o.items || []).map(function (it) { return it.name + ' ×' + it.qty; }).join('、');
      var isDone = o.status === '已送达';
      return (
        '<div class="tk-order-card">' +
          '<div class="tk-order-top">' +
            '<div style="font-weight:700;">' + escapeHtml(o.storeName) + '</div>' +
            '<span class="tk-order-status">' + escapeHtml(o.status) + '</span>' +
          '</div>' +
          '<div class="tk-order-items">' +
            '<div>' + escapeHtml(itemText) + '</div>' +
            '<div style="color:#8e8e93;font-size:12px;margin-top:4px;">对象：' + escapeHtml(o.targetLabel || '自己') + (o.note ? (' · 备注：' + escapeHtml(o.note)) : '') + '</div>' +
          '</div>' +
          '<div class="tk-order-foot">' +
            '<div style="font-weight:700;">实付 ¥' + o.total + '</div>' +
            (!isDone ? '<button class="tk-btn is-dark" style="padding:6px 12px;font-size:12px;" data-order-done="' + escapeHtml(o.id) + '" type="button">确认送达</button>' : '<span style="font-size:12px;color:#8e8e93;">' + escapeHtml(o.time || '') + '</span>') +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  function switchTab(tab) {
    currentTab = tab;
    var isOrders = tab === 'orders';
    document.getElementById('tkWrap').classList.toggle('is-subtab', isOrders);
    document.getElementById('tkBottomBar').classList.toggle('is-orders', isOrders);
    document.getElementById('tkTitle').textContent = isOrders ? '我的订单' : '小团外卖';
    document.getElementById('tkPanelHome').classList.toggle('active', !isOrders);
    document.getElementById('tkPanelOrders').classList.toggle('active', isOrders);
    root.querySelectorAll('.tk-tab').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-tk-tab') === tab);
    });
    if (isOrders) renderOrdersPanel();
    else renderHomePanel();
  }

  function openNewStoreModal() {
    tempStoreCover = '';
    tempNewCat = activeCat !== 'all' ? activeCat : 'lunch';
    document.getElementById('tkNewStoreName').value = '';
    document.getElementById('tkNewStoreImgUrl').value = '';
    renderNewCatChips();
    document.getElementById('tkStoreModal').classList.add('open');
  }

  function renderNewCatChips() {
    var html = CATEGORIES.filter(function (c) { return c.id !== 'all'; }).map(function (c) {
      return '<div class="tk-chip' + (tempNewCat === c.id ? ' active' : '') + '" data-new-cat="' + c.id + '">' + escapeHtml(c.name) + '</div>';
    }).join('');
    document.getElementById('tkNewCatChips').innerHTML = html;
  }

  function renderPayTargetChips() {
    var chars = (window.PhoneArchive && window.PhoneArchive.getChars) ? window.PhoneArchive.getChars() : [];
    var opts = [{ id: 'self', label: '自己吃' }];
    chars.forEach(function (c) {
      var name = c.name || c.nickname || 'Char';
      opts.push({ id: 'feed_' + c.id, label: '投喂 ' + name });
      opts.push({ id: 'pay_' + c.id, label: '找 ' + name + ' 代付' });
    });
    document.getElementById('tkPayTargetChips').innerHTML = opts.map(function (o) {
      return '<div class="tk-chip' + (tempPayTarget === o.id ? ' active' : '') + '" data-pay-target="' + escapeHtml(o.id) + '">' + escapeHtml(o.label) + '</div>';
    }).join('');
  }

  root.querySelectorAll('.tk-tab').forEach(function (el) {
    el.addEventListener('click', function () {
      switchTab(el.getAttribute('data-tk-tab'));
    });
  });

  document.getElementById('tkNewStoreBtn').addEventListener('click', openNewStoreModal);
  document.getElementById('tkCloseStoreModal').addEventListener('click', function () {
    document.getElementById('tkStoreModal').classList.remove('open');
  });
  document.getElementById('tkNewCatChips').addEventListener('click', function (e) {
    var chip = e.target.closest('[data-new-cat]');
    if (!chip) return;
    tempNewCat = chip.getAttribute('data-new-cat');
    renderNewCatChips();
  });

  document.getElementById('tkPickStoreImgBtn').addEventListener('click', function () {
    document.getElementById('tkFileStoreImg').click();
  });
  document.getElementById('tkFileStoreImg').addEventListener('change', function () {
    var file = this.files && this.files[0];
    this.value = '';
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      tempStoreCover = reader.result;
      document.getElementById('tkNewStoreImgUrl').value = '已选本地图片';
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('tkSaveStoreBtn').addEventListener('click', function () {
    var name = document.getElementById('tkNewStoreName').value.trim();
    if (!name) {
      showToast('请输入店铺名称');
      return;
    }
    var urlInput = document.getElementById('tkNewStoreImgUrl').value.trim();
    var finalCover = tempStoreCover || (/^https?:\/\//i.test(urlInput) ? urlInput : '');
    document.getElementById('tkStoreModal').classList.remove('open');

    fetchFoodPhotos(tempNewCat, 4).then(function (photos) {
      var tpl = STORE_TEMPLATES[tempNewCat] || STORE_TEMPLATES.lunch;
      var cover = finalCover || photos[0] || '';
      var dishes = tpl.dishes.map(function (dName, idx) {
        return {
          id: 'ds_' + Date.now() + '_' + idx,
          name: dName,
          price: 18 + idx * 4,
          desc: '店内招牌 · 现点现做',
          img: photos[idx] || cover
        };
      });
      stores.unshift({
        id: 'st_' + Date.now(),
        name: name,
        category: tempNewCat,
        cover: cover,
        score: '4.9',
        deliveryMin: 25,
        deliveryFee: 0,
        dishes: dishes
      });
      saveStores();
      activeCat = tempNewCat;
      renderHomePanel();
      showToast('已开店「' + name + '」');
    });
  });

  document.getElementById('tkPanelHome').addEventListener('click', function (e) {
    var catItem = e.target.closest('[data-tk-cat]');
    if (catItem) {
      activeCat = catItem.getAttribute('data-tk-cat');
      renderHomePanel();
      return;
    }
    if (e.target.closest('#tkGenStoreBtn') || e.target.closest('#tkQuickGenBtn')) {
      if (!isBusy) generateStoreForCategory(activeCat);
      return;
    }
    if (e.target.closest('#tkEmptyNewBtn')) {
      openNewStoreModal();
      return;
    }
    var storeCard = e.target.closest('[data-open-store]');
    if (storeCard) {
      activeStoreId = storeCard.getAttribute('data-open-store');
      cart = {};
      renderStoreDetail();
      document.getElementById('tkDetail').classList.add('open');
    }
  });

  document.getElementById('tkDetail').addEventListener('click', function (e) {
    if (e.target.closest('#tkCloseDetailBtn')) {
      document.getElementById('tkDetail').classList.remove('open');
      return;
    }
    if (e.target.closest('#tkDelStoreBtn')) {
      stores = stores.filter(function (s) { return s.id !== activeStoreId; });
      saveStores();
      document.getElementById('tkDetail').classList.remove('open');
      renderHomePanel();
      showToast('已删除店铺');
      return;
    }
    var addBtn = e.target.closest('[data-qty-add]');
    if (addBtn) {
      var did = addBtn.getAttribute('data-qty-add');
      cart[did] = (cart[did] || 0) + 1;
      renderStoreDetail();
      return;
    }
    var minusBtn = e.target.closest('[data-qty-minus]');
    if (minusBtn) {
      var mid = minusBtn.getAttribute('data-qty-minus');
      if (cart[mid] > 1) cart[mid]--;
      else delete cart[mid];
      renderStoreDetail();
      return;
    }
    if (e.target.closest('#tkOpenCheckoutBtn')) {
      tempPayTarget = 'self';
      document.getElementById('tkOrderNote').value = '';
      renderPayTargetChips();
      document.getElementById('tkCheckoutModal').classList.add('open');
    }
  });

  document.getElementById('tkCloseCheckoutModal').addEventListener('click', function () {
    document.getElementById('tkCheckoutModal').classList.remove('open');
  });

  document.getElementById('tkPayTargetChips').addEventListener('click', function (e) {
    var chip = e.target.closest('[data-pay-target]');
    if (!chip) return;
    tempPayTarget = chip.getAttribute('data-pay-target');
    renderPayTargetChips();
  });

  document.getElementById('tkSubmitOrderBtn').addEventListener('click', function () {
    var s = stores.find(function (x) { return x.id === activeStoreId; });
    if (!s) return;
    var pickedItems = [];
    var total = Number(s.deliveryFee) || 0;
    (s.dishes || []).forEach(function (d) {
      var q = cart[d.id] || 0;
      if (q > 0) {
        pickedItems.push({ name: d.name, price: d.price, qty: q });
        total += q * (Number(d.price) || 0);
      }
    });
    if (!pickedItems.length) return;

    var pickedChip = document.querySelector('#tkPayTargetChips .tk-chip.active');
    var targetLabel = pickedChip ? pickedChip.textContent : '自己吃';
    var now = new Date();
    var timeStr = (now.getMonth() + 1) + '/' + now.getDate() + ' ' +
      String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

    orders.unshift({
      id: 'ord_' + Date.now(),
      storeName: s.name,
      items: pickedItems,
      total: total,
      targetLabel: targetLabel,
      note: document.getElementById('tkOrderNote').value.trim(),
      status: '骑手配送中',
      time: timeStr
    });
    saveOrders();
    cart = {};
    document.getElementById('tkCheckoutModal').classList.remove('open');
    document.getElementById('tkDetail').classList.remove('open');
    switchTab('orders');
    showToast('下单成功，骑手配送中');
  });

  document.getElementById('tkPanelOrders').addEventListener('click', function (e) {
    var doneBtn = e.target.closest('[data-order-done]');
    if (!doneBtn) return;
    var oid = doneBtn.getAttribute('data-order-done');
    var o = orders.find(function (x) { return x.id === oid; });
    if (o) {
      o.status = '已送达';
      saveOrders();
      renderOrdersPanel();
      showToast('订单已送达');
    }
  });

  renderHomePanel();
})();