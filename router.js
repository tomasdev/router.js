/* jshint evil:false, browser:true, jquery:true, strict:true, bitwise:true, camelcase:true, curly:true, eqeqeq:true, forin:true, immed:true, indent:4, latedef:true, newcap:true, noarg:true, noempty:true, nonew:true, quotmark:single, undef:true, unused:true, trailing:true, maxparams:3 */

// TODO: For IE8 support, only `.bind()` polyfill is needed.

(function (global) {
    'use strict';

    var
        /**
         * Store for fragments, listens to `hashchange`
         * @class
         * @constructor
         * @param {function} loadUrl Callback to execute when URL has changed
         */
        History = function (loadUrl) {
            this.loadUrl = loadUrl;
            this.fragment = this.getFragment();

            if ('onhashchange' in global) {
                global.addEventListener('hashchange', this.checkUrl.bind(this), false);
            } else {
                throw new Error('Your browser doesn\'t support hashchange');
            }
        },

        /**
         * Router, ala Backbone.
         * @class
         * @constructor
         * @param     {object}   options        As explained below
         *     @param {object}   routes         Map with semi-RegEx syntax strings as keys, and handler's name (string) or
         *                                      handler's function as values. A special key `*default` can be used to match any.
         *     @param {function} defaultHandler Method to call in case of failure.
         *     @param {function} handler*       Method to call matching a value from `routes` map.
         */
        Router = function (options) {
            this.options = options;
            this.routes = options.routes;
            this.history = new History(this.parse.bind(this));
            this.parse();
        };

    History.prototype = {
        /**
         * Obtains fragment value from given URL.
         * @param  {string} url Address to parse
         * @return {string}     Fragment or empty string if not found.
         */
        getFragment: function (url) {
            url = (url || global.location.href).replace(/^[^#]*#?(.*)$/, '$1');
            return url ? '#' + url : '';
        },

        /**
         * Checks if fragment has changed and triggers the callback given to the class when instanced
         */
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
        /**
         * Transforms a given semi-RegEx string to a proper RegEx
         * @param  {string} route
         * @return {RegEx}  result
         */
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

        /**
         * Evaluates if any pattern (in the given `options.routes`) matches against current URL.
         * Whenever a valid handler throws an exception or no handler was found, triggers `options.defaultHandler`
         * The default handler will receive the exception as argument.
         */
        parse: function () {
            var router = this,
                mapper = function (param) {
                    return param ? decodeURIComponent(param) : null;
                };

            for (var pattern in router.routes) {
                if (router.routes.hasOwnProperty(pattern)) {
                    var handler = router.routes[pattern],
                        fragment = router.history.fragment,
                        params;

                    pattern = router.routeToRegExp(pattern);
                    params = fragment.match(pattern);

                    if (typeof handler === 'string') {
                        handler = router.options[handler];
                    }

                    if (typeof handler !== 'function' && params) {
                        throw new Error('Given handler for ' + pattern + ' in Router configuration is invalid.');
                    }

                    if (params) {
                        // Splice 1 which is the fragment itself
                        params = params.slice(1).map(mapper);

                        handler.apply(router, params);

                        return false;
                    }
                }
            }
        },

        /**
         * Set URL to hash and trigger it's handler (if any)
         * @param  {string} hash New state
         */
        navigate: function (hash) {
            global.location.href = hash;
            this.parse();
        }
    };

    global.Router = Router;
} (window));
