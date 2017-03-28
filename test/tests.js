var path = require("path");
var assert = require("assert");

describe("mockuire", function() {
  afterEach(function() {
    delete global.foo;
  });

  it("should allow to mock a simple require", function() {
    var mocker = require("../lib/index")(module),
        foo = mocker("./fixture/foo", {
          "path": {
            "join": function() {
              var parts = 1 <= arguments.length ? [].slice.call(arguments, 0) : [];
              return parts.join("!");
            }
          }
        }),
        result = foo("a", "b");

    result.should.be.eql("a!b!burbujas");
  });

  it("should use caller requires", function() {
    var mocker = require("../lib/index")({
        filename: module.filename,
        require: function(m) {
          return {
            join: function() {
              var parts;
              parts = 1 <= arguments.length ? [].slice.call(arguments, 0) : [];
              return parts.join("!");
            }
          };
        }
      }),
      foo = mocker("./fixture/foo", {}),
      result = foo("a", "b");

    result.should.be.eql("a!b!burbujas");
  });

  it("should allow compilers", function() {
    require("coffee-script");
    var mocker = require("../lib/index")(module),
      bar = mocker("./fixture/bar.coffee", {
        "path": {
          "join": function() {
            var parts;
            parts = 1 <= arguments.length ? [].slice.call(arguments, 0) : [];
            return parts.join("!");
          }
        }
      }),
      result = bar("a", "b");
    result.should.be.eql("a!b!burbujas");
  });

  it("should fail when it doesnt find the file", function() {
    var mocker = require("../lib/index")(module);
    (function() {
      return mocker("./notexist");
    }).should["throw"](/Cannot find module.+notexist/);
  });

  it("should copy globals to sandbox globals", function() {
    global.foo = 1;
    var mocker = require("../lib/index")(module),
      withGlobals = mocker("./fixture/withGlobals", {}),
      result = withGlobals();

    result.should.be.eql(1);
  });

  it('should be able to use __dirname', function () {
    var mockuire = require("../lib/index")(module);

    var dirname = mockuire("./fixture/dirname_filename", {}).dirname();

    dirname.should.be.eql(__dirname + '/fixture');
  });

  it('should be able to use __filename', function () {
    var mockuire = require("../lib/index")(module);

    var filename = mockuire("./fixture/dirname_filename", {}).filename();

    filename.should.be.eql(__dirname + '/fixture/dirname_filename.js');
  });

  describe('private members', function() {
    var mockuire = require("../lib/index")(module);
    var private = mockuire("./fixture/private");

    describe('\'_private_get\' method', function() {
      it ('should exist', function() {
        assert.equal(typeof private._private_get, 'function');
      });

      it ('should be able to get value of a private evariable', function() {
        assert.equal(private._private_get('count'), 1);
      });
    });

    describe('\'_private_fn\' method', function() {

      describe('Getting a private function', function() {

        it('should fail if name argument is not a valid string', function() {
          [ null, undefined, 10, true, {}, [], '', function(){}]
          .forEach(function(invalidName) {
            assert.throws(
              function (){
                private._private_fn(invalidName);
              },
              /should be a valid function name/
            );
          });
        });

        it('should fail if name argument does not reference a function', function() {
          assert.throws(
            function (){
              private._private_fn('count');
            },
            /is not a function/
          );
        });

        it('should be able to get and invoke a private function', function() {
          var ping = private._private_fn('ping');
          assert.equal(typeof ping, 'function');
          assert.equal(ping(), 'pong');
        });
      });

      describe('Mocking a private function' , function() {
        var private;
        var pingMocked;

        function helloWorld() {
          return "Hello world!";
        }

        it('should fail if mock argument is not a function', function() {
          [ 10, true, {}, [], 'foo']
          .forEach(function(notFn) {
            assert.throws(
              function (){
                private._private_fn('ping', notFn);
              },
              /mock/
            );
          });
        });

        before(function () {
          private = mockuire("./fixture/private");
          pingMocked = private._private_fn('ping', helloWorld);
        });

        it('should return a mocked function', function() {
          assert.equal(typeof pingMocked, 'function');
        });

        it('mocked function should invoke the mock function', function() {
          assert.equal(pingMocked(), 'Hello world!');
        });

        it ('module\'s functions should invoke mock function', function() {
          assert.equal(private.testPing(), 'Hello world!');
        });

        describe('Reseting a mocked function', function () {

          it('mocked function should have a reset method', function() {
            assert.equal(typeof pingMocked.reset, 'function');
          });

          describe('When reset method has been invoked.', function() {
            before(function () {
              pingMocked.reset();
            });

            it('mocked function should be replaced by the original one.', function() {
              assert.equal(pingMocked(), 'pong');
            });

            it ('module\'s functions should invoke the original function', function() {
              assert.equal(private.testPing(), 'pong');
            });
          });
        });

        describe('Getting oiginal function', function () {

          it('mocked function should have a property \'func\' referencing the original function', function() {
            assert.equal(typeof pingMocked.func, 'function');
          });

          it('Invoking \'func\' property should invoke the original function', function() {
            assert.equal(pingMocked.func(), 'pong');
          });
        });
      });
    });

    describe('\'_private_set\' method', function() {
      var private = mockuire("./fixture/private");

      it ('should exist', function() {
        assert.equal(typeof private._private_set, 'function');
      });

      it('should be able to set value of a private variable', function() {
        private._private_set('count', 10);
        assert.equal(private.inc(), 11);
      });
    });

    describe('constructor', function() {
      it('should be able to set value of a private variable', function() {
        var props = {
          count: 100
        };
        var private = mockuire("./fixture/private", {}, props);
        assert.equal(private.inc(), 101);
      });
    });
  });
});

