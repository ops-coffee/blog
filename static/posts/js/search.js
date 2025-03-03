let searchIndex = [];

// 加载搜索索引
async function loadSearchIndex() {
  try {
    const response = await fetch('/search_index.json');
    searchIndex = await response.json();
  } catch (error) {
    console.error('加载搜索索引失败:', error);
  }
}

// 计算相关度分数
function calculateRelevanceScore(item, query) {
  const queryTerms = query.toLowerCase().split(/\s+/);
  let score = 0;

  queryTerms.forEach(term => {
    if (item.title.toLowerCase().includes(term)) {
      score += 10;
    }
    if (item.keywords.toLowerCase().includes(term)) {
      score += 5;
    }
    if (item.content.toLowerCase().includes(term)) {
      score += 1;
    }
  });

  return score;
}

// 高亮显示匹配文本
function highlightText(text, query) {
  const queryTerms = query.toLowerCase().split(/\s+/);
  let highlightedText = text;

  queryTerms.forEach(term => {
    const regex = new RegExp(term, 'gi');
    highlightedText = highlightedText.replace(regex, match => 
      `<span style="background-color: #fff3cd">${match}</span>`
    );
  });

  return highlightedText;
}

// 执行搜索
async function performSearch() {
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  const query = searchInput.value.trim();

  if (query === '') {
    searchResults.innerHTML = '<p>请输入搜索关键词</p>';
    return;
  }

  if (searchIndex.length === 0) {
    await loadSearchIndex();
  }

  const results = searchIndex
    .map(item => ({
      ...item,
      score: calculateRelevanceScore(item, query)
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (results.length === 0) {
    searchResults.innerHTML = '<p>未找到相关结果</p>';
    return;
  }

  const resultsHtml = results.map(item => `
    <div class="result-item">
      <div class="result-title">
        <a href="${item.url}">${highlightText(item.title, query)}</a>
      </div>
      <div class="result-excerpt">
        ${highlightText(item.content, query)}
      </div>
      <div class="result-meta">
        发布于：${item.date}
      </div>
    </div>
  `).join('');

  searchResults.innerHTML = resultsHtml;
}

// 添加回车键搜索功能
document.getElementById('searchInput').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    performSearch();
  }
});

// 页面加载时预加载搜索索引
document.addEventListener('DOMContentLoaded', loadSearchIndex);