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


## Optional compilers

If your [SUT](http://en.wikipedia.org/wiki/System_under_test) is coffee script use this syntax:

```js
var mockuire = require("mockuire")(module, { "coffee": require("coffee-script") });
```

where "coffee" is the extension and the next thing needs to have a compile function.

## Private members
Two new methods will be added to the instance returned by mockuire.

Given a file like `private.js`:
```js
var count = 1;

module.exports.inc = function() {
  return ++count;
};
```
###method: _private_get(name)###
It allows you to get the value of a private variable:
```js
it ('should be able to get value of a private evariable', function() {
  var mockuire = require("mockuire")(module);
  var private = mockuire("./fixture/private");

  assert.equal(private._private_get('count'), 1);
});
```

###method: _private_set(name, value)###
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
## Contrib - run tests

  npm test


## License 

[MIT License](http://www.opensource.org/licenses/mit-license.php)
