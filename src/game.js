// Game state: rules come from chess.js, the computer from engine.js.
// No DOM in here, so everything is easy to test.
import { Chess } from 'chess.js';
import { pickMove, bestMove } from './engine.js';

export const PIECE_NAMES = { k: 'king', q: 'queen', r: 'rook', b: 'bishop', n: 'knight', p: 'pawn' };

export class Game {
  /**
   * @param {object} [opts]
   * @param {'computer'|'friend'} [opts.mode] play the computer or a friend on the same screen
   * @param {'easy'|'medium'|'hard'} [opts.level]
   * @param {'w'|'b'} [opts.playerColor] which side the player is on against the computer
   * @param {string} [opts.pgn] a saved game to carry on with
   */
  constructor({ mode = 'computer', level = 'easy', playerColor = 'w', pgn = '' } = {}) {
    this.mode = mode;
    this.level = level;
    this.playerColor = playerColor;
    this.chess = new Chess();
    if (pgn) {
      try { this.chess.loadPgn(pgn); } catch { this.chess.reset(); }
    }
  }

  get turn() { return this.chess.turn(); }
  get over() { return this.chess.isGameOver(); }
  get history() { return this.chess.history({ verbose: true }); }
  get lastMove() { return this.history.at(-1) || null; }

  /** True when it's the computer's go. */
  get computerToMove() {
    return this.mode === 'computer' && !this.over && this.turn !== this.playerColor;
  }

  /** Squares the piece on `from` can move to. */
  targets(from) {
    return this.chess.moves({ square: from, verbose: true });
  }

  pieceAt(square) { return this.chess.get(square) || null; }

  needsPromotion(from, to) {
    return this.targets(from).some((m) => m.to === to && m.promotion);
  }

  /** Make a move. Returns the move, or null if it isn't allowed. */
  move(from, to, promotion = 'q') {
    if (this.over || this.computerToMove) return null;
    try {
      return this.chess.move({ from, to, promotion });
    } catch {
      return null;
    }
  }

  computerMove(random = Math.random) {
    if (!this.computerToMove) return null;
    const m = pickMove(this.chess, this.level, random);
    return m ? this.chess.move(m) : null;
  }

  /** Take back the player's last move (and the computer's reply to it). */
  undo() {
    if (!this.history.length) return false;
    if (this.mode === 'computer') {
      if (this.turn === this.playerColor) this.chess.undo(); // the computer's reply
      if (this.history.length && this.turn !== this.playerColor) this.chess.undo(); // the player's move
      // A computer-first game (player is black) may now be back at the start with the computer to move.
      return true;
    }
    this.chess.undo();
    return true;
  }

  hint() {
    if (this.over || this.computerToMove) return null;
    return bestMove(this.chess, 2);
  }

  /** Pieces each side has captured, as piece letters. */
  captured() {
    const taken = { w: [], b: [] };
    for (const m of this.history) if (m.captured) taken[m.color].push(m.captured);
    return taken;
  }

  /** A short, friendly line about where the game stands. */
  status() {
    const c = this.chess;
    const side = (color) => (color === 'w' ? 'White' : 'Black');
    if (c.isCheckmate()) {
      const winner = c.turn() === 'w' ? 'b' : 'w';
      if (this.mode === 'computer') {
        return winner === this.playerColor
          ? { tone: 'win', text: 'Checkmate! You win! 🎉' }
          : { tone: 'lose', text: 'Checkmate. The computer wins this time. Try again!' };
      }
      return { tone: 'win', text: `Checkmate! ${side(winner)} wins! 🎉` };
    }
    if (c.isStalemate()) return { tone: 'draw', text: "Stalemate! Nobody can move, so it's a tie." };
    if (c.isInsufficientMaterial()) return { tone: 'draw', text: "It's a tie. Nobody has enough pieces left to win." };
    if (c.isThreefoldRepetition()) return { tone: 'draw', text: "It's a tie. The same position happened three times." };
    if (c.isDraw()) return { tone: 'draw', text: "It's a tie!" };

    const check = c.inCheck();
    if (this.mode === 'computer') {
      if (this.computerToMove) return { tone: 'wait', text: 'The computer is thinking…' };
      return check
        ? { tone: 'check', text: 'Check! Keep your king safe.' }
        : { tone: 'turn', text: 'Your turn!' };
    }
    return check
      ? { tone: 'check', text: `Check! ${side(c.turn())}, keep your king safe.` }
      : { tone: 'turn', text: `${side(c.turn())}'s turn` };
  }

  save() {
    return { mode: this.mode, level: this.level, playerColor: this.playerColor, pgn: this.chess.pgn() };
  }
}
