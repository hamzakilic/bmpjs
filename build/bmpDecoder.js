"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const imageRGBA_1 = require("./imageRGBA");
const errors_1 = require("./errors");
const limits_1 = require("./limits");
var BMP_NEW = 0;
var BMP_OPAQUE = (1 << 0);
var BMP_CLEAR_MEMORY = (1 << 1);
class BmpResult {
}
BmpResult.BMP_OK = 0;
BmpResult.BMP_INSUFFICIENT_MEMORY = 1;
BmpResult.BMP_INSUFFICIENT_DATA = 2;
BmpResult.BMP_DATA_ERROR = 3;
class BmpEncoding {
}
BmpEncoding.RGB = 0;
BmpEncoding.RLE8 = 1;
BmpEncoding.RLE4 = 2;
BmpEncoding.BITFIELDS = 3;
class BmpDecoder {
    constructor() {
        this.BMP_FILE_HEADER_SIZE = 14;
        this.BITMAPCOREHEADER = 12;
    }
    decode(buffer) {
        this._bytes = new Uint8ClampedArray(buffer);
        return this.startDecoding();
    }
    startDecoding() {
        let byteData = this._bytes;
        let header = this.bmpFileHeaderParse(byteData);
        this.bmpInfoHeaderParse(byteData, header);
        let img = this.bmpDecode(byteData, header);
        return img;
    }
    bmpFileHeaderParse(data) {
        if (data.length < this.BMP_FILE_HEADER_SIZE) {
            throw errors_1.Errors.bmpDataIsNotValid;
        }
        if (data[0] != 0x42 || data[1] != 0x4D) {
            throw errors_1.Errors.bmpDataIsNotValid;
        }
        let offset = new DataView(data.buffer, 10).getUint32(0, true);
        if (offset >= data.length) {
            throw errors_1.Errors.bmpDataIsNotValid;
        }
        let header = new bmpHeader();
        header.offset = offset;
        return header;
    }
    bmpInfoHeaderParse(data, header) {
        if (data.length < (this.BMP_FILE_HEADER_SIZE + this.BITMAPCOREHEADER)) {
            throw errors_1.Errors.bmpDataIsNotValid;
        }
        let view = new DataView(data.buffer, this.BMP_FILE_HEADER_SIZE);
        let header_size = view.getUint32(0, true);
        if (data.length - this.BMP_FILE_HEADER_SIZE < header_size) {
            throw errors_1.Errors.bmpDataIsNotValid;
        }
        if (header_size == this.BITMAPCOREHEADER) {
            header.width = view.getInt16(4, true);
            header.height = view.getInt16(6, true);
            if ((header.width <= 0) || (header.height == 0)) {
                throw errors_1.Errors.bmpDataIsNotValid;
            }
            if (header.height < 0) {
                header.height = -header.height;
                header.reversed = true;
            }
            if (view.getUint16(8, true) != 1) {
                throw errors_1.Errors.bmpDataIsNotValid;
            }
            header.bpp = view.getUint16(10, true);
            if (header.bpp != 1 && header.bpp != 4 && header.bpp != 8 && header.bpp != 16 && header.bpp != 24 && header.bpp != 32) {
                throw errors_1.Errors.bmpDataIsNotValid;
            }
            header.colours = 1 << header.bpp;
            header.paletteSize = 3;
        }
        else if (header_size < 40) {
            throw errors_1.Errors.bmpDataIsNotValid;
        }
        else {
            header.width = view.getInt32(4, true);
            header.height = view.getInt32(8, true);
            if ((header.width <= 0) || (header.height == 0)) {
                throw errors_1.Errors.bmpDataIsNotValid;
            }
            if (header.height < 0) {
                header.reversed = true;
                if (header.height <= limits_1.Limits.int32_MIN) {
                    header.height = limits_1.Limits.int32_MAX;
                }
                else {
                    header.height = -header.height;
                }
            }
            if (view.getUint16(12, true) != 1) {
                throw errors_1.Errors.bmpDataIsNotValid;
            }
            header.bpp = view.getUint16(14, true);
            if (header.bpp == 0)
                header.bpp = 8;
            header.encoding = view.getUint32(16, true);
            switch (header.encoding) {
                case BmpEncoding.RGB:
                    if ((header.bpp != 1) && (header.bpp != 4) &&
                        (header.bpp != 8) &&
                        (header.bpp != 16) &&
                        (header.bpp != 24) &&
                        (header.bpp != 32)) {
                        throw errors_1.Errors.bmpDataIsNotValid;
                    }
                    break;
                case BmpEncoding.RLE8:
                    if (header.bpp != 8) {
                        throw errors_1.Errors.bmpDataIsNotValid;
                    }
                    break;
                case BmpEncoding.RLE4:
                    if (header.bpp != 4) {
                        throw errors_1.Errors.bmpDataIsNotValid;
                    }
                    break;
                case BmpEncoding.BITFIELDS:
                    if ((header.bpp != 16) && (header.bpp != 32)) {
                        throw errors_1.Errors.bmpDataIsNotValid;
                    }
                    break;
                default:
                    throw errors_1.Errors.bmpDataIsNotValid;
            }
            if (header.encoding == BmpEncoding.BITFIELDS) {
                if (header_size == 40) {
                    header_size += 12;
                    if (data.length < (14 + header_size)) {
                        throw errors_1.Errors.bmpDataIsNotValid;
                    }
                    for (let i = 0; i < 3; i++) {
                        header.mask[i] = view.getUint32(40 + (i << 2), true);
                    }
                }
                else {
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
            if (data.length < (14 + header_size + (4 * header.colours))) {
                throw errors_1.Errors.bmpDataIsNotValid;
            }
            header.colourTable = [header.colours];
            let pOff = 0;
            for (let i = 0; i < header.colours; i++) {
                header.colourTable[i] = newView.getUint8(2 + pOff) | (newView.getUint8(1 + pOff) << 8) | (newView.getUint8(0 + pOff) << 16);
                if (header.opaque)
                    header.colourTable[i] |= (0xff << 24);
                pOff += header.paletteSize;
            }
        }
    }
    bmpDecode(data, header) {
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
                        throw errors_1.Errors.bmpDataIsNotValid;
                }
            default:
                {
                    throw errors_1.Errors.bmpDataIsNotValid;
                }
        }
    }
    bmpDecode_rgb32(data, header) {
        let img = new imageRGBA_1.ImageRGBA(header.width, header.height);
        let dataView = new DataView(data.buffer, header.offset);
        let end = dataView.byteLength;
        let swidth = header.bpp / 8 * header.width;
        if (header.limitedTransparent) {
            if ((4) > end) {
                throw errors_1.Errors.bmpDataIsNotValid;
            }
            if (header.encoding == BmpEncoding.BITFIELDS)
                header.transparentIndex = dataView.getUint32(0, true);
            else
                header.transparentIndex = dataView.getUint8(2) | (dataView.getUint8(1) << 8) | (dataView.getUint8(0) << 16);
        }
        if ((swidth * header.height) > end) {
            throw errors_1.Errors.bmpDataIsNotValid;
        }
        let dataPos = 0;
        for (let y = 0; y < header.height; ++y) {
            let pos = header.reversed ? (y * swidth) : (end - (y * swidth) - swidth);
            if (header.encoding == BmpEncoding.BITFIELDS) {
                for (let x = 0; x < header.width; x++) {
                    let word = dataView.getUint32(dataPos, true);
                    let val = 0;
                    for (let i = 0; i < 4; i++)
                        if (header.shift[i] > 0)
                            val |= (word & header.mask[i]) << header.shift[i];
                        else
                            val |= (word & header.mask[i]) >>> (-header.shift[i]);
                    if (header.opaque)
                        val |= (0xff << 24);
                    dataPos += 4;
                    img.pixelsView.setUint32(pos + x * 4, val, true);
                }
            }
            else {
                for (let x = 0; x < header.width; x++) {
                    let word = dataView.getUint8(dataPos + 2) | (dataView.getUint8(dataPos + 1) << 8) | (dataView.getUint8(dataPos + 0) << 16);
                    if ((header.limitedTransparent) && (word == header.transparentIndex)) {
                        word = header.transparentColour;
                    }
                    if (header.opaque) {
                        word |= ((0xff << 24));
                    }
                    else {
                        word |= (data[3] << 24);
                    }
                    dataPos += 4;
                    img.pixelsView.setUint32(pos + x * 4, word, true);
                }
            }
        }
        return img;
    }
    bmpDecode_rgb24(data, header) {
        let img = new imageRGBA_1.ImageRGBA(header.width, header.height);
        let dataView = new DataView(data.buffer, header.offset);
        let end = dataView.byteLength;
        let swidth = header.bpp / 8 * header.width;
        let swidth32 = header.width * 4;
        if (header.limitedTransparent) {
            if ((3) > end) {
                throw errors_1.Errors.bmpDataIsNotValid;
            }
            header.transparentIndex = dataView.getUint8(2) | (dataView.getUint8(1) << 8) | (dataView.getUint8(0) << 16);
        }
        let dataPos = 0;
        for (let y = 0; y < header.height; ++y) {
            if (dataPos + swidth > end) {
                throw errors_1.Errors.bmpDataIsNotValid;
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
            while ((dataPos & 3) != 0)
                dataPos += 1;
        }
        return img;
    }
    bmpDecode_rgb16(data, header) {
        let img = new imageRGBA_1.ImageRGBA(header.width, header.height);
        let dataView = new DataView(data.buffer, header.offset);
        let end = dataView.byteLength;
        let swidth = header.bpp / 8 * header.width;
        let swidth32 = header.width * 4;
        if (header.limitedTransparent) {
            if ((2) > end) {
                throw errors_1.Errors.bmpDataIsNotValid;
            }
            header.transparentIndex = dataView.getUint32(0, true);
        }
        if ((swidth * header.height) > end) {
            throw errors_1.Errors.bmpDataIsNotValid;
        }
        let dataPos = 0;
        for (let y = 0; y < header.height; ++y) {
            if (dataPos + swidth >= end) {
                throw errors_1.Errors.bmpDataIsNotValid;
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
                        if (header.opaque)
                            val |= (0xff << 24);
                    }
                    dataPos += 2;
                    img.pixelsView.setUint32(pos + x * 4, val, true);
                }
            }
            else {
                for (let x = 0; x < header.width; x++) {
                    let word = dataView.getUint8(dataPos) | (dataView.getUint8(dataPos + 1) << 8);
                    let val = 0;
                    if ((header.limitedTransparent) && (word == header.transparentIndex)) {
                        val = header.transparentColour;
                    }
                    else {
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
    bmpDecode_rgb(data, header) {
        let img = new imageRGBA_1.ImageRGBA(header.width, header.height);
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
        if (header.limitedTransparent) {
            let idx = (dataView.getUint8(0) >> bit_shifts[0]) & bit_mask;
            if (idx >= header.colours) {
                throw errors_1.Errors.bmpDataIsNotValid;
            }
            header.transparentIndex = header.colourTable[idx];
        }
        if ((swidth * header.height) > end) {
            throw errors_1.Errors.bmpDataIsNotValid;
        }
        let dataPos = 0;
        for (let y = 0; y < header.height; ++y) {
            bit = 8;
            if (dataPos + (header.width / ppb) > end) {
                throw errors_1.Errors.bmpDataIsNotValid;
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
    bmpDecode_rle8(data, header) {
        let img = new imageRGBA_1.ImageRGBA(header.width, header.height);
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
                throw errors_1.Errors.bmpDataIsNotValid;
            }
            length = dataView.getUint8(dataPos++);
            if (length == 0) {
                length = dataView.getUint8(dataPos++);
                switch (length) {
                    case 0:
                        x = 0;
                        if (last_y == y) {
                            y++;
                            if (y >= header.height) {
                                throw errors_1.Errors.bmpDataIsNotValid;
                            }
                        }
                        last_y = y;
                        break;
                    case 1:
                        return img;
                    case 2:
                        if (dataPos + 2 > end) {
                            throw errors_1.Errors.bmpDataIsNotValid;
                        }
                        x += dataView.getUint8(dataPos++);
                        if (x >= header.width) {
                            throw errors_1.Errors.bmpDataIsNotValid;
                        }
                        y += dataView.getUint8(dataPos++);
                        if (y >= header.height) {
                            throw errors_1.Errors.bmpDataIsNotValid;
                        }
                        break;
                    default:
                        if (header.reversed) {
                            pixels_left = (header.height - y) * header.width - x;
                            pos = (0 + (y * swidth32));
                        }
                        else {
                            pixels_left = (y + 1) * header.width - x;
                            pos = (header.height * swidth32 - (y * swidth32) - swidth32);
                        }
                        if (length > pixels_left)
                            length = pixels_left;
                        if (dataPos + length > end) {
                            throw errors_1.Errors.bmpDataIsNotValid;
                        }
                        for (let i = 0; i < length; i++) {
                            let idx = dataView.getUint8(dataPos++);
                            if (x >= header.width) {
                                x = 0;
                                y++;
                                if (y >= header.height) {
                                    throw errors_1.Errors.bmpDataIsNotValid;
                                }
                                if (header.reversed) {
                                    pos += header.width * 4;
                                }
                                else {
                                    pos -= header.width * 4;
                                }
                            }
                            if (idx >= header.colours) {
                                throw errors_1.Errors.bmpDataIsNotValid;
                            }
                            img.pixelsView.setUint32(pos + x * 4, header.colourTable[idx], true);
                            x++;
                        }
                        if ((length & 1) && (dataView.getUint8(dataPos++) != 0x00)) {
                            throw errors_1.Errors.bmpDataIsNotValid;
                        }
                        break;
                }
            }
            else {
                let idx;
                if (header.reversed) {
                    pixels_left = (header.height - y) * header.width - x;
                    pos = (0 + (y * swidth32));
                }
                else {
                    pixels_left = (y + 1) * header.width - x;
                    pos = (header.height * swidth32 - (y * swidth32) - swidth32);
                }
                if (length > pixels_left)
                    length = pixels_left;
                if (dataPos + 1 > end) {
                    throw errors_1.Errors.bmpDataIsNotValid;
                }
                idx = dataView.getUint8(dataPos++);
                if (idx >= header.colours) {
                    throw errors_1.Errors.bmpDataIsNotValid;
                }
                pixel = header.colourTable[idx];
                for (let i = 0; i < length; i++) {
                    if (x >= header.width) {
                        x = 0;
                        y++;
                        if (y >= header.height) {
                            throw errors_1.Errors.bmpDataIsNotValid;
                        }
                        if (header.reversed) {
                            pos += header.width * 4;
                        }
                        else {
                            pos -= header.width * 4;
                        }
                    }
                    img.pixelsView.setUint32(pos + x * 4, pixel, true);
                    x++;
                }
            }
        } while (dataPos < end);
        return img;
    }
    bmpDecode_rle4(data, header) {
        let img = new imageRGBA_1.ImageRGBA(header.width, header.height);
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
                throw errors_1.Errors.bmpDataIsNotValid;
            }
            length = dataView.getUint8(dataPos++);
            if (length == 0) {
                length = dataView.getUint8(dataPos++);
                switch (length) {
                    case 0:
                        x = 0;
                        if (last_y == y) {
                            y++;
                            if (y >= header.height) {
                                throw errors_1.Errors.bmpDataIsNotValid;
                            }
                        }
                        last_y = y;
                        break;
                    case 1:
                        return img;
                    case 2:
                        if (dataPos + 2 > end) {
                            throw errors_1.Errors.bmpDataIsNotValid;
                        }
                        x += dataView.getUint8(dataPos++);
                        if (x >= header.width) {
                            throw errors_1.Errors.bmpDataIsNotValid;
                        }
                        y += dataView.getUint8(dataPos++);
                        if (y >= header.height) {
                            throw errors_1.Errors.bmpDataIsNotValid;
                        }
                        break;
                    default:
                        if (header.reversed) {
                            pixels_left = (header.height - y) * header.width - x;
                            pos = (0 + (y * swidth32));
                        }
                        else {
                            pixels_left = (y + 1) * header.width - x;
                            pos = (header.height * swidth32 - (y * swidth32) - swidth32);
                        }
                        if (length > pixels_left)
                            length = pixels_left;
                        if (dataPos + ((length + 1) / 2) > end) {
                            throw errors_1.Errors.bmpDataIsNotValid;
                        }
                        for (let i = 0; i < length; i++) {
                            if (x >= header.width) {
                                x = 0;
                                y++;
                                if (y >= header.height) {
                                    throw errors_1.Errors.bmpDataIsNotValid;
                                }
                                if (header.reversed) {
                                    pos += header.width * 4;
                                }
                                else {
                                    pos -= header.width * 4;
                                }
                            }
                            if ((i & 1) == 0) {
                                pixel = dataView.getUint8(dataPos++);
                                if ((pixel >> 4) >= header.colours) {
                                    throw errors_1.Errors.bmpDataIsNotValid;
                                }
                                img.pixelsView.setUint32(pos + x * 4, header.colourTable[pixel >> 4], true);
                                x++;
                            }
                            else {
                                if ((pixel & 0xf) >= header.colours) {
                                    throw errors_1.Errors.bmpDataIsNotValid;
                                }
                                img.pixelsView.setUint32(pos + x * 4, header.colourTable[pixel & 0xf], true);
                                x++;
                            }
                        }
                        length = (length + 1) >> 1;
                        if ((length & 1) && (dataView.getUint8(dataPos++) != 0x00)) {
                            throw errors_1.Errors.bmpDataIsNotValid;
                        }
                        break;
                }
            }
            else {
                if (header.reversed) {
                    pixels_left = (header.height - y) * header.width - x;
                    pos = (0 + (y * swidth32));
                }
                else {
                    pixels_left = (y + 1) * header.width - x;
                    pos = (header.height * swidth32 - (y * swidth32) - swidth32);
                }
                if (length > pixels_left)
                    length = pixels_left;
                if (dataPos + 1 > end) {
                    throw errors_1.Errors.bmpDataIsNotValid;
                }
                pixel2 = dataView.getUint8(dataPos++);
                if ((pixel2 >> 4) >= header.colours || (pixel2 & 0xf) >= header.colours) {
                    throw errors_1.Errors.bmpDataIsNotValid;
                }
                pixel = header.colourTable[pixel2 >> 4];
                pixel2 = header.colourTable[pixel2 & 0xf];
                for (let i = 0; i < length; i++) {
                    if (x >= header.width) {
                        x = 0;
                        y++;
                        if (y >= header.height) {
                            throw errors_1.Errors.bmpDataIsNotValid;
                        }
                        if (header.reversed) {
                            pos += header.width * 4;
                        }
                        else {
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
exports.BmpDecoder = BmpDecoder;
class bmpHeader {
    constructor() {
        this.offset = 0;
        this.width = 0;
        this.height = 0;
        this.bpp = 0;
        this.colours = 0;
        this.reversed = false;
        this.encoding = 0;
        this.paletteSize = 0;
        this.mask = [4];
        this.opaque = false;
        this.limitedTransparent = false;
        this.transparentColour = 0;
        this.transparentIndex = 0;
        this.mask = [0, 0, 0, 0];
        this.shift = [0, 0, 0, 0];
    }
}
