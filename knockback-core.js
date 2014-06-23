/*
  knockback-core.js 0.18.6
  Copyright (c)  2011-2014 Kevin Malakoff.
  License: MIT (http://www.opensource.org/licenses/mit-license.php)
  Source: https://github.com/kmalakoff/knockback
  Dependencies: Knockout.js, Backbone.js, and Underscore.js (or LoDash.js).
  Optional dependencies: Backbone.ModelRef.js and BackboneORM.
*/
(function() {
  var globals = {requires: []};
if (window.require) globals.requires.push(window.require);
if (typeof require !== "undefined" && require !== null) globals.requires.push(require);

/* local-only brunch-like require (based on https://github.com/brunch/commonjs-require-definition) */
(function() {
  'use strict';

  var modules = {};
  var cache = {};

  var has = function(object, name) {
    return ({}).hasOwnProperty.call(object, name);
  };

  var expand = function(root, name) {
    var results = [], parts, part;
    if (/^\.\.?(\/|$)/.test(name)) {
      parts = [root, name].join('/').split('/');
    } else {
      parts = name.split('/');
    }
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    var _require = function(name) {
      var dir = dirname(path);
      var absolute = expand(dir, name);
      return globals.require(absolute, path);
    };
    _require.register = globals.require.register;
    _require.shim = globals.require.shim;
    return _require;
  };

  var initModule = function(name, definition) {
    var module = {id: name, exports: {}};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var require = function(name, loaderPath) {
    var path = expand(name, '.');
    if (loaderPath == null) loaderPath = '/';

    if (has(cache, path)) return cache[path].exports;
    if (has(modules, path)) return initModule(path, modules[path]);

    var dirIndex = expand(path, './index');
    if (has(cache, dirIndex)) return cache[dirIndex].exports;
    if (has(modules, dirIndex)) return initModule(dirIndex, modules[dirIndex]);

    throw new Error('Cannot find module "' + name + '" from '+ '"' + loaderPath + '"');
  };

  var define = function(bundle, fn) {
    if (typeof bundle === 'object') {
      for (var key in bundle) {
        if (has(bundle, key)) {
          modules[key] = bundle[key];
        }
      }
    } else {
      modules[bundle] = fn;
    }
  };

  var toString = Object.prototype.toString;
  var isArray = function(obj) { return toString.call(obj) === '[object Array]'; }

  // client shimming to add to local module system
  var shim = function(info) {
    if (typeof window === "undefined") return;
    if (!isArray(info)) info = [info];

    var iterator = function(item) {
      var dep;

      // already registered with local require
      try { if (globals.require(item.path)) { return; } } catch (e) {}

      // use external require
      try { for (var ext_i = 0, ext_length = globals.requires.length; ext_i < ext_length; ext_i++) {if (dep = globals.requires[ext_i](item.path)) break;}} catch (e) {}

      // use symbol path on window
      if (!dep && item.symbol) {
        var components = item.symbol.split('.');
        dep = window;
        for (var i = 0, length = components.length; i < length; i++) { if (!(dep = dep[components[i]])) break; }
      }

      // not found
      if (!dep) {
        if (item.optional) return;
        throw new Error("Missing dependency: " + item.path);
      }

      // register with local require
      globals.require.register(item.path, (function(exports, require, module) { return module.exports = dep; }));
      if (item.alias) { globals.require.register(item.alias, (function(exports, require, module) { return module.exports = dep; })); }
    };

    for (var i = 0, length = info.length; i < length; i++) { iterator(info[i]); }
  };

  globals.require = require;
  globals.require.register = define;
  globals.require.shim = shim;
}).call(this);
var require = globals.require;
require.register('collection-observable', function(exports, require, module) {

/*
  knockback.js 0.18.6
  Copyright (c)  2011-2014 Kevin Malakoff.
  License: MIT (http://www.opensource.org/licenses/mit-license.php)
  Source: https://github.com/kmalakoff/knockback
  Dependencies: Knockout.js, Backbone.js, and Underscore.js (or LoDash.js).
  Optional dependencies: Backbone.ModelRef.js and BackboneORM.
 */
var COMPARE_ASCENDING, COMPARE_DESCENDING, COMPARE_EQUAL, kb, ko, _,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

kb = require('./kb');

_ = require('underscore');

ko = require('knockout');

COMPARE_EQUAL = 0;

COMPARE_ASCENDING = -1;

COMPARE_DESCENDING = 1;

kb.compare = function(value_a, value_b) {
  if (_.isString(value_a)) {
    return value_a.localeCompare("" + value_b);
  }
  if (_.isString(value_b)) {
    return value_b.localeCompare("" + value_a);
  }
  if (value_a === value_b) {
    return COMPARE_EQUAL;
  } else {
    if (value_a < value_b) {
      return COMPARE_ASCENDING;
    } else {
      return COMPARE_DESCENDING;
    }
  }
};

kb.CollectionObservable = (function() {
  CollectionObservable.extend = kb.extend;

  function CollectionObservable(collection, options) {
    return kb.ignore((function(_this) {
      return function() {
        var create_options, observable, _ref;
        if (_.isUndefined(options) && !(collection instanceof kb.Collection)) {
          _ref = [new kb.Collection(), collection], collection = _ref[0], options = _ref[1];
        } else if (_.isArray(collection)) {
          collection = new kb.Collection(collection);
        }
        options || (options = {});
        observable = kb.utils.wrappedObservable(_this, ko.observableArray([]));
        observable.__kb_is_co = true;
        _this.in_edit = 0;
        _this.__kb || (_this.__kb = {});
        _this.__kb._onCollectionChange = _.bind(_this._onCollectionChange, _this);
        options = kb.utils.collapseOptions(options);
        if (options.auto_compact) {
          _this.auto_compact = true;
        }
        if (options.sort_attribute) {
          _this._comparator = ko.observable(_this._attributeComparator(options.sort_attribute));
        } else {
          _this._comparator = ko.observable(options.comparator);
        }
        if (options.filters) {
          _this._filters = ko.observableArray(_.isArray(options.filters) ? options.filters : options.filters ? [options.filters] : void 0);
        } else {
          _this._filters = ko.observableArray([]);
        }
        create_options = _this.create_options = {
          store: kb.Store.useOptionsOrCreate(options, collection, observable)
        };
        _this.path = options.path;
        create_options.factory = kb.utils.wrappedFactory(observable, _this._shareOrCreateFactory(options));
        create_options.path = kb.utils.pathJoin(options.path, 'models');
        create_options.creator = create_options.factory.creatorForPath(null, create_options.path);
        if (create_options.creator) {
          _this.models_only = create_options.creator.models_only;
        }
        kb.publishMethods(observable, _this, ['destroy', 'shareOptions', 'filters', 'comparator', 'sortAttribute', 'viewModelByModel', 'hasViewModels']);
        _this._collection = ko.observable(collection);
        observable.collection = _this.collection = ko.dependentObservable({
          read: function() {
            return _this._collection();
          },
          write: function(new_collection) {
            return kb.ignore(function() {
              var previous_collection;
              if ((previous_collection = _this._collection()) === new_collection) {
                return;
              }
              if (previous_collection) {
                previous_collection.unbind('all', _this.__kb._onCollectionChange);
              }
              if (new_collection) {
                new_collection.bind('all', _this.__kb._onCollectionChange);
              }
              return _this._collection(new_collection);
            });
          }
        });
        if (collection) {
          collection.bind('all', _this.__kb._onCollectionChange);
        }
        _this._mapper = ko.dependentObservable(function() {
          var comparator, current_collection, filter, filters, models, view_models, _i, _len;
          comparator = _this._comparator();
          filters = _this._filters();
          if (filters) {
            for (_i = 0, _len = filters.length; _i < _len; _i++) {
              filter = filters[_i];
              ko.utils.unwrapObservable(filter);
            }
          }
          current_collection = _this._collection();
          if (_this.in_edit) {
            return;
          }
          observable = kb.utils.wrappedObservable(_this);
          if (current_collection) {
            models = current_collection.models;
          }
          if (!models || (current_collection.models.length === 0)) {
            view_models = [];
          } else {
            models = _.filter(models, function(model) {
              return !filters.length || _this._selectModel(model);
            });
            if (comparator) {
              view_models = _.map(models, function(model) {
                return _this._createViewModel(model);
              }).sort(comparator);
            } else {
              if (_this.models_only) {
                view_models = filters.length ? models : models.slice();
              } else {
                view_models = _.map(models, function(model) {
                  return _this._createViewModel(model);
                });
              }
            }
          }
          _this.in_edit++;
          observable(view_models);
          return _this.in_edit--;
        });
        observable.subscribe(_.bind(_this._onObservableArrayChange, _this));
        !kb.statistics || kb.statistics.register('CollectionObservable', _this);
        return observable;
      };
    })(this));
  }

  CollectionObservable.prototype.destroy = function() {
    var array, collection, observable;
    observable = kb.utils.wrappedObservable(this);
    collection = this._collection();
    if (collection) {
      collection.unbind('all', this.__kb._onCollectionChange);
      array = observable();
      array.splice(0, array.length);
    }
    this.collection.dispose();
    this._collection = observable.collection = this.collection = null;
    this._mapper.dispose();
    this._mapper = null;
    kb.release(this._filters);
    this._filters = null;
    this._comparator(null);
    this._comparator = null;
    this.create_options = null;
    observable.collection = null;
    kb.utils.wrappedDestroy(this);
    return !kb.statistics || kb.statistics.unregister('CollectionObservable', this);
  };

  CollectionObservable.prototype.shareOptions = function() {
    var observable;
    observable = kb.utils.wrappedObservable(this);
    return {
      store: kb.utils.wrappedStore(observable),
      factory: kb.utils.wrappedFactory(observable)
    };
  };

  CollectionObservable.prototype.filters = function(filters) {
    if (filters) {
      return this._filters(_.isArray(filters) ? filters : [filters]);
    } else {
      return this._filters([]);
    }
  };

  CollectionObservable.prototype.comparator = function(comparator) {
    return this._comparator(comparator);
  };

  CollectionObservable.prototype.sortAttribute = function(sort_attribute) {
    return this._comparator(sort_attribute ? this._attributeComparator(sort_attribute) : null);
  };

  CollectionObservable.prototype.viewModelByModel = function(model) {
    var id_attribute;
    if (this.models_only) {
      return null;
    }
    id_attribute = model.hasOwnProperty(model.idAttribute) ? model.idAttribute : 'cid';
    return _.find(kb.peek(kb.utils.wrappedObservable(this)), function(test) {
      var _ref;
      if (test != null ? (_ref = test.__kb) != null ? _ref.object : void 0 : void 0) {
        return test.__kb.object[id_attribute] === model[id_attribute];
      } else {
        return false;
      }
    });
  };

  CollectionObservable.prototype.hasViewModels = function() {
    return !this.models_only;
  };

  CollectionObservable.prototype.compact = function() {
    return kb.ignore((function(_this) {
      return function() {
        var observable;
        observable = kb.utils.wrappedObservable(_this);
        if (!kb.utils.wrappedStoreIsOwned(observable)) {
          return;
        }
        kb.utils.wrappedStore(observable).clear();
        return _this._collection.notifySubscribers(_this._collection());
      };
    })(this));
  };

  CollectionObservable.prototype._shareOrCreateFactory = function(options) {
    var absolute_models_path, existing_creator, factories, factory;
    absolute_models_path = kb.utils.pathJoin(options.path, 'models');
    factories = options.factories;
    if ((factory = options.factory)) {
      if ((existing_creator = factory.creatorForPath(null, absolute_models_path)) && (!factories || (factories['models'] === existing_creator))) {
        if (!factories) {
          return factory;
        }
        if (factory.hasPathMappings(factories, options.path)) {
          return factory;
        }
      }
    }
    factory = new kb.Factory(options.factory);
    if (factories) {
      factory.addPathMappings(factories, options.path);
    }
    if (!factory.creatorForPath(null, absolute_models_path)) {
      if (options.hasOwnProperty('models_only')) {
        if (options.models_only) {
          factory.addPathMapping(absolute_models_path, {
            models_only: true
          });
        } else {
          factory.addPathMapping(absolute_models_path, kb.ViewModel);
        }
      } else if (options.view_model) {
        factory.addPathMapping(absolute_models_path, options.view_model);
      } else if (options.create) {
        factory.addPathMapping(absolute_models_path, {
          create: options.create
        });
      } else {
        factory.addPathMapping(absolute_models_path, kb.ViewModel);
      }
    }
    return factory;
  };

  CollectionObservable.prototype._onCollectionChange = function(event, arg) {
    return kb.ignore((function(_this) {
      return function() {
        var collection, comparator, observable, view_model;
        if (_this.in_edit) {
          return;
        }
        switch (event) {
          case 'reset':
            if (_this.auto_compact) {
              _this.compact();
            } else {
              _this._collection.notifySubscribers(_this._collection());
            }
            break;
          case 'sort':
          case 'resort':
            _this._collection.notifySubscribers(_this._collection());
            break;
          case 'new':
          case 'add':
            if (!_this._selectModel(arg)) {
              return;
            }
            observable = kb.utils.wrappedObservable(_this);
            collection = _this._collection();
            if (collection.indexOf(arg) === -1) {
              return;
            }
            if ((view_model = _this.viewModelByModel(arg))) {
              return;
            }
            _this.in_edit++;
            view_model = _this._createViewModel(arg);
            if ((comparator = _this._comparator())) {
              observable().push(view_model);
              observable.sort(comparator);
            } else {
              observable.splice(collection.indexOf(arg), 0, view_model);
            }
            _this.in_edit--;
            break;
          case 'remove':
          case 'destroy':
            _this._onModelRemove(arg);
            break;
          case 'change':
            if (!_this._selectModel(arg)) {
              _this._onModelRemove(arg);
            } else {
              view_model = _this.models_only ? arg : _this.viewModelByModel(arg);
              if (view_model) {
                if ((comparator = _this._comparator())) {
                  observable = kb.utils.wrappedObservable(_this);
                  _this.in_edit++;
                  observable.sort(comparator);
                  _this.in_edit--;
                }
              } else {
                _this._onCollectionChange('add', arg);
              }
            }
        }
      };
    })(this));
  };

  CollectionObservable.prototype._onModelRemove = function(model) {
    var observable, view_model;
    view_model = this.models_only ? model : this.viewModelByModel(model);
    if (!view_model) {
      return;
    }
    observable = kb.utils.wrappedObservable(this);
    this.in_edit++;
    observable.remove(view_model);
    return this.in_edit--;
  };

  CollectionObservable.prototype._onObservableArrayChange = function(models_or_view_models) {
    return kb.ignore((function(_this) {
      return function() {
        var collection, has_filters, model, models, observable, view_model, view_models, _i, _len;
        if (_this.in_edit) {
          return;
        }
        (_this.models_only && (!models_or_view_models.length || kb.utils.hasModelSignature(models_or_view_models[0]))) || (!_this.models_only && (!models_or_view_models.length || (_.isObject(models_or_view_models[0]) && !kb.utils.hasModelSignature(models_or_view_models[0])))) || kb._throwUnexpected(_this, 'incorrect type passed');
        observable = kb.utils.wrappedObservable(_this);
        collection = kb.peek(_this._collection);
        has_filters = kb.peek(_this._filters).length;
        if (!collection) {
          return;
        }
        view_models = models_or_view_models;
        if (_this.models_only) {
          models = _.filter(models_or_view_models, function(model) {
            return !has_filters || _this._selectModel(model);
          });
        } else {
          !has_filters || (view_models = []);
          models = [];
          for (_i = 0, _len = models_or_view_models.length; _i < _len; _i++) {
            view_model = models_or_view_models[_i];
            model = kb.utils.wrappedObject(view_model);
            if (has_filters) {
              if (!_this._selectModel(model)) {
                continue;
              }
              view_models.push(view_model);
            }
            _this.create_options.store.findOrReplace(model, _this.create_options.creator, view_model);
            models.push(model);
          }
        }
        _this.in_edit++;
        (models_or_view_models.length === view_models.length) || observable(view_models);
        _.isEqual(collection.models, models) || collection.reset(models);
        _this.in_edit--;
      };
    })(this));
  };

  CollectionObservable.prototype._attributeComparator = function(sort_attribute) {
    var modelAttributeCompare;
    modelAttributeCompare = function(model_a, model_b) {
      var attribute_name;
      attribute_name = ko.utils.unwrapObservable(sort_attribute);
      return kb.compare(model_a.get(attribute_name), model_b.get(attribute_name));
    };
    return (this.models_only ? modelAttributeCompare : function(model_a, model_b) {
      return modelAttributeCompare(kb.utils.wrappedModel(model_a), kb.utils.wrappedModel(model_b));
    });
  };

  CollectionObservable.prototype._createViewModel = function(model) {
    if (this.models_only) {
      return model;
    }
    return this.create_options.store.findOrCreate(model, this.create_options);
  };

  CollectionObservable.prototype._selectModel = function(model) {
    var filter, filters, _i, _len, _ref;
    filters = kb.peek(this._filters);
    for (_i = 0, _len = filters.length; _i < _len; _i++) {
      filter = filters[_i];
      filter = kb.peek(filter);
      if (_.isFunction(filter)) {
        if (!filter(model)) {
          return false;
        }
      } else if (_.isArray(filter)) {
        if (_ref = model.id, __indexOf.call(filter, _ref) < 0) {
          return false;
        }
      } else {
        if (model.id !== filter) {
          return false;
        }
      }
    }
    return true;
  };

  return CollectionObservable;

})();

kb.collectionObservable = function(collection, options) {
  return new kb.CollectionObservable(collection, options);
};

});
require.register('event-watcher', function(exports, require, module) {

/*
  knockback.js 0.18.6
  Copyright (c)  2011-2014 Kevin Malakoff.
  License: MIT (http://www.opensource.org/licenses/mit-license.php)
  Source: https://github.com/kmalakoff/knockback
  Dependencies: Knockout.js, Backbone.js, and Underscore.js (or LoDash.js).
  Optional dependencies: Backbone.ModelRef.js and BackboneORM.
 */
var kb, ko, _,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

kb = require('./kb');

_ = require('underscore');

ko = require('knockout');

kb.EventWatcher = (function() {
  EventWatcher.useOptionsOrCreate = function(options, emitter, obj, callback_options) {
    if (options.event_watcher) {
      if (!(options.event_watcher.emitter() === emitter || (options.event_watcher.model_ref === emitter))) {
        kb._throwUnexpected(this, 'emitter not matching');
      }
      return kb.utils.wrappedEventWatcher(obj, options.event_watcher).registerCallbacks(obj, callback_options);
    } else {
      kb.utils.wrappedEventWatcherIsOwned(obj, true);
      return kb.utils.wrappedEventWatcher(obj, new kb.EventWatcher(emitter)).registerCallbacks(obj, callback_options);
    }
  };

  function EventWatcher(emitter, obj, callback_options) {
    this._onModelUnloaded = __bind(this._onModelUnloaded, this);
    this._onModelLoaded = __bind(this._onModelLoaded, this);
    this.__kb || (this.__kb = {});
    this.__kb.callbacks = {};
    this.__kb._onModelLoaded = _.bind(this._onModelLoaded, this);
    this.__kb._onModelUnloaded = _.bind(this._onModelUnloaded, this);
    if (callback_options) {
      this.registerCallbacks(obj, callback_options);
    }
    if (emitter) {
      this.emitter(emitter);
    } else {
      this.ee = null;
    }
  }

  EventWatcher.prototype.destroy = function() {
    this.emitter(null);
    this.__kb.callbacks = null;
    return kb.utils.wrappedDestroy(this);
  };

  EventWatcher.prototype.emitter = function(new_emitter) {
    var callbacks, event_name, info, list, previous_emitter, _i, _len, _ref;
    if ((arguments.length === 0) || (this.ee === new_emitter)) {
      return this.ee;
    }
    if (this.model_ref) {
      this.model_ref.unbind('loaded', this.__kb._onModelLoaded);
      this.model_ref.unbind('unloaded', this.__kb._onModelUnloaded);
      this.model_ref.release();
      this.model_ref = null;
    }
    if (kb.Backbone && kb.Backbone.ModelRef && (new_emitter instanceof kb.Backbone.ModelRef)) {
      this.model_ref = new_emitter;
      this.model_ref.retain();
      this.model_ref.bind('loaded', this.__kb._onModelLoaded);
      this.model_ref.bind('unloaded', this.__kb._onModelUnloaded);
      new_emitter = this.model_ref.model();
    } else {
      delete this.model_ref;
    }
    previous_emitter = this.ee;
    this.ee = new_emitter;
    _ref = this.__kb.callbacks;
    for (event_name in _ref) {
      callbacks = _ref[event_name];
      if (previous_emitter) {
        previous_emitter.unbind(event_name, callbacks.fn);
      }
      if (new_emitter) {
        this.ee.bind(event_name, callbacks.fn);
      }
      list = callbacks.list;
      for (_i = 0, _len = list.length; _i < _len; _i++) {
        info = list[_i];
        if (info.emitter) {
          info.emitter(this.ee);
        }
      }
    }
    return new_emitter;
  };

  EventWatcher.prototype.registerCallbacks = function(obj, callback_info) {
    var callbacks, event_name, event_names, event_selector, info, list, _i, _len;
    obj || kb._throwMissing(this, 'obj');
    callback_info || kb._throwMissing(this, 'info');
    event_selector = callback_info.event_selector ? callback_info.event_selector : 'change';
    event_names = event_selector.split(' ');
    for (_i = 0, _len = event_names.length; _i < _len; _i++) {
      event_name = event_names[_i];
      if (!event_name) {
        continue;
      }
      callbacks = this.__kb.callbacks[event_name];
      if (!callbacks) {
        list = [];
        callbacks = {
          list: list,
          fn: (function(_this) {
            return function(model) {
              var info, _j, _len1;
              for (_j = 0, _len1 = list.length; _j < _len1; _j++) {
                info = list[_j];
                if (info.update && !info.rel_fn) {
                  if (model && info.key && (model.hasChanged && !model.hasChanged(ko.utils.unwrapObservable(info.key)))) {
                    continue;
                  }
                  !kb.statistics || kb.statistics.addModelEvent({
                    name: event_name,
                    model: model,
                    key: info.key,
                    path: info.path
                  });
                  info.update();
                }
              }
              return null;
            };
          })(this)
        };
        this.__kb.callbacks[event_name] = callbacks;
        if (this.ee) {
          this.ee.bind(event_name, callbacks.fn);
        }
      }
      info = _.defaults({
        obj: obj
      }, callback_info);
      callbacks.list.push(info);
    }
    if (this.ee) {
      if (__indexOf.call(event_names, 'change') >= 0) {
        info.unbind_fn = kb.orm.bind(this.ee, info.key, info.update, info.path);
      }
      info.emitter(this.ee) && info.emitter;
    }
  };

  EventWatcher.prototype.releaseCallbacks = function(obj) {
    var callbacks, event_name, index, info, _ref, _ref1;
    if (!this.__kb.callbacks || !this.ee) {
      return;
    }
    _ref = this.__kb.callbacks;
    for (event_name in _ref) {
      callbacks = _ref[event_name];
      _ref1 = callbacks.list;
      for (index in _ref1) {
        info = _ref1[index];
        if (info.obj !== obj) {
          continue;
        }
        callbacks.list.splice(index, 1);
        if (info.unbind_fn) {
          info.unbind_fn();
          info.unbind_fn = null;
        }
        if (!kb.wasReleased(obj) && info.emitter) {
          info.emitter(null);
        }
        return;
      }
    }
  };

  EventWatcher.prototype._onModelLoaded = function(model) {
    var callbacks, event_name, info, _i, _len, _ref, _ref1;
    this.ee = model;
    _ref = this.__kb.callbacks;
    for (event_name in _ref) {
      callbacks = _ref[event_name];
      model.bind(event_name, callbacks.fn);
      _ref1 = callbacks.list;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        info = _ref1[_i];
        info.unbind_fn = kb.orm.bind(model, info.key, info.update, info.path);
        if (info.emitter) {
          info.emitter(model);
        }
      }
    }
  };

  EventWatcher.prototype._onModelUnloaded = function(model) {
    var callbacks, event_name, info, list, _i, _len, _ref;
    this.ee = null;
    _ref = this.__kb.callbacks;
    for (event_name in _ref) {
      callbacks = _ref[event_name];
      model.unbind(event_name, callbacks.fn);
      list = callbacks.list;
      for (_i = 0, _len = list.length; _i < _len; _i++) {
        info = list[_i];
        if (info.unbind_fn) {
          info.unbind_fn();
          info.unbind_fn = null;
        }
        if (info.emitter) {
          info.emitter(null);
        }
      }
    }
  };

  return EventWatcher;

})();

kb.emitterObservable = function(emitter, observable) {
  return new kb.EventWatcher(emitter, observable);
};

});
require.register('factory', function(exports, require, module) {

/*
  knockback.js 0.18.6
  Copyright (c)  2011-2014 Kevin Malakoff.
  License: MIT (http://www.opensource.org/licenses/mit-license.php)
  Source: https://github.com/kmalakoff/knockback
  Dependencies: Knockout.js, Backbone.js, and Underscore.js (or LoDash.js).
  Optional dependencies: Backbone.ModelRef.js and BackboneORM.
 */
var kb, _;

kb = require('./kb');

_ = require('underscore');

kb.Factory = (function() {
  Factory.useOptionsOrCreate = function(options, obj, owner_path) {
    var factory;
    if (options.factory && (!options.factories || (options.factories && options.factory.hasPathMappings(options.factories, owner_path)))) {
      return kb.utils.wrappedFactory(obj, options.factory);
    }
    factory = kb.utils.wrappedFactory(obj, new kb.Factory(options.factory));
    if (options.factories) {
      factory.addPathMappings(options.factories, owner_path);
    }
    return factory;
  };

  function Factory(parent_factory) {
    this.parent_factory = parent_factory;
    this.paths = {};
  }

  Factory.prototype.hasPath = function(path) {
    return this.paths.hasOwnProperty(path) || (this.parent_factory && this.parent_factory.hasPath(path));
  };

  Factory.prototype.addPathMapping = function(path, create_info) {
    return this.paths[path] = create_info;
  };

  Factory.prototype.addPathMappings = function(factories, owner_path) {
    var create_info, path;
    for (path in factories) {
      create_info = factories[path];
      this.paths[kb.utils.pathJoin(owner_path, path)] = create_info;
    }
  };

  Factory.prototype.hasPathMappings = function(factories, owner_path) {
    var all_exist, creator, existing_creator, path;
    all_exist = true;
    for (path in factories) {
      creator = factories[path];
      all_exist &= (existing_creator = this.creatorForPath(null, kb.utils.pathJoin(owner_path, path))) && (creator === existing_creator);
    }
    return all_exist;
  };

  Factory.prototype.creatorForPath = function(obj, path) {
    var creator;
    if ((creator = this.paths[path])) {
      if (creator.view_model) {
        return creator.view_model;
      } else {
        return creator;
      }
    }
    if (this.parent_factory) {
      if ((creator = this.parent_factory.creatorForPath(obj, path))) {
        return creator;
      }
    }
    return null;
  };

  return Factory;

})();

});
require.register('index', function(exports, require, module) {

/*
  knockback.js 0.18.6
  Copyright (c)  2011-2014 Kevin Malakoff.
  License: MIT (http://www.opensource.org/licenses/mit-license.php)
  Source: https://github.com/kmalakoff/knockback
  Dependencies: Knockout.js, Backbone.js, and Underscore.js (or LoDash.js).
  Optional dependencies: Backbone.ModelRef.js and BackboneORM.
 */
var Backbone, component, err, kb, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;

if (this.Parse) {
  this.Backbone = this.Parse;
  this._ = this.Parse._;
}

if ((typeof window !== "undefined" && window !== null) && require.shim) {
  require.shim([
    {
      symbol: '_',
      path: 'lodash',
      alias: 'underscore',
      optional: true
    }, {
      symbol: '_',
      path: 'underscore'
    }, {
      symbol: 'Backbone',
      path: 'backbone'
    }, {
      symbol: 'ko',
      path: 'knockout'
    }
  ]);
}

module.exports = kb = require('./kb');

if (this.Parse) {
  Backbone = kb.Parse = this.Parse;
} else {
  Backbone = kb.Backbone = require('backbone');
}

kb.Collection = Backbone.Collection;

kb.Model = Backbone.Object || Backbone.Model;

kb.Events = Backbone.Events;

kb._ = require('underscore');

kb.ko = require('knockout');

_ref = ['./utils', './event-watcher', './store', './factory', './observable', './view-model', './collection-observable', './orm', './inject'];
for (_i = 0, _len = _ref.length; _i < _len; _i++) {
  component = _ref[_i];
  require(component);
}

_ref1 = ['./default-observable', './formatted-observable', './localized-observable', './statistics', './triggered-observable', './validation'];
for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
  component = _ref1[_j];
  try {
    require(component);
  } catch (_error) {
    err = _error;
    ({});
  }
}

kb.modules = {};

_ref2 = ['underscore', 'backbone', 'knockout'];
for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
  component = _ref2[_k];
  kb.modules[component] = require(component);
}

});
require.register('inject', function(exports, require, module) {

/*
  knockback.js 0.18.6
  Copyright (c)  2011-2014 Kevin Malakoff.
  License: MIT (http://www.opensource.org/licenses/mit-license.php)
  Source: https://github.com/kmalakoff/knockback
  Dependencies: Knockout.js, Backbone.js, and Underscore.js (or LoDash.js).
  Optional dependencies: Backbone.ModelRef.js and BackboneORM.
 */
var kb, ko, onReady, _, _ko_applyBindings;

kb = require('./kb');

_ = require('underscore');

ko = require('knockout');

kb.RECUSIVE_AUTO_INJECT = true;

ko.bindingHandlers['inject'] = {
  'init': function(element, value_accessor, all_bindings_accessor, view_model) {
    return kb.Inject.inject(ko.utils.unwrapObservable(value_accessor()), view_model, element, value_accessor, all_bindings_accessor);
  }
};

kb.Inject = (function() {
  function Inject() {}

  Inject.inject = function(data, view_model, element, value_accessor, all_bindings_accessor, nested) {
    var inject, result, wrapper;
    inject = function(data) {
      var key, target, value;
      if (_.isFunction(data)) {
        view_model = new data(view_model, element, value_accessor, all_bindings_accessor);
        kb.releaseOnNodeRemove(view_model, element);
      } else {
        if (data.view_model) {
          view_model = new data.view_model(view_model, element, value_accessor, all_bindings_accessor);
          kb.releaseOnNodeRemove(view_model, element);
        }
        for (key in data) {
          value = data[key];
          if (key === 'view_model') {
            continue;
          }
          if (key === 'create') {
            value(view_model, element, value_accessor, all_bindings_accessor);
          } else if (_.isObject(value) && !_.isFunction(value)) {
            target = nested || (value && value.create) ? {} : view_model;
            view_model[key] = kb.Inject.inject(value, target, element, value_accessor, all_bindings_accessor, true);
          } else {
            view_model[key] = value;
          }
        }
      }
      return view_model;
    };
    if (nested) {
      return inject(data);
    } else {
      result = (wrapper = ko.dependentObservable(function() {
        return inject(data);
      }))();
      wrapper.dispose();
      return result;
    }
  };

  Inject.injectViewModels = function(root) {
    var afterBinding, app, beforeBinding, data, expression, findElements, options, results, _i, _len;
    results = [];
    findElements = function(el) {
      var attr, child_el, _i, _len, _ref;
      if (!el.__kb_injected) {
        if (el.attributes && (attr = _.find(el.attributes, function(attr) {
          return attr.name === 'kb-inject';
        }))) {
          el.__kb_injected = true;
          results.push({
            el: el,
            view_model: {},
            binding: attr.value
          });
        }
      }
      _ref = el.childNodes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child_el = _ref[_i];
        findElements(child_el);
      }
    };
    if (!root && (typeof document !== "undefined" && document !== null)) {
      root = document;
    }
    findElements(root);
    for (_i = 0, _len = results.length; _i < _len; _i++) {
      app = results[_i];
      if (expression = app.binding) {
        (expression.search(/[:]/) < 0) || (expression = "{" + expression + "}");
        data = (new Function("", "return ( " + expression + " )"))();
        data || (data = {});
        (!data.options) || (options = data.options, delete data.options);
        options || (options = {});
        app.view_model = kb.Inject.inject(data, app.view_model, app.el, null, null, true);
        afterBinding = app.view_model.afterBinding || options.afterBinding;
        beforeBinding = app.view_model.beforeBinding || options.beforeBinding;
      }
      if (beforeBinding) {
        beforeBinding(app.view_model, app.el, options);
      }
      kb.applyBindings(app.view_model, app.el, options);
      if (afterBinding) {
        afterBinding(app.view_model, app.el, options);
      }
    }
    return results;
  };

  return Inject;

})();

_ko_applyBindings = ko.applyBindings;

ko.applyBindings = function(context, element) {
  var results;
  results = kb.RECUSIVE_AUTO_INJECT ? kb.injectViewModels(element) : [];
  if (!results.length) {
    return _ko_applyBindings.apply(this, arguments);
  }
};

kb.injectViewModels = kb.Inject.injectViewModels;

if (typeof document !== "undefined" && document !== null) {
  if (this.$) {
    this.$(function() {
      return kb.injectViewModels();
    });
  } else {
    (onReady = function() {
      if (document.readyState !== "complete") {
        return setTimeout(onReady, 0);
      }
      return kb.injectViewModels();
    })();
  }
}

});
require.register('kb', function(exports, require, module) {

/*
  knockback.js 0.18.6
  Copyright (c)  2011-2014 Kevin Malakoff.
  License: MIT (http://www.opensource.org/licenses/mit-license.php)
  Source: https://github.com/kmalakoff/knockback
  Dependencies: Knockout.js, Backbone.js, and Underscore.js (or LoDash.js).
  Optional dependencies: Backbone.ModelRef.js and BackboneORM.
 */
var copyProps, kb, ko, _;

_ = require('underscore');

ko = require('knockout');

copyProps = function(dest, source) {
  var key, value;
  for (key in source) {
    value = source[key];
    dest[key] = value;
  }
  return dest;
};

// Shared empty constructor function to aid in prototype-chain creation.
var ctor = function(){};

// Helper function to correctly set up the prototype chain, for subclasses.
// Similar to 'goog.inherits', but uses a hash of prototype properties and
// class properties to be extended.
var inherits = function(parent, protoProps, staticProps) {
  var child;

  // The constructor function for the new subclass is either defined by you
  // (the "constructor" property in your extend definition), or defaulted
  // by us to simply call the parent's constructor.
  if (protoProps && protoProps.hasOwnProperty('constructor')) {
    child = protoProps.constructor;
  } else {
    child = function(){ parent.apply(this, arguments); };
  }

  // Inherit class (static) properties from parent.
  copyProps(child, parent);

  // Set the prototype chain to inherit from parent, without calling
  // parent's constructor function.
  ctor.prototype = parent.prototype;
  child.prototype = new ctor();

  // Add prototype properties (instance properties) to the subclass,
  // if supplied.
  if (protoProps) copyProps(child.prototype, protoProps);

  // Add static properties to the constructor function, if supplied.
  if (staticProps) copyProps(child, staticProps);

  // Correctly set child's 'prototype.constructor'.
  child.prototype.constructor = child;

  // Set a convenience property in case the parent's prototype is needed later.
  child.__super__ = parent.prototype;

  return child;
};

// The self-propagating extend function that BacLCone classes use.
var extend = function (protoProps, classProps) {
  var child = inherits(this, protoProps, classProps);
  child.extend = this.extend;
  return child;
};
;

module.exports = kb = (function() {
  var _ref;

  function kb() {}

  kb.VERSION = '0.18.6';

  kb.TYPE_UNKNOWN = 0;

  kb.TYPE_SIMPLE = 1;

  kb.TYPE_ARRAY = 2;

  kb.TYPE_MODEL = 3;

  kb.TYPE_COLLECTION = 4;

  kb.wasReleased = function(obj) {
    return !obj || obj.__kb_released;
  };

  kb.isReleaseable = function(obj, depth) {
    var key, value;
    if (depth == null) {
      depth = 0;
    }
    if ((!obj || (obj !== Object(obj))) || obj.__kb_released) {
      return false;
    } else if (ko.isObservable(obj) || (obj instanceof kb.ViewModel)) {
      return true;
    } else if ((typeof obj === 'function') || (obj instanceof kb.Model) || (obj instanceof kb.Collection)) {
      return false;
    } else if ((typeof obj.dispose === 'function') || (typeof obj.destroy === 'function') || (typeof obj.release === 'function')) {
      return true;
    } else if (depth < 1) {
      for (key in obj) {
        value = obj[key];
        if ((key !== '__kb') && kb.isReleaseable(value, depth + 1)) {
          return true;
        }
      }
    }
    return false;
  };

  kb.release = function(obj) {
    var array, index, value;
    if (!kb.isReleaseable(obj)) {
      return;
    }
    if (_.isArray(obj)) {
      for (index in obj) {
        value = obj[index];
        if (kb.isReleaseable(value)) {
          obj[index] = null;
          kb.release(value);
        }
      }
      return;
    }
    obj.__kb_released = true;
    if (ko.isObservable(obj) && _.isArray(array = kb.peek(obj))) {
      if (obj.__kb_is_co || (obj.__kb_is_o && (obj.valueType() === kb.TYPE_COLLECTION))) {
        if (obj.destroy) {
          obj.destroy();
        } else if (obj.dispose) {
          obj.dispose();
        }
      } else if (array.length) {
        for (index in array) {
          value = array[index];
          if (kb.isReleaseable(value)) {
            array[index] = null;
            kb.release(value);
          }
        }
      }
    } else if (typeof obj.release === 'function') {
      obj.release();
    } else if (typeof obj.destroy === 'function') {
      obj.destroy();
    } else if (typeof obj.dispose === 'function') {
      obj.dispose();
    } else if (!ko.isObservable(obj)) {
      this.releaseKeys(obj);
    }
  };

  kb.releaseKeys = function(obj) {
    var key, value;
    for (key in obj) {
      value = obj[key];
      if ((key !== '__kb') && kb.isReleaseable(value)) {
        obj[key] = null;
        kb.release(value);
      }
    }
  };

  kb.releaseOnNodeRemove = function(view_model, node) {
    view_model || kb._throwUnexpected(this, 'missing view model');
    node || kb._throwUnexpected(this, 'missing node');
    return ko.utils.domNodeDisposal.addDisposeCallback(node, function() {
      return kb.release(view_model);
    });
  };

  kb.renderTemplate = function(template, view_model, options) {
    var el, observable;
    if (options == null) {
      options = {};
    }
    if (typeof document === "undefined" || document === null) {
      return typeof console !== "undefined" && console !== null ? console.log('renderTemplate: document is undefined') : void 0;
    }
    el = document.createElement('div');
    observable = ko.renderTemplate(template, view_model, options, el, 'replaceChildren');
    if (el.children.length === 1) {
      el = el.children[0];
    }
    kb.releaseOnNodeRemove(view_model, el);
    observable.dispose();
    if (view_model.afterRender && !options.afterRender) {
      view_model.afterRender(el);
    }
    return el;
  };

  kb.applyBindings = function(view_model, node) {
    ko.applyBindings(view_model, node);
    return kb.releaseOnNodeRemove(view_model, node);
  };

  kb.getValue = function(model, key, args) {
    if (!model) {
      return;
    }
    if (_.isFunction(model[key]) && kb.orm.useFunction(model, key)) {
      return model[key]();
    }
    if (!args) {
      return model.get(key);
    }
    return model.get.apply(model, _.map([key].concat(args), function(value) {
      return kb.peek(value);
    }));
  };

  kb.setValue = function(model, key, value) {
    var attributes;
    if (!model) {
      return;
    }
    if (_.isFunction(model[key]) && kb.orm.useFunction(model, key)) {
      return model[key](value);
    }
    (attributes = {})[key] = value;
    return model.set(attributes);
  };

  kb.ignore = ((_ref = ko.dependencyDetection) != null ? _ref.ignore : void 0) || function(callback, callbackTarget, callbackArgs) {
    var value;
    value = null;
    ko.dependentObservable(function() {
      return value = callback.apply(callbackTarget, callbackArgs || []);
    }).dispose();
    return value;
  };

  kb.extend = extend;

  kb._throwMissing = function(instance, message) {
    throw "" + (_.isString(instance) ? instance : instance.constructor.name) + ": " + message + " is missing";
  };

  kb._throwUnexpected = function(instance, message) {
    throw "" + (_.isString(instance) ? instance : instance.constructor.name) + ": " + message + " is unexpected";
  };

  kb.publishMethods = function(observable, instance, methods) {
    var fn, _i, _len;
    for (_i = 0, _len = methods.length; _i < _len; _i++) {
      fn = methods[_i];
      observable[fn] = kb._.bind(instance[fn], instance);
    }
  };

  kb.peek = function(obs) {
    if (!ko.isObservable(obs)) {
      return obs;
    }
    if (obs.peek) {
      return obs.peek();
    }
    return kb.ignore(function() {
      return obs();
    });
  };

  return kb;

})();

});
require.register('observable', function(exports, require, module) {

/*
  knockback.js 0.18.6
  Copyright (c)  2011-2014 Kevin Malakoff.
  License: MIT (http://www.opensource.org/licenses/mit-license.php)
  Source: https://github.com/kmalakoff/knockback
  Dependencies: Knockout.js, Backbone.js, and Underscore.js (or LoDash.js).
  Optional dependencies: Backbone.ModelRef.js and BackboneORM.
 */
var kb, ko, _;

kb = require('./kb');

_ = require('underscore');

ko = require('knockout');

kb.Observable = (function() {
  function Observable(model, options, _vm) {
    this._vm = _vm != null ? _vm : {};
    return kb.ignore((function(_this) {
      return function() {
        var create_options, event_watcher, observable;
        options || kb._throwMissing(_this, 'options');
        if (_.isString(options) || ko.isObservable(options)) {
          create_options = _this.create_options = {
            key: options
          };
        } else {
          create_options = _this.create_options = kb.utils.collapseOptions(options);
        }
        _this.key = create_options.key;
        delete create_options.key;
        _this.key || kb._throwMissing(_this, 'key');
        !create_options.args || (_this.args = create_options.args, delete create_options.args);
        !create_options.read || (_this.read = create_options.read, delete create_options.read);
        !create_options.write || (_this.write = create_options.write, delete create_options.write);
        event_watcher = create_options.event_watcher;
        delete create_options.event_watcher;
        _this._vo = ko.observable(null);
        _this._model = ko.observable();
        observable = kb.utils.wrappedObservable(_this, ko.dependentObservable({
          read: function() {
            var arg, args, _i, _len, _model, _ref;
            _model = _this._model();
            _ref = args = [_this.key].concat(_this.args || []);
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              arg = _ref[_i];
              ko.utils.unwrapObservable(arg);
            }
            if (_this.read) {
              _this.update(_this.read.apply(_this._vm, args));
            } else if (!_.isUndefined(_model)) {
              kb.ignore(function() {
                return _this.update(kb.getValue(_model, kb.peek(_this.key), _this.args));
              });
            }
            return ko.utils.unwrapObservable(_this._vo());
          },
          write: function(new_value) {
            return kb.ignore(function() {
              var unwrapped_new_value, _model;
              unwrapped_new_value = kb.utils.unwrapModels(new_value);
              _model = kb.peek(_this._model);
              if (_this.write) {
                _this.write.call(_this._vm, unwrapped_new_value);
                new_value = kb.getValue(_model, kb.peek(_this.key), _this.args);
              } else if (_model) {
                kb.setValue(_model, kb.peek(_this.key), unwrapped_new_value);
              }
              return _this.update(new_value);
            });
          },
          owner: _this._vm
        }));
        observable.__kb_is_o = true;
        create_options.store = kb.utils.wrappedStore(observable, create_options.store);
        create_options.path = kb.utils.pathJoin(create_options.path, _this.key);
        if (create_options.factories && ((typeof create_options.factories === 'function') || create_options.factories.create)) {
          create_options.factory = kb.utils.wrappedFactory(observable, new kb.Factory(create_options.factory));
          create_options.factory.addPathMapping(create_options.path, create_options.factories);
        } else {
          create_options.factory = kb.Factory.useOptionsOrCreate(create_options, observable, create_options.path);
        }
        delete create_options.factories;
        kb.publishMethods(observable, _this, ['value', 'valueType', 'destroy']);
        observable.model = _this.model = ko.dependentObservable({
          read: function() {
            return ko.utils.unwrapObservable(_this._model);
          },
          write: function(new_model) {
            return kb.ignore(function() {
              var new_value;
              if (_this.__kb_released || (kb.peek(_this._model) === new_model)) {
                return;
              }
              new_value = kb.getValue(new_model, kb.peek(_this.key), _this.args);
              _this._model(new_model);
              if (!new_model) {
                return _this.update(null);
              } else if (!_.isUndefined(new_value)) {
                return _this.update(new_value);
              }
            });
          }
        });
        kb.EventWatcher.useOptionsOrCreate({
          event_watcher: event_watcher
        }, model, _this, {
          emitter: _this.model,
          update: _.bind(_this.update, _this),
          key: _this.key,
          path: create_options.path
        });
        _this.__kb_value || _this.update();
        if (kb.LocalizedObservable && create_options.localizer) {
          observable = new create_options.localizer(observable);
          delete create_options.localizer;
        }
        if (kb.DefaultObservable && create_options.hasOwnProperty('default')) {
          observable = kb.defaultObservable(observable, create_options["default"]);
          delete create_options["default"];
        }
        return observable;
      };
    })(this));
  }

  Observable.prototype.destroy = function() {
    var observable;
    observable = kb.utils.wrappedObservable(this);
    this.__kb_released = true;
    kb.release(this.__kb_value);
    this.__kb_value = null;
    this.model.dispose();
    this.model = observable.model = null;
    return kb.utils.wrappedDestroy(this);
  };

  Observable.prototype.value = function() {
    return this.__kb_value;
  };

  Observable.prototype.valueType = function() {
    var new_value;
    new_value = kb.getValue(kb.peek(this._model), kb.peek(this.key));
    this.value_type || this._updateValueObservable(new_value);
    return this.value_type;
  };

  Observable.prototype.update = function(new_value) {
    var new_type, value;
    if (this.__kb_released) {
      return;
    }
    if (!arguments.length) {
      new_value = kb.getValue(kb.peek(this._model), kb.peek(this.key));
    }
    (new_value !== void 0) || (new_value = null);
    new_type = kb.utils.valueType(new_value);
    if (!this.__kb_value || (this.__kb_value.__kb_released || (this.__kb_value.__kb_null && new_value))) {
      this.__kb_value = void 0;
      this.value_type = void 0;
    }
    value = this.__kb_value;
    if (_.isUndefined(this.value_type) || (this.value_type !== new_type && new_type !== kb.TYPE_UNKNOWN)) {
      if ((this.value_type === kb.TYPE_COLLECTION) && (new_type === kb.TYPE_ARRAY)) {
        return value(new_value);
      } else {
        return this._updateValueObservable(new_value);
      }
    } else if (this.value_type === kb.TYPE_MODEL) {
      if (typeof value.model === 'function') {
        if (value.model() !== new_value) {
          return value.model(new_value);
        }
      } else if (kb.utils.wrappedObject(value) !== new_value) {
        return this._updateValueObservable(new_value);
      }
    } else if (this.value_type === kb.TYPE_COLLECTION) {
      if (value.collection() !== new_value) {
        return value.collection(new_value);
      }
    } else {
      if (value() !== new_value) {
        return value(new_value);
      }
    }
  };

  Observable.prototype._updateValueObservable = function(new_value) {
    var create_options, creator, previous_value, value;
    create_options = this.create_options;
    create_options.creator = kb.utils.inferCreator(new_value, create_options.factory, create_options.path, kb.peek(this._model), this.key);
    this.value_type = kb.TYPE_UNKNOWN;
    creator = create_options.creator;
    previous_value = this.__kb_value;
    this.__kb_value = void 0;
    if (previous_value) {
      kb.release(previous_value);
    }
    if (creator) {
      if (create_options.store) {
        value = create_options.store.findOrCreate(new_value, create_options);
      } else {
        if (creator.models_only) {
          value = new_value;
          this.value_type = kb.TYPE_SIMPLE;
        } else if (creator.create) {
          value = creator.create(new_value, create_options);
        } else {
          value = new creator(new_value, create_options);
        }
      }
    } else {
      if (_.isArray(new_value)) {
        this.value_type = kb.TYPE_ARRAY;
        value = ko.observableArray(new_value);
      } else {
        this.value_type = kb.TYPE_SIMPLE;
        value = ko.observable(new_value);
      }
    }
    if (this.value_type === kb.TYPE_UNKNOWN) {
      if (!ko.isObservable(value)) {
        this.value_type = kb.TYPE_MODEL;
        if (typeof value.model !== 'function') {
          kb.utils.wrappedObject(value, new_value);
        }
      } else if (value.__kb_is_co) {
        this.value_type = kb.TYPE_COLLECTION;
      } else {
        this.value_type = kb.TYPE_SIMPLE;
      }
    }
    this.__kb_value = value;
    return this._vo(value);
  };

  return Observable;

})();

kb.observable = function(model, options, view_model) {
  return new kb.Observable(model, options, view_model);
};

});
require.register('orm', function(exports, require, module) {

/*
  knockback.js 0.18.6
  Copyright (c)  2011-2014 Kevin Malakoff.
  License: MIT (http://www.opensource.org/licenses/mit-license.php)
  Source: https://github.com/kmalakoff/knockback
  Dependencies: Knockout.js, Backbone.js, and Underscore.js (or LoDash.js).
  Optional dependencies: Backbone.ModelRef.js and BackboneORM.
 */
var ORM, ORMAdapter_BackboneAssociations, ORMAdapter_BackboneRelational, ORMAdapter_Supermodel, kb, _;

kb = require('./kb');

_ = require('underscore');

ORM = (function() {
  function ORM() {
    this.adapters = [];
  }

  ORM.prototype.initialize = function() {
    this.adapters = _.select(this.adapters, function(adapter) {
      return adapter.isAvailable();
    });
    return this.initialized = true;
  };

  ORM.prototype.addAdapter = function(adapter) {
    this.adapters.push(adapter);
    return this.initialized = false;
  };

  ORM.prototype.keys = function(model) {
    return this._call('keys', arguments);
  };

  ORM.prototype.bind = function(model) {
    return this._call('bind', arguments);
  };

  ORM.prototype.useFunction = function(model) {
    return this._call('useFunction', arguments);
  };

  ORM.prototype._call = function(name, args) {
    var adpater, result, _i, _len, _ref;
    if (!this.adapters.length) {
      return;
    }
    if (!this.initialized) {
      this.initialize();
    }
    _ref = this.adapters;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      adpater = _ref[_i];
      if (adpater[name] && (result = adpater[name].apply(adpater, args))) {
        return result;
      }
    }
  };

  return ORM;

})();

kb.orm = new ORM();

ORMAdapter_BackboneRelational = (function() {
  function ORMAdapter_BackboneRelational() {}

  ORMAdapter_BackboneRelational.prototype.isAvailable = function() {
    var _ref, _ref1;
    try {
      ((_ref = kb.Backbone) != null ? _ref.RelationalModel : void 0) || (typeof require === "function" ? require('backbone-relational') : void 0);
    } catch (_error) {

    }
    return !!((_ref1 = kb.Backbone) != null ? _ref1.RelationalModel : void 0);
  };

  ORMAdapter_BackboneRelational.prototype.relationType = function(model, key) {
    var relation;
    if (!(model instanceof kb.Backbone.RelationalModel)) {
      return null;
    }
    if (!(relation = _.find(model.getRelations(), function(test) {
      return test.key === key;
    }))) {
      return null;
    }
    if (relation.collectionType || _.isArray(relation.keyContents)) {
      return kb.TYPE_COLLECTION;
    } else {
      return kb.TYPE_MODEL;
    }
  };

  ORMAdapter_BackboneRelational.prototype.bind = function(model, key, update, path) {
    var event, events, rel_fn, type, _i, _len;
    if (!(type = this.relationType(model, key))) {
      return null;
    }
    rel_fn = function(model) {
      !kb.statistics || kb.statistics.addModelEvent({
        name: 'update (relational)',
        model: model,
        key: key,
        path: path
      });
      return update();
    };
    events = Backbone.Relation.prototype.sanitizeOptions ? ['update', 'add', 'remove'] : ['change', 'add', 'remove'];
    if (type === kb.TYPE_COLLECTION) {
      for (_i = 0, _len = events.length; _i < _len; _i++) {
        event = events[_i];
        model.bind("" + event + ":" + key, rel_fn);
      }
    } else {
      model.bind("" + events[0] + ":" + key, rel_fn);
    }
    return function() {
      var _j, _len1;
      if (type === kb.TYPE_COLLECTION) {
        for (_j = 0, _len1 = events.length; _j < _len1; _j++) {
          event = events[_j];
          model.unbind("" + event + ":" + key, rel_fn);
        }
      } else {
        model.unbind("" + events[0] + ":" + key, rel_fn);
      }
    };
  };

  return ORMAdapter_BackboneRelational;

})();

kb.orm.addAdapter(new ORMAdapter_BackboneRelational());

ORMAdapter_BackboneAssociations = (function() {
  function ORMAdapter_BackboneAssociations() {}

  ORMAdapter_BackboneAssociations.prototype.isAvailable = function() {
    var _ref, _ref1;
    try {
      ((_ref = kb.Backbone) != null ? _ref.AssociatedModel : void 0) || (typeof require === "function" ? require('backbone-associations') : void 0);
    } catch (_error) {

    }
    return !!((_ref1 = kb.Backbone) != null ? _ref1.AssociatedModel : void 0);
  };

  ORMAdapter_BackboneAssociations.prototype.keys = function(model) {
    if (!(model instanceof kb.Backbone.AssociatedModel)) {
      return null;
    }
    return _.map(model.relations, function(test) {
      return test.key;
    });
  };

  ORMAdapter_BackboneAssociations.prototype.relationType = function(model, key) {
    var relation;
    if (!(model instanceof kb.Backbone.AssociatedModel)) {
      return null;
    }
    if (!(relation = _.find(model.relations, function(test) {
      return test.key === key;
    }))) {
      return null;
    }
    if (relation.type === 'Many') {
      return kb.TYPE_COLLECTION;
    } else {
      return kb.TYPE_MODEL;
    }
  };

  return ORMAdapter_BackboneAssociations;

})();

kb.orm.addAdapter(new ORMAdapter_BackboneAssociations());

ORMAdapter_Supermodel = (function() {
  function ORMAdapter_Supermodel() {}

  ORMAdapter_Supermodel.prototype.isAvailable = function() {
    try {
      (typeof window !== "undefined" && window !== null ? window.Supermodel : void 0) || (typeof require === "function" ? require('supermodel') : void 0);
    } catch (_error) {

    }
    return !!(typeof window !== "undefined" && window !== null ? window.Supermodel : void 0);
  };

  ORMAdapter_Supermodel.prototype.keys = function(model) {
    if (!(model instanceof Supermodel.Model)) {
      return null;
    }
    return _.keys(model.constructor.associations());
  };

  ORMAdapter_Supermodel.prototype.relationType = function(model, key) {
    var relation;
    if (!(model instanceof Supermodel.Model)) {
      return null;
    }
    if (!(relation = model.constructor.associations()[key])) {
      return null;
    }
    if (relation.add) {
      return kb.TYPE_COLLECTION;
    } else {
      return kb.TYPE_MODEL;
    }
  };

  ORMAdapter_Supermodel.prototype.bind = function(model, key, update, path) {
    var rel_fn, type;
    if (!(type = this.relationType(model, key))) {
      return null;
    }
    rel_fn = function(model, other) {
      var previous, relation;
      !kb.statistics || kb.statistics.addModelEvent({
        name: 'update (supermodel)',
        model: model,
        key: key,
        path: path
      });
      relation = model.constructor.associations()[key];
      previous = model[relation.store];
      model[relation.store] = other;
      update(other);
      return model[relation.store] = previous;
    };
    if (type === kb.TYPE_MODEL) {
      model.bind("associate:" + key, rel_fn);
      return function() {
        return model.unbind("associate:" + key, rel_fn);
      };
    }
  };

  ORMAdapter_Supermodel.prototype.useFunction = function(model, key) {
    return !!this.relationType(model, key);
  };

  return ORMAdapter_Supermodel;

})();

kb.orm.addAdapter(new ORMAdapter_Supermodel());

});
require.register('store', function(exports, require, module) {

/*
  knockback.js 0.18.6
  Copyright (c)  2011-2014 Kevin Malakoff.
  License: MIT (http://www.opensource.org/licenses/mit-license.php)
  Source: https://github.com/kmalakoff/knockback
  Dependencies: Knockout.js, Backbone.js, and Underscore.js (or LoDash.js).
  Optional dependencies: Backbone.ModelRef.js and BackboneORM.
 */
var kb, ko, _;

kb = require('./kb');

_ = require('underscore');

ko = require('knockout');

module.exports = kb.Store = (function() {
  Store.useOptionsOrCreate = function(options, obj, observable) {
    if (options.store) {
      options.store.register(obj, observable, options);
      return kb.utils.wrappedStore(observable, options.store);
    } else {
      kb.utils.wrappedStoreIsOwned(observable, true);
      return kb.utils.wrappedStore(observable, new kb.Store());
    }
  };

  function Store() {
    this.observable_records = [];
    this.replaced_observables = [];
  }

  Store.prototype.destroy = function() {
    return this.clear();
  };

  Store.prototype.clear = function() {
    var record, _i, _len, _ref;
    _ref = this.observable_records.splice(0, this.observable_records.length);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      record = _ref[_i];
      kb.release(record.observable);
    }
    kb.release(this.replaced_observables);
  };

  Store.prototype.compact = function() {
    var index, record, removals, _ref, _ref1;
    removals = [];
    _ref = this.observable_records;
    for (index in _ref) {
      record = _ref[index];
      if ((_ref1 = record.observable) != null ? _ref1.__kb_released : void 0) {
        removals.push(record);
      }
    }
    if (removals.length) {
      this.observable_records = _.difference(this.observable_records, removals);
    }
  };

  Store.prototype.register = function(obj, observable, options) {
    var creator;
    if (!observable) {
      return;
    }
    if (ko.isObservable(observable) || observable.__kb_is_co) {
      return;
    }
    kb.utils.wrappedObject(observable, obj);
    obj || (observable.__kb_null = true);
    creator = options.creator ? options.creator : (options.path && options.factory ? options.factory.creatorForPath(obj, options.path) : null);
    if (!creator) {
      creator = observable.constructor;
    }
    this.observable_records.push({
      obj: obj,
      observable: observable,
      creator: creator
    });
    return observable;
  };

  Store.prototype.findIndex = function(obj, creator) {
    var index, record, removals, _ref;
    removals = [];
    if (!obj || (obj instanceof kb.Model)) {
      _ref = this.observable_records;
      for (index in _ref) {
        record = _ref[index];
        if (!record.observable) {
          continue;
        }
        if (record.observable.__kb_released) {
          removals.push(record);
          continue;
        }
        if ((!obj && !record.observable.__kb_null) || (obj && (record.observable.__kb_null || (record.obj !== obj)))) {
          continue;
        } else if ((record.creator === creator) || (record.creator.create && (record.creator.create === creator.create))) {
          if (removals.length) {
            this.observable_records = _.difference(this.observable_records, removals);
            return _.indexOf(this.observable_records, record);
          } else {
            return index;
          }
        }
      }
    }
    if (removals.length) {
      this.observable_records = _.difference(this.observable_records, removals);
    }
    return -1;
  };

  Store.prototype.find = function(obj, creator) {
    var index;
    if ((index = this.findIndex(obj, creator)) < 0) {
      return null;
    } else {
      return this.observable_records[index].observable;
    }
  };

  Store.prototype.isRegistered = function(observable) {
    var record, _i, _len, _ref;
    _ref = this.observable_records;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      record = _ref[_i];
      if (record.observable === observable) {
        return true;
      }
    }
    return false;
  };

  Store.prototype.findOrCreate = function(obj, options) {
    var creator, observable;
    options.store = this;
    options.creator || (options.creator = kb.utils.inferCreator(obj, options.factory, options.path));
    if (!options.creator && (obj instanceof kb.Model)) {
      options.creator = kb.ViewModel;
    }
    creator = options.creator;
    if (!creator) {
      return kb.utils.createFromDefaultCreator(obj, options);
    } else if (creator.models_only) {
      return obj;
    }
    if (creator) {
      observable = this.find(obj, creator);
    }
    if (observable) {
      return observable;
    }
    observable = kb.ignore((function(_this) {
      return function() {
        if (creator.create) {
          observable = creator.create(obj, options);
        } else {
          observable = new creator(obj, options);
        }
        return observable || ko.observable(null);
      };
    })(this));
    if (!ko.isObservable(observable)) {
      this.isRegistered(observable) || this.register(obj, observable, options);
    }
    return observable;
  };

  Store.prototype.findOrReplace = function(obj, creator, observable) {
    var index, record;
    obj || kb._throwUnexpected(this, 'obj missing');
    if ((index = this.findIndex(obj, creator)) < 0) {
      return this.register(obj, observable, {
        creator: creator
      });
    } else {
      record = this.observable_records[index];
      (kb.utils.wrappedObject(record.observable) === obj) || kb._throwUnexpected(this, 'different object');
      if (record.observable !== observable) {
        (record.observable.constructor === observable.constructor) || kb._throwUnexpected(this, 'replacing different type');
        this.replaced_observables.push(record.observable);
        record.observable = observable;
      }
      return observable;
    }
  };

  return Store;

})();

});
require.register('utils', function(exports, require, module) {

/*
  knockback.js 0.18.6
  Copyright (c)  2011-2014 Kevin Malakoff.
  License: MIT (http://www.opensource.org/licenses/mit-license.php)
  Source: https://github.com/kmalakoff/knockback
  Dependencies: Knockout.js, Backbone.js, and Underscore.js (or LoDash.js).
  Optional dependencies: Backbone.ModelRef.js and BackboneORM.
 */
var kb, ko, _, _argumentsAddKey, _keyArrayToObject, _mergeArray, _mergeObject, _wrappedKey;

kb = require('./kb');

_ = require('underscore');

ko = require('knockout');

_wrappedKey = kb._wrappedKey = function(obj, key, value) {
  if (arguments.length === 2) {
    if (obj && obj.__kb && obj.__kb.hasOwnProperty(key)) {
      return obj.__kb[key];
    } else {
      return void 0;
    }
  }
  obj || kb._throwUnexpected(this, "no obj for wrapping " + key);
  obj.__kb || (obj.__kb = {});
  obj.__kb[key] = value;
  return value;
};

_argumentsAddKey = function(args, key) {
  Array.prototype.splice.call(args, 1, 0, key);
  return args;
};

_mergeArray = function(result, key, value) {
  result[key] || (result[key] = []);
  if (!_.isArray(value)) {
    value = [value];
  }
  result[key] = result[key].length ? _.union(result[key], value) : value;
  return result;
};

_mergeObject = function(result, key, value) {
  result[key] || (result[key] = {});
  return _.extend(result[key], value);
};

_keyArrayToObject = function(value) {
  var item, result, _i, _len;
  result = {};
  for (_i = 0, _len = value.length; _i < _len; _i++) {
    item = value[_i];
    result[item] = {
      key: item
    };
  }
  return result;
};

kb.utils = (function() {
  function utils() {}

  utils.wrappedObservable = function(obj, value) {
    return _wrappedKey.apply(this, _argumentsAddKey(arguments, 'observable'));
  };

  utils.wrappedObject = function(obj, value) {
    return _wrappedKey.apply(this, _argumentsAddKey(arguments, 'object'));
  };

  utils.wrappedModel = function(obj, value) {
    if (arguments.length === 1) {
      value = _wrappedKey(obj, 'object');
      if (_.isUndefined(value)) {
        return obj;
      } else {
        return value;
      }
    } else {
      return _wrappedKey(obj, 'object', value);
    }
  };

  utils.wrappedStore = function(obj, value) {
    return _wrappedKey.apply(this, _argumentsAddKey(arguments, 'store'));
  };

  utils.wrappedStoreIsOwned = function(obj, value) {
    return _wrappedKey.apply(this, _argumentsAddKey(arguments, 'store_is_owned'));
  };

  utils.wrappedFactory = function(obj, value) {
    return _wrappedKey.apply(this, _argumentsAddKey(arguments, 'factory'));
  };

  utils.wrappedEventWatcher = function(obj, value) {
    return _wrappedKey.apply(this, _argumentsAddKey(arguments, 'event_watcher'));
  };

  utils.wrappedEventWatcherIsOwned = function(obj, value) {
    return _wrappedKey.apply(this, _argumentsAddKey(arguments, 'event_watcher_is_owned'));
  };

  utils.wrappedDestroy = function(obj) {
    var __kb;
    if (!obj.__kb) {
      return;
    }
    if (obj.__kb.event_watcher) {
      obj.__kb.event_watcher.releaseCallbacks(obj);
    }
    __kb = obj.__kb;
    obj.__kb = null;
    if (__kb.observable) {
      __kb.observable.destroy = __kb.observable.release = null;
      this.wrappedDestroy(__kb.observable);
      __kb.observable = null;
    }
    __kb.factory = null;
    if (__kb.event_watcher_is_owned) {
      __kb.event_watcher.destroy();
    }
    __kb.event_watcher = null;
    if (__kb.store_is_owned) {
      __kb.store.destroy();
    }
    return __kb.store = null;
  };

  utils.valueType = function(observable) {
    if (!observable) {
      return kb.TYPE_UNKNOWN;
    }
    if (observable.__kb_is_o) {
      return observable.valueType();
    }
    if (observable.__kb_is_co || (observable instanceof kb.Collection)) {
      return kb.TYPE_COLLECTION;
    }
    if ((observable instanceof kb.ViewModel) || (observable instanceof kb.Model)) {
      return kb.TYPE_MODEL;
    }
    if (_.isArray(observable)) {
      return kb.TYPE_ARRAY;
    }
    return kb.TYPE_SIMPLE;
  };

  utils.pathJoin = function(path1, path2) {
    return (path1 ? (path1[path1.length - 1] !== '.' ? "" + path1 + "." : path1) : '') + path2;
  };

  utils.optionsPathJoin = function(options, path) {
    return _.defaults({
      path: this.pathJoin(options.path, path)
    }, options);
  };

  utils.inferCreator = function(value, factory, path, owner, key) {
    var creator;
    if (factory) {
      creator = factory.creatorForPath(value, path);
    }
    if (creator) {
      return creator;
    }
    if (!value) {
      return null;
    }
    if (value instanceof kb.Model) {
      return kb.ViewModel;
    }
    if (value instanceof kb.Collection) {
      return kb.CollectionObservable;
    }
    return null;
  };

  utils.createFromDefaultCreator = function(obj, options) {
    if (obj instanceof kb.Model) {
      return kb.viewModel(obj, options);
    }
    if (obj instanceof kb.Collection) {
      return kb.collectionObservable(obj, options);
    }
    if (_.isArray(obj)) {
      return ko.observableArray(obj);
    }
    return ko.observable(obj);
  };

  utils.hasModelSignature = function(obj) {
    return obj && (obj.attributes && !obj.models) && (typeof obj.get === 'function') && (typeof obj.trigger === 'function');
  };

  utils.hasCollectionSignature = function(obj) {
    return obj && obj.models && (typeof obj.get === 'function') && (typeof obj.trigger === 'function');
  };

  utils.collapseOptions = function(options) {
    var key, result, value, _ref;
    result = {};
    options = {
      options: options
    };
    while (options.options) {
      _ref = options.options;
      for (key in _ref) {
        value = _ref[key];
        switch (key) {
          case 'internals':
          case 'requires':
          case 'excludes':
          case 'statics':
            _mergeArray(result, key, value);
            break;
          case 'keys':
            if ((_.isObject(value) && !_.isArray(value)) || (_.isObject(result[key]) && !_.isArray(result[key]))) {
              if (!_.isObject(value)) {
                value = [value];
              }
              if (_.isArray(value)) {
                value = _keyArrayToObject(value);
              }
              if (_.isArray(result[key])) {
                result[key] = _keyArrayToObject(result[key]);
              }
              _mergeObject(result, key, value);
            } else {
              _mergeArray(result, key, value);
            }
            break;
          case 'factories':
            if (_.isFunction(value)) {
              result[key] = value;
            } else {
              _mergeObject(result, key, value);
            }
            break;
          case 'static_defaults':
            _mergeObject(result, key, value);
            break;
          case 'options':
            break;
          default:
            result[key] = value;
        }
      }
      options = options.options;
    }
    return result;
  };

  utils.unwrapModels = function(obj) {
    var key, result, value;
    if (!obj) {
      return obj;
    }
    if (obj.__kb) {
      if ('object' in obj.__kb) {
        return obj.__kb.object;
      } else {
        return obj;
      }
    } else if (_.isArray(obj)) {
      return _.map(obj, function(test) {
        return kb.utils.unwrapModels(test);
      });
    } else if (_.isObject(obj) && (obj.constructor === {}.constructor)) {
      result = {};
      for (key in obj) {
        value = obj[key];
        result[key] = kb.utils.unwrapModels(value);
      }
      return result;
    }
    return obj;
  };

  return utils;

})();

});
require.register('view-model', function(exports, require, module) {

/*
  knockback.js 0.18.6
  Copyright (c)  2011-2014 Kevin Malakoff.
  License: MIT (http://www.opensource.org/licenses/mit-license.php)
  Source: https://github.com/kmalakoff/knockback
  Dependencies: Knockout.js, Backbone.js, and Underscore.js (or LoDash.js).
  Optional dependencies: Backbone.ModelRef.js and BackboneORM.
 */
var kb, ko, _;

kb = require('./kb');

_ = require('underscore');

ko = require('knockout');

kb.ViewModel = (function() {
  ViewModel.extend = kb.extend;

  function ViewModel(model, options, view_model) {
    return kb.ignore((function(_this) {
      return function() {
        var attribute_keys, bb_model, event_watcher, keys, mapped_keys, mapping_info, rel_keys, vm_key, _mdl, _ref;
        !model || (model instanceof kb.Model) || ((typeof model.get === 'function') && (typeof model.bind === 'function')) || kb._throwUnexpected(_this, 'not a model');
        options || (options = {});
        view_model || (view_model = {});
        if (_.isArray(options)) {
          options = {
            keys: options
          };
        } else {
          options = kb.utils.collapseOptions(options);
        }
        _this.__kb || (_this.__kb = {});
        _this.__kb.vm_keys = {};
        _this.__kb.model_keys = {};
        _this.__kb.view_model = _.isUndefined(view_model) ? _this : view_model;
        !options.internals || (_this.__kb.internals = options.internals);
        !options.excludes || (_this.__kb.excludes = options.excludes);
        !options.statics || (_this.__kb.statics = options.statics);
        !options.static_defaults || (_this.__kb.static_defaults = options.static_defaults);
        kb.Store.useOptionsOrCreate(options, model, _this);
        _this.__kb.path = options.path;
        kb.Factory.useOptionsOrCreate(options, _this, options.path);
        _mdl = kb._wrappedKey(_this, '_mdl', ko.observable());
        _this.model = ko.dependentObservable({
          read: function() {
            _mdl();
            return kb.utils.wrappedObject(_this);
          },
          write: function(new_model) {
            return kb.ignore(function() {
              var event_watcher, keys, missing, rel_keys;
              if (kb.utils.wrappedObject(_this) === new_model) {
                return;
              }
              if (_this.__kb_null) {
                !new_model || kb._throwUnexpected(_this, 'model set on shared null');
                return;
              }
              kb.utils.wrappedObject(_this, new_model);
              event_watcher = kb.utils.wrappedEventWatcher(_this);
              if (!event_watcher) {
                _mdl(new_model);
                return;
              }
              event_watcher.emitter(new_model);
              if (!(_this.__kb.keys || !new_model || !new_model.attributes)) {
                keys = _.keys(new_model.attributes);
                if (new_model && (rel_keys = kb.orm.keys(new_model))) {
                  keys = _.union(keys, rel_keys);
                }
                missing = _.difference(keys, _.keys(_this.__kb.model_keys));
                if (missing) {
                  _this.createObservables(new_model, missing);
                }
              }
              _mdl(new_model);
            });
          }
        });
        event_watcher = kb.utils.wrappedEventWatcher(_this, new kb.EventWatcher(model, _this, {
          emitter: _this.model
        }));
        keys = options.requires;
        if (_this.__kb.internals) {
          keys = _.union(keys || [], _this.__kb.internals);
        }
        if (model && (rel_keys = kb.orm.keys(model))) {
          keys = _.union(keys || [], rel_keys);
        }
        if (options.keys) {
          if (_.isObject(options.keys) && !_.isArray(options.keys)) {
            mapped_keys = {};
            _ref = options.keys;
            for (vm_key in _ref) {
              mapping_info = _ref[vm_key];
              mapped_keys[_.isString(mapping_info) ? mapping_info : (mapping_info.key ? mapping_info.key : vm_key)] = true;
            }
            _this.__kb.keys = _.keys(mapped_keys);
          } else {
            _this.__kb.keys = options.keys;
            keys = keys ? _.union(keys, _this.__kb.keys) : _.clone(_this.__kb.keys);
          }
        } else {
          bb_model = event_watcher.emitter();
          if (bb_model && bb_model.attributes) {
            attribute_keys = _.keys(bb_model.attributes);
            keys = keys ? _.union(keys, attribute_keys) : attribute_keys;
          }
        }
        if (keys && _this.__kb.excludes) {
          keys = _.difference(keys, _this.__kb.excludes);
        }
        if (keys && _this.__kb.statics) {
          keys = _.difference(keys, _this.__kb.statics);
        }
        if (_.isObject(options.keys) && !_.isArray(options.keys)) {
          _this.mapObservables(model, options.keys);
        }
        if (_.isObject(options.requires) && !_.isArray(options.requires)) {
          _this.mapObservables(model, options.requires);
        }
        !options.mappings || _this.mapObservables(model, options.mappings);
        !keys || _this.createObservables(model, keys);
        !_this.__kb.statics || _this.createObservables(model, _this.__kb.statics, true);
        !kb.statistics || kb.statistics.register('ViewModel', _this);
        return _this;
      };
    })(this));
  }

  ViewModel.prototype.destroy = function() {
    var vm_key;
    if (this.__kb.view_model !== this) {
      for (vm_key in this.__kb.vm_keys) {
        this.__kb.view_model[vm_key] = null;
      }
    }
    this.__kb.view_model = null;
    kb.releaseKeys(this);
    kb.utils.wrappedDestroy(this);
    return !kb.statistics || kb.statistics.unregister('ViewModel', this);
  };

  ViewModel.prototype.shareOptions = function() {
    return {
      store: kb.utils.wrappedStore(this),
      factory: kb.utils.wrappedFactory(this)
    };
  };

  ViewModel.prototype.createObservables = function(model, keys, is_static) {
    var create_options, key, static_defaults, vm_key, _i, _len;
    if (is_static) {
      static_defaults = this.__kb.static_defaults || {};
    } else {
      create_options = {
        store: kb.utils.wrappedStore(this),
        factory: kb.utils.wrappedFactory(this),
        path: this.__kb.path,
        event_watcher: kb.utils.wrappedEventWatcher(this)
      };
    }
    for (_i = 0, _len = keys.length; _i < _len; _i++) {
      key = keys[_i];
      vm_key = this.__kb.internals && _.contains(this.__kb.internals, key) ? "_" + key : key;
      if (this[vm_key]) {
        continue;
      }
      this.__kb.vm_keys[vm_key] = this.__kb.model_keys[key] = true;
      if (is_static) {
        if (model.has(vm_key)) {
          this[vm_key] = this.__kb.view_model[vm_key] = model.get(vm_key);
        } else if (vm_key in static_defaults) {
          this[vm_key] = this.__kb.view_model[vm_key] = static_defaults[vm_key];
        }
      } else {
        create_options.key = key;
        this[vm_key] = this.__kb.view_model[vm_key] = kb.observable(model, create_options, this);
      }
    }
  };

  ViewModel.prototype.mapObservables = function(model, mappings) {
    var create_options, mapping_info, vm_key;
    create_options = {
      store: kb.utils.wrappedStore(this),
      factory: kb.utils.wrappedFactory(this),
      path: this.__kb.path,
      event_watcher: kb.utils.wrappedEventWatcher(this)
    };
    for (vm_key in mappings) {
      mapping_info = mappings[vm_key];
      if (this[vm_key]) {
        continue;
      }
      mapping_info = _.isString(mapping_info) ? {
        key: mapping_info
      } : _.clone(mapping_info);
      mapping_info.key || (mapping_info.key = vm_key);
      this.__kb.vm_keys[vm_key] = this.__kb.model_keys[mapping_info.key] = true;
      this[vm_key] = this.__kb.view_model[vm_key] = kb.observable(model, _.defaults(mapping_info, create_options), this);
    }
  };

  return ViewModel;

})();

kb.viewModel = function(model, options, view_model) {
  return new kb.ViewModel(model, options, view_model);
};

});

  if (typeof define == 'function' && define.amd) {
    define(["require","underscore","backbone","knockout"], function(){ return require('index'); });
  }
  else if (typeof exports == 'object') {
    module.exports = require('index');
  } else {
    this['kb'] = require('index');
  }

}).call(this);