var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    swig = require('gulp-swig'),
    concat = require('gulp-concat'),
    less = require('gulp-less'),
    csso = require('gulp-csso'),
    plumber = require('gulp-plumber'),
    livereload = require('gulp-livereload'),
    prefix = require('gulp-autoprefixer'),
    jshint = require('gulp-jshint'),
    jshintStylish = require('jshint-stylish'),
    sourcemaps = require('gulp-sourcemaps'),
    shelljs = require('shelljs'),
    pkg = require('./package.json');


var cfg = {
    EXPRESS_PORT : 4000,
    EXPRESS_ROOT : __dirname,
    LIVERELOAD_PORT : 35729,
    js:{
        name:pkg.name+'.js',
        src:'src/js/'+pkg.name+'.js',
        minName:pkg.name+'.min.js'
    }
};

var swigOpts = {
    defaults: { cache: false,locals:{date:function(){return new Date().getTime()}}},
    data:pkg

};

gulp.task('express', function() {
    var express = require('express');
    var app = express();
    app.use(express.static(cfg.EXPRESS_ROOT));
    app.listen(cfg.EXPRESS_PORT);
});


gulp.task('lint',function(){

    return gulp.src('src/js/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter(jshintStylish));	

});

gulp.task('less',function(){

    return gulp.src('src/less/*.less')  // only compile the entry file
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(less({
          paths: ['./']
        }))
        .pipe(prefix("last 8 version", "> 1%", "ie 8", "ie 7"), {cascade:true})
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('src/css'));
    
});

gulp.task('css',['less'],function(){

    return gulp.src('src/css/motice*.css',{base:'src'})
        .pipe(csso())
        .pipe(gulp.dest('dist'))
        .pipe(livereload());  

});

gulp.task('watch',['express'], function() {
    livereload.listen();
    gulp.watch('src/less/**/*.less', ['reload']);  // Watch all the .less files, then run the less task
    gulp.watch(['src/js/*.js','*.html'],['reload']);  // livereload not works for js file, so we have to reload the whole page
});

gulp.task('reload',['js','css','copy'],function(){

    return gulp.src(['index.html','site/index.html'])
        .pipe(livereload());
    

});

gulp.task('js',['lint','swig'],function(){

    return gulp.src( 'dist/js/'+ cfg.js.name )
        .pipe(gulp.dest('site/dist/js'))
        .pipe(uglify({preserveComments:'some'}))
        .pipe(rename( cfg.js.minName ))
        .pipe(gulp.dest('dist/js'))
        .pipe(gulp.dest('site/dist/js'));
   
    
});

gulp.task('swig',function(){
    gulp.src('bower.swig')
        .pipe(swig(swigOpts))
        .pipe(rename('bower.json'))
        .pipe(gulp.dest(__dirname));
    
    gulp.src(['*.html'])
        .pipe(swig(swigOpts))
        .pipe(gulp.dest('site'));

    return gulp.src(cfg.js.src)
        .pipe(swig(swigOpts))
        .pipe(rename(cfg.js.name))
        .pipe(gulp.dest('dist/js'));
    
});

gulp.task('copy', function(){
    var siteFiles = ['package.json','dist/**'];
    gulp.src(siteFiles,{base:'.'})
        .pipe(gulp.dest('site'));

    gulp.src(['src/css/style.css'],{base:'src'})
        .pipe(gulp.dest('site/dist'));

    gulp.src(['src/vendors/**'],{base:'src'})
        .pipe(gulp.dest('dist'))
        .pipe(gulp.dest('site/dist'));
    
    gulp.src(['node_modules/jquery/dist/jquery.min.*'], {base: 'node_modules'})
        .pipe(gulp.dest('site/dist'));

    gulp.src([
        'node_modules/rainbow-code/dist/rainbow.min.js',
        'node_modules/rainbow-code/themes/css/solarized-dark.css',
        'node_modules/rainbow-code/src/language/generic.js',
        'node_modules/rainbow-code/src/language/shell.js',
        'node_modules/rainbow-code/src/language/html.js',
        'node_modules/rainbow-code/src/language/css.js',
        'node_modules/rainbow-code/src/language/javascript.js'
    ], {base: 'node_modules'})
    .pipe(gulp.dest('site/dist'));
   

});

gulp.task('semantic', function () {
    shelljs.cd('src/semantic/');
    shelljs.exec('gulp build', function() {
        shelljs.cd('../../');
        shelljs.exec('gulp dev')
    });
});

gulp.task('default',['semantic']);
gulp.task('dev',['js','css','swig','copy', 'watch']);
gulp.task('build',['js','css','swig','copy']);
