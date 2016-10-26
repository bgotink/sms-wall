(function(document) {
  'use strict';

  var app = document.querySelector('#app');
  app.baseUrl = '/';

  app.toast = function showToast(message) {
    app.$.toast.text = message;
    app.$.toast.show();
  };

  app.hideToast = function () {
    app.$.toast.hide()
  };

  app.webSocketUrl = (function () {
    const parser = document.createElement('a');
    parser.href = document.location.href;

    parser.pathname = '/';
    parser.protocol = 'ws:';

    return parser.href;
  })();

  var messageHandlers = {
    error: app.toast,

    'new-message': function (data) {
      app.unshift('items', data);
    },

    show: function (id) {
      var idx = app.items.findIndex(function (item) {
        return item.id === +id;
      });

      if (idx !== -1) {
        app.set(`items.${idx}.is_visible`, true);
      }
    },

    hide: function (id) {
      var idx = app.items.findIndex(function (item) {
        return item.id === +id;
      });

      if (idx !== -1) {
        app.set(`items.${idx}.is_visible`, false);
      }
    },

    'set-config': function (cfg) {
      if (cfg.key === 'phone_number') {
        app.phoneNumber = cfg.value;
      }
    },
  };

  app.sendToSocket = function sendToSocket(e) {
    app.$.socket.send(e.detail);
  };

  app.onSocketMessage = function addMessage(e) {
    var data = e.detail.data;

    if (messageHandlers[data.type]) {
      messageHandlers[data.type](data.content);
    } else {
      console.warn('Unknown socket message type: ', data.type, data);
    }
  };

  app.goHome = function () {
    app.set('route.path', '/');
  };

  app.goToAdmin = function () {
    app.set('route.path', '/admin/messages');
  };

  app.sendAdminMessage = function (e) {
    (document.createElement('iron-request')).send({
      url: '/api/items',
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: {
        content: e.detail,
        sender: 'admin',
        is_admin: true
      },
    });
  };

})(document);
