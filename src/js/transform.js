// Taken from https://stackoverflow.com/a/38230545/11028828
export function transform(transform) {
    // Create a dummy g for calculation purposes only. This will never
    // be appended to the DOM and will be discarded once this function
    // returns.
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

    // Set the transform attribute to the provided string value.
    g.setAttributeNS(null, "transform", transform);

    // consolidate the SVGTransformList containing all transformations
    // to a single SVGTransform of type SVG_TRANSFORM_MATRIX and get
    // its SVGMatrix.
    const matrix = g.transform.baseVal.consolidate().matrix;

    // Below calculations are taken and adapted from the private function
    // transform/decompose.js of D3's module d3-interpolate.
    let {a, b, c, d, e, f} = matrix;   // ES6, if this doesn't work, use below assignment
    // var a=matrix.a, b=matrix.b, c=matrix.c, d=matrix.d, e=matrix.e, f=matrix.f; // ES5
    let scaleX = Math.sqrt(a * a + b * b),
        scaleY = Math.sqrt(c * c + d * d),
        skewX = a * c + b * d;
    if (scaleX) {
        a /= scaleX;
        b /= scaleX;
    }
    if (skewX) {
        c -= a * skewX;
        d -= b * skewX;
    }
    if (scaleY) {
        c /= scaleY;
        d /= scaleY;
        skewX /= scaleY;
    }
    if (a * d < b * c) {
        a = -a;
        b = -b;
        skewX = -skewX;
        scaleX = -scaleX;
    }
    return {
        translate: [e,f],
        translateX: e,
        translateY: f,
        rotate: Math.atan2(b, a) * 180 / Math.PI,
        skewX: Math.atan(skewX) * 180 / Math.PI,
        scaleX: scaleX,
        scaleY: scaleY
    };
}
