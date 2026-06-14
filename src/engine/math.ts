import * as THREE from 'three';

// Display color → absorbance vector: the denser the ink, the closer
// paper × exp(-A) gets to the ink color (Beer-Lambert subtractive mixing).
export function inkAbsorption(c: THREE.Color, strength: number): THREE.Vector3 {
  const e = 0.012;
  return new THREE.Vector3(
    -Math.log(Math.max(c.r, e)) * strength,
    -Math.log(Math.max(c.g, e)) * strength,
    -Math.log(Math.max(c.b, e)) * strength,
  );
}

// Resolution of the velocity (sim) and dye fields for a given viewport. The
// short edge of the velocity field is fixed; the dye field is capped at dyeRes.
export function computeSimSizes(w: number, h: number, simRes: number, dyeRes: number) {
  const aspect = w / h;
  const dye = Math.min(dyeRes, Math.max(w, h));
  return aspect >= 1
    ? { sw: Math.round(simRes * aspect), sh: simRes, dw: dye, dh: Math.round(dye / aspect) }
    : { sw: simRes, sh: Math.round(simRes / aspect), dw: Math.round(dye * aspect), dh: dye };
}
