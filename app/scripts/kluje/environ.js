'use strict';

jex.service('environ', ['types', 'utils'], function(types, utils) {
    
    return {
        create: create,
        find: find,
        get: get,
        define: define,
        set: set,
        assign: assign,
    }
    
    function create(dict, outer) {
        var env = {
            __outer: outer,
        };
        assign(env, dict);
        return env;
    }
    
    function find(env, v) {
        if (v in env)
            return env;
        else if (env.__outer)
            return find(env.__outer, v);
        throw new types.RuntimeError('Could not lookup ' + v);
    }
    
    function get(env, v) {
        return find(env, v)[v];
    }
    
    function define(env, v, value) {
        env[v] = value;
    }
    
    function set(env, v, value) {
        return find(env, v)[v] = value;
    }
    
    function assign(env, dict) {
        utils.assign(env, dict);
    }

});
