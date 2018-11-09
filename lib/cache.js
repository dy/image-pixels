'use strict'

var p = require('primitive-pool')
var WeakMap = require('weak-map')

// cache of data without clipping, depending on source
var cache = new WeakMap()

module.exports = {
	get: function (key) {
		return cache.get(p(key))
	},
	set: function (key, value) {
		if (!Array.isArray(key)) key = [key]

		key.forEach(function (key) {
			if (!key) return
			if (!cache.get(p(key))) cache.set(p(key), value)
		})

		return value
	}
}
