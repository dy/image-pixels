'use strict'

var isObj = require('is-plain-obj')
var isBase64 = require('is-base64')
var fileType = require('file-type')
var toab = require('string-to-arraybuffer')
var tostr = require('arraybuffer-to-string')
var rect = require('parse-rect')
var extend = require('object-assign')
var isBlob = require('is-blob')
var flat = require('arr-flatten')
var p = require('primitive-pool')
var WeakMap = require('es6-weak-map')
var clipPixels = require('clip-pixels')


module.exports = getPixels
module.exports.get = getPixels
module.exports.all = getPixelsAll


function getPixelsAll (src, o, cb) {
  if (!src) return null

  if (typeof o === 'function') {
    cb = o
    o = null
  }

  // list
  if (Array.isArray(src)) {
    var list = src.map(function (source) {
      return getPixels(source, o)
    })

    // return promise resolved with list
    return Promise.all(list).then(function (list) {
      cb && cb(null, list)
      return list
    }, function (err) {
      cb && cb(err)
      return Promise.reject(err)
    })
  }

  // dict
  var handlers = {}
  var list = []
  for (var name in src) {
    handlers[name] = list.push(getPixels(src[name], o)) - 1
  }

  // return promise resolved with dict
  return Promise.all(list).then(function (list) {
    var result = {}
    for (var name in handlers) {
      result[name] = list[handlers[name]]
    }
    cb && cb(null, result)
    return result
  }, function (err) {
    cb && cb(err)
    return Promise.reject(err)
  })
}



// cache of data depending on source
var cache = new WeakMap()


function getPixels(src, o, cb) {
  // detect callback arg
  if (typeof o === 'function') {
    cb = o
    o = isObj(src) ? src : null
  }

  // intercept callback call
  if (cb) return getPixels(src, o).then(function (data) {
    cb(null, data)
    return data
  }, function (err) {
    cb(err)
  })

  if (!src) src = {}

  // handle arguments
  if (typeof o === 'string') o = {type: o}
  else if (!o) o = {}
  else if (Array.isArray(o)) o = {shape: o}
  if (isObj(src)) {
    o = extend(src, o)
    src = o.source || o.src

    // nested source
    if (isObj(src)) src = src.source || src.src || src
  }

  // detect clipping
  var width, height
  var clip = o.clip && rect(o.clip) || {x: 0, y: 0}
  var type = o.type || o.mime
  captureShape(o)
  captureShape(src)

  // File & Blob
  if (isBlob(src) || (src instanceof File)) {
    // FIXME: try to use createImageBitmap for Blob
    src = URL.createObjectURL(src)

    // TODO: detect raw data
  }

  // get cached instance
  if (cache.has(p(src))) {
    var result = cache.get(p(src))
    if (clip.x || clip.y || clip.width !== result.width || clip.height !== result.height) {
      result = new Uint8Array(clipPixels(result, [result.width, result.height], [clip.x, clip.y, clip.width, clip.height]))
      result.data = result
      result.width = clip.width
      result.height = clip.height
    }

    return Promise.resolve(result)
  }

  // handle source type
  if (typeof src === 'string') {
    if (!src) return Promise.reject(new Error('Bad URL'))

    // convert base64 to datauri
    if (isBase64(src) && !/^data:/i.test(src)) {
      var buf = new Uint8Array(toab(src))

      captureMime(buf)

      // raw pixel data
      if (!type) {
        return Promise.resolve(readPixelData(buf))
      }

      // encoded image data - fall back to default url
      src = ['data:' + type, 'base64,' + src].join(';')
    }

    // url, path, datauri
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

  // SVG Image
  if (global.SVGImageElement && src instanceof SVGImageElement) {
    var url = src.getAttribute('xlink:href')
    src = new Image()
    src.src = url
  }

  // fetch closest image/video
  if (src.tagName === 'PICTURE') src = src.querySelector('img')

  // <img>
  if (src instanceof Image) {
    if (src.complete) {
      captureShape(src)
      return Promise.resolve(readPixelData(src))
    }

    return new Promise(function (ok, err) {
      src.addEventListener('load', function () {
        captureShape(src)
        ok(readPixelData(src))
      })
      src.addEventListener('error', function(err) {
        nok(err)
      })
    })
  }

  // <video>
  if (src instanceof HTMLMediaElement) {
    if (src.readyState) {
      captureShape({w: src.videoWidth, h: src.videoHeight})
      return Promise.resolve(readPixelData(src))
    }

    return new Promise(function (ok, err) {
      src.addEventListener('loadeddata', function () {
        captureShape({w: src.videoWidth, h: src.videoHeight})
        ok(readPixelData(src))
      })
      src.addEventListener('error', function(err) {
        nok(err)
      })
    })
  }

  // any other source, inc. unresolved promises
  return Promise.resolve(src).then(function (src) {
    // float data → uint data
    if ((src instanceof Float32Array) || (src instanceof Float64Array)) {
      var buf = new Uint8Array(src.length)
      for (var i = 0; i < src.length; i++) {
        buf[i] = src[i] * 255
      }
      src = buf
    }

    // retrieve canvas from contexts
    var ctx = src._gl || src.gl || src.context || src.ctx
    src = ctx && ctx.canvas || src.canvas || src

    captureShape(src)
    // retrieve buffer from buffer containers
    src = src.data || src.buffer || src._data || src
    captureShape(src)
    captureMime(src)

    return readPixelData(src)
  })

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

  var canvas, context
  function readPixelData(img) {
    if (!canvas) {
      canvas = document.createElement('canvas')
      context = canvas.getContext('2d')
    }
    canvas.width = width
    canvas.height = height

    // array of arrays
    if (Array.isArray(img)) {
      // [r,g,b,a,r,g,b,a,...]
      // [[[r,g,b,a], [r,g,b,a]], [[r,g,b,a], [r,g,b,a]]]
      // [[r,g,b,a], [r,g,b,a], [r,g,b,a], [r,g,b,a]]
      // [[r,g,b,a,r,g,b,a], [r,g,b,a,r,g,b,a]]
      img = new Uint8Array(flat(img))
    }

    // raw pixels
    if (img instanceof ArrayBuffer) {
      img = new Uint8Array(img)
    }

    // FIXME: for clipping case that might be faster to copy just a slice of pixels
    // FIXME: or even better - ignore drawing pixels to canvas and just pick them directly
    if (img instanceof Uint8Array || img instanceof Uint8ClampedArray) {
      // decode encoded data
      captureMime(img)
      if (type) {
        var src = img
        return new Promise(function (ok, nok) {
          var img = new Image()
          img.crossOrigin = 'Anonymous'
          img.onload = function() {
            captureShape(img)
            ok(readPixelData(img))
          }
          img.onerror = function(err) {
            nok(err)
          }
          img.src = ['data:' + type, 'base64,' + tostr(src, 'base64')].join(';')
        })
      }

      // raw data
      if (!width || !height) throw new Error('Raw data requires options.width and options.height')
      var rawData = context.createImageData(width, height)
      for (var i = 0; i < img.length; i++) {
        rawData.data[i] = img[i]
      }
      context.putImageData(rawData, 0, 0)
    }
    // default img-like object
    else {
      context.drawImage(img, 0, 0)
    }

    var idata = context.getImageData(clip.x, clip.y, clip.width || width, clip.height || height)
    var result = new Uint8Array(idata.data)
    result.data = result.subarray()
    result.width = idata.width
    result.height = idata.height
    return result
  }

  // try to figure out width/height from container
  function captureShape(container) {
    // SVG had width as object
    if (!width || typeof width !== 'number') width = container && container.shape && container.shape[0] || container.width || container.w
    if (!height || typeof height !== 'number') height = container && container.shape && container.shape[1] || container.height || container.h
  }

  // if buffer is raw px data
  function captureMime(buf) {
    // detect type if not passed in options
    if (!type) {
      type = fileType(buf)
      type = type && type.mime

      return true
    }

    return false
  }
}

