var vm = require("vm"),
    fs = require("fs"),
    path = require("path");


module.exports = function(caller, compilers) {
  var extCompilers = {"js": function(content) { return content; } };

  //add the compilers parameters
  if(compilers){
    Object.keys(compilers).forEach(function(cext){
      extCompilers[cext] = compilers[cext].compile;
    });
  }

  //get the compiled content of the file
  function tryGetContent(file, filePath) {
    var ext;
    for (ext in extCompilers) {
      try {
        return extCompilers[ext](fs.readFileSync(file + "." + ext).toString());
      } catch (error) {}
    }
    throw new Error("Cannot find module '" + filePath + "'");
  }

  //result function that serve to create an image of the module
  //with mocked dependencies
  return function(filePath, mocks) {

    //full path toe the file we want to load
    var fileToLoad = path.resolve(path.dirname(caller.filename), filePath);


    //require a module using the caller require method
    //if the module has a relative path,
    //we have to convert it to caller relative.
    function callerRequire(module) {
      var mod = module.charAt(0) !== "." ? module :
                path.resolve(path.dirname(fileToLoad), module);
      return caller.require(mod);
    }

    var exports = {},
        context = {
          require: function(name) {
            //return the required module from the mocks hash
            //if it is not mocked, uses caller require.
            return (mocks || {})[name] || callerRequire(name);
          },
          exports: exports,
          module: {
            exports: exports
          },
          __dirname: path.dirname(fileToLoad),
          __filename: fileToLoad + (fileToLoad.slice(-2) !== '.js' ? '.js' : '')
        };

    //copy the current global values into the new context global values
    Object.keys(global)
          .filter( function(g){
            return !(g in context);
          })
          .forEach(function(g){
            context[g] = global[g];
          });

    vm.runInNewContext(tryGetContent(fileToLoad, filePath), context);

    return context.module.exports;
  };
};
