# image-pixels [![Build Status](https://travis-ci.org/dy/image-pixels.svg?branch=master)](https://travis-ci.org/dy/image-pixels) [![unstable](https://img.shields.io/badge/stability-unstable-green.svg)](http://github.com/badges/stability-badges)

Get pixel data for a given URL, path, buffer, canvas, image or any other source. Intented for image based tests, first of all.


## Usage

[![$ npm install image-pixels](http://nodei.co/npm/image-pixels.png?mini=true)](http://npmjs.org/package/image-pixels)

```javascript
var pixels = require('image-pixels')

// load single source
var {data, width, height} = await pixels('lena.png')

// load multiple sources in parallel
var [a, b, c] = await pixels.all([
	'./a.jpg',
	{ source: './b.png', cache: false },
	canvas
])
```

## API

### `let {data, width, height} = await pixels(source, options?, cb?)`

Loads pixel data from a `source` based on options. Possibly provide a callback for old-style async calls. Function returns a promise that gets resolved once the source is ready, so that is handy for await call.

In browser the result is `ImageData` object to easily output to context:

```js
document.body.appendChild(document.createElement('canvas'))
	.getContext('2d')
	.putImageData(await pixels('lena.png'))
```

#### `source`

Type | Meaning
---|---
`url`, `path` | Relative/absolute path.
`data-uri`, `base64` | String with encoded or raw pixel data. Raw data requires `options.shape`. Encoded data may require `options.type` to skip mime type detection.
`HTMLImageElement`, `SVGImageElement`, `HTMLVideoElement`, `CSSImageValue` | DOM/SVG image elements.
`Image`, `ImageData`, `ImageBitmap` | Browser image data containers.
`File`, `Blob` | Encoded image data.
`Canvas`, `Context2D` | 2D drawing context, browser-only.
`WebGLContext` | GL context, node/browser.
`Buffer`, `ArrayBuffer`, `Uint8Array`, `Uint8ClampedArray` | Raw or encoded pixel data. Raw data requires `options.shape`. For encoded data `options.type`skips mime type detection. Supported formats: `png`, `bmp`, `gif`, `jpg`.
`Float32Array`, `Float64Array`, `Array`, `Array` of arrays | Float pixel data with values from `0..1` range.
`Promise` | Promise expecting resolution to an image source.
`ndarray` | [Ndarray](https://ghub.io/ndarray) container with pixel data, compatible with [get-pixels](https://ghub.io/get-pixels).
options object | If `source` argument is omitted, it is taken from `options.source`, useful for `pixels.all`.

#### `options`

Option | Meaning
---|---
`source` | Source data, one from the list above. Applicable for multiple sources.
`shape` or `width`/`height` | Input raw data shape `[width, height]`.
`type`/`mime` | Mime type, optional for raw data to skip detection.
`clip` | Clipping rectangle, `[left, top, right, bottom]` or `{x?, y?, width?, height?}`.
`cache` | Cache loaded data for the source/url for faster subsequent fetch.

### `let list|dict = await pixels.all(list|dict, options?)`

Load multiple sources or dict of sources in parallel. `options` can provide common for every source options.

```js
// load font atlas sprite dict
var atlas = require('font-atlas')({chars: 'abc', step: [10, 10], shape: [20, 20]})

var dict = await pixels({
	a: {clip: [0,0,10,10]},
	b: {clip: [10,0,10,10]},
	c: {clip: [0,10,10,10]}
}, {cache: true, source: atlas})
```

## Related packages

* [image-save](https://ghub.io/image-save) − save image/pixel data to a file, canvas or array.
* [image-equal](https://ghub.io/image-equal) − assert image with baseline.

## Similar packages

* [get-pixels](https://ghub.io/get-pixels) − get ndarray with pixel data, limited set of sources.
* [ndarray-from-image](https://github.com/thibauts/ndarray-from-image) − get-pixels with dtype.
* [get-image-pixels](https://ghub.io/get-image-pixels) − get pixel data for Canvas/Image/Video elements, browser-only.
* [get-image-data](https://ghub.io/get-image-data) − get image data for Canvas/Image/Video elements, browser-only.
* [readimage](https://ghub.io/readimage) − read pixels data into an array in sync fashion in node.

## License

© 2018 Dmitry Yv. MIT License.
