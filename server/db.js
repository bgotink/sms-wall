'use strict';

const sqlite = require('sqlite3');
const slice = Array.prototype.slice;

const fs = require('fs');
const path = require('path');
const through = require('through2');
const split = require('split2');

let db;

function run(query) {
  const params = slice.call(arguments, 1);
  console.log('SQL run', query, params);
  return new Promise(function(resolve, reject) {
    db.run(query, params, function (err) {
      if (err) {
        return reject(err);
      }

      resolve({
        lastID: this.lastID,
        changes: this.changes
      });
    });
  });
}

function get(query) {
  const params = slice.call(arguments, 1);
  console.log('SQL get', query, params);
  return new Promise(function(resolve, reject) {
    db.get(query, params, function (err, row) {
      if (err) {
        return reject(err);
      }

      resolve(row);
    });
  });
}

function getAll(query) {
  const params = slice.call(arguments, 1);
  console.log('SQL all', query, params);
  return new Promise(function(resolve, reject) {
    db.all(query, params, function (err, rows) {
      if (err) {
        return reject(err);
      }

      resolve(rows);
    });
  });
}

exports.init = function initDb(dbpath) {
  db = new sqlite.Database(dbpath);

  return Promise.all([
    run(`CREATE TABLE IF NOT EXISTS wall_config(
      key VARCHAR PRIMARY KEY NOT NULL,
      value VARCHAR
    )`).then(() => {
      // Putting some default config into the db
      return exports.config.get('phone_number').then(function (row){
        if (!row){
          return Promise.all([
            exports.config.set('phone_number', '000000000'),
            exports.config.set('default_visible', '1'),
            exports.config.set('word_check_enabled', '0'),
            exports.config.set('contains_newline_check_enabled', '0'),
            exports.config.set('blocked_phone_number_check_enabled', '0'),
            exports.config.set('contains_phone_number_check_enabled', '0'),
            exports.config.set('contains_phone_number_check__allow_own_number', '0'),
            exports.config.set('admin_phone_number_check_enabled', '0')
          ]);
        }
      });
    }),
    run(`CREATE TABLE IF NOT EXISTS wall_items(
      id INTEGER PRIMARY KEY NOT NULL,
      content VARCHAR NOT NULL,
      is_admin BOOL NOT NULL,
      is_visible BOOL NOT NULL,
      sender VARCHAR,
      timestamp DATETIME NOT NULL,
      contains_phone_number BOOL DEFAULT 0,
      contains_blocked_word VARCHAR,
      contains_newline BOOL DEFAULT 0,
      sent_from_blocked_phone_number BOOL DEFAULT 0,
      sent_from_admin_phone_number BOOL DEFAULT 0
    )`)
      .then(_ => {
        return run(`CREATE INDEX IF NOT EXISTS wall_items_by_date on wall_items(
          timestamp DESC
        )`);
      }),
      run('DROP TABLE IF EXISTS wall_blocked_phone_numbers')
      .then(function () {
        return run(`CREATE TABLE wall_blocked_phone_numbers(
          phone_number VARCHAR PRIMARY KEY NOT NULL
        )`);
      }).then(function (){
          const promises = [];

          return new Promise(function(resolve, reject) {
            fs.createReadStream(path.join(__dirname, 'message-modifiers/blocked-phone-numbers-database.txt'))
              .pipe(split())
              .pipe(through(function (line, _, cb) {
                line = String(line).trim();

                if (line.length) {
                  promises.push(run('INSERT OR IGNORE INTO wall_blocked_phone_numbers(phone_number) VALUES (?)', line));
                }

                cb(null);
              }, resolve))
              .on('error', reject);
          })
          .then(() => {
            console.log('Waiting on queries...');
            return Promise.all(promises);
        });
    }),
    run('DROP TABLE IF EXISTS wall_admin_phone_numbers')
    .then(function () {
      return run(`CREATE TABLE wall_admin_phone_numbers(
        phone_number VARCHAR PRIMARY KEY NOT NULL
      )`);
    }).then(function (){
          const promises = [];

          return new Promise(function(resolve, reject) {
            fs.createReadStream(path.join(__dirname, 'message-modifiers/admin-phone-numbers-database.txt'))
              .pipe(split())
              .pipe(through(function (line, _, cb) {
                line = String(line).trim();

                if (line.length) {
                  promises.push(run('INSERT OR IGNORE INTO wall_admin_phone_numbers(phone_number) VALUES (?)', line));
                }

                cb(null);
              }, resolve))
              .on('error', reject);
          })
          .then(() => {
            console.log('Waiting on queries...');
            return Promise.all(promises);
        });
    }),
    run('DROP TABLE IF EXISTS wall_blocked_words')
    .then(function () {
      return run(`CREATE TABLE wall_blocked_words(
        word VARCHAR PRIMARY KEY NOT NULL
      )`);
    }).then(function (){
          const promises = [];

          return new Promise(function(resolve, reject) {
            fs.createReadStream(path.join(__dirname, 'message-modifiers/word-database.txt'))
              .pipe(split())
              .pipe(through(function (line, _, cb) {
                line = String(line).trim();

                if (line.length) {
                  promises.push(run('INSERT OR IGNORE INTO wall_blocked_words(word) VALUES (?)', line));
                }

                cb(null);
              }, resolve))
              .on('error', reject);
          })
          .then(() => {
            console.log('Waiting on queries...');
            return Promise.all(promises);
        });
    })
  ]);
};

exports.config = {
  get: function (key) {
    return get('SELECT * FROM wall_config WHERE key = ?', key)
      .then(function (row) {
        if (row) {
          return row.value;
        }
      });
  },
  set: function (key, value) {
    return exports.config.get(key).then(
      function (storedValue) {
        if (storedValue != undefined) {
          return run('UPDATE wall_config SET value = ? WHERE key = ?', value, key);
        } else {
          return run('INSERT OR REPLACE INTO wall_config(key, value) VALUES (?, ?)', key, value);
        }
      }
    );
  },

  isWordBlocked: function (content) {
    return getAll(
      'SELECT * FROM wall_blocked_words WHERE LOWER(?) LIKE \'%\' || word || \'%\'', content
    );
  },
  isPhoneNumberBlocked: function (phoneNumber) {
    return getAll(
      'SELECT * FROM wall_blocked_phone_numbers WHERE phone_number IS ?', phoneNumber
    );
  },
  isPhoneNumberAdmin: function (phoneNumber) {
    return getAll(
      'SELECT * FROM wall_admin_phone_numbers WHERE phone_number IS ?', phoneNumber
    );
  },
};

exports.items = {
  add: function (data) {
    return run(
      'INSERT INTO wall_items(content, is_admin, is_visible, sender, timestamp) VALUES (?, ?, ?, ?, ?)',
      data.content,
      data.is_admin = !!data.is_admin,
      data.is_visible = !!data.is_visible,
      data.sender,
      data.timestamp = data.timestamp || new Date()
    ).then(function (result) {
      data.id = result.lastID;

      return data;
    });
  },
  getLast: function (limit) {
    return getAll(
      'SELECT * FROM wall_items ORDER BY timestamp DESC LIMIT ?', limit || 50
    ).then(rows => {
      rows.forEach(row => {
        row.is_visible = !!row.is_visible;
        row.is_admin = !!row.is_admin;
      });

      return rows;
    });
  },
  getAll: function () {
    return getAll('SELECT * FROM wall_items ORDER BY timestamp DESC')
      .then(rows => {
        rows.forEach(row => {
          row.is_visible = !!row.is_visible;
          row.is_admin = !!row.is_admin;
        });

        return rows;
      });
  },

  hide: function (message) {
    return run(
      'UPDATE wall_items SET is_visible = 0 WHERE id = ?', message.id
    );
  },
  show: function (message) {
    return run(
      'UPDATE wall_items SET is_visible = 1 WHERE id = ?', message.id
    );
  },
};
