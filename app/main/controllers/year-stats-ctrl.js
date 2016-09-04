'use strict';
angular.module('main')
    .controller('YearStatsCtrl', function($stateParams, $state) {
        var vm = this;

        console.log($stateParams.graph)

        if (!$stateParams.graph) {
            $state.go('main.stats');
        }

        var yearRows = _.map($stateParams.graph, function(counts, year) {
            return {
                c: [
                    { v: year },
                    { v: counts.liked },
                    { v: counts.disliked }
                ]
            }
        });


        vm.yearCounts = {};

        vm.yearCounts.type = "BarChart";

        vm.yearCounts.data = {
            "cols": [
                { id: "t", label: "Opinion", type: "string" },
                { id: "s", label: "Liked", type: "number" },
                { id: "s", label: "Disliked", type: "number" }
            ],
            "rows": yearRows
        };

        vm.yearCounts.options = {
            // 'title': 'By Year',
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
