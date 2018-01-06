var chai = require('chai');
var assert = chai.assert; // we are using the "assert" style of Chai
var expect = chai.expect;
var image = require('../build/imageRGBA').ImageRGBA;
var errors = require('../build/errors').Errors;



describe('image', function () {
  it('constructor must be valid', function () {
    var img = new image(5, 10);    
    expect(img.width).to.equal(5);
    expect(img.height).to.equal(10);

  });
   it('constructor must throw exception', function () {  
     var func=()=> new image(-2,10);
    expect(func).to.throw();
  });

  it('pixel buffer must be equal', function () {
    var img = new image(10, 10);    
    expect(img.pixels.length).to.equal(400);
  })

  it('pixel buffer must be the same as input buffer', function () {
    var buffer = new Uint8ClampedArray(400);
    buffer[10] = 11;
    var img = new image(10, 10, buffer);
    expect(img.pixels.length).to.equal(400);
    expect(img.pixels[10]).to.equal(11);
    expect(img.pixels[11]).to.equal(0);
  });

  it('smaller pixel buffer must set error', function () {
    var buffer = new Uint8ClampedArray(200);
    buffer[10] = 11;
    var func=()=> new image(10, 10, buffer);
    expect(func).to.throw(errors.imageDataIsNotValid);

  });
  

  it('without pixel data must be set all 255,255,255,255', function () {
    
    var img = new image(10, 10);
    for(i=0;i<img.width*img.height*4;++i)
    expect(img.pixels[i]).to.equal(255);

  }); 

  

});