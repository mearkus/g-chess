// Learn to play: a path of short lessons for someone new to chess.
// No DOM in here, so the lessons are easy to test. src/learn.js draws them.
import { Chess } from 'chess.js';

/*
 * The path is made of units, and each unit has a few lessons. Lessons unlock
 * one at a time, in order. Each lesson has a few quick steps, and there are
 * two kinds of step:
 *
 * - 'squares': a piece sits on `from`. Tap the squares it can go to.
 *   `need` is how many to find (leave it out to find them all).
 * - 'move': make a move on the board that does the `goal`:
 *   'check', 'checkmate', 'castle', 'promote', 'capture' or 'any' (any allowed move).
 *   For 'capture', `take` can say which kind of piece has to be captured ('q' for the queen).
 *
 * Positions are written as FEN, a short code for where every piece is.
 * White is always at the bottom and always the one moving.
 */
export const UNITS = [
  {
    id: 'pieces',
    title: 'Meet the pieces',
    lessons: [
      {
        id: 'pawn',
        icon: '♟',
        title: 'The pawn',
        steps: [
          {
            kind: 'squares',
            fen: '8/8/8/8/8/8/4P3/8 w - - 0 1',
            from: 'e2',
            text: "Pawns walk straight forward, one square at a time. On a pawn's very first move it can take two steps! Tap the 2 squares this pawn can go to.",
            win: 'Yes! One step, or two steps on its first move.',
          },
          {
            kind: 'squares',
            fen: '8/8/8/2ppp3/3P4/8/8/8 w - - 0 1',
            from: 'd4',
            text: 'Pawns are sneaky. They capture on a slant: one square forward and to the side. A piece right in front blocks them. Tap the 2 squares this pawn can capture.',
            win: 'Right! Pawns move straight, but they capture on a slant.',
          },
        ],
      },
      {
        id: 'rook',
        icon: '♜',
        title: 'The rook',
        steps: [
          {
            kind: 'squares',
            fen: '8/8/8/8/3R4/8/8/8 w - - 0 1',
            from: 'd4',
            need: 6,
            text: 'The rook moves in straight lines: up, down, left and right, as far as it wants. Tap 6 squares the rook can go to.',
            win: 'Great! The dots show every square the rook can reach.',
          },
          {
            kind: 'squares',
            fen: '8/8/8/8/P7/8/8/R3n3 w - - 0 1',
            from: 'a1',
            text: "The rook can't jump over pieces, but it can capture an enemy by landing on it. Tap every square this rook can go to.",
            win: 'Yes! Your own pawn blocks the way, and the rook can capture the black knight.',
          },
        ],
      },
      {
        id: 'bishop',
        icon: '♝',
        title: 'The bishop',
        steps: [
          {
            kind: 'squares',
            fen: '8/8/8/8/3B4/8/8/8 w - - 0 1',
            from: 'd4',
            need: 5,
            text: 'The bishop moves on slants (they are called diagonals), as far as it wants. Tap 5 squares the bishop can go to.',
            win: 'Nice! A bishop always stays on squares of the same color.',
          },
        ],
      },
      {
        id: 'queen',
        icon: '♛',
        title: 'The queen',
        steps: [
          {
            kind: 'squares',
            fen: '8/8/8/8/3Q4/8/8/8 w - - 0 1',
            from: 'd4',
            need: 8,
            text: 'The queen is the strongest piece! She moves like a rook and a bishop together: straight lines and slants. Tap 8 squares the queen can go to.',
            win: 'Wow, look at all the places she can go!',
          },
        ],
      },
      {
        id: 'knight',
        icon: '♞',
        title: 'The knight',
        steps: [
          {
            kind: 'squares',
            fen: '8/8/8/2PPP3/2PNP3/2PPP3/8/8 w - - 0 1',
            from: 'd4',
            text: "The knight moves in an L: two squares one way, then one square to the side. It's the only piece that can jump over others! Tap all 8 squares this knight can jump to.",
            win: 'Awesome! Knights hop right over other pieces.',
          },
        ],
      },
      {
        id: 'king',
        icon: '♚',
        title: 'The king',
        steps: [
          {
            kind: 'squares',
            fen: '8/8/8/8/3K4/8/8/8 w - - 0 1',
            from: 'd4',
            text: 'The king is the most important piece. He moves just one square in any direction. Tap all 8 squares the king can go to.',
            win: "That's it! Keep your king safe. If he gets trapped, the game is over.",
          },
        ],
      },
    ],
  },
  {
    id: 'capture',
    title: 'Capture!',
    lessons: [
      {
        id: 'take-it',
        icon: '🎯',
        title: 'Take it!',
        steps: [
          {
            kind: 'move',
            fen: 'k7/8/n7/8/8/8/8/R6K w - - 0 1',
            goal: 'capture',
            text: 'Capturing means landing on an enemy piece. It gets taken off the board! Use your rook to capture the black knight.',
            nope: "That didn't capture anything. Land right on the black knight!",
            win: 'Got it! The knight is out of the game.',
          },
          {
            kind: 'move',
            fen: 'k7/8/8/5q2/8/8/8/1B5K w - - 0 1',
            goal: 'capture',
            text: 'Bishops capture on slants. Can you grab the black queen?',
            nope: 'Not that one. Follow the slant from your bishop to the queen!',
            win: 'Wow, you captured the queen!',
          },
          {
            kind: 'move',
            fen: 'k7/8/4r3/8/3N4/8/8/7K w - - 0 1',
            goal: 'capture',
            text: 'Knights capture with their L-jump. Take the black rook!',
            nope: 'Not quite. Make an L from your knight that lands on the rook.',
            win: 'Hop, crunch! The rook is yours.',
          },
        ],
      },
      {
        id: 'best-capture',
        icon: '💎',
        title: 'Take the big one',
        steps: [
          {
            kind: 'move',
            fen: 'k7/8/8/3p4/8/8/7K/q2R4 w - - 0 1',
            goal: 'capture',
            take: 'q',
            text: 'Pieces are worth points: pawn 1, knight 3, bishop 3, rook 5, queen 9. Your rook can capture two things. Take the one worth the most!',
            nope: 'A pawn is only worth 1 point. Look for the queen, she is worth 9!',
            win: 'Yes! The queen is worth 9 points.',
          },
          {
            kind: 'move',
            fen: 'k7/8/3b1r2/8/4N3/8/8/7K w - - 0 1',
            goal: 'capture',
            take: 'r',
            text: 'Your knight can capture a bishop or a rook. Which one is worth more?',
            nope: 'A bishop is worth 3, but a rook is worth 5. Try again!',
            win: 'Smart! A rook is worth 5, a bishop only 3.',
          },
        ],
      },
    ],
  },
  {
    id: 'mate',
    title: 'Check and checkmate',
    lessons: [
      {
        id: 'check',
        icon: '⚠️',
        title: 'Check',
        steps: [
          {
            kind: 'move',
            fen: '4k3/8/8/8/8/8/8/R6K w - - 0 1',
            goal: 'check',
            text: "When a piece attacks the king, that's called check. Move your rook so it attacks the black king!",
            nope: "That move doesn't attack the king. Try again!",
            win: 'Check! The black king is under attack and has to escape.',
          },
          {
            kind: 'move',
            fen: '4r2k/8/8/8/8/8/8/R3K3 w - - 0 1',
            goal: 'any',
            text: 'Uh oh, your king is in check from the black rook! You have to make him safe right away. Tap your king and move him out of danger.',
            win: "Phew, your king is safe! In chess you're never allowed to leave your king in check.",
          },
        ],
      },
      {
        id: 'checkmate',
        icon: '🏁',
        title: 'Checkmate',
        steps: [
          {
            kind: 'move',
            fen: '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1',
            goal: 'checkmate',
            text: "Checkmate is when the king is in check and can't escape. That wins the game! The black king is stuck behind his pawns. Can you find checkmate in one move?",
            nope: 'Close! But the black king is not trapped yet. Look at the top row.',
            win: 'Checkmate! You win! 🎉',
          },
          {
            kind: 'move',
            fen: 'k7/8/1K6/8/8/8/8/7Q w - - 0 1',
            goal: 'checkmate',
            text: 'Your king and queen make a great team. Your king guards the squares next to him. Use the queen to checkmate!',
            nope: 'The black king can still get away. Put your queen on the top row!',
            win: 'Checkmate! The queen and king did it together. 🎉',
          },
          {
            kind: 'move',
            fen: 'k7/7R/8/8/8/8/8/6RK w - - 0 1',
            goal: 'checkmate',
            text: 'Two rooks can trap a king like climbing a ladder. One rook blocks the row below. Move the other rook to checkmate!',
            nope: 'Not trapped yet. One rook guards the second row, so use the other one on the top row.',
            win: 'Checkmate with two rooks! 🎉',
          },
        ],
      },
    ],
  },
  {
    id: 'special',
    title: 'Special moves',
    lessons: [
      {
        id: 'castling',
        icon: '🏰',
        title: 'Castling',
        steps: [
          {
            kind: 'move',
            fen: '4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1',
            goal: 'castle',
            text: 'Castling is a special move that hides your king. The king takes two steps toward a rook, and the rook jumps to the other side of him. Tap the king, then tap a square two steps away.',
            nope: 'That was a normal move. Tap the king and move him two squares toward a rook.',
            win: "You castled! 🏰 You can only do it if the king and that rook haven't moved yet.",
          },
        ],
      },
      {
        id: 'promotion',
        icon: '👑',
        title: 'Promotion',
        steps: [
          {
            kind: 'move',
            fen: '7k/4P3/8/8/8/8/8/K7 w - - 0 1',
            goal: 'promote',
            text: 'When a pawn walks all the way to the other side, it turns into a new piece! Most people pick a queen. Move the pawn to the last row.',
            nope: 'Not that one. Move the pawn to the last row!',
            win: 'Your pawn grew up! 👑 It can turn into a queen, rook, bishop or knight.',
          },
        ],
      },
    ],
  },
];

/** Every lesson in path order. Each one knows which unit it's in. */
export const LESSONS = UNITS.flatMap((unit) => unit.lessons.map((lesson) => Object.assign(lesson, { unit: unit.id })));

export const lessonById = (id) => LESSONS.find((l) => l.id === id) || null;

const GOALS = {
  any: () => true,
  check: (chess) => chess.inCheck(),
  checkmate: (chess) => chess.isCheckmate(),
  castle: (_chess, move) => /[kq]/.test(move.flags),
  promote: (_chess, move) => Boolean(move.promotion),
  capture: (_chess, move, step) => Boolean(move.captured) && (!step.take || move.captured === step.take),
};

/** Playing one lesson, a step at a time. Every tap returns what happened and what to say. */
export class LessonRun {
  constructor(lesson, stepIndex = 0) {
    this.lesson = lesson;
    this.mistakes = 0; // wrong taps in this lesson; fewer mistakes, more stars
    this.start(stepIndex);
  }

  /** Start (or start again) a step. */
  start(stepIndex = this.stepIndex) {
    this.stepIndex = stepIndex;
    // skipValidation lets a lesson board show a piece on its own, without kings.
    this.chess = new Chess(this.step.fen, { skipValidation: true });
    this.found = [];
    this.selected = this.step.kind === 'squares' ? this.step.from : null;
    this.lastMove = null;
    this.done = false;
  }

  get step() { return this.lesson.steps[this.stepIndex]; }
  get stepCount() { return this.lesson.steps.length; }
  get isLastStep() { return this.stepIndex === this.stepCount - 1; }
  /** The whole lesson is finished. */
  get finished() { return this.done && this.isLastStep; }
  /** Stars earned so far, from the mistakes made. */
  get stars() { return starsFor(this.mistakes); }
  /** How far through the lesson, from 0 to 1, for the progress bar. */
  get progress() { return (this.stepIndex + (this.done ? 1 : 0)) / this.stepCount; }

  /** Every square the picked-up piece can go to. */
  get targets() {
    if (!this.selected) return [];
    return this.chess.moves({ square: this.selected, verbose: true }).map((m) => m.to);
  }

  /** How many squares to find in a 'squares' step. */
  get need() {
    const all = this.chess.moves({ square: this.step.from }).length;
    return Math.min(this.step.need || all, all);
  }

  /** Go to the next step. Returns false when there isn't one. */
  next() {
    if (this.isLastStep) return false;
    this.start(this.stepIndex + 1);
    return true;
  }

  tap(square) {
    if (this.done) return { type: 'done' };
    const result = this.step.kind === 'squares' ? this.tapSquare(square) : this.tapMove(square);
    if (result.type === 'miss' || result.type === 'nope') this.mistakes++;
    return result;
  }

  tapSquare(square) {
    const name = pieceName(this.chess.get(this.step.from));
    if (square === this.step.from) {
      return { type: 'self', text: `That's where the ${name} is now. Tap a square it can go to.` };
    }
    if (this.found.includes(square)) return { type: 'again', text: 'You found that one already. Find another!' };
    if (!this.targets.includes(square)) return { type: 'miss', text: `The ${name} can't go there. Try another square!` };

    this.found.push(square);
    const left = this.need - this.found.length;
    if (left > 0) return { type: 'found', text: `Yes! ${left} more to go.` };
    this.done = true;
    return { type: 'complete', text: this.step.win };
  }

  tapMove(square) {
    if (this.selected && this.targets.includes(square)) {
      // The page asks which piece a pawn turns into, then calls move().
      if (this.needsPromotion(this.selected, square)) return { type: 'promote', from: this.selected, to: square };
      return this.makeMove(this.selected, square);
    }
    if (this.selected === square) {
      this.selected = null;
      return { type: 'drop' };
    }
    const piece = this.chess.get(square);
    if (!piece || piece.color !== 'w') {
      this.selected = null;
      return { type: 'miss', text: 'Tap one of your white pieces first.' };
    }
    if (!this.chess.moves({ square }).length) {
      this.selected = null;
      return { type: 'stuck', text: `Your ${pieceName(piece)} can't move right now. Try another piece.` };
    }
    this.selected = square;
    return { type: 'pick', text: 'Now tap a dot to move it there.' };
  }

  needsPromotion(from, to) {
    return this.chess.moves({ square: from, verbose: true }).some((m) => m.to === to && m.promotion);
  }

  /** Try a move (after the promotion question). A wrong move counts as a mistake. */
  move(from, to, promotion = 'q') {
    const result = this.makeMove(from, to, promotion);
    if (result.type === 'nope') this.mistakes++;
    return result;
  }

  /** If a move doesn't do what the step asks, the board goes back so you can try again. */
  makeMove(from, to, promotion = 'q') {
    let move;
    try { move = this.chess.move({ from, to, promotion }); } catch { return { type: 'miss', text: "That move isn't allowed." }; }
    this.selected = null;
    if (GOALS[this.step.goal](this.chess, move, this.step)) {
      this.lastMove = move;
      this.done = true;
      return { type: 'complete', text: this.step.win };
    }
    this.chess.undo();
    return { type: 'nope', text: this.step.nope || 'Not quite. Try again!' };
  }
}

const NAMES = { k: 'king', q: 'queen', r: 'rook', b: 'bishop', n: 'knight', p: 'pawn' };
const pieceName = (piece) => (piece ? NAMES[piece.type] : 'piece');

/** No mistakes: 3 stars. One or two: 2 stars. More: 1 star (you still finished!). */
export function starsFor(mistakes) {
  if (mistakes === 0) return 3;
  if (mistakes <= 2) return 2;
  return 1;
}

/** Today as YYYY-MM-DD on this device's clock, for the streak. */
export function dayKey(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const dayBefore = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d - 1));
};

/**
 * Progress, saved on this device: the best stars for each finished lesson, and the streak
 * (how many days in a row a lesson was finished, and the last day one was).
 */
export function loadProgress(data) {
  const stars = {};
  for (const [id, n] of Object.entries(data?.stars || {})) {
    if (lessonById(id) && Number.isInteger(n) && n >= 1 && n <= 3) stars[id] = n;
  }
  // Lessons finished before stars existed count as 1 star.
  if (Array.isArray(data?.done)) for (const id of data.done) if (lessonById(id) && !stars[id]) stars[id] = 1;
  const s = data?.streak;
  const streak = s && Number.isInteger(s.days) && s.days > 0 && /^\d{4}-\d{2}-\d{2}$/.test(s.last)
    ? { days: s.days, last: s.last }
    : { days: 0, last: null };
  return { stars, streak };
}

export const isDone = (progress, id) => Boolean(progress.stars[id]);

/** The first lesson is always open. Every other one opens once the lesson before it is done. */
export function isUnlocked(progress, id) {
  const i = LESSONS.findIndex((l) => l.id === id);
  return i === 0 || (i > 0 && isDone(progress, LESSONS[i - 1].id));
}

/** Save a finished lesson: keep the best stars, and grow the streak (once a day). */
export function finishLesson(progress, id, stars, today = dayKey()) {
  const best = Math.max(progress.stars[id] || 0, stars);
  const { days, last } = progress.streak;
  let streak;
  if (last === today) streak = { days, last };
  else if (last === dayBefore(today)) streak = { days: days + 1, last: today };
  else streak = { days: 1, last: today };
  return { stars: { ...progress.stars, [id]: best }, streak };
}

/** The streak as it stands today: it's broken if a whole day went by with no lesson. */
export function currentStreak(progress, today = dayKey()) {
  const { days, last } = progress.streak;
  return last === today || last === dayBefore(today) ? days : 0;
}

/** True when a lesson was already finished today, so the streak is safe. */
export const playedToday = (progress, today = dayKey()) => progress.streak.last === today;

export const totalStars = (progress) => Object.values(progress.stars).reduce((a, b) => a + b, 0);

/** The first lesson not finished yet (or the first one, once they're all done). */
export function nextLesson(progress) {
  return LESSONS.find((l) => !isDone(progress, l.id)) || LESSONS[0];
}
