'use strict'


// var extname = require('get-ext')
// var GifReader = require('omggif').GifReader
// var parseDataURI = require('data-uri-to-buffer')
// var isBuffer = require('is-buffer')
// var isUrl = require('is-url')
// var isBlob = require('is-blob')

var isPromise = require('is-promise')
var isObj = require('is-plain-obj')
var isBase64 = require('is-base64')
var fileType = require('file-type')
var toab = require('string-to-arraybuffer')
var rect = require('parse-rect')
var extend = require('object-assign')


module.exports = load
module.exports.all = require('./lib/all')


function load(src, o) {
  // handle arguments
  if (isObj(src)) {
    o = extend(src, o)
  }
  if (typeof o === 'string') o = {type: o}
  else if (!o) o = {}
  else if (Array.isArray(o)) o = {shape: o}

  // detect clipping
  var width = o.shape && o.shape[0] || o.w || o.width
  var height = o.shape && o.shape[1] || o.h || o.height
  var clip = o.clip && rect(o.clip) || {x:0, y: 0}
  var type = o.type || o.mime

  // handle source type
  var result
  if (typeof src === 'string') {
    // convert base64 to datauri
    if (isBase64(src) && !/^data\:/i.test(src)) {
      var buf = new Uint8Array(toab(src))

      // detect type if not passed in options
      if (!type) {
        type = fileType(buf)
        type = type && type.mime
      }

      // raw pixel data
      if (!type) {
        if (!width || !height) throw new Error('Raw data requires options.width and options.height')
        buf.width = width
        buf.height = height
        result = getPixelData(buf)
      }
      else {
        src = ['data:' + type.mime, 'base64,' + src].join(';')
      }
    }

    // url, path, datauri
    return loadURL(src)
  }

  // loadable source: <img> etc.
  if ('onload' in src && src.addEventListener) {
    if (src.complete) {
      return Promise.resolve(getPixelData(src))
    }

    return new Promise(function (ok, err) {
      src.addEventListener('load', function () {
        ok(getPixelData(src))
      })
      src.addEventListener('error', function(err) {
        nok(err)
      })
    })
  }

  // any unknown source
  result = loadDefault(src)

  // make sure result is promise
  if (!isPromise(result)) result = Promise.resolve(result)

  return result

  // else {
  //   if (arg.buffer || arg.data || arg._data)
  // }

  // // NDArray, ImageData
  // else if (arg.buffer || arg.data || arg._data) {

  // }

  // // TypedArray, Buffer
  // else if () {

  // }

  // // Array of Arrays
  // else if () {

  // }

  // // ImageBitmap
  // else if () {

  // }

  // // File, Blob
  // else if (isBlob(data) || (data instanceof File)) {

  // }

  // // Canvas, canvas-like
  // else if (src.canvas || src.context || src.gl || src.getContext) {

  // }

  function loadURL (url) {
    return new Promise(function (ok, nok) {
      var img = new Image()
      img.crossOrigin = 'Anonymous'
      img.onload = function() {
        if (!width) width = img.width
        if (!height) height = img.height
        ok(getPixelData(img))
      }
      img.onerror = function(err) {
        nok(err)
      }
      img.src = url
    })
  }

  var canvas, context
  function getPixelData(img) {
    if (!canvas) {
      canvas = document.createElement('canvas')
      context = canvas.getContext('2d')
    }
    canvas.width = img.width
    canvas.height = img.height

    // raw pixels
    if (img instanceof Uint8Array) {
      var idata = context.createImageData(canvas.width, canvas.height)
      for (var i = 0; i < img.length; i++) {
        idata.data[i] = img[i]
      }
      context.putImageData(idata, 0, 0)
    }
    // img-like object
    else {
      context.drawImage(img, 0, 0)
    }

    var idata = context.getImageData(clip.x, clip.y, clip.width || img.width, clip.height || img.height)
    var result = new Uint8Array(idata.data)
    result.data = result.subarray()
    result.width = idata.width
    result.height = idata.height
    return result
  }

  // convert arraybuffer to pixels
  function loadBuffer (buffer) {
  }


  function loadDefault (src) {
    // imageBitmap first
    if (global.createImageBitmap) {
      if (!clip.width && !clip.height) return createImageBitmap(src)
      return createImageBitmap(src, clip.x, clip.y, clip.width, clip.height)
    }

    // createObjectURL second
    if (window.URL && window.URL.createObjectURL) {
      var img = document.createElement('img')
      img.addEventListener('load', function() {
          resolve(this);
      });
      img.src = URL.createObjectURL(blob)
    }

    // Canvas2D third
    else {
      if (!img.crossOrigin) img.crossOrigin = 'Anonymous'

      if (!context) {
          canvas = document.createElement("canvas")
          context = canvas.getContext('2d')
      }

      img.onload = function () {
        var canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        var context = canvas.getContext('2d')
        context.drawImage(img, 0, 0)
        var pixels = context.getImageData(0, 0, img.width, img.height)
      }

      img.onerror = function(err) {
        nok(err)
      }

      img.src = url
    }
  }
}


