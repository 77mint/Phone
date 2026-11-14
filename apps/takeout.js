(function () {
  var root = document.getElementById('app-takeout');
  if (!root) return;

  var STORES_KEY = 'phone_takeout_stores_v2';
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

  var BANNER_THEMES = [
    'linear-gradient(135deg, #2b2d42 0%, #5c677d 100%)',
    'linear-gradient(135deg, #5e503f 0%, #a9927d 100%)',
    'linear-gradient(135deg, #3d5a80 0%, #98c1d9 100%)',
    'linear-gradient(135deg, #6d597a 0%, #b56576 100%)',
    'linear-gradient(135deg, #354f52 0%, #84a98c 100%)',
    'linear-gradient(135deg, #7f4f24 0%, #b08968 100%)'
  ];

  var CATALOG = {
    breakfast: [
      { name: '晨光豆浆手作铺', dishes: ['现磨热豆浆', '流心蛋煎饼', '黄金酥脆油条', '鲜肉小笼包', '紫米饭团'] },
      { name: '南城早茶点心局', dishes: ['水晶虾饺皇', '干蒸烧卖', '叉烧包', '皮蛋瘦肉粥', '红米肠粉'] },
      { name: '麦田烘焙早餐屋', dishes: ['黄油可颂', '火腿芝士三明治', '牛油果滑蛋吐司', '冰美式咖啡', '热燕麦拿铁'] },
      { name: '老巷胡辣汤馆', dishes: ['牛肉胡辣汤', '水煎包', '茶叶蛋', '葱油拌面', '南瓜小米粥'] },
      { name: '街角手抓饼铺', dishes: ['培根肉松手抓饼', '里脊烤冷面', '玉米蔬菜粥', '豆沙烧饼', '原味豆奶'] }
    ],
    lunch: [
      { name: '一碗热饭 · 简餐', dishes: ['黑椒牛肉饭', '照烧鸡腿饭', '番茄滑蛋盖饭', '川香回锅肉饭', '例汤拼配'] },
      { name: '川味小厨便当', dishes: ['麻婆豆腐盖饭', '水煮肉片套餐', '辣子鸡丁饭', '酸辣土豆丝', '冰镇酸梅汤'] },
      { name: '粤式烧腊专门店', dishes: ['深井烧鹅饭', '蜜汁叉烧双拼', '白切鸡饭', '老火排骨汤', '白灼菜心'] },
      { name: '麦香牛肉面馆', dishes: ['红烧牛肉面', '番茄牛腩刀削面', '凉拌黄瓜', '卤牛腱切片', '酱香卤蛋'] },
      { name: '轻食能量碗', dishes: ['炙烤鸡胸沙拉', '烟熏三文鱼藜麦碗', '牛油果温泉蛋饭', '南瓜浓汤', '鲜榨橙汁'] }
    ],
    dinner: [
      { name: '巷口小炒馆', dishes: ['小炒黄牛肉', '糖醋里脊', '蒜蓉西兰花', '砂锅排骨汤', '扬州炒饭'] },
      { name: '渝味老火锅', dishes: ['麻辣牛肉锅底', '鲜毛肚', '手打虾滑', '脆嫩鸭肠', '红糖糍粑'] },
      { name: '江南本帮菜馆', dishes: ['外婆红烧肉', '松鼠桂鱼', '蟹粉豆腐', '清炒虾仁', '桂花酒酿圆子'] },
      { name: '湘里人家土菜', dishes: ['剁椒鱼头', '辣椒炒肉', '金钱蛋', '干锅花菜', '擂辣椒皮蛋'] },
      { name: '潮汕牛肉砂锅粥', dishes: ['鲜虾干贝砂锅粥', '手打牛肉丸', '湿炒牛河', '普宁炸豆腐', '凉拌鱼皮'] }
    ],
    supper: [
      { name: '深夜炭火烧烤', dishes: ['炭烤羊肉串', '蒜蓉烤茄子', '蜜汁烤鸡翅', '烤五花肉', '冰镇酸梅汤'] },
      { name: '十三香小龙虾馆', dishes: ['蒜蓉小龙虾', '麻辣小龙虾', '冰镇毛豆', '拍黄瓜', '烤冷面'] },
      { name: '阿婆麻辣烫', dishes: ['骨汤麻辣烫', '干拌麻辣拌', '炸蛋', '手打贡丸', '冰粉'] },
      { name: '夜猫子炒粉档', dishes: ['干炒牛河', '铁板炒方便面', '椒盐鸡脆骨', '炸年糕', '维他柠檬茶'] },
      { name: '老街卤味铺', dishes: ['秘制鸭脖', '麻辣鸭锁骨', '五香卤鸡爪', '卤藕片', '毛豆花生拼盘'] }
    ],
    milktea: [
      { name: '山茶花制茶局', dishes: ['山茶花乌龙奶绿', '芝士多肉葡萄', '烤椰生打拿铁', '黑糖波波牛乳', '杨枝甘露'] },
      { name: '清风鲜果茶室', dishes: ['手打柠檬茶', '生椰芒芒', '满杯百香果', '芝士莓莓', '冰糖雪梨'] },
      { name: '鹿岛咖啡茶饮', dishes: ['焦糖玛奇朵', '抹茶拿铁', '海盐芝士红茶', '桃桃乌龙', '厚乳波波'] },
      { name: '古法黑糖铺', dishes: ['黑糖珍珠鲜奶', '芋泥波波奶茶', '布蕾脆脆奶绿', '红豆双皮奶', '桂花冻乌龙'] },
      { name: '一隅手作茶室', dishes: ['白桃乌龙冷泡', '西柚气泡茶', '奶盖四季春', '燕麦红茶拿铁', '冻顶乌龙'] }
    ],
    dessert: [
      { name: '白日梦甜品屋', dishes: ['草莓千层蛋糕', '焦糖布丁', '抹茶巴斯克', '海盐奶油泡芙', '冰美式'] },
      { name: '可可实验室', dishes: ['生巧熔岩蛋糕', '提拉米苏', '榛子费南雪', '热可可', '法式马卡龙'] },
      { name: '糖水记广式甜品', dishes: ['杨枝甘露', '芒果班戟', '双皮奶', '芝麻糊', '芋圆仙草冻'] },
      { name: '云朵舒芙蕾', dishes: ['厚切草莓舒芙蕾', '焦糖海盐舒芙蕾', '抹茶红豆松饼', '水果酸奶碗', '白桃气泡水'] },
      { name: '法式塔点小铺', dishes: ['柠檬蛋白塔', '栗子蒙布朗', '蓝莓芝士蛋糕', '肉桂卷', '香草拿铁'] }
    ],
    japanese: [
      { name: '月见居酒屋', dishes: ['三文鱼刺身拼盘', '豚骨叉烧拉面', '炙烤鳗鱼饭', '章鱼小丸子', '抹茶大福'] },
      { name: '一风堂拉面屋', dishes: ['白丸元味拉面', '赤丸辣味拉面', '唐扬炸鸡块', '温泉蛋', '可尔必思'] },
      { name: '森之寿喜烧', dishes: ['和牛寿喜烧便当', '肥牛乌冬面', '玉子烧', '芝麻菠菜', '玄米茶'] },
      { name: '筑地海鲜丼', dishes: ['鹅肝三文鱼丼', '炙烤金枪鱼寿司', '甜虾刺身', '味噌汤', '梅子酒'] },
      { name: '鸟贵族烧鸟屋', dishes: ['明太子鸡肉串', '烤鸡皮', '盐烤牛舌', '日式炒乌冬', '土豆泥沙拉'] }
    ],
    korean: [
      { name: '首尔夜食屋', dishes: ['芝士火鸡面', '蜂蜜蒜香炸鸡', '泡菜肥牛锅', '鱼饼年糕', '草莓牛奶'] },
      { name: '明洞部队火锅', dishes: ['芝士部队锅', '辣炒年糕', '金枪鱼饭团', '炸酱面', '米露'] },
      { name: '釜山烤肉专门店', dishes: ['厚切五花肉便当', '秘制猪颈肉', '海鲜葱饼', '大酱汤', '气泡烧酒'] },
      { name: '梨泰院炸鸡社', dishes: ['甜辣双拼炸鸡', '芝士雪花炸鸡', '炸薯条', '腌萝卜块', '冰可乐'] },
      { name: '江南石锅拌饭', dishes: ['全州石锅拌饭', '牛肉海带汤', '辣白菜五花肉', '冷面', '香蕉牛奶'] }
    ],
    market: [
      { name: '24H 便利超市', dishes: ['冰镇气泡水', '海苔脆片', '鲜切水果盒', '关东煮拼盘', '草莓三明治'] },
      { name: '鲜丰水果严选', dishes: ['阳光玫瑰青提', '红颜草莓盒', '甘草芭乐', '鲜切芒果', '椰青'] },
      { name: '零食研究所', dishes: ['原味薯片', '辣条大礼包', '炭烤牛肉干', '夹心麻薯', '无糖乌龙茶'] },
      { name: '生活百货速达', dishes: ['维达抽纸整提', '一次性洗脸巾', '蒸汽眼罩', '矿泉水整箱', '润唇膏'] },
      { name: '深夜酒水便利', dishes: ['百香果果酒', '白桃气泡酒', '冰杯', '盐焗腰果', '柠檬片'] }
    ]
  };

  var stores = loadJson(STORES_KEY, []);
  var orders = loadJson(ORDERS_KEY, []);
  var currentTab = 'home';
  var activeCatView = '';
  var activeStoreId = '';
  var cart = {};
  var tempPayTarget = 'self';
  var isLoadingCat = false;

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
      var list = [];
      for (var i = 0; i < count; i++) {
        var item = meals[i % meals.length];
        list.push(item.strMealThumb ? (item.strMealThumb + '/medium') : '');
      }
      return list;
    }).catch(function () {
      return [];
    });
  }

  function ensureCategoryStores(catId) {
    var existing = stores.filter(function (s) { return s.category === catId; });
    if (existing.length >= 5) return Promise.resolve(existing);

    var templates = CATALOG[catId] || CATALOG.lunch;
    var need = 5 - existing.length;
    isLoadingCat = true;
    renderCategoryView();

    return fetchFoodPhotos(catId, 25).then(function (photos) {
      var usedNames = existing.map(function (s) { return s.name; });
      var added = 0;
      templates.forEach(function (tpl, tIdx) {
        if (added >= need) return;
        if (usedNames.indexOf(tpl.name) !== -1) return;

        var dishes = tpl.dishes.map(function (dName, dIdx) {
          return {
            id: 'ds_' + catId + '_' + Date.now() + '_' + tIdx + '_' + dIdx,
            name: dName,
            price: 15 + ((tIdx * 3 + dIdx * 5) % 28),
            desc: '门店招牌 · 新鲜现做',
            img: photos[(tIdx * 5 + dIdx) % Math.max(1, photos.length)] || ''
          };
        });

        stores.push({
          id: 'st_' + catId + '_' + Date.now() + '_' + tIdx,
          name: tpl.name,
          category: catId,
          bannerBg: BANNER_THEMES[(tIdx + catId.length) % BANNER_THEMES.length],
          score: (4.7 + (tIdx % 3) * 0.1).toFixed(1),
          deliveryMin: 20 + tIdx * 3,
          deliveryFee: tIdx % 2 === 0 ? 0 : 3,
          dishes: dishes
        });
        added++;
      });

      saveStores();
      isLoadingCat = false;
      renderCategoryView();
      renderHomePanel();
      return stores.filter(function (s) { return s.category === catId; });
    });
  }

  function ensureHomeRecommendations() {
    if (stores.length >= 4) return;
    isLoadingCat = true;
    renderHomePanel();
    Promise.all([
      ensureCategoryStores('breakfast'),
      ensureCategoryStores('milktea')
    ]).then(function () {
      isLoadingCat = false;
      renderHomePanel();
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

      '<div class="tk-cat-view" id="tkCatView"></div>' +
      '<div class="tk-detail" id="tkDetail"></div>' +

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
          '<button class="tk-primary-btn" id="tkSubmitOrderBtn" type="button">提交订单</button>' +
        '</div>' +
      '</div>' +

      '<div class="tk-toast" id="tkToast"></div>' +
      '<input type="file" id="tkFileStoreCover" accept="image/*" style="display:none;">' +
    '</div>';

  function renderStoreCardHtml(s) {
    var bgStyle = s.cover
      ? 'background-image:url(\'' + escapeHtml(s.cover) + '\');'
      : 'background:' + (s.bannerBg || BANNER_THEMES[0]) + ';';
    var feeTxt = s.deliveryFee ? ('配送费 ¥' + s.deliveryFee) : '免配送费';
    return (
      '<div class="tk-store-card" data-open-store="' + escapeHtml(s.id) + '">' +
        '<div class="tk-store-cover" style="' + bgStyle + '">' +
          '<span class="tk-store-badge">' + escapeHtml(catLabel(s.category)) + '</span>' +
          (!s.cover ? '<div class="tk-store-sign">' + escapeHtml(s.name) + '</div>' : '') +
        '</div>' +
        '<div class="tk-store-info">' +
          '<div class="tk-store-top">' +
            '<div class="tk-store-name">' + escapeHtml(s.name) + '</div>' +
            '<div class="tk-store-score">★ ' + escapeHtml(s.score || '4.9') + '</div>' +
          '</div>' +
          '<div class="tk-store-meta">约 ' + (s.deliveryMin || 25) + ' 分钟送达 · ' + feeTxt + ' · ' + ((s.dishes || []).length) + ' 款热卖</div>' +
        '</div>' +
      '</div>'
    );
  }

  function renderHomePanel() {
    var box = document.getElementById('tkPanelHome');
    var catsHtml = '<div class="tk-cats-card">' + CATEGORIES.map(function (c) {
      var on = c.id === 'all' ? ' active' : '';
      return (
        '<div class="tk-cat-item' + on + '" data-tk-cat="' + c.id + '">' +
          '<div class="tk-cat-icon">' + c.icon + '</div>' +
          '<div class="tk-cat-name">' + escapeHtml(c.name) + '</div>' +
        '</div>'
      );
    }).join('') + '</div>';

    var recList = stores.slice(0, 8);
    var listHtml = !recList.length
      ? '<div class="tk-empty"><div class="tk-empty-title">正在准备为你推荐的店铺...</div><div class="tk-empty-sub">点击上方任意分类也可直接进入全屏逛店</div></div>'
      : '<div class="tk-store-list">' + recList.map(renderStoreCardHtml).join('') + '</div>';

    box.innerHTML =
      catsHtml +
      '<div class="tk-sec-head"><div class="tk-sec-title">为你推荐</div></div>' +
      listHtml;
  }

  function renderCategoryView() {
    var view = document.getElementById('tkCatView');
    if (!activeCatView) return;
    var list = stores.filter(function (s) { return s.category === activeCatView; });

    view.innerHTML =
      '<div class="tk-cat-head">' +
        '<div class="tk-title">' + escapeHtml(catLabel(activeCatView)) + '</div>' +
        '<button class="tk-icon-circle" id="tkCloseCatBtn" type="button">' +
          '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
        '</button>' +
      '</div>' +
      '<div class="tk-cat-scroll">' +
        (isLoadingCat && !list.length
          ? '<div class="tk-empty"><div class="tk-empty-title">正在加载「' + escapeHtml(catLabel(activeCatView)) + '」店铺...</div></div>'
          : '<div class="tk-store-list">' + list.map(renderStoreCardHtml).join('') + '</div>') +
      '</div>';
  }

  function renderStoreDetail() {
    var detailEl = document.getElementById('tkDetail');
    var s = stores.find(function (x) { return x.id === activeStoreId; });
    if (!s) return;

    var bgStyle = s.cover
      ? 'background-image:url(\'' + escapeHtml(s.cover) + '\');'
      : 'background:' + (s.bannerBg || BANNER_THEMES[0]) + ';';

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
          '<img class="tk-dish-img" src="' + escapeHtml(d.img || '') + '" alt="">' +
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
      '<div class="tk-detail-banner" style="' + bgStyle + '">' +
        '<div class="tk-detail-overlay">' +
          '<div class="tk-detail-topbar">' +
            '<button class="tk-icon-circle" id="tkChangeCoverBtn" type="button" title="更换店铺封面">' +
              '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' +
            '</button>' +
            '<button class="tk-icon-circle" id="tkCloseDetailBtn" type="button">' +
              '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
            '</button>' +
          '</div>' +
          '<div>' +
            '<div class="tk-detail-title">' + escapeHtml(s.name) + '</div>' +
            '<div class="tk-detail-sub">' + escapeHtml(catLabel(s.category)) + ' · 约 ' + (s.deliveryMin || 25) + ' 分钟 · ' + (s.deliveryFee ? ('配送 ¥' + s.deliveryFee) : '免配送费') + '</div>' +
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
            '<div style="color:#8e8e93;font-size:12px;margin-top:4px;">对象：' + escapeHtml(o.targetLabel || '自己吃') + (o.note ? (' · 备注：' + escapeHtml(o.note)) : '') + '</div>' +
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

  document.getElementById('tkPanelHome').addEventListener('click', function (e) {
    var catItem = e.target.closest('[data-tk-cat]');
    if (catItem) {
      var cid = catItem.getAttribute('data-tk-cat');
      if (cid === 'all') return;
      activeCatView = cid;
      renderCategoryView();
      document.getElementById('tkCatView').classList.add('open');
      ensureCategoryStores(cid);
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

  document.getElementById('tkCatView').addEventListener('click', function (e) {
    if (e.target.closest('#tkCloseCatBtn')) {
      document.getElementById('tkCatView').classList.remove('open');
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
    if (e.target.closest('#tkChangeCoverBtn')) {
      document.getElementById('tkFileStoreCover').click();
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

  document.getElementById('tkFileStoreCover').addEventListener('change', function () {
    var file = this.files && this.files[0];
    this.value = '';
    if (!file || !activeStoreId) return;
    var s = stores.find(function (x) { return x.id === activeStoreId; });
    if (!s) return;
    var reader = new FileReader();
    reader.onload = function () {
      s.cover = reader.result;
      saveStores();
      renderStoreDetail();
      renderHomePanel();
      renderCategoryView();
      showToast('已更新店铺封面');
    };
    reader.readAsDataURL(file);
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
    document.getElementById('tkCatView').classList.remove('open');
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
  ensureHomeRecommendations();
})();