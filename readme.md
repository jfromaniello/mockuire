This is not a mocking library. 
This module allows you to require a module and pass mocks for its dependencies in node.js.
Dependencies that are not passed will be solved normally.

This module uses [vm.runInNewContext](http://nodejs.org/api/all.html#all_vm_runinnewcontext_code_sandbox_filename) and is heavily inspired by this answer in [stackoverflow](http://stackoverflow.com/a/10869838/234047).

## Usage

```foo.js
var path = require("path");

module.exports = function(a, b){
    return path.join(a, b, "burbujas");
};
```

Then we can test as follows:

```test.js
  var mockuire = require("mockuire")(module);

  exports["should allow to mock a simple require"] = function (test) {
    var mockedPath = { join: function() { return Array.prototype.slice.call(arguments, 0)} },
        foo = loadWrap("./fixture/foo", { path: mockedPath }), 

    var result = foo( "a", "b" );
    
    test.equal( result, "a!b!burbujas" );
  }
```

You have to pass the module in order to fallback to the module require when needed.


## My system under test is .coffee

Don't worry, use this syntax:

```js
var mockuire = require("mockuire")(module, {"coffee": require("coffee-script")});
```

where ".coffee" is the extension and the next thing needs to have a compile function.


## Contrib - run tests

  npm test


## License 

[MIT License](http://www.opensource.org/licenses/mit-license.php)