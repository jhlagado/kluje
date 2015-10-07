'use strict';

jex.service('expander', ['evaluator', 'funcs', 'macros', 'symbols', 'types', 'utils'], 
function(evaluator, _, macros, symbols, types, utils) {
    
    var sym = symbols.sym;
    
    return {
        expand: expand,
    }
    
    function expand(x, toplevel) {
        if (_.isnull(toplevel))
            toplevel = false;
        
        if (!types.isnonemptylist(x)) { // constant => unchanged
            return x;
        }
        utils.require(x, !_.isempty(x)) // () => Error 
        if (x[0] === sym.quote) { // (quote exp)
            utils.require(x, utils.length(x) == 2)
            return x;
        } 
        else if (x[0] === sym.if) {
            if (utils.length(x) == 3) {
                x.length = 4
            } // (if t c) => (if t c None)
            utils.require(x, utils.length(x) == 4)
            return x.map(expand)
        } 
        else if (x[0] === sym['set!']) {
            utils.require(x, utils.length(x) == 3);
            utils.require(x, symbols.isSym(x[1]), 'can set! only a symbol');
            return [sym['set!'], x[1], expand(x[2])]
        } 
        else if (x[0] === sym.define || x[0] === sym['define-macro']) {
            utils.require(x, utils.length(x) >= 3)
            var def = x[0];
            var v = x[1];
            var body = x.slice(2);
            if (types.islist(v) && v) { // (define (f args) body)
                var fname = v[0];
                var args = new types.Vector(_.rest(v)); //  => (define f (fn [args] body))
                return expand([def, fname, [sym.fn, args].concat(body)])
            } 
            else {
                utils.require(x, utils.length(x) == 3) // (define non-var/list exp) => Error
                utils.require(x, symbols.isSym(v), 'can define only a symbol')
                var exp = expand(x[2])
                if (def == sym['define-macro']) {
                    utils.require(x, toplevel, 'define-macro only allowed at top level');
                    var proc = evaluator.evaluate(exp);
                    utils.require(x, _.isfunction(proc), 'macro must be a procedure');
                    macros.define(v, proc);
                    return; //  => None; add v:proc to macro_table
                }
                return [sym.define, v, exp]
            }
        } 
        else if (x[0] === sym.do) {
            if (utils.length(x) == 1)
                return undefined; // (do) => None
            else {
                return x.map(function(xi) {
                    return expand(xi, toplevel)
                });
            }
        } 
        else if (x[0] === sym.fn) { // (fn (x) e1 e2) 
            return expandFn(x)
        } 
        else if (x[0] === sym.syntaxquote) { // `x => expandSyntaxQuote(x)
            utils.require(x, utils.length(x) == 2)
            return expandSyntaxQuote(x[1])
        } 
        else if (x[0] === sym['defmacro']) {
            utils.require(x, toplevel, 'defmacro only allowed at top level');
            utils.require(x, utils.length(x) == 3) // (defmacro v proc)
            var v = x[1];
            utils.require(x, symbols.isSym(v), 'can define only a symbol')
            var proc = evaluate(expand(x[2]));
            utils.require(x, _.isfunction(proc), 'macro must be a procedure');
            macros.define(v, proc);
            return;
        } 
        else if (symbols.isSym(x[0]) && (macros.isMacro(x[0]))) { // => macroexpand if m isa macro
            return expand(macros.load(x[0]).apply(null, _.rest(x)), toplevel) // (m arg...) 
        } 
        else {
            return x.map(expand) // (f arg...) => expand each
        }
    }
    
    function expandFn(x) {
        
        var list;
        utils.require(x[1], types.islist(x[1]) || types.isvector(x[1]), 'expected list or vector')
        if (types.isvector(x[1])) {
            utils.require(x, utils.length(x) >= 3);
            list = [_.rest(x)]
        } 
        else {
            utils.require(x, utils.length(x) >= 2);
            list = x[1];
        }
        var sigs = list.map(function(item) {
            var vars = item[0];
            utils.require(x, utils.every(vars, function(v) {
                return symbols.isSym(v);
            }), 'expected symbols in args list');
            
            var body = item.slice(1);
            var exp = expand(utils.length(body) == 1 ? body[0] : _.cons(sym.do, body));
            var ret = vars.slice(-2, -1)[0] == '&' ? {
                variadic: true,
                //throw away splice return and return altered vars instead
                vars: (vars.splice(-2, 1), vars),
                exp: exp,
            } : {
                vars: vars,
                exp: exp,
            }
            return ret;
        });
        return [x[0], sigs]
    }
    
    function expandSyntaxQuote(x, gensyms) {
        // Expand `x => 'x; `~x => x; `(~@x y) => (append x y) """
        
        if (!types.isnonemptylist(x)) {
            return [sym.quote, x];
        }
        utils.require(x, x[0] !== sym.unquotesplice, "can't splice here")
        if (x[0] == sym.unquote) {
            utils.require(x, utils.length(x) == 2);
            return x[1];
        } 
        else if (x[0] == sym.autogensym) {
            utils.require(x, utils.length(x) == 2);
            var pref = x[1];
            var gs = gensyms[pref];
            if (!gs) {
                var gs0 = pref + (Math.random() * 1001 | 0);
                gs = symbols.createSym(gs0);
                gensyms[pref] = gs;
            }
            return [sym.quote, gs];
        } 
        else if (types.isnonemptylist(x[0]) && x[0][0] == sym.unquotesplice) {
            utils.require(x[0], utils.length(x[0]) == 2)
            return [sym.append, x[0][1], expandSyntaxQuote(_.rest(x))]
        } 
        else {
            if (!gensyms)
                gensyms = types.newDict();
            var ret = [sym.cons, expandSyntaxQuote(x[0], gensyms), expandSyntaxQuote(_.rest(x), gensyms)]
            return ret;
        }
    }

});