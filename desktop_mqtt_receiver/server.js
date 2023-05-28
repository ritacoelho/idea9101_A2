/** Server code from IDEA 9101 Lab 2023 Week 4 Mqtt Receiver Example **/

// Port for the Express web server
var WEB_SERVER_PORT = 3000;
//var OSC_PORT_IN = 12000;

// Import Express and initialise the web server
var express = require("express");
var app = express();
var server = app.listen(WEB_SERVER_PORT);
app.use(express.static("public"));
console.log("Node.js Express server running on port " + WEB_SERVER_PORT);

// Import and configure body-parser for Express
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Import socket.io and create a socket to talk to the client
var socket = require("socket.io");
var io = socket(server);
io.sockets.on("connection", newSocketConnection);

function newSocketConnection(socket) {
	console.log("*** New connection to server web socket " + socket.id);
}

// Import MQTT
var mqtt = require("mqtt");
const mqttHost = "broker.hivemq.com";
const mqttPort = "1883";
const mqttClientId = `mqtt_${Math.random().toString(16).slice(3)}`;
const mqttConnectUrl = `mqtt://${mqttHost}:${mqttPort}`;
var mqttOptions = {
	mqttClientId,
	clean: true,
	connectTimeout: 4000,
	reconnectPeriod: 1000,
};
const mqttClient = mqtt.connect(mqttConnectUrl, mqttOptions);
mqttClient.on("connect", newMqttConnectionSuccess);
mqttClient.on("error", mqttConnectionrError);
mqttClient.on("message", receiveMqttMessage);

function newMqttConnectionSuccess() {
	console.log(
		"*** MQTT connected to host  " +
			mqttHost +
			":" +
			mqttPort +
			"(client id: " +
			mqttClientId +
			")"
	);

	// Subscribe to message
	const topicList = ["end-waste-mqtt"];
	mqttClient.subscribe(topicList, { qos: 1 }, () => {
		console.log(`Subscribed to topics '${topicList}'`);
	});
}

function mqttConnectionrError(error) {
	console.log("Cannot connect to MQTT:" + error);
}

function receiveMqttMessage(topic, message, packet) {
	console.log("topic is " + topic);
	console.log("message is " + message);
	var data = [topic, "" + message];
	io.sockets.emit("mqttMessage", data);
}

// Handles termination of this process, i.e. this is run when
// we type 'Ctrl+C' on the Terminal windoe to close thew server.
process.on("SIGINT", () => {
	console.log("===> SIGINT signal received.");
	mqttClient.end();
	console.log("===> MQTT connection closed.");
	//tcpPort.close();
	console.log("===> OSC connection closed.");
	io.close();
	console.log("===> WebSocket connection closed.");
	console.log("===> Node server exit complete.");
	process.exit(1);
});
