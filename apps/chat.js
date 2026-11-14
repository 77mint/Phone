/* =========================================================
   Chat 主页 (apps/chat.js)
   - 100% 同步「档案」：所有联系人与群聊成员均严格来自 PhoneArchive
   - 底部 4 格液态玻璃底栏：讯息 | 联系人 | 朋友圈 | 我的
   - 微信小圆角头像 + 名字对齐头像上缘 + 联系人页仅显示头像与名字
   ========================================================= */

(function () {
    const STORAGE_CONTACTS_KEY = 'chat_contacts_v1';
    const STORAGE_THREADS_KEY = 'chat_threads_v1';
    const BUILTIN_ID = 'assistant-shuixiaojiu';

    let activeTab = 'messages';
    let searchKeyword = '';
    let contactKeyword = '';
    let modalSearchKeyword = '';
    let groupSelectedIds = [];

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

    function getArchiveChars() {
        try {
            if (window.PhoneArchive && typeof window.PhoneArchive.getChars === 'function') {
                return window.PhoneArchive.getChars() || [];
            }
        } catch (e) {}
        return [];
    }

    function getCharDisplayName(c) {
        if (!c) return '未命名';
        return c.name || c.nickname || '未命名';
    }

    function getCharAvatar(c) {
        if (!c) return '';
        try {
            if (window.PhoneArchive && typeof window.PhoneArchive.getCharAvatar === 'function') {
                return window.PhoneArchive.getCharAvatar(c.id) || '';
            }
        } catch (e) {}
        return c.avatar || '';
    }

    function getContactIds() {
        const archiveChars = getArchiveChars();
        const validSet = new Set(archiveChars.map(c => c.id));
        const saved = loadJSON(STORAGE_CONTACTS_KEY, []).filter(id => validSet.has(id));
        if (validSet.has(BUILTIN_ID) && !saved.includes(BUILTIN_ID)) {
            saved.unshift(BUILTIN_ID);
            saveJSON(STORAGE_CONTACTS_KEY, saved);
        }
        return saved;
    }

    function getThreads() {
        const archiveChars = getArchiveChars();
        const validSet = new Set(archiveChars.map(c => c.id));
        let list = loadJSON(STORAGE_THREADS_KEY, []).filter(t => {
            if (t.type === 'dm') return validSet.has(t.charId);
            return true;
        });
        if (validSet.has(BUILTIN_ID) && !list.some(t => t.id === 'dm-' + BUILTIN_ID)) {
            const bot = archiveChars.find(c => c.id === BUILTIN_ID);
            list.unshift({
                id: 'dm-' + BUILTIN_ID,
                type: 'dm',
                charId: BUILTIN_ID,
                name: getCharDisplayName(bot),
                lastMsg: '你好呀，我是水小九，前端、美化、酒馆和小手机的事都可以问我。',
                lastTime: '在线'
            });
            saveJSON(STORAGE_THREADS_KEY, list);
        }
        return list;
    }

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function showToast(msg) {
        const el = document.getElementById('ctToast');
        if (!el) return;
        el.textContent = msg;
        el.classList.add('show');
        clearTimeout(showToast._timer);
        showToast._timer = setTimeout(() => el.classList.remove('show'), 1800);
    }

    function renderAvatarHtml(charObj, isGroup) {
        if (isGroup) {
            return '<div class="ct-avatar"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>';
        }
        const name = getCharDisplayName(charObj);
        const fallbackChar = (charObj && charObj.id === BUILTIN_ID) ? '九' : name.slice(0, 1);
        const av = getCharAvatar(charObj);
        if (av) {
            return `<div class="ct-avatar"><img src="${escapeHtml(av)}" onerror="this.parentNode.textContent='${escapeHtml(fallbackChar)}'" alt="" /></div>`;
        }
        return `<div class="ct-avatar">${escapeHtml(fallbackChar)}</div>`;
    }

    function mount() {
        const root = document.getElementById('app-chat');
        if (!root || root.dataset.mounted === '1') return;
        root.dataset.mounted = '1';

        root.innerHTML = `
            <div class="ct-app">
                <div class="ct-topbar">
                    <div class="ct-topbar-left">
                        <button class="ct-glass-circle" id="ctBackBtn" data-close-app aria-label="返回桌面">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                        </button>
                        <div class="ct-title" id="ctTitle">讯息</div>
                    </div>
                    <button class="ct-glass-circle" id="ctPlusBtn" aria-label="更多操作">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </button>
                </div>

                <div class="ct-plus-menu" id="ctPlusMenu">
                    <button class="ct-plus-item" id="ctMenuAddContact">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                        <span>添加联系人</span>
                    </button>
                    <button class="ct-plus-item" id="ctMenuNewGroup">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        <span>发起群聊</span>
                    </button>
                </div>

                <div class="ct-scroll" id="ctMainScroll"></div>

                <div class="ct-bottom-bar">
                    <button class="ct-tab-btn active" data-tab="messages">讯息</button>
                    <button class="ct-tab-btn" data-tab="contacts">联系人</button>
                    <button class="ct-tab-btn" data-tab="moments">朋友圈</button>
                    <button class="ct-tab-btn" data-tab="me">我的</button>
                </div>

                <!-- 添加联系人弹窗 -->
                <div class="ct-modal-mask" id="ctAddContactModal">
                    <div class="ct-modal">
                        <div class="ct-modal-head">
                            <div class="ct-modal-title">添加联系人</div>
                            <button class="ct-modal-close" data-close-modal="ctAddContactModal">×</button>
                        </div>
                        <input class="ct-modal-input" id="ctAddSearchInput" placeholder="搜索档案里的角色名字..." />
                        <div class="ct-modal-list" id="ctAddContactList"></div>
                    </div>
                </div>

                <!-- 发起群聊弹窗 -->
                <div class="ct-modal-mask" id="ctGroupModal">
                    <div class="ct-modal">
                        <div class="ct-modal-head">
                            <div class="ct-modal-title">发起群聊</div>
                            <button class="ct-modal-close" data-close-modal="ctGroupModal">×</button>
                        </div>
                        <input class="ct-modal-input" id="ctGroupNameInput" placeholder="群聊名称（选填）" />
                        <input class="ct-modal-input" id="ctGroupSearchInput" placeholder="搜索要拉进群的角色..." />
                        <div class="ct-modal-list" id="ctGroupPickList"></div>
                        <button class="ct-primary-btn" id="ctCreateGroupBtn">发起群聊</button>
                    </div>
                </div>

                <!-- 联系人档案详情弹窗 -->
                <div class="ct-modal-mask" id="ctProfileModal">
                    <div class="ct-modal">
                        <div class="ct-modal-head">
                            <div class="ct-modal-title">详细资料</div>
                            <button class="ct-modal-close" data-close-modal="ctProfileModal">×</button>
                        </div>
                        <div id="ctProfileContent"></div>
                    </div>
                </div>

                <div class="ct-toast" id="ctToast"></div>
            </div>
        `;

        bindEvents();
        renderActiveTab();
    }

    function bindEvents() {
        const root = document.getElementById('app-chat');
        const plusBtn = document.getElementById('ctPlusBtn');
        const plusMenu = document.getElementById('ctPlusMenu');

        root.querySelectorAll('.ct-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                plusMenu.classList.remove('open');
                activeTab = btn.dataset.tab;
                root.querySelectorAll('.ct-tab-btn').forEach(b => b.classList.toggle('active', b === btn));
                const titles = { messages: '讯息', contacts: '联系人', moments: '朋友圈', me: '我的' };
                document.getElementById('ctTitle').textContent = titles[activeTab] || 'Chat';

                document.getElementById('ctBackBtn').classList.toggle('is-hidden', activeTab !== 'messages');
                plusBtn.classList.toggle('is-hidden', activeTab !== 'messages');
                renderActiveTab();
            });
        });

        plusBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            plusMenu.classList.toggle('open');
        });

        root.addEventListener('click', (e) => {
            if (!e.target.closest('#ctPlusMenu') && !e.target.closest('#ctPlusBtn')) {
                plusMenu.classList.remove('open');
            }
        });

        document.getElementById('ctMenuAddContact').addEventListener('click', () => {
            plusMenu.classList.remove('open');
            modalSearchKeyword = '';
            document.getElementById('ctAddSearchInput').value = '';
            renderAddContactModal();
            document.getElementById('ctAddContactModal').classList.add('open');
        });

        document.getElementById('ctMenuNewGroup').addEventListener('click', () => {
            plusMenu.classList.remove('open');
            modalSearchKeyword = '';
            groupSelectedIds = [];
            document.getElementById('ctGroupNameInput').value = '';
            document.getElementById('ctGroupSearchInput').value = '';
            renderGroupPickModal();
            document.getElementById('ctGroupModal').classList.add('open');
        });

        root.querySelectorAll('[data-close-modal]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById(btn.dataset.closeModal).classList.remove('open');
            });
        });

        document.getElementById('ctAddSearchInput').addEventListener('input', (e) => {
            modalSearchKeyword = e.target.value.trim().toLowerCase();
            renderAddContactModal();
        });

        document.getElementById('ctGroupSearchInput').addEventListener('input', (e) => {
            modalSearchKeyword = e.target.value.trim().toLowerCase();
            renderGroupPickModal();
        });

        document.getElementById('ctCreateGroupBtn').addEventListener('click', createGroupChat);

        window.addEventListener('phone-archive-updated', () => {
            renderActiveTab();
        });
    }

    function renderActiveTab() {
        const scroll = document.getElementById('ctMainScroll');
        if (scroll) {
            scroll.classList.toggle('is-gray', activeTab === 'moments' || activeTab === 'me');
        }
        if (activeTab === 'messages') renderMessagesTab();
        else if (activeTab === 'contacts') renderContactsTab();
        else if (activeTab === 'moments') renderMomentsTab();
        else renderMeTab();
    }

    function renderMessagesTab() {
        const scroll = document.getElementById('ctMainScroll');
        const chars = getArchiveChars();
        const threads = getThreads().filter(t => {
            if (!searchKeyword) return true;
            const charObj = t.type === 'dm' ? chars.find(c => c.id === t.charId) : null;
            const name = charObj ? getCharDisplayName(charObj) : (t.name || '');
            return name.toLowerCase().includes(searchKeyword);
        });

        let listHtml = '';
        if (threads.length === 0) {
            listHtml = '<div class="ct-empty">还没有匹配的聊天<br>点右上角 <b>+</b> 添加联系人或发起群聊</div>';
        } else {
            listHtml = '<div class="ct-flat-list">' + threads.map(t => {
                const isGroup = t.type === 'group';
                const charObj = !isGroup ? chars.find(c => c.id === t.charId) : null;
                const displayName = charObj ? getCharDisplayName(charObj) : (t.name || '未命名聊天');
                return `
                    <div class="ct-row" data-thread-id="${escapeHtml(t.id)}">
                        ${renderAvatarHtml(charObj, isGroup)}
                        <div class="ct-row-main">
                            <div class="ct-row-top">
                                <div class="ct-row-name">${escapeHtml(displayName)}</div>
                                <div class="ct-row-time">${escapeHtml(t.lastTime || '')}</div>
                            </div>
                            <div class="ct-row-sub">${escapeHtml(t.lastMsg || '点击开始聊天')}</div>
                        </div>
                    </div>
                `;
            }).join('') + '</div>';
        }

        scroll.innerHTML = `
            <div class="ct-search-bar">
                <div class="ct-search-wrap">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input class="ct-search-input" id="ctThreadSearch" placeholder="搜索" value="${escapeHtml(searchKeyword)}" />
                </div>
            </div>
            ${listHtml}
        `;

        const input = document.getElementById('ctThreadSearch');
        input.addEventListener('input', (e) => {
            searchKeyword = e.target.value.trim().toLowerCase();
            renderMessagesTab();
            const again = document.getElementById('ctThreadSearch');
            if (again) {
                again.focus();
                again.setSelectionRange(again.value.length, again.value.length);
            }
        });

        scroll.querySelectorAll('.ct-row[data-thread-id]').forEach(row => {
            row.addEventListener('click', () => {
                showToast('聊天窗口将在下一步接入');
            });
        });
    }

    function renderContactsTab() {
        const scroll = document.getElementById('ctMainScroll');
        const chars = getArchiveChars();
        const addedIds = getContactIds();
        const list = chars.filter(c => addedIds.includes(c.id))
            .filter(c => !contactKeyword || getCharDisplayName(c).toLowerCase().includes(contactKeyword));

        let bodyHtml = '';
        if (list.length === 0) {
            bodyHtml = '<div class="ct-empty">暂无匹配的联系人</div>';
        } else {
            bodyHtml = '<div class="ct-flat-list">' + list.map(c => `
                <div class="ct-row" data-contact-id="${escapeHtml(c.id)}">
                    ${renderAvatarHtml(c, false)}
                    <div class="ct-row-main">
                        <div class="ct-row-name">${escapeHtml(getCharDisplayName(c))}</div>
                    </div>
                </div>
            `).join('') + '</div>';
        }

        scroll.innerHTML = `
            <div class="ct-search-bar">
                <div class="ct-search-wrap">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input class="ct-search-input" id="ctContactSearch" placeholder="搜索联系人" value="${escapeHtml(contactKeyword)}" />
                </div>
            </div>
            ${bodyHtml}
        `;

        const input = document.getElementById('ctContactSearch');
        input.addEventListener('input', (e) => {
            contactKeyword = e.target.value.trim().toLowerCase();
            renderContactsTab();
            const again = document.getElementById('ctContactSearch');
            if (again) {
                again.focus();
                again.setSelectionRange(again.value.length, again.value.length);
            }
        });

        scroll.querySelectorAll('.ct-row[data-contact-id]').forEach(row => {
            row.addEventListener('click', () => {
                const cid = row.dataset.contactId;
                const c = chars.find(item => item.id === cid);
                if (c) openProfileModal(c);
            });
        });
    }

    function openProfileModal(c) {
        const box = document.getElementById('ctProfileContent');
        const detailText = c.persona || c.bio || '暂无补充人设';
        box.innerHTML = `
            <div class="ct-profile-head">
                ${renderAvatarHtml(c, false)}
                <div class="ct-row-main">
                    <div class="ct-row-name">${escapeHtml(getCharDisplayName(c))}</div>
                    <div class="ct-row-sub">${escapeHtml(c.handle || c.group || 'Default')}</div>
                </div>
            </div>
            <div class="ct-profile-body">${escapeHtml(detailText)}</div>
        `;
        document.getElementById('ctProfileModal').classList.add('open');
    }

    function renderMomentsTab() {
        const scroll = document.getElementById('ctMainScroll');
        scroll.innerHTML = `
            <div class="ct-card">
                <div class="ct-empty">朋友圈主页已就绪<br>后续可以在这里看 Char 的动态、点赞和评论</div>
            </div>
        `;
    }

    function renderMeTab() {
        const scroll = document.getElementById('ctMainScroll');
        scroll.innerHTML = `
            <div class="ct-me-card">
                <div class="ct-me-avatar">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div>
                    <div class="ct-me-name">我</div>
                    <div class="ct-me-bio">个人资料与聊天设置将在这里管理</div>
                </div>
            </div>
            <div class="ct-card">
                <div class="ct-row">
                    <div class="ct-row-main"><div class="ct-row-name">收藏</div></div>
                </div>
                <div class="ct-row">
                    <div class="ct-row-main"><div class="ct-row-name">表情包</div></div>
                </div>
                <div class="ct-row">
                    <div class="ct-row-main"><div class="ct-row-name">聊天设置</div></div>
                </div>
            </div>
        `;
    }

    function renderAddContactModal() {
        const listEl = document.getElementById('ctAddContactList');
        const chars = getArchiveChars();
        const addedIds = getContactIds();
        const filtered = chars.filter(c => !modalSearchKeyword || getCharDisplayName(c).toLowerCase().includes(modalSearchKeyword));

        if (chars.length === 0) {
            listEl.innerHTML = '<div class="ct-empty">档案里还没有角色，请先去「档案」App 创建 Char</div>';
            return;
        }
        if (filtered.length === 0) {
            listEl.innerHTML = '<div class="ct-empty">没有搜到匹配的角色</div>';
            return;
        }

        listEl.innerHTML = filtered.map(c => {
            const isAdded = addedIds.includes(c.id);
            return `
                <div class="ct-pick-row">
                    <div class="ct-pick-left">
                        ${renderAvatarHtml(c, false)}
                        <div class="ct-row-main">
                            <div class="ct-row-name">${escapeHtml(getCharDisplayName(c))}</div>
                            <div class="ct-row-sub">${escapeHtml(c.group || 'Default')}</div>
                        </div>
                    </div>
                    <button class="ct-pill-btn ${isAdded ? 'done' : ''}" data-add-char="${escapeHtml(c.id)}">${isAdded ? '已添加' : '添加'}</button>
                </div>
            `;
        }).join('');

        listEl.querySelectorAll('[data-add-char]').forEach(btn => {
            btn.addEventListener('click', () => {
                const cid = btn.dataset.addChar;
                const c = chars.find(item => item.id === cid);
                if (!c) return;

                const ids = getContactIds();
                if (!ids.includes(cid)) {
                    ids.push(cid);
                    saveJSON(STORAGE_CONTACTS_KEY, ids);
                }

                const threads = getThreads();
                if (!threads.some(t => t.type === 'dm' && t.charId === cid)) {
                    threads.unshift({
                        id: 'dm-' + cid,
                        type: 'dm',
                        charId: cid,
                        name: getCharDisplayName(c),
                        lastMsg: '已添加为联系人',
                        lastTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
                    });
                    saveJSON(STORAGE_THREADS_KEY, threads);
                }

                renderAddContactModal();
                renderActiveTab();
                showToast('已添加 ' + getCharDisplayName(c));
            });
        });
    }

    function renderGroupPickModal() {
        const listEl = document.getElementById('ctGroupPickList');
        const chars = getArchiveChars();
        const filtered = chars.filter(c => !modalSearchKeyword || getCharDisplayName(c).toLowerCase().includes(modalSearchKeyword));

        if (chars.length === 0) {
            listEl.innerHTML = '<div class="ct-empty">档案里还没有角色，请先去「档案」App 创建 Char</div>';
            return;
        }
        if (filtered.length === 0) {
            listEl.innerHTML = '<div class="ct-empty">没有搜到匹配的角色</div>';
            return;
        }

        listEl.innerHTML = filtered.map(c => {
            const checked = groupSelectedIds.includes(c.id);
            return `
                <div class="ct-pick-row" data-pick-char="${escapeHtml(c.id)}" style="cursor:pointer;">
                    <div class="ct-pick-left">
                        ${renderAvatarHtml(c, false)}
                        <div class="ct-row-main">
                            <div class="ct-row-name">${escapeHtml(getCharDisplayName(c))}</div>
                            <div class="ct-row-sub">${escapeHtml(c.group || 'Default')}</div>
                        </div>
                    </div>
                    <div class="ct-check-circle ${checked ? 'checked' : ''}">
                        ${checked ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
                    </div>
                </div>
            `;
        }).join('');

        listEl.querySelectorAll('[data-pick-char]').forEach(row => {
            row.addEventListener('click', () => {
                const cid = row.dataset.pickChar;
                if (groupSelectedIds.includes(cid)) {
                    groupSelectedIds = groupSelectedIds.filter(id => id !== cid);
                } else {
                    groupSelectedIds.push(cid);
                }
                renderGroupPickModal();
            });
        });
    }

    function createGroupChat() {
        if (groupSelectedIds.length < 2) {
            showToast('请至少选择 2 位成员发起群聊');
            return;
        }
        const chars = getArchiveChars();
        const selectedChars = chars.filter(c => groupSelectedIds.includes(c.id));
        const customName = document.getElementById('ctGroupNameInput').value.trim();
        const groupName = customName || selectedChars.map(c => getCharDisplayName(c)).slice(0, 3).join('、') + (selectedChars.length > 3 ? '等' : '');

        const threads = getThreads();
        threads.unshift({
            id: 'grp-' + Date.now(),
            type: 'group',
            memberIds: groupSelectedIds.slice(),
            name: groupName,
            lastMsg: `群聊已创建（${selectedChars.length}人）`,
            lastTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        });
        saveJSON(STORAGE_THREADS_KEY, threads);

        document.getElementById('ctGroupModal').classList.remove('open');
        groupSelectedIds = [];
        renderActiveTab();
        showToast('已发起群聊');
    }

    window.PhoneChat = {
        getThreads: getThreads,
        getContactIds: getContactIds
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount);
    } else {
        mount();
    }
})();