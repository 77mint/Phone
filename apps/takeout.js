/* =========================================================
   小团外卖 (apps/takeout.js)
   - 首页：分类入口 + 为你推荐（仅全部）；店铺封面采用稳定实景照片
   - 9 大分类全屏页：每类 5 家独立店铺，每家 5 道以上菜品（含西餐）
   - 店铺详情页：真实美食图 + 可点击展开的购物车抽屉 + 结算（自己吃 / 投喂 Char / 找 Char 代付）
   ========================================================= */

(function () {
    const STORAGE_ORDERS_KEY = 'takeout_orders_v1';
    const STORAGE_COVERS_KEY = 'takeout_store_covers_v1';
    const STORAGE_PHOTO_CACHE_KEY = 'takeout_meal_photo_cache_v1';
    const STORAGE_PICSUM_LIST_KEY = 'takeout_picsum_list_v1';

    const CATEGORIES = [
        {
            id: 'all',
            name: '全部',
            icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>'
        },
        {
            id: 'breakfast',
            name: '早餐',
            icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg>'
        },
        {
            id: 'lunch',
            name: '午餐',
            icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18"/><path d="M4 12a8 8 0 0 0 16 0"/><path d="M9 20h6"/></svg>'
        },
        {
            id: 'dinner',
            name: '晚餐',
            icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/></svg>'
        },
        {
            id: 'supper',
            name: '夜宵',
            icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c1.5 3 4 4.5 4 8a4 4 0 1 1-8 0c0-2 1.5-3.5 2-5 .5 1.5 1.5 2 2 2 0-2 0-3.5 0-5z"/></svg>'
        },
        {
            id: 'milktea',
            name: '奶茶',
            icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 8h10l-1 13H8L7 8z"/><path d="M5 8h14"/><path d="M12 8l2-5"/></svg>'
        },
        {
            id: 'dessert',
            name: '甜点',
            icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 13h12a2 2 0 0 1 2 2v5H4v-5a2 2 0 0 1 2-2z"/><path d="M8 13v-2a4 4 0 0 1 8 0v2"/><circle cx="12" cy="5" r="1.5"/></svg>'
        },
        {
            id: 'japanese',
            name: '日料',
            icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="12" rx="9" ry="5.5"/><circle cx="12" cy="12" r="2"/></svg>'
        },
        {
            id: 'korean',
            name: '韩料',
            icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11h16a8 8 0 0 1-16 0Z"/><path d="M8 19h8"/><path d="M6 7h12"/></svg>'
        },
        {
            id: 'western',
            name: '西餐',
            icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3v7a2 2 0 0 0 2 2v9"/><path d="M9 3v7a2 2 0 0 1-2 2"/><path d="M7 3v4"/><path d="M16 3v18"/><path d="M16 3c2.5 0 3.5 2 3.5 5s-1 5-3.5 5"/></svg>'
        }
    ];

    const STORE_BLUEPRINTS = [
        /* ---------------- 早餐 (5家) ---------------- */
        { id: 'bf-1', category: 'breakfast', name: '晨光豆浆手作铺', rating: 4.9, eta: 20, fee: 0, mealCat: 'Breakfast', dishes: ['现磨热豆浆', '流心蛋煎饼', '黄金酥脆油条', '鲜肉小笼包', '黑芝麻糊'] },
        { id: 'bf-2', category: 'breakfast', name: '早安可颂烘焙坊', rating: 4.8, eta: 22, fee: 3, mealCat: 'Breakfast', dishes: ['黄油牛角可颂', '培根芝士贝果', '海盐卷面包', '燕麦拿铁', '法式蛋挞'] },
        { id: 'bf-3', category: 'breakfast', name: '老街热粥铺', rating: 4.7, eta: 25, fee: 0, mealCat: 'Breakfast', dishes: ['皮蛋瘦肉粥', '瑶柱鲜虾粥', '酱香肉末肠粉', '蒸玉米饺', '茶叶蛋两枚'] },
        { id: 'bf-4', category: 'breakfast', name: '三明治研究所', rating: 4.8, eta: 18, fee: 2, mealCat: 'Breakfast', dishes: ['滑蛋厚吐司', '牛油果鸡胸三明治', '金枪鱼全麦帕尼尼', '美式冰咖啡', '蓝莓酸奶杯'] },
        { id: 'bf-5', category: 'breakfast', name: '阿婆饭团专卖', rating: 4.9, eta: 20, fee: 0, mealCat: 'Breakfast', dishes: ['咸蛋黄肉松饭团', '黑米脆油条饭团', '紫菜包饭卷', '热红豆薏米水', '卤香豆腐干'] },

        /* ---------------- 午餐 (5家) ---------------- */
        { id: 'ln-1', category: 'lunch', name: '一碗热饭 · 简餐', rating: 4.9, eta: 25, fee: 3, mealCat: 'Beef', dishes: ['黑椒牛肉饭', '照烧鸡腿饭', '番茄滑蛋盖饭', '卤肉溏心蛋饭', '酸辣土豆丝配饭'] },
        { id: 'ln-2', category: 'lunch', name: '慢炖红烧牛肉面', rating: 4.8, eta: 24, fee: 2, mealCat: 'Beef', dishes: ['招牌牛腩宽面', '酸菜肥牛米线', '红油抄手', '卤牛腱拼盘', '冰镇酸梅汤'] },
        { id: 'ln-3', category: 'lunch', name: '轻食能量碗实验室', rating: 4.8, eta: 22, fee: 4, mealCat: 'Chicken', dishes: ['烤鸡胸藜麦碗', '烟熏三文鱼波奇饭', '牛油果温泉蛋沙拉', '黑椒牛肉荞麦面', '羽衣甘蓝果蔬汁'] },
        { id: 'ln-4', category: 'lunch', name: '川味小炒快线', rating: 4.7, eta: 28, fee: 3, mealCat: 'Pork', dishes: ['鱼香肉丝盖饭', '宫保鸡丁套餐', '麻婆豆腐拌饭', '回锅肉小炒', '冰粉一碗'] },
        { id: 'ln-5', category: 'lunch', name: '港式烧腊茶餐厅', rating: 4.9, eta: 26, fee: 4, mealCat: 'Pork', dishes: ['蜜汁叉烧双拼饭', '脆皮烧鸭饭', '干炒牛河', 'XO酱海鲜炒饭', '港式冻柠茶'] },

        /* ---------------- 晚餐 (5家) ---------------- */
        { id: 'dn-1', category: 'dinner', name: '烟火家常菜馆', rating: 4.9, eta: 30, fee: 4, mealCat: 'Seafood', dishes: ['糖醋排骨', '清蒸鲈鱼', '蒜蓉西兰花', '番茄牛腩煲', '老鸭粉丝汤'] },
        { id: 'dn-2', category: 'dinner', name: '老北京铜锅小份菜', rating: 4.8, eta: 32, fee: 5, mealCat: 'Lamb', dishes: ['麻酱肥牛锅', '手切鲜羊肉单人锅', '脆炸响铃卷', '老北京糖蒜', '桂花酸梅饮'] },
        { id: 'dn-3', category: 'dinner', name: '云贵酸汤鱼锅', rating: 4.8, eta: 29, fee: 4, mealCat: 'Seafood', dishes: ['红酸汤乌鱼片', '香茅烤罗非鱼', '折耳根拌脆笋', '菠萝紫米饭', '玫瑰冰凉糕'] },
        { id: 'dn-4', category: 'dinner', name: '江南小馆 · 本帮菜', rating: 4.9, eta: 30, fee: 5, mealCat: 'Pork', dishes: ['外婆红烧肉', '响油鳝丝', '蟹粉豆腐煲', '清炒虾仁', '桂花糖藕'] },
        { id: 'dn-5', category: 'dinner', name: '椰子鸡原味炖锅', rating: 4.7, eta: 28, fee: 4, mealCat: 'Chicken', dishes: ['原味椰青鸡锅', '竹荪鲜鸡单人煲', '腊味煲仔饭', '手打马蹄丸', '鲜榨椰汁'] },

        /* ---------------- 夜宵 (5家) ---------------- */
        { id: 'sp-1', category: 'supper', name: '深夜碳水烤串铺', rating: 4.9, eta: 28, fee: 4, mealCat: 'Lamb', dishes: ['炭烤羊肉串 6 串', '蜜汁烤鸡翅', '蒜蓉烤生蚝 4 只', '锡纸酸辣金针菇', '烤面筋 3 串'] },
        { id: 'sp-2', category: 'supper', name: '十三香小龙虾专门店', rating: 4.8, eta: 32, fee: 5, mealCat: 'Seafood', dishes: ['蒜蓉小龙虾', '麻辣小龙虾尾', '冰镇毛豆', '葱油拌面', '柠檬气泡水'] },
        { id: 'sp-3', category: 'supper', name: '夜猫子炸鸡屋', rating: 4.8, eta: 24, fee: 3, mealCat: 'Chicken', dishes: ['脆皮整只炸鸡', '蜂蜜芥末无骨鸡块', '芝士年糕球', '黄金粗薯条', '冰可乐'] },
        { id: 'sp-4', category: 'supper', name: '巷口麻辣烫砂锅', rating: 4.7, eta: 25, fee: 2, mealCat: 'Miscellaneous', dishes: ['牛骨浓汤麻辣烫', '麻酱干拌麻辣拌', '鲜鸭血宽粉', '炸响铃配肥牛', '冰红茶'] },
        { id: 'sp-5', category: 'supper', name: '潮汕砂锅粥夜档', rating: 4.9, eta: 30, fee: 3, mealCat: 'Seafood', dishes: ['干贝鲜虾砂锅粥', '膏蟹海鲜粥', '普宁炸豆腐', '卤水鹅肉拼盘', '橄榄菜四季豆'] },

        /* ---------------- 奶茶 (5家) ---------------- */
        { id: 'mt-1', category: 'milktea', name: '云朵茶事局', rating: 4.9, eta: 18, fee: 0, mealCat: 'Dessert', dishes: ['白桃乌龙鲜奶茶', '黑糖波波厚乳', '芝士茉莉奶绿', '杨枝甘露', '芋泥麻薯波波'] },
        { id: 'mt-2', category: 'milktea', name: '山野冷泡茶铺', rating: 4.8, eta: 20, fee: 2, mealCat: 'Dessert', dishes: ['鸭屎香手打柠檬茶', '桂花龙井轻乳茶', '青提冻冻茶', '多肉葡萄冰沙', '栀子绿茶冰萃'] },
        { id: 'mt-3', category: 'milktea', name: '京都宇治抹茶社', rating: 4.9, eta: 22, fee: 3, mealCat: 'Dessert', dishes: ['浓醇宇治抹茶拿铁', '海盐芝士焙茶', '黑糖豆乳抹茶', '红豆白玉抹茶冰', '玄米鲜奶茶'] },
        { id: 'mt-4', category: 'milktea', name: '鲜果茶水铺', rating: 4.7, eta: 19, fee: 1, mealCat: 'Dessert', dishes: ['满杯百香果双响炮', '西瓜椰椰冻', '超厚芒芒甘露', '草莓芝士奶盖', '金桔柠檬水'] },
        { id: 'mt-5', category: 'milktea', name: '手炒黑糖牛乳社', rating: 4.8, eta: 20, fee: 2, mealCat: 'Dessert', dishes: ['招牌黑糖珍珠牛乳', '奥利奥奶盖可可', '焦糖布丁烤奶', '双拼芋圆奶茶', '厚芋泥鲜奶'] },

        /* ---------------- 甜点 (5家) ---------------- */
        { id: 'ds-1', category: 'dessert', name: '糖霜兔子蛋糕房', rating: 4.9, eta: 25, fee: 4, mealCat: 'Dessert', dishes: ['草莓奶油切件', '海盐巴斯克芝士', '焦糖布丁', '法式千层酥', '开心果泡芙'] },
        { id: 'ds-2', category: 'dessert', name: 'Gelato 意式冰淇淋', rating: 4.9, eta: 22, fee: 3, mealCat: 'Dessert', dishes: ['开心果海盐双球', '黑巧榛子意式雪糕', '白桃雪芭', '提拉米苏杯', '华夫脆筒'] },
        { id: 'ds-3', category: 'dessert', name: '舒芙蕾松饼小屋', rating: 4.8, eta: 26, fee: 4, mealCat: 'Dessert', dishes: ['经典枫糖舒芙蕾', '草莓卡仕达松饼', '抹茶红豆舒芙蕾', '焦糖香蕉华夫', '香草冰拿铁'] },
        { id: 'ds-4', category: 'dessert', name: '港式糖水铺', rating: 4.8, eta: 24, fee: 2, mealCat: 'Dessert', dishes: ['姜撞奶热碗', '芒果白雪黑糯米', '双皮奶红豆', '芝麻核桃糊', '椰汁芋头西米露'] },
        { id: 'ds-5', category: 'dessert', name: '法式可丽露烘焙', rating: 4.7, eta: 25, fee: 3, mealCat: 'Dessert', dishes: ['香草朗姆可丽露', '柠檬蛋白霜塔', '树莓马卡龙礼盒', '榛子巧克力慕斯', '伯爵红茶玛德琳'] },

        /* ---------------- 日料 (5家) ---------------- */
        { id: 'jp-1', category: 'japanese', name: '月见拉面屋', rating: 4.9, eta: 27, fee: 4, mealCat: 'Seafood', dishes: ['豚骨叉烧拉面', '炙烤三文鱼丼', '炸猪排滑蛋饭', '日式煎饺 6 只', '玉子烧'] },
        { id: 'jp-2', category: 'japanese', name: '筑地刺身手握馆', rating: 4.9, eta: 30, fee: 5, mealCat: 'Seafood', dishes: ['厚切三文鱼刺身', '炙烤鹅肝手握', '鳗鱼牛油果卷', '北极贝甜虾拼盘', '味增海鲜汤'] },
        { id: 'jp-3', category: 'japanese', name: '咖喱与炸物食堂', rating: 4.8, eta: 24, fee: 3, mealCat: 'Chicken', dishes: ['黄金猪排咖喱饭', '唐扬炸鸡块', '滑蛋牛肉乌冬面', '章鱼小丸子', '可尔必思'] },
        { id: 'jp-4', category: 'japanese', name: '寿喜烧一人食', rating: 4.8, eta: 28, fee: 4, mealCat: 'Beef', dishes: ['和牛寿喜烧单人锅', '照烧肥牛饭', '无菌蛋蘸料套组', '蟹籽土豆沙拉', '抹茶大福'] },
        { id: 'jp-5', category: 'japanese', name: '炭火烧鸟小酒馆', rating: 4.7, eta: 29, fee: 4, mealCat: 'Chicken', dishes: ['京葱鸡腿肉串', '明太子鸡翅', '盐烤青花鱼', '烤饭团茶泡饭', '梅子苏打'] },

        /* ---------------- 韩料 (5家) ---------------- */
        { id: 'kr-1', category: 'korean', name: '首尔路口小食堂', rating: 4.8, eta: 26, fee: 3, mealCat: 'Pork', dishes: ['泡菜五花肉锅', '芝士火鸡面', '甜辣脆皮炸鸡', '金枪鱼海苔拌饭', '芝士玉米粒'] },
        { id: 'kr-2', category: 'korean', name: '釜山部队火锅', rating: 4.9, eta: 29, fee: 4, mealCat: 'Beef', dishes: ['经典芝士部队锅', '肥牛辣白菜汤饭', '韩式大酱汤套餐', '泡菜海鲜饼', '米酒气泡饮'] },
        { id: 'kr-3', category: 'korean', name: '梨泰院烤肉拌饭', rating: 4.8, eta: 25, fee: 3, mealCat: 'Beef', dishes: ['石锅黑椒牛肉拌饭', '炭烤猪五花盖饭', '蜂蜜蒜香炸鸡', '辣炒年糕鱼饼', '冷面'] },
        { id: 'kr-4', category: 'korean', name: '明洞紫菜包饭屋', rating: 4.7, eta: 22, fee: 2, mealCat: 'Miscellaneous', dishes: ['芝士猪排紫菜卷', '辛拉面加溏心蛋', '甜辣鱼饼串', '炸酱面', '水蜜桃汁'] },
        { id: 'kr-5', category: 'korean', name: '弘大参鸡汤专门店', rating: 4.9, eta: 30, fee: 4, mealCat: 'Chicken', dishes: ['原味人参童子鸡汤', '黑蒜养生鸡煲', '韩式烤鸡爪', '萝卜泡菜拼盘', '柚子蜂蜜茶'] },

        /* ---------------- 西餐 (5家) ---------------- */
        { id: 'ws-1', category: 'western', name: '小巷牛排馆 · Bistro', rating: 4.9, eta: 28, fee: 0, mealCat: 'Beef', dishes: ['炭烤澳洲西冷牛排', '黑松露菌菇意面', '慢炖红酒牛腩', '法式洋葱浓汤', '烤蒜香黄油法棍'] },
        { id: 'ws-2', category: 'western', name: '圣马可手工意面屋', rating: 4.8, eta: 24, fee: 4, mealCat: 'Pasta', dishes: ['经典肉酱千层面', '培根蛋奶宽意面', '海鲜墨鱼汁意面', '玛格丽特窑烤披萨', '凯撒鸡胸沙拉'] },
        { id: 'ws-3', category: 'western', name: '橡木桶汉堡实验室', rating: 4.8, eta: 22, fee: 3, mealCat: 'Beef', dishes: ['双层安格斯芝士堡', '焦糖洋葱和牛堡', '酥脆酪乳炸鸡堡', '黑松露帕玛森薯条', '奶油玉米浓汤'] },
        { id: 'ws-4', category: 'western', name: '海岸线海鲜餐吧', rating: 4.9, eta: 30, fee: 5, mealCat: 'Seafood', dishes: ['黄油蒜香烤大虾', '英式炸鱼薯条', '白酒煮青口贝', '香烤海鲈鱼排', '龙虾浓汤配面包'] },
        { id: 'ws-5', category: 'western', name: '日曜早午餐 · Brunch', rating: 4.7, eta: 20, fee: 0, mealCat: 'Breakfast', dishes: ['经典班尼迪克蛋', '牛油果水波蛋酸面包', '烟熏三文鱼贝果', '烤鸡肉凯撒能量碗', '番茄罗勒意面'] }
    ];

    let activeTab = 'order';
    let activeSubCategoryId = null;
    let currentStore = null;
    let cart = {};
    let cartDrawerOpen = false;
    let checkoutMode = 'self';
    let selectedCharId = '';

    let mealPhotoCache = loadJSON(STORAGE_PHOTO_CACHE_KEY, {});
    let picsumIds = loadJSON(STORAGE_PICSUM_LIST_KEY, []);
    const pendingCatFetch = {};
    let pendingPicsumFetch = null;

    function loadJSON(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) {
            return fallback;
        }
    }

    function saveJSON(key, val) {
        try {
            localStorage.setItem(key, JSON.stringify(val));
        } catch (e) {}
    }

    function getOrders() {
        return loadJSON(STORAGE_ORDERS_KEY, []);
    }

    function getCustomCovers() {
        return loadJSON(STORAGE_COVERS_KEY, {});
    }

    function getCatName(catId) {
        const found = CATEGORIES.find(c => c.id === catId);
        return found ? found.name : '美食';
    }

    function fallbackAmbientUrl(store) {
        return 'https://picsum.photos/seed/tk-scenery-' + encodeURIComponent(store.id) + '/800/420';
    }

    function getStoreCoverUrl(store) {
        const custom = getCustomCovers();
        if (custom[store.id]) return custom[store.id];
        if (Array.isArray(picsumIds) && picsumIds.length > 0) {
            const idx = Math.max(0, STORE_BLUEPRINTS.findIndex(s => s.id === store.id));
            const picId = picsumIds[idx % picsumIds.length];
            return 'https://picsum.photos/id/' + picId + '/800/420';
        }
        return fallbackAmbientUrl(store);
    }

    function buildStores() {
        return STORE_BLUEPRINTS.map(bp => {
            const photos = mealPhotoCache[bp.mealCat] || [];
            const baseSeed = bp.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
            const items = bp.dishes.map((name, idx) => ({
                id: bp.id + '-d' + idx,
                name: name,
                desc: '门店招牌 · 新鲜现做',
                price: 15 + ((baseSeed + idx * 7) % 28),
                img: photos.length ? photos[(baseSeed + idx) % photos.length] : ''
            }));
            return {
                id: bp.id,
                category: bp.category,
                name: bp.name,
                rating: bp.rating,
                eta: bp.eta,
                fee: bp.fee,
                mealCat: bp.mealCat,
                items: items
            };
        });
    }

    /* 拉取真实菜品实拍图（TheMealDB） */
    async function ensureMealPhotos(mealCat) {
        if (mealPhotoCache[mealCat] && mealPhotoCache[mealCat].length > 0) return;
        if (pendingCatFetch[mealCat]) return pendingCatFetch[mealCat];

        pendingCatFetch[mealCat] = (async () => {
            try {
                const res = await fetch('https://www.themealdb.com/api/json/v1/1/filter.php?c=' + encodeURIComponent(mealCat));
                if (!res.ok) return;
                const data = await res.json();
                const meals = Array.isArray(data.meals) ? data.meals : [];
                const urls = meals.map(m => m.strMealThumb).filter(Boolean).slice(0, 24);
                if (urls.length > 0) {
                    mealPhotoCache[mealCat] = urls;
                    saveJSON(STORAGE_PHOTO_CACHE_KEY, mealPhotoCache);
                    refreshVisibleImages();
                }
            } catch (e) {}
        })();

        return pendingCatFetch[mealCat];
    }

    /* 单次拉取 Picsum 实景列表，避免多次并发限流 */
    async function ensurePicsumList() {
        if (Array.isArray(picsumIds) && picsumIds.length >= 45) return;
        if (pendingPicsumFetch) return pendingPicsumFetch;

        pendingPicsumFetch = (async () => {
            try {
                const res = await fetch('https://picsum.photos/v2/list?page=2&limit=60');
                if (!res.ok) return;
                const list = await res.json();
                if (Array.isArray(list) && list.length > 0) {
                    picsumIds = list
                        .filter(item => item && item.id && Number(item.width) >= Number(item.height))
                        .map(item => String(item.id));
                    if (picsumIds.length === 0) {
                        picsumIds = list.map(item => String(item.id));
                    }
                    saveJSON(STORAGE_PICSUM_LIST_KEY, picsumIds);
                    refreshVisibleImages();
                }
            } catch (e) {}
        })();

        return pendingPicsumFetch;
    }

    function preloadAllImages() {
        ensurePicsumList();
        const mealCats = [...new Set(STORE_BLUEPRINTS.map(b => b.mealCat))];
        mealCats.forEach(c => ensureMealPhotos(c));
    }

    function refreshVisibleImages() {
        if (activeTab === 'order') renderHome();
        if (activeSubCategoryId) renderCategorySubview();
        if (currentStore) {
            const stores = buildStores();
            const updated = stores.find(s => s.id === currentStore.id);
            if (updated) {
                currentStore = updated;
                renderStoreView();
            }
        }
    }

    function getChars() {
        try {
            if (window.PhoneArchive && typeof window.PhoneArchive.getChars === 'function') {
                return window.PhoneArchive.getChars() || [];
            }
        } catch (e) {}
        return [];
    }

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function mount() {
        const root = document.getElementById('app-takeout');
        if (!root || root.dataset.mounted === '1') return;
        root.dataset.mounted = '1';

        root.innerHTML = `
            <div class="tk-app">
                <div class="tk-topbar">
                    <div class="tk-topbar-left">
                        <button class="tk-back-btn" id="tkBackHomeBtn" data-close-app aria-label="返回桌面">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                        </button>
                        <div class="tk-title" id="tkMainTitle">小团外卖</div>
                    </div>
                </div>

                <div class="tk-scroll" id="tkMainScroll"></div>

                <div class="tk-bottom-bar">
                    <button class="tk-tab-btn active" data-tab="order">点外卖</button>
                    <button class="tk-tab-btn" data-tab="orders">订单</button>
                </div>

                <!-- 分类全屏页 -->
                <div class="tk-subview" id="tkCatView">
                    <div class="tk-subview-head">
                        <div class="tk-subview-left">
                            <button class="tk-back-btn" id="tkCatBackBtn" aria-label="返回首页">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                            </button>
                            <div class="tk-subview-title" id="tkCatTitle">分类</div>
                        </div>
                        <div class="tk-subview-count" id="tkCatCount">共 5 家店铺</div>
                    </div>
                    <div class="tk-subview-scroll" id="tkCatScroll"></div>
                </div>

                <!-- 店铺详情全屏页 -->
                <div class="tk-store-view" id="tkStoreView">
                    <div class="tk-store-header">
                        <img class="tk-store-header-img" id="tkStoreCoverImg" referrerpolicy="no-referrer" src="" alt="" />
                        <div class="tk-store-header-scrim"></div>
                        <div class="tk-store-header-actions">
                            <button class="tk-circle-btn" id="tkCloseStoreBtn" aria-label="关闭店铺">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                            <button class="tk-circle-btn" id="tkUploadCoverBtn" title="自定义店铺封面" aria-label="上传封面">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                            </button>
                        </div>
                        <div class="tk-store-header-info">
                            <div class="tk-store-header-name" id="tkStoreHeaderName"></div>
                            <div class="tk-store-header-sub" id="tkStoreHeaderSub"></div>
                        </div>
                    </div>

                    <div class="tk-dish-list" id="tkDishList"></div>

                    <!-- 可展开购物车抽屉 -->
                    <div class="tk-cart-drawer-mask" id="tkCartDrawerMask"></div>
                    <div class="tk-cart-drawer" id="tkCartDrawer">
                        <div class="tk-cart-drawer-head">
                            <div class="tk-cart-drawer-title">已选菜品</div>
                            <button class="tk-cart-clear-btn" id="tkClearCartBtn">清空</button>
                        </div>
                        <div class="tk-cart-drawer-list" id="tkCartDrawerList"></div>
                        <div class="tk-cart-drawer-foot">
                            <span id="tkCartDrawerFee"></span>
                            <span id="tkCartDrawerSum"></span>
                        </div>
                    </div>

                    <div class="tk-cart-bar" id="tkCartBar">
                        <div class="tk-cart-bar-info" id="tkToggleCartBtn">
                            <div class="tk-cart-icon-wrap">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                                <span class="tk-cart-badge" id="tkCartBadge">0</span>
                            </div>
                            <div class="tk-cart-text-wrap">
                                <span class="tk-cart-total" id="tkCartTotal">¥0</span>
                                <span class="tk-cart-count" id="tkCartCount">已选 0 件</span>
                            </div>
                        </div>
                        <button class="tk-cart-submit" id="tkGoCheckoutBtn">去下单</button>
                    </div>
                </div>

                <!-- 结算弹窗 -->
                <div class="tk-modal-mask" id="tkCheckoutModal">
                    <div class="tk-modal">
                        <div class="tk-modal-head">
                            <div class="tk-modal-title">确认下单</div>
                            <button class="tk-modal-close" id="tkCloseCheckoutBtn">×</button>
                        </div>
                        <div class="tk-field-label">点单方式</div>
                        <div class="tk-mode-row" id="tkModeRow">
                            <button class="tk-mode-btn active" data-mode="self">自己吃</button>
                            <button class="tk-mode-btn" data-mode="feed">投喂 Char</button>
                            <button class="tk-mode-btn" data-mode="pay">找 Char 代付</button>
                        </div>
                        <div id="tkCharWrap" style="display:none;">
                            <div class="tk-field-label">选择 Char</div>
                            <div class="tk-char-list" id="tkCharList"></div>
                        </div>
                        <div class="tk-field-label">订单备注</div>
                        <input class="tk-input" id="tkOrderNote" placeholder="例如：少辣、放门口即可" />
                        <button class="tk-primary-btn" id="tkSubmitOrderBtn">立即下单</button>
                    </div>
                </div>

                <input type="file" id="tkCoverFileInput" accept="image/*" style="display:none;" />
            </div>
        `;

        bindEvents();
        renderHome();
        preloadAllImages();
    }

    function bindEvents() {
        document.querySelectorAll('#app-takeout .tk-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                activeTab = btn.dataset.tab;
                document.querySelectorAll('#app-takeout .tk-tab-btn').forEach(b => b.classList.toggle('active', b === btn));
                const backBtn = document.getElementById('tkBackHomeBtn');
                const title = document.getElementById('tkMainTitle');
                if (activeTab === 'order') {
                    backBtn.classList.remove('is-hidden');
                    title.textContent = '小团外卖';
                    renderHome();
                } else {
                    backBtn.classList.add('is-hidden');
                    title.textContent = '订单';
                    renderOrders();
                }
            });
        });

        document.getElementById('tkCatBackBtn').addEventListener('click', () => {
            activeSubCategoryId = null;
            document.getElementById('tkCatView').classList.remove('open');
        });

        document.getElementById('tkCloseStoreBtn').addEventListener('click', () => {
            cartDrawerOpen = false;
            updateCartDrawerUI();
            document.getElementById('tkStoreView').classList.remove('open');
            currentStore = null;
        });

        document.getElementById('tkToggleCartBtn').addEventListener('click', () => {
            const count = Object.values(cart).reduce((a, b) => a + b, 0);
            if (count === 0) return;
            cartDrawerOpen = !cartDrawerOpen;
            updateCartDrawerUI();
        });

        document.getElementById('tkCartDrawerMask').addEventListener('click', () => {
            cartDrawerOpen = false;
            updateCartDrawerUI();
        });

        document.getElementById('tkClearCartBtn').addEventListener('click', () => {
            cart = {};
            cartDrawerOpen = false;
            renderStoreView();
        });

        document.getElementById('tkUploadCoverBtn').addEventListener('click', () => {
            document.getElementById('tkCoverFileInput').click();
        });

        document.getElementById('tkCoverFileInput').addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file || !currentStore) return;
            const reader = new FileReader();
            reader.onload = () => {
                const covers = getCustomCovers();
                covers[currentStore.id] = reader.result;
                saveJSON(STORAGE_COVERS_KEY, covers);
                renderStoreView();
                renderHome();
                if (activeSubCategoryId) renderCategorySubview();
            };
            reader.readAsDataURL(file);
            e.target.value = '';
        });

        document.getElementById('tkGoCheckoutBtn').addEventListener('click', openCheckoutModal);
        document.getElementById('tkCloseCheckoutBtn').addEventListener('click', () => {
            document.getElementById('tkCheckoutModal').classList.remove('open');
        });

        document.querySelectorAll('#tkModeRow .tk-mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                checkoutMode = btn.dataset.mode;
                document.querySelectorAll('#tkModeRow .tk-mode-btn').forEach(b => b.classList.toggle('active', b === btn));
                renderCharSelector();
            });
        });

        document.getElementById('tkSubmitOrderBtn').addEventListener('click', submitOrder);
    }

    function renderStoreCardHTML(store) {
        const feeText = store.fee === 0 ? '免配送费' : '配送费 ¥' + store.fee;
        const coverUrl = getStoreCoverUrl(store);
        const fallbackUrl = fallbackAmbientUrl(store);
        const previewHtml = store.items.slice(0, 3).map(item => `
            <div class="tk-preview-chip">
                ${item.img ? `<img src="${escapeHtml(item.img)}" referrerpolicy="no-referrer" alt="" loading="lazy" />` : ''}
                <span>${escapeHtml(item.name)}</span>
            </div>
        `).join('');

        return `
            <div class="tk-store-card" data-store-id="${escapeHtml(store.id)}">
                <div class="tk-store-banner">
                    <img class="tk-store-banner-img" referrerpolicy="no-referrer" src="${escapeHtml(coverUrl)}" onerror="if(this.dataset.fb!=='1'){this.dataset.fb='1';this.src='${escapeHtml(fallbackUrl)}';}" alt="" loading="lazy" />
                    <div class="tk-store-banner-scrim"></div>
                    <div class="tk-store-badge">${escapeHtml(getCatName(store.category))}</div>
                </div>
                <div class="tk-store-body">
                    <div class="tk-store-row1">
                        <div class="tk-store-name">${escapeHtml(store.name)}</div>
                        <div class="tk-store-rating">★ ${store.rating}</div>
                    </div>
                    <div class="tk-store-meta">约 ${store.eta} 分钟送达 · ${feeText}</div>
                    <div class="tk-store-preview">${previewHtml}</div>
                </div>
            </div>
        `;
    }

    function renderHome() {
        const scroll = document.getElementById('tkMainScroll');
        if (!scroll) return;
        const stores = buildStores();
        const recommended = [
            stores.find(s => s.id === 'bf-1'),
            stores.find(s => s.id === 'ln-1'),
            stores.find(s => s.id === 'mt-1'),
            stores.find(s => s.id === 'ws-1'),
            stores.find(s => s.id === 'jp-1'),
            stores.find(s => s.id === 'sp-1')
        ].filter(Boolean);

        const catHtml = CATEGORIES.map(c => `
            <button class="tk-cat-item ${c.id === 'all' ? 'active' : ''}" data-cat="${c.id}">
                <div class="tk-cat-icon">${c.icon}</div>
                <div class="tk-cat-label">${c.name}</div>
            </button>
        `).join('');

        const storeHtml = recommended.map(renderStoreCardHTML).join('');

        scroll.innerHTML = `
            <div class="tk-cat-card">
                <div class="tk-cat-grid">${catHtml}</div>
            </div>
            <div class="tk-sec-head">
                <div class="tk-sec-title">为你推荐</div>
                <div class="tk-sec-sub">精选好店</div>
            </div>
            <div class="tk-store-list">${storeHtml}</div>
        `;

        scroll.querySelectorAll('.tk-cat-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const catId = btn.dataset.cat;
                if (catId === 'all') return;
                openCategorySubview(catId);
            });
        });

        scroll.querySelectorAll('.tk-store-card').forEach(card => {
            card.addEventListener('click', () => openStore(card.dataset.storeId));
        });
    }

    function openCategorySubview(catId) {
        activeSubCategoryId = catId;
        document.getElementById('tkCatTitle').textContent = getCatName(catId);
        renderCategorySubview();
        document.getElementById('tkCatView').classList.add('open');
    }

    function renderCategorySubview() {
        if (!activeSubCategoryId) return;
        const stores = buildStores().filter(s => s.category === activeSubCategoryId);
        document.getElementById('tkCatCount').textContent = '共 ' + stores.length + ' 家店铺';
        const container = document.getElementById('tkCatScroll');
        container.innerHTML = `<div class="tk-store-list">${stores.map(renderStoreCardHTML).join('')}</div>`;
        container.querySelectorAll('.tk-store-card').forEach(card => {
            card.addEventListener('click', () => openStore(card.dataset.storeId));
        });
    }

    function openStore(storeId) {
        const stores = buildStores();
        const store = stores.find(s => s.id === storeId);
        if (!store) return;
        currentStore = store;
        cart = {};
        cartDrawerOpen = false;
        ensureMealPhotos(store.mealCat);
        renderStoreView();
        document.getElementById('tkStoreView').classList.add('open');
    }

    function renderStoreView() {
        if (!currentStore) return;
        const coverImg = document.getElementById('tkStoreCoverImg');
        const coverUrl = getStoreCoverUrl(currentStore);
        const fallbackUrl = fallbackAmbientUrl(currentStore);
        coverImg.dataset.fb = '';
        coverImg.onerror = function () {
            if (this.dataset.fb !== '1') {
                this.dataset.fb = '1';
                this.src = fallbackUrl;
            }
        };
        coverImg.src = coverUrl;

        document.getElementById('tkStoreHeaderName').textContent = currentStore.name;
        const feeText = currentStore.fee === 0 ? '免配送费' : '配送费 ¥' + currentStore.fee;
        document.getElementById('tkStoreHeaderSub').textContent = `${getCatName(currentStore.category)} · 约 ${currentStore.eta} 分钟 · ${feeText}`;

        const list = document.getElementById('tkDishList');
        list.innerHTML = currentStore.items.map(item => {
            const qty = cart[item.id] || 0;
            return `
                <div class="tk-dish-card">
                    ${item.img ? `<img class="tk-dish-img" referrerpolicy="no-referrer" src="${escapeHtml(item.img)}" alt="" loading="lazy" />` : `<div class="tk-dish-img"></div>`}
                    <div class="tk-dish-info">
                        <div class="tk-dish-name">${escapeHtml(item.name)}</div>
                        <div class="tk-dish-desc">${escapeHtml(item.desc)}</div>
                        <div class="tk-dish-bottom">
                            <div class="tk-dish-price">¥${item.price}</div>
                            <div class="tk-qty-ctrl">
                                ${qty > 0 ? `<button class="tk-qty-btn minus" data-id="${item.id}">-</button><span class="tk-qty-num">${qty}</span>` : ''}
                                <button class="tk-qty-btn plus" data-id="${item.id}">+</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        list.querySelectorAll('.tk-qty-btn.plus').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                cart[id] = (cart[id] || 0) + 1;
                renderStoreView();
            });
        });

        list.querySelectorAll('.tk-qty-btn.minus').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                if (cart[id] > 1) cart[id] -= 1;
                else delete cart[id];
                renderStoreView();
            });
        });

        updateCartBar();
        updateCartDrawerUI();
    }

    function updateCartBar() {
        if (!currentStore) return;
        let total = 0;
        let count = 0;
        currentStore.items.forEach(item => {
            const q = cart[item.id] || 0;
            if (q > 0) {
                total += item.price * q;
                count += q;
            }
        });
        const bar = document.getElementById('tkCartBar');
        if (count > 0) {
            bar.classList.add('show');
            document.getElementById('tkCartBadge').textContent = String(count);
            document.getElementById('tkCartTotal').textContent = '¥' + total;
            document.getElementById('tkCartCount').innerHTML = `已选 ${count} 件 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="${cartDrawerOpen ? '6 9 12 15 18 9' : '18 15 12 9 6 15'}"/></svg>`;
        } else {
            bar.classList.remove('show');
            cartDrawerOpen = false;
        }
    }

    function updateCartDrawerUI() {
        const mask = document.getElementById('tkCartDrawerMask');
        const drawer = document.getElementById('tkCartDrawer');
        if (!mask || !drawer || !currentStore) return;

        const selected = currentStore.items.filter(item => (cart[item.id] || 0) > 0);
        if (!cartDrawerOpen || selected.length === 0) {
            cartDrawerOpen = false;
            mask.classList.remove('open');
            drawer.classList.remove('open');
            updateCartBar();
            return;
        }

        mask.classList.add('open');
        drawer.classList.add('open');

        let subtotal = 0;
        const listEl = document.getElementById('tkCartDrawerList');
        listEl.innerHTML = selected.map(item => {
            const q = cart[item.id];
            const lineTotal = item.price * q;
            subtotal += lineTotal;
            return `
                <div class="tk-cart-drawer-item">
                    ${item.img ? `<img class="tk-cart-drawer-thumb" referrerpolicy="no-referrer" src="${escapeHtml(item.img)}" alt="" />` : `<div class="tk-cart-drawer-thumb"></div>`}
                    <div class="tk-cart-drawer-info">
                        <div class="tk-cart-drawer-name">${escapeHtml(item.name)}</div>
                        <div class="tk-cart-drawer-sub">¥${lineTotal}</div>
                    </div>
                    <div class="tk-qty-ctrl">
                        <button class="tk-qty-btn minus" data-id="${item.id}">-</button>
                        <span class="tk-qty-num">${q}</span>
                        <button class="tk-qty-btn plus" data-id="${item.id}">+</button>
                    </div>
                </div>
            `;
        }).join('');

        listEl.querySelectorAll('.tk-qty-btn.plus').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                cart[id] = (cart[id] || 0) + 1;
                renderStoreView();
            });
        });

        listEl.querySelectorAll('.tk-qty-btn.minus').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                if (cart[id] > 1) cart[id] -= 1;
                else delete cart[id];
                renderStoreView();
            });
        });

        document.getElementById('tkCartDrawerFee').textContent = currentStore.fee === 0 ? '免配送费' : '含配送费 ¥' + currentStore.fee;
        document.getElementById('tkCartDrawerSum').textContent = '合计 ¥' + (subtotal + currentStore.fee);
        updateCartBar();
    }

    function openCheckoutModal() {
        cartDrawerOpen = false;
        updateCartDrawerUI();
        renderCharSelector();
        document.getElementById('tkCheckoutModal').classList.add('open');
    }

    function renderCharSelector() {
        const wrap = document.getElementById('tkCharWrap');
        const list = document.getElementById('tkCharList');
        if (checkoutMode === 'self') {
            wrap.style.display = 'none';
            return;
        }
        wrap.style.display = 'block';
        const chars = getChars();
        if (chars.length === 0) {
            list.innerHTML = '<div style="font-size:12px;color:#8e8e93;">暂无角色，请先在档案里创建 Char</div>';
            selectedCharId = '';
            return;
        }
        if (!selectedCharId || !chars.some(c => c.id === selectedCharId)) {
            selectedCharId = chars[0].id;
        }
        list.innerHTML = chars.map(c => `
            <button class="tk-char-chip ${c.id === selectedCharId ? 'active' : ''}" data-char-id="${escapeHtml(c.id)}">${escapeHtml(c.name || '未命名')}</button>
        `).join('');
        list.querySelectorAll('.tk-char-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                selectedCharId = btn.dataset.charId;
                renderCharSelector();
            });
        });
    }

    function submitOrder() {
        if (!currentStore) return;
        const items = [];
        let total = currentStore.fee;
        currentStore.items.forEach(item => {
            const q = cart[item.id] || 0;
            if (q > 0) {
                items.push({ name: item.name, qty: q, price: item.price });
                total += item.price * q;
            }
        });
        if (items.length === 0) return;

        const chars = getChars();
        const targetChar = chars.find(c => c.id === selectedCharId);
        const modeLabel = checkoutMode === 'self'
            ? '自己吃'
            : (checkoutMode === 'feed'
                ? `投喂 ${targetChar ? targetChar.name : 'Char'}`
                : `找 ${targetChar ? targetChar.name : 'Char'} 代付`);

        const orders = getOrders();
        orders.unshift({
            id: 'ord-' + Date.now(),
            storeName: currentStore.name,
            items: items,
            total: total,
            modeLabel: modeLabel,
            note: document.getElementById('tkOrderNote').value.trim(),
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
            status: '骑手配送中'
        });
        saveJSON(STORAGE_ORDERS_KEY, orders);

        document.getElementById('tkCheckoutModal').classList.remove('open');
        document.getElementById('tkStoreView').classList.remove('open');
        document.getElementById('tkCatView').classList.remove('open');
        activeSubCategoryId = null;
        currentStore = null;
        cart = {};
        cartDrawerOpen = false;
        document.getElementById('tkOrderNote').value = '';

        const ordersTabBtn = document.querySelector('#app-takeout .tk-tab-btn[data-tab="orders"]');
        if (ordersTabBtn) ordersTabBtn.click();
    }

    function renderOrders() {
        const scroll = document.getElementById('tkMainScroll');
        if (!scroll) return;
        const orders = getOrders();
        if (orders.length === 0) {
            scroll.innerHTML = '<div class="tk-empty">还没有外卖订单，去挑一家喜欢的店吧</div>';
            return;
        }
        scroll.innerHTML = orders.map(ord => `
            <div class="tk-order-card">
                <div class="tk-order-top">
                    <div class="tk-order-store">${escapeHtml(ord.storeName)}</div>
                    <div class="tk-order-status">${escapeHtml(ord.status)}</div>
                </div>
                <div class="tk-order-items">
                    ${ord.items.map(i => `${escapeHtml(i.name)} × ${i.qty}`).join('、')}
                    ${ord.note ? `<div style="color:#8e8e93;margin-top:4px;">备注：${escapeHtml(ord.note)}</div>` : ''}
                </div>
                <div class="tk-order-foot">
                    <span>${escapeHtml(ord.modeLabel)} · ${escapeHtml(ord.time)}</span>
                    <span class="tk-order-price">¥${ord.total}</span>
                </div>
            </div>
        `).join('');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount);
    } else {
        mount();
    }
})();