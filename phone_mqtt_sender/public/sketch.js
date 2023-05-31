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

  Further adapted as we did not need the mouse trajectory to be included in the classification of the length of the hold.
  Updated by: Rita Coelho
  Date: May 2023
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

  // Button variables for watering
  let waterButton;

  // Variables to keep current state of the world and timestamp for last time water button was released
  let worldState = 0;
  let lastRelease = Date.now();

  // To store the images for canister and pointer hand
  let waterCanImg;
  let pointerImg;
  
  ////////////////////////////////////////////////////////
  // PRELOAD
  ////////////////////////////////////////////////////////
  function preload() {
	//preloading model settings and images
	settings = loadJSON('./settings/settings.json');
	console.log('settings file loaded');
  
	waterCanImg = loadImage('images/water-can.png');
	pointerImg = loadImage('images/hand-pointing.png');
	
  }
  
  ////////////////////////////////////////////////////////
  // SETUP
  ////////////////////////////////////////////////////////
  function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // Set options used for collection or prediction
  let options = {
	inputs: ['gestureDuration'],
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
  

  //Create the UI button
  waterButton = createButton("");
  waterButton.position(width/2 - width*.125, height/2 + 150);
  //in order to activate model training, the two next lines need to be commented out and callback functions need to be renamed to touchStarted (line 256) and touchEnded (line 294) respectively
  waterButton.touchStarted(startCollecting);
  waterButton.touchEnded(endCollecting);
  waterButton.class("water-button");
  waterButton.style(`height: ${width*.25}; width: ${width*.25}`);
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
	}
	
	// Display UI when predicting (not training)
	if(state == 'prediction'){
		background("#5E6FFD");
		imageMode(CENTER);
		waterCanImg.resize(width*0.6, height*0.22);
		image(waterCanImg, width/2, height/4);
		fill("#FFFFFF");

		textFont('Gaegu');
		textSize(60);
		textStyle(BOLD);
		text("Water filling up:", width/2, height/2 - 100);
		text(`${Math.floor(worldState)}%`, width/2, height/2 - 25);

		text("Hold this button\nto fill up the water", width/2, 3*height/4+100);
		fill("#D2D7FF");
		textSize(50);
		textStyle(NORMAL);
		text("The longer you hold, the more\nyou're watering the trees", width/2, 3*height/4 + 300);
		sendMessage();
		decay();
	}
  }

  //Function that slowly decrements world state if user is not interacting for longer than 5 seconds
  function decay() {
	if(worldState > 0.05 && Date.now() - lastRelease > 5000 && !collectingGesture){
		worldState -= 0.05;
	}
  }

  //Function that maps last interaction as a value between 0 and 20 and increments it to world state (capping between 0 and 100)
  function updateWorldState(level) {
	let impact = map(level, 0, 100, 1, 20);
	if(worldState+impact < 100) {
		worldState += impact;
	} else {
		worldState = 100;
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
  }
  
  ////////////////////////////////////////////////////////
  // MOUSE PRESSED
  //
  // Toggle buttons accordingly or start training (during collection),
  // and start collecting a gesture, if one not yet being collected.
  ////////////////////////////////////////////////////////
  function startCollecting() { //used to be called touchStarted

	waterButton.style(`background-color: #dae1ff;`);
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
	return false;
  }
  
  ////////////////////////////////////////////////////////
  // MOUSE RELEASED
  //
  // End processing the entering of a gesture.
  ////////////////////////////////////////////////////////
  function endCollecting() { //used to be called touchEnded
	waterButton.style(`background-color: #F4F6FF;`);
	endProcessingSingleData();
	return false;
  }
  
  ////////////////////////////////////////////////////////
  // If collection is being performed, then set up 
  // variables to start collecting a new gesture.
  ////////////////////////////////////////////////////////
  function startProcessingSingleData() {
	timeGestureStarted = millis();
	collectingGesture = true;
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
	
		let inputs = {
			gestureDuration: gestureDuration, 
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
		console.log("Data added: tagetLabel: " + targetLabel + "; gestureDuration: " + gestureDuration);
		}
	} else if (state == 'prediction') {
		gestureDuration = int(millis() - timeGestureStarted);
	
		let inputs = {
		gestureDuration: gestureDuration, 
		}
		model.predict(inputs, gotResults);
	
	}
	collectingGesture = false;
	lastRelease = Date.now(); // update timestamp for last time button was released
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
	
	// Read the results and round the regression value up to teh nearest integer.
	let levelPercentage = round(results[0].value);
	
	//text(levelPercentage, width/2, height/2);
	updateWorldState(levelPercentage);
  }
  
  ////////////////////////////////////////////////////
  // CUSTOMIZABLE SECTION - END: ENTER OUR CODE HERE
  ////////////////////////////////////////////////////
  
  /***********************************************************************
	=== PLEASE DO NOT CHANGE OR DELETE THIS SECTION ===
	This function sends a MQTT message to server
  ***********************************************************************/
  function sendMessage() {
	//message sent with water level
	let msgStr = Math.floor(worldState).toString();
  
	let postData = JSON.stringify({ id: 1, 'message': msgStr});

	xmlHttpRequest.open("POST", HOST + '/sendMessage', false);
	xmlHttpRequest.setRequestHeader("Content-Type", "application/json");
	xmlHttpRequest.send(postData);
  }