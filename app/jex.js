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

})(this, function(lib) {
    
    var services = {};

    lib.name = 'jex';
    lib.version = '0.0.0';

    lib.register = register;
    lib.get = get;
    lib.use = use;
    lib.inject = inject;

    function register(name, deps, func) {
        if (name in services) throw 'Duplicate service: ' + name;
        services[name] = {
            deps: deps,
            func: func,
        }
    }

    function get(name) {
        if (!(name in services)) throw 'Cannot find service: ' + name;
        var service = services[name];
        if (!('value' in service)) {
            if (service.resolving) throw 'Circular dependency on self: ' + name;
            service.resolving = true;
            service.value = use(service.deps, service.func);
            service.resolving = false;
        }
        return service.value;
    }

    function use(deps, func){
        var values = deps.map(get);
        return inject(values, func)    
    }

    //inject values into a function
    //values can be an array or an object
    //if values is an object then the values to 
    //inject are mapped using keys 
    function inject(values, func, keys) {
        if (keys) {
            values = keys.map(function(key){return values[key]});
        }
        return func.apply(null, values);
    }

});