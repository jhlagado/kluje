'use strict';

jex.service('utils', ['funcs', 'types'], function(_, types) {
    
    return {argarray: argarray,
        argarray: argarray,
        assign: assign,
        contains: contains,
        destructure: destructure,
        each: each,
        every: every,
        getVariadicVars: getVariadicVars,
        length: length,
        require: require,
        startswith: startswith,
        unzip: unzip,
        zipobject: zipobject,
    }
    
    function argarray(args) {
        return Array.prototype.slice.call(args);
    }
    
    function assign() {
        if (!arguments.length)
            return;
        var args = argarray(arguments);
        var obj = args.slice(1).reduce(function(acc, arg) {
            return Object.keys(arg).reduce(function(acc1, key) {
                acc1[key] = arg[key];
                return acc1;
            }, acc);
        }, args[0])
        return obj;
    }
    
    function contains(x, y) {
        return x && x.indexOf && x.indexOf(y) != -1
    }
    
    function destructure(keys, values, variadic) {
        var dict = types.newDict();
        if (variadic) {
            var vl = keys.length - 1;
            values = values.slice(0, vl).concat([values.slice(vl)]);
        }
        if (keys.length !== values.length) {
            throw new RuntimeError('destructure: mismatch in number of keys and values')
        }
        return zipobject(keys, values);
    }
    
    function each(x, f) {
        if (!x && !f)
            return;
        return x.forEach(f);
    }
    
    function every(x, f) {
        if (_.isnull(f))
            f = function(item) {
                return item
            }
        if (!_.isnull(x) && x.every) {
            return x.every(f);
        }
    }
    
    function getVariadicVars(vars) {
        if (vars.slice(-2, -1)[0] == '&') {
            vars.splice(-2, 1);
            return {
                variadic: true,
                vars: vars,
            }
        } 
        else {
            return {
                vars: vars,
            }
        }
    }
    
    function length(x) {
        if (!_.isnull(x) && ('length' in x))
            return x.length;
    }
    
    function require(x, predicate, msg) {
        if (_.isnull(msg))
            msg = 'wrong length';
        if (!predicate)
            throw new types.SyntaxError(types.tostring(x) + ': ' + msg);
    }
    
    function startswith(string, target) {
        return string.indexOf(target) == 0;
    }
    
    function unzip(array) {
        if (_.isempty(array)) {
            return [];
        }
        var length = 0; //filter: allow only colls
        array = array.reduce(function(acc, item) {
            if (_.iscoll(item))
                acc.push(item);
            return acc;
        }, []);
        //assert array of arrays
        //find the longest child array
        var length = array.reduce(function(acc, item) {
            return Math.max(item.length, length);
        }, 0);
        //result has as many entries as longest child array
        var result = Array(length);
        var index = -1;
        while (++index < length) {
            result[index] = array.map(function(item) {
                return item[index]
            });
        }
        return result;
    }
    
    function zipobject(props, values) {
        var index = -1, 
        length = props ? props.length : 0, 
        result = {};
        
        if (length && !values && !iscoll(props[0])) {
            values = [];
        }
        while (++index < length) {
            var key = props[index];
            if (values) {
                result[key] = values[index];
            } else if (key) {
                result[key[0]] = key[1];
            }
        }
        return result;
    }

});
