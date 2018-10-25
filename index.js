'use strict'

var isObj = require('is-plain-obj')
var isBase64 = require('is-base64')
var imgType = require('image-type')
var toab = require('string-to-arraybuffer')
var rect = require('parse-rect')
var extend = require('object-assign')
var isBlob = require('is-blob')
var p = require('primitive-pool')
var WeakMap = require('es6-weak-map')
var clipPixels = require('clip-pixels')
var isBrowser = require('is-browser')
var loadUrl = require('./lib/url')
var loadRaw = require('./lib/raw')
var loadGl = require('./lib/gl')


// cache of data depending on source
var cache = new WeakMap()


module.exports = getPixels
module.exports.get = getPixels
module.exports.all = getPixelsAll


function getPixelsAll (src, o, cb) {
	if (!src) return null

	if (typeof o === 'function') {
		cb = o
		o = null
	}

	// list
	if (Array.isArray(src)) {
		var list = src.map(function (source) {
			return getPixels(source, o)
		})

		// return promise resolved with list
		return Promise.all(list).then(function (list) {
			cb && cb(null, list)
			return list
		}, function (err) {
			cb && cb(err)
			return Promise.reject(err)
		})
	}

	// dict
	var handlers = {}
	var list = []
	for (var name in src) {
		handlers[name] = list.push(getPixels(src[name], o)) - 1
	}

	// return promise resolved with dict
	return Promise.all(list).then(function (list) {
		var result = {}
		for (var name in handlers) {
			result[name] = list[handlers[name]]
		}
		cb && cb(null, result)
		return result
	}, function (err) {
		cb && cb(err)
		return Promise.reject(err)
	})
}


function getPixels(src, o, cb) {
	// detect callback arg
	if (typeof o === 'function') {
		cb = o
		o = isObj(src) ? src : null
	}

	// intercept callback call
	if (cb) return getPixels(src, o).then(function (data) {
		cb(null, data)
		return data
	}, function (err) {
		cb(err)
	})

	if (!src) src = {}

	// handle arguments
	if (typeof o === 'string') o = {type: o}
	else if (!o) o = {}
	else if (Array.isArray(o)) o = {shape: o}
	if (isObj(src)) {
		o = extend(src, o)
		src = o.source || o.src

		// nested source
		if (isObj(src)) src = src.source || src.src || src
	}

	// detect clipping
	var width, height
	var clip = o.clip && rect(o.clip) || {x: 0, y: 0}
	var type = o.type || o.mime
	captureShape(o)
	captureShape(src)

	// File & Blob
	if (isBrowser && (isBlob(src) || (src instanceof File))) {
		// FIXME: try to use createImageBitmap for Blob
		src = URL.createObjectURL(src)

		// TODO: detect raw data
	}

	// get cached instance
	if (cache.has(p(src))) {
		var result = cache.get(p(src))
		if (clip.x || clip.y || clip.width !== result.width || clip.height !== result.height) {
			result = new Uint8Array(clipPixels(result, [result.width, result.height], [clip.x, clip.y, clip.width, clip.height]))
			result.data = result
			result.width = clip.width
			result.height = clip.height
		}

		return Promise.resolve(result)
	}

	// handle source type
	if (typeof src === 'string') {
		if (!src) return Promise.reject(new Error('Bad URL'))

		// convert base64 to datauri
		if (isBase64(src) && !/^data:/i.test(src)) {
			var buf = new Uint8Array(toab(src))

			return Promise.resolve(loadRaw(buf, {type: type, shape: [width, height], clip: clip}))
		}

		// url, path, datauri
		return loadUrl(src, clip).then(function (data) {
			captureShape(data)
			return loadRaw(data, {type: type, shape: [width, height], clip: clip})
		})
	}

	// SVG Image
	if (global.SVGImageElement && src instanceof SVGImageElement) {
		var url = src.getAttribute('xlink:href')
		src = new Image()
		src.src = url
	}

	// fetch closest image/video
	if (src.tagName === 'PICTURE') src = src.querySelector('img')

	// <img>
	if (global.Image && src instanceof Image) {
		if (src.complete) {
			captureShape(src)
			return Promise.resolve(loadRaw(src, {type: type, shape: [width, height], clip: clip}))
		}

		return new Promise(function (ok, err) {
			src.addEventListener('load', function () {
				captureShape(src)
				ok(loadRaw(src, {type: type, shape: [width, height], clip: clip}))
			})
			src.addEventListener('error', function(err) {
				nok(err)
			})
		})
	}

	// <video>
	if (global.HTMLMediaElement && src instanceof HTMLMediaElement) {
		if (src.readyState) {
			captureShape({w: src.videoWidth, h: src.videoHeight})
			return Promise.resolve(loadRaw(src, {type: type, shape: [width, height], clip: clip}))
		}

		return new Promise(function (ok, err) {
			src.addEventListener('loadeddata', function () {
				captureShape({w: src.videoWidth, h: src.videoHeight})
				ok(loadRaw(src, {type: type, shape: [width, height], clip: clip}))
			})
			src.addEventListener('error', function(err) {
				nok(err)
			})
		})
	}


	// any other source, inc. unresolved promises
	return Promise.resolve(src).then(function (src) {
		// float data → uint data
		if ((src instanceof Float32Array) || (src instanceof Float64Array)) {
			var buf = new Uint8Array(src.length)
			for (var i = 0; i < src.length; i++) {
				buf[i] = src[i] * 255
			}
			src = buf
		}

		// retrieve canvas from contexts
		var ctx = src.readPixels ? src : src._gl || src.gl || src.context || src.ctx

		// WebGL context directly
		if (ctx && ctx.readPixels) return loadGl(ctx, {type: type, shape: [width, height], clip: clip})

		src = ctx && ctx.canvas || src.canvas || src

		captureShape(src)
		// retrieve buffer from buffer containers
		src = src.data || src.buffer || src._data || src
		captureShape(src)

		return loadRaw(src, {type: type, shape: [width, height], clip: clip})
	})

	// try to figure out width/height from container
	function captureShape(container) {
		// SVG had width as object
		if (!width || typeof width !== 'number') width = container && container.shape && container.shape[0] || container.width || container.w
		if (!height || typeof height !== 'number') height = container && container.shape && container.shape[1] || container.height || container.h
	}
}

