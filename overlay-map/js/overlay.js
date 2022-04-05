// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
window.app = angular.module('overlay-map', [
    'ngAnimate',
    'ngSanitize'
]);

app.config($locationProvider => $locationProvider.hashPrefix(''));

app.service('config', function($location) {
    let driverGroupsEnabled;
    const vars = $location.search();

    let fps = parseInt(vars.fps) || 30;
    fps = Math.max(1, Math.min(60, fps));

    let baseStrokeWidth = parseInt(vars.trackWidth) || 10;
    baseStrokeWidth = Math.max(1, Math.min(30, baseStrokeWidth));

    let driverCircle = parseInt(vars.driverCircle) || 12;
    driverCircle = Math.max(1, Math.min(30, driverCircle));

    let driverHighlightWidth = parseInt(vars.driverHighlightWidth) || 4;
    driverHighlightWidth = Math.max(3, Math.min(10, driverHighlightWidth));

    let driverGroups = vars.dGrp;
    let driverGroupsColors = vars.dGrpClr;

    if (driverGroups && driverGroupsColors) {
        let i, item;
        if (driverGroups instanceof Array) {
            for (i = 0; i < driverGroups.length; i++) {
                const group = driverGroups[i];
                driverGroups[i] = group.split(',');

                for (let j = 0; j < driverGroups[i].length; j++) {
                    item = driverGroups[i][j];
                    driverGroups[i][j] = parseInt(item);
                }
            }
        } else {
            driverGroups = driverGroups.split(',');
            driverGroups = new Array(driverGroups);

            for (i = 0; i < driverGroups[0].length; i++) {
                item = driverGroups[0][i];
                driverGroups[0][i] = parseInt(item);
            }

            driverGroupsColors = new Array(driverGroupsColors);
        }

        if (driverGroups.length === driverGroupsColors.length) {
            driverGroupsEnabled = true;
        } else {
            driverGroupsEnabled = false;
        }

    } else {
        driverGroupsEnabled = false;
    }

    return {
        driverGroupsEnabled,
        driverGroups,
        driverGroupsColors,

        showSectors: vars.showSectors === 'true',

        host: vars.host || 'localhost:8182',
        fps,

        mapOptions: {
            preserveAspectRatio: getPreserveAspectRatio(vars.trackAlignment != null ? vars.trackAlignment : 'center'),
            styles: {
                track: {
                    fill: 'none',
                    stroke: vars.trackColor || '#000000',
                    'stroke-width': baseStrokeWidth.toString(),
                    'stroke-miterlimit': baseStrokeWidth.toString(),
                    'stroke-opacity': '1'
                },
                pits: {
                    fill: 'none',
                    stroke: vars.trackColor || '#000000',
                    'stroke-width': (baseStrokeWidth * 0.7).toString(),
                    'stroke-miterlimit': (baseStrokeWidth * 0.7).toString(),
                    'stroke-opacity': '1'
                },
                track_outline: {
                    fill: 'none',
                    stroke: vars.trackOutlineColor || '#FFFFFF',
                    'stroke-width': (baseStrokeWidth * 1.8).toString(),
                    'stroke-miterlimit': (baseStrokeWidth * 1.8).toString(),
                    'stroke-opacity': '0.3'
                },
                pits_outline: {
                    fill: 'none',
                    stroke: vars.trackOutlineColor || '#FFFFFF',
                    'stroke-width': (baseStrokeWidth * 1.5).toString(),
                    'stroke-miterlimit': (baseStrokeWidth * 1.5).toString(),
                    'stroke-opacity': '0.3'
                },
                startFinish: {
                    stroke: vars.startFinishColor || '#FF0000',
                    'stroke-width': (baseStrokeWidth * 0.5).toString(),
                    'stroke-miterlimit': (baseStrokeWidth).toString(),
                    'stroke-opacity': '1'
                },
                sectors: {
                    stroke: vars.sectorColor || '#FFDA59',
                    'stroke-width': (baseStrokeWidth * 0.3).toString(),
                    'stroke-miterlimit': (baseStrokeWidth).toString(),
                    'stroke-opacity': '1'
                },
                driver: {
                    circleRadius: driverCircle,
                    circleColor: vars.circleColor || false,
                    default: {
                        'stroke-width': '0',
                        stroke: vars.driverHighlightCam || '#4DFF51'
                    },
                    camera: {
                        'stroke-width': driverHighlightWidth.toString()
                    },
                    pit: {
                        opacity: '0.5'
                    },
                    onTrack: {
                        opacity: '1'
                    },
                    offTrack: {
                        'stroke-width': driverHighlightWidth.toString(),
                        stroke: vars.driverHighlightOfftrack || '#FF0000'
                    },
                    circleNum: {
                        fill: vars.driverPosNum || '#000000'
                    },
                    posNum: {
                        opacity: '1'
                    },
                    carNum: {
                        opacity: '0.5'
                    },
                    highlightNum: {
                        fill: vars.highlightNum || '#FFFFFF'
                    },
                    playerHighlight: vars.playerHighlight || false
                }
            }
        },

        requestParams: [
            // yaml
            'DriverInfo',
            'SessionInfo',

            // telemetry
            'CamCarIdx',
            'CarIdxLapDistPct',
            'CarIdxOnPitRoad',
            'CarIdxTrackSurface',
            'IsReplayPlaying',
            'ReplayFrameNumEnd',
            'SessionNum'
        ],
        requestParamsOnce: [
            // yaml
            'QualifyResultsInfo',
            'WeekendInfo',
            'SplitTimeInfo'
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

    ir.onUpdate = function(keys) {
        if (Array.from(keys).includes('DriverInfo')) {
            updateDriversByCarIdx();
            updateCarClassIDs();
        }
        if (Array.from(keys).includes('SessionInfo')) {
            updatePositionsByCarIdx();
        }
        if (Array.from(keys).includes('QualifyResultsInfo')) {
            updateQualifyResultsByCarIdx();
        }
        return $rootScope.$apply();
    };

    var updateDriversByCarIdx = function() {
        ir.data.myCarIdx = ir.data.DriverInfo.DriverCarIdx;
        if (ir.data.DriversByCarIdx == null) { ir.data.DriversByCarIdx = {}; }
        return Array.from(ir.data.DriverInfo.Drivers).map((driver) =>
            (ir.data.DriversByCarIdx[driver.CarIdx] = driver));
    };

    var updatePositionsByCarIdx = function() {
        if (ir.data.PositionsByCarIdx == null) { ir.data.PositionsByCarIdx = []; }
        return (() => {
            const result = [];
            for (var i = 0; i < ir.data.SessionInfo.Sessions.length; i++) {
                const session = ir.data.SessionInfo.Sessions[i];
                while (i >= ir.data.PositionsByCarIdx.length) {
                    ir.data.PositionsByCarIdx.push({});
                }
                if (session.ResultsPositions) {
                    result.push(Array.from(session.ResultsPositions).map((position) =>
                        (ir.data.PositionsByCarIdx[i][position.CarIdx] = position)));
                } else {
                    result.push(undefined);
                }
            }
            return result;
        })();
    };

    var updateQualifyResultsByCarIdx = function() {
        if (ir.data.QualifyResultsByCarIdx == null) { ir.data.QualifyResultsByCarIdx = {}; }
        return Array.from(ir.data.QualifyResultsInfo.Results).map((position) =>
            (ir.data.QualifyResultsByCarIdx[position.CarIdx] = position));
    };

    var updateCarClassIDs = () => (() => {
        const result = [];
        for (let driver of Array.from(ir.data.DriverInfo.Drivers)) {
            const carClassId = driver.CarClassID;
            if (ir.data.CarClassIDs == null) { ir.data.CarClassIDs = []; }
            if ((driver.UserID !== -1) && (driver.IsSpectator === 0) && !Array.from(ir.data.CarClassIDs).includes(carClassId)) {
                result.push(ir.data.CarClassIDs.push(carClassId));
            } else {
                result.push(undefined);
            }
        }
        return result;
    })();

    return ir.data;
});

app.controller('MapCtrl', function($scope, $element, iRData, config) {
    let drawMap, getCarClassColor, watchCamCar, watchOfftracks, watchPitRoad, watchPositions, watchSessionNum;
    const ir = ($scope.ir = iRData);

    let replayFrameWatcher = null;

    const mapVars = {
        skipCars: 0,
        trackMap: null,
        track: null,
        extendedTrack: null,
        extendedTrackMaxDist: null,
        trackLength: null,
        extenededTrackLength: null,
        drivers: {}
    };

    $scope.$watch('ir.IsReplayPlaying', checkTrackOverlayHide);

    $scope.$watch('ir.connected', function(n, o) {
        $element.toggleClass('ng-hide', !n);
        if (!n && !!mapVars.trackMap) {
            mapVars.trackMap.remove();
            mapVars.trackMap = null;
            mapVars.track = null;
            mapVars.extendedTrack = null;
            mapVars.extendedTrackMaxDist = null;
            mapVars.trackLength = null;
            mapVars.extenededTrackLength = null;
            mapVars.skipCars = 0;
            return mapVars.drivers = {};
        }
});

    $scope.$watchGroup(['ir.WeekendInfo', 'ir.DriverInfo', 'ir.SessionInfo'], function() {
        let waitCSS;
        if (!ir.WeekendInfo || !ir.DriverInfo || !ir.SessionInfo) {
            return;
        }

        return (waitCSS = () => setTimeout(function() {
            if (!$element[0].getBoundingClientRect().height) {
                return waitCSS();
            } else if (!mapVars.trackMap && (ir.WeekendInfo != null ? ir.WeekendInfo.TrackID : undefined)) {
                return initMap(ir.WeekendInfo.TrackID);
            }
        }
        , 1))();
    });

    var checkTrackOverlayHide = function() {
        if (!ir.WeekendInfo || (ir.WeekendInfo.SimMode === 'replay')) {
            return;
        }

        if (ir.IsReplayPlaying) {
            if ((replayFrameWatcher == null)) {
                replayFrameWatcher = $scope.$watch('ir.ReplayFrameNumEnd', checkTrackOverlayHide);
            }
        } else if (replayFrameWatcher != null) {
            replayFrameWatcher();
            replayFrameWatcher = null;
        }
        return $element.toggleClass('ng-hide', 
            (ir.IsReplayPlaying && (ir.ReplayFrameNumEnd > 10)));
    };

    var initMap = function(trackId) {
        let path;
        if (!trackOverlay.tracksById[trackId]) {
            return;
        }

        mapVars.trackMap = SVG('map-overlay');

        for (let i = 0; i < trackOverlay.tracksById[trackId].paths.length; i++) {
            path = trackOverlay.tracksById[trackId].paths[i];
            if (i === 0) {
                const trk_outline = mapVars.trackMap.path(path).attr(config.mapOptions.styles.track_outline).data('id', 'trk_outline');
                mapVars.track = mapVars.trackMap.path(path).attr(config.mapOptions.styles.track).data('id', 'track');

                const dims = mapVars.track.bbox();
                const mapWidth = Math.round(dims.width + 40);
                const mapHeight = Math.round(dims.height + 40);

                mapVars.trackMap.attr('viewBox', `0 0 ${mapWidth} ${mapHeight}`);
                mapVars.trackMap.attr('preserveAspectRatio', config.mapOptions.preserveAspectRatio);
            } else {
                const pit_outline = mapVars.trackMap.path(path).attr(config.mapOptions.styles.pits_outline).back().data('id', 'pit_outline');
                const pit = mapVars.trackMap.path(path).attr(config.mapOptions.styles.pits).data('id', 'pit');
            }
        }

        if (trackOverlay.tracksById[trackId].extendedTrack) {
            const ext_trk_outline = mapVars.trackMap.path(trackOverlay.tracksById[trackId].extendedTrack[1]).attr(config.mapOptions.styles.track_outline).data('id', 'ext_trk_outline');
            mapVars.extendedTrack = mapVars.trackMap.path(trackOverlay.tracksById[trackId].extendedTrack[1]).attr(config.mapOptions.styles.track).data('id', 'ext_track');
            mapVars.extendedTrackLength = mapVars.extendedTrack.length();
            mapVars.extendedTrackMaxDist = trackOverlay.tracksById[trackId].extendedTrack[0];
        }

        mapVars.trackLength = mapVars.track.length();

        if (trackOverlay.tracksById[trackId].extendedLine) {
            for (let extendedLine of Array.from(trackOverlay.tracksById[trackId].extendedLine)) {
                drawStartFinishLine(extendedLine);
            }
        } else {
            drawStartFinishLine(0);
        }

        if (config.showSectors) {
            return drawSectors();
        }
    };

    $scope.$watch('ir.CarIdxLapDistPct', (drawMap = () => requestAnimationFrame(updateMap))
    );

    $scope.$watch('ir.CamCarIdx', (watchCamCar = function() {
        let driver;
        for (let index in mapVars.drivers) {
            driver = mapVars.drivers[index];
            driver.get(0).attr(config.mapOptions.styles.driver.default);
        }

        if (!!mapVars.drivers[ir.CamCarIdx]) {
            return mapVars.drivers[ir.CamCarIdx].get(0).attr(config.mapOptions.styles.driver.camera);
        }
    })
    );

    $scope.$watch('ir.CarIdxOnPitRoad', (watchPitRoad = function() {
        if (!ir.CarIdxOnPitRoad) {
            return;
        }

        return (() => {
            const result = [];
            for (let carIdx = 0; carIdx < ir.CarIdxOnPitRoad.length; carIdx++) {
                const pitStatus = ir.CarIdxOnPitRoad[carIdx];
                if (carIdx >= mapVars.skipCars) {
                    if (!mapVars.drivers[carIdx]) {
                        continue;
                    }

                    if (pitStatus) {
                        result.push(mapVars.drivers[carIdx].attr(config.mapOptions.styles.driver.pit));
                    } else if (!!mapVars.drivers[carIdx]) {
                        result.push(mapVars.drivers[carIdx].attr(config.mapOptions.styles.driver.onTrack));
                    } else {
                        result.push(undefined);
                    }
                }
            }
            return result;
        })();
    })
    );

    $scope.$watch('ir.CarIdxTrackSurface', (watchOfftracks = function(n, o) {
        if (!n || !o) {
            return;
        }

        return (() => {
            const result = [];
            for (let carIdx = 0; carIdx < n.length; carIdx++) {
                const trackSurface = n[carIdx];
                if (carIdx >= mapVars.skipCars) {
                    if (!mapVars.drivers[carIdx]) {
                        continue;
                    }

                    if ((trackSurface === 0) && (o[carIdx] !== 0)) {
                        result.push(mapVars.drivers[carIdx].get(0).attr(config.mapOptions.styles.driver.offTrack));
                    } else if ((trackSurface !== 0) && (o[carIdx] === 0)) {
                        mapVars.drivers[carIdx].get(0).attr(config.mapOptions.styles.driver.default);

                        if (carIdx === ir.CamCarIdx) {
                            result.push(mapVars.drivers[carIdx].get(0).attr(config.mapOptions.styles.driver.camera));
                        } else {
                            result.push(undefined);
                        }
                    } else {
                        result.push(undefined);
                    }
                }
            }
            return result;
        })();
    })
    );

    $scope.$watch('ir.PositionsByCarIdx', (watchPositions = function() {
        if (!ir.PositionsByCarIdx) {
            return;
        }

        return (() => {
            const result = [];
            for (let carIdx in ir.PositionsByCarIdx[ir.SessionNum]) {
                const driver = ir.PositionsByCarIdx[ir.SessionNum][carIdx];
                if (!!mapVars.drivers[carIdx]) {
                    const driverPosition = driver.ClassPosition === -1 ? driver.Position : driver.ClassPosition + 1;
                    result.push(mapVars.drivers[carIdx].get(1).plain(driverPosition).attr(config.mapOptions.styles.driver.posNum).center(0, 0));
                } else {
                    result.push(undefined);
                }
            }
            return result;
        })();
    })
    , true);

    $scope.$watch('ir.SessionNum', (watchSessionNum = function(n, o) {
        if ((n == null) || !ir.DriversByCarIdx) {
            return;
        }

        if (ir.WeekendInfo.SimMode === 'replay') {
            return;
        }

        return (() => {
            const result = [];
            for (let index in mapVars.drivers) {
                const driver = mapVars.drivers[index];
                result.push(driver.get(1).plain(ir.DriversByCarIdx[index].CarNumber).attr(config.mapOptions.styles.driver.carNum));
            }
            return result;
        })();
    })
    );

    const showClassBubble = function(carIdx) {
        if (!ir.CarClassIDs || (ir.CarClassIDs.length <= 1)) {
            return;
        }

        const classBubble = mapVars.drivers[carIdx].get(2);

        if (!!classBubble && !classBubble.visible()) {
            return classBubble.show();
        }
    };

    var updateMap = function() {
        if (!ir.SessionInfo || !ir.SessionInfo.Sessions[ir.SessionNum] || !mapVars.trackMap) {
            return;
        }

        if (ir.SessionInfo.Sessions[ir.SessionNum].SessionType === 'Race') {
            mapVars.skipCars = 1;
        }

        return (() => {
            const result = [];
            for (let carIdx = 0; carIdx < ir.CarIdxLapDistPct.length; carIdx++) {
                const carIdxDist = ir.CarIdxLapDistPct[carIdx];
                if (carIdx >= mapVars.skipCars) {var driverCoords;
                
                    if (!mapVars.drivers[carIdx]) {
                        var drawClassBubble, group;
                        if (carIdxDist === -1) {
                            continue;
                        }

                        driverCoords = getDriverCoords(carIdxDist);
                        const carClassColor = getCarClassColor(carIdx);

                        let circleColor = carClassColor;
                        let numberColor = config.mapOptions.styles.driver.circleNum;

                        if (config.mapOptions.styles.driver.circleColor) {
                            ({
                                circleColor
                            } = config.mapOptions.styles.driver);
                            drawClassBubble = true;
                        }

                        if (config.driverGroupsEnabled) {
                            for (let i = 0; i < config.driverGroups.length; i++) {
                                group = config.driverGroups[i];
                                if ((Array.from(group).includes(ir.DriversByCarIdx[carIdx].UserID)) || (ir.WeekendInfo.TeamRacing && Array.from(group).includes(ir.DriversByCarIdx[carIdx].TeamID))) {
                                    circleColor = config.driverGroupsColors[i];
                                    numberColor = config.mapOptions.styles.driver.highlightNum;
                                    drawClassBubble = true;
                                    break;
                                }
                            }
                        }

                        const driverNumber = mapVars.trackMap.plain('').attr(numberColor);
                        const driverCircle = mapVars.trackMap.circle(config.mapOptions.styles.driver.circleRadius * 2).attr(config.mapOptions.styles.driver.default).fill(circleColor);

                        if (!ir.PositionsByCarIdx[ir.SessionNum][carIdx]) {
                            driverNumber.plain(ir.DriversByCarIdx[carIdx].CarNumber).attr(config.mapOptions.styles.driver.carNum);
                        } else {
                            const driverPosition = ir.PositionsByCarIdx[ir.SessionNum][carIdx].ClassPosition === -1 ? ir.PositionsByCarIdx[ir.SessionNum][carIdx].Position : ir.PositionsByCarIdx[ir.SessionNum][carIdx].ClassPosition + 1;
                            driverNumber.plain(driverPosition).attr(config.mapOptions.styles.driver.posNum);
                        }

                        if (carIdx === ir.myCarIdx) {
                            driverNumber.attr(config.mapOptions.styles.driver.highlightNum);

                            if (config.mapOptions.styles.driver.playerHighlight) {
                                driverCircle.fill(config.mapOptions.styles.driver.playerHighlight);
                            } else {
                                driverCircle.fill(shadeColor(circleColor, -0.3));
                            }
                        }

                        driverCircle.center(0, 0);
                        driverNumber.center(0, 0);

                        const driver = mapVars.trackMap.group();
                        driver.add(driverCircle);
                        driver.add(driverNumber);

                        if (drawClassBubble) {
                            const classBubble = mapVars.trackMap.circle(config.mapOptions.styles.driver.circleRadius).fill(carClassColor).center(config.mapOptions.styles.driver.circleRadius * .85, -config.mapOptions.styles.driver.circleRadius * .85).hide();
                            driver.add(classBubble);
                            drawClassBubble = false;
                        }

                        driver.move(driverCoords.x, driverCoords.y);

                        mapVars.drivers[carIdx] = driver;

                        if (carIdx === ir.CamCarIdx) {
                            mapVars.drivers[carIdx].get(0).attr(config.mapOptions.styles.driver.camera);
                        }

                        if (ir.CarIdxOnPitRoad[carIdx]) {
                            result.push(mapVars.drivers[carIdx].attr(config.mapOptions.styles.driver.pit));
                        } else {
                            result.push(undefined);
                        }
                    } else {
                        if (carIdxDist === -1) {
                            result.push(mapVars.drivers[carIdx].hide());
                        } else {
                            driverCoords = getDriverCoords(carIdxDist);
                            mapVars.drivers[carIdx].move(driverCoords.x, driverCoords.y);

                            if ((carIdx === ir.CamCarIdx) && !!mapVars.drivers[carIdx].next()) {
                                mapVars.drivers[carIdx].front();
                            }

                            mapVars.drivers[carIdx].show();
                            result.push(showClassBubble(carIdx));
                        }
                    }
                }
            }
            return result;
        })();
    };


    var getDriverCoords = function(carIdxDist) {
        let driverCoords;
        if (!mapVars.track) {
            return;
        }

        if (mapVars.extendedTrack && (carIdxDist >= 1)) {
            driverCoords = mapVars.extendedTrack.pointAt(mapVars.extendedTrackLength*((carIdxDist - 1) / (mapVars.extendedTrackMaxDist - 1)));
        } else {
            driverCoords = mapVars.track.pointAt(mapVars.trackLength*carIdxDist);
        }

        return driverCoords;
    };

    var drawStartFinishLine = function(refPoint) {
        let startFinishLine;
        const startCoords = mapVars.track.pointAt(refPoint * mapVars.trackLength);
        const pathAngle = mapVars.track.pointAt((refPoint * mapVars.trackLength) + 0.1);
        const rotateAngle = getLineAngle(startCoords.x, startCoords.y, pathAngle.x, pathAngle.y);
        return startFinishLine = mapVars.trackMap.path(getLinePath(startCoords.x, startCoords.y - 15, startCoords.x, startCoords.y + 15)).rotate(rotateAngle).attr(config.mapOptions.styles.startFinish);
    };

    var drawSectors = function() {
        if (!ir.SplitTimeInfo) {
            return;
        }

        return (() => {
            const result = [];
            for (let i = 0; i < ir.SplitTimeInfo.Sectors.length; i++) {
                const sector = ir.SplitTimeInfo.Sectors[i];
                if (i >= 1) {var sectorLine;
                
                    const sectorCoords = mapVars.track.pointAt(sector.SectorStartPct * mapVars.trackLength);
                    const sectorAngle = mapVars.track.pointAt((sector.SectorStartPct * mapVars.trackLength) + 0.1);
                    const sectorRotation = getLineAngle(sectorCoords.x, sectorCoords.y, sectorAngle.x, sectorAngle.y);
                    result.push(sectorLine = mapVars.trackMap.path(getLinePath(sectorCoords.x, sectorCoords.y - 10, sectorCoords.x, sectorCoords.y + 10)).rotate(sectorRotation).attr(config.mapOptions.styles.sectors));
                }
            }
            return result;
        })();
    };

    return getCarClassColor = function(carIdx) {
        let carClassColor = ir.DriversByCarIdx[carIdx].CarClassColor;

        if (carClassColor === 0) {
            const carClassId = ir.DriversByCarIdx[carIdx].CarClassID;
            for (let d of Array.from(ir.DriverInfo.Drivers)) {
                if ((d.CarClassID === carClassId) && d.CarClassColor) {
                    carClassColor = d.CarClassColor;
                }
            }
        }
        if (carClassColor === 0xffffff) {
            carClassColor = 0xffda59;
        }

        return carClassColor = '#' + carClassColor.toString(16);
    };
});

var shadeColor = function(color, percent) {
    const f = parseInt(color.slice(1), 16);
    const t = (percent < 0 ? 0 : 255);
    const p = (percent < 0 ? percent * -1 : percent);
    const R = f >> 16;
    const G = (f >> 8) & 0x00FF;
    const B = f & 0x0000FF;
    return '#' + (0x1000000 + ((Math.round((t - R) * p) + R) * 0x10000) + ((Math.round((t - G) * p) + G) * 0x100) + (Math.round((t - B) * p) + B)).toString(16).slice(1);
};

var getLinePath = (startX, startY, endX, endY) => 'M' + startX + ' ' + startY + ' L' + endX + ' ' + endY;

var getLineAngle = function(x1, y1, x2, y2) {
    const x = x1 - x2;
    const y = y1 - y2;

    if (!x && !y) {
        return 0;
    }

    return (180 + ((Math.atan2(-y, -x) * 180) / Math.PI) + 360) % 360;
};

var getPreserveAspectRatio = function(trackAlignment) {
    switch (trackAlignment) {
        case 'top-left':     return 'xMinYMin meet';
        case 'top':          return 'xMidYMin meet';
        case 'top-right':    return 'xMaxYMin meet';
        case 'left':         return 'xMinYMid meet';
        case 'center':       return 'xMidYMid meet';
        case 'right':        return 'xMaxYMid meet';
        case 'bottom-left':  return 'xMinYMax meet';
        case 'bottom':       return 'xMidYMax meet';
        case 'bottom-right': return 'xMaxYMax meet';
    }
};

angular.bootstrap(document, [app.name]);
