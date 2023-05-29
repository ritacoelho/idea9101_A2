/***********************************************************************
  WEEK 04 - Example 04 - MQTT Sender

  Author: Luke Hespanhol
  Date: March 2022
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

////////////////////////////////////////////////////
// CUSTOMIZABLE SECTION - BEGIN: ENTER OUR CODE HERE
////////////////////////////////////////////////////

// Global variable to store the classifier
let classifier;

// Label
let label = 'listening...';

// Teachable Machine model URL:
let soundModel = HOST + '/model/';

let appraisals = ['Yayyy, correct!', 'Perfect!', 'Keep Going!', 'Almost there!', 'Woohoo! Congrats!']

let happyWorld;
let fruitNames = ['apple', 'banana', 'mango', 'pear', 'strawberry'];
let fruitImages = [];
let currentScore = 0;

let fruitIndex, imageIndex;

//let recordButton;
let tryAgain;
let next;
let playAgain;

let state = 2; //0 wrong, 1 right, 2 playing, 3 won

function preload() {
  // Load the model
  classifier = ml5.soundClassifier(soundModel + 'model.json');

  fruitNames.forEach(element => { 
    let images = [];
    for(let i = 0; i < 4; i++){
      let temp = createImg(`images/fruits/${element}/${element+i}.jpeg`);
      temp.size(windowWidth*.7, windowWidth*.7);
      temp.position(windowWidth/2-windowWidth*.35, windowHeight/2-windowWidth*.35);
      temp.style("border-radius: 40px;");
      temp.hide();
      images.push(temp);
    };
    fruitImages.push(images);
  });

  happyWorld = loadImage('images/Planet-5.webp');

  // recordButton = createButton("Record");
  // recordButton.position(windowWidth/2 - 75, windowHeight - windowHeight/7 - 75);
  // recordButton.style("width: 150px; height: 150px; border-radius: 100px;");
  // recordButton.touchStarted(recordInput);

  tryAgain = createButton("Try Again!");
  tryAgain.position(windowWidth/2 - 150, windowHeight - windowHeight/7 - 75);
  tryAgain.style("width: 300px; height: 150px; border-radius: 40px; font-size: 30px; color: white; background-color: #FE8A00;");
  tryAgain.mousePressed(newFruit);

  next = createButton("Next!");
  next.position(windowWidth/2 - 150, windowHeight - windowHeight/7 - 75);
  next.style("width: 300px; height: 150px; border-radius: 40px; font-size: 30px; color: white; background-color: #FE8A00;");
  next.mousePressed(newFruit);

  playAgain = createButton("Play Again");
  playAgain.position(windowWidth/2 - 150, windowHeight - windowHeight/7 - 75);
  playAgain.style("width: 300px; height: 150px; border-radius: 40px; font-size: 30px; color: white; background-color: #FE8A00;");
  playAgain.mousePressed(function() { state = 2; currentScore = 0; newFruit(); });
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  fruitIndex = Math.floor(random(0,5));
  imageIndex = Math.floor(random(0,4));
  fruitImages[fruitIndex][imageIndex].show();

  // Start classifying
  // The sound model will continuously listen to the microphone
  classifier.classify(gotResult);
}

function draw() {
  background(94,111,253);
  // Draw the label in the canvas
  fill(255);
  textAlign(CENTER, CENTER);
  // text(label, width / 2, height / 4);

  textSize(62);
  strokeWeight(5);

  //console.log(label);
  

  switch (state) {
    case 0:
      playAgain.hide();
      next.hide();
      tryAgain.show();
      text("Oh no, that's wrong!", width / 2, height / 5);
      text(`The correct answer was ${fruitNames[fruitIndex]}.`, width / 2, height / 5 + 100);

      textSize(40);
      text("Look up!\nThe world is getting worse now! :(", width / 2, height - height / 5 - 100);
      break;
  
    case 1:
      playAgain.hide();
      next.show();
      tryAgain.hide();
      text(appraisals[currentScore], width / 2, height / 5);
      text(`The fruit is ${fruitNames[fruitIndex]}!`, width / 2, height / 5 + 100);
      break;

    case 2:
      playAgain.hide();
      next.hide();
      tryAgain.hide();
      text("What fruit is this?", width / 2, height / 5);

      if(label != "Background Noise" && label != "listening..." && label == fruitNames[fruitIndex]) {
        console.log("CORRECT");
        state = 1;
        if(currentScore < 4){
          currentScore++;
        } else {
          currentScore++;
          state = 3;
        }
    
      } else if(label != "Background Noise" && label != "listening..." && label != fruitNames[fruitIndex]){
        console.log("TRY AGAIN");
        state = 0;
        if(currentScore > 0) currentScore--;
      }
      break;

    case 3:
      playAgain.show();
      next.hide();
      tryAgain.hide();
      text("You saved the world!", width / 2, height / 5);
      fruitImages[fruitIndex][imageIndex].hide();
      happyWorld.resize(width*.7, width*.7);
      image(happyWorld, width/2 - width*.35, height/2 - width*.35);
      break;
  }

  sendMessage();
}

function newFruit(){
  state = 2;
  fruitImages[fruitIndex][imageIndex].hide();
  fruitIndex = Math.floor(random(0,5));
  imageIndex = Math.floor(random(0,4));
  fruitImages[fruitIndex][imageIndex].show();
}


// The model recognizing a sound will trigger this event
function gotResult(error, results) {
  if (error) {
    console.error(error);
    return;
  }
  // The results are in an array ordered by confidence.
  // console.log(results[0]);
  label = results[0].label;
}


/***********************************************************************
  === PLEASE DO NOT CHANGE OR DELETE THIS SECTION ===
  This function sends a MQTT message to server
***********************************************************************/
function sendMessage(){

	let postData = JSON.stringify({ id: 1, 'message': currentScore.toString() });

	xmlHttpRequest.open("POST", HOST + '/sendMessage', false);
  xmlHttpRequest.setRequestHeader("Content-Type", "application/json");
	xmlHttpRequest.send(postData);
}