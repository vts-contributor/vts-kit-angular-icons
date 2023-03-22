const { series, task, src, dest } = require('gulp')
const gulpClean = require('gulp-clean');
const gulpReplace = require('gulp-replace');
const gulpFilter = require('gulp-filter');
const gulpRename = require('gulp-rename');
const jsonEdit = require('gulp-json-editor')
const fs = require('fs-extra');
const path = require('path')
const args = require('yargs').argv
const _ = require('lodash')

const currentDir = __dirname
const inFolder = 'raw'
const inDir = path.join(currentDir, inFolder)
const outDir = path.join(currentDir, 'processed')

function clean() {
    return src(outDir, { read: false, allowEmpty: true }).pipe(gulpClean(null));
}

function capitalize() {
    return src(`${inDir}/**`, {base: './'})
    .pipe(gulpFilter(function(path) {
        return !path.isDirectory()
    }))
    .pipe(gulpRename(function(path) {
        let baseName = path.basename
        if (/^[0-9]/.test(baseName))
            baseName = 'i' + baseName
        if (args.prefix) {
            path.basename = _.upperFirst(_.camelCase(baseName + `-${args.prefix}`))
        } else {
            path.basename = _.upperFirst(_.camelCase(baseName))
        }
        path.dirname = ''
    }))
    .pipe(dest(outDir))
}

function removeSuffix() {
    return src(`${inDir}/**`, {base: './'})
    .pipe(gulpFilter(function(path) {
        return !path.isDirectory()
    }))
    .pipe(gulpRename(function(path) {
        const suffix = args.suffix
        let baseName = path.basename
        const regex = new RegExp(`${suffix}$`)
        if (regex.test(baseName)) {
            path.basename = baseName.replace(regex, '')
        }
        path.dirname = ''
    }))
    .pipe(dest(outDir))
}

function removePrefix() {
    return src(`${inDir}/**`, {base: './'})
    .pipe(gulpFilter(function(path) {
        return !path.isDirectory()
    }))
    .pipe(gulpRename(function(path) {
        const prefix = args.prefix
        let baseName = path.basename
        const regex = new RegExp(`^${prefix}`)
        if (regex.test(baseName)) {
            path.basename = baseName.replace(regex, '')
        }
        path.dirname = ''
    }))
    .pipe(dest(outDir))
}

task('clean', series(
    clean
))

task('capitalize', series(
    clean,
    capitalize
))

task('removeSuffix', series(
    clean,
    removeSuffix
))

task('removePrefix', series(
    clean,
    removePrefix
))