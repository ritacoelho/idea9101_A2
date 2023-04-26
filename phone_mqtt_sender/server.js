/** Server code from IDEA 9101 Lab 2023 Week 4 Mqtt Sender Example **/

// Port for the Express web server
var PORT = 3300;



// Import Express and initialise the web server
var express = require('express');
var app = express();
var server = app.listen(PORT);
app.use(express.static('public'));
console.log('Node.js Express server running on port ' + PORT);

// Import and configure body-parser for Express
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

// Import MQTT
var mqtt=require('mqtt');
const mqttHost = 'broker.hivemq.com'
const mqttPort = '1883'
const mqttClientId = `mqtt_${Math.random().toString(16).slice(3)}`
const mqttConnectUrl = `mqtt://${mqttHost}:${mqttPort}`
var mqttOptions = {
  mqttClientId,
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 1000,
};
const mqttClient = mqtt.connect(mqttConnectUrl, mqttOptions);
mqttClient.on("connect", newMqttConnectionSuccess);
mqttClient.on("error", mqttConnectionrError);

function newMqttConnectionSuccess() {
    console.log('*** MQTT connected to host  ' + mqttHost + ':' + mqttPort + '(client id: ' + mqttClientId + ')');
}

function mqttConnectionrError(error) {
    console.log("Cannot connect to MQTT:" + error);
}


// Handle POST requests
app.post('/sendMessage', function(request, response) {
	var message = request.body.message;

	// console.log("POST received: address: " + address + ", value: " + value);

    var mqttTopic = 'healthy-bubbles-mqtt';
	sendMQTT(mqttTopic, message);
    response.end("");
});

// Handle POST requests
app.post('/sendEndMessage', function(request, response) {
	var message = request.body.message;

	// console.log("POST received: address: " + address + ", value: " + value);

    var mqttTopic = 'healthy-bubbles-mqtt';
	sendMQTT(mqttTopic, message);
    response.end("");
});


// Send MQTT messages
function sendMQTT(topic, message) {
    var options={
        retain:true,
        qos:0
    };

    if (mqttClient.connected) {
        mqttClient.publish(topic, message, options);
    }
    console.log("##### MQTT message posted to topic: " + topic);
}


// Handles termination of this process, i.e. this is run when 
// we type 'Ctrl+C' on the Terminal windoe to close thew server.
process.on('SIGINT', () => {
  console.log('===> SIGINT signal received.');
  mqttClient.end();
  console.log('===> MQTT connection closed.');
  console.log('===> Node server exit complete.');
  process.exit(1);
});


