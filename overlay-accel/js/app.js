// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const app = angular.module('overlay-accel', [
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
    let title = 'Accelerometer Overlay &middot; iRacing Browser Apps';
    if (current.$$route.title != null) {
        title = current.$$route.title + ' &middot; ' + title;
    }
    return $rootScope.title = $sce.trustAsHtml(title);
}));

app.controller('SettingsCtrl', function($scope, localStorageService) {
    let saveSettings, settings;
    const defaultSettings = {
        host: 'localhost:8182',
        fps: 15,
        accelColor: '#FF3333',
        gaugeColor: '#111111',
        gaugeOutline: '#FFFFFF',
        gaugeOutlineAlpha: 15,
        gaugeBorderRadius: 10
    };

    $scope.isDefaultHost = document.location.host === defaultSettings.host;

    $scope.settings = (settings = localStorageService.get('settings') || {});
    if (settings.host == null) { settings.host = null; }
    if (settings.fps == null) { settings.fps = defaultSettings.fps; }
    if (settings.accelColor == null) { settings.accelColor = defaultSettings.accelColor; }
    if (settings.gaugeColor == null) { settings.gaugeColor = defaultSettings.gaugeColor; }
    if (settings.gaugeOutline == null) { settings.gaugeOutline = defaultSettings.gaugeOutline; }
    if (settings.gaugeOutlineAlpha == null) { settings.gaugeOutlineAlpha = defaultSettings.gaugeOutlineAlpha; }
    if (settings.gaugeBorderRadius == null) { settings.gaugeBorderRadius = defaultSettings.gaugeBorderRadius; }

    $scope.saveSettings = (saveSettings = function() {
        settings.fps = Math.min(60, Math.max(1, settings.fps));
        localStorageService.set('settings', settings);
        return updateURL();
    });

    const actualKeys = [
        'host',
        'fps',
        'accelColor',
        'gaugeColor',
        'gaugeOutline',
        'gaugeOutlineAlpha',
        'gaugeBorderRadius'
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
        }
        return $scope.url = `http://${document.location.host}/ir-mapoverlay/overlay-accel/overlay.html\
${params.length ? '#?' + params.join('&') : ''}`;
    };
    updateURL();

    return $scope.changeURL = function() {
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
});

angular.bootstrap(document, [app.name]);
