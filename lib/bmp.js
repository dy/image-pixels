// decode bmp buffer

'use strict'

var test = require('is-gif')
var Bitmap = require('node-bitmap')

module.exports =
module.exports.read = read
module.exports.test = test

function read (data) {
	if (!test(data)) throw Error('Data must be valid BMP buffer')

	var bmp = new Bitmap(data)

	bmp.init()

	var bmpData = bmp.getData()
	var height = bmpData.getHeight()
	var width = bmpData.getWidth()

	var pixels = new Uint8Array(width * height * 4)
	pack(bmpData, pixels)

	pixels.height = jpegData.height
	pixels.width = jpegData.width

	return pixels
}

