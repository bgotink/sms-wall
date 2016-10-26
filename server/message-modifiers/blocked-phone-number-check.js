'use strict';

const db = require('../db');

const ENABLED_KEY = 'blocked_phone_number_check_enabled';

module.exports = function (configStoreFactory) {
  let enabled = configStoreFactory.getBoolean(ENABLED_KEY);

  return function blockedPhoneNumberCheck(item) {
    return enabled.value.then((enabled) => {
      if (!enabled || item.is_admin) {
        return item;
      }

      console.log('Checking for blocked phone numbers');
      return db.config.isPhoneNumberBlocked(item.sender)
        .then((rows) => {
          if (rows.length > 0) {
            console.log('Found blocked phone number');
            item.is_visible = false;
            item.sent_from_blocked_phone_number = true;
          }

          return item;
        });
    });
  };
};
