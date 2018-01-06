"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bmpDecoder_1 = require("./bmpDecoder");
function decode(array) {
    let decoder = new bmpDecoder_1.BmpDecoder();
    return decoder.decode(array);
}
exports.decode = decode;
