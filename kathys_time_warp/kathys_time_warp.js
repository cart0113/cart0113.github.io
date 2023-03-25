const containerEl = document.getElementById('countdown-container');
const countdownEl = document.getElementById('countdown-canvas');

var time_show = 300.0;

const countdown = new CanvasCircularCountdown(countdownEl, {
      duration: 5000.0,
      clockwise: true,
      radius: containerEl.getBoundingClientRect().width / 2,
      captionText: percentage => {
          //if (percentage <= 0) {
          //    return 'DONE ' + percentage * time_show;
          //}
          return percentage * time_show;
      }
  },
  (percentage, time, instance) => {
      if (percentage == 0) {
        //https://stackoverflow.com/questions/21815323/have-sound-play-when-alert-is-triggered
        document.getElementById('xyz').play();      
      }
   }
).start();

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