'use strict';
angular.module('main')
    .controller('MoviesCtrl', function($scope, movieDatabase, Auth, $firebaseObject, $firebaseArray, $q, $timeout, $ionicLoading) {
        var user;
        var movieReviews;
        var peopleReviews;

        var uid = Auth.$getAuth().uid;

        $scope.deal = {};

        movieDatabase.get('configuration')
            .then(function(result) {
                $scope.imageUrl = result.images.base_url + 'w300';

                var ref = firebase.database().ref('people-reviews/' + uid);
                peopleReviews = $firebaseObject(ref);

                return peopleReviews.$loaded();
            })
            .then(function() {
                if (!peopleReviews.actors) {
                    peopleReviews.actors = {};
                    peopleReviews.directors = {};
                }

                var ref = firebase.database().ref('movie-reviews');
                movieReviews = $firebaseArray(ref);
                return movieReviews.$loaded();
            })
            .then(loadCardBatch);

        function loadCardBatch() {
            $ionicLoading.show({ template: 'Loading...' })
                .then(function() {
                    return $q.all(getCardsToAdd(10));
                })
                .then(function(cards) {
                    $ionicLoading.hide()
                        .then(function() {

                            $scope.cards = _.map(cards, function(arr) {
                                return {
                                    movie: arr[0],
                                    people: arr[1]
                                };
                            });
                        });
                })
        }

        function getCardsToAdd(n) {
            return _.chain(movieReviews)
                .reject(uid)
                .sampleSize(n)
                .sortBy(function(review) {
                    return _.keys(review).length;
                })
                .map(function(review) {
                    return $q.all([movieDatabase.get('movie/' + review.$id), movieDatabase.get('movie/' + review.$id + '/credits')]);
                })
                .value();
        }

        $scope.cardDestroyed = function(index) {
            $scope.cards.splice(index, 1);

            if ($scope.cards.length === 0) {
                $scope.cards = null;

                loadCardBatch();
            }
        };

        $scope.$on('removeCard', function(event, element, card) {
            $scope.setOpinion(card, 'unseen');
        });

        $scope.setOpinion = function(card, opinion) {
            var movieReviewRef = firebase.database().ref('movie-reviews/' + card.movie.id + '/' + uid)
            var userReviewRef = firebase.database().ref('user-reviews/' + uid + '/' + card.movie.id);

            movieReviewRef.set(opinion)
            userReviewRef.set(opinion)

            if (opinion !== 'unseen') {
                angular.forEach(card.people.cast, function(person) {
                    if (!peopleReviews.actors[person.id]) {
                        peopleReviews.actors[person.id] = {
                            liked: 0,
                            disliked: 0
                        }
                    }

                    peopleReviews.actors[person.id][opinion]++;
                });

                var directorIds = _.chain(card.people.crew)
                    .filter({ department: 'Directing', job: 'Director' })
                    .map('id')
                    .value();

                angular.forEach(directorIds, function(directorId) {
                    if (!peopleReviews.directors[directorId]) {
                        peopleReviews.directors[directorId] = {
                            liked: 0,
                            disliked: 0
                        }
                    }

                    peopleReviews.directors[directorId][opinion]++;
                });

                peopleReviews.$save();
            }
        }
    });
