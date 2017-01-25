// export funciont with umd.
(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory()
    } else if (typeof define === 'function' && define.amd) {
        define(factory)
    } else {
        root.lazyload = factory()
    }
})(this, function () {
    // polyfill Object.assign for Chrome <= 45 FF <= 34 Opera <= 32 Safari <=9 IE
    // more detail visit https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
    if (typeof Object.assign != 'function') {
        Object.assign = function (target) {
            'use strict';
            if (target == null) {
                throw new TypeError('Cannot convert undefined or null to object');
            }

            target = Object(target);
            for (var index = 1; index < arguments.length; index++) {
                var source = arguments[index];
                if (source != null) {
                    for (var key in source) {
                        if (Object.prototype.hasOwnProperty.call(source, key)) {
                            target[key] = source[key];
                        }
                    }
                }
            }
            return target;
        };
    }
    /**
     * a plugin for imgs lazyload
     * 
     * @param {Dom} el
     * @param {Object} options
     */
    function lazyload(el, options) {
        var defaults = {
                threshold: 0,               //触发加载的元素和可视窗口直接的距离界限
                failureLimit: 0,            //用于判断不在视口内的元素的
                container: window,          //可视窗口       
                event: 'scroll',            //触发图片加载的事件
                effect: 'show',             //图片加载效果 'show' or 'fadeIn'
                elapsed: 500,           //图片展示效果动画时间
                dataAttribute: 'origin',    //真实图片url存储属性名
                throttleTime: 300,          //节流函数间隔时间
                skipInvisible: true,        //页面不可见元素忽略图片加载
                appear: null,               //触发加载时的回调
                load: null,                 //图片加载完成后的回调
                //默认1px图片， 转base64去除了不必要的prelaod 请求
                placeholder: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXYzh8+PB/AAffA0nNPuCLAAAAAElFTkSuQmCC'
            }, container, throttleUpdate;
        // turns el to an Array not a Array-like Object or a element
        var elements = isType(el.length, 'Number') ? [].slice.call(el) : [el];

        // define event trigger 
        var trigger = (function () {
            var event;

            return function (el, type) {
                // cache the custom-event
                if (!event) {
                    event = new Event(type, {
                        bubbles: true,
                        cancelable: true
                    });
                }
                return el.dispatchEvent(event)
            }
        })();

        // extend options
        options = isType(options, 'Object') ? Object.assign({}, defaults, options) : defaults;

        // wrap update img into a throttle
        throttleUpdate = isType(options.throttleTime, 'Number') ? throttle(update, options.throttleTime) : update;

        // cache container to avoid extra reference
        container = options.container = (options.container === undefined || options.container === window) ? window : options.container;

        // bind event on container default 'scroll'
        container.addEventListener(options.event, function () {
            return throttleUpdate();
        });

        // handle 'appear' for each el render and do effect as setting
        elements.forEach(function (el) {
            var handle;
            // define whether el is img element
            el.isImg = el.nodeName.toLowerCase() === 'img';
            // mark img's load status
            el.loaded = false;

            // if no src given by img, add placeholder alternative
            if (el.isImg && !!el.getAttribute('src') === false) {
                el.setAttribute('src', options.placeholder)
            }

            el.addEventListener('appear', handle = function () {
                // point this to el
                loadImg.call(el);
                // once triger 'appear' event, remove this listener
                el.removeEventListener('appear', handle);
            })
        });

        // bind 'resize' and 'DOMContentloaded' evnet
        window.addEventListener('resize', function () {
            throttleUpdate();
        });

        document.addEventListener('DOMContentLoaded', function () {
            throttleUpdate();
        });

        // load origin img and add effect
        function loadImg() {
            var self = this,
                effects = {
                    'show': 'display',
                    'fadeIn': 'opacity'
                };

            if (!this.loaded) {
                var appearFn = options.appear,
                    loadFn = options.load;
                // trigger 'appear' callback
                if (isType(appearFn, 'Function')) {
                    appearFn.call(this, elements.length, options);
                }

                var img = new Image(),
                    originSrc = self.getAttribute('data-' + options.dataAttribute);
                img.addEventListener('load', function () {
                    //todo add effect
                    self.style.display = 'none';
                    if (self.isImg) {
                        self.setAttribute('src', originSrc)
                    } else {
                        self.style.style.backgroundImage = 'url(' + options.dataAttribute + ')'
                    }

                    // do effect to element with 'show' or 'fadeIn'
                    self.style.display = 'block';
                    if(options.effect !== 'show') {
                        animate(self, effects[options.effect], options.elapsed, 'linear', null);
                    }

                    self.loaded = true;

                    // filter el that unload
                    elements = elements.filter(function (el) {
                        return !el.loaded;
                    });

                    // tirgger 'load' callback
                    if (isType(loadFn, 'Function')) {
                        loadFn.call(self, elements.length, options)
                    }
                });
                img.src = originSrc;
            }
        }

        //todo add more effects 
        function animate(el, prop, elapsed, easing, callback) {
            var duration = Math.ceil(elapsed / 17),
                start = 0,
                propPer, value;
            var requestAnimation = window.requestAnimation || function(fn) {
                setTimeout(fn, 17)
            }

            if(prop === 'opacity') {
                el.style[prop] = value = 0;
                propPer = 1 / duration;
            }

            function step() {
                value = (value + propPer) > 1 ? 1 : value + propPer;
                el.style[prop] = value;
                if (++start <= duration) {
                    isType(callback, 'Function') && callback(value);
                    requestAnimation(step)
                }
            }
            // do animation
            step();
        }

        // throttle a function to avoid calling persistently
        // more details visit https://github.com/component/throttle
        function throttle(func, wait) {
            var ctx, args, rtn, timeoutID; // caching
            var last = 0;

            return function throttled() {
                ctx = this;
                args = arguments;
                var delta = new Date() - last;
                if (!timeoutID)
                    if (delta >= wait) call();
                    else timeoutID = setTimeout(call, wait - delta);
                return rtn;
            };

            function call() {
                timeoutID = 0;
                last = +new Date();
                rtn = func.apply(ctx, args);
                ctx = null;
                args = null;
            }
        }

        // type check
        function isType(target, type) {
            return Object.prototype.toString.call(target) === '[object ' + type + ']';
        }

        // estimate whether element in the document flow.
        function isElementInVisible(el) {
            return window.getComputedStyle(el, null).display === 'none';
        }

        // the callback that triggered by event to render the real image.
        function update() {
            var count = 0;

            elements.forEach(function (el) {
                // if element dislay 'none' and options.skipInvisible is true return the loop
                if (options.skipInvisible && isElementInVisible(el)) {
                    return false;
                }
                // if element above the fold or left of fold do nothing
                if (aboveTheFold(el, options) || leftOfFold(el, options)) {
                    return false;
                }
                // if element inview trigger event 'appear' and reset count
                else if (!belowTheFold(el, options) && !rightOfFold(el, options)) {
                    trigger(el, 'appear');
                    count = 0;
                }
                // when loop over the el outside the fold and is greater than
                // the options.failureLimit , stop loop
                else {
                    if (++count > options.failureLimit) {
                        return false;
                    }
                }
            })
        }
    }

    // define whether target is above the fold
    function aboveTheFold(el, options) {
        var fold,
            container = options.container,
            elOffset = el.getBoundingClientRect();

        if (container === undefined || container === window) {
            fold = window.pageYOffset;
        } else {
            fold = container.getBoundingClientRect().top + window.pageYOffset;
        }

        // judge whether element locate above the top of fold
        return fold >= elOffset.top + window.pageYOffset + options.threshold + elOffset.height;
    }

    // define whether target is right to fold
    function rightOfFold(el, options) {
        var fold,
            container = options.container,
            elOffset = el.getBoundingClientRect(),
            containerOffset;

        if (container === undefined || container === window) {
            fold = window.innerWidth + window.pageXOffset;
        } else {
            containerOffset = container.getBoundingClientRect();
            fold = containerOffset.width + containerOffset.left + window.pageXOffset;
        }
        // judge whether element locate right over the right of fold
        return fold <= elOffset.left + window.pageXOffset - options.threshold;
    }

    // define whether target is below the fold
    function belowTheFold(el, options) {
        var fold,
            container = options.container,
            elOffset = el.getBoundingClientRect(),
            containerOffset;

        if (container === undefined || container === window) {
            fold = window.innerHeight + window.pageYOffset;
        } else {
            containerOffset = container.getBoundingClientRect(),
                fold = containerOffset.top + containerOffset.height + window.pageYOffset;
        }
        // judge whether element locate below the bottom of fold
        return fold <= elOffset.top + window.pageYOffset - options.threshold;
    }

    // define whether target is left of fold
    function leftOfFold(el, options) {
        var fold,
            container = options.container,
            elOffset = el.getBoundingClientRect();

        if (container === undefined || container === window) {
            fold = window.pageXOffset;
        } else {
            fold = container.getBoundingClientRect().left + window.pageXOffset
        }

        // calc the condition that trigger 'appear'
        // viewtop = element.offsetTop + element.height + options.threshold
        return fold >= elOffset.left + window.pageXOffset + + options.threshold + elOffset.width;
    }

    // return lazylaod
    return lazyload;
});

