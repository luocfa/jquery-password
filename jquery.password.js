/**
 * 阻止浏览器记住密码，不想记住密码的地方，引用一下这个js，按要求设置一下属性 要求如下： 
 * 1. 把原来的input type=password 改成type=text
 * 2. 给当前input增加一个tts_passwd属性，不用赋值 
 * 3. 获取密码的时候： 如果原来是调用的$().val()方法，则不用修改，插件已经重写$().val()方法，
 *    如果是用的obj.value属性，则须改为obj.tts_passwd
 */
// 1. 重写$().val();
$.fn.extend({
	val : function(value) {
		var hooks, ret, isFunction, elem = this[0];

		if (!arguments.length) {
			if (elem) {

				hooks = jQuery.valHooks[elem.type] || jQuery.valHooks[elem.nodeName.toLowerCase()];

				// 增加一行代码，其他不变，都是源码（基于jquery.1.7.2)
				if (typeof jQuery(elem).attr('tts_passwd') === 'string') {
					return elem.tts_passwd;
				}

				if (hooks && "get" in hooks && (ret = hooks.get(elem, "value")) !== undefined) {
					return ret;
				}

				ret = elem.value;

				// Handle most common string cases
				if (typeof ret === "string") {
					return ret.replace(/\r/g, "");
				}

				// Handle cases where value is null/undef or number
				return ret == null ? "" : ret;
			}

			return;
		}

		isFunction = jQuery.isFunction(value);

		return this.each(function(i) {
			var val;

			if (this.nodeType !== 1) {
				return;
			}

			if (isFunction) {
				val = value.call(this, i, jQuery(this).val());
			} else {
				val = value;
			}

			// Treat null/undefined as ""; convert numbers to string
			if (val == null) {
				val = "";

			} else if (typeof val === "number") {
				val += "";

			} else if (jQuery.isArray(val)) {
				val = jQuery.map(val, function(value) {
					return value == null ? "" : value + "";
				});
			}

			hooks = jQuery.valHooks[this.type] || jQuery.valHooks[this.nodeName.toLowerCase()];

			// If set returns undefined, fall back to normal setting
			if (!hooks || !("set" in hooks) || hooks.set(this, val, "value") === undefined) {
				this.value = val;
			}
		});
	}
});

$(function() {
	// 给页面的原来的type=password的input框，改为type=text并且增加tts_passwd空属性
	var passwd = $('input[type=text][tts_passwd]');
	var pat = /^[a-zA-Z0-9\~\!\@\$\%\^\&\*\?\/\-]+$/; // 密码可输入字符
	var pat2 = /^[\u2022]*([^\u2022]+)[\u2022]*$/; // 判断新输入的非*的字符
	// 2. 给各个框绑定事件，模拟密码框
	passwd.each(function(i, n) {

		$(n).on('focus', function() {// ie下面可以直接禁用输入法
			this.style.imeMode = 'disabled';
		}).on('paste', function() {// 禁止粘贴
			return false;
		}).on('contextmenu', function() {// 禁止右键
			return false;
		}).on('dragenter', function() {// 禁止拖拽
			return false;
		});
		
		if ('oninput' in n) {
			// 支持oninput的浏览器(ie9+和其他浏览器)
			n.addEventListener("input", function() {
				oninput(n);
			}, false);
			// ie9下面del和剪切无法触发input的事件，手动触发一下
			if (navigator.appName == "Microsoft Internet Explorer" && navigator.appVersion.match(/9./i)=="9.") {
				n.attachEvent('onkeyup', function(e){
					if(e.keyCode === 8 || (e.ctrlKey && e.keyCode === 88)){
						oninput(n);
					}
				});
			}
		} else {
			// ie8-
			n.onpropertychange = function() {
				// oninput方法里面会修改n的value属性和新增属性，也会触发propertychange，所以这里要加个判断
				if (window.event.propertyName == 'value' && (pat2.test(n.value) || n.value.length < (n.tts_passwd && n.tts_passwd.length))) {
					oninput(n);
				}
			};
		}

	});
	
	// this is core code, very important
	function oninput(obj) {
		var v = obj.value;
		var pos = getSelection(obj);
		var v1 = '', v2 = obj.tts_passwd || '';
		if (v.length >= 0) {
			var m1 = v.match(pat2);
			v1 = m1 && m1[1] ? m1[1] : '';
			if (v1 && pat.test(v1)) {
				v2 = v2.substring(0, pos.s - v1.length) + v1 + v2.substring(v2.length - (v.length - pos.s));
				v1 = v.replace(/[^\u2022]/g, '•');
			} else {
				if (v.length - v1.length < v2.length) {
					v2 = v2.substring(0, pos.s - v1.length) + v2.substring(v2.length - (v.length - pos.s));
				}
				v1 = v.substring(0, v2.length);
			}
			obj.tts_passwd = v2;
			obj.value = v1;
			setSelection(obj, pos.s, pos.s);
		}
	}
	
	// 获取光标位置
	var getSelection = function(obj) {
		var _this = obj;
		var s, e, length, value;
		if ('selectionStart' in _this) {
			_this.focus();
			s = _this.selectionStart;
			e = _this.selectionEnd;
			length = e - s;
			value = _this.value.substr(s, length);
		} else if (document.selection) {
			_this.focus();
			var r = document.selection.createRange();
			var tr = _this.createTextRange();
			var tr2 = tr.duplicate();
			tr2.moveToBookmark(r.getBookmark());
			tr.setEndPoint('EndToStart', tr2);
			if (r == null || tr == null) {
				s = _this.value.length;
				e = s;
				length = 0;
				value = '';
			} else {
				var text_part = r.text.replace(/[\r\n]/g, '.');
				var text_whole = _this.value.replace(/[\r\n]/g, '.');
				s = text_whole.indexOf(text_part, tr.text.length);
				e = s + text_part.length;
				length = text_part.length;
				value = r.text;
			}
		} else {
			s = _this.value.length;
			e = s;
			length = 0;
			value = '';
		}

		return {
			s : s,
			e : e,
			length : length,
			value : value
		}
	}
	
	// 设置光标位置
	var setSelection = function(obj, s, e) {
		var _this = obj;
		if ('selectionStart' in _this) {
			_this.focus();
			_this.selectionStart = s;
			_this.selectionEnd = e;
		} else if (document.selection) {
			_this.focus();
			var tr = _this.createTextRange();
			var stop_it = s;
			for (i = 0; i < stop_it; i++) {
				if (_this.value.charAt(i).search(/[\r\n]/) != -1) {
					s = s - .5;
				}
			}
			stop_it = e;
			for (i = 0; i < stop_it; i++) {
				if (_this.value.charAt(i).search(/[\r\n]/) != -1) {
					e = e - .5;
				}
			}
			tr.moveEnd('textedit', -1);
			tr.moveStart('character', s);
			tr.moveEnd('character', e - s);
			tr.select();
		}
	}
	
});
