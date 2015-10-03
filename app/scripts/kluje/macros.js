'use strict';

jex.service('macros', ['types'], function(types) {

    var macrotable = types.newDict();

    return {
        isMacro: isMacro,
        expand: expand,
    }

    function isMacro(name){
        return name in macrotable;
    }

    function expand(x) {

    } 

    function init() {
        macrotable = {};
        macrotable['let'] = _let;
        evaluate(parse(
        '(do                                                   \n' + 
        '(define-macro and (lambda args                           \n' + 
        '   (if (null? args) true                                   \n' + 
        '       (if (= (length args) 1) (first args)                \n' + 
        '           `(if ~(first args) (and ~@(rest args)) false)))))   \n' + 
        ')                                                        \n'
        ));
        evaluate(parse(
        '(do                                                   \n' + 
        '(define-macro or (lambda args                           \n' + 
        '   (if (null? args) true                                   \n' + 
        '       (if (= (length args) 1) (first args)                \n' + 
        '           `(if ~(not (first args)) (or ~@(rest args)) false)))))   \n' + 
        ')                                                        \n'
        ));
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
    
});