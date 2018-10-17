// decode png buffer

'use strict'

var test = require('is-png')
var PNG = require('pngjs').PNG

module.exports =
module.exports.read = read
module.exports.test = test

function read (data) {
	if (!test(data)) throw Error('Data must be valid png buffer')

	return new Promise(function (ok, nok) {
		var png = new PNG()

		png.parse(data, function(err, imgData) {
			if(err) {
				nok(err)
			}

			var pixels = imgData.data
			pixels.width = imgData.width | 0
			pixels.height = imgData.height | 0

			ok(pixels)
		})
	})
}

