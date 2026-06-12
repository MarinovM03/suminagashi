export const VERT = /* glsl */ `
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

export const ADVECT = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uVelocity, uSource;
  uniform vec2 uTexel;
  uniform float uDt, uDissipation;
  void main(){
    vec2 coord = vUv - uDt * texture2D(uVelocity, vUv).xy * uTexel;
    vec4 result = texture2D(uSource, coord);
    gl_FragColor = result / (1.0 + uDissipation * uDt);
  }
`;

export const SPLAT = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTarget;
  uniform float uAspect, uRadius;
  uniform vec2 uPoint;
  uniform vec3 uColor;
  void main(){
    vec2 p = vUv - uPoint;
    p.x *= uAspect;
    vec3 splat = exp(-dot(p, p) / uRadius) * uColor;
    gl_FragColor = vec4(texture2D(uTarget, vUv).rgb + splat, 1.0);
  }
`;

export const RADIAL_PUSH = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTarget;
  uniform float uAspect, uRadius, uStrength;
  uniform vec2 uPoint;
  void main(){
    vec2 p = vUv - uPoint;
    p.x *= uAspect;
    float g = exp(-dot(p, p) / uRadius);
    vec2 dir = p / (length(p) + 1e-4);
    dir.x /= uAspect;
    vec2 vel = texture2D(uTarget, vUv).xy + dir * g * uStrength;
    gl_FragColor = vec4(vel, 0.0, 1.0);
  }
`;

export const CURL = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform vec2 uTexel;
  void main(){
    float L = texture2D(uVelocity, vUv - vec2(uTexel.x, 0.0)).y;
    float R = texture2D(uVelocity, vUv + vec2(uTexel.x, 0.0)).y;
    float B = texture2D(uVelocity, vUv - vec2(0.0, uTexel.y)).x;
    float T = texture2D(uVelocity, vUv + vec2(0.0, uTexel.y)).x;
    gl_FragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
  }
`;

export const VORTICITY = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uVelocity, uCurl;
  uniform vec2 uTexel;
  uniform float uCurlStrength, uDt;
  void main(){
    float L = texture2D(uCurl, vUv - vec2(uTexel.x, 0.0)).x;
    float R = texture2D(uCurl, vUv + vec2(uTexel.x, 0.0)).x;
    float B = texture2D(uCurl, vUv - vec2(0.0, uTexel.y)).x;
    float T = texture2D(uCurl, vUv + vec2(0.0, uTexel.y)).x;
    float C = texture2D(uCurl, vUv).x;
    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
    force /= length(force) + 0.0001;
    force *= uCurlStrength * C;
    force.y *= -1.0;
    vec2 vel = texture2D(uVelocity, vUv).xy + force * uDt;
    gl_FragColor = vec4(clamp(vel, -1000.0, 1000.0), 0.0, 1.0);
  }
`;

export const DIVERGENCE = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform vec2 uTexel;
  void main(){
    float L = texture2D(uVelocity, vUv - vec2(uTexel.x, 0.0)).x;
    float R = texture2D(uVelocity, vUv + vec2(uTexel.x, 0.0)).x;
    float B = texture2D(uVelocity, vUv - vec2(0.0, uTexel.y)).y;
    float T = texture2D(uVelocity, vUv + vec2(0.0, uTexel.y)).y;
    vec2 C = texture2D(uVelocity, vUv).xy;
    if (vUv.x - uTexel.x < 0.0) L = -C.x;
    if (vUv.x + uTexel.x > 1.0) R = -C.x;
    if (vUv.y - uTexel.y < 0.0) B = -C.y;
    if (vUv.y + uTexel.y > 1.0) T = -C.y;
    gl_FragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
  }
`;

export const PRESSURE = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uPressure, uDivergence;
  uniform vec2 uTexel;
  void main(){
    float L = texture2D(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
    float R = texture2D(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
    float B = texture2D(uPressure, vUv - vec2(0.0, uTexel.y)).x;
    float T = texture2D(uPressure, vUv + vec2(0.0, uTexel.y)).x;
    float div = texture2D(uDivergence, vUv).x;
    gl_FragColor = vec4((L + R + B + T - div) * 0.25, 0.0, 0.0, 1.0);
  }
`;

export const GRADIENT_SUBTRACT = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uPressure, uVelocity;
  uniform vec2 uTexel;
  void main(){
    float L = texture2D(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
    float R = texture2D(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
    float B = texture2D(uPressure, vUv - vec2(0.0, uTexel.y)).x;
    float T = texture2D(uPressure, vUv + vec2(0.0, uTexel.y)).x;
    vec2 vel = texture2D(uVelocity, vUv).xy - vec2(R - L, T - B);
    gl_FragColor = vec4(vel, 0.0, 1.0);
  }
`;

export const CLEAR = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform float uValue;
  void main(){ gl_FragColor = uValue * texture2D(uTexture, vUv); }
`;

export const DISPLAY = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uDye;
  uniform vec2 uTexel;
  uniform vec3 uPaper;
  uniform float uTime;

  float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
  float noise(vec2 p){
    vec2 i=floor(p), f=fract(p);
    f=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
               mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
  }

  void main(){
    float fiber = noise(vUv * 420.0) * 0.028
                + noise(vUv * 180.0) * 0.022
                + noise(vUv * 60.0)  * 0.018;

    vec3 A = texture2D(uDye, vUv).rgb;
    vec3 col = uPaper * exp(-A) + fiber;

    vec2 uv2 = vUv * (1.0 - vUv.yx);
    float vign = pow(uv2.x * uv2.y * 15.0, 0.18);
    col *= 0.92 + 0.08 * vign;

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
  }
`;
