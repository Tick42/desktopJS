'use strict';

var gulp = require('gulp'),
	connect = require('gulp-connect'),
	gulpConfig = require('./.gulp/gulpConfig');

gulp.task('test', require('./.gulp/tasks/tests')(gulp, gulpConfig));

gulp.task("server", function () {
	connect.server({
		root: ['examples/web', 'packages/desktopjs/dist', 'packages/desktopjs-electron/dist', 'packages/desktopjs-openfin/dist', 'packages/desktopjs-glue42/dist'],
		port: 8000,
		livereload: true
	});
});

gulp.task('docs', require('./.gulp/tasks/docs')(gulp, gulpConfig));
