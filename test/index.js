'use strict'

var t = require('tape')
var fs = require('fs')
var path = require('path')
var getPixels = require('../')
var match = require('pixelmatch')
var assert = require('assert')
var s2ab = require('arraybuffer-to-string')
var fixture = require('./fixture')
var clipFix = {
  data: [
    0,255,255,255,     255,255,255,255,
    255,255,255,255,   255,255,255,255
  ],
  width: 2,
  height: 2
}
var pngFixData = drawToCanvas(fixture).toDataURL('image/png')
var jpgFixData = drawToCanvas(fixture).toDataURL('image/jpeg', 1)

const ASSERT_N = 10

async function testSource(assert, arg, o, fix=fixture) {
  // direct
  let to = setTimeout(function () {assert.fail('Direct timeout')}, 1000)
  let data = await getPixels(arg, o)
  clearTimeout(to)

  assert.equal(data.width, fix.width)
  assert.equal(data.height, fix.height)
  fix.data ?
  assert.equal(match(data.data, fix.data, null, fix.width, fix.height, {threshold: .004}), 0, 'Ok async pixels') :
  assert.ok(data.data[0], 'Ok async pixels')

  // second time (cache)
  to = setTimeout(function () {assert.fail('Direct second timeout')}, 1000)
  let data2 = await getPixels(arg, o)
  clearTimeout(to)
  assert.deepEqual(data.data, data2.data)
  assert.equal(data2.width, fix.width)
  assert.equal(data2.height, fix.height)
  fix.data ? assert.equal(match(data2.data, fix.data, null, fix.width, fix.height, {threshold: .004}), 0, 'Ok async pixels twice') :
  assert.ok(data2.data[0], 'Ok async pixels twice')

  // clip
  to = setTimeout(function () {assert.fail('Clip timeout')}, 1000)
  let clip = await getPixels(arg, {clip: [1,1,3,3] })
  clearTimeout(to)

  assert.equal(clip.width, 2)
  assert.equal(clip.height, 2)
  fix.data ?
  assert.equal(match(clip.data, clipFix.data, null, 2, 2, {threshold: 0}), 0, 'Ok clip pixels') :
  assert.ok(clip.data[0], 'Ok clip pixels')
}


// strings
t('absolute path', async t => {
  t.plan(ASSERT_N)
  await testSource(t, path.resolve('./test/test_pattern.png'))
  t.end()
})
t('relative path', async t => {
  t.plan(ASSERT_N)
  await testSource(t, './test/test_pattern.png')
  t.end()
})
t('some path', async t => {
  t.plan(ASSERT_N)
  await testSource(t, 'test/test_pattern.png')
  t.end()
})
t('not existing path')
// t('https', t => {
//   await testSource(t, 'https://raw.githubusercontent.com/dy/get-pixel-data/master/test/test_pattern.png')
//   t.end()
// })
// t('http', t => {
//   await testSource(t, 'http://raw.githubusercontent.com/dy/get-pixel-data/master/test/test_pattern.png')
//   t.end()
// })
// t('default URL', t => {
//   await testSource(t, '//raw.githubusercontent.com/dy/get-pixel-data/master/test/test_pattern.png')
//   t.end()
// })
t('not existing url')
t('not an image url')
t('data URL', async t => {
  t.plan(2 * ASSERT_N)
  await testSource(t, pngFixData)
  await testSource(t, jpgFixData)
  t.end()
})
t('base64', async t => {
  t.plan(ASSERT_N)
  await testSource(t, pngFixData.replace(/^data:image\/(png|jpg);base64,/, ''))
  t.end()
})

t.skip('bad string', async t => {
  t.plan(ASSERT_N)
  getPixels('$$$').catch(e => t.ok(e))
  // t.throws(() => {
  //   getPixels('$$$')
  // })
})

// DOMs
t(`<img>`, async t => {
  t.plan(ASSERT_N)
  let img = document.createElement('img')
  img.src = './test/test_pattern.png'
  await testSource(t, img)
  t.end()
})
t(`<image>`, async t => {
  t.plan(ASSERT_N)
  let el = document.createElement('div')
  el.innerHTML = `<svg width="200" height="200"
  xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><image xlink:href="./test/test_pattern.png"/>
  </svg>
  `
  let img = el.firstChild.firstChild
  await testSource(t, img)
  t.end()
})
t(`<video>`, async t => {
  t.plan(ASSERT_N)
  let el = document.createElement('div')
  document.body.appendChild(el)
  el.innerHTML = `<video src="./test/stream_of_water.webm"></video>`

  await testSource(t, el.firstChild, null, {
    width: 480, height: 360
  })

  t.end()
})
t.skip('<picture>', async t => {
  t.plan(ASSERT_N)
  let el = document.createElement('div')
  el.innerHTML = `<picture>
    <source srcset="/media/cc0-images/Wave_and_Surfer--240x200.jpg"
            media="(min-width: 800px)">
    <img src="/media/cc0-images/Painted_Hand--298x332.jpg">
  </picture>`
  await testSource(t, el.firstChild)
  t.end()
})
t(`Image`, async t => {
  t.plan(ASSERT_N)
  let img = new Image
  img.src = './test/test_pattern.png'
  await testSource(t, img)
  t.end()
})
t(`ImageData`, async t => {
  t.plan(ASSERT_N)
  var context = document.createElement('canvas').getContext('2d')
  var idata = context.createImageData(fixture.width, fixture.height)
  for (var i = 0; i < fixture.data.length; i++) {
    idata.data[i] = fixture.data[i]
  }
  // context.canvas.width = fixture.width
  // context.canvas.height = fixture.height
  // context.putImageData(idata, 0, 0)

  await testSource(t, idata)
  t.end()
})
t.skip(`ImageBitmap`, async t => {

})
// t(`File`)
// t(`Blob`)
// t(`MediaSource`)
// t(`Canvas`)
// t(`OffscreenCanvas`)
t(`Context2D`, async t => {
  t.plan(ASSERT_N)
  var canvas = drawToCanvas(fixture)
  await testSource(t, canvas.getContext('2d'))
  t.end()
})
t(`Canvas`, async t => {
  t.plan(ASSERT_N)
  var canvas = drawToCanvas(fixture)
  await testSource(t, canvas)
  t.end()
})
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
// t(`options direct`)
// t(`ndarray`)
// t('regl')
// t('gl- components')
// t('null')

// t('multiple sources')

// // get-pixels cases
// t('get-pixels', function(t) {
//   getPixels('test/lena.png', function(err, pixels) {
//     if(err) {
//       t.assert(false)
//     } else {
//       t.equals(pixels.shape.join(','), '512,512,4')
//     }
//     t.end()
//   })
// })

// t('get-pixels-png', function(t) {
//   getPixels('test/test_pattern.png', function(err, pixels) {
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
//   getPixels(path.join(__dirname, 'test_pattern.ppm'), function(err, pixels) {
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
//   getPixels('test/test_pattern.jpg', function(err, pixels) {
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
//   getPixels('test/test_pattern.gif', function(err, pixels) {
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
//   getPixels(path.join(__dirname, 'test_pattern.bmp'), function(err, pixels) {
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
//   getPixels(url, function(err, data) {
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
//   getPixels(buffer, 'image/png', function(err, pixels) {
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
//   getPixels(url, function(err, pixels){
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
//   getPixels(url, function(err, pixels){
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
//   getPixels(url, function(err, pixels){
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
function drawToCanvas({data, width, height}) {
    var canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    var context = canvas.getContext('2d')
    var idata = context.createImageData(canvas.width, canvas.height)
    for (var i = 0; i < data.length; i++) {
      idata.data[i] = data[i]
    }
    context.putImageData(idata, 0, 0)
    return canvas
}
