This is not a mocking library. 
This module allows you to require a module and pass mocks for its dependencies.

Dependencies that are not passed will be solved normally.

This module uses [vm.runInNewContext](http://nodejs.org/api/all.html#all_vm_runinnewcontext_code_sandbox_filename) and is heavily inspired by this answer in [stackoverflow](http://stackoverflow.com/a/10869838/234047).

## Install

  npm install mockuire

## Usage

Given a file like this one foo.js:

```js
var path = require("path");

module.exports = function(a, b){
    return path.join(a, b, "burbujas");
};
```

then we can test as follows:

```js
  var mockuire = require("mockuire")(module);

  exports["should allow to mock a simple require"] = function (test) {
    var mockedPath = { join: function() { return Array.prototype.slice.call(arguments, 0)} },
        foo = mockuire("./fixture/foo", { path: mockedPath }), 

    var result = foo( "a", "b" );
    
    test.equal( result, "a!b!burbujas" );
  }
```

You have to pass the module in order to fallback to the module require when needed.


## Optional compilers

If your [SUT](http://en.wikipedia.org/wiki/System_under_test) is coffee script don't worry, use this syntax:

```js
var mockuire = require("mockuire")(module, { "coffee": require("coffee-script") });
```

where "coffee" is the extension and the next thing needs to have a compile function.


## Contrib - run tests

  npm test


## License 

[MIT License](http://www.opensource.org/licenses/mit-license.php)