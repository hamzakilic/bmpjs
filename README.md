# bmpjs
pure javascript decoding all bmp files nodejs library,
converted from c library http://www.netsurf-browser.org/projects/libnsbmp/

#install
npm install bmpjs --save

#build
npm install
npm build

#test
npm test

#usage

var bmp=require('bmpjs');
var fs=require('fs');
fs.readFile('filename', (err, data) => {            
            try{
            
            let img= bmp.decode(data.buffer); 
            //if decoding fails, throws a DecodeError;          
            //otherwise returns an RGBA image object
            console.log(img.width);
            console.log(img.height);
            console.log(img.pixels);
            for(var y=0;y<img.height;++y)
            for(var x=0;x<img.width;++x){
                var pixelPos=y*img.width*4+x*4;
                img.pixels[pixelPos]=10;//set R
                img.pixels[pixelPos+1]=10;//set G
                img.pixels[pixelPos+2]=10;//set B
                img.pixels[pixelPos+3]=10;//set A
            }
            
            }catch(ex){
                console.log(ex.errNumber);
                console.log(ex.msg);
            }

        });




