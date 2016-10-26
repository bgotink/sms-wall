'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const db = require('../db');

module.exports = function createConfigApi(server) {
  const eventBus = server.wallEventBus;
  const configApi = express.Router();

  configApi.get('/:key', function (request, response, next) {
    console.log('Getting config for', request.params.key);
    return db.config.get(request.params.key)
      .then(function (value) {
        if (value == undefined) {
          response.status(404).end(`Unknown config key: ${request.params.key}`);
        }

        response.status(200).json(value).end();
      })
      .catch(next);
  });

  configApi.post('/:key', [ bodyParser.json(), bodyParser.urlencoded() ], function (request, response, next) {
    console.log(JSON.stringify(request.body.value));
    db.config.set(request.params.key, request.body.value)
      .then(function () {
        response.status(200).end();
        eventBus.emit('set-config', { key: request.params.key, value: request.body.value });
      })
      .catch(next);
  });

  return configApi;
};
