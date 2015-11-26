'use strict';

var del = require('del');
var gulp = require('gulp');
var plumber = require('gulp-plumber');
var browserify = require('browserify');
var browserSync = require('browser-sync');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var sourcemaps = require('gulp-sourcemaps');
var sass = require('gulp-sass');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var postcssNested = require('postcss-nested');
var colorFunction  = require('postcss-color-function');
var postcssCustomProperties = require('postcss-custom-properties');
var atImport = require("postcss-import")
var postcssColorGray = require('postcss-color-gray');

var ghPages = require('gulp-gh-pages');
var compactDom = require('compact-dom');
var gulpCompactDom = require('gulp-compact-dom');
var tsify = require('tsify');

var reload = browserSync.reload;

var BROWSERSYNC_PORT = parseInt(process.env.PORT) || 1111;
var BROWSERSYNC_HOST = process.env.IP || "127.0.0.1";

gulp.task('clean', del.bind(null, ['./build']));

gulp.task('css', function() {
  return gulp.src('web/next-up-app.css')
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(postcss([
      atImport({ from: "web/next-up-app.css" }),
      postcssCustomProperties,
      postcssNested,
      postcssColorGray,
      colorFunction,
      autoprefixer({ browsers: ['last 2 version'] })
    ]))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./build/Dist'))
    .pipe(reload({stream: true}));
});

gulp.task('scripts', function() {
  var bundler = browserify({
    entries: ['./src/next-up-app.ts'],
    debug: true
  }).plugin(tsify, {typescript: require('typescript')});
  return bundler
    .bundle()
    .pipe(plumber())
    .pipe(source('next-up-app.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write('./'))
    .pipe(gulpCompactDom.createToHyperscriptTranspiler({}))
    .pipe(gulp.dest('./build/Dist'))
    .pipe(reload({stream: true}));
});

gulp.task('html', function() {
  gulp.src('./web/*.html')
    .pipe(plumber())
    .pipe(gulp.dest('./build'))
    .pipe(reload({stream: true}));
});


gulp.task('serve', ['default'], function() {
  var url = require('url'),
      proxy = require('proxy-middleware');

  var apiServer;
  // 1/ Local test server
  // apiServer = 'localhost:10741'
  // 2/ Local network PC test server (Mac dev)
  apiServer = 'http://10.0.1.17:1111'
  // 3/ Prod server TODO fix auth
  // apiServer = 'https://cockpits.afasgroep.nl/POCockpit'

  var proxyOptions = url.parse(apiServer + '/planning');
  proxyOptions.route = '/planning'

  browserSync({
    port: BROWSERSYNC_PORT,
    host: BROWSERSYNC_HOST,
    notify: false,
    server: {
      baseDir: 'build',
      middleware: [proxy(proxyOptions)]
    }
  });

   gulp.watch('./src/**/*.ts', ['scripts']);
   gulp.watch(['./styles/**/*.css','./web/**/*.css'], ['css']);
   gulp.watch('./web/**/*.html', ['html']);

});

gulp.task('s', ['serve']);

//gulp.task('deploy', function() {
  //return gulp.src('./build/web/**/*')
  //.pipe(ghPages());
//});

gulp.task('default', ['scripts', 'html', "css"]);
