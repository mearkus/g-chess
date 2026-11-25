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
});
