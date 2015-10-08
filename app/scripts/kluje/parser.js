'use strict';

jex.service('parser', ['funcs', 'symbols', 'types', 'utils','kluje'], 
function(funcs, symbols, types, utils) {
    
    var EOF = {};
    var sym = symbols.sym;
    
    return {
        parse: parse,
    }
    
    function parse(s) {
        utils.require(s, funcs.isstring(s));
        utils.require(s, s.trim().length);
        return read(tokzer(s));
    }
    
    function tokzer(s) {
        var line = s;
        return function() {
            while (true) {
                if (line == undefined)
                    return EOF;
                if (!line.length)
                    return EOF;
                // see https://regex101.com/#javascript
                // var regex = /\s*(,@|[('`,)]|'(?:[\\].|[^\\'])*'|;.*|[^\s(''`,;)]*)(.*)/g;
                
                var regex = /[\s,]*("[^"]*"|~@|[(){}[\]'`~]|'(?:[\\].|[^\\'])*'|;.*|[^\s,(){}[\]`~;"]*)([^]*)/g;
                var list = regex.exec(line);
                var token = list[1];
                line = list[2];
                if (token.length && !utils.startswith(token, ';'))
                    return token;
            }
        }
    }
    
    function read(tokzer) {
        
        function readAhead(token) {
            var ret;
            if (token == '(') {
                ret = readBrackets([], ')');
                return ret;
            } 
            else if (token == '[') {
                ret = readBrackets(new types.Vector(), ']');
                return ret;
            } 
            else if (token == '{') {
                ret = readBrackets([], '}');
                var kv = [];
                var ret1 = ret.reduce(function(acc, item) {
                    kv.push(item);
                    if (kv.length == 2) {
                        var key = kv[0];
                        acc[String(key)] = kv[1];
                        kv.length = 0;
                    }
                    return acc;
                }, {});
                return ret1;
            } 
            else if (utils.contains([')', ']', '}'], token))
                throw new SyntaxError('unexpected ' + token)
            else if (token in symbols.quotes)
                return [symbols.quotes[token], read(tokzer)]
            else if (token === EOF)
                throw new SyntaxError('unexpected EOF in list')
            else {
                var x = types.createAtom(token);
                if (symbols.isSym(x)) {
                    var s = String(x);
                    if (s.slice(-1) == '#')
                        return [sym.autogensym, s.slice(0, -1)]
                }
                return x;
            }
        }
        
        function readBrackets(array, closer) {
            while (true) {
                var token = tokzer();
                if (token == closer)
                    return array;
                else
                    array.push(readAhead(token));
            }
        }
        
        var token1 = tokzer();
        return token1 === EOF || readAhead(token1);
    }

});
