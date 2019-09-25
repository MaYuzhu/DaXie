/**
 * OM openlayers Map
 * 地图画点对象
 */
(function(){
	
	var r = null;
	line = function(){
		r = this;
		r.queryId = [];// 所有查询的数据id，方便清除
		r.borderColor = "#fba364";
		r.borderWidth = 1;
		r.borderShineColor = "#96bffd";
		r.borderShineWidth = 2;
		r.fillOpacity = 0.8;
		r.addLayer = false;
	}
	
	// 初始化对象
	line.prototype.init = function(param){
		if(null === param || undefined === param)return;
		var t = this;
		for(var key in param){
			t[key] = param[key];
		}
	}
	
	line.prototype.build = function(param){
		var t = this , data = null;
		switch(param.handleType){
			default :{ data = t.drawLine(param); }
		}
		if(!t.addLayer)return data;
		addLayer(data);
	}
	
	/**
	 * 清除所有图层相关数据
	 */
	line.prototype.clearAll = function(){
		var arr = r.queryId,t = this;
		for(var i = 0 , j = arr.length; i < j ; i++){
			t.clear(arr[i]);
		}
	}
	
	/**
	 * 清除某一个图层相关数据
	 */
	line.prototype.clear = function(randomId){
		// 清除业务数据
		var businessCache =  r.businessCache;
		var businessData = businessCache["line"][randomId];
		if(null!=businessData&&undefined!==businessData){
			businessCache["line"][randomId] = null;
		}
		// 清除图层数据
		var vector = this.getVector(randomId);
		if(null!=vector&&undefined!==vector){
			vector.getSource().clear();
			r.map.removeLayer(vector);
			vector = null;
		}
	}
	
	/**
	 * 获取指定feature
	 */
	line.prototype.getFeature = function(id){
		var ary = r.auxiliary,t = this,
		queryIds = r.queryId,
		vector = null,
		result = null;
		if(ary.nullBool(id))return;
		ary.arrForEach(queryIds,function(queryId){
			vector = t.getVector(queryId);
			if(!ary.nullBool(vector)){
				result = vector.getSource().getFeatureById(id);
				if(!ary.nullBool(result))return true;
			}
		})
		return result;
	}
	
	/**
	 * 清除指定feature
	 */
	line.prototype.removeFeature = function(ids){
		var ary = r.auxiliary,t = this,
		queryIds = r.queryId,
		vector = null,vectorSource = null,features = null,
		index = null;
		if(ary.arrBool(ids))return;
		ary.arrForEach(queryIds,function(queryId){
			vector = t.getVector(queryId);
			if(!ary.nullBool(vector)){
				vectorSource = vector.getSource();
				features = vectorSource.getFeatures();
				ary.arrForEach(features,function(feature){
					index = ids.indexOf(feature.get("id"));
					if(index!==-1){
						vectorSource.removeFeature(feature);
						ids.splice(index,1);
					}
				})
			}
		})
	}
	
	/**
	 * 获取矢量图层
	 */
	line.prototype.getVector = function(randomId){
		var ary = r.auxiliary ,
		layers = r.map.getLayers().getArray();
		ary.arrForEach(layers,function(layer){
			var layerName = layer.get("layerName");
			if(randomId!==layerName)return false;
			r.map.removeLayer(layer);
			return true;
		})
	}
	
	/**
	 * draw后端传递的Line数据
	 */
	line.prototype.drawLine = function(data){
		var ary = r.auxiliary
		,cache = r.businessCache.line
		,WKT = new ol.format.WKT()
		,features = []
		,random = new Date().getTime()+Math.floor(Math.random()*100000)+""
		,result = null
		,cacheParam = {};
		ary.arrForEach(data.datas,function(mapParam,index){
			var arr = mapParam.lineArr,newlineArr = [];
			ary.arrForEach(arr,function(lonlat){
				newlineArr.push(createPoint(lonlat[0]*1 , lonlat[1]*1));
			})
			var geometry = new ol.geom.LineString(newlineArr);
			var line = new ol.Feature({
				id: mapParam.id,
				geometry : geometry,
				population : 4000,
				rainfall : 500
			});
			line.set("drawType","line");
			line.set("dataId", random);
			var color = data.legend[mapParam.v.legend_index].c.colorRgb(r.fillOpacity);
			line.setStyle(new ol.style.Style({
				stroke : new ol.style.Stroke({
					color : r.borderColor,
					width : r.borderWidth
				}),
				fill : new ol.style.Fill({
					color : color
				})
			}))
			features.push(line);
			mapParam["fillColor"] = color;
			cacheParam[mapParam.id+""] = mapParam;
		})
		if(features.length>0){
			result = {id:random,cacheId:random,type:"line",'features':features};
			r.queryId.push(random);
			cache[random] = cacheParam;
		}
		return result;
	}
	
	// 将经纬度转换成openlayers默认坐标系
	function createPoint(lon , lat){
		return ol.proj.fromLonLat([lon , lat]);
	}
	
	// 创建
	var addLayer = function(data){
		var vectorSource = new ol.source.Vector({
			features : data.features
		})
		var vector = new ol.layer.Vector({
			source : vectorSource
		});
		if (!data.zIndex)data.zIndex = 5;
		vector.setZIndex(data.zIndex);
		vector.set("layerName", data.cacheId);
		r.map.addLayer(vector);
		// 视野调整,定位到当前画在地图上的区域
		r.map.getView().fit(vectorSource.getExtent());
	}
	
})(jQuery);