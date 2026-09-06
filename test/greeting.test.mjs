import test from 'node:test';
import assert from 'node:assert/strict';
import { greetingFor, millisecondsUntilNextGreeting } from '../src/account/greeting.ts';
import { translate } from '../src/preferences/translations.ts';

test('greetings change at 6 AM, noon, and 6 PM in local time', () => {
  for (const [hour, minute, second, expected] of [
    [0, 0, 0, 'Goodnight'], [5, 59, 59, 'Goodnight'],
    [6, 0, 0, 'Good morning'], [11, 59, 59, 'Good morning'],
    [12, 0, 0, 'Good afternoon'], [17, 59, 59, 'Good afternoon'],
    [18, 0, 0, 'Goodnight'], [23, 59, 59, 'Goodnight'],
  ]) {
    const date = new Date(2026, 8, 6, hour, minute, second);
    assert.equal(translate('en', greetingFor(date), { name: 'Prem' }), `${expected}, Prem.`);
  }
});

test('refresh is scheduled at the next local boundary, including the next day', () => {
  for (const hour of [5, 11, 17]) {
    const date = new Date(2026, 8, 6, hour, 59, 59, 750);
    assert.equal(millisecondsUntilNextGreeting(date), 250);
    assert.notEqual(greetingFor(new Date(date.getTime() + 250)), greetingFor(date));
  }
  assert.equal(millisecondsUntilNextGreeting(new Date(2026, 8, 6, 18)), 12 * 60 * 60 * 1000);
  assert.equal(millisecondsUntilNextGreeting(new Date(2026, 8, 6, 0)), 6 * 60 * 60 * 1000);
});

test('local greetings respect timezone and daylight-saving changes', () => {
  const original = process.env.TZ;
  try {
    process.env.TZ = 'America/New_York';
    assert.equal(greetingFor(new Date('2026-09-06T14:00:00Z')), 'Good morning, {name}.');
    assert.equal(millisecondsUntilNextGreeting(new Date(2026, 2, 7, 18)), 11 * 60 * 60 * 1000);
    assert.equal(millisecondsUntilNextGreeting(new Date(2026, 9, 31, 18)), 13 * 60 * 60 * 1000);
    process.env.TZ = 'Asia/Kathmandu';
    assert.equal(greetingFor(new Date('2026-09-06T14:00:00Z')), 'Goodnight, {name}.');
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
});

test('time-of-day greetings follow the selected interface language', () => {
  for (const [language, expected] of [
    ['en', ['Good morning, Prem.', 'Good afternoon, Prem.', 'Goodnight, Prem.']],
    ['es', ['Buenos días, Prem.', 'Buenas tardes, Prem.', 'Buenas noches, Prem.']],
    ['fr', ['Bonjour, Prem.', 'Bon après-midi, Prem.', 'Bonne nuit, Prem.']],
  ]) {
    [6, 12, 18].forEach((hour, i) => {
      assert.equal(translate(language, greetingFor(new Date(2026, 8, 6, hour)), { name: 'Prem' }), expected[i]);
    });
  }
});
