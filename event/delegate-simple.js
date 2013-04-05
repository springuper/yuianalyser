/*jshint camelcase:false*/
YUI.add('delegate-simple', function (Y) {
var toArray          = Y.Array,
    isString         = Y.Lang.isString;

function delegate(type, fn, el, filter) {
    var container,
        handle;

    container = isString(el) ? Y.Selector.query(el, null, true) : el;

    // 监听代理节点的type事件
    handle = Y.Event._attach([type, fn, container], { facade: false });
    handle.sub.filter  = filter;
    // 改写事件触发回调函数
    handle.sub._notify = delegate.notifySub;

    return handle;
}
    
// 代理节点触发事件时的回调函数
delegate.notifySub = function (thisObj, args, ce) {
    // 计算符合filter的被代理节点集合
    var currentTarget = delegate._applyFilter(this.filter, args, ce),
        e, i, len, ret;
    if (!currentTarget) return;

    currentTarget = toArray(currentTarget);

    // 生成事件对象
    e = args[0] = new Y.DOMEventFacade(args[0], ce.el, ce);
    // 将代理节点保存在事件对象container属性上，方便回调函数调用
    e.container = Y.one(ce.el);

    for (i = 0, len = currentTarget.length; i < len && !e.stopped; ++i) {
        // 将被代理节点保存在事件对象currentTarget属性上
        e.currentTarget = Y.one(currentTarget[i]);

        // 回调函数中的this指向被代理节点
        ret = this.fn.apply(e.currentTarget, args);
        if (ret === false) break;
    }

    return ret;
};

// 计算符合filter的被代理节点集合
delegate._applyFilter = function (filter, args, ce) {
    var e         = args[0],
        container = ce.el,
        target    = e.target || e.srcElement,
        match     = [],
        isContainer = false;

    // 处理事件目标节点为文本节点的情况
    if (target.nodeType === 3) {
        target = target.parentNode;
    }

    // filter是selector
    if (isString(filter)) {
        while (target) {
            isContainer = (target === container);
            // 测试target是否符合selector filter
            if (Y.Selector.test(target, filter, (isContainer ? null : container))) {
                match.push(target);
            }
            if (isContainer) break;

            target = target.parentNode;
        }
    // filter是function
    } else {
        // 将target节点作为function filter的第一个参数，
        // 第二个参数为事件对象
        args.unshift(Y.one(target));
        args[1] = new Y.DOMEventFacade(e, container, ce);

        while (target) {
            // function filter中this指向target
            if (filter.apply(args[0], args)) {
                match.push(target);
            }
            if (target === container) break;

            // 更新target
            target = target.parentNode;
            args[0] = Y.one(target);
        }

        // 恢复args对象
        args[1] = e;
        args.shift();
    }

    return match.length <= 1 ? match[0] : match;
};

Y.delegate = Y.Event.delegate = delegate;
},
'1.0.0',
{ requires: ['node-base'] });
