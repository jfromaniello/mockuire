var private = require('./private');
var foo = require('./foo');

function ping() {
  return private.testPing();
}

module.exports.ping = ping;
