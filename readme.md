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
var data = {
  foo: { x: 10 },
  someFn: function() { return false; }

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

module.exports.cloneFoo = function() {
  return Object.assign({}, data.foo);
};

module.exports.invoke = function() {
  return data.someFn();
};

```
### method: _private_get(name)
It allows you to get the value of a private variable:
 * name (Array|string): The path of the property to get.

```js
it ('should be able to get value of a private evariable', function() {
  var mockuire = require("mockuire")(module);
  var private = mockuire("./fixture/private");

  assert.equal(private._private_get('count'), 1);
  assert.equal(private._private_get(['data', 'foo', 'x']), 10);
});
```

### method: _private_set(name, value)
It allows you to set the value of a private variable:
 * name (Array|string): The path of the property to get.

```js
it ('should be able to get value of a private evariable', function() {
  var mockuire = require("mockuire")(module);
  var private = mockuire("./fixture/private");

  private._private_set('count', 10);
  assert.equal(private.inc(), 11);

  private._private_set(['data', 'foo', 'x'], 20);
  assert.equal(private.cloneFoo().x, 20);
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
 * name (Array|string): The path of the property to get.

```js
it('should be able to get and invoke a private function', function() {
  var mockuire = require("mockuire")(module);
  var private = mockuire("./fixture/private");

  var ping = private._private_fn('ping');
  assert.equal(typeof ping, 'function');
  assert.equal(ping(), 'pong');


  var fn = private._private_fn(['data', 'someFn']);
  assert.equal(fn(), false);
});
```

You can also set a mock function:
```js
function helloWorld() {
  return "Hello world!";
}

function alwaysTrue() {
  return true;
}

var mockuire = require("mockuire")(module);
var private = mockuire("./fixture/private");
var pingMocked = private._private_fn('ping', helloWorld);
var someFnMocked = private._private_fn(['data', 'someFn'], alwaysTrue);

it('mocked function should invoke the mock function', function() {
  assert.equal(pingMocked(), 'Hello world!');
  assert.equal(someFnMocked(), true);
});

it ('module\'s functions should invoke mock function', function() {
  assert.equal(private.testPing(), 'Hello world!');
  assert.equal(private.invoke(), true);
});

it('mocked function has a \'func\' property pointing to the original function', function() {
  assert.equal(pingMocked.func(), 'pong');
  assert.equal(someFnMocked.func(), false);
});

// mocked function has a method to reset to the original function.
pingMocked.reset();
someFnMocked.reset();

it('mocked function should be replaced by the original one.', function() {
  assert.equal(pingMocked(), 'pong');
  assert.equal(someFnMocked(), false);
});

it ('module\'s functions should invoke the original function', function() {
  assert.equal(private.testPing(), 'pong');
  assert.equal(private.invoke(), false);
});

```

## Contrib - run tests

  npm test

## News
### v2.1.0
  1. Support for setting and getting inner props added.
  1. Dependency to `resolve` module removed.
  1. Resolution of module's path improved.

### v2.0.0
  1. Friendly with modules of code coverage, like istanbul.

## Breaking changes

### Changes for 2.x

  1.  Does not accept compilers on constructor. The version 2.x relies on the infrastrucuture of nodejs in order to load and compile a module.



## License 

[MIT License](http://www.opensource.org/licenses/mit-license.php)
