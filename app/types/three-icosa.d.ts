declare module 'three-icosa' {
  import * as THREE from 'three';

  export class TiltShaderLoader extends THREE.Loader {
    constructor(manager?: THREE.WebGLRenderer | THREE.LoadingManager);
    setPath(path: string): this;
    lookupMaterialName(nameOrGuid: string): string | undefined;
    lookupMaterialParams(brushName: string): object | undefined;
    load(
      brushName: string,
      onLoad: (material: THREE.ShaderMaterial) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (event: ErrorEvent) => void
    ): void;
  }

  export class GLTFGoogleTiltBrushMaterialExtension {
    constructor(parser: unknown, brushPath: string);
  }

  export class GLTFGoogleTiltBrushTechniquesExtension {
    constructor(parser: unknown);
  }
}
