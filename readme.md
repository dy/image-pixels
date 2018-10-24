# pxls [![Build Status](https://travis-ci.org/dy/pxls.svg?branch=master)](https://travis-ci.org/dy/pxls) [![unstable](https://img.shields.io/badge/stability-unstable-green.svg)](http://github.com/badges/stability-badges)

Get pixel data for a given URL, path, buffer, canvas, image or any other source. Intented for image based tests, first of all.


## Usage

[![$ npm install pxls](http://nodei.co/npm/pxls.png?mini=true)](http://npmjs.org/package/pxls)

```javascript
var pixels = require('pxls')

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

### `{data, width, height} = await pixels(source, options?, cb?)`

Loads pixel data from a `source` based on options. Possibly provide a callback for old-style async calls. Function returns a promise that gets resolved once the source is ready, therefore it is predisposed for await call.

#### `source`

Type | Meaning
---|---
`url`, `path` | Relative/absolute path in node resolves to a file.
`data-uri`, `base64` | String with encoded or raw pixel data. Raw data requires `options.shape`. Encoded data may require `options.type` to skip mime type detection.
`HTMLImageElement`, `SVGImageElement`, `HTMLVideoElement`, `CSSImageValue` | DOM/SVG image elements.
`Image`, `ImageData`, `ImageBitmap` | Browser image data containers.
`File`, `Blob` | Encoded image data.
`Canvas`, `Context2D` | 2D drawing context, browser-only.
`WebGLContext` | GL context, node/browser.
`Buffer`, `ArrayBuffer`, `Uint8Array`, `Uint8ClampedArray` | Raw or encoded pixel data. Raw data requires `options.shape`. For encoded data `options.type` can be provided in order to skip mime type detection.
`Float32Array`, `Float64Array`, `Array`, `Array` of arrays | Float pixel data with values from `0..1` range.
`Promise` | Promise expecting resolution to an image source.
`ndarray` | [Ndarray](https://ghub.io/ndarray) container with pixel data, compatible with [get-pixels](https://ghub.io/get-pixels).
`FileList` | [TODO]
`MediaSource` | [TODO]
`OffscreenCanvas` | [TODO]
`Bitmaprenderer` | [TODO]
`SourceBuffer`, `SourceBufferList` | [TODO]
options object | If `source` argument is omitted, it is taken from `options.source`, useful for `pixels.all`.

#### `options`

Option | Meaning
---|---
`source` | Source data, one from the list above.
`shape` | Input data shape `[width, height]`, required for raw data. Alternately, `width` or `height` properties may be provided.
`type`/`mime` | Mime type, optional for raw data.
`clip` | Clipping rectangle, `[left, top, right, bottom]` or `{x?, y?, width?, height?}`.
`cache` | Save source for faster later fetching.
<!-- `time` | A frame # to read for animated image formats. -->
<!-- `worker` | Delegate computation to worker, if available. Does not block main thread. -->

### `list|dict = await pixels.all(list|dict, options?, cb?)`

Load multiple sources or dict of sources in parallel. `options` can provide common for every source options.

```js
// load font atlas sprite dict
var atlas = require('font-atlas')(chars: 'abc', step: [10, 10], shape: [20, 20])
var dict = await pixels({
	a: {clip: [0,0,10,10]},
	b: {clip: [10,0,10,10]},
	c: {clip: [0,10,10,10]}
}, {cache: true, source: atlas})
```

#### Supported formats

In browser any format suported by `<img>` is available.
In node, the following formats are available:

* `PNG`
* `JPEG`
* `GIF`

## Related

* [get-pixels](https://ghub.io/get-pixels) − get ndarray with pixel data, limited set of sources.
* [get-image-pixels](https://ghub.io/get-image-pixels) − get pixel data for Canvas/Image/Video elements, browser-only.
* [get-image-data](https://ghub.io/get-image-data) − get image data for Canvas/Image/Video elements, browser-only.
* [image-equal](https://ghub.io/image-equal) − assert image with baseline.

## License

© 2018 Dmitry Yv. MIT License.
