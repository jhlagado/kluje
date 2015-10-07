'use strict';

jex.service('kluje', ['evaluator', 'expander', 'parser'], 
function(evaluator, expander, parser) {
        
        return {
            run: run,
        }
        
        function run(expression) {
            var s = expression; //.replace(/\n/g, ' '); //strip \n
            var p = parser.parse(s);
            var x = expander.expand(p, true)
            var e = evaluator.evaluate(x);
            return e;
        }
        
});
