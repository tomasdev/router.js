routerjs
========

router.js is a tiny script to create a handler of routes like (and based on) the Backbone Router but **without** any dependencies rather than jQuery.

usage example
=============

```javascript
var router = new Router({
    routes: {
        '#!/:id':   'getItem',
        '*default': 'defaultHandler'
    },
    getItem: function (id) {
        // Do something with the ID.
    },
    defaultHandler: function () {
        // This will get called on any invalid or not configured route.
    }
});
```


TO-DOs
=====
1. Implement HTML5 History API.
2. Add example.html
3. Think about defaultHandler being called on exceptions.
4. Create Router Helpers like URL builders
