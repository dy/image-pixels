'use strict'

var t = require('tape')
var fs = require('fs')
var path = require('path')
var read = require('../')
var match = require('pixelmatch')
var assert = require('assert')
var s2ab = require('arraybuffer-to-string')
var fix = require('./fixture')
var clipFix = [
  0,255,255,255,     255,255,255,255,
  255,255,255,255,   255,255,255,255
]
clipFix.width = 2
clipFix.height = 2
var pngFix = draw(fix).toDataURL('image/png')
var jpgFix = draw(fix).toDataURL('image/jpeg')

async function testSource(arg) {
  // async call
  let data = await read(arg)

  assert.deepEqual(data, fix)
  assert.equal(data.width, fix.width)
  assert.equal(data.height, fix.height)

  let clip = await read(arg, {x: 1, y: 1, h: 2, w: 2})

  assert.deepEqual(clip, clipFix)
  assert.equal(clip.width, 2)
  assert.equal(clip.height, 2)

  return new Promise((y, n) => {
    // callback style call
    read(arg, (err, data) => {
      if(err) {
        n(err)
      } else {
        assert.deepEqual(data, fix)
        assert.equal(data.width, fix.width)
        assert.equal(data.height, fix.height)
        y()
      }
    })
  })
}


// strings
t('absolute path', t => {
  testSource(path.resolve('./test/test_pattern.png'))
  t.end()
})
t('relative path', t => {
  testSource('./test/test_pattern.png')
  t.end()
})
t('some path', t => {
  testSource('test/test_pattern.png')
  t.end()
})
// t('https', t => {
//   testSource('https://raw.githubusercontent.com/dy/get-pixel-data/master/test/test_pattern.png')
//   t.end()
// })
// t('http', t => {
//   testSource('http://raw.githubusercontent.com/dy/get-pixel-data/master/test/test_pattern.png')
//   t.end()
// })
// t('default URL', t => {
//   testSource('//raw.githubusercontent.com/dy/get-pixel-data/master/test/test_pattern.png')
//   t.end()
// })
// t('data URL', t => {
//   testSource(pngFix)
//   testSource(jpgFix)
//   t.end()
// })
// t('base64', t => {
//   // raw
//   testSource(s2ab(fix, 'base64'))

//   // encoded
//   testSource(pngFix.replace(/^data:image\/(png|jpg);base64,/, '')

//   t.end()
// })
// t('bad string', t => {
//   t.throws(() => {
//     read('123ccc')
//   })
//   t.throws(() => {
//     read('$$$')
//   })
//   t.end()
// })

// // DOMs
// t(`<img>`)
// t(`<image>`)
// t(`<video>`)
// t(`<canvas>`)
// t(`HTMLImageElement`)
// t(`SVGImageElement`)
// t(`HTMLVideoElement`)
// t(`Image`)
// t(`ImageData`)
// t(`ImageBitmap`)
// t(`File`)
// t(`Blob`)
// t(`MediaSource`)
// t(`Canvas`)
// t(`OffscreenCanvas`)
// t(`Context2D`)
// t(`WebGLContext`)

// // buffers
// t(`Buffer`)
// t(`ArrayBuffer`)
// t(`ArrayBufferView`)
// t(`Uint8Array`)
// t(`Uint8ClampedArray`)
// t(`Float32Array`)
// t(`Float64Array`)
// t(`Array`)
// t(`Array of arrays`)

// // decode
// t('png')
// t('jpg')
// t('gif')
// t('bmp')

// // others
// t(`ndarray`)
// t('regl')
// t('gl- components')
// t('null')


// t('cache')
// t('dict')
// t('array')


// // get-pixels cases
// t('get-pixels', function(t) {
//   read('test/lena.png', function(err, pixels) {
//     if(err) {
//       t.assert(false)
//     } else {
//       t.equals(pixels.shape.join(','), '512,512,4')
//     }
//     t.end()
//   })
// })

// t('get-pixels-png', function(t) {
//   read('test/test_pattern.png', function(err, pixels) {
//     if(err) {
//       t.error(err, 'failed to parse png')
//       t.end()
//       return
//     }
//     test_image(t, pixels)
//     t.end()
//   })
// })

// /*
// t('get-pixels-ppm', function(t) {
//   read(path.join(__dirname, 'test_pattern.ppm'), function(err, pixels) {
//     if(err) {
//       t.error(err, 'failed to parse ppm')
//       t.end()
//       return
//     }
//     test_image(t, pixels)
//     t.end()
//   })
// })
// */

// t('get-pixels-jpg', function(t) {
//   read('test/test_pattern.jpg', function(err, pixels) {
//     if(err) {
//       t.error(err, 'failed to parse jpg')
//       t.end()
//       return
//     }
//     test_image(t, pixels, 4)
//     t.end()
//   })
// })

// t('get-pixels-gif', function(t) {
//   read('test/test_pattern.gif', function(err, pixels) {
//     if(err) {
//       t.error(err, 'failed to parse gif')
//       t.end()
//       return
//     }
//     test_image(t, pixels.pick(0))
//     t.end()
//   })
// })

// /*
// t('get-pixels-bmp', function(t) {
//   read(path.join(__dirname, 'test_pattern.bmp'), function(err, pixels) {
//     if(err) {
//       t.error(err, 'failed to parse bmp')
//       t.end()
//       return
//     }
//     test_image(t, pixels)
//     t.end()
//   })
// })
// */

// t('data url', function(t) {
//   var url = 'data:image/gif;base64,R0lGODlhEAAQAMQAAORHHOVSKudfOulrSOp3WOyDZu6QdvCchPGolfO0o/XBs/fNwfjZ0frl3/zy7////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAkAABAALAAAAAAQABAAAAVVICSOZGlCQAosJ6mu7fiyZeKqNKToQGDsM8hBADgUXoGAiqhSvp5QAnQKGIgUhwFUYLCVDFCrKUE1lBavAViFIDlTImbKC5Gm2hB0SlBCBMQiB0UjIQA7'
//   read(url, function(err, data) {
//     if(err) {
//       console.log(err)
//       t.error('failed to read data url')
//       t.end()
//       return
//     }
//     t.ok(true, 'data url opened without crashing')
//     t.end()
//   })
// })

// t('get-pixels-buffer', function(t) {
//   var buffer = fs.readFileSync(__dirname + '/test_pattern.png')
//   read(buffer, 'image/png', function(err, pixels) {
//     if(err) {
//       t.error(err, 'failed to parse buffer')
//       t.end()
//       return
//     }
//     test_image(t, pixels)
//     t.end()
//   })
// })

// t('get-url png img', function(t) {
//   var url = 'https://raw.githubusercontent.com/scijs/get-pixels/master/test/test_pattern.png';
//   read(url, function(err, pixels){
//     if(err) {
//       console.log('Error:', err);
//       t.error(err, 'failed to read web image data');
//       t.end();
//       return;
//     }
//     test_image(t, pixels);
//     t.end();
//   });
// });

// t('get-url jpg img', function(t) {
//   var url = 'https://raw.githubusercontent.com/scijs/get-pixels/master/test/test_pattern.jpg';
//   read(url, function(err, pixels){
//     if(err) {
//       console.log('Error:', err);
//       t.error(err, 'failed to read web image data');
//       t.end();
//       return;
//     }
//     test_image(t, pixels);
//     t.end();
//   });
// });

// t('get-url gif img', function(t) {
//   var url = 'https://raw.githubusercontent.com/scijs/get-pixels/master/test/test_pattern.gif';
//   read(url, function(err, pixels){
//     if(err) {
//       console.log('Error:', err);
//       t.error(err, 'failed to read web image data');
//       t.end();
//       return;
//     }
//     test_image(t, pixels.pick(0));
//     t.end();
//   });
// });


//draw buffer on the canvas
function draw(px) {
    var canvas = document.createElement('canvas')
    canvas.width = px.width
    canvas.height = px.height
    var context = canvas.getContext('2d')
    var idata = context.createImageData(canvas.width, canvas.height)
    for (var i = 0; i < px.length; i++) {
      idata.data[i] = px[i]
    }
    context.putImageData(idata, 0, 0)
    return canvas
}
