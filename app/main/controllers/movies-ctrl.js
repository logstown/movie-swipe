'use strict';
angular.module('main')
    .controller('MoviesCtrl', function($scope, movieDatabase, $firebaseAuth, $firebaseObject, $firebaseArray, $q, $timeout, $ionicLoading) {

        var auth = $firebaseAuth();
        var user;
        var movieReviews;


        auth.$signInAnonymously()
            .then(function(result) {
                user = result;
                return movieDatabase.get('configuration')
            })
            .then(function(result) {
                $scope.imageUrl = result.images.base_url + 'w300';

                var ref = firebase.database().ref('movie-reviews');
                movieReviews = $firebaseArray(ref)

                return movieReviews.$loaded();
            })
            .then(function() {
                $q.all(getCardsToAdd(10))
                    .then(function(cards) {
                        $scope.cards = cards;
                    })
            });

        function getCardsToAdd(n) {
            return _.chain(movieReviews)
                .reject(user.uid)
                // .reject(function(review) {
                //     return _.some($scope.cards || tempArr, { id: Number(review.$id) })
                // })
                .sortBy(function(review) {
                    return _.keys(review).length;
                })
                .take(n)
                .map(function(review) {
                    var ref = firebase.database().ref('movies/' + review.$id);
                    return $firebaseObject(ref).$loaded();
                })
                .value();
        }

        $scope.cardDestroyed = function(index) {
            $scope.cards.splice(index, 1);

            if ($scope.cards.length === 0) {
                // tempArr = angular.copy($scope.cards)
                $scope.cards = null;

                $ionicLoading.show({ template: 'Loading...' })
                    .then(function() {
                        return $q.all(getCardsToAdd(10));
                    })
                    .then(function(cards) {
                        $ionicLoading.hide()
                            .then(function() {
                                $scope.cards = cards;
                            });
                    })
            }
        };

        $scope.$on('removeCard', function(event, element, card) {
            $scope.setOpinion(card, 'unseen');
        });

        $scope.setOpinion = function(card, opinion) {
            var movieReviewRef = firebase.database().ref('movie-reviews/' + card.id + '/' + user.uid)
            var userReviewRef = firebase.database().ref('user-reviews/' + user.uid + '/' + card.id)

            movieReviewRef.set(opinion)
            userReviewRef.set(opinion)
        }
    });
