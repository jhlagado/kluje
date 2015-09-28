'use strict';

(function(root, factory) {
    
    if (typeof exports === 'object' && exports) {
        factory(exports); // CommonJS
    } else {
        var lib = {};
        factory(lib);
        if (typeof define === 'function' && define.amd)
            define(lib); // AMD
        else
            root[lib.name] = lib; // <script>
    }

}(this, function(lib) {
    
    lib.name = 'funk';
    lib.version = '0.0.0';
    
    lib.all = all;
    lib.argarray = argarray;
    lib.assign = assign;
    lib.cons = cons;
    lib.contains = contains;
    lib.each = each;
    lib.existy = existy;
    lib.extend = extend;
    lib.filter = filter;
    lib.first = first;
    lib.getkeys = getkeys;
    lib.isarray = isarray;
    lib.isboolean = isboolean;
    lib.iscoll = iscoll;
    lib.isempty = isempty;
    lib.isequal = isequal;
    lib.isfunction = isfunction;
    lib.isobject = isobject;
    lib.isstring = isstring;
    lib.keys = keys;
    lib.length = length;
    lib.map = map;
    lib.pick = pick;
    lib.reduce = reduce;
    lib.rest = rest;
    lib.startswith = startswith;
    lib.unzip = unzip;
    lib.values = values;
    lib.zipobject = zipobject;

    //
    function all(x, f) {
        if (!existy(f))
            f = function(item) {
                return item
            }
        if (existy(x) && x.every) {
            return x.every(f);
        }
    }
    
    function argarray(args) {
        return Array.prototype.slice.call(args);
    }
    
    function assign() {
        if (!arguments.length)
            return;
        var args = argarray(arguments);
        var obj = reduce(args.slice(1), function(acc, arg) {
            for (var key in arg) {
                if (arg.hasOwnProperty(key)) {
                    acc[key] = arg[key];
                }
            }
            return acc;
        }, args[0])
        return obj;
    }
    
    function cons(x, y) {
        if (existy(x))
            return [x].concat(y);
    }
    
    function contains(x, y) {
        return x && x.indexOf && x.indexOf(y) != -1
    }
    
    function each(x, f) {
        if (!x && !f)
            return;
        return x.forEach(f);
    }
    
    function existy(x) {
        return x != null;
    }
    
    function extend(x, y) {
        for (key in y) {
            if (y.hasOwnProperty(key)) {
                x[key] = y[key];
            }
        }
    }
    
    function filter(array, func) {
        return array.reduce(function(acc, item) {
            if (func(item))
                acc.push(item);
            return acc;
        }, [])
    }
    
    function first(a) {
        if (length(a))
            return a[0];
    }
    
    function getkeys(a) {
        return Object.keys(a);
    }
    
    function isarray(x) {
        return x && Array.isArray(x)
    }
    
    function iscoll(x) {
        return x && !issimple(x) && x.length;
    }
    
    function isempty(x) {
        return iscoll(x) && !x.length
    }
    
    function isobject(x) {
        return !isarray(x) && x === Object(x);
    }
    
    function isstring(x) {
        return x && (typeof x === 'string' || x instanceof String);
    }
    
    function isboolean(x) {
        return x === true || x === false;
    }
    
    function isfunction(x) {
        return typeof x == 'function' || false;
    }
    
    function issymbol(obj) {
        return obj && obj.constructor == Symbol;
    }
    
    function issimple(x) {
        if (x == null)
            return true;
        var type = typeof (x);
        return type == 'number' || type == 'boolean' || type == 'string';
    }
    
    function valueof(x) {
        return (x && x.valueOf) ? x.valueOf() : x;
    }
    
    function isequal(a, b, maxdepth) {
        
        a = valueof(a);
        b = valueof(b);

        //         if (a === b) return true;
        
        if (!maxdepth)
            maxdepth = 1000;
        
        if (maxdepth) 
        {
            if ((issimple(a) && issimple(b)) || (isobject(a) && isobject(b)) || (iscoll(a) && iscoll(b))) 
            {
                if (issimple(a)) {
                    return a == b
                } 
                else if (isobject(a)) 
                {
                    if (length(getkeys(a)) == length(getkeys(b))) {
                        var retval;
                        for (var lkey in a) {
                            retval = (lkey in b) && isequal(a[lkey], b[lkey], maxdepth - 1);
                            if (!retval)
                                break;
                        }
                        return retval
                    }
                } 
                else if (iscoll(a)) 
                {
                    if (length(a) == length(b)) {
                        return a.every(function(litem, lindex) {
                            return isequal(litem, b[lindex], maxdepth - 1);
                        })
                    }
                }
            }
        }
        
        return false;
    }
    
    function keys(x) {
        if (x)
            return Object.keys(x);
    }
    
    function length(x) {
        if (x && x.length)
            return x.length;
    }
    
    function map(x, f) {
        if (x && x.map) {
            return x.map(f);
        }
    }
    
    function pick(object, keys) {
        var result = reduce(keys, function(acc, key) {
            acc[key] = object[key];
            return acc;
        }, {});
        return result;
    }
    
    function reduce(x, f, acc) {
        if (x && x.reduce) {
            return x.reduce(f, acc);
        }
    }
    
    function rest(x) {
        if (iscoll(x) || isstring(x))
            return x.slice(1);
    }
    
    function startswith(string, target) {
        return string.indexOf(target) == 0;
    }
    
    function values(obj) {
        var values = [];
        return map(Object.keys(obj), function(key) {
            return obj[key];
        });
    }
    
    function unzip(array) {
        if (!(array && array.length)) {
            return [];
        }
        var length = 0;
        array = filter(array, function(group) {
            if (iscoll(group)) {
                length = Math.max(group.length, length);
                return true;
            }
        });
        var result = Array(length);
        var index = -1;
        while (++index < length) {
            result[index] = map(array, function(item) {
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


}));
