// universal pixel data getter

'use strict'

var imgType = require('image-type')
var tostr = require('arraybuffer-to-string')
var cache = require('./cache')

var canvas, context

module.exports = function readRaw(img, o) {
	var width = o.shape[0], height = o.shape[1]
	var clip = o.clip
	var type = o.type

	if (!canvas) {
		canvas = document.createElement('canvas')
		context = canvas.getContext('2d')
	}
	canvas.width = width
	canvas.height = height

	if (img instanceof Uint8Array || img instanceof Uint8ClampedArray) {
		// decode encoded data

		if (!type) {
			type = imgType(img)
			type = type && type.mime
		}

		if (type) {
			var src = img
			return new Promise(function (ok, nok) {
				var img = new Image()
				img.crossOrigin = 'Anonymous'
				img.onload = function() {
					if (!o.shape[0]) o.shape[0] = img.width
					if (!o.shape[1]) o.shape[1] = img.height
					ok(readRaw(img, o))
				}
				img.onerror = function(err) {
					nok(err)
				}
				img.src = ['data:' + type, 'base64,' + tostr(src, 'base64')].join(';')
			})
		}

		// raw data
		if (!width || !height) throw new Error('Raw data requires options.width and options.height')
		var rawData = context.createImageData(width, height)
		rawData.data.set(img)
		context.putImageData(rawData, 0, 0)
	}
	// default img-like object
	else {
		context.drawImage(img, 0, 0)
	}

	var result

	if (o.cache) {
		result = context.getImageData(0, 0, width, height)
		cache.set(o.cache, result)
	}

	result = context.getImageData(clip.x, clip.y, clip.width || width, clip.height || height)

	return Promise.resolve(result)
}
