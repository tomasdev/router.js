/*jshint evil:false, browser:true, jquery:true, strict:true, bitwise:true, camelcase:true, curly:true, eqeqeq:true, forin:true, immed:true, indent:4, latedef:true, newcap:true, noarg:true, noempty:true, nonew:true, quotmark:"single", undef:true, unused:true, trailing:true, maxparams:3 */
/*global Exception*/

// TODO: For IE8 support, only `.bind()` polyfill is needed.

(function (global) {
    'use strict';

    var History = function (loadUrl) {
            this.loadUrl = loadUrl;
            this.fragment = this.getFragment();

            if ('onhashchange' in global) {
                global.addEventListener('hashchange', this.checkUrl.bind(this), false);
            } else {
                throw new Error('Your browser doesn\'t support hashchange');
            }
        },
        Router = function (options) {
            this.options = options;
            this.routes = options.routes;
            this.history = new History(this.parse.bind(this));
            this.parse();
        };

    History.prototype = {
        getFragment: function (url) {
            url = (url || global.location.href).replace(/^[^#]*#?(.*)$/, '$1');
            return url ? '#' + url : '';
        },
        checkUrl: function () {
            var current = this.getFragment();
            if (current === this.fragment) {
                return false;
            }
            this.fragment = current;
            this.loadUrl();
        }
    };

    Router.prototype = {
        routeToRegExp: function (route) {
            if (typeof route !== 'string') {
                return route;
            }

            route = route
                        .replace(/[\-{}\[\]+?.,\\\^$|#\s]/g, '\\$&')
                        .replace(/\((.*?)\)/g, '(?:$1)?')
                        .replace(/(\(\?)?:\w+/g, function (match, optional) {
                            return optional ? match : '([^\/]+)';
                        })
                        .replace(/\*\w+/g, '(.*?)');

            return new RegExp('^' + route + '$');
        },

        parse: function () {
            var router = this;
            Object.keys(router.routes).forEach(function (pattern) {
                var handler = router.routes[pattern],
                    fragment = router.history.fragment,
                    params;

                pattern = router.routeToRegExp(pattern);
                params = fragment.match(pattern);

                if (typeof handler === 'string') {
                    handler = router.options[handler];
                } else if (typeof handler !== 'function') {
                    throw new Exception('Given handler for ' + pattern + ' in Router configuration is invalid.');
                }

                if (params) {
                    // Splice 1 which is the fragment itself
                    params = params.slice(1).map(function (param) {
                        return param ? decodeURIComponent(param) : null;
                    });

                    console.log(router, params, '------');

                    try {
                        handler.apply(router, params);
                    } catch (e) {
                        // e.stack is available
                        if (handler !== 'defaultHandler') {
                            router.options.defaultHandler();
                        }
                    }

                    return false;
                }
            });
        },

        navigate: function (hash) {
            global.location.href = hash;
            this.parse();
        }
    };

    global.Router = Router;
} (window));
