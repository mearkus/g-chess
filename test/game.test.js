import { describe, it, expect } from 'vitest';
import { Game } from '../src/game.js';

describe('Game', () => {
  it('lets the player move and then the computer replies', () => {
    const g = new Game({ mode: 'computer', level: 'easy' });
    expect(g.status().text).toBe('Your turn!');
    expect(g.move('e2', 'e4')).toBeTruthy();
    expect(g.computerToMove).toBe(true);
    expect(g.status().tone).toBe('wait');
    expect(g.computerMove(() => 0.5)).toBeTruthy();
    expect(g.computerToMove).toBe(false);
  });

  it('refuses illegal moves and moves on the computer turn', () => {
    const g = new Game();
    expect(g.move('e2', 'e5')).toBeNull();
    g.move('e2', 'e4');
    expect(g.move('d2', 'd4')).toBeNull();
  });

  it('undo takes back both the computer reply and the player move', () => {
    const g = new Game();
    g.move('e2', 'e4');
    g.computerMove(() => 0.5);
    expect(g.history).toHaveLength(2);
    g.undo();
    expect(g.history).toHaveLength(0);
    expect(g.turn).toBe('w');
  });

  it('undo with a friend takes back one move', () => {
    const g = new Game({ mode: 'friend' });
    g.move('e2', 'e4');
    g.move('e7', 'e5');
    g.undo();
    expect(g.history).toHaveLength(1);
    expect(g.status().text).toBe("Black's turn");
  });

  it('the computer moves first when the player is black', () => {
    const g = new Game({ playerColor: 'b' });
    expect(g.computerToMove).toBe(true);
    g.computerMove(() => 0.5);
    expect(g.status().text).toBe('Your turn!');
  });

  it('announces a win by checkmate', () => {
    const g = new Game({ mode: 'friend' });
    for (const [f, t] of [['f2', 'f3'], ['e7', 'e5'], ['g2', 'g4'], ['d8', 'h4']]) g.move(f, t);
    expect(g.over).toBe(true);
    expect(g.status().text).toMatch(/Black wins/);
  });

  it('knows when a pawn needs promoting', () => {
    const g = new Game({ mode: 'friend', pgn: '' });
    g.chess.load('8/P7/8/8/8/8/8/k6K w - - 0 1');
    expect(g.needsPromotion('a7', 'a8')).toBe(true);
    expect(g.move('a7', 'a8', 'n').promotion).toBe('n');
  });

  it('keeps a game through save and load', () => {
    const g = new Game({ mode: 'friend' });
    g.move('e2', 'e4');
    const copy = new Game(g.save());
    expect(copy.history).toHaveLength(1);
    expect(copy.mode).toBe('friend');
  });

  it('counts captured pieces', () => {
    const g = new Game({ mode: 'friend' });
    for (const [f, t] of [['e2', 'e4'], ['d7', 'd5'], ['e4', 'd5']]) g.move(f, t);
    expect(g.captured().w).toEqual(['p']);
  });

  it('knows who won, or that it was a tie', () => {
    const g = new Game({ mode: 'friend' });
    expect(g.result()).toBeNull();
    for (const [f, t] of [['f2', 'f3'], ['e7', 'e5'], ['g2', 'g4'], ['d8', 'h4']]) g.move(f, t);
    expect(g.result()).toEqual({ winner: 'b' });
    const tie = new Game({ mode: 'friend' });
    tie.chess.load('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1'); // stalemate
    expect(tie.result()).toEqual({ winner: null });
  });

  it('remembers who is playing through save and load', () => {
    const g = new Game({ mode: 'friend', players: { w: 'dragon', b: 'owl' } });
    const copy = new Game(g.save());
    expect(copy.players).toEqual({ w: 'dragon', b: 'owl' });
    expect(new Game({ playerColor: 'b' }).players).toEqual({ w: 'computer', b: 'fox' });
  });
});
