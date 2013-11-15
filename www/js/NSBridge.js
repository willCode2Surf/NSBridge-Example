(function (global) {
    var SETTIMEOUT = global.setTimeout, 
        doc = global.document,
        callback_counter = 0;

    global.jXHR = function () {
        var script_url,
            script_loaded,
            jsonp_callback,
            scriptElem,
            publicAPI = null;

        function removeScript() { try { scriptElem.parentNode.removeChild(scriptElem); } catch (err) { } }

        function reset() {
            script_loaded = false;
            script_url = '';
            removeScript();
            scriptElem = null;
            fireReadyStateChange(0);
        }

        function ThrowError(msg) {
            try { publicAPI.onerror.call(publicAPI, msg, script_url); } catch (err) { throw new Error(msg); }
        }

        function handleScriptLoad() {
            if ((this.readyState && this.readyState !== 'complete' && this.readyState !== 'loaded') || script_loaded) { return; }
            this.onload = this.onreadystatechange = null; 
            script_loaded = true;
            if (publicAPI.readyState !== 4) ThrowError('Script failed to load [' + script_url + '].');
            removeScript();
        }

        function fireReadyStateChange(rs, args) {
            args = args || [];
            publicAPI.readyState = rs;
            if (typeof publicAPI.onreadystatechange === 'function') publicAPI.onreadystatechange.apply(publicAPI, args);
        }

        publicAPI = {
            onerror: null,
            onreadystatechange: null,
            readyState: 0,
            open: function (method, url) {
                reset();
                internal_callback = 'cb' + (callback_counter++);
                (function (icb) {
                    global.jXHR[icb] = function () {
                        try { fireReadyStateChange.call(publicAPI, 4, arguments); }
                        catch (err) {
                            publicAPI.readyState = -1;
                            ThrowError('Script failed to run [' + script_url + '].');
                        }
                        global.jXHR[icb] = null;
                    };
                })(internal_callback);
                script_url = url.replace(/=\?/, '=jXHR.' + internal_callback);
                fireReadyStateChange(1);
            },
            send: function () {
                SETTIMEOUT(function () {
                    scriptElem = doc.createElement('script');
                    scriptElem.setAttribute('type', 'text/javascript');
                    scriptElem.onload = scriptElem.onreadystatechange = function () { handleScriptLoad.call(scriptElem); };
                    scriptElem.setAttribute('src', script_url);
                    doc.getElementsByTagName('head')[0].appendChild(scriptElem);
                }, 0);
                fireReadyStateChange(2);
            },
            setRequestHeader: function () { }, // noop
            getResponseHeader: function () { return ''; }, // basically noop
            getAllResponseHeaders: function () { return []; } // ditto
        };

        reset();

        return publicAPI;
    };
})(window);

NSBridge = {};
NSBridge.appId = 'nsbridge';
NSBridge.pageToken = 'index';
NSBridge.App = {};
NSBridge.API = {};
NSBridge.App._listeners = {};
NSBridge.App._listener_id = 1;
NSBridge.App.id = NSBridge.appId;
NSBridge.App._xhr = jXHR;
NSBridge._broker = function (module, method, data) {
    var x1 = new NSBridge.App._xhr();
    x1.onerror = function (e) {
        console.log('XHR error:' + JSON.stringify(e));
    };
    var url = 'app://' + module + '/' + method + '?callback=?&data=' + encodeURIComponent(JSON.stringify(data)) + '&_=' + Math.random();
    //console.log(url);
    x1.open('GET', url);
    x1.send();
};
NSBridge._hexish = function (a) {
    var r = '';
    var e = a.length;
    var c = 0;
    var h;
    while (c < e) {
        h = a.charCodeAt(c++).toString(16);
        r += '\\\\u';
        var l = 4 - h.length;
        while (l-- > 0) {
            r += '0'
        }
        ;
        r += h
    }
    return r
};
NSBridge._bridgeEnc = function (o) {
    return'<' + NSBridge._hexish(o) + '>'
};
NSBridge.App._JSON = function (object, bridge) {
    var type = typeof object;
    switch (type) {
        case'undefined':
        case'function':
        case'unknown':
            return undefined;
        case'number':
        case'boolean':
            return object;
        case'string':
            if (bridge === 1)return NSBridge._bridgeEnc(object);
            return '""' + object.replace(/""/g, '\\\\""').replace(/\\n/g, '\\\\n').replace(/\\r/g, '\\\\r') + '""'
    }
    if ((object === null) || (object.nodeType == 1))return'null';
    if (object.constructor.toString().indexOf('Date') != -1) {
        return'new Date(' + object.getTime() + ')'
    }
    if (object.constructor.toString().indexOf('Array') != -1) {
        var res = '[';
        var pre = '';
        var len = object.length;
        for (var i = 0; i < len; i++) {
            var value = object[i];
            if (value !== undefined)value = NSBridge.App._JSON(value, bridge);
            if (value !== undefined) {
                res += pre + value;
                pre = ', '
            }
        }
        return res + ']'
    }
    var objects = [];
    for (var prop in object) {
        var value = object[prop];
        if (value !== undefined) {
            value = NSBridge.App._JSON(value, bridge)
        }
        if (value !== undefined) {
            objects.push(NSBridge.App._JSON(prop, bridge) + ': ' + value)
        }
    }
    return'{' + objects.join(',') + '}'
};


NSBridge.App._dispatchEvent = function (type, evt) {
    var listeners = NSBridge.App._listeners[type];
    if (listeners) {
        for (var c = 0; c < listeners.length; c++) {
            var entry = listeners[c];
                entry.callback.call(entry.callback, evt)
        }
    }
};
NSBridge.App.fireEvent = function (name, evt) {
    NSBridge._broker('App', 'fireEvent', {name:name, event:evt})
};
NSBridge.API.log = function (a, b) {
    NSBridge._broker('API', 'log', {level:a, message:b})
};
NSBridge.API.debug = function (e) {
    NSBridge._broker('API', 'log', {level:'debug', message:e})
};
NSBridge.API.error = function (e) {
    NSBridge._broker('API', 'log', {level:'error', message:e})
};
NSBridge.API.info = function (e) {
    NSBridge._broker('API', 'log', {level:'info', message:e})
};
NSBridge.API.fatal = function (e) {
    NSBridge._broker('API', 'log', {level:'fatal', message:e})
};
NSBridge.API.warn = function (e) {
    NSBridge._broker('API', 'log', {level:'warn', message:e})
};
NSBridge.App.addEventListener = function (name, fn) {
    var listeners = NSBridge.App._listeners[name];
    if (typeof(listeners) == 'undefined') {
        listeners = [];
        NSBridge.App._listeners[name] = listeners
    }
    var newid = NSBridge.pageToken + NSBridge.App._listener_id++;
    listeners.push({callback:fn, id:newid});
};
NSBridge.App.removeEventListener = function (name, fn) {
    var listeners = NSBridge.App._listeners[name];
    if (listeners) {
        for (var c = 0; c < listeners.length; c++) {
            var entry = listeners[c];
            if (entry.callback == fn) {
                listeners.splice(c, 1);
                break
            }
        }
    }
};