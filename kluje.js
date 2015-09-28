'use strict';

(function(root, factory) {
    
    if (typeof exports === 'object' && exports) {
        factory(exports); // CommonJS
    } 
    else {
        var lib = {};
        factory(lib);
        if (typeof define === 'function' && define.amd)
            define(lib); // AMD
        else
            root[lib.name] = lib; // <script>
    }

}(this, function(lib) {
    
    var x = new Symbol('x');
    var y = String(x)
    
    lib.name = 'kluje';
    lib.version = '0.0.0';
    
    lib.setoutput = setoutput;
    lib.run = run;
    lib.parse = parse;
    lib.evaluate = evaluate;
    
    lib.tostring = tostring;
    lib.createSym = createSym;
    lib.issymbol = issymbol;
    lib.isvector = isvector;
    lib.iskeyword = iskeyword;
    
    lib.SyntaxError = SyntaxError;
    lib.RuntimeError = RuntimeError;
    
    var sym, globalEnv, quotes, EOF, macrotable;
    
    var output = console;
    
    function SyntaxError(msg) {
        this.msg = 'SyntaxError: ' + msg;
        output.error(msg);
    }
    
    function RuntimeError(msg) {
        this.msg = 'RuntimeError: ' + msg;
        output.error(msg);
    }
    
    function RuntimeWarning(msg) {
        this.msg = 'RuntimeWarning: ' + msg;
        output.warn(msg);
    }

    //Vector
    function Vector() {
        Array.prototype.push.apply(this, arguments);
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

    //Symbol
    function Symbol(s) {
        String.call(this, s);
        this.s = s.valueOf();
    }
    Symbol.prototype = Object.create(String.prototype);
    Symbol.prototype.toString = function() {
        return this.s;
    }
    Symbol.prototype.valueOf = function() {
        return this.s;
    }
    
    initFunk();
    initSymbols();
    initGlobals();
    initMacros();

    //outputs are objects that support the js logging interface 
    //e.g. console
    //they must support the method log()
    function setoutput(aoutput) {
        output = aoutput;
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
            
            if (issymbol(x)) // v reference
                return envGet(env, x);
            else if (!isnonemptylist(x)) // constant literal
                return x
            
            else if (x[0] === sym.quote) // (quote exp)
                return x[1];
            else if (x[0] === sym.keyword) // (keyword exp)
                return new Keyword(x[1]);
            else if (x[0] === sym.if) // (if test conseq alt)
                x = evaluate(x[1], env) ? x[2] : x[3];
            else if (x[0] === sym.or) // (if test conseq alt)
                x = evaluate(x[1], env) || evaluate(x[2], env);
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
            else if (x[0] === sym.lambda) { // (fn (var*) exp)
                var vars = x[1];
                var exp = x[2];
                return function() {
                    return evaluate(exp, createEnv(vars, argarray(arguments), env));
                }
            } 
            else if (x[0] === sym.fn) { // (lambda (var*) exp)
                var config = x[1];
                var f = function() {
                    var numargs = arguments.length;
                    var arity = reduce(config, function(acc, item) {
                        if (!acc && item.variadic)
                            return item;
                        else if (numargs == item.vars.length)
                            return item;
                        return acc;
                    }, null);

                    var args;
                    if (!arity) {
                        throw new RuntimeError(isstring(x) + 'number of arguments mismatch')
                    } 
                    else {
                        var args = argarray(arguments);
                        if (arity.variadic) {
                            var vl = arity.vars.length - 1;
                            args = args.slice(0, vl).concat([args.slice(vl)]);
                        } 
                    }
                    return evaluate(arity.exp, createEnv(arity.vars, args, env));
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
                return f.apply(env, args);
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
        else if (x[0] === sym.or) {
            require(x, length(x) == 3)
            return map(x, expand)
        } 
        else if (x[0] === sym['set!']) {
            require(x, length(x) == 3);
            require(x, issymbol(x[1]), 'can set! only a symbol');
            return [sym['set!'], x[1], expand(x[2])]
        } 
        else if (x[0] === sym.define || x[0] === sym['define-macro']) {
            require(x, length(x) >= 3)
            var def = x[0];
            var v = x[1];
            var body = x.slice(2);
            if (islist(v) && v) { // (define (f args) body)
                var f = v[0];
                var args = rest(v); //  => (define f (lambda (args) body))
                return expand([def, f, [sym.lambda, args].concat(body)])
            } 
            else {
                require(x, length(x) == 3) // (define non-var/list exp) => Error
                require(x, issymbol(v), 'can define only a symbol')
                var exp = expand(x[2])
                if (def == sym['define-macro']) {
                    require(x, toplevel, 'define-macro only allowed at top level');
                    var proc = evaluate(exp);
                    require(x, isfunction(proc), 'macro must be a procedure');
                    macrotable[v] = proc; // (define-macro v proc)
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
        else if (x[0] === sym.lambda) { // (lambda (x) e1 e2) 
            require(x, length(x) >= 3) //  => (lambda (x) (do e1 e2))
            var vars = x[1];
            var body = x.slice(2);
            require(x, issymbol(vars) || all(map(vars, function(v) {
                return issymbol(v);
            })), 'illegal lambda argument list')
            var exp = length(body) == 1 ? body[0] : cons(sym.do, body);
            return [sym.lambda, vars, expand(exp)]
        } 
        else if (x[0] === sym.fn) { // (fn (x) e1 e2) 
            return expandFn(x)
        } 
        else if (x[0] === sym.syntaxquote) { // `x => expandSyntaxQuote(x)
            require(x, length(x) == 2)
            return expandSyntaxQuote(x[1])
        } 
        else if (issymbol(x[0]) && (x[0] in macrotable)) {
            return expand(macrotable[x[0]].apply(null, rest(x)), toplevel) // (m arg...) 
        } 
        else { //        => macroexpand if m isa macro
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
        var config = map(list, function(item) {
            var vars = item[0];
            require(x, all(vars, function(v) {
                return issymbol(v);
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
        return [x[0], config]
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
                gs = new Symbol(gs0);
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
                gensyms = {};
            var ret = [sym.cons, expandSyntaxQuote(x[0], gensyms), expandSyntaxQuote(rest(x), gensyms)]
            return ret;
        }
    }

    ////
    
    function tokzer(s) {
        //var lines = s.split('\n');
        var lines = [s];
        var line = '';
        return function() {
            while (true) {
                if (!line.length)
                    line = lines.shift();
                if (line == undefined)
                    return EOF;
                // see https://regex101.com/#javascript
                // var regex = /\s*(,@|[('`,)]|'(?:[\\].|[^\\'])*'|;.*|[^\s(''`,;)]*)(.*)/g;
                
                var regex = /[\s,]*("[^"]*"|~@|[(){}[\]'`~]|'(?:[\\].|[^\\'])*'|;.*|[^\s,(){}[\]`~;"]*)(.*)/g;
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
//             else if (token == '"') {
//                 ret = readBrackets([], '"');
//                 return ret.join(' ');
//             } 
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
            else if (token == EOF)
                throw new SyntaxError('unexpected EOF in list')
            else {
                var x = atom(token);
                if (issymbol(x)) {
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
        return token1 == EOF ? EOF : readAhead(token1);
    }
    
    function atom(token) {
        if (token == 'true')
            return true
        else if (token == 'false')
            return false
        else if (token[0] == '"')
            return token.slice(1, -1);
        else if (!isNaN(token))
            return Number(token); //Cast to number
        else if (token[0] == ':')
            return new Keyword(token.slice(1));
        else
            return createSym(token);
    }
    
    function require(x, predicate, msg) {
        if (!existy(msg))
            msg = 'wrong length';
        if (!predicate)
            throw new SyntaxError(tostring(x) + ': ' + msg);
    }

    ////
    
    function initSymbols() {
        sym = {};
        
        EOF = createSym('EOF');
        
        ['quote', 'if', 'or', 'set!', 'define', 'lambda', 'do', 'define-macro', 
            'syntaxquote', 'unquote', 'unquotesplice', 'autogensym', 
            'append', 'cons', 'let', 'fn', 'list']
        .forEach(function(s) {
            createSym(s);
        });
        
        quotes = {
            '\'': sym.quote,
            '`': sym.syntaxquote,
            '~': sym.unquote,
            '~@': sym.unquotesplice,
        }
        
        each(['fn'], function(s) {
            createSym(s);
        });
    
    }
    
    function initGlobals() {
        
        globalEnv = createEnv([], [], null);
        
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
            'pair?': islist(x) && x.length > 1,
            'apply': function(proc, args) {
                return proc.apply(null, args);
            },
            'eval': function(x) {
                return evaluate(x, output);
            },
            'display': function(x) {
                output.log(isstring(x) ? x : tostring(x));
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
        
        return envAssign(globalEnv, assign({}, basics, math));
    }
    
    function equal(a, b) {
        //cast String, Symbol and Keyword strings to primitive string
        return (isstring(a) && isstring(b)) ? String(a) === String(b) : a === b;
    }
    
    function initMacros() {
        macrotable = {};
        macrotable['let'] = _let;
//         evaluate(parse(
//         '(do                                                   \n' + 
//         '(define-macro and (lambda args                           \n' + 
//         '   (if (null? args) true                                   \n' + 
//         '       (if (= (length args) 1) (first args)                \n' + 
//         '           `(if ~(first args) (and ~@(rest args)) false)))))   \n' + 
//         ')                                                        \n'
//         ));
//         evaluate(parse(
//         '(do                                                   \n' + 
//         '(define-macro or (lambda args                           \n' + 
//         '   (if (null? args) true                                   \n' + 
//         '       (if (= (length args) 1) (first args)                \n' + 
//         '           `(if ~(not (first args)) (or ~@(rest args)) false)))))   \n' + 
//         ')                                                        \n'
//         ));
    }
    
    function _let() {
        var args = argarray(arguments);
        var x = cons(sym.let, args);
        require(x, length(args) > 1);
        var bindings = args[0];
        var body = rest(args);
        require(x, all(map(bindings, function(b) {
            return islist(b) && length(b) == 2 && issymbol(b[0]);
        }, "illegal binding list")));
        var uz = unzip(bindings);
        var vars = uz[0];
        var vals = uz[1];
        var f = [[sym.lambda, vars].concat(map(body, expand))].concat(map(vals, expand));
        return f;
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
    
    function createSym(s) {
        if (!(s in sym)) {
            var sy = new Symbol(s);
            sym[s] = sy;
        }
        return sym[s];
    }
    
    function createEnv(params, args, outer) {
        var env = {
            __outer: outer,
        };
        if (issymbol(params))
            envDefine(env, params, args);
        else {
            if (length(args) != length(params)) {
                throw new SyntaxError('Expected ' + length(params) + 
                ' args, got ' + length(args) + ' args');
            }
            var dict = zipobject(map(params, function(symbol) {
                return symbol;
            }), args);
            envAssign(env, dict);
        }
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
    
    function islist(x) {
        return isarray(x);
    }
    
    function isnonemptylist(x) {
        return islist(x) && x.length;
    }
    
    function issymbol(obj) {
        return obj instanceof Symbol;
    }
    
    function isvector(x) {
        return x instanceof Vector;
    }
    
    function iskeyword(x) {
        return x instanceof Keyword;
    }
    
    function tostring(x) {
        if (x === true)
            return 'true'
        else if (x === false)
            return 'false'
        else if (iskeyword(x))
            return String(x)
        else if (issymbol(x))
            return String(x)
        else if (isNaN(x)) {
            if (isstring(x) && !x.type)
                return '"' + x + '"';
            else if (isvector(x))
                return '[' + map(x, tostring).join(' ') + ']'
            else if (islist(x))
                return '(' + map(x, tostring).join(' ') + ')'
            else if (isobject(x))
                return '{' + map(funk.keys(x), function(key) {
                    var value = x[key];
                    return String(atom(key)) + ' ' + tostring(value);
                }).join(' ') + '}'
            else
                return String(x);
        } 
        else {
            return x;
        }
    }
    
    var all, argarray, assign, cons, contains, each, existy, 
    filter, first, isarray, isboolean, iscoll, isempty, isfunction, 
    isobject, isstring, keys, length, map, 
    pick, reduce, rest, startswith, unzip, values, zipobject;
    
    function initFunk() {
        all = funk.all;
        argarray = funk.argarray;
        assign = funk.assign;
        cons = funk.cons;
        contains = funk.contains;
        each = funk.each;
        existy = funk.existy;
        filter = funk.filter;
        first = funk.first;
        isarray = funk.isarray;
        isboolean = funk.isboolean;
        iscoll = funk.iscoll;
        isempty = funk.isempty;
        isfunction = funk.isfunction;
        isobject = funk.isobject;
        isstring = funk.isstring;
        keys = keys;
        length = funk.length;
        map = funk.map;
        pick = funk.pick;
        reduce = funk.reduce;
        rest = funk.rest;
        startswith = funk.startswith;
        unzip = funk.unzip;
        values = funk.values;
        zipobject = funk.zipobject;
    
    }

}));
