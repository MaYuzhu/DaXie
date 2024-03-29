//测距 ranging
$(function () {

    var source_ranging = new ol.source.Vector(); //图层数据源
    var vector_ranging = new ol.layer.Vector({
        source: source_ranging,
        style:new ol.style.Style({
            fill:new ol.style.Fill({
                color: 'rgba(255,15,200,0.2)'
            }),
            stroke:new ol.style.Stroke({
                color: '#f2412e',
                width:3
            }),
            image:new ol.style.Circle({
                radius: 7,
                fill: new ol.style.Fill({
                    color: '#ff09f1'
                })
            })
        })
        /*style: new ol.style.Style({ //图层样式
            fill: new ol.style.Fill({
                color: 'rgba(255, 0, 255, 0.2)' //填充颜色
            }),
            stroke: new ol.style.Stroke({
                color: '#ff2a44', //边框颜色
                width: 2 // 边框宽度
            }),
            image: new ol.style.Circle({
                radius: 7,
                fill: new ol.style.Fill({
                    color: '#3824ff'
                })
            })
        })*/
    });
    map.addLayer(vector_ranging);

    $('.ranging').click(function () {
        addInteraction_ranging()
        map.on('pointermove', pointerMoveHandler);
        $('.clear_ranging_line').click()
    })

    var geodesicCheckbox = document.getElementById('geodesic'); //测地学方式对象
    var typeSelect = document.getElementById('type'); //测量类型对象
    var draw_ranging; // global so we can remove it later
    typeSelect.onchange = function(e) {
        map.removeInteraction(draw_ranging); //移除绘制图形
        addInteraction_ranging(); //添加绘图进行测量
    };
    //addInteraction_ranging();    //调用加载绘制交互控件的方法，添加绘图进行测量


    /**
     * 加载交互绘制控件函数
     */
    var sketch
    var helpTooltip /*= new ol.Overlay({
        element: helpTooltipElement,
        offset: [15, 0],
        positioning: 'center-left'
    });*/
    var helpTooltipElement //= document.createElement('div');
    var measureTooltipElement
    /**
     * 鼠标移动事件处理函数
     * @param {ol.MapBrowserEvent} evt
     */
    var pointerMoveHandler = function(evt) {
        if (evt.dragging) {
            return;
        }
        /** @type {string} */
        var helpMsg = '开始绘制'; //当前默认提示信息
        //判断绘制几何类型设置相应的帮助提示信息
        if (sketch) {
            var geom = (sketch.getGeometry());
            if (geom instanceof ol.geom.Polygon) {
                helpMsg = continuePolygonMsg; //绘制多边形时提示相应内容
            } else if (geom instanceof ol.geom.LineString) {
                helpMsg = continueLineMsg; //绘制线时提示相应内容
            }
        }
        helpTooltipElement.innerHTML = helpMsg; //将提示信息设置到对话框中显示
        helpTooltip.setPosition(evt.coordinate); //设置帮助提示框的位置
        $(helpTooltipElement).removeClass('hidden'); //移除帮助提示框的隐藏样式进行显示
    };
    function addInteraction_ranging() {
        //map.on('pointermove', pointerMoveHandler); //地图容器绑定鼠标移动事件，动态显示帮助提示框内容
        var type = (typeSelect.value == 'area' ? 'Polygon' : 'LineString');
        //var type = 'LineString';
        draw_ranging = new ol.interaction.Draw({
            source: source_ranging, //测量绘制层数据源
            type: /** @type {ol.geom.GeometryType} */ (type), //几何图形类型
            style: new ol.style.Style({ //绘制几何图形的样式
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 0.2)'
                }),
                stroke: new ol.style.Stroke({
                    color: 'rgba(255, 0, 0, 0.5)',
                    lineDash: [10, 10],
                    width: 2
                }),
                image: new ol.style.Circle({
                    radius: 5,
                    stroke: new ol.style.Stroke({
                        color: 'rgba(0, 0, 0, 0.7)'
                    }),
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 255, 255, 0.2)'
                    })
                })
            })
        });
        map.addInteraction(draw_ranging);

        createMeasureTooltip(); //创建测量工具提示框
        createHelpTooltip(); //创建帮助提示框

        var listener;
        //绑定交互绘制工具开始绘制的事件
        draw_ranging.on('drawstart',
            function(evt) {
                // set sketch
                sketch = evt.feature; //绘制的要素

                /** @type {ol.Coordinate|undefined} */
                var tooltipCoord = evt.coordinate; // 绘制的坐标
                //绑定change事件，根据绘制几何类型得到测量长度值或面积值，并将其设置到测量工具提示框中显示
                listener = sketch.getGeometry().on('change', function(evt) {
                    var geom = evt.target; //绘制几何要素
                    var output;
                    if (geom instanceof ol.geom.Polygon) {
                        output = formatArea( /** @type {ol.geom.Polygon} */ (geom)); //面积值
                        tooltipCoord = geom.getInteriorPoint().getCoordinates(); //坐标
                    } else if (geom instanceof ol.geom.LineString) {
                        output = formatLength( /** @type {ol.geom.LineString} */ (geom)); //长度值
                        tooltipCoord = geom.getLastCoordinate(); //坐标
                    }
                    measureTooltipElement.innerHTML = output; //将测量值设置到测量工具提示框中显示
                    measureTooltip.setPosition(tooltipCoord); //设置测量工具提示框的显示位置
                });
            }, this);
        //绑定交互绘制工具结束绘制的事件
        draw_ranging.on('drawend',
            function(evt) {
                measureTooltipElement.className = 'tooltip tooltip-static'; //设置测量提示框的样式
                measureTooltip.setOffset([0, -7]);
                // unset sketch
                sketch = null; //置空当前绘制的要素对象
                // unset tooltip so that a new one can be created
                measureTooltipElement = null; //置空测量工具提示框对象
                createMeasureTooltip(); //重新创建一个测试工具提示框显示结果
                $('.tooltip-static').append('<i class="clear_ranging_line"></i>')
                ol.Observable.unByKey(listener);
                map.removeInteraction(draw_ranging);
                map.removeEventListener('pointermove')
                $('.clear_ranging_line').click(function () {
                    //vector_ranging.getSource().removeFeature(evt.feature)
                    vector_ranging.getSource().clear();
                    $('.ol-overlay-container').hide()
                })
            }, this);

    }

    function createHelpTooltip() {
        if (helpTooltipElement) {
            helpTooltipElement.parentNode.removeChild(helpTooltipElement);
        }
        helpTooltipElement = document.createElement('div');
        helpTooltipElement.className = 'tooltip hidden';
        helpTooltip = new ol.Overlay({
            element: helpTooltipElement,
            offset: [15, 0],
            positioning: 'center-left'
        });
        map.addOverlay(helpTooltip);
    }
    /**
     *创建一个新的测量工具提示框（tooltip）
     */
    function createMeasureTooltip() {
        if (measureTooltipElement) {
            measureTooltipElement.parentNode.removeChild(measureTooltipElement);
        }
        measureTooltipElement = document.createElement('div');
        measureTooltipElement.className = 'tooltip tooltip-measure';
        measureTooltip = new ol.Overlay({
            element: measureTooltipElement,
            offset: [0, -15],
            positioning: 'bottom-center'
        });
        map.addOverlay(measureTooltip);
    }
    /**
     * 测量长度输出
     * @param {ol.geom.LineString} line
     * @return {string}
     */
    var formatLength = function(line) {
        var length;
        if (geodesicCheckbox.checked) { //若使用测地学方法测量
            var coordinates = line.getCoordinates(); //解析线的坐标
            length = 0;
            var sourceProj = map.getView().getProjection(); //地图数据源投影坐标系
            //通过遍历坐标计算两点之前距离，进而得到整条线的长度
            for (var i = 0, ii = coordinates.length - 1; i < ii; ++i) {
                var c1 = ol.proj.transform(coordinates[i], sourceProj, 'EPSG:4326');
                var c2 = ol.proj.transform(coordinates[i + 1], sourceProj, 'EPSG:4326');
                length += wgs84Sphere.haversineDistance(c1, c2);
            }
        } else {
            length = Math.round(line.getLength() * 100) / 100; //直接得到线的长度
        }
        var output;
        if (length > 100) {
            output = (Math.round(length / 1000 * 100) / 100) + ' ' + 'km'; //换算成KM单位
        } else {
            output = (Math.round(length * 100) / 100) + ' ' + 'm'; //m为单位
        }
        return output; //返回线的长度
    };
    /**
     * 测量面积输出
     * @param {ol.geom.Polygon} polygon
     * @return {string}
     */
    var formatArea = function(polygon) {
        var area;
        if (geodesicCheckbox.checked) { //若使用测地学方法测量
            var sourceProj = map.getView().getProjection(); //地图数据源投影坐标系
            var geom = /** @type {ol.geom.Polygon} */ (polygon.clone().transform(sourceProj, 'EPSG:4326')); //将多边形要素坐标系投影为EPSG:4326
            var coordinates = geom.getLinearRing(0).getCoordinates(); //解析多边形的坐标值
            area = Math.abs(wgs84Sphere.geodesicArea(coordinates)); //获取面积
        } else {
            area = polygon.getArea(); //直接获取多边形的面积
        }
        var output;
        if (area > 10000) {
            output = (Math.round(area / 1000000 * 100) / 100) + ' ' + 'km<sup>2</sup>'; //换算成KM单位
        } else {
            output = (Math.round(area * 100) / 100) + ' ' + 'm<sup>2</sup>'; //m为单位
        }
        return output; //返回多边形的面积
    };

    //addInteraction(); //调用加载绘制交互控件方法，添加绘图进行测量
    /**
     *  当用户正在绘制多边形时的提示信息文本
     * @type {string}
     */
    var continuePolygonMsg = '单击继续绘制多边形';
    /**
     * 当用户正在绘制线时的提示信息文本
     * @type {string}
     */
    var continueLineMsg = '单击继续绘制线';


    //map.on('pointermove', pointerMoveHandler); //地图容器绑定鼠标移动事件，动态显示帮助提示框内容
    //地图绑定鼠标移出事件，鼠标移出时为帮助提示框设置隐藏样式
    $(map.getViewport()).on('mouseout', function() {
        $(helpTooltipElement).addClass('hidden');
    });

})

