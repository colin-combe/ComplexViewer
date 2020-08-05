export const svgns = "http://www.w3.org/2000/svg";//, // namespace for svg elements
//     xlinkNS: 'http://www.w3.org/1999/xlink', // namespace for xlink, for use/defs elements

export const LABEL_Y = -5; // todo this isn't needed
//     selectedColour: '#ffff99',
//
//     Polymer: {
//         STICKHEIGHT: 20,
//         MAXSIZE: 20,
//         transitionTime: 650
//     }
// };
export function rotatePointAboutPoint (p, o, theta) {
    theta = (theta / 360) * Math.PI * 2; //TODO: change theta arg to radians not degrees
    const rx = Math.cos(theta) * (p[0] - o[0]) - Math.sin(theta) * (p[1] - o[1]) + o[0];
    const ry = Math.sin(theta) * (p[0] - o[0]) + Math.cos(theta) * (p[1] - o[1]) + o[1];
    return [rx, ry];
}