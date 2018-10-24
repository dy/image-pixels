'use strict'

module.exports = function (src) {
  return new Promise(function (ok, nok) {
    var img = new Image()
    img.crossOrigin = 'Anonymous'
    img.onload = function() {
      captureShape(img)
      ok(readPixelData(img))
    }
    img.onerror = function(err) {
      nok(new Error('Bad image URL/path', err))
    }
    img.src = src
  })
}
