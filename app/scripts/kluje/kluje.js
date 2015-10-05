'use strict';

jex.service('kluje', ['funk', 'macros', 'types', 'utils'], function(funk, macros, types, utils) {
    
    var libkeys = (

    //funk
    
    'all apply argarray assign cons contains each existy filter first isarray isboolean ' + 
    'iscoll isempty isfunction isobject isstring keys length map pick reduce rest ' + 
    'startswith unzip values zipobject ' + 

    //types
    
    'newDict Sym createSym isSym sym quotes ' + 
    'SyntaxError RuntimeError RuntimeWarning Vector Keyword createAtom ' + 
    'islist isnonemptylist isvector iskeyword tostring ' + 

    //utils
    
    'require destructure '
    
    ).split(' ');
    
    var libvalues = funk.assign({}, funk, types, utils);
    
    return jex.inject(libvalues, 
    function(all, apply, argarray, assign, cons, contains, each, existy, filter, first, isarray, isboolean, 
    iscoll, isempty, isfunction, isobject, isstring, keys, length, map, pick, reduce, rest, 
    startswith, unzip, values, zipobject, 
    newDict, Sym, createSym, isSym, sym, quotes, 
    SyntaxError, RuntimeError, RuntimeWarning, Vector, Keyword, createAtom, 
    islist, isnonemptylist, isvector, iskeyword, tostring, 
    require, destructure
    ) {
        
        var globalEnv, quotes;
        
        initGlobals();
        
        return {
            
            name: 'kluje',
            version: '0.0.0',
            
            run: run,
            parse: parse,
            evaluate: evaluate,
            expand: expand,
        }
        
        
        function run(expression) {
            var s = expression; //.replace(/\n/g, ' '); //strip \n
            var p = parse(s);
            var e = evaluate(p);
            return e;
        }
        
        function parse(s) {
            require(s, isstring(s));
            require(s, s.trim().length);
            return expand(read(tokzer(s)), true);
        }
        
        function evaluate(x, env) {
            
            if (!existy(x))
                return x;
            
            if (!env)
                env = globalEnv;
            
            while (true) {
                
                if (isSym(x)) // v reference
                    return envGet(env, x);
                else if (!isnonemptylist(x)) // constant literal
                    return x
                
                else if (x[0] === sym.quote) // (quote exp)
                    return x[1];
                else if (x[0] === sym.keyword) // (keyword exp)
                    return new Keyword(x[1]);
                else if (x[0] === sym.if) // (if test conseq alt)
                    x = evaluate(x[1], env) ? x[2] : x[3];
                else if (x[0] === sym['set!']) { // (set! var exp)
                    var v = x[1];
                    envSet(env, v, evaluate(x[2], env));
                    return;
                } 
                else if (x[0] === sym.define) { // (define var exp)
                    var v = x[1];
                    envDefine(env, v, evaluate(x[2], env));
                    return;
                } 
                else if (x[0] === sym.fn) { // (fn [arg1 arg2...] exp)
                    var sigs = x[1];
                    var f = function() {
                        var numargs = arguments.length;
                        var arity = reduce(sigs, function(acc, item) {
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
                        
                        if (!arity)
                            throw new RuntimeError(isstring(x) + 'no matching argument signature found')
                        
                        var dict = utils.destructure(arity.vars, argarray(arguments), arity.variadic);
                        return evaluate(arity.exp, createEnv1(dict, env));
                        
                    }
                    return f;
                } 
                else if (x[0] === sym.do) { // (do exp+)
                    x.slice(1, -1).forEach(function(exp) {
                        evaluate(exp, env)
                    });
                    x = x.slice(-1)[0];
                } 
                else if (x instanceof Vector) {
                    return x;
                } 
                else { // (f exp*)
                    var f = evaluate(x[0], env);
                    if (!isfunction(f)) {
                        throw new RuntimeError(f + ' is not a function.')
                    }
                    var argslist = rest(x);
                    var args = map(argslist, function(arg, index) {
                        return evaluate(arg, env);
                    });
                    return f.apply(null, args);
                }
            }
        }
        
        function expand(x, toplevel) {
            if (!existy(toplevel))
                toplevel = false;
            
            if (!isnonemptylist(x)) { // constant => unchanged
                return x;
            }
            require(x, !isempty(x)) // () => Error
            if (x[0] === sym.quote) { // (quote exp)
                require(x, length(x) == 2)
                return x;
            } 
            else if (x[0] === sym.if) {
                if (length(x) == 3) {
                    x.length = 4
                } // (if t c) => (if t c None)
                require(x, length(x) == 4)
                return map(x, expand)
            } 
            else if (x[0] === sym['set!']) {
                require(x, length(x) == 3);
                require(x, isSym(x[1]), 'can set! only a symbol');
                return [sym['set!'], x[1], expand(x[2])]
            } 
            else if (x[0] === sym.define || x[0] === sym['define-macro']) {
                require(x, length(x) >= 3)
                var def = x[0];
                var v = x[1];
                var body = x.slice(2);
                if (islist(v) && v) { // (define (f args) body)
                    var fname = v[0];
                    var args = new types.Vector(rest(v)); //  => (define f (fn [args] body))
                    return expand([def, fname, [sym.fn, args].concat(body)])
                } 
                else {
                    require(x, length(x) == 3) // (define non-var/list exp) => Error
                    require(x, isSym(v), 'can define only a symbol')
                    var exp = expand(x[2])
                    if (def == sym['define-macro']) {
                        require(x, toplevel, 'define-macro only allowed at top level');
                        var proc = evaluate(exp);
                        require(x, isfunction(proc), 'macro must be a procedure');
                        macros.define(v, proc);
                        return; //  => None; add v:proc to macro_table
                    }
                    return [sym.define, v, exp]
                }
            } 
            else if (x[0] === sym.do) {
                if (length(x) == 1)
                    return undefined; // (do) => None
                else {
                    return map(x, function(xi) {
                        return expand(xi, toplevel)
                    });
                }
            } 
            else if (x[0] === sym.fn) { // (fn (x) e1 e2) 
                return expandFn(x)
            } 
            else if (x[0] === sym.syntaxquote) { // `x => expandSyntaxQuote(x)
                require(x, length(x) == 2)
                return expandSyntaxQuote(x[1])
            } 
            else if (x[0] === sym['defmacro']) {
                require(x, toplevel, 'defmacro only allowed at top level');
                require(x, length(x) == 3) // (defmacro v proc)
                var v = x[1];
                require(x, isSym(v), 'can define only a symbol')
                var proc = evaluate(expand(x[2]));
                require(x, isfunction(proc), 'macro must be a procedure');
                macros.define(v, proc);
                return;
            } 
            else if (isSym(x[0]) && (macros.isMacro(x[0]))) { // => macroexpand if m isa macro
                return expand(macros.load(x[0]).apply(null, rest(x)), toplevel) // (m arg...) 
            } 
            else {
                return map(x, expand) // (f arg...) => expand each
            }
        }
        
        function expandFn(x) {
            
            var list;
            require(x[1], islist(x[1]) || isvector(x[1]), 'expected list or vector')
            if (isvector(x[1])) {
                require(x, length(x) >= 3);
                list = [rest(x)]
            } 
            else {
                require(x, length(x) >= 2);
                list = x[1];
            }
            var sigs = map(list, function(item) {
                var vars = item[0];
                require(x, all(vars, function(v) {
                    return isSym(v);
                }), 'expected symbols in args list');
                
                var body = item.slice(1);
                var exp = expand(length(body) == 1 ? body[0] : cons(sym.do, body));
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
            
            if (!isnonemptylist(x)) {
                return [sym.quote, x];
            }
            require(x, x[0] !== sym.unquotesplice, "can't splice here")
            if (x[0] == sym.unquote) {
                require(x, length(x) == 2);
                return x[1];
            } 
            else if (x[0] == sym.autogensym) {
                require(x, length(x) == 2);
                var pref = x[1];
                var gs = gensyms[pref];
                if (!gs) {
                    var gs0 = pref + (Math.random() * 1001 | 0);
                    gs = createSym(gs0);
                    gensyms[pref] = gs;
                }
                return [sym.quote, gs];
            } 
            else if (isnonemptylist(x[0]) && x[0][0] == sym.unquotesplice) {
                require(x[0], length(x[0]) == 2)
                return [sym.append, x[0][1], expandSyntaxQuote(rest(x))]
            } 
            else {
                if (!gensyms)
                    gensyms = types.newDict();
                var ret = [sym.cons, expandSyntaxQuote(x[0], gensyms), expandSyntaxQuote(rest(x), gensyms)]
                return ret;
            }
        }

        ////
        
        function tokzer(s) {
            //var lines = s.split('\n');
            //         var lines = [s];
            var line = s;
            return function() {
                while (true) {
                    //                 if (!line.length)
                    //                     line = lines.shift();
                    if (line == undefined)
                        return sym.EOF;
                    // see https://regex101.com/#javascript
                    // var regex = /\s*(,@|[('`,)]|'(?:[\\].|[^\\'])*'|;.*|[^\s(''`,;)]*)(.*)/g;
                    
                    var regex = /[\s,]*("[^"]*"|~@|[(){}[\]'`~]|'(?:[\\].|[^\\'])*'|;.*|[^\s,(){}[\]`~;"]*)([^]*)/g;
                    var list = regex.exec(line);
                    var token = list[1];
                    line = list[2];
                    if (token.length && !startswith(token, ';'))
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
                    ret = readBrackets(new Vector(), ']');
                    return ret;
                } 
                else if (token == '{') {
                    ret = readBrackets([], '}');
                    var kv = [];
                    var ret1 = reduce(ret, function(acc, item) {
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
                else if (contains([')', ']', '}'], token))
                    throw new SyntaxError('unexpected ' + token)
                else if (token in quotes)
                    return [quotes[token], read(tokzer)]
                else if (token == sym.EOF)
                    throw new SyntaxError('unexpected EOF in list')
                else {
                    var x = createAtom(token);
                    if (isSym(x)) {
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
            return token1 == sym.EOF ? sym.EOF : readAhead(token1);
        }

        ////
        
        function initGlobals() {
            
            globalEnv = createEnv1({}, null);
            
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
                'cons': cons,
                'first': function(a) {
                    return first(a);
                },
                'rest': function(a) {
                    return rest(a);
                },
                'append': function() {
                    var args = argarray(arguments);
                    var ret = Array.prototype.concat.apply(args[0], rest(args));
                    return ret;
                },
                'list': function() {
                    return argarray(arguments);
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
                    return evaluate(x, utils.output);
                },
                'display': function(x) {
                    utils.output.log(isstring(x) ? x : tostring(x));
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
            
            var math = pick(Math, ['abs', 'acos', 'asin', 'atan', 'atan2', 
                'ceil', 'cos', 'exp', 'floor', 'log', 'max', 'min', 'pow', 
                'random', 'round', 'sin', 'sqrt', 'tan']);
            
            return envAssign(globalEnv, assign(types.newDict(), basics, math));
        }
        
        function equal(a, b) {
            //cast String, Sym and Keyword strings to primitive string
            return (isstring(a) && isstring(b)) ? String(a) === String(b) : a === b;
        }
        
        function callcc(func) {
            var ball = new RuntimeWarning("Sorry, can't continue this continuation any longer.");
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
        
        function createEnv1(dict, outer) {
            var env = {
                __outer: outer,
            };
            envAssign(env, dict);
            return env;
        }
        
        
        function findEnv(env, v) {
            if (v in env)
                return env;
            else if (env.__outer)
                return findEnv(env.__outer, v);
            throw new RuntimeError('Could not lookup ' + v);
        }
        
        function envGet(env, v) {
            return findEnv(env, v)[v];
        }
        
        function envDefine(env, v, value) {
            env[v] = value;
        }
        
        function envSet(env, v, value) {
            return findEnv(env, v)[v] = value;
        }
        
        function envAssign(env, dict) {
            assign(env, dict);
        }

    ////
    
    }, libkeys);
});
