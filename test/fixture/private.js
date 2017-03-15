var count = 1;

function ping() {
  return 'pong';
}

module.exports.inc = function() {
  return ++count;
};

module.exports.testPing = function() {
  return ping();
}