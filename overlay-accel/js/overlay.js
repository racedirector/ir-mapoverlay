// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
window.app = angular.module('overlay-accel', [
    'ngAnimate',
    'ngSanitize'
]);

app.config($locationProvider => $locationProvider.hashPrefix(''));

app.service('config', function($location) {
    const vars = $location.search();

    let fps = parseInt(vars.fps) || 15;
    fps = Math.max(1, Math.min(60, fps));

    let gaugeOutlineAlpha = parseInt(vars.gaugeOutlineAlpha) || 15;
    gaugeOutlineAlpha = Math.max(0, Math.min(100, gaugeOutlineAlpha));

    let gaugeBorderRadius = parseInt(vars.gaugeBorderRadius) || 10;
    gaugeBorderRadius = Math.max(0, Math.min(10, gaugeBorderRadius));

    return {
        host: vars.host || 'localhost:8182',
        fps,

        accelColor: vars.accelColor || '#FF3333',
        gaugeColor: vars.gaugeColor || '#111111',
        gaugeOutline: vars.gaugeOutline || '#FFFFFF',
        gaugeOutlineAlpha,
        gaugeBorderRadius,

        requestParams: [
            'IsOnTrack',
            'LatAccel',
            'LongAccel'
        ],
        requestParamsOnce: [
        ]
    };
});

app.service('iRData', function($rootScope, config) {

    const ir = new IRacing( 
        config.requestParams,
        config.requestParamsOnce,
        config.fps,
        config.host);

    ir.onConnect = function() {
        ir.data.connected = true;
        return $rootScope.$apply();
    };

    ir.onDisconnect = function() {
        ir.data.connected = false;
        return $rootScope.$apply();
    };

    ir.onUpdate = keys => $rootScope.$apply();

    return ir.data;
});

app.run(function(config) {
    const gaugeBorderStyle = '5px solid ' + convertHex(config.gaugeOutline, config.gaugeOutlineAlpha);
    const gaugeBorderRadius = config.gaugeBorderRadius + 'px';

    const styleElement = document.createElement('style');
    styleElement.setAttribute('type', 'text/css');
    styleElement.appendChild(document.createTextNode('')); // Webkit hack
    document.head.appendChild(styleElement);

    const styleSheet = styleElement.sheet;
    styleSheet.insertRule(`\
.lat-accel, .long-accel { \
background: ` + config.accelColor + `;\
}`, 0);
    styleSheet.insertRule(`\
.lat-gauge-top, .lat-gauge-bottom, .long-gauge-left, .long-gauge-right, .gauge-center {\
background: ` + config.gaugeColor + `;\
}`, 0);
    styleSheet.insertRule(`\
.lat-gauge-top, .lat-gauge-bottom {\
border-left: ` + gaugeBorderStyle + `;\
border-right: ` + gaugeBorderStyle + `;\
}`, 0);
    styleSheet.insertRule(`\
.lat-gauge-top {\
border-top: ` + gaugeBorderStyle + `;\
border-top-left-radius: ` + gaugeBorderRadius + `;\
border-top-right-radius: ` + gaugeBorderRadius + `;\
}`, 0);
    styleSheet.insertRule(`\
.lat-gauge-bottom {\
border-bottom: ` + gaugeBorderStyle + `;\
border-bottom-left-radius: ` + gaugeBorderRadius + `;\
border-bottom-right-radius: ` + gaugeBorderRadius + `;\
}`, 0);
    styleSheet.insertRule(`\
.long-gauge-left, .long-gauge-right {\
border-top: ` + gaugeBorderStyle + `;\
border-bottom: ` + gaugeBorderStyle + `;\
}`, 0);
    styleSheet.insertRule(`\
.long-gauge-left {\
border-left: ` + gaugeBorderStyle + `;\
border-top-left-radius: ` + gaugeBorderRadius + `;\
border-bottom-left-radius: ` + gaugeBorderRadius + `;\
}`, 0);
    return styleSheet.insertRule(`\
.long-gauge-right {\
border-right: ` + gaugeBorderStyle + `;\
border-top-right-radius: ` + gaugeBorderRadius + `;\
border-bottom-right-radius: ` + gaugeBorderRadius + `;\
}`, 0);
});

app.controller('CarCtrl', function($scope, $element, iRData) {
    $scope.ir = iRData;
    return $scope.$watch('ir.IsOnTrack', (n, o) => $element.toggleClass('ng-hide', !n));
});

app.directive('appLatAccel', iRData => ({
    link(scope, element, attrs) {
        const ir = iRData;

        return scope.$watch('ir.LatAccel', function(n, o) {
            const percent = accelToGToPercent(ir.LatAccel);
            if (percent < 0) {
                return element.css({
                    left: percent + '%',
                    width: (percent*-1) + 20 + '%'
                });
            } else if (percent > 0) {
                return element.css({
                    left: 0 + '%',
                    width: percent + 20 + '%'
                });
            }
        });
    }
}));

app.directive('appLongAccel', iRData => ({
    link(scope, element, attrs) {
        const ir = iRData;

        return scope.$watch('ir.LongAccel', function(n, o) {
            const percent = accelToGToPercent(ir.LongAccel);
            if (percent < 0) {
                return element.css({
                    top: percent + '%',
                    height: (percent*-1) + 20 + '%'
                });
            } else if (percent > 0) {
                return element.css({
                    top: 0 + '%',
                    height: percent + 20 + '%'
                });
            }
        });
    }
}));

app.filter('accel', () => accelToGToPercent);

var accelToGToPercent = accel => // Percentage on a scale of 3G
Math.round((100*(accel/9.81))/3);

var convertHex = function(hex, opacity) {
    let result;
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return result = 'rgba('+r+','+g+','+b+','+(opacity/100)+')';
};

angular.bootstrap(document, [app.name]);
