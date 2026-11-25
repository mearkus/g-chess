# g-chess

A chess game being built by my son. He's 9, and he helps build it by telling
Claude what he wants, often by talking rather than typing.

## Stack
Vite + plain JavaScript (no framework), chess.js for the rules, Vitest (+ jsdom) for tests.

## Commands
- Install: `npm install`
- Test: `npm test`
- Lint/format: none yet
- Run: `npm run dev` (prints a link; `--host` is on, so a tablet on the same Wi-Fi can open it too)
- Build: `npm run build` (writes `dist/`, relative paths so it can be hosted in a sub-folder)

## Building with a 9-year-old

Most requests will come from him, often spoken, so they may be short, excited,
misheard or vague ("make the horse jump higher", "add lasers"). That's the
point of the project. When you're working with him:

- **Say back what you'll do in one short sentence**, in his words, before you
  start: "Okay, I'll make the knights glow green when you pick them up."
- **If it's unclear, ask one question with two or three choices**, never a list
  of questions: "Should the lasers be a sound, a flash on the board, or both?"
- **Make one small change at a time**, so he sees a result within a few
  minutes. Big ideas get split: do the first fun piece now, list the rest.
- **Tell him exactly what to look for**: "Start a new game and tap a knight.
  It should glow green."
- **Use plain words.** Say "the part that draws the board", not "the render
  function". Teach one real word when it fits ("that's called a *function*").
- **Be encouraging and honest.** If something can't work, say why simply and
  offer the closest thing that can.
- **Keep real chess working.** Silly rule changes ("pawns can fly") go in as an
  optional mode or setting, so the normal game still plays correctly.
- **Keep it safe for a kid:** no accounts, chat, ads, links out of the game,
  tracking, or collecting names or other personal details. Ask his dad before
  adding anything that talks to the internet.
- Ideas he has that you don't build yet go on the **Ideas list** in README.md.

The grown-up rules still apply: small focused PRs, tests updated with
behavior changes, `npm test` passing before you call something done.

## Conventions
- Keep changes small and focused; one concern per PR.
- Write or update tests alongside behavior changes.
- Don't commit secrets. Use environment variables, documented in README.md.
- Update this file when commands or architecture change.

## Architecture notes
- `index.html`: the page (board, status line, buttons, settings and promotion dialogs).
- `src/main.js`: draws the board and handles taps; runs the computer's move on a short timer.
- `src/game.js`: game state on top of chess.js (moves, undo, hint, captured pieces,
  friendly status text, save/load). No DOM, so it's unit tested.
- `src/engine.js`: the computer opponent (small alpha-beta search). Levels easy/medium/hard
  set search depth and how often it plays a random move.
- `src/style.css`: all the looks. Colors are CSS variables at the top of the file, an
  easy first place for him to make changes.
- `test/`: Vitest tests. `ui.test.js` runs the page in jsdom and taps squares.
- The game saves itself to `localStorage` (`g-chess:v1`), so a reload carries on.
- Starter-kit skills (from `mearkus/starter`) that fit this project: `add-game-audio`,
  `add-game-tutorial`, `mobile-polish`, `deploy-github-pages`.
