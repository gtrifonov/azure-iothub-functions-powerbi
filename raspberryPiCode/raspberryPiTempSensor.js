
var GrovePi = require('node-grovepi').GrovePi
const readline = require('readline');

var Commands = GrovePi.commands;
var Board = GrovePi.board;
var DHTDigitalSensor = GrovePi.sensors.DHTDigital;

console.log('Init board');
//Example: HostName=MyIOTHub.azure-devices.net;DeviceId=MyRaspberryPI;SharedAccessKey=11111111111111111111111111111/M/xv/777777TM=
var connectionString = '[Connection string to Azure IOT HUB]';

// use factory function from AMQP-specific package
var clientFromConnectionString = require('azure-iot-device-amqp').clientFromConnectionString;

// AMQP-specific factory function returns Client object from core package
var client = clientFromConnectionString(connectionString);

// use Message object from core package
var Message = require('azure-iot-device').Message;

//Sending messages when we connected
var connected = false;

var connectCallback = function (err) {
    if (err) {
        console.error('Could not connect: ' + err);
        connected = false;
    } else {
        console.log('Client connected');
        //Reconnect on disconect
        client.on('disconnect', function () {
            client.removeAllListeners();
            client.open(connectCallback);
            connected = true;
        });
        connected = true;
    };
};
client.open(connectCallback);


const board = new Board({
    debug: true,
    onError: function (err) {
        console.log('Something wrong just happened')
        console.log(err)
    },
    onInit: function (res) {
        console.log('DHT Digital Sensor (start watch)')
        const dhtSensor = new DHTDigitalSensor(3, 0, DHTDigitalSensor.CELSIUS);

        dhtSensor.on('change', function (res) {
            console.log('DHT onChange value=' + res);
            //Sending messages when we connected
            if (connected) {
                const data = JSON.stringify({ deviceId: 'raspberryPI', measures: res });
                const msg = new Message(data);
                client.sendEvent(msg, function (err) {
                    if (err) {
                        console.log(err.toString());
                    } else {
                        console.log('Message sent');
                    };
                });
            }
        });
        dhtSensor.watch(1000); // milliseconds 
    }
});

board.init();



