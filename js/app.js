// 易象心学测评系统 - 核心逻辑（卡片选择版）

// ========== 全局状态 ==========
const state = {
  // 每个维度的测试状态
  tests: {
    nature: {},      // { '紫薇': { completed: false, qualified: false, answers: [] }, ... }
    personality: {}  // { '君主': { completed: false, qualified: false, answers: [] }, ... }
  },
  // 当前测试的维度
  currentTest: {
    type: null,        // 'nature' | 'personality'
    name: null,        // 具体名称（如'紫薇'）
    questionIndex: 0   // 当前题目索引 (0-8)
  },
  // 结果数据
  results: {
    qualifiedNatures: [],      // 符合的先天人性
    qualifiedPersonalities: [], // 符合的后天人格
    combinations: []            // 组合结果
  },
  currentResultIndex: 0,
  // 保存主页滚动位置
  scrollPosition: 0
};

// ========== 持久化存储键名 ==========
const STORAGE_KEY = 'yixiangTestResults';

// ========== 保存数据到 localStorage ==========
function saveToLocalStorage() {
  try {
    const dataToSave = {
      tests: state.tests,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    console.log('✅ 数据已保存到浏览器本地');
  } catch (error) {
    console.error('❌ 保存数据失败:', error);
  }
}

// ========== 从 localStorage 加载数据 ==========
function loadFromLocalStorage() {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      state.tests = parsed.tests;
      console.log('✅ 已恢复之前的测评数据');
      return true;
    }
    console.log('ℹ️ 没有找到保存的数据');
    return false;
  } catch (error) {
    console.error('❌ 加载数据失败:', error);
    return false;
  }
}

// ========== 初始化 ==========
function init() {
  // 初始化先天人性测试状态
  natureData.forEach(item => {
    state.tests.nature[item.name] = {
      completed: false,
      qualified: false,
      answers: []
    };
  });

  // 初始化后天人格测试状态
  personalityData.forEach(item => {
    state.tests.personality[item.name] = {
      completed: false,
      qualified: false,
      answers: []
    };
  });

  // 尝试从 localStorage 加载数据
  const hasData = loadFromLocalStorage();

  // 渲染卡片
  renderCards();
  updateViewResultsButton();

  // 如果加载了数据，显示提示
  if (hasData) {
    console.log('💾 已恢复上次的测评进度');
  }
}

// ========== 页面切换 ==========
function showPage(pageName) {
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  document.getElementById(pageName + 'Page').classList.add('active');
}

// ========== 渲染卡片 ==========
function renderCards() {
  // 渲染先天人性卡片
  const natureGrid = document.getElementById('natureCardGrid');
  natureGrid.innerHTML = '';
  natureData.forEach(item => {
    const card = createCard('nature', item);
    natureGrid.appendChild(card);
  });

  // 渲染后天人格卡片
  const personalityGrid = document.getElementById('personalityCardGrid');
  personalityGrid.innerHTML = '';
  personalityData.forEach(item => {
    const card = createCard('personality', item);
    personalityGrid.appendChild(card);
  });
}

// ========== 创建卡片元素 ==========
function createCard(type, data) {
  const testState = state.tests[type][data.name];
  const card = document.createElement('div');
  card.className = 'dimension-card';

  // 根据状态添加样式类
  if (testState.qualified) {
    card.classList.add('qualified');
  } else if (testState.completed) {
    card.classList.add('completed');
  }

  // 卡片内容
  card.innerHTML = `
    <div class="card-symbol">${data.symbol}</div>
    <div class="card-name">${data.name}</div>
    <div class="card-desc">${data.description}</div>
    <div class="card-status ${testState.qualified ? 'qualified-mark' : (testState.completed ? 'completed-mark' : '')}">
      ${testState.qualified ? '✓' : (testState.completed ? '已完成' : '')}
    </div>
  `;

  // 点击事件
  card.onclick = () => startDimensionTest(type, data.name);

  return card;
}

// ========== 开始某个维度的测评 ==========
function startDimensionTest(type, name) {
  // 保存当前滚动位置
  state.scrollPosition = window.scrollY || window.pageYOffset;

  state.currentTest.type = type;
  state.currentTest.name = name;
  state.currentTest.questionIndex = 0;

  // 清空或初始化答案数组
  state.tests[type][name].answers = [];

  showPage('test');
  renderQuestion();
  updateProgress();
}

// ========== 渲染题目 ==========
function renderQuestion() {
  const { type, name, questionIndex } = state.currentTest;
  const data = type === 'nature' ? natureData : personalityData;
  const currentGroup = data.find(item => item.name === name);
  const currentQuestion = currentGroup.questions[questionIndex];

  // 更新组信息
  document.getElementById('groupName').textContent = currentGroup.name;
  document.getElementById('groupSymbol').textContent = currentGroup.symbol;
  document.getElementById('groupDescription').textContent = currentGroup.description;

  // 更新题目
  document.getElementById('questionNum').textContent = questionIndex + 1;
  document.getElementById('questionText').textContent = currentQuestion;

  // 更新上一题按钮状态
  const btnPrev = document.getElementById('btnPrev');
  btnPrev.disabled = questionIndex === 0;
}

// ========== 更新进度 ==========
function updateProgress() {
  const { questionIndex } = state.currentTest;
  const progress = ((questionIndex + 1) / 9) * 100;

  document.getElementById('progressText').textContent = `第 ${questionIndex + 1} 题 / 共 9 题`;
  document.getElementById('progressFill').style.width = progress + '%';
}

// ========== 回答问题 ==========
function answerQuestion(answer) {
  const { type, name, questionIndex } = state.currentTest;
  state.tests[type][name].answers[questionIndex] = answer;

  // 自动进入下一题
  nextQuestion();
}

// ========== 下一题 ==========
function nextQuestion() {
  const { type, name, questionIndex } = state.currentTest;

  if (questionIndex < 8) {
    // 同组的下一题
    state.currentTest.questionIndex++;
    renderQuestion();
    updateProgress();
  } else {
    // 当前维度完成
    finishDimensionTest();
  }
}

// ========== 上一题 ==========
function previousQuestion() {
  const { questionIndex } = state.currentTest;

  if (questionIndex > 0) {
    state.currentTest.questionIndex--;
    renderQuestion();
    updateProgress();
  }
}

// ========== 完成当前维度测评 ==========
function finishDimensionTest() {
  const { type, name } = state.currentTest;
  const testState = state.tests[type][name];

  // 标记为已完成
  testState.completed = true;

  // 计算是否符合条件（≥7个"是"）
  const yesCount = testState.answers.filter(answer => answer === true).length;
  testState.qualified = yesCount >= 7;

  // 保存到 localStorage
  saveToLocalStorage();

  // 返回主页
  backToHome();
}

// ========== 返回主页 ==========
function backToHome() {
  // 重置当前测试状态
  state.currentTest = {
    type: null,
    name: null,
    questionIndex: 0
  };

  // 重新渲染卡片以显示更新后的状态
  renderCards();
  updateViewResultsButton();

  // 切换到主页
  showPage('welcome');

  // 恢复滚动位置（使用 requestAnimationFrame 确保页面渲染完成后再滚动）
  requestAnimationFrame(() => {
    window.scrollTo({
      top: state.scrollPosition,
      behavior: 'instant' // 立即跳转，不使用平滑滚动
    });
  });
}

// ========== 从结果页返回主页 ==========
function backToHomeFromResults() {
  // 保留所有测评记录，只切换页面
  renderCards();
  updateViewResultsButton();
  showPage('welcome');

  // 滚动到页面顶端
  requestAnimationFrame(() => {
    window.scrollTo({
      top: 0,
      behavior: 'instant'
    });
  });
}

// ========== 更新"查看结果"按钮状态 ==========
function updateViewResultsButton() {
  const btn = document.getElementById('btnViewResults');

  // 检查是否有符合条件的维度
  const hasQualified =
    Object.values(state.tests.nature).some(test => test.qualified) &&
    Object.values(state.tests.personality).some(test => test.qualified);

  btn.disabled = !hasQualified;
}

// ========== 查看结果 ==========
function viewResults() {
  calculateResults();
  showResults();
}

// ========== 计算结果 ==========
function calculateResults() {
  state.results.qualifiedNatures = [];
  state.results.qualifiedPersonalities = [];
  state.results.combinations = [];

  // 收集符合的先天人性
  Object.entries(state.tests.nature).forEach(([name, testState]) => {
    if (testState.qualified) {
      state.results.qualifiedNatures.push(name);
    }
  });

  // 收集符合的后天人格
  Object.entries(state.tests.personality).forEach(([name, testState]) => {
    if (testState.qualified) {
      state.results.qualifiedPersonalities.push(name);
    }
  });

  // 生成M×N种组合
  state.results.qualifiedNatures.forEach(nature => {
    state.results.qualifiedPersonalities.forEach(personality => {
      const combinationName = getPersonalityFullName(nature, personality);
      const combinationNumber = getPersonalityNumber(nature, personality);
      state.results.combinations.push({
        nature,
        personality,
        fullName: combinationName,
        number: combinationNumber
      });
    });
  });

  // 如果没有符合的,给出默认提示
  if (state.results.qualifiedNatures.length === 0) {
    state.results.qualifiedNatures = ['未达到阈值'];
  }
  if (state.results.qualifiedPersonalities.length === 0) {
    state.results.qualifiedPersonalities = ['未达到阈值'];
  }
  if (state.results.combinations.length === 0) {
    state.results.combinations = [{
      nature: '无',
      personality: '无',
      fullName: '未找到匹配的性格组合',
      number: null
    }];
  }
}

// ========== ���示结果 ==========
function showResults() {
  showPage('result');

  // 显示结果统计
  document.getElementById('resultNatures').textContent =
    state.results.qualifiedNatures.join('、');
  document.getElementById('resultPersonalities').textContent =
    state.results.qualifiedPersonalities.join('、');
  document.getElementById('resultCount').textContent =
    `共 ${state.results.combinations.length} 种`;

  // 渲染索引列表
  renderResultIndex();

  // 显示第一个结果
  state.currentResultIndex = 0;
  renderCurrentResult();

  // 滚动到页面顶部
  window.scrollTo(0, 0);
}

// ========== 渲染结果索引 ==========
function renderResultIndex() {
  const indexList = document.getElementById('resultIndexList');
  indexList.innerHTML = '';

  state.results.combinations.forEach((combo, index) => {
    const item = document.createElement('div');
    item.className = 'index-item' + (index === 0 ? ' active' : '');
    item.textContent = combo.fullName;
    item.onclick = () => jumpToResult(index);
    indexList.appendChild(item);
  });
}

// ========== 渲染当前结果 ==========
function renderCurrentResult() {
  const combo = state.results.combinations[state.currentResultIndex];
  const resultCard = document.getElementById('currentResultCard');

  // 如果有完整数据,则渲染详情;否则显示基本信息
  if (combo.number && resultsData[combo.number]) {
    const data = resultsData[combo.number];
    resultCard.innerHTML = `
      <div class="card-header">
        <div class="card-hexagram">${data.hexagram}</div>
        <h2 class="card-title">${data.title}</h2>
        <p class="card-category">${data.category}</p>
      </div>

      <div class="card-section">
        <h3 class="section-title">1. ${data.sections.intro.title}</h3>
        <div class="section-content">
          <p><strong>卦名与结构:</strong> ${data.sections.intro.guaName}</p>
          <p><strong>核心心理意象:</strong> ${data.sections.intro.core}</p>
        </div>
      </div>

      <div class="card-section">
        <h3 class="section-title">2. ${data.sections.nature.title}</h3>
        <div class="section-content">${data.sections.nature.content}</div>
      </div>

      <div class="card-section">
        <h3 class="section-title">3. ${data.sections.personality.title}</h3>
        <div class="section-content">${data.sections.personality.content}</div>
      </div>

      <div class="card-section">
        <h3 class="section-title">4. ${data.sections.dynamics.title}</h3>
        <div class="section-content">${data.sections.dynamics.content}</div>
      </div>

      <div class="card-section">
        <h3 class="section-title">5. ${data.sections.advantages.title}</h3>
        <div class="section-content">${data.sections.advantages.content}</div>
      </div>

      <div class="card-section">
        <h3 class="section-title">6. ${data.sections.challenges.title}</h3>
        <div class="section-content">${data.sections.challenges.content}</div>
      </div>

      <div class="card-section">
        <h3 class="section-title">7. ${data.sections.meaning.title}</h3>
        <div class="section-highlight">${data.sections.meaning.content}</div>
      </div>

      <div class="card-section">
        <h3 class="section-title">8. ${data.sections.balance.title}</h3>
        <div class="section-content">
          <p><strong>命运趋势:</strong> ${data.sections.balance.trend}</p>
          <div class="section-highlight"><strong>平衡之道:</strong> ${data.sections.balance.path}</div>
        </div>
      </div>
    `;
  } else {
    // 数据暂未补充,显示基本信息
    resultCard.innerHTML = `
      <div class="card-header">
        <h2 class="card-title">${combo.fullName}</h2>
      </div>
      <div class="card-section">
        <p class="section-content">
          <strong>先天人性:</strong> ${combo.nature}<br>
          <strong>后天人格:</strong> ${combo.personality}<br><br>
          <em>详细解析数据正在补充中...</em>
        </p>
      </div>
    `;
  }

  // 更新翻页信息
  document.getElementById('paginationInfo').textContent =
    `${state.currentResultIndex + 1} / ${state.results.combinations.length}`;

  // 更新按钮状态
  document.getElementById('btnPrevResult').disabled = state.currentResultIndex === 0;
  document.getElementById('btnNextResult').disabled =
    state.currentResultIndex === state.results.combinations.length - 1;

  // 更新索引高亮
  document.querySelectorAll('.index-item').forEach((item, index) => {
    item.classList.toggle('active', index === state.currentResultIndex);
  });
}

// ========== 翻页功能 ==========
function previousResult() {
  if (state.currentResultIndex > 0) {
    state.currentResultIndex--;
    renderCurrentResult();
    // 滚动到结果展示区域
    document.querySelector('.result-display').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function nextResult() {
  if (state.currentResultIndex < state.results.combinations.length - 1) {
    state.currentResultIndex++;
    renderCurrentResult();
    // 滚动到结果展示区域
    document.querySelector('.result-display').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function jumpToResult(index) {
  state.currentResultIndex = index;
  renderCurrentResult();
  // 滚动到结果展示区域
  document.querySelector('.result-display').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ========== 重新测评 ==========
function restartTest() {
  // 二次确认
  const confirmed = confirm('确认要重置所有评测数据吗?');

  if (!confirmed) {
    return; // 用户取消
  }

  // 清除 localStorage
  localStorage.removeItem(STORAGE_KEY);

  // 重置所有测试状态
  Object.keys(state.tests.nature).forEach(name => {
    state.tests.nature[name] = {
      completed: false,
      qualified: false,
      answers: []
    };
  });

  Object.keys(state.tests.personality).forEach(name => {
    state.tests.personality[name] = {
      completed: false,
      qualified: false,
      answers: []
    };
  });

  // 重置当前测试状态
  state.currentTest = {
    type: null,
    name: null,
    questionIndex: 0
  };

  // 清空结果
  state.results = {
    qualifiedNatures: [],
    qualifiedPersonalities: [],
    combinations: []
  };
  state.currentResultIndex = 0;

  // 返回主页
  renderCards();
  updateViewResultsButton();
  showPage('welcome');
}

// ========== 清除所有测评数据（主页按钮） ==========
function clearAllTestData() {
  // 二次确认
  const confirmed = confirm('确认要重置所有评测数据吗?');

  if (!confirmed) {
    return; // 用户取消
  }

  // 清除 localStorage
  localStorage.removeItem(STORAGE_KEY);
  console.log('🗑️ 已清除 localStorage 数据');

  // 重置所有测试状态
  Object.keys(state.tests.nature).forEach(name => {
    state.tests.nature[name] = {
      completed: false,
      qualified: false,
      answers: []
    };
  });

  Object.keys(state.tests.personality).forEach(name => {
    state.tests.personality[name] = {
      completed: false,
      qualified: false,
      answers: []
    };
  });

  // 重置当前测试状态
  state.currentTest = {
    type: null,
    name: null,
    questionIndex: 0
  };

  // 清空结果
  state.results = {
    qualifiedNatures: [],
    qualifiedPersonalities: [],
    combinations: []
  };
  state.currentResultIndex = 0;

  // 刷新UI（停留在主页）
  renderCards();
  updateViewResultsButton();

  // 提示用户
  alert('✅ 所有评测数据已清除');
}

// ========== 页面加载完成后初始化 ==========
window.addEventListener('DOMContentLoaded', () => {
  init();
  showPage('welcome');
});
