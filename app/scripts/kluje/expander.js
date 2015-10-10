'use strict';

jex.service('expander', ['evaluator', 'funcs', 'macros', 'symbols', 'types', 'utils'], 
function(evaluator, _, macros, symbols, types, utils) {
    
    var sym = symbols.sym;
    var special;
    
    initSpecial();
    
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
        if (x[0] in special) {
            return special[x[0]](x, toplevel);
        } 
        else if (symbols.isSym(x[0]) && (macros.isMacro(x[0]))) { // => macroexpand if m isa macro
            return expand(macros.load(x[0]).apply(null, _.rest(x)), toplevel) // (m arg...) 
        } 
        else {
            return x.map(expand) // (f arg...) => expand each
        }
    }
    
    function initSpecial() {
        special = {
            'quote': function(x) { // (quote exp)
                utils.require(x, utils.length(x) == 2)
                return x;
            },
            'if': function(x) {
                if (utils.length(x) == 3) {
                    x.length = 4
                } // (if t c) => (if t c None)
                utils.require(x, utils.length(x) == 4)
                return x.map(expand)
            },
            'set!': function(x) {
                utils.require(x, utils.length(x) == 3);
                utils.require(x, symbols.isSym(x[1]), 'can set! only a symbol');
                return [sym['set!'], x[1], expand(x[2])]
            },
            'def': function(x) {
                utils.require(x, utils.length(x) >= 3)
                var def = x[0];
                var v = x[1];
                if (types.islist(v) && v) { // (define (f args) body)
                    var body = x.slice(2);
                    var fname = v[0];
                    var args = new types.Vector(_.rest(v)); //  => (define f (fn [args] body))
                    return expand([sym.def, fname, [sym.fn, args].concat(body)])
                } 
                else {
                    utils.require(x, utils.length(x) == 3) // (define non-var/list exp) => Error
                    utils.require(x, symbols.isSym(v), 'can define only a symbol')
                    var exp = expand(x[2])
                    return [sym.def, v, exp]
                }
            },
            'do': function(x, toplevel) {
                if (utils.length(x) == 1)
                    return undefined; // (do) => None
                else {
                    return x.map(function(xi) {
                        return expand(xi, toplevel)
                    });
                }
            },
            'fn': function(x) { // (fn (x) e1 e2) 
                return expandFn(x)
            },
            'syntaxquote': function(x) { // `x => expandSyntaxQuote(x)
                utils.require(x, utils.length(x) == 2)
                return expandSyntaxQuote(x[1])
            },
            'defmacro': function(x, toplevel) {
                utils.require(x, toplevel, 'defmacro only allowed at top level');
                utils.require(x, utils.length(x) >= 4) // (defmacro v proc)
                var name = x[1];
                utils.require(x, symbols.isSym(name), 'can define only a symbol')
                var f = [sym.fn].concat(x.slice(2));
                var proc = evaluator.evaluate(expandFn(f));
                utils.require(x, _.isfunction(proc), 'macro must be a procedure');
                macros.define(name, proc);
                return;
            },
            'defn': function(x, toplevel) {
                utils.require(x, utils.length(x) >= 4) // (defmacro v proc)
                var name = x[1];
                utils.require(x, symbols.isSym(name), 'can define only a symbol')
                var f = [sym.fn].concat(x.slice(2));
                var proc = evaluator.evaluate(expandFn(f));
                utils.require(x, _.isfunction(proc), 'macro must be a procedure');
                return [sym.def, name, proc]
            }
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
            list = _.rest(x);
        }
        var sigs = list.map(function(item) {
            var vars = item[0];
            utils.require(x, utils.every(vars, function(v) {
                return symbols.isSym(v);
            }), 'expected symbols in args list');
            
            var body = item.slice(1);
            var exp = expand(utils.length(body) == 1 ? body[0] : _.cons(sym.do, body));

            var ret = utils.getVariadicVars(new types.Vector(vars));
            ret.exp = exp;
            return ret;
        });
        return [x[0], sigs]
    }
    
    function getVariadicVars(vars) {
        if (vars.slice(-2, -1)[0] == '&') {
            var vars1 = vars.splice(-2, 1);
            return {
                variadic: true,
                vars: vars1,
            }
        } 
        else {
            return {
                vars: vars,
            }
        }
    }
    
    function expandSyntaxQuote(x, gensyms) {
        // Expand `x => 'x; `~x => x; `(~@x y) => (append x y) """
        
        if (!types.isnonemptylist(x)) {
            return [sym.quote, x];
        }
        // == to cast before equate then ! to negate
        utils.require(x, !(x[0] == 'unquotesplice'), "can't splice here:")
        if (x[0] == sym.unquote) {
            utils.require(x, utils.length(x) == 2);
            return x[1];
        } 
        else if (x[0] == 'autogensym') {
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
        else if (types.isnonemptylist(x[0]) && x[0][0] == 'unquotesplice') {
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
