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

let currentMode = 0;
let totalMode = 5;
let planetStage = 0;
let planets = [];

function setup() {
	/////////////////////////////////////////////
	// FIXED SECION - START: DO NOT CHANGE IT
	/////////////////////////////////////////////
	createCanvas(windowWidth, windowHeight);

	setupMqtt();
	/////////////////////////////////////////////
	// FIXED SECION - END
	/////////////////////////////////////////////
	noLoop();
}

function preload() {
	loadJSON("./planet.json", "json", jsonCallback);
}

function jsonCallback(data) {
	planets = data.map((planet) => {
		return {
			planetDescription: planet.description,
			planetImage: loadImage(planet.url),
		};
	});

	console.log(planets);
}

/////////////////////////////////////////////
// DRAW FUNCTION - START BELOW
/////////////////////////////////////////////

function draw() {
	planetRender();
}

function planetRender() {
	// create the image
	// if true then add 1
	// if false then reduce
	// if -1 fail

	if (currentMode < totalMode) {
		planetView();
		stepper();
	}
}

function stepper() {
	// rect(x, y, w, [h], [tl], [tr], [br], [bl])
	stroke("ffffff");
	noFill();
	// fill("ffffff");
	// rect(30, 20, 55, 55, 20, 15, 10, 5);
	rect(60, 20, width / 1.1, 40, 40, 20, 20);

	fill("ffffff");
	stroke("red");
	strokeWeight(2);
	rect(
		60,
		20,
		width / 1.1 / (totalMode - currentMode),
		40 * (currentMode + 1),
		40,
		20,
		20
	);

	noStroke();
	let xPos = 65;
	let yPos = 80;
	for (let i = 0; i <= 5; i++) {
		text(i, xPos, yPos);
		xPos += width / 1.1 / (totalMode - currentMode) - 3;
	}
}

function planetView() {
	// text
	// text(str, x, y, [x2], [y2]);

	// for (let i = 0; i < planets.length; i++) {
	image(
		planets[currentMode].planetImage,
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

	fill("#ffffff");
	textSize(16);
	text(planets[currentMode].planetDescription, width / 1.5, 200);
	// }
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
	if (topic.includes("end-waste-mqtt")) {
		messageSplit = message.split(";");
		//do what you gotta do with the message, you'll hopefully just receive a number between 0-5 that pertains to the current score
	}
}
