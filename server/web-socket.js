'use strict';

const WebSocketServer = require('ws').Server;
const db = require('./db');

module.exports = function (server) {
  const wss = new WebSocketServer({ server: server });

  const sockets = [];

  function sendMessageToAll(type) {
    return function (content) {
      const message = JSON.stringify({ type, content });
      console.log('Sending message to all:', message);

      sockets.forEach(function (ws, i) {
        try {
          console.log('Sending message to ', i);
          ws.send(message);
        } catch (e) {
          console.error(e);
        }
      });
    };
  }

  function sendMessageToAllButSource(type, content, source) {
    const message = JSON.stringify({ type, content });

    return function () {
      sockets.forEach((ws, i) => {
        if (ws === source) {
          console.log('skipping source', i);
          return;
        }

        console.log('sending msg to', i);
        ws.send(message);
      });
    };
  }

  server.wallEventBus.on('message', sendMessageToAll('new-message'));
  server.wallEventBus.on('hide', sendMessageToAll('hide'));
  server.wallEventBus.on('show', sendMessageToAll('show'));
  server.wallEventBus.on('set-config', sendMessageToAll('set-config'));

  const messageHandlers = Object.freeze({
    visibility(data, source) {
      if (data.visible) {
        return db.items.show(data)
          .then(sendMessageToAll('show')(data.id));
      } else {
        return db.items.hide(data)
          .then(sendMessageToAll('hide')(data.id));
      }
    },
  });

  wss.on('connection', function (ws) {
    sockets.push(ws);

    function sendError(e) {
      console.log(e);
      ws.send(JSON.stringify({
        type: 'error',
        content: e && e.message ? e.message : e
      }));
    }

    ws.on('message', function (msg) {
      try {
        const message = JSON.parse(msg);

        if (!message.type) {
          throw new Error(`Unknown message format: ${msg}`);
        }

        if (!messageHandlers[message.type]) {
          throw new Error(`Cannot handle ${message.type} messages`);
        }

        messageHandlers[message.type](message.content, ws)
          .catch(sendError);

      } catch (e) {
        sendError(e);
      }
    });

    ws.on('close', function () {
      const i = sockets.indexOf(ws);

      if (i !== -1) {
        sockets.splice(i, 1);
      }
    });
  });

  return wss;
}
