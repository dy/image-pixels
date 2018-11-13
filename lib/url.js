// read url/path in node
'use strict'

var request = require('request')
var fs = require('fs')
var isUrl = require('is-url')
var URL = require('url')
var isDataUrl = require('is-base64')
var s2ab = require('string-to-arraybuffer')
var isRelative = require('is-relative')
var callerPath = require('caller-path')
var path = require('path')
var exists = require('path-exists')

module.exports = function load (str, clip) {
	return (isDataUrl(str, {mime: true}) ? loadDataUrl(str) : isUrl(str) ? loadUrl(str) : (function (filename) {
		// detect if direct path exists, and if not, try caller path
		// FIXME: make sure that is good solution
		if (isRelative(filename)) {
			var caller = callerPath()
			return exists(filename).then(function (exists) {
				if (exists) return loadPath(filename)
				return loadPath(path.join(path.dirname(caller), filename))
			})
		}

		return loadPath(filename)
	})(str))
}

function loadDataUrl (url) {
	var ab = s2ab(url)
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
