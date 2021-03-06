//Example: HostName=MyIOTHub.azure-devices.net;DeviceId=MyRaspberryPI;SharedAccessKey=11111111111111111111111111111/M/xv/777777TM=
const connectionString = '[Connection string to Azure IOT HUB]';


/* Uncomment this block if you want redirect console logs to file
const fs = require('fs');
const options = {
    flags: 'a',
    defaultEncoding: 'utf8',
    fd: null,
    mode: 0o666,
    autoClose: true
};
var access = fs.createWriteStream('/home/pi/pi_sensor.access.log', options)
var error = fs.createWriteStream('/home/pi/pi_sensor.error.log', options);
// redirect stdout / stderr
process.stdout.write = access.write.bind(access);
process.stderr.write = error.write.bind(error);

*/

const GrovePi = require('node-grovepi').GrovePi
const Commands = GrovePi.commands;
const Board = GrovePi.board;
const DHTDigitalSensor = GrovePi.sensors.DHTDigital;

console.log('Init board');
// use factory function from AMQP-specific package
const clientFromConnectionString = require('azure-iot-device-amqp').clientFromConnectionString;

// AMQP-specific factory function returns Client object from core package
const client = clientFromConnectionString(connectionString);

// use Message object from core package
const Message = require('azure-iot-device').Message;

// Helper function to print results in the console
function printResultFor(op) {
    return function printResult(err, res) {
        if (err) console.log(op + ' error: ' + err.toString());
        if (res) console.log(op + ' status: ' + res.constructor.name);
    };
}

//Sending messages when we connected
var connected = false;
var conectedAttempts = 0;
var connectCallback = function (err) {
    conectedAttempts++;
    if (err) {
        console.error('Could not connect: ' + err + ' Attempt:' + conectedAttempts);
        setTimeout(function () { // set a timer for 60 second to try connect again
            client.removeAllListeners();
            client.open(connectCallback);
        }, 60000);

    } else {
        console.log('Client connected');
        connected = true;
        conectedAttempts = 0;

        client.on('message', function (msg) {
            console.log('Id: ' + msg.messageId + ' Body: ' + msg.data);
            client.complete(msg, printResultFor('completed'));
        });

        client.on('reject', function (msg) {
            console.log('Id: ' + msg.messageId + ' Body: ' + msg.data);
            client.complete(msg, printResultFor('reject'));
            // /!\ reject and abandon are not available with MQTT
        });

        client.on('abandon', function (msg) {
            console.log('Id: ' + msg.messageId + ' Body: ' + msg.data);
            client.complete(msg, printResultFor('abandon'));
            // /!\ reject and abandon are not available with MQTT
        });

        // error event
        client.on('error', function (err) {
            console.error(err.message);
        });

        // disconnect event
        client.on('disconnect', function () {
            console.log('Disconect');
            client.removeAllListeners();
            client.open(connectCallback);
        });

    };
};
client.open(connectCallback);


var boardInitAttempts = 0;
const board = new Board({
    debug: true,
    onError: function (err) {
        console.еrror('Something wrong just happened with a board: ' + err);
        boardInitAttempts++;
        if (boardInitAttempts < 10) {
            setTimeout(function () { // set a timer for 5 second to try init again
                if (board) {
                    board.init();
                }
            }, 5000);
        } else {
            console.error("Exceeding board init attempts quota. Exiting ...");
            process.removeAllListeners();
            process.exit(1);
        }
    },
    onInit: function (res) {
        console.log('DHT Digital Sensor (start watch)');
        const dhtSensor = new DHTDigitalSensor(3, 0, DHTDigitalSensor.CELSIUS);

        dhtSensor.on('change', function (res) {
            console.log('DHT onChange value=' + res);
            //Sending messages even if we are not connected
            if (res) {
                 const nowd = new Date();
                const data = JSON.stringify({ deviceId: 'raspberryPI', measures: res, timestamp: nowd.toISOString() });
                const msg = new Message(data);
                console.log('Sending message: ' + message.getData());
                client.sendEvent(message, printResultFor('send'));
            } 
        });
        // FYI: there are 86400 seconds in a day. Azure Iot Hub limit for free tier is 8000 messages
        // Setting watch not to exceed message limit for free tier
        dhtSensor.watch(15000); // milliseconds 
    }
});

board.init();



