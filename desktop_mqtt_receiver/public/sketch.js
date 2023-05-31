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

//variables to store previous and current mode - or stage 
//they are useful to determine which graphics and text to display, as long as which sounds to play.
let currentMode;
let tempMode;

//current score out of 100
let currentScore = 0;

//array to store world graphics and informatioioni
let planets = [];
//array to store tree images
let trees = [];

//variables for sound files
/* Sound rreferences
Eponn. (2022). Button UI App. Freesound. https://freesound.org/people/Eponn/sounds/619835/
Eponn. (2022). Achievement Happy Beeps Jingle. Freesound. https://freesound.org/people/Eponn/sounds/619835/
SergeQuadrado. (2019). Miracle Harp [DDMyzik Logos]. Freesound. https://freesound.org/people/SergeQuadrado/sounds/460893/
Goik. (2017). Gamepack1 -Mystery failed.wav [Gamepack Vol. 1]. Freesound. https://freesound.org/people/AdamGoik/sounds/394485/ 
*/
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

	//attempt to get rid of Google's block of audio playback before user interaction - doesn't seem to have worked
	getAudioContext().resume();

	setupMqtt();
	/////////////////////////////////////////////
	// FIXED SECION - END
	/////////////////////////////////////////////
}

function preload() {
	//preloading planet graphics and information
	loadJSON("./planet.json", "json", jsonCallback);
	for(let i = 1; i < 7; i++){
		let img = loadImage(`images/trees${i}.png`);
		trees.push(img);
	}

	//preloading sound files
	failSound = loadSound('sounds/fail.wav');
	stepSound = loadSound('sounds/step.wav');
	winSound = loadSound('sounds/win.wav');
	backSound = loadSound('sounds/back.wav');
}

//maps planet data into array
function jsonCallback(data) {
	planets = data.map((planet) => {
		return {
			planetDescription: planet.description,
			planetImage: loadImage(planet.url),
		};
	});

	//console.log(planets);
}

/////////////////////////////////////////////
// DRAW FUNCTION - START BELOW
/////////////////////////////////////////////

function draw() {
	clear();
	stepper();
	planetView();
}

//draws and fills the progress graphic based on world state
function stepper() {
	stroke("ffffff");
	noFill();
	rect(60, 80, width*0.9, 40, 40, 50, 20);

	fill("#9C79FF");
	strokeWeight(1);
	let progress = map(currentScore, 0, 100, 20, width*0.9);
	rect(60, 80, progress, 40, 40, 50, 20);

	noStroke();
	fill("#FFFFFF");
	textFont('Gaegu');

	let yPos = 60;
	for (let i = 1; i <= 6; i++) {
		let scale = map(i, 1, 6, 0, 100);
		let xPos = map(i, 1, 6, 65, width*0.9);
		text(`${scale}%`, xPos, yPos);
	}
}

//displays the appropriate world and trees graphics based on world state
function planetView() {
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
		
		tempMode = Math.floor(map(currentScore, 0, 100, 0, 5));
		//console.log(tempMode, currentMode);

		//determine which soundfile to play based on user progress
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

		//update currentMode
		currentMode = Math.floor(tempMode);
	}
}
