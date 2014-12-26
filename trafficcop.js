var TrafficCop = {

  routes: [],
  root: '/',
  currentRoute: null,
  trail: [],


  /**
   * start - Starts the route managment
   *
   * @param  {type} options description
   * @return {type}         description
   */
  start: function (options) {
    options = options || {};

    // Set root
    this.root = this.clearSlashes(options.root) || '/';

    // Process initial route
    var initialOptions = {
      navigated: true,
      rerun: false,
      replace: false
    };

    this.checkRoute(initialOptions, {});

    // Listen for event
    window.addEventListener('popstate', this.handlePop.bind(this), false);
  },


  /**
   * stop - stops routing and removes listeners
   *
   * @return {type}  description
   */
  stop: function () {
    // Remove event listener
    window.removeEventListener('popstate', this.handlePop);
  },


  /**
   * handlePop - handles a popstate event
   *
   * @param  {type} e description
   * @return {type}   description
   */
  handlePop: function (e) {
    // Set options
    var options = {
      navigated: false,
      rerun: false,
      replace: false
    };

    // Get state
    var state = e.state || {};

    // Call checkRoute with options and state
    this.checkRoute(options, state);
  },


  /**
   * checkRoute - checks the current route
   *
   * @param  {type} e description
   * @return {type}   description
   */
   checkRoute: function (options, state) {
    options = options || {};
    state = state || {};

    // Get route from browser
    var current = this.getCurrentRoute();

    // Exit if not rerun and current route is the same as the new route
    if (!options.rerun && current === this.currentRoute) {
      return false;
    }

    // Set trail
    // Browser controls
    if (!options.navigated && this.trail[this.trail.length - 2] === current) {
      // New route is previous route. User pressed Back button.
      this.trail.pop();
    } else {
      // User pressed Forward button or navigated
      this.trail.push(current);
    }

    // Load the route
    this.loadRoute(current, options, state);
  },


  /**
   * loadRoute - Loads the current route
   *
   * @return {type}  description
   */
  loadRoute: function (current, options, state) {
    this.currentRoute = current;

    // Loop through routes
    for (var i = 0, j = this.routes.length; i<j; i++) {

      // Check if route matches the route regexp
      if (this.routes[i].route.test(current)) {
        this.execHandler(this.routes[i], current, options, state);

        break;
      }
    }
  },


  /**
   * execHandler - executes the route handler
   *
   * @param  {type} routeObj    description
   * @param  {type} routeString description
   * @return {type}             description
   */
  execHandler: function (routeObj, current, options, state) {
    // Get the args
    var params = this.getParams(routeObj, current);

    // Add internal params
    params['_internal'] = {
      route: current,
      moduleId: routeObj.moduleId,
      navigated: options.navigated,
      replaced: options.replace,
      rerun: options.rerun
    };

    // Execute the callback
    if (typeof routeObj.callback === 'function') {
      routeObj.callback.call(this, params, state);
    }
  },


  /**
   * getParams - extracts the parameters from the route
   *
   * @param  {type} routeObj    description
   * @param  {type} routeString description
   * @return {type}             description
   */
  getParams: function (routeObj, routeString) {
    // Get args
    var args = routeObj.route.exec(routeString).slice(1);

    var params = {};

    // Loop through each named parameter
    for (var i = 0, j = routeObj.namedParams.length; i<j; i++) {
      params[routeObj.namedParams[i]] = args[i];
    }

    return params;
  },

  /**
   * clearSlashes - Clears preceding and trailing slashes from a string
   *
   * @param  {type} path description
   * @return {type}      description
   */
  clearSlashes: function(path) {
    if (typeof path === 'undefined') {
      return null;
    }

    return path.toString().replace(/\/$/, '').replace(/^\//, '');
  },


  /**
   * getCurrentRoute - gets the current route
   *
   * @return {type}  description
   */
  getCurrentRoute: function () {
    // Get location path
    var route = this.clearSlashes(decodeURI(location.pathname));

    // Strip root
    return this.root != '/' ? route.replace(this.root, '') : route;
  },


  /**
   * navigate - navigates to the speicified route
   *
   * @param  {type} route description
   * @return {type}       description
   */
  navigate: function (route, options, state) {
    options = options || {};
    state = state || {};

    // Set flags
    options.navigated = true;
    options.rerun = options.rerun || false;
    options.replace = options.replace || false;

    // Update address bar in browser
    if (options.replace) {
      window.history.replaceState(state, document.title, route);
    } else {
      window.history.pushState(state, document.title, route);
    }

    // Call checkRoute
    this.checkRoute(options, state);
  },


  /**
   * add - adds a route
   *
   * @param  {type} route    description
   * @param  {type} callback description
   * @param  {type} moduleId   description
   * @return {type}          description
   */
  add: function (route, callback, moduleId) {
    // Clear slashes
    route = this.clearSlashes(route);

    // Convert route string to RegExp
    var routeRegExp = this.convertRouteToRegExp(route);

    // Get parameters
    var params = this.getParamsFromRouteString(route);

    // Add to beginning of routes list.
    // This is so the routes defined later take priority
    this.routes.unshift({
      route: routeRegExp,
      routeString: route,
      namedParams: params,
      moduleId: moduleId,
      callback: callback
    });
  },


  /**
   * addModule - block adds a module
   *
   * @param  {type} moduleId    description
   * @param  {type} routeObjs description
   * @return {type}           description
   */
  addModule: function (moduleId, routeObjs) {
    // Check module and routeObjs are defined
    if (typeof moduleId === 'undefined' ||
      !(routeObjs instanceof Array) ||
      routeObjs.length < 1) {
        return false;
      }

    // Loop through each routeObj and add it
    for (var i = 0, j = routeObjs.length; i<j; i++) {
      var routeObj = routeObjs[i];
      this.add(routeObj.route, routeObj.callback, moduleId);
    }
  },


  /**
   * remove - removes routes by matching route, module or both
   *
   * @param  {type} route  description
   * @param  {type} moduleId description
   * @return {type}        description
   */
  remove: function (route, moduleId) {

    // Copy the unremoved routes into new array
    var remainingRoutes = [];

    if (!route && moduleId) {
      // Remove by moduleId

      // Loop through each route
      for (var i = 0, j = this.routes.length; i<j; i++) {
        // Check route's moduleId doesn't match specified moduleId
        if (this.routes[i].moduleId !== moduleId) {
          remainingRoutes.push(this.routes[i]);
        }
      }

      this.routes = remainingRoutes;
      return;
    }

    // Clear slashes
    route = this.clearSlashes(route);

    // Convert route to regexp
    var routeRegExp = this.convertRouteToRegExp(route);

    // Helper to check equality of two regular expressions
    var regexEqual = function (x, y) {
      return (x instanceof RegExp) && (y instanceof RegExp) &&
      (x.source === y.source) && (x.global === y.global) &&
      (x.ignoreCase === y.ignoreCase) && (x.multiline === y.multiline);
    };

    if (route && !moduleId) {
      // Remove by route

      // Loop through each route
      for (var i = 0, j = this.routes.length; i<j; i++) {
        // Check route's route exp doesn't match specified route exp
        if (!regexEqual(this.routes[i].route, routeRegExp)) {
          remainingRoutes.push(this.routes[i]);
        }
      }
    } else {
      // Remove by route and moduleId

      // Loop through each route
      for (var i = 0, j = this.routes.length; i<j; i++) {
        // Check route's route exp and moduleId
        // doesn't match specified route exp and moduleId
        if (this.routes[i].moduleId !== moduleId &&
          !regexEqual(this.routes[i].route, routeRegExp)) {
          remainingRoutes.push(this.routes[i]);
        }
      }
    }

    // Set routes to remaining routes
    this.routes = remainingRoutes;
  },


  /**
   * convertRouteToRegExp - converts a route string to a RegExp
   * Borrowed from Backbone.js
   *
   * @param  {type} route description
   * @return {type}       description
   */
  convertRouteToRegExp: function (route) {
    var optionalParam = /\((.*?)\)/g;
    var namedParam    = /(\(\?)?:\w+/g;
    var splatParam    = /\*\w+/g;
    var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;

    // Replace tokens
    route = route.replace(escapeRegExp, '\\$&')
                .replace(optionalParam, '(?:$1)?')
                .replace(namedParam, function(match, optional) {
                  return optional ? match : '([^/?]+)';
                })
                .replace(splatParam, '([^?]*?)');

    return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$');
  },


  /**
   * getParamsFromRouteString - gets the parameter names
   *
   * @param  {type} route description
   * @return {type}       description
   */
  getParamsFromRouteString: function (route) {
    var namedParam = /(\(\?)?:\w+/g;

    // Match named params in route string
    var matches = route.match(namedParam);

    if (matches) {
      // Remove leading colon
      return matches.map(function (param) {
        return param.charAt(0) === ':' ? param.substring(1, param.length) : param;
      });
    }

    return [];
  }

};

module.exports = TrafficCop;
