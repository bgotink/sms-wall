'use strict';

const db = require('../db');

const ENABLED_KEY = 'admin_phone_number_check_enabled';

module.exports = function (configStoreFactory) {
  let enabled = configStoreFactory.getBoolean(ENABLED_KEY);

  return function adminPhoneNumberCheck(item) {
    return enabled.value.then((enabled) => {
      if (!enabled) {
        return item;
      }

      if (item.sender === 'admin') {
        item.is_visible = true;
        item.is_admin = true;
        return item;
      }

      return db.config.isPhoneNumberAdmin(item.sender)
        .then((rows) => {
          if (rows.length) {
            item.is_visible = true;
            item.is_admin = true;
            item.sent_from_admin_phone_number = true;
          } else {
            item.is_admin = false;
          }

          return item;
        });
    });
  };
};
