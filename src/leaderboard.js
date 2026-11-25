// The leaderboard: who has won the most games on this device.
// No DOM and no internet in here. It's a plain object that main.js saves in
// localStorage, so it never leaves the tablet or computer you play on.

/**
 * The players you can pick. Fun characters instead of typed-in names, so the
 * game never asks for anyone's real name (see "Keep it safe for a kid" in CLAUDE.md).
 */
export const PLAYERS = [
  { id: 'fox', name: 'Fox', icon: '🦊' },
  { id: 'tiger', name: 'Tiger', icon: '🐯' },
  { id: 'dragon', name: 'Dragon', icon: '🐉' },
  { id: 'shark', name: 'Shark', icon: '🦈' },
  { id: 'owl', name: 'Owl', icon: '🦉' },
  { id: 'panda', name: 'Panda', icon: '🐼' },
  { id: 'rocket', name: 'Rocket', icon: '🚀' },
  { id: 'unicorn', name: 'Unicorn', icon: '🦄' },
];

/** Stands in for the computer's side in `players`. It isn't ranked. */
export const COMPUTER = 'computer';
export const LEVELS = ['easy', 'medium', 'hard'];

export function isPlayer(id) {
  return PLAYERS.some((p) => p.id === id);
}

export function playerById(id) {
  return PLAYERS.find((p) => p.id === id) || null;
}

/** The next player in the list after `id`, for when two friends pick the same one. */
export function otherPlayer(id) {
  const i = PLAYERS.findIndex((p) => p.id === id);
  return PLAYERS[(i + 1) % PLAYERS.length].id;
}

export function emptyBoard() {
  return { players: {}, pairs: {} };
}

/** Turn whatever was saved into a board we can trust, or a fresh one. */
export function loadBoard(raw) {
  if (!raw || typeof raw !== 'object' || typeof raw.players !== 'object' || typeof raw.pairs !== 'object') {
    return emptyBoard();
  }
  const board = emptyBoard();
  for (const [id, rec] of Object.entries(raw.players || {})) {
    if (isPlayer(id)) board.players[id] = { ...blankRecord(), ...rec, vsComputer: { ...blankRecord().vsComputer, ...rec?.vsComputer } };
  }
  for (const [key, pair] of Object.entries(raw.pairs || {})) {
    const [a, b] = key.split('|');
    if (isPlayer(a) && isPlayer(b) && a !== b) board.pairs[key] = { [a]: 0, [b]: 0, draws: 0, ...pair };
  }
  return board;
}

function blankRecord() {
  return { wins: 0, losses: 0, draws: 0, vsComputer: { easy: 0, medium: 0, hard: 0 }, vsFriends: 0 };
}

function pairKey(a, b) {
  return [a, b].sort().join('|');
}

/**
 * Add one finished game to the leaderboard. Returns a new board (the old one is untouched).
 * @param {object} board
 * @param {object} game
 * @param {'computer'|'friend'} game.mode
 * @param {'easy'|'medium'|'hard'} [game.level]
 * @param {{w: string, b: string}} game.players player ids, or COMPUTER for the computer's side
 * @param {'w'|'b'|null} game.winner null means a tie
 */
export function recordGame(board, { mode, level = 'easy', players, winner }) {
  const next = structuredClone(board);
  const result = (color) => (winner === null ? 'draw' : winner === color ? 'win' : 'loss');

  for (const color of ['w', 'b']) {
    const id = players[color];
    if (!isPlayer(id)) continue; // the computer, or someone unknown
    const rec = (next.players[id] ||= blankRecord());
    const r = result(color);
    if (r === 'win') {
      rec.wins++;
      if (mode === 'computer') rec.vsComputer[LEVELS.includes(level) ? level : 'easy']++;
      else rec.vsFriends++;
    } else if (r === 'loss') rec.losses++;
    else rec.draws++;
  }

  if (mode === 'friend' && isPlayer(players.w) && isPlayer(players.b) && players.w !== players.b) {
    const key = pairKey(players.w, players.b);
    const pair = (next.pairs[key] ||= { [players.w]: 0, [players.b]: 0, draws: 0 });
    if (winner === null) pair.draws++;
    else pair[players[winner]]++;
  }
  return next;
}

/**
 * Everyone who has finished a game, best first: most wins, then fewest losses.
 * Players with the same wins and losses share a place.
 */
export function rankings(board) {
  const rows = Object.entries(board.players)
    .map(([id, rec]) => ({ ...playerById(id), ...rec }))
    .sort((x, y) => y.wins - x.wins || x.losses - y.losses || x.name.localeCompare(y.name));
  rows.forEach((row, i) => {
    const prev = rows[i - 1];
    row.place = prev && prev.wins === row.wins && prev.losses === row.losses ? prev.place : i + 1;
  });
  return rows;
}

/** Friend-vs-friend scores, most games played first. */
export function headToHead(board) {
  return Object.entries(board.pairs)
    .map(([key, pair]) => {
      const [a, b] = key.split('|');
      return { a: playerById(a), b: playerById(b), aWins: pair[a], bWins: pair[b], draws: pair.draws };
    })
    .sort((x, y) => y.aWins + y.bWins + y.draws - (x.aWins + x.bWins + x.draws));
}
