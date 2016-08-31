'use strict';
angular.module('main')
    .controller('GenreStatsCtrl', function($stateParams, $state) {
        var vm = this;

        console.log($stateParams.graph)

        if (!$stateParams.graph) {
            $state.go('main.stats');
        }

        vm.chart = $stateParams.graph;

    })
