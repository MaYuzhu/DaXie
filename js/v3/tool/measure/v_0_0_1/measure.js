(function(){
	
	var m = null;
	measure = function(){
		m = this;
		m.id = new Date().getTime()+Math.floor(Math.random()*100000)+"";
	}
	
	// 依赖注入
	measure.prototype.init = function(param){
		if(null === param || undefined === param)return;
		var t = this;
		for(var key in param){
			t[key] = param[key];
		}
		init_element(param);
	}
	
	// 打开测距功能
	measure.prototype.open = function(){
		m.draw.setActive(true);
	}
	
	// 关闭测距功能
	measure.prototype.close = function(){
		m.draw.setActive(false);
		m.clearDrawContent();
	}
	
	// 清除画的内容
	measure.prototype.clearDrawContent = function(){
		// 清理掉画的内容
		m.measureTooltip.setPosition(undefined);
		var vector = m.getVector(m.id);
		if(null !== vector && undefined !== vector){
			vector.getSource().clear();
		}
	}
	
	// 获取图层
	measure.prototype.getVector = function(ln){
		var ary = m.auxiliary ,vector,
		layers = m.map.getLayers().getArray();
		ary.arrForEach(layers,function(layer){
			var layerName = layer.get("layerName");
			if(ln!==layerName)return false;
			vector = layer;
			return true;
		})
		return vector;
	}
	
	// 工具栏元素
	// 方便后来其他工具元素创建复用
	var toolElement = function(pObj){
		var ary = sv.auxiliary , child = null;
		if(!ary.arrBool($(pObj))){
			var toolClass = "mapToolBox"
			child = $(pObj).children("."+toolClass);
			if(ary.arrBool($(child))){
				child = $('<div class="'+toolClass+'">');
				pObj.append(child);
			}
		}
		return child;
	}
	
	// 按钮元素
	// 方便后来其他工具元素创建复用
	var buttonElemnt = function(pObj,imgClass,title){
		var div = $('<div class="btn_acc_1" title="'+title+'">');
		var i = $('<i class="imgMax '+ imgClass +'">');
		pObj.append(div.append(i));
		return div;
	}
	
	// 0000001
	// 初始化元素
	var init_element = function(){
		// 在地图上添加工具栏
		var pObj = toolElement($(ms.even));
		// 在工具栏上添加功能按钮
		var btn = m.btn = buttonElemnt(pObj,"nestle_img28","测距");
		// 初始化画操作的环境
		initDraw();
		// 业务注入，默认只提供测距功能
		drawBusiness({'start':startBusiness,'end':endBusiness})
		// 功能按钮点击事件
		btn.children("i").click(function(){
			var t = $(this), type = t.attr("type");
			if("display" === type){
				m.close();
				t.attr("type","none");
			}
			if("none" === type || undefined === type){
				m.open();
				t.attr("type","display");
			}
		})
	}
	
	/**
	 * 画线时候的业务定义
	 */
	var drawBusiness = function(param){
		var start = param.start;
		var end = param.end;
		m.draw.on('drawstart', start);
		m.draw.on('drawend', end);
		m.draw.on('singleclick', function(){
			alert("sixgod");
		})
	}
	
	/**
	 * 画操作时候的业务定义
	 * 即
	 * 	当 测距 距离发生改变后触发的业务
	 */
	var startBusiness = function(evt){
		m.sketch = evt.feature;
		var tooltipCoord = evt.coordinate;
		m.listener = m.sketch.getGeometry().on('change',function(evt) {
			var geom = evt.target;
			var output = formatLength(geom);
			tooltipCoord = geom.getLastCoordinate();
			// 更新矢量图层并上距离数据和当前位置
			m.measureTooltipElement.innerHTML = output;
			m.measureTooltip.setPosition(tooltipCoord);
		});
	}
	
	/**
	 * 结束画操作时候的业务定义
	 * 即
	 * 	测距完成后打扫环境
	 */
	var endBusiness = function(evt){
		m.sketch = null;
		// 关闭图层  Geometry  的改变事件
		ol.Observable.unByKey(m.listener);
		// 关闭画操作，一次只能画一次
		m.draw.setActive(false);
	}
	
	/**
	 * 初始化绘画环境
	 */
	var initDraw = function(){
		initLayer();
		addControl();
		// 创建弹出框，用于展示测距的距离
		createMeasureTooltip();
		addDrawInteraction();
		// 默认关闭画操作
		m.draw.setActive(false);
	}
	
	/**
	 * 在新的图层上进行测距绘画
	 */
	var initLayer = function(){
		m.lineSource = new ol.source.Vector();
		var vector = new ol.layer.Vector({
			source : m.lineSource,
			// 这个样式是画完之后展示的样式
			style : new ol.style.Style({
				fill : new ol.style.Fill({
					color : 'rgba(255, 255, 255, 0.2)'
				}),
				stroke : new ol.style.Stroke({
					color : '#ffc00e',
					lineDash : [ 10, 10 ],
					width : 2
				}),
				image : new ol.style.Circle({
					radius : 7,
					fill : new ol.style.Fill({
						color : '#ffcc33'
					})
				})
			})
		});
		vector.set("layerName",m.id);
		m.map.addLayer(vector);
	}
	
	/**
	 * 添加比例尺控件
	 */
	var addControl = function(){
        var scaleLineControl = new ol.control.ScaleLine({
            units: 'metric',
            target: 'scalebar',
            className: 'ol-scale-line'
        });
        m.map.addControl(scaleLineControl);
	}
	
	
	/**
	 * 添加交互，即画操作
	 */
	var addDrawInteraction = function(){
		m.draw = new ol.interaction.Draw({
			source : m.lineSource,
			snapTolerance: 20,	// 吸附，默认12
			type : "LineString",
			// 这个样式是画的时候画操作的样式，不是最终样式
			style : new ol.style.Style({
				fill : new ol.style.Fill({
					color : 'rgba(255, 255, 255, 0.2)'
				}),
				stroke : new ol.style.Stroke({
					color : '268ff9',
					lineDash : [ 10, 10 ],
					width : 2
				}),
				image : new ol.style.Circle({
					radius : 5,
					stroke : new ol.style.Stroke({
						color : 'rgba(0, 0, 0, 0.7)'
					}),
					fill : new ol.style.Fill({
						color : 'rgba(255, 255, 255, 0.2)'
					})
				})
			})
		});
		m.map.addInteraction(m.draw);
	}
	
	/**
	 * 创建矢量图层
	 * 用于
	 * 	输出当前测距的距离
	 */
	createMeasureTooltip = function() {
		if (m.measureTooltipElement) {
			m.measureTooltipElement.parentNode.removeChild(measureTooltipElement);
		}
		m.measureTooltipElement = document.createElement('div');
		m.measureTooltipElement.className = 'tooltip tooltip-measure measurePopup';
		m.measureTooltip = new ol.Overlay({
			element : m.measureTooltipElement,
			offset : [ 0, -15 ],
			positioning : 'bottom-center'
		});
		m.map.addOverlay(m.measureTooltip);
	}
	
	/**
	 * 存储经纬度的对象
	 */
    var LngLat = function(longitude, latitude) {
        this.longitude = longitude;
        this.latitude = latitude;
    }
	
	/**
	 * 计算整个测距总体距离
	 */
	var formatLength = function(line) {
		// openlayers 3 计算点与点之间的距离
		var coordinates = line.getCoordinates();
		var length = 0;
		for( var i = 0,j = coordinates.length;i<j;i++ ){
			var first = coordinates[i];
			first= ol.proj.transform([first[0]*1 , first[1]*1],"EPSG:3857","EPSG:4326");
			var nextIndex = i+1;
			if( nextIndex<j ){
				var last = coordinates[nextIndex];
				last= ol.proj.transform([last[0]*1 , last[1]*1],"EPSG:3857","EPSG:4326");
				var firstObj = new LngLat(first[0],first[1]);
				var lastObj = new LngLat(last[0],last[1]);
				length += calculateLineDistance(firstObj,lastObj);
			}
		}
		var output;
		if (length > 100) {
			output = (Math.round(length / 1000 * 100) / 100) + ' ' + 'km';
		} else {
			output = (Math.round(length * 100) / 100) + ' ' + 'm';
		}
		return output;
	};
	
	/**
     * 计算两个经纬度之间的距离
     */
    var calculateLineDistance = function(start, end) {
        var d1 = 0.01745329251994329;
        var d2 = start.longitude;
        var d3 = start.latitude;
        var d4 = end.longitude;
        var d5 = end.latitude;
        d2 *= d1;
        d3 *= d1;
        d4 *= d1;
        d5 *= d1;
        var d6 = Math.sin(d2);
        var d7 = Math.sin(d3);
        var d8 = Math.cos(d2);
        var d9 = Math.cos(d3);
        var d10 = Math.sin(d4);
        var d11 = Math.sin(d5);
        var d12 = Math.cos(d4);
        var d13 = Math.cos(d5);
        var arrayOfDouble1 = [];
        var arrayOfDouble2 = [];
        arrayOfDouble1.push(d9 * d8);
        arrayOfDouble1.push(d9 * d6);
        arrayOfDouble1.push(d7);
        arrayOfDouble2.push(d13 * d12);
        arrayOfDouble2.push(d13 * d10);
        arrayOfDouble2.push(d11);
        var d14 = Math.sqrt((arrayOfDouble1[0] - arrayOfDouble2[0]) * (arrayOfDouble1[0] - arrayOfDouble2[0]) +
            (arrayOfDouble1[1] - arrayOfDouble2[1]) * (arrayOfDouble1[1] - arrayOfDouble2[1]) +
            (arrayOfDouble1[2] - arrayOfDouble2[2]) * (arrayOfDouble1[2] - arrayOfDouble2[2]));

        return(Math.asin(d14 / 2.0) * 12742001.579854401);
    }
	
})(jQuery);