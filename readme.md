# get-pixel-data [![Build Status](https://travis-ci.org/dy/get-pixel-data.svg?branch=master)](https://travis-ci.org/dy/get-pixel-data) [![unstable](https://img.shields.io/badge/stability-unstable-green.svg)](http://github.com/badges/stability-badges) [![Greenkeeper badge](https://badges.greenkeeper.io/dy/get-pixel-data.svg)](https://greenkeeper.io/)

Get pixel data for given URL, path, buffer, canvas or any other image source.


## Usage

[![$ npm install get-pixel-data](http://nodei.co/npm/get-pixel-data.png?mini=true)](http://npmjs.org/package/get-pixel-data)

```javascript
var pxData = require('get-pixel-data')

// callback style
pxData('lena.png', function(err, pixels) {
  if(err) {
    console.log("Bad image path")
    return
  }
  console.log("got pixels", pixels)
})

// async style
var pixels = await pxData('lena.png')

// pixels data properties
var [width, height] = pixels

// load multiple sources in parallel
var [a, b, c] = await pxData.all(['./a.jpg', './b.png', canvas])

// load dict of sources
var {a, b, c} = await pxData.all({a: './a.jpg', b: './b.png', c: canvas})
```

### `pxData(source|list|dict, options?, cb(err, pixels)?).then(pixels => {})`

Loads and reads pixels into `Uint8Array` from `source`:

* `path`, `url`
* `data-uri`, `base64` strings
* `<img>`, `<image>`, `<video>`, `<canvas>`
* `HTMLImageElement`, `SVGImageElement`, `HTMLVideoElement`, `CSSImageValue`
* `Image`, `ImageData`, `ImageBitmap`
* `File`, `Blob`, `MediaSource`
* `Canvas`, `OffscreenCanvas`
* `Context2D`
* `WebGLContext`
* `Buffer`, `ArrayBuffer`, `ArrayBufferView`
* `Uint8Array`, `Uint8ClampedArray`
* `Float32Array`, `Float64Array`, `Array`, `Array` of arrays
* `ndarray`
* regl, gl- components and other
* null for empty pixels

`options` can specify:

Option | Meaning
---|---
`x` | Clipping left coordinate.
`y` | Clipping top coordinate.
`width` | Clipping width.
`height` | Clipping height.
`frame` | A frame # to read for animated image formats.
`cache` | Save data for later faster fetch

Returning `pixels` have additional properties:

Property | Meaning
---|---
`pixels.width` | Width of data, in pixels.
`pixels.height` | Height of data, in pixels.

## Related

* [get-pixels](https://ghub.io/get-pixels) − get ndarray with pixel data
* [get-get-pixel-data](https://ghub.io/get-get-pixel-data) − get pixel data for Canvas/Image/Video

## License

© 2018 Dmitry Yv. MIT License
