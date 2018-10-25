'use strict'

module.exports = function (src, clip) {
  return new Promise(function (ok, nok) {
    var img = new Image()
    img.crossOrigin = 'Anonymous'
    img.onload = function() {
      ok(img)
    }
    img.onerror = function(err) {
      nok(new Error('Bad image URL/path', err))
    }
    img.src = src
  })
}
