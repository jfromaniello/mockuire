var count = 1;
var obj = { 
  a: { 
    x: 1,
    test: function() { return false; }
  }
};

function ping() {
  return 'pong';
}

module.exports.inc = function() {
  return ++count;
};

module.exports.testPing = function() {
  return ping();
}

module.exports.getObj = function() {
  return obj;
}