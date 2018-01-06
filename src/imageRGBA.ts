import { Errors } from "./errors";
import { Limits } from "./limits";

/**
 * an image with a RGBA  pixel layout,
 * top to bottom, left to right
 */
export class ImageRGBA  {
    
    private _width: number;
    private _height: number;
    private _pixels: Uint8ClampedArray;    
    private _pixelView:DataView;
    

    /**
     * 
     * @param width width of image in pixels
     * @param height height of image in pixels
     * @param pixels data of pixels as RGBA
     * 
     * remarks pixel array does not copy buffer, only copies reference
     * you must check error with   lastError() function, if it is not undefined then
     * an error occured means
     */
    public constructor(width: number, height: number, pixels?: Uint8ClampedArray) {
        

        
        //check width or height
        if (width === undefined || height === undefined) {
            throw  Errors.undefinedVariable;
            
        }
        //check if width is in limits
        if (width <= Limits.uint16_MIN || width > Limits.uint16_MAX) {
            throw  Errors.imageWidthOrHeightIsNotValid;
            
        }

        this._width = width;
        //check if height is in limits
        if (height <= Limits.uint16_MIN || height > Limits.uint16_MAX) {
            throw Errors.imageWidthOrHeightIsNotValid;
            
        }
        this._height = height;
        if (pixels){
            //check if pixels count is equal to buffer count
            if(pixels.byteLength == width*height*4)
              this._pixels = pixels;
              else
              {
                  //set error and return
                  throw  Errors.imageDataIsNotValid;
                  
              }
        }
        else{
            this._pixels =new Uint8ClampedArray(width * height * 4);            
            this._pixels.fill(255);
            
        } 
        
        this._pixelView= new DataView(this._pixels.buffer,0);
        
        
    }
    public get pixels():Uint8ClampedArray{
        return this._pixels;
    }
    
    public get pixelsView():DataView{
        return this._pixelView;
    }
   
    /**
     * @returns width of image in pixels
     */
    public get width(): number {
        return this._width;
    }
    /**
     * @returns height of image in pixels 
     */
    public get height(): number {
        return this._height;
    }

   
}