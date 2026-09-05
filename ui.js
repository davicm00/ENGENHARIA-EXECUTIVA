const screenStart = document.getElementById('screen-start');
const screenQuiz = document.getElementById('screen-quiz');
const screenResult = document.getElementById('screen-result');

const btnStart = document.getElementById('btnStart');
const inputName = document.getElementById('studentName');
const quizStudentLabel = document.getElementById('quizStudentLabel');
const quizProgressLabel = document.getElementById('quizProgressLabel');
const progressFill = document.getElementById('progressFill');
const dotsRow = document.getElementById('dotsRow');
const questionSubjectTag = document.getElementById('questionSubjectTag');
const questionText = document.getElementById('questionText');
const optionsList = document.getElementById('optionsList');
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');

const scoreCircle = document.getElementById('scoreCircle');
const scoreNum = document.getElementById('scoreNum');
const resultTitle = document.getElementById('resultTitle');
const resultSub = document.getElementById('resultSub');
const reviewList = document.getElementById('reviewList');
const btnRestart = document.getElementById('btnRestart');
const emailStatusEl = document.getElementById('emailStatus');

function showScreen(name){
  screenStart.style.display = name === 'start' ? 'block' : 'none';
  screenQuiz.style.display = name === 'quiz' ? 'block' : 'none';
  screenResult.style.display = name === 'result' ? 'block' : 'none';
  try { window.scrollTo(0, 0); } catch(e) {}
}

function startExam(){
  if (!questionsReady){
    alert('As questões ainda não foram carregadas. Verifique sua internet e tente novamente.');
    return;
  }
  studentName = (inputName.value || '').trim();
  currentExam = generateExam();
  currentAnswers = new Array(currentExam.length).fill(null);
  discursiveQuestion = pickDiscursiveQuestion();
  discursiveAnswer = '';
  currentIndex = 0;
  quizStudentLabel.textContent = studentName ? ('Aluna: ' + studentName) : 'Prova';
  renderDots();
  renderQuestion();
  showScreen('quiz');
}

function isDiscursiveStep(){
  return currentIndex === currentExam.length;
}

function renderDots(){
  dotsRow.innerHTML = '';
  currentExam.forEach((q, i) => {
    const d = document.createElement('div');
    d.className = 'dot' + (currentAnswers[i] !== null ? ' answered' : '') + (i === currentIndex ? ' current' : '');
    dotsRow.appendChild(d);
  });
  const dDot = document.createElement('div');
  dDot.className = 'dot discursive' + (discursiveAnswer.trim().length > 0 ? ' answered' : '') + (isDiscursiveStep() ? ' current' : '');
  dotsRow.appendChild(dDot);
}

function renderQuestion(){
  quizProgressLabel.textContent = 'Questão ' + (currentIndex + 1) + ' de ' + TOTAL_STEPS;
  progressFill.style.width = (((currentIndex + 1) / TOTAL_STEPS) * 100) + '%';

  if (isDiscursiveStep()){
    renderDiscursiveQuestion();
    return;
  }

  const q = currentExam[currentIndex];
  questionSubjectTag.className = 'subject-tag';
  questionSubjectTag.textContent = q.icon + ' ' + q.subject;
  questionText.textContent = q.q;

  optionsList.innerHTML = '';
  const letters = ['A', 'B', 'C', 'D'];
  q.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn' + (currentAnswers[currentIndex] === idx ? ' selected' : '');
    btn.innerHTML = '<span class="letter">' + letters[idx] + '</span><span>' + opt + '</span>';
    btn.addEventListener('click', () => selectAnswer(idx));
    optionsList.appendChild(btn);
  });

  btnPrev.disabled = currentIndex === 0;
  btnNext.textContent = 'Próxima ▶';
  renderDots();
}

function renderDiscursiveQuestion(){
  questionSubjectTag.className = 'discursive-badge';
  questionSubjectTag.textContent = discursiveQuestion.icon + ' Questão Discursiva';
  questionText.textContent = discursiveQuestion.prompt;

  optionsList.innerHTML = '';
  const hint = document.createElement('div');
  hint.className = 'discursive-hint';
  hint.textContent = '💡 Escreva com suas próprias palavras. Não existe resposta certa ou errada aqui — capriche e explique bem o que você pensa!';
  optionsList.appendChild(hint);

  const textarea = document.createElement('textarea');
  textarea.id = 'discursiveAnswer';
  textarea.placeholder = 'Escreva sua resposta aqui...';
  textarea.value = discursiveAnswer;
  textarea.addEventListener('input', (e) => {
    discursiveAnswer = e.target.value;
    updateWordCounter();
    renderDots();
  });
  optionsList.appendChild(textarea);

  const counter = document.createElement('div');
  counter.className = 'word-counter';
  counter.id = 'wordCounter';
  optionsList.appendChild(counter);
  updateWordCounter();

  btnPrev.disabled = false;
  btnNext.textContent = 'Finalizar Prova ✅';
  renderDots();
}

function updateWordCounter(){
  const counter = document.getElementById('wordCounter');
  if (!counter) return;
  const words = discursiveAnswer.trim().length ? discursiveAnswer.trim().split(/\s+/).length : 0;
  counter.textContent = words + ' palavra(s) escrita(s)';
}

function selectAnswer(idx){
  currentAnswers[currentIndex] = idx;
  renderQuestion();
}

function goPrev(){
  if (currentIndex > 0){
    currentIndex--;
    renderQuestion();
  }
}

function goNext(){
  if (isDiscursiveStep()){
    finishExam();
    return;
  }
  if (currentAnswers[currentIndex] === null){
    alert('Escolha uma alternativa antes de continuar. Você consegue! 💪');
    return;
  }
  currentIndex++;
  renderQuestion();
}

function finishExam(){
  const firstUnanswered = currentAnswers.findIndex(a => a === null);
  if (firstUnanswered !== -1){
    currentIndex = firstUnanswered;
    renderQuestion();
    alert('Ainda falta responder a questão ' + (firstUnanswered + 1) + '. Vamos terminar juntos!');
    return;
  }
  if (discursiveAnswer.trim().length < 3){
    alert('Escreva sua resposta na questão discursiva antes de finalizar a prova. Capriche! ✍️');
    return;
  }
  showResults();
}

function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function showResults(){
  let correctCount = 0;
  const letters = ['A', 'B', 'C', 'D'];

  reviewList.innerHTML = '';
  currentExam.forEach((q, i) => {
    const userIdx = currentAnswers[i];
    const isCorrect = userIdx === q.correct;
    if (isCorrect) correctCount++;

    const item = document.createElement('div');
    item.className = 'review-item ' + (isCorrect ? 'correct' : 'wrong');
    let html = '';
    html += '<div class="review-head">';
    html += '  <span class="review-num">' + q.icon + ' ' + q.subject + ' • Questão ' + (i + 1) + '</span>';
    html += '  <span class="review-badge ' + (isCorrect ? 'correct' : 'wrong') + '">' + (isCorrect ? 'ACERTOU ✓' : 'ERROU ✗') + '</span>';
    html += '</div>';
    html += '<div class="review-q">' + q.q + '</div>';
    if (isCorrect){
      html += '<div class="review-answer-line right">Sua resposta: ' + letters[userIdx] + ') ' + q.options[userIdx] + ' ✓</div>';
    } else {
      html += '<div class="review-answer-line your-wrong">Sua resposta: ' + letters[userIdx] + ') ' + q.options[userIdx] + ' ✗</div>';
      html += '<div class="review-answer-line right">Resposta certa: ' + letters[q.correct] + ') ' + q.options[q.correct] + ' ✓</div>';
      html += '<div class="mini-revisao"><b>Mini revisão:</b> ' + q.explain + '</div>';
    }
    item.innerHTML = html;
    reviewList.appendChild(item);
  });

  const discBlock = document.createElement('div');
  discBlock.className = 'discursive-review';
  let discHtml = '';
  discHtml += '<div class="review-head"><span class="review-num">' + discursiveQuestion.icon + ' Questão Discursiva</span></div>';
  discHtml += '<div class="review-q">' + discursiveQuestion.prompt + '</div>';
  discHtml += '<span class="section-label">Resposta da aluna:</span>';
  discHtml += '<div class="discursive-answer-box">' + escapeHtml(discursiveAnswer) + '</div>';
  discHtml += '<div class="discursive-guidance"><b>Orientação para correção (uso dos pais/responsáveis):</b> ' + discursiveQuestion.guidance + '</div>';
  discBlock.innerHTML = discHtml;
  reviewList.appendChild(discBlock);

  const total = currentExam.length;
  const pct = Math.round((correctCount / total) * 100);
  scoreNum.textContent = correctCount;

  let color1, color2, title, sub;
  if (pct >= 90){ color1='#6BCB77'; color2='#4FAE59'; title='Excelente, ' + (studentName || 'campeã') + '! 🏆'; sub='Mandou muito bem! Continue assim!'; }
  else if (pct >= 70){ color1='#4ECDC4'; color2='#38A79F'; title='Muito bem, ' + (studentName || 'campeã') + '! 🌟'; sub='Você foi muito bem nessa prova!'; }
  else if (pct >= 50){ color1='#FFD93D'; color2='#F2B705'; title='Bom trabalho, ' + (studentName || 'campeã') + '! 👏'; sub='Você está no caminho certo. Revise as questões abaixo!'; }
  else { color1='#FF6B9D'; color2='#E14D80'; title='Continue praticando! 💪'; sub='Toda campeã treina bastante. Vamos revisar juntas o que errou?'; }

  scoreCircle.style.background = 'linear-gradient(135deg,' + color1 + ',' + color2 + ')';
  resultTitle.textContent = title;
  resultSub.textContent = sub + ' Você acertou ' + correctCount + ' de ' + total + ' questões objetivas (' + pct + '%). A questão discursiva está revisada abaixo.';

  showScreen('result');

  // Envia (ou enfileira) o relatório por e-mail
  const { date, time } = formatNowBR();
  const report = { name: studentName || 'Aluna', score: correctCount, total: total, date: date, time: time };
  if (emailStatusEl) emailStatusEl.textContent = '📤 Enviando resultado por e-mail...';
  const result = await sendReport(report);
  if (emailStatusEl) {
    if (result.sent) {
      emailStatusEl.textContent = '✅ E-mail com o resultado enviado com sucesso!';
    } else if (result.reason === 'not_configured' || result.reason === 'sdk_unavailable') {
      emailStatusEl.textContent = 'ℹ️ Envio de e-mail ainda não configurado (veja o topo de app.js).';
    } else {
      emailStatusEl.textContent = '📶 Sem internet no momento — o e-mail será enviado automaticamente assim que reconectar.';
    }
  }
}

function restartExam(){
  showScreen('start');
}

btnStart.addEventListener('click', startExam);
btnPrev.addEventListener('click', goPrev);
btnNext.addEventListener('click', goNext);
btnRestart.addEventListener('click', restartExam);
inputName.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); startExam(); } });

// Inicialização: carrega as questões e tenta reenviar relatórios pendentes
showScreen('start');
loadQuestions();
window.addEventListener('online', flushQueuedReports);
if (navigator.onLine) flushQueuedReports();

// Registra o Service Worker (permite uso offline após o primeiro carregamento)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {
      // Falha ao registrar (ex.: aberto via file:// direto) — app continua funcionando normalmente online.
    });
  });
}
