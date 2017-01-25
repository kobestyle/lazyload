var gulp = require('gulp'),
    eslint = require('gulp-eslint'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename');

// compress js
gulp.task('compress-js', () => {
    return gulp.src('./lazyload.js')
        .pipe(uglify({
            compress: false
        }))
        .pipe(rename('./lazyload.min.js'))
        .pipe(gulp.dest('./'));
});

// eslint
gulp.task('eslint', () => {
    return gulp.src('./lazyload.js')
        .pipe(eslint())
        .pipe(eslint.result((result) => {
            console.log(`ESLint result: ${result.filePath}`);
            console.log(`# Messages: ${result.messages.length}`);
            console.log(`# Warnings: ${result.warningCount}`);
            console.log(`# Errors: ${result.errorCount}`);
        }))
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

// default task
gulp.task('default', ['eslint', 'compress-js']);