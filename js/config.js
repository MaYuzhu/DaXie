const ajax_url = 'http://192.168.20.21:8000/'

function getAjax(url, data, async, succFunc, errFunc) {
    $.ajax({
        type: 'POST',
        async: async,
        cache:true,
        url: url,
        data:JSON.stringify(data),
        dataType: 'json',
        contentType: 'application/json',
        xhrFields:{
            withCredentials:true
        },
        //traditional: true,
        crossDomain: true,
        success: function (json) {
            succFunc(json);
        },
        error: errFunc
    })
}

function errFunc() {
    //alert('网络错误')
    console.log('网络错误')
}