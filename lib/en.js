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
        this.clear();
        this.x = _x;
        this.y = _y;
        this.draw();
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
    $.fn.en = function(options) {
        if($(this).find('canvas').length === 0) return;
        var en_options = apply_options({ x : 50, y : 50, radius : 50 }, options); 
        return new En(this.find('canvas')[0], en_options);
    };
});
