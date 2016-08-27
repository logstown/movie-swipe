'use strict';
angular.module('main')
    .controller('StatsCtrl', function(Auth, $state, $firebaseObject, $q, movieDatabase) {
        var vm = this;

        var ref = firebase.database().ref('user-reviews/' + Auth.$getAuth().uid);
        var userReviews = $firebaseObject(ref)

        userReviews.$loaded()
            .then(function() {
                var moviePromises = _.chain(userReviews)
                    .omitBy(function(opinion, movieId) {
                        movieId = Number(movieId)
                        return isNaN(movieId)
                    })
                    .map(function(opinion, movieId) {
                        var ref = firebase.database().ref('movies/' + movieId)
                        return $firebaseObject(ref).$loaded()
                    })
                    .value();

                return $q.all(moviePromises)
            })
            .then(function(movies) {
                var sortedMovies = _.groupBy(movies, function(movie) {
                    return userReviews[movie.id]
                })


                vm.myChartObject = {};

                vm.myChartObject.type = "PieChart";

                vm.myChartObject.data = {
                    "cols": [
                        { id: "t", label: "Opinion", type: "string" },
                        { id: "s", label: "Count", type: "number" }
                    ],
                    "rows": [{
                        c: [
                            { v: "Liked" },
                            { v: sortedMovies.liked.length },
                        ]
                    }, {
                        c: [
                            { v: "Disliked" },
                            { v: sortedMovies.disliked.length }
                        ]
                    }, {
                        c: [
                            { v: "Unseen" },
                            { v: sortedMovies.unseen.length },
                        ]
                    }]
                };

                vm.myChartObject.options = {
                    'title': 'Breakdown',
                    // legend: { position: "none" },
                    // pieSliceText: 'label'
                    // hAxis: {
                    //     textPosition: 'none',
                    //     gridlines: {
                    //         count: 0
                    //     }
                    // },
                    // displayExactValues: true,
                };

                movieDatabase.get('genre/movie/list')
                    .then(function(result) {
                        console.log(result)
                        var genreCounts = _.chain(sortedMovies.liked)
                            .map('genre_ids')
                            .flatten()
                            .countBy()
                            .map(function(count, genreId) {
                                return {
                                    c: [{ v: _.find(result.genres, { id: Number(genreId) }).name }, { v: count }]
                                }
                            })
                            .orderBy(function(thing) {
                                return thing.c[1].v
                            }, 'desc')
                            .value()

                        genreCounts[0].c[1].v = -5;

                        console.log(genreCounts)

                        vm.favoriteGenres = {};

                        vm.favoriteGenres.type = "BarChart";

                        vm.favoriteGenres.data = {
                            "cols": [
                                { id: "t", label: "Opinion", type: "string" },
                                { id: "s", label: "Count", type: "number" }
                            ],
                            "rows": genreCounts
                        };

                        vm.favoriteGenres.options = {
                            'title': 'Most Liked Genres',
                            legend: { position: "none" },
                            // pieSliceText: 'label'
                            // hAxis: {
                            //     textPosition: 'none',
                            //     gridlines: {
                            //         count: 0
                            //     }
                            // },
                            // displayExactValues: true,
                        };

                    })

            })
    })
