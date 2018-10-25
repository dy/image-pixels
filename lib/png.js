// decode png buffer
'use strict'


var PNG = require('pngjs').PNG
var toab = require('to-array-buffer')

module.exports = function read (data, o) {
	return new Promise(function (ok, nok) {
		var png = new PNG()

		png.parse(data, function(err, imgData) {
			if(err) {
				return nok(err)
			}

			var pixels = new Uint8Array(toab(imgData.data))

			pixels.data = pixels.subarray()
			pixels.width = imgData.width | 0
			pixels.height = imgData.height | 0

			ok(pixels)
		})
	})
}

