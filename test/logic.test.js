import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GROUPS, QUIZ, calcPrice, filterGroups, normalizePhone, scoreQuiz, validateLead } from '../js/logic.js';

const correct = QUIZ.map((q) => q.answer);

test('all correct answers give C1, none give A1', () => {
  assert.equal(scoreQuiz(correct).level, 'C1');
  assert.equal(scoreQuiz(correct).percent, 100);
  assert.equal(scoreQuiz(new Array(QUIZ.length).fill(null)).level, 'A1');
});

test('only the easy questions right means an elementary level', () => {
  const easyOnly = QUIZ.map((q) => (q.weight === 1 ? q.answer : null));
  assert.equal(scoreQuiz(easyOnly).level, 'A1');
  const upToMedium = QUIZ.map((q) => (q.weight <= 2 ? q.answer : null));
  assert.equal(scoreQuiz(upToMedium).level, 'A2'); // 9 из 23 баллов
});

test('every quiz question has a valid answer index', () => {
  for (const q of QUIZ) {
    assert.ok(q.answer >= 0 && q.answer < q.options.length, q.q);
  }
});

test('schedule filters combine', () => {
  assert.equal(filterGroups(GROUPS).length, GROUPS.length);
  const en = filterGroups(GROUPS, { lang: 'en' });
  assert.ok(en.length > 0 && en.every((g) => g.lang === 'en'));
  const free = filterGroups(GROUPS, { onlyFree: true });
  assert.ok(free.every((g) => g.seats > 0));
  assert.deepEqual(filterGroups(GROUPS, { lang: 'zh', level: 'C1' }), []);
  const onlineDe = filterGroups(GROUPS, { lang: 'de', format: 'online' });
  assert.deepEqual(onlineDe.map((g) => g.id), [8]);
});

test('group monthly price: 2 lessons a week, 8 per month', () => {
  const r = calcPrice({ type: 'group', perWeek: 2 });
  assert.deepEqual([r.lessons, r.perLesson, r.monthly, r.saved], [8, 900, 7200, 0]);
});

test('online and long subscriptions are cheaper', () => {
  assert.equal(calcPrice({ type: 'individual', perWeek: 1, online: true }).perLesson, 1980);
  const half = calcPrice({ type: 'group', perWeek: 2, months: 6 });
  assert.equal(half.perLesson, 792);
  assert.equal(half.total, half.monthly * 6);
  assert.ok(half.saved > 0);
  assert.ok(calcPrice({ months: 3 }).monthly < calcPrice({ months: 1 }).monthly);
});

test('lessons per week are clamped and unknown format is rejected', () => {
  assert.equal(calcPrice({ perWeek: 12 }).lessons, 20);
  assert.equal(calcPrice({ perWeek: 0 }).lessons, 4);
  assert.throws(() => calcPrice({ type: 'vip' }), /Неизвестный формат/);
});

test('phone normalisation', () => {
  assert.equal(normalizePhone('8 (916) 123-45-67'), '+79161234567');
  assert.equal(normalizePhone('+7 916 123 45 67'), '+79161234567');
  assert.equal(normalizePhone('9161234567'), '+79161234567');
  assert.equal(normalizePhone('12345'), null);
  assert.equal(normalizePhone(''), null);
});

test('lead validation reports every problem at once', () => {
  assert.deepEqual(Object.keys(validateLead({ name: 'А', phone: '1', lang: 'fr', agree: false })).sort(),
    ['agree', 'lang', 'name', 'phone']);
  assert.deepEqual(validateLead({ name: 'Анна', phone: '89161234567', lang: 'en', agree: true }), {});
});
