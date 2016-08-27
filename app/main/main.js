'use strict';
angular.module('main', [
        'ionic',
        'ngCordova',
        'ui.router',
        'ionic.contrib.ui.tinderCards2',
        'firebase',
        'googlechart'
        // TODO: load other modules selected during generation
    ])
    // .run(function($rootScope) {
    //     $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
    //         // We can catch the error thrown when the $requireAuth promise is rejected
    //         // and redirect the user back to the home page
    //         if (error === 'AUTH_REQUIRED') {
    //             $state.go('login');
    //         }
    //     });
    // })
    .config(function($stateProvider, $urlRouterProvider) {

        // ROUTING with ui.router
        $urlRouterProvider.otherwise('/login');

        $stateProvider
        // this state is placed in the <ion-nav-view> in the index.html
        // 
            .state('login', {
                url: '/login',
                templateUrl: 'main/templates/login.html',
                controller: 'LoginCtrl as vm'
            })
            .state('main', {
                url: '/main',
                abstract: true,
                templateUrl: 'main/templates/tabs.html',
                resolve: {
                    currentAuth: ['Auth', function(Auth) {
                        return Auth.$requireSignIn();
                    }]
                }
            })
            .state('main.list', {
                url: '/list',
                views: {
                    'tab-list': {
                        templateUrl: 'main/templates/list.html',
                        // controller: 'SomeCtrl as ctrl'
                    }
                }
            })
            .state('main.listDetail', {
                url: '/list/detail',
                views: {
                    'tab-list': {
                        templateUrl: 'main/templates/list-detail.html',
                        // controller: 'SomeCtrl as ctrl'
                    }
                }
            })
            .state('main.debug', {
                url: '/debug',
                views: {
                    'tab-debug': {
                        templateUrl: 'main/templates/debug.html',
                        controller: 'DebugCtrl as ctrl'
                    }
                }
            })
            .state('main.movies', {
                url: '/movies',
                views: {
                    'tab-movies': {
                        templateUrl: 'main/templates/movies.html',
                        controller: 'MoviesCtrl'
                    }
                }
            })
            .state('main.stats', {
                url: '/stats',
                views: {
                    'tab-stats': {
                        templateUrl: 'main/templates/stats.html',
                        controller: 'StatsCtrl as vm'
                    }
                }
            });
    });
