// Логика сайта без DOM: тест уровня, расписание, расчёт стоимости, проверка заявки.
// Подключается и в браузере, и в тестах Node.

export const LANGUAGES = {
  en: 'Английский',
  es: 'Испанский',
  de: 'Немецкий',
  zh: 'Китайский',
};

export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

/** Тест уровня английского: вопросы идут от простого к сложному, у каждого свой вес. */
export const QUIZ = [
  { q: 'She ___ a teacher.', options: ['am', 'is', 'are'], answer: 1, weight: 1 },
  { q: 'I ___ to the cinema yesterday.', options: ['go', 'went', 'have gone'], answer: 1, weight: 1 },
  { q: 'There isn’t ___ milk left.', options: ['some', 'any', 'no'], answer: 1, weight: 1 },
  { q: 'If it rains, we ___ at home.', options: ['stay', 'will stay', 'would stay'], answer: 1, weight: 2 },
  { q: 'I’ve lived here ___ 2019.', options: ['for', 'since', 'from'], answer: 1, weight: 2 },
  { q: 'The report ___ by Friday.', options: ['must finish', 'must be finished', 'must have finish'], answer: 1, weight: 2 },
  { q: 'If I ___ you, I would apologise.', options: ['was', 'am', 'were'], answer: 2, weight: 3 },
  { q: 'She denied ___ the window.', options: ['to break', 'breaking', 'break'], answer: 1, weight: 3 },
  { q: 'Hardly ___ the house when it started to rain.', options: ['I had left', 'had I left', 'I left'], answer: 1, weight: 4 },
  { q: 'He’s used to ___ early.', options: ['get up', 'getting up', 'got up'], answer: 1, weight: 4 },
];

const MAX_SCORE = QUIZ.reduce((s, item) => s + item.weight, 0);

/** answers — массив выбранных индексов (null, если пропущен). Возвращает баллы, процент и уровень. */
export function scoreQuiz(answers) {
  let score = 0;
  QUIZ.forEach((item, i) => {
    if (answers[i] === item.answer) score += item.weight;
  });
  const percent = Math.round((score / MAX_SCORE) * 100);
  const level = percent < 20 ? 'A1' : percent < 40 ? 'A2' : percent < 60 ? 'B1' : percent < 85 ? 'B2' : 'C1';
  return { score, max: MAX_SCORE, percent, level };
}

export const GROUPS = [
  { id: 1, lang: 'en', level: 'A1', format: 'offline', days: 'Пн, Ср', time: '19:00', teacher: 'Мария Орлова', seats: 3 },
  { id: 2, lang: 'en', level: 'A2', format: 'online', days: 'Вт, Чт', time: '08:00', teacher: 'Джеймс Уилсон', seats: 5 },
  { id: 3, lang: 'en', level: 'B1', format: 'offline', days: 'Вт, Чт', time: '19:30', teacher: 'Мария Орлова', seats: 1 },
  { id: 4, lang: 'en', level: 'B2', format: 'online', days: 'Пн, Ср', time: '20:00', teacher: 'Джеймс Уилсон', seats: 4 },
  { id: 5, lang: 'en', level: 'C1', format: 'offline', days: 'Сб', time: '11:00', teacher: 'Анна Ким', seats: 0 },
  { id: 6, lang: 'es', level: 'A1', format: 'offline', days: 'Пн, Чт', time: '18:30', teacher: 'Лусия Мартинес', seats: 6 },
  { id: 7, lang: 'es', level: 'B1', format: 'online', days: 'Ср, Пт', time: '19:00', teacher: 'Лусия Мартинес', seats: 2 },
  { id: 8, lang: 'de', level: 'A1', format: 'online', days: 'Вт, Пт', time: '19:00', teacher: 'Клаус Беккер', seats: 4 },
  { id: 9, lang: 'de', level: 'A2', format: 'offline', days: 'Сб', time: '13:00', teacher: 'Клаус Беккер', seats: 3 },
  { id: 10, lang: 'zh', level: 'A1', format: 'offline', days: 'Вс', time: '12:00', teacher: 'Ли Вэй', seats: 5 },
  { id: 11, lang: 'zh', level: 'A2', format: 'online', days: 'Пн, Ср', time: '19:00', teacher: 'Ли Вэй', seats: 2 },
];

/** Фильтры: значение 'all' или пустое значение не ограничивает. onlyFree — только группы со свободными местами. */
export function filterGroups(groups, { lang = 'all', level = 'all', format = 'all', onlyFree = false } = {}) {
  return groups.filter((g) =>
    (lang === 'all' || g.lang === lang) &&
    (level === 'all' || g.level === level) &&
    (format === 'all' || g.format === format) &&
    (!onlyFree || g.seats > 0));
}

export const PRICES = {
  group: 900, // за занятие 90 минут
  pair: 1400,
  individual: 2200,
};

const ONLINE_DISCOUNT = 0.1;

/**
 * Стоимость месяца: занятий в неделю × 4 недели × цена.
 * Онлайн дешевле на 10%, абонемент на 3 месяца ещё на 7%, на 6 месяцев на 12%.
 */
export function calcPrice({ type = 'group', perWeek = 2, online = false, months = 1 } = {}) {
  const base = PRICES[type];
  if (!base) throw new Error(`Неизвестный формат: ${type}`);
  const lessons = Math.max(1, Math.min(5, Math.round(perWeek))) * 4;
  let perLesson = base * (online ? 1 - ONLINE_DISCOUNT : 1);
  const termDiscount = months >= 6 ? 0.12 : months >= 3 ? 0.07 : 0;
  perLesson *= 1 - termDiscount;
  const monthly = Math.round(lessons * perLesson);
  return {
    lessons,
    perLesson: Math.round(perLesson),
    monthly,
    total: monthly * months,
    saved: Math.round(lessons * base * months - monthly * months),
  };
}

/** Телефон приводится к +7XXXXXXXXXX; принимаются 8, +7, пробелы, скобки и дефисы. */
export function normalizePhone(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '');
  if (digits.length === 11 && (digits[0] === '7' || digits[0] === '8')) return `+7${digits.slice(1)}`;
  if (digits.length === 10 && digits[0] === '9') return `+7${digits}`;
  return null;
}

export function validateLead({ name, phone, lang, agree }) {
  const errors = {};
  if (!name || name.trim().length < 2) errors.name = 'Как к вам обращаться?';
  if (!normalizePhone(phone)) errors.phone = 'Телефон в формате +7 900 000-00-00';
  if (!LANGUAGES[lang]) errors.lang = 'Выберите язык';
  if (!agree) errors.agree = 'Нужно согласие на обработку данных';
  return errors;
}
