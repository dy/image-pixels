// decode gif buffer

'use strict'

var test = require('is-gif')
var jpeg = require('jpeg-js')

module.exports =
module.exports.read = read
module.exports.test = test

function read (data) {
	if (!test(data)) throw Error('Data must be valid JPG buffer')

	var jpegData = jpeg.decode(data)

	if(!jpegData) {
		throw Error("Error decoding jpeg")
	}

	var pixels = jpegData.data
	pixels.height = jpegData.height
	pixels.width = jpegData.width

	return pixels
}

