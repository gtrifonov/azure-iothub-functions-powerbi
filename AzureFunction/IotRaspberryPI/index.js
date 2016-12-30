var request = require('request');

//Get formatted current time
function getDateString() {
    const nowDate = new Date();
    return nowDate.toISOString()
}

module.exports = function (context, myEventHubTrigger) {
    const powerBIUri = '[PowerBI API endpoint]';
    /* Example of incommming message
      var myEventHubTrigger =
      {
          device: "pi1",
          measures:[1,2,3]
      };
      */

    //If some fields are missing we are skippping
    if (!myEventHubTrigger.measures || !myEventHubTrigger.measures.length || myEventHubTrigger.measures.length < 3
        || isNaN(myEventHubTrigger.measures[0]) || isNaN(myEventHubTrigger.measures[1]) || isNaN(myEventHubTrigger.measures[2])) {
        context.log("Invalid message format", error);
        context.done();
        return;
    }
    const temp = myEventHubTrigger.measures[0];
    const humidity = myEventHubTrigger.measures[1];
    const heatIndex = myEventHubTrigger.measures[2];

    // Droppping messages on invalid sensor data, sometimes happens with my board
    if (temp > 300 || temp < 300 || humidity > 100 || humidity < 0) {
        context.log("False sensor reading. Dropping message");
        context.done();
        return;
    }

    // Format of message defined in PowerBI data stream
    const PowerBiRequestBody = [
        {
            "temp": temp,
            "humidity": humidity,
            "heatindex": heatIndex,
            "timestamp": getDateString()
        }
    ];

    const requestBody = {};
    var requestOptions = {
        method: "POST",
        body: JSON.stringify(PowerBiRequestBody),
        headers: { "content-type": "application/json" }
    };

    context.log('Sending request to PowerBI', requestOptions);

    request(powerBIUri, requestOptions, function (error, response, body) {
        // This callback function will never be called
        if (error) {
            context.log("Error processing request", error);
        }

        context.log("Response Status Code", response.statusCode, body);
        if (!error && response.statusCode == 200) {
            context.log("Succesfull response from PowerBi", body);
        } else {
            context.log("PowerBI error processing request", response.statusCode, body);
        }
        context.log('JavaScript eventhub trigger function processed work item', myEventHubTrigger);

        context.done();
    });

};