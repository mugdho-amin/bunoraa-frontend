declare module "js-image-zoom" {
  interface ImageZoomOptions {
    width?: number;
    height?: number;
    zoomWidth?: number;
    img?: string;
    scale?: number;
    offset?: { vertical?: number; horizontal?: number };
    zoomContainer?: HTMLElement;
    zoomStyle?: string;
    zoomPosition?: "top" | "left" | "bottom" | "original" | "right";
    zoomLensStyle?: string;
  }

  interface ImageZoomInstance {}

  interface ImageZoomConstructor {
    new (container: HTMLElement, options: ImageZoomOptions): ImageZoomInstance;
    (container: HTMLElement, options: ImageZoomOptions): ImageZoomInstance;
  }

  declare const ImageZoom: ImageZoomConstructor;

  export default ImageZoom;
}
