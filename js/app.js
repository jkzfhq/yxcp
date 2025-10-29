// 易象心学测评系统 - 核心逻辑

// ========== 全局状态 ==========
const state = {
  currentPhase: 'nature', // 'nature' | 'personality'
  currentGroupIndex: 0,
  currentQuestionIndex: 0,
  answers: {
    nature: [], // 存储8组的答案,每组为一个数组
    personality: []
  },
  results: {
    qualifiedNatures: [], // 符合的先天人性
    qualifiedPersonalities: [], // 符合的后天人格
    combinations: [] // 组合结果
  },
  currentResultIndex: 0
};

// ========== 初始化 ==========
function init() {
  // 初始化answers数组
  for (let i = 0; i < 8; i++) {
    state.answers.nature.push([]);
    state.answers.personality.push([]);
  }
}

// ========== 页面切换 ==========
function showPage(pageName) {
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  document.getElementById(pageName + 'Page').classList.add('active');
}

// ========== 开始测评 ==========
function startTest() {
  state.currentPhase = 'nature';
  state.currentGroupIndex = 0;
  state.currentQuestionIndex = 0;

  showPage('test');
  renderQuestion();
  updateProgress();
}

// ========== 渲染题目 ==========
function renderQuestion() {
  const isNature = state.currentPhase === 'nature';
  const data = isNature ? natureData : personalityData;
  const currentGroup = data[state.currentGroupIndex];
  const currentQuestion = currentGroup.questions[state.currentQuestionIndex];

  // 更新组信息
  document.getElementById('groupName').textContent = currentGroup.name;
  document.getElementById('groupSymbol').textContent = currentGroup.symbol;
  document.getElementById('groupDescription').textContent = currentGroup.description;

  // 更新题目
  document.getElementById('questionNum').textContent = state.currentQuestionIndex + 1;
  document.getElementById('questionText').textContent = currentQuestion;

  // 更新上一题按钮状态
  const btnPrev = document.getElementById('btnPrev');
  const isFirstQuestion = state.currentGroupIndex === 0 && state.currentQuestionIndex === 0;
  btnPrev.disabled = isFirstQuestion;
}

// ========== 更新进度 ==========
function updateProgress() {
  const totalGroups = 16;
  const currentGroup = state.currentGroupIndex + (state.currentPhase === 'personality' ? 8 : 0) + 1;
  const progress = (currentGroup / totalGroups) * 100;

  document.getElementById('progressText').textContent = `第${currentGroup}组 / 共16组`;
  document.getElementById('phaseText').textContent =
    state.currentPhase === 'nature' ? '第一阶段:先天人性测试' : '第二阶段:后天人格测试';
  document.getElementById('progressFill').style.width = progress + '%';
}

// ========== 回答问题 ==========
function answerQuestion(answer) {
  const phaseAnswers = state.answers[state.currentPhase];
  phaseAnswers[state.currentGroupIndex][state.currentQuestionIndex] = answer;

  // 自动进入下一题
  nextQuestion();
}

// ========== 下一题 ==========
function nextQuestion() {
  const isNature = state.currentPhase === 'nature';
  const data = isNature ? natureData : personalityData;
  const currentGroup = data[state.currentGroupIndex];

  // 检查是否还有题目
  if (state.currentQuestionIndex < currentGroup.questions.length - 1) {
    // 同一组的下一题
    state.currentQuestionIndex++;
    renderQuestion();
  } else {
    // 当前组完成,进入下一组或下一阶段
    if (state.currentGroupIndex < data.length - 1) {
      // 同一阶段的下一组
      state.currentGroupIndex++;
      state.currentQuestionIndex = 0;
      renderQuestion();
      updateProgress();
    } else {
      // 当前阶段完成
      if (state.currentPhase === 'nature') {
        // 进入第二阶段
        state.currentPhase = 'personality';
        state.currentGroupIndex = 0;
        state.currentQuestionIndex = 0;
        renderQuestion();
        updateProgress();
      } else {
        // 全部完成,计算结果
        calculateResults();
        showResults();
      }
    }
  }
}

// ========== 上一题 ==========
function previousQuestion() {
  if (state.currentQuestionIndex > 0) {
    // 同一组的上一题
    state.currentQuestionIndex--;
    renderQuestion();
  } else if (state.currentGroupIndex > 0) {
    // 上一组的最后一题
    state.currentGroupIndex--;
    const isNature = state.currentPhase === 'nature';
    const data = isNature ? natureData : personalityData;
    const prevGroup = data[state.currentGroupIndex];
    state.currentQuestionIndex = prevGroup.questions.length - 1;
    renderQuestion();
    updateProgress();
  } else if (state.currentPhase === 'personality') {
    // 回到第一阶段的最后一组最后一题
    state.currentPhase = 'nature';
    state.currentGroupIndex = natureData.length - 1;
    state.currentQuestionIndex = natureData[state.currentGroupIndex].questions.length - 1;
    renderQuestion();
    updateProgress();
  }
}

// ========== 计算结果 ==========
function calculateResults() {
  state.results.qualifiedNatures = [];
  state.results.qualifiedPersonalities = [];
  state.results.combinations = [];

  // 计算符合的先天人性(≥7个"是")
  state.answers.nature.forEach((groupAnswers, index) => {
    const yesCount = groupAnswers.filter(answer => answer === true).length;
    if (yesCount >= 7) {
      state.results.qualifiedNatures.push(natureData[index].name);
    }
  });

  // 计算符合的后天人格(≥7个"是")
  state.answers.personality.forEach((groupAnswers, index) => {
    const yesCount = groupAnswers.filter(answer => answer === true).length;
    if (yesCount >= 7) {
      state.results.qualifiedPersonalities.push(personalityData[index].name);
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

// ========== 展示结果 ==========
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
    // 数据暂未补��,显示基本信息
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
  }
}

function nextResult() {
  if (state.currentResultIndex < state.results.combinations.length - 1) {
    state.currentResultIndex++;
    renderCurrentResult();
  }
}

function jumpToResult(index) {
  state.currentResultIndex = index;
  renderCurrentResult();
}

// ========== 重新测评 ==========
function restartTest() {
  // 重置状态
  state.currentPhase = 'nature';
  state.currentGroupIndex = 0;
  state.currentQuestionIndex = 0;
  state.currentResultIndex = 0;

  // 清空答案
  state.answers.nature = [];
  state.answers.personality = [];
  for (let i = 0; i < 8; i++) {
    state.answers.nature.push([]);
    state.answers.personality.push([]);
  }

  // 清空结果
  state.results = {
    qualifiedNatures: [],
    qualifiedPersonalities: [],
    combinations: []
  };

  // 返回欢迎页
  showPage('welcome');
}

// ========== 页面加载完成后初始化 ==========
window.addEventListener('DOMContentLoaded', () => {
  init();
  showPage('welcome');
});
