$(function(){
    var En = function(_target, _options) {
        this.target = _target;
        this.context = _target.getContext('2d');
        this.options = _options;
        this.x = _options.x;
        this.y = _options.y;
        this.border = 1;
        this.radius = _options.radius;
        this.draw();
    };
    En.prototype.draw = function() {
        this.context.beginPath();
        this.context.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
        this.context.stroke();
    };
    En.prototype.get_angle = function(e) {
        // todo: check e == jQuery.Event
        if('pageY' in e === false || 'pageX' in e === false) return null;
        var radian = Math.atan2(this.y - e.pageY, e.pageX - this.x);
        return (radian * 180) / Math.PI;
    };
    En.prototype.get_radian = function(e) {
        // todo: check e == jQuery.Event
        if('pageY' in e === false || 'pageX' in e === false) return null;
        return Math.atan2(this.y - e.pageY, e.pageX - this.x);
    };
    En.prototype.move = function(_x, _y) {
        en_manager.clear_all(this.target);
        this.x = _x;
        this.y = _y;
        en_manager.draw_all(this.target);
    };
    En.prototype.clear = function() {
        var width = this.radius * 2 + this.border;
        var height = this.radius * 2 + this.border;
        this.context.clearRect(this.x - this.radius, this.y - this.radius, width, height);
    };
    var apply_options = function(default_options, options) {
        if(!options) return default_options;
        var params = ['x', 'y', 'radius'];
        for(var i=0;i<params.length;i++) {
            var name = params[i];
            if(name in options) default_options[name] = options[name];
        }
        return default_options;
    };
    var EnManager = function(){
        // [{ target : target, en_list : [] },..]
        this.canvas_list = [];
    };
    EnManager.prototype.add = function(target, en){
        var canvas = this.find(target);
        if(canvas.index < 0){
            this.canvas_list = [{ target : target, en_list : [en] }];
        } else if('en_list' in this.canvas_list[canvas.index]){ 
            this.canvas_list[canvas.index].en_list.push(en); 
        } else { 
            this.canvas_list[canvas.index].en_list = [en]; 
        }
    };
    EnManager.prototype.find = function(target){
        var canvas = null, canvas_index = -1;
        $.each(this.canvas_list, function(index, obj){
            if(false === ('target' in obj) || target !== obj.target) return;
            canvas = obj, canvas_index = index;
        });
        return { index : canvas_index, target : canvas };
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
    $.en = function(target, options) {
        var en_options = apply_options({ x : 50, y : 50, radius : 50 }, options); 
        var en = new En(target, en_options);
        en_manager.add(target, en);
        return en;
    };
});
