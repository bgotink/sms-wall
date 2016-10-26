'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const db = require('../db');
const createModifier = require('../message-modifiers')

module.exports = function createItemsApi(server) {
  const itemsApi = express.Router();
  const modifyMessage = createModifier(server);
  const eventBus = server.wallEventBus;

  itemsApi.get('/', function (request, response, next) {
    db.items.getLast()
      .then(function (items) {
        console.log(items);
        response.status(200).json(items).end();
      }, next);
  });

  itemsApi.post('/', [ bodyParser.json(), bodyParser.urlencoded() ], function (request, response, next) {
      const newItem = Object.assign({}, request.body);

      return modifyMessage(newItem)
        .then((newItem) => {
          return db.items.add(newItem)
            .then(() => {
              eventBus.emit('message', newItem);
              response.status(200).end();
            });
        })
        .catch(next);
  });

  itemsApi.all('/:id/hide', function (request, response, next) {
    db.items.hide(request.params)
      .then(function () {
        response.status(200).end();
        eventBus.emit('hide', request.params.id);
      }, next);
  });

  itemsApi.all('/:id/show', function (request, response, next) {
    db.items.show(request.params)
      .then(function () {
        response.status(200).end();
        eventBus.emit('show', request.params.id);
      }, next);
  });

  return itemsApi;
};
