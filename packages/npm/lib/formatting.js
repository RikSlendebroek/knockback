/*
  knockback-formatting.js 0.18.2
  (c) 2011-2013 Kevin Malakoff - http://kmalakoff.github.com/knockback/
  License: MIT (http://www.opensource.org/licenses/mit-license.php)
  Dependencies: Knockout.js, Backbone.js, and Underscore.js.
*/
(function() {
  return (function(factory) {
    if (typeof exports == 'object') {
      module.exports = module.exports = factory.call(this, require);
    } else if (typeof define == 'function' && define.amd) {
      define(['require', 'underscore', 'backbone', 'knockout', 'knockback'], factory);
    } else {
      this.kb = factory.call(this, (typeof require !== 'undefined') ? require : undefined);
    }
  })(function(require) {// Generated by CoffeeScript 1.6.3
var arraySlice, kb, ko, _, _unwrapObservable;

kb = this.kb || require('knockback');

_ = kb._;

ko = kb.ko;

_unwrapObservable = ko.utils.unwrapObservable;

/*
  knockback-formatted-observable.js 0.18.2
  (c) 2011-2013 Kevin Malakoff.
  Knockback.FormattedObservable is freely distributable under the MIT license.
  See the following for full license details:
    https://github.com/kmalakoff/knockback/blob/master/LICENSE
*/


arraySlice = Array.prototype.slice;

kb.toFormattedString = function(format) {
  var arg, args, index, parameter_index, result, value;
  result = format.slice();
  args = arraySlice.call(arguments, 1);
  for (index in args) {
    arg = args[index];
    value = _unwrapObservable(arg);
    if (_.isUndefined(value) || _.isNull(value)) {
      value = '';
    }
    parameter_index = format.indexOf("\{" + index + "\}");
    while (parameter_index >= 0) {
      result = result.replace("{" + index + "}", value);
      parameter_index = format.indexOf("\{" + index + "\}", parameter_index + 1);
    }
  }
  return result;
};

kb.parseFormattedString = function(string, format) {
  var count, format_indices_to_matched_indices, index, match_index, matches, parameter_count, parameter_index, positions, regex, regex_string, result, results, sorted_positions;
  regex_string = format.slice();
  index = 0;
  parameter_count = 0;
  positions = {};
  while (regex_string.search("\\{" + index + "\\}") >= 0) {
    parameter_index = format.indexOf("\{" + index + "\}");
    while (parameter_index >= 0) {
      regex_string = regex_string.replace("\{" + index + "\}", '(.*)');
      positions[parameter_index] = index;
      parameter_count++;
      parameter_index = format.indexOf("\{" + index + "\}", parameter_index + 1);
    }
    index++;
  }
  count = index;
  regex = new RegExp(regex_string);
  matches = regex.exec(string);
  if (matches) {
    matches.shift();
  }
  if (!matches || (matches.length !== parameter_count)) {
    result = [];
    while (count-- > 0) {
      result.push('');
    }
    return result;
  }
  sorted_positions = _.sortBy(_.keys(positions), function(parameter_index, format_index) {
    return parseInt(parameter_index, 10);
  });
  format_indices_to_matched_indices = {};
  for (match_index in sorted_positions) {
    parameter_index = sorted_positions[match_index];
    index = positions[parameter_index];
    if (format_indices_to_matched_indices.hasOwnProperty(index)) {
      continue;
    }
    format_indices_to_matched_indices[index] = match_index;
  }
  results = [];
  index = 0;
  while (index < count) {
    results.push(matches[format_indices_to_matched_indices[index]]);
    index++;
  }
  return results;
};

kb.FormattedObservable = (function() {
  function FormattedObservable(format, args) {
    var observable, observable_args;
    if (_.isArray(args)) {
      format = format;
      observable_args = args;
    } else {
      observable_args = arraySlice.call(arguments, 1);
    }
    observable = kb.utils.wrappedObservable(this, ko.dependentObservable({
      read: function() {
        var arg, _i, _len;
        args = [_unwrapObservable(format)];
        for (_i = 0, _len = observable_args.length; _i < _len; _i++) {
          arg = observable_args[_i];
          args.push(_unwrapObservable(arg));
        }
        return kb.toFormattedString.apply(null, args);
      },
      write: function(value) {
        var index, matches, max_count;
        matches = kb.parseFormattedString(value, _unwrapObservable(format));
        max_count = Math.min(observable_args.length, matches.length);
        index = 0;
        while (index < max_count) {
          observable_args[index](matches[index]);
          index++;
        }
      }
    }));
    return observable;
  }

  FormattedObservable.prototype.destroy = function() {
    return kb.utils.wrappedDestroy(this);
  };

  return FormattedObservable;

})();

kb.formattedObservable = function(format, args) {
  return new kb.FormattedObservable(format, arraySlice.call(arguments, 1));
};
; return kb;});
}).call(this);
