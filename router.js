/*jshint evil:false, browser:true, jquery:true, strict:true, bitwise:true, camelcase:true, curly:true, eqeqeq:true, forin:true, immed:true, indent:4, latedef:true, newcap:true, noarg:true, noempty:true, nonew:true, quotmark:"single", undef:true, unused:true, trailing:true, maxparams:3 */
/*global Exception*/

(function (global) {
    'use strict';

    var $ = global.jQuery,
        $window = $(window),
        History = function (loadUrl) {
            this.loadUrl = loadUrl;
            this.fragment = this.getFragment();

            if ('onhashchange' in global) {
                $window.on('hashchange', $.proxy(this.checkUrl, this));
            } else {
                // Creepy IE8. Sadly if user clicks reaaaally fast,
                // might not be able to see the correct content.
                setInterval($.proxy(this.checkUrl, this), 50);
            }
        },
        Router = function (options) {
            this.options = options;
            this.routes = options.routes;
            this.history = new History($.proxy(this.parse, this));
            this.parse();
        };

    History.prototype = {
        getFragment: function (url) {
            url = url || global.location.href;
            return '#' + url.replace(/^[^#]*#?(.*)$/, '$1');
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
            $.each(router.routes, function (pattern, handler) {
                var fragment = router.history.fragment,
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
                    params = $.map(params.slice(1), function (param) {
                        return param ? decodeURIComponent(param) : null;
                    });

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
}(window));