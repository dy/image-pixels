// decode jpeg buffer
'use strict'

var jpeg = require('jpeg-js')
var b2u8 = require('buffer-to-uint8array')

module.exports = read

function read (data) {
	var jpegData = jpeg.decode(data)

	if(!jpegData) {
		return Promise.reject(new Error("Error decoding jpeg"))
	}

	var pixels = b2u8(jpegData.data)
	pixels.data = pixels.subarray()
	pixels.height = jpegData.height
	pixels.width = jpegData.width

	return Promise.resolve(pixels)
}

