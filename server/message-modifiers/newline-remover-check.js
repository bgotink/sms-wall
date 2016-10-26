'use strict';

const db = require('../db');

const ENABLED_KEY = 'contains_newline_check_enabled';
const NEWLINE_REGEX = /\n/g;

module.exports = function (configStoreFactory) {
  const enabled = configStoreFactory.getBoolean(ENABLED_KEY);

  return function containsnewlineCheck(item){
    return enabled.value.then((enabled) => {
      if (!enabled || item.is_admin) {
        return item;
      }

      console.log('Checking for newlines in content');

      item.content = item.content.replace(NEWLINE_REGEX, (match) => {
        item.contains_newline = true;
        return " ";
      });
      return item;
    });
  };
};
