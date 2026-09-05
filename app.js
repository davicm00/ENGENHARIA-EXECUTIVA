/* =====================================================================
   CONFIGURAÇÃO DE E-MAIL (EmailJS) — PREENCHA AQUI
   -----------------------------------------------------------------
   1. Crie uma conta gratuita em https://www.emailjs.com
   2. Conecte seu Gmail (ou outro provedor) em "Email Services"
   3. Crie um template em "Email Templates" com as variáveis:
      {{student_name}}, {{score}}, {{total}}, {{date}}, {{time}}, {{parent_email}}
   4. Copie o Service ID, Template ID e Public Key abaixo.
   Enquanto isso não for preenchido, a prova funciona normalmente,
   mas o e-mail de notificação não será enviado (ficará na fila).
===================================================================== */
var EMAILJS_CONFIG = {
  PUBLIC_KEY: 'COLE_AQUI_SUA_PUBLIC_KEY',
  SERVICE_ID: 'COLE_AQUI_SEU_SERVICE_ID',
  TEMPLATE_ID: 'COLE_AQUI_SEU_TEMPLATE_ID',
  PARENT_EMAIL: 'coloque.o.seu@email.com'
};

// ===================== ESTADO DO APP =====================
var QUESTION_BANK = [];
var DISCURSIVE_BANK = [];
var currentExam = [];
var currentAnswers = [];
var currentIndex = 0;
var studentName = '';
var discursiveQuestion = null;
var discursiveAnswer = '';
var TOTAL_STEPS = 11; // 10 objetivas + 1 discursiva
var questionsReady = false;

const QUESTIONS_CACHE_KEY = 'prova1ano_questions_cache_v1';
const PENDING_REPORTS_KEY = 'prova1ano_pending_reports_v1';

// ===================== CARREGAMENTO DAS QUESTÕES =====================
// Busca o banco de questões em questions.json (repositório separado do app).
// Se estiver offline e não houver rede, usa a última cópia salva localmente.
async function loadQuestions(){
  const statusEl = document.getElementById('loadStatus');
  try {
    const res = await fetch('questions.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Falha ao buscar questions.json: ' + res.status);
    const data = await res.json();
    QUESTION_BANK = data.bank;
    DISCURSIVE_BANK = data.discursive;
    try { localStorage.setItem(QUESTIONS_CACHE_KEY, JSON.stringify(data)); } catch(e) {}
    questionsReady = true;
    if (statusEl) statusEl.textContent = '';
  } catch (err) {
    // Sem internet (ou primeiro acesso sem conexão): tenta usar cópia salva localmente
    try {
      const cached = localStorage.getItem(QUESTIONS_CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        QUESTION_BANK = data.bank;
        DISCURSIVE_BANK = data.discursive;
        questionsReady = true;
        if (statusEl) statusEl.textContent = '📶 Sem internet agora — usando as questões salvas do último acesso.';
      } else {
        questionsReady = false;
        if (statusEl) statusEl.textContent = '⚠️ Sem internet e sem questões salvas. Conecte-se à internet ao menos uma vez para carregar a prova.';
      }
    } catch (e2) {
      questionsReady = false;
      if (statusEl) statusEl.textContent = '⚠️ Não foi possível carregar as questões.';
    }
  }
  updateStartButtonState();
}

function updateStartButtonState(){
  const btn = document.getElementById('btnStart');
  if (!btn) return;
  btn.disabled = !questionsReady;
}

// ===================== FUNÇÕES AUXILIARES DE SORTEIO =====================
function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateExam() {
  const subjects = shuffleArray([...new Set(QUESTION_BANK.map(q => q.subject))]);
  const usedIds = new Set();
  let selected = [];

  subjects.forEach(subject => {
    const opts = QUESTION_BANK.filter(q => q.subject === subject);
    const pick = opts[Math.floor(Math.random() * opts.length)];
    selected.push(pick);
    usedIds.add(pick.id);
  });

  let remainingPool = shuffleArray(QUESTION_BANK.filter(q => !usedIds.has(q.id)));
  while (selected.length < 10 && remainingPool.length > 0) {
    selected.push(remainingPool.pop());
  }

  selected = shuffleArray(selected).slice(0, 10);

  return selected.map(q => {
    const optionIndices = q.options.map((opt, idx) => ({ opt, idx }));
    const shuffled = shuffleArray(optionIndices);
    const newOptions = shuffled.map(o => o.opt);
    const newCorrect = shuffled.findIndex(o => o.idx === q.correct);
    return {
      id: q.id, subject: q.subject, icon: q.icon, q: q.q,
      options: newOptions, correct: newCorrect, explain: q.explain
    };
  });
}

function pickDiscursiveQuestion() {
  const pool = shuffleArray(DISCURSIVE_BANK);
  return pool[0];
}

// ===================== ENVIO DE E-MAIL (com fila offline) =====================
function isEmailConfigured(){
  return EMAILJS_CONFIG.PUBLIC_KEY && !EMAILJS_CONFIG.PUBLIC_KEY.startsWith('COLE_AQUI') &&
         EMAILJS_CONFIG.SERVICE_ID && !EMAILJS_CONFIG.SERVICE_ID.startsWith('COLE_AQUI') &&
         EMAILJS_CONFIG.TEMPLATE_ID && !EMAILJS_CONFIG.TEMPLATE_ID.startsWith('COLE_AQUI');
}

function queueReport(report){
  let queue = [];
  try { queue = JSON.parse(localStorage.getItem(PENDING_REPORTS_KEY) || '[]'); } catch(e) { queue = []; }
  queue.push(report);
  try { localStorage.setItem(PENDING_REPORTS_KEY, JSON.stringify(queue)); } catch(e) {}
}

function getQueuedReports(){
  try { return JSON.parse(localStorage.getItem(PENDING_REPORTS_KEY) || '[]'); } catch(e) { return []; }
}

function removeFromQueue(report){
  const queue = getQueuedReports().filter(r => !(r.name === report.name && r.date === report.date && r.time === report.time));
  try { localStorage.setItem(PENDING_REPORTS_KEY, JSON.stringify(queue)); } catch(e) {}
}

// Espera o SDK do EmailJS ficar disponível, tentando por alguns segundos antes de desistir
// (cobre o caso de uma rede lenta, ou de uma segunda fonte de CDN sendo carregada como reserva).
function waitForEmailJS(timeoutMs, intervalMs){
  timeoutMs = timeoutMs || 4000;
  intervalMs = intervalMs || 200;
  return new Promise((resolve) => {
    const start = Date.now();
    (function check(){
      if (typeof emailjs !== 'undefined' && window.EMAILJS_CONFIG_INIT === true) return resolve(true);
      if (Date.now() - start >= timeoutMs) return resolve(false);
      setTimeout(check, intervalMs);
    })();
  });
}
async function sendReport(report){
  if (!isEmailConfigured()){
    queueReport(report);
    return { sent: false, reason: 'not_configured' };
  }
  if (typeof emailjs === 'undefined'){
    const became = await waitForEmailJS();
    if (!became){
      queueReport(report);
      return { sent: false, reason: 'sdk_unavailable' };
    }
  }
  try {
    await emailjs.send(EMAILJS_CONFIG.SERVICE_ID, EMAILJS_CONFIG.TEMPLATE_ID, {
      student_name: report.name,
      score: report.score,
      total: report.total,
      date: report.date,
      time: report.time,
      parent_email: EMAILJS_CONFIG.PARENT_EMAIL
    }, { publicKey: EMAILJS_CONFIG.PUBLIC_KEY }); // v4 do EmailJS exige um OBJETO aqui, não uma string
    return { sent: true };
  } catch (err) {
    queueReport(report);
    // Importante: nem toda falha de envio é falta de internet! Pode ser IDs errados no
    // EmailJS, template mal configurado, etc. Só chamamos de "offline" quando o navegador
    // realmente reporta estar sem conexão (navigator.onLine === false).
    const isActuallyOffline = (typeof navigator !== 'undefined') && navigator.onLine === false;
    const detail = (err && (err.text || err.message)) ? (err.text || err.message) : JSON.stringify(err);
    console.error('Falha ao enviar e-mail via EmailJS:', detail);
    return {
      sent: false,
      reason: isActuallyOffline ? 'offline' : 'send_error',
      detail: detail
    };
  }
}

// Tenta reenviar relatórios pendentes (chamado ao iniciar o app e quando a conexão volta)
async function flushQueuedReports(){
  if (!isEmailConfigured()) return;
  const queue = getQueuedReports();
  for (const report of queue) {
    const result = await sendReport(report);
    if (result.sent) removeFromQueue(report);
  }
}

function formatNowBR(){
  const now = new Date();
  const date = now.toLocaleDateString('pt-BR');
  const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return { date, time };
}

if (typeof module !== 'undefined') {
  module.exports = {
    shuffleArray, generateExam, pickDiscursiveQuestion, loadQuestions,
    isEmailConfigured, queueReport, getQueuedReports, removeFromQueue,
    sendReport, flushQueuedReports, formatNowBR, waitForEmailJS,
    _setBanks: (bank, disc) => { QUESTION_BANK = bank; DISCURSIVE_BANK = disc; questionsReady = true; }
  };
}
