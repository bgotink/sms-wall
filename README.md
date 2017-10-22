# SMS Wall
## Features
Our program can receive messages from post requests and shows them nicely on the screen. An admin page is for seen to allow some configuration and some censoring of the received messages.
The following automatic censoring can be turned on:

-Block certain phone numbers which are known to send a lot of spam

-Messages with certain words in them

-Filter out phone numbers sent in the messages. (Unless it is the user own number)

Admin phone numbers can also be configured. If this number texts a message it is also shown in a special color and shown unfiltered on the screen.

## Known issues
You are unable to add words or blocked phone numbers at run time. At the moment the can only be added in the initialization of the database.

## Setup
1) ON{X} on a android phone with the simcard which is receiving the text messages. See script needed below.
2) A computer connected to a project/big screen which runs the server.
3) [OPTIONAL] An extra computer which can connect over the network to the server to change the configuration or remove/post messages. (You can also just use the server for this.)
**NOTE** The server is unprotected. Anyone who knows the ip address and port number can connect to it! Best is to establish a secure network between server and computer

## Installation

```
yarn
(cd www && bower install)
```

## Running

A development build (TODO: browsersync):

```
npm run staging
```

A production build:

```
npm run production
```
## receiving text messages
install on{x} www.onx.ms
Make a recipe with following code; (Don't forget to change the ip address)

title
```
{
    "title": "When I receive a sms, post it on server {0}",
    "icons":["sms", "wifi"],
    "variables": [
        {"name": "server", "type": "string", "value": "192.168.1.5"}
    ]
}
```
code
```
// register to smsRecieved event

device.messaging.on('smsReceived', function (sms) {

console.log('sms received from', sms.from, 'with the following body:', sms.body);

   var totalserver = 'http://' + server +':8000/api/items';
   device.ajax(
   {
     url: totalserver,
     type: 'POST',
     dataType: 'json',
     headers: {
       'Content-Type': 'application/json'
     },
     data: JSON.stringify({
         'sender': sms.from,
         'content': sms.body
     })
   },
   function onSuccess(body, textStatus, response) {
     console.info('successfully received http response!');
   },
   function onError(textStatus, response) {
     var error = {};
     console.info('Did NOT receive http response!');
     error.message = textStatus;
     error.statusCode = response.status;
       console.error('error: ',error);
   });
});
```
## Features still to add

-Add a view to the admin page which shows some statistics like how many message were sent etc.

-Show on the admin page which content checker found something in the message

-Add a button the admin page to easily (un)block phone numbers

-Send the user a message back when his phone number is blocked
