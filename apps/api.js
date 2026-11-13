(function () {
  var root = document.getElementById('app-api');
  if (!root) return;

  var cards = [
    { id: 'llm', title: '语言模型（LLM）', sub: '未配置' },
    { id: 'voice', title: '语音模型（VOICE）', sub: '未配置' },
    { id: 'image', title: '生图模型（IMAGE）', sub: '未配置' },
    { id: 'translate', title: '翻译模型', sub: '未配置' },
    { id: 'logs', title: 'API调用日志', sub: '暂无记录' }
  ];

  var cardsHtml = '';
  cards.forEach(function (c) {
    cardsHtml +=
      '<div class="api-card" data-api-card="' + c.id + '">' +
        '<div class="api-row">' +
          '<div class="api-main">' +
            '<div class="api-title">' + c.title + '</div>' +
            '<div class="api-sub">' + c.sub + '</div>' +
          '</div>' +
          '<svg class="api-arrow" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>' +
        '</div>' +
      '</div>';
  });

  root.innerHTML =
    '<div class="app-header">' +
      '<div class="app-back" data-close-app>' +
        '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>' +
      '</div>' +
    '</div>' +
    '<div class="app-body">' +
      cardsHtml +
    '</div>';
})();