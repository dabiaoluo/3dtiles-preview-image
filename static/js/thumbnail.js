var viewer, tileset, moveMode, lookAngle, stillThumb, animatedThumb;

var thumbPool = [];
var gif;

function load3DTileset(model, options) {

    let opts = {
        url: model.tileset,
        shadows: true
    };

    if (options && options.debug) {
        opts.debugColorizeTiles = true;
        opts.debugShowBoundingVolume = true;
        opts.debugShowViewerRequestVolume = true;
        opts.debugShowGeometricError = true;
        opts.debugShowRenderingStatistics = true;
        opts.debugShowMemoryUsage = true;
    }

    let tileset = viewer.scene.primitives.add(new Cesium.Cesium3DTileset(opts));

    return tileset;
}

function lookByAngle(angle) {
    viewer.camera.lookAt(
        tileset.boundingSphere.center, new Cesium.HeadingPitchRange(
            Cesium.Math.toRadians(angle),
            Cesium.Math.toRadians(-10),
            1500)
    );
}

function toggleCover(state = 'on') {
    if (state == 'on') {
        $('#cover').css('opacity', 1);
        $('#cover').css('z-index', 5);
    } else {
        $('#cover').css('opacity', 0);
        setTimeout(function () {
            $('#cover').css('z-index', -1);
        }, 800);
    }
}

function showStage() {
    viewer.scene.globe.baseColor = Cesium.Color.BLACK;
    viewer.scene.imageryLayers.get(0).show = false;
    lookByAngle(lookAngle);
}

function hideStage() {
    viewer.scene.imageryLayers.get(0).show = true;
    lookByAngle(lookAngle);
}

function rotateAndShoot(callback) {
    let process = function (angle, cb) {
        if (angle >= lookAngle+360) {
            return cb();
        }
        setTimeout(function () {
            lookByAngle(angle);

            setTimeout(function(){
                let img = new Image();
                img.src = viewer.scene.canvas.toDataURL('image/jpeg');
                thumbPool.push(img);
            }, 10);
            process(angle + 6, cb);
        }, 33);
    };

    process(lookAngle, callback);
}

function takeThumbnail() {
    showStage();

    setTimeout(function() {
        stillThumb.src = viewer.scene.canvas.toDataURL('image/jpeg');

        rotateAndShoot(function () {
            for (let i = 0; i < thumbPool.length; i++) {
                gif.addFrame(thumbPool[i], {delay: 40});
            }
            gif.render();
        });
    }, 10);
}

$(document).ready(function () {
    viewer = new Cesium.Viewer('cesiumContainer', {
        contextOptions: {
            webgl: { preserveDrawingBuffer: true }
        },
        shadows: true
    });

    let model = { tileset: 'static/tile/tileset_dragon.json' };
    tileset = load3DTileset(model, { debug: false });
    lookAngle = 180;
    viewer.zoomTo(tileset, new Cesium.HeadingPitchRange(
        Cesium.Math.toRadians(lookAngle),
        Cesium.Math.toRadians(-15),
        1200));

    setTimeout(function () {
        toggleCover('on');
    }, 3000);

    stillThumb = new Image();
    animatedThumb = new Image();

    gif = new GIF({
        workers: 4,
        quality: 10,
        workerScript:'static/vendor/gifjs/gif.worker.js'
    });

    gif.on('finished', function(blob) {
        animatedThumb.src = URL.createObjectURL(blob);
        $('#thumbnail').attr('src', stillThumb.src);
        $('#generate').prop('disabled', false).text('Get Thumbnail');
    });
});

$('#thumbnail').mouseenter(function() {
    if (animatedThumb.src) {
        $(this).attr('src', animatedThumb.src);
    }
});

$('#thumbnail').mouseleave(function() {
    if (stillThumb.src) {
        $(this).attr('src', stillThumb.src);
    }
});

$('#generate').click(function() {
    $(this).prop('disabled', true);
    $(this).text('Generating...');
    takeThumbnail();
});