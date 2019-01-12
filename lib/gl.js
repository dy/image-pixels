// read canvas/webgl pixels
'use strict'

var isBrowser = require('is-browser')
var flipData = require('flip-pixels')
var clipData = require('clip-pixels')

var canvas, ctx

module.exports = function read (gl, o) {
  var width = o.shape[0], height = o.shape[1]
  var clip = o.clip

  // drawing webgl to 2d canvas is faster
  if (isBrowser && gl.canvas) {
    if (!ctx) {
      canvas = document.createElement('canvas')
      ctx = canvas.getContext('2d')
    }

    canvas.width = gl.drawingBufferWidth
    canvas.height = gl.drawingBufferHeight
    ctx.drawImage(gl.canvas, 0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)

    var result = ctx.getImageData(clip.x, clip.y, clip.width || width, clip.height || height)

    return result
  }

  // flipping pixels is slower
  var pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
  gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels)

  var result = { }
  result.width = gl.drawingBufferWidth
  result.height = gl.drawingBufferHeight
  pixels = flipData(pixels, result.width, result.height)
  result.data = pixels

  if (clip.x || clip.y ||
    (clip.width && clip.width !== result.width) ||
    (clip.height && clip.height !== result.height)
  ) {
    pixels = new Uint8Array(clipData(pixels, [result.width, result.height], [clip.x, clip.y, clip.width, clip.height]))
    result.data = pixels
    result.width = clip.width
    result.height = clip.height
  }

  return Promise.resolve(result)
}
