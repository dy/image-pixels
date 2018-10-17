// read canvas/webgl pixels

'use strict'

var isBrowser = require('is-browser')
var flip = require('flip-pixels')
var read2d = require('./2d')

module.exports =
module.exports.read = read
module.exports.test = test

var canvas, ctx

function read (gl) {
  if (!test(gl)) throw Error('Argument must be WebGL context')

  // drawing webgl to 2d canvas is faster
  if (isBrowser) {
    if (!ctx) {
      canvas = document.createElement('canvas')
      ctx = canvas.getContext('2d')
    }

    canvas.width = gl.drawingBufferWidth
    canvas.height = gl.drawingBufferHeight
    ctx.drawImage(gl.canvas, 0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)

    return read2d(ctx)
  }

  // flipping pixels way of reading data (slow)
  var pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
  gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels)

  pixels.width = gl.drawingBufferWidth
  pixels.height = gl.drawingBufferHeight
  flip(pixels, pixels.width, pixels.height)

  return pixels
}

function test (gl) {
  return !!(gl && gl.readPixels)
}
