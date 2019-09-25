
//分页

var total = '100';//数据总条数
var	pageNum = 1;//当前页
var	pageSize = 7; //每页显示的条数
var	edges = 1;//两侧显示的页码数 大于1
var	playes = '4';//主页码区显示的页码数 大于3
var	pages = '15';//总页数

function myPageItem() {
    $ul = $('<ul class="pagination"></ul>');
    var start = 1;
    var end = pages;
    if (playes % 2) {
        //playes是奇数
        start = pageNum - Math.floor(playes / 2);
        end = pageNum + Math.floor(playes / 2);
    } else {
        //playes是偶数
        start = pageNum - (playes / 2 - 1);
        end = pageNum + playes / 2;
    }

    if (start <= edges + 1) {
        start = 1;
        if (end < playes && playes<pages) {
            end = playes;
        }
    } else {
        for (var i = 1; i <= edges; i++) {
            $ul.append(renderItem(i));
        }
        $ul.append('<li><span>...</span></li>')
    }
    if (end < pages - edges) {
        for (var i = start; i <= end; i++) {
            $ul.append(renderItem(i));
        }
        $ul.append('<li><span>...</span></li>');
        for (var i = pages - edges + 1; i <= pages; i++) {
            $ul.append(renderItem(i));
        }
    } else {
        end = pages;
        if(start>pages-playes+1){
            start = pages-playes+1
        }
        for (var i = start; i <= end; i++) {
            $ul.append(renderItem(i));
        }
    }
    $ul.prepend(renderPrevItem());
    $ul.append(renderNextItem());
    $('#pageBox').empty().append($ul);
}

function renderItem(i) {
    $item = $('<li><a href="#">' + i + '</a></li>');
    if (i === pageNum) {
        $item.addClass('active');
    }
    $item.on('click', (function (num) {
        return function () {
            pageNum = num;
            myPageItem();

            listData(num);
        }
    })(i));
    return $item
}

function renderPrevItem() {
    $prev = $('<li><a href="#">&laquo;</a></li>');
    if (pageNum === 1) {
        $prev.addClass('disabled');
    } else {
        $prev.on('click', function () {
            pageNum = pageNum - 1;
            myPageItem();

            listData(pageNum);
        })
    }
    return $prev;
}

function renderNextItem() {
    $next = $('<li><a href="#">&raquo;</a></li>');
    if (pageNum == pages) {
        $next.addClass('disabled');
    } else {
        $next.on('click', function () {
            pageNum = pageNum + 1;
            myPageItem();

            listData(pageNum);
        })
    }
    return $next;
}