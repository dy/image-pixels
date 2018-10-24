// decode any data in node

'use strict'

var imgType = require('image-type')
var test = require('is-buffer')
var clipPixels = require('clip-pixels')

module.exports = readPixelData

var decoder = {
	'png': require('./png'),
	'image/png': require('./png'),
	// 'gif': require('./gif'),
	'image/jpeg': require('./jpg'),
	'jpg': require('./jpg'),
	// 'jpeg': require('./jpg'),
	// 'bmp': require('./bmp')
}

function readPixelData (data, o) {
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
				pixels.data = pixels
				pixels.width = clip.width
				pixels.height = clip.height
		    }

		    return pixels
		})
	}
}
