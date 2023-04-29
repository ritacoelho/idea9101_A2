/***********************************************************************
  IDEA9101 - IDEA LAB S1 2022 - WEEK 08

  Example of neural network training for classification.
  
  Code source: Adaptation from The Coding Train / Daniel Shiffman's ml5.js: Train Your Own Neural Network
  https://thecodingtrain.com/Courses/ml5-beginners-guide/6.1-ml5-train-your-own.html
  https://youtu.be/8HEgeAbYphA
  https://editor.p5js.org/codingtrain/sketches/zwGahux8a.

  Author: Luke Hespanhol
  Updated by: Andres Pinilla
  Date: April 2023
***********************************************************************/
/*
  Disabling canvas scroll for better experience on mobile interfce.
  Source: 
    User 'soanvig', answer posted on Jul 20 '17 at 18:23.
    https://stackoverflow.com/questions/16348031/disable-scrolling-when-touch-moving-certain-element 
*/
document.addEventListener('touchstart', function(e) {
  document.documentElement.style.overflow = 'hidden';
});

document.addEventListener('touchend', function(e) {
  document.documentElement.style.overflow = 'auto';
});

//////////////////////////////////////////////////
//FIXED SECTION: DO NOT CHANGE THESE VARIABLES
//////////////////////////////////////////////////
var HOST = window.location.origin;
let xmlHttpRequest = new XMLHttpRequest();


////////////////////////////////////////////////////////
// Class: ControlButton
//
// A bespoke button to handle selection of categories
// and trogger training, during the 'collection' state.
////////////////////////////////////////////////////////
class ControlButton {
constructor(label, x, y, w, h) {
  this.label = label;
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.clicked = false;
}

// Check if mouse is over the button
isMouseOver() {
  return (state == 'collection') && (abs(mouseX-this.x) < this.w/2) && (abs(mouseY-this.y) < this.h/2);
}

// Sets the button to clicked, and retuen its label
click() {
  this.clicked = true;
  return this.label;
}

// Sets the button to unclicked
unclick() {
  this.clicked = false;
}

// Draws the button to the screen
display() {
  if (this.clicked) {
    fill(100, 100, 200); // blue shade if clicked
  } else {
    fill(150, 150, 150); // light gray if unclicked
  }
  rectMode(CENTER);
  rect(this.x, this.y, this.w, this.h);
  fill(255);
  textSize(30);
  textAlign(CENTER, CENTER);
  text(this.label, this.x, this.y);
}
}


////////////////////////////////////////////////////////
// SKETCH VARIABLES
////////////////////////////////////////////////////////

let model;
let targetLabel = ''; // The selected category, used for collection and prediction

let state = 'collection'; // State can be 'collection', 'training' and 'prediction'

// Control buttons
let shortButton;
let mediumButton;
let longButton;
let trainButton;

// Variables to control the general logic
let collectingGesture = false;
let timeGestureStarted;
let gestureDuration;
let minX = 0, maxX = 0;
let minY = 0, maxY = 0;
let ampX = 0, ampY = 0;

let NUM_IMAGES = 11;
let faces = [];
let averageLevel = 0;
let font;
let settings;

////////////////////////////////////////////////////////
// PRELOAD
////////////////////////////////////////////////////////
function preload() {
  settings = loadJSON('./settings/settings.json');
  console.log('settings file loaded');

  // for (var i = 0; i <= 100; i += 10) {
  //   var img = loadImage('./images/face_' + i + '.png');
  //   append(faces, img);
  // }
}

////////////////////////////////////////////////////////
// SETUP
////////////////////////////////////////////////////////
function setup() {
createCanvas(windowWidth, windowHeight);

// Font: Swansea, by Roger White, retrieved March-2022 from: https://www.fontspace.com/swansea-font-f5873
//font = loadFont('assets/Swansea-q3pd.ttf');

// Set options used for collection or prediction
let options = {
  inputs: ['gestureDuration', 'ampX', 'ampY'],
  outputs: ['levelPercentage'],
  task: 'regression',
  debug: 'true'
};
model = ml5.neuralNetwork(options); // Create the neural network

// Load an existing model, if settings configures as such
if (settings.loadExistingModel == "yes") {
  console.log('LOAD MODEL');
  const modelInfo = {
    model: 'model/model.json',
    metadata: 'model/model_meta.json',
    weights: 'model/model.weights.bin'
  }

  model.load(modelInfo, modelLoaded);
}

// Create the control buttons
let buttonWidth = int(windowWidth/4);
let buttonHeight = int(windowHeight/20);
let firstButtonX = int(buttonWidth/2);
let buttonY = int(buttonHeight/2);
shortButton = new ControlButton('short', firstButtonX, buttonY, buttonWidth, buttonHeight);
mediumButton = new ControlButton('medium', firstButtonX + buttonWidth, buttonY, buttonWidth, buttonHeight);
longButton = new ControlButton('long', firstButtonX + 2*buttonWidth, buttonY, buttonWidth, buttonHeight);
trainButton = new ControlButton('TRAIN', firstButtonX + 3*buttonWidth, buttonY, buttonWidth, buttonHeight);
}


////////////////////////////////////////////////////////
// DRAW
////////////////////////////////////////////////////////
function draw() {
if (!collectingGesture && (state != 'prediction')) {
  background(255);
}
noStroke();

// Only displays the buttons during collection
if (state == 'collection') {
  shortButton.display();
  mediumButton.display();
  longButton.display();
  trainButton.display();
}

// Draw gestures to the screen
if (collectingGesture) {
  fill(0, 50);
  ellipse(mouseX, mouseY, 30, 30);

  minX = min(int(minX), mouseX);
  minY = min(int(minY), mouseY);
  maxX = max(int(maxX), mouseX);
  maxY = max(int(maxY), mouseY);
}

if(state == 'prediction'){
  background(255);
}
}

////////////////////////////////////////////////////////
// MODEL LOADED
//
// Callback invoked when the model loading is completed.
// In this case, no training is needed, so go straight
// into prediction.
////////////////////////////////////////////////////////
function modelLoaded() {
console.log('model loaded');
state = 'prediction';
//displayImage(faces.length-1);
}

////////////////////////////////////////////////////////
// MOUSE PRESSED
//
// Toggle buttons accordingly or start training (during collection),
// and start collecting a gesture, if one not yet being collected.
////////////////////////////////////////////////////////
function mousePressed() {
if (shortButton.isMouseOver()) {
  targetLabel = shortButton.click();
  mediumButton.unclick();
  longButton.unclick();
  trainButton.unclick();
} else if (mediumButton.isMouseOver()) {
  shortButton.unclick();
  targetLabel = mediumButton.click();
  longButton.unclick();
  trainButton.unclick();
} else if (longButton.isMouseOver()) {
  shortButton.unclick();
  mediumButton.unclick();
  targetLabel = longButton.click();
  trainButton.unclick();
} else if (trainButton.isMouseOver()) {
  shortButton.unclick();
  mediumButton.unclick();
  longButton.unclick();
  targetLabel = trainButton.click();
  startTraining();
} else {
  // Collect gesture
  if (!collectingGesture) {
    startProcessingSingleData();
  }
}
}

////////////////////////////////////////////////////////
// MOUSE RELEASED
//
// End processing the entering of a gesture.
////////////////////////////////////////////////////////
function mouseReleased() {
endProcessingSingleData();
}

////////////////////////////////////////////////////////
// If collection is being performed, then set up 
// variables to start collecting a new gesture.
////////////////////////////////////////////////////////
function startProcessingSingleData() {
timeGestureStarted = millis();
collectingGesture = true;
minX = mouseX;
maxX = minX;
minY = mouseY;
maxY = minY;
}

////////////////////////////////////////////////////////
// If collection is being performed, then gather values 
// for each variable of interest, and add them to
// the model.
//
// Otherwoise, if prediction is being performed,
// then classify the data entered.
////////////////////////////////////////////////////////
function endProcessingSingleData() {
if (state == 'collection') {
  if (collectingGesture && (targetLabel.trim() != '')) {
    gestureDuration = int(millis() - timeGestureStarted);
    ampX = (maxX - minX);
    ampY = (maxY - minY);

    let inputs = {
      gestureDuration: gestureDuration, 
      ampX: ampX, 
      ampY: ampY
    }

    // Map target label to a percentage
    let targetValue = -1;
    if (targetLabel == 'short') {
      targetValue = 0;
    } else if (targetLabel == 'medium') {
      targetValue = 50;
    } else if (targetLabel == 'long') {
      targetValue = 100;
    }

    let target = {
      label: targetValue
    }

    model.addData(inputs, target);
    console.log("Data added: tagetLabel: " + targetLabel + "; gestureDuration: " + gestureDuration + "; ampX: " + ampX + "; ampY: " + ampY);
  }
} else if (state == 'prediction') {
  gestureDuration = int(millis() - timeGestureStarted);
  ampX = (maxX - minX);
  ampY = (maxY - minY);

  let inputs = {
    gestureDuration: gestureDuration, 
    ampX: ampX, 
    ampY: ampY
  }
  model.predict(inputs, gotResults);

}
collectingGesture = false;
}


////////////////////////////////////////////////////////
// ---> TRAINING FUNCTIONS
////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////
// Function called when starting training the model,
// once data collection is completed (in the case of 
// this example, when the user clicks the 'Train' button).
////////////////////////////////////////////////////////////
function startTraining() {
state = 'training';
console.log('starting training');
model.normalizeData();
let options = {
  epochs: 200
}
model.train(options, whileTraining, finishedTraining);
console.log('training completed');
}

////////////////////////////////////////////////////////
// Callback invoked on each staep of training.
////////////////////////////////////////////////////////
function whileTraining(epoch, loss) {
console.log(epoch);
}

////////////////////////////////////////////////////////
// Callback invoked when training is completed.
////////////////////////////////////////////////////////
function finishedTraining() {
console.log('finished training.');
state = 'prediction';
model.save();
}


////////////////////////////////////////////////////////
// ---> PREDICTION FUNCTIONS
////////////////////////////////////////////////////////

////////////////////////////////////////////////////////
// Callback invoiked when results from prediction
// are return.
////////////////////////////////////////////////////////
function gotResults(error, results) {
if (error) {
  console.error(error);
  return;
}

// console.log(results);

// Read the results and round the regression value up to teh nearest integer.
// then, calculate the average between this new value and the previous one,
// in order to smooth out the transition between faces. Finally, fetch the
// corresponding face and draw it to the screen.
let levelPercentage = round(results[0].value);
//  console.log('==> levelPercentage: ' + levelPercentage);
// averageLevel = round((averageLevel + 2*levelPercentage)/3);
// var imgIndex = int(averageLevel/10);
//displayImage(/*imgIndex*/);

text(levelPercentage, width/2, height/2);
sendMessage(levelPercentage);
}

//function displayImage(/*index*/) {
// var img = faces[index];
//background(255);
// imageMode(CENTER);
// image(img, windowWidth/2, windowHeight/2, windowWidth/3, windowWidth/3); 
//}

////////////////////////////////////////////////////
// CUSTOMIZABLE SECTION - END: ENTER OUR CODE HERE
////////////////////////////////////////////////////

/***********************************************************************
  === PLEASE DO NOT CHANGE OR DELETE THIS SECTION ===
  This function sends a MQTT message to server
***********************************************************************/
function sendMessage(level) {
  //message sent with water level and timestamp
  let msgStr = level.toString() + ';' + Date.now();

  console.log(msgStr);

	let postData = JSON.stringify({ id: 1, 'message': msgStr});

	xmlHttpRequest.open("POST", HOST + '/sendMessage', false);
  xmlHttpRequest.setRequestHeader("Content-Type", "application/json");
	xmlHttpRequest.send(postData);
}