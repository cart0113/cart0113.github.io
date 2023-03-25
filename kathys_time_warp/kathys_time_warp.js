const containerEl = document.getElementById('countdown-container');
const countdownEl = document.getElementById('countdown-canvas');

const countdown = new CanvasCircularCountdown(countdownEl, {
  radius: containerEl.getBoundingClientRect().width / 2
}).start();

let resizeTimeout;

window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);

  resizeTimeout = setTimeout(() => {
    countdownEl.style({
      radius: containerEl.getBoundingClientRect().width / 2
    });
  }, 250);
  }
);