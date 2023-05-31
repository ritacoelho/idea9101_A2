/***********************************************************************
  IDEA9101 - WEEK 4 - Example 01 - Receiving MQTT

  Author: Luke Hespanhol
  Date: March 2022
***********************************************************************/
/*
	Disabling canvas scroll for better experience on mobile interfce.
	Source: 
		User 'soanvig', answer posted on Jul 20 '17 at 18:23.
		https://stackoverflow.com/questions/16348031/disable-scrolling-when-touch-moving-certain-element 
*/
document.addEventListener("touchstart", function (e) {
	document.documentElement.style.overflow = "hidden";
});

document.addEventListener("touchend", function (e) {
	document.documentElement.style.overflow = "auto";
});

//////////////////////////////////////////////////
//FIXED SECTION: DO NOT CHANGE THESE VARIABLES
//////////////////////////////////////////////////
var HOST = window.location.origin;
var socket;

////////////////////////////////////////////////////
// CUSTOMIZABLE SECTION - BEGIN: ENTER OUR CODE HERE
////////////////////////////////////////////////////

let width, height;

let currentMode;
let totalMode = 6;

let currentScore = 0;

// let planetStage = 0;
let planets = [];

let trees = [];

let failSound;
let stepSound;
let winSound;
let backSound;

function setup() {
	/////////////////////////////////////////////
	// FIXED SECION - START: DO NOT CHANGE IT
	/////////////////////////////////////////////
	createCanvas(windowWidth, windowHeight);
	width = windowWidth;
	height = windowHeight;
	getAudioContext().resume();

	setupMqtt();
	/////////////////////////////////////////////
	// FIXED SECION - END
	/////////////////////////////////////////////
	// noLoop();
}

function preload() {
	loadJSON("./planet.json", "json", jsonCallback);
	for(let i = 1; i < 7; i++){
		let img = loadImage(`images/trees${i}.png`);
		trees.push(img);
	}

	failSound = loadSound('sounds/fail.wav');
	stepSound = loadSound('sounds/step.wav');
	winSound = loadSound('sounds/win.wav');
	backSound = loadSound('sounds/back.wav');
}

function jsonCallback(data) {
	planets = data.map((planet) => {
		return {
			// planetScore: planet.currentScore,
			planetDescription: planet.description,
			planetImage: loadImage(planet.url),
		};
	});

	console.log(planets);
	// console.log(planetScore);
}

/////////////////////////////////////////////
// DRAW FUNCTION - START BELOW
/////////////////////////////////////////////

function draw() {
	// planetRender();

	if ((currentMode) => 0) {
		clear();
		planetView();
		stepper();
	} else {
		planetDestroy();
	}

	// if(currentMode == 0 && !failSound.isPlaying()) {
	// 	failSound.loop = false;
	// 	failSound.play();
	// } else if (currentMode == 5 && !winiSound.isPlaying()) {
	// 	winSound.loop = false;
	// 	winSound.play();
	// } else if (!stepSound.isPlaying()){
	// 	stepSound.loop = false;
	// 	stepSound.play();
	// }
	
}

// function planetRender() {
// 	// create the image
// 	// if true then add 1
// 	// if false then reduce
// 	// if -1 fail

// 	if (currentMode < totalMode) {
// 		planetView();
// 		stepper();
// 	} else if (currentMode <= 0) {
// 		planetDestroy();
// 	}

// 	// planetDestroy();
// }

function stepper() {
	// rect(x, y, w, [h], [tl], [tr], [br], [bl])
	stroke("ffffff");
	noFill();
	// fill("ffffff");
	// rect(30, 20, 55, 55, 20, 15, 10, 5);
	rect(60, 80, width*0.9, 40, 40, 50, 20);

	fill("#9C79FF");
	//stroke("red");
	strokeWeight(1);
	let progress = map(currentScore, 0, 100, 20, width*0.9);
	rect(60, 80, progress, 40, 40, 50, 20);

	noStroke();
	fill("#FFFFFF");
	textFont('Gaegu');

	let yPos = 60;
	for (let i = 1; i <= 6; i++) {
		let scale = map(i, 1, 6, 0, 100)
		let xPos = map(i, 1, 6, 65, width*0.9)
		text(`${scale}%`, xPos, yPos);
	}
}

function planetView() {
	// text
	// text(str, x, y, [x2], [y2]);

	// for (let i = 0; i < planets.length; i++) {
	image(
		planets[currentMode? currentMode : 0].planetImage,
		width / 4,
		height / 4,
		width / 2,
		height / 2,
		0,
		0,
		planets.width,
		planets.height,
		CONTAIN
	);

	//trees
	push();
	imageMode(CENTER);
	image(trees[currentMode? currentMode : 0], width/2, height/2);
	pop();

	fill("#ffffff");
	textSize(20);
	text(planets[currentMode? currentMode : 0].planetDescription, width / 1.5, 250);
	// }
}

function planetDestroy() {
	// rect(x, y, w, [h], [tl], [tr], [br], [bl])
	stroke("ffffff");
	noFill();
	// fill("ffffff");
	// rect(30, 20, 55, 55, 20, 15, 10, 5);
	stroke("red");
	fill("#FFCCCB");
	rect(60, 20, width / 1.1, 40, 40, 20, 20);

	image(
		planets[0].planetImage,
		width / 4,
		height / 4,
		width / 2,
		height / 2,
		0,
		0,
		planets.width,
		planets.height,
		CONTAIN
	);

	noStroke();
	fill("#ffffff");
	textSize(20);
	text("You Lose. Try Again😭", width / 1.5, 250);
}

////////////////////////////////////////////////////
// CUSTOMIZABLE SECTION - END: ENTER OUR CODE HERE
////////////////////////////////////////////////////

////////////////////////////////////////////////////
// MQTT MESSAGE HANDLING
////////////////////////////////////////////////////
function setupMqtt() {
	socket = io.connect(HOST);
	socket.on("mqttMessage", receiveMqtt);
}

function receiveMqtt(data) {
	var topic = data[0];
	var message = data[1];

	//Receive message and synthesize data
	if (topic.includes("nurture-nature-mqtt")) {
		messageSplit = message.split(";");

		currentScore = messageSplit[0].trim();
		
		let tempMode = Math.floor(map(currentScore, 0, 100, 0, 5));
		console.log(tempMode, currentMode);
		if(tempMode == 5 && tempMode != currentMode){
			console.log("winSound");
			winSound.setLoop(false);
			winSound.play();
		} else if(tempMode == 0 && tempMode != currentMode) {
			console.log("failSound");
			failSound.setLoop(false);
			failSound.play();
		} else if(tempMode != 0 && tempMode != 5 && tempMode > currentMode) {
			console.log("stepSound");
			stepSound.setLoop(false);
			stepSound.play();
		} else if(tempMode != 0 && tempMode != 5 && tempMode < currentMode) {
			console.log("backSound");
			backSound.setLoop(false);
			backSound.play();
		}
		currentMode = Math.floor(tempMode);
	}
}
