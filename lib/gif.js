// decode gif buffer

'use strict'

var test = require('is-gif')
var PNG = require('omggif').GifReader

module.exports =
module.exports.read = read
module.exports.test = test

function read (data) {
	if (!test(data)) throw Error('Data must be valid GIF buffer')

	var reader = new GifReader(data)

	// TODO: handle multiframe gif
	// if(reader.numFrames() > 0) {
	// 	var nshape = [reader.numFrames(), reader.height, reader.width, 4]
	// 	try  {
	// 	  var ndata = new Uint8Array(nshape[0] * nshape[1] * nshape[2] * nshape[3])
	// 	} catch(err) {
	// 	  cb(err)
	// 	  return
	// 	}

	// 	var result = ndarray(ndata, nshape)
	// 	try {
	// 	  for(var i=0; i < reader.numFrames(); ++i) {
	// 	    reader.decodeAndBlitFrameRGBA(i, ndata.subarray(
	// 	      result.index(i, 0, 0, 0),
	// 	      result.index(i+1, 0, 0, 0)))
	// 	  }
	// 	} catch(err) {
	// 	  cb(err)
	// 	  return
	// 	}

	// 	cb(null, result.transpose(0,2,1))
	// }

	// single frame gif
	var data = new Uint8Array(reader.width * reader.height * 4)

	reader.decodeAndBlitFrameRGBA(0, data)

	data.width = reader.width
	data.height = reader.height

	// TODO: transpose gif maybe?
	return data

	// cb(null, result.transpose(1,0))
}

