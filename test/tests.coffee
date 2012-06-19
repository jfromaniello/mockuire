path = require "path"

describe "mockuire", ->
  it "should allow to mock a simple require", ->
    mocker = require("../src/index.coffee")(module)
    foo = mocker "./fixture/foo", 
            "path": 
              "join": (parts...) -> parts.join("!") 
    
    result = foo("a","b")

    result.should.be.eql "a!b!burbujas"

  it "should use caller requires", ->
    mocker = require("../src/index.coffee")({
      filename: module.filename,
      require: (m) -> { join: (parts...)-> parts.join("!") }
    })

    foo = mocker "./fixture/foo", {}
    
    result = foo("a","b")

    result.should.be.eql "a!b!burbujas"

  it "should allow compilers", ->
    mocker = require("../src/index.coffee")(module, "coffee": require "coffee-script")

    bar = mocker "./fixture/bar", 
            "path": 
              "join": (parts...) -> parts.join("!") 
    
    result = bar("a","b")

    result.should.be.eql "a!b!burbujas"

  it "should fail when it doesnt find the file", ->
    mocker = require("../src/index.coffee")(module)
    ( -> mocker "./notexist", {} ).should.throw("Cannot find module './notexist'")
