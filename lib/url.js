// read url/path in node
'use strict'

var request = require('request')
var fs = require('fs')
var isUrl = require('is-url')
var URL = require('url')
var isDataUrl = require('is-base64')
var toab = require('to-array-buffer')

module.exports = function load (str, clip) {
	return (isDataUrl(str, {mime: true}) ? loadDataUrl(str) : isUrl(str) ? loadUrl(str) : loadPath(str))
}

function loadDataUrl (url) {
	var ab = toab(url)
	return Promise.resolve(ab)
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

function loadPath (filename) {
	return new Promise(function (yes, no) {
		fs.readFile(filename, function(err, buffer) {
			if(err) {
				no(err)
				return
			}

			yes(buffer)
	    })
	})
}
