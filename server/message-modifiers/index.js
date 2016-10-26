'use strict';

const db = require('../db');

const createDefaultVisibilitySetter = require('./default-visibility');
const createWordChecker = require('./word-check');
const createBlockedPhoneNumberChecker = require('./blocked-phone-number-check');
const createContainsPhoneNumberChecker = require('./contains-phone-number-check');
const createAdminPhoneNumberChecker = require('./admin-phone-number-check');
const createNewLineRemoverChecker = require('./newline-remover-check');

module.exports = function createMessageModifier(server) {
  const eventBus = server.wallEventBus;

  const configStoreFactory = {
    getBoolean(key) {
      let value = db.config.get(key).then((value) => !!+value);

      eventBus.on('set-config', ({ key: k, value: v }) => {
        if (key === k) {
          value = Promise.resolve(v);
        }
      });

      return {
        get value() {
          return value;
        }
      };
    },
  };

  const setDefaultVisibility = createDefaultVisibilitySetter(configStoreFactory);
  const checkWords = createWordChecker(configStoreFactory);
  const checkPhoneNumberBlocked = createBlockedPhoneNumberChecker(configStoreFactory);
  const checkPhoneNumberContains = createContainsPhoneNumberChecker(configStoreFactory);
  const checkAdminPhoneNumber = createAdminPhoneNumberChecker(configStoreFactory);
  const checkNewLine = createNewLineRemoverChecker(configStoreFactory);

  return function modify(item) {
    return setDefaultVisibility(item)
      .then(checkAdminPhoneNumber)
      .then(checkNewLine)
      .then(checkWords)
      .then(checkPhoneNumberBlocked)
      .then(checkPhoneNumberContains);
  };
};
