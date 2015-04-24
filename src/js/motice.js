(function($) {
    var $body = $('body'),
        $motice = $('<div class="motice" />').appendTo($body);

    var defaults = {
        // Image path (http/base64)
        image: undefined,
        // Position on screen
        position: 'right-bottom',
        // Theme
        theme: 'dark',
        // Template, these classes should ALWAYS be there
        template: '<div class="motice-item"><img class="motice-img" /><div class="motice-text"></div></div>',
        // css width
        width: '300',
        // Text that will be displayed in notification
        text: '',
        // Display background or not, if false, background: transparent;
        background: true,
        // Hide automatically
        autoHide: true,
        // Hide by click
        clickHide: true,
        // Autohide delay
        delay: 4000,
        // Enable animations
        effect: 'default',
        effectPrefix:'motice-effect-',
        clShow:'motice-show',
        clHide:'motice-hide'
    };

    var animationEndEventName = 'animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd';

    /**
    * List of possible containers
    */
    var containers = {
        'left-top': $('<div />', {
            class: 'motice-container motice-container-left-top'
        }).appendTo($motice),
            'left-bottom': $('<div />', {
            class: 'motice-container motice-container-left-bottom'
        }).appendTo($motice),
            'right-top': $('<div />', {
            class: 'motice-container motice-container-right-top'
        }).appendTo($motice),
            'right-bottom': $('<div />', {
            class: 'motice-container motice-container-right-bottom'
        }).appendTo($motice),
            'fluid-top': $('<div />',{
            class: 'motice-container motice-container-fluid-top'
        }).appendTo($motice),
        'fluid-bottom': $('<div />',{
            class: 'motice-container motice-container-fluid-bottom'
        }).appendTo($motice)
    };

    // http://stackoverflow.com/questions/10888211/detect-support-for-transition-with-javascript
    var detectCSSFeature = function(featurename) {
        var feature = false,
        domPrefixes = 'Webkit Moz ms O'.split(' '),
        elm = document.createElement('div'),
        featurenameCapital = null;

        featurename = featurename.toLowerCase();

        if (elm.style[featurename] !== undefined) {
            feature = true;
        }

        if (feature === false) {
            featurenameCapital = featurename.charAt(0).toUpperCase() + featurename.substr(1);
            for (var i = 0; i < domPrefixes.length; i++) {
                if (elm.style[domPrefixes[i] + featurenameCapital] !== undefined) {
                    feature = true;
                    break;
                }
            }
        }
        return feature;
    };

    var supports = {
        animation:detectCSSFeature('animation') && detectCSSFeature('transform')
    };

    var motice = function(options){
        this.options = $.extend({},defaults,options||{});
        this.options.clEffect = this.options.effectPrefix + this.options.effect;
        this._init();
    };

    motice.prototype = {
        close:function(){
            var self = this;
            
            if( this.isAnimating ) return;
            
            clearTimeout( this.autoHideTimer );

            if(!supports.animation) {
                this.$el.remove();
                return;
            }

            this.isAnimating = true;

            this.$el.removeClass(this.options.clShow)
                .addClass(this.options.clHide);

            this.$el.one(animationEndEventName,function(evt){

                self.isAnimating = false;
                self.$el.remove();          

            });     
               
        },
        show:function(){
            var me = this;
            if(this.isAnimating) return;

            if(!supports.animation){
                this.$el.removeClass(this.options.clHide).addClass(this.options.clShow);
                this._checkAutoHide();
                return;
            }

            this.isAnimating = true;
            
            this.$el.removeClass(this.options.clHide)
                .addClass(this.options.clShow);

            this.$el.one(animationEndEventName,function(evt){

                me.isAnimating = false;
                me._checkAutoHide();

            });        

        },
        _checkAutoHide:function(){
            var settings = this.options,
                me = this;
            
            if(!settings.autoHide) return;
            
            clearTimeout( this.autoHideTimer );

            this.autoHideTimer = setTimeout(function() {
                me.close();
            }, settings.delay);
        },
        _init : function() {
            
            this.isAnimating = false;
            var settings = this.options;
            // Creating notification
            var $notification = this.$el = $(settings.template);

            // Theme
            this.theme = $.motice.themes[settings.theme];

            // Adding classes
            $notification.addClass(this.theme.classes);

            var $ptext = this.$text = $notification.find('.motice-text');
            $ptext.html(settings.text);

            // Image
            var $img = this.$img = $notification.find('.motice-img');
            if (settings.image !== undefined) {
                $notification.addClass('motice-with-img');
                $img.attr('src', settings.image);
            } else {
                $img.remove();
                $notification.addClass('motice-without-img');
            }

            // Width
            if( settings.position.indexOf('fluid') === -1 ){
                $notification.css('width', settings.width);
            }

            //animations
            if(supports.animation && settings.effect){
                $notification.addClass( settings.clEffect );
            }

            // cache the settings for further use
            $notification.data('motice',this);

            this._append();

            this.show();
        },
        _append: function() {
            var settings = this.options;
            var $container = this.$container = containers[settings.position];
            var $notification = this.$el;
            var me = this;

            if (settings.position.slice(-3) === 'top') {
                $container.prepend($notification);
            } else {
                $container.append($notification);
            }

            if (settings.clickHide) {
                $notification.css('cursor', 'pointer');
                $notification.on('click', function(evt) {
                    if(evt.target.tagName === 'A'){
                        return true;    
                    }
                    me.close();
                    return false;
                });
            }

            

        }
     };


    $.motice = function(options){
        return new motice(options);
    };    

  
    $.motice.addTheme = function(name, options) {
        (this.themes = this.themes || {})[name] = options;
    };

    // manual close via $.motice.close
    $.motice.close = function( $motice ){
        var inst = $motice.data('motice');
        if(inst){
            inst.close();
        }
    };

    // Default themes
    $.motice.addTheme('dark', {
        classes: 'motice-theme-dark'
    });
    $.motice.addTheme('light', {
        classes: 'motice-theme-light'
    });
}(jQuery));
