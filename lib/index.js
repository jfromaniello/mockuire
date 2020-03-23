var vm = require("vm");
var fs = require("fs");
var os = require("os");
var path = require("path");
var Module = require('module');
var cache = {};

module.exports = function(caller) {

  //get the compiled content of the file
  function tryGetContent(file, filePath) {
    var content = cache[file];
    if (content) {
      return content;
    }

    // if module was already required, then we should remove
    // it from the require's cache in order to capture its contents
    var path = require.resolve(file);
    delete require.cache[path];

    // intercepts wrap method in order to get the content of the module.
    var wrap = Module.wrap;
    Module.wrap = function() {
      content = arguments[0];
      var result = wrap.apply(this, arguments);
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
    // add original code
    var src = originalSrc + os.EOL +

    // inject mockuire's functions
    _private_set.toString() + os.EOL +
    _private_get.toString() + os.EOL +
    _private_fn.toString() + os.EOL +
    _get_path.toString() + os.EOL +
    _set_path.toString() + os.EOL +
    "module.exports._private_get = _private_get;" + os.EOL +
    "module.exports._private_set = _private_set;" + os.EOL +
    "module.exports._private_fn  = _private_fn;"  + os.EOL +
    os.EOL;

    // set all properties
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

    //full path to the file we want to load
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
          __filename: fileToLoad + (fileToLoad.slice(-2) !== '.js' ? '.js' : ''),
          process : process
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

// ============================================================================================================
// Following functions will be injected into the module's code by the prepareSource function

function _private_set(name, value) {
  if (Array.isArray(name)) {
    return _set_path(name, value);
  }

  var valueStr;
  if (typeof value === 'function') {
    valueStr = __props[name];
  } else {
    valueStr = JSON.stringify(value);
  }
  eval(name + ' = ' + valueStr);
}

function _private_get(name) {
  if (Array.isArray(name)) {
    return _get_path(name);
  }
  return eval(name);
}

function _private_fn(name, mock) {
  if (!name || (typeof name !== 'string' && !Array.isArray(name))) throw new Error('\'name\' argument should be a valid function name.');
  if (mock && typeof mock !== 'function') throw new Error('\'mock\' argument must be a function.');
  
  // get current private function
  var func = Array.isArray(name) ? _get_path(name) : eval(name);
  if (typeof func !== 'function') throw new Error('\'' + name + '\' is not a function.');
  if (!mock) return func;

  // Assign mock function creating a proxy function wrapping the mock
  var original = func;
  var current = mock;

  // create a proxy function
  function proxy() {
    return current.apply(null, arguments);
  }

  // Add a reset function to the proxy function. It will undo to original behavior.
  proxy.reset = function() {
    if (Array.isArray(name)) {
      _set_path(name, original);
    } else {
      eval(name + ' = original');
    }
    current = original;
  };

  // Add a prop with the original funciton to the proxy.
  proxy.func = func;

  // Assign proxy as the new funciton's behaviour
  if (Array.isArray(name)) {
    _set_path(name, proxy);
  } else {
    eval(name + ' = proxy');
  }

  // Return proxy funciton
  return proxy;
}

// it will go throught all props returning undefined if any prop does not exist or the value of the latest prop
function _get_path(props) {

  function getPropValue(obj, name) {
    try {
      return obj[name];
    } catch(e) {
      return undefined;
    }
  }

  return props.reduce(function(current, prop, index) {
    return index === 0 ? _private_get(props[0]) : getPropValue(current, prop);
  }, undefined);
};

function _set_path(props, value) {

  function setPropValue(parent, name, value, lastProp) {
    var current;
    if (parent) {
      current = parent[name];
      if (lastProp || current === null || current === undefined) {
        parent[name] = lastProp ? value : {};
        current = parent[name];
      }
    } else {
      current = _private_get(name);
      if (lastProp || current === null || current === undefined) {
        _private_set(name, lastProp ? value : {});
        current = _private_get(name);
      }
    }
    return current;
  }

  return props.reduce(function(current, prop, index) {
    var lastProp = index === props.length - 1;
    return setPropValue(current, prop, value, lastProp);
  }, null);
};
