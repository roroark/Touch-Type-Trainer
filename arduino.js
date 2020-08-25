/*
  This javascript file handles interactions with the hardware.
  Arduino Baud: 57600

*/
var serial_port = require('serialport')
var arduino
var arduino_found = false
var arduino_port = null
var arduino_connected = false
var checking_hardware_connection = false
var software_signature = 'ef'
var hardware_signature = 'hy'
var in_buffer = ''
var first_contact = false
var stop_first_contact = false
var command_ack = false
var stop_command = false




/*
  Initiate Connection With Arduino
  Only Perform This Once
  callback after 600ms to reduce number of attempts.
  Indiscriminately add all the data received to in_buffer
  ACKs and StatusReports are 2 Bytes Long
*/


function firstContact(callback=null) {
  first_contact = false
  stop_first_contact = false
  console.log('Attempting first contact.')
  //Send at 0ms
  var attempts = 1
  sendData(software_signature, false)
  var x = setInterval(() => {
    if (stop_first_contact) {
      clearInterval(x)
      console.log('Timeout in making first contact.')
    } else if (first_contact) {
      clearInterval(x)
      console.log('Made first contact in ' + attempts + ' attempt(s).')
      if (callback!=null) callback()
    } else {
      sendData(software_signature, false)
      attempts += 1
    }
  }, 10)
}
function convertToCommand(finger_buzz_data) {
  var byte1 = 0x0C
  for (i=0; i<2; i++) {
    byte1 = (byte1 << 1) + finger_buzz_data[i]
  }
  var byte2 = 0
  for (i=2; i<10; i++) {
    byte2 = (byte2 << 1) + finger_buzz_data[i]
  }
  // https://stackoverflow.com/questions/8936984/uint8array-to-string-in-javascript
  console.log(Buffer.from([byte1,byte2]))
  return Buffer.from([byte1,byte2])
}

function sendCommand(command, callback=null) {
  command_ack = false
  stop_command = false
  console.log('Sending command ' + command)
  //Send at 0ms
  var attempts = 1
  sendData(command, false)
  var x = setInterval(() => {
    if (stop_command) {
      clearInterval(x)
      console.log('Timeout in sending command.')
    } else if (command_ack) {
      clearInterval(x)
      console.log('Command ACK in ' + attempts + ' attempt(s).')
      if (callback!=null) callback()
    } else {
      sendData(command, false)
      attempts += 1
    }
  }, 10)
}

function sendData(data, log=true) {
  arduino.write(data, function() {
    if(log)
      console.log('Sent: ' + data)
  });
}

function parseBuffer() {
  var received_command = in_buffer.substring(0,2)
  switch (received_command) {
    //First Contact
    case hardware_signature:
      first_contact = true
      // in_buffer = in_buffer.substring(2)
      in_buffer = ''
      console.log('First Contact Made')
      break;
    //Misc Command
    case 'ok':
      command_ack = true
      // in_buffer = in_buffer.substring(2)
      in_buffer = ''
      console.log('Command Sent')
      break;
    //Invalid Command
    case 'ic':
      //Write was missaligned
      // in_buffer = in_buffer.substring(2)
      in_buffer = ''
      console.log('Invalid Command')
      break;
    //Un-alligned, remove one byte
    default:
      in_buffer = in_buffer.substring(1)
      if (in_buffer.length >= 2) parseBuffer()
      break;
  }
}

function lookForFirstArduino(callback) {
  arduino_found = false
  serial_port.list(function (err, ports) {
    ports.forEach(function(port) {
      //Pair with the first Arduino
      if (port.manufacturer && port.manufacturer.toString().substring(0, 7) == 'Arduino') {
              //Test if it is our Arduino
              //If it is our Arduino start a Serial Port Connection
              if (!arduino_found) {
                console.log('An Arduino was found at port ' + port.comName)
                arduino_port = port.comName
                arduino_found = true
                callback()
              }
        }
    })
  })
}
function startConnection(callback) {
    console.log('Attempting to connect to Arduino at port ' + arduino_port)
    arduino = new serial_port(arduino_port, {baudRate: 57600}, function() {
      setTimeout(callback, 600)
    })
    arduino.on('data', function(data) {
      in_buffer += data.toString('utf8')
      if (in_buffer.length >= 2) parseBuffer()
    })
    //TODO: I'm too lazy to complete this. It's important :P
    //Bring up the disconnected screen or something.
    arduino.on('close', function(e) {
      if (e.disconnected == true) {
        //Connection was lost
        console.log('Arduino was unplugged.')
        arduino_connected = false

      } else {
        //Other type of connection closed
        console.log('Arduino connection closed.')
      }
    })
}
/*
  Look For Arduino, Connect To it, and Verify its Configuration
  Dedicate upto 3 Seconds
*/
function atteptToConnectToFirstArduino(callback) {
  lookForFirstArduino(()=>{
    startConnection(()=>{
      firstContact(()=>{
        //Configured Arduino Found
        arduino_connected = true
        callback(true)
      })
    })
  })
  setTimeout(() => {
    if (!first_contact) {
      stop_first_contact = true
      if (!arduino_found) {
        console.log('Arduino not found.')
      } else if (!arduino_connected) {
        console.log('The connected Arduino is not configured.')
      }
      callback(false)
    }
  }, 3000)
}
/*
  Attempt to send a STOP buzz i.e. buzz all fingers
  for 500ms.
  callback(true) means successfully sent the command
  callback(false) means nope
*/
function sendStopBuzz(callback) {
  sendCommand(convertToCommand([1,1,1,1,1  ,  1,1,1,1,1]), ()=> {
    callback(true)
  })
  setTimeout(()=>{
    stop_command = true
    callback(false)
  }, 500)
}
/*
  Attempt to send a buzz to a specific finger
  for 500ms.
  callback(true) means successfully sent the command
  callback(false) means nope
*/
function sendBuzzToFinger(finger_ID, callback) {
  var template = [0,0,0,0,0  ,  0,0,0,0,0]
  template[finger_ID] = 1
  sendCommand(convertToCommand(template), ()=> {
    callback(true)
  })
  setTimeout(()=>{
    stop_command = true
    callback(false)
  }, 500)
}
/*
  Checks if the previouslly connected Arduino is still connected.
*/


function checkIfHardwareIsConnected(callback) {
  if (arduino_connected) callback(true)
  else {
    atteptToConnectToFirstArduino(callback)
  }
}



module.exports = {
  checkIfHardwareIsConnected : checkIfHardwareIsConnected,
  sendStopBuzz: sendStopBuzz,
  sendBuzzToFinger: sendBuzzToFinger
}
