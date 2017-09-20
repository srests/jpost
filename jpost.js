/**
 * jPost.js:获取页面表单数据，并通过ajax提交到指定url
 * 用法：
 * 两个函数直接使用 jPost、jGet,jPost会将页面中所有表单信息转化为json串，jGet则直接请求，
 * 也可以使用$(dom).jPost，所取表单为dom中所有表单
 * jGet(url,fun) fun为回调函数
 * jPost(url,fun)
 * jPost(url,obj) obj属性可传：
 *  callback : 回调函数
 *	prefix : 属性前缀，如属性名为name,前缀为student.,则最终json为{"student.name":""}
 *	attr : 使用哪个属性作为json中的key，默认为name
 *	data : 附加参数，{key:val}
 *	isclean : 清除选项，提交后是否清除整个表单的内容
 *
 * v1.0:修正嵌套使用时，参数重用问题
 */
(function($) {
    function Content(key, value) {
        this.key = null;
        this.value = null;
        if (key != null)
            this.key = key;
        if (value != null)
            this.value = value;

        // map拷贝
        this.clone = function() {
            var content = new Content();
            content.key = this.key;
            content.value = this.value;

            return content;
        }
    }

    // 模仿java Map
    function Map(objs) {
        this.arr = new Array();
        if (objs != null) {
            this.arr = new Array(objs.length);
            for ( var i = 0; i < this.size(); i += 1) {
                this.arr[i] = objs[i];
            }
        }
        // 获取map大小
        this.size = function() {
            return this.arr.length;
        }
        // map拷贝
        this.clone = function() {
            var map = new Map;
            for ( var i = 0; i < this.size(); i += 1) {
                map.arr[i] = this.arr[i].clone();
            }

            return map;
        }
        //
        this.put = function(key, value) {
            for ( var i = 0; i < this.size(); i += 1) {
                if (this.arr[i].key == key) {
                    this.arr[i].value = value;
                    return this;
                }
            }

            var obj = new Content();
            obj.key = key;
            obj.value = value;

            this.arr.push(obj);
        }
        // 可以以key查，也可以按索引
        this.get = function(key) {
            // 如果不是数据则按key查找
            if (typeof (key) != "number") {
                for ( var i = 0; i < this.size(); i += 1) {
                    if (this.arr[i].key == key) {
                        return this.arr[i].value;
                    }
                }
            } else {
                if (key >= 0 && key < this.size())
                    return this.arr[key].value;
            }

            return null;
        }
        // 返回指定索引的对象
        this.getObj = function(index) {
            if (index >= 0 && index < this.size())
                return this.arr[index];

            return null;
        }
        // 返回指定索引的key
        this.getKey = function(index) {
            if (index >= 0 && index < this.size())
                return this.arr[index].key;

            return null;
        }
        // 将map转换成JSON字串(不可用)
        // this.toJSON = function(map) {
        // 	if (map == null)
        // 		map = this;
        // 	var strjson = "";
        // 	for ( var i = 0; i < map.size(); i += 1) {
        // 		if (i != 0)
        // 			strjson += ",";
        // 		strjson += "{" + "" + map.getKey(i) + ":" + map.getAjax(i) + ""
        // 				+ "}";
        // 	}

        // 	return strjson;
        // }
        // 将map转换成JSON字串
        this.toJSON = function() {
            var args = arguments.length;
            var types = new Array(args);
            var prefix = null;
            var map = null;

            for ( var i = 0; i < args; i += 1) {
                types[i] = getType(arguments[i]);
            }
            if (args == 1) {
                if (types[0] == "string") {
                    prefix = arguments[0];
                } else if (types[0] == "object") {
                    map = arguments[0];
                }
            } else if (args == 2) {
                map = arguments[0];
                prefix = arguments[1];
            }
            if (map == null)
                map = this;
            if (prefix == null)
                prefix = "";
            var strajax = '';
            for ( var i = 0; i < map.size(); i += 1) {
                if (i != 0)
                    strajax += ',';
                var key = map.getKey(i);
                // 如果已经存在前缀，则不再增加
                if (getType(key) == "string") {
                    if (key.indexOf(prefix) == -1)
                        key = prefix + map.getKey(i);
                } else {
                    key = prefix;
                }
                strajax += '"' + key + '"' + ':' + map.getAjax(i);
            }
            eval("var json = {" + strajax + "}");

            return json;
        }

        // 返回指定对象AJAX字串
        this.getAjax = function(key) {
            var value = null;
            // 如果不是数字则按key查找
            if (typeof (key) != "number") {
                for ( var i = 0; i < this.size(); i += 1) {
                    if (this.arr[i].key == key) {
                        value = this.arr[i].value;
                    }
                }
            } else {
                if (key >= 0 && key < this.size())
                    value = this.arr[key].value;
            }

            switch (getType(value)) {
                case "string":
                    value = '"' + this.preText(value) + '"';
                    break;
                case "array":
                    var str = "[";
                    for ( var i = 0; i < value.length; i += 1) {
                        if (i > 0)
                            str += ",";
                        str += '"' + this.preText(value[i]) + '"';
                    }
                    value = str + "]";
                    break;
                default:
                    break;
            }

            return value;
        }
        //字符串处理
        this.preText = function(value){
            value = value.replace(/\"/g,"&#34;");
            value = value.replace(/[\t\r\n]|(^\s*)|(\s*$)/g, "");
            value = value.replace(/</g, "&lt;");
            value = value.replace(/>/g, "&gt;");

            //汉字处理
            //if(/[\u2E80-\u9FFF]+/.test(value)){
            //	value=encodeURIComponent(value);
            //}

            return value;
        }
    }

    $.PostAjax = {
        map : null, // 表单数据
        vMap : null, // 需要验证的表单数据
        json : null, // JSON结果
        isValidate : true, // 是否验证数据

        /**
         * jPost提交,可以另外增加参数 {"url":"" "data":{} "attr":attr }
         */
        jPost : function(settings) {
            var callback = settings.callback;
            if (callback == null) {
                callback = function(json) {
                    $.PostAjax.json = json;
                };
            }

            // 初始化使用数据
            map=new Map();
            vMap=new Map();
            //是否post提交，如果是获取页面内容
            if(!settings.isGets){
                $.PostAjax.getValues(settings.attr, settings.appoint,settings.isclean);
                $.PostAjax.submit(settings.url, callback,"post", settings.data,settings.prefix);
            }else{
                $.PostAjax.submit(settings.url, callback, "get",{});
            }

            return $.PostAjax.json;
        },
        // 获取页面表单数据
        getValues : function(attr, appoint,isClean) {
            var from;
            $.PostAjax.map = new Map();
            // 默认取name
            if (attr == null)
                attr = "name";
            // 默认找页面中所有的表单数据，如果设置ID将找指定ID下的from表单
            // ,也可以是name或者对象本身
            switch (getType(appoint)) {
                case "string":
                    from = $("#" + appoint);
                    if (from.length <= 0)
                        from = $(appoint);
                    if (from.length <= 0)
                        from = $("from[name='" + appoint + "']");
                    break;
                case "object":
                    from = $(appoint);
                    break;
                default:
                    from = $(document);
            }
            if (from.length <= 0) {
                from = $(document);
            }
            // 获取表单下所有文本、选择框等
            var inputs = from.find(":input");

            var counts = 0;

            //判断是否在提交之后，消除表单内容
            var getValue=null;
            if(isClean){
                getValue = $.PostAjax.cleanInputValue;
            }else{
                getValue = $.PostAjax.getInputValue;
            }
            // 未找到表单内容则直接返回
            if (inputs.length == 0)
                return $.PostAjax.map.clone();
            if (inputs.length > 1) {
                // 遍历表单内容
                for ( var i = 0; i < inputs.length; i += 1) {
                    var input = $(inputs[i]);
                    var value = $.PostAjax.getInputValue(input);
                    // 如果表单内容非法则跳过
                    if (value != undefined) {
                        var tmp = $.PostAjax.map.get(input.attr(attr));
                        // 如果属性相同，则将表单数据放入数组当中
                        if (tmp != null&&tmp!=value) {
                            if (getType(tmp) == "array")
                                tmp.push(value);
                            else
                                tmp = new Array(tmp, value);
                        } else {
                            tmp = getValue(input);
                        }

                        $.PostAjax.map.put(input.attr(attr), tmp);
                    }
                }
            } else {
                $.PostAjax.map.put(inputs.attr(attr), getValue(inputs));
            }

            return $.PostAjax.map.clone();
        },
        // 根据input类型返回值
        getInputValue : function(input) {
            if (input == null || input == undefined)
                return "";
            // 查找未被禁用的内容
            if (input.attr("disabled"))
                return undefined;
            var itype = input[0].type;
            switch (itype) {
                case 'text': // 文本
                case 'select-one':// 下拉列表
                case 'hidden':// 隐藏域
                case 'file': // 文件域
                case 'password':// 密码
                    return input.val();
                case 'radio': // 单选按钮
                case 'checkbox':// 多选
                    if (input[0].checked) {
                        return input.val();
                    } else {
                        return undefined;
                    }
                case 'textarea': // 文本域
                    var val = input.val();
                    return val!=""?val:input.html();
                default:
                    return undefined;
            }
        },
        //根据input类型返回内容，并消空input
        cleanInputValue:function(input){
            if (input == null || input == undefined)
                return "";
            // 查找未被禁用的内容
            if (input.attr("disabled"))
                return undefined;
            var itype = input[0].type;
            var val = undefined;

            switch (itype) {
                case 'text': // 文本
                case 'select-one':// 下拉列表
                case 'hidden':// 隐藏域
                case 'file': // 文件域
                case 'password':// 密码
                    val = input.val();
                    input.val(null);
                    break;
                case 'radio': // 单选按钮
                case 'checkbox':// 多选
                    if (input[0].checked) {
                        val = input.val();
                        input.val(null);
                    } else {
                        val = undefined;
                    }
                    break;
                case 'textarea': // 文本域
                    var val = input.val();
                    if(val==""){
                        val = input.html();
                        input.html(null);
                    }else{
                        input.val(null);
                    }
                    break;
                default:
                    val = undefined;
            }

            return val;
        },
        // 验证数据
        validate : function(map) {
            if (map == null || map == undefined)
                map = $.PostAjax.map;
            return true;
        },
        // 提交数据
        submit : function(url, callback,type, data, prefix) {
            if(type=="post")
                data = $.extend(data, $.PostAjax.map.toJSON(prefix));
            // 是否验证
            if ($.PostAjax.isValidate) {
                var vResult = $.PostAjax.validate();
                // 如果验证失败，则返回失败信息
                if (!vResult)
                    return vResult;
            }
            // 提交
            $.ajax( {
                url : url,
                type : type,
                data : (data),
                cache : false,
                success : callback,
                error : function(XMLHttpRequest, status, errorThrown) {
                    //console.log(errorThrown);
                    if ('error' == status) {
                        alert("系统发生错误："+errorThrown);
                    } else if('timeout' == status){
                        alert("请求超时");
                    } else if ('parsererror' == status){
                        alert("解析错误："+errorThrown);
                    } else {
                        alert("未知异常！");
                    }
                }
            });
        }
    }

    // 获取变量类型
    getType = function(obj) {
        switch (obj) {
            case null:
                return "null";
            case undefined:
                return "undefined";
        }
        var s = Object.prototype.toString.call(obj);
        switch (s) {
            case "[object String]":
                return "string";
            case "[object Number]":
                return "number";
            case "[object Boolean]":
                return "boolean";
            case "[object Array]":
                return "array";
            case "[object Date]":
                return "date";
            case "[object Function]":
                return "function";
            case "[object RegExp]":
                return "regExp";
            case "[object Object]":
                return "object";
            default:
                return "object";
        }
    }

    // 根据不同参数，执行提交
    $.fn.jPost = function() {
        var args = arguments.length;
        var types = new Array(args);

        for ( var i = 0; i < args; i += 1) {
            types[i] = getType(arguments[i]);
        }
        // 只传url
        if (types[0] == "string" && args == 1) {
            return $.PostAjax.jPost( {
                url : arguments[0],
                appoint : this
            });
            // 传url与回调函数
        } else if (types[0] == "string" && types[1] == "function") {
            return $.PostAjax.jPost( {
                url : arguments[0],
                callback : arguments[1],
                appoint : this,
                attr : arguments[2]
            });
            // 传url、清除选项与回调函数
        } else if (types[0] == "string" && types[1] == "boolean" && types[2] == "function") {
            return $.PostAjax.jPost( {
                url : arguments[0],
                isclean : arguments[1],
                callback : arguments[2],
                attr : arguments[3],
                appoint : this
            });
            // 将原有参数以对象属性传入
        } else if (types[0] == "object" && types[1] == "function") {
            return $.PostAjax.jPost( {
                url : arguments[0].url,
                callback : arguments[1],
                appoint : this,
                prefix : arguments[0].prefix,
                attr : arguments[0].attr,
                data : arguments[0].data,
                isclean : arguments[0].isclean,
            });
        } else {
            return false;
        }
    }
    // 获取表单内容
    $.fn.getJson = function(attr, prefix) {
        if (attr == null)
            attr = "name";
        var data = $.PostAjax.getValues(attr, this).toJSON(prefix);

        return data;
    }
    // 查询数据
    jGet = function(url,callback){
        return $.PostAjax.jPost( {
            url : url,
            callback : callback,
            isGets:true
        });
    }
    // 提交全页面表单数据
    jPost = function() {
        var args = arguments.length;
        var types = new Array(args);

        for ( var i = 0; i < args; i += 1) {
            types[i] = getType(arguments[i]);
        }

        // 只传url
        if (types[0] == "string" && args == 1) {
            return $.PostAjax.jPost( {
                url : arguments[0]
            });
            // 只传url、前缀
        } else if (types[0] == "string" && types[1] == "string" && args == 2) {
            return $.PostAjax.jPost( {
                url : arguments[0],
                prefix : arguments[1]
            });
            // 传url与回调函数
        } else if (types[0] == "string" && types[1] == "function") {
            return $.PostAjax.jPost( {
                url : arguments[0],
                callback : arguments[1],
                attr : arguments[2]
            });
            // 传url、清除选项与回调函数
        } else if (types[0] == "string" && types[1] == "boolean" && types[2] == "function") {
            return $.PostAjax.jPost( {
                url : arguments[0],
                isclean : arguments[1],
                callback : arguments[2],
                attr : arguments[3]
            });
            // 传url、前缀与回调函数
        } else if (types[0] == "string" && types[1] == "string"
            && types[2] == "function") {
            return $.PostAjax.jPost( {
                url : arguments[0],
                prefix : arguments[1],
                callback : arguments[2],
                attr : arguments[3]
            });
            // 将原有参数以对象属性传入
        } else if (types[0] == "object" && types[1] == "function") {
            return $.PostAjax.jPost( {
                url : arguments[0].url,
                callback : arguments[1],
                attr : arguments[0].attr,
                prefix : arguments[0].prefix,
                data : arguments[0].data,
                isclean:arguments[0].isclean
            });
        } else {
            return false;
        }
    }
    // 获取表单内容
    getJson = function(attr, prefix) {
        if (attr == null)
            attr = "name";
        var data = $.PostAjax.getValues(attr).toJSON(prefix);

        return data;
    }
})(jQuery);

var noparameter = {action:"query"};/**
 * jPost.js:获取页面表单数据，并通过ajax提交到指定url
 * 用法：
 * 两个函数直接使用 jPost、jGet,jPost会将页面中所有表单信息转化为json串，jGet则直接请求，
 * 也可以使用$(dom).jPost，所取表单为dom中所有表单
 * jGet(url,fun) fun为回调函数
 * jPost(url,fun)
 * jPost(url,obj) obj属性可传：
 *  callback : 回调函数
 *	prefix : 属性前缀，如属性名为name,前缀为student.,则最终json为{"student.name":""}
 *	attr : 使用哪个属性作为json中的key，默认为name
 *	data : 附加参数，{key:val}
 *	isclean : 清除选项，提交后是否清除整个表单的内容
 *
 * v1.0:修正嵌套使用时，参数重用问题
 */
(function($) {
    function Content(key, value) {
        this.key = null;
        this.value = null;
        if (key != null)
            this.key = key;
        if (value != null)
            this.value = value;

        // map拷贝
        this.clone = function() {
            var content = new Content();
            content.key = this.key;
            content.value = this.value;

            return content;
        }
    }

    // 模仿java Map
    function Map(objs) {
        this.arr = new Array();
        if (objs != null) {
            this.arr = new Array(objs.length);
            for ( var i = 0; i < this.size(); i += 1) {
                this.arr[i] = objs[i];
            }
        }
        // 获取map大小
        this.size = function() {
            return this.arr.length;
        }
        // map拷贝
        this.clone = function() {
            var map = new Map;
            for ( var i = 0; i < this.size(); i += 1) {
                map.arr[i] = this.arr[i].clone();
            }

            return map;
        }
        //
        this.put = function(key, value) {
            for ( var i = 0; i < this.size(); i += 1) {
                if (this.arr[i].key == key) {
                    this.arr[i].value = value;
                    return this;
                }
            }

            var obj = new Content();
            obj.key = key;
            obj.value = value;

            this.arr.push(obj);
        }
        // 可以以key查，也可以按索引
        this.get = function(key) {
            // 如果不是数据则按key查找
            if (typeof (key) != "number") {
                for ( var i = 0; i < this.size(); i += 1) {
                    if (this.arr[i].key == key) {
                        return this.arr[i].value;
                    }
                }
            } else {
                if (key >= 0 && key < this.size())
                    return this.arr[key].value;
            }

            return null;
        }
        // 返回指定索引的对象
        this.getObj = function(index) {
            if (index >= 0 && index < this.size())
                return this.arr[index];

            return null;
        }
        // 返回指定索引的key
        this.getKey = function(index) {
            if (index >= 0 && index < this.size())
                return this.arr[index].key;

            return null;
        }
        // 将map转换成JSON字串(不可用)
        // this.toJSON = function(map) {
        // 	if (map == null)
        // 		map = this;
        // 	var strjson = "";
        // 	for ( var i = 0; i < map.size(); i += 1) {
        // 		if (i != 0)
        // 			strjson += ",";
        // 		strjson += "{" + "" + map.getKey(i) + ":" + map.getAjax(i) + ""
        // 				+ "}";
        // 	}

        // 	return strjson;
        // }
        // 将map转换成JSON字串
        this.toJSON = function() {
            var args = arguments.length;
            var types = new Array(args);
            var prefix = null;
            var map = null;

            for ( var i = 0; i < args; i += 1) {
                types[i] = getType(arguments[i]);
            }
            if (args == 1) {
                if (types[0] == "string") {
                    prefix = arguments[0];
                } else if (types[0] == "object") {
                    map = arguments[0];
                }
            } else if (args == 2) {
                map = arguments[0];
                prefix = arguments[1];
            }
            if (map == null)
                map = this;
            if (prefix == null)
                prefix = "";
            var strajax = '';
            for ( var i = 0; i < map.size(); i += 1) {
                if (i != 0)
                    strajax += ',';
                var key = map.getKey(i);
                // 如果已经存在前缀，则不再增加
                if (getType(key) == "string") {
                    if (key.indexOf(prefix) == -1)
                        key = prefix + map.getKey(i);
                } else {
                    key = prefix;
                }
                strajax += '"' + key + '"' + ':' + map.getAjax(i);
            }
            eval("var json = {" + strajax + "}");

            return json;
        }

        // 返回指定对象AJAX字串
        this.getAjax = function(key) {
            var value = null;
            // 如果不是数字则按key查找
            if (typeof (key) != "number") {
                for ( var i = 0; i < this.size(); i += 1) {
                    if (this.arr[i].key == key) {
                        value = this.arr[i].value;
                    }
                }
            } else {
                if (key >= 0 && key < this.size())
                    value = this.arr[key].value;
            }

            switch (getType(value)) {
                case "string":
                    value = '"' + this.preText(value) + '"';
                    break;
                case "array":
                    var str = "[";
                    for ( var i = 0; i < value.length; i += 1) {
                        if (i > 0)
                            str += ",";
                        str += '"' + this.preText(value[i]) + '"';
                    }
                    value = str + "]";
                    break;
                default:
                    break;
            }

            return value;
        }
        //字符串处理
        this.preText = function(value){
            value = value.replace(/\"/g,"&#34;");
            value = value.replace(/[\t\r\n]|(^\s*)|(\s*$)/g, "");
            value = value.replace(/</g, "&lt;");
            value = value.replace(/>/g, "&gt;");

            //汉字处理
            //if(/[\u2E80-\u9FFF]+/.test(value)){
            //	value=encodeURIComponent(value);
            //}

            return value;
        }
    }

    $.PostAjax = {
        map : null, // 表单数据
        vMap : null, // 需要验证的表单数据
        json : null, // JSON结果
        isValidate : true, // 是否验证数据

        /**
         * jPost提交,可以另外增加参数 {"url":"" "data":{} "attr":attr }
         */
        jPost : function(settings) {
            var callback = settings.callback;
            if (callback == null) {
                callback = function(json) {
                    $.PostAjax.json = json;
                };
            }

            // 初始化使用数据
            map=new Map();
            vMap=new Map();
            //是否post提交，如果是获取页面内容
            if(!settings.isGets){
                $.PostAjax.getValues(settings.attr, settings.appoint,settings.isclean);
                $.PostAjax.submit(settings.url, callback,"post", settings.data,settings.prefix);
            }else{
                $.PostAjax.submit(settings.url, callback, "get",{});
            }

            return $.PostAjax.json;
        },
        // 获取页面表单数据
        getValues : function(attr, appoint,isClean) {
            var from;
            $.PostAjax.map = new Map();
            // 默认取name
            if (attr == null)
                attr = "name";
            // 默认找页面中所有的表单数据，如果设置ID将找指定ID下的from表单
            // ,也可以是name或者对象本身
            switch (getType(appoint)) {
                case "string":
                    from = $("#" + appoint);
                    if (from.length <= 0)
                        from = $(appoint);
                    if (from.length <= 0)
                        from = $("from[name='" + appoint + "']");
                    break;
                case "object":
                    from = $(appoint);
                    break;
                default:
                    from = $(document);
            }
            if (from.length <= 0) {
                from = $(document);
            }
            // 获取表单下所有文本、选择框等
            var inputs = from.find(":input");

            var counts = 0;

            //判断是否在提交之后，消除表单内容
            var getValue=null;
            if(isClean){
                getValue = $.PostAjax.cleanInputValue;
            }else{
                getValue = $.PostAjax.getInputValue;
            }
            // 未找到表单内容则直接返回
            if (inputs.length == 0)
                return $.PostAjax.map.clone();
            if (inputs.length > 1) {
                // 遍历表单内容
                for ( var i = 0; i < inputs.length; i += 1) {
                    var input = $(inputs[i]);
                    var value = $.PostAjax.getInputValue(input);
                    // 如果表单内容非法则跳过
                    if (value != undefined) {
                        var tmp = $.PostAjax.map.get(input.attr(attr));
                        // 如果属性相同，则将表单数据放入数组当中
                        if (tmp != null&&tmp!=value) {
                            if (getType(tmp) == "array")
                                tmp.push(value);
                            else
                                tmp = new Array(tmp, value);
                        } else {
                            tmp = getValue(input);
                        }

                        $.PostAjax.map.put(input.attr(attr), tmp);
                    }
                }
            } else {
                $.PostAjax.map.put(inputs.attr(attr), getValue(inputs));
            }

            return $.PostAjax.map.clone();
        },
        // 根据input类型返回值
        getInputValue : function(input) {
            if (input == null || input == undefined)
                return "";
            // 查找未被禁用的内容
            if (input.attr("disabled"))
                return undefined;
            var itype = input[0].type;
            switch (itype) {
                case 'text': // 文本
                case 'select-one':// 下拉列表
                case 'hidden':// 隐藏域
                case 'file': // 文件域
                case 'password':// 密码
                    return input.val();
                case 'radio': // 单选按钮
                case 'checkbox':// 多选
                    if (input[0].checked) {
                        return input.val();
                    } else {
                        return undefined;
                    }
                case 'textarea': // 文本域
                    var val = input.val();
                    return val!=""?val:input.html();
                default:
                    return undefined;
            }
        },
        //根据input类型返回内容，并消空input
        cleanInputValue:function(input){
            if (input == null || input == undefined)
                return "";
            // 查找未被禁用的内容
            if (input.attr("disabled"))
                return undefined;
            var itype = input[0].type;
            var val = undefined;

            switch (itype) {
                case 'text': // 文本
                case 'select-one':// 下拉列表
                case 'hidden':// 隐藏域
                case 'file': // 文件域
                case 'password':// 密码
                    val = input.val();
                    input.val(null);
                    break;
                case 'radio': // 单选按钮
                case 'checkbox':// 多选
                    if (input[0].checked) {
                        val = input.val();
                        input.val(null);
                    } else {
                        val = undefined;
                    }
                    break;
                case 'textarea': // 文本域
                    var val = input.val();
                    if(val==""){
                        val = input.html();
                        input.html(null);
                    }else{
                        input.val(null);
                    }
                    break;
                default:
                    val = undefined;
            }

            return val;
        },
        // 验证数据
        validate : function(map) {
            if (map == null || map == undefined)
                map = $.PostAjax.map;
            return true;
        },
        // 提交数据
        submit : function(url, callback,type, data, prefix) {
            if(type=="post")
                data = $.extend(data, $.PostAjax.map.toJSON(prefix));
            // 是否验证
            if ($.PostAjax.isValidate) {
                var vResult = $.PostAjax.validate();
                // 如果验证失败，则返回失败信息
                if (!vResult)
                    return vResult;
            }
            // 提交
            $.ajax( {
                url : url,
                type : type,
                data : (data),
                cache : false,
                success : callback,
                error : function(XMLHttpRequest, status, errorThrown) {
                    //console.log(errorThrown);
                    if ('error' == status) {
                        alert("系统发生错误："+errorThrown);
                    } else if('timeout' == status){
                        alert("请求超时");
                    } else if ('parsererror' == status){
                        alert("解析错误："+errorThrown);
                    } else {
                        alert("未知异常！");
                    }
                }
            });
        }
    }

    // 获取变量类型
    getType = function(obj) {
        switch (obj) {
            case null:
                return "null";
            case undefined:
                return "undefined";
        }
        var s = Object.prototype.toString.call(obj);
        switch (s) {
            case "[object String]":
                return "string";
            case "[object Number]":
                return "number";
            case "[object Boolean]":
                return "boolean";
            case "[object Array]":
                return "array";
            case "[object Date]":
                return "date";
            case "[object Function]":
                return "function";
            case "[object RegExp]":
                return "regExp";
            case "[object Object]":
                return "object";
            default:
                return "object";
        }
    }

    // 根据不同参数，执行提交
    $.fn.jPost = function() {
        var args = arguments.length;
        var types = new Array(args);

        for ( var i = 0; i < args; i += 1) {
            types[i] = getType(arguments[i]);
        }
        // 只传url
        if (types[0] == "string" && args == 1) {
            return $.PostAjax.jPost( {
                url : arguments[0],
                appoint : this
            });
            // 传url与回调函数
        } else if (types[0] == "string" && types[1] == "function") {
            return $.PostAjax.jPost( {
                url : arguments[0],
                callback : arguments[1],
                appoint : this,
                attr : arguments[2]
            });
            // 传url、清除选项与回调函数
        } else if (types[0] == "string" && types[1] == "boolean" && types[2] == "function") {
            return $.PostAjax.jPost( {
                url : arguments[0],
                isclean : arguments[1],
                callback : arguments[2],
                attr : arguments[3],
                appoint : this
            });
            // 将原有参数以对象属性传入
        } else if (types[0] == "object" && types[1] == "function") {
            return $.PostAjax.jPost( {
                url : arguments[0].url,
                callback : arguments[1],
                appoint : this,
                prefix : arguments[0].prefix,
                attr : arguments[0].attr,
                data : arguments[0].data,
                isclean : arguments[0].isclean,
            });
        } else {
            return false;
        }
    }
    // 获取表单内容
    $.fn.getJson = function(attr, prefix) {
        if (attr == null)
            attr = "name";
        var data = $.PostAjax.getValues(attr, this).toJSON(prefix);

        return data;
    }
    // 查询数据
    jGet = function(url,callback){
        return $.PostAjax.jPost( {
            url : url,
            callback : callback,
            isGets:true
        });
    }
    // 提交全页面表单数据
    jPost = function() {
        var args = arguments.length;
        var types = new Array(args);

        for ( var i = 0; i < args; i += 1) {
            types[i] = getType(arguments[i]);
        }

        // 只传url
        if (types[0] == "string" && args == 1) {
            return $.PostAjax.jPost( {
                url : arguments[0]
            });
            // 只传url、前缀
        } else if (types[0] == "string" && types[1] == "string" && args == 2) {
            return $.PostAjax.jPost( {
                url : arguments[0],
                prefix : arguments[1]
            });
            // 传url与回调函数
        } else if (types[0] == "string" && types[1] == "function") {
            return $.PostAjax.jPost( {
                url : arguments[0],
                callback : arguments[1],
                attr : arguments[2]
            });
            // 传url、清除选项与回调函数
        } else if (types[0] == "string" && types[1] == "boolean" && types[2] == "function") {
            return $.PostAjax.jPost( {
                url : arguments[0],
                isclean : arguments[1],
                callback : arguments[2],
                attr : arguments[3]
            });
            // 传url、前缀与回调函数
        } else if (types[0] == "string" && types[1] == "string"
            && types[2] == "function") {
            return $.PostAjax.jPost( {
                url : arguments[0],
                prefix : arguments[1],
                callback : arguments[2],
                attr : arguments[3]
            });
            // 将原有参数以对象属性传入
        } else if (types[0] == "object" && types[1] == "function") {
            return $.PostAjax.jPost( {
                url : arguments[0].url,
                callback : arguments[1],
                attr : arguments[0].attr,
                prefix : arguments[0].prefix,
                data : arguments[0].data,
                isclean:arguments[0].isclean
            });
        } else {
            return false;
        }
    }
    // 获取表单内容
    getJson = function(attr, prefix) {
        if (attr == null)
            attr = "name";
        var data = $.PostAjax.getValues(attr).toJSON(prefix);

        return data;
    }
})(jQuery);

var noparameter = {action:"query"};
