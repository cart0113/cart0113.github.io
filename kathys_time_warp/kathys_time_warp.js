const soundEffect0 = new Audio();
soundEffect0.autoplay = false;
soundEffect0.loop = true;
soundEffect0.src = "data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";


const containerEl = document.getElementById('countdown-container');
const countdownEl = document.getElementById('countdown-canvas');

const baseDate = new Date(Date.UTC(1998, 10, 11, 0, 0));


var countdown = null;

var musicOn = false;

function create_timer() {
    
    var timeOne = (picker0.getDate() - baseDate);
    var timeTwo = (picker1.getDate() - baseDate); 

    function setTime(percentage) {
        var timeDiff = percentage * (timeTwo) / 100.0;
        return msToHMS(timeDiff);
    }
    
    soundEffect0.src = "count.mp3";
    soundEffect0.play();

    musicOn = true;
    
    countdown = new CanvasCircularCountdown(countdownEl, {
          duration: timeOne,
          clockwise: true,
          //throttle: 0,
          radius: containerEl.getBoundingClientRect().width / 4,
          captionText: setTime,
          elapsedTime: 1,
      },
      (percentage, time, instance) => {
          if (percentage <= 1) {
            //https://stackoverflow.com/questions/21815323/have-sound-play-when-alert-is-triggered
            //document.getElementById('xyz').play(); 
            //soundEffect.src = "alarm.mp3";
            //soundEffect.play();
            soundEffect0.pause();
            soundEffect0.src = "alarm.mp3";
            soundEffect0.play();
          }
       }
    ).start();
    
    let resizeTimeout;
    /*
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        countdownEl.style({
          radius: containerEl.getBoundingClientRect().width / 2
        });
      }, 250);
      }
    );
    */
};

$('#datetimepicker0').datetimepicker({
  pickDate: false
});
$('#datetimepicker1').datetimepicker({
  pickDate: false
});

var picker0 = $('#datetimepicker0').data('datetimepicker');
var picker1 = $('#datetimepicker1').data('datetimepicker');

picker0.setDate(new Date(Date.UTC(1998, 10, 11, 0,  1)));
picker1.setDate(new Date(Date.UTC(1998, 10, 11, 0,  2)));

$( function() {
    $('#page-two').hide();
    $('#start').on("click", function(event) {
        $('#page-one').hide();    
        $('#page-two').show();
        create_timer();
        event.preventDefault();
    });
    $('#reset').on("click", function(event) {
        $('#page-two').hide();
        $('#page-one').show();
        soundEffect0.pause();
        countdown.stop();
        delete countdown;
        countdownEl.innerHTML = "";
        event.preventDefault();
    });

    $('#music').on("click", function(event) {
        if(musicOn) {
            musicOn = false;
            soundEffect0.pause();
            $('#music').prop("value", 'SOUND OFF');
        }
        else {
            musicOn = true;
            soundEffect0.play();
            $('#music').prop("value", 'SOUND ON');
        }
        event.preventDefault();
    });

});


/*
$('.timepicker').timepicker({
    timeFormat: 'h:mm:ss',
    interval: 0.25,
    minTime: 0,
    maxTime: 3600,
    defaultTime: 5,
    startTime: 0,
    dynamic: true,
    dropdown: true,
    scrollbar: true
});
*/

function pad2(number) {
   number = (Math.round(number) < 10 ? '0' : '') + Math.round(number);
   return number;
}
function msToHMS( ms ) {
    // 1- Convert to seconds:
    let seconds = ms / 1000;
    // 2- Extract hours:
    const hours = parseInt( seconds / 3600 ); // 3,600 seconds in 1 hour
    seconds = seconds % 3600; // seconds remaining after extracting hours
    // 3- Extract minutes:
    const minutes = parseInt( seconds / 60 ); // 60 seconds in 1 minute
    // 4- Keep only seconds not extracted to minutes:
    seconds = seconds % 60;
    return hours + ":" + pad2(minutes) + ":" + pad2(seconds, '0');
}