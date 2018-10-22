// read 2d context



module.exports =
module.exports.read = read
module.exports.test = test


function read (ctx) {
	if (!test(ctx)) throw Error('Argument must be context2d')

	var pixels
    if (ctx.getImageData) {
      pixels = src.getImageData(0, 0, src.canvas.width, src.canvas.height).data
      pixels.width = src.canvas.width
      pixels.height = src.canvas.height
    }

    return pixels
}

function test (ctx) {
	if (!ctx) return false
	if (!ctx.getImageData) return false
  return true
}
