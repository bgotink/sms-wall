'use strict';

const argv = require('yargs')
  .boolean('p')
  .describe('p', 'Run a production build')
  .alias('p', 'production')

  .string('d')
  .describe('d', 'The relative path to the database file')
  .alias('d', 'database')
  .default('d', __dirname + '/sms-wall.db')
  .argv;

require('./server/db').init(argv.database)
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
