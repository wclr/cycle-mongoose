'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeMongooseDriver = exports.makeGetResponse = undefined;

var _cycleAsyncDriver = require('cycle-async-driver');

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var turnObjectToCall = function turnObjectToCall(context, obj) {
  var method = Object.keys(obj)[0];
  if (typeof context[method] !== 'function') {
    throw new Error('Object has no method ' + method);
  }
  var args = Array.isArray(obj[method]) ? obj[method] : [obj[method]];
  return context[method].apply(context, args);
};

var makeGetResponse = exports.makeGetResponse = function makeGetResponse(db) {
  return function (request, cb) {
    var modelName = request.Model || request.model;
    var Model = undefined;
    if (typeof modelName == 'string') {
      Model = db.model(modelName);
    } else {
      modelName = '';
      Model = modelName;
    }

    if (!Model) {
      throw Error('Unknown model ' + modelName);
    }

    var requestQuery = request.query || request.exec;
    var queryChain = undefined;

    if ((typeof requestQuery === 'undefined' ? 'undefined' : _typeof(requestQuery)) === 'object') {
      if (!Array.isArray(requestQuery)) {
        requestQuery = [requestQuery];
      }
      queryChain = requestQuery.reduce(turnObjectToCall, Model);
    } else if (typeof requestQuery === 'function') {
      queryChain = requestQuery.call(null, Model);
    }

    if (queryChain) {
      if (queryChain.then) {
        return queryChain;
      } else if (typeof queryChain.exec === 'function') {
        queryChain.exec();
      } else {
        throw Error('Request for model ' + modelName + ' contains illegal chain query');
      }
    }

    var cbMethod = Object.keys(request).filter(function (key) {
      return typeof Model[key] === 'function';
    })[0];

    if (cbMethod) {
      var cbObj = _defineProperty({}, cbMethod, [].concat(request[cbMethod]).concat(cb));
      return turnObjectToCall(Model, cbObj);
    }

    throw new Error('Request for model ' + modelName + ' does not contain valid instructions');
  };
};

var makeMongooseDriver = exports.makeMongooseDriver = function makeMongooseDriver(db, options) {
  if (typeof db === 'string') {
    db = _mongoose2.default.createConnection(db, options);
  } else if (!db || typeof db.model !== 'function') {
    throw new Error('You should provide either url with' + 'connection options, or already created connection object');
  }

  return (0, _cycleAsyncDriver.makeAsyncDriver)(makeGetResponse(db));
};