// read data from canvas element or context 2d



var read2d = require('./2d')
var readGl = require('./gl')

module.exports =
module.exports.read = read
module.exports.test = test

function read (c) {
	if (!c) throw Error('Argument must be canvas')

	var ctx2d = c.getContext('2d'),
		gl = c.getContext('webgl')

	if (ctx2d) return read2d(ctx2d)

	return readGl(gl)
}

function test (c) {
	return !!(c && c.getContext)
}
