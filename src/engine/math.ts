import * as THREE from 'three';

// Color → absorbance (Beer-Lambert): display composites paper × exp(-A).
export function inkAbsorption(c: THREE.Color, strength: number): THREE.Vector3 {
  const e = 0.012;
  return new THREE.Vector3(
    -Math.log(Math.max(c.r, e)) * strength,
    -Math.log(Math.max(c.g, e)) * strength,
    -Math.log(Math.max(c.b, e)) * strength,
  );
}

// Velocity short edge fixed at simRes; dye capped at dyeRes.
export function computeSimSizes(w: number, h: number, simRes: number, dyeRes: number) {
  const aspect = w / h;
  const dye = Math.min(dyeRes, Math.max(w, h));
  return aspect >= 1
    ? { sw: Math.round(simRes * aspect), sh: simRes, dw: dye, dh: Math.round(dye / aspect) }
    : { sw: simRes, sh: Math.round(simRes / aspect), dw: Math.round(dye * aspect), dh: dye };
}
