This is not a mocking library. 
This module allows you to require a module and pass mocks for its dependencies.

Dependencies that are not passed will be solved normally.

This module uses [vm.runInNewContext](http://nodejs.org/api/all.html#all_vm_runinnewcontext_code_sandbox_filename) and is heavily inspired by this answer in [stackoverflow answer](http://stackoverflow.com/a/10869838/234047).

## Install

  npm install mockuire

## Usage

Given a file like this one `foo.js`:

```js
var path = require("path");

module.exports = function(a, b){
    return path.join(a, b, "burbujas");
};
```

then we can test as follows:

```js
  var mockuire = require("mockuire")(module);

  exports.test = function (test) {
    //this is the "mock" of the module path 
    var mockedPath = { 
      join: function() { 
          return Array.prototype.slice.call(arguments, 0).join("!"); 
        } 
      };

    //now I "mockuire" the module under test with the mocked path
    var foo = mockuire("./fixture/foo", { path: mockedPath });
    
    //let's see if it works:
    result = foo( "a", "b" );
    
    test.equal( result, "a!b!burbujas" );
  }
```

You have to pass the module in order to fallback to the module require when needed.

## Private members
Two new methods will be added to the instance returned by mockuire.

Given a file like `private.js`:
```js
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
```
### method: _private_get(name)
It allows you to get the value of a private variable:
```js
it ('should be able to get value of a private evariable', function() {
  var mockuire = require("mockuire")(module);
  var private = mockuire("./fixture/private");

  assert.equal(private._private_get('count'), 1);
});
```

### method: _private_set(name, value)
It allows you to set the value of a private variable:
```js
it ('should be able to get value of a private evariable', function() {
  var mockuire = require("mockuire")(module);
  var private = mockuire("./fixture/private");

  private._private_set('count', 10);
  assert.equal(private.inc(), 11);
});
```

You can also set private members in the same moment you pass mocks for its dependencies
```js
it('should be able to set value of a private evariable', function() {
  var mockuire = require("../lib/index")(module);
  var mocks = {};
  var props = {
    count: 100
  };
  var private = mockuire("./fixture/private", mocks, props);
  assert.equal(private.inc(), 101);
  });
```

### method: _private_fn(name, [mock])
It allows you to get a reference to a private function:
```js
it('should be able to get and invoke a private function', function() {
  var mockuire = require("mockuire")(module);
  var private = mockuire("./fixture/private");

  var ping = private._private_fn('ping');
  assert.equal(typeof ping, 'function');
  assert.equal(ping(), 'pong');
});
```

You can also set a mock function:
```js
function helloWorld() {
  return "Hello world!";
}

var mockuire = require("mockuire")(module);
var private = mockuire("./fixture/private");
var pingMocked = private._private_fn('ping', helloWorld);

it('mocked function should invoke the mock function', function() {
  assert.equal(pingMocked(), 'Hello world!');
});

it ('module\'s functions should invoke mock function', function() {
  assert.equal(private.testPing(), 'Hello world!');
});

it('mocked function has a \'func\' property pointing to the original function', function() {
  assert.equal(pingMocked.func(), 'pong');
});

// mocked function has a method to reset to the original function.
pingMocked.reset();

it('mocked function should be replaced by the original one.', function() {
  assert.equal(pingMocked(), 'pong');
});

it ('module\'s functions should invoke the original function', function() {
  assert.equal(private.testPing(), 'pong');
});

```

## Contrib - run tests

  npm test

## News
### v2.0.0
  1. Friendly with modules of code coverage, like istanbul.

## Breaking changes

### Changes for 2.x

  1.  Does not accept compilers on constructor. The version 2.x relies on the infrastrucuture of nodejs in order to load and compile a module.



## License 

[MIT License](http://www.opensource.org/licenses/mit-license.php)
