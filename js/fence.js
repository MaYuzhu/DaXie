
$(function () {
    //电子围栏查询日期
    laydate.render({
        elem: '#fence_search',
        type: 'datetime'
        //, format: 'M/d/H:m'
    })
    //添加围栏时间
    laydate.render({
        elem: '#add_fence_start_time',
        type: 'datetime'
        //, format: 'M/d/H:m'
    })
    laydate.render({
        elem: '#add_fence_end_time',
        type: 'datetime'
        //, format: 'M/d/H:m'
    })


    //显示围栏列表
    $('.fence_button').click(function () {
        $('.fence').show()
        $('.functionblock').css({display: "none"})
        $('.form-top-mask').fadeIn(100)
    })
    //关闭围栏列表
    $('.fence_close').click(function () {
        $('.fence').hide()
        $('.functionblock').css({display: "block"})
        $('.form-top-mask').fadeOut(100)
    })
    //点击添加绘制围栏按钮
    $('.add_fence_button').click(function () {
        //layer.msg('1111111111111111')
        $('.draw_fence').show()
        map.updateSize()
        map.removeLayer(vector_this)
        addInteractions()
        /*draw.on('drawend', function (e) {
            console.log('drawend');
        })*/
    })
    //关闭绘制围栏按钮
    $('.draw_fence_close').click(function () {
        /*new $Msg({
            content:"修改围栏成功！",
            type:"success",
        })*/
        $('.draw_fence').hide()
        map.removeInteraction(draw);
        map.removeInteraction(snap);
    })

    //绘制围栏
    var vector_this,source_res;
    //let fenceAddDate = {}
    $("input[name=huizhi]").click(function () {
        //console.log($(this).val());
        drawType = $(this).val();
        map.removeInteraction(draw);
        map.removeInteraction(snap);
        addInteractions();
    });

    //确认添加围栏
    var fenceAddDate = [{}]
    $('.insert_add_fence').click(function () {
        var getCoordinate = $.cookie('coordinate')
        getCoordinate = JSON.parse(getCoordinate)
        //形状
        if(getCoordinate.name == 'Circle'){
            fenceAddDate[0].shp_type = 0
        }else if(getCoordinate.name == 'Polygon'){
            fenceAddDate[0].shp_type = 1
        }
        //名称
        fenceAddDate[0].fence_name = $('input[name=add_fence_name]').val()
        //类型
        fenceAddDate[0].fence_type = $('select[name=fence_type]').val()
        //边界
        if (getCoordinate.name == 'Circle') {
            var feature = new ol.Feature({
                geometry: new ol.geom.Circle(getCoordinate.data[0], getCoordinate.data[1])
            })
            //console.log(getCoordinate.data)
            let a = getCoordinate.data[0][0]
            let b = getCoordinate.data[0][1]
            let c = getCoordinate.data[1]
            let circle_d = '' + a + ' '+ b + ','+ c
            fenceAddDate[0].fence_shp = 'CIRCLE((' + circle_d + '))'
        }
        else if (getCoordinate.name == 'Polygon') {
            var wkt = 'POLYGON((';
            getCoordinate.data[0].forEach((v, k) => {
                wkt += v[0] + " " + v[1];
                if (getCoordinate.data[0].length != k + 1) {
                    wkt += ", ";
                }
            });
            wkt += '))';
            let polygon_d = ''
            getCoordinate.data[0].forEach((v, k) => {
                polygon_d += v[0] + " " + v[1];
                if (getCoordinate.data[0].length != k + 1) {
                    polygon_d += ", ";
                }
                fenceAddDate[0].fence_shp = 'POLYGON((' + polygon_d + '))'
                //console.log(polygon_d)
            });

            var format = new ol.format.WKT();
            var feature = format.readFeature(wkt);
            var source = new ol.source.Vector({
                features: [feature]
            });
            source_res = source;

            vector_this = new ol.layer.Vector({
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
        }
        //时间
        fenceAddDate[0].start_time = $('#add_fence_start_time').val()
        fenceAddDate[0].end_time = $('#add_fence_end_time').val()

        getAjax(ajax_url+'cmict/fence/create', fenceAddDate, true, addFence, erraddFence)
    })

    //折叠面板
    layui.use(['element', 'layer'],function(){
        var element = layui.element;
        var layer = layui.layer
        $('.layui-colla-icon').text('')
        //监听折叠
        element.on('collapse', function (data) {
            //layer.msg('展开状态：' + data.show);
            if(data.show){
                $('.layui-colla-icon').text('')
                $('.layui-colla-icon').css({transform: 'translate(64px,6px) rotate(-90deg)'})
                $('.add_fence').css({background: "url(./image/funblock/add_fence_da.png) no-repeat",backgroundSize: "100% 100%"})
            }else{
                $('.layui-colla-icon').text('')
                $('.layui-colla-icon').css({transform: 'translate(64px,10px) rotate(90deg)'})
                $('.add_fence').css({background: "url(./image/funblock/add_fence_xiao.png) no-repeat",backgroundSize: "100% 100%"})
            }

        })
    })
    $('.close_add_fence').click(function () {
        $('.add_fence_wrap').hide()
        source.clear()
        $.cookie('coordinate', null)
        return false
    })

    //围栏列表
    getAjax(ajax_url+'cmict/fence/search', {"paging" : true,"page" : {
        "number" : 1,
            "size" : 10
    }}, true, getFence, errFunc)
    //创建围栏选择车辆的车辆列表
    getAjax(ajax_url+'cmict/vehicle/search', {}, true, getVehicle, errFunc)
    for(var i=0;i<20;i++){
        //console.log(i)
        /*$('.fence_list ul').append(`<li>
                <input id=myCheck${i} class="myCheck" type="checkbox"><label for=myCheck${i}></label>
                <div class="fence_list_right">
                    <p>9/9 12:00~9/10 13:00</p>
                    <p>围栏名称</p>
                    <p><span>可进不可出</span> <i class="fence_edit"></i></p>
                </div>

            </li>`)*/
        /*$('.add_fence_car_list').append(`<li>
                            <input id="add_fence_check${i}" class="myCheck" type="checkbox">
                            <label for="add_fence_check${i}"></label>
                            <div class="add_fence_car">
                                浙A123
                            </div>
                        </li>`)*/
    }

    function getFence(json) {
        console.log(json)
        var results = json.results
        for(let i=0;i<results.length;i++){
            $('.fence_list ul').append(`<li>
                <input id=myCheck${i} class="myCheck" type="checkbox" value=${results[i].fence_shp}>
                <label for=myCheck${i}></label>
                <div class="fence_list_right">
                    <p>
                        <span>${results[i].start_time.substr(5,11)}</span>~
                        <span>${results[i].end_time.substr(5,11)}</span>
                    </p>
                    <p>${results[i].fence_name}</p>
                    <p><span>可进不可出</span> <i class="fence_edit"></i></p>
                </div>

            </li>`)
        }
    }
    
    function getVehicle(json) {
        //console.log(json)
        var results = json.results
        for(let i=0;i<results.length;i++){
            $('.add_fence_car_list').append(`<li>
                            <input id="add_fence_check${i}" class="myCheck" type="checkbox">
                            <label for="add_fence_check${i}"></label>
                            <div class="add_fence_car">
                                ${results[i].vehicle_number}
                            </div>
                        </li>`)
        }
    }

    function addFence(json) {
        console.log(json)
    }
    function erraddFence(json) {
        console.log(json)
    }

    var auxiliaryParam = new auxiliary();

    var mapRegion = new region();
    mapRegion.init({
        'auxiliary':auxiliaryParam
        ,"businessCache" : businessCache
        ,'addLayer': true
        ,"map" : map
    })

    /* POLYGON((经度 纬度,经度 纬度...)) */
    //var POLYGON = "POLYGON((116.697090000503 41.0214099998717,116.677620000163 40.9718100004312,116.724510000536 40.9293999998102,116.713609999702 40.9100499996079,116.782640000336 40.8735099998867,116.805590000178 40.8405200001979,116.820809999682 40.848280000122,116.856029999685 40.8351499998726,116.886430000444 40.8010599998192,116.898170000445 40.7769600000041,116.923620000463 40.7736799998322,116.926520000198 40.7447199998282,116.964849999728 40.7094199997332,117.004430000244 40.6966499998976,117.112100000315 40.7070100001115,117.261540000271 40.6811500000725,117.292 40.6599700000155,117.406429999945 40.6862299996148,117.505820000393 40.667379999987,117.503079999942 40.645580000117,117.501190000019 40.6363099998067,117.471980000177 40.6470499995579,117.422510000436 40.637740000101,117.413699999755 40.606420000083,117.429990000038 40.57896,117.419939999731 40.5688499996279,117.389430000194 40.5613599995644,117.350299999745 40.5798699997008,117.310530000359 40.5764999998751,117.249740000201 40.54832999943,117.260279999722 40.5193199998182,117.210040000446 40.5066500000975,117.23480000012 40.4579499998926,117.26347000024 40.4411999999801,117.234209999892 40.4167299992901,117.240360000214 40.3943299996298,117.223679999932 40.3754499995179,117.275040000496 40.3323399998912,117.274390000198 40.3089099994969,117.295820000093 40.2783599999141,117.336589999729 40.2775999999401,117.342320000468 40.2440499996079,117.390290000283 40.2270899999037,117.380349999653 40.192189999369,117.405320000018 40.1847499998127,117.35367000047 40.1729999993505,117.345349999903 40.142340000091,117.31180000047 40.1394899999635,117.269509999987 40.1118899997238,117.250139999761 40.1194999999251,117.212960000204 40.09672999939,117.17667000032 40.0727699997358,117.063340000041 40.062269999361,117.025160000234 40.0326199999131,116.962330000429 40.0516299997248,116.872750000013 40.0404599999291,116.850170000145 40.0547099996668,116.823510000086 40.0474799999022,116.823269999811 40.0284999996753,116.785230000164 40.0345499998826,116.773379999587 40.0154599999791,116.756700000205 39.9614300003943,116.779099999865 39.9561600001839,116.791659999909 39.8850800003419,116.819969999616 39.8900700002303,116.89719999978 39.8328500001274,116.908090000153 39.8304599996293,116.905710000117 39.8520899997537,116.916099999915 39.8479500003923,116.952320000168 39.7832299997647,116.919939999831 39.7798799999621,116.899499999725 39.7590600003189,116.911820000393 39.7317099999166,116.88299999965 39.7164500003673,116.90567 39.6868200000431,116.90659999979 39.6766,116.855890000423 39.6675699999555,116.831310000057 39.6429899995889,116.841220000203 39.6241300003992,116.812520000498 39.6158499998776,116.780300000345 39.5939899999385,116.764 39.61478,116.725730000139 39.6167500000125,116.706179999707 39.6099700003154,116.72647 39.5929899996887,116.653650000047 39.6055000001249,116.629760000024 39.593740000101,116.602319999968 39.6220499998077,116.579300000495 39.6235000001249,116.568789999659 39.6042099999915,116.524490000014 39.5967700004353,116.527159999934 39.5730900002034,116.505959999854 39.5552799999721,116.434770000335 39.5164400003058,116.407020000373 39.523300000095,116.448289999684 39.4764600002289,116.451050000157 39.4468499999276,116.344830000404 39.4483299998297,116.246139999861 39.5161299994999,116.24420000033 39.5465199997982,116.221520000348 39.5791900000185,116.05152999971 39.5711299997497,116.015680000332 39.5877600004237,115.99512999965 39.5769399996813,115.984480000452 39.5948399995664,115.976569999906 39.5705000003748,115.960149999923 39.5656400001859,115.913379999687 39.5994699999406,115.912480000452 39.5730599997193,115.887369999926 39.5508899998736,115.828420000083 39.5414200002329,115.827140000411 39.5125699999056,115.768500000475 39.5127799996973,115.751530000309 39.5129500003423,115.717819999793 39.5613399997412,115.690359999714 39.5677100003163,115.685460000379 39.6033200003179,115.574530000159 39.5911599998342,115.545619999763 39.6188899997737,115.530079999892 39.6123700003753,115.506889999774 39.6520799996923,115.478640000136 39.6504599996294,115.499769999686 39.691520000048,115.492319999668 39.7387800003967,115.447290000533 39.7492700003103,115.439830000054 39.7833499999026,115.483580000417 39.7986900004432,115.506750000512 39.7833099998567,115.552289999784 39.7949800002269,115.56927000041 39.8134399998561,115.51080000022 39.8447999999201,115.529480000102 39.8761199999381,115.509140000111 39.8842200002528,115.52117 39.9015299999096,115.476139999961 39.9371399999111,115.426280000222 39.9510799997422,115.426140000061 39.9791799996573,115.448120000138 39.9932799996724,115.452809999682 40.0231999998802,115.509559999694 40.0654399998562,115.57607000013 40.1025400002209,115.603490000163 40.0935900002784,115.61193 40.1170799998422,115.650920000258 40.1173800001869,115.687550000532 40.1386200003128,115.74792999977 40.1347200003278,115.756890000173 40.1638700001005,115.777950000092 40.177520000048,115.806910000097 40.1529399996813,115.853709999917 40.1492300003643,115.844410000022 40.1681299995999,115.872170000445 40.1873599996643,115.898790000458 40.2355299997098,115.966429999945 40.2656100001015,115.916320000368 40.3668300004043,115.876249999738 40.3582899995839,115.818280000122 40.386419999983,115.805140000311 40.4200199999231,115.772209999792 40.4496599998092,115.777370000325 40.4862300000145,115.745680000332 40.4923299998297,115.74059999989 40.5130199997733,115.754590000228 40.5399699997158,115.82160000034 40.5634200001329,115.827630000524 40.5875899995789,115.888230000015 40.5965299999596,115.90974 40.6184600004288,115.972469999691 40.6015199998482,115.982339999791 40.5791200001879,116.00287000045 40.5757900004082,116.019919999808 40.5985299995599,116.111180000357 40.6162199996533,116.1138700003 40.6490100000116,116.165439999756 40.6677900000085,116.180880000412 40.7125999997902,116.210250000437 40.721379999987,116.247910000546 40.7918699996008,116.27419999973 40.7634100001714,116.30760000034 40.7524399997063,116.321840000516 40.7724000001599,116.410450000267 40.779460000179,116.415970000315 40.762120000038,116.465560000194 40.7726000003898,116.43820000023 40.8183300003293,116.334360000514 40.9058599997392,116.341030000534 40.9309799998272,116.365970000415 40.94300000015,116.40207000053 40.9055200002479,116.474280000322 40.8973399998412,116.447910000146 40.9544900003134,116.4638700005 40.9845699998057,116.516759999674 40.9754100000716,116.56008 40.992980000027,116.59979999977 40.9754300000945,116.621879999962 41.0158600002389,116.616130000099 41.0529399996813,116.631130000249 41.0605600003438,116.689449999818 41.0445700004052,116.697090000503 41.0214099998717))"

    var POLYGON = "POLYGON((1.2675957277914975E7 2570565.3179448075,1.267598355314345E7 2570484.1036022548,1.2676110151971545E7 2570529.488087799,1.2676091042714475E7 2570613.0910874857,1.2675957277914975E7 2570565.3179448075))"

    //var coordinate = map.getEventCoordinate(e);
    var lonlat= ol.proj.transform(POLYGON ,'EPSG:3857' ,'EPSG:4326');

    var mapData = {
        datas:[{
            id: "650500",
            wkt: lonlat,
            v:{ legend_index: 0 }
        }],
        legend : [{c: "#d73027", n: "测试数据"}]
    }

    mapRegion.build(mapData);
})

