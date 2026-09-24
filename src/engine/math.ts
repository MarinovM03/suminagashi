import * as THREE from 'three';

export function inkAbsorption(c: THREE.Color, strength: number): THREE.Vector3 {
  const e = 0.012;
  return new THREE.Vector3(
    -Math.log(Math.max(c.r, e)) * strength,
    -Math.log(Math.max(c.g, e)) * strength,
    -Math.log(Math.max(c.b, e)) * strength,
  );
}

export function aspectCorrectedDelta(dx: number, dy: number, aspect: number): [number, number] {
  return aspect < 1 ? [dx * aspect, dy] : [dx, dy / aspect];
}

export function computeSimSizes(w: number, h: number, simRes: number, dyeRes: number) {
  const aspect = w / h;
  const dye = Math.min(dyeRes, Math.max(w, h));
  return aspect >= 1
    ? { sw: Math.round(simRes * aspect), sh: simRes, dw: dye, dh: Math.round(dye / aspect) }
    : { sw: simRes, sh: Math.round(simRes / aspect), dw: Math.round(dye * aspect), dh: dye };
}
