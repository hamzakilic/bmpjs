"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("./errors");
const limits_1 = require("./limits");
class ImageRGBA {
    constructor(width, height, pixels) {
        if (width === undefined || height === undefined) {
            throw errors_1.Errors.undefinedVariable;
        }
        if (width <= limits_1.Limits.uint16_MIN || width > limits_1.Limits.uint16_MAX) {
            throw errors_1.Errors.imageWidthOrHeightIsNotValid;
        }
        this._width = width;
        if (height <= limits_1.Limits.uint16_MIN || height > limits_1.Limits.uint16_MAX) {
            throw errors_1.Errors.imageWidthOrHeightIsNotValid;
        }
        this._height = height;
        if (pixels) {
            if (pixels.byteLength == width * height * 4)
                this._pixels = pixels;
            else {
                throw errors_1.Errors.imageDataIsNotValid;
            }
        }
        else {
            this._pixels = new Uint8ClampedArray(width * height * 4);
            this._pixels.fill(255);
        }
        this._pixelView = new DataView(this._pixels.buffer, 0);
    }
    get pixels() {
        return this._pixels;
    }
    get pixelsView() {
        return this._pixelView;
    }
    get width() {
        return this._width;
    }
    get height() {
        return this._height;
    }
}
exports.ImageRGBA = ImageRGBA;
