'use strict'

// TODO: make full-featured reader instead of get-pixels fallback

var getNdPixels = require('get-pixels')

module.exports = function getPixelData (arg, o, cb) {
  return new Promise(function (ok, nok) {
    getNdPixels(arg, o.type || o.mime, function (err, ndpixels) {
      if (err) return nok(err)

      ok(ndpixels.data)
    })
  })
}
