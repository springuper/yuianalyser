/*jshint camelcase:false*/
YUI.add('event-simple', function (Y) {

var DOMEventFacade = function (ev, currentTarget, wrapper) {
    this._event = ev;
    this._currentTarget = currentTarget;
    this._wrapper = wrapper || {};

    this.init();
};

// 确定目标节点
DOMEventFacade.resolve = function (n) {
    if (!n) return n;
    try {
        // 如果是TEXT_NODE，则取其父节点
        if (n && 3 === n.nodeType) n = n.parentNode;
    } catch (e) {
        return null;
    }
    return Y.one(n);
};

Y.extend(DOMEventFacade, Object, {
    // 初始化。主要处理事件对象的浏览器兼容问题
    init: function () {
        var e = this._event,
            resolve = DOMEventFacade.resolve;

        // 此处省略对key和dimension的兼容性处理

        this.type = e.type;
        this.target = resolve(e.target);
        this.currentTarget = resolve(this._currentTarget);
        this.relatedTarget = resolve(e.relatedTarget);
    },
    // 停止传播
    stopPropagation: function () {
        this._event.stopPropagation();
        this._wrapper.stopped = 1;
        this.stopped = 1;
    },
    // 立即停止传播，不处理同一节点的后续回调
    stopImmediatePropagation: function () {
        var e = this._event;
        if (e.stopImmediatePropagation) {
            // 原生事件对象支持立即停止传播
            e.stopImmediatePropagation();
        } else {
            // 仅停止传播，在原生层面会继续同层传播
            this.stopPropagation();
        }
        this._wrapper.stopped = 2;
        this.stopped = 2;
    },
    // 阻止默认事件
    preventDefault: function (returnValue) {
        var e = this._event;
        e.preventDefault();
        e.returnValue = returnValue || false;
        this._wrapper.prevented = 1;
        this.prevented = 1;
    },
    // 中止事件，包括停止传播和阻止默认事件
    halt: function (immediate) {
        if (immediate) {
            this.stopImmediatePropagation();
        } else {
            this.stopPropagation();
        }

        this.preventDefault();
    }
});

Y.DOMEventFacade = DOMEventFacade;


var add = function (el, type, fn, capture) {
        if (el && el.addEventListener) {
            el.addEventListener(type, fn, capture);
        } else if (el && el.attachEvent) {
            el.attachEvent('on' + type, fn);
        }
    },
    remove = function (el, type, fn, capture) {
        if (el && el.removeEventListener) {
            try {
                el.removeEventListener(type, fn, capture);
            } catch (ex) {}
        } else if (el && el.detachEvent) {
            el.detachEvent('on' + type, fn);
        }
    },
    // 判断o是否为HTMLCollection或HTMLElement数组
    shouldIterate = function (o) {
        try {
            return (o && typeof o !== "string" && Y.Lang.isNumber(o.length) && !o.tagName && !Y.DOM.isWindow(o));
        } catch (ex) {
            return false;
        }
    };

Y.Env.evt.dom_wrappers = {};
Y.Env.evt.dom_map = {};

var Event = function () {
    var _wrappers = Y.Env.evt.dom_wrappers,
        _el_events = Y.Env.evt.dom_map;

    return {
        // 添加事件监听
        attach: function (type, fn, el, context) {
            return Event._attach(Y.Array(arguments, 0, true));
        },

        // 创建自定义事件对象，在原生事件触发时执行该对象的fire方法，
        // 从而处理它上面的所有回调
        _createWrapper: function (el, type) {
            var cewrapper,
                ek  = Y.stamp(el),
                key = 'event:' + ek + type;

            cewrapper = _wrappers[key];
            if (!cewrapper) {
                cewrapper = Y.publish(key, {
                    silent: true,
                    bubbles: false,
                    contextFn: function () {
                        cewrapper.nodeRef = cewrapper.nodeRef || Y.one(cewrapper.el);
                        return cewrapper.nodeRef;
                    }
                });

                cewrapper.overrides = {};

                cewrapper.el = el;
                cewrapper.key = key;
                cewrapper.domkey = ek;
                cewrapper.type = type;
                // 作为原生DOM事件回调
                cewrapper.fn = function (e) {
                    // 触发事件，回调方法可以直接调用作为第一个参数的
                    // DOM事件包装对象
                    cewrapper.fire(Event.getEvent(e, el));
                };

                // 重写_delete方法，执行_clean来注销原生DOM节点事件监听
                cewrapper._delete = function (s) {
                    var ret = Y.CustomEvent.prototype._delete.apply(this, arguments);
                    if (!this.hasSubs()) {
                        // 全部回调都被注销，则注销DOM事件监听
                        Event._clean(this);
                    }
                    return ret;
                };

                _wrappers[key] = cewrapper;
                _el_events[ek] = _el_events[ek] || {};
                _el_events[ek][key] = cewrapper;

                // 通过原生方法注册事件监听，这是关键的入口
                add(el, type, cewrapper.fn);
            }

            return cewrapper;
        },

        // 添加事件监听的内部实现
        _attach: function (args) {
            var handles, oEl, cewrapper, context,
                ret,
                type = args[0],
                fn = args[1],
                el = args[2];
            if (!fn || !fn.call) return false;

            if (shouldIterate(el)) {
                // 逐个进行监听
                handles = [];
                Y.each(el, function (v) {
                    args[2] = v;
                    handles.push(Event._attach(args.slice()));
                });

                return new Y.EventHandle(handles);
            } else if (typeof el === "string") {
                oEl = Y.Selector.query(el);
                switch (oEl.length) {
                    case 0:
                        oEl = null;
                        break;
                    case 1:
                        oEl = oEl[0];
                        break;
                    default:
                        args[2] = oEl;
                        return Event._attach(args);
                }
                if (oEl) el = oEl;
            }

            if (!el) return false;

            if (Y.Node && Y.instanceOf(el, Y.Node)) {
                el = Y.Node.getDOMNode(el);
            }
            cewrapper = Event._createWrapper(el, type);
            context = args[3];
            // 添加自定义事件的监听
            ret = cewrapper._on(fn, context, (args.length > 4) ? args.slice(4) : null);

            return ret;
        },

        // 注销事件监听
        detach: function (type, fn, el, obj) {
            var args = Y.Array(arguments, 0, true), l, ok, i,
                id, ce;

            if (type && type.detach) {
                return type.detach();
            }

            if (typeof el === "string") {
                el = Y.Selector.query(el);
                l = el.length;
                if (l < 1) {
                    el = null;
                } else if (l === 1) {
                    el = el[0];
                }
            }

            if (!el) return false;

            if (el.detach) {
                args.splice(2, 1);
                return el.detach.apply(el, args);
            } else if (shouldIterate(el)) {
                // 逐个注销
                ok = true;
                for (i = 0, l = el.length; i < l; ++i) {
                    args[2] = el[i];
                    ok = Event.detach.apply(Y.Event, args) && ok;
                }
                return ok;
            }

            if (!type || !fn || !fn.call) {
                return Event.purgeElement(el, false, type);
            }

            id = 'event:' + Y.stamp(el) + type;
            ce = _wrappers[id];

            return ce ? ce.detach(fn) : false;
        },

        // 获取事件对象
        getEvent: function (e, el) {
            var ev = e || window.event;
            return new Y.DOMEventFacade(ev, el, _wrappers['event:' + Y.stamp(el) + e.type]);
        },

        // 注销节点上所有的事件监听
        purgeElement: function (el, recurse, type) {
            var oEl = Y.Lang.isString(el) ?  Y.Selector.query(el, null, true) : el,
                lis = Event.getListeners(oEl, type),
                i, len, children, child;

            if (recurse && oEl) {
                lis = lis || [];
                children = Y.Selector.query('*', oEl);
                len = children.length;
                for (i = 0; i < len; ++i) {
                    child = Event.getListeners(children[i], type);
                    if (child) {
                        lis = lis.concat(child);
                    }
                }
            }

            if (lis) {
                for (i = 0, len = lis.length; i < len; ++i) {
                    // detachAll最终调用到自定义事件对象的_delete方法，
                    // 从而调用_clean方法
                    lis[i].detachAll();
                }
            }
        },

        // 通过原生方法注销事件监听，并清理内部相关对象
        _clean: function (wrapper) {
            var key    = wrapper.key,
                domkey = wrapper.domkey;

            remove(wrapper.el, wrapper.type, wrapper.fn);
            delete _wrappers[key];
            delete Y._yuievt.events[key];
            if (_el_events[domkey]) {
                delete _el_events[domkey][key];
                if (!Y.Object.size(_el_events[domkey])) {
                    delete _el_events[domkey];
                }
            }
        },

        // 获取节点上的自定义事件对象
        getListeners: function (el, type) {
            var ek = Y.stamp(el, true),
                evts = _el_events[ek],
                results = [],
                key = (type) ? 'event:' + ek + type : null;

            if (!evts) return null;

            if (key) {
                if (evts[key]) {
                    results.push(evts[key]);
                }
            } else {
                Y.each(evts, function (v, k) {
                    results.push(v);
                });
            }

            return (results.length) ? results : null;
        }
    };
}();

Y.Event = Event;
},
'1.0.0',
{ requires: ['node-core', 'event-custom-base', 'event-custom-complex'] });
