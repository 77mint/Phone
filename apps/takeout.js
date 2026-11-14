/* =========================================================
   小团外卖 (apps/takeout.css)
   纯白卡片 + 浅灰底色 + 对角高光液态玻璃返回键与底栏
   ========================================================= */

#app-takeout {
    background: #f2f2f7;
    color: #1c1c1e;
    font-family: var(--app-font, -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", sans-serif);
    font-size: var(--app-font-size, 15px);
}

.tk-app {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #f2f2f7;
}

/* 顶部栏 */
.tk-topbar {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: calc(var(--safe-top, 44px) + 8px) 16px 10px;
    background: rgba(242, 242, 247, 0.88);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    z-index: 10;
}

.tk-topbar-left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
}

/* 对角高光液态玻璃返回键 */
.tk-back-btn {
    position: relative;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.34) 0%, rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0.22) 100%);
    color: #111111;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow:
        0 10px 26px rgba(0, 0, 0, 0.12),
        0 2px 6px rgba(0, 0, 0, 0.05),
        inset 0 1px 1px rgba(255, 255, 255, 0.5),
        inset 0 -1px 2px rgba(0, 0, 0, 0.05);
    flex-shrink: 0;
    transition: transform 0.15s ease;
}

.tk-back-btn::before {
    content: "";
    position: absolute;
    inset: 0;
    padding: 1.3px;
    border-radius: inherit;
    background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.98) 0%,
        rgba(255, 255, 255, 0.35) 22%,
        rgba(255, 255, 255, 0) 44%,
        rgba(255, 255, 255, 0) 56%,
        rgba(255, 255, 255, 0.35) 78%,
        rgba(255, 255, 255, 0.92) 100%
    );
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
}

.tk-back-btn:active {
    transform: scale(0.92);
}

.tk-back-btn.is-hidden {
    display: none;
}

.tk-title {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.3px;
    color: #111111;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* 主滚动区 */
.tk-scroll {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 4px 16px 110px;
}

.tk-scroll::-webkit-scrollbar {
    display: none;
}

/* 10 宫格分类卡片 */
.tk-cat-card {
    background: #ffffff;
    border-radius: 22px;
    padding: 14px 10px 12px;
    margin-bottom: 16px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.tk-cat-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 12px 4px;
}

.tk-cat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    border: none;
    background: transparent;
    padding: 2px 0;
    cursor: pointer;
    color: #1c1c1e;
}

.tk-cat-item:active .tk-cat-icon {
    transform: scale(0.92);
}

.tk-cat-icon {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    background: #f2f2f7;
    color: #1c1c1e;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.18s ease, color 0.18s ease, transform 0.12s ease;
}

.tk-cat-item.active .tk-cat-icon {
    background: #1c1c1e;
    color: #ffffff;
}

.tk-cat-label {
    font-size: 11px;
    font-weight: 600;
    color: #3a3a3c;
    line-height: 1.2;
}

.tk-cat-item.active .tk-cat-label {
    color: #111111;
    font-weight: 700;
}

/* 区块标题 */
.tk-sec-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 4px 2px 12px;
}

.tk-sec-title {
    font-size: 17px;
    font-weight: 700;
    color: #111111;
}

.tk-sec-sub {
    font-size: 12px;
    color: #8e8e93;
}

/* 店铺卡片 */
.tk-store-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.tk-store-card {
    background: #ffffff;
    border-radius: 22px;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.045);
    cursor: pointer;
    transition: transform 0.14s ease;
}

.tk-store-card:active {
    transform: scale(0.985);
}

.tk-store-banner {
    position: relative;
    width: 100%;
    height: 126px;
    overflow: hidden;
    background: #d8dce3;
}

.tk-store-banner-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: opacity 0.25s ease;
}

.tk-store-banner-scrim {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.28) 100%);
    pointer-events: none;
}

.tk-store-badge {
    position: absolute;
    top: 10px;
    left: 10px;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.88);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    color: #1c1c1e;
    font-size: 11px;
    font-weight: 600;
}

.tk-store-body {
    padding: 12px 14px 14px;
}

.tk-store-row1 {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}

.tk-store-name {
    font-size: 16px;
    font-weight: 700;
    color: #111111;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.tk-store-rating {
    font-size: 12px;
    font-weight: 700;
    color: #ff7a00;
    flex-shrink: 0;
}

.tk-store-meta {
    margin-top: 4px;
    font-size: 12px;
    color: #8e8e93;
}

.tk-store-preview {
    margin-top: 10px;
    display: flex;
    gap: 8px;
    overflow-x: auto;
}

.tk-store-preview::-webkit-scrollbar {
    display: none;
}

.tk-preview-chip {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px 4px 4px;
    border-radius: 10px;
    background: #f2f2f7;
    font-size: 11px;
    color: #3a3a3c;
    font-weight: 500;
}

.tk-preview-chip img {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    object-fit: cover;
    background: #e5e5ea;
}

/* 底部对角高光液态玻璃导航栏 */
.tk-bottom-bar {
    position: absolute;
    left: 50%;
    bottom: max(18px, env(safe-area-inset-bottom));
    transform: translateX(-50%);
    width: 196px;
    display: flex;
    align-items: center;
    padding: 4px;
    border-radius: 999px;
    border: none;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0.06) 50%, rgba(255, 255, 255, 0.18) 100%);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    box-shadow:
        0 10px 26px rgba(0, 0, 0, 0.12),
        0 2px 6px rgba(0, 0, 0, 0.05),
        inset 0 1px 1px rgba(255, 255, 255, 0.5),
        inset 0 -1px 2px rgba(0, 0, 0, 0.05);
    z-index: 20;
}

.tk-bottom-bar::before {
    content: "";
    position: absolute;
    inset: 0;
    padding: 1.3px;
    border-radius: inherit;
    background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.98) 0%,
        rgba(255, 255, 255, 0.35) 22%,
        rgba(255, 255, 255, 0) 44%,
        rgba(255, 255, 255, 0) 56%,
        rgba(255, 255, 255, 0.35) 78%,
        rgba(255, 255, 255, 0.92) 100%
    );
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
}

.tk-tab-btn {
    position: relative;
    z-index: 1;
    flex: 1;
    border: none;
    background: transparent;
    padding: 9px 0;
    border-radius: 999px;
    font-size: 14px;
    font-weight: 500;
    color: #666666;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
}

.tk-tab-btn:active {
    transform: scale(0.94);
}

.tk-tab-btn.active {
    background: rgba(0, 0, 0, 0.055);
    box-shadow:
        inset 0 1px 1px rgba(255, 255, 255, 0.75),
        0 1px 3px rgba(0, 0, 0, 0.04);
    color: #111111;
    font-weight: 600;
}

/* 分类全屏页 */
.tk-subview {
    position: absolute;
    inset: 0;
    background: #f2f2f7;
    z-index: 28;
    display: none;
    flex-direction: column;
}

.tk-subview.open {
    display: flex;
}

.tk-subview-head {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: calc(var(--safe-top, 44px) + 8px) 16px 12px;
    background: rgba(242, 242, 247, 0.92);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
}

.tk-subview-left {
    display: flex;
    align-items: center;
    gap: 10px;
}

.tk-subview-title {
    font-size: 19px;
    font-weight: 700;
    color: #111111;
}

.tk-subview-count {
    font-size: 12px;
    color: #8e8e93;
    font-weight: 500;
}

.tk-subview-scroll {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 4px 16px 40px;
}

.tk-subview-scroll::-webkit-scrollbar {
    display: none;
}

/* 店铺详情全屏页 */
.tk-store-view {
    position: absolute;
    inset: 0;
    background: #f2f2f7;
    z-index: 35;
    display: none;
    flex-direction: column;
}

.tk-store-view.open {
    display: flex;
}

.tk-store-header {
    position: relative;
    height: calc(var(--safe-top, 44px) + 128px);
    flex-shrink: 0;
    overflow: hidden;
    background: #2c2c2e;
}

.tk-store-header-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.tk-store-header-scrim {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.65) 100%);
    pointer-events: none;
}

.tk-store-header-actions {
    position: absolute;
    top: calc(var(--safe-top, 44px) + 8px);
    left: 16px;
    right: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 2;
}

.tk-circle-btn {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: none;
    background: rgba(255, 255, 255, 0.9);
    color: #1c1c1e;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.14);
}

.tk-circle-btn:active {
    transform: scale(0.92);
}

.tk-store-header-info {
    position: absolute;
    left: 16px;
    right: 16px;
    bottom: 14px;
    color: #ffffff;
    z-index: 2;
}

.tk-store-header-name {
    font-size: 20px;
    font-weight: 700;
    text-shadow: 0 1px 6px rgba(0, 0, 0, 0.35);
}

.tk-store-header-sub {
    margin-top: 3px;
    font-size: 12px;
    opacity: 0.94;
}

.tk-dish-list {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 14px 16px 110px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.tk-dish-list::-webkit-scrollbar {
    display: none;
}

.tk-dish-card {
    background: #ffffff;
    border-radius: 20px;
    padding: 10px;
    display: flex;
    gap: 12px;
    align-items: center;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.035);
}

.tk-dish-img {
    width: 82px;
    height: 82px;
    border-radius: 14px;
    object-fit: cover;
    background: #e5e5ea;
    flex-shrink: 0;
}

.tk-dish-info {
    flex: 1;
    min-width: 0;
}

.tk-dish-name {
    font-size: 15px;
    font-weight: 700;
    color: #111111;
    margin-bottom: 3px;
}

.tk-dish-desc {
    font-size: 12px;
    color: #8e8e93;
    margin-bottom: 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.tk-dish-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.tk-dish-price {
    font-size: 16px;
    font-weight: 700;
    color: #ff3b30;
}

.tk-qty-ctrl {
    display: flex;
    align-items: center;
    gap: 8px;
}

.tk-qty-btn {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
}

.tk-qty-btn.minus {
    background: #f2f2f7;
    color: #1c1c1e;
}

.tk-qty-btn.plus {
    background: #1c1c1e;
    color: #ffffff;
}

.tk-qty-num {
    font-size: 13px;
    font-weight: 700;
    min-width: 14px;
    text-align: center;
}

/* 可展开购物车抽屉 */
.tk-cart-drawer-mask {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.36);
    z-index: 38;
    display: none;
}

.tk-cart-drawer-mask.open {
    display: block;
}

.tk-cart-drawer {
    position: absolute;
    left: 12px;
    right: 12px;
    bottom: calc(var(--safe-bottom, 20px) + 74px);
    background: #ffffff;
    border-radius: 24px;
    padding: 14px 16px 12px;
    max-height: 55%;
    display: none;
    flex-direction: column;
    box-shadow: 0 12px 34px rgba(0, 0, 0, 0.2);
    z-index: 39;
}

.tk-cart-drawer.open {
    display: flex;
}

.tk-cart-drawer-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 10px;
    border-bottom: 1px solid #f2f2f7;
    flex-shrink: 0;
}

.tk-cart-drawer-title {
    font-size: 15px;
    font-weight: 700;
    color: #111111;
}

.tk-cart-clear-btn {
    border: none;
    background: transparent;
    color: #8e8e93;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    padding: 4px 6px;
}

.tk-cart-drawer-list {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 10px 0 4px;
}

.tk-cart-drawer-list::-webkit-scrollbar {
    display: none;
}

.tk-cart-drawer-item {
    display: flex;
    align-items: center;
    gap: 10px;
}

.tk-cart-drawer-thumb {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    object-fit: cover;
    background: #e5e5ea;
    flex-shrink: 0;
}

.tk-cart-drawer-info {
    flex: 1;
    min-width: 0;
}

.tk-cart-drawer-name {
    font-size: 14px;
    font-weight: 600;
    color: #111111;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.tk-cart-drawer-sub {
    font-size: 12px;
    color: #ff3b30;
    font-weight: 700;
    margin-top: 2px;
}

.tk-cart-drawer-foot {
    padding-top: 8px;
    border-top: 1px solid #f2f2f7;
    font-size: 12px;
    color: #8e8e93;
    display: flex;
    justify-content: space-between;
    flex-shrink: 0;
}

/* 店铺底部购物车条 */
.tk-cart-bar {
    position: absolute;
    left: 16px;
    right: 16px;
    bottom: calc(var(--safe-bottom, 20px) + 8px);
    background: #1c1c1e;
    color: #ffffff;
    border-radius: 999px;
    padding: 8px 8px 8px 14px;
    display: none;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.24);
    z-index: 40;
}

.tk-cart-bar.show {
    display: flex;
}

.tk-cart-bar-info {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    min-width: 0;
    padding: 4px 0;
}

.tk-cart-icon-wrap {
    position: relative;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.14);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.tk-cart-badge {
    position: absolute;
    top: -3px;
    right: -4px;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    border-radius: 999px;
    background: #ff3b30;
    color: #ffffff;
    font-size: 10px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
}

.tk-cart-text-wrap {
    display: flex;
    align-items: baseline;
    gap: 6px;
    min-width: 0;
}

.tk-cart-total {
    font-size: 17px;
    font-weight: 700;
}

.tk-cart-count {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.78);
    display: inline-flex;
    align-items: center;
    gap: 3px;
}

.tk-cart-submit {
    border: none;
    background: #ffffff;
    color: #111111;
    border-radius: 999px;
    padding: 9px 18px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    flex-shrink: 0;
}

/* 订单列表 */
.tk-order-card {
    background: #ffffff;
    border-radius: 22px;
    padding: 14px 16px;
    margin-bottom: 12px;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
}

.tk-order-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 10px;
    border-bottom: 1px solid #f2f2f7;
}

.tk-order-store {
    font-size: 15px;
    font-weight: 700;
}

.tk-order-status {
    font-size: 12px;
    font-weight: 600;
    color: #34c759;
}

.tk-order-items {
    padding: 10px 0;
    font-size: 13px;
    color: #3a3a3c;
    line-height: 1.55;
}

.tk-order-foot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: #8e8e93;
}

.tk-order-price {
    font-size: 15px;
    font-weight: 700;
    color: #111111;
}

.tk-empty {
    text-align: center;
    padding: 64px 24px;
    color: #8e8e93;
    font-size: 14px;
}

/* 弹窗 */
.tk-modal-mask {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.36);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    z-index: 60;
    display: none;
    align-items: flex-end;
    justify-content: center;
}

.tk-modal-mask.open {
    display: flex;
}

.tk-modal {
    width: 100%;
    background: #ffffff;
    border-radius: 26px 26px 0 0;
    padding: 18px 18px calc(var(--safe-bottom, 20px) + 18px);
    max-height: 82%;
    overflow-y: auto;
    box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.14);
}

.tk-modal-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
}

.tk-modal-title {
    font-size: 17px;
    font-weight: 700;
}

.tk-modal-close {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: none;
    background: #f2f2f7;
    color: #1c1c1e;
    font-size: 16px;
    cursor: pointer;
}

.tk-field-label {
    font-size: 12px;
    font-weight: 600;
    color: #6c6c70;
    margin: 12px 0 6px;
}

.tk-input {
    width: 100%;
    box-sizing: border-box;
    border: none;
    background: #f2f2f7;
    border-radius: 14px;
    padding: 11px 12px;
    font-size: 14px;
    color: #111111;
    outline: none;
    font-family: inherit;
}

.tk-mode-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-top: 6px;
}

.tk-mode-btn {
    border: 1.5px solid #e5e5ea;
    background: #ffffff;
    color: #3a3a3c;
    border-radius: 14px;
    padding: 9px 6px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
}

.tk-mode-btn.active {
    border-color: #1c1c1e;
    background: #1c1c1e;
    color: #ffffff;
}

.tk-char-list {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 4px 0;
}

.tk-char-chip {
    flex-shrink: 0;
    padding: 7px 12px;
    border-radius: 999px;
    border: 1.5px solid #e5e5ea;
    background: #ffffff;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
}

.tk-char-chip.active {
    border-color: #1c1c1e;
    background: #1c1c1e;
    color: #ffffff;
}

.tk-primary-btn {
    width: 100%;
    margin-top: 16px;
    border: none;
    background: #1c1c1e;
    color: #ffffff;
    border-radius: 16px;
    padding: 13px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
}
