const soundEffect0 = new Audio();
soundEffect0.autoplay = false;
soundEffect0.loop = true;
soundEffect0.src = "data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";

const containerEl = document.getElementById('countdown-container');
const countdownEl = document.getElementById('countdown-canvas');

const baseDate = new Date(Date.UTC(1998, 10, 11, 0, 0));

var countdown = null;

var musicOn = true;

var timerPage = false;

var noSleep = new NoSleep();
var wakeLockEnabled = false;

/*
$("#music0").button({
    icon: "ui-icon-gear"
});
$("#start").button({
    showLabel: true,
});
*/

function toggleMusic() {
    if(musicOn) {
        musicOn = false;
        soundEffect0.pause();
        //$('#music0').prop("value", 'SOUND IS OFF');
        //$('#music1').prop("value", 'SOUND IS OFF');
        $('#music0-i').attr("class", "bi bi-volume-mute-fill");
        $('#music1-i').attr("class", "bi bi-volume-mute-fill");
    }
    else {
        musicOn = true;
        if(doPlay && timerPage) {
            soundEffect0.play();
        }
        $('#music0-i').attr("class", "bi bi-volume-up-fill");
        $('#music1-i').attr("class", "bi bi-volume-up-fill");
    }
}

var doPlay = true;
function togglePlay(){
    if(doPlay){
        doPlay = False;
        $('#play-i').attr("class", "bi bi-play-fill");
        soundEffect0.pause();
    }
    else {
        doPlay = True;
        $('#play-i').attr("class", "bi bi-pause-fill");
        if(musicOn) {
            soundEffect0.play();
        }
    }
}

function done() {
    if(timerPage) {
        window.focus();
        musicOn = true;
        $('#music0-i').attr("class", "bi bi-volume-up-fill");
        $('#music1-i').attr("class", "bi bi-volume-up-fill");
        soundEffect0.pause();
        soundEffect0.src = "alarm.mp3";
        soundEffect0.play();
    }
}


var dayTime = 1000.0 * 60 * 60 * 24;

var timeoutId = null; 

function create_timer() {
    
    var timeOne = (picker0.getDate() % dayTime);
    var timeTwo = (picker1.getDate() % dayTime); 

    function setTime(percentage) {
        var timeDiff = percentage * (timeTwo) / 100.0;
        return msToHMS(timeDiff);
    }

    soundEffect0.src = "countdown.mp3";
    
    if(musicOn) {
        $('#music0').prop("value", 'SOUND IS ON');
        $('#music1').prop("value", 'SOUND IS ON');
        soundEffect0.play();
    }

    countdown = new CanvasCircularCountdown(countdownEl, {
          duration: timeOne,
          clockwise: true,
          //throttle: 0,
          radius: containerEl.getBoundingClientRect().width / 3,
          captionText: setTime,
          elapsedTime: 1,
      },
      (percentage, time, instance) => {
          if (percentage <= 1) {
            //https://stackoverflow.com/questions/21815323/have-sound-play-when-alert-is-triggered
            //document.getElementById('xyz').play(); 
            //soundEffect.src = "alarm.mp3";
            //soundEffect.play();
            done();
          }
       }
    ).start();

    timeoutId = setTimeout(done, timeOne);
    
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
        timerPage = true;
        $('#page-one').hide();    
        $("#page-two").attr("class", "page");
        $('#page-two').show();
        create_timer();
        noSleep.enable(); // keep the screen on!
        wakeLockEnabled = true;
        event.preventDefault();
    });
    $('#reset').on("click", function(event) {
        clearTimeout(timeoutId);
        timerPage = false;
        $('#page-two').hide();
        $('#page-one').show();
        soundEffect0.pause();
        countdown.stop();
        delete countdown;
        countdownEl.innerHTML = "";
        noSleep.disable(); // let the screen turn off.
        wakeLockEnabled = false;
        event.preventDefault();
    });

    $('#music0').on("click", function(event) {
        toggleMusic();
        event.preventDefault();
    });
    $('#music1').on("click", function(event) {
        toggleMusic();
        event.preventDefault();
    });
    $('#play').on("click", function(event) {
        togglePlay();
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
