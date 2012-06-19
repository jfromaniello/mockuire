{exec} = require 'child_process'
REPORTER = "min"

build = (callback) ->
  exec 'mkdir -p lib', (err, stdout, stderr) ->
    throw new Error(err) if err
    exec "coffee --compile --output lib/ src/", (err, stdout, stderr) ->
      throw new Error(err) if err
      callback() if callback

test = (callback) ->
  cp = exec "NODE_ENV=test 
    ./node_modules/.bin/mocha 
    --compilers coffee:coffee-script
    --reporter #{REPORTER}
    --require coffee-script 
    --require should 
    --colors
  ", (err, output) ->
    callback() if callback

  cp.stdout.pipe(process.stdout)
  cp.stderr.pipe(process.stderr)

task 'build', 'Build lib from src', -> build()
task 'test', 'Run tests', -> test()