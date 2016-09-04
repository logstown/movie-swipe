'use strict';
angular.module('main')
    .controller('StatsCtrl', function(Auth, $state, movieDatabase, $scope, $timeout, $firebaseObject) {

        $scope.deal = {};
        $scope.deal.myChartObject = {};

        $scope.deal.myChartObject.type = "PieChart";

        $scope.deal.myChartObject.data = {
            "cols": [
                { id: "t", label: "Opinion", type: "string" },
                { id: "s", label: "Count", type: "number" }
            ],
            "rows": [{
                c: [
                    { v: "Liked" },
                    { v: 0 },
                ]
            }, {
                c: [
                    { v: "Disliked" },
                    { v: 0 }
                ]
            }, {
                c: [
                    { v: "Unseen" },
                    { v: 0 },
                ]
            }]
        };

        movieDatabase.get('genre/movie/list')
            .then(function(genres) {

                var yearCounts = {};
                var genreCounts = {};
                var directorCounts = {};
                var actorCounts = {};
                var initialDataLoaded = false;

                var userReviewRef = firebase.database().ref('user-reviews/' + Auth.$getAuth().uid);

                userReviewRef.on('child_added', function(review) {
                    var opinion = review.val();
                    var movieId = review.key;

                    switch (opinion) {
                        case 'liked':
                            $scope.deal.myChartObject.data.rows[0].c[1].v++;
                            break;
                        case 'disliked':
                            $scope.deal.myChartObject.data.rows[1].c[1].v++;
                            break;
                        default:
                            $scope.deal.myChartObject.data.rows[2].c[1].v++;
                    }

                    if (opinion === 'unseen') {
                        return;
                    }

                    var movieRef = firebase.database().ref('movies/' + movieId);

                    movieRef.once('value')
                        .then(function(movieSnapshot) {
                            var movie = movieSnapshot.val();

                            var releasedYear = new Date(movie.release_date).getFullYear();

                            if (!yearCounts[releasedYear]) {
                                yearCounts[releasedYear] = {
                                    liked: 0,
                                    disliked: 0
                                };
                            }

                            yearCounts[releasedYear][opinion]++;

                            angular.forEach(movie.genre_ids, function(id) {
                                var genre = _.find(genres.genres, { id: Number(id) }).name;

                                if (!genreCounts[genre]) {
                                    genreCounts[genre] = {
                                        liked: 0,
                                        disliked: 0
                                    }
                                }

                                genreCounts[genre][opinion]++;
                            });

                            if (initialDataLoaded) {
                                $timeout(function() {

                                    $scope.yearStats = getStats(yearCounts)
                                    $scope.genreStats = getStats(genreCounts);
                                })
                            }

                        });

                });

                userReviewRef.once('value', function(snapshot) {
                    initialDataLoaded = true;
                });

                var actorReviewRef = firebase.database().ref('people-reviews/' + Auth.$getAuth().uid + '/actors');
                var directorReviewRef = firebase.database().ref('people-reviews/' + Auth.$getAuth().uid + '/directors');

                actorReviewRef.once('value', function(actorReviews) {
                    actorCounts = actorReviews.val()
                    var ids = getStats(actorCounts);

                    $scope.actorStats = {};

                    if (ids.mostLiked === 'Not Enough Data') {
                        $scope.actorStats = ids;
                    } else {
                        movieDatabase.get('person/' + ids.mostLiked)
                            .then(function(result) {
                                $scope.actorStats.mostLiked = result.name
                            });

                        movieDatabase.get('person/' + ids.mostDisliked)
                            .then(function(result) {
                                $scope.actorStats.mostDisliked = result.name
                            });
                    }

                })

                directorReviewRef.once('value', function(directorReviews) {
                    directorCounts = directorReviews.val()
                    var ids = getStats(directorCounts);

                    $scope.directorStats = {};

                    if (ids.mostLiked === 'Not Enough Data') {
                        $scope.directorStats = ids;
                    } else {
                        movieDatabase.get('person/' + ids.mostLiked)
                            .then(function(result) {
                                $scope.directorStats.mostLiked = result.name
                            });

                        movieDatabase.get('person/' + ids.mostDisliked)
                            .then(function(result) {
                                $scope.directorStats.mostDisliked = result.name
                            });
                    }

                })

                actorReviewRef.on('child_changed', function(data) {
                    actorCounts[data.key] = data.val();

                    var ids = getStats(actorCounts);

                    movieDatabase.get('person/' + ids.mostLiked)
                        .then(function(result) {
                            $scope.actorStats.mostLiked = result.name
                        });

                    movieDatabase.get('person/' + ids.mostDisliked)
                        .then(function(result) {
                            $scope.actorStats.mostDisliked = result.name
                        });
                })

                directorReviewRef.on('child_changed', function(data) {
                    directorCounts[data.key] = data.val();

                    var ids = getStats(directorCounts);

                    movieDatabase.get('person/' + ids.mostLiked)
                        .then(function(result) {
                            $scope.directorStats.mostLiked = result.name
                        });

                    movieDatabase.get('person/' + ids.mostDisliked)
                        .then(function(result) {
                            $scope.directorStats.mostDisliked = result.name
                        });
                })

                $scope.goToGenres = function() {
                    $state.go('main.genreStats', { graph: genreCounts })
                }

                $scope.goToYears = function() {
                    $state.go('main.yearStats', { graph: yearCounts })
                }
            })

        function getStats(counts) {
            var percentages = _.chain(counts)
                .map(function(obj, attr) {
                    return {
                        attr: attr,
                        percent: obj.liked / (obj.liked + obj.disliked),
                        total: obj.liked + obj.disliked
                    }
                })
                .reject({ total: 1 })
                .sortBy(['percent', 'total'])
                .value();

            var stats = {
                mostLiked: _.chain(percentages)
                    .filter({ percent: _.last(percentages).percent })
                    .maxBy('total')
                    .value(),
                mostDisliked: _.chain(percentages)
                    .filter({ percent: percentages[0].percent })
                    .maxBy('total')
                    .value()
            }

            if (!stats.mostLiked || !stats.mostDisliked || stats.mostLiked.attr === stats.mostDisliked.attr) {
                return {
                    mostLiked: "Not Enough Data",
                    mostDisliked: "Not Enough Data"
                }
            }

            return {
                mostLiked: stats.mostLiked.attr,
                mostDisliked: stats.mostDisliked.attr
            };
        }
    })
