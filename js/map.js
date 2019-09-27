
var mlayer1 = new ol.layer.Tile({
    /*source: new ol.source.XYZ({
        url:'http://mt2.google.cn/vt/lyrs=y&hl=zh-CN&gl=CN&src=app&x={x}&y={y}&z={z}&s=G'//谷歌卫星地图 混合
    }),*/
    /*source: new ol.source.XYZ({
        url: "https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiYW5hbHl0aWNhbGdyYXBoaWNzIiwiYSI6ImNpd204Zm4wejAwNzYyeW5uNjYyZmFwdWEifQ.7i-VIZZWX8pd1bTfxIVj9g" //谷歌街道
    }),*/
    //projection: 'EPSG:3857',
    source: new ol.source.XYZ({
        url: 'https://t{0-7}.tianditu.gov.cn/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=2ce94f67e58faa24beb7cb8a09780552'
    }),
    crossOrigin: 'anonymous',
    name: '天地图',

})
var mlayer2 = new ol.layer.Tile({
    source: new ol.source.XYZ({
        url: 'https://t{0-7}.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=2ce94f67e58faa24beb7cb8a09780552'
    }),
    crossOrigin: 'anonymous',
    name: '天地图',
    visible: false
});
var mlayer3 = new ol.layer.Image({
    //geoserver发布
    source: new ol.source.ImageWMS({
        url:'http://139.159.153.158/geoserver/bm/wms',
        params:{
            layers: 'bm:tst',
            version: '1.1.0',
            service:'WMS',
        },
        serverType: 'geoserver'
    })

});
var mlayer4 = new ol.layer.Tile({
    source: new ol.source.XYZ({
        url: 'https://t{0-7}.tianditu.gov.cn/DataServer?T=cia_w&x={x}&y={y}&l={z}&tk=2ce94f67e58faa24beb7cb8a09780552'
    }),
    crossOrigin: 'anonymous',
    name: '天地图文字标注'
});


//var pos = [13110795.607205058,4719031.500290665];
var pos = ol.proj.transform([113.87346268, 22.48496128], 'EPSG:4326', 'EPSG:3857');
//var pos = [113.87346268, 22.48496128];
const container = document.getElementById('popup');
const content = document.getElementById('popup-content');
const closer = document.getElementById('popup-closer');

var drawType = "Polygon";

var features = []

//点击兴趣点弹出框使用
var overlay = new ol.Overlay({
    element: container,//设置弹出框的容器
    autoPan: true, //是否自动平移，即假如标记在屏幕边缘，弹出时自动平移地图使弹出框完全可见
    autoPanAnimation: {
        duration: 250
    }
});


var layers = [
    mlayer1,
    mlayer2,
    mlayer4,
    mlayer3
];
//end

//实例化 map
var map = new ol.Map({
    layers: layers,
    target: 'map',
    view: new ol.View({
        center: pos,
        zoom: 16,
        //projection:  ol.proj.get('EPSG:4326'),
    }),
    overlays: [
        overlay
    ],
    interactions: new ol.interaction.defaults({
        doubleClickZoom: false,
    })
});
//切换底图
var flag_ditu = true
$('.change_map').click(function () {
    if(flag_ditu){
        mlayer1.setVisible(true);
        mlayer2.setVisible(false);
    }else {
        mlayer1.setVisible(false);
        mlayer2.setVisible(true);
    }
    flag_ditu = !flag_ditu
})

var mousePositionControl = new ol.control.MousePosition({
    //样式类名称
    className: 'mosuePosition',
    //投影坐标格式，显示小数点后边多少位
    coordinateFormat: ol.coordinate.createStringXY(8),
    //指定投影
    projection: 'EPSG:4326',
    //目标容器
    target:document.getElementById('myposition')
});
//map.addControl(mousePositionControl);//鼠标点的经纬度

// map 比例尺
var scaleLineControl = new ol.control.ScaleLine({
    //设置度量单位为米
    units: 'metric',
    target: 'scalebar',
    className: 'ol-scale-line'
});
map.addControl(scaleLineControl);

//添加指北针
var scaleline=new ol.control.Compass();
map.addControl(scaleline);

//旋转控件
map.addControl(new ol.control.Rotate({
    autoHide: false
}));
//添加全屏控件
//map.addControl(new ol.control.FullScreen());

//定义保存动态GIS数据 矢量容器
var source = new ol.source.Vector({
    features: features
});
//动态生成矢量层
var vector = new ol.layer.Vector({
    source: source,
    style: new ol.style.Style({
        fill: new ol.style.Fill({
            color: 'rgba(217, 220, 0, 0.3)'
        }),
        stroke: new ol.style.Stroke({
            color: '#000',
            width: 2
        }),
        image: new ol.style.Circle({
            radius: 7,
            fill: new ol.style.Fill({
                color: '#ffcc33'
            })
        })
    })
});
map.addLayer(vector);


//矢量图层鼠标点击事件
var car_tip_message_flag = true
map.on('click', function(e) {
    if(car_tip_message_flag){
        //在点击时获取像素区域
        $('#popup-content').html(`
            <p><span>车辆：</span><span class="plate_number"></span></p>
            <p><span>部门：</span><span class="identity_name"></span></p>
            <p><span>时间：</span><span class="gather_time"></span></p>
            <!--<p><span>当前速度：</span><span class="velocity"></span></p>-->
            <!--<p><span>总里程：</span><span class="total_mileage">,</span>&nbsp;&nbsp;<span>当日里程：</span><span class="daily_mileage"></span></p>
            --><p><span>经纬度：</span><span class="info_xy"></span></p>
            <p><span>定位状态：</span><span class="quality"></span></p>
            <p><span>状态：</span><span class="state"></span></p>
        `)
        var pixel = map.getEventPixel(e.originalEvent);
        var msg ;
        map.forEachFeatureAtPixel(pixel, function(feature) {
            if(feature.getId() == null){
                return;
            }
            var data = {'vehicleId': feature.getId()}
            var data_xy = {'vehiclesId': feature.getId(),'precision':8}
            getAjaxRequest("GET", interface_url+"vehicle/get", data, window.car_info, null)
            getAjaxRequest("GET", interface_url+"location/realtime", data_xy, window.car_info_xy, null)

            //coodinate存放了点击时的坐标信息
            var coodinate = e.coordinate;

            //设置overlay的显示位置
            overlay.setPosition(coodinate);
            //显示overlay
            map.addOverlay(overlay);
            car_tip_message_flag = false
        });
    }
});

//popup关闭事件
closer.addEventListener('click', function() {
    overlay.setPosition(undefined);
    closer.blur();
    return false;
});
document.addEventListener('click', function() {
    if(car_tip_message_flag){
        overlay.setPosition(undefined);
        closer.blur();
        return false;
    }
    car_tip_message_flag = true
});

//为map添加鼠标移动事件监听，当指向标注时改变鼠标光标状态
//map.on('pointermove', function (e) {
//    var pixel = map.getEventPixel(e.originalEvent);
//    var hit = map.hasFeatureAtPixel(pixel);
//    map.getTargetElement().style.cursor = hit ? 'pointer' : '';
//})

var draw, snap;
var temp;
function addInteractions() {
    if(drawType == "Polygon"){
        draw = new ol.interaction.Draw({
            geometryName: "draw01",
            source: source,
            type: drawType,
        });
    }else {
        draw = new ol.interaction.Draw({
            geometryName: "draw01",
            source: source,
            type: 'Circle',
            geometryFunction: ol.interaction.Draw.createBox()
        });
    }


    map.addInteraction(draw);

    draw.on("drawend", function (e) {
        //var geom=e.feature.getGeometry();
        var graphical = {};
        if (e.feature.getGeometry().getType() == "Circle") {
            //原来的圆形
            /*graphical = {
                name: "Circle",
                data: [e.feature.getGeometry().getCenter(), e.feature.getGeometry().getRadius()]
            }*/
            graphical = {
                name: "Circle",
                data: e.feature.getGeometry().getCoordinates()
            }
        } else {
            graphical = {
                name: "Polygon",
                data: e.feature.getGeometry().getCoordinates()
            }
        }
        //temp = e.feature.getGeometry();
        $.cookie('coordinate', JSON.stringify(graphical));
        $('.add_fence_wrap').show()
        $('input[name=add_fence_name],#add_fence_start_time,#add_fence_end_time').val('')

    });
    snap = new ol.interaction.Snap({ source: source });
    map.addInteraction(snap);

    var modify = new ol.interaction.Modify({
        source: source,
    });
    map.addInteraction(modify);
    modify.on("modifyend", function (e) {
        var graphical = {};
        if (e.feature.getGeometry().getType() == "Circle") {
            graphical = {
                name: "Circle",
                data: [e.feature.getGeometry().getFirstCoordinate(), e.feature.getGeometry().getRadius()]
            }
        } else {
            graphical = {
                name: "Polygon",
                data: e.feature.getGeometry().getCoordinates()
            }
        }
        //console.log(JSON.stringify(graphical));
        $.cookie('coordinate', JSON.stringify(graphical));
    })
}
//- draw.T
$(".addrail").click(function () {
    addInteractions();
});
$(".outrail").click(function () {
    map.removeInteraction(draw);
    map.removeInteraction(snap);
});

//秒转成时间格式
function formatDuring(mss) {
    var hours = Math.floor(mss  / 60 / 60);
    var minutes = Math.floor(mss  / 60 % 60);
    var seconds = Math.floor(mss  % 60);
    if(hours<10){
        hours = '0' + hours
    }
    if(minutes<10){
        minutes = '0' + minutes
    }
    if(seconds<10){
        seconds = '0' + seconds
    }
    return hours + ":" + minutes + ":" + seconds;
    //return days + " 天 " + hours + " 小时 " + minutes + " 分钟 " + seconds + " 秒 ";
}

//右上角功能图标
$('.ol-zoom-in,.ol-zoom-out').text('')
$('.ol-zoom-in').attr('title','放大')
$('.ol-zoom-out').attr('title','缩小')
$('.ol-rotate-reset').attr('title','按住shift+alt+鼠标拖动旋转')
$('.ol-rotate-reset .ol-compass').html('<img src="./image/icon/xuanzhuan.png" alt="">')
$('.toolblock ul>:nth-child(4)').click(function () {
    var view = map.getView()
    view.setCenter(ol.proj.transform([113.87346268, 22.48496128], 'EPSG:4326', 'EPSG:3857'))  //pos = ol.proj.transform([113.87346268, 22.48496128], 'EPSG:4326', 'EPSG:3857');
    view.setZoom(16);
    map.render();
})



