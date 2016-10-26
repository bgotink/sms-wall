'use strict';

const db = require('../db');

const ENABLED_KEY = 'word_check_enabled';

module.exports = function (configStoreFactory) {
  let enabled = configStoreFactory.getBoolean(ENABLED_KEY);

  return function wordCheck(item){
    return enabled.value.then((enabled) => {
      if (!enabled || item.is_admin) {
        return item;
      }

      console.log('Checking for blocked words');
      return db.config.isWordBlocked(item.content)
        .then(function (rows){
          if (rows.length > 0) {
            console.log('Found blocked word');
            item.is_visible = false;
            item.contains_blocked_word = rows.slice(0,3).join(',')
            console.log('Found following blocked words' + item.contains_blocked_word);
          }

          return item;
        });
    });
  }
};
