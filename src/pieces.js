// How pieces are drawn, shared by the game board and the lesson board.
export const GLYPH = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
export const TEXT = '︎'; // ask for the plain symbol, not an emoji

export function glyph(piece) {
  return `<span class="piece ${piece.color}">${GLYPH[piece.type]}${TEXT}</span>`;
}
