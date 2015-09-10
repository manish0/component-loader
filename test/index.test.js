var assert = require('assert')
  , sinon = require('sinon')
  , componentLoader = require('../')

function noop () {}

describe('component-loader', function () {

  it('should load components in the correct order', function (done) {

    var componentOneSpy = sinon.stub()
      , componentTwoSpy
      , componentThreeSpy
      , components

    componentOneSpy.callsArg(1)
    function componentOne () {
      return { componentOne: [ 'componentThree', componentOneSpy ] }
    }

    componentTwoSpy = sinon.stub()
    componentTwoSpy.callsArg(1)
    function componentTwo () {
      return { componentTwo: [ 'componentOne', componentTwoSpy ] }
    }

    componentThreeSpy = sinon.stub()
    componentThreeSpy.callsArg(1)
    function componentThree () {
      return { componentThree: componentThreeSpy }
    }

    components = [ componentOne, componentTwo, componentThree ]

    componentLoader(components
    , function (loadFn) {
        return loadFn.bind(null, 'Hello')
      }
    , function (error) {
        assert.equal(error, null, 'error should not exist')
        assert.equal(componentOneSpy.callCount, 1)
        assert.equal(componentOneSpy.calledWith('Hello'), true)
        assert.equal(componentTwoSpy.callCount, 1)
        assert.equal(componentTwoSpy.calledWith('Hello'), true)
        assert.equal(componentThreeSpy.callCount, 1)
        assert.equal(componentThreeSpy.calledWith('Hello'), true)
        sinon.assert.callOrder(componentThreeSpy, componentOneSpy, componentTwoSpy)
        done()
      }
    )
  })

  it('should throw error if component is already loaded', function () {

    function componentOne () {
      return { componentOne: [ 'componentThree', noop ] }
    }
    function componentTwo () {
      return { componentOne: [ 'componentOne', noop ] }
    }

    var components = [ componentOne, componentTwo ]

    assert.throws(function () {
      componentLoader(components
      , function (loadFn) {
          return loadFn.bind(null, 'Hello')
        }
      , noop
      )
    }, /Component with name "componentOne" already loaded/)
  })

  it('should throw error if components are missing', function () {

    function componentOne () {
      return { componentOne: [ 'componentThree', noop ] }
    }
    function componentTwo () {
      return { componentTwo: [ 'componentFour', noop ] }
    }

    var components = [ componentOne, componentTwo ]

    assert.throws(function () {
      componentLoader(components
      , function (loadFn) {
          return loadFn.bind(null, 'Hello')
        }
      , noop
      )
    }, /Missing dependencies: componentThree, componentFour/)
  })

  it('should throw error if there are circular dependencies', function () {

    function componentOne () {
      return { componentOne: [ 'componentTwo', noop ] }
    }
    function componentTwo () {
      return { componentTwo: [ 'componentOne', 'componentThree', noop ] }
    }
    function componentThree () {
      return { componentThree: [ 'componentTwo', noop ] }
    }

    var components = [ componentOne, componentTwo, componentThree ]

    assert.throws(function () {
      componentLoader(components
      , function (loadFn) {
          return loadFn.bind(null, 'Hello')
        }
      , noop
      )
    }, /Circular dependencies: componentTwo and componentOne. componentThree and componentTwo/)
  })

})
