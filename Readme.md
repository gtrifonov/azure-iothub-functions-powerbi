# Interactive IOT dashboards using Azure IotHub, Azure Functions and PowerBI

This repository contains source code from the blog post "Interactive IOT dashboards using Azure IotHub, Azure Functions and PowerBI".
There are two projects in repository:
* AzureFunction - contains project to locally debug and deploy to azure Function
* raspberryPiCode - project to be deployed to RaspberryPI with GrovePI hat for reading temperature/humidity sensor data

## Folder raspberryPiCode
In my example i am using GroovePI development board to get quick access to sensors without soldering or additional wiring.
Code in a project assume that GrovePI installed and configured.

### Hardware pre-requisites
* RaspberryPI 2 or above
* [GrovePI development board](https://www.dexterindustries.com/grovepi/)
* Temperature/Humidity sensor DHT11 connected to digital port #3

### Software pre-requisites
* Raspbian(used in article) or any other operating system capable running Node.js.
* Node.js
* npm
* GrovePI board software libraries installed
* git


### Installing and running example in RaspBerry PI
Once you configured your hardware and software run following commands.

To download source code to your Raspberry PI.

```shell
git clone  http://github.com/gtrifonov/azure-iothub-functions-powerbi
```

Install dependency libraries

```shell
cd gtrifonov/azure-iothub-functions-powerbi
npm install
```

Once all required packages installed to communicate with IoTHub and access sensor data  you need to open file piSensor.js
and change line below  with IotHub connection string value.

```javascript
string var connectionString = '[Connection string to Azure IOT HUB]';
```

## Folder AzureFunction

AzureFunction folder contains project to run azure functions and debug it localy in Visual Studio Code under Windows operating system.
Function code located in file \azure-iothub-functions-powerbi\AzureFunction\IotRaspberryPI\index.js, but you need to make sure that function settings contains element  'HUB' with
Azure Iot Hub connnection string and file \azure-iothub-functions-powerbi\AzureFunction\IotRaspberryPI\function.json is modified to have appropriate value 'path'.

Below are instructions how to initilized azure function project locally and debug if it is working before deploying it to azure.


Go to Azure Portal and create Azure Function <NameOfAzureFuncApp>. In App settings create a value 'HUB' which will contain a connection string to your IOTHUB.

See [Running Azure Functions Locally with the CLI and VS Code](https://blogs.msdn.microsoft.com/appserviceteam/2016/12/01/running-azure-functions-locally-with-the-cli/)

On your windows machine clone github repository

```shell
git clone  http://github.com/gtrifonov/azure-iothub-functions-powerbi
cd gtrifonov/azure-iothub-functions-powerbi/AzureFunction
npm install
```

Initilized azure function to add missing configuration files such as appsetting.json which are not part of git repository

```shell
func init
func azure login
func azure account set 
func azure functionapp list
func azure functionapp fetch <NameOfAzureFuncApp>
```

Run commands below to view and decrypt your configuration 

```shell
func settings list -a
func settings decrypt
```

Open file appsettings.json and verify that it has entry 'HUB' with connection string to Azure IOT HUB

Open file \AzureFunction\IotRaspberryPI\function.json and modify value below with appropriate endpouint path information

```javascript
"path": "[Event Hub-compatible name from AzurePortal IoTHUB endpoint properties]"
```

To debug that function working locally run code below and attach VS Code debugger to Azure function process

```shell
func run .\IotRaspberryPI\ -c "{ device: \"pi1\", measures:[1,2,3]}" --debug
```