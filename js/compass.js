

//自定义控件 指北针
ol.control.Compass = function(opt_options){
    var options = opt_options || {};      //参数

    this.reverseText = options.reverseText ? options.reverseText : '逆时针转动';    //title的提示信息
    this.recoveryText = options.recoveryText ? options.recoveryText : '恢复正北方向';
    this.forwordText = options.forwordText ? options.forwordText : '顺时针转动';

    var hiddenClassName = 'ol-unselectable';       　　　　　　　　　　　　　　//控件默认样式

    var compassClass = 'ol-compass';                                       //自定义控件样式

    this.element = document.createElement('div');                          //控件容器

    this.element.className = compassClass + ' ' + hiddenClassName;         //设置控件样式

    this.reverse = document.createElement('button');                　　　　//逆时针
    this.reverse.setAttribute('title', this.reverseText);           　　　　//设置提示逆时针的提示文字
    this.reverse.className = 'reverse';
    this.element.appendChild(this.reverse);

    this.recovery = document.createElement('button');               //恢复正北方向
    this.recovery.setAttribute('title', this.recoveryText);
    this.recovery.className = 'recovery';
    this.element.appendChild(this.recovery);

    this.forword = document.createElement('button');                //顺时针
    this.forword.setAttribute('title', this.forwordText);
    this.forword.className = 'forword';
    this.element.appendChild(this.forword);

    var this_ = this;                                                 // 存储当前指向的控件对象

    this.reverse.onclick = function(event){
        event = event || window.event;                                //获取event对象
        this_.reverseClick();                                      //执行动作
        event.preventDefault();                                        //阻止事件冒泡
    };

    this.recovery.onclick = function(event){
        event = event || window.event;
        this_.recoveryClick();
        event.preventDefault();
    };

    this.forword.onclick = function(event){
        event = event || window.event;
        this_.forwordClick();
        event.preventDefault();
    };

    ol.control.Control.call(this,{
        element: this.element,
        target: options.target
    });

};

ol.inherits(ol.control.Compass, ol.control.Control);

ol.control.Compass.prototype.reverseClick = function(){
    var view = this.getMap().getView();
    var center = this.getMap().getView().getCenter();
    var rotation = this.getMap().getView().getRotation();
    view.animate({
        center: center,                                            //旋转中心点
        rotation: rotation - Math.PI/12,
        easing: ol.easing.easeOut                                //旋转速度
    });
    var zdeg=(rotation - Math.PI/12)/Math.PI*180;
    $('.ol-compass').css({transform:"rotateZ("+zdeg+"deg)"})
};

ol.control.Compass.prototype.recoveryClick = function(){
    var view = this.getMap().getView();
    var center = this.getMap().getView().getCenter();
    view.animate({
        center: center,
        rotation: 0,
        easing: ol.easing.easeOut
    });
    $('.ol-compass').css({transform:"rotateZ(0deg)"})
};

ol.control.Compass.prototype.forwordClick = function(){
    var view = this.getMap().getView();
    var center = this.getMap().getView().getCenter();
    var rotation = this.getMap().getView().getRotation();
    view.animate({
        center: center,
        rotation: rotation + Math.PI/12,
        easing: ol.easing.easeOut
    });
    var zdeg=(rotation + Math.PI/12)/Math.PI*180;
    $('.ol-compass').css({transform:"rotateZ("+zdeg+"deg)"})
};