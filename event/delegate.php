<!doctype html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /> 
<title>Y.Event.delegate</title>
</head>
<body class="yui3-skin-sam">
<h1>Y.Event.delegate</h1>
<ul>
    <li>
        <a href="http://google.com">google</a>
    </li>
    <li>
        <a name="facebook" href="http://facebook.com">facebook</a>
    </li>
    <li>
        <a name="twitter" href="http://twitter.com">twitter</a>
    </li>
</ul>
<br />
<br />
<br />
<form>
    <div>
        <label for="name">姓名：</label>
        <input type="text" name="name" id="name" />
    </div>
    <div>
        <label for="age">年龄：</label>
        <input type="text" name="age" id="age" />
    </div>
    <div>
        <label for="school">学校：</label>
        <input type="text" name="school" id="school" />
    </div>
</ol>
<script src="http://yui.yahooapis.com/3.9.1/build/yui/yui-min.js"></script>
<script src="delegate-simple.js"></script>
<script>
YUI_config = { filter: 'RAW' };

// 例1 Y.delegate基本用法
YUI().use('delegate-simple', function(Y) {
    // disabled
    return;

    var handle = Y.delegate('click', function (e) {
        e.halt();
        console.log(this.get('tagName') + ' is clicked');
    }, 'ul', 'a');

    Y.delegate('click', function (e) {
        e.halt();
        console.log(this.get('tagName') + ' is clicked');
    }, 'ul', 'li');

    // click the first anchor
    // output 'A is clicked'
    // output 'LI is clicked'

    handle.detach();

    // click the first anchor
    // output 'LI is clicked'
});

// 例2 Y.Node的delegate方法
YUI().use('node-event-delegate', function(Y) {
    // disabled
    return;

    var ndList = Y.one('ul'),
        handle;

    handle = ndList.delegate('click', function (e) {
        e.halt();
        console.log(this.get('tagName') + ' is clicked');
    }, 'a');

    ndList.delegate('click', function (e) {
        e.halt();
        console.log(this.get('tagName') + ' is clicked');
    }, 'li');

    // click the first anchor
    // output 'A is clicked'
    // output 'LI is clicked'

    handle.detach();

    // click the first anchor
    // output 'LI is clicked'
});

// 例3 function filter
YUI().use('node-event-delegate', function(Y) {
    // disabled
    return;

    Y.one('ul').delegate('click', function (e) {
        e.halt();
        console.log(this.get('tagName') + ' is clicked');
    }, function (nd, e) {
        return nd.get('name') &&
               e.target.get('tagName').toLowerCase() === 'a';
    });

    // click the first anchor
    // no output

    // click the second anchor
    // output 'LI is clicked'
});

// 例4 批量代理
YUI().use('node-event-delegate', function(Y) {
    // disabled
    return;

    Y.one('ul').delegate({
        click: function (e) {
            e.halt();
            console.log(e.type);
        },
        dblclick: function (e) {
            e.halt();
            console.log(e.type);
        }
    }, 'li');

    // double click the first anchor
    // output 'click'
    // output 'click'
    // output 'dblclick'

    Y.one('ul').delegate(['click', 'dblclick'], function (e) {
        e.halt();
        console.log(e.type);
    }, 'li');

    // double click the first anchor
    // output 'click'
    // output 'click'
    // output 'dblclick'
});

// 例5 改变回调中this和传递数据
YUI().use('node-event-delegate', function(Y) {
    // disabled
    return;

    Y.one('ul').delegate('click', function (e, args) {
        e.halt();
        console.log(this === document.body);
        console.log(args.data);
    }, 'a', document.body, { data: 'data' });

    // click the first anchor
    // output 'true'
    // output 'data'
});

// 例6
YUI().use('node-event-delegate', 'event-focus', function(Y) {
    Y.one('form').delegate({
        focus: function (e) {
            // 清除错误提示
            clearErr(this);
        },
        blur: function (e) {
            // 如果内容为空，则提示错误信息
            if (this.get('value') === '') showErr(this);
        }
    }, 'input');

    function clearErr(nd) {
        var ndErr = nd.next('.error');
        if (ndErr) ndErr.hide().setHTML('');
    };

    function showErr(nd) {
        var ndErr = nd.next('.error');
        if (!ndErr) {
            ndErr = Y.Node.create('<span class="error"></span>');
            nd.insert(ndErr, 'after');
        }

        ndErr.show().setHTML('请输入内容');
    };
});
</script>
</body>
</html>
