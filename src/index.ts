import { Errors,DecodeError } from './errors';
import { ImageRGBA } from './imageRGBA';
import { BmpDecoder } from './bmpDecoder';



export function decode(array:ArrayBuffer):ImageRGBA{
    let decoder=new BmpDecoder();
    return decoder.decode(array);

}