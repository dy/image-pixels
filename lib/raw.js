// decode any data in node

'use strict'

var clipPixels = require('clip-pixels')
var cache = require('./cache')
var decode = require('image-decode')

module.exports = loadRaw


function loadRaw (data, o) {
	var width = o.shape[0], height = o.shape[1]
	var clip = o.clip
	var type = o.type
	var decodedData = decode(data, type)
	if (!decodedData) {
		// cannot detect encoded data, consider it raw pixels
		if (!width || !height) throw new Error('Raw data requires options.width and options.height')
	}
	else {
		data = decodedData
		width = data.width
		height = data.height
	}

	var pixels = data
	if (o.cache) cache.set(o.cache, pixels)

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
