'use strict';
angular.module('main')
    .controller('LoginCtrl', function($firebaseAuth, $state) {
        var vm = this;
        var auth = $firebaseAuth();

        vm.signIn = function(provider) {
            auth.$signInWithPopup(provider)
                .then(function(result) {
                    console.log(result)

                    $state.go('main.movies')
                })
        }

    })
