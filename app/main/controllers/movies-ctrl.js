'use strict';
angular.module('main')
    .controller('MoviesCtrl', function($scope, movieDatabase, Auth, $firebaseObject, $firebaseArray, $q, $timeout, $ionicLoading, $rootScope) {
        var movieReviews;

        var uid = Auth.$getAuth().uid;

        $scope.imageUrl = $rootScope.configuration.images.base_url + 'w300';

        var ref = firebase.database().ref('people-reviews/' + uid);
        var peopleReviews = $firebaseObject(ref);

        peopleReviews.$loaded()
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
                .then(function(result) {
                    $ionicLoading.hide()
                        .then(function() {
                            $scope.cards = _.map(result, function(movieCreditsArr) {
                                return {
                                    movie: movieCreditsArr[0],
                                    people: movieCreditsArr[1]
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
                    var movie = movieDatabase.get('movie/' + review.$id);
                    var credits = movieDatabase.get('movie/' + review.$id + '/credits');

                    return $q.all([movie, credits]);
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

            movieReviewRef.set(opinion);
            userReviewRef.set(opinion);

            if (opinion !== 'unseen') {
                setPeopleOpinions(card, opinion);
            }
        }

        function setPeopleOpinions(card, opinion) {
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
    });
