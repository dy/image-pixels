# get-pixel-data [![Build Status](https://travis-ci.org/dy/get-pixel-data.svg?branch=master)](https://travis-ci.org/dy/get-pixel-data) [![unstable](https://img.shields.io/badge/stability-unstable-green.svg)](http://github.com/badges/stability-badges) [![Greenkeeper badge](https://badges.greenkeeper.io/dy/get-pixel-data.svg)](https://greenkeeper.io/)

Get pixel data for a given URL, path, buffer, canvas, image or any other source.


## Usage

[![$ npm install get-pixel-data](http://nodei.co/npm/get-pixel-data.png?mini=true)](http://npmjs.org/package/get-pixel-data)

```javascript
var pixelData = require('get-pixel-data')

// load single source
var pixels = await pixelData('lena.png')

// load multiple sources in parallel
var [a, b, c] = await pixelData.all([
	'./a.jpg',
	{ source: './b.png', cache: false },
	canvas
])

// load font atlas sprite dict
var atlas = require('font-atlas')(chars: 'abc', step: [10, 10], shape: [20, 20])
var dict = await pixelData({
	a: {source: atlas, clip: [0,0,10,10]},
	b: {source: atlas, clip: [10,0,10,10]},
	c: {source: atlas, clip: [0,10,10,10]}
)
```

### `pixels = await pixelData(source, options?)`

Loads pixel data from `source`:

* `path`, `url`
* `data-uri`, `base64` strings
* `<img>`, `<image>`, `<video>`, `<canvas>`
* `HTMLImageElement`, `SVGImageElement`, `HTMLVideoElement`, `CSSImageValue`
* `Image`, `ImageData`, `ImageBitmap`
* `File`, `Blob`
* `MediaSource` [pending]
* `OffscreenCanvas` [pending]
* `Canvas`
* `Context2D`
* `WebGLContext`
* `Buffer`, `ArrayBuffer`, `ArrayBufferView`
* `Uint8Array`, `Uint8ClampedArray`
* `Float32Array`, `Float64Array`, `Array`, `Array` of arrays
* `ndarray`
* `Promise`
* regl, gl- components and other
* options object

Option | Meaning
---|---
`source` | Source data, one from the list above.
`shape` | Input data shape `[width, height]`, required for raw data.
`type` | Mime type, optional for raw data.
`cache` | Save URL for faster later fetching.
`clip` | Clipping rectangle, `[left, top, right, bottom]` or `{x?, y?, width?, height?}`.
<!-- `frame` | A frame # to read for animated image formats. -->
<!-- `worker` | Delegate computation to worker, if available. Does not block main thread. -->

`pixels` has `data`, `width` and `height` properties defined on it:

```js
var {data, width, height} = pixels
```

Old callback style syntax is also supported:

```js
getPixels(img, function (err, {data, width, height}) {})
```


### `list|dict = await pixelData.all(list|dict)`

Load multiple sources or dict of sources in parallel.


## Related

* [get-pixels](https://ghub.io/get-pixels) − get ndarray with pixel data.
* [get-image-pixels](https://ghub.io/get-image-pixels) − get pixel data for Canvas/Image/Video.
* [get-image-data](https://ghub.io/get-image-data) − get image data for Canvas/Image/Video, browser-only.

## License

© 2018 Dmitry Yv. MIT License
