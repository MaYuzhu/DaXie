/*历史轨迹查询播放*/

$(function () {
    //车辆列表
    var getVehicleHistoryData = {
        "paging" : true,
        "page" : {
            "number" : 2,
            "size" : 10
        },
    }
    getAjax(ajax_url+'cmict/vehicle/search', getVehicleHistoryData, true, getVehicleHistory, errFunc)

    //查询轨迹
    var getLineData = [ {
        "start_time" : "2019-09-25 05:00:00",
        "end_time" : "2019-09-25 08:00:00",
        "vehicle_id" : 1
    } ]

    //轨迹
    var lineSources = null
    var lineLayer = null
    var trackData = []
    var lineArray = []
    var lineArray4326 = []
    var featureA
    //- 速度
    var speed = 60;
    var index = 0;
    var setTimeoutEve;



    var source1 = new ol.source.Vector({});
    source1.addFeature(new ol.Feature({
        geometry:new ol.geom.Point(ol.proj.fromLonLat([113.86712983,22.48798137])),
    }))

    var deg = Math.PI / 180
    var vectorCarLayer = new ol.layer.Vector({  //车辆轨迹的小车
        source: source1,
        style: new ol.style.Style({
                image:new ol.style.Icon({
                rotation: deg ,
                color: "white",
                src:'./image/icon/1.png',
                scale: 1
            })
        })
        /*style : new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: 'red',
                width: 3
            }),
            fill: new ol.style.Fill({
                width : 20,
                color: 'rgba(255, 0, 255, 1)'
            })
        })*/
    })
    //map.addLayer(vectorCarLayer)

    function BindGetLine(){
        var s = $('.getLine')
        s.each(function(i){
            $(this).click(function(){
                //getLineData[0].start_time = $('#starttime_history').val()
                //getLineData[0].end_time = $('#endtime_history').val()
                /*if(!getLineData[0].start_time){
                    return false
                }*/
                //getLineData[0].vehicle_id = this.id
                getAjax(ajax_url+'cmict/location/history', getLineData, true, getLineHistory, errFunc)
            })

        })
    }

    function getLineHistory(json) {
        //console.log(json)
        //feature.getGeometry().getFirstCoordinate()  方法
        if(json){
            if(json.length==0){
                alert('当前时间范围内没有数据')
            }

            trackData = json[0].locations;
            // 折线  geometry:"(113.86875007 22.48645404)"
            lineArray = [];
            for(var i=0; i<trackData.length; i++){
                var aa = trackData[i].geometry
                var result = aa.match(/\(([^)]*)\)/);
                var pointXY = result[1].trim().split(" ")
                var pointXY1 = pointXY.map(function (item) {
                    return parseFloat(item)
                })
                var pointXY2 = ol.proj.transform(pointXY1, 'EPSG:4326', 'EPSG:3857');
                //console.log(pointXY2)
                lineArray.push(ol.proj.fromLonLat(pointXY1));
                lineArray4326.push(pointXY1)
            }
            lineSources = new ol.source.Vector();
            lineSources.addFeature(new ol.Feature({
                name: "line",
                geometry: new ol.geom.LineString(lineArray)
            }));
            //console.log(lineArray4326)
            lineLayer = new ol.layer.Vector({
                source: lineSources,
                style: [new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: '#0014ff',
                        width: 2
                    })
                })]
            });
            map.addLayer(lineLayer)
            //source1.clear()
            map.addLayer(vectorCarLayer)
        }else{

        }
    }

    //点击播放轨迹
    $('.play2').on('click',function (){
        carStartPlay();
        carMove()
    });
    function getVehicleHistory(json) {
        //console.log(json)
        $('.history_car_list').empty()
        var results = json.results
        for(var i=0;i<results.length;i++){
            $('.history_car_list').append(`<tr>
                <td>${i+1}</td>
                <td>${i+1}</td>
                <td>${results[i].vehicle_id}</td>
                <td>${results[i].vehicle_number}</td>
                <td>2019-9-10 13:12</td>
                <td>2019-9-10 13:12</td>
                <td>5km</td>
                <td>100km/h</td>
                <td>120km/h</td>
                <td>2</td>
                <td>
                    <button class="getLine" id=${results[i].vehicle_id} onclick="carPlayLine()">回放</button>
                </td>
            </tr>`)
        }
        BindGetLine()

    }

    $('.play3').click(function () {
        alert(111)
        clearTimeout(setTimeoutEve)
    })
    var flag_stop = false
    function carStartPlay() {
        if(flag_stop){
            $('.play2').css({
                background: 'rgba(0,0,0,.8) url("./image/icon/play_but.png") no-repeat 8px 4px',
                backgroundSize: '54% 70%'
            })
            flag_stop = !flag_stop
        }else {
            $('.play2').css({
                background: 'rgba(0,0,0,.8) url("./image/icon/zanting.png") no-repeat 4px 3px',
                backgroundSize: '70% 80%'
            })
            flag_stop = !flag_stop
        }

        var i=-60;
        var time_id;
        var ins1;
        layui.use('slider', function(){

            var $ = layui.$,
                slider = layui.slider;
            //默认滑块
            ins1= slider.render({
                elem: '#slideTest1'
            });
        });

        function intv(){
            time_id = setTimeout(function(){
                i+=0.1;
                document.getElementById('play_pointer').style.transform = 'rotateZ(' + i +'deg)';
                var bar=(i+60)/21*10;
                ins1.setValue(bar);
                intv()
            },10);
            if(i>150){
                //i = 0
                clearTimeout(time_id)
            }
        }
        intv()

    }

    function carMove () {
        if (trackData.length < 1) {
            new $Msg({
                content:"没有检测轨迹，请重试",
                type:"success",
            })
            return;
        }

        if(!flag_stop){
            clearTimeout(setTimeoutEve)
            return false
        }

        //- 计算角度
        if (index > 0) {
            car_map_move()
        }
        index += 1

        if (!lineArray[index]) {
            index = 0;
        }

        if(index == trackData.length){index = 1}

        setTimeoutEve = setTimeout(carMove, speed);

    }

    function car_map_move() {
        var ab = "A";
        var a90 = 0;
        var v = getAngle(lineArray4326[index-1], lineArray4326[index])
        if (lineArray4326[index-1][0] > lineArray4326[index][0]) {
            ab = "A";
            if (lineArray4326[index-1][1] > lineArray4326[index][1]) {
                a90 = 90 * 2;
            } else {
                ab = "B";
                a90 = 90 * 3;
            }
        } else {
            ab = "B";
            if (lineArray4326[index-1][1] > lineArray4326[index][1]) {
                a90 = 90 * 1;
            } else {
                ab = "A";
                a90 = 0;
            }
        }
        var Av = a90 + v[ab];

        if (v.A != 0 && v.B != 0) {
            featureA = new ol.Feature({
                //geometry:new ol.geom.Point(ol.proj.fromLonLat([113.86603148,22.49093365]))
                geometry: new ol.geom.Point(ol.proj.fromLonLat([lineArray4326[index][0],lineArray4326[index][1]]))
            })
            //console.log(Av)
            //console.log(lineArray4326[index][0],lineArray4326[index][1])
            vectorCarLayer.getStyle().getImage().setRotation(Math.PI / 180 * Av);

        }

        source1.clear();

        source1.addFeature(featureA);
        //vectorCarLayer.changed()
        //map.render();
        //source1.refresh();

    }
    //亮点坐标计算

    var getAngle = function (A, B) {
        var x1 = A[0];
        var y1 = A[1];
        var x2 = B[0];
        var y2 = B[1];

        var a = Math.abs(x1 - x2);
        var b = Math.abs(y1 - y2);
        if (a === 0 || b === 0) {
            return {
                A: 0,
                B: 0,
                C: 0,
                ab: { A:A, B:B }
            }
        }
        var c = Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
        var randianToAngle = function (scale) {
            var radian = Math.acos(scale);
            var angle = 180 / Math.PI * radian;
            return Math.round(angle);
        }
        var angleA = randianToAngle(b / c);
        var angleB = randianToAngle(a / c);
        return {
            A: angleA,
            B: angleB,
            C: 90,
            ab: { A:A, B:B }
        }
    }
})

