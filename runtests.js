//this file is used by the npm test script to run all the tests in the project.

var exec = require("child_process").exec,
    runTests = "NODE_ENV=test " +
               "    mocha " +
               "    --compilers coffee:coffee-script" +
               "    --reporter min" +
               "    --require coffee-script " +
               "    --require should" +
               "    --globals foo " +
               "    --colors",
    runningTests = exec(runTests);
runningTests.stdout.pipe(process.stdout);
runningTests.stderr.pipe(process.stderr);