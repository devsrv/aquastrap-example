/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/@babel/runtime/regenerator/index.js":
/*!**********************************************************!*\
  !*** ./node_modules/@babel/runtime/regenerator/index.js ***!
  \**********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(/*! regenerator-runtime */ "./node_modules/regenerator-runtime/runtime.js");


/***/ }),

/***/ "./node_modules/@nx-js/observer-util/dist/es.es5.js":
/*!**********************************************************!*\
  !*** ./node_modules/@nx-js/observer-util/dist/es.es5.js ***!
  \**********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "observe": () => (/* binding */ observe),
/* harmony export */   "unobserve": () => (/* binding */ unobserve),
/* harmony export */   "observable": () => (/* binding */ observable),
/* harmony export */   "isObservable": () => (/* binding */ isObservable),
/* harmony export */   "raw": () => (/* binding */ raw)
/* harmony export */ });
var connectionStore = new WeakMap();
var ITERATION_KEY = Symbol('iteration key');

function storeObservable(obj) {
  // this will be used to save (obj.key -> reaction) connections later
  connectionStore.set(obj, new Map());
}

function registerReactionForOperation(reaction, ref) {
  var target = ref.target;
  var key = ref.key;
  var type = ref.type;

  if (type === 'iterate') {
    key = ITERATION_KEY;
  }

  var reactionsForObj = connectionStore.get(target);
  var reactionsForKey = reactionsForObj.get(key);
  if (!reactionsForKey) {
    reactionsForKey = new Set();
    reactionsForObj.set(key, reactionsForKey);
  }
  // save the fact that the key is used by the reaction during its current run
  if (!reactionsForKey.has(reaction)) {
    reactionsForKey.add(reaction);
    reaction.cleaners.push(reactionsForKey);
  }
}

function getReactionsForOperation(ref) {
  var target = ref.target;
  var key = ref.key;
  var type = ref.type;

  var reactionsForTarget = connectionStore.get(target);
  var reactionsForKey = new Set();

  if (type === 'clear') {
    reactionsForTarget.forEach(function (_, key) {
      addReactionsForKey(reactionsForKey, reactionsForTarget, key);
    });
  } else {
    addReactionsForKey(reactionsForKey, reactionsForTarget, key);
  }

  if (type === 'add' || type === 'delete' || type === 'clear') {
    var iterationKey = Array.isArray(target) ? 'length' : ITERATION_KEY;
    addReactionsForKey(reactionsForKey, reactionsForTarget, iterationKey);
  }

  return reactionsForKey;
}

function addReactionsForKey(reactionsForKey, reactionsForTarget, key) {
  var reactions = reactionsForTarget.get(key);
  reactions && reactions.forEach(reactionsForKey.add, reactionsForKey);
}

function releaseReaction(reaction) {
  if (reaction.cleaners) {
    reaction.cleaners.forEach(releaseReactionKeyConnection, reaction);
  }
  reaction.cleaners = [];
}

function releaseReactionKeyConnection(reactionsForKey) {
  reactionsForKey.delete(this);
}

// reactions can call each other and form a call stack
var reactionStack = [];
var isDebugging = false;

function runAsReaction(reaction, fn, context, args) {
  // do not build reactive relations, if the reaction is unobserved
  if (reaction.unobserved) {
    return Reflect.apply(fn, context, args);
  }

  // only run the reaction if it is not already in the reaction stack
  // TODO: improve this to allow explicitly recursive reactions
  if (reactionStack.indexOf(reaction) === -1) {
    // release the (obj -> key -> reactions) connections
    // and reset the cleaner connections
    releaseReaction(reaction);

    try {
      // set the reaction as the currently running one
      // this is required so that we can create (observable.prop -> reaction) pairs in the get trap
      reactionStack.push(reaction);
      return Reflect.apply(fn, context, args);
    } finally {
      // always remove the currently running flag from the reaction when it stops execution
      reactionStack.pop();
    }
  }
}

// register the currently running reaction to be queued again on obj.key mutations
function registerRunningReactionForOperation(operation) {
  // get the current reaction from the top of the stack
  var runningReaction = reactionStack[reactionStack.length - 1];
  if (runningReaction) {
    debugOperation(runningReaction, operation);
    registerReactionForOperation(runningReaction, operation);
  }
}

function queueReactionsForOperation(operation) {
  // iterate and queue every reaction, which is triggered by obj.key mutation
  getReactionsForOperation(operation).forEach(queueReaction, operation);
}

function queueReaction(reaction) {
  debugOperation(reaction, this);
  // queue the reaction for later execution or run it immediately
  if (typeof reaction.scheduler === 'function') {
    reaction.scheduler(reaction);
  } else if (typeof reaction.scheduler === 'object') {
    reaction.scheduler.add(reaction);
  } else {
    reaction();
  }
}

function debugOperation(reaction, operation) {
  if (reaction.debugger && !isDebugging) {
    try {
      isDebugging = true;
      reaction.debugger(operation);
    } finally {
      isDebugging = false;
    }
  }
}

function hasRunningReaction() {
  return reactionStack.length > 0;
}

var IS_REACTION = Symbol('is reaction');

function observe(fn, options) {
  if ( options === void 0 ) options = {};

  // wrap the passed function in a reaction, if it is not already one
  var reaction = fn[IS_REACTION] ? fn : function reaction() {
    return runAsReaction(reaction, fn, this, arguments);
  };
  // save the scheduler and debugger on the reaction
  reaction.scheduler = options.scheduler;
  reaction.debugger = options.debugger;
  // save the fact that this is a reaction
  reaction[IS_REACTION] = true;
  // run the reaction once if it is not a lazy one
  if (!options.lazy) {
    reaction();
  }
  return reaction;
}

function unobserve(reaction) {
  // do nothing, if the reaction is already unobserved
  if (!reaction.unobserved) {
    // indicate that the reaction should not be triggered any more
    reaction.unobserved = true;
    // release (obj -> key -> reaction) connections
    releaseReaction(reaction);
  }
  // unschedule the reaction, if it is scheduled
  if (typeof reaction.scheduler === 'object') {
    reaction.scheduler.delete(reaction);
  }
}

var proxyToRaw = new WeakMap();
var rawToProxy = new WeakMap();

var hasOwnProperty = Object.prototype.hasOwnProperty;

function findObservable(obj) {
  var observableObj = rawToProxy.get(obj);
  if (hasRunningReaction() && typeof obj === 'object' && obj !== null) {
    if (observableObj) {
      return observableObj;
    }
    return observable(obj);
  }
  return observableObj || obj;
}

function patchIterator(iterator, isEntries) {
  var originalNext = iterator.next;
  iterator.next = function () {
    var ref = originalNext.call(iterator);
    var done = ref.done;
    var value = ref.value;
    if (!done) {
      if (isEntries) {
        value[1] = findObservable(value[1]);
      } else {
        value = findObservable(value);
      }
    }
    return { done: done, value: value };
  };
  return iterator;
}

var instrumentations = {
  has: function has(key) {
    var target = proxyToRaw.get(this);
    var proto = Reflect.getPrototypeOf(this);
    registerRunningReactionForOperation({ target: target, key: key, type: 'has' });
    return proto.has.apply(target, arguments);
  },
  get: function get(key) {
    var target = proxyToRaw.get(this);
    var proto = Reflect.getPrototypeOf(this);
    registerRunningReactionForOperation({ target: target, key: key, type: 'get' });
    return findObservable(proto.get.apply(target, arguments));
  },
  add: function add(key) {
    var target = proxyToRaw.get(this);
    var proto = Reflect.getPrototypeOf(this);
    var hadKey = proto.has.call(target, key);
    // forward the operation before queueing reactions
    var result = proto.add.apply(target, arguments);
    if (!hadKey) {
      queueReactionsForOperation({ target: target, key: key, value: key, type: 'add' });
    }
    return result;
  },
  set: function set(key, value) {
    var target = proxyToRaw.get(this);
    var proto = Reflect.getPrototypeOf(this);
    var hadKey = proto.has.call(target, key);
    var oldValue = proto.get.call(target, key);
    // forward the operation before queueing reactions
    var result = proto.set.apply(target, arguments);
    if (!hadKey) {
      queueReactionsForOperation({ target: target, key: key, value: value, type: 'add' });
    } else if (value !== oldValue) {
      queueReactionsForOperation({ target: target, key: key, value: value, oldValue: oldValue, type: 'set' });
    }
    return result;
  },
  delete: function delete$1(key) {
    var target = proxyToRaw.get(this);
    var proto = Reflect.getPrototypeOf(this);
    var hadKey = proto.has.call(target, key);
    var oldValue = proto.get ? proto.get.call(target, key) : undefined;
    // forward the operation before queueing reactions
    var result = proto.delete.apply(target, arguments);
    if (hadKey) {
      queueReactionsForOperation({ target: target, key: key, oldValue: oldValue, type: 'delete' });
    }
    return result;
  },
  clear: function clear() {
    var target = proxyToRaw.get(this);
    var proto = Reflect.getPrototypeOf(this);
    var hadItems = target.size !== 0;
    var oldTarget = target instanceof Map ? new Map(target) : new Set(target);
    // forward the operation before queueing reactions
    var result = proto.clear.apply(target, arguments);
    if (hadItems) {
      queueReactionsForOperation({ target: target, oldTarget: oldTarget, type: 'clear' });
    }
    return result;
  },
  forEach: function forEach(cb) {
    var args = [], len = arguments.length - 1;
    while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

    var target = proxyToRaw.get(this);
    var proto = Reflect.getPrototypeOf(this);
    registerRunningReactionForOperation({ target: target, type: 'iterate' });
    // swap out the raw values with their observable pairs
    // before passing them to the callback
    var wrappedCb = function (value) {
      var rest = [], len = arguments.length - 1;
      while ( len-- > 0 ) rest[ len ] = arguments[ len + 1 ];

      return cb.apply(void 0, [ findObservable(value) ].concat( rest ));
    };
    return (ref = proto.forEach).call.apply(ref, [ target, wrappedCb ].concat( args ));
    var ref;
  },
  keys: function keys() {
    var target = proxyToRaw.get(this);
    var proto = Reflect.getPrototypeOf(this);
    registerRunningReactionForOperation({ target: target, type: 'iterate' });
    return proto.keys.apply(target, arguments);
  },
  values: function values() {
    var target = proxyToRaw.get(this);
    var proto = Reflect.getPrototypeOf(this);
    registerRunningReactionForOperation({ target: target, type: 'iterate' });
    var iterator = proto.values.apply(target, arguments);
    return patchIterator(iterator, false);
  },
  entries: function entries() {
    var target = proxyToRaw.get(this);
    var proto = Reflect.getPrototypeOf(this);
    registerRunningReactionForOperation({ target: target, type: 'iterate' });
    var iterator = proto.entries.apply(target, arguments);
    return patchIterator(iterator, true);
  },
  get size() {
    var target = proxyToRaw.get(this);
    var proto = Reflect.getPrototypeOf(this);
    registerRunningReactionForOperation({ target: target, type: 'iterate' });
    return Reflect.get(proto, 'size', target);
  }
};
instrumentations[Symbol.iterator] = function () {
    var target = proxyToRaw.get(this);
    var proto = Reflect.getPrototypeOf(this);
    registerRunningReactionForOperation({ target: target, type: 'iterate' });
    var iterator = proto[Symbol.iterator].apply(target, arguments);
    return patchIterator(iterator, target instanceof Map);
  };

var collectionHandlers = {
  get: function get(target, key, receiver) {
    // instrument methods and property accessors to be reactive
    target = hasOwnProperty.call(instrumentations, key) ? instrumentations : target;
    return Reflect.get(target, key, receiver);
  }
};

// eslint-disable-next-line
var globalObj = typeof window === 'object' ? window : Function('return this')();

// built-in object can not be wrapped by Proxies
// their methods expect the object instance as the 'this' instead of the Proxy wrapper
// complex objects are wrapped with a Proxy of instrumented methods
// which switch the proxy to the raw object and to add reactive wiring
var handlers = new Map([[Map, collectionHandlers], [Set, collectionHandlers], [WeakMap, collectionHandlers], [WeakSet, collectionHandlers], [Object, false], [Array, false], [Int8Array, false], [Uint8Array, false], [Uint8ClampedArray, false], [Int16Array, false], [Uint16Array, false], [Int32Array, false], [Uint32Array, false], [Float32Array, false], [Float64Array, false]]);

function shouldInstrument(ref) {
  var constructor = ref.constructor;

  var isBuiltIn = typeof constructor === 'function' && constructor.name in globalObj && globalObj[constructor.name] === constructor;
  return !isBuiltIn || handlers.has(constructor);
}

function getHandlers(obj) {
  return handlers.get(obj.constructor);
}

var hasOwnProperty$1 = Object.prototype.hasOwnProperty;
var wellKnownSymbols = new Set(Object.getOwnPropertyNames(Symbol).map(function (key) { return Symbol[key]; }).filter(function (value) { return typeof value === 'symbol'; }));

// intercept get operations on observables to know which reaction uses their properties
function get(target, key, receiver) {
  var result = Reflect.get(target, key, receiver);
  // do not register (observable.prop -> reaction) pairs for well known symbols
  // these symbols are frequently retrieved in low level JavaScript under the hood
  if (typeof key === 'symbol' && wellKnownSymbols.has(key)) {
    return result;
  }
  // register and save (observable.prop -> runningReaction)
  registerRunningReactionForOperation({ target: target, key: key, receiver: receiver, type: 'get' });
  // if we are inside a reaction and observable.prop is an object wrap it in an observable too
  // this is needed to intercept property access on that object too (dynamic observable tree)
  var observableResult = rawToProxy.get(result);
  if (hasRunningReaction() && typeof result === 'object' && result !== null) {
    if (observableResult) {
      return observableResult;
    }
    // do not violate the none-configurable none-writable prop get handler invariant
    // fall back to none reactive mode in this case, instead of letting the Proxy throw a TypeError
    var descriptor = Reflect.getOwnPropertyDescriptor(target, key);
    if (!descriptor || !(descriptor.writable === false && descriptor.configurable === false)) {
      return observable(result);
    }
  }
  // otherwise return the observable wrapper if it is already created and cached or the raw object
  return observableResult || result;
}

function has(target, key) {
  var result = Reflect.has(target, key);
  // register and save (observable.prop -> runningReaction)
  registerRunningReactionForOperation({ target: target, key: key, type: 'has' });
  return result;
}

function ownKeys(target) {
  registerRunningReactionForOperation({ target: target, type: 'iterate' });
  return Reflect.ownKeys(target);
}

// intercept set operations on observables to know when to trigger reactions
function set(target, key, value, receiver) {
  // make sure to do not pollute the raw object with observables
  if (typeof value === 'object' && value !== null) {
    value = proxyToRaw.get(value) || value;
  }
  // save if the object had a descriptor for this key
  var hadKey = hasOwnProperty$1.call(target, key);
  // save if the value changed because of this set operation
  var oldValue = target[key];
  // execute the set operation before running any reaction
  var result = Reflect.set(target, key, value, receiver);
  // do not queue reactions if the target of the operation is not the raw receiver
  // (possible because of prototypal inheritance)
  if (target !== proxyToRaw.get(receiver)) {
    return result;
  }
  // queue a reaction if it's a new property or its value changed
  if (!hadKey) {
    queueReactionsForOperation({ target: target, key: key, value: value, receiver: receiver, type: 'add' });
  } else if (value !== oldValue) {
    queueReactionsForOperation({
      target: target,
      key: key,
      value: value,
      oldValue: oldValue,
      receiver: receiver,
      type: 'set'
    });
  }
  return result;
}

function deleteProperty(target, key) {
  // save if the object had the key
  var hadKey = hasOwnProperty$1.call(target, key);
  var oldValue = target[key];
  // execute the delete operation before running any reaction
  var result = Reflect.deleteProperty(target, key);
  // only queue reactions for delete operations which resulted in an actual change
  if (hadKey) {
    queueReactionsForOperation({ target: target, key: key, oldValue: oldValue, type: 'delete' });
  }
  return result;
}

var baseHandlers = { get: get, has: has, ownKeys: ownKeys, set: set, deleteProperty: deleteProperty };

function observable(obj) {
  if ( obj === void 0 ) obj = {};

  // if it is already an observable or it should not be wrapped, return it
  if (proxyToRaw.has(obj) || !shouldInstrument(obj)) {
    return obj;
  }
  // if it already has a cached observable wrapper, return it
  // otherwise create a new observable
  return rawToProxy.get(obj) || createObservable(obj);
}

function createObservable(obj) {
  // if it is a complex built-in object or a normal object, wrap it
  var handlers = getHandlers(obj) || baseHandlers;
  var observable = new Proxy(obj, handlers);
  // save these to switch between the raw object and the wrapped object with ease later
  rawToProxy.set(obj, observable);
  proxyToRaw.set(observable, obj);
  // init basic data structures to save and cleanup later (observable.prop -> reaction) connections
  storeObservable(obj);
  return observable;
}

function isObservable(obj) {
  return proxyToRaw.has(obj);
}

function raw(obj) {
  return proxyToRaw.get(obj) || obj;
}




/***/ }),

/***/ "./resources/js/config.js":
/*!********************************!*\
  !*** ./resources/js/config.js ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "LIFECYCLE_CONFIG_NAME": () => (/* binding */ LIFECYCLE_CONFIG_NAME)
/* harmony export */ });
/* harmony import */ var _helper_types__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./helper/types */ "./resources/js/helper/types.js");
var _LIFECYCLE_CONFIG_NAM;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }


var LIFECYCLE_CONFIG_NAME = (_LIFECYCLE_CONFIG_NAM = {}, _defineProperty(_LIFECYCLE_CONFIG_NAM, _helper_types__WEBPACK_IMPORTED_MODULE_0__.XHREvent.START, 'start'), _defineProperty(_LIFECYCLE_CONFIG_NAM, _helper_types__WEBPACK_IMPORTED_MODULE_0__.XHREvent.SUCCESS, 'success'), _defineProperty(_LIFECYCLE_CONFIG_NAM, _helper_types__WEBPACK_IMPORTED_MODULE_0__.XHREvent.ERROR, 'error'), _defineProperty(_LIFECYCLE_CONFIG_NAM, _helper_types__WEBPACK_IMPORTED_MODULE_0__.XHREvent.FINISH, 'finish'), _defineProperty(_LIFECYCLE_CONFIG_NAM, "notification", 'notification'), _LIFECYCLE_CONFIG_NAM);

/***/ }),

/***/ "./resources/js/core/index.js":
/*!************************************!*\
  !*** ./resources/js/core/index.js ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "_setAquaConfig": () => (/* binding */ _setAquaConfig)
/* harmony export */ });
/* harmony import */ var _helper_util__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./../helper/util */ "./resources/js/helper/util.js");
/* harmony import */ var _helper_types__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./../helper/types */ "./resources/js/helper/types.js");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./../config */ "./resources/js/config.js");
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }




window._aquaCore = {
  createNewComponent: function createNewComponent(id) {
    window._aquastrap.component = [].concat(_toConsumableArray(window._aquastrap.component), [{
      id: id,
      config: {},
      states: []
    }]);
  },
  setComponentMeta: function setComponentMeta(id, _ref) {
    var prop = _ref.prop,
        value = _ref.value;

    var componentIndex = window._aquastrap.component.findIndex(function (c) {
      return c.id === id;
    });

    var componentItem = window._aquastrap.component[componentIndex];
    var modify = null;

    switch (prop) {
      case 'config':
        modify = _objectSpread(_objectSpread({}, componentItem), {}, {
          config: Object.assign({}, componentItem.config, _objectSpread(_objectSpread(_objectSpread(_objectSpread(_objectSpread({}, (0,_helper_util__WEBPACK_IMPORTED_MODULE_0__._hasProperty)(value, _config__WEBPACK_IMPORTED_MODULE_2__.LIFECYCLE_CONFIG_NAME[_helper_types__WEBPACK_IMPORTED_MODULE_1__.XHREvent.START]) && _defineProperty({}, _config__WEBPACK_IMPORTED_MODULE_2__.LIFECYCLE_CONFIG_NAME[_helper_types__WEBPACK_IMPORTED_MODULE_1__.XHREvent.START], value[_config__WEBPACK_IMPORTED_MODULE_2__.LIFECYCLE_CONFIG_NAME[_helper_types__WEBPACK_IMPORTED_MODULE_1__.XHREvent.START]])), (0,_helper_util__WEBPACK_IMPORTED_MODULE_0__._hasProperty)(value, _config__WEBPACK_IMPORTED_MODULE_2__.LIFECYCLE_CONFIG_NAME[_helper_types__WEBPACK_IMPORTED_MODULE_1__.XHREvent.SUCCESS]) && _defineProperty({}, _config__WEBPACK_IMPORTED_MODULE_2__.LIFECYCLE_CONFIG_NAME[_helper_types__WEBPACK_IMPORTED_MODULE_1__.XHREvent.SUCCESS], value[_config__WEBPACK_IMPORTED_MODULE_2__.LIFECYCLE_CONFIG_NAME[_helper_types__WEBPACK_IMPORTED_MODULE_1__.XHREvent.SUCCESS]])), (0,_helper_util__WEBPACK_IMPORTED_MODULE_0__._hasProperty)(value, _config__WEBPACK_IMPORTED_MODULE_2__.LIFECYCLE_CONFIG_NAME[_helper_types__WEBPACK_IMPORTED_MODULE_1__.XHREvent.ERROR]) && _defineProperty({}, _config__WEBPACK_IMPORTED_MODULE_2__.LIFECYCLE_CONFIG_NAME[_helper_types__WEBPACK_IMPORTED_MODULE_1__.XHREvent.ERROR], value[_config__WEBPACK_IMPORTED_MODULE_2__.LIFECYCLE_CONFIG_NAME[_helper_types__WEBPACK_IMPORTED_MODULE_1__.XHREvent.ERROR]])), (0,_helper_util__WEBPACK_IMPORTED_MODULE_0__._hasProperty)(value, _config__WEBPACK_IMPORTED_MODULE_2__.LIFECYCLE_CONFIG_NAME[_helper_types__WEBPACK_IMPORTED_MODULE_1__.XHREvent.FINISH]) && _defineProperty({}, _config__WEBPACK_IMPORTED_MODULE_2__.LIFECYCLE_CONFIG_NAME[_helper_types__WEBPACK_IMPORTED_MODULE_1__.XHREvent.FINISH], value[_config__WEBPACK_IMPORTED_MODULE_2__.LIFECYCLE_CONFIG_NAME[_helper_types__WEBPACK_IMPORTED_MODULE_1__.XHREvent.FINISH]])), (0,_helper_util__WEBPACK_IMPORTED_MODULE_0__._hasProperty)(value, _config__WEBPACK_IMPORTED_MODULE_2__.LIFECYCLE_CONFIG_NAME.notification) && _defineProperty({}, _config__WEBPACK_IMPORTED_MODULE_2__.LIFECYCLE_CONFIG_NAME.notification, value[_config__WEBPACK_IMPORTED_MODULE_2__.LIFECYCLE_CONFIG_NAME.notification])))
        });
        break;

      default:
        break;
    }

    window._aquastrap.component = [].concat(_toConsumableArray(window._aquastrap.component.slice(0, componentIndex)), [modify], _toConsumableArray(window._aquastrap.component.slice(componentIndex + 1)));
  },
  setGlobalConfig: function setGlobalConfig(_ref7) {
    var prop = _ref7.prop,
        value = _ref7.value;

    switch (prop) {
      case 'config':
        window._aquastrap.config = _objectSpread(_objectSpread(_objectSpread(_objectSpread(_objectSpread(_objectSpread({}, window._aquastrap.config), (0,_helper_util__WEBPACK_IMPORTED_MODULE_0__._hasProperty)(value, _config__WEBPACK_IMPORTED_MODULE_2__.LIFECYCLE_CONFIG_NAME[_helper_types__WEBPACK_IMPORTED_MODULE_1__.XHREvent.START]) && _defineProperty({}, _config__WEBPACK_IMPORTED_MODULE_2__.LIFECYCLE_CONFIG_NAME[_helper_types__WEBPACK_IMPORTED_MODULE_1__.XHREvent.START], value[_config__WEBPACK_IMPORTED_MODULE_2__.LIFECYCLE_CONFIG_NAME[_helper_types__WEBPACK_IMPORTED_MODULE_1__.XHREvent.START]])), (0,_helper_util__WEBPACK_IMPORTED_MODULE_0__._hasProperty)(value, _config__WEBPACK_IMPORTED_MODULE_2__.LIFECYCLE_CONFIG_NAME[_helper_types__WEBPACK_IMPORTED_MODULE_1__.XHREvent.SUCCESS]) && _defineProperty({}, _config__WEBPACK_IMPORTED_MODULE_2__.LIFECYCLE_CONFIG_NAME[_helper_types__WEBPACK_IMPORTED_MODULE_1__.XHREvent.SUCCESS], value[_config__WEBPACK_IMPORTED_MODULE_2__.LIFECYCLE_CONFIG_NAME[_helper_types__WEBPACK_IMPORTED_MODULE_1__.XHREvent.SUCCESS]])), (0,_helper_util__WEBPACK_IMPORTED_MODULE_0__._hasProperty)(value, _config__WEBPACK_IMPORTED_MODULE_2__.LIFECYCLE_CONFIG_NAME[_helper_types__WEBPACK_IMPORTED_MODULE_1__.XHREvent.ERROR]) && _defineProperty({}, _config__WEBPACK_IMPORTED_MODULE_2__.LIFECYCLE_CONFIG_NAME[_helper_types__WEBPACK_IMPORTED_MODULE_1__.XHREvent.ERROR], value[_config__WEBPACK_IMPORTED_MODULE_2__.LIFECYCLE_CONFIG_NAME[_helper_types__WEBPACK_IMPORTED_MODULE_1__.XHREvent.ERROR]])), (0,_helper_util__WEBPACK_IMPORTED_MODULE_0__._hasProperty)(value, _config__WEBPACK_IMPORTED_MODULE_2__.LIFECYCLE_CONFIG_NAME[_helper_types__WEBPACK_IMPORTED_MODULE_1__.XHREvent.FINISH]) && _defineProperty({}, _config__WEBPACK_IMPORTED_MODULE_2__.LIFECYCLE_CONFIG_NAME[_helper_types__WEBPACK_IMPORTED_MODULE_1__.XHREvent.FINISH], value[[_config__WEBPACK_IMPORTED_MODULE_2__.LIFECYCLE_CONFIG_NAME[_helper_types__WEBPACK_IMPORTED_MODULE_1__.XHREvent.FINISH]]])), (0,_helper_util__WEBPACK_IMPORTED_MODULE_0__._hasProperty)(value, _config__WEBPACK_IMPORTED_MODULE_2__.LIFECYCLE_CONFIG_NAME.notification) && _defineProperty({}, _config__WEBPACK_IMPORTED_MODULE_2__.LIFECYCLE_CONFIG_NAME.notification, value[_config__WEBPACK_IMPORTED_MODULE_2__.LIFECYCLE_CONFIG_NAME.notification]));
        break;

      default:
        break;
    }
  },

  /**event:  XHREvent: { START | SUCCESS | ERROR | FINISH } | notification */
  resolveLifecycleCallback: function resolveLifecycleCallback(event, id) {
    var componentIndex = window._aquastrap.component.findIndex(function (c) {
      return c.id === id;
    });

    var component = componentIndex !== -1 ? window._aquastrap.component[componentIndex] : undefined;
    var globalConfig = window._aquastrap.config;
    var configProperty = _config__WEBPACK_IMPORTED_MODULE_2__.LIFECYCLE_CONFIG_NAME[event];

    if (component && (0,_helper_util__WEBPACK_IMPORTED_MODULE_0__._hasProperty)(component.config, configProperty) && typeof component.config[configProperty] === 'function') {
      return component.config[configProperty];
    }

    if ((0,_helper_util__WEBPACK_IMPORTED_MODULE_0__._hasProperty)(globalConfig, configProperty)) {
      return globalConfig[configProperty];
    }

    return function () {};
  }
};
function _setAquaConfig(configs) {
  var id = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

  if (!id) {
    _aquaCore.setGlobalConfig({
      prop: 'config',
      value: configs
    });

    return;
  }

  try {
    (0,_helper_util__WEBPACK_IMPORTED_MODULE_0__._findComponentById)(id);
  } catch (error) {
    _aquaCore.createNewComponent(id);
  }

  _aquaCore.setComponentMeta(id, {
    prop: 'config',
    value: configs
  });
}

/***/ }),

/***/ "./resources/js/core/state.js":
/*!************************************!*\
  !*** ./resources/js/core/state.js ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "reactivityManager": () => (/* binding */ reactivityManager),
/* harmony export */   "initialState": () => (/* binding */ initialState),
/* harmony export */   "dispatch": () => (/* binding */ dispatch),
/* harmony export */   "setState": () => (/* binding */ setState)
/* harmony export */ });
/* harmony import */ var _nx_js_observer_util__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @nx-js/observer-util */ "./node_modules/@nx-js/observer-util/dist/es.es5.js");
/* harmony import */ var _helper_util__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./../helper/util */ "./resources/js/helper/util.js");
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }



function reactivityManager(_ref, method) {
  var id = _ref.id,
      key = _ref.key;
  return {
    entity: {
      id: id,
      key: key
    },
    // useful in debugging
    boot: function boot() {
      try {
        var component = (0,_helper_util__WEBPACK_IMPORTED_MODULE_1__._findComponentById)(id);

        if (component) return component;
      } catch (error) {
        _aquaCore.createNewComponent(id);

        return (0,_helper_util__WEBPACK_IMPORTED_MODULE_1__._findComponentById)(id);
      }

      var componentIndex = window._aquastrap.component.findIndex(function (c) {
        return c.id === id;
      });

      if (componentIndex === -1) {
        _aquaCore.createNewComponent(id);

        return window._aquastrap.component.findIndex(function (c) {
          return c.id === id;
        });
      }

      return componentIndex;
    },
    initStates: function initStates() {
      var _this$boot = this.boot(),
          index = _this$boot.index,
          component = _this$boot.component;

      var stateItemIndex = component.states.findIndex(function (s) {
        return s.key === key && s.method === method;
      });

      if (stateItemIndex !== -1) {
        // already exists, skip
        return;
      }

      var modify = _objectSpread(_objectSpread({}, component), {}, {
        states: [].concat(_toConsumableArray(component.states), [{
          key: key,
          method: method,
          state: (0,_nx_js_observer_util__WEBPACK_IMPORTED_MODULE_0__.observable)(_objectSpread({}, initialState))
        }])
      });

      window._aquastrap.component = [].concat(_toConsumableArray(window._aquastrap.component.slice(0, index)), [modify], _toConsumableArray(window._aquastrap.component.slice(index + 1)));
    },
    getStates: function getStates() {
      var _findComponentById2 = (0,_helper_util__WEBPACK_IMPORTED_MODULE_1__._findComponentById)(id),
          index = _findComponentById2.index,
          component = _findComponentById2.component;

      var stateItemIndex = component.states.findIndex(function (s) {
        return s.key === key && s.method === method;
      });

      if (stateItemIndex === -1) {
        console.error('component state missing', this.entity);
        throw new Error('Aquastrap component state not found');
      }

      return component.states[stateItemIndex].state;
    },
    setState: function setState(newState) {
      var currState = this.getStates();

      for (var _i = 0, _Object$entries = Object.entries(newState); _i < _Object$entries.length; _i++) {
        var _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2),
            state = _Object$entries$_i[0],
            value = _Object$entries$_i[1];

        currState[state] = value;
      }
    }
  };
}
var initialState = {
  processing: false,
  result: null,
  statusCode: '',
  errors: {},
  message: '',
  abortController: null,

  get hasValidationError() {
    return !this.processing && Object.keys(this.errors).length > 0;
  }

};

function reducer(action) {
  var payload = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  switch (action) {
    case 'START':
      return Object.assign({}, initialState, {
        processing: true,
        abortController: new AbortController()
      });

    case 'SUCCESS':
      var status = payload.status,
          data = payload.data;
      return {
        statusCode: status,
        result: data,
        errors: status === 422 && (0,_helper_util__WEBPACK_IMPORTED_MODULE_1__._hasProperty)(data, 'errors') ? data.errors : {},
        message: (0,_helper_util__WEBPACK_IMPORTED_MODULE_1__._hasProperty)(data, 'message') ? data.message : ''
      };

    case 'ERROR':
      return {
        message: 'Network Request failed !'
      };

    case 'FINALLY':
      return {
        processing: false
      };

    case 'RESET':
      return _objectSpread({}, initialState);

    case 'RESET_ONLY':
      var item = payload.item;

      if (!(0,_helper_util__WEBPACK_IMPORTED_MODULE_1__._hasProperty)(initialState, item)) {
        throw new Error("invalid state item ".concat(item));
      }

      return _defineProperty({}, item, initialState[item]);

    default:
      throw new Error();
  }
}

function dispatch(_ref3, context, reactivity) {
  var type = _ref3.type,
      payload = _ref3.payload;
  var state = reducer(type, payload);
  setState(reactivity, context, state);
}
function setState(reactivity, context, newState) {
  var currReactiveState = reactivity.getStates();

  for (var _i2 = 0, _Object$entries2 = Object.entries(newState); _i2 < _Object$entries2.length; _i2++) {
    var _Object$entries2$_i = _slicedToArray(_Object$entries2[_i2], 2),
        state = _Object$entries2$_i[0],
        value = _Object$entries2$_i[1];

    context.state[state] = value;
    currReactiveState[state] = value;
  }
}

/***/ }),

/***/ "./resources/js/helper/types.js":
/*!**************************************!*\
  !*** ./resources/js/helper/types.js ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Method": () => (/* binding */ Method),
/* harmony export */   "XHREvent": () => (/* binding */ XHREvent)
/* harmony export */ });
var Method = {
  GET: 'get',
  POST: 'post',
  PUT: 'put',
  PATCH: 'patch',
  DELETE: 'delete'
};
var XHREvent = {
  SUCCESS: 'success',
  ERROR: 'error',
  START: 'start',
  FINISH: 'finish'
};

/***/ }),

/***/ "./resources/js/helper/util.js":
/*!*************************************!*\
  !*** ./resources/js/helper/util.js ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "_hasProperty": () => (/* binding */ _hasProperty),
/* harmony export */   "_findComponentById": () => (/* binding */ _findComponentById),
/* harmony export */   "_hasFiles": () => (/* binding */ _hasFiles),
/* harmony export */   "_objectToFormData": () => (/* binding */ _objectToFormData),
/* harmony export */   "hrefToUrl": () => (/* binding */ hrefToUrl),
/* harmony export */   "_mergeDataIntoQueryString": () => (/* binding */ _mergeDataIntoQueryString),
/* harmony export */   "mimeTypeToExt": () => (/* binding */ mimeTypeToExt)
/* harmony export */ });
/* harmony import */ var _helper_types__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./../helper/types */ "./resources/js/helper/types.js");
/* harmony import */ var qs__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! qs */ "./node_modules/qs/lib/index.js");
/* harmony import */ var qs__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(qs__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var deepmerge__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! deepmerge */ "./node_modules/deepmerge/dist/cjs.js");
/* harmony import */ var deepmerge__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(deepmerge__WEBPACK_IMPORTED_MODULE_2__);
function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }




function _hasProperty(obj, prop) {
  var _has = Object.prototype.hasOwnProperty;
  return _has.call(obj, prop);
}
;
function _findComponentById(id) {
  var componentIndex = window._aquastrap.component.findIndex(function (c) {
    return c.id === id;
  });

  if (componentIndex === -1) {
    // console.error('component not found', {component: id});
    throw new Error('Aquastrap component not found');
  }

  return {
    index: componentIndex,
    component: window._aquastrap.component[componentIndex]
  };
}
function _hasFiles(data) {
  return data instanceof File || data instanceof Blob || data instanceof FileList && data.length > 0 || data instanceof FormData && Array.from(data.values()).some(function (value) {
    return _hasFiles(value);
  }) || _typeof(data) === 'object' && data !== null && Object.values(data).some(function (value) {
    return _hasFiles(value);
  });
}
function _objectToFormData(source) {
  var form = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : new FormData();
  var parentKey = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  source = source || {};

  for (var key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      append(form, composeKey(parentKey, key), source[key]);
    }
  }

  return form;
}

function composeKey(parent, key) {
  return parent ? parent + '[' + key + ']' : key;
}

function append(form, key, value) {
  if (Array.isArray(value)) {
    return Array.from(value.keys()).forEach(function (index) {
      return append(form, composeKey(key, index.toString()), value[index]);
    });
  } else if (value instanceof Date) {
    return form.append(key, value.toISOString());
  } else if (value instanceof File) {
    return form.append(key, value, value.name);
  } else if (value instanceof Blob) {
    return form.append(key, value);
  } else if (typeof value === 'boolean') {
    return form.append(key, value ? '1' : '0');
  } else if (typeof value === 'string') {
    return form.append(key, value);
  } else if (typeof value === 'number') {
    return form.append(key, "".concat(value));
  } else if (value === null || value === undefined) {
    return form.append(key, '');
  }

  _objectToFormData(value, form, key);
}

function hrefToUrl(href) {
  return new URL(href.toString(), window.location.toString());
}
function _mergeDataIntoQueryString(method, href, data) {
  var hasHost = href.toString().includes('http');
  var hasAbsolutePath = hasHost || href.toString().startsWith('/');
  var hasRelativePath = !hasAbsolutePath && !href.toString().startsWith('#') && !href.toString().startsWith('?');
  var hasSearch = href.toString().includes('?') || method === _helper_types__WEBPACK_IMPORTED_MODULE_0__.Method.GET && Object.keys(data).length;
  var hasHash = href.toString().includes('#');
  var url = new URL(href.toString(), 'http://localhost');

  if (method === _helper_types__WEBPACK_IMPORTED_MODULE_0__.Method.GET && Object.keys(data).length) {
    url.search = qs__WEBPACK_IMPORTED_MODULE_1__.stringify(deepmerge__WEBPACK_IMPORTED_MODULE_2___default()(qs__WEBPACK_IMPORTED_MODULE_1__.parse(url.search, {
      ignoreQueryPrefix: true
    }), data), {
      encodeValuesOnly: true,
      arrayFormat: 'brackets'
    });
    data = {};
  }

  return [[hasHost ? "".concat(url.protocol, "//").concat(url.host) : '', hasAbsolutePath ? url.pathname : '', hasRelativePath ? url.pathname.substring(1) : '', hasSearch ? url.search : '', hasHash ? url.hash : ''].join(''), data];
}
function mimeTypeToExt(mime) {
  var lookup = [{
    ext: '.aac',
    mime: 'audio/aac'
  }, {
    ext: '.abw',
    mime: 'application/x-abiword'
  }, {
    ext: '.arc',
    mime: 'application/x-freearc'
  }, {
    ext: '.avi',
    mime: 'video/x-msvideo'
  }, {
    ext: '.azw',
    mime: 'application/vnd.amazon.ebook'
  }, {
    ext: '.bin',
    mime: 'application/octet-stream'
  }, {
    ext: '.bmp',
    mime: 'image/bmp'
  }, {
    ext: '.bz',
    mime: 'application/x-bzip'
  }, {
    ext: '.bz2',
    mime: 'application/x-bzip2'
  }, {
    ext: '.cda',
    mime: 'application/x-cdf'
  }, {
    ext: '.csh',
    mime: 'application/x-csh'
  }, {
    ext: '.css',
    mime: 'text/css'
  }, {
    ext: '.csv',
    mime: 'text/csv'
  }, {
    ext: '.doc',
    mime: 'application/msword'
  }, {
    ext: '.docx',
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }, {
    ext: '.eot',
    mime: 'application/vnd.ms-fontobject'
  }, {
    ext: '.epub',
    mime: 'application/epub+zip'
  }, {
    ext: '.gz',
    mime: 'application/gzip'
  }, {
    ext: '.gif',
    mime: 'image/gif'
  }, {
    ext: '.html',
    mime: 'text/html'
  }, {
    ext: '.ico',
    mime: 'image/vnd.microsoft.icon'
  }, {
    ext: '.ics',
    mime: 'text/calendar'
  }, {
    ext: '.jar',
    mime: 'application/java-archive'
  }, {
    ext: '.jpeg',
    mime: 'image/jpeg'
  }, {
    ext: '.jpg',
    mime: 'image/jpg'
  }, {
    ext: '.js',
    mime: 'text/javascript'
  }, {
    ext: '.json',
    mime: 'application/json'
  }, {
    ext: '.jsonld',
    mime: 'application/ld+json'
  }, {
    ext: '.midi',
    mime: 'audio/midi'
  }, {
    ext: '.midi',
    mime: 'audio/x-midi'
  }, {
    ext: '.mp3',
    mime: 'audio/mpeg'
  }, {
    ext: '.mp4',
    mime: 'video/mp4'
  }, {
    ext: '.mpeg',
    mime: 'video/mpeg'
  }, {
    ext: '.mpkg',
    mime: 'application/vnd.apple.installer+xml'
  }, {
    ext: '.odp',
    mime: 'application/vnd.oasis.opendocument.presentation'
  }, {
    ext: '.ods',
    mime: 'application/vnd.oasis.opendocument.spreadsheet'
  }, {
    ext: '.odt',
    mime: 'application/vnd.oasis.opendocument.text'
  }, {
    ext: '.oga',
    mime: 'audio/ogg'
  }, {
    ext: '.ogv',
    mime: 'video/ogg'
  }, {
    ext: '.ogx',
    mime: 'application/ogg'
  }, {
    ext: '.opus',
    mime: 'audio/opus'
  }, {
    ext: '.otf',
    mime: 'font/otf'
  }, {
    ext: '.png',
    mime: 'image/png'
  }, {
    ext: '.pdf',
    mime: 'application/pdf'
  }, {
    ext: '.php',
    mime: 'application/x-httpd-php'
  }, {
    ext: '.ppt',
    mime: 'application/vnd.ms-powerpoint'
  }, {
    ext: '.pptx',
    mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  }, {
    ext: '.rar',
    mime: 'application/vnd.rar'
  }, {
    ext: '.rtf',
    mime: 'application/rtf'
  }, {
    ext: '.sh',
    mime: 'application/x-sh'
  }, {
    ext: '.svg',
    mime: 'image/svg+xml'
  }, {
    ext: '.swf',
    mime: 'application/x-shockwave-flash'
  }, {
    ext: '.tar',
    mime: 'application/x-tar'
  }, {
    ext: '.tiff',
    mime: 'image/tiff'
  }, {
    ext: '.ts',
    mime: 'video/mp2t'
  }, {
    ext: '.ttf',
    mime: 'font/ttf'
  }, {
    ext: '.txt',
    mime: 'text/plain'
  }, {
    ext: '.vsd',
    mime: 'application/vnd.visio'
  }, {
    ext: '.wav',
    mime: 'audio/wav'
  }, {
    ext: '.weba',
    mime: 'audio/webm'
  }, {
    ext: '.webm',
    mime: 'video/webm'
  }, {
    ext: '.webp',
    mime: 'image/webp'
  }, {
    ext: '.woff',
    mime: 'font/woff'
  }, {
    ext: '.woff2',
    mime: 'font/woff2'
  }, {
    ext: '.xhtml',
    mime: 'application/xhtml+xml'
  }, {
    ext: '.xls',
    mime: 'application/vnd.ms-excel'
  }, {
    ext: '.xlsx',
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  }, {
    ext: '.xml',
    mime: 'application/xml'
  }, {
    ext: '.xul',
    mime: 'application/vnd.mozilla.xul+xml'
  }, {
    ext: '.zip',
    mime: 'application/zip'
  }, {
    ext: '.3gp',
    mime: 'video/3gpp'
  }, {
    ext: '.7z',
    mime: 'application/x-7z-compressed'
  }];
  var match = lookup.find(function (item) {
    return item.mime === mime;
  });

  if (match) {
    return match.ext;
  }

  return '.txt';
}

/***/ }),

/***/ "./resources/js/network/headerManager.js":
/*!***********************************************!*\
  !*** ./resources/js/network/headerManager.js ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "processResponseHeader": () => (/* binding */ processResponseHeader),
/* harmony export */   "isJsonResponse": () => (/* binding */ isJsonResponse)
/* harmony export */ });
/* harmony import */ var _helper_util__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../helper/util */ "./resources/js/helper/util.js");
/* harmony import */ var _notify_index__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../notify/index */ "./resources/js/notify/index.js");
/* harmony import */ var _lifecycleHook__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./lifecycleHook */ "./resources/js/network/lifecycleHook.js");



function processResponseHeader(response, id, key) {
  var component = {
    id: id,
    key: key
  };
  var process = handle(response, component);
  process.notification();
}
function isJsonResponse(response) {
  var contentType = response.headers.get("content-type");

  if (contentType && contentType.indexOf("application/json") !== -1) {
    return true;
  }

  return false;
}

function handle(response, component) {
  return {
    notification: function notification() {
      var notification = response.headers.get('X-Aqua-Notification');
      if (!notification) return;
      var parsed = JSON.parse(notification);

      if (parsed && (0,_helper_util__WEBPACK_IMPORTED_MODULE_0__._hasProperty)(parsed, 'type') && (0,_helper_util__WEBPACK_IMPORTED_MODULE_0__._hasProperty)(parsed, 'message')) {
        (0,_notify_index__WEBPACK_IMPORTED_MODULE_1__.notify)(parsed, component);
        (0,_lifecycleHook__WEBPACK_IMPORTED_MODULE_2__.execLifecycleCallback)(component.id, 'notification', parsed);
      }
    }
  };
}

/***/ }),

/***/ "./resources/js/network/lifecycleHook.js":
/*!***********************************************!*\
  !*** ./resources/js/network/lifecycleHook.js ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "execLifecycleCallback": () => (/* binding */ execLifecycleCallback)
/* harmony export */ });
function execLifecycleCallback(id, type, data) {
  _aquaCore.resolveLifecycleCallback(type, id)(data);
}

/***/ }),

/***/ "./resources/js/network/network.js":
/*!*****************************************!*\
  !*** ./resources/js/network/network.js ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "_replicatePublicMethods": () => (/* binding */ _replicatePublicMethods)
/* harmony export */ });
/* harmony import */ var _babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/regenerator */ "./node_modules/@babel/runtime/regenerator/index.js");
/* harmony import */ var _babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _helper_types__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../helper/types */ "./resources/js/helper/types.js");
/* harmony import */ var _helper_util__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../helper/util */ "./resources/js/helper/util.js");
/* harmony import */ var _lifecycleHook__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./lifecycleHook */ "./resources/js/network/lifecycleHook.js");
/* harmony import */ var _headerManager__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./headerManager */ "./resources/js/network/headerManager.js");


function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }






function _manifestNetworkHandler(url, ingredient, classMethod, id, key) {
  return /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_0___default().mark(function _callee2() {
    var data,
        method,
        signal,
        _mergeDataIntoQuerySt,
        _mergeDataIntoQuerySt2,
        _href,
        _data,
        cancelSignal,
        options,
        reponse,
        _args2 = arguments;

    return _babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_0___default().wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            data = _args2.length > 0 && _args2[0] !== undefined ? _args2[0] : {};
            method = _args2.length > 1 && _args2[1] !== undefined ? _args2[1] : _helper_types__WEBPACK_IMPORTED_MODULE_1__.Method.POST;
            signal = _args2.length > 2 && _args2[2] !== undefined ? _args2[2] : null;

            if ((0,_helper_util__WEBPACK_IMPORTED_MODULE_2__._hasFiles)(data) && !(data instanceof FormData)) {
              data = (0,_helper_util__WEBPACK_IMPORTED_MODULE_2__._objectToFormData)(data);
            }

            if (!(data instanceof FormData)) {
              _mergeDataIntoQuerySt = (0,_helper_util__WEBPACK_IMPORTED_MODULE_2__._mergeDataIntoQueryString)(method, url, data), _mergeDataIntoQuerySt2 = _slicedToArray(_mergeDataIntoQuerySt, 2), _href = _mergeDataIntoQuerySt2[0], _data = _mergeDataIntoQuerySt2[1];
              url = (0,_helper_util__WEBPACK_IMPORTED_MODULE_2__.hrefToUrl)(_href);
              data = JSON.stringify(_data);
            }

            cancelSignal = signal || new AbortController().signal;
            options = _objectSpread({
              headers: _objectSpread(_objectSpread({
                Accept: '*/*'
              }, !(data instanceof FormData) && {
                "Content-Type": "application/json"
              }), {}, {
                "X-Requested-With": "XMLHttpRequest",
                "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]').content,
                "X-Aquastrap": JSON.stringify({
                  ingredient: ingredient,
                  method: classMethod
                })
              }),
              signal: cancelSignal,
              credentials: "same-origin",
              method: method
            }, method !== _helper_types__WEBPACK_IMPORTED_MODULE_1__.Method.GET && {
              body: data
            });
            (0,_lifecycleHook__WEBPACK_IMPORTED_MODULE_3__.execLifecycleCallback)(id, _helper_types__WEBPACK_IMPORTED_MODULE_1__.XHREvent.START, null);
            _context2.next = 10;
            return fetch(url, options).then(function (res) {
              (0,_headerManager__WEBPACK_IMPORTED_MODULE_4__.processResponseHeader)(res, id, key);
              return res;
            }).then( /*#__PURE__*/function () {
              var _ref2 = _asyncToGenerator( /*#__PURE__*/_babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_0___default().mark(function _callee(data) {
                var status, response;
                return _babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_0___default().wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        status = data.status;

                        if (!(status < 300)) {
                          _context.next = 11;
                          break;
                        }

                        response = {
                          status: status,
                          data: {}
                        };

                        if (!(status === 204)) {
                          _context.next = 6;
                          break;
                        }

                        (0,_lifecycleHook__WEBPACK_IMPORTED_MODULE_3__.execLifecycleCallback)(id, _helper_types__WEBPACK_IMPORTED_MODULE_1__.XHREvent.SUCCESS, response);
                        return _context.abrupt("return", response);

                      case 6:
                        if ((0,_headerManager__WEBPACK_IMPORTED_MODULE_4__.isJsonResponse)(data)) {
                          _context.next = 11;
                          break;
                        }

                        _context.next = 9;
                        return handleBlobResponse(data);

                      case 9:
                        (0,_lifecycleHook__WEBPACK_IMPORTED_MODULE_3__.execLifecycleCallback)(id, _helper_types__WEBPACK_IMPORTED_MODULE_1__.XHREvent.SUCCESS, response);
                        return _context.abrupt("return", response);

                      case 11:
                        return _context.abrupt("return", data.json().then(function (r) {
                          var response = {
                            status: status,
                            data: r
                          };
                          if (status >= 400) (0,_lifecycleHook__WEBPACK_IMPORTED_MODULE_3__.execLifecycleCallback)(id, _helper_types__WEBPACK_IMPORTED_MODULE_1__.XHREvent.ERROR, response);
                          if (status < 300) (0,_lifecycleHook__WEBPACK_IMPORTED_MODULE_3__.execLifecycleCallback)(id, _helper_types__WEBPACK_IMPORTED_MODULE_1__.XHREvent.SUCCESS, response);
                          return response;
                        })["catch"](function (e) {
                          var response = {
                            status: status,
                            data: {
                              error: e,
                              message: data.statusText + ' - unable to parse response'
                            }
                          };
                          (0,_lifecycleHook__WEBPACK_IMPORTED_MODULE_3__.execLifecycleCallback)(id, _helper_types__WEBPACK_IMPORTED_MODULE_1__.XHREvent.ERROR, response);
                        }));

                      case 12:
                      case "end":
                        return _context.stop();
                    }
                  }
                }, _callee);
              }));

              return function (_x) {
                return _ref2.apply(this, arguments);
              };
            }())["catch"](function (error) {
              (0,_lifecycleHook__WEBPACK_IMPORTED_MODULE_3__.execLifecycleCallback)(id, _helper_types__WEBPACK_IMPORTED_MODULE_1__.XHREvent.ERROR, error);
              return error;
            })["finally"](function (_) {
              return (0,_lifecycleHook__WEBPACK_IMPORTED_MODULE_3__.execLifecycleCallback)(id, _helper_types__WEBPACK_IMPORTED_MODULE_1__.XHREvent.FINISH, null);
            });

          case 10:
            reponse = _context2.sent;
            return _context2.abrupt("return", reponse);

          case 12:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));
}

function _replicatePublicMethods(id, key, classIngredient, methodNames) {
  var methods = {};

  for (var _i2 = 0, _Object$values = Object.values(methodNames); _i2 < _Object$values.length; _i2++) {
    var name = _Object$values[_i2];
    methods = _objectSpread(_objectSpread({}, methods), {}, _defineProperty({}, name, _manifestNetworkHandler(window._aquaroute, classIngredient, name, id, key)));
  }

  return methods;
}

function handleBlobResponse(_x2) {
  return _handleBlobResponse.apply(this, arguments);
}

function _handleBlobResponse() {
  _handleBlobResponse = _asyncToGenerator( /*#__PURE__*/_babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_0___default().mark(function _callee3(response) {
    var defaultMime, contentType, contentDisposition, sippliedFilename, filename, blob, url, a;
    return _babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_0___default().wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            defaultMime = "application/octet-stream";
            contentType = response.headers.get("content-type") || defaultMime;
            contentDisposition = response.headers.get('content-disposition');
            sippliedFilename = contentDisposition ? contentDisposition.split('filename=')[1] : '';
            filename = sippliedFilename !== '""' ? sippliedFilename : 'download' + (0,_helper_util__WEBPACK_IMPORTED_MODULE_2__.mimeTypeToExt)(contentType.split(';')[0]);
            _context3.next = 7;
            return response.blob();

          case 7:
            blob = _context3.sent;
            url = window.URL.createObjectURL(blob);
            a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            return _context3.abrupt("return");

          case 17:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));
  return _handleBlobResponse.apply(this, arguments);
}

/***/ }),

/***/ "./resources/js/notify/index.js":
/*!**************************************!*\
  !*** ./resources/js/notify/index.js ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "notify": () => (/* binding */ notify)
/* harmony export */ });
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function notify(notification, _ref) {
  var id = _ref.id,
      key = _ref.key;
  var notificationEvent = new CustomEvent("aqua.notification", {
    detail: _objectSpread({
      component: {
        id: id,
        key: key
      }
    }, notification),
    cancelable: true,
    bubbles: true
  });
  window.dispatchEvent(notificationEvent);
}

/***/ }),

/***/ "./node_modules/call-bind/callBound.js":
/*!*********************************************!*\
  !*** ./node_modules/call-bind/callBound.js ***!
  \*********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var GetIntrinsic = __webpack_require__(/*! get-intrinsic */ "./node_modules/get-intrinsic/index.js");

var callBind = __webpack_require__(/*! ./ */ "./node_modules/call-bind/index.js");

var $indexOf = callBind(GetIntrinsic('String.prototype.indexOf'));

module.exports = function callBoundIntrinsic(name, allowMissing) {
	var intrinsic = GetIntrinsic(name, !!allowMissing);
	if (typeof intrinsic === 'function' && $indexOf(name, '.prototype.') > -1) {
		return callBind(intrinsic);
	}
	return intrinsic;
};


/***/ }),

/***/ "./node_modules/call-bind/index.js":
/*!*****************************************!*\
  !*** ./node_modules/call-bind/index.js ***!
  \*****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var bind = __webpack_require__(/*! function-bind */ "./node_modules/function-bind/index.js");
var GetIntrinsic = __webpack_require__(/*! get-intrinsic */ "./node_modules/get-intrinsic/index.js");

var $apply = GetIntrinsic('%Function.prototype.apply%');
var $call = GetIntrinsic('%Function.prototype.call%');
var $reflectApply = GetIntrinsic('%Reflect.apply%', true) || bind.call($call, $apply);

var $gOPD = GetIntrinsic('%Object.getOwnPropertyDescriptor%', true);
var $defineProperty = GetIntrinsic('%Object.defineProperty%', true);
var $max = GetIntrinsic('%Math.max%');

if ($defineProperty) {
	try {
		$defineProperty({}, 'a', { value: 1 });
	} catch (e) {
		// IE 8 has a broken defineProperty
		$defineProperty = null;
	}
}

module.exports = function callBind(originalFunction) {
	var func = $reflectApply(bind, $call, arguments);
	if ($gOPD && $defineProperty) {
		var desc = $gOPD(func, 'length');
		if (desc.configurable) {
			// original length, plus the receiver, minus any additional arguments (after the receiver)
			$defineProperty(
				func,
				'length',
				{ value: 1 + $max(0, originalFunction.length - (arguments.length - 1)) }
			);
		}
	}
	return func;
};

var applyBind = function applyBind() {
	return $reflectApply(bind, $apply, arguments);
};

if ($defineProperty) {
	$defineProperty(module.exports, 'apply', { value: applyBind });
} else {
	module.exports.apply = applyBind;
}


/***/ }),

/***/ "./node_modules/deepmerge/dist/cjs.js":
/*!********************************************!*\
  !*** ./node_modules/deepmerge/dist/cjs.js ***!
  \********************************************/
/***/ ((module) => {

"use strict";


var isMergeableObject = function isMergeableObject(value) {
	return isNonNullObject(value)
		&& !isSpecial(value)
};

function isNonNullObject(value) {
	return !!value && typeof value === 'object'
}

function isSpecial(value) {
	var stringValue = Object.prototype.toString.call(value);

	return stringValue === '[object RegExp]'
		|| stringValue === '[object Date]'
		|| isReactElement(value)
}

// see https://github.com/facebook/react/blob/b5ac963fb791d1298e7f396236383bc955f916c1/src/isomorphic/classic/element/ReactElement.js#L21-L25
var canUseSymbol = typeof Symbol === 'function' && Symbol.for;
var REACT_ELEMENT_TYPE = canUseSymbol ? Symbol.for('react.element') : 0xeac7;

function isReactElement(value) {
	return value.$$typeof === REACT_ELEMENT_TYPE
}

function emptyTarget(val) {
	return Array.isArray(val) ? [] : {}
}

function cloneUnlessOtherwiseSpecified(value, options) {
	return (options.clone !== false && options.isMergeableObject(value))
		? deepmerge(emptyTarget(value), value, options)
		: value
}

function defaultArrayMerge(target, source, options) {
	return target.concat(source).map(function(element) {
		return cloneUnlessOtherwiseSpecified(element, options)
	})
}

function getMergeFunction(key, options) {
	if (!options.customMerge) {
		return deepmerge
	}
	var customMerge = options.customMerge(key);
	return typeof customMerge === 'function' ? customMerge : deepmerge
}

function getEnumerableOwnPropertySymbols(target) {
	return Object.getOwnPropertySymbols
		? Object.getOwnPropertySymbols(target).filter(function(symbol) {
			return target.propertyIsEnumerable(symbol)
		})
		: []
}

function getKeys(target) {
	return Object.keys(target).concat(getEnumerableOwnPropertySymbols(target))
}

function propertyIsOnObject(object, property) {
	try {
		return property in object
	} catch(_) {
		return false
	}
}

// Protects from prototype poisoning and unexpected merging up the prototype chain.
function propertyIsUnsafe(target, key) {
	return propertyIsOnObject(target, key) // Properties are safe to merge if they don't exist in the target yet,
		&& !(Object.hasOwnProperty.call(target, key) // unsafe if they exist up the prototype chain,
			&& Object.propertyIsEnumerable.call(target, key)) // and also unsafe if they're nonenumerable.
}

function mergeObject(target, source, options) {
	var destination = {};
	if (options.isMergeableObject(target)) {
		getKeys(target).forEach(function(key) {
			destination[key] = cloneUnlessOtherwiseSpecified(target[key], options);
		});
	}
	getKeys(source).forEach(function(key) {
		if (propertyIsUnsafe(target, key)) {
			return
		}

		if (propertyIsOnObject(target, key) && options.isMergeableObject(source[key])) {
			destination[key] = getMergeFunction(key, options)(target[key], source[key], options);
		} else {
			destination[key] = cloneUnlessOtherwiseSpecified(source[key], options);
		}
	});
	return destination
}

function deepmerge(target, source, options) {
	options = options || {};
	options.arrayMerge = options.arrayMerge || defaultArrayMerge;
	options.isMergeableObject = options.isMergeableObject || isMergeableObject;
	// cloneUnlessOtherwiseSpecified is added to `options` so that custom arrayMerge()
	// implementations can use it. The caller may not replace it.
	options.cloneUnlessOtherwiseSpecified = cloneUnlessOtherwiseSpecified;

	var sourceIsArray = Array.isArray(source);
	var targetIsArray = Array.isArray(target);
	var sourceAndTargetTypesMatch = sourceIsArray === targetIsArray;

	if (!sourceAndTargetTypesMatch) {
		return cloneUnlessOtherwiseSpecified(source, options)
	} else if (sourceIsArray) {
		return options.arrayMerge(target, source, options)
	} else {
		return mergeObject(target, source, options)
	}
}

deepmerge.all = function deepmergeAll(array, options) {
	if (!Array.isArray(array)) {
		throw new Error('first argument should be an array')
	}

	return array.reduce(function(prev, next) {
		return deepmerge(prev, next, options)
	}, {})
};

var deepmerge_1 = deepmerge;

module.exports = deepmerge_1;


/***/ }),

/***/ "./node_modules/function-bind/implementation.js":
/*!******************************************************!*\
  !*** ./node_modules/function-bind/implementation.js ***!
  \******************************************************/
/***/ ((module) => {

"use strict";


/* eslint no-invalid-this: 1 */

var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
var slice = Array.prototype.slice;
var toStr = Object.prototype.toString;
var funcType = '[object Function]';

module.exports = function bind(that) {
    var target = this;
    if (typeof target !== 'function' || toStr.call(target) !== funcType) {
        throw new TypeError(ERROR_MESSAGE + target);
    }
    var args = slice.call(arguments, 1);

    var bound;
    var binder = function () {
        if (this instanceof bound) {
            var result = target.apply(
                this,
                args.concat(slice.call(arguments))
            );
            if (Object(result) === result) {
                return result;
            }
            return this;
        } else {
            return target.apply(
                that,
                args.concat(slice.call(arguments))
            );
        }
    };

    var boundLength = Math.max(0, target.length - args.length);
    var boundArgs = [];
    for (var i = 0; i < boundLength; i++) {
        boundArgs.push('$' + i);
    }

    bound = Function('binder', 'return function (' + boundArgs.join(',') + '){ return binder.apply(this,arguments); }')(binder);

    if (target.prototype) {
        var Empty = function Empty() {};
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
    }

    return bound;
};


/***/ }),

/***/ "./node_modules/function-bind/index.js":
/*!*********************************************!*\
  !*** ./node_modules/function-bind/index.js ***!
  \*********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var implementation = __webpack_require__(/*! ./implementation */ "./node_modules/function-bind/implementation.js");

module.exports = Function.prototype.bind || implementation;


/***/ }),

/***/ "./node_modules/get-intrinsic/index.js":
/*!*********************************************!*\
  !*** ./node_modules/get-intrinsic/index.js ***!
  \*********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var undefined;

var $SyntaxError = SyntaxError;
var $Function = Function;
var $TypeError = TypeError;

// eslint-disable-next-line consistent-return
var getEvalledConstructor = function (expressionSyntax) {
	try {
		return $Function('"use strict"; return (' + expressionSyntax + ').constructor;')();
	} catch (e) {}
};

var $gOPD = Object.getOwnPropertyDescriptor;
if ($gOPD) {
	try {
		$gOPD({}, '');
	} catch (e) {
		$gOPD = null; // this is IE 8, which has a broken gOPD
	}
}

var throwTypeError = function () {
	throw new $TypeError();
};
var ThrowTypeError = $gOPD
	? (function () {
		try {
			// eslint-disable-next-line no-unused-expressions, no-caller, no-restricted-properties
			arguments.callee; // IE 8 does not throw here
			return throwTypeError;
		} catch (calleeThrows) {
			try {
				// IE 8 throws on Object.getOwnPropertyDescriptor(arguments, '')
				return $gOPD(arguments, 'callee').get;
			} catch (gOPDthrows) {
				return throwTypeError;
			}
		}
	}())
	: throwTypeError;

var hasSymbols = __webpack_require__(/*! has-symbols */ "./node_modules/has-symbols/index.js")();

var getProto = Object.getPrototypeOf || function (x) { return x.__proto__; }; // eslint-disable-line no-proto

var needsEval = {};

var TypedArray = typeof Uint8Array === 'undefined' ? undefined : getProto(Uint8Array);

var INTRINSICS = {
	'%AggregateError%': typeof AggregateError === 'undefined' ? undefined : AggregateError,
	'%Array%': Array,
	'%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined : ArrayBuffer,
	'%ArrayIteratorPrototype%': hasSymbols ? getProto([][Symbol.iterator]()) : undefined,
	'%AsyncFromSyncIteratorPrototype%': undefined,
	'%AsyncFunction%': needsEval,
	'%AsyncGenerator%': needsEval,
	'%AsyncGeneratorFunction%': needsEval,
	'%AsyncIteratorPrototype%': needsEval,
	'%Atomics%': typeof Atomics === 'undefined' ? undefined : Atomics,
	'%BigInt%': typeof BigInt === 'undefined' ? undefined : BigInt,
	'%Boolean%': Boolean,
	'%DataView%': typeof DataView === 'undefined' ? undefined : DataView,
	'%Date%': Date,
	'%decodeURI%': decodeURI,
	'%decodeURIComponent%': decodeURIComponent,
	'%encodeURI%': encodeURI,
	'%encodeURIComponent%': encodeURIComponent,
	'%Error%': Error,
	'%eval%': eval, // eslint-disable-line no-eval
	'%EvalError%': EvalError,
	'%Float32Array%': typeof Float32Array === 'undefined' ? undefined : Float32Array,
	'%Float64Array%': typeof Float64Array === 'undefined' ? undefined : Float64Array,
	'%FinalizationRegistry%': typeof FinalizationRegistry === 'undefined' ? undefined : FinalizationRegistry,
	'%Function%': $Function,
	'%GeneratorFunction%': needsEval,
	'%Int8Array%': typeof Int8Array === 'undefined' ? undefined : Int8Array,
	'%Int16Array%': typeof Int16Array === 'undefined' ? undefined : Int16Array,
	'%Int32Array%': typeof Int32Array === 'undefined' ? undefined : Int32Array,
	'%isFinite%': isFinite,
	'%isNaN%': isNaN,
	'%IteratorPrototype%': hasSymbols ? getProto(getProto([][Symbol.iterator]())) : undefined,
	'%JSON%': typeof JSON === 'object' ? JSON : undefined,
	'%Map%': typeof Map === 'undefined' ? undefined : Map,
	'%MapIteratorPrototype%': typeof Map === 'undefined' || !hasSymbols ? undefined : getProto(new Map()[Symbol.iterator]()),
	'%Math%': Math,
	'%Number%': Number,
	'%Object%': Object,
	'%parseFloat%': parseFloat,
	'%parseInt%': parseInt,
	'%Promise%': typeof Promise === 'undefined' ? undefined : Promise,
	'%Proxy%': typeof Proxy === 'undefined' ? undefined : Proxy,
	'%RangeError%': RangeError,
	'%ReferenceError%': ReferenceError,
	'%Reflect%': typeof Reflect === 'undefined' ? undefined : Reflect,
	'%RegExp%': RegExp,
	'%Set%': typeof Set === 'undefined' ? undefined : Set,
	'%SetIteratorPrototype%': typeof Set === 'undefined' || !hasSymbols ? undefined : getProto(new Set()[Symbol.iterator]()),
	'%SharedArrayBuffer%': typeof SharedArrayBuffer === 'undefined' ? undefined : SharedArrayBuffer,
	'%String%': String,
	'%StringIteratorPrototype%': hasSymbols ? getProto(''[Symbol.iterator]()) : undefined,
	'%Symbol%': hasSymbols ? Symbol : undefined,
	'%SyntaxError%': $SyntaxError,
	'%ThrowTypeError%': ThrowTypeError,
	'%TypedArray%': TypedArray,
	'%TypeError%': $TypeError,
	'%Uint8Array%': typeof Uint8Array === 'undefined' ? undefined : Uint8Array,
	'%Uint8ClampedArray%': typeof Uint8ClampedArray === 'undefined' ? undefined : Uint8ClampedArray,
	'%Uint16Array%': typeof Uint16Array === 'undefined' ? undefined : Uint16Array,
	'%Uint32Array%': typeof Uint32Array === 'undefined' ? undefined : Uint32Array,
	'%URIError%': URIError,
	'%WeakMap%': typeof WeakMap === 'undefined' ? undefined : WeakMap,
	'%WeakRef%': typeof WeakRef === 'undefined' ? undefined : WeakRef,
	'%WeakSet%': typeof WeakSet === 'undefined' ? undefined : WeakSet
};

var doEval = function doEval(name) {
	var value;
	if (name === '%AsyncFunction%') {
		value = getEvalledConstructor('async function () {}');
	} else if (name === '%GeneratorFunction%') {
		value = getEvalledConstructor('function* () {}');
	} else if (name === '%AsyncGeneratorFunction%') {
		value = getEvalledConstructor('async function* () {}');
	} else if (name === '%AsyncGenerator%') {
		var fn = doEval('%AsyncGeneratorFunction%');
		if (fn) {
			value = fn.prototype;
		}
	} else if (name === '%AsyncIteratorPrototype%') {
		var gen = doEval('%AsyncGenerator%');
		if (gen) {
			value = getProto(gen.prototype);
		}
	}

	INTRINSICS[name] = value;

	return value;
};

var LEGACY_ALIASES = {
	'%ArrayBufferPrototype%': ['ArrayBuffer', 'prototype'],
	'%ArrayPrototype%': ['Array', 'prototype'],
	'%ArrayProto_entries%': ['Array', 'prototype', 'entries'],
	'%ArrayProto_forEach%': ['Array', 'prototype', 'forEach'],
	'%ArrayProto_keys%': ['Array', 'prototype', 'keys'],
	'%ArrayProto_values%': ['Array', 'prototype', 'values'],
	'%AsyncFunctionPrototype%': ['AsyncFunction', 'prototype'],
	'%AsyncGenerator%': ['AsyncGeneratorFunction', 'prototype'],
	'%AsyncGeneratorPrototype%': ['AsyncGeneratorFunction', 'prototype', 'prototype'],
	'%BooleanPrototype%': ['Boolean', 'prototype'],
	'%DataViewPrototype%': ['DataView', 'prototype'],
	'%DatePrototype%': ['Date', 'prototype'],
	'%ErrorPrototype%': ['Error', 'prototype'],
	'%EvalErrorPrototype%': ['EvalError', 'prototype'],
	'%Float32ArrayPrototype%': ['Float32Array', 'prototype'],
	'%Float64ArrayPrototype%': ['Float64Array', 'prototype'],
	'%FunctionPrototype%': ['Function', 'prototype'],
	'%Generator%': ['GeneratorFunction', 'prototype'],
	'%GeneratorPrototype%': ['GeneratorFunction', 'prototype', 'prototype'],
	'%Int8ArrayPrototype%': ['Int8Array', 'prototype'],
	'%Int16ArrayPrototype%': ['Int16Array', 'prototype'],
	'%Int32ArrayPrototype%': ['Int32Array', 'prototype'],
	'%JSONParse%': ['JSON', 'parse'],
	'%JSONStringify%': ['JSON', 'stringify'],
	'%MapPrototype%': ['Map', 'prototype'],
	'%NumberPrototype%': ['Number', 'prototype'],
	'%ObjectPrototype%': ['Object', 'prototype'],
	'%ObjProto_toString%': ['Object', 'prototype', 'toString'],
	'%ObjProto_valueOf%': ['Object', 'prototype', 'valueOf'],
	'%PromisePrototype%': ['Promise', 'prototype'],
	'%PromiseProto_then%': ['Promise', 'prototype', 'then'],
	'%Promise_all%': ['Promise', 'all'],
	'%Promise_reject%': ['Promise', 'reject'],
	'%Promise_resolve%': ['Promise', 'resolve'],
	'%RangeErrorPrototype%': ['RangeError', 'prototype'],
	'%ReferenceErrorPrototype%': ['ReferenceError', 'prototype'],
	'%RegExpPrototype%': ['RegExp', 'prototype'],
	'%SetPrototype%': ['Set', 'prototype'],
	'%SharedArrayBufferPrototype%': ['SharedArrayBuffer', 'prototype'],
	'%StringPrototype%': ['String', 'prototype'],
	'%SymbolPrototype%': ['Symbol', 'prototype'],
	'%SyntaxErrorPrototype%': ['SyntaxError', 'prototype'],
	'%TypedArrayPrototype%': ['TypedArray', 'prototype'],
	'%TypeErrorPrototype%': ['TypeError', 'prototype'],
	'%Uint8ArrayPrototype%': ['Uint8Array', 'prototype'],
	'%Uint8ClampedArrayPrototype%': ['Uint8ClampedArray', 'prototype'],
	'%Uint16ArrayPrototype%': ['Uint16Array', 'prototype'],
	'%Uint32ArrayPrototype%': ['Uint32Array', 'prototype'],
	'%URIErrorPrototype%': ['URIError', 'prototype'],
	'%WeakMapPrototype%': ['WeakMap', 'prototype'],
	'%WeakSetPrototype%': ['WeakSet', 'prototype']
};

var bind = __webpack_require__(/*! function-bind */ "./node_modules/function-bind/index.js");
var hasOwn = __webpack_require__(/*! has */ "./node_modules/has/src/index.js");
var $concat = bind.call(Function.call, Array.prototype.concat);
var $spliceApply = bind.call(Function.apply, Array.prototype.splice);
var $replace = bind.call(Function.call, String.prototype.replace);
var $strSlice = bind.call(Function.call, String.prototype.slice);

/* adapted from https://github.com/lodash/lodash/blob/4.17.15/dist/lodash.js#L6735-L6744 */
var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
var reEscapeChar = /\\(\\)?/g; /** Used to match backslashes in property paths. */
var stringToPath = function stringToPath(string) {
	var first = $strSlice(string, 0, 1);
	var last = $strSlice(string, -1);
	if (first === '%' && last !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected closing `%`');
	} else if (last === '%' && first !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected opening `%`');
	}
	var result = [];
	$replace(string, rePropName, function (match, number, quote, subString) {
		result[result.length] = quote ? $replace(subString, reEscapeChar, '$1') : number || match;
	});
	return result;
};
/* end adaptation */

var getBaseIntrinsic = function getBaseIntrinsic(name, allowMissing) {
	var intrinsicName = name;
	var alias;
	if (hasOwn(LEGACY_ALIASES, intrinsicName)) {
		alias = LEGACY_ALIASES[intrinsicName];
		intrinsicName = '%' + alias[0] + '%';
	}

	if (hasOwn(INTRINSICS, intrinsicName)) {
		var value = INTRINSICS[intrinsicName];
		if (value === needsEval) {
			value = doEval(intrinsicName);
		}
		if (typeof value === 'undefined' && !allowMissing) {
			throw new $TypeError('intrinsic ' + name + ' exists, but is not available. Please file an issue!');
		}

		return {
			alias: alias,
			name: intrinsicName,
			value: value
		};
	}

	throw new $SyntaxError('intrinsic ' + name + ' does not exist!');
};

module.exports = function GetIntrinsic(name, allowMissing) {
	if (typeof name !== 'string' || name.length === 0) {
		throw new $TypeError('intrinsic name must be a non-empty string');
	}
	if (arguments.length > 1 && typeof allowMissing !== 'boolean') {
		throw new $TypeError('"allowMissing" argument must be a boolean');
	}

	var parts = stringToPath(name);
	var intrinsicBaseName = parts.length > 0 ? parts[0] : '';

	var intrinsic = getBaseIntrinsic('%' + intrinsicBaseName + '%', allowMissing);
	var intrinsicRealName = intrinsic.name;
	var value = intrinsic.value;
	var skipFurtherCaching = false;

	var alias = intrinsic.alias;
	if (alias) {
		intrinsicBaseName = alias[0];
		$spliceApply(parts, $concat([0, 1], alias));
	}

	for (var i = 1, isOwn = true; i < parts.length; i += 1) {
		var part = parts[i];
		var first = $strSlice(part, 0, 1);
		var last = $strSlice(part, -1);
		if (
			(
				(first === '"' || first === "'" || first === '`')
				|| (last === '"' || last === "'" || last === '`')
			)
			&& first !== last
		) {
			throw new $SyntaxError('property names with quotes must have matching quotes');
		}
		if (part === 'constructor' || !isOwn) {
			skipFurtherCaching = true;
		}

		intrinsicBaseName += '.' + part;
		intrinsicRealName = '%' + intrinsicBaseName + '%';

		if (hasOwn(INTRINSICS, intrinsicRealName)) {
			value = INTRINSICS[intrinsicRealName];
		} else if (value != null) {
			if (!(part in value)) {
				if (!allowMissing) {
					throw new $TypeError('base intrinsic for ' + name + ' exists, but the property is not available.');
				}
				return void undefined;
			}
			if ($gOPD && (i + 1) >= parts.length) {
				var desc = $gOPD(value, part);
				isOwn = !!desc;

				// By convention, when a data property is converted to an accessor
				// property to emulate a data property that does not suffer from
				// the override mistake, that accessor's getter is marked with
				// an `originalValue` property. Here, when we detect this, we
				// uphold the illusion by pretending to see that original data
				// property, i.e., returning the value rather than the getter
				// itself.
				if (isOwn && 'get' in desc && !('originalValue' in desc.get)) {
					value = desc.get;
				} else {
					value = value[part];
				}
			} else {
				isOwn = hasOwn(value, part);
				value = value[part];
			}

			if (isOwn && !skipFurtherCaching) {
				INTRINSICS[intrinsicRealName] = value;
			}
		}
	}
	return value;
};


/***/ }),

/***/ "./node_modules/has-symbols/index.js":
/*!*******************************************!*\
  !*** ./node_modules/has-symbols/index.js ***!
  \*******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var origSymbol = typeof Symbol !== 'undefined' && Symbol;
var hasSymbolSham = __webpack_require__(/*! ./shams */ "./node_modules/has-symbols/shams.js");

module.exports = function hasNativeSymbols() {
	if (typeof origSymbol !== 'function') { return false; }
	if (typeof Symbol !== 'function') { return false; }
	if (typeof origSymbol('foo') !== 'symbol') { return false; }
	if (typeof Symbol('bar') !== 'symbol') { return false; }

	return hasSymbolSham();
};


/***/ }),

/***/ "./node_modules/has-symbols/shams.js":
/*!*******************************************!*\
  !*** ./node_modules/has-symbols/shams.js ***!
  \*******************************************/
/***/ ((module) => {

"use strict";


/* eslint complexity: [2, 18], max-statements: [2, 33] */
module.exports = function hasSymbols() {
	if (typeof Symbol !== 'function' || typeof Object.getOwnPropertySymbols !== 'function') { return false; }
	if (typeof Symbol.iterator === 'symbol') { return true; }

	var obj = {};
	var sym = Symbol('test');
	var symObj = Object(sym);
	if (typeof sym === 'string') { return false; }

	if (Object.prototype.toString.call(sym) !== '[object Symbol]') { return false; }
	if (Object.prototype.toString.call(symObj) !== '[object Symbol]') { return false; }

	// temp disabled per https://github.com/ljharb/object.assign/issues/17
	// if (sym instanceof Symbol) { return false; }
	// temp disabled per https://github.com/WebReflection/get-own-property-symbols/issues/4
	// if (!(symObj instanceof Symbol)) { return false; }

	// if (typeof Symbol.prototype.toString !== 'function') { return false; }
	// if (String(sym) !== Symbol.prototype.toString.call(sym)) { return false; }

	var symVal = 42;
	obj[sym] = symVal;
	for (sym in obj) { return false; } // eslint-disable-line no-restricted-syntax, no-unreachable-loop
	if (typeof Object.keys === 'function' && Object.keys(obj).length !== 0) { return false; }

	if (typeof Object.getOwnPropertyNames === 'function' && Object.getOwnPropertyNames(obj).length !== 0) { return false; }

	var syms = Object.getOwnPropertySymbols(obj);
	if (syms.length !== 1 || syms[0] !== sym) { return false; }

	if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) { return false; }

	if (typeof Object.getOwnPropertyDescriptor === 'function') {
		var descriptor = Object.getOwnPropertyDescriptor(obj, sym);
		if (descriptor.value !== symVal || descriptor.enumerable !== true) { return false; }
	}

	return true;
};


/***/ }),

/***/ "./node_modules/has/src/index.js":
/*!***************************************!*\
  !*** ./node_modules/has/src/index.js ***!
  \***************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var bind = __webpack_require__(/*! function-bind */ "./node_modules/function-bind/index.js");

module.exports = bind.call(Function.call, Object.prototype.hasOwnProperty);


/***/ }),

/***/ "./node_modules/object-inspect/index.js":
/*!**********************************************!*\
  !*** ./node_modules/object-inspect/index.js ***!
  \**********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var hasMap = typeof Map === 'function' && Map.prototype;
var mapSizeDescriptor = Object.getOwnPropertyDescriptor && hasMap ? Object.getOwnPropertyDescriptor(Map.prototype, 'size') : null;
var mapSize = hasMap && mapSizeDescriptor && typeof mapSizeDescriptor.get === 'function' ? mapSizeDescriptor.get : null;
var mapForEach = hasMap && Map.prototype.forEach;
var hasSet = typeof Set === 'function' && Set.prototype;
var setSizeDescriptor = Object.getOwnPropertyDescriptor && hasSet ? Object.getOwnPropertyDescriptor(Set.prototype, 'size') : null;
var setSize = hasSet && setSizeDescriptor && typeof setSizeDescriptor.get === 'function' ? setSizeDescriptor.get : null;
var setForEach = hasSet && Set.prototype.forEach;
var hasWeakMap = typeof WeakMap === 'function' && WeakMap.prototype;
var weakMapHas = hasWeakMap ? WeakMap.prototype.has : null;
var hasWeakSet = typeof WeakSet === 'function' && WeakSet.prototype;
var weakSetHas = hasWeakSet ? WeakSet.prototype.has : null;
var hasWeakRef = typeof WeakRef === 'function' && WeakRef.prototype;
var weakRefDeref = hasWeakRef ? WeakRef.prototype.deref : null;
var booleanValueOf = Boolean.prototype.valueOf;
var objectToString = Object.prototype.toString;
var functionToString = Function.prototype.toString;
var match = String.prototype.match;
var bigIntValueOf = typeof BigInt === 'function' ? BigInt.prototype.valueOf : null;
var gOPS = Object.getOwnPropertySymbols;
var symToString = typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol' ? Symbol.prototype.toString : null;
var hasShammedSymbols = typeof Symbol === 'function' && typeof Symbol.iterator === 'object';
var isEnumerable = Object.prototype.propertyIsEnumerable;

var gPO = (typeof Reflect === 'function' ? Reflect.getPrototypeOf : Object.getPrototypeOf) || (
    [].__proto__ === Array.prototype // eslint-disable-line no-proto
        ? function (O) {
            return O.__proto__; // eslint-disable-line no-proto
        }
        : null
);

var inspectCustom = __webpack_require__(/*! ./util.inspect */ "?4f7e").custom;
var inspectSymbol = inspectCustom && isSymbol(inspectCustom) ? inspectCustom : null;
var toStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag !== 'undefined' ? Symbol.toStringTag : null;

module.exports = function inspect_(obj, options, depth, seen) {
    var opts = options || {};

    if (has(opts, 'quoteStyle') && (opts.quoteStyle !== 'single' && opts.quoteStyle !== 'double')) {
        throw new TypeError('option "quoteStyle" must be "single" or "double"');
    }
    if (
        has(opts, 'maxStringLength') && (typeof opts.maxStringLength === 'number'
            ? opts.maxStringLength < 0 && opts.maxStringLength !== Infinity
            : opts.maxStringLength !== null
        )
    ) {
        throw new TypeError('option "maxStringLength", if provided, must be a positive integer, Infinity, or `null`');
    }
    var customInspect = has(opts, 'customInspect') ? opts.customInspect : true;
    if (typeof customInspect !== 'boolean' && customInspect !== 'symbol') {
        throw new TypeError('option "customInspect", if provided, must be `true`, `false`, or `\'symbol\'`');
    }

    if (
        has(opts, 'indent')
        && opts.indent !== null
        && opts.indent !== '\t'
        && !(parseInt(opts.indent, 10) === opts.indent && opts.indent > 0)
    ) {
        throw new TypeError('options "indent" must be "\\t", an integer > 0, or `null`');
    }

    if (typeof obj === 'undefined') {
        return 'undefined';
    }
    if (obj === null) {
        return 'null';
    }
    if (typeof obj === 'boolean') {
        return obj ? 'true' : 'false';
    }

    if (typeof obj === 'string') {
        return inspectString(obj, opts);
    }
    if (typeof obj === 'number') {
        if (obj === 0) {
            return Infinity / obj > 0 ? '0' : '-0';
        }
        return String(obj);
    }
    if (typeof obj === 'bigint') {
        return String(obj) + 'n';
    }

    var maxDepth = typeof opts.depth === 'undefined' ? 5 : opts.depth;
    if (typeof depth === 'undefined') { depth = 0; }
    if (depth >= maxDepth && maxDepth > 0 && typeof obj === 'object') {
        return isArray(obj) ? '[Array]' : '[Object]';
    }

    var indent = getIndent(opts, depth);

    if (typeof seen === 'undefined') {
        seen = [];
    } else if (indexOf(seen, obj) >= 0) {
        return '[Circular]';
    }

    function inspect(value, from, noIndent) {
        if (from) {
            seen = seen.slice();
            seen.push(from);
        }
        if (noIndent) {
            var newOpts = {
                depth: opts.depth
            };
            if (has(opts, 'quoteStyle')) {
                newOpts.quoteStyle = opts.quoteStyle;
            }
            return inspect_(value, newOpts, depth + 1, seen);
        }
        return inspect_(value, opts, depth + 1, seen);
    }

    if (typeof obj === 'function') {
        var name = nameOf(obj);
        var keys = arrObjKeys(obj, inspect);
        return '[Function' + (name ? ': ' + name : ' (anonymous)') + ']' + (keys.length > 0 ? ' { ' + keys.join(', ') + ' }' : '');
    }
    if (isSymbol(obj)) {
        var symString = hasShammedSymbols ? String(obj).replace(/^(Symbol\(.*\))_[^)]*$/, '$1') : symToString.call(obj);
        return typeof obj === 'object' && !hasShammedSymbols ? markBoxed(symString) : symString;
    }
    if (isElement(obj)) {
        var s = '<' + String(obj.nodeName).toLowerCase();
        var attrs = obj.attributes || [];
        for (var i = 0; i < attrs.length; i++) {
            s += ' ' + attrs[i].name + '=' + wrapQuotes(quote(attrs[i].value), 'double', opts);
        }
        s += '>';
        if (obj.childNodes && obj.childNodes.length) { s += '...'; }
        s += '</' + String(obj.nodeName).toLowerCase() + '>';
        return s;
    }
    if (isArray(obj)) {
        if (obj.length === 0) { return '[]'; }
        var xs = arrObjKeys(obj, inspect);
        if (indent && !singleLineValues(xs)) {
            return '[' + indentedJoin(xs, indent) + ']';
        }
        return '[ ' + xs.join(', ') + ' ]';
    }
    if (isError(obj)) {
        var parts = arrObjKeys(obj, inspect);
        if (parts.length === 0) { return '[' + String(obj) + ']'; }
        return '{ [' + String(obj) + '] ' + parts.join(', ') + ' }';
    }
    if (typeof obj === 'object' && customInspect) {
        if (inspectSymbol && typeof obj[inspectSymbol] === 'function') {
            return obj[inspectSymbol]();
        } else if (customInspect !== 'symbol' && typeof obj.inspect === 'function') {
            return obj.inspect();
        }
    }
    if (isMap(obj)) {
        var mapParts = [];
        mapForEach.call(obj, function (value, key) {
            mapParts.push(inspect(key, obj, true) + ' => ' + inspect(value, obj));
        });
        return collectionOf('Map', mapSize.call(obj), mapParts, indent);
    }
    if (isSet(obj)) {
        var setParts = [];
        setForEach.call(obj, function (value) {
            setParts.push(inspect(value, obj));
        });
        return collectionOf('Set', setSize.call(obj), setParts, indent);
    }
    if (isWeakMap(obj)) {
        return weakCollectionOf('WeakMap');
    }
    if (isWeakSet(obj)) {
        return weakCollectionOf('WeakSet');
    }
    if (isWeakRef(obj)) {
        return weakCollectionOf('WeakRef');
    }
    if (isNumber(obj)) {
        return markBoxed(inspect(Number(obj)));
    }
    if (isBigInt(obj)) {
        return markBoxed(inspect(bigIntValueOf.call(obj)));
    }
    if (isBoolean(obj)) {
        return markBoxed(booleanValueOf.call(obj));
    }
    if (isString(obj)) {
        return markBoxed(inspect(String(obj)));
    }
    if (!isDate(obj) && !isRegExp(obj)) {
        var ys = arrObjKeys(obj, inspect);
        var isPlainObject = gPO ? gPO(obj) === Object.prototype : obj instanceof Object || obj.constructor === Object;
        var protoTag = obj instanceof Object ? '' : 'null prototype';
        var stringTag = !isPlainObject && toStringTag && Object(obj) === obj && toStringTag in obj ? toStr(obj).slice(8, -1) : protoTag ? 'Object' : '';
        var constructorTag = isPlainObject || typeof obj.constructor !== 'function' ? '' : obj.constructor.name ? obj.constructor.name + ' ' : '';
        var tag = constructorTag + (stringTag || protoTag ? '[' + [].concat(stringTag || [], protoTag || []).join(': ') + '] ' : '');
        if (ys.length === 0) { return tag + '{}'; }
        if (indent) {
            return tag + '{' + indentedJoin(ys, indent) + '}';
        }
        return tag + '{ ' + ys.join(', ') + ' }';
    }
    return String(obj);
};

function wrapQuotes(s, defaultStyle, opts) {
    var quoteChar = (opts.quoteStyle || defaultStyle) === 'double' ? '"' : "'";
    return quoteChar + s + quoteChar;
}

function quote(s) {
    return String(s).replace(/"/g, '&quot;');
}

function isArray(obj) { return toStr(obj) === '[object Array]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isDate(obj) { return toStr(obj) === '[object Date]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isRegExp(obj) { return toStr(obj) === '[object RegExp]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isError(obj) { return toStr(obj) === '[object Error]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isString(obj) { return toStr(obj) === '[object String]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isNumber(obj) { return toStr(obj) === '[object Number]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isBoolean(obj) { return toStr(obj) === '[object Boolean]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }

// Symbol and BigInt do have Symbol.toStringTag by spec, so that can't be used to eliminate false positives
function isSymbol(obj) {
    if (hasShammedSymbols) {
        return obj && typeof obj === 'object' && obj instanceof Symbol;
    }
    if (typeof obj === 'symbol') {
        return true;
    }
    if (!obj || typeof obj !== 'object' || !symToString) {
        return false;
    }
    try {
        symToString.call(obj);
        return true;
    } catch (e) {}
    return false;
}

function isBigInt(obj) {
    if (!obj || typeof obj !== 'object' || !bigIntValueOf) {
        return false;
    }
    try {
        bigIntValueOf.call(obj);
        return true;
    } catch (e) {}
    return false;
}

var hasOwn = Object.prototype.hasOwnProperty || function (key) { return key in this; };
function has(obj, key) {
    return hasOwn.call(obj, key);
}

function toStr(obj) {
    return objectToString.call(obj);
}

function nameOf(f) {
    if (f.name) { return f.name; }
    var m = match.call(functionToString.call(f), /^function\s*([\w$]+)/);
    if (m) { return m[1]; }
    return null;
}

function indexOf(xs, x) {
    if (xs.indexOf) { return xs.indexOf(x); }
    for (var i = 0, l = xs.length; i < l; i++) {
        if (xs[i] === x) { return i; }
    }
    return -1;
}

function isMap(x) {
    if (!mapSize || !x || typeof x !== 'object') {
        return false;
    }
    try {
        mapSize.call(x);
        try {
            setSize.call(x);
        } catch (s) {
            return true;
        }
        return x instanceof Map; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isWeakMap(x) {
    if (!weakMapHas || !x || typeof x !== 'object') {
        return false;
    }
    try {
        weakMapHas.call(x, weakMapHas);
        try {
            weakSetHas.call(x, weakSetHas);
        } catch (s) {
            return true;
        }
        return x instanceof WeakMap; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isWeakRef(x) {
    if (!weakRefDeref || !x || typeof x !== 'object') {
        return false;
    }
    try {
        weakRefDeref.call(x);
        return true;
    } catch (e) {}
    return false;
}

function isSet(x) {
    if (!setSize || !x || typeof x !== 'object') {
        return false;
    }
    try {
        setSize.call(x);
        try {
            mapSize.call(x);
        } catch (m) {
            return true;
        }
        return x instanceof Set; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isWeakSet(x) {
    if (!weakSetHas || !x || typeof x !== 'object') {
        return false;
    }
    try {
        weakSetHas.call(x, weakSetHas);
        try {
            weakMapHas.call(x, weakMapHas);
        } catch (s) {
            return true;
        }
        return x instanceof WeakSet; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isElement(x) {
    if (!x || typeof x !== 'object') { return false; }
    if (typeof HTMLElement !== 'undefined' && x instanceof HTMLElement) {
        return true;
    }
    return typeof x.nodeName === 'string' && typeof x.getAttribute === 'function';
}

function inspectString(str, opts) {
    if (str.length > opts.maxStringLength) {
        var remaining = str.length - opts.maxStringLength;
        var trailer = '... ' + remaining + ' more character' + (remaining > 1 ? 's' : '');
        return inspectString(str.slice(0, opts.maxStringLength), opts) + trailer;
    }
    // eslint-disable-next-line no-control-regex
    var s = str.replace(/(['\\])/g, '\\$1').replace(/[\x00-\x1f]/g, lowbyte);
    return wrapQuotes(s, 'single', opts);
}

function lowbyte(c) {
    var n = c.charCodeAt(0);
    var x = {
        8: 'b',
        9: 't',
        10: 'n',
        12: 'f',
        13: 'r'
    }[n];
    if (x) { return '\\' + x; }
    return '\\x' + (n < 0x10 ? '0' : '') + n.toString(16).toUpperCase();
}

function markBoxed(str) {
    return 'Object(' + str + ')';
}

function weakCollectionOf(type) {
    return type + ' { ? }';
}

function collectionOf(type, size, entries, indent) {
    var joinedEntries = indent ? indentedJoin(entries, indent) : entries.join(', ');
    return type + ' (' + size + ') {' + joinedEntries + '}';
}

function singleLineValues(xs) {
    for (var i = 0; i < xs.length; i++) {
        if (indexOf(xs[i], '\n') >= 0) {
            return false;
        }
    }
    return true;
}

function getIndent(opts, depth) {
    var baseIndent;
    if (opts.indent === '\t') {
        baseIndent = '\t';
    } else if (typeof opts.indent === 'number' && opts.indent > 0) {
        baseIndent = Array(opts.indent + 1).join(' ');
    } else {
        return null;
    }
    return {
        base: baseIndent,
        prev: Array(depth + 1).join(baseIndent)
    };
}

function indentedJoin(xs, indent) {
    if (xs.length === 0) { return ''; }
    var lineJoiner = '\n' + indent.prev + indent.base;
    return lineJoiner + xs.join(',' + lineJoiner) + '\n' + indent.prev;
}

function arrObjKeys(obj, inspect) {
    var isArr = isArray(obj);
    var xs = [];
    if (isArr) {
        xs.length = obj.length;
        for (var i = 0; i < obj.length; i++) {
            xs[i] = has(obj, i) ? inspect(obj[i], obj) : '';
        }
    }
    var syms = typeof gOPS === 'function' ? gOPS(obj) : [];
    var symMap;
    if (hasShammedSymbols) {
        symMap = {};
        for (var k = 0; k < syms.length; k++) {
            symMap['$' + syms[k]] = syms[k];
        }
    }

    for (var key in obj) { // eslint-disable-line no-restricted-syntax
        if (!has(obj, key)) { continue; } // eslint-disable-line no-restricted-syntax, no-continue
        if (isArr && String(Number(key)) === key && key < obj.length) { continue; } // eslint-disable-line no-restricted-syntax, no-continue
        if (hasShammedSymbols && symMap['$' + key] instanceof Symbol) {
            // this is to prevent shammed Symbols, which are stored as strings, from being included in the string key section
            continue; // eslint-disable-line no-restricted-syntax, no-continue
        } else if ((/[^\w$]/).test(key)) {
            xs.push(inspect(key, obj) + ': ' + inspect(obj[key], obj));
        } else {
            xs.push(key + ': ' + inspect(obj[key], obj));
        }
    }
    if (typeof gOPS === 'function') {
        for (var j = 0; j < syms.length; j++) {
            if (isEnumerable.call(obj, syms[j])) {
                xs.push('[' + inspect(syms[j]) + ']: ' + inspect(obj[syms[j]], obj));
            }
        }
    }
    return xs;
}


/***/ }),

/***/ "./node_modules/qs/lib/formats.js":
/*!****************************************!*\
  !*** ./node_modules/qs/lib/formats.js ***!
  \****************************************/
/***/ ((module) => {

"use strict";


var replace = String.prototype.replace;
var percentTwenties = /%20/g;

var Format = {
    RFC1738: 'RFC1738',
    RFC3986: 'RFC3986'
};

module.exports = {
    'default': Format.RFC3986,
    formatters: {
        RFC1738: function (value) {
            return replace.call(value, percentTwenties, '+');
        },
        RFC3986: function (value) {
            return String(value);
        }
    },
    RFC1738: Format.RFC1738,
    RFC3986: Format.RFC3986
};


/***/ }),

/***/ "./node_modules/qs/lib/index.js":
/*!**************************************!*\
  !*** ./node_modules/qs/lib/index.js ***!
  \**************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var stringify = __webpack_require__(/*! ./stringify */ "./node_modules/qs/lib/stringify.js");
var parse = __webpack_require__(/*! ./parse */ "./node_modules/qs/lib/parse.js");
var formats = __webpack_require__(/*! ./formats */ "./node_modules/qs/lib/formats.js");

module.exports = {
    formats: formats,
    parse: parse,
    stringify: stringify
};


/***/ }),

/***/ "./node_modules/qs/lib/parse.js":
/*!**************************************!*\
  !*** ./node_modules/qs/lib/parse.js ***!
  \**************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ./utils */ "./node_modules/qs/lib/utils.js");

var has = Object.prototype.hasOwnProperty;
var isArray = Array.isArray;

var defaults = {
    allowDots: false,
    allowPrototypes: false,
    allowSparse: false,
    arrayLimit: 20,
    charset: 'utf-8',
    charsetSentinel: false,
    comma: false,
    decoder: utils.decode,
    delimiter: '&',
    depth: 5,
    ignoreQueryPrefix: false,
    interpretNumericEntities: false,
    parameterLimit: 1000,
    parseArrays: true,
    plainObjects: false,
    strictNullHandling: false
};

var interpretNumericEntities = function (str) {
    return str.replace(/&#(\d+);/g, function ($0, numberStr) {
        return String.fromCharCode(parseInt(numberStr, 10));
    });
};

var parseArrayValue = function (val, options) {
    if (val && typeof val === 'string' && options.comma && val.indexOf(',') > -1) {
        return val.split(',');
    }

    return val;
};

// This is what browsers will submit when the ✓ character occurs in an
// application/x-www-form-urlencoded body and the encoding of the page containing
// the form is iso-8859-1, or when the submitted form has an accept-charset
// attribute of iso-8859-1. Presumably also with other charsets that do not contain
// the ✓ character, such as us-ascii.
var isoSentinel = 'utf8=%26%2310003%3B'; // encodeURIComponent('&#10003;')

// These are the percent-encoded utf-8 octets representing a checkmark, indicating that the request actually is utf-8 encoded.
var charsetSentinel = 'utf8=%E2%9C%93'; // encodeURIComponent('✓')

var parseValues = function parseQueryStringValues(str, options) {
    var obj = {};
    var cleanStr = options.ignoreQueryPrefix ? str.replace(/^\?/, '') : str;
    var limit = options.parameterLimit === Infinity ? undefined : options.parameterLimit;
    var parts = cleanStr.split(options.delimiter, limit);
    var skipIndex = -1; // Keep track of where the utf8 sentinel was found
    var i;

    var charset = options.charset;
    if (options.charsetSentinel) {
        for (i = 0; i < parts.length; ++i) {
            if (parts[i].indexOf('utf8=') === 0) {
                if (parts[i] === charsetSentinel) {
                    charset = 'utf-8';
                } else if (parts[i] === isoSentinel) {
                    charset = 'iso-8859-1';
                }
                skipIndex = i;
                i = parts.length; // The eslint settings do not allow break;
            }
        }
    }

    for (i = 0; i < parts.length; ++i) {
        if (i === skipIndex) {
            continue;
        }
        var part = parts[i];

        var bracketEqualsPos = part.indexOf(']=');
        var pos = bracketEqualsPos === -1 ? part.indexOf('=') : bracketEqualsPos + 1;

        var key, val;
        if (pos === -1) {
            key = options.decoder(part, defaults.decoder, charset, 'key');
            val = options.strictNullHandling ? null : '';
        } else {
            key = options.decoder(part.slice(0, pos), defaults.decoder, charset, 'key');
            val = utils.maybeMap(
                parseArrayValue(part.slice(pos + 1), options),
                function (encodedVal) {
                    return options.decoder(encodedVal, defaults.decoder, charset, 'value');
                }
            );
        }

        if (val && options.interpretNumericEntities && charset === 'iso-8859-1') {
            val = interpretNumericEntities(val);
        }

        if (part.indexOf('[]=') > -1) {
            val = isArray(val) ? [val] : val;
        }

        if (has.call(obj, key)) {
            obj[key] = utils.combine(obj[key], val);
        } else {
            obj[key] = val;
        }
    }

    return obj;
};

var parseObject = function (chain, val, options, valuesParsed) {
    var leaf = valuesParsed ? val : parseArrayValue(val, options);

    for (var i = chain.length - 1; i >= 0; --i) {
        var obj;
        var root = chain[i];

        if (root === '[]' && options.parseArrays) {
            obj = [].concat(leaf);
        } else {
            obj = options.plainObjects ? Object.create(null) : {};
            var cleanRoot = root.charAt(0) === '[' && root.charAt(root.length - 1) === ']' ? root.slice(1, -1) : root;
            var index = parseInt(cleanRoot, 10);
            if (!options.parseArrays && cleanRoot === '') {
                obj = { 0: leaf };
            } else if (
                !isNaN(index)
                && root !== cleanRoot
                && String(index) === cleanRoot
                && index >= 0
                && (options.parseArrays && index <= options.arrayLimit)
            ) {
                obj = [];
                obj[index] = leaf;
            } else {
                obj[cleanRoot] = leaf;
            }
        }

        leaf = obj;
    }

    return leaf;
};

var parseKeys = function parseQueryStringKeys(givenKey, val, options, valuesParsed) {
    if (!givenKey) {
        return;
    }

    // Transform dot notation to bracket notation
    var key = options.allowDots ? givenKey.replace(/\.([^.[]+)/g, '[$1]') : givenKey;

    // The regex chunks

    var brackets = /(\[[^[\]]*])/;
    var child = /(\[[^[\]]*])/g;

    // Get the parent

    var segment = options.depth > 0 && brackets.exec(key);
    var parent = segment ? key.slice(0, segment.index) : key;

    // Stash the parent if it exists

    var keys = [];
    if (parent) {
        // If we aren't using plain objects, optionally prefix keys that would overwrite object prototype properties
        if (!options.plainObjects && has.call(Object.prototype, parent)) {
            if (!options.allowPrototypes) {
                return;
            }
        }

        keys.push(parent);
    }

    // Loop through children appending to the array until we hit depth

    var i = 0;
    while (options.depth > 0 && (segment = child.exec(key)) !== null && i < options.depth) {
        i += 1;
        if (!options.plainObjects && has.call(Object.prototype, segment[1].slice(1, -1))) {
            if (!options.allowPrototypes) {
                return;
            }
        }
        keys.push(segment[1]);
    }

    // If there's a remainder, just add whatever is left

    if (segment) {
        keys.push('[' + key.slice(segment.index) + ']');
    }

    return parseObject(keys, val, options, valuesParsed);
};

var normalizeParseOptions = function normalizeParseOptions(opts) {
    if (!opts) {
        return defaults;
    }

    if (opts.decoder !== null && opts.decoder !== undefined && typeof opts.decoder !== 'function') {
        throw new TypeError('Decoder has to be a function.');
    }

    if (typeof opts.charset !== 'undefined' && opts.charset !== 'utf-8' && opts.charset !== 'iso-8859-1') {
        throw new TypeError('The charset option must be either utf-8, iso-8859-1, or undefined');
    }
    var charset = typeof opts.charset === 'undefined' ? defaults.charset : opts.charset;

    return {
        allowDots: typeof opts.allowDots === 'undefined' ? defaults.allowDots : !!opts.allowDots,
        allowPrototypes: typeof opts.allowPrototypes === 'boolean' ? opts.allowPrototypes : defaults.allowPrototypes,
        allowSparse: typeof opts.allowSparse === 'boolean' ? opts.allowSparse : defaults.allowSparse,
        arrayLimit: typeof opts.arrayLimit === 'number' ? opts.arrayLimit : defaults.arrayLimit,
        charset: charset,
        charsetSentinel: typeof opts.charsetSentinel === 'boolean' ? opts.charsetSentinel : defaults.charsetSentinel,
        comma: typeof opts.comma === 'boolean' ? opts.comma : defaults.comma,
        decoder: typeof opts.decoder === 'function' ? opts.decoder : defaults.decoder,
        delimiter: typeof opts.delimiter === 'string' || utils.isRegExp(opts.delimiter) ? opts.delimiter : defaults.delimiter,
        // eslint-disable-next-line no-implicit-coercion, no-extra-parens
        depth: (typeof opts.depth === 'number' || opts.depth === false) ? +opts.depth : defaults.depth,
        ignoreQueryPrefix: opts.ignoreQueryPrefix === true,
        interpretNumericEntities: typeof opts.interpretNumericEntities === 'boolean' ? opts.interpretNumericEntities : defaults.interpretNumericEntities,
        parameterLimit: typeof opts.parameterLimit === 'number' ? opts.parameterLimit : defaults.parameterLimit,
        parseArrays: opts.parseArrays !== false,
        plainObjects: typeof opts.plainObjects === 'boolean' ? opts.plainObjects : defaults.plainObjects,
        strictNullHandling: typeof opts.strictNullHandling === 'boolean' ? opts.strictNullHandling : defaults.strictNullHandling
    };
};

module.exports = function (str, opts) {
    var options = normalizeParseOptions(opts);

    if (str === '' || str === null || typeof str === 'undefined') {
        return options.plainObjects ? Object.create(null) : {};
    }

    var tempObj = typeof str === 'string' ? parseValues(str, options) : str;
    var obj = options.plainObjects ? Object.create(null) : {};

    // Iterate over the keys and setup the new object

    var keys = Object.keys(tempObj);
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        var newObj = parseKeys(key, tempObj[key], options, typeof str === 'string');
        obj = utils.merge(obj, newObj, options);
    }

    if (options.allowSparse === true) {
        return obj;
    }

    return utils.compact(obj);
};


/***/ }),

/***/ "./node_modules/qs/lib/stringify.js":
/*!******************************************!*\
  !*** ./node_modules/qs/lib/stringify.js ***!
  \******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var getSideChannel = __webpack_require__(/*! side-channel */ "./node_modules/side-channel/index.js");
var utils = __webpack_require__(/*! ./utils */ "./node_modules/qs/lib/utils.js");
var formats = __webpack_require__(/*! ./formats */ "./node_modules/qs/lib/formats.js");
var has = Object.prototype.hasOwnProperty;

var arrayPrefixGenerators = {
    brackets: function brackets(prefix) {
        return prefix + '[]';
    },
    comma: 'comma',
    indices: function indices(prefix, key) {
        return prefix + '[' + key + ']';
    },
    repeat: function repeat(prefix) {
        return prefix;
    }
};

var isArray = Array.isArray;
var push = Array.prototype.push;
var pushToArray = function (arr, valueOrArray) {
    push.apply(arr, isArray(valueOrArray) ? valueOrArray : [valueOrArray]);
};

var toISO = Date.prototype.toISOString;

var defaultFormat = formats['default'];
var defaults = {
    addQueryPrefix: false,
    allowDots: false,
    charset: 'utf-8',
    charsetSentinel: false,
    delimiter: '&',
    encode: true,
    encoder: utils.encode,
    encodeValuesOnly: false,
    format: defaultFormat,
    formatter: formats.formatters[defaultFormat],
    // deprecated
    indices: false,
    serializeDate: function serializeDate(date) {
        return toISO.call(date);
    },
    skipNulls: false,
    strictNullHandling: false
};

var isNonNullishPrimitive = function isNonNullishPrimitive(v) {
    return typeof v === 'string'
        || typeof v === 'number'
        || typeof v === 'boolean'
        || typeof v === 'symbol'
        || typeof v === 'bigint';
};

var stringify = function stringify(
    object,
    prefix,
    generateArrayPrefix,
    strictNullHandling,
    skipNulls,
    encoder,
    filter,
    sort,
    allowDots,
    serializeDate,
    format,
    formatter,
    encodeValuesOnly,
    charset,
    sideChannel
) {
    var obj = object;

    if (sideChannel.has(object)) {
        throw new RangeError('Cyclic object value');
    }

    if (typeof filter === 'function') {
        obj = filter(prefix, obj);
    } else if (obj instanceof Date) {
        obj = serializeDate(obj);
    } else if (generateArrayPrefix === 'comma' && isArray(obj)) {
        obj = utils.maybeMap(obj, function (value) {
            if (value instanceof Date) {
                return serializeDate(value);
            }
            return value;
        });
    }

    if (obj === null) {
        if (strictNullHandling) {
            return encoder && !encodeValuesOnly ? encoder(prefix, defaults.encoder, charset, 'key', format) : prefix;
        }

        obj = '';
    }

    if (isNonNullishPrimitive(obj) || utils.isBuffer(obj)) {
        if (encoder) {
            var keyValue = encodeValuesOnly ? prefix : encoder(prefix, defaults.encoder, charset, 'key', format);
            return [formatter(keyValue) + '=' + formatter(encoder(obj, defaults.encoder, charset, 'value', format))];
        }
        return [formatter(prefix) + '=' + formatter(String(obj))];
    }

    var values = [];

    if (typeof obj === 'undefined') {
        return values;
    }

    var objKeys;
    if (generateArrayPrefix === 'comma' && isArray(obj)) {
        // we need to join elements in
        objKeys = [{ value: obj.length > 0 ? obj.join(',') || null : undefined }];
    } else if (isArray(filter)) {
        objKeys = filter;
    } else {
        var keys = Object.keys(obj);
        objKeys = sort ? keys.sort(sort) : keys;
    }

    for (var i = 0; i < objKeys.length; ++i) {
        var key = objKeys[i];
        var value = typeof key === 'object' && key.value !== undefined ? key.value : obj[key];

        if (skipNulls && value === null) {
            continue;
        }

        var keyPrefix = isArray(obj)
            ? typeof generateArrayPrefix === 'function' ? generateArrayPrefix(prefix, key) : prefix
            : prefix + (allowDots ? '.' + key : '[' + key + ']');

        sideChannel.set(object, true);
        var valueSideChannel = getSideChannel();
        pushToArray(values, stringify(
            value,
            keyPrefix,
            generateArrayPrefix,
            strictNullHandling,
            skipNulls,
            encoder,
            filter,
            sort,
            allowDots,
            serializeDate,
            format,
            formatter,
            encodeValuesOnly,
            charset,
            valueSideChannel
        ));
    }

    return values;
};

var normalizeStringifyOptions = function normalizeStringifyOptions(opts) {
    if (!opts) {
        return defaults;
    }

    if (opts.encoder !== null && opts.encoder !== undefined && typeof opts.encoder !== 'function') {
        throw new TypeError('Encoder has to be a function.');
    }

    var charset = opts.charset || defaults.charset;
    if (typeof opts.charset !== 'undefined' && opts.charset !== 'utf-8' && opts.charset !== 'iso-8859-1') {
        throw new TypeError('The charset option must be either utf-8, iso-8859-1, or undefined');
    }

    var format = formats['default'];
    if (typeof opts.format !== 'undefined') {
        if (!has.call(formats.formatters, opts.format)) {
            throw new TypeError('Unknown format option provided.');
        }
        format = opts.format;
    }
    var formatter = formats.formatters[format];

    var filter = defaults.filter;
    if (typeof opts.filter === 'function' || isArray(opts.filter)) {
        filter = opts.filter;
    }

    return {
        addQueryPrefix: typeof opts.addQueryPrefix === 'boolean' ? opts.addQueryPrefix : defaults.addQueryPrefix,
        allowDots: typeof opts.allowDots === 'undefined' ? defaults.allowDots : !!opts.allowDots,
        charset: charset,
        charsetSentinel: typeof opts.charsetSentinel === 'boolean' ? opts.charsetSentinel : defaults.charsetSentinel,
        delimiter: typeof opts.delimiter === 'undefined' ? defaults.delimiter : opts.delimiter,
        encode: typeof opts.encode === 'boolean' ? opts.encode : defaults.encode,
        encoder: typeof opts.encoder === 'function' ? opts.encoder : defaults.encoder,
        encodeValuesOnly: typeof opts.encodeValuesOnly === 'boolean' ? opts.encodeValuesOnly : defaults.encodeValuesOnly,
        filter: filter,
        format: format,
        formatter: formatter,
        serializeDate: typeof opts.serializeDate === 'function' ? opts.serializeDate : defaults.serializeDate,
        skipNulls: typeof opts.skipNulls === 'boolean' ? opts.skipNulls : defaults.skipNulls,
        sort: typeof opts.sort === 'function' ? opts.sort : null,
        strictNullHandling: typeof opts.strictNullHandling === 'boolean' ? opts.strictNullHandling : defaults.strictNullHandling
    };
};

module.exports = function (object, opts) {
    var obj = object;
    var options = normalizeStringifyOptions(opts);

    var objKeys;
    var filter;

    if (typeof options.filter === 'function') {
        filter = options.filter;
        obj = filter('', obj);
    } else if (isArray(options.filter)) {
        filter = options.filter;
        objKeys = filter;
    }

    var keys = [];

    if (typeof obj !== 'object' || obj === null) {
        return '';
    }

    var arrayFormat;
    if (opts && opts.arrayFormat in arrayPrefixGenerators) {
        arrayFormat = opts.arrayFormat;
    } else if (opts && 'indices' in opts) {
        arrayFormat = opts.indices ? 'indices' : 'repeat';
    } else {
        arrayFormat = 'indices';
    }

    var generateArrayPrefix = arrayPrefixGenerators[arrayFormat];

    if (!objKeys) {
        objKeys = Object.keys(obj);
    }

    if (options.sort) {
        objKeys.sort(options.sort);
    }

    var sideChannel = getSideChannel();
    for (var i = 0; i < objKeys.length; ++i) {
        var key = objKeys[i];

        if (options.skipNulls && obj[key] === null) {
            continue;
        }
        pushToArray(keys, stringify(
            obj[key],
            key,
            generateArrayPrefix,
            options.strictNullHandling,
            options.skipNulls,
            options.encode ? options.encoder : null,
            options.filter,
            options.sort,
            options.allowDots,
            options.serializeDate,
            options.format,
            options.formatter,
            options.encodeValuesOnly,
            options.charset,
            sideChannel
        ));
    }

    var joined = keys.join(options.delimiter);
    var prefix = options.addQueryPrefix === true ? '?' : '';

    if (options.charsetSentinel) {
        if (options.charset === 'iso-8859-1') {
            // encodeURIComponent('&#10003;'), the "numeric entity" representation of a checkmark
            prefix += 'utf8=%26%2310003%3B&';
        } else {
            // encodeURIComponent('✓')
            prefix += 'utf8=%E2%9C%93&';
        }
    }

    return joined.length > 0 ? prefix + joined : '';
};


/***/ }),

/***/ "./node_modules/qs/lib/utils.js":
/*!**************************************!*\
  !*** ./node_modules/qs/lib/utils.js ***!
  \**************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var formats = __webpack_require__(/*! ./formats */ "./node_modules/qs/lib/formats.js");

var has = Object.prototype.hasOwnProperty;
var isArray = Array.isArray;

var hexTable = (function () {
    var array = [];
    for (var i = 0; i < 256; ++i) {
        array.push('%' + ((i < 16 ? '0' : '') + i.toString(16)).toUpperCase());
    }

    return array;
}());

var compactQueue = function compactQueue(queue) {
    while (queue.length > 1) {
        var item = queue.pop();
        var obj = item.obj[item.prop];

        if (isArray(obj)) {
            var compacted = [];

            for (var j = 0; j < obj.length; ++j) {
                if (typeof obj[j] !== 'undefined') {
                    compacted.push(obj[j]);
                }
            }

            item.obj[item.prop] = compacted;
        }
    }
};

var arrayToObject = function arrayToObject(source, options) {
    var obj = options && options.plainObjects ? Object.create(null) : {};
    for (var i = 0; i < source.length; ++i) {
        if (typeof source[i] !== 'undefined') {
            obj[i] = source[i];
        }
    }

    return obj;
};

var merge = function merge(target, source, options) {
    /* eslint no-param-reassign: 0 */
    if (!source) {
        return target;
    }

    if (typeof source !== 'object') {
        if (isArray(target)) {
            target.push(source);
        } else if (target && typeof target === 'object') {
            if ((options && (options.plainObjects || options.allowPrototypes)) || !has.call(Object.prototype, source)) {
                target[source] = true;
            }
        } else {
            return [target, source];
        }

        return target;
    }

    if (!target || typeof target !== 'object') {
        return [target].concat(source);
    }

    var mergeTarget = target;
    if (isArray(target) && !isArray(source)) {
        mergeTarget = arrayToObject(target, options);
    }

    if (isArray(target) && isArray(source)) {
        source.forEach(function (item, i) {
            if (has.call(target, i)) {
                var targetItem = target[i];
                if (targetItem && typeof targetItem === 'object' && item && typeof item === 'object') {
                    target[i] = merge(targetItem, item, options);
                } else {
                    target.push(item);
                }
            } else {
                target[i] = item;
            }
        });
        return target;
    }

    return Object.keys(source).reduce(function (acc, key) {
        var value = source[key];

        if (has.call(acc, key)) {
            acc[key] = merge(acc[key], value, options);
        } else {
            acc[key] = value;
        }
        return acc;
    }, mergeTarget);
};

var assign = function assignSingleSource(target, source) {
    return Object.keys(source).reduce(function (acc, key) {
        acc[key] = source[key];
        return acc;
    }, target);
};

var decode = function (str, decoder, charset) {
    var strWithoutPlus = str.replace(/\+/g, ' ');
    if (charset === 'iso-8859-1') {
        // unescape never throws, no try...catch needed:
        return strWithoutPlus.replace(/%[0-9a-f]{2}/gi, unescape);
    }
    // utf-8
    try {
        return decodeURIComponent(strWithoutPlus);
    } catch (e) {
        return strWithoutPlus;
    }
};

var encode = function encode(str, defaultEncoder, charset, kind, format) {
    // This code was originally written by Brian White (mscdex) for the io.js core querystring library.
    // It has been adapted here for stricter adherence to RFC 3986
    if (str.length === 0) {
        return str;
    }

    var string = str;
    if (typeof str === 'symbol') {
        string = Symbol.prototype.toString.call(str);
    } else if (typeof str !== 'string') {
        string = String(str);
    }

    if (charset === 'iso-8859-1') {
        return escape(string).replace(/%u[0-9a-f]{4}/gi, function ($0) {
            return '%26%23' + parseInt($0.slice(2), 16) + '%3B';
        });
    }

    var out = '';
    for (var i = 0; i < string.length; ++i) {
        var c = string.charCodeAt(i);

        if (
            c === 0x2D // -
            || c === 0x2E // .
            || c === 0x5F // _
            || c === 0x7E // ~
            || (c >= 0x30 && c <= 0x39) // 0-9
            || (c >= 0x41 && c <= 0x5A) // a-z
            || (c >= 0x61 && c <= 0x7A) // A-Z
            || (format === formats.RFC1738 && (c === 0x28 || c === 0x29)) // ( )
        ) {
            out += string.charAt(i);
            continue;
        }

        if (c < 0x80) {
            out = out + hexTable[c];
            continue;
        }

        if (c < 0x800) {
            out = out + (hexTable[0xC0 | (c >> 6)] + hexTable[0x80 | (c & 0x3F)]);
            continue;
        }

        if (c < 0xD800 || c >= 0xE000) {
            out = out + (hexTable[0xE0 | (c >> 12)] + hexTable[0x80 | ((c >> 6) & 0x3F)] + hexTable[0x80 | (c & 0x3F)]);
            continue;
        }

        i += 1;
        c = 0x10000 + (((c & 0x3FF) << 10) | (string.charCodeAt(i) & 0x3FF));
        out += hexTable[0xF0 | (c >> 18)]
            + hexTable[0x80 | ((c >> 12) & 0x3F)]
            + hexTable[0x80 | ((c >> 6) & 0x3F)]
            + hexTable[0x80 | (c & 0x3F)];
    }

    return out;
};

var compact = function compact(value) {
    var queue = [{ obj: { o: value }, prop: 'o' }];
    var refs = [];

    for (var i = 0; i < queue.length; ++i) {
        var item = queue[i];
        var obj = item.obj[item.prop];

        var keys = Object.keys(obj);
        for (var j = 0; j < keys.length; ++j) {
            var key = keys[j];
            var val = obj[key];
            if (typeof val === 'object' && val !== null && refs.indexOf(val) === -1) {
                queue.push({ obj: obj, prop: key });
                refs.push(val);
            }
        }
    }

    compactQueue(queue);

    return value;
};

var isRegExp = function isRegExp(obj) {
    return Object.prototype.toString.call(obj) === '[object RegExp]';
};

var isBuffer = function isBuffer(obj) {
    if (!obj || typeof obj !== 'object') {
        return false;
    }

    return !!(obj.constructor && obj.constructor.isBuffer && obj.constructor.isBuffer(obj));
};

var combine = function combine(a, b) {
    return [].concat(a, b);
};

var maybeMap = function maybeMap(val, fn) {
    if (isArray(val)) {
        var mapped = [];
        for (var i = 0; i < val.length; i += 1) {
            mapped.push(fn(val[i]));
        }
        return mapped;
    }
    return fn(val);
};

module.exports = {
    arrayToObject: arrayToObject,
    assign: assign,
    combine: combine,
    compact: compact,
    decode: decode,
    encode: encode,
    isBuffer: isBuffer,
    isRegExp: isRegExp,
    maybeMap: maybeMap,
    merge: merge
};


/***/ }),

/***/ "./node_modules/regenerator-runtime/runtime.js":
/*!*****************************************************!*\
  !*** ./node_modules/regenerator-runtime/runtime.js ***!
  \*****************************************************/
/***/ ((module) => {

/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var runtime = (function (exports) {
  "use strict";

  var Op = Object.prototype;
  var hasOwn = Op.hasOwnProperty;
  var undefined; // More compressible than void 0.
  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

  function define(obj, key, value) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
    return obj[key];
  }
  try {
    // IE 8 has a broken Object.defineProperty that only works on DOM objects.
    define({}, "");
  } catch (err) {
    define = function(obj, key, value) {
      return obj[key] = value;
    };
  }

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
    var generator = Object.create(protoGenerator.prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    generator._invoke = makeInvokeMethod(innerFn, self, context);

    return generator;
  }
  exports.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  // This is a polyfill for %IteratorPrototype% for environments that
  // don't natively support it.
  var IteratorPrototype = {};
  IteratorPrototype[iteratorSymbol] = function () {
    return this;
  };

  var getProto = Object.getPrototypeOf;
  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
  if (NativeIteratorPrototype &&
      NativeIteratorPrototype !== Op &&
      hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
    // This environment has a native %IteratorPrototype%; use it instead
    // of the polyfill.
    IteratorPrototype = NativeIteratorPrototype;
  }

  var Gp = GeneratorFunctionPrototype.prototype =
    Generator.prototype = Object.create(IteratorPrototype);
  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
  GeneratorFunctionPrototype.constructor = GeneratorFunction;
  GeneratorFunction.displayName = define(
    GeneratorFunctionPrototype,
    toStringTagSymbol,
    "GeneratorFunction"
  );

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function(method) {
      define(prototype, method, function(arg) {
        return this._invoke(method, arg);
      });
    });
  }

  exports.isGeneratorFunction = function(genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor
      ? ctor === GeneratorFunction ||
        // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction"
      : false;
  };

  exports.mark = function(genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
      define(genFun, toStringTagSymbol, "GeneratorFunction");
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `hasOwn.call(value, "__await")` to determine if the yielded value is
  // meant to be awaited.
  exports.awrap = function(arg) {
    return { __await: arg };
  };

  function AsyncIterator(generator, PromiseImpl) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;
        if (value &&
            typeof value === "object" &&
            hasOwn.call(value, "__await")) {
          return PromiseImpl.resolve(value.__await).then(function(value) {
            invoke("next", value, resolve, reject);
          }, function(err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return PromiseImpl.resolve(value).then(function(unwrapped) {
          // When a yielded Promise is resolved, its final value becomes
          // the .value of the Promise<{value,done}> result for the
          // current iteration.
          result.value = unwrapped;
          resolve(result);
        }, function(error) {
          // If a rejected Promise was yielded, throw the rejection back
          // into the async generator function so it can be handled there.
          return invoke("throw", error, resolve, reject);
        });
      }
    }

    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new PromiseImpl(function(resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }

      return previousPromise =
        // If enqueue has been called before, then we want to wait until
        // all previous Promises have been resolved before calling invoke,
        // so that results are always delivered in the correct order. If
        // enqueue has not been called before, then it is important to
        // call invoke immediately, without waiting on a callback to fire,
        // so that the async generator function has the opportunity to do
        // any necessary setup in a predictable way. This predictability
        // is why the Promise constructor synchronously invokes its
        // executor callback, and why async functions synchronously
        // execute code before the first await. Since we implement simple
        // async functions in terms of async generators, it is especially
        // important to get this right, even though it requires care.
        previousPromise ? previousPromise.then(
          callInvokeWithMethodAndArg,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg
        ) : callInvokeWithMethodAndArg();
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);
  AsyncIterator.prototype[asyncIteratorSymbol] = function () {
    return this;
  };
  exports.AsyncIterator = AsyncIterator;

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  exports.async = function(innerFn, outerFn, self, tryLocsList, PromiseImpl) {
    if (PromiseImpl === void 0) PromiseImpl = Promise;

    var iter = new AsyncIterator(
      wrap(innerFn, outerFn, self, tryLocsList),
      PromiseImpl
    );

    return exports.isGeneratorFunction(outerFn)
      ? iter // If outerFn is a generator, return the full iterator.
      : iter.next().then(function(result) {
          return result.done ? result.value : iter.next();
        });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      context.method = method;
      context.arg = arg;

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          var delegateResult = maybeInvokeDelegate(delegate, context);
          if (delegateResult) {
            if (delegateResult === ContinueSentinel) continue;
            return delegateResult;
          }
        }

        if (context.method === "next") {
          // Setting context._sent for legacy support of Babel's
          // function.sent implementation.
          context.sent = context._sent = context.arg;

        } else if (context.method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw context.arg;
          }

          context.dispatchException(context.arg);

        } else if (context.method === "return") {
          context.abrupt("return", context.arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          if (record.arg === ContinueSentinel) {
            continue;
          }

          return {
            value: record.arg,
            done: context.done
          };

        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(context.arg) call above.
          context.method = "throw";
          context.arg = record.arg;
        }
      }
    };
  }

  // Call delegate.iterator[context.method](context.arg) and handle the
  // result, either by returning a { value, done } result from the
  // delegate iterator, or by modifying context.method and context.arg,
  // setting context.delegate to null, and returning the ContinueSentinel.
  function maybeInvokeDelegate(delegate, context) {
    var method = delegate.iterator[context.method];
    if (method === undefined) {
      // A .throw or .return when the delegate iterator has no .throw
      // method always terminates the yield* loop.
      context.delegate = null;

      if (context.method === "throw") {
        // Note: ["return"] must be used for ES3 parsing compatibility.
        if (delegate.iterator["return"]) {
          // If the delegate iterator has a return method, give it a
          // chance to clean up.
          context.method = "return";
          context.arg = undefined;
          maybeInvokeDelegate(delegate, context);

          if (context.method === "throw") {
            // If maybeInvokeDelegate(context) changed context.method from
            // "return" to "throw", let that override the TypeError below.
            return ContinueSentinel;
          }
        }

        context.method = "throw";
        context.arg = new TypeError(
          "The iterator does not provide a 'throw' method");
      }

      return ContinueSentinel;
    }

    var record = tryCatch(method, delegate.iterator, context.arg);

    if (record.type === "throw") {
      context.method = "throw";
      context.arg = record.arg;
      context.delegate = null;
      return ContinueSentinel;
    }

    var info = record.arg;

    if (! info) {
      context.method = "throw";
      context.arg = new TypeError("iterator result is not an object");
      context.delegate = null;
      return ContinueSentinel;
    }

    if (info.done) {
      // Assign the result of the finished delegate to the temporary
      // variable specified by delegate.resultName (see delegateYield).
      context[delegate.resultName] = info.value;

      // Resume execution at the desired location (see delegateYield).
      context.next = delegate.nextLoc;

      // If context.method was "throw" but the delegate handled the
      // exception, let the outer generator proceed normally. If
      // context.method was "next", forget context.arg since it has been
      // "consumed" by the delegate iterator. If context.method was
      // "return", allow the original .return call to continue in the
      // outer generator.
      if (context.method !== "return") {
        context.method = "next";
        context.arg = undefined;
      }

    } else {
      // Re-yield the result returned by the delegate method.
      return info;
    }

    // The delegate iterator is finished, so forget it and continue with
    // the outer generator.
    context.delegate = null;
    return ContinueSentinel;
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  define(Gp, toStringTagSymbol, "Generator");

  // A Generator should always return itself as the iterator object when the
  // @@iterator function is called on it. Some browsers' implementations of the
  // iterator prototype chain incorrectly implement this, causing the Generator
  // object to not be returned from this call. This ensures that doesn't happen.
  // See https://github.com/facebook/regenerator/issues/274 for more details.
  Gp[iteratorSymbol] = function() {
    return this;
  };

  Gp.toString = function() {
    return "[object Generator]";
  };

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  exports.keys = function(object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1, next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  exports.values = values;

  function doneResult() {
    return { value: undefined, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      // Resetting context._sent for legacy support of Babel's
      // function.sent implementation.
      this.sent = this._sent = undefined;
      this.done = false;
      this.delegate = null;

      this.method = "next";
      this.arg = undefined;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" &&
              hasOwn.call(this, name) &&
              !isNaN(+name.slice(1))) {
            this[name] = undefined;
          }
        }
      }
    },

    stop: function() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;

        if (caught) {
          // If the dispatched exception was caught by a catch block,
          // then let that catch block handle the exception normally.
          context.method = "next";
          context.arg = undefined;
        }

        return !! caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }

          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") &&
            this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry &&
          (type === "break" ||
           type === "continue") &&
          finallyEntry.tryLoc <= arg &&
          arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.method = "next";
        this.next = finallyEntry.finallyLoc;
        return ContinueSentinel;
      }

      return this.complete(record);
    },

    complete: function(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = this.arg = record.arg;
        this.method = "return";
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }

      return ContinueSentinel;
    },

    finish: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      if (this.method === "next") {
        // Deliberately forget the last sent value so that we don't
        // accidentally pass it on to the delegate.
        this.arg = undefined;
      }

      return ContinueSentinel;
    }
  };

  // Regardless of whether this script is executing as a CommonJS module
  // or not, return the runtime object so that we can declare the variable
  // regeneratorRuntime in the outer scope, which allows this module to be
  // injected easily by `bin/regenerator --include-runtime script.js`.
  return exports;

}(
  // If this script is executing as a CommonJS module, use module.exports
  // as the regeneratorRuntime namespace. Otherwise create a new empty
  // object. Either way, the resulting object will be used to initialize
  // the regeneratorRuntime variable at the top of this file.
   true ? module.exports : 0
));

try {
  regeneratorRuntime = runtime;
} catch (accidentalStrictMode) {
  // This module should not be running in strict mode, so the above
  // assignment should always work unless something is misconfigured. Just
  // in case runtime.js accidentally runs in strict mode, we can escape
  // strict mode using a global Function call. This could conceivably fail
  // if a Content Security Policy forbids using Function, but in that case
  // the proper solution is to fix the accidental strict mode problem. If
  // you've misconfigured your bundler to force strict mode and applied a
  // CSP to forbid Function, and you're not willing to fix either of those
  // problems, please detail your unique predicament in a GitHub issue.
  Function("r", "regeneratorRuntime = r")(runtime);
}


/***/ }),

/***/ "./node_modules/side-channel/index.js":
/*!********************************************!*\
  !*** ./node_modules/side-channel/index.js ***!
  \********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var GetIntrinsic = __webpack_require__(/*! get-intrinsic */ "./node_modules/get-intrinsic/index.js");
var callBound = __webpack_require__(/*! call-bind/callBound */ "./node_modules/call-bind/callBound.js");
var inspect = __webpack_require__(/*! object-inspect */ "./node_modules/object-inspect/index.js");

var $TypeError = GetIntrinsic('%TypeError%');
var $WeakMap = GetIntrinsic('%WeakMap%', true);
var $Map = GetIntrinsic('%Map%', true);

var $weakMapGet = callBound('WeakMap.prototype.get', true);
var $weakMapSet = callBound('WeakMap.prototype.set', true);
var $weakMapHas = callBound('WeakMap.prototype.has', true);
var $mapGet = callBound('Map.prototype.get', true);
var $mapSet = callBound('Map.prototype.set', true);
var $mapHas = callBound('Map.prototype.has', true);

/*
 * This function traverses the list returning the node corresponding to the
 * given key.
 *
 * That node is also moved to the head of the list, so that if it's accessed
 * again we don't need to traverse the whole list. By doing so, all the recently
 * used nodes can be accessed relatively quickly.
 */
var listGetNode = function (list, key) { // eslint-disable-line consistent-return
	for (var prev = list, curr; (curr = prev.next) !== null; prev = curr) {
		if (curr.key === key) {
			prev.next = curr.next;
			curr.next = list.next;
			list.next = curr; // eslint-disable-line no-param-reassign
			return curr;
		}
	}
};

var listGet = function (objects, key) {
	var node = listGetNode(objects, key);
	return node && node.value;
};
var listSet = function (objects, key, value) {
	var node = listGetNode(objects, key);
	if (node) {
		node.value = value;
	} else {
		// Prepend the new node to the beginning of the list
		objects.next = { // eslint-disable-line no-param-reassign
			key: key,
			next: objects.next,
			value: value
		};
	}
};
var listHas = function (objects, key) {
	return !!listGetNode(objects, key);
};

module.exports = function getSideChannel() {
	var $wm;
	var $m;
	var $o;
	var channel = {
		assert: function (key) {
			if (!channel.has(key)) {
				throw new $TypeError('Side channel does not contain ' + inspect(key));
			}
		},
		get: function (key) { // eslint-disable-line consistent-return
			if ($WeakMap && key && (typeof key === 'object' || typeof key === 'function')) {
				if ($wm) {
					return $weakMapGet($wm, key);
				}
			} else if ($Map) {
				if ($m) {
					return $mapGet($m, key);
				}
			} else {
				if ($o) { // eslint-disable-line no-lonely-if
					return listGet($o, key);
				}
			}
		},
		has: function (key) {
			if ($WeakMap && key && (typeof key === 'object' || typeof key === 'function')) {
				if ($wm) {
					return $weakMapHas($wm, key);
				}
			} else if ($Map) {
				if ($m) {
					return $mapHas($m, key);
				}
			} else {
				if ($o) { // eslint-disable-line no-lonely-if
					return listHas($o, key);
				}
			}
			return false;
		},
		set: function (key, value) {
			if ($WeakMap && key && (typeof key === 'object' || typeof key === 'function')) {
				if (!$wm) {
					$wm = new $WeakMap();
				}
				$weakMapSet($wm, key, value);
			} else if ($Map) {
				if (!$m) {
					$m = new $Map();
				}
				$mapSet($m, key, value);
			} else {
				if (!$o) {
					/*
					 * Initialize the linked list as an empty node, so that we don't have
					 * to special-case handling of the first node: we can always refer to
					 * it as (previous node).next, instead of something like (list).head
					 */
					$o = { key: {}, next: null };
				}
				listSet($o, key, value);
			}
		}
	};
	return channel;
};


/***/ }),

/***/ "?4f7e":
/*!********************************!*\
  !*** ./util.inspect (ignored) ***!
  \********************************/
/***/ (() => {

/* (ignored) */

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
/*!*******************************!*\
  !*** ./resources/js/index.js ***!
  \*******************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _helper_util__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./helper/util */ "./resources/js/helper/util.js");
/* harmony import */ var _core_index__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./core/index */ "./resources/js/core/index.js");
/* harmony import */ var _network_network__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./network/network */ "./resources/js/network/network.js");
/* harmony import */ var _helper_types__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./helper/types */ "./resources/js/helper/types.js");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./config */ "./resources/js/config.js");
/* harmony import */ var _core_state__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./core/state */ "./resources/js/core/state.js");
/* harmony import */ var _nx_js_observer_util__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @nx-js/observer-util */ "./node_modules/@nx-js/observer-util/dist/es.es5.js");
function _defineEnumerableProperties(obj, descs) { for (var key in descs) { var desc = descs[key]; desc.configurable = desc.enumerable = true; if ("value" in desc) desc.writable = true; Object.defineProperty(obj, key, desc); } if (Object.getOwnPropertySymbols) { var objectSymbols = Object.getOwnPropertySymbols(descs); for (var i = 0; i < objectSymbols.length; i++) { var sym = objectSymbols[i]; var desc = descs[sym]; desc.configurable = desc.enumerable = true; if ("value" in desc) desc.writable = true; Object.defineProperty(obj, sym, desc); } } return obj; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }








window.Aquastrap = {
  onStart: function onStart(callback) {
    (0,_core_index__WEBPACK_IMPORTED_MODULE_1__._setAquaConfig)(_defineProperty({}, _config__WEBPACK_IMPORTED_MODULE_4__.LIFECYCLE_CONFIG_NAME[_helper_types__WEBPACK_IMPORTED_MODULE_3__.XHREvent.START], callback));

    return this;
  },
  onSuccess: function onSuccess(callback) {
    (0,_core_index__WEBPACK_IMPORTED_MODULE_1__._setAquaConfig)(_defineProperty({}, _config__WEBPACK_IMPORTED_MODULE_4__.LIFECYCLE_CONFIG_NAME[_helper_types__WEBPACK_IMPORTED_MODULE_3__.XHREvent.SUCCESS], callback));

    return this;
  },
  onError: function onError(callback) {
    (0,_core_index__WEBPACK_IMPORTED_MODULE_1__._setAquaConfig)(_defineProperty({}, _config__WEBPACK_IMPORTED_MODULE_4__.LIFECYCLE_CONFIG_NAME[_helper_types__WEBPACK_IMPORTED_MODULE_3__.XHREvent.ERROR], callback));

    return this;
  },
  onFinish: function onFinish(callback) {
    (0,_core_index__WEBPACK_IMPORTED_MODULE_1__._setAquaConfig)(_defineProperty({}, _config__WEBPACK_IMPORTED_MODULE_4__.LIFECYCLE_CONFIG_NAME[_helper_types__WEBPACK_IMPORTED_MODULE_3__.XHREvent.FINISH], callback));

    return this;
  },
  onNotification: function onNotification(callback) {
    (0,_core_index__WEBPACK_IMPORTED_MODULE_1__._setAquaConfig)(_defineProperty({}, _config__WEBPACK_IMPORTED_MODULE_4__.LIFECYCLE_CONFIG_NAME.notification, callback));

    return this;
  }
};
/**
 * id: the component class identifier 
 * key: the component instance indentifier
 */

window._aquaGenerate = function (id, key, componentIngredient, methods) {
  var methodsAccessor = (0,_network_network__WEBPACK_IMPORTED_MODULE_2__._replicatePublicMethods)(id, key, componentIngredient, methods);

  return _objectSpread({
    hook: resolveHooks(id, key, methodsAccessor)
  }, methodsAccessor);
};

function resolveHooks(id, key, methodsAccessor) {
  var hooks = {};

  var _loop = function _loop() {
    var _objectSpread2, _mutatorMap;

    var _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2),
        name = _Object$entries$_i[0],
        networkHandler = _Object$entries$_i[1];

    hooks = _objectSpread(_objectSpread({}, hooks), {}, (_objectSpread2 = {}, _mutatorMap = {}, _mutatorMap[name] = _mutatorMap[name] || {}, _mutatorMap[name].get = function () {
      return createHook((0,_core_state__WEBPACK_IMPORTED_MODULE_5__.reactivityManager)({
        id: id,
        key: key
      }, name), networkHandler);
    }, _defineEnumerableProperties(_objectSpread2, _mutatorMap), _objectSpread2));
  };

  for (var _i = 0, _Object$entries = Object.entries(methodsAccessor); _i < _Object$entries.length; _i++) {
    _loop();
  }

  return hooks;
}

function createHook(reactivity, networkHandler) {
  reactivity.initStates(); // good place to initiate component entity state

  return {
    reactiveState: reactivity.getStates(),
    // make sure to initStates() before getting
    state: _objectSpread({}, _core_state__WEBPACK_IMPORTED_MODULE_5__.initialState),
    submit: function submit(form) {
      var _this = this;

      var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _helper_types__WEBPACK_IMPORTED_MODULE_3__.Method.POST;
      (0,_core_state__WEBPACK_IMPORTED_MODULE_5__.dispatch)({
        type: 'START',
        payload: {}
      }, this, reactivity);
      networkHandler(form, type, this.state.abortController.signal).then(function (res) {
        (0,_core_state__WEBPACK_IMPORTED_MODULE_5__.dispatch)({
          type: 'SUCCESS',
          payload: res
        }, _this, reactivity);
      })["catch"](function (err) {
        (0,_core_state__WEBPACK_IMPORTED_MODULE_5__.dispatch)({
          type: 'ERROR',
          payload: {}
        }, _this, reactivity);
      })["finally"](function (_) {
        (0,_core_state__WEBPACK_IMPORTED_MODULE_5__.dispatch)({
          type: 'FINALLY',
          payload: {}
        }, _this, reactivity);
      });
    },
    cancel: function cancel() {
      if (this.state.abortController) this.state.abortController.abort();
    },
    observe: function observe(act) {
      var _this2 = this;

      (0,_nx_js_observer_util__WEBPACK_IMPORTED_MODULE_6__.observe)(function () {
        return act(_this2.reactiveState);
      });
    },
    resetStates: function resetStates() {
      (0,_core_state__WEBPACK_IMPORTED_MODULE_5__.dispatch)({
        type: 'RESET',
        payload: {}
      }, this, reactivity);
    },
    resetState: function resetState(toReset) {
      var _this3 = this;

      if (Array.isArray(toReset)) {
        toReset.forEach(function (item) {
          return (0,_core_state__WEBPACK_IMPORTED_MODULE_5__.dispatch)({
            type: 'RESET_ONLY',
            payload: {
              item: item
            }
          }, _this3, reactivity);
        });
        return;
      }

      (0,_core_state__WEBPACK_IMPORTED_MODULE_5__.dispatch)({
        type: 'RESET_ONLY',
        payload: {
          item: toReset
        }
      }, this, reactivity);
    },
    get: function get(form) {
      this.submit(form, _helper_types__WEBPACK_IMPORTED_MODULE_3__.Method.GET);
    },
    post: function post(form) {
      this.submit(form, _helper_types__WEBPACK_IMPORTED_MODULE_3__.Method.POST);
    },
    put: function put(form) {
      this.submit(form, _helper_types__WEBPACK_IMPORTED_MODULE_3__.Method.PUT);
    },
    patch: function patch(form) {
      this.submit(form, _helper_types__WEBPACK_IMPORTED_MODULE_3__.Method.PATCH);
    },
    "delete": function _delete(form) {
      this.submit(form, _helper_types__WEBPACK_IMPORTED_MODULE_3__.Method.DELETE);
    }
  };
}

window._registerAquaConfig = function () {
  var id = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  return {
    onStart: function onStart(callback) {
      (0,_core_index__WEBPACK_IMPORTED_MODULE_1__._setAquaConfig)(_defineProperty({}, _config__WEBPACK_IMPORTED_MODULE_4__.LIFECYCLE_CONFIG_NAME[_helper_types__WEBPACK_IMPORTED_MODULE_3__.XHREvent.START], callback), id);

      return this;
    },
    onSuccess: function onSuccess(callback) {
      (0,_core_index__WEBPACK_IMPORTED_MODULE_1__._setAquaConfig)(_defineProperty({}, _config__WEBPACK_IMPORTED_MODULE_4__.LIFECYCLE_CONFIG_NAME[_helper_types__WEBPACK_IMPORTED_MODULE_3__.XHREvent.SUCCESS], callback), id);

      return this;
    },
    onError: function onError(callback) {
      (0,_core_index__WEBPACK_IMPORTED_MODULE_1__._setAquaConfig)(_defineProperty({}, _config__WEBPACK_IMPORTED_MODULE_4__.LIFECYCLE_CONFIG_NAME[_helper_types__WEBPACK_IMPORTED_MODULE_3__.XHREvent.ERROR], callback), id);

      return this;
    },
    onFinish: function onFinish(callback) {
      (0,_core_index__WEBPACK_IMPORTED_MODULE_1__._setAquaConfig)(_defineProperty({}, _config__WEBPACK_IMPORTED_MODULE_4__.LIFECYCLE_CONFIG_NAME[_helper_types__WEBPACK_IMPORTED_MODULE_3__.XHREvent.FINISH], callback), id);

      return this;
    },
    onNotification: function onNotification(callback) {
      (0,_core_index__WEBPACK_IMPORTED_MODULE_1__._setAquaConfig)(_defineProperty({}, _config__WEBPACK_IMPORTED_MODULE_4__.LIFECYCLE_CONFIG_NAME.notification, callback), id);

      return this;
    }
  };
};
})();

/******/ })()
;