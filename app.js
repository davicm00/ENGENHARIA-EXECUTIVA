/* =====================================================================
   PROVAS LAURA — APP.JS
   Banco de questões, geração da prova, EmailJS e fila de relatórios
===================================================================== */

var EMAILJS_CONFIG = {
  PUBLIC_KEY: 'Rn5XRC_kIDLhy5XtB',
  SERVICE_ID: 'service_hinemhc',
  TEMPLATE_ID: 'template_dvu76xu',
  PARENT_EMAIL: 'davicm00@gmail.com', 'marciellyparreira@gmail.com'
};


/* ===================== ESTADO DO APP ===================== */

var QUESTION_BANK = [];
var DISCURSIVE_BANK = [];

var currentExam = [];
var currentAnswers = [];
var currentIndex = 0;

var studentName = '';

var discursiveQuestion = null;
var discursiveAnswer = '';

var TOTAL_STEPS = 11;
var questionsReady = false;


/* ===================== ARMAZENAMENTO ===================== */

const QUESTIONS_CACHE_KEY = 'prova1ano_questions_cache_v2';
const PENDING_REPORTS_KEY = 'prova1ano_pending_reports_v2';


/* ===================== UTILITÁRIOS ===================== */

function createReportId() {
  return 'report_' +
    Date.now() +
    '_' +
    Math.random().toString(36).substring(2, 10);
}


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


function getErrorMessage(error) {
  if (!error) return 'Erro desconhecido';

  if (typeof error === 'string') {
    return error;
  }

  if (error.text) {
    return error.text;
  }

  if (error.message) {
    return error.message;
  }

  try {
    return JSON.stringify(error);
  } catch (e) {
    return String(error);
  }
}


/* ===================== CARREGAMENTO DAS QUESTÕES ===================== */

async function loadQuestions() {

  const statusEl = document.getElementById('loadStatus');

  if (statusEl) {
    statusEl.textContent = '📚 Carregando banco de questões...';
  }

  try {

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 12000);

    const response = await fetch(
      'questions.json?version=' + Date.now(),
      {
        cache: 'no-store',
        signal: controller.signal
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(
        'Servidor respondeu com erro HTTP ' + response.status
      );
    }

    const data = await response.json();

    if (!data || !Array.isArray(data.bank)) {
      throw new Error(
        'questions.json foi carregado, mas a estrutura do banco é inválida.'
      );
    }

    if (!Array.isArray(data.discursive)) {
      data.discursive = [];
    }

    if (data.bank.length === 0) {
      throw new Error(
        'O banco de questões está vazio.'
      );
    }

    QUESTION_BANK = data.bank;
    DISCURSIVE_BANK = data.discursive;

    try {
      localStorage.setItem(
        QUESTIONS_CACHE_KEY,
        JSON.stringify(data)
      );
    } catch (storageError) {
      console.warn(
        'Não foi possível salvar as questões no armazenamento local:',
        storageError
      );
    }

    questionsReady = true;

    if (statusEl) {
      statusEl.textContent =
        '✅ ' +
        QUESTION_BANK.length +
        ' questões carregadas com sucesso.';
    }

    console.log(
      'Banco de questões carregado:',
      QUESTION_BANK.length,
      'questões objetivas e',
      DISCURSIVE_BANK.length,
      'discursivas.'
    );

  } catch (error) {

    console.error(
      'Falha ao carregar questions.json:',
      error
    );

    try {

      const cached = localStorage.getItem(
        QUESTIONS_CACHE_KEY
      );

      if (!cached) {
        throw new Error(
          'Não existe cópia local das questões.'
        );
      }

      const data = JSON.parse(cached);

      if (
        !data ||
        !Array.isArray(data.bank) ||
        data.bank.length === 0
      ) {
        throw new Error(
          'A cópia local das questões é inválida.'
        );
      }

      QUESTION_BANK = data.bank;
      DISCURSIVE_BANK =
        Array.isArray(data.discursive)
          ? data.discursive
          : [];

      questionsReady = true;

      const errorText = getErrorMessage(error);

      if (statusEl) {

        if (navigator.onLine === false) {

          statusEl.textContent =
            '📶 Sem internet — usando ' +
            QUESTION_BANK.length +
            ' questões salvas neste dispositivo.';

        } else {

          statusEl.textContent =
            '⚠️ Não foi possível atualizar questions.json. ' +
            'Usando a última versão salva. ' +
            'Detalhe: ' +
            errorText;
        }

      }

    } catch (cacheError) {

      console.error(
        'Também falhou ao carregar a cópia local:',
        cacheError
      );

      questionsReady = false;

      if (statusEl) {

        statusEl.textContent =
          '❌ Não foi possível carregar as questões. ' +
          'Verifique a conexão e atualize a página.';

      }

    }

  }

  updateStartButtonState();
}


function updateStartButtonState() {

  const btn = document.getElementById('btnStart');

  if (!btn) return;

  btn.disabled = !questionsReady;

}


/* ===================== SORTEIO ===================== */

function shuffleArray(arr) {

  const array = arr.slice();

  for (
    let i = array.length - 1;
    i > 0;
    i--
  ) {

    const j = Math.floor(
      Math.random() * (i + 1)
    );

    [array[i], array[j]] =
      [array[j], array[i]];

  }

  return array;
}


function generateExam() {

  if (!QUESTION_BANK.length) {
    return [];
  }

  const subjects = shuffleArray(
    [...new Set(
      QUESTION_BANK.map(q => q.subject)
    )]
  );

  const usedIds = new Set();

  let selected = [];


  /* Primeiro tenta escolher
     uma questão de cada matéria */
  subjects.forEach(subject => {

    const subjectQuestions =
      QUESTION_BANK.filter(
        q => q.subject === subject
      );

    if (!subjectQuestions.length) return;

    const question =
      subjectQuestions[
        Math.floor(
          Math.random() *
          subjectQuestions.length
        )
      ];

    if (!usedIds.has(question.id)) {

      selected.push(question);

      usedIds.add(question.id);

    }

  });


  /* Completa até 10 questões */
  const remainingPool = shuffleArray(
    QUESTION_BANK.filter(
      q => !usedIds.has(q.id)
    )
  );

  while (
    selected.length < 10 &&
    remainingPool.length > 0
  ) {

    const question =
      remainingPool.pop();

    selected.push(question);

    usedIds.add(question.id);

  }


  selected =
    shuffleArray(selected)
      .slice(0, 10);


  /* Embaralha as alternativas */
  return selected.map(question => {

    const optionIndices =
      question.options.map(
        (option, index) => ({
          option,
          index
        })
      );

    const shuffled =
      shuffleArray(optionIndices);

    const newOptions =
      shuffled.map(
        item => item.option
      );

    const newCorrect =
      shuffled.findIndex(
        item =>
          item.index ===
          question.correct
      );

    return {

      id: question.id,

      subject:
        question.subject,

      icon:
        question.icon,

      q:
        question.q,

      options:
        newOptions,

      correct:
        newCorrect,

      explain:
        question.explain

    };

  });

}


function pickDiscursiveQuestion() {

  if (!DISCURSIVE_BANK.length) {

    return {
      id: 'fallback_discursive',

      subject: 'Discursiva',

      icon: '✍️',

      prompt:
        'Conte algo interessante que você aprendeu recentemente.',

      guidance:
        'Observe organização das ideias e clareza da resposta.'
    };

  }

  const pool =
    shuffleArray(DISCURSIVE_BANK);

  return pool[0];

}


/* ===================== EMAILJS ===================== */

function isEmailConfigured() {

  return Boolean(

    EMAILJS_CONFIG &&

    typeof EMAILJS_CONFIG.PUBLIC_KEY === 'string' &&
    EMAILJS_CONFIG.PUBLIC_KEY.trim().length > 0 &&

    typeof EMAILJS_CONFIG.SERVICE_ID === 'string' &&
    EMAILJS_CONFIG.SERVICE_ID.trim().length > 0 &&

    typeof EMAILJS_CONFIG.TEMPLATE_ID === 'string' &&
    EMAILJS_CONFIG.TEMPLATE_ID.trim().length > 0 &&

    typeof EMAILJS_CONFIG.PARENT_EMAIL === 'string' &&
    EMAILJS_CONFIG.PARENT_EMAIL.includes('@')

  );

}


/* ===================== FILA DE RELATÓRIOS ===================== */

function getQueuedReports() {

  try {

    const queue =
      JSON.parse(
        localStorage.getItem(
          PENDING_REPORTS_KEY
        ) || '[]'
      );

    return Array.isArray(queue)
      ? queue
      : [];

  } catch (error) {

    console.error(
      'Erro ao ler fila:',
      error
    );

    return [];

  }

}


function saveQueuedReports(queue) {

  try {

    localStorage.setItem(
      PENDING_REPORTS_KEY,
      JSON.stringify(queue)
    );

    return true;

  } catch (error) {

    console.error(
      'Erro ao salvar fila:',
      error
    );

    return false;

  }

}


function queueReport(report) {

  const queue =
    getQueuedReports();

  const exists =
    queue.some(
      item => item.id === report.id
    );

  if (!exists) {

    queue.push(report);

    saveQueuedReports(queue);

  }

}


function removeFromQueue(reportId) {

  const queue =
    getQueuedReports();

  const filtered =
    queue.filter(
      report =>
        report.id !== reportId
    );

  saveQueuedReports(filtered);

}


function buildEmailReportText(report) {

  let text = '';

  text +=
    'RESULTADO DA PROVA\n';

  text +=
    '==============================\n\n';

  text +=
    'Aluna: ' +
    report.name +
    '\n';

  text +=
    'Data: ' +
    report.date +
    '\n';

  text +=
    'Hora: ' +
    report.time +
    '\n\n';

  text +=
    'RESULTADO\n';

  text +=
    'Acertos: ' +
    report.score +
    ' de ' +
    report.total +
    '\n';

  text +=
    'Percentual: ' +
    report.percentage +
    '%\n\n';

  text +=
    'QUESTÕES OBJETIVAS\n';

  text +=
    '==============================\n\n';


  report.questions.forEach(
    (item, index) => {

      text +=
        (index + 1) +
        '. ' +
        item.subject +
        '\n';

      text +=
        item.question +
        '\n\n';

      text +=
        'Resposta da aluna: ' +
        item.userAnswer +
        '\n';

      text +=
        'Resposta correta: ' +
        item.correctAnswer +
        '\n';

      text +=
        'Resultado: ' +
        (
          item.isCorrect
            ? 'ACERTOU'
            : 'ERROU'
        ) +
        '\n';

      if (
        !item.isCorrect &&
        item.explanation
      ) {

        text +=
          'Explicação: ' +
          item.explanation +
          '\n';

      }

      text +=
        '\n------------------------------\n\n';

    }
  );


  text +=
    'QUESTÃO DISCURSIVA\n';

  text +=
    '==============================\n\n';

  text +=
    'Pergunta:\n' +
    report.discursive.question +
    '\n\n';

  text +=
    'Resposta da aluna:\n' +
    report.discursive.answer +
    '\n\n';

  text +=
    'Orientação para correção:\n' +
    report.discursive.guidance +
    '\n';


  return text;

}


/* Espera o SDK do EmailJS ficar disponível, tentando por alguns segundos
   antes de desistir (cobre rede lenta ou a 2ª fonte de CDN carregando
   como reserva, configurada em index.html). */
function waitForEmailJS(timeoutMs, intervalMs) {

  timeoutMs = timeoutMs || 4000;
  intervalMs = intervalMs || 200;

  return new Promise(resolve => {

    const start = Date.now();

    (function check() {

      if (
        typeof emailjs !== 'undefined' &&
        window.EMAILJS_CONFIG_INIT === true
      ) {
        return resolve(true);
      }

      if (Date.now() - start >= timeoutMs) {
        return resolve(false);
      }

      setTimeout(check, intervalMs);

    })();

  });

}


/* ===================== ENVIO ===================== */

async function sendReport(report) {

  if (!report || !report.id) {

    return {
      sent: false,
      reason: 'invalid_report',
      detail:
        'Relatório inválido.'
    };

  }


  if (!isEmailConfigured()) {

    queueReport(report);

    return {
      sent: false,
      reason: 'not_configured'
    };

  }


  if (
    typeof emailjs ===
    'undefined'
  ) {

    const became = await waitForEmailJS();

    if (!became) {

      queueReport(report);

      return {
        sent: false,
        reason: 'sdk_unavailable'
      };

    }

  }


  if (
    typeof navigator !== 'undefined' &&
    navigator.onLine === false
  ) {

    queueReport(report);

    return {
      sent: false,
      reason: 'offline'
    };

  }


  try {

    const reportText =
      buildEmailReportText(report);


    await emailjs.send(

      EMAILJS_CONFIG.SERVICE_ID,

      EMAILJS_CONFIG.TEMPLATE_ID,

      {

        /* Campos simples */
        student_name:
          report.name,

        score:
          report.score,

        total:
          report.total,

        percentage:
          report.percentage + '%',

        date:
          report.date,

        time:
          report.time,

        parent_email:
          EMAILJS_CONFIG.PARENT_EMAIL,

        report_id:
          report.id,


        /* Relatório completo */
        report_text:
          reportText,

        questions_json:
          JSON.stringify(
            report.questions,
            null,
            2
          ),

        discursive_question:
          report.discursive.question,

        discursive_answer:
          report.discursive.answer,

        discursive_guidance:
          report.discursive.guidance

      },

      {

        publicKey:
          EMAILJS_CONFIG.PUBLIC_KEY

      }

    );


    console.log(
      'Relatório enviado com sucesso:',
      report.id
    );


    return {
      sent: true
    };


  } catch (error) {

    const detail =
      getErrorMessage(error);


    console.error(
      'Falha no EmailJS:',
      detail
    );


    queueReport(report);


    const isActuallyOffline =
      typeof navigator !== 'undefined' &&
      navigator.onLine === false;


    return {

      sent: false,

      reason:
        isActuallyOffline
          ? 'offline'
          : 'send_error',

      detail:
        detail

    };

  }

}


/* ===================== REENVIO DA FILA ===================== */

async function flushQueuedReports() {

  const queue =
    getQueuedReports();


  if (!queue.length) {

    return {
      sent: 0,
      pending: 0
    };

  }


  if (!isEmailConfigured()) {

    return {
      sent: 0,
      pending: queue.length,
      reason: 'not_configured'
    };

  }


  if (
    typeof emailjs ===
    'undefined'
  ) {

    const became = await waitForEmailJS();

    if (!became) {
      return {
        sent: 0,
        pending: queue.length,
        reason: 'sdk_unavailable'
      };
    }

  }


  if (
    typeof navigator !== 'undefined' &&
    navigator.onLine === false
  ) {

    return {
      sent: 0,
      pending: queue.length,
      reason: 'offline'
    };

  }


  let sentCount = 0;


  for (
    const report of queue
  ) {

    const result =
      await sendReport(report);


    if (result.sent) {

      removeFromQueue(
        report.id
      );

      sentCount++;

    } else {

      console.warn(
        'Relatório continua pendente:',
        report.id,
        result
      );

      await sleep(500);

    }

  }


  return {

    sent:
      sentCount,

    pending:
      getQueuedReports().length

  };

}


/* ===================== DATA E HORA ===================== */

function formatNowBR() {

  const now =
    new Date();


  return {

    date:
      now.toLocaleDateString(
        'pt-BR'
      ),

    time:
      now.toLocaleTimeString(
        'pt-BR',
        {
          hour:
            '2-digit',

          minute:
            '2-digit'
        }
      )

  };

}


/* ===================== EXPORTAÇÃO PARA TESTES ===================== */

if (
  typeof module !== 'undefined'
) {

  module.exports = {

    shuffleArray,

    generateExam,

    pickDiscursiveQuestion,

    loadQuestions,

    isEmailConfigured,

    queueReport,

    getQueuedReports,

    removeFromQueue,

    sendReport,

    flushQueuedReports,

    formatNowBR,

    createReportId,

    buildEmailReportText,

    waitForEmailJS

  };

}
