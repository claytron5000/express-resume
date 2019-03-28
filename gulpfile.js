var gulp = require('gulp')

gulp.task("move-styles", function () {
    return gulp
        .src('node_modules/gutenberg-web-type/assets/*.css')
        .pipe(gulp.dest('public/stylesheets'));
});

// gulp.task('watch', function () {
//     gulp.watch('resources/sass/**/*.scss', ['move-styles']);
// });

gulp.task('default', ['move-styles'])