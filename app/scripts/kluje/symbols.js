'use strict';

jex.service('symbols', [], function() {
    
    var sym = {};

    //Sym
    function Sym(s) {
        String.call(this, s);
        this.s = s.valueOf();
    }
    
    Sym.prototype = Object.create(String.prototype);
    Sym.prototype.toString = function() {
        return this.s;
    }
    Sym.prototype.valueOf = function() {
        return this.s;
    }
    
    var a = [
        'quote', 'set!', 'def', 'do', 'syntaxquote', 'unquote', 
        'unquotesplice', 'autogensym', 'append', 'cons', 'let', 'fn', 'letproc',
    ]
    a.forEach(function(s) {
        createSym(s);
    });
    
    return {
        
        Sym: Sym,
        createSym: createSym,
        isSym: isSym,
        sym: sym,
        quotes: {
            '\'': sym.quote,
            '`': sym.syntaxquote,
            '~': sym.unquote,
            '~@': sym.unquotesplice,
        },
    
    };
    
    function createSym(s) {
        if (!(s in sym)) {
            var sy = new Sym(s);
            sym[s] = sy;
        }
        return sym[s];
    }
    
    function isSym(obj) {
        return obj instanceof Sym;
    }

});
