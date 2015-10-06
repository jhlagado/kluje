'use strict';

jex.service('funcs', [], function() {
    
    return {
        cons: cons,
        drop: drop,
        first: first,
        isarray: isarray,
        iscoll: iscoll,
        isempty: isempty,
        isobject: isobject,
        isnull: isnull,
        issimple: issimple,
        isstring: isstring,
        partition: partition,
        pick: pick,
        rest: rest,
        take: take,
    }
    
    function cons(x, y) {
        return !isnull(y) ? [x].concat(y) : [x];
    }
    
    function drop(n, coll) {
        return coll.slice(n);
    }
    
    function first(a) {
        return a[0];
    }
    
    function isarray(x) {
        return !isnull(x) && Array.isArray(x)
    }
    
    function iscoll(x) {
        return !isnull(x) && !issimple(x) && ('length' in x);
    }
    
    function isempty(x) {
        return iscoll(x) && x.length == 0;
    }
    
    function isnull(x) {
        return x == null; //casts undefined as null
    }
    
    function isobject(x) {
        return !isarray(x) && x === Object(x);
    }
    
    function isstring(x) {
        return !isnull(x) && (typeof x === 'string' || x instanceof String);
    }
    
    
    function issimple(x) {
        if (x == null)
            return true;
        var type = typeof (x);
        return type == 'number' || type == 'boolean' || type == 'string';
    }
    
    function partition(n, coll) {
        if (iscoll(coll)) {
            var s = coll;
            var p = take(n, s);
            if (p.length == n) {
                var p1 = partition(n, drop(n, s));
                return cons(p, p1);
            }
        }
    }
    
    function pick(object, keys) {
        var result = keys.reduce(function(acc, key) {
            acc[key] = object[key];
            return acc;
        }, {});
        return result;
    }
    
    function rest(x) {
        if (iscoll(x) || isstring(x))
            return x.slice(1);
    }
    
    function take(n, coll) {
        return coll.slice(0, n);
    }

});
