// decode buffer data in node



var fileType = require('file-type')
var test = require('is-buffer')

module.exports =
module.exports.read = read
module.exports.test = test

var decoder = {
	'png': require('./png'),
	'gif': require('./gif'),
	'jpg': require('./jpg'),
	'jpeg': require('./jpg'),
	'bmp': require('./bmp')
}

function read (data) {
	if (!test(data)) throw Error('Argument must be a buffer with image data')

	var type = fileType(data)

	if(!decoder[type.ext]) {
		throw Error('Unknown image extension `' + type.ext + '`')
	}

	return decoder[type.ext](data)
}
