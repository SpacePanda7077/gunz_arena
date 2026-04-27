export function Between(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
export function Normalize(x: number, y: number) {
  const length = Math.sqrt(x * x + y * y);

  if (length === 0) {
    return { x: 0, y: 0 };
  }

  return {
    x: x / length,
    y: y / length,
  };
}

export function DotProduct(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  return a.x * b.x + a.y * b.y;
}

export function AngleBetween(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  return Math.atan2(y2 - y1, x2 - x1);
}

export function Clamp(value: number, minValue: number, maxValue: number) {
  let tempValue = value;
  if (tempValue > maxValue) {
    tempValue = maxValue;
  } else if (tempValue < minValue) {
    tempValue = minValue;
  } else {
    tempValue = value;
  }
  return tempValue;
}
export function DistanceBetween(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;

  return Math.sqrt(dx * dx + dy * dy);
}

// keep angle between -PI and PI
function normalizeAngle(angle: number) {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

// shortest difference between two angles
export function AngleDifference(current: number, target: number) {
  return normalizeAngle(target - current);
}

// rotate current angle toward target angle
export function RotateToward(current: number, target: number, maxStep: number) {
  let diff = AngleDifference(current, target);

  if (Math.abs(diff) <= maxStep) {
    return target;
  }

  return current + Math.sign(diff) * maxStep;
}

export function GetRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  // The maximum is exclusive and the minimum is inclusive
  return Math.floor(Math.random() * (max - min) + min);
}
