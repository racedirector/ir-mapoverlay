// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const app = angular.module('overlay-map', [
    'ngRoute',
    'mgcrea.ngStrap.navbar',
    'LocalStorageModule',
    'kutu.markdown',
    'colorpicker.module'
]);

app.config($routeProvider => $routeProvider
    .when('/',
        {templateUrl: 'tmpl/index.html'})
    .when('/settings', {
        templateUrl: 'tmpl/settings.html',
        controller: 'SettingsCtrl',
        title: 'Settings'
    }).otherwise({redirectTo: '/'}));

app.config(localStorageServiceProvider => localStorageServiceProvider.setPrefix(app.name));

app.run(($rootScope, $sce) => $rootScope.$on('$routeChangeSuccess', function(event, current, previous) {
    let title = 'Track Map Overlay &middot; iRacing Browser Apps';
    if (current.$$route.title != null) {
        title = current.$$route.title + ' &middot; ' + title;
    }
    return $rootScope.title = $sce.trustAsHtml(title);
}));

app.controller('SettingsCtrl', function($scope, localStorageService) {
    let sanitizeDriverGroups, saveSettings, settings, trimComma;
    const defaultSettings = {
        host: 'localhost:8182',
        fps: 30,
        trackColor: '#000000',
        trackWidth: 10,
        trackOutlineColor: '#FFFFFF',
        trackAlignment: 'center',
        startFinishColor: '#FF0000',
        sectorColor: '#FFDA59',
        showSectors: false,
        driverCircle: 12,
        circleColor: '',
        driverHighlightWidth: 4,
        driverHighlightCam: '#4DFF51',
        driverHighlightOfftrack: '#FF0000',
        driverPosNum: '#000000',
        highlightNum: '#FFFFFF',
        playerHighlight: '',
        driverGroups: []
    };

    $scope.isDefaultHost = document.location.host === defaultSettings.host;

    $scope.settings = (settings = localStorageService.get('settings') || {});
    if (settings.host == null) { settings.host = null; }
    if (settings.fps == null) { settings.fps = defaultSettings.fps; }
    if (settings.trackColor == null) { settings.trackColor = defaultSettings.trackColor; }
    if (settings.trackWidth == null) { settings.trackWidth = defaultSettings.trackWidth; }
    if (settings.trackOutlineColor == null) { settings.trackOutlineColor = defaultSettings.trackOutlineColor; }
    if (settings.trackAlignment == null) { settings.trackAlignment = defaultSettings.trackAlignment; }
    if (settings.startFinishColor == null) { settings.startFinishColor = defaultSettings.startFinishColor; }
    if (settings.sectorColor == null) { settings.sectorColor = defaultSettings.sectorColor; }
    if (settings.showSectors == null) { settings.showSectors = defaultSettings.showSectors; }
    if (settings.driverCircle == null) { settings.driverCircle = defaultSettings.driverCircle; }
    if (settings.circleColor == null) { settings.circleColor = defaultSettings.circleColor; }
    if (settings.driverHighlightWidth == null) { settings.driverHighlightWidth = defaultSettings.driverHighlightWidth; }
    if (settings.driverHighlightCam == null) { settings.driverHighlightCam = defaultSettings.driverHighlightCam; }
    if (settings.driverHighlightOfftrack == null) { settings.driverHighlightOfftrack = defaultSettings.driverHighlightOfftrack; }
    if (settings.driverPosNum == null) { settings.driverPosNum = defaultSettings.driverPosNum; }
    if (settings.highlightNum == null) { settings.highlightNum = defaultSettings.highlightNum; }
    if (settings.playerHighlight == null) { settings.playerHighlight = defaultSettings.playerHighlight; }
    if (settings.driverGroups == null) { settings.driverGroups = defaultSettings.driverGroups; }

    $scope.saveSettings = (saveSettings = function() {
        settings.fps = Math.min(60, Math.max(1, settings.fps));
        localStorageService.set('settings', settings);
        return updateURL();
    });

    const actualKeys = [
        'host',
        'fps',
        'trackColor',
        'trackWidth',
        'trackOutlineColor',
        'trackAlignment',
        'startFinishColor',
        'sectorColor',
        'showSectors',
        'driverCircle',
        'circleColor',
        'driverHighlightWidth',
        'driverHighlightCam',
        'driverHighlightOfftrack',
        'driverPosNum',
        'highlightNum',
        'playerHighlight'
    ];

    var updateURL = function() {
        const params = [];
        for (let k in settings) {
            const v = settings[k];
            if (k in defaultSettings && (v === defaultSettings[k])) {
                continue;
            }
            if ((k === 'host') && (!settings.host || $scope.isDefaultHost)) {
                continue;
            }
            if (Array.from(actualKeys).includes(k)) {
                params.push(`${k}=${encodeURIComponent(v)}`);
            }
            if (k === 'driverGroups') {
                for (let group of Array.from(v)) {
                    if ((group.ids === '') || (group.color === '')) {
                        continue;
                    }
                    params.push(`dGrp=${encodeURIComponent(group.ids)}`);
                    params.push(`dGrpClr=${encodeURIComponent(group.color)}`);
                }
            }
        }

        return $scope.url = `http://${document.location.host}/ir-mapoverlay/overlay-map/overlay.html\
${params.length ? '#?' + params.join('&') : ''}`;
    };
    updateURL();

    $scope.changeURL = function() {
        const params = $scope.url && ($scope.url.search('#?') !== -1) && $scope.url.split('#?', 2)[1];
        if (!params) {
            return;
        }
        for (let p of Array.from($scope.url.split('#?', 2)[1].split('&'))) {
            let [k, v] = Array.from(p.split('=', 2));
            if (!(k in settings)) {
                continue;
            }
            const nv = Number(v);
            if (!isNaN(nv && (v.length === nv.toString().length))) {
                v = Number(v);
            }
            settings[k] = v;
        }
        return saveSettings();
    };

    $scope.sanitizeDriverGroups = (sanitizeDriverGroups = function() {
        for (let group of Array.from(settings.driverGroups)) {
            group.ids = group.ids.replace(/,{2,}/g, ',');
            group.ids = group.ids.replace(/[^0-9,]/g, '');
        }
        return saveSettings();
    });

    $scope.trimComma = (trimComma = function() {
        for (let group of Array.from(settings.driverGroups)) {
            if (group.ids.charAt(group.ids.length - 1) === ',') {
                group.ids = group.ids.slice(0, -1);
            }
        }
        return saveSettings();
    });

    $scope.addGroup = () => settings.driverGroups.push({'ids':'', 'color': ''});

    return $scope.removeGroup = function(element) {
        settings.driverGroups.splice(this.$index, 1);
        return saveSettings();
    };
});

angular.bootstrap(document, [app.name]);
