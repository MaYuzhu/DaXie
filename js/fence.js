
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
            fenceAddDate[0].shp_type = 1
        }else if(getCoordinate.name == 'Polygon'){
            fenceAddDate[0].shp_type = 2
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
            /*getCoordinate.data[0].forEach((v, k) => {
                wkt += v[0] + " " + v[1];
                if (getCoordinate.data[0].length != k + 1) {
                    wkt += ", ";
                }
            });*/
            //ol.proj.transform([113.87346268, 22.48496128], 'EPSG:4326', 'EPSG:3857');
            getCoordinate.data[0].forEach((v, k) => {
                var ol_ep =  ol.proj.transform([v[0],v[1]], 'EPSG:3857', 'EPSG:4326')
                //console.log([v[0],v[1]])
                //console.log(ol_ep)
                wkt += ol_ep[0] + ' ' + ol_ep[1]
                if (getCoordinate.data[0].length != k + 1) {
                    wkt += ", ";
                }
            });
            wkt += '))';
            let polygon_d = ''
            getCoordinate.data[0].forEach((v, k) => {
                var ol_ep =  ol.proj.transform([v[0],v[1]], 'EPSG:3857', 'EPSG:4326')
                polygon_d += ol_ep[0] + " " + ol_ep[1];
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
        //围栏限制的车辆
        // "vehicles" : [ {
        //      "vehicle_id" : 8
        //  } ],
        fenceAddDate[0].vehicles = []
        $("input[class='myCheckCar']:checked").each(function(i){
            fenceAddDate[0].vehicles.push({vehicle_id:$(this).attr('vehicle_id')*1})
        })

        if(!fenceAddDate[0].fence_name){
            layer.msg('请填写围栏名称')
            return false
        }
        if(!fenceAddDate[0].start_time){
            layer.msg('请选择开始时间')
            return false
        }
        if(!fenceAddDate[0].end_time){
            layer.msg('请选择结束时间')
            return false
        }

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
    //关闭围栏框
    $('.close_add_fence').click(function () {
        $('.add_fence_wrap').hide()
        source.clear()
        $.cookie('coordinate', null)
        return false
    })

    //围栏列表
    var getFenceListData = {
        "paging" : true,
        "page" : {
            "number" : 1,
            "size" : 10
        }
    }
    var total_page
    getAjax(ajax_url+'cmict/fence/search', getFenceListData, true, getFence, errFunc)
    //围栏列表翻页（懒加载）
    $('.fence_list').scroll(function() {
        if ($('.fence_list').scrollTop() >= $('.fence_list>ul').height() - $('.fence_list').height()) {
            //alert("滚动条已经到达底部为" + $('.fence_list').scrollTop());
            getFenceListData.page.number++
            if(getFenceListData.page.number>total_page){
                return false
            }
            getAjax(ajax_url+'cmict/fence/search', getFenceListData, true, getFenceAdd, errFunc)
        }
    });

    //创建围栏选择车辆的车辆列表
    getAjax(ajax_url+'cmict/vehicle/search', {}, true, getVehicle, errFunc)

    //获取围栏列表
    function getFence(json) {
        //console.log(json)
        total_page = json.total_page
        $('.fence_list ul').empty()
        var results = json.results
        for(let i=0;i<results.length;i++){
            $('.fence_list ul').append(`<li>
                <input id=${results[i].fence_id} class="myCheck" type="checkbox" 
                    value='${results[i].fence_shp}' fence_id=${results[i].fence_id}>
                <label for=${results[i].fence_id}></label>
                <div class="fence_list_right">
                    <p>
                        <span>${results[i].start_time.substr(5,11)}</span>~
                        <span>${results[i].end_time.substr(5,11)}</span>
                    </p>
                    <p>${results[i].fence_name}</p>
                    <p>
                        <span class="h">${results[i].fence_type==1?'可进不可出':results[i].fence_type==2?'可出不可进':'不可出不可进'}</span> 
                        <i class="fence_edit"></i>
                    </p>
                </div>

            </li>`)
        }
        //回显围栏
        showFence()
    }
    //围栏列表翻页
    function getFenceAdd(json) {
        var results = json.results
        for(let i=0;i<results.length;i++){
            $('.fence_list ul').append(`<li>
                <input id=${results[i].fence_id} class="myCheck" type="checkbox" 
                    value='${results[i].fence_shp}' fence_id=${results[i].fence_id}>
                <label for=${results[i].fence_id}></label>
                <div class="fence_list_right">
                    <p>
                        <span>${results[i].start_time.substr(5,11)}</span>~
                        <span>${results[i].end_time.substr(5,11)}</span>
                    </p>
                    <p>${results[i].fence_name}</p>
                    <p>
                        <span class="h">${results[i].fence_type==1?'可进不可出':results[i].fence_type==2?'可出不可进':'不可出不可进'}</span> 
                        <i class="fence_edit"></i>
                    </p>
                </div>

            </li>`)
        }
        //回显围栏
        showFence()
    }

    //车辆列表
    function getVehicle(json) {
        //console.log(json)
        $('.add_fence_car_list').empty()
        var results = json.results
        for(let i=0;i<results.length;i++){
            $('.add_fence_car_list').append(`<li>
                            <input id="add_fence_check${i}" class="myCheckCar" 
                            type="checkbox" vehicle_id=${results[i].vehicle_id}>
                            <label for="add_fence_check${i}"></label>
                            <div class="add_fence_car">
                                ${results[i].vehicle_number}
                            </div>
                        </li>`)
        }
    }

    //添加成功
    function addFence(json) {
        //console.log(json)
        if(json){
            layer.msg('添加成功！')
            getAjax(ajax_url+'cmict/fence/search', {"paging" : false,"page" : {
                    "number" : 1,
                    "size" : 10
                }}, true, getFence, errFunc)
            $('.add_fence_wrap').hide()
            source.clear()
            $.cookie('coordinate', null)
        }
    }
    function erraddFence(json) {
        console.log(json)
    }

    //地图显示围栏
    function showFence() {
        var s = $("input[class='myCheck']");
        s.each(function(i){
            $(this).click(function(){
                var POLYGON_fence = this.value
                var fence_id = this.id;
                //console.log(POLYGON_fence)
                var format = new ol.format.WKT();
                //var feature = format.readFeature(POLYGON_fence);
                var feature = format.readFeature(POLYGON_fence,{
                    dataProjection: 'EPSG:4326',
                    featureProjection: 'EPSG:3857'
                });
                feature.setId(fence_id);
                //source.addFeature(feature);
                if($(this).is(":checked")){
                    source.addFeature(feature);
                }else {
                    //source.getFeatureById(fence_id)
                    source.removeFeature(source.getFeatureById(fence_id));
                }
            });
        });

    }

    //删除围栏
    $('.remove_fence_button').click(function () {
        var ids = [];
        $("input[class='myCheck']:checked").each(function(i){
            ids.push($(this).attr('fence_id')*1)
        })
        //console.log(ids)
        new $Msg({
            content:'确定删除这些围栏吗？',
            type:"success",
            confirm: function(){
                getAjax(ajax_url+'cmict/fence/remove', ids, true, removeFenceS, errFunc)
            }
        })
    })

    function removeFenceS(json) {
        if(json){
            layer.msg('删除成功！')
            var ids_del = [];
            $("input[class='myCheck']:checked").each(function(i){
                ids_del.push($(this).attr('id'))
            })
            for(let i=0;i<ids_del.length;i++){
                source.removeFeature(source.getFeatureById(ids_del[i]));
            }

            getAjax(ajax_url+'cmict/fence/search', {"paging" : false,"page" : {
                    "number" : 1,
                    "size" : 10
                }}, true, getFence, errFunc)
        }
    }


})

