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
var socket;

////////////////////////////////////////////////////
// CUSTOMIZABLE SECTION - BEGIN: ENTER OUR CODE HERE
////////////////////////////////////////////////////

let myBubbles = [];
let h = 0;

let amplitude;
let colour;

let maxAmp = 0;

function setup() {

	/////////////////////////////////////////////
	// FIXED SECION - START: DO NOT CHANGE IT
	/////////////////////////////////////////////
	createCanvas(windowWidth, windowHeight);

	setupMqtt();
	/////////////////////////////////////////////
	// FIXED SECION - END
	/////////////////////////////////////////////

	amplitude = 0;
	colour = color(0,0,0);
}

function draw() {
	//gradient background using lerp
	for (let y = 0; y < height; y++) {
		let gradientLine = lerpColor(color(238,200,224), color(57,47,90), y / height);

		stroke(gradientLine);
		line(0, y, width, y);
	}

	fill(colour);

	for (let i = 0; i < myBubbles.length; i++) {
		myBubbles[i].display();
		myBubbles[i].move();
	}
	
  	newBubble();
	if(myBubbles.length > 0) popBubble();
}

// Function that displays a new bubble forming based on user input audio
function newBubble() {
	//make sure h is within bounds to cap circle size at 200
	h = amplitude > 0 ? map(amplitude, 0, 0.05, 50, 200, true) : 0;
	stroke(colour);
	fill(colour._getRed(), colour._getGreen(), colour._getBlue(), 127);
	ellipse(width/2, height-100, h);
}

// Function that randomly pops bubbles who've lived longer than 30 seconds
function popBubble() {
	let randomIndex = Math.floor(random(0,myBubbles.length));
	if(Date.now() - myBubbles[randomIndex].ts >= 30000 && Math.round(random())){
		myBubbles.splice(randomIndex, 1);
	}
}

//This part of the sketch is inspired by the sketch by Joanne Martin on 27 February,2022 for IDEA9201 to demonstrate the use of the Circle class.
//Which was originally based upon the exercise "Creating Classes" https://happycoding.io/tutorials/p5js/creating-classes and "Array of Objects" https://editor.p5js.org/p5/sketches/Objects:_Objects_Array.
class Bubbles {
	constructor(id, xPos, yPos, diameter, xSpeed, ySpeed, color, ts) {
	  this.id = id;
	  this.xPos = xPos;
	  this.yPos = yPos;
	  this.diameter = diameter;
	  this.xSpeed = xSpeed;
	  this.ySpeed = ySpeed;
	  this.color = color;
	  this.ts = ts;
	}
  
	move() {
	  // move Bubble at X position
	  this.xPos += this.xSpeed;
	  if (this.xPos < this.diameter/2 || this.xPos > width-this.diameter/2) {
		this.xSpeed *= -1;
	  }
  
	  // move Bubble at Y position
	  this.yPos += this.ySpeed;
	  if (this.yPos < this.diameter/2|| this.yPos > height-this.diameter/2) {
		this.ySpeed *= -1;
	  }
	}
  
	display() {
	  //noStroke();
	  stroke(this.color);
	  fill(this.color._getRed(), this.color._getGreen(), this.color._getBlue(), 127);; // all different color
	  ellipse(this.xPos, this.yPos, this.diameter);   
	}
  }


////////////////////////////////////////////////////
// CUSTOMIZABLE SECTION - END: ENTER OUR CODE HERE
////////////////////////////////////////////////////


////////////////////////////////////////////////////
// MQTT MESSAGE HANDLING
////////////////////////////////////////////////////
function setupMqtt() {
	socket = io.connect(HOST);
	socket.on('mqttMessage', receiveMqtt);
}

function receiveMqtt(data) {
	var topic = data[0];
	var message = data[1];

	//Receive message and synthesize data to depict whether a bubble is forming or has finished forming
	if(topic.includes('healthy-bubbles-mqtt') && message === 'end') {
		amplitude = 0;
	} else if (topic.includes('healthy-bubbles-mqtt')) {
		messageSplit = message.split(';');
		amplitude = messageSplit[0].trim();
		colour = color(messageSplit[1].trim());
	}

	//Once amplitude decreases, create new bubble using last maximum amplitude - this creates an effect similar to blowing actual bubbles, where sometimes a lot of little bubbles will release from the blower sequentially
	if(amplitude > 0.001 && amplitude < maxAmp*.8){
		myBubbles.push(new Bubbles(
			myBubbles.length,
			width/2,
			height-100,
			h,
			random(-4, 4),
			random(-4, 4),
			colour,
			Date.now() // ts to determine bubble age
		  ));
		maxAmp = 0;
	} else {
		maxAmp = amplitude;
	}
}
