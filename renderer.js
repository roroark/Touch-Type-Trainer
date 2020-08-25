var arduino_controller = require('./arduino.js')
var LEFT_PINKY = 0
var LEFT_RING = 1
var LEFT_MIDDLE = 2
var LEFT_INDEX = 3
var LEFT_THUMB = 4
var RIGHT_THUMB = 5
var RIGHT_INDEX = 6
var RIGHT_MIDDLE = 7
var RIGHT_RING = 8
var RIGHT_PINKY = 9

var home_key_mapping = {
  q: LEFT_PINKY, a: LEFT_PINKY, z: LEFT_PINKY,
  w: LEFT_RING, s: LEFT_RING, x: LEFT_RING,
  e: LEFT_MIDDLE, d: LEFT_MIDDLE, c: LEFT_RING,
  r: LEFT_INDEX, f: LEFT_INDEX, v: LEFT_INDEX,
  t: LEFT_INDEX, g: LEFT_INDEX, b: LEFT_INDEX,
  y: RIGHT_INDEX, h: RIGHT_INDEX, n: RIGHT_INDEX,
  u: RIGHT_INDEX, j: RIGHT_INDEX, m: RIGHT_INDEX,
  i: RIGHT_MIDDLE, k: RIGHT_MIDDLE,
  o: RIGHT_RING, l: RIGHT_RING,
  p: RIGHT_PINKY
}

var fingers = {
  0: 'Left Pinky',
  1: 'Left Ring',
  2: 'Left Middle',
  3: 'Left Index',
  4: 'Left Thumb',
  5: 'Right Thumb',
  6: 'Right Index',
  7: 'Right Middle',
  8: 'Right Ring',
  9: 'Right Pinky'
}
function hardwareCheckMainMenu() {
  $('#hw_title').html('Detecting Hardware')
  $('#hw_sub').html('This may take a while.')
  //If hardware was detected
  arduino_controller.checkIfHardwareIsConnected(function(is_connected) {
    if (is_connected) {
      //Hardware Was Detected
      $('#hw_title').html('Hardware Found')
      $('#hw_sub').html('Let\'s begin!')
      $('#hardware_detect_screen').fadeOut(1000, ()=>{
        $('#word_screen').fadeIn()
      })
    } else {
      //Hardware Not Detected
      setTimeout(()=> {
        $('#hw_title').html('Hardware not found')
        $('#hw_sub').html('Make sure the hardware is connected and try again.')
        $('#hw_retry').fadeIn()
      }, 500)
    }
  })
}
$('#b1').click(()=>{
  initWordBox()
  $('#main_menu').fadeOut(500, ()=>{
    $('#hardware_detect_screen').fadeIn(500, ()=>{
      hardwareCheckMainMenu()
    // $('#word_screen').fadeIn();
    })
  })
})
$('#b2').click(()=>{
  $('#session_complete_screen').fadeOut(500, ()=>{
    $('#main_menu').fadeIn()
  })
})
$('#hw_retry').click(()=>{
  $('#hw_retry').fadeOut(()=>{
    hardwareCheckMainMenu()
  })
})

word_list = []
current_word = 0
max_word = 0
current_word_progress = 0

function getWordList() {
  word_list = [
    'apple',
    'banana',
    'cucumber'
  ]
}
function updateWordProgress() {
  $('#letter_done').html(word_list[current_word].substring(0, current_word_progress))
  $('#letter_current').html(word_list[current_word].substring(current_word_progress, current_word_progress+1))
  $('#letter_future').html(word_list[current_word].substring(current_word_progress+1))
}
function updateNumberOfWordsProgress() {
  $('#prog').width((100 * current_word / max_word) + '%')
  if (current_word < max_word)
    $('#cword').html(current_word + 1)
  else {
    // $('#nwstat').fadeOut()
  }
}
function initWordBox() {
  getWordList()
  current_word = 0;
  max_word = word_list.length
  $('#mword').html(max_word)
  current_word_progress = 0
  updateWordProgress()
  updateNumberOfWordsProgress()
}


$(document).keypress(function(e) {
  //Sanity Check?
  if ($('#main_menu').css('opacity') == 1 && $('#main_menu').css('display') != 'none') {
    if (e.which == 13) {
      $('#b1').click();
    }
  }
  else if ($('#session_complete_screen').css('opacity') == 1  && $('#session_complete_screen').css('display') != 'none') {
    if (e.which == 13) {
      $('#b2').click();
    }
  }
  else if ($('#word_screen').css('opacity') == 1 && $('#word_screen').css('display') != 'none' && current_word < max_word) {
    current_letter = word_list[current_word][current_word_progress].charCodeAt(0)
    // console.log(e.which)
    // console.log(current_letter)
    if (e.which == current_letter) {
      //Correct letter was inputted.
      current_word_progress += 1
      updateWordProgress()

      //Interpret time data


      //Check if the user has finished typing the current word
      if (current_word_progress == word_list[current_word].length) {
        //Finished the current word.
        current_word += 1
        //Check if all words are typed
        updateNumberOfWordsProgress()
        if (current_word == max_word) {
          //Al words are typed.
          //Fade out.
          $('#word_screen').fadeOut(700, ()=> {
            $('#session_complete_screen').fadeIn()
          })
          //Update Coefficients
        }
        else {
          //After some delay, bring in the next word.
          setTimeout(()=> {
            current_word_progress = 0
            updateWordProgress()
          }, 500)
        }
      }
    } else {
      //Incorrect letter was inputted.
      //Feedback
      //Update Coefficients
      //xDxDxDxD
      console.log('Messed up a \'' + String.fromCharCode(current_letter) + '\'')
      console.log('Sending a STOP buzz')
      arduino_controller.sendStopBuzz(function(success) {
        if (success) {
          setTimeout(()=>{
            console.log('Successfully sent the STOP buzz.')
            console.log('Senging a buzz to ' + fingers[home_key_mapping[String.fromCharCode(current_letter)]])
            arduino_controller.sendBuzzToFinger(home_key_mapping[String.fromCharCode(current_letter)], function(success) {
              if (success) {
                console.log('Successfully sent the feedback buzz.')
              } else {
                //TODO: maybe?
                //I'm tired. I need sleep. :'(
              }
            })
          }, 1000)
        } else {
          //TODO: maybe?
          //Leaving Empty for Now
        }
      })

    }
  }
})
