/**
 * OM openlayers Map
 * 地图画点对象
 * 增加坐标系转换
 */
(function(){
	
	var r = null;
	point = function(){
		r = this;
		r.queryId = [];// 所有查询的数据id，方便清除
		r.borderColor = '#131212';
		r.borderWidth = 5;
		r.layerIndex = 0;
		r.addLayer = false;
	}
	
	// 初始化对象
	point.prototype.init = function(param){
		if(null === param || undefined === param)return;
		var t = this;
		for(var key in param){
			t[key] = param[key];
		}
	}
	
	point.prototype.build = function(param){
		var t = this , data = null;
		switch(param.handleType){
			case "cluster":{ data = t.drawCluster(param);break; }
			case "imgPoint":{ data = t.drawImgPoint(param);break; }
			default :{ data = t.drawPoint(param); }
		}
		if(!t.addLayer)return data;
		addLayer(data);
	}
	
	/**
	 * 清除所有图层相关数据
	 */
	point.prototype.clearAll = function(){
		var arr = r.queryId,t = this;
		for(var i = 0 , j = arr.length; i < j ; i++){
			t.clear(arr[i]);
		}
	}
	
	/**
	 * 获取指定feature
	 */
	point.prototype.getFeature = function(id){
		var ary = r.auxiliary,t = this,
		queryIds = r.queryId,
		vector = null,
		result = null;
		if(ary.nullBool(id))return;
		ary.arrForEach(queryIds,function(queryId){
			vector = t.getVector(queryId);
			if(!ary.nullBool(vector)){
				var features = vector.getSource().getFeatures();
				ary.arrForEach(features,function(feature){
					if(id.toString() === feature.get("id")){
						result = feature;
						return true;
					}
				})
				if(null!==result) return true;
			}
		})
		return result;
	}
	
	/**
	 * 清除指定feature
	 */
	point.prototype.removeFeature = function(ids){
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
	 * 清除某一个图层相关数据
	 * 这一步还可以优化，当有多个randomId时候遍历多次
	 */
	point.prototype.clear = function(randomId){
		// 清除缓存的业务数据
		var businessCache =  r.businessCache;
		var businessData = businessCache["point"][randomId];
		if(null!=businessData&&undefined!==businessData){
			businessCache["point"][randomId] = null;
		}
		// 根据id从图层中删除
		var vector = this.getVector(randomId);
		if(null!=vector&&undefined!==vector){
			vector.getSource().clear();
			r.map.removeLayer(vector);
			vector = null;
		}
	}
	
	/**
	 * 获取矢量图层
	 */
	point.prototype.getVector = function(randomId){
		var ary = r.auxiliary ,vector = null,
		layers = r.map.getLayers().getArray();
		ary.arrForEach(layers,function(layer){
			var layerName = layer.get("layerName");
			if(randomId!==layerName)return false;
			vector = layer;
			return true;
		})
		return vector;
	}
		
	/**
	 * 后端传递的点数据
	 */
	point.prototype.drawPoint = function(data){
		var ary = r.auxiliary
		,cache = r.businessCache.point
		,features = []
		,random = new Date().getTime()+Math.floor(Math.random()*100000)+""
		,result = null
		,cacheParam = {}
		,cs = data.cs;
		ary.arrForEach(data.datas,function(mapParam,index){
			var position = mapUtil["csc"](mapParam.longitude*1,mapParam.latitude*1,cs);
			var point = new ol.Feature({
				id: mapParam.id,
				geometry : new ol.geom.Point(position),
				population : 4000,
				rainfall : 500,
			});
			var color = data.legend[mapParam.v.legend_index].c;
			point.setStyle(new ol.style.Style({
				image :new ol.style.Circle({
					fill: new ol.style.Fill({
						color: color
					}),
					stroke: new ol.style.Stroke({
						color: r.borderColor,	
						width: r.borderWidth
					}),
					radius: mapParam.radius ?	mapParam.radius : 5	
				}),
				zIndex: 5
			}));
			point.set("drawType","point");
			point.set("dataId", random);
			features.push(point);
			mapParam["fillColor"] = color;
			cacheParam[mapParam["id"]+""] = mapParam;
		})
		if(features.length>0){
			result = {id:random,cacheId:random,type:"point",'features':features};
			r.queryId.push(random);
			cache[random] = cacheParam;
		}
		return result;
	}
	
	/**
	 * 后端传递的点数据
	 */
	point.prototype.drawImgPoint = function(data){
		var ary = r.auxiliary
		,cache = r.businessCache.point
		,features = []
		,random = new Date().getTime()+Math.floor(Math.random()*100000)+""
		,result = null
		,cacheParam = {}
		,cs = data.cs;
		ary.arrForEach(data.datas,function(mapParam,index){
			var position = mapUtil["csc"](mapParam.longitude*1,mapParam.latitude*1,cs);
			var point = new ol.Feature({
				id: mapParam.id,
				geometry : new ol.geom.Point(position),
				population : 4000,
				rainfall : 500,
			});
			var imgPath = data.legend[mapParam.v.legend_index].i;
			point.setStyle(new ol.style.Style({
				image: new ol.style.Icon({
					rotateWithView: true,
					src: imgPath
				}),
				zIndex: 5
			}));
			point.set("drawType","point");
			point.set("dataId", random);
			features.push(point);
			mapParam["src"] = imgPath;
			cacheParam[mapParam["id"]+""] = mapParam;
		})
		if(features.length>0){
			result = {id:random,cacheId:random,type:"point",'features':features};
			r.queryId.push(random);
			cache[random] = cacheParam;
		}
		return result;
	}
	
	/**
	 * 创建聚合图
	 */
	point.prototype.drawCluster = function(param){
		var data = this.drawPoint(param);
		var vectorSource = new ol.source.Vector({
			features : data.features
		})
		var clusters = new ol.source.Cluster({
			// 第一个 参数 是 聚合的 范围 ， 
			// 第二个 参数 是 聚合的 范围,这个是最小范围
			distance: parseInt(10, 30),
		    source: vectorSource
		})
		var vector = new ol.layer.Vector({
			source : clusters,
			style: function(feature) {
				 var size = feature.get('features').length;
				 return new ol.style.Style({
					image : new ol.style.Circle({
						radius : 20,
						stroke : new ol.style.Stroke({
							color : r.borderColor ,
							width : r.borderWidth
						}),
						fill : new ol.style.Fill({
							color : '#3399CC'
						})
					}),
					text : new ol.style.Text({
						text : size.toString(),
						fill : new ol.style.Fill({
							color : '#fff'
						})
					})
				});
		    }
		});
		if (!data.zIndex)data.zIndex = 5;
		vector.setZIndex(data.zIndex);
		vector.set("layerName", data.id);
		r.map.addLayer(vector);
		// 视野调整,定位到当前画在地图上的区域
		if (data.isFitBounds)map.getView().fit(vectorSource.getExtent());
		// 设置地图视野范围：全国（5）——》街区（18）
		if (data.zoom)r.map.getView().setZoom(parseInt(data.zoom));
		return null;
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
		vector.setZIndex(r.layerIndex);
		vector.set("layerName", data.cacheId);
		r.map.addLayer(vector);
		// 视野调整,定位到当前画在地图上的区域
		r.map.getView().fit(vectorSource.getExtent());
	}
	
})(jQuery);