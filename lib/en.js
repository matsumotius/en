$(function(){
    var Util = {
        max_abs : function(a, b){
            abs_a = Math.abs(a), abs_b = Math.abs(b);
            return abs_a == Math.max(abs_a, abs_b) ? a : b;
        },
        min_abs : function(a, b){
            abs_a = Math.abs(a), abs_b = Math.abs(b);
            return abs_a == Math.min(abs_a, abs_b) ? a : b;
        }
    };
    EN_PC_EVENTS = ['click', 'mousemove', 'mouseup', 'mousedown', 'mouseover', 'dblclick'];
    EN_SMARTPHONE_EVENTS = ['touchstart', 'touchend', 'touchmove'];
    var this_is_smartphone = (navigator.userAgent.match(/iPhone/) || navigator.userAgent.match(/iPad/) || 
                              navigator.userAgent.match(/Android/)) ? true : false;
    var En = function(_target, _options){
        this.target = _target;
        this.context = _target.getContext('2d');
        this.options = _options;
        this.x = _options.x;
        this.y = _options.y;
        this.type = (_options.type == 'fill') ? 'fill' : 'stroke';
        this.color = _options.color;
        this.border = 1;
        this.radius = _options.radius;
        this.is_on_rail = false;
        this.is_smartphone = this_is_smartphone;
        this.rail = null;
        this.events = {};
        for(var i=0;i<EN_PC_EVENTS.length;i++) this.events[EN_PC_EVENTS[i]] = [];
        for(var i=0;i<EN_SMARTPHONE_EVENTS.length;i++) this.events[EN_SMARTPHONE_EVENTS[i]] = [];
        this.draw();
    };
    En.prototype.on = function(ev, callback){
        if(ev in this.events) this.events[ev].push(callback);
    };
    En.prototype.fire = function(ev, e){
        if(false == (ev in this.events)  || this.events[ev].length < 1) return;
        $.each(this.events[ev], function(index, callback){ callback(e); });
    };
    En.prototype.on_rail = function(obj){
        var en = en_manager.find_en(obj)
        if(en.index < 0) return;
        this.is_on_rail = true;
        this.rail = obj;
        this.check_rail();
        this.move(this.x, this.y);
    };
    En.prototype.off_rail = function(){
        this.is_on_rail = false;
        this.rail = null;
    };
    En.prototype.check_rail = function(){
        if(false === this.is_on_rail) return;
        var radian = this.rail.get_radian({ x : this.x, y : this.y });
        this.x = this.rail.x + this.rail.radius * Math.cos(radian);
        this.y = this.rail.y - this.rail.radius * Math.sin(radian);
    };
    En.prototype.set = function(key, value){
        this.context[key] = value;
    };
    En.prototype.fill = function(_color){
        this.type = 'fill';
        this.color = _color;
        this.draw();
    };
    En.prototype.draw = function(){
        this.context.beginPath();
        if(this.color) this.context.fillStyle = this.color;
        if(this.is_on_rail) this.check_rail();
        this.context.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
        this.context[this.type]();
    };
    En.prototype.get_angle = function(e){
        if('y' in e === false || 'x' in e === false) return null;
        var radian = this.get_radian(e);
        return (radian * 180) / Math.PI;
    };
    En.prototype.get_radian = function(e){
        if('y' in e === false || 'x' in e === false) return null;
        return Math.atan2(this.y - e.y, e.x - this.x);
    };
    En.prototype.move = function(_x, _y){
        en_manager.clear_all(this.target);
        this.x = _x;
        this.y = _y;
        en_manager.draw_all(this.target);
    };
    En.prototype.animate = function(_x, _y, ms, callback){
        var PER_MS = 50;
        var limit = parseInt(ms / PER_MS), count = 0;
        if(this.is_on_rail){
            var current_radian = this.rail.get_radian({ x : this.x, y : this.y });
	    var goal_radian = this.rail.get_radian({ x : _x, y : _y });
	    var diff_radian = goal_radian - current_radian;
        }
        var x = this.x, y = this.y;
        var that = this;
        var counter = setInterval(function(){
            count++;
            if(that.is_on_rail){
                current_radian += (diff_radian / limit);  
                that.x = that.rail.x + that.rail.radius * Math.cos(current_radian);
                that.y = that.rail.y - that.rail.radius * Math.sin(current_radian);
                that.move(that.x, that.y);
            } else {
                that.move(x + (_x - x) * (count / limit), y + (_y - y) * (count / limit));
            }
            if(count >= limit){ 
                clearInterval(counter);
                if(callback) callback();
            }
        }, PER_MS);
    };
    En.prototype.clear = function(){
        var _x = this.x - this.radius - this.border * 4;
        var _y = this.y - this.radius - this.border * 4;
        var width = this.radius * 2 + this.border * 8;
        var height = this.radius * 2 + this.border * 8;
        this.context.clearRect(_x, _y, width, height);
    };
    En.prototype.remove = function(){
        en_manager.remove(this);
    };
    var EnManager = function(){
        // [{ target : target, en_list : [] },..]
        this.canvas_list = [];
    };
    EnManager.prototype.apply_events = function(target){
        var canvas_list = this.canvas_list;
        var ev_keys = this_is_smartphone ? EN_SMARTPHONE_EVENTS : EN_PC_EVENTS;
        $.each(ev_keys, function(index, en_event){
            $(target).bind(en_event, function(e){
                var that = this;
                var en_list = null;
                var x = 0, y = 0;
                $.each(canvas_list, function(index, canvas){
                    if(canvas.target != that) return;
                    en_list = canvas.en_list;
                    x = $(canvas.target).offset().left;
                    y = $(canvas.target).offset().top;
                });
                if(en_list == null) return;
                event.preventDefault();
                var pageX = this_is_smartphone ? event.changedTouches[0].pageX : e.pageX;
                var pageY = this_is_smartphone ? event.changedTouches[0].pageY : e.pageY;
                var event_obj = this_is_smartphone ? event.changedTouches[0] : e;
                $.each(en_list, function(index, en){
                    var distance = Math.pow(x + en.x - pageX, 2) + Math.pow(y + en.y - pageY, 2);
                    if(distance <= Math.pow(en.radius, 2)) en.fire(en_event, event_obj);
                });
            });
        });
    };
    EnManager.prototype.add = function(target, en){
        var canvas = this.find(target);
        if(canvas.index < 0){
            this.canvas_list.push({ target : target, en_list : [en] });
            this.apply_events(target);
        } else if('en_list' in this.canvas_list[canvas.index]){ 
            this.canvas_list[canvas.index].en_list.push(en); 
        } else { 
            this.canvas_list[canvas.index].en_list = [en]; 
        }
    };
    var remove_from_array = function(_array, index){
        return _array.slice(0, index).concat(_array.slice(index + 1));
    };
    EnManager.prototype.remove = function(_en){
        var canvas = this.find(_en.target);
        var en_index = canvas.target.en_list.indexOf(_en);
        var en_list = this.canvas_list[canvas.index].en_list;
        this.clear_all(_en.target);
        this.canvas_list[canvas.index].en_list = remove_from_array(en_list, en_index);
        this.draw_all(_en.target);
    };
    EnManager.prototype.find = function(target){
        var canvas = null, canvas_index = -1;
        $.each(this.canvas_list, function(index, obj){
            if(false === ('target' in obj) || target != obj.target) return;
            canvas = obj, canvas_index = index;
        });
        return { index : canvas_index, target : canvas };
    };
    EnManager.prototype.find_en = function(target){
        var en = null, en_index = -1;
        $.each(this.canvas_list, function(canvas_index, canvas){
            $.each(canvas.en_list, function(index, obj){
              if(obj == target) en = obj, en_index = index;
            });
        });
        return { index : en_index, target : en };
    };
    EnManager.prototype.clear_all = function(target){
        var canvas = this.find(target);
        $.each(canvas.target.en_list, function(en_index, en){ en.clear(); });
    };
    EnManager.prototype.draw_all = function(target){
        var canvas = this.find(target);
        $.each(canvas.target.en_list, function(en_index, en){ en.draw(); });
    };
    var en_manager = new EnManager();
    var apply_options = function(default_options, options) {
        if(!options) return default_options;
        var params = ['x', 'y', 'radius', 'type', 'color'];
        for(var i=0;i<params.length;i++){
            var name = params[i];
            if(name in options) default_options[name] = options[name];
        }
        return default_options;
    };
    $.fn.en = function(options){
        var index = $('canvas').index(this);
        if(index < 0) return;
        var en_options = apply_options({ x : 50, y : 50, radius : 50, type : 'fill' }, options); 
        var canvas = $('canvas')[index];
        var en = new En(canvas, en_options);
        en_manager.add(canvas, en);
        return en;
    };
});
