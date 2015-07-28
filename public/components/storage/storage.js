'use strict';

angular.module('storage', [
    'util',
    'ui.router'
]).config(function ($stateProvider) {
    $stateProvider
        .state('storage', {
            url:'/storage',
            templateUrl: '/components/storage/storage.html'
        });
})
    .factory('storageDataService', function($timeout, socket, moment){
        var _refreshInterval;
        var _storageData = [];
        var _timeout;
        var _paused = false;

        var _setRefreshInterval = function(refreshInterval) {
            _refreshInterval = refreshInterval;
            if(_timeout) {
                $timeout.cancel(_timeout);
                if(!_paused) {
                    _timeout = $timeout(requery, _refreshInterval);
                }
            }
        };

        var _pause = function() {
            _paused = true;
            if(_timeout) {
                $timeout.cancel(_timeout);
            }
        };

        var _play = function() {
            _paused = false;
            requery();
        };

        function requery() {
            socket.emit('storage');
        }

        socket.on('storage', function(data){
            _storageData.push({time: moment(), data: data});
            if(!_paused) {
                _timeout = $timeout(requery, _refreshInterval);
            }
        });

        requery();

        return {
            setRefreshInterval : _setRefreshInterval,
            getLatest: function() { return _storageData[_storageData.length -1];},
            pause: _pause,
            play: _play
        };
    })
    .controller('StorageController', function($state, filesize, storageDataService){
        var _this = this;

        function init() {
            _this.refreshIntervals = [
                {caption: 'second', value: 1000},
                {caption: '5 seconds', value: 5000},
                {caption: '15 seconds', value: 15000},
                {caption: '30 seconds', value: 30000},
                {caption: 'minute', value: 60000},
                {caption: '5 minutes', value: 300000},
                {caption: '15 minutes', value: 900000}
            ];
            _this.refreshInterval=_this.refreshIntervals[1];
            storageDataService.setRefreshInterval( _this.refreshInterval.value);
        }

        _this.refreshIntervalChanged = function() {
            storageDataService.setRefreshInterval(_this.refreshInterval.value);
        };

        _this.getLatest = storageDataService.getLatest;

        _this.play = storageDataService.play;
        _this.pause = storageDataService.pause;

        _this.convertBytesToHumanReadable = function(value) {
            if(value) {
                return filesize(value * 1024);
            }
        };

        _this.getFreePercentage = function(total, free) {
            return ((free / total) * 100).toFixed(2);
        };

        init();
    });