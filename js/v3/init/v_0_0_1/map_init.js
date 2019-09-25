var openlayersMap = {
	// 业务缓存，用于减轻将输入存入openlayers容器造成画对象数量减少
	businessCache:{
		region:{}
		,point:{}
		,line:{}
	}
}
var businessCache = openlayersMap.businessCache;



var mapUtil = {};

/**
 * Coordinate System Conversion
 * 坐标系转换
 */
mapUtil["csc"] = function(lon , lat , type){
	switch(type){
		case "84t02":{
			var latlon = GPS.gcj_decrypt(lat,lon);
			return ol.proj.fromLonLat([latlon.lon , latlon.lat])
			break;
		}
		case "02t84":{
			return ol.proj.transform([lon , lat],"EPSG:3857","EPSG:4326");
			break;
		}
		default:{ 
			return ol.proj.fromLonLat([lon , lat])
		}
	}
}

/**
 * 地图底图旋转
 * @param view map.getView()得到
 * @param numParam 要旋转的度数
 */
mapUtil["backRotation"] = function(view,numParam){
	// Math.PI 表明一个圆的周长
	view.setRotation(Math.PI * (parseInt(numParam) % 360 / 360) * 2);
}

/**
 * 图片旋转
 * @param hd feature，layer.getSource().getFeatures()的子元素
 * @param numParam 要旋转的度数
 */
mapUtil["imgRotation"] = function(hd,numParam){
	var rotation = Math.PI * (parseInt(numParam) % 360 / 360) * 2;
	var newImg = hd.getStyle().getImage();
	newImg.setRotation(rotation);
	hd.setStyle(new ol.style.Style({
		image: newImg
	}));
}

/**
 * 图片放大缩小
 * @param hd feature，layer.getSource().getFeatures()的子元素
 * @param scale 图片整体展示的比例，区间0-1
 */
mapUtil["imgScale"] = function(hd,scale){
	var newImg = hd.getStyle().getImage();
	newImg.setScale(scale);
	hd.setStyle(new ol.style.Style({
		image: newImg
	}));
}