'use strict';
angular.module('main', [
        'ionic',
        'ngCordova',
        'ui.router',
        'ionic.contrib.ui.tinderCards2',
        'firebase'
        // TODO: load other modules selected during generation
    ])
    .config(function($stateProvider, $urlRouterProvider) {

        // ROUTING with ui.router
        $urlRouterProvider.otherwise('/main/movies');
        $stateProvider
        // this state is placed in the <ion-nav-view> in the index.html
            .state('main', {
                url: '/main',
                abstract: true,
                templateUrl: 'main/templates/tabs.html'
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
            });
    });
