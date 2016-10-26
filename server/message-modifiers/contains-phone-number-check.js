'use strict';

const db = require('../db');

const ENABLED_KEY = 'contains_phone_number_check_enabled';
const ALLOW_OWN_NUMBER_KEY = 'contains_phone_number_check__allow_own_number';

const PHONE_NUMBER_REGEX = /(?:(?:\+|0[\s\.]*0[\s\.]*)3[\s\.]*2[\s\.]*|0[\s\.]*)4[\s\.]*([789])[\s\.]*(\d)[\s\.\/]*(\d)[\s\.]*(\d)[\s\.]*(\d)[\s\.]*(\d)[\s\.]*(\d)[\s\.]*(\d)/g;

module.exports = function (configStoreFactory) {
  const enabled = configStoreFactory.getBoolean(ENABLED_KEY);
  const allowOwnNumber = configStoreFactory.getBoolean(ALLOW_OWN_NUMBER_KEY);

  return function containsPhoneNumberCheck(item){
    return enabled.value.then((enabled) => {
      if (!enabled || item.is_admin) {
        return item;
      }

      return allowOwnNumber.value.then((allowOwnNumber) => {
        console.log('Checking for phone numbers in content');

        item.content = item.content.replace(PHONE_NUMBER_REGEX, (match, c1, c2, c3, c4, c5, c6, c7, c8) => {
          let phone_number = '+324' + c1 + c2 + c3 + c4 + c5 + c6 + c7 + c8;

          if (phone_number !== item.sender){
            console.log('Found an other phone numbers in content, replacing it!');
            item.contains_phone_number = true;
            return `04XX/XX XX X${c8}`;
          } else if (!allowOwnNumber) {
            console.log('Found sender\'s phone number, but replacing it anyway');
            return `04XX/XX XX X${c8}`;
          } else {
            console.log('Found senders phone numbers in content, NOT replacing it!');
            return match;
          }
        });

        return item;
      });
    });
  };
};
