"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DecodeError extends Error {
    constructor(errno, msg) {
        super();
        super.message = msg;
        this._errNumber = errno;
    }
    get errNumber() { return this._errNumber; }
}
exports.DecodeError = DecodeError;
class Errors {
}
Errors.undefinedVariable = new DecodeError(1, 'undefined variable');
Errors.indexOutOfRange = new DecodeError(2, 'index out of range');
Errors.imageDataIsNotValid = new DecodeError(200, 'image data buffer is not valid');
Errors.imageWidthOrHeightIsNotValid = new DecodeError(201, 'image width and height must be between 1-65535');
Errors.bmpDataIsNotValid = new DecodeError(202, 'bmp data is not valid');
exports.Errors = Errors;
