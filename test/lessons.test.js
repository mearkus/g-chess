import { describe, it, expect } from 'vitest';
import {
  UNITS, LESSONS, LessonRun, lessonById, loadProgress, finishLesson, nextLesson,
  isUnlocked, currentStreak, playedToday, totalStars, starsFor, dayKey,
} from '../src/lessons.js';

/** Tap every square the piece can reach, in a 'squares' step. */
function findAll(run) {
  for (const sq of [...run.targets]) if (!run.done) run.tap(sq);
}

describe('lessons', () => {
  it('the path has four units: pieces, capturing, check and checkmate, special moves', () => {
    expect(UNITS.map((u) => [u.id, u.lessons.map((l) => l.id)])).toEqual([
      ['pieces', ['pawn', 'rook', 'bishop', 'queen', 'knight', 'king']],
      ['capture', ['take-it', 'best-capture']],
      ['mate', ['check', 'checkmate']],
      ['special', ['castling', 'promotion']],
    ]);
    expect(LESSONS).toHaveLength(12);
    expect(lessonById('take-it').unit).toBe('capture');
  });

  it('every step can be finished, and every squares step asks for a number of squares that exists', () => {
    for (const lesson of LESSONS) {
      const run = new LessonRun(lesson);
      for (;;) {
        if (run.step.kind === 'squares') {
          expect(run.need, `${lesson.id} step ${run.stepIndex}`).toBeGreaterThan(0);
          // A number in the words ("Tap the 2 squares") has to match what you need to find.
          const said = run.step.text.match(/Tap (?:the |all )?(\d+)/);
          if (said) expect(Number(said[1]), `${lesson.id} step ${run.stepIndex}`).toBe(run.need);
          findAll(run);
        } else {
          const winning = run.chess.moves({ verbose: true }).find((m) => {
            const r = new LessonRun(lesson, run.stepIndex);
            return r.move(m.from, m.to, m.promotion).type === 'complete';
          });
          expect(winning, `${lesson.id} step ${run.stepIndex} has a move that works`).toBeTruthy();
          run.move(winning.from, winning.to, winning.promotion);
        }
        expect(run.done).toBe(true);
        if (!run.next()) break;
      }
      expect(run.finished).toBe(true);
    }
  });

  it('pawn: two squares on the first move, and found squares count down', () => {
    const run = new LessonRun(lessonById('pawn'));
    expect(run.targets.sort()).toEqual(['e3', 'e4']);
    expect(run.tap('e5').type).toBe('miss');
    expect(run.tap('e2').type).toBe('self');
    expect(run.tap('e3')).toEqual({ type: 'found', text: 'Yes! 1 more to go.' });
    expect(run.tap('e3').type).toBe('again');
    expect(run.tap('e4').type).toBe('complete');
    expect(run.done).toBe(true);
    expect(run.finished).toBe(false);
  });

  it('pawn part 2: it captures on a slant and is blocked straight ahead', () => {
    const run = new LessonRun(lessonById('pawn'), 1);
    expect(run.targets.sort()).toEqual(['c5', 'e5']);
    expect(run.tap('d5').type).toBe('miss');
  });

  it('knight: it jumps over the pawns around it', () => {
    const run = new LessonRun(lessonById('knight'));
    expect(run.targets.sort()).toEqual(['b3', 'b5', 'c2', 'c6', 'e2', 'e6', 'f3', 'f5']);
    expect(run.need).toBe(8);
  });

  it('rook: only 6 squares needed out of 14', () => {
    const run = new LessonRun(lessonById('rook'));
    expect(run.targets).toHaveLength(14);
    for (const sq of ['d5', 'd6', 'd7', 'd8', 'a4']) run.tap(sq);
    expect(run.done).toBe(false);
    expect(run.tap('h4').type).toBe('complete');
  });

  it('check: a move that does not attack the king goes back so you can try again', () => {
    const run = new LessonRun(lessonById('check'));
    expect(run.tap('e8').type).toBe('miss'); // that's Black's king
    expect(run.tap('a1').type).toBe('pick');
    expect(run.tap('b1').type).toBe('nope');
    expect(run.chess.get('a1')).toMatchObject({ type: 'r', color: 'w' });
    expect(run.selected).toBeNull();
    run.tap('a1');
    expect(run.tap('a8').type).toBe('complete');
  });

  it('check part 2: only the king can get out of check', () => {
    const run = new LessonRun(lessonById('check'), 1);
    expect(run.tap('a1').type).toBe('stuck');
    run.tap('e1');
    expect(run.tap('d2').type).toBe('complete');
  });

  it('checkmate: a check the king can escape is not checkmate', () => {
    const run = new LessonRun(lessonById('checkmate'));
    run.tap('a1');
    expect(run.tap('a2').type).toBe('nope');
    run.tap('a1');
    expect(run.tap('a8').type).toBe('complete');
    expect(run.finished).toBe(false); // two more checkmates to go
  });

  it('castling: the king steps two squares and the rook jumps over', () => {
    const run = new LessonRun(lessonById('castling'));
    run.tap('e1');
    expect(run.targets).toEqual(expect.arrayContaining(['g1', 'c1']));
    expect(run.tap('f1').type).toBe('nope');
    run.tap('e1');
    expect(run.tap('g1').type).toBe('complete');
    expect(run.chess.get('f1')).toMatchObject({ type: 'r' });
  });

  it('promotion: asks which piece, then the pawn becomes it', () => {
    const run = new LessonRun(lessonById('promotion'));
    run.tap('e7');
    expect(run.tap('e8')).toEqual({ type: 'promote', from: 'e7', to: 'e8' });
    expect(run.move('e7', 'e8', 'n').type).toBe('complete');
    expect(run.chess.get('e8')).toMatchObject({ type: 'n', color: 'w' });
  });

  it('try again puts the step back to the start', () => {
    const run = new LessonRun(lessonById('king'));
    run.tap('d5');
    run.start();
    expect(run.found).toEqual([]);
    expect(run.done).toBe(false);
  });

  it('capture: only a capture counts, and "take the big one" wants the right piece', () => {
    const run = new LessonRun(lessonById('take-it'));
    run.tap('a1');
    expect(run.tap('a3').type).toBe('nope');
    run.tap('a1');
    expect(run.tap('a6').type).toBe('complete');

    const big = new LessonRun(lessonById('best-capture'));
    big.tap('d1');
    expect(big.tap('d5').type).toBe('nope'); // only a pawn
    big.tap('d1');
    expect(big.tap('a1').type).toBe('complete'); // the queen
    big.next();
    big.tap('e4');
    expect(big.tap('d6').type).toBe('nope'); // bishop, 3 points
    big.tap('e4');
    expect(big.tap('f6').type).toBe('complete'); // rook, 5 points
  });

  it('checkmate: three different checkmates to find', () => {
    const run = new LessonRun(lessonById('checkmate'), 1);
    run.tap('h1');
    expect(run.tap('a1').type).toBe('nope'); // check, but the king slips out to b8
    run.tap('h1');
    expect(run.tap('h8').type).toBe('complete');
    run.next();
    run.tap('h7');
    expect(run.tap('h8').type).toBe('nope'); // check, but now the second row is open
    run.tap('g1');
    expect(run.tap('a1').type).toBe('nope');
    run.tap('g1');
    expect(run.tap('g8').type).toBe('complete');
  });

  it('mistakes cost stars: none is 3, one or two is 2, more is 1', () => {
    expect([0, 1, 2, 3, 9].map(starsFor)).toEqual([3, 2, 2, 1, 1]);
    const run = new LessonRun(lessonById('pawn'));
    run.tap('e2'); // tapping the pawn itself isn't a mistake
    run.tap('e3');
    run.tap('e3'); // nor is tapping a found square again
    expect(run.mistakes).toBe(0);
    run.tap('h8');
    expect(run.mistakes).toBe(1);
    expect(run.stars).toBe(2);
    run.tap('e4');
    expect(run.progress).toBe(0.5);
    run.next();
    expect(run.mistakes).toBe(1); // carries across the parts of a lesson
  });

  it('lessons unlock one at a time, in order', () => {
    let p = loadProgress(null);
    expect(isUnlocked(p, 'pawn')).toBe(true);
    expect(isUnlocked(p, 'rook')).toBe(false);
    expect(isUnlocked(p, 'promotion')).toBe(false);
    expect(nextLesson(p).id).toBe('pawn');
    p = finishLesson(p, 'pawn', 2, '2026-11-26');
    expect(isUnlocked(p, 'rook')).toBe(true);
    expect(isUnlocked(p, 'bishop')).toBe(false);
    expect(nextLesson(p).id).toBe('rook');
  });

  it('keeps your best stars for a lesson', () => {
    let p = finishLesson(loadProgress(null), 'pawn', 2, '2026-11-26');
    p = finishLesson(p, 'pawn', 3, '2026-11-26');
    p = finishLesson(p, 'pawn', 1, '2026-11-26');
    expect(p.stars.pawn).toBe(3);
    p = finishLesson(p, 'rook', 1, '2026-11-26');
    expect(totalStars(p)).toBe(4);
  });

  it('the streak grows once a day and breaks after a missed day', () => {
    let p = loadProgress(null);
    expect(currentStreak(p, '2026-11-26')).toBe(0);
    p = finishLesson(p, 'pawn', 3, '2026-11-26');
    p = finishLesson(p, 'rook', 3, '2026-11-26'); // same day: still 1
    expect(currentStreak(p, '2026-11-26')).toBe(1);
    expect(playedToday(p, '2026-11-26')).toBe(true);
    // Next day, before a lesson: the streak is still alive, but not done for today.
    expect(currentStreak(p, '2026-11-27')).toBe(1);
    expect(playedToday(p, '2026-11-27')).toBe(false);
    p = finishLesson(p, 'bishop', 3, '2026-11-27');
    expect(currentStreak(p, '2026-11-27')).toBe(2);
    // Across the end of a month too.
    p = finishLesson(p, 'queen', 3, '2026-11-28');
    p = finishLesson(p, 'knight', 3, '2026-11-29');
    p = finishLesson(p, 'king', 3, '2026-11-30');
    p = finishLesson(p, 'take-it', 3, '2026-12-01');
    expect(currentStreak(p, '2026-12-01')).toBe(6);
    // Skip a day and it's gone; the next lesson starts it again at 1.
    expect(currentStreak(p, '2026-12-03')).toBe(0);
    p = finishLesson(p, 'best-capture', 3, '2026-12-03');
    expect(currentStreak(p, '2026-12-03')).toBe(1);
  });

  it('dayKey uses the date on this device', () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });

  it('loads saved progress safely, including progress saved before stars existed', () => {
    expect(loadProgress({ done: ['pawn', 'made-up'] }).stars).toEqual({ pawn: 1 });
    expect(loadProgress({ done: 'oops' }).stars).toEqual({});
    const p = loadProgress({ stars: { pawn: 3, rook: 7, nope: 2 }, streak: { days: 4, last: '2026-11-25' } });
    expect(p.stars).toEqual({ pawn: 3 });
    expect(p.streak).toEqual({ days: 4, last: '2026-11-25' });
    expect(loadProgress({ streak: { days: 'lots', last: 'today' } }).streak).toEqual({ days: 0, last: null });
  });
});
