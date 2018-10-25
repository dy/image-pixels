// read canvas/webgl pixels
'use strict'

var isBrowser = require('is-browser')
var flipData = require('flip-pixels')
var clipData = require('clip-pixels')

var canvas, ctx

module.exports = function read (gl, o) {
  var width = o.shape[0], height = o.shape[1]
  var clip = o.clip
  var type = o.type

  // drawing webgl to 2d canvas is faster
  if (isBrowser) {
    if (!ctx) {
      canvas = document.createElement('canvas')
      ctx = canvas.getContext('2d')
    }

    canvas.width = gl.drawingBufferWidth
    canvas.height = gl.drawingBufferHeight
    ctx.drawImage(gl.canvas, 0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)

    var idata = ctx.getImageData(clip.x, clip.y, clip.width || width, clip.height || height)

    var result = new Uint8Array(idata.data)
    result.data = result.subarray()
    result.width = idata.width
    result.height = idata.height
    return result
  }

  // flipping pixels is slower
  var pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
  gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels)

  pixels.width = gl.drawingBufferWidth
  pixels.height = gl.drawingBufferHeight
  pixels = flipData(pixels, pixels.width, pixels.height)
  pixels.data = pixels.subarray()

  if (clip.x || clip.y ||
    (clip.width && clip.width !== pixels.width) ||
    (clip.height && clip.height !== pixels.height)
  ) {
    pixels = new Uint8Array(clipData(pixels, [pixels.width, pixels.height], [clip.x, clip.y, clip.width, clip.height]))
    pixels.data = pixels.subarray()
    pixels.width = clip.width
    pixels.height = clip.height
  }

  return Promise.resolve(pixels)
}
