/* global define */
; (function (define) {
    define(['jquery'], function ($) {
        
        var $body = $('body'),
            $motice = $('<div class="motice" />').appendTo($body),
            moticeId = 1;

        var defaults = {
            // Image path (http/base64)
            image: undefined,
            // hard-code with
            width:false,
            // Position on screen
            position: 'right-bottom',
            // Theme
            theme: 'default',
            // Template, these classes should ALWAYS be there
            template:   '<div class="motice-item">' + 
                            '<div class="motice-progress"></div>' +
                            '<button type="button" class="motice-close-button" role="button">&times;</button>' +
                            '<div class="motice-title"></div>' +
                            '<div class="motice-text"></div>' + 
                        '</div>',
            // Text that will be displayed in notification
            text: 'I AM MOTICE',
            // title
            title:null,
            // Hide by click
            clickHide: true,
            // Autohide timeout
            timeOut: 3500,
            // timeout after hovering out
            timeOutAfterHoverOut:2000,
            // Enable animations
            effect: 'default',
            effectPrefix:'motice-effect-',
            clShow:'motice-show',
            clHide:'motice-hide',

            //progress bar
            progressBar: false,

            //close button
            closeButton: false,

            //callbacks
            onShown: function(){},
            onHidden:function(){},
            onClick: null        
        };

        var animationEndEventName = 'animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd';

        /**
        * List of possible containers
        */
        var containers = {
            _cache:{
                'left-top':null,
                'left-bottom':null,
                'right-top':null,
                'right-bottom':null,
                'fluid-top':null,
                'fluid-bottom':null,
                'center-top':null,
                'center-bottom':null
            },
            get:function( pos ) {
                
                var isValidPos = typeof(this._cache[pos]) !== 'undefined';
                pos = isValidPos ? pos : defaults.position;
     
                return (this._cache[pos] || this.getPosContainer(pos));
            },
            getPosContainer: function( pos ) {
                var classes = 'motice-container motice-container-' + pos;
                var $elm = $('<div/>',{
                    'class':classes
                });
                $motice.append($elm);
                
                this._cache[pos] = $elm;

                return $elm;
                
            }    
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


        // Progress bar
        var progressBar = function( moticeInst ){
            this.$el = moticeInst.$el.find('.motice-progress');
            this.intervalId =  null;
            this.hideEta =  null;
            this.maxHideTime = null;
            this.val = null;
            this.val0 = null;
        };
        progressBar.prototype = {
            reset:function(){
                clearTimeout( this.intervalId );
                this.hideEta = 0;
                this.val0 = this.val;
            },
            update:function(timeout){
                this.reset();
                this.maxHideTime = timeout;
                this.hideEta = new Date().getTime() + this.maxHideTime;
            },
            run:function(){
                var me = this;

                if(this.maxHideTime <= 50 ){
                    return;
                }            

                function updateProgress() {
                    var percentage = ((me.hideEta - (new Date().getTime())) / me.maxHideTime) * 100;
                    var percentage1 = percentage;

                    if( me.val0) {
                        percentage1 = me.val0 * ( percentage / 100);
                    }
                    
                    me.val = percentage1;
                    me.$el.width(percentage1 + '%');

                    if(percentage1<=0.5){
                        me.reset();
                    }
                }
                this.intervalId = setInterval(updateProgress, 50); 
            }
        };

        // motice class definition
        var motice = function(options){
            this.options = $.extend({},defaults,options||{});
            this.options.clEffect = this.options.effectPrefix + this.options.effect;
            this.options.autoHide = this.options.timeOut > 0;
            this._init();
        };

        motice.prototype = {
            _close:function(){
                this.isHiding = false;
                this.isVisible = false;
                this.$el.remove();
                this.options.onHidden.call(this);
            },
            close:function(force){
                var self = this;

                if( this.isHiding ) return;
                
                // force close when showing
                if( force && this.isShowing ) {
                    //remove animationEnd event handler
                    this.$el.off( animationEndEventName );
                    //ensure shown
                    this._show();   
                } 

                clearTimeout( this.autoHideTimer );

                this.isHiding = true;

                if(!supports.animation || !this.options.effect) {
                    return this._close();
                }

                this.$el.removeClass(this.options.clShow)
                    .addClass(this.options.clHide);

                this.$el.one(animationEndEventName,function(evt){
                    self._close();
                });     
                   
            },
            _show:function(){
                this.isShowing = false;
                this.isVisible = true;
                this._autoHide();
                this.options.onShown.call(this);
            },
            show:function(){
                var me = this;

                //is showing or hiding
                if( this.isAnimating() ) return;

                this.isShowing = true;

                this.$el.removeClass(this.options.clHide).addClass(this.options.clShow);
                
                if( (!supports.animation) || !this.options.effect ){
                    this._show();
                    return;
                }

                this.$el.one(animationEndEventName,function(evt){
                    me._show();
                });        

            },
            _autoHide:function(timeout){
                var settings = this.options,
                    me = this;
                
                if(!settings.autoHide) return;
                
                clearTimeout( this.autoHideTimer );

                timeout = timeout || settings.timeOut;

                this.autoHideTimer = setTimeout(function() {
                    me.close();
                }, timeout);

                if(this.progress){
                    this.progress.update( timeout );    
                    this.progress.run();
                }

            },
            isAnimating: function() {
                return ( this.isShowing || this.isHiding );    
            },
            _init : function() {
                
                this.isVisible = true;
                this.isShowing = false;
                this.isHiding = false;

                var settings = this.options;
                // Creating notification
                var $notification = this.$el = $(settings.template);

                // id
                $notification[0].id = this.id = 'motice-' + (moticeId++);

                // Theme
                this.theme = Motice.themes[settings.theme];

                // cache the settings for further use
                $notification.data('motice',this);

                this._parseDomBySettings();

                this._initEvents();

                this.show();
            },
            _parseDomBySettings: function() {
                var settings = this.options;
                var $container = this.$container = containers.get( settings.position );
                var $notification = this.$el;
                var me = this;
                
                // Adding classes
                $notification.addClass(this.theme.classes);

                var $ptext = this.$text = $notification.find('.motice-text');
                $ptext.html(settings.text);

                //title
                if(!settings.title){
                    $notification.find('.motice-title').remove();
                }else{
                    $notification.find('.motice-title').html(settings.title);
                }

                // Custom Image
                if (settings.image !== undefined) {
                    $notification.addClass('motice-with-img').css({'background-image':'url('+settings.image+')'});
                } else if (settings.image === null ) {
                    $notification.addClass('motice-without-img');
                }
                
                //animations
                if(supports.animation && settings.effect){
                    $notification.addClass( settings.clEffect );
                } else {
                    $notification.addClass('motice-effect-null');
                }
                if (settings.position.slice(-3) === 'top') {
                    $container.prepend($notification);
                } else {
                    $container.append($notification);
                }

                if ( !settings.closeButton ){
                    $notification.find('.motice-close-button').remove();
                }

                if( settings.progressBar ){
                    this._initProgressBar();
                } else {
                    $notification.find('.motice-progress').remove();
                }
             
                //width
                if( settings.width ){
                    $notification.css('width',settings.width);
                }   

            },//parse
            sticky:function(){
                clearTimeout(this.autoHideTimer);
                if(this.progress){
                    this.progress.reset();
                }
            },
            _delayHideOnHoverOut:function(){

                this._autoHide( this.options.timeOutAfterHoverOut );
     
            },
            _initEvents: function(){
                var settings = this.options,
                    me = this,
                    $el = this.$el;
                //close button
                if( settings.closeButton ){
                    $el.on('click.closeButton',function(e){
                        me.close();
                        return false;
                    });
                }
                // click hide
                if ( settings.clickHide ) {
                    $el.on('click.clickHide', function(evt) {

                        if(settings.onClick){
                            return settings.onClick.call(me,evt);
                        }                        

                        if(evt.target.tagName === 'A'){
                            return true;
                        }
                        me.close();
                        return false;
                    });
                }

                //hover
                $el.hover(function(e){
                    me.sticky();
                },function(e){
                    me._delayHideOnHoverOut();
                });            

            },
            _initProgressBar:function(){
                this.progress = new progressBar(this);            
            }
         };


        var Motice = function(options){
            return new motice(options);
        };    

      
        Motice.addTheme = function(name, options) {
            (this.themes = this.themes || {})[name] = options;

            Motice[name] = (function(themeName){
                
                return function(opts,tit){

                    if( typeof(opts) === 'string' ){
                        opts = {
                            text:opts,
                            title:tit
                        };
                    }

                    opts = opts || {};
                    opts.theme = themeName;
                    return Motice(opts);
                };
                
            })(name);

        };

        // manual close via $.motice.close
        Motice.close = function( $motice, force ){
            var inst = $motice.data('motice');
            if(inst){
                inst.close(force);
            }
        };

        // Default themes
        Motice.addTheme('default', {
            classes: 'motice-theme-default'
        });
        Motice.addTheme('info', {
            classes: 'motice-theme-info'
        });
        Motice.addTheme('warning',{
            classes: 'motice-theme-warning'
        });
        Motice.addTheme('error',{
            classes: 'motice-theme-error'
        });
        Motice.addTheme('success',{
            classes: 'motice-theme-success'
        });

        return Motice;

    });
}(typeof define === 'function' && define.amd ? define : function (deps, factory) {
    if (typeof module !== 'undefined' && module.exports) { //Node
        module.exports = factory(require('jquery'));
    } else {
        window['Motice'] = factory(window['jQuery']);
    }
}));
