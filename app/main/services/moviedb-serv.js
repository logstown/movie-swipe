'use strict';
angular.module('main')
    .factory('movieDatabase', function($http) {
        var API_KEY = 'e71bd965e4a75d68bf310cd490673dc3',
            BASE_URI = 'https://api.themoviedb.org/3/';

        var service = {
            get: get
        };

        return service;

        function get(url, params) {
            var fullUrl = BASE_URI + url;
            params = params || {};

            params.api_key = API_KEY;

            return $http.get(fullUrl, {
                    params: params,
                    cache: true
                })
                .then(function(result) {
                    return result.data;
                })
        }
    });
