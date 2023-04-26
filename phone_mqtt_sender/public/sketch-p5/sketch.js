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

let colorPicker;

let mic;
let amp;

// ml5 Face Detection Model
let faceapi;
let detections = [];

// Video
let video;

let isPouting = false;

function setup() {
  createCanvas(windowWidth, windowHeight);

  /** Audio input code from IDEA 9101 Lab 2023 Week 5 Example 4 Amplitude **/
  //create & start an audio input
  mic = new p5.AudioIn();
  mic.start();

  //create an amplitude object that will use mic as input
  amp = new p5.Amplitude();
  amp.setInput(mic);

  background(0);

  var constraints = {
    audio: false,
    video: {
      facingMode: "user"
    }   
  };
  video = createCapture(constraints);

  // ML5 Face API example adapted from https://editor.p5js.org/ima_ml/sketches/fCsz7tb6w
  const faceOptions = { withLandmarks: true, withExpressions: false, withDescriptors: false };
  faceapi = ml5.faceApi(video, faceOptions, faceReady);
  video.hide();

  colorPicker = createColorPicker('#AFDEF5');
  colorPicker.position(width-(height/10), height-(height/10));
  colorPicker.size(height/10);
  colorPicker.class("colorPickerInput");
  colorPicker.style("height", "10%");
  colorPicker.style("border-color", "#392f5a");
  colorPicker.style("background-color", "#392f5a");
  colorPicker.style("margin", "-10px");
}

// Start detecting faces
function faceReady() {
  faceapi.detect(gotFaces);
}

// Got faces
function gotFaces(error, result) {
  if (error) {
    console.log(error);
    return;
  }
  detections = result;
  faceapi.detect(gotFaces);
}

function draw() {
  //Get the level of amplitude of the mic
  let level = amp.getLevel();

  background(255);

  push();
  //Center and scale video playback to suit mobile screen
  let ratio = windowHeight/video.height;
  translate((windowWidth/2)+(video.width*ratio/2), 0);
  scale(-ratio, ratio);
  image(video, 0,0);
  
  noFill();

  //Get points surrounding mouth
  if (detections.length > 0) {
    let points = detections[0].landmarks.getMouth();
    
    //Calculate distance for mouth opening and width
    let mouthOpening = Math.abs(points[14]._y-points[18]._y);
    let mouthWidth = Math.abs(points[0]._x-points[6]._x);
    
    //Determine if person is pouting based on the ratio between opening and width
    let poutRatio = mouthOpening/mouthWidth*100;
    if(poutRatio >= 10 && poutRatio <= 40) {
      isPouting = true;
      sendMessage(level);
    } else if (isPouting === true) {
      isPouting = false;
      sendEndMessage();
    }
    
    //Draw mouth points in red if not pouting, green if pouting so user gets feedback on the correct way to interact
    for (let i = 0; i < points.length; i++) {
      if(isPouting){
        stroke(0,255,0);
      } else {
        stroke(255,0,0);
      }
      //i = 13, 14, 15, 17, 18, 19 inside of mouth indexes
      //i = 0, 6 corners of mouth indexes
      
      strokeWeight(4);
      point(points[i]._x, points[i]._y);
    }
  }
  pop();

  push();

  let blowerRatio = windowHeight/200;
  translate(width/2, height);
  scale(blowerRatio/2, blowerRatio/2);

  //Bubble in blower
  fill(colorPicker.color()._getRed(), colorPicker.color()._getGreen(), colorPicker.color()._getBlue(), 127);
  ellipse(0, -150, 25, 25);

  //Blower piece
  noFill();
  stroke(57,47,90);
  strokeWeight(3);
  ellipse(0, -150, 50, 50);
  ellipse(0, -150, 25, 25);

  //Radial lines in blower piece adapted from https://editor.p5js.org/ebenjmuse/sketches/Sk2uaKN9-
  points = 24 					//number of points 
  pointAngle = 360/points; //angle between points
  radius = 25; 		//length of each line from centre to edge of circle
  
  strokeWeight(2);
  
  for (angle=270;angle<630;angle=angle+pointAngle){
  	x = cos(radians(angle)) * radius; //convert angle to radians for x and y coordinates
  	y = sin(radians(angle)) * radius;
  	line(-25+(x*0.5)+radius, -175+(y*0.5)+radius, -25+x+radius, -175+y+radius); //draw a line from each point back to the centre
	}
  
  //Blower stick
  fill(57,47,90);
  rectMode(CENTER);
  rect(0, -50, 10, 150);
  pop();
}

////////////////////////////////////////////////////
// CUSTOMIZABLE SECTION - END: ENTER OUR CODE HERE
////////////////////////////////////////////////////

/***********************************************************************
  === PLEASE DO NOT CHANGE OR DELETE THIS SECTION ===
  This function sends a MQTT message to server
***********************************************************************/
function sendMessage(level) {
  //message sent with amplitude of voice imput when user is pouting, and currently selected color
  let msgStr = level.toString() + ";" + colorPicker.color().toString();

	let postData = JSON.stringify({ id: 1, 'message': msgStr});

	xmlHttpRequest.open("POST", HOST + '/sendMessage', false);
    xmlHttpRequest.setRequestHeader("Content-Type", "application/json");
	xmlHttpRequest.send(postData);
}

function sendEndMessage() {
  //message sent to let server know this instance of interaction has ended in order for it to create a bubble and prepare for a new one
	let postData = JSON.stringify({ id: 1, 'message': 'end'});

	xmlHttpRequest.open("POST", HOST + '/sendEndMessage', false);
    xmlHttpRequest.setRequestHeader("Content-Type", "application/json");
	xmlHttpRequest.send(postData);
}