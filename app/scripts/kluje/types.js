'use strict';

jex.service('types', ['funcs', 'symbols'], function(_, symbols) {
    
    function newDict(init) {
        var dict = Object.create(null);
        if (init) {
            Object.keys(init).reduce(function(acc, key){
                acc[key] = init[key];
                return acc
            },dict);
        }
        return dict;
    }

    function SyntaxError(msg) {
        this.msg = 'SyntaxError: ' + msg;
        utils.output.error(msg);
    }
    
    function RuntimeError(msg) {
        this.msg = 'RuntimeError: ' + msg;
        utils.output.error(msg);
    }
    
    function RuntimeWarning(msg) {
        this.msg = 'RuntimeWarning: ' + msg;
        utils.output.warn(msg);
    }

    //Vector
    function Vector() {
        Array.prototype.push.apply(this, arguments[0]);
    }
    Vector.prototype = Object.create(Array.prototype);
    Vector.prototype.toArray = function() {
        return Array.prototype.concat.apply([], this);
    }

    //Keyword
    function Keyword(s) {
        String.call(this, s);
        this.s = s.valueOf();
    }
    Keyword.prototype = Object.create(String.prototype);
    Keyword.prototype.toString = function() {
        return ':' + this.s;
    }
    Keyword.prototype.valueOf = function() {
        return this.s;
    }
    
    function islist(x) {
        return _.isarray(x);
    }
    
    function isnonemptylist(x) {
        return islist(x) && x.length;
    }
    
    function isvector(x) {
        return x instanceof Vector;
    }
    
    function iskeyword(x) {
        return x instanceof Keyword;
    }
    
    function tostring(x) {
        if (x == null)
            return 'nil'
        if (x === true)
            return 'true'
        else if (x === false)
            return 'false'
        else if (iskeyword(x))
            return String(x)
        else if (symbols.isSym(x))
            return String(x)
        else if (isNaN(x)) {
            if (_.isstring(x) && !x.type)
                return '"' + x + '"';
            else if (isvector(x))
                return '[' + x.map(tostring).join(' ') + ']'
            else if (islist(x))
                return '(' + x.map(tostring).join(' ') + ')'
            else if (_.isobject(x))
                return '{' + Object.keys(x).map(function(key) {
                    var value = x[key];
                    return String(createAtom(key)) + ' ' + tostring(value);
                }).join(' ') + '}'
            else
                return String(x);
        } 
        else {
            return x;
        }
    }
    
    function createAtom(token) {
        if (token == 'nil')
            return null
        else if (token == 'true')
            return true
        else if (token == 'false')
            return false
        else if (token[0] == '"')
            return token.slice(1, -1);
        else if (token[0] == ':')
            return new Keyword(token.slice(1));
        else if (!isNaN(token))
            return Number(token); //Cast to number
        else
            return symbols.createSym(token);
    }
    
    return {
        
        newDict: newDict,
        
        SyntaxError: SyntaxError,
        RuntimeError: RuntimeError,
        RuntimeWarning: RuntimeWarning,
        Vector: Vector,
        Keyword: Keyword,
        
        createAtom: createAtom,
        
        islist: islist,
        isnonemptylist: isnonemptylist,
        isvector: isvector,
        iskeyword: iskeyword,
        tostring: tostring,
    };

});
