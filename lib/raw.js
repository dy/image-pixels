// decode any data in node

'use strict'

var imgType = require('image-type')
var test = require('is-buffer')
var clipPixels = require('clip-pixels')
var b2u8 = require('buffer-to-uint8array')

module.exports = loadRaw

var decoder = {
	'png': require('./png'),
	'image/png': require('./png'),
	'gif': require('./gif'),
	'image/gif': require('./gif'),
	'image/jpeg': require('./jpg'),
	'image/jpg': require('./jpg'),
	'jpg': require('./jpg'),
	'jpeg': require('./jpg'),
	'bmp': require('./bmp'),
	'image/bmp': require('./bmp'),
	'image/bitmap': require('./bmp')
}

function loadRaw (data, o) {
	var width = o.shape[0], height = o.shape[1]
	var clip = o.clip
	var type = o.type

	if (!type) {
		type = imgType(data)
		type = type && type.mime
	}

	if (type) {
		if (!decoder[type]) new Error('Unknown image type `' + type.ext + '`')

		return decoder[type](data).then(function (pixels) {
		    if (clip.x || clip.y ||
		    	(clip.width && clip.width !== pixels.width) ||
		    	(clip.height && clip.height !== pixels.height)
		    ) {
				pixels = new Uint8Array(clipPixels(pixels, [pixels.width, pixels.height], [clip.x, clip.y, clip.width, clip.height]))
				pixels.data = pixels.subarray()
				pixels.width = clip.width
				pixels.height = clip.height
		    }

		    return pixels
		})
	}

	// raw pixels
	if (data instanceof ArrayBuffer) {
		data = new Uint8Array(data)
	}

	// raw pixels
	if (!width || !height) throw new Error('Raw data requires options.width and options.height')

	var pixels = data
    if (clip.x || clip.y ||
		(clip.width && clip.width !== pixels.width) ||
		(clip.height && clip.height !== pixels.height)
	) {
		pixels = new Uint8Array(clipPixels(data, [width, height], [clip.x, clip.y, clip.width, clip.height]))
		pixels.data = pixels.subarray()
		pixels.width = clip.width || width
		pixels.height = clip.height || height
	}
	else {
		pixels.data = pixels.subarray()
		pixels.width = width
		pixels.height = height
	}

	return Promise.resolve(pixels)
}
