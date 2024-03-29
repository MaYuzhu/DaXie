/**
 * OM openlayers Map
 * 地图画点对象
 */
(function(){
	
	var r = null;
	region = function(){
		r = this;
		r.queryId = [];// 所有查询的数据id，方便清除
		r.borderColor = "#fba364";
		r.borderWidth = 1;
		r.borderShineColor = "#96bffd";
		r.borderShineWidth = 2;
		r.fillOpacity = 0.6;
		r.layerIndex = 0;
		r.addLayer = false;
	}
	
	// 初始化对象
	region.prototype.init = function(param){
		if(null === param || undefined === param)return;
		var t = this;
		for(var key in param){
			t[key] = param[key];
		}
	}
	
	region.prototype.build = function(param){
		var t = this , data = null;
		switch(param.handleType){
			case "2":{ data = t.drawInterfaceJson(param);break; }
			default :{ data = t.drawWKT(param); }
		}
		if(!t.addLayer)return data;
		addLayer(data);
	}
	
	/**
	 * 清除所有图层相关数据
	 */
	region.prototype.clearAll = function(){
		var arr = r.queryId,t = this;
		for(var i = 0 , j = arr.length; i < j ; i++){
			t.clear(arr[i]);
		}
	}
	
	/**
	 * 清除某一个图层相关数据
	 */
	region.prototype.clear = function(randomId){
		// 清除业务数据
		var businessCache =  r.businessCache;
		var businessData = businessCache["region"][randomId];
		if(null!=businessData&&undefined!==businessData){
			businessCache["region"][randomId] = null;
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
	region.prototype.getFeature = function(id){
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
	region.prototype.removeFeature = function(ids){
		console.log(ids)
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
	region.prototype.getVector = function(randomId){
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
	 * 后端传递的WKT数据
	 */
	region.prototype.drawWKT = function(data){
		var ary = r.auxiliary
		,cache = r.businessCache.region
		,WKT = new ol.format.WKT()
		,features = []
		,random = new Date().getTime()+Math.floor(Math.random()*100000)+""
		,result = null
		,cacheParam = {};
		ary.arrForEach(data.datas,function(mapParam,index){
			var geometry = WKT.readGeometry(mapParam.wkt,{
				dataProjection: 'EPSG:4326',
				featureProjection: 'EPSG:3857'
		    });
			var region = new ol.Feature({
				id: mapParam.id,
				geometry : geometry,
				population : 4000,
				rainfall : 500
			});
			region.set("drawType","region");
			region.set("dataId", random);
			var color = data.legend[mapParam.v.legend_index].c.colorRgb(r.fillOpacity);
			region.setStyle(new ol.style.Style({
				stroke : new ol.style.Stroke({
					color : r.borderColor,
					width : r.borderWidth
				}),
				fill : new ol.style.Fill({
					color : color
				})
			}))
			features.push(region);
			mapParam["fillColor"] = color;
			cacheParam[mapParam.id+""] = mapParam;
		})
		if(features.length>0){
			result = {id:random,cacheId:random,type:"region",'features':features};
			r.queryId.push(random);
			cache[random] = cacheParam;
		}
		return result;
	}
	
	/**
	 * 处理服务接口传递的geometry数据
	 */
	region.prototype.drawInterfaceJson = function(data){
		var ary = r.auxiliary
		,cache = r.businessCache.region
		,cacheParam = {}
		,u = url.regionBdsUrl
		,regionParam = r.regionBdsParam[data.regionLevel]
		,features = []
		,random = new Date().getTime()+Math.floor(Math.random()*100000)+""
		,datas = data.datas
		,result;
		u = u.replace("{{typeName}}",regionParam.typeName);
		u = u.replace("{{code}}",regionParam.id);
		var newUrl = "";
		ary.arrForEach(datas,function(mapParam){
			newUrl = ary.deepCopy(u);
			newUrl = newUrl.replace("{{provinceName}}",mapParam.code);
			var feature = getFeature(newUrl);
			if(null === feature || undefined === feature){
				return false;
			}
			var color = data.legend[mapParam.v.legend_index].c.colorRgb(r.fillOpacity);
			feature.set("id",mapParam.code);
			feature.set("drawType","region");
			feature.set("dataId", random);
			feature.setStyle(new ol.style.Style({
				stroke : new ol.style.Stroke({
					color : r.borderColor,
					width : r.borderWidth
				}),
				fill : new ol.style.Fill({
					color : color
				})
			}))
			features.push(feature);
			mapParam["fillColor"] = color;
			cacheParam[mapParam.id+""] = mapParam;
		})
		if(features.length>0){
			result = {id:random, type:"region",'features':features};
			r.queryId.push(random);
			cache[random] = cacheParam;
		}
		return result;
	}
	
	// 从服务接口中获取feature
	var getFeature = function(url){
		var feature = null;
		var xhr = new XMLHttpRequest();
		xhr.open("get", url, false);
		xhr.send();
		if (xhr.status == 200) {
			features = (new ol.format.GeoJSON({
				dataProjection : 'EPSG:4326',
				featureProjection : 'EPSG:3857'
			})).readFeatures(xhr.responseText);
			if (features != null && features.length > 0) {
				feature = features[0];
				return feature;
			} else {
				return feature;
			}
		} else {
			return feature;
		}
	}
	
	// 向页面添加图层
	var appendLayer = function(url){
		var Vector = new ol.layer.Vector({
			ZIndex : 1,
			source : new ol.source.Vector({
				format : new ol.format.GeoJSON(),
				url : function(extent) {
					return url;
				},
				strategy : ol.loadingstrategy.bbox
			}),
			style : function(feature, number) {
				return new ol.style.Style({
					fill : new ol.style.Fill({
						color : "#123"
					})
				});
			}
		});
		map.addLayer(Vector);
	}
	
	// 创建
	var addLayer = function(data){
		var vectorSource = new ol.source.Vector({
			features : data.features
		})
		var vector = new ol.layer.Vector({
			source : vectorSource
		});
		vector.setZIndex(r.layerIndex);
		vector.set("layerName", data.cacheId);
		r.map.addLayer(vector);
		// 视野调整,定位到当前画在地图上的区域
		r.map.getView().fit(vectorSource.getExtent());
	}
	
})(jQuery);