/**
 * Física do globo e do chip do hero. Portada da referência orbit-delivery-hero (stepPlanet, stepGlobeMotion,
 * stepSurface) e adaptada: o chip busca o topo visível do globo puxado um pouco para a câmera (para o topo do
 * chip, com o "df", aparecer), e em reduced motion o arrasto é criticamente amortecido (sem balanço).
 * Tudo roda em sub-passos fixos de 1/120 s (ver hero-globe.tsx).
 */
import { Euler, MathUtils, Quaternion, Vector3 } from "three";

export const STEP = 1 / 120;
/** Distância percorrida por ciclo de passada (unidades do globo, raio 2.25) */
export const GAIT_DISTANCE = 0.2;
/** Segundos sem interação até entrar a rotação automática */
export const ROAM_DELAY = 3.5;

export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
export const damp = (v: number, target: number, lambda: number, dt: number) =>
  v + (target - v) * (1 - Math.exp(-lambda * dt));
export const smoothstep = (v: number, min: number, max: number) => {
  const t = clamp((v - min) / (max - min), 0, 1);
  return t * t * (3 - 2 * t);
};

export type Motion = {
  time: number;
  lastInteraction: number;
  dragging: boolean;
  planetAngle: number;
  planetVelocity: number;
  dragTarget: number;
  pitchAngle: number;
  pitchVelocity: number;
  pitchTarget: number;
  /** 0 parado, 1 andando (suavizado) */
  activity: number;
  /** fase do ciclo de passada (rad) */
  phase: number;
  /** velocidade do chip na superfície (rad/s) */
  speed: number;
  /** direção de andar e direção da câmera, no referencial local do chip */
  heading: number;
  cameraHeading: number;
};

export function createMotion(): Motion {
  return {
    time: 0,
    lastInteraction: -ROAM_DELAY,
    dragging: false,
    planetAngle: 0,
    planetVelocity: 0,
    dragTarget: 0,
    pitchAngle: 0,
    pitchVelocity: 0,
    pitchTarget: 0,
    activity: 0,
    phase: 0,
    speed: 0,
    heading: 0,
    cameraHeading: 0,
  };
}

/** Giro principal (arrasto horizontal): mola durante o arrasto, inércia amortecida depois, roaming quando ocioso. */
function stepPlanet(m: Motion, dt: number, auto: boolean, reduced: boolean, roamVelocity: number) {
  m.time += dt;
  if (!auto) {
    m.dragging = false;
    m.planetVelocity = m.pitchVelocity = 0;
    m.dragTarget = m.planetAngle;
    m.pitchTarget = m.pitchAngle;
    return;
  }
  if (m.dragging) {
    // reduced: rigidez alta e amortecimento crítico (2*sqrt(k)) => segue o dedo sem balançar
    const [k, c] = reduced ? [400, 40] : [90, 18];
    m.planetVelocity += (k * (m.dragTarget - m.planetAngle) - c * m.planetVelocity) * dt;
  } else {
    const idle = m.time - m.lastInteraction > ROAM_DELAY;
    const desired = !reduced && idle ? roamVelocity : 0;
    m.planetVelocity = damp(m.planetVelocity, desired, reduced ? 12 : 5, dt);
  }
  m.planetVelocity = clamp(m.planetVelocity, -1.15, 1.15);
  m.planetAngle += m.planetVelocity * dt;
}

export type Globe = {
  orientation: Quaternion;
  delta: Quaternion;
  angular: Vector3;
  /** fase do passeio automático */
  route: number;
};

export function createGlobe(): Globe {
  return {
    orientation: new Quaternion().setFromEuler(new Euler(0.1, 0.5, 0)),
    delta: new Quaternion(),
    angular: new Vector3(),
    route: 0,
  };
}

/** Orientação do globo em dois eixos (giro + inclinação), integrada como velocidade angular. */
export function stepGlobe(g: Globe, m: Motion, dt: number, auto: boolean, reduced: boolean) {
  const roaming = auto && !reduced && !m.dragging && m.time - m.lastInteraction > ROAM_DELAY;
  // Passeio orgânico: a velocidade de giro e a de inclinação oscilam defasadas, sem tranco
  if (roaming) g.route += 0.24 * dt;
  stepPlanet(m, dt, auto, reduced, -0.24 * Math.cos(g.route));
  if (!auto) {
    g.angular.set(0, 0, 0);
    return;
  }
  if (m.dragging) {
    const [k, c] = reduced ? [400, 40] : [70, 17];
    m.pitchVelocity += (k * (m.pitchTarget - m.pitchAngle) - c * m.pitchVelocity) * dt;
  } else {
    m.pitchVelocity = MathUtils.damp(m.pitchVelocity, roaming ? 0.24 * Math.sin(g.route) : 0, reduced ? 12 : 6, dt);
  }
  m.pitchVelocity = clamp(m.pitchVelocity, -0.55, 0.55);
  m.pitchAngle += m.pitchVelocity * dt;

  g.angular.set(m.pitchVelocity, m.planetVelocity * 0.45, -m.planetVelocity);
  const speed = g.angular.length();
  if (speed > 1e-8) {
    g.delta.setFromAxisAngle(g.angular.multiplyScalar(1 / speed), speed * dt);
    g.orientation.premultiply(g.delta).normalize();
  }
}

export type Surface = {
  /** posição do chip na superfície (direção unitária, referencial local do globo) */
  current: Vector3;
  target: Vector3;
  velocity: Vector3;
  error: Vector3;
  worldNormal: Vector3;
  worldVelocity: Vector3;
  inverse: Quaternion;
  initialized: boolean;
};

export function createSurface(): Surface {
  return {
    current: new Vector3(0, 1, 0),
    target: new Vector3(0, 1, 0),
    velocity: new Vector3(),
    error: new Vector3(),
    worldNormal: new Vector3(),
    worldVelocity: new Vector3(),
    inverse: new Quaternion(),
    initialized: false,
  };
}

/**
 * O chip persegue, com mola sobre a esfera, o ponto do globo que está no "topo" da tela (desiredUp, em
 * coordenadas do mundo). Como o globo gira embaixo dele, isso vira caminhada.
 */
export function stepSurface(
  s: Surface,
  m: Motion,
  rotation: Quaternion,
  desiredUp: Vector3,
  dt: number,
  reduced: boolean,
  paused: boolean,
) {
  s.inverse.copy(rotation).invert();
  s.target.copy(desiredUp).applyQuaternion(s.inverse).normalize();
  if (!s.initialized) {
    s.current.copy(s.target);
    s.initialized = true;
  }
  if (paused) {
    s.velocity.set(0, 0, 0);
    s.worldVelocity.set(0, 0, 0);
    s.worldNormal.copy(s.current).applyQuaternion(rotation);
    m.speed = 0;
    m.activity = damp(m.activity, 0, 10, dt);
    return;
  }

  // Erro angular tangente à esfera, na direção do alvo
  const cosine = clamp(s.current.dot(s.target), -1, 1);
  const angle = Math.acos(cosine);
  s.error.copy(s.target).addScaledVector(s.current, -cosine);
  if (s.error.lengthSq() > 1e-12) s.error.normalize().multiplyScalar(angle);

  // reduced: 110 / 21 ~ amortecimento crítico (sem balanço)
  const stiffness = reduced ? 110 : 48;
  const damping = reduced ? 21 : 11;
  s.velocity.addScaledVector(s.error, stiffness * dt).multiplyScalar(Math.exp(-damping * dt));
  s.velocity.addScaledVector(s.current, -s.velocity.dot(s.current));
  s.current.addScaledVector(s.velocity, dt).normalize();
  s.velocity.addScaledVector(s.current, -s.velocity.dot(s.current));

  s.worldNormal.copy(s.current).applyQuaternion(rotation);
  s.worldVelocity.copy(s.velocity).applyQuaternion(rotation);

  m.speed = s.velocity.length();
  m.activity = damp(m.activity, smoothstep(m.speed, 0.004, 0.022), 9, dt);
  // A passada acompanha a distância percorrida (raio 2.25): mais rápido => ciclo mais rápido
  m.phase += ((m.speed * 2.25) / GAIT_DISTANCE) * Math.PI * 2 * dt;
}

const scratch = { inverse: new Quaternion(), local: new Vector3(), front: new Vector3() };

/**
 * Direções no referencial local do chip (orientado pela normal da superfície): para onde ele anda e onde está a
 * câmera (ortográfica, olhando -Z). Usadas para virar o chip no sentido da caminhada e, pausado, de frente para nós.
 */
export function updateHeadings(m: Motion, runner: Quaternion, worldVelocity: Vector3) {
  scratch.inverse.copy(runner).invert();
  if (worldVelocity.lengthSq() > 1e-6) {
    scratch.local.copy(worldVelocity).applyQuaternion(scratch.inverse);
    m.heading = Math.atan2(scratch.local.x, scratch.local.z);
  }
  scratch.front.set(0, 0, 1).applyQuaternion(scratch.inverse);
  m.cameraHeading = Math.atan2(scratch.front.x, scratch.front.z);
}
