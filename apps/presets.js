(function () {
  const STORAGE_KEY = 'phone_presets_list_v1';
  const ACTIVE_ONLINE_KEY = 'phone_presets_active_online_v1';
  const ACTIVE_OFFLINE_KEY = 'phone_presets_active_offline_v1';

  const SLOT_TYPES = [
    { id: 'text', label: '普通提示词' },
    { id: 'char', label: '角色设定插槽' },
    { id: 'lore_before', label: '世界书(前)插槽' },
    { id: 'lore_after', label: '世界书(后)插槽' },
    { id: 'history', label: '聊天记录插槽' }
  ];

  let presets = [];
  let activeOnlineId = '';
  let activeOfflineId = '';
  let currentTab = 'online'; // 'online' | 'offline'
  let editingId = null;
  let expandedEntryId = null;

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      presets = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(presets)) presets = [];
      presets.forEach(p => {
        if (!p.scene) p.scene = 'online';
      });
    } catch (e) {
      presets = [];
    }
    activeOnlineId = localStorage.getItem(ACTIVE_ONLINE_KEY) || '';
    activeOfflineId = localStorage.getItem(ACTIVE_OFFLINE_KEY) || '';
  }

  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    if (activeOnlineId) localStorage.setItem(ACTIVE_ONLINE_KEY, activeOnlineId);
    else localStorage.removeItem(ACTIVE_ONLINE_KEY);

    if (activeOfflineId) localStorage.setItem(ACTIVE_OFFLINE_KEY, activeOfflineId);
    else localStorage.removeItem(ACTIVE_OFFLINE_KEY);
  }

  function getActiveIdForScene(scene) {
    return scene === 'offline' ? activeOfflineId : activeOnlineId;
  }

  function setActiveIdForScene(scene, id) {
    if (scene === 'offline') activeOfflineId = id;
    else activeOnlineId = id;
  }

  function estimateTokens(text) {
    if (!text) return 0;
    const str = String(text);
    const cjkMatches = str.match(/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/g);
    const cjkCount = cjkMatches ? cjkMatches.length : 0;
    const otherCount = str.length - cjkCount;
    return Math.max(1, Math.round(cjkCount * 1.5 + otherCount * 0.28));
  }

  function calcPresetTokens(preset) {
    if (!preset || !Array.isArray(preset.entries)) return 0;
    return preset.entries.reduce((sum, entry) => {
      if (!entry.enabled || entry.slot !== 'text') return sum;
      return sum + estimateTokens(entry.content);
    }, 0);
  }

  function uid(prefix) {
    return (prefix || 'pr') + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getEditingPreset() {
    return presets.find(p => p.id === editingId) || null;
  }

  function roleBadgeText(role) {
    if (role === 'user') return 'USR';
    if (role === 'assistant') return 'AST';
    return 'SYS';
  }

  function slotLabelText(slot) {
    const found = SLOT_TYPES.find(s => s.id === slot);
    return found ? found.label : '普通提示词';
  }

  function renderDOM() {
    const root = document.getElementById('app-presets');
    if (!root) return;

    root.innerHTML = `
      <div class="pr-wrap">
        <div class="pr-topbar">
          <div class="pr-topbar-left">
            <button class="app-back" id="prBackBtn" type="button" aria-label="返回">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div class="pr-title" id="prPageTitle">预设</div>
          </div>
          <div class="pr-topbar-actions">
            <button class="pr-pill-btn" id="prImportBtn" type="button">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              导入
            </button>
            <button class="pr-pill-btn is-dark" id="prNewBtn" type="button">+ 新建</button>
          </div>
        </div>

        <div class="pr-scroll" id="prListScroll"></div>

        <div class="pr-bottom-bar">
          <button class="pr-tab-btn is-active" data-tab="online" type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            线上
          </button>
          <button class="pr-tab-btn" data-tab="offline" type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            线下
          </button>
        </div>

        <div class="pr-detail" id="prDetailView">
          <div class="pr-topbar">
            <div class="pr-topbar-left">
              <input class="pr-detail-name-input" id="prDetailName" type="text" placeholder="预设名称" />
            </div>
            <div class="pr-topbar-actions">
              <button class="pr-icon-btn" id="prExportBtn" type="button" aria-label="导出">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              </button>
              <button class="pr-icon-btn" id="prCloseDetailBtn" type="button" aria-label="关闭">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
          <div class="pr-scroll" id="prDetailScroll"></div>
        </div>

        <div class="pr-modal-mask" id="prNewModal">
          <div class="pr-modal">
            <div class="pr-modal-head">
              <div class="pr-modal-title" id="prNewModalTitle">新建线上预设</div>
              <button class="pr-icon-btn" id="prCloseModalBtn" type="button" aria-label="关闭">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <input class="pr-input" id="prNewNameInput" type="text" placeholder="输入预设名称" />
            <button class="pr-modal-submit" id="prCreateConfirmBtn" type="button">创建</button>
          </div>
        </div>

        <input type="file" id="prImportFile" accept=".json,application/json" style="display:none" />
      </div>
    `;

    bindBaseEvents(root);
    renderList();
  }

  function bindBaseEvents(root) {
    const newBtn = root.querySelector('#prNewBtn');
    const newModal = root.querySelector('#prNewModal');
    const newModalTitle = root.querySelector('#prNewModalTitle');
    const newInput = root.querySelector('#prNewNameInput');
    const closeModalBtn = root.querySelector('#prCloseModalBtn');
    const createConfirmBtn = root.querySelector('#prCreateConfirmBtn');
    const backBtn = root.querySelector('#prBackBtn');

    root.querySelectorAll('.pr-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        if (tab === currentTab) return;
        currentTab = tab;
        root.querySelectorAll('.pr-tab-btn').forEach(b => b.classList.toggle('is-active', b === btn));
        if (backBtn) backBtn.style.display = currentTab === 'online' ? '' : 'none';
        renderList();
      });
    });

    newBtn.addEventListener('click', () => {
      newModalTitle.textContent = currentTab === 'offline' ? '新建线下预设' : '新建线上预设';
      newInput.value = '';
      newModal.classList.add('is-open');
      setTimeout(() => newInput.focus(), 60);
    });

    closeModalBtn.addEventListener('click', () => newModal.classList.remove('is-open'));
    newModal.addEventListener('click', (e) => {
      if (e.target === newModal) newModal.classList.remove('is-open');
    });

    createConfirmBtn.addEventListener('click', () => {
      const name = newInput.value.trim() || '未命名预设';
      const item = {
        id: uid('pr'),
        scene: currentTab,
        name: name,
        maxContext: 8192,
        maxTokens: 2048,
        temperature: 0.85,
        topP: 0.95,
        entries: []
      };
      presets.unshift(item);
      if (!getActiveIdForScene(currentTab)) setActiveIdForScene(currentTab, item.id);
      saveData();
      newModal.classList.remove('is-open');
      renderList();
      openDetail(item.id);
    });

    const importBtn = root.querySelector('#prImportBtn');
    const importFile = root.querySelector('#prImportFile');
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const json = JSON.parse(reader.result);
          const imported = parseSTPreset(json, file.name.replace(/\.json$/i, ''), currentTab);
          presets.unshift(imported);
          if (!getActiveIdForScene(currentTab)) setActiveIdForScene(currentTab, imported.id);
          saveData();
          renderList();
          openDetail(imported.id);
        } catch (err) {
          alert('预设文件解析失败，请确认是有效的 JSON 文件');
        }
      };
      reader.readAsText(file);
      importFile.value = '';
    });

    root.querySelector('#prCloseDetailBtn').addEventListener('click', closeDetail);
    root.querySelector('#prExportBtn').addEventListener('click', exportCurrentPreset);

    const nameInput = root.querySelector('#prDetailName');
    nameInput.addEventListener('input', () => {
      const p = getEditingPreset();
      if (!p) return;
      p.name = nameInput.value;
      saveData();
      renderList();
    });
  }

  function renderList() {
    const container = document.getElementById('prListScroll');
    if (!container) return;

    const list = presets.filter(p => (p.scene || 'online') === currentTab);
    const activeForScene = getActiveIdForScene(currentTab);
    const sceneLabel = currentTab === 'offline' ? '线下' : '线上';

    if (!list.length) {
      container.innerHTML = `
        <div class="pr-empty">
          <div class="pr-empty-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
          </div>
          <div class="pr-empty-title">暂无${sceneLabel}预设</div>
          <div class="pr-empty-desc">点击右上角「+ 新建」手动编排，或「导入」酒馆 JSON 预设</div>
        </div>
      `;
      return;
    }

    container.innerHTML = `<div class="pr-list">${list.map(p => {
      const isActive = p.id === activeForScene;
      const enabledCount = (p.entries || []).filter(e => e.enabled).length;
      const totalCount = (p.entries || []).length;
      const tokens = calcPresetTokens(p);
      return `
        <div class="pr-item-card" data-id="${escapeHtml(p.id)}">
          <div class="pr-item-top">
            <div class="pr-item-name">${escapeHtml(p.name || '未命名预设')}</div>
            ${isActive
              ? `<span class="pr-active-badge">当前启用</span>`
              : `<button class="pr-use-btn" data-use="${escapeHtml(p.id)}" type="button">设为当前</button>`}
          </div>
          <div class="pr-item-meta">
            <span class="pr-token-chip">${tokens.toLocaleString()} tok</span>
            <span>启用 ${enabledCount}/${totalCount} 项</span>
            <span>上下文 ${p.maxContext || 8192}</span>
          </div>
        </div>
      `;
    }).join('')}</div>`;

    container.querySelectorAll('.pr-item-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const useBtn = e.target.closest('[data-use]');
        if (useBtn) {
          e.stopPropagation();
          setActiveIdForScene(currentTab, useBtn.getAttribute('data-use'));
          saveData();
          renderList();
          return;
        }
        openDetail(card.getAttribute('data-id'));
      });
    });
  }

  function openDetail(id) {
    editingId = id;
    expandedEntryId = null;
    const p = getEditingPreset();
    if (!p) return;

    const detail = document.getElementById('prDetailView');
    const nameInput = document.getElementById('prDetailName');
    nameInput.value = p.name || '';
    renderDetailBody();
    detail.classList.add('is-open');
  }

  function closeDetail() {
    const detail = document.getElementById('prDetailView');
    if (detail) detail.classList.remove('is-open');
    editingId = null;
    renderList();
  }

  function renderDetailBody() {
    const scroll = document.getElementById('prDetailScroll');
    const p = getEditingPreset();
    if (!scroll || !p) return;

    const scene = p.scene || 'online';
    const totalTok = calcPresetTokens(p);
    const maxCtx = Number(p.maxContext) || 8192;
    const maxReply = Number(p.maxTokens) || 2048;
    const isActive = p.id === getActiveIdForScene(scene);

    scroll.innerHTML = `
      <div class="pr-card">
        <div class="pr-row-between">
          <div>
            <div style="font-weight:700; color:#111;">设为当前${scene === 'offline' ? '线下' : '线上'}预设</div>
            <div style="font-size:12px; color:#8e8e93; margin-top:2px;">长按下方条目可拖动调整顺序</div>
          </div>
          <button class="pr-switch ${isActive ? 'is-on' : ''}" id="prActiveToggle" type="button" aria-label="设为当前"></button>
        </div>

        <div class="pr-token-summary">
          <span class="pr-token-label">整套预设 Token</span>
          <span class="pr-token-big" id="prTotalTokenNum">${totalTok.toLocaleString()} <span style="font-size:13px;font-weight:600;color:#6e6e73;">tok</span></span>
        </div>

        <div class="pr-param-grid">
          <div class="pr-param-box">
            <div class="pr-param-label">上下文上限 (Context)</div>
            <input class="pr-param-input" data-param="maxContext" type="number" step="512" value="${maxCtx}" />
          </div>
          <div class="pr-param-box">
            <div class="pr-param-label">最大回复 (Max Tokens)</div>
            <input class="pr-param-input" data-param="maxTokens" type="number" step="128" value="${maxReply}" />
          </div>
          <div class="pr-param-box">
            <div class="pr-param-label">Temperature (0 - 2)</div>
            <input class="pr-param-input" data-param="temperature" type="number" step="0.05" min="0" max="2" value="${p.temperature ?? 0.85}" />
          </div>
          <div class="pr-param-box">
            <div class="pr-param-label">Top P (0 - 1)</div>
            <input class="pr-param-input" data-param="topP" type="number" step="0.05" min="0" max="1" value="${p.topP ?? 0.95}" />
          </div>
        </div>
      </div>

      <button class="pr-add-entry-btn" id="prAddEntryBtn" type="button">+ 添加提示词条目</button>

      <div id="prEntriesWrap">
        ${(p.entries || []).map(entry => renderEntryCard(entry)).join('')}
      </div>

      <div style="text-align:center; padding:12px 0 6px;">
        <button class="pr-del-btn" id="prDeletePresetBtn" type="button">删除整套预设</button>
      </div>
    `;

    bindDetailEvents(scroll, p);
  }

  function renderEntryCard(entry) {
    const isExpanded = expandedEntryId === entry.id;
    const isText = entry.slot === 'text';
    const tok = isText ? estimateTokens(entry.content) : 0;
    const dotClass = !entry.enabled ? '' : (isText ? 'is-on' : 'is-marker');
    const isLocked = !!entry.locked;

    return `
      <div class="pr-entry-card" data-entry-id="${escapeHtml(entry.id)}">
        <div class="pr-entry-head">
          <div class="pr-entry-head-left">
            <span class="pr-dot ${dotClass}"></span>
            <span class="pr-entry-title">${escapeHtml(entry.name || '未命名条目')}</span>
            <span class="pr-role-tag">${isText ? roleBadgeText(entry.role) : '插槽'}</span>
            <span class="pr-entry-tok" data-entry-tok="${escapeHtml(entry.id)}">${isText ? tok + ' tok' : '动态'}</span>
          </div>
          <div class="pr-entry-head-right">
            ${isLocked ? `
              <span class="pr-lock-badge" title="已锁定">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </span>
            ` : ''}
            <button class="pr-switch ${entry.enabled ? 'is-on' : ''}" data-toggle-entry="${escapeHtml(entry.id)}" type="button" aria-label="启用条目"></button>
          </div>
        </div>
        ${isExpanded ? `
          <div class="pr-entry-body">
            <div class="pr-field">
              <div class="pr-section-label">条目名称</div>
              <input class="pr-input" data-entry-field="name" type="text" value="${escapeHtml(entry.name)}" placeholder="例如：核心指令 / 文风约束" ${isLocked ? 'disabled' : ''} />
            </div>
            <div class="pr-field">
              <div class="pr-section-label">条目类型</div>
              <div class="pr-seg is-5">
                ${SLOT_TYPES.map(s => `
                  <button class="pr-seg-btn ${entry.slot === s.id ? 'is-active' : ''}" data-slot="${s.id}" type="button" ${isLocked ? 'disabled' : ''}>${s.label}</button>
                `).join('')}
              </div>
            </div>
            ${isText ? `
              <div class="pr-field">
                <div class="pr-section-label">发送角色</div>
                <div class="pr-seg">
                  <button class="pr-seg-btn ${entry.role === 'system' ? 'is-active' : ''}" data-role="system" type="button" ${isLocked ? 'disabled' : ''}>System</button>
                  <button class="pr-seg-btn ${entry.role === 'user' ? 'is-active' : ''}" data-role="user" type="button" ${isLocked ? 'disabled' : ''}>User</button>
                  <button class="pr-seg-btn ${entry.role === 'assistant' ? 'is-active' : ''}" data-role="assistant" type="button" ${isLocked ? 'disabled' : ''}>Assistant</button>
                </div>
              </div>
              <div class="pr-field">
                <div class="pr-section-label">提示词内容</div>
                <textarea class="pr-textarea" data-entry-field="content" placeholder="填写该条目的提示词..." ${isLocked ? 'disabled' : ''}>${escapeHtml(entry.content)}</textarea>
              </div>
            ` : `
              <div class="pr-field" style="font-size:12px; color:#8e8e93; background:#f2f2f7; padding:10px 12px; border-radius:12px;">
                该条目为「${slotLabelText(entry.slot)}」，对话时会自动在当前顺序位置插入对应数据。
              </div>
            `}
            <div class="pr-entry-footer">
              <button class="pr-lock-btn ${isLocked ? 'is-locked' : ''}" data-lock-entry="${escapeHtml(entry.id)}" type="button">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  ${isLocked
                    ? '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'
                    : '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>'}
                </svg>
                ${isLocked ? '已锁定（点此解锁）' : '锁定条目'}
              </button>
              <button class="pr-del-btn" data-del-entry="${escapeHtml(entry.id)}" type="button">删除条目</button>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  function updateTokenDashboard(p) {
    const totalTok = calcPresetTokens(p);
    const numEl = document.getElementById('prTotalTokenNum');
    if (numEl) {
      numEl.innerHTML = `${totalTok.toLocaleString()} <span style="font-size:13px;font-weight:600;color:#6e6e73;">tok</span>`;
    }
  }

  function bindLongPressDrag(wrap, p) {
    let holdTimer = null;
    let draggingCard = null;
    let startX = 0;
    let startY = 0;
    let suppressClick = false;

    function clearTimer() {
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
    }

    function syncEntriesOrderFromDOM() {
      const ids = Array.from(wrap.querySelectorAll('.pr-entry-card')).map(el => el.getAttribute('data-entry-id'));
      const map = {};
      p.entries.forEach(e => { map[e.id] = e; });
      p.entries = ids.map(id => map[id]).filter(Boolean);
      saveData();
    }

    wrap.addEventListener('touchstart', (e) => {
      const head = e.target.closest('.pr-entry-head');
      if (!head || e.target.closest('button')) return;
      const card = head.closest('.pr-entry-card');
      if (!card || e.touches.length !== 1) return;

      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      suppressClick = false;

      clearTimer();
      holdTimer = setTimeout(() => {
        draggingCard = card;
        suppressClick = true;
        card.classList.add('is-dragging');
        if (navigator.vibrate) {
          try { navigator.vibrate(15); } catch (err) {}
        }
      }, 240);
    }, { passive: true });

    wrap.addEventListener('touchmove', (e) => {
      if (!draggingCard) {
        if (holdTimer && e.touches.length === 1) {
          const dx = Math.abs(e.touches[0].clientX - startX);
          const dy = Math.abs(e.touches[0].clientY - startY);
          if (dx > 10 || dy > 10) clearTimer();
        }
        return;
      }

      e.preventDefault();
      const y = e.touches[0].clientY;
      const cards = Array.from(wrap.querySelectorAll('.pr-entry-card'));
      for (const other of cards) {
        if (other === draggingCard) continue;
        const rect = other.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        if (y < mid && draggingCard.compareDocumentPosition(other) & Node.DOCUMENT_POSITION_PRECEDING) {
          wrap.insertBefore(draggingCard, other);
          break;
        } else if (y > mid && draggingCard.compareDocumentPosition(other) & Node.DOCUMENT_POSITION_FOLLOWING) {
          wrap.insertBefore(draggingCard, other.nextSibling);
          break;
        }
      }
    }, { passive: false });

    function endDrag() {
      clearTimer();
      if (draggingCard) {
        draggingCard.classList.remove('is-dragging');
        draggingCard = null;
        syncEntriesOrderFromDOM();
      }
    }

    wrap.addEventListener('touchend', endDrag);
    wrap.addEventListener('touchcancel', endDrag);
    wrap.addEventListener('click', (e) => {
      if (suppressClick) {
        e.stopPropagation();
        e.preventDefault();
        suppressClick = false;
      }
    }, true);
  }

  function bindDetailEvents(scroll, p) {
    const scene = p.scene || 'online';
    const activeToggle = scroll.querySelector('#prActiveToggle');
    activeToggle.addEventListener('click', () => {
      const next = getActiveIdForScene(scene) === p.id ? '' : p.id;
      setActiveIdForScene(scene, next);
      saveData();
      activeToggle.classList.toggle('is-on', next === p.id);
      renderList();
    });

    scroll.querySelectorAll('[data-param]').forEach(inp => {
      inp.addEventListener('input', () => {
        const key = inp.getAttribute('data-param');
        const val = parseFloat(inp.value);
        if (!isNaN(val)) {
          p[key] = val;
          saveData();
        }
      });
    });

    scroll.querySelector('#prAddEntryBtn').addEventListener('click', () => {
      const entry = {
        id: uid('ent'),
        name: '新提示词',
        role: 'system',
        slot: 'text',
        content: '',
        enabled: true,
        locked: false
      };
      p.entries.push(entry);
      expandedEntryId = entry.id;
      saveData();
      renderDetailBody();
    });

    scroll.querySelector('#prDeletePresetBtn').addEventListener('click', () => {
      if (!confirm('确定删除这套预设吗？')) return;
      presets = presets.filter(item => item.id !== p.id);
      if (getActiveIdForScene(scene) === p.id) {
        const fallback = presets.find(item => (item.scene || 'online') === scene);
        setActiveIdForScene(scene, fallback ? fallback.id : '');
      }
      saveData();
      closeDetail();
    });

    const entriesWrap = scroll.querySelector('#prEntriesWrap');
    if (entriesWrap) bindLongPressDrag(entriesWrap, p);

    scroll.querySelectorAll('.pr-entry-card').forEach(card => {
      const entryId = card.getAttribute('data-entry-id');
      const entry = p.entries.find(e => e.id === entryId);
      if (!entry) return;

      card.querySelector('.pr-entry-head').addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        expandedEntryId = expandedEntryId === entryId ? null : entryId;
        renderDetailBody();
      });

      const toggleBtn = card.querySelector(`[data-toggle-entry="${entryId}"]`);
      if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          entry.enabled = !entry.enabled;
          saveData();
          renderDetailBody();
        });
      }

      const lockBtn = card.querySelector(`[data-lock-entry="${entryId}"]`);
      if (lockBtn) {
        lockBtn.addEventListener('click', () => {
          entry.locked = !entry.locked;
          saveData();
          renderDetailBody();
        });
      }

      const nameInp = card.querySelector('[data-entry-field="name"]');
      if (nameInp) {
        nameInp.addEventListener('input', () => {
          entry.name = nameInp.value;
          const titleEl = card.querySelector('.pr-entry-title');
          if (titleEl) titleEl.textContent = entry.name || '未命名条目';
          saveData();
        });
      }

      const contentInp = card.querySelector('[data-entry-field="content"]');
      if (contentInp) {
        contentInp.addEventListener('input', () => {
          entry.content = contentInp.value;
          const tok = estimateTokens(entry.content);
          const tokBadge = card.querySelector(`[data-entry-tok="${entryId}"]`);
          if (tokBadge) tokBadge.textContent = `${tok} tok`;
          saveData();
          updateTokenDashboard(p);
        });
      }

      card.querySelectorAll('[data-role]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (entry.locked) return;
          entry.role = btn.getAttribute('data-role');
          saveData();
          renderDetailBody();
        });
      });

      card.querySelectorAll('[data-slot]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (entry.locked) return;
          entry.slot = btn.getAttribute('data-slot');
          saveData();
          renderDetailBody();
        });
      });

      const delBtn = card.querySelector(`[data-del-entry="${entryId}"]`);
      if (delBtn) {
        delBtn.addEventListener('click', () => {
          if (entry.locked && !confirm('该条目已锁定，确定要删除吗？')) return;
          p.entries = p.entries.filter(e => e.id !== entryId);
          if (expandedEntryId === entryId) expandedEntryId = null;
          saveData();
          renderDetailBody();
        });
      }
    });
  }

  function parseSTPreset(json, fallbackName, scene) {
    const rawPrompts = Array.isArray(json.prompts) ? json.prompts : [];
    const promptMap = {};
    rawPrompts.forEach(item => {
      if (item && item.identifier) promptMap[item.identifier] = item;
    });

    const markerMap = {
      charDescription: 'char',
      charPersonality: 'char',
      worldInfoBefore: 'lore_before',
      worldInfoAfter: 'lore_after',
      chatHistory: 'history'
    };

    let ordered = [];
    if (Array.isArray(json.prompt_order)) {
      const orderGroup = json.prompt_order.find(g => Array.isArray(g.order) && g.order.length) || json.prompt_order[0];
      if (orderGroup && Array.isArray(orderGroup.order)) {
        orderGroup.order.forEach(o => {
          const item = promptMap[o.identifier];
          if (!item) return;
          ordered.push({
            id: uid('ent'),
            name: item.name || o.identifier,
            role: ['system', 'user', 'assistant'].includes(item.role) ? item.role : 'system',
            slot: markerMap[o.identifier] || 'text',
            content: item.content || '',
            enabled: o.enabled !== false,
            locked: !!item.locked
          });
        });
      }
    }

    if (!ordered.length && rawPrompts.length) {
      ordered = rawPrompts.map(item => ({
        id: uid('ent'),
        name: item.name || item.identifier || '提示词',
        role: ['system', 'user', 'assistant'].includes(item.role) ? item.role : 'system',
        slot: markerMap[item.identifier] || 'text',
        content: item.content || '',
        enabled: item.enabled !== false,
        locked: !!item.locked
      }));
    }

    return {
      id: uid('pr'),
      scene: scene || (json.scene === 'offline' ? 'offline' : 'online'),
      name: json.name || fallbackName || '导入的预设',
      maxContext: Number(json.openai_max_context) || 8192,
      maxTokens: Number(json.openai_max_tokens) || 2048,
      temperature: json.temperature !== undefined ? Number(json.temperature) : 0.85,
      topP: json.top_p !== undefined ? Number(json.top_p) : 0.95,
      entries: ordered
    };
  }

  function exportCurrentPreset() {
    const p = getEditingPreset();
    if (!p) return;

    const slotToST = {
      char: 'charDescription',
      lore_before: 'worldInfoBefore',
      lore_after: 'worldInfoAfter',
      history: 'chatHistory'
    };

    const prompts = [];
    const order = [];
    (p.entries || []).forEach(entry => {
      const identifier = slotToST[entry.slot] || entry.id;
      prompts.push({
        identifier: identifier,
        name: entry.name || '提示词',
        role: entry.role || 'system',
        content: entry.slot === 'text' ? (entry.content || '') : '',
        system_prompt: true,
        marker: entry.slot !== 'text',
        locked: !!entry.locked
      });
      order.push({ identifier: identifier, enabled: !!entry.enabled });
    });

    const payload = {
      name: p.name,
      scene: p.scene || 'online',
      temperature: p.temperature,
      top_p: p.topP,
      openai_max_context: p.maxContext,
      openai_max_tokens: p.maxTokens,
      prompts: prompts,
      prompt_order: [{ character_id: 100001, order: order }]
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(p.name || 'preset').replace(/[\\/:*?"<>|]/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  window.PhonePresets = {
    getPresets: (scene) => scene ? presets.filter(p => (p.scene || 'online') === scene) : presets.slice(),
    getActivePreset: (scene) => {
      const targetScene = scene === 'offline' ? 'offline' : 'online';
      const id = getActiveIdForScene(targetScene);
      const list = presets.filter(p => (p.scene || 'online') === targetScene);
      return list.find(p => p.id === id) || list[0] || null;
    },
    estimateTokens: estimateTokens,
    calcPresetTokens: calcPresetTokens
  };

  loadData();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderDOM);
  } else {
    renderDOM();
  }
})();