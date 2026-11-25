// A small, friendly computer opponent built on chess.js.
//
// Levels:
//   easy   – often plays a random move, otherwise grabs material greedily
//   medium – looks two half-moves ahead, with a little randomness
//   hard   – looks three half-moves ahead
// It is deliberately beatable: it's for a kid learning the game.

const VALUE = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

// Small bonus for pieces nearer the middle of the board.
const CENTER = [0, 1, 2, 3, 3, 2, 1, 0];
const MATE = 100000;

export function evaluate(chess) {
  let score = 0;
  const board = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const sq = board[r][f];
      if (!sq) continue;
      let v = VALUE[sq.type];
      if (sq.type === 'n' || sq.type === 'b') v += (CENTER[r] + CENTER[f]) * 4;
      if (sq.type === 'p') {
        const advance = sq.color === 'w' ? 6 - r : r - 1;
        v += advance * 6 + (CENTER[f] >= 2 ? CENTER[r] * 3 : 0);
      }
      score += sq.color === 'w' ? v : -v;
    }
  }
  return score;
}

function ordered(moves) {
  return moves.sort((a, b) => (b.captured ? VALUE[b.captured] - VALUE[b.piece] / 10 : -1) - (a.captured ? VALUE[a.captured] - VALUE[a.piece] / 10 : -1));
}

function negamax(chess, depth, alpha, beta, ply) {
  if (depth === 0) {
    // Only look for checkmate when in check: generating moves at every leaf is slow.
    if (chess.inCheck() && chess.moves().length === 0) return -MATE + ply;
    const s = evaluate(chess);
    return chess.turn() === 'w' ? s : -s;
  }
  const moves = chess.moves({ verbose: true });
  if (!moves.length) return chess.inCheck() ? -MATE + ply : 0; // checkmate or stalemate
  let best = -Infinity;
  for (const m of ordered(moves)) {
    chess.move(m);
    const score = -negamax(chess, depth - 1, -beta, -alpha, ply + 1);
    chess.undo();
    if (score > best) best = score;
    if (score > alpha) alpha = score;
    if (alpha >= beta) break;
  }
  return best;
}

/** Score every legal move for the side to move (higher is better for them). */
export function scoreMoves(chess, depth) {
  let scored = ordered(chess.moves({ verbose: true })).map((move) => ({ move, score: 0 }));
  // Search shallow first, then deeper with the best moves first, so the
  // alpha-beta cut-offs kick in early and deeper searches stay quick.
  for (let d = 1; d <= depth; d++) {
    let alpha = -Infinity;
    for (const s of scored) {
      chess.move(s.move);
      // On deep searches, moves already known to be worse than the best one are
      // cut short; their score is then only an upper bound. Shallow searches
      // (where the levels add randomness) always get exact scores.
      const narrow = depth >= 3 && d === depth;
      s.score = -negamax(chess, d - 1, -Infinity, narrow ? -alpha + 1 : Infinity, 1);
      chess.undo();
      if (narrow && s.score > alpha) alpha = s.score;
    }
    scored.sort((a, b) => b.score - a.score);
  }
  return scored;
}

export const LEVELS = {
  easy: { depth: 1, randomChance: 0.4, noise: 60 },
  medium: { depth: 2, randomChance: 0.05, noise: 25 },
  hard: { depth: 3, randomChance: 0, noise: 0 },
};

/**
 * Pick a move for the side to move.
 * @param {import('chess.js').Chess} chess
 * @param {'easy'|'medium'|'hard'} level
 * @param {() => number} [random]
 */
export function pickMove(chess, level = 'easy', random = Math.random) {
  const cfg = LEVELS[level] || LEVELS.easy;
  const moves = chess.moves({ verbose: true });
  if (!moves.length) return null;
  if (random() < cfg.randomChance) return moves[Math.floor(random() * moves.length)];
  const scored = scoreMoves(chess, cfg.depth);
  // Never miss a mate in one, whatever the level.
  const mate = scored.find((s) => s.score >= MATE - 10);
  if (mate) return mate.move;
  let best = null;
  for (const s of scored) {
    const noisy = s.score + (random() * 2 - 1) * cfg.noise;
    if (!best || noisy > best.noisy) best = { move: s.move, noisy };
  }
  return best.move;
}

/** A good move for the player, used for hints. */
export function bestMove(chess, depth = 2) {
  const scored = scoreMoves(chess, depth);
  if (!scored.length) return null;
  return scored.reduce((a, b) => (b.score > a.score ? b : a)).move;
}
