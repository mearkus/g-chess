import { describe, it, expect } from 'vitest';
import { Chess } from 'chess.js';
import { pickMove, bestMove } from '../src/engine.js';

const noRandom = () => 0.5;

describe('engine', () => {
  it('takes a free queen', () => {
    const c = new Chess('4k3/8/8/3q4/4P3/8/8/4K3 w - - 0 1');
    const m = pickMove(c, 'medium', noRandom);
    expect(m.to).toBe('d5');
  });

  it('finds mate in one at every level', () => {
    for (const level of ['easy', 'medium', 'hard']) {
      const c = new Chess('6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1');
      const m = pickMove(c, level, () => 0.9); // 0.9 skips the random-move branch
      expect(m.san).toBe('Ra8#');
    }
  });

  it('hint suggests escaping a hanging queen', () => {
    const c = new Chess('4k3/8/8/3q4/4P3/8/8/4K3 b - - 0 1');
    const m = bestMove(c, 2);
    expect(m.piece).toBe('q');
  });

  it('plays a full game against itself without errors', () => {
    const c = new Chess();
    let plies = 0;
    while (!c.isGameOver() && plies < 60) {
      c.move(pickMove(c, plies % 2 ? 'easy' : 'medium'));
      plies++;
    }
    expect(plies).toBeGreaterThan(0);
  }, 20000);

  it('hard level answers quickly in a normal opening', () => {
    const c = new Chess('r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4');
    const start = Date.now();
    pickMove(c, 'hard');
    expect(Date.now() - start).toBeLessThan(4000);
  }, 10000);
});
