import { describe, it, expect } from 'vitest';
import { LESSONS, LessonRun, lessonById, loadProgress, markDone, nextLesson } from '../src/lessons.js';

/** Tap every square the piece can reach, in a 'squares' step. */
function findAll(run) {
  for (const sq of [...run.targets]) if (!run.done) run.tap(sq);
}

describe('lessons', () => {
  it('there is a lesson for every piece, then check, checkmate, castling and promotion', () => {
    expect(LESSONS.map((l) => l.id)).toEqual([
      'pawn', 'rook', 'bishop', 'queen', 'knight', 'king', 'check', 'checkmate', 'castling', 'promotion',
    ]);
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
    expect(run.finished).toBe(true);
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

  it('progress remembers finished lessons and suggests the next one', () => {
    let p = loadProgress(null);
    expect(nextLesson(p).id).toBe('pawn');
    p = markDone(markDone(p, 'pawn'), 'pawn');
    expect(p.done).toEqual(['pawn']);
    expect(nextLesson(p).id).toBe('rook');
    expect(loadProgress({ done: ['pawn', 'made-up'] }).done).toEqual(['pawn']);
    expect(loadProgress({ done: 'oops' }).done).toEqual([]);
  });
});
