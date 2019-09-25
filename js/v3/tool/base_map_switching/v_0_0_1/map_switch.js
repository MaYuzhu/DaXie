(function(){
	
	// 地图底图切换
	var ms = null;
	mapSwitch = function() {
		ms = this;
		ms.daIndex = 0;
		ms.baseMap = [
			{name:'高德', cs : "", backMap:basemap_gaode,src: "map/gaode.png"},
			{name:'腾讯', cs : "", backMap:basemap_tencent,src: "map/tencent.png"},
			{name:'esri', cs : "84t02", backMap:ESRI_Image,src: "map/esri.png"}
		];
	}
	
	// 依赖注入
	mapSwitch.prototype.init = function(param){
		if(null === param || undefined === param)return;
		var t = this;
		for(var key in param){
			t[key] = param[key];
		}
		init_element(param);
	}
	
	// 工具栏元素
	// 方便后来其他工具元素创建复用
	var toolElement = function(pObj){
		var ary = ms.auxiliary , child = null;
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
	
	// 地图切换
	var mapSwitchElement = function(pObj){
		var topDiv = $('<div class="ms_topElement displayNone" type="none">');
		var head = $('<div class="ms_head">');
		var body = $('<div class="ms_body diyScrollBar3">');
		$(pObj).append(topDiv.append(head).append(body));
		var ary = ms.auxiliary ,
		baseMap = ms.baseMap;
		ary.arrForEach(baseMap,function(map,index){
			var cla = index === ms.daIndex ? "active" : ""; 
			var miDivTop = $('<div class="miDivTopBox">').attr({'index':index});
			var span = $('<span class="msSpan '+ cla +'">').text(map.name);
			var img = $('<img src="'+map.src+'" class="imgMax">');
			body.append(miDivTop.append(span).append(img));
		})
		var clickObjs = ms.clickObjs = body.find(".miDivTopBox");
		clickObjs.click(function(){
			var t = this;
			var index = ms.daIndex = $(t).attr("index")*1;
			var layers = ms.map.getLayerGroup().getLayers().getArray();
			layers[0] = ms.baseMap[index]['backMap'];
			ms.map.setLayerGroup(new ol.layer.Group({
				layers : layers
			}));
			
			body.find(".msSpan").removeClass("active");
			$(t).children(".msSpan").addClass("active");
		})
		return topDiv;
	}
	
	// 初始化元素
	var init_element = function(){
		var pObj = toolElement($(ms.even));
		var btn = ms.btn = buttonElemnt(pObj,"nestle_img28","底图切换");
		var msBox = mapSwitchElement(btn);
		btn.children("i").click(function(){
			var t = $(msBox),type = t.attr("type");
			if("display" === type){
				t.addClass("displayNone");
				t.attr("type","none");
			}
			if("none" === type){
				t.removeClass("displayNone");
				t.attr("type","display");
			}
		})
	}
	
})(jQuery);