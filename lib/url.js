// read url/path in node


var loadBuffer = require('./buffer')
var request = require('request')
var fs = require('fs')
var isUrl = require('is-url')
var URL = require('url')

module.exports = function load (str, clip) {
	return (isUrl(str) ? loadUrl(str) : loadPath(str)).then(function (buffer) {
		return loadBuffer(buffer, clip)
	})
}

function loadUrl (url) {
	// handle protocol-relative URL
	url = URL.parse(url)
	if (!url.protocol) url.protocol = 'https'
	url = URL.format(url)

	return new Promise(function (yes, no) {
		request({
			url: url,
			// arraybuffer
			encoding: null
		}, function(err, resp, body) {
			if (err) return no(err)
			if (resp.statusCode !== 200) return no(new Error('Status code: ' + resp.statusCode))

			yes(body)
		})
	})
}

function loadPath (path) {
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
