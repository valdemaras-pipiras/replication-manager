var routeProvider, app = angular.module('dashboard', ['ngResource', 'ngMaterial', 'ngRoute', 'ngStorage','angularjs-gauge','bsTable'])
    .config(function($routeProvider) {
        routeProvider = $routeProvider;
        $routeProvider
            .when('/dashboard', {
                templateUrl: 'app/dashboard.html',
                controller: 'DashboardController'
            })
            .when('/dashboard/:timeFrame', {
                templateUrl: 'app/dashboard.html',
                controller: 'DashboardController'
            })
            .when('/login', {
                templateUrl: 'app/login.html',
                controller: 'DashboardController'
            })
            .when('/callback', {
                controller: 'CallbackController',
                template: '<div>Processing authentication...</div>'
            })
            .otherwise({
                templateUrl: 'app/dashboard.html',
                controller: 'DashboardController'
            });
    });
