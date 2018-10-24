// decode png buffer



var PNG = require('pngjs').PNG

module.exports = function read (data) {
	return new Promise(function (ok, nok) {
		var png = new PNG()

		png.parse(data, function(err, imgData) {
			if(err) {
				return nok(err)
			}

			var pixels = imgData.data
			pixels.data = imgData.data
			pixels.width = imgData.width | 0
			pixels.height = imgData.height | 0

			ok(pixels)
		})
	})
}

