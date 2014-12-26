# Traffic Cop

Simple router for web applications using the HTML5 History API.

## Compatibility

- Chrome
- Firefox
- Safari
- Opera
- Android Browser
- IE 10 +

## Installation and usage

1. Drop into your project and include using CommonJS style (Browserify, Webpack etc)

        var TrafficCop = require('trafficcop');

2. Add routes

        TrafficCop.add( ROUTE, CALLBACK, MODULE )

 ROUTE: A Backbone.js style route string - e.g., '/profile', '/profile/:user'

 CALLBACK: Function to be execute when route is triggered.

 MODULE: String. A grouping for similar routes. This is to allow blocks of routes to be added and removed.

 _Note: Routes added later receive higher priority._

3. Start!

        TrafficCop.start();



## API

- Add

 Adds a new route.

        TrafficCop.add( ROUTE, CALLBACK, MODULE )

- Add Module

 Adds all routes in the array with the specified module.

        TrafficCop.addModule( MODULE , [ { route: ROUTE, callback: CALLBACK }, ... ])

- Remove

 Removes routes.

        TrafficCop.remove( ROUTE, MODULE )

 Either can be null or undefined (but not both).
 Null route will remove all routes for the specified module. Null module will remove all matching routes irrespective of module.

- Start

 Starts the routing.

- Stop

 Unbinds event listeners.

- Navigate

 Navigates to the specified route.

        TrafficCop.navigate( ROUTE, OPTIONS, STATE )

 ROUTE: The route to navigate to.

 OPTIONS: Object containing two options.

        { replace: false, rerun: false }

 replace: replace the current history entry rather than push a new one.

 rerun: rerun the callback for the route even if it's the current route.


 STATE: A state object. This can be anything. This will be stored and exposed again on browser navigation (i.e., Back/Forwards).


 The callback to a route receives two arguments:

 PARAMS: Object of parameters from the route. E.g., route of '/profile/:user' with URL '/profile/pablo' will result in an object like this:

        { user: 'pablo' }

 This object also contains a special '_internals' object with the following keys:

        route, moduleId, navigated, replaced, rerun

 navigated: Boolean to indicate whether the route was hit from a call to 'navigate' or from browser history controls.

 STATE: The state object passed in to the call to 'navigate'.
