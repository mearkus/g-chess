import { describe, it, expect } from 'vitest';
import { emptyBoard, loadBoard, recordGame, rankings, headToHead, otherPlayer, COMPUTER } from '../src/leaderboard.js';

const vsComputer = (me, level, outcome) => ({
  mode: 'computer',
  level,
  players: { w: me, b: COMPUTER },
  winner: outcome === 'win' ? 'w' : outcome === 'loss' ? 'b' : null,
});
const friends = (w, b, winner) => ({ mode: 'friend', players: { w, b }, winner });

describe('leaderboard', () => {
  it('counts wins against the computer by level', () => {
    let board = emptyBoard();
    board = recordGame(board, vsComputer('fox', 'easy', 'win'));
    board = recordGame(board, vsComputer('fox', 'hard', 'win'));
    board = recordGame(board, vsComputer('fox', 'medium', 'loss'));
    board = recordGame(board, vsComputer('fox', 'medium', 'draw'));
    const [fox] = rankings(board);
    expect(fox).toMatchObject({ id: 'fox', wins: 2, losses: 1, draws: 1, vsFriends: 0 });
    expect(fox.vsComputer).toEqual({ easy: 1, medium: 0, hard: 1 });
  });

  it('never puts the computer on the board', () => {
    const board = recordGame(emptyBoard(), vsComputer('fox', 'easy', 'loss'));
    expect(rankings(board).map((r) => r.id)).toEqual(['fox']);
  });

  it('counts friend games for both players and head-to-head', () => {
    let board = emptyBoard();
    board = recordGame(board, friends('fox', 'tiger', 'w'));
    board = recordGame(board, friends('tiger', 'fox', 'w'));
    board = recordGame(board, friends('tiger', 'fox', 'w'));
    board = recordGame(board, friends('fox', 'tiger', null));
    const [first, second] = rankings(board);
    expect(first).toMatchObject({ id: 'tiger', wins: 2, losses: 1, draws: 1, vsFriends: 2 });
    expect(second).toMatchObject({ id: 'fox', wins: 1, losses: 2, draws: 1, vsFriends: 1 });
    const [pair] = headToHead(board);
    const score = { [pair.a.id]: pair.aWins, [pair.b.id]: pair.bWins };
    expect(score).toEqual({ fox: 1, tiger: 2 });
    expect(pair.draws).toBe(1);
  });

  it('ranks by wins, then fewer losses, and shares a place on a tie', () => {
    let board = emptyBoard();
    board = recordGame(board, vsComputer('owl', 'easy', 'win'));
    board = recordGame(board, vsComputer('shark', 'easy', 'win'));
    board = recordGame(board, vsComputer('shark', 'easy', 'win'));
    board = recordGame(board, vsComputer('panda', 'easy', 'win'));
    board = recordGame(board, vsComputer('panda', 'easy', 'loss'));
    const rows = rankings(board);
    expect(rows.map((r) => [r.id, r.place])).toEqual([['shark', 1], ['owl', 2], ['panda', 3]]);

    board = recordGame(board, vsComputer('dragon', 'easy', 'win'));
    expect(rankings(board).filter((r) => r.place === 2).map((r) => r.id)).toEqual(['dragon', 'owl']);
  });

  it('does not change the board it was given', () => {
    const board = emptyBoard();
    recordGame(board, vsComputer('fox', 'easy', 'win'));
    expect(board).toEqual(emptyBoard());
  });

  it('survives a broken or strange save', () => {
    expect(loadBoard(null)).toEqual(emptyBoard());
    expect(loadBoard('oops')).toEqual(emptyBoard());
    const board = loadBoard({ players: { fox: { wins: 3 }, someone: { wins: 99 } }, pairs: {} });
    expect(rankings(board)).toHaveLength(1);
    expect(rankings(board)[0]).toMatchObject({ id: 'fox', wins: 3, losses: 0 });
  });

  it('picks a different player when two friends choose the same one', () => {
    expect(otherPlayer('fox')).not.toBe('fox');
  });
});
