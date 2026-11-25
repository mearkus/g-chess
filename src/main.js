// Wires the game to the page: draws the board, handles taps, runs the computer.
import { Game } from './game.js';
import { PLAYERS, COMPUTER, isPlayer, otherPlayer, loadBoard, recordGame, rankings, headToHead } from './leaderboard.js';

const GLYPH = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
const TEXT = '︎'; // ask for the plain symbol, not an emoji
const FILES = 'abcdefgh';
const SAVE_KEY = 'g-chess:v1';
const LEADERBOARD_KEY = 'g-chess:leaderboard:v1';
const COMPUTER_DELAY_MS = 550;

const $ = (id) => document.getElementById(id);
const boardEl = $('board');
const statusEl = $('status');

const makeStore = (key) => ({
  load() { try { return JSON.parse(localStorage.getItem(key)) || null; } catch { return null; } },
  save(data) { try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* private mode */ } },
});
const store = makeStore(SAVE_KEY);
const leaderboardStore = makeStore(LEADERBOARD_KEY);
let leaderboard = loadBoard(leaderboardStore.load());

const saved = store.load();
let game = new Game(saved || {});
let showLabels = saved?.showLabels ?? true;
let selected = null; // square the player has picked up
let hintMove = null;
let computerTimer = null;

// It's a game, not a document: no long-press menus or stray text selection.
for (const ev of ['contextmenu', 'selectstart']) {
  document.addEventListener(ev, (e) => { if (!e.target.closest('input, textarea')) e.preventDefault(); });
}

function glyph(piece) {
  return `<span class="piece ${piece.color}">${GLYPH[piece.type]}${TEXT}</span>`;
}

/** The player's colour goes at the bottom. With a friend, White is at the bottom. */
function bottomColor() {
  return game.mode === 'computer' ? game.playerColor : 'w';
}

function squaresInDrawOrder() {
  const out = [];
  const whiteBottom = bottomColor() === 'w';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const rank = whiteBottom ? 8 - row : row + 1;
      const file = whiteBottom ? FILES[col] : FILES[7 - col];
      out.push({ square: file + rank, row, col, light: (FILES.indexOf(file) + rank) % 2 === 1 });
    }
  }
  return out;
}

function render() {
  const last = game.lastMove;
  const targets = selected ? game.targets(selected) : [];
  const chess = game.chess;
  const kingInCheck = chess.inCheck()
    ? squaresInDrawOrder().find(({ square }) => {
        const p = game.pieceAt(square);
        return p && p.type === 'k' && p.color === game.turn;
      })?.square
    : null;

  boardEl.classList.toggle('hide-labels', !showLabels);
  boardEl.innerHTML = '';
  for (const { square, row, col, light } of squaresInDrawOrder()) {
    const btn = document.createElement('button');
    btn.className = `sq ${light ? 'light' : 'dark'}`;
    btn.dataset.square = square;
    btn.setAttribute('aria-label', square);
    if (last && (last.from === square || last.to === square)) btn.classList.add('last');
    if (selected === square) btn.classList.add('selected');
    if (hintMove && (hintMove.from === square || hintMove.to === square)) btn.classList.add('hint');
    if (kingInCheck === square) btn.classList.add('in-check');

    const piece = game.pieceAt(square);
    if (piece) btn.insertAdjacentHTML('beforeend', glyph(piece));

    const target = targets.find((m) => m.to === square);
    if (target) btn.insertAdjacentHTML('beforeend', target.captured ? '<span class="ring"></span>' : '<span class="dot"></span>');

    if (row === 7) btn.insertAdjacentHTML('beforeend', `<span class="coord file">${square[0]}</span>`);
    if (col === 0) btn.insertAdjacentHTML('beforeend', `<span class="coord rank">${square[1]}</span>`);
    boardEl.appendChild(btn);
  }

  const status = game.status();
  statusEl.textContent = status.text;
  statusEl.dataset.tone = status.tone;

  // Captured pieces: what the bottom player has taken shows under the board.
  const taken = game.captured();
  const bottom = bottomColor();
  const top = bottom === 'w' ? 'b' : 'w';
  const tray = (color) => taken[color].map((t) => `${GLYPH[t]}${TEXT}`).join(' ');
  $('tray-bottom').textContent = tray(bottom);
  $('tray-top').textContent = tray(top);

  recordIfFinished();
  $('undo-btn').disabled = game.history.length === 0;
  $('hint-btn').disabled = game.over || game.computerToMove;

  store.save({ ...game.save(), showLabels });
}

/** When a game ends, put the result on the leaderboard (once per game, even after an undo). */
function recordIfFinished() {
  const result = game.result();
  if (!result || game.recorded) return;
  leaderboard = recordGame(leaderboard, { mode: game.mode, level: game.level, players: game.players, winner: result.winner });
  leaderboardStore.save(leaderboard);
  game.recorded = true;
}

function scheduleComputer() {
  clearTimeout(computerTimer);
  if (!game.computerToMove) return;
  computerTimer = setTimeout(() => {
    game.computerMove();
    render();
  }, COMPUTER_DELAY_MS);
}

function isMine(piece) {
  if (!piece || game.over || game.computerToMove) return false;
  return piece.color === game.turn;
}

async function tryMove(from, to) {
  let promotion = 'q';
  if (game.needsPromotion(from, to)) promotion = await askPromotion(game.turn);
  const move = game.move(from, to, promotion);
  selected = null;
  if (move) hintMove = null;
  render();
  if (move) scheduleComputer();
}

boardEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.sq');
  if (!btn) return;
  const square = btn.dataset.square;
  const piece = game.pieceAt(square);

  if (selected) {
    if (square === selected) { selected = null; render(); return; } // tap again to put it down
    if (game.targets(selected).some((m) => m.to === square)) { tryMove(selected, square); return; }
  }
  selected = isMine(piece) ? square : null;
  render();
});

function askPromotion(color) {
  const dialog = $('promotion');
  const box = $('promo-choices');
  box.innerHTML = '';
  return new Promise((resolve) => {
    for (const type of ['q', 'r', 'b', 'n']) {
      const b = document.createElement('button');
      b.value = type;
      b.innerHTML = glyph({ type, color });
      b.setAttribute('aria-label', type);
      box.appendChild(b);
    }
    dialog.returnValue = '';
    dialog.addEventListener('close', () => resolve(dialog.returnValue || 'q'), { once: true });
    dialog.showModal();
  });
}

$('undo-btn').addEventListener('click', () => {
  clearTimeout(computerTimer);
  game.undo();
  selected = null;
  hintMove = null;
  render();
  scheduleComputer();
});

$('hint-btn').addEventListener('click', () => {
  hintMove = game.hint();
  selected = hintMove ? hintMove.from : null;
  render();
});

for (const select of document.querySelectorAll('.player-pick')) {
  for (const p of PLAYERS) select.add(new Option(`${p.icon} ${p.name}`, p.id));
}

/** The person playing the computer (the side that isn't COMPUTER). */
function me() {
  const id = game.players[game.playerColor];
  return isPlayer(id) ? id : PLAYERS[0].id;
}

function openSettings() {
  const form = $('settings').querySelector('form');
  form.elements.me.value = me();
  form.elements.white.value = isPlayer(game.players.w) ? game.players.w : me();
  form.elements.black.value = isPlayer(game.players.b) ? game.players.b : otherPlayer(form.elements.white.value);
  form.elements.mode.value = game.mode;
  form.elements.level.value = game.level;
  form.elements.color.value = game.playerColor;
  form.elements.labels.checked = showLabels;
  syncSettings();
  $('settings').returnValue = '';
  $('settings').showModal();
}

function syncSettings() {
  const form = $('settings').querySelector('form');
  const vsComputer = form.elements.mode.value === 'computer';
  $('level-set').hidden = !vsComputer;
  $('color-set').hidden = !vsComputer;
  $('me-set').hidden = !vsComputer;
  $('friends-set').hidden = vsComputer;
  // Two friends can't both be the same player.
  if (form.elements.white.value === form.elements.black.value) form.elements.black.value = otherPlayer(form.elements.white.value);
}

$('settings').addEventListener('change', syncSettings);
$('settings').addEventListener('close', () => {
  if ($('settings').returnValue !== 'start') return;
  const form = $('settings').querySelector('form');
  clearTimeout(computerTimer);
  showLabels = form.elements.labels.checked;
  const mode = form.elements.mode.value;
  const playerColor = form.elements.color.value;
  const players = mode === 'friend'
    ? { w: form.elements.white.value, b: form.elements.black.value }
    : { [playerColor]: form.elements.me.value, [playerColor === 'w' ? 'b' : 'w']: COMPUTER };
  game = new Game({ mode, level: form.elements.level.value, playerColor, players });
  selected = null;
  hintMove = null;
  render();
  scheduleComputer();
});
$('new-btn').addEventListener('click', openSettings);

const PLACE_BADGE = { 1: '🥇', 2: '🥈', 3: '🥉' };
const count = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function openLeaderboard() {
  const rows = rankings(leaderboard);
  const list = $('lb-list');
  list.innerHTML = '';
  $('lb-empty').hidden = rows.length > 0;
  for (const row of rows) {
    const li = el('li');
    li.append(el('span', 'lb-place', PLACE_BADGE[row.place] || `#${row.place}`), el('span', 'lb-icon', row.icon));
    const name = el('span', 'lb-name', row.name);
    const { easy, medium, hard } = row.vsComputer;
    name.append(
      el('small', '', `${count(row.losses, 'loss', 'losses')} · ${count(row.draws, 'tie')}`),
      el('small', '', `Beat the computer: ${easy} easy, ${medium} medium, ${hard} hard`),
      el('small', '', `Beat friends: ${row.vsFriends}`),
    );
    const wins = el('span', 'lb-wins');
    wins.append(el('b', '', String(row.wins)), row.wins === 1 ? 'win' : 'wins');
    li.append(name, wins);
    list.appendChild(li);
  }

  const pairs = headToHead(leaderboard);
  const pairList = $('lb-pairs');
  pairList.innerHTML = '';
  $('lb-pairs-title').hidden = pairs.length === 0;
  for (const p of pairs) {
    const li = el('li', '', `${p.a.icon} ${p.a.name} ${p.aWins} – ${p.bWins} ${p.b.name} ${p.b.icon} `);
    if (p.draws) li.append(el('small', '', `(${count(p.draws, 'tie')})`));
    pairList.appendChild(li);
  }
  $('leaderboard').showModal();
}
$('leaderboard-btn').addEventListener('click', openLeaderboard);
$('settings-btn').addEventListener('click', openSettings);

render();
scheduleComputer();
