// decode bmp buffer
'use strict'

var bmp = require('bmp-js')

module.exports = function read (data, o) {
	var bmpData = bmp.decode(data)

	var width = bmpData.width
	var height = bmpData.height

	var pixels = new Uint8Array(width * height * 4)

	// bmp stores stuff as ARGB seq
	for (var i = 0; i < pixels.length; i+=4) {
		var alpha = bmpData.data[i + 0];
		var blue = bmpData.data[i + 1];
		var green = bmpData.data[i + 2];
		var red = bmpData.data[i + 3];

		pixels[i + 0] = red;
		pixels[i + 1] = green;
		pixels[i + 2] = blue;
		pixels[i + 3] = bmpData.is_with_alpha ? alpha : 0xff;
	}

	pixels.data = pixels.subarray()
	pixels.width = bmpData.width
	pixels.height = bmpData.height

	return Promise.resolve(pixels)
}

