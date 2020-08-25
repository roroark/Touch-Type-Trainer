## Touch-Type-Trainer
An embedded systems solution aimed at teaching the usage of the QWERTY keyboard to the visually impaired. This revolves around the idea that every key on the keyboard is assigned a finger (refer below image).

<img src="https://user-images.githubusercontent.com/18059416/91125839-51e08780-e6c0-11ea-93a8-5be1a7af2921.png" width="50%">


An `electron.js` desktop app displayed and narrated words to be typed and sent haptic cues via an Arduino to specially designed gloves for each character.

<img src="https://user-images.githubusercontent.com/18059416/91125569-aa635500-e6bf-11ea-9837-dbbb05d86824.png" width="40%">

### Dependencies
Electron<br>
Serialport 

### Outcome
We concluded that fingertips were the best position to provide haptic cues as these regions have the most nerve endings. Most users would not be able to identify which finger is being buzzed if the cues are provided on the phalange.
