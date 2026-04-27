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

