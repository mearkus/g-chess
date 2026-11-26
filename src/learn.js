// Learn to play: draws the lesson path, the lesson board and the "lesson done" screen.
// The lessons themselves (and all the rules) are in lessons.js.
import {
  UNITS, LESSONS, LessonRun, loadProgress, finishLesson, nextLesson,
  isDone, isUnlocked, currentStreak, playedToday, totalStars,
} from './lessons.js';
import { glyph } from './pieces.js';

const FILES = 'abcdefgh';
const MISS_FLASH_MS = 450;
// The path zig-zags: each lesson bubble sits a little left or right of the middle.
const ZIGZAG = [0, 1, 2, 1, 0, -1, -2, -1];

const starRow = (n) => '⭐'.repeat(n) + '☆'.repeat(3 - n);
const days = (n) => `${n} ${n === 1 ? 'day' : 'days'}`;

/**
 * Hooks up the Learn window. Returns a function that opens it.
 * @param {object} deps
 * @param {{load(): any, save(data: any): void}} deps.store where progress is kept
 * @param {(color: string) => Promise<string>} deps.askPromotion asks which piece a pawn becomes
 * @param {() => string} [deps.today] today's date as YYYY-MM-DD (tests can pin it)
 */
export function setupLearn({ store, askPromotion, today }) {
  const $ = (id) => document.getElementById(id);
  const dialog = $('learn');
  const boardEl = $('learn-board');
  const feedbackEl = $('lesson-feedback');
  const day = () => (today ? today() : undefined);
  let progress = loadProgress(store.load());
  let run = null;
  let missSquare = null;
  let missTimer = null;

  function show(view) {
    for (const v of ['learn-menu', 'learn-lesson', 'learn-result']) $(v).hidden = v !== view;
  }

  function showMenu() {
    run = null;
    show('learn-menu');
    const streak = currentStreak(progress, day());
    $('learn-streak').textContent = streak
      ? `🔥 ${days(streak)} in a row${playedToday(progress, day()) ? '' : '. Do a lesson today to keep it going!'}`
      : 'Do a lesson every day to grow a 🔥 streak!';
    $('learn-stars').textContent = `⭐ ${totalStars(progress)} of ${LESSONS.length * 3}`;

    const path = $('lesson-path');
    path.innerHTML = '';
    const suggested = nextLesson(progress).id;
    let n = 0;
    for (const unit of UNITS) {
      const head = document.createElement('h3');
      head.className = 'unit-title';
      head.textContent = unit.title;
      path.appendChild(head);
      for (const lesson of unit.lessons) {
        const open = isUnlocked(progress, lesson.id);
        const done = isDone(progress, lesson.id);
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'path-step ui';
        b.dataset.lesson = lesson.id;
        b.style.setProperty('--shift', ZIGZAG[n++ % ZIGZAG.length]);
        b.disabled = !open;
        if (done) b.classList.add('done');
        if (!open) b.classList.add('locked');
        if (lesson.id === suggested && open && !done) b.classList.add('suggested');
        b.setAttribute('aria-label', `${lesson.title}${open ? '' : ' (locked)'}`);
        b.innerHTML = `<span class="bubble">${open ? lesson.icon : '🔒'}</span>`
          + `<span class="step-name">${lesson.title}</span>`
          + `<span class="step-stars">${done ? starRow(progress.stars[lesson.id]) : lesson.id === suggested ? 'Start!' : ''}</span>`;
        b.addEventListener('click', () => startLesson(lesson));
        path.appendChild(b);
      }
    }
    path.querySelector('.suggested')?.scrollIntoView?.({ block: 'center' });
  }

  function startLesson(lesson) {
    if (!isUnlocked(progress, lesson.id)) return;
    run = new LessonRun(lesson);
    show('learn-lesson');
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
    $('lesson-bar').style.width = `${Math.round(run.progress * 100)}%`;
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
    next.textContent = run.isLastStep ? 'Finish ⭐' : 'Next ▶';
  }

  function lessonAfter(lesson) {
    return LESSONS[LESSONS.indexOf(lesson) + 1] || null;
  }

  /** The "lesson done" screen: stars, mistakes and the streak. */
  function showResult() {
    const before = currentStreak(progress, day());
    progress = finishLesson(progress, run.lesson.id, run.stars, day());
    store.save(progress);
    const streak = currentStreak(progress, day());

    show('learn-result');
    $('result-title').textContent = run.stars === 3 ? 'Perfect! 🎉' : 'Lesson done! 🎉';
    $('result-stars').textContent = starRow(run.stars);
    $('result-text').textContent = run.mistakes === 0
      ? 'No mistakes at all!'
      : `${run.mistakes} ${run.mistakes === 1 ? 'mistake' : 'mistakes'}. Do it again with none to get 3 stars.`;
    $('result-streak').textContent = streak > before ? `🔥 ${days(streak)} in a row!` : `🔥 ${days(streak)} in a row`;

    const after = lessonAfter(run.lesson);
    const cont = $('result-next');
    cont.textContent = after ? `Next: ${after.title} ▶` : 'Back to the path';
    cont.dataset.next = after ? after.id : '';
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
    showResult();
  });

  $('result-next').addEventListener('click', () => {
    const id = $('result-next').dataset.next;
    const after = LESSONS.find((l) => l.id === id);
    if (after) startLesson(after);
    else showMenu();
  });
  $('result-path').addEventListener('click', showMenu);
  $('lesson-back').addEventListener('click', showMenu);
  $('learn-close').addEventListener('click', () => dialog.close());

  return function open() {
    progress = loadProgress(store.load()); // in case another tab changed it
    showMenu();
    dialog.showModal();
  };
}
