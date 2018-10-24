// decode any data in node

'use strict'

var imgType = require('image-type')
var test = require('is-buffer')
var clipPixels = require('clip-pixels')

module.exports = readPixelData

var decoder = {
	'png': require('./png'),
	// 'gif': require('./gif'),
	'jpg': require('./jpg'),
	// 'jpeg': require('./jpg'),
	// 'bmp': require('./bmp')
}

function readPixelData (data, shape, clip) {
	var type = imgType(data)

	if (!type) return new Error('Cannot detect image type')
	if (!decoder[type.ext]) new Error('Unknown image type `' + type.ext + '`')

	return decoder[type.ext](data).then(function (pixels) {
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
