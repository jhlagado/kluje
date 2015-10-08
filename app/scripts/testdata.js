jex.service('testdata', ['funcs', 'types','symbols'], function(_, types, symbols) {
    
        return {
            tests: [
                {test:'(defn f1 ([] (f1 1) ) ([x] (+ x x)))', expect:undefined },
                {test:'(f1)', expect:2 },
                {test:'(defmacro m2 ([] `(m2 1) ) ([x] `(+ ~x ~x)))', expect:undefined},            
                {test:'(defmacro m1 [x] `(+ ~x ~x))', expect:undefined},            
                {test:'(m1 1)', expect:2},            
                {test: '(defmacro unless [& args] `(if (not ~(first args)) (do ~@(rest args)))) ; test `', expect:undefined},

                {test: '`~@L', expect:expectSyntaxError},
                {test: '(or true false)',expect: true}, 
                {test: '(and true false)',expect: false}, 
                {
                    test: '(let [x 1] x)',
                    expect: 1,
                }, 
                {
                    test: '(quote "x")', 
                    expect: function(data, result){
                        return (result && result[1] == result[3]); 
                    }
                }, 
                {
                    test: '"12 \n3"', 
                    expect: function(data, result){
                        var s = "12 \n3";
                        return result == s;
                    }
                }, 
                {
                    test: '"12 3"', 
                    expect: function(data, result){
                        return result == "12 3";
                    }
                }, 
                {
                    test: '((fn [a & b] b) 0 1 2 3)', 
                    expect: [1,2,3],
                }, 
                {
                    test: '((fn ([a] a) ([a b] (+ a b) 100 )) 1 2)', 
                    expect: 100,
                }, 
                {
                    test: '((fn ([a] a) ([a b] (+ a b))) 1 2)', 
                    expect: 3,
                }, 
                {
                    test: '((fn ([a] a) ([a b] (+ a b))) 1)', 
                    expect: 1,
                }, 
                {
                    test: '((fn [a] a) 1)', 
                    expect: 1,
                }, 
                {
                    test: '(fn [a] a)', 
                    expect: function(data, result){
                        return _.isfunction(result) && result(1) == 1;
                    }
                }, 
                {
                    test: '()', 
                    expect: function(data, result){
                        return _.isarray(result) && !result.length;
                    }
                }, 
                {test: '\'x', expect: symbols.createSym('x')},
                {
                    test: '{:a 2}', 
                    expect: function(data, result){
                        return (result instanceof Object) && 
                        _.isequal(result, {':a':2})
                    }
                }, 
                {
                    test: '`(let [x# 1] (= x# 1))', 
                    expect: function(data, result){
                        return result; 
                    }
                }, 
                {
                    test: '`(1 x# 4 x#)', 
                    expect: function(data, result){
                        return (result && result[1] == result[3]); 
                    }
                }, 
                {
                    test: '`(1 ~@(list 2 3) 4)', 
                    expect: function(data, result){
                        return (result instanceof Array) && 
                        _.isequal(result, [1,2,3,4])
                    }
                }, 
                {
                    test: '`(1 ~2 3)', 
                    expect: function(data, result){
                        return (result instanceof Array) && 
                        _.isequal(result, [1,2,3]);
                    }
                }, 
                {
                    test: '`(1 2 3)', 
                    expect: function(data, result){
                        return (result instanceof Array) && 
                        _.isequal(result, [1,2,3])
                    }
                }, 
                {
                    test: ":xyz",
                    expect: function(data, result){
                        return types.iskeyword(result) && result == 'xyz';
                    }
                }, 
                {
                    test: "(keyword 'xyz)",
                    expect: function(data, result){
                        return types.iskeyword(result) && result == 'xyz';
                    }
                }, 
                {
                    test: '{"a" 2}', 
                    expect: function(data, result){
                        return (result instanceof Object) && 
                        _.isequal(result, {a:2})
                    }
                }, 
                {
                    test: "[1 2]", 
                    expect: function(data, result){
                        return (types.isvector(result)) && 
                        _.isequal(result.toArray(), [1,2])
                    }
                }, 
                {test: ",',(,1, 2, 7,),;testing , see how it goes",expect: [1, 2, 7]}, 

                {test: '\
    (define combine (fn [f]     \n\
        (fn [x y]               \n\
            (if (null? x) (quote ()) \n\
               (f (list (first x) (first y)) \n\
                 ((combine f) (rest x) (rest y)))))))\
                 ',expect: undefined}, 
                {test: '(define zip (combine cons))',expect: undefined}, 

                {test: "'(1 2 7)",expect: [1, 2, 7]}, 
                {test: "`(1 2 ~(+ 3 4))",expect: [1, 2, 7]}, 
                {test: "`(1 ~@(list 1 1 1) 1)",expect: [1, 1, 1, 1, 1]}, 


                {test: '(zip (list 1 2 3 4) (list 5 6 7 8))',expect: [[1, 5], [2, 6], [3, 7], [4, 8]]}, 
                {test: '(let [a 1 b 2] (+ a b))', expect:3},
                {test: '(and 1 2 3)", 3), ("(and (> 2 1) 2 3)', expect:3}, 
                {test:'(and)', expect:true},
                {test: '(and (> 2 1) (> 2 3))', expect:false},
                {test: '(unless (= 2 (+ 1 1)) (display 2) 3 4)', expect:undefined},
                {test: '(unless (= 4 (+ 1 1)) (display 2) (display "\\n") 3 4)', expect:4},
                {test: '(quote x)', expect:expectSym('x')}, 
                {test: '(quote (1 2 three))', expect:[1, 2, symbols.createSym('three')]}, 
                {test: '\'(one 2 3)', expect:[symbols.createSym('one'), 2, 3]},
                {test: '(define L (list 1 2 3))', expect:undefined},
                {test: '`(testing ~@L testing)', expect:[symbols.createSym('testing'),1,2,3,symbols.createSym('testing')]},
                {test: '`(testing ~L testing)', expect:[symbols.createSym('testing'),[1,2,3],symbols.createSym('testing')]},

                {test: '\'(1 ;test comments \'          \n' +
                ';skip this line             \n' +
                '2 ; more ; comments ; ) )   \n' +
                '3) ; final comment          \n',
                expect:[1,2,3]},

                {test: '(quote (testing 1 (2.0) -3.14e159))',expect: [symbols.createSym('testing'), 1, [2.0], -3.14e159]}, 
                {test: '(+ 2 2)',expect: 4}, 
                {test: '(+ (* 2 100) (* 1 10))',expect: 210}, 
                {test: '(if (> 6 5) (+ 1 1) (+ 2 2))',expect: 2}, 
                {test: '(if (< 6 5) (+ 1 1) (+ 2 2))',expect: 4}, 
                {test: '(define x 3)',expect: undefined}, 
                {test: 'x',expect: 3}, 
                {test: '(+ x x)',expect: 6}, 
                {test: '(do (define x 1) (set! x (+ x 1)) (+ x 1))',expect: 3}, 
                {test: '((fn [x] (+ x x)) 5)',expect: 10}, 
                {test: '(define twice (fn [x] (* 2 x)))',expect: undefined}, 
                {test: '(twice 5)',expect: 10}, 
                {test: '(define compose (fn [f g] (fn [x] (f (g x)))))',expect: undefined}, 
                {test: '((compose list twice) 5)',expect: [10]}, 
                {test: '(define repeat (fn [f] (compose f f)))',expect: undefined}, 
                {test: '((repeat twice) 5)',expect: 20}, 
                {test: '((repeat (repeat twice)) 5)',expect: 80}, 
                {test: '(define fact (fn [n] (if (<= n 1) 1 (* n (fact (- n 1))))))',expect: undefined}, 
                {test: '(fact 3)',expect: 6}, 
                {test: '(fact 50)',expect: 30414093201713378043612608166064768844377641568960512000000000000}, 
                {test: '(define abs (fn [n] ((if (> n 0) + -) 0 n)))',expect: undefined}, 
                {test: '(list (abs -3) (abs 0) (abs 3))',expect: [3, 0, 3]}, 

                {test: '(define take (fn [n seq] (if (<= n 0) (quote ()) \n (cons (first seq) (take (- n 1) (rest seq))))))',expect: undefined}, 
                {test: '(take 2 (list 1 2 3))',expect: [1, 2]}, 
                {test: '(define drop (fn [n seq] (if (<= n 0) seq (drop (- n 1) (rest seq)))))',expect: undefined}, 
                {test: '(drop 1 (list 1 2 3))',expect: [2, 3]}, 
                {test: '(define mid (fn [seq] (/ (length seq) 2)))',expect: undefined}, 
                {test: '(mid (list 1 2 3 4))',expect: 2}, 

                {test: '(define riff-shuffle (fn [deck] \n' + 
                    '(do ((combine append) (take (mid deck) deck) (drop (mid deck) deck)))))',expect: undefined}, 

                {test: '(riff-shuffle (list 1 2 3 4 5 6 7 8))',expect: [1, 5, 2, 6, 3, 7, 4, 8]}, 
                {test: '((repeat riff-shuffle) (list 1 2 3 4 5 6 7 8))',expect: [1, 3, 5, 7, 2, 4, 6, 8]}, 
                {test: '(riff-shuffle (riff-shuffle (riff-shuffle (list 1 2 3 4 5 6 7 8))))',expect: [1, 2, 3, 4, 5, 6, 7, 8]}, 

                {test: '(set! x)',expect:expectSyntaxError}, 
                {test: '(define 3 4)',expect:expectSyntaxError}, 
                {test: '(quote 1 2)',expect:expectSyntaxError}, 
                {test: '(if 1 2 3 4)',expect:expectSyntaxError}, 
                {test: '(fn 3 3)',expect:expectSyntaxError}, 
                {test: '(fn [x])',expect:expectSyntaxError}, 
                {test: '(define (twice x) (* 2 x))', expect:undefined}, 
                {test: '(twice 2)', expect:4},
                {test: '(twice 2 2)', expect:expectRuntimeError},
                {test: '(define lyst (fn [& items] items))', undefined},
                {test: '(lyst 1 2 3 (+ 2 2))', expect:[1,2,3,4]},
                {test: '(if 1 2)', expect:2},
                {test: '(if (= 3 4) 2)', expect:undefined},
                {test: '(call/cc (fn [throw] (+ 5 (* 10 (throw 1))))) ;; throw', expect:1},
                {test: '(call/cc (fn [throw] (+ 5 (* 10 1)))) ;; do not throw', expect:15},
                {test:'(call/cc (fn [throw] \n' + 
                          '(+ 5 (* 10 (call/cc (fn [escape] (* 100 (escape 3)))))))) ; 1 level', expect:35},
                {test:'(call/cc (fn [throw]  \n' + 
                          '(+ 5 (* 10 (call/cc (fn [escape] (* 100 (throw 3)))))))) ; 2 levels', expect:3},
                {test:'(call/cc (fn [throw]  \n' + 
                '(+ 5 (* 10 (call/cc (fn [escape] (* 100 1))))))) ; 0 levels', expect:1005},


                {test: '(define ((account bal) amt) (set! bal (+ bal amt)) bal)', expect:undefined},
                {test: '(define a1 (account 100))', expect:undefined},
                {test: '(a1 0)', expect:100}, 
                {test:'(a1 10)', expect:110}, 
                {test:'(a1 10)', expect:120},

                {test:
                '(define (newton guess function derivative epsilon)\n' +
                    '(define guess2 (- guess (/ (function guess) (derivative guess))))\n'+
                    '(if (< (abs (- guess guess2)) epsilon) guess2 \n'+
                    '    (newton guess2 function derivative epsilon)))', expect:undefined},
                {test:
                '(define (square-root a)\n' +
                     '(newton 1 (fn [x] (- (* x x) a)) (fn [x] (* 2 x)) 1e-8))', 
                     expect:undefined},
                {test: '(> (square-root 200.) 14.14213)', expect:true},
                {test: '(< (square-root 200.) 14.14215)', expect:true},
                {test: '(= (square-root 200.) (sqrt 200.))', expect:true},
                {test:
                '(define (sum-squares-range start end)\n' +
                '     (define (sumsq-acc start end acc)\n' +
                '        (if (> start end) acc (sumsq-acc (+ start 1) end (+ (* start start) acc))))\n' +
                '     (sumsq-acc start end 0))', expect:undefined},
                {test: '(sum-squares-range 1 3000)', expect:9004500500}, // Tests tail recursion

    //             {test: "(1 2 3)",expect: expectRuntimeError}, //doesnt clean up env?



    //misc
                {name: 'number',test: '1',expect: 1}, 
                {name: 'bool true',test: 'true',expect: true}, 
                {name: 'bool false',test: 'false',expect: false}, 
                {name: 'string',test: '"x"',expect: 'x'}, 
                {name: 'list',test: '(list 1 2 3)',expect: [1, 2, 3]}, 
                {name: 'define var',test: '(do (define x 1) x)',expect: 1}, 
                {
                    test: '(do (define x "hello") x)',
                    expect: "hello"
                }, 
                {
                    test: '(type "")',
                    expect: "string"
                }, 
                {
                    test: '(type (get "" "constructor"))',
                    expect: "function"
                }, 
                {
                    test: '(type (fn [x] (x)))',
                    expect: "function"
                }, 
                {
                    test: '((fn [x] x) 1)',
                    expect: 1,
                }, 
                {
                    test: '(let [x 1 y 2] (+ x y))',
                    expect: 3,
                }, 
                {
                    test: '(do (define x "hi") (set! x "bye") x)',
                    expect: "bye"
                }, 
            ]
        }            

        function expectSym(x){
            return function(data, result, error){
                return result && symbols.isSym(result) && 
                result.toString() == x;
            }
        }

        function expectSyntaxError(data, result, error) {
            return error && error.constructor == types.SyntaxError;
        }

        function expectRuntimeError(data, result, error) {
            return error && error.constructor == types.RuntimeError;
        }

});



