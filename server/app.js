'use strict';

const express = require('express');
const historyFallback = require('express-history-api-fallback');
const path = require('path');

const api = require('./api');

const WWW_ROOT = path.resolve(__dirname, '../www');

module.exports = function createApp(server, production) {
  const app = express();

  app.use(function (req, res, next) {
    console.log(req.method, req.path, req.headers['content-type'], req.params);

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
  });

  if (production) {
    console.log('Configuring production build');

    app.use(express.static(path.join(WWW_ROOT, 'dist')));

    app.use(historyFallback('index.html', { root: path.join(WWW_ROOT, 'dist') }));
  } else {
    console.log('Configuring development build');

    app.use(express.static(path.join(WWW_ROOT, '.tmp')));
    app.use(express.static(path.join(WWW_ROOT, 'app')));

    app.use(historyFallback('index.html', { root: path.join(WWW_ROOT, 'app') }));
  }

  app.use('/api', api(server));

  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.end(err && err.stack ? err.stack : err);
  });

  return app;
}
