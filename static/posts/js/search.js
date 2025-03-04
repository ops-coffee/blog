let searchIndex = [];

// 注入CSS样式
function injectStyles() {
  const styles = `
    .search-container {
      margin: 1.5rem auto;
      padding: 0 1rem;
      width: 100%;
      box-sizing: border-box;
    }
    .search-box {
      display: flex;
      width: 100%;
      margin-bottom: 1.5rem;
    }
    .search-input {
      flex: 1;
      padding: 0.7rem 1rem;
      font-size: 15px;
      border: 2px solid #ddd;
      border-radius: 4px 0 0 4px;
      outline: none;
      transition: border-color .3s;
      margin: 0;
      -webkit-appearance: none;
      width: 100%;
    }
    .search-input:focus {
      border-color: #007bff;
    }
    .search-button {
      padding: .8rem 1.5rem;
      font-size: 16px;
      color: #fff;
      background-color: #007bff;
      border: none;
      border-radius: 0 4px 4px 0;
      cursor: pointer;
      transition: background-color .3s;
      margin: 0;
      -webkit-appearance: none;
    }
    .search-button:hover {
      background-color: #0056b3;
    }
    .search-results {
      margin-top: 2rem;
    }
    .result-item {
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #eee;
    }
    .result-title {
      font-size: 1.25rem;
      margin-bottom: .5rem;
      word-break: break-word;
    }
    .result-title a {
      color: #007bff;
      text-decoration: none;
    }
    .result-title a:hover {
      text-decoration: underline;
    }
    .result-excerpt {
      color: #666;
      margin-bottom: .5rem;
      line-height: 1.6;
      font-size: 0.95rem;
      word-break: break-word;
    }
    .result-meta {
      color: #999;
      font-size: .875rem;
    }
    @media (max-width: 480px) {
      .search-container {
        margin: 1rem auto;
        padding: 0 0.8rem;
      }
      .search-box {
        margin-bottom: 1rem;
      }
      .search-input {
        padding: 0.6rem 0.8rem;
        font-size: 14px;
      }
      .search-button {
        padding: 0.6rem 1rem;
        font-size: 14px;
      }
      .result-title {
        font-size: 1rem;
      }
      .result-excerpt {
        font-size: 0.875rem;
        line-height: 1.5;
      }
      .result-meta {
        font-size: 0.75rem;
      }
    }
  `;
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}

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

  // 显示加载提示
  searchResults.innerHTML = '<p style="text-align: center; color: #666;"><span style="display: inline-block; width: 20px; height: 20px; border: 2px solid #007bff; border-radius: 50%; border-top-color: transparent; animation: spin 1s linear infinite; margin-right: 10px; vertical-align: middle;"></span>正在搜索中...</p><style>@keyframes spin { to { transform: rotate(360deg); } }</style>';

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

// 页面加载时预加载搜索索引并注入样式
document.addEventListener('DOMContentLoaded', () => {
  injectStyles();
  loadSearchIndex();
});