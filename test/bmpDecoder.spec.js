const chai = require('chai');
const assert = chai.assert; // we are using the "assert" style of Chai
const expect = chai.expect;


const image = require('../build/imageRGBA').ImageRGBA;
const errors = require('../build/errors').Errors;
const bmpDecoder = require('../build/bmpDecoder').BmpDecoder;

const fs = require('fs');




function rawAndimgEqual(raw, img) {
    if (raw.length < img.width * img.height * 4)
        throw 'data lenght problem';
    let newLineCount = 0;

    for (let h = 0; h < img.height; ++h)
        for (let w = 0; w < img.width; ++w) {

            let pos = h * img.width * 4 + w * 4;

            if (img.pixels[pos] != raw[pos])
                return false;
            if (img.pixels[pos + 1] != raw[pos + 1])
                return false;
            if (img.pixels[pos + 2] != raw[pos + 2])
                return false;
            if (img.pixels[pos + 3] != raw[pos + 3])
                return false;



        }

    return true;
}

describe('bmpDecoder', function (done) {

    function error(data) {
        throw data;
    }

    function compare(fileNameBmp, fileNameRaw, done) {

        //read bmp file
        fs.readFile(fileNameBmp, (err, data) => {
            //on error throw err
            if (err) throw err;

            let dec = new bmpDecoder();
            let img= dec.decode(data.buffer);          
            
                //read raw data for validation

                fs.readFile(fileNameRaw, (err2, data2) => {
                    if (err2) throw err2;
                    expect(rawAndimgEqual(data2, img)).to.equal(true);

                    done();
                })           
            

            


        })
    }


    it('rgb32 must be valid', function (done) {

        compare('./test/testData/bmpsuite-2.5/g/rgb32.bmp', './test/testData/bmpsuite-2.5/g/rgb32.raw', done);

    }).timeout(2000);



   it('rgb32bf must be valid', function (done) {

        compare('./test/testData/bmpsuite-2.5/g/rgb32bf.bmp', './test/testData/bmpsuite-2.5/g/rgb32bf.raw', done);

    }).timeout(2000);

    it('rgb32bfdef must be valid', function (done) {

        compare('./test/testData/bmpsuite-2.5/g/rgb32bfdef.bmp', './test/testData/bmpsuite-2.5/g/rgb32bfdef.raw', done);



    }).timeout(2000);

    it('rgb24 must be valid', function (done) {
        compare('./test/testData/bmpsuite-2.5/g/rgb24.bmp', './test/testData/bmpsuite-2.5/g/rgb24.raw', done);

    }).timeout(2000);

     it('rgb24pal must be valid', function (done) {
        compare('./test/testData/bmpsuite-2.5/g/rgb24pal.bmp', './test/testData/bmpsuite-2.5/g/rgb24pal.raw', done);

    }).timeout(2000);

    it('rgb16 must be valid', function (done) {
        compare('./test/testData/bmpsuite-2.5/g/rgb16.bmp', './test/testData/bmpsuite-2.5/g/rgb16.raw', done);

    }).timeout(2000);
     it('rgb16-565pal must be valid', function (done) {
        compare('./test/testData/bmpsuite-2.5/g/rgb16-565pal.bmp', './test/testData/bmpsuite-2.5/g/rgb16-565pal.raw', done);

    }).timeout(2000);
     it('rgb16bfdef must be valid', function (done) {
        compare('./test/testData/bmpsuite-2.5/g/rgb16bfdef.bmp', './test/testData/bmpsuite-2.5/g/rgb16bfdef.raw', done);

    }).timeout(2000);
    it('rgb16-565 must be valid', function (done) {
        compare('./test/testData/bmpsuite-2.5/g/rgb16-565.bmp', './test/testData/bmpsuite-2.5/g/rgb16-565.raw', done);

    }).timeout(2000);

     it('pal8 must be valid', function (done) {
        compare('./test/testData/bmpsuite-2.5/g/pal8.bmp', './test/testData/bmpsuite-2.5/g/pal8.raw', done);

    }).timeout(2000);

     it('pal8-0 must be valid', function (done) {
        compare('./test/testData/bmpsuite-2.5/g/pal8-0.bmp', './test/testData/bmpsuite-2.5/g/pal8-0.raw', done);

    }).timeout(2000);

     it('pal8gs must be valid', function (done) {
        compare('./test/testData/bmpsuite-2.5/g/pal8gs.bmp', './test/testData/bmpsuite-2.5/g/pal8gs.raw', done);

    }).timeout(2000);

     it('pal8nonsquare must be valid', function (done) {
        compare('./test/testData/bmpsuite-2.5/g/pal8nonsquare.bmp', './test/testData/bmpsuite-2.5/g/pal8nonsquare.raw', done);

    }).timeout(2000);

    it('pal8os2 must be valid', function (done) {
        compare('./test/testData/bmpsuite-2.5/g/pal8os2.bmp', './test/testData/bmpsuite-2.5/g/pal8os2.raw', done);

    }).timeout(2000);


    it('pal8topdown must be valid', function (done) {
        compare('./test/testData/bmpsuite-2.5/g/pal8topdown.bmp', './test/testData/bmpsuite-2.5/g/pal8topdown.raw', done);

    }).timeout(2000);

     it('pal8v4 must be valid', function (done) {
        compare('./test/testData/bmpsuite-2.5/g/pal8v4.bmp', './test/testData/bmpsuite-2.5/g/pal8v4.raw', done);

    }).timeout(2000);

  it('pal8v5 must be valid', function (done) {
        compare('./test/testData/bmpsuite-2.5/g/pal8v5.bmp', './test/testData/bmpsuite-2.5/g/pal8v5.raw', done);

    }).timeout(2000);

     it('pal8w124 must be valid', function (done) {
        compare('./test/testData/bmpsuite-2.5/g/pal8w124.bmp', './test/testData/bmpsuite-2.5/g/pal8w124.raw', done);

    }).timeout(2000);

    it('pal8w125 must be valid', function (done) {
        compare('./test/testData/bmpsuite-2.5/g/pal8w125.bmp', './test/testData/bmpsuite-2.5/g/pal8w125.raw', done);

    }).timeout(2000);

    it('pal8w126 must be valid', function (done) {
        compare('./test/testData/bmpsuite-2.5/g/pal8w126.bmp', './test/testData/bmpsuite-2.5/g/pal8w126.raw', done);

    }).timeout(2000);






    it('pal4rle must be valid', function (done) {
        compare('./test/testData/bmpsuite-2.5/g/pal4rle.bmp', './test/testData/bmpsuite-2.5/g/pal4rle.raw', done);

    }).timeout(2000);

     it('pal4gs must be valid', function (done) {
        compare('./test/testData/bmpsuite-2.5/g/pal4gs.bmp', './test/testData/bmpsuite-2.5/g/pal4gs.raw', done);

    }).timeout(2000);

     it('pal4 must be valid', function (done) {
        compare('./test/testData/bmpsuite-2.5/g/pal4.bmp', './test/testData/bmpsuite-2.5/g/pal4.raw', done);

    }).timeout(2000);
     it('pal1bw must be valid', function (done) {
        compare('./test/testData/bmpsuite-2.5/g/pal1wb.bmp', './test/testData/bmpsuite-2.5/g/pal1wb.raw', done);

    }).timeout(2000);

     it('pal1bg must be valid', function (done) {
        compare('./test/testData/bmpsuite-2.5/g/pal1bg.bmp', './test/testData/bmpsuite-2.5/g/pal1bg.raw', done);

    }).timeout(2000);

     it('pal1 must be valid', function (done) {
        compare('./test/testData/bmpsuite-2.5/g/pal1.bmp', './test/testData/bmpsuite-2.5/g/pal1.raw', done);

    }).timeout(2000);

    



});