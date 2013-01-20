<!doctype html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /> 
<title>Y.Event</title>
</head>
<body class="yui3-skin-sam">
<h1>Y.Event</h1>
<button id="btn-one">Click me, I'm btn-one</button>
<button id="btn-two">Click me, I'm btn-two</button>
<br />
<br />
<button id="btn-three">Click me, I'm btn-three</button>
<button id="btn-four">Click me, I'm btn-four</button>

<div id="wrapper">
    <input type="text" name="email" />
    <ul>
        <li>list item one</li>
        <li>list item two</li>
        <li>list item three</li>
    </ul>
</div>
<button id="btn-six">Click me, I'm btn-six</button>
<script src="http://yui.yahooapis.com/3.8.0/build/yui/yui-min.js"></script>
<script src="event-simple.js"></script>
<script>
YUI_config = { filter: 'RAW' };

// 例1 添加事件监听
YUI().use('selector', 'event-simple', function(Y) {
    Y.Event.attach('click', function (e) {
        console.log('#btn-one clicked');
    }, '#btn-one');
    Y.Event.attach('click', function (e) {
        console.log('#btn-one clicked again');
    }, '#btn-one');

    // click #btn-one
    // output '#btn-one clicked', '#btn-one clicked again'

    Y.Event.attach('click', function (e) {
        console.log('#btn-one clicked');
        e.stopPropagation();
    }, '#btn-two');
    Y.Event.attach('click', function (e) {
        console.log('#btn-one clicked again');
        e.stopImmediatePropagation();
    }, '#btn-two');
    Y.Event.attach('click', function (e) {
        console.log('#btn-one clicked the third time');
    }, '#btn-two');

    // click #btn-two
    // output '#btn-two clicked', '#btn-two clicked again'
});

// 例2 注销事件监听
YUI().use('selector', 'event-simple', function(Y) {
    var countThree = 0;
    var handle = Y.Event.attach('click', function (e) {
        console.log('#btn-three clicked', ++countThree);
        handle.detach();
    }, '#btn-three');

    // click #btn-three many times
    // output '#btn-three clicked 1'

    var countFour = 0;
    Y.Event.attach('click', function (e) {
        console.log('#btn-four clicked', ++countFour);
        Y.Event.detach('click', null, '#btn-four');
    }, '#btn-four');

    // click #btn-four many times
    // output '#btn-four clicked 1'
});

// // 例3 延迟绑定事件
// YUI().use('node-base', 'selector', 'event-base', function(Y) {
//     Y.Event.attach('click', function (e) {
//         console.log('#btn-five clicked');
//     }, '#btn-five');
// 
//     window.setTimeout(function () {
//         var p = document.createElement('p');
//         p.innerHTML = '<button id="btn-five">Click me, I\'m btn-five</button>';
//         document.body.appendChild(p);
//         console.log('btn-five added');
//     }, 3000);
// 
//     // click #btn-five
//     // output '#btn-five clicked'
// });

// 例4 清理节点即所有子孙节点事件监听
YUI().use('selector', 'event-simple', function(Y) {
    // html:
    // <div id="wrapper">
    //     <input type="text" name="email" />
    //     <ul><li>...</li></ul>
    // </div>
    Y.Event.attach('click', function (e) {
        console.log('wrapper clicked');
    }, '#wrapper');
    Y.Event.attach('focus', function (e) {
        console.log('email focused');
    }, '#wrapper input[name=email]');
    Y.Event.attach('click', function (e) {
        console.log('list clicked');
    }, '#wrapper li');

    Y.Event.attach('click', function (e) {
        Y.Event.purgeElement('#wrapper', true);
        console.log('#wrapper purged recursively');
    }, '#btn-six');

    // click #btn-six
    // and then, click any elements in #wrapper
    // output nothing
});
</script>
</body>
</html>
