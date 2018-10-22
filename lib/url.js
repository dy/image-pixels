// read url/path in node



var readBuffer = require('./buffer')
var request = require('request')
var exists = require('path-exists')
var fs = require('fs')
var isValidPath = require('is-valid-path')


module.exports =
module.exports.read = read
module.exports.test = test


function test (str) {
	return !!(isUrl(str) || (isValidPath(str) && exists(str)))
}

function read (str) {
	if (!test(str)) throw Error('Argument must be valid URL or path')

	return (isUrl(str) ? readUrl(str) : readPath(str)).then(function (buffer) {
		return readBuffer(buffer)
	})
}

function readUrl (url) {
	return new Promise(function (yes, no) {
		request({
			url: url,
			// arraybuffer
			encoding: null
		}, function(err, resp, body) {
			if (err) return no(err)
			if (resp.statusCode !== 200) return no(new Error('Status code: ' + resp.statusCode))

			// FIXME: type is detected from buffer, no worries here
			// if(!type){
			// 	if(resp.getHeader !== undefined){
			// 		type = resp.getHeader('content-type');
			// 	}
			// 	else if (resp.headers !== undefined)
			// 	{
			// 		type = resp.headers['content-type'];
			// 	}
			// }
			// if(!type) {
			// 	return no(Error('Invalid content-type'))
			// }

			yes(buffer)
		})
	})
}

function readPath (path) {
	return new Promise(function (yes, no) {
		fs.readFile(path, function(err, buffer) {
			if(err) {
				no(err)
				return
			}

			yes(buffer)
	    })
	})
}
