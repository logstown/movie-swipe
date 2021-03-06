'use strict';
angular.module('main')
    .controller('GenreStatsCtrl', function($stateParams, $state) {
        var vm = this;

        console.log($stateParams.graph)

        if (!$stateParams.graph) {
            $state.go('main.stats');
        }

        var genreRows = _.chain($stateParams.graph)
            .map(function(count, genre) {
                return {
                    c: [
                        { v: genre },
                        { v: count.liked },
                        { v: count.disliked }
                    ]
                }
            })
            .orderBy(function(thing) {
                return thing.c[1].v + thing.c[2].v;
            }, 'desc')
            .value()


        vm.favoriteGenres = {};

        vm.favoriteGenres.type = "BarChart";

        vm.favoriteGenres.data = {
            "cols": [
                { id: "t", label: "Opinion", type: "string" },
                { id: "s", label: "Liked", type: "number" },
                { id: "s", label: "Disliked", type: "number" }
            ],
            "rows": genreRows
        };

        vm.favoriteGenres.options = {
            legend: { position: "none" },
            // pieSliceText: 'label'
            hAxis: {
                textPosition: 'none',
                gridlines: {
                    count: 0
                }
            },
            isStacked: true
                // displayExactValues: true,
        };

    })
