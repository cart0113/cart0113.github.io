const soundEffect = new Audio();
soundEffect.autoplay = true;
soundEffect.src = "data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";


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
        //document.getElementById('xyz').play(); 
        soundEffect.src = "alarm.mp3";
        soundEffect.play();
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