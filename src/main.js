// Wires the game to the page: draws the board, handles taps, runs the computer.
import { Game } from './game.js';

const GLYPH = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
const TEXT = '︎'; // ask for the plain symbol, not an emoji
const FILES = 'abcdefgh';
const SAVE_KEY = 'g-chess:v1';
const COMPUTER_DELAY_MS = 550;

const $ = (id) => document.getElementById(id);
const boardEl = $('board');
const statusEl = $('status');

const store = {
  load() { try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || null; } catch { return null; } },
  save(data) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch { /* private mode */ } },
};

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

  $('undo-btn').disabled = game.history.length === 0;
  $('hint-btn').disabled = game.over || game.computerToMove;

  store.save({ ...game.save(), showLabels });
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

function openSettings() {
  const form = $('settings').querySelector('form');
  form.mode.value = game.mode;
  form.level.value = game.level;
  form.color.value = game.playerColor;
  form.labels.checked = showLabels;
  syncSettings();
  $('settings').returnValue = '';
  $('settings').showModal();
}

function syncSettings() {
  const form = $('settings').querySelector('form');
  const vsComputer = form.mode.value === 'computer';
  $('level-set').hidden = !vsComputer;
  $('color-set').hidden = !vsComputer;
}

$('settings').addEventListener('change', syncSettings);
$('settings').addEventListener('close', () => {
  if ($('settings').returnValue !== 'start') return;
  const form = $('settings').querySelector('form');
  clearTimeout(computerTimer);
  showLabels = form.labels.checked;
  game = new Game({ mode: form.mode.value, level: form.level.value, playerColor: form.color.value });
  selected = null;
  hintMove = null;
  render();
  scheduleComputer();
});
$('new-btn').addEventListener('click', openSettings);
$('settings-btn').addEventListener('click', openSettings);

render();
scheduleComputer();
