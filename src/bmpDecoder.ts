import { ImageRGBA } from './imageRGBA';

import { Errors,DecodeError } from "./errors";
import { Limits } from "./limits";





/******* this code is converted from  */
/****** http://www.netsurf-browser.org/projects/libnsbmp/ */

/* bmp flags */
var BMP_NEW = 0;
/** image is opaque (as opposed to having an alpha mask) */
var BMP_OPAQUE = (1 << 0);
/** memory should be wiped */
var BMP_CLEAR_MEMORY = (1 << 1);


class BmpResult {
    static readonly BMP_OK = 0;
    static readonly BMP_INSUFFICIENT_MEMORY = 1;
    static readonly BMP_INSUFFICIENT_DATA = 2;
    static readonly BMP_DATA_ERROR = 3;
}

class BmpEncoding {
    static readonly RGB = 0;
    static readonly RLE8 = 1;
    static readonly RLE4 = 2;
    static readonly BITFIELDS = 3;
}

export class BmpDecoder{
    private _bytes:Uint8ClampedArray;
    
    public decode(buffer:ArrayBuffer):ImageRGBA{
        this._bytes=new Uint8ClampedArray(buffer);    
        return this.startDecoding();
    }
       /////decoding bmp functions
    private startDecoding(): ImageRGBA {
        
        let byteData =this._bytes;
        let header = this.bmpFileHeaderParse(byteData);            
        this.bmpInfoHeaderParse(byteData, header);         
        
        let img = this.bmpDecode(byteData, header);
        
            
        
        return img;



    }





    private readonly BMP_FILE_HEADER_SIZE = 14;

    private bmpFileHeaderParse(data: Uint8ClampedArray): bmpHeader {
        /* standard 14-byte BMP file header is:
        *
        *   +0    UINT16   File Type ('BM')
        *   +2    UINT32   Size of File (in bytes)
        *   +6    INT16    Reserved Field (1)
        *   +8    INT16    Reserved Field (2)
        *   +10   UINT32   Starting Position of Image Data (offset in bytes)
        */

        /* must be at least enough data for a core header */
        if (data.length < this.BMP_FILE_HEADER_SIZE) {
            throw Errors.bmpDataIsNotValid;
            
        }
        if (data[0] != 0x42 || data[1] != 0x4D) {
            throw Errors.bmpDataIsNotValid;
            
        }
        let offset = new DataView(data.buffer, 10).getUint32(0, true);
        if (offset >= data.length) {
            throw Errors.bmpDataIsNotValid;
            
        }
        let header = new bmpHeader();
        header.offset = offset;
        return header;


    }

    private readonly BITMAPCOREHEADER = 12;

    private bmpInfoHeaderParse(data: Uint8ClampedArray, header: bmpHeader): void {

        if (data.length < (this.BMP_FILE_HEADER_SIZE + this.BITMAPCOREHEADER)) {
            throw Errors.bmpDataIsNotValid;
            
        }
        let view = new DataView(data.buffer, this.BMP_FILE_HEADER_SIZE);
        let header_size = view.getUint32(0, true);
        /* ensure there is enough data for the declared header size*/
        if (data.length - this.BMP_FILE_HEADER_SIZE < header_size) {
            throw Errors.bmpDataIsNotValid;
            
        }

        /* a variety of different bitmap headers can follow, depending
         * on the BMP variant. The header length field determines the type.
         */
        if (header_size == this.BITMAPCOREHEADER) {
            /* the following header is for os/2 and windows 2.x and consists of:
             *
             *	+0	UINT32	size of this header (in bytes)
             *	+4	INT16	image width (in pixels)
             *	+6	INT16	image height (in pixels)
             *	+8	UINT16	number of colour planes (always 1)
             *	+10	UINT16	number of bits per pixel
             */
            header.width = view.getInt16(4, true);
            header.height = view.getInt16(6, true);
            if ((header.width <= 0) || (header.height == 0)) {
                throw Errors.bmpDataIsNotValid;
                
            }
            if (header.height < 0) {
                header.height = -header.height;
                header.reversed = true;
            }

            if (view.getUint16(8, true) != 1) {
                throw Errors.bmpDataIsNotValid;
                
            }
            header.bpp = view.getUint16(10, true);

            if (header.bpp != 1 && header.bpp != 4 && header.bpp != 8 && header.bpp != 16 && header.bpp != 24 && header.bpp != 32) {
                throw Errors.bmpDataIsNotValid;
                
            }
            header.colours = 1 << header.bpp;
            header.paletteSize = 3;



        } else if (header_size < 40) {

            throw Errors.bmpDataIsNotValid;
            

        } else {

            header.width = view.getInt32(4, true);
            header.height = view.getInt32(8, true);
            if ((header.width <= 0) || (header.height == 0)) {
                throw Errors.bmpDataIsNotValid;
                
            }
            if (header.height < 0) {
                header.reversed = true;
                if (header.height <= Limits.int32_MIN) {
                    header.height = Limits.int32_MAX;
                } else {
                    header.height = -header.height;
                }
            }

            if (view.getUint16(12, true) != 1) {
                throw Errors.bmpDataIsNotValid;
                
            }

            header.bpp = view.getUint16(14, true);
            if (header.bpp == 0)
                header.bpp = 8;
            header.encoding = view.getUint32(16, true);

            /**
            * The bpp value should be in the range 1-32, but the only
            * values considered legal are:
            * RGB ENCODING: 1, 4, 8, 16, 24 and 32
            * RLE4 ENCODING: 4
            * RLE8 ENCODING: 8
            * BITFIELD ENCODING: 16 and 32
            */
            switch (header.encoding) {
                case BmpEncoding.RGB:
                    if ((header.bpp != 1) && (header.bpp != 4) &&
                        (header.bpp != 8) &&
                        (header.bpp != 16) &&
                        (header.bpp != 24) &&
                        (header.bpp != 32)) {
                        throw Errors.bmpDataIsNotValid;
                        
                    }
                    break;
                case BmpEncoding.RLE8:
                    if (header.bpp != 8) {
                        throw Errors.bmpDataIsNotValid;
                        
                    }
                    break;
                case BmpEncoding.RLE4:
                    if (header.bpp != 4) {
                        throw Errors.bmpDataIsNotValid;
                        
                    }
                    break;
                case BmpEncoding.BITFIELDS:
                    if ((header.bpp != 16) && (header.bpp != 32)) {
                        throw Errors.bmpDataIsNotValid;
                        
                    }
                    break;
                /* invalid encoding */
                default:
                    throw Errors.bmpDataIsNotValid;
                    

            }




            /* Bitfield encoding means we have red, green, blue, and alpha masks.
                * Here we acquire the masks and determine the required bit shift to
                * align them in our 24-bit color 8-bit alpha format.
                */
            if (header.encoding == BmpEncoding.BITFIELDS) {
                if (header_size == 40) {
                    header_size += 12;
                    if (data.length < (14 + header_size)) {
                        throw Errors.bmpDataIsNotValid;
                        
                    }
                    for (let i = 0; i < 3; i++) {
                        header.mask[i] = view.getUint32(40 + (i << 2), true);
                    }
                } else {
                    for (let i = 0; i < 4; i++)
                        header.mask[i] = view.getUint32(40 + (i << 2), true);
                }
                for (let i = 0; i < 4; i++) {
                    if (header.mask[i] == 0)
                        break;
                    for (let j = 31; j > 0; j--)
                        if (header.mask[i] & (1 << j)) {
                            if ((j - 7) > 0)
                                header.mask[i] &= 0xff << (j - 7);
                            else
                                header.mask[i] &= 0xff >>> (-(j - 7));
                            header.shift[i] = (i << 3) - (j - 7);
                            break;
                        }
                }
            }
            header.colours = view.getUint32(32, true);
            if (header.colours == 0)
                header.colours = 1 << header.bpp;

            header.paletteSize = 4;
        }
        let newView = new DataView(data.buffer, this.BMP_FILE_HEADER_SIZE + header_size);
        if (header.mask[3] == 0)
            header.opaque = true;

        if (header.bpp < 16) {
            /* we now have a series of palette entries of the format:
             *
             *	+0	BYTE	blue
             *	+1	BYTE	green
             *	+2	BYTE	red
             *
             * if the palette is from an OS/2 or Win2.x file then the entries
             * are padded with an extra byte.
             */

            /* boundary checking */
            if (data.length < (14 + header_size + (4 * header.colours))) {
                throw Errors.bmpDataIsNotValid;
                
            }
            header.colourTable = [header.colours];
            let pOff = 0;
            for (let i = 0; i < header.colours; i++) {
                header.colourTable[i] = newView.getUint8(2 + pOff) | (newView.getUint8(1 + pOff) << 8) | (newView.getUint8(0 + pOff) << 16);
                if (header.opaque)
                    header.colourTable[i] |= (0xff << 24);
                pOff += header.paletteSize;

                //header.colourTable[i] =  read_uint32(colourTable[i],0);
            }



        }


    }

    private bmpDecode(data: Uint8ClampedArray, header: bmpHeader): ImageRGBA {



        switch (header.encoding) {
            case BmpEncoding.RGB:
                switch (header.bpp) {
                    case 32:
                        return this.bmpDecode_rgb32(data, header);

                    case 24:
                        return this.bmpDecode_rgb24(data, header);


                    case 16:
                        return this.bmpDecode_rgb16(data, header);


                    default:
                        return this.bmpDecode_rgb(data, header);

                }
            case BmpEncoding.RLE8:
                return this.bmpDecode_rle8(data, header);
            case BmpEncoding.RLE4:
                return this.bmpDecode_rle4(data, header);

            case BmpEncoding.BITFIELDS:
                switch (header.bpp) {
                    case 32:
                        return this.bmpDecode_rgb32(data, header);


                    case 16:
                        return this.bmpDecode_rgb16(data, header);
                    default:
                        throw Errors.bmpDataIsNotValid;
                        


                }
            default:
                {
                    throw Errors.bmpDataIsNotValid;
                    
                }
        }

        
    }



    ///decode rgb32
    private bmpDecode_rgb32(data: Uint8ClampedArray, header: bmpHeader): ImageRGBA {

        let img = new ImageRGBA(header.width, header.height);
        let dataView = new DataView(data.buffer, header.offset);

        let end = dataView.byteLength;
        let swidth = header.bpp / 8 * header.width;
        if (header.limitedTransparent) {
            if ((4) > end) {
                throw Errors.bmpDataIsNotValid;
                
            }
            if (header.encoding == BmpEncoding.BITFIELDS)
                header.transparentIndex = dataView.getUint32(0, true);
            else
                header.transparentIndex = dataView.getUint8(2) | (dataView.getUint8(1) << 8) | (dataView.getUint8(0) << 16);

        }

        if ((swidth * header.height) > end) {
            throw Errors.bmpDataIsNotValid;
            
        }

        let dataPos = 0;
        for (let y = 0; y < header.height; ++y) {


            let pos = header.reversed ? (y * swidth) : (end - (y * swidth) - swidth);

            if (header.encoding == BmpEncoding.BITFIELDS) {
                for (let x = 0; x < header.width; x++) {
                    let word = dataView.getUint32(dataPos, true); //read_uint32(data, 0);
                    let val = 0;
                    for (let i = 0; i < 4; i++)
                        if (header.shift[i] > 0)
                            val |= (word & header.mask[i]) << header.shift[i];
                        else
                            val |= (word & header.mask[i]) >>> (-header.shift[i]);
                    /* 32-bit BMPs have alpha masks, but sometimes they're not utilized */
                    if (header.opaque)
                        val |= (0xff << 24);
                    dataPos += 4;
                    img.pixelsView.setUint32(pos + x * 4, val, true);

                }
            } else {
                for (let x = 0; x < header.width; x++) {

                    let word = dataView.getUint8(dataPos + 2) | (dataView.getUint8(dataPos + 1) << 8) | (dataView.getUint8(dataPos + 0) << 16);
                    if ((header.limitedTransparent) && (word == header.transparentIndex)) {
                        word = header.transparentColour;
                    }
                    if (header.opaque) {
                        word |= ((0xff << 24));
                    } else {
                        word |= (data[3] << 24);
                    }
                    dataPos += 4;

                    img.pixelsView.setUint32(pos + x * 4, word, true);



                }

            }




        }
        return img;

    }


    ///decode rgb24
    private bmpDecode_rgb24(data: Uint8ClampedArray, header: bmpHeader): ImageRGBA {

        let img = new ImageRGBA(header.width, header.height);
        let dataView = new DataView(data.buffer, header.offset);

        let end = dataView.byteLength;
        let swidth = header.bpp / 8 * header.width;
        let swidth32 = header.width * 4;
        if (header.limitedTransparent) {
            if ((3) > end) {
                throw Errors.bmpDataIsNotValid;
                
            }
            header.transparentIndex = dataView.getUint8(2) | (dataView.getUint8(1) << 8) | (dataView.getUint8(0) << 16);

        }

        let dataPos = 0;

        for (let y = 0; y < header.height; ++y) {
            if (dataPos + swidth > end) {
                throw Errors.bmpDataIsNotValid;
                
            }

            let pos = header.reversed ? (y * swidth32) : ((header.height * swidth32) - (y * swidth32) - swidth32);

            for (let x = 0; x < header.width; x++) {

                let word = dataView.getUint8(dataPos + 2) | (dataView.getUint8(dataPos + 1) << 8) | (dataView.getUint8(dataPos + 0) << 16);

                if ((header.limitedTransparent) && (word == header.transparentIndex))
                    word = header.transparentColour;
                else
                    word |= (0xff << 24);

                dataPos += 3;

                img.pixelsView.setUint32(pos + x * 4, word, true);
            }
            //skip extra bytes
            //dataPos += (header.width % 4);
            while ((dataPos & 3) != 0)
                dataPos += 1;
        }
        return img;

    }


    private bmpDecode_rgb16(data: Uint8ClampedArray, header: bmpHeader): ImageRGBA {

        let img = new ImageRGBA(header.width, header.height);
        let dataView = new DataView(data.buffer, header.offset);

        let end = dataView.byteLength;
        let swidth = header.bpp / 8 * header.width;
        let swidth32 = header.width * 4;
        if (header.limitedTransparent) {
            if ((2) > end) {
                throw Errors.bmpDataIsNotValid;
                
            }

            header.transparentIndex = dataView.getUint32(0, true);

        }

        if ((swidth * header.height) > end) {
            throw Errors.bmpDataIsNotValid;
            
        }

        let dataPos = 0;
        for (let y = 0; y < header.height; ++y) {
            if (dataPos + swidth >= end) {
                throw Errors.bmpDataIsNotValid;
                
            }

            let pos = header.reversed ? (y * swidth32) : (((header.height - y) * swidth32) - swidth32);

            if (header.encoding == BmpEncoding.BITFIELDS) {
                for (let x = 0; x < header.width; x++) {
                    let word = dataView.getUint8(dataPos + 0) | (dataView.getUint8(dataPos + 1) << 8);
                    let val = 0;
                    if ((header.limitedTransparent) && (word == header.transparentIndex)) {
                        word = header.transparentColour;
                    }
                    else {
                        val = 0;
                        for (let i = 0; i < 4; i++)
                            if (header.shift[i] > 0)
                                val |= (word & header.mask[i]) << header.shift[i];
                            else
                                val |= (word & header.mask[i]) >>> (-header.shift[i]);
                        /* 32-bit BMPs have alpha masks, but sometimes they're not utilized */
                        if (header.opaque)
                            val |= (0xff << 24);
                    }
                    dataPos += 2;
                    img.pixelsView.setUint32(pos + x * 4, val, true);

                }
            } else {
                for (let x = 0; x < header.width; x++) {

                    let word = dataView.getUint8(dataPos) | (dataView.getUint8(dataPos + 1) << 8);
                    let val = 0;
                    if ((header.limitedTransparent) && (word == header.transparentIndex)) {
                        val = header.transparentColour;
                    } else {
                        /* 16-bit RGB defaults to RGB555 */
                        val = ((word & (31 << 0)) << 19) | ((word & (31 << 5)) << 6) | ((word & (31 << 10)) >>> 7);
                    }
                    if (header.opaque) {
                        val |= ((0xff << 24));
                    }

                    dataPos += 2;


                    img.pixelsView.setUint32(pos + x * 4, val, true);


                }


            }
            while ((dataPos & 3) != 0)
                dataPos += 2;




        }
        return img;

    }


    private bmpDecode_rgb(data: Uint8ClampedArray, header: bmpHeader): ImageRGBA {

        let img = new ImageRGBA(header.width, header.height);
        let dataView = new DataView(data.buffer, header.offset);

        let end = dataView.byteLength;
        let swidth = header.bpp / 8 * header.width;
        let swidth32 = header.width * 4;
        let bit_shifts = [0];
        let ppb = 8 / header.bpp;
        let bit_mask = (1 << header.bpp) - 1;
        let cur_byte = 0;
        let bit;

        for (let i = 0; i < ppb; ++i)
            bit_shifts[i] = 8 - ((i + 1) * header.bpp);

        /* Determine transparent index */
        if (header.limitedTransparent) {
            let idx = (dataView.getUint8(0) >> bit_shifts[0]) & bit_mask;
            if (idx >= header.colours) {
                throw Errors.bmpDataIsNotValid;
                
            }

            header.transparentIndex = header.colourTable[idx];
        }


        if ((swidth * header.height) > end) {
            throw Errors.bmpDataIsNotValid;
            
        }

        let dataPos = 0;
        for (let y = 0; y < header.height; ++y) {
            bit = 8;
            if (dataPos + (header.width / ppb) > end) {
                throw Errors.bmpDataIsNotValid;
                
            }

            let pos = header.reversed ? (y * swidth32) : (((header.height - y) * swidth32) - swidth32);


            for (let x = 0; x < header.width; x++) {
                let idx;
                if (bit >= ppb) {
                    bit = 0;
                    cur_byte = dataView.getUint8(dataPos);
                    dataPos++;
                }
                idx = (cur_byte >> bit_shifts[bit++]) & bit_mask;
                let val = 0;
                if (idx < header.colours) {
                    /* ensure colour table index is in bounds */
                    val = header.colourTable[idx];
                    if ((header.limitedTransparent) &&
                        (val == header.transparentIndex)) {
                        val = header.transparentColour;

                    }
                }


                img.pixelsView.setUint32(pos + x * 4, val, true);


            }

            while ((dataPos & 3) != 0)
                dataPos += 1;


        }
        return img;

    }

    private bmpDecode_rle8(data: Uint8ClampedArray, header: bmpHeader): ImageRGBA {

        let img = new ImageRGBA(header.width, header.height);
        let dataView = new DataView(data.buffer, header.offset);

        let end = dataView.byteLength;
        let swidth = header.bpp / 8 * header.width;
        let swidth32 = header.width * 4;
        let pixels_left;
        let x = 0, y = 0, last_y = 0;
        let pixel = 0;
        let dataPos = 0;
        let pos = 0;
        let length;
        do {
            if (dataPos + 2 > end) {
                throw Errors.bmpDataIsNotValid;
                
            }
            length = dataView.getUint8(dataPos++);

            if (length == 0) {
                length = dataView.getUint8(dataPos++);
                switch (length) {
                    case 0:
                        /* 00 - 00 means end of scanline */
                        x = 0;
                        if (last_y == y) {
                            y++;
                            if (y >= header.height) {
                                throw Errors.bmpDataIsNotValid;
                                
                            }
                        }
                        last_y = y;
                        break;

                    case 1:
                        /* 00 - 01 means end of RLE data */
                        return img;

                    case 2:
                        /* 00 - 02 - XX - YY means move cursor */
                        if (dataPos + 2 > end) {
                            throw Errors.bmpDataIsNotValid;
                            
                        }
                        x += dataView.getUint8(dataPos++);
                        if (x >= header.width) {
                            throw Errors.bmpDataIsNotValid;
                            
                        }
                        y += dataView.getUint8(dataPos++);
                        if (y >= header.height) {
                            throw Errors.bmpDataIsNotValid;
                            
                        }
                        break;

                    default:
                        /* 00 - NN means escape NN pixels */
                        if (header.reversed) {
                            pixels_left = (header.height - y) * header.width - x;
                            pos = (0 + (y * swidth32));
                        } else {
                            pixels_left = (y + 1) * header.width - x;
                            pos = (header.height * swidth32 - (y * swidth32) - swidth32);
                        }
                        if (length > pixels_left)
                            length = pixels_left;
                        if (dataPos + length > end) {
                            throw Errors.bmpDataIsNotValid;
                            
                        }

                        /* the following code could be easily optimised
                         * by simply checking the bounds on entry and
                         * using some simple copying routines if so
                         */
                        for (let i = 0; i < length; i++) {
                            let idx = dataView.getUint8(dataPos++);//(uint32_t) * data++;
                            if (x >= header.width) {
                                x = 0;
                                y++;
                                if (y >= header.height) {
                                    throw Errors.bmpDataIsNotValid;
                                    
                                }
                                if (header.reversed) {
                                    pos += header.width * 4;
                                } else {
                                    pos -= header.width * 4;
                                }
                            }
                            if (idx >= header.colours) {
                                throw Errors.bmpDataIsNotValid;
                                
                            }
                            //scanline[x++] = header.colourTable[idx];
                            img.pixelsView.setUint32(pos + x * 4, header.colourTable[idx], true);
                            x++;
                        }

                        if ((length & 1) && (dataView.getUint8(dataPos++) != 0x00)) {
                            throw Errors.bmpDataIsNotValid;
                            
                        }

                        break;
                }
            } else {
                let idx;

                /* NN means perform RLE for NN pixels */
                if (header.reversed) {
                    pixels_left = (header.height - y) * header.width - x;
                    pos = (0 + (y * swidth32));
                } else {
                    pixels_left = (y + 1) * header.width - x;
                    pos = (header.height * swidth32 - (y * swidth32) - swidth32);
                }
                if (length > pixels_left)
                    length = pixels_left;

                /* boundary checking */
                if (dataPos + 1 > end) {
                    throw Errors.bmpDataIsNotValid;
                    
                }

                /* the following code could be easily optimised by
                 * simply checking the bounds on entry and using some
                 * simply copying routines if so
                 */
                idx = dataView.getUint8(dataPos++);// (uint32_t) * data++;
                if (idx >= header.colours) {
                    throw Errors.bmpDataIsNotValid;
                    
                }

                pixel = header.colourTable[idx];
                for (let i = 0; i < length; i++) {
                    if (x >= header.width) {
                        x = 0;
                        y++;
                        if (y >= header.height) {
                            throw Errors.bmpDataIsNotValid;
                            
                        }
                        if (header.reversed) {
                            pos += header.width * 4;
                        } else {
                            pos -= header.width * 4;
                        }
                    }
                    //scanline[x++] = pixel;
                    img.pixelsView.setUint32(pos + x * 4, pixel, true);
                    x++;
                }
            }
        } while (dataPos < end);


        return img;

    }


    private bmpDecode_rle4(data: Uint8ClampedArray, header: bmpHeader): ImageRGBA {

        let img = new ImageRGBA(header.width, header.height);
        let dataView = new DataView(data.buffer, header.offset);

        let end = dataView.byteLength;
        let swidth = header.bpp / 8 * header.width;
        let swidth32 = header.width * 4;
        let pixels_left;
        let x = 0, y = 0, last_y = 0;
        let pixel = 0, pixel2;
        let dataPos = 0;
        let pos = 0;
        let length;
        do {
            if (dataPos + 2 > end) {
                throw Errors.bmpDataIsNotValid;
                
            }
            length = dataView.getUint8(dataPos++);

            if (length == 0) {
                length = dataView.getUint8(dataPos++);
                switch (length) {
                    case 0:
                        /* 00 - 00 means end of scanline */
                        x = 0;
                        if (last_y == y) {
                            y++;
                            if (y >= header.height) {
                                throw Errors.bmpDataIsNotValid;
                                
                            }
                        }
                        last_y = y;
                        break;

                    case 1:
                        /* 00 - 01 means end of RLE data */
                        return img;

                    case 2:
                        /* 00 - 02 - XX - YY means move cursor */
                        if (dataPos + 2 > end) {
                            throw Errors.bmpDataIsNotValid;
                            
                        }
                        x += dataView.getUint8(dataPos++);
                        if (x >= header.width) {
                            throw Errors.bmpDataIsNotValid;
                            
                        }
                        y += dataView.getUint8(dataPos++);
                        if (y >= header.height) {
                            throw Errors.bmpDataIsNotValid;
                            
                        }
                        break;

                    default:
                        /* 00 - NN means escape NN pixels */
                        if (header.reversed) {
                            pixels_left = (header.height - y) * header.width - x;
                            pos = (0 + (y * swidth32));
                        } else {
                            pixels_left = (y + 1) * header.width - x;
                            pos = (header.height * swidth32 - (y * swidth32) - swidth32);
                        }
                        if (length > pixels_left)
                            length = pixels_left;
                        if (dataPos + ((length + 1) / 2) > end) {
                            throw Errors.bmpDataIsNotValid;
                            
                        }

                        /* the following code could be easily optimised
                         * by simply checking the bounds on entry and
                         * using some simple copying routines if so
                         */
                        for (let i = 0; i < length; i++) {

                            if (x >= header.width) {
                                x = 0;
                                y++;
                                if (y >= header.height) {
                                    throw Errors.bmpDataIsNotValid;
                                    
                                }
                                if (header.reversed) {
                                    pos += header.width * 4;
                                } else {
                                    pos -= header.width * 4;
                                }
                            }
                            if ((i & 1) == 0) {
                                pixel = dataView.getUint8(dataPos++);
                                if ((pixel >> 4) >= header.colours) {
                                    throw Errors.bmpDataIsNotValid;
                                    
                                }
                                img.pixelsView.setUint32(pos + x * 4, header.colourTable[pixel >> 4], true);
                                x++;

                            } else {
                                if ((pixel & 0xf) >= header.colours) {
                                    throw Errors.bmpDataIsNotValid;
                                    
                                }
                                img.pixelsView.setUint32(pos + x * 4, header.colourTable[pixel & 0xf], true);
                                x++;

                            }


                        }
                        length = (length + 1) >> 1;
                        if ((length & 1) && (dataView.getUint8(dataPos++) != 0x00)) {
                            throw Errors.bmpDataIsNotValid;
                            
                        }

                        break;
                }
            } else {


                /* NN means perform RLE for NN pixels */
                if (header.reversed) {
                    pixels_left = (header.height - y) * header.width - x;
                    pos = (0 + (y * swidth32));
                } else {
                    pixels_left = (y + 1) * header.width - x;
                    pos = (header.height * swidth32 - (y * swidth32) - swidth32);
                }
                if (length > pixels_left)
                    length = pixels_left;

                /* boundary checking */
                if (dataPos + 1 > end) {
                    throw Errors.bmpDataIsNotValid;
                    
                }

                /* the following code could be easily optimised by
                 * simply checking the bounds on entry and using some
                 * simply copying routines if so
                 */
                pixel2 = dataView.getUint8(dataPos++);// (uint32_t) * data++;
                if ((pixel2 >> 4) >= header.colours || (pixel2 & 0xf) >= header.colours) {
                    throw Errors.bmpDataIsNotValid;
                    
                }
                pixel = header.colourTable[pixel2 >> 4];
                pixel2 = header.colourTable[pixel2 & 0xf];
                for (let i = 0; i < length; i++) {
                    if (x >= header.width) {
                        x = 0;
                        y++;
                        if (y >= header.height) {
                            throw Errors.bmpDataIsNotValid;
                            
                        }
                        if (header.reversed) {
                            pos += header.width * 4;
                        } else {
                            pos -= header.width * 4;
                        }
                    }
                    if ((i & 1) == 0)
                        img.pixelsView.setUint32(pos + x * 4, pixel, true);
                    else
                        img.pixelsView.setUint32(pos + x * 4, pixel2, true);
                    x++;
                }
            }
        } while (dataPos < end);


        return img;

    }




}

class bmpHeader {
    offset: number = 0;
    width: number = 0;
    height: number = 0;
    bpp: number = 0;
    colours: number = 0;
    reversed: boolean = false;
    encoding: number = 0;
    paletteSize: number = 0;
    mask: number[] = [4];
    shift: number[];
    opaque: boolean = false;
    colourTable: number[];
    limitedTransparent: boolean = false;
    transparentColour: number = 0;
    transparentIndex: number = 0;
    constructor() {
        this.mask = [0, 0, 0, 0];
        this.shift = [0, 0, 0, 0];
    }

}