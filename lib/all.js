

var isObj = require('is-plain-obj')
var load = require('../')

module.exports = function all (arg) {
	if (!arg) return null

	if (Array.isArray(arg)) {
		var handlers = arg.map(function (source) {
			return fn(source)
		})

		// return promise resolved with list
		return Promise.all(handlers)
	}

	var handlers = {}
	var list = []
	for (var name in arg) {
		list.push(handlers[name] = fn(arg[name]))
	}

	// return promise resolved with dict
	return Promise.all(list).then(function () {return handlers})
}
