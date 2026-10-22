import { GROUPS, LANGUAGES, QUIZ, calcPrice, filterGroups, normalizePhone, scoreQuiz, validateLead } from './logic.js';

const $ = (sel, root = document) => root.querySelector(sel);
const rub = (n) => `${n.toLocaleString('ru-RU')} ₽`;
const prettyPhone = (p) => p.replace(/^\+7(\d{3})(\d{3})(\d{2})(\d{2})$/, '+7 $1 $2-$3-$4');

// ---------- Меню ----------

const burger = $('#burger');
const menu = $('#menu');
burger.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  burger.setAttribute('aria-expanded', String(open));
});
menu.addEventListener('click', (e) => {
  if (e.target.closest('a')) {
    menu.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  }
});

// ---------- Тест уровня ----------

const LEVEL_TEXT = {
  A1: 'Начальный уровень. Знаете отдельные слова и фразы: в группе A1 за три месяца начнёте уверенно говорить о себе и бытовых вещах.',
  A2: 'Базовый уровень. Справляетесь с простыми ситуациями. В группе A2 разберёте времена и начнёте поддерживать разговор.',
  B1: 'Средний уровень. Можете объясниться почти везде. В группе B1 уберём ошибки и прокачаем беглость речи.',
  B2: 'Выше среднего. Свободно общаетесь на большинство тем. В группе B2 работаем над точностью, идиомами и аргументацией.',
  C1: 'Продвинутый уровень. Отличный результат. Группа C1 для тех, кто готовится к IELTS или работе на английском.',
};

const answers = new Array(QUIZ.length).fill(null);
let current = 0;
let lastLevel = null;

function renderQuestion() {
  const item = QUIZ[current];
  $('#quizBar').style.width = `${(current / QUIZ.length) * 100}%`;
  $('#quizCount').textContent = `Вопрос ${current + 1} из ${QUIZ.length}`;
  $('#quizQ').textContent = item.q;
  $('#quizOptions').replaceChildren(...item.options.map((text, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = text;
    b.classList.toggle('chosen', answers[current] === i);
    b.addEventListener('click', () => answer(i));
    return b;
  }));
  $('#quizBack').disabled = current === 0;
}

function answer(choice) {
  answers[current] = choice;
  if (current < QUIZ.length - 1) {
    current++;
    renderQuestion();
  } else {
    showResult();
  }
}

function showResult() {
  const { level, percent } = scoreQuiz(answers);
  lastLevel = level;
  $('#resLevel').textContent = level;
  $('#resText').textContent = `${LEVEL_TEXT[level]} Правильных ответов с учётом сложности: ${percent}%.`;
  $('#quiz').hidden = true;
  $('#quizResult').hidden = false;
  $('#lead [name="level"]').value = level;
}

$('#quizBack').addEventListener('click', () => {
  if (current > 0) current--;
  renderQuestion();
});
$('#quizSkip').addEventListener('click', () => answer(null));
$('#quizAgain').addEventListener('click', () => {
  answers.fill(null);
  current = 0;
  $('#quizResult').hidden = true;
  $('#quiz').hidden = false;
  renderQuestion();
});
$('#resGroups').addEventListener('click', () => {
  const form = $('#filters');
  form.lang.value = 'en';
  form.level.value = lastLevel;
  renderGroups();
  $('#schedule').scrollIntoView();
});

// ---------- Расписание ----------

function seatsLabel(n) {
  if (n === 0) return { text: 'Мест нет, запишем в лист ожидания', cls: 'none' };
  if (n <= 2) return { text: `Осталось ${n} ${n === 1 ? 'место' : 'места'}`, cls: 'few' };
  return { text: `Свободно мест: ${n}`, cls: '' };
}

function renderGroups() {
  const form = $('#filters');
  const list = filterGroups(GROUPS, {
    lang: form.lang.value,
    level: form.level.value,
    format: form.format.value,
    onlyFree: form.onlyFree.checked,
  });
  const box = $('#groups');
  if (!list.length) {
    box.innerHTML = '<p class="empty">Под такие условия групп пока нет. Оставьте заявку: соберём группу или предложим индивидуальные занятия.</p>';
    return;
  }
  box.replaceChildren(...list.map((g) => {
    const seats = seatsLabel(g.seats);
    const card = document.createElement('article');
    card.className = 'group';
    card.innerHTML = `
      <header><h3>${LANGUAGES[g.lang]} ${g.level}</h3><span class="tag ${g.format}">${g.format === 'online' ? 'Онлайн' : 'В классе'}</span></header>
      <p>${g.days} в ${g.time}</p>
      <p class="muted">${g.teacher}</p>
      <p class="seats ${seats.cls}">${seats.text}</p>
      <button class="btn btn-ghost" type="button">Записаться</button>`;
    card.querySelector('button').addEventListener('click', () => {
      const lead = $('#lead');
      lead.lang.value = g.lang;
      lead.level.value = g.level;
      $('#signup').scrollIntoView();
      lead.name.focus({ preventScroll: true });
    });
    return card;
  }));
}

$('#filters').addEventListener('change', renderGroups);

// ---------- Калькулятор ----------

function renderPrice() {
  const f = $('#calc');
  const res = calcPrice({
    type: f.type.value,
    perWeek: Number(f.perWeek.value),
    online: f.online.checked,
    months: Number(f.months.value),
  });
  $('#perWeekOut').textContent = f.perWeek.value;
  $('#calcDetails').textContent = `${res.lessons} занятий в месяц по ${rub(res.perLesson)}`;
  $('#calcMonthly').textContent = `${rub(res.monthly)} / мес.`;
  $('#calcSaved').textContent = res.saved > 0 ? `За ${f.months.value} мес. ${rub(res.total)}, экономия ${rub(res.saved)}` : '';
}

$('#calc').addEventListener('input', renderPrice);

// ---------- Заявка ----------

const lead = $('#lead');
lead.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = {
    name: lead.name.value,
    phone: lead.phone.value,
    lang: lead.lang.value,
    level: lead.level.value,
    agree: lead.agree.checked,
  };
  const errors = validateLead(data);
  for (const p of lead.querySelectorAll('.err')) {
    const field = p.dataset.for;
    p.textContent = errors[field] ?? '';
    lead[field].setAttribute('aria-invalid', String(Boolean(errors[field])));
  }
  if (Object.keys(errors).length) {
    lead[Object.keys(errors)[0]].focus();
    return;
  }
  // Демо: отправки на сервер нет, заявка сохраняется в браузере.
  const saved = { ...data, phone: normalizePhone(data.phone), at: new Date().toISOString() };
  try {
    const list = JSON.parse(localStorage.getItem('poliglot-leads') ?? '[]');
    list.push(saved);
    localStorage.setItem('poliglot-leads', JSON.stringify(list));
  } catch {
    // приватный режим: просто показываем подтверждение
  }
  const ok = $('#leadOk');
  ok.hidden = false;
  ok.textContent = `Спасибо, ${data.name.trim()}! Перезвоним на ${prettyPhone(saved.phone)} и подберём группу${data.level ? ` уровня ${data.level}` : ''}.`;
  lead.reset();
});

renderQuestion();
renderGroups();
renderPrice();
