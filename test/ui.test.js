// @vitest-environment jsdom
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const tap = (square) => document.querySelector(`[data-square="${square}"]`).click();

describe('page', () => {
  beforeAll(async () => {
    const html = readFileSync(resolve(__dirname, '../index.html'), 'utf8');
    document.body.innerHTML = html.slice(html.indexOf('<body>') + 6, html.indexOf('</body>'));
    // jsdom has no modal dialogs.
    HTMLDialogElement.prototype.showModal = function () { this.open = true; };
    vi.useFakeTimers();
    await import('../src/main.js');
  });

  it('draws 64 squares with 32 pieces', () => {
    expect(document.querySelectorAll('.sq')).toHaveLength(64);
    expect(document.querySelectorAll('.piece')).toHaveLength(32);
    expect(document.getElementById('status').textContent).toBe('Your turn!');
  });

  it('tapping a pawn shows where it can go, tapping a dot moves it', () => {
    tap('e2');
    expect(document.querySelector('[data-square="e2"]').classList.contains('selected')).toBe(true);
    expect(document.querySelectorAll('.dot')).toHaveLength(2);
    tap('e4');
    expect(document.querySelector('[data-square="e4"] .piece')).not.toBeNull();
    expect(document.getElementById('status').textContent).toMatch(/thinking/);
  });

  it('the computer replies, then undo puts the board back', () => {
    vi.advanceTimersByTime(1000);
    expect(document.getElementById('status').textContent).toBe('Your turn!');
    document.getElementById('undo-btn').click();
    expect(document.querySelector('[data-square="e2"] .piece')).not.toBeNull();
    expect(document.querySelector('[data-square="e4"] .piece')).toBeNull();
  });

  it('hint highlights a move', () => {
    document.getElementById('hint-btn').click();
    expect(document.querySelectorAll('.sq.hint')).toHaveLength(2);
  });

  it('a finished friend game shows up on the leaderboard once', () => {
    const settings = document.getElementById('settings');
    const form = settings.querySelector('form');
    document.getElementById('new-btn').click();
    form.elements.mode.value = 'friend';
    settings.dispatchEvent(new Event('change'));
    form.elements.white.value = 'dragon';
    form.elements.black.value = 'shark';
    settings.returnValue = 'start';
    settings.dispatchEvent(new Event('close'));

    for (const [f, t] of [['f2', 'f3'], ['e7', 'e5'], ['g2', 'g4'], ['d8', 'h4']]) { tap(f); tap(t); }
    expect(document.getElementById('status').textContent).toMatch(/Black wins/);

    // Undo and win again: still only one game counted.
    document.getElementById('undo-btn').click();
    tap('d8'); tap('h4');

    document.getElementById('leaderboard-btn').click();
    const rows = [...document.querySelectorAll('#lb-list li')];
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toMatch(/🥇.*Shark.*1\s*win/);
    expect(rows[1].textContent).toMatch(/Dragon.*1 loss/);
    expect(document.getElementById('lb-pairs').textContent).toMatch(/Dragon 0 – 1 Shark|Shark 1 – 0 Dragon/);
    expect(document.getElementById('lb-empty').hidden).toBe(true);
  });
  it('learn mode: open a lesson, find the squares, and get a star', () => {
    const learn = document.getElementById('learn');
    const lessonTap = (sq) => learn.querySelector(`[data-square="${sq}"]`).click();
    document.getElementById('learn-btn').click();
    expect(learn.open).toBe(true);
    const picks = learn.querySelectorAll('.lesson-pick');
    expect(picks.length).toBe(10);
    expect(picks[0].classList.contains('suggested')).toBe(true);

    picks[0].click(); // The pawn
    expect(document.getElementById('learn-lesson').hidden).toBe(false);
    expect(document.getElementById('lesson-text').textContent).toMatch(/Pawns walk straight forward/);
    expect(document.getElementById('lesson-next').disabled).toBe(true);

    lessonTap('h8');
    expect(document.getElementById('lesson-feedback').dataset.tone).toBe('bad');
    lessonTap('e3');
    expect(learn.querySelector('[data-square="e3"]').classList.contains('found')).toBe(true);
    lessonTap('e4');
    expect(document.getElementById('lesson-feedback').dataset.tone).toBe('win');
    document.getElementById('lesson-next').click();

    // Part 2: capture on a slant.
    expect(document.getElementById('lesson-step').textContent).toBe('Part 2 of 2');
    lessonTap('c5');
    lessonTap('e5');
    expect(document.getElementById('lesson-next').textContent).toMatch(/Next lesson/);
    expect(JSON.parse(localStorage.getItem('g-chess:learn:v1')).done).toEqual(['pawn']);

    document.getElementById('lesson-back').click();
    const pawn = learn.querySelector('[data-lesson="pawn"]');
    expect(pawn.classList.contains('done')).toBe(true);
    expect(pawn.textContent).toMatch(/⭐/);
    expect(learn.querySelector('[data-lesson="rook"]').classList.contains('suggested')).toBe(true);

    // The game underneath is left alone.
    expect(document.querySelectorAll('#board .sq')).toHaveLength(64);
  });

  it('learn mode: a move lesson moves pieces and goes back on a wrong try', () => {
    const learn = document.getElementById('learn');
    const lessonTap = (sq) => learn.querySelector(`[data-square="${sq}"]`).click();
    learn.querySelector('[data-lesson="checkmate"]').click();
    lessonTap('a1');
    expect(learn.querySelectorAll('.dot').length).toBeGreaterThan(0);
    lessonTap('a2');
    expect(document.getElementById('lesson-feedback').dataset.tone).toBe('bad');
    expect(learn.querySelector('[data-square="a1"] .piece')).not.toBeNull();
    lessonTap('a1');
    lessonTap('a8');
    expect(document.getElementById('lesson-feedback').textContent).toMatch(/Checkmate! You win/);
    expect(learn.querySelector('[data-square="a8"] .piece')).not.toBeNull();
  });

  it('the New game window has a way into learn mode', () => {
    document.getElementById('learn').open = false;
    document.getElementById('new-btn').click();
    HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new Event('close')); };
    document.getElementById('learn-from-settings').click();
    expect(document.getElementById('settings').open).toBe(false);
    expect(document.getElementById('learn').open).toBe(true);
    expect(document.getElementById('learn-menu').hidden).toBe(false);
  });
});
