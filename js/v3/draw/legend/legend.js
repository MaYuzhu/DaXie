(function(){
	
	var l = null;
	legend = function(){
		l = this;
	}
	
	// 依赖注入
	legend.prototype.init = function(param){
		if(null === param || undefined === param)return;
		var t = this;
		for(var key in param){
			t[key] = param[key];
		}
		init_element();
	}
	
	// 初始化页面元素
	var init_element = function(){
		var id = new Date().getTime() + Math.floor(Math.random() *10000);
		$("body").append('<div class="bottomLegendBox_l" id="mapLegend">'
				+ '<ul class="bottomLegend" id="'+id+'"></ul></div>');
		l.ul = $("#"+id);
	}
	
	// 创建
	legend.prototype.build = function(param){
		switch(param.type){
			case "":{
				break;
			}
			default:{
				create_1(param);
			}
		}
	}
	
	// 清除
	legend.prototype.clear = function(){
		l.ul.empty();
	}
	
	// 获取矢量图层
	legend.prototype.getVector = function(randomId){
		var ary = l.auxiliary ,vector = null,
		layers = l.map.getLayers().getArray();
		ary.arrForEach(layers,function(layer){
			var layerName = layer.get("layerName");
			if(randomId!==layerName)return false;
			vector = layer;
			return true;
		})
		return vector;
	}
	
	/**
	 * 创建一
	 */
	var create_1 = function(data){
		var ary = l.auxiliary;
		// 添加元素
		var li = $('<li class="huntianyi_region_legend">');
		var div_1 = $('<div class="legendTitle">').text(data.name);
		var div_2 = $('<div class="legend">');
		ary.arrForEach(data.data,function(mapPaaram,index){
			var div_3 = $('<div class="legendSelect">')
				.attr({index:index , color:mapPaaram.c , code:data.id , type:data.featuresType});
			var div_4 = $('<div class="legendColor" style="background-color:'+mapPaaram.c+'">');
			var div_5 = $('<div class="legendDescribe">').text(mapPaaram.n);
			div_2.append(div_3.append(div_4).append(div_5));
		})
		li.append(div_1).append(div_2);
		l.ul.append(li);
		
		// 添加点击事件
		div_2.find(".legendColor").click(function(){
			var t = $(this)
			,pObj = t.parent()
			,key = pObj.attr("code")
			,type = pObj.attr("type")
			,index = pObj.attr("index") * 1
			,businessCache = l.businessCache[type][key]
			,features = l.getVector(key).getSource().getFeatures();
			
			if(l.popup)l.popup.close();
			
			if(t.hasClass("none")){ // 显示处理
				t.removeClass("none");
				var color = pObj.attr("color");
				displayFeatureFactory(features,businessCache,type,index,color,true);
				t.css({"background-color":color});
			}else{
				t.addClass("none");
				displayFeatureFactory(features,businessCache,type,index,color,false);
				t.css({"background-color":"transparent"});
			}
		})
	}
	
	/**
	 * 显示隐藏工厂
	 */
	var displayFeatureFactory = function(features,business,type,index,color,bool){
		switch(type){
			case "region":{
				displayRegionFeature(features,business,index,color,bool);
				break;
			}
			case "point":{
				displayPointFeature(features,business,index,color,bool);
				break;
			}
			default:{}
		}
	}
	
	/**
	 * 显示隐藏区域
	 */
	var displayRegionFeature = function(features,business,index,color,bool){
		var noneColor = "rgba(0,0,0,0)";
		var ary = l.auxiliary;
		ary.arrForEach(features,function(feature){
			var id = feature.get("id");
			var map = business[id];
			var legend_index = map.v.legend_index;
			if(index === legend_index){
				feature.setStyle(new ol.style.Style({
					stroke : new ol.style.Stroke({
						color : bool ? l.region.borderColor : noneColor,
						width : bool ? l.region.borderWidth : 0
					}),
					fill : new ol.style.Fill({
						color : bool ? color.colorRgb(l.region.fillOpacity) : noneColor
					})
				}));
				feature.set("displayType",bool ? "" : "none");
			}
		});
	}
	
	/**
	 * 显示隐藏点
	 */
	var displayPointFeature = function(features,business,index,color,bool){
		var noneColor = "rgba(0,0,0,0)";
		var ary = l.auxiliary;
		ary.arrForEach(features,function(feature){
			var id = feature.get("id");
			var map = business[id];
			var legend_index = map.v.legend_index;
			if(index === legend_index){
				feature.setStyle(new ol.style.Style({
					image :new ol.style.Circle({
						stroke : new ol.style.Stroke({
							color : bool ? l.point.borderColor : noneColor,
							width : bool ? l.point.borderWidth : 0
						}),
						fill : new ol.style.Fill({
							color : bool ? color : noneColor
						}),
						radius: bool ? map.radius : 0
					})
				}));
				feature.set("displayType",bool ? "" : "none");
			}
		});
	}
	
	
	
})(jQuery);