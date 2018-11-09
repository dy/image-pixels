'use strict'

var isObj = require('is-plain-obj')
var isBase64 = require('is-base64')
var s2ab = require('string-to-arraybuffer')
var rect = require('parse-rect')
var extend = require('object-assign')
var isBlob = require('is-blob')
var clipPixels = require('clip-pixels')
var isBrowser = require('is-browser')
var toab = require('to-array-buffer')
var flat = require('arr-flatten')
var loadUrl = require('./lib/url')
var loadRaw = require('./lib/raw')
var loadGl = require('./lib/gl')
var cache = require('./lib/cache')


module.exports = function (src, o, cb) {
	// detect callback arg
	if (typeof o === 'function') {
		cb = o
		o = isObj(src) ? src : null
	}

	return getPixels(src, o).then(function (data) {
		// cache self pixel data
		cache.set(data, data)
		if (cb) cb(null, data)
		return data
	}, function (err) {
		if (cb) cb(err)
		throw err
	})
}

module.exports.cache = cache

module.exports.all = function getPixelsAll (src, o, cb) {
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


function getPixels(src, o) {
	// handle arguments
	if (typeof o === 'string') o = {type: o}
	else if (!o) o = {}
	else if (Array.isArray(o)) o = {shape: o}
	if (isObj(src) || !src) {
		o = extend(src || {}, o)
		src = o.source || o.src || o.raw || o.data || o.pixels

		// nested source
		if (isObj(src)) src = src.source || src.src || src.raw || src.data || src.pixels || src

		if (!src) {
			o.cache = false
			src = {}
		}
	}

	// detect clipping
	var width, height
	var clip = o.clip && rect(o.clip) || {x: 0, y: 0}
	var type = o.type || o.mime

	// turn cache on by default
	if (o.cache == null) o.cache = true

	var cacheAs = []
	captureShape(o)
	captureShape(src)

	// check if cached instance is available
	var cached

	if (cached = checkCached(src)) return cached

	// File & Blob
	if (isBrowser && (isBlob(src) || (src instanceof File))) {
		// FIXME: try to use createImageBitmap for Blob
		src = URL.createObjectURL(src)
		cacheAs.push(src)

		if (cached = checkCached(src)) return cached

		// TODO: detect raw data and decode here, possibly use array-buffer
	}

	// handle source type
	if (typeof src === 'string') {
		if (!src) return Promise.reject(new Error('Bad URL'))

		cacheAs.push(src)

		// convert base64 to datauri
		if (isBase64(src) && !/^data:/i.test(src)) {
			src = new Uint8Array(s2ab(src))

			return loadRaw(src, {type: type, cache: o.cache && cacheAs, shape: [width, height], clip: clip})
		}

		// url, path, datauri
		return loadUrl(src, clip).then(function (src) {
			if (cached = checkCached(src)) return cached

			captureShape(src)
			return loadRaw(src, {type: type, cache: o.cache && cacheAs, shape: [width, height], clip: clip})
		})
	}

	if (src.tagName) {
		// SVG Image
		if (src.tagName.toLowerCase() === 'image') {
			var url = src.getAttribute('xlink:href')
			src = new Image()
			src.src = url
			if (cached = checkCached(url)) return cached
		}

		// fetch closest image/video
		if (src.tagName.toLowerCase() === 'picture') {
			src = src.querySelector('img')
			if (cached = checkCached(src)) return cached
		}

		// <img>
		if (src.tagName.toLowerCase() === 'img') {
			if (cached = checkCached(src.src)) return cached

			cacheAs.push(src.src)

			if (src.complete) {
				captureShape(src)
				return loadRaw(src, {type: type, cache: o.cache && cacheAs, shape: [width, height], clip: clip})
			}

			return new Promise(function (ok, nok) {
				src.addEventListener('load', function () {
					captureShape(src)
					ok(src)
				})
				src.addEventListener('error', function(err) {
					nok(err)
				})
			}).then(function (src) {
				return loadRaw(src, {type: type, cache: o.cache && cacheAs, shape: [width, height], clip: clip})
			})
		}

		// <video>
		if (global.HTMLMediaElement && src instanceof HTMLMediaElement) {
			if (cached = checkCached(src.src)) return cached

			// FIXME: possibly cache specific frame
			cacheAs.push(src.src)

			if (src.readyState) {
				captureShape({w: src.videoWidth, h: src.videoHeight})
				return loadRaw(src, {type: type, cache: o.cache && cacheAs, shape: [width, height], clip: clip})
			}

			return new Promise(function (ok, nok) {
				src.addEventListener('loadeddata', function () {
					captureShape({w: src.videoWidth, h: src.videoHeight})
					ok(src)
				})
				src.addEventListener('error', function(err) {
					nok(new Error('Bad video src `' + src.src + '`'))
				})
			}).then(function (src) {
				return loadRaw(src, {type: type, cache: o.cache && cacheAs, shape: [width, height], clip: clip})
			})
		}
	}


	// any other source, inc. unresolved promises
	// NOTE: we should not cache result by this type of data:
	// eg. user may want to change array contents
	return Promise.resolve(src).then(function (src) {
		if (cached = checkCached(src)) return cached

		// float data → uint data
		if ((src instanceof Float32Array) || (src instanceof Float64Array)) {
			var buf = new Uint8Array(src.length)
			for (var i = 0; i < src.length; i++) {
				buf[i] = src[i] * 255
			}
			src = buf
		}

		// array of arrays
		if (Array.isArray(src)) {
			// [r,g,b,a,r,g,b,a,...]
			// [[[r,g,b,a], [r,g,b,a]], [[r,g,b,a], [r,g,b,a]]]
			// [[r,g,b,a], [r,g,b,a], [r,g,b,a], [r,g,b,a]]
			// [[r,g,b,a,r,g,b,a], [r,g,b,a,r,g,b,a]]
			src = new Uint8Array(flat(src))
		}

		// retrieve canvas from contexts
		var ctx = (src.readPixels || src.getImageData) ? src : src._gl || src.gl || src.context || src.ctx || (src.getContext && (src.getContext('2d') || src.getContext('webgl')))

		if (ctx) {
			captureShape(ctx)
			// WebGL context directly
			if (ctx.readPixels) {
				var result = loadGl(ctx, {type: type, shape: [width, height], clip: clip})
				if (o.cache) cache.set(result, result)
				return result
			}

			// 2d and other contexts
			captureShape(ctx.canvas)

			return loadRaw(ctx.canvas, {type: type, shape: [width, height], clip: clip})
		}

		// raw data container
		captureShape(src)

		if (src.data || src._data || src.buffer || src instanceof ArrayBuffer) {
			src = toab(src)
			cacheAs.push(src)
			src = new Uint8Array(src)
			return loadRaw(src, {type: type, cache: o.cache && cacheAs, shape: [width, height], clip: clip})
		}

		// any other source
		return loadRaw(src, {type: type, cache: o.cache && cacheAs, shape: [width, height], clip: clip})
	})

	// try to figure out width/height from container
	function captureShape(container) {
		// SVG had width as object
		if (!width || typeof width !== 'number') width = container && container.shape && container.shape[0] || container.width || container.w || container.drawingBufferWidth
		if (!height || typeof height !== 'number') height = container && container.shape && container.shape[1] || container.height || container.h || container.drawingBufferHeight
	}

	function checkCached(src) {
		// get cached instance
		if (cache.get(src)) {
			var result = cache.get(src) || cache.get(src.buffer)

			if (clip.x || clip.y ||
				(clip.width && clip.width !== result.width) ||
				(clip.height && clip.height !== result.height)
			) {
				result = new Uint8Array(clipPixels(result, [result.width, result.height], [clip.x, clip.y, clip.width, clip.height]))
				result.data = result.subarray()
				result.width = clip.width
				result.height = clip.height
			}

			return Promise.resolve(result)
		}
	}
}

