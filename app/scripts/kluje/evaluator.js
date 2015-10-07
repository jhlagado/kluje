'use strict';

jex.service('evaluator', ['environ','funcs', 'output', 'symbols', 'types', 'utils'], 
function(environ, _, output, symbols, types, utils) {
    
    var sym = symbols.sym;
    var globalEnv = environ.create({}, null);
    
    initGlobals();
    
    return {
        evaluate: evaluate,
    }
    
    function evaluate(x, env) {
        
        if (_.isnull(x))
            return x;
        
        if (!env)
            env = globalEnv;
        
        while (true) {
            
            if (symbols.isSym(x)) // v reference
                return environ.get(env, x);
            else if (!types.isnonemptylist(x)) // constant literal
                return x
            
            else if (x[0] == 'quote') // (quote exp)
                return x[1];
            else if (x[0] == 'keyword') // (keyword exp)
                return new types.Keyword(x[1]);
            else if (x[0] == 'if') // (if test conseq alt)
                x = evaluate(x[1], env) ? x[2] : x[3];
            else if (x[0] == 'set!') { // (set! var exp)
                var v = x[1];
                environ.set(env, v, evaluate(x[2], env));
                return;
            } 
            else if (x[0] == 'define') { // (define var exp)
                var v = x[1];
                environ.define(env, v, evaluate(x[2], env));
                return;
            } 
            else if (x[0] == 'fn') { // (fn [arg1 arg2...] exp)
                var sigs = x[1];
                var f = function() {
                    var numargs = arguments.length;
                    var sig = sigs.reduce(function(acc, item) {
                        if (!acc && item.variadic)
                            acc = item;
                        else if (numargs == item.vars.length) {
                            if (item.variadic) {
                                if (acc.variadic && item.vars.length > acc.vars.length)
                                    acc = item;
                            } 
                            else {
                                acc = item;
                            }
                        }
                        return acc;
                    }, null);
                    
                    if (!sig)
                        throw new types.RuntimeError(_.isstring(x) + 'no matching argument signature found')
                    
                    var dict = utils.destructure(sig.vars, utils.argarray(arguments), sig.variadic);
                    return evaluate(sig.exp, environ.create(dict, env));
                
                }
                return f;
            } 
            else if (x[0] == 'do') { // (do exp+)
                x.slice(1, -1).forEach(function(exp) {
                    evaluate(exp, env)
                });
                x = x.slice(-1)[0];
            } 
            else if (types.isvector(x)) {
                return x;
            } 
            else { // (f exp*)
                var f = evaluate(x[0], env);
                if (!_.isfunction(f)) {
                    throw new types.RuntimeError(f + ' is not a function.')
                }
                var argslist = _.rest(x);
                var args = argslist.map(function(arg, index) {
                    return evaluate(arg, env);
                });
                return f.apply(null, args);
            }
        }
    }
    
    function initGlobals() {
        
        var basics = {
            
            '+': function(a, b) {
                return a + b;
            },
            '-': function(a, b) {
                return a - b;
            },
            '*': function(a, b) {
                return a * b;
            },
            '/': function(a, b) {
                return a / b;
            },
            'remainder': function(a, b) {
                return a % b;
            },
            'not': function(a) {
                return !a;
            },
            '>': function(a, b) {
                return a > b;
            },
            '<': function(a, b) {
                return a < b;
            },
            '>=': function(a, b) {
                return a >= b;
            },
            '<=': function(a, b) {
                return a <= b;
            },
            '=': equal,
            'eq?': equal,
            'length': function(a) {
                return a.length;
            },
            'cons': _.cons,
            'first': function(a) {
                return _.first(a);
            },
            'rest': function(a) {
                return _.rest(a);
            },
            'append': function() {
                var args = utils.argarray(arguments);
                var ret = Array.prototype.concat.apply(args[0], _.rest(args));
                return ret;
            },
            'list': function() {
                return utils.argarray(arguments);
            },
            'list?': function(x) {
                return islist(x);
            },
            'null?': function(x) {
                return (!x || x.length === 0);
            },
            'symbol?': function(x) {
                return typeof x === 'string';
            },
            'boolean?': function(x) {
                return isboolean(x);
            },
            'pair?': function(x) {
                return islist(x) && x.length > 1;
            },
            'apply': function(proc, args) {
                return proc.apply(null, args);
            },
            'eval': function(x) {
                return evaluate(x, outputs.out);
            },
            'display': function(x) {
                output.out.log(_.isstring(x) ? x : types.tostring(x));
            },
            'call/cc': callcc,

            //added by jh
            'get': function(a, b) {
                return a[b];
            },
            'type': function(a) {
                return typeof a;
            },
            'resolve': function(a) {
                return resolve(a)
            },
        }
        
        var math = _.pick(Math, ['abs', 'acos', 'asin', 'atan', 'atan2', 
            'ceil', 'cos', 'exp', 'floor', 'log', 'max', 'min', 'pow', 
            'random', 'round', 'sin', 'sqrt', 'tan']);
        
        return environ.assign(globalEnv, utils.assign(types.newDict(), basics, math));
    }
    
    function equal(a, b) {
        //cast String, Sym and Keyword strings to primitive string
        return (_.isstring(a) && _.isstring(b)) ? String(a) === String(b) : a === b;
    }
    
    function callcc(func) {
        var ball = new types.RuntimeWarning("Sorry, can't continue this continuation any longer.");
        try {
            return func(function raise(retval) {
                ball.retval = retval;
                throw ball;
            });
        } 
        catch (w) {
            if (w == ball)
                return ball.retval;
            else
                throw w;
        }
    }
    
});
