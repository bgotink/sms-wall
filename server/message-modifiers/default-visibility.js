'use strict';

const CONFIG_KEY = 'default_visible';

module.exports = function (configStoreFactory) {
  let defaultVisibility = configStoreFactory.getBoolean(CONFIG_KEY);

  return function setDefaultVisibility(item) {
    return defaultVisibility.value.then((visible) => {
      console.log('Setting visibility to default value', JSON.stringify(visible));
      item.is_visible = !!visible;

      return item;
    });
  };
};
