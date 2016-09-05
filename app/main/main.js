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
    .run(function($rootScope, movieDatabase) {
        $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
            // We can catch the error thrown when the $requireAuth promise is rejected
            // and redirect the user back to the home page
            if (error === 'AUTH_REQUIRED') {
                $state.go('login');
            }
        });

        movieDatabase.get('configuration')
            .then(function(result) {
                $rootScope.configuration = result;
            })
    })
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
                        controller: 'StatsCtrl'
                    }
                }
            })
            .state('main.genreStats', {
                url: '/stats/genre',
                params: { graph: null },
                views: {
                    'tab-stats': {
                        templateUrl: 'main/templates/genre-stats.html',
                        controller: 'GenreStatsCtrl as vm'
                    }
                }
            })
            .state('main.yearStats', {
                url: '/stats/year',
                params: { graph: null },
                views: {
                    'tab-stats': {
                        templateUrl: 'main/templates/year-stats.html',
                        controller: 'YearStatsCtrl as vm'
                    }
                }
            });
    });
