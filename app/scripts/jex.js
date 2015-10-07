(function(root, factory) {
    
    if (typeof exports === 'object' && exports) {
        factory(exports); // CommonJS
    } 
    else {
        var lib = {};
        factory(lib);
        if (typeof define === 'function' && define.amd)
            define(lib); // AMD
        else if (!root[lib.name])
            root[lib.name] = lib; // <script>
        else
            throw lib.name + " already defined"
    }

})(this, function(lib) {
    
    var services = {};
    
    lib.name = 'jex';
    lib.version = '0.0.0';
    
    lib.service = service;
    lib.get = get;
    lib.use = use;
    lib.inject = inject;

    //registers a factory function with a name and also it's named dependencies
    //these dependencies will be injected into the function as args
    //the order of these args is the same as the order of the deps
    //name - string
    //deps - array of string
    //factory - function
    function service(name, deps, factory) {
        if (name in services)
            console.warn('Duplicate service: ' + name);
        services[name] = {
            deps: deps,
            factory: factory,
        }
    }

    //applies and caches a named factory function with all its dependencies applied
    //name - string

    //returns a cached value for that factory
    function get(name) {
        if (!(name in services))
            throw 'Cannot find service: ' + name;
        var service = services[name];
        if (!('value' in service)) {
            service.value = {}; 
            if (service.resolving)
                throw 'Circular dependency on self: ' + name;
            service.value.__resolving = true;
            var value = use(service.deps, service.factory);
            Object.keys(value).reduce(function(acc,key){
                acc[key] = value[key];
                return acc;
            },service.value);
         delete service.value.__resolving
        }
        return service.value;
    }

    //applies a factory function and injects named dependencies as args
    //deps - array of string
    //factory - function
    function use(deps, factory) {
        var values = deps.map(get);
        return inject(values, factory)
    }

    //inject values into a factory function
    //values can be an array or an object
    //if values is an object then the values to 
    //inject are mapped using keys 
    //values - array of values to inject or an dict with values in its properties
    //factory - function to be applid
    //keys - array of keys. Only needed if values is a dict
    function inject(values, factory, keys) {
        if (keys) {
            values = keys.map(function(key) {
                return values[key]
            });
        }
        return factory.apply(null, values);
    }

});
