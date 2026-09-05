const screenStart =
  document.getElementById('screen-start');

const screenQuiz =
  document.getElementById('screen-quiz');

const screenResult =
  document.getElementById('screen-result');

const btnStart =
  document.getElementById('btnStart');

const inputName =
  document.getElementById('studentName');

const quizStudentLabel =
  document.getElementById('quizStudentLabel');

const quizProgressLabel =
  document.getElementById('quizProgressLabel');

const progressFill =
  document.getElementById('progressFill');

const dotsRow =
  document.getElementById('dotsRow');

const questionSubjectTag =
  document.getElementById('questionSubjectTag');

const questionText =
  document.getElementById('questionText');

const optionsList =
  document.getElementById('optionsList');

const btnPrev =
  document.getElementById('btnPrev');

const btnNext =
  document.getElementById('btnNext');

const scoreCircle =
  document.getElementById('scoreCircle');

const scoreNum =
  document.getElementById('scoreNum');

const resultTitle =
  document.getElementById('resultTitle');

const resultSub =
  document.getElementById('resultSub');

const reviewList =
  document.getElementById('reviewList');

const btnRestart =
  document.getElementById('btnRestart');

const emailStatusEl =
  document.getElementById('emailStatus');


let lastGeneratedReport = null;


/* ===================== TROCA DE TELAS ===================== */

function showScreen(name) {

  screenStart.style.display =
    name === 'start'
      ? 'block'
      : 'none';

  screenQuiz.style.display =
    name === 'quiz'
      ? 'block'
      : 'none';

  screenResult.style.display =
    name === 'result'
      ? 'block'
      : 'none';

  try {

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

  } catch (error) {

    window.scrollTo(0, 0);

  }

}


/* ===================== INÍCIO ===================== */

function startExam() {

  if (!questionsReady) {

    alert(
      'As questões ainda não foram carregadas. ' +
      'Verifique a conexão e tente novamente.'
    );

    return;

  }


  studentName =
    (inputName.value || '')
      .trim();


  currentExam =
    generateExam();


  if (
    !currentExam ||
    currentExam.length === 0
  ) {

    alert(
      'Não foi possível gerar a prova. ' +
      'Tente atualizar a página.'
    );

    return;

  }


  currentAnswers =
    new Array(
      currentExam.length
    ).fill(null);


  discursiveQuestion =
    pickDiscursiveQuestion();


  discursiveAnswer = '';

  currentIndex = 0;

  lastGeneratedReport = null;


  quizStudentLabel.textContent =
    studentName
      ? 'Aluna: ' + studentName
      : 'Prova';


  renderDots();

  renderQuestion();

  showScreen('quiz');

}


/* ===================== CONTROLE DE ETAPAS ===================== */

function isDiscursiveStep() {

  return (
    currentIndex ===
    currentExam.length
  );

}


function renderDots() {

  dotsRow.innerHTML = '';


  currentExam.forEach(
    (question, index) => {

      const dot =
        document.createElement('div');


      dot.className =
        'dot' +

        (
          currentAnswers[index] !== null
            ? ' answered'
            : ''
        ) +

        (
          index === currentIndex
            ? ' current'
            : ''
        );


      dotsRow.appendChild(dot);

    }
  );


  const discursiveDot =
    document.createElement('div');


  discursiveDot.className =
    'dot discursive' +

    (
      discursiveAnswer.trim().length > 0
        ? ' answered'
        : ''
    ) +

    (
      isDiscursiveStep()
        ? ' current'
        : ''
    );


  dotsRow.appendChild(
    discursiveDot
  );

}


/* ===================== QUESTÃO ===================== */

function renderQuestion() {

  quizProgressLabel.textContent =
    'Questão ' +
    (currentIndex + 1) +
    ' de ' +
    TOTAL_STEPS;


  progressFill.style.width =
    (
      (
        currentIndex + 1
      ) /
      TOTAL_STEPS
    ) *
    100 +
    '%';


  if (isDiscursiveStep()) {

    renderDiscursiveQuestion();

    return;

  }


  const question =
    currentExam[currentIndex];


  questionSubjectTag.className =
    'subject-tag';


  questionSubjectTag.textContent =
    question.icon +
    ' ' +
    question.subject;


  questionText.textContent =
    question.q;


  optionsList.innerHTML = '';


  const letters =
    ['A', 'B', 'C', 'D'];


  question.options.forEach(
    (option, index) => {

      const button =
        document.createElement('button');


      button.className =
        'option-btn' +

        (
          currentAnswers[currentIndex] === index
            ? ' selected'
            : ''
        );


      const letter =
        document.createElement('span');

      letter.className =
        'letter';

      letter.textContent =
        letters[index];


      const text =
        document.createElement('span');

      text.textContent =
        option;


      button.appendChild(letter);

      button.appendChild(text);


      button.addEventListener(
        'click',
        () =>
          selectAnswer(index)
      );


      optionsList.appendChild(
        button
      );

    }
  );


  btnPrev.disabled =
    currentIndex === 0;


  btnNext.textContent =
    'Próxima ▶';


  renderDots();

}


/* ===================== DISCURSIVA ===================== */

function renderDiscursiveQuestion() {

  questionSubjectTag.className =
    'discursive-badge';


  questionSubjectTag.textContent =
    discursiveQuestion.icon +
    ' Questão Discursiva';


  questionText.textContent =
    discursiveQuestion.prompt;


  optionsList.innerHTML = '';


  const hint =
    document.createElement('div');


  hint.className =
    'discursive-hint';


  hint.textContent =
    '💡 Escreva com suas próprias palavras. ' +
    'Explique bem o que você pensa!';


  optionsList.appendChild(hint);


  const textarea =
    document.createElement('textarea');


  textarea.id =
    'discursiveAnswer';


  textarea.placeholder =
    'Escreva sua resposta aqui...';


  textarea.value =
    discursiveAnswer;


  textarea.addEventListener(
    'input',
    event => {

      discursiveAnswer =
        event.target.value;

      updateWordCounter();

      renderDots();

    }
  );


  optionsList.appendChild(
    textarea
  );


  const counter =
    document.createElement('div');


  counter.className =
    'word-counter';


  counter.id =
    'wordCounter';


  optionsList.appendChild(
    counter
  );


  updateWordCounter();


  btnPrev.disabled = false;


  btnNext.textContent =
    'Finalizar Prova ✅';


  renderDots();

}


function updateWordCounter() {

  const counter =
    document.getElementById(
      'wordCounter'
    );


  if (!counter) return;


  const words =
    discursiveAnswer.trim().length
      ? discursiveAnswer
          .trim()
          .split(/\s+/)
          .length
      : 0;


  counter.textContent =
    words +
    ' palavra(s) escrita(s)';

}


/* ===================== RESPOSTAS ===================== */

function selectAnswer(index) {

  currentAnswers[
    currentIndex
  ] = index;


  renderQuestion();

}


function goPrev() {

  if (currentIndex > 0) {

    currentIndex--;

    renderQuestion();

  }

}


function goNext() {

  if (isDiscursiveStep()) {

    finishExam();

    return;

  }


  if (
    currentAnswers[
      currentIndex
    ] === null
  ) {

    alert(
      'Escolha uma alternativa antes de continuar. 💪'
    );

    return;

  }


  currentIndex++;

  renderQuestion();

}


/* ===================== FINALIZAÇÃO ===================== */

function finishExam() {

  const firstUnanswered =
    currentAnswers.findIndex(
      answer =>
        answer === null
    );


  if (
    firstUnanswered !== -1
  ) {

    currentIndex =
      firstUnanswered;


    renderQuestion();


    alert(
      'Ainda falta responder a questão ' +
      (firstUnanswered + 1) +
      '.'
    );

    return;

  }


  if (
    discursiveAnswer
      .trim()
      .length < 3
  ) {

    alert(
      'Escreva sua resposta na questão discursiva antes de finalizar. ✍️'
    );

    return;

  }


  showResults();

}


/* ===================== SEGURANÇA DE HTML ===================== */

function escapeHtml(value) {

  const div =
    document.createElement('div');


  div.textContent =
    value == null
      ? ''
      : String(value);


  return div.innerHTML;

}


/* ===================== RELATÓRIO ===================== */

function buildCompleteReport(
  correctCount,
  total,
  percentage
) {

  const letters =
    ['A', 'B', 'C', 'D'];


  const questions =
    currentExam.map(
      (question, index) => {

        const userIndex =
          currentAnswers[index];


        return {

          number:
            index + 1,

          subject:
            question.subject,

          icon:
            question.icon,

          question:
            question.q,

          userAnswer:
            letters[userIndex] +
            ') ' +
            question.options[userIndex],

          correctAnswer:
            letters[question.correct] +
            ') ' +
            question.options[
              question.correct
            ],

          isCorrect:
            userIndex ===
            question.correct,

          explanation:
            question.explain ||
            ''

        };

      }
    );


  const now =
    formatNowBR();


  return {

    id:
      createReportId(),

    name:
      studentName ||
      'Aluna',

    score:
      correctCount,

    total:
      total,

    percentage:
      percentage,

    date:
      now.date,

    time:
      now.time,

    questions:
      questions,

    discursive: {

      question:
        discursiveQuestion.prompt,

      answer:
        discursiveAnswer,

      guidance:
        discursiveQuestion.guidance

    }

  };

}


/* ===================== RESULTADO ===================== */

async function showResults() {

  let correctCount = 0;


  const letters =
    ['A', 'B', 'C', 'D'];


  reviewList.innerHTML = '';


  currentExam.forEach(
    (question, index) => {

      const userIndex =
        currentAnswers[index];


      const isCorrect =
        userIndex ===
        question.correct;


      if (isCorrect) {
        correctCount++;
      }


      const item =
        document.createElement('div');


      item.className =
        'review-item ' +
        (
          isCorrect
            ? 'correct'
            : 'wrong'
        );


      const questionDiv =
        document.createElement('div');

      questionDiv.className =
        'review-q';

      questionDiv.textContent =
        question.q;


      const head =
        document.createElement('div');

      head.className =
        'review-head';


      head.innerHTML =
        '<span class="review-num">' +
        escapeHtml(
          question.icon +
          ' ' +
          question.subject +
          ' • Questão ' +
          (index + 1)
        ) +
        '</span>' +

        '<span class="review-badge ' +
        (
          isCorrect
            ? 'correct'
            : 'wrong'
        ) +
        '">' +

        (
          isCorrect
            ? 'ACERTOU ✓'
            : 'ERROU ✗'
        ) +

        '</span>';


      item.appendChild(head);

      item.appendChild(questionDiv);


      const answerLine =
        document.createElement('div');


      answerLine.className =
        'review-answer-line ' +
        (
          isCorrect
            ? 'right'
            : 'your-wrong'
        );


      answerLine.textContent =
        'Sua resposta: ' +
        letters[userIndex] +
        ') ' +
        question.options[userIndex] +
        (
          isCorrect
            ? ' ✓'
            : ' ✗'
        );


      item.appendChild(answerLine);


      if (!isCorrect) {

        const correctLine =
          document.createElement('div');


        correctLine.className =
          'review-answer-line right';


        correctLine.textContent =
          'Resposta certa: ' +
          letters[
            question.correct
          ] +
          ') ' +
          question.options[
            question.correct
          ] +
          ' ✓';


        item.appendChild(
          correctLine
        );


        if (
          question.explain
        ) {

          const explanation =
            document.createElement('div');


          explanation.className =
            'mini-revisao';


          explanation.innerHTML =
            '<b>Mini revisão:</b> ' +
            escapeHtml(
              question.explain
            );


          item.appendChild(
            explanation
          );

        }

      }


      reviewList.appendChild(
        item
      );

    }
  );


  /* Discursiva */

  const discBlock =
    document.createElement('div');


  discBlock.className =
    'discursive-review';


  discBlock.innerHTML =
    '<div class="review-head">' +

    '<span class="review-num">' +

    escapeHtml(
      discursiveQuestion.icon +
      ' Questão Discursiva'
    ) +

    '</span>' +

    '</div>' +

    '<div class="review-q">' +

    escapeHtml(
      discursiveQuestion.prompt
    ) +

    '</div>' +

    '<span class="section-label">' +
    'Resposta da aluna:' +
    '</span>' +

    '<div class="discursive-answer-box">' +

    escapeHtml(
      discursiveAnswer
    ) +

    '</div>' +

    '<div class="discursive-guidance">' +

    '<b>Orientação para correção:</b> ' +

    escapeHtml(
      discursiveQuestion.guidance
    ) +

    '</div>';


  reviewList.appendChild(
    discBlock
  );


  const total =
    currentExam.length;


  const percentage =
    Math.round(
      (
        correctCount /
        total
      ) * 100
    );


  scoreNum.textContent =
    correctCount;


  let color1;
  let color2;
  let title;
  let subtitle;


  if (percentage >= 90) {

    color1 =
      '#6BCB77';

    color2 =
      '#4FAE59';

    title =
      'Excelente, ' +
      (
        studentName ||
        'campeã'
      ) +
      '! 🏆';

    subtitle =
      'Mandou muito bem! Continue assim!';

  }

  else if (percentage >= 70) {

    color1 =
      '#4ECDC4';

    color2 =
      '#38A79F';

    title =
      'Muito bem, ' +
      (
        studentName ||
        'campeã'
      ) +
      '! 🌟';

    subtitle =
      'Você foi muito bem nessa prova!';

  }

  else if (percentage >= 50) {

    color1 =
      '#FFD93D';

    color2 =
      '#F2B705';

    title =
      'Bom trabalho, ' +
      (
        studentName ||
        'campeã'
      ) +
      '! 👏';

    subtitle =
      'Você está no caminho certo.';

  }

  else {

    color1 =
      '#FF6B9D';

    color2 =
      '#E14D80';

    title =
      'Continue praticando! 💪';

    subtitle =
      'Toda campeã aprende praticando.';

  }


  scoreCircle.style.background =
    'linear-gradient(135deg,' +
    color1 +
    ',' +
    color2 +
    ')';


  resultTitle.textContent =
    title;


  resultSub.textContent =
    subtitle +
    ' Você acertou ' +
    correctCount +
    ' de ' +
    total +
    ' questões (' +
    percentage +
    '%).';


  showScreen('result');


  /* =====================
     CRIA RELATÓRIO
  ===================== */

  const report =
    buildCompleteReport(
      correctCount,
      total,
      percentage
    );


  lastGeneratedReport =
    report;


  /* =====================
     ENVIA
  ===================== */

  if (emailStatusEl) {

    emailStatusEl.textContent =
      '📤 Enviando relatório completo...';

  }


  const result =
    await sendReport(report);


  updateEmailStatus(
    result
  );


  updatePendingQueueNotice();

}


/* ===================== STATUS DO EMAIL ===================== */

function updateEmailStatus(result) {

  if (!emailStatusEl) return;


  if (result.sent) {

    emailStatusEl.textContent =
      '✅ Relatório completo enviado por e-mail com sucesso!';

    return;

  }


  if (
    result.reason ===
    'not_configured'
  ) {

    emailStatusEl.textContent =
      '⚠️ O EmailJS não está configurado corretamente.';

    return;

  }


  if (
    result.reason ===
    'sdk_unavailable'
  ) {

    emailStatusEl.innerHTML =
      '⚠️ O serviço EmailJS não foi carregado. ' +
      'O resultado foi salvo e será enviado quando possível. ' +
      createRetryButton();

    attachRetryButton();

    return;

  }


  if (
    result.reason ===
    'offline'
  ) {

    emailStatusEl.innerHTML =
      '📶 Sem internet no momento. ' +
      'O resultado foi salvo e será enviado automaticamente ' +
      'quando a conexão voltar. ' +
      createRetryButton();

    attachRetryButton();

    return;

  }


  emailStatusEl.innerHTML =
    '⚠️ O envio falhou, mas o relatório foi salvo. ' +
    'A aplicação tentará novamente. ' +

    (
      result.detail
        ? '<br><small>Detalhe: ' +
          escapeHtml(
            result.detail
          ) +
          '</small>'
        : ''
    ) +

    createRetryButton();


  attachRetryButton();

}


function createRetryButton() {

  return (
    '<br>' +

    '<button ' +

    'id="btnRetryEmail" ' +

    'class="btn btn-secondary" ' +

    'style="margin-top:10px;padding:10px;font-size:13px;">' +

    'Tentar enviar novamente' +

    '</button>'
  );

}


function attachRetryButton() {

  const button =
    document.getElementById(
      'btnRetryEmail'
    );


  if (!button) return;


  button.addEventListener(
    'click',
    retrySendCurrentReport
  );

}


/* ===================== NOVA TENTATIVA ===================== */

async function retrySendCurrentReport() {

  if (!emailStatusEl) return;


  emailStatusEl.textContent =
    '📤 Tentando enviar os relatórios pendentes...';


  const result =
    await flushQueuedReports();


  updatePendingQueueNotice();


  if (result.pending === 0) {

    emailStatusEl.textContent =
      '✅ Todos os relatórios pendentes foram enviados!';

  } else {

    emailStatusEl.textContent =
      '⚠️ Ainda existem ' +
      result.pending +
      ' relatório(s) aguardando envio.';

  }

}


/* ===================== REINICIAR ===================== */

function restartExam() {

  lastGeneratedReport = null;

  showScreen('start');

}


/* ===================== FILA ===================== */

function updatePendingQueueNotice() {

  const element =
    document.getElementById(
      'pendingQueueNotice'
    );


  if (!element) return;


  const queue =
    getQueuedReports();


  element.textContent =
    queue.length > 0

      ? '⏳ ' +
        queue.length +
        ' resultado(s) aguardando envio por e-mail.'

      : '';

}


/* ===================== EVENTOS ===================== */

btnStart.addEventListener(
  'click',
  startExam
);


btnPrev.addEventListener(
  'click',
  goPrev
);


btnNext.addEventListener(
  'click',
  goNext
);


btnRestart.addEventListener(
  'click',
  restartExam
);


inputName.addEventListener(
  'keydown',
  event => {

    if (
      event.key === 'Enter'
    ) {

      event.preventDefault();

      startExam();

    }

  }
);


/* ===================== INICIALIZAÇÃO ===================== */

showScreen('start');


loadQuestions()
  .then(
    updatePendingQueueNotice
  );


updatePendingQueueNotice();


window.addEventListener(
  'online',
  async () => {

    console.log(
      'Conexão restaurada.'
    );

    await loadQuestions();

    await flushQueuedReports();

    updatePendingQueueNotice();

  }
);


/* =====================
   SERVICE WORKER
===================== */

if (
  'serviceWorker' in navigator
) {

  window.addEventListener(
    'load',
    () => {

      navigator.serviceWorker
        .register(
          'service-worker.js'
        )
        .then(() => {

          console.log(
            'Service Worker registrado.'
          );

        })
        .catch(error => {

          console.warn(
            'Falha ao registrar Service Worker:',
            error
          );

        });

    }
  );

}
