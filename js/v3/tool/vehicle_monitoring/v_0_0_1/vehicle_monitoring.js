(function(){
	
	/**
	 * 求两个数组的差集
	 * [1,2].diff([2,3])  -> [1]
	 */
	Array.prototype.diff = function(a) {
		var arr = this.filter(function(i) {
			return a.indexOf(i) < 0;
		});
		if(arr.toString()===this.toString())arr = []; 
		return arr;
	};
	
	/**
	 * 车辆监控： 实时获取版本
	 */
	vehicleMonitoring = function(){
		var t = this;
		// 后台请求数据的地址，暂时只支持geojson
		t.getDataUrl = null;
		// 毫秒，每次请求数据并刷新数据的时间
		t.taskTime = 1000;
		// draw部分没有数据更新可保持的时间
		t.stopRemoveTime = 5*60*1000;
		// line最大的组成点个数
		t.lineMaxSize = 5;
		// map地图对象
		t.map = null;
		// 自定义线的颜色
		t.lineColor = ["#FF9800","#3f51b5","#2196f3","#8bc34a","#009688"]
		// 是否是测试示例
		t.isTest = false;
		// 图层(不能自定义)
		t.layers = {
			pointLayer: null
			,lineLayer: null
		}
	}
	
	/**
	 * 初始化
	 */
	vehicleMonitoring.prototype.init = function(param){
		var t = this;
		for(var key in param){
			t[key] = param[key];
		}
		initLayers(t);
	}
	
	/**
	 * 初始化layers
	 */
	var initLayers = function(t){
		t.layers.pointLayer = new ol.layer.Vector({
			source : new ol.source.Vector({
				features : []
			})
		});
		t.layers.lineLayer = new ol.layer.Vector({
			source : new ol.source.Vector({
				features : []
			})
		});
		t.layers.pointLayer.setZIndex(5);
		t.layers.lineLayer.setZIndex(1);
		t.map.addLayer(t.layers.pointLayer);
		t.map.addLayer(t.layers.lineLayer);
	}
	
	/**
	 * 删除
	 */
	vehicleMonitoring.prototype.remove = function(){
		var t = this;
		clearInterval(t.timing);
		t.map.removeLayer(t.layers.pointLayer);
		t.map.removeLayer(t.layers.lineLayer);
	}
	
	/**
	 * 停止
	 */
	vehicleMonitoring.prototype.stop = function(){
		var t = this;
		clearInterval(t.timing);
	}
	
	/**
	 * 启动
	 */
	vehicleMonitoring.prototype.refresh = function(){
		
		// 处理成key:value形式，避免多次循环查找
		var featureMapHandle = function(features){
			var map = {}, idArr = [] ,feature = null, id = null; 
			for(var i = 0 , j = features.length; i < j; i++){
				feature = features[i];
				id = feature.get("id").toString();
				map[id] = feature;
				idArr.push(id);
			}
			return {data:map,ids:idArr};
		}
		
		// 创建点
		var createPoint = function(vectorSource,feature){
			var rotation = feature.get("rotation");
			var scale = feature.get("scale");
			var src = feature.get("src");
			feature.setStyle(new ol.style.Style({
				image: new ol.style.Icon({
					rotateWithView: true,
					rotation: rotation,
					scale: scale,
					src: src
				})
			}));
			vectorSource.addFeature(feature);
		}
		
		// 刷新点
		var refreshPoint = function(oldF,newF){
			// 修改样式
			var rotation = newF.get("rotation");
			var scale = newF.get("scale");
			var newImg = oldF.getStyle().getImage();
			newImg.setRotation(rotation);
			newImg.setScale(scale);
			oldF.setStyle(new ol.style.Style({
				image: newImg
			}));
			// 修改位置
			var oGeometry = oldF.getGeometry();
			oGeometry.setCoordinates(newF.getGeometry().getCoordinates())
			oldF.setGeometry(oGeometry);
		}
		
		// 创建线
		var createLine = function(vectorSource,feature,t){
			var index = feature.get("colorNum");
			var coordinates = feature.getGeometry().getCoordinates();
			var line = new ol.Feature({
				id: feature.get("id"),
				geometry:new ol.geom.LineString(
					[coordinates,coordinates]
				)
			});
			line.setStyle(new ol.style.Style({
				stroke: new ol.style.Stroke({
					width: 3,
					color: t.lineColor[index]
				})
			}));
			vectorSource.addFeature(line);
		}
		
		// 刷新线
		var refreshLine = function(oldF,newF){
			var nC = newF.getGeometry().getCoordinates();
			var oC = oldF.getGeometry().getCoordinates();
			if(t.lineMaxSize===oC.length){
				 oC.splice(0,1);
			}
			oC.push(nC);
			var oGeometry = oldF.getGeometry();
			oGeometry.setCoordinates(oC)
			oldF.setGeometry(oGeometry);
		}
		
		/**
		 * 刷新数据
		 */
		var refreshData = function(newMap,pMap,lMap,pSour,lSour,t){
			var boolParam = null
			,newFeature = null
			,point = null
			,line = null;
			for(var key in newMap){
				boolParam = pMap[key];
				newFeature = newMap[key];
				if(null!==boolParam&&undefined!==boolParam){
					// 表明有，刷新状态
					point = pMap[key];
					line = lMap[key];
					refreshPoint(point,newFeature);
					refreshLine(line,newFeature);
				}else{
					// 没有，新创建
					createPoint(pSour,newFeature);
					createLine(lSour,newFeature,t);
				}
			}
		}
		
		// 处理停止更新的绘画
		var handleStopDraw = function(DSArr,pMap,lMap,pSour,lSour,t){
			if(null!==DSArr&&undefined!==DSArr
				&&DSArr.length>0){
				var id = null
				,pF = null
				,lF = null
				,time = new Date().getTime();
				for(var i = 0 , j = DSArr.length; i < j ; i++){
					id = DSArr[i];
					pF = pMap[id];
					lF = pMap[id];
					var srt = pF.get("stopRemoveTime");
					if(null===srt||undefined===srt){
						pF.set("stopRemoveTime",time);
						lF.set("stopRemoveTime",time);
					}else{
						var diff = time - srt;
						if(diff > t.stopRemoveTime||diff===t.stopRemoveTime){
							pSour.removeFeature(pF);
							lSour.removeFeature(lF);
						}
					}
				}
			}
		}
		
		var t = this;
		var task = function(){
			var features = t.isTest ? testFeature() : getFeatures(t.getDataUrl);
			if(null!==features&&undefined!==features&&features.length>0){
				var pointVector = t.layers.pointLayer
				,pointSource = pointVector.getSource()
				,lineVector = t.layers.lineLayer
				,lineSource = lineVector.getSource()
				,newMapParam = featureMapHandle(features)
				,newFeatureMap = newMapParam.data
				,newArr = newMapParam.ids
				,pointMapParam = featureMapHandle(pointSource.getFeatures())
				,pointFeatureMap = pointMapParam.data
				,pointArr = pointMapParam.ids
				,lineFeatureMap = featureMapHandle(lineSource.getFeatures()).data
				// feature中这次没更新的id
				,differenceSetArr = pointArr.diff(newArr);
				
				// 更新数据
				refreshData(newFeatureMap,pointFeatureMap
					,lineFeatureMap,pointSource,lineSource,t);
				handleStopDraw(differenceSetArr,pointFeatureMap
					,lineFeatureMap,pointSource,lineSource,t)
					
			}
			t.map.getView().fit(t.layers.lineLayer.getSource().getExtent());	
		}
		// task();
		t.timing = setInterval(task, t.taskTime);
	}

	var lonlat = [116.4, 39.9];
	var lonlat2 = [116.3888, 39.8888];
	var indexParam = 0;
	var testFeature = function(){
		var l2,l3;
		var p = 0.006;
		var rotation = parseInt(Math.PI * ((Math.random()*360) % 360 / 360) * 2);
		if(indexParam%2>0){
			lonlat[0] = lonlat[0] + p;
			lonlat2[0] = lonlat2[0] + p;
		}else{
			lonlat[1] = lonlat[1] + p;
			lonlat2[1] = lonlat2[1] + p;
		}
		// 经纬度转换
		l2 = createPoint(lonlat[0], lonlat[1]);
		l3 = createPoint(lonlat2[0], lonlat2[1]);
		++indexParam;
		var point1 = new ol.Feature({
			id: "1",
			geometry : new ol.geom.Point(l2),
			population : 4000,
			rainfall : 500,
			rotation : rotation,
			scale : 1,
			colorNum: 2, 
			src : "img/2.png"
		});
		var point2 = new ol.Feature({
			id: "2",
			geometry : new ol.geom.Point(l3),
			population : 4000,
			rainfall : 500,
			rotation : rotation,
			scale : 1,
			colorNum: 1, 
			src : "img/3.png"
		});
		return [point1,point2];
	}
	
	// 将经纬度转换成openlayers默认坐标系
	function createPoint(lon , lat){
		return ol.proj.fromLonLat([lon , lat]);
	}
	
	/**
	 * 从后端获取点数据
	 */
	var refreshDataBool = true;
	var getFeatures = function(url){
		var features = null;
		// 这是为了处理有些请求特别慢超过定时时间
		if(refreshDataBool){
			var refreshDataBool = false;
			var xhr = new XMLHttpRequest();
			xhr.open("get", url, false);
			xhr.send();
			if (xhr.status == 200) {
				features = (new ol.format.GeoJSON({
					dataProjection : 'EPSG:4326',
					featureProjection : 'EPSG:3857'
				})).readFeatures(xhr.responseText);
			}
			refreshDataBool = true;
		}
		return features;
	}
	
	/**
	 * 获取指定feature
	 */
	var getFeature = function(vector,id){
		var result = null
		,features = vector.getSource().getFeatures()
		,feature = null
		,fId = null;
		for(var i = 0 , j = features.length; i < j ; i++){
			feature = features[i];
			fId = feature.get("id");
			if(null!==fId&&undefined!==fId){
				if(id.toString()===fId.toString()){
					result = feature;
					break;
				}
			}
		}
		return result;
	}
	
})(jQuery);