export function rotatePointAboutPoint (p, o, theta) {
    theta = (theta / 360) * Math.PI * 2; //TODO: change theta arg to radians not degrees
    const rx = Math.cos(theta) * (p[0] - o[0]) - Math.sin(theta) * (p[1] - o[1]) + o[0];
    const ry = Math.sin(theta) * (p[0] - o[0]) + Math.cos(theta) * (p[1] - o[1]) + o[1];
    return [rx, ry];
}