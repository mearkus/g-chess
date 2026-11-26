// Learn to play: draws the lesson list and the lesson board, and handles taps.
// The lessons themselves (and all the rules) are in lessons.js.
import { LESSONS, LessonRun, loadProgress, markDone, nextLesson } from './lessons.js';
import { glyph } from './pieces.js';

const FILES = 'abcdefgh';
const MISS_FLASH_MS = 450;

/**
 * Hooks up the Learn window. Returns a function that opens it.
 * @param {{store: {load(): any, save(data: any): void}, askPromotion: (color: string) => Promise<string>}} deps
 */
export function setupLearn({ store, askPromotion }) {
  const $ = (id) => document.getElementById(id);
  const dialog = $('learn');
  const boardEl = $('learn-board');
  const feedbackEl = $('lesson-feedback');
  let progress = loadProgress(store.load());
  let run = null;
  let missSquare = null;
  let missTimer = null;

  function showMenu() {
    run = null;
    $('learn-menu').hidden = false;
    $('learn-lesson').hidden = true;
    const list = $('lesson-list');
    list.innerHTML = '';
    const suggested = nextLesson(progress).id;
    LESSONS.forEach((lesson, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'lesson-pick ui';
      b.dataset.lesson = lesson.id;
      const done = progress.done.includes(lesson.id);
      if (done) b.classList.add('done');
      if (lesson.id === suggested && !done) b.classList.add('suggested');
      b.innerHTML = `<span class="lesson-icon">${lesson.icon}</span><span class="lesson-name">${i + 1}. ${lesson.title}</span><span class="lesson-star">${done ? '⭐' : ''}</span>`;
      b.addEventListener('click', () => startLesson(lesson));
      list.appendChild(b);
    });
    const all = progress.done.length === LESSONS.length;
    $('learn-sub').textContent = all
      ? "You finished every lesson! 🎉 You're ready to play a real game."
      : 'New to chess? Start with lesson 1. Each one only takes a minute!';
  }

  function startLesson(lesson) {
    run = new LessonRun(lesson);
    $('learn-menu').hidden = true;
    $('learn-lesson').hidden = false;
    say('', '');
    draw();
  }

  function say(text, tone) {
    feedbackEl.textContent = text || '';
    feedbackEl.dataset.tone = tone || '';
  }

  function draw() {
    const { lesson, step } = run;
    $('lesson-title').textContent = `${lesson.icon} ${lesson.title}`;
    $('lesson-step').textContent = run.stepCount > 1 ? `Part ${run.stepIndex + 1} of ${run.stepCount}` : '';
    $('lesson-text').textContent = step.text;

    // When a 'squares' step is done, show every square the piece could reach.
    const targets = run.targets;
    boardEl.innerHTML = '';
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = FILES[col] + (8 - row);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `sq ${(col + (8 - row)) % 2 === 1 ? 'light' : 'dark'}`;
        btn.dataset.square = square;
        btn.setAttribute('aria-label', square);
        if (run.selected === square) btn.classList.add('selected');
        if (run.lastMove && (run.lastMove.from === square || run.lastMove.to === square)) btn.classList.add('last');
        if (run.found.includes(square)) btn.classList.add('found');
        if (missSquare === square) btn.classList.add('miss');

        const piece = run.chess.get(square);
        if (piece) btn.insertAdjacentHTML('beforeend', glyph(piece));

        const showDot = step.kind === 'move' ? targets.includes(square) : run.done && targets.includes(square);
        if (showDot && !run.found.includes(square)) {
          btn.insertAdjacentHTML('beforeend', piece ? '<span class="ring"></span>' : '<span class="dot"></span>');
        }
        if (run.found.includes(square)) btn.insertAdjacentHTML('beforeend', '<span class="check">✓</span>');
        boardEl.appendChild(btn);
      }
    }

    const next = $('lesson-next');
    next.disabled = !run.done;
    next.textContent = !run.isLastStep ? 'Next ▶' : lessonAfter(lesson) ? 'Next lesson ▶' : '🎉 All done';
  }

  function lessonAfter(lesson) {
    return LESSONS[LESSONS.indexOf(lesson) + 1] || null;
  }

  function flashMiss(square) {
    clearTimeout(missTimer);
    missSquare = square;
    missTimer = setTimeout(() => { missSquare = null; if (run) draw(); }, MISS_FLASH_MS);
  }

  async function handle(result, square) {
    if (result.type === 'promote') {
      const piece = await askPromotion('w');
      result = run.move(result.from, result.to, piece);
    }
    if (result.type === 'miss' || result.type === 'nope' || result.type === 'stuck') flashMiss(square);
    const tone = { complete: 'win', found: 'good', miss: 'bad', nope: 'bad', stuck: 'bad' }[result.type] || '';
    if (result.text) say(result.text, tone);
    if (result.type === 'drop') say('', '');
    if (run.finished) {
      progress = markDone(progress, run.lesson.id);
      store.save(progress);
    }
    draw();
  }

  boardEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.sq');
    if (!btn || !run) return;
    handle(run.tap(btn.dataset.square), btn.dataset.square);
  });

  $('lesson-retry').addEventListener('click', () => {
    run.start();
    say('', '');
    draw();
  });

  $('lesson-next').addEventListener('click', () => {
    if (!run?.done) return;
    if (run.next()) {
      say('', '');
      draw();
      return;
    }
    const after = lessonAfter(run.lesson);
    if (after) startLesson(after);
    else showMenu();
  });

  $('lesson-back').addEventListener('click', showMenu);
  $('learn-close').addEventListener('click', () => dialog.close());

  return function open() {
    showMenu();
    dialog.showModal();
  };
}
