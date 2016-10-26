'use strict';

const argv = require('yargs')
  .boolean('p')
  .describe('p', 'Run a production build')
  .alias('p', 'production')
  .argv;

require('./server/db').init(__dirname + '/test.db')
.then(() => {
  const server = require('http').createServer();
  const EventEmitter = require('events');

  server.wallEventBus = new EventEmitter();

  const app = require('./server/app');
  const WebSocketServer = require('./server/web-socket');

  WebSocketServer(server);

  server.on('request', app(server, argv.production));
  server.listen(8000, function () {
    console.log('Listening on :8000')
  });
})
.catch(e => {
  console.error(e);
  process.exit(1);
});
