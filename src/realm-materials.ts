import * as T from "three";

// Shared world-space detail prevents tiling seams across the modular stones.
const detailNoise = `
float rockHash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
float rockNoise(vec3 p){
 vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(mix(rockHash(i),rockHash(i+vec3(1,0,0)),f.x),mix(rockHash(i+vec3(0,1,0)),rockHash(i+vec3(1,1,0)),f.x),f.y),
 mix(mix(rockHash(i+vec3(0,0,1)),rockHash(i+vec3(1,0,1)),f.x),mix(rockHash(i+vec3(0,1,1)),rockHash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
`;
export function strata() {
  const material = new T.MeshStandardMaterial({
    color: 0x64717b,
    roughness: 0.91,
  });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader =
      "varying vec3 ledge;\n" +
      shader.vertexShader.replace(
        "#include <project_vertex>",
        "#include <project_vertex>\nledge=(modelMatrix*instanceMatrix*vec4(transformed,1.)).xyz;",
      );
    shader.fragmentShader =
      "varying vec3 ledge;\n" +
      detailNoise +
      shader.fragmentShader.replace(
        "#include <color_fragment>",
        `#include <color_fragment>
 float fold=rockNoise(ledge*.27);
 float stratum=sin(ledge.y*3.4+ledge.x*.52+ledge.z*.19+fold*4.);
 float pits=rockNoise(ledge*vec3(3.2,4.8,3.2));
 diffuseColor.rgb*=.53+.42*fold+.27*pits;
 diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.23,.26,.27),.25*smoothstep(.68,1.,stratum)*pits);
 diffuseColor.rgb*=mix(.62,1.,smoothstep(-8.,1.,ledge.y));`,
      );
  };
  return material;
}
export function finishGate(gate: T.Object3D) {
  gate.traverse((object) => {
    if (!(object instanceof T.Mesh)) return;
    for (const m of Array.isArray(object.material)
      ? object.material
      : [object.material]) {
      if (m.name !== "Smoked oak") continue;
      m.roughness = 0.81;
      m.color.multiplyScalar(0.49);
      m.onBeforeCompile = (shader: T.WebGLProgramParametersWithUniforms) => {
        shader.vertexShader =
          "varying vec3 timber;\n" +
          shader.vertexShader.replace(
            "#include <project_vertex>",
            "#include <project_vertex>\ntimber=(modelMatrix*vec4(transformed,1.)).xyz;",
          );
        shader.fragmentShader =
          "varying vec3 timber;\n" +
          detailNoise +
          shader.fragmentShader.replace(
            "#include <color_fragment>",
            `#include <color_fragment>
 float warp=rockNoise(timber*vec3(3.5,.7,3.5));
 float grain=sin(timber.x*166.+warp*13.+sin(timber.y*2.));
 float split=smoothstep(.79,1.,grain)*rockNoise(timber*vec3(8.,.48,8.));
 diffuseColor.rgb*=.56+.55*warp+.18*grain-.37*split;`,
          );
      };
    }
  });
}
