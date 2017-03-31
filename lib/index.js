const vm = require("vm");
const fs = require("fs");
const os = require("os");
const path = require("path");
const resolve = require('resolve');
const Module = require('module');
const cache = {};

module.exports = function(caller) {

  //get the compiled content of the file
  function tryGetContent(file, filePath) {
    var content = cache[file];
    if (content) {
      return content;
    }

    // if module was already required, then we should remove
    // it from the require's cache in order to capture its contents
    var path = resolve.sync(file);
    delete require.cache[path];

    // intercepts wrap method in order to get the content of the module.
    const wrap = Module.wrap;
    Module.wrap = function() {
      content = arguments[0];
      const result = wrap.apply(this, arguments);
      // restore orignal wrap function
      Module.wrap = wrap;
      return result;
    }

    // require module
    require(file);

    // add content to local cache.
    cache[file] = content;
    return content;
  }

  function prepareSource(context, originalSrc, props) {
    var src = originalSrc + os.EOL +

    "module.exports._private_set = function _prop_set(name, value) {" + os.EOL +
    "  var valueStr;" + os.EOL +
    "  if (typeof value === 'function') {" + os.EOL +
    "    valueStr = __props[' + name +'];" + os.EOL +
    "  } else {" + os.EOL +
    "    valueStr = JSON.stringify(value);" + os.EOL +
    "  }" + os.EOL +
    "  eval(name + ' = ' + valueStr);" + os.EOL +
    "}" + os.EOL +

    "module.exports._private_get = function _prop_get(name) {" + os.EOL +
    "  return eval(name);" + os.EOL +
    "}" + os.EOL +

    "module.exports._private_fn = function _fn(name, mock) {" + os.EOL +
    "  if (!name || typeof name !== 'string') throw new Error('\\'name\\' argument should be a valid function name.');" + os.EOL +
    "  var func = eval(name);" + os.EOL +
    "  if (typeof func !== 'function') throw new Error('\\'' + name + '\\' is not a function.');" + os.EOL +
    "  if (!mock) return func;" + os.EOL +
    "  if (typeof mock !== 'function') throw new Error('\\'mock\\' argument must be a function.');" + os.EOL +
    "  var original = func;" + os.EOL +
    "  var current = mock;" + os.EOL +
    "  function proxy() {" + os.EOL +
    "    return current.apply(null, arguments);" + os.EOL +
    "  }" + os.EOL +
    "  proxy.reset = function() {" + os.EOL +
    "    eval(name+ ' = original');" + os.EOL +
    "    current = original;" + os.EOL +
    "  };" + os.EOL +
    "  proxy.func = func;" + os.EOL +
    "  eval(name+ ' = proxy');" + os.EOL +
    "  return proxy;" + os.EOL +
    "}" + os.EOL +
    os.EOL;

    Object.keys(props || {})
    .forEach(function(key) {
      var value = props[key];
      var valueStr;
      if (typeof value === 'function') {
        valueStr = '__props["' + key +'"]';
      } else {
        valueStr = JSON.stringify(value);
      }

      src += key + ' = ' + valueStr + ';' + os.EOL;
    });

    return src;
  }

  //result function that serve to create an image of the module
  //with mocked dependencies
  var mockuire = function(filePath, mocks, props) {

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
          __props: props,
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

    var content = tryGetContent(fileToLoad, filePath);
    var src = prepareSource(context, content, props);
    vm.runInNewContext(src, context);

    return context.module.exports;
  };

  return mockuire;
};
