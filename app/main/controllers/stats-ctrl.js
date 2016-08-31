'use strict';
angular.module('main')
    .controller('StatsCtrl', function(Auth, $state, $firebaseObject, $q, movieDatabase, $ionicLoading) {
        var vm = this;

        var ref = firebase.database().ref('user-reviews/' + Auth.$getAuth().uid);
        var userReviews = $firebaseObject(ref)



        $ionicLoading.show({ template: 'Calculating...' })
            .then(function() {
                return userReviews.$loaded()
            })
            .then(function() {
                console.log('getting em')
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
                console.log('got em')
                var sortedMovies = _.groupBy(movies, function(movie) {
                    return userReviews[movie.id]
                })

                var likedYearCounts = _.chain(sortedMovies.liked)
                    .groupBy(function(movie) {
                        var d = new Date(movie.release_date);
                        return d.getFullYear();
                    })
                    .mapValues(function(movieArray) {
                        return {
                            liked: movieArray.length
                        };
                    })
                    .value()

                var dislikedYearCounts = _.chain(sortedMovies.disliked)
                    .groupBy(function(movie) {
                        var d = new Date(movie.release_date);
                        return d.getFullYear();
                    })
                    .mapValues(function(movieArray) {
                        return {
                            disliked: movieArray.length
                        };
                    })
                    .value()

                var mergedCounts = _.chain(likedYearCounts)
                    .mergeWith(dislikedYearCounts, function(likedObj, dislikedObj) {
                        var likedCount = likedObj ? likedObj.liked || 0 : 0;
                        var dislikedCount = dislikedObj ? dislikedObj.disliked || 0 : 0;

                        // return likedCount - dislikedCount;
                        // return likedCount === 0 ? 0 : dislikedCount / likedCount * 100;
                        return {
                            liked: likedCount,
                            disliked: dislikedCount
                        }
                    })
                    .mapValues(function(obj) {
                        return {
                            liked: obj.liked || 0,
                            disliked: obj.disliked || 0
                        }
                    })
                    .value();

                var percentages = _.chain(mergedCounts)
                    .map(function(obj, year) {
                        return {
                            year: year,
                            percent: obj.liked / (obj.liked + obj.disliked),
                            total: obj.liked + obj.disliked
                        }
                    })
                    .sortBy(['percent', 'total'])
                    .value();

                console.log(percentages)

                vm.yearStats = {
                    mostLiked: _.last(percentages).year,
                    mostDisliked: _.chain(percentages)
                        .filter({ percent: percentages[0].percent })
                        .maxBy('total')
                        .value()
                        .year
                }

                console.log(vm.yearStats)

                var yearCounts = _.chain(mergedCounts)
                    .map(function(counts, year) {
                        return {
                            c: [
                                { v: year },
                                { v: counts.liked },
                                { v: counts.disliked }
                            ]
                        }
                    })
                    // .orderBy(function(thing) {
                    //     return thing.c[1].v
                    // }, 'desc')
                    .value()


                vm.yearCounts = {};

                vm.yearCounts.type = "BarChart";

                vm.yearCounts.data = {
                    "cols": [
                        { id: "t", label: "Opinion", type: "string" },
                        { id: "s", label: "Liked", type: "number" },
                        { id: "s", label: "Disliked", type: "number" }
                    ],
                    "rows": yearCounts
                };

                vm.yearCounts.options = {
                    'title': 'By Year',
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

                // vm.myChartObject.options = {
                //     'title': 'Breakdown'
                // };

                movieDatabase.get('genre/movie/list')
                    .then(function(result) {
                        console.log(result)
                        var likedCounts = _.chain(sortedMovies.liked)
                            .map('genre_ids')
                            .flatten()
                            .countBy()
                            .mapValues(function(count) {
                                return {
                                    liked: count
                                }
                            })
                            .value()
                        var dislikedCounts = _.chain(sortedMovies.disliked)
                            .map('genre_ids')
                            .flatten()
                            .countBy()
                            .mapValues(function(count) {
                                return {
                                    disliked: count
                                }
                            })
                            .value()

                        console.log(dislikedCounts)

                        var mergedCounts = _.chain(likedCounts)
                            .mergeWith(dislikedCounts, function(likedObj, dislikedObj) {
                                var likedCount = likedObj ? likedObj.liked || 0 : 0;
                                var dislikedCount = dislikedObj ? dislikedObj.disliked || 0 : 0;

                                return {
                                    liked: likedCount,
                                    disliked: dislikedCount
                                }
                            })
                            .mapValues(function(obj) {
                                return {
                                    liked: obj.liked || 0,
                                    disliked: obj.disliked || 0
                                }
                            })
                            .value()

                        var percentages = _.chain(mergedCounts)
                            .map(function(obj, genreId) {
                                return {
                                    genre: _.find(result.genres, { id: Number(genreId) }).name,
                                    percent: obj.liked / (obj.liked + obj.disliked),
                                    total: obj.liked + obj.disliked
                                }
                            })
                            .sortBy(['percent', 'total'])
                            .value();

                        console.log(percentages)

                        vm.genreStats = {
                            mostLiked: _.last(percentages).genre,
                            mostDisliked: _.chain(percentages)
                                .filter({ percent: percentages[0].percent })
                                .maxBy('total')
                                .value()
                                .genre
                        }

                        var genreCounts = _.chain(mergedCounts)
                            .map(function(count, genreId) {
                                return {
                                    c: [
                                        { v: _.find(result.genres, { id: Number(genreId) }).name },
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
                            "rows": genreCounts
                        };

                        vm.favoriteGenres.options = {
                            'title': 'Most Liked Genres',
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

                        vm.goToGenres = function() {
                            $state.go('main.genreStats', { graph: vm.favoriteGenres })
                        }

                        vm.goToYears = function() {
                            $state.go('main.genreStats', { graph: vm.yearCounts })
                        }

                        $ionicLoading.hide()

                    })

            })
    })
