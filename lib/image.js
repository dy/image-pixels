/*
 * Read any image DOM-specific data
 *
 * <img>, <image>, <video>, <canvas>
 * HTMLImageElement, SVGImageElement, HTMLVideoElement
 * Image, ImageData, ImageBitmap
 * File, Blob, MediaSource
 */

'use strict'

module.exports =
module.exports.read = read
module.exports.test = test

function read (img) {
	if (typeof img === 'string') {
		img = new Image()
		img.src = img
	}

	if (!test(img)) throw Error('Argument must be Image instance')

	return new Promise(function (ok, nok) {

	    if (!context) {
	        canvas = document.createElement("canvas")
	        context = canvas.getContext('2d')
	    }

		if (!img.crossOrigin) img.crossOrigin = 'Anonymous'

		img.onload = function() {
			var canvas = document.createElement('canvas')
			canvas.width = img.width
			canvas.height = img.height
			var context = canvas.getContext('2d')
			context.drawImage(img, 0, 0)
			var pixels = context.getImageData(0, 0, img.width, img.height)
		}

		img.onerror = function(err) {
			nok(err)
		}

		img.src = url
	})
}

function test (img) {
	return !!(img && img instanceof Image)
}
