vm = require("vm")
fs = require("fs")
path = require("path")


module.exports = (caller, compilers = {})-> 
  extensions = 
    "js": (content) -> content
  
  extensions[cext] = compilers[cext].compile for cext of compilers

  tryGetContent = (file, filePath) ->
    for ext of extensions
      try
        return extensions[ext] fs.readFileSync("#{file}.#{ext}").toString() 
      catch error
    
    throw new Error("Cannot find module '#{filePath}'")

  (filePath, mocks) ->
    mocks = mocks or {}
    fileToLoad = path.resolve path.dirname(caller.filename), filePath

    req = req or require
    resolveModule = (module) ->
      return module  if module.charAt(0) isnt "."
      path.resolve path.dirname(fileToLoad), module

    exports = {}
    context =
      require: (name) ->
        mocks[name] or caller.require(resolveModule(name))

      console: console
      exports: exports
      module:
        exports: exports

    context[key] = global[key] for key of global when not(key of context)

    vm.runInNewContext tryGetContent(fileToLoad, filePath), context
    context.module.exports