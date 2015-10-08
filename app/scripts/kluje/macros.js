'use strict';

jex.service('macros', ['evaluator', 'expander', 'funcs', 'parser', 'symbols', 'types', 'utils'], 
function(evaluator, expander, _, parser, symbols, types, utils) {
    
    var sym = symbols.sym;
    
    var defs = getDefs();
    var macrotable = types.newDict({
        let: _let,
    });
    
    return {
        isMacro: isMacro,
        load: load,
        define: define,
    }
    
    function isMacro(name) {
        load(name);
        return name in macrotable;
    }
    
    function load(name) {
        if (name in macrotable)
            return macrotable[name]
        else if (name in defs) {
            var value = evaluator.evaluate(expander.expand(parser.parse(defs[name])));
            return define(name, value);
        }
    }
    
    function define(name, value) {
        macrotable[name] = value;
        return value;
    }
    
    function getDefs() {
        return {
            andx: '(fn (([] "none") ([x] "one") ([x y] "two") ([& args] "many")))',
            
            and: '(fn [& args]                                          \n' + 
            '   (if (null? args) true                                   \n' + 
            '       (if (= (length args) 1) (first args)                \n' + 
            '           `(if ~(first args) (and ~@(rest args)) false))))',
            or: '(fn [& args]                                          \n' + 
            '   (if (null? args) nil                                   \n' + 
            '       (if (= (length args) 1) (first args)                \n' + 
            '           `(if ~(first args) true (or ~@(rest args))))))',
        }
    }
    
    function _let() {
        var args = utils.argarray(arguments);
        var x = _.cons(sym.let, args);
        utils.require(x, args.length > 1);
        var bindings = _.partition(2, args[0]);
        var body = _.rest(args);
        utils.require(x, utils.every(bindings.map(function(b) {
            return types.islist(b) && utils.length(b) == 2 && symbols.isSym(b[0]);
        }, "illegal binding list")));
        var uz = utils.unzip(bindings);
        var vars = new types.Vector(uz[0]);
        var vals = uz[1];
        var f = [[sym.fn, vars].concat(body.map(expand))].concat(vals.map(expand));
        return f;
        
        function expand(x) {
            return expander.expand(x, true);
        }
    
    }

});
