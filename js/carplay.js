
function carStartPlay() {
    var i=-60;
    var time_id;
    var ins1;
    layui.use('slider', function(){

        var $ = layui.$,
            slider = layui.slider;
        //默认滑块
        ins1= slider.render({
            elem: '#slideTest1'
        });
    });

    function intv(){
        time_id = setTimeout(function(){
            i+=0.1;
            document.getElementById('play_pointer').style.transform = 'rotateZ(' + i +'deg)';
            var bar=(i+60)/21*10;
            ins1.setValue(bar);
            intv()
        },10);
        if(i>150){
            //i = 0
            clearTimeout(time_id)
        }
    }
    intv()

}
