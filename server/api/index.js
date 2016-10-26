'use strict';

const express = require('express');

const configApi = require('./config');
const itemsApi = require('./items');

module.exports = function createApi(server) {
  const api = express.Router();

  api.use('/config', configApi(server));
  api.use('/items', itemsApi(server));

  return api;
};
