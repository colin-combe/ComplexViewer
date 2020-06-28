(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.cola = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./src/adaptor"));
__export(require("./src/d3adaptor"));
__export(require("./src/descent"));
__export(require("./src/geom"));
__export(require("./src/gridrouter"));
__export(require("./src/handledisconnected"));
__export(require("./src/layout"));
__export(require("./src/layout3d"));
__export(require("./src/linklengths"));
__export(require("./src/powergraph"));
__export(require("./src/pqueue"));
__export(require("./src/rbtree"));
__export(require("./src/rectangle"));
__export(require("./src/shortestpaths"));
__export(require("./src/vpsc"));
__export(require("./src/batch"));

},{"./src/adaptor":2,"./src/batch":3,"./src/d3adaptor":4,"./src/descent":7,"./src/geom":8,"./src/gridrouter":9,"./src/handledisconnected":10,"./src/layout":11,"./src/layout3d":12,"./src/linklengths":13,"./src/powergraph":14,"./src/pqueue":15,"./src/rbtree":16,"./src/rectangle":17,"./src/shortestpaths":18,"./src/vpsc":19}],2:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var layout_1 = require("./layout");
var LayoutAdaptor = (function (_super) {
    __extends(LayoutAdaptor, _super);
    function LayoutAdaptor(options) {
        var _this = _super.call(this) || this;
        var self = _this;
        var o = options;
        if (o.trigger) {
            _this.trigger = o.trigger;
        }
        if (o.kick) {
            _this.kick = o.kick;
        }
        if (o.drag) {
            _this.drag = o.drag;
        }
        if (o.on) {
            _this.on = o.on;
        }
        _this.dragstart = _this.dragStart = layout_1.Layout.dragStart;
        _this.dragend = _this.dragEnd = layout_1.Layout.dragEnd;
        return _this;
    }
    LayoutAdaptor.prototype.trigger = function (e) { };
    ;
    LayoutAdaptor.prototype.kick = function () { };
    ;
    LayoutAdaptor.prototype.drag = function () { };
    ;
    LayoutAdaptor.prototype.on = function (eventType, listener) { return this; };
    ;
    return LayoutAdaptor;
}(layout_1.Layout));
exports.LayoutAdaptor = LayoutAdaptor;
function adaptor(options) {
    return new LayoutAdaptor(options);
}
exports.adaptor = adaptor;

},{"./layout":11}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var layout_1 = require("./layout");
var gridrouter_1 = require("./gridrouter");
function gridify(pgLayout, nudgeGap, margin, groupMargin) {
    pgLayout.cola.start(0, 0, 0, 10, false);
    var gridrouter = route(pgLayout.cola.nodes(), pgLayout.cola.groups(), margin, groupMargin);
    return gridrouter.routeEdges(pgLayout.powerGraph.powerEdges, nudgeGap, function (e) { return e.source.routerNode.id; }, function (e) { return e.target.routerNode.id; });
}
exports.gridify = gridify;
function route(nodes, groups, margin, groupMargin) {
    nodes.forEach(function (d) {
        d.routerNode = {
            name: d.name,
            bounds: d.bounds.inflate(-margin)
        };
    });
    groups.forEach(function (d) {
        d.routerNode = {
            bounds: d.bounds.inflate(-groupMargin),
            children: (typeof d.groups !== 'undefined' ? d.groups.map(function (c) { return nodes.length + c.id; }) : [])
                .concat(typeof d.leaves !== 'undefined' ? d.leaves.map(function (c) { return c.index; }) : [])
        };
    });
    var gridRouterNodes = nodes.concat(groups).map(function (d, i) {
        d.routerNode.id = i;
        return d.routerNode;
    });
    return new gridrouter_1.GridRouter(gridRouterNodes, {
        getChildren: function (v) { return v.children; },
        getBounds: function (v) { return v.bounds; }
    }, margin - groupMargin);
}
function powerGraphGridLayout(graph, size, grouppadding) {
    var powerGraph;
    graph.nodes.forEach(function (v, i) { return v.index = i; });
    new layout_1.Layout()
        .avoidOverlaps(false)
        .nodes(graph.nodes)
        .links(graph.links)
        .powerGraphGroups(function (d) {
        powerGraph = d;
        powerGraph.groups.forEach(function (v) { return v.padding = grouppadding; });
    });
    var n = graph.nodes.length;
    var edges = [];
    var vs = graph.nodes.slice(0);
    vs.forEach(function (v, i) { return v.index = i; });
    powerGraph.groups.forEach(function (g) {
        var sourceInd = g.index = g.id + n;
        vs.push(g);
        if (typeof g.leaves !== 'undefined')
            g.leaves.forEach(function (v) { return edges.push({ source: sourceInd, target: v.index }); });
        if (typeof g.groups !== 'undefined')
            g.groups.forEach(function (gg) { return edges.push({ source: sourceInd, target: gg.id + n }); });
    });
    powerGraph.powerEdges.forEach(function (e) {
        edges.push({ source: e.source.index, target: e.target.index });
    });
    new layout_1.Layout()
        .size(size)
        .nodes(vs)
        .links(edges)
        .avoidOverlaps(false)
        .linkDistance(30)
        .symmetricDiffLinkLengths(5)
        .convergenceThreshold(1e-4)
        .start(100, 0, 0, 0, false);
    return {
        cola: new layout_1.Layout()
            .convergenceThreshold(1e-3)
            .size(size)
            .avoidOverlaps(true)
            .nodes(graph.nodes)
            .links(graph.links)
            .groupCompactness(1e-4)
            .linkDistance(30)
            .symmetricDiffLinkLengths(5)
            .powerGraphGroups(function (d) {
            powerGraph = d;
            powerGraph.groups.forEach(function (v) {
                v.padding = grouppadding;
            });
        }).start(50, 0, 100, 0, false),
        powerGraph: powerGraph
    };
}
exports.powerGraphGridLayout = powerGraphGridLayout;

},{"./gridrouter":9,"./layout":11}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var d3v3 = require("./d3v3adaptor");
var d3v4 = require("./d3v4adaptor");
;
function d3adaptor(d3Context) {
    if (!d3Context || isD3V3(d3Context)) {
        return new d3v3.D3StyleLayoutAdaptor();
    }
    return new d3v4.D3StyleLayoutAdaptor(d3Context);
}
exports.d3adaptor = d3adaptor;
function isD3V3(d3Context) {
    var v3exp = /^3\./;
    return d3Context.version && d3Context.version.match(v3exp) !== null;
}

},{"./d3v3adaptor":5,"./d3v4adaptor":6}],5:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var layout_1 = require("./layout");
var D3StyleLayoutAdaptor = (function (_super) {
    __extends(D3StyleLayoutAdaptor, _super);
    function D3StyleLayoutAdaptor() {
        var _this = _super.call(this) || this;
        _this.event = d3.dispatch(layout_1.EventType[layout_1.EventType.start], layout_1.EventType[layout_1.EventType.tick], layout_1.EventType[layout_1.EventType.end]);
        var d3layout = _this;
        var drag;
        _this.drag = function () {
            if (!drag) {
                var drag = d3.behavior.drag()
                    .origin(layout_1.Layout.dragOrigin)
                    .on("dragstart.d3adaptor", layout_1.Layout.dragStart)
                    .on("drag.d3adaptor", function (d) {
                    layout_1.Layout.drag(d, d3.event);
                    d3layout.resume();
                })
                    .on("dragend.d3adaptor", layout_1.Layout.dragEnd);
            }
            if (!arguments.length)
                return drag;
            this
                .call(drag);
        };
        return _this;
    }
    D3StyleLayoutAdaptor.prototype.trigger = function (e) {
        var d3event = { type: layout_1.EventType[e.type], alpha: e.alpha, stress: e.stress };
        this.event[d3event.type](d3event);
    };
    D3StyleLayoutAdaptor.prototype.kick = function () {
        var _this = this;
        d3.timer(function () { return _super.prototype.tick.call(_this); });
    };
    D3StyleLayoutAdaptor.prototype.on = function (eventType, listener) {
        if (typeof eventType === 'string') {
            this.event.on(eventType, listener);
        }
        else {
            this.event.on(layout_1.EventType[eventType], listener);
        }
        return this;
    };
    return D3StyleLayoutAdaptor;
}(layout_1.Layout));
exports.D3StyleLayoutAdaptor = D3StyleLayoutAdaptor;
function d3adaptor() {
    return new D3StyleLayoutAdaptor();
}
exports.d3adaptor = d3adaptor;

},{"./layout":11}],6:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var layout_1 = require("./layout");
var D3StyleLayoutAdaptor = (function (_super) {
    __extends(D3StyleLayoutAdaptor, _super);
    function D3StyleLayoutAdaptor(d3Context) {
        var _this = _super.call(this) || this;
        _this.d3Context = d3Context;
        _this.event = d3Context.dispatch(layout_1.EventType[layout_1.EventType.start], layout_1.EventType[layout_1.EventType.tick], layout_1.EventType[layout_1.EventType.end]);
        var d3layout = _this;
        var drag;
        _this.drag = function () {
            if (!drag) {
                var drag = d3Context.drag()
                    .subject(layout_1.Layout.dragOrigin)
                    .on("start.d3adaptor", layout_1.Layout.dragStart)
                    .on("drag.d3adaptor", function (d) {
                    layout_1.Layout.drag(d, d3Context.event);
                    d3layout.resume();
                })
                    .on("end.d3adaptor", layout_1.Layout.dragEnd);
            }
            if (!arguments.length)
                return drag;
            arguments[0].call(drag);
        };
        return _this;
    }
    D3StyleLayoutAdaptor.prototype.trigger = function (e) {
        var d3event = { type: layout_1.EventType[e.type], alpha: e.alpha, stress: e.stress };
        this.event.call(d3event.type, d3event);
    };
    D3StyleLayoutAdaptor.prototype.kick = function () {
        var _this = this;
        var t = this.d3Context.timer(function () { return _super.prototype.tick.call(_this) && t.stop(); });
    };
    D3StyleLayoutAdaptor.prototype.on = function (eventType, listener) {
        if (typeof eventType === 'string') {
            this.event.on(eventType, listener);
        }
        else {
            this.event.on(layout_1.EventType[eventType], listener);
        }
        return this;
    };
    return D3StyleLayoutAdaptor;
}(layout_1.Layout));
exports.D3StyleLayoutAdaptor = D3StyleLayoutAdaptor;

},{"./layout":11}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Locks = (function () {
    function Locks() {
        this.locks = {};
    }
    Locks.prototype.add = function (id, x) {
        this.locks[id] = x;
    };
    Locks.prototype.clear = function () {
        this.locks = {};
    };
    Locks.prototype.isEmpty = function () {
        for (var l in this.locks)
            return false;
        return true;
    };
    Locks.prototype.apply = function (f) {
        for (var l in this.locks) {
            f(Number(l), this.locks[l]);
        }
    };
    return Locks;
}());
exports.Locks = Locks;
var Descent = (function () {
    function Descent(x, D, G) {
        if (G === void 0) { G = null; }
        this.D = D;
        this.G = G;
        this.threshold = 0.0001;
        this.numGridSnapNodes = 0;
        this.snapGridSize = 100;
        this.snapStrength = 1000;
        this.scaleSnapByMaxH = false;
        this.random = new PseudoRandom();
        this.project = null;
        this.x = x;
        this.k = x.length;
        var n = this.n = x[0].length;
        this.H = new Array(this.k);
        this.g = new Array(this.k);
        this.Hd = new Array(this.k);
        this.a = new Array(this.k);
        this.b = new Array(this.k);
        this.c = new Array(this.k);
        this.d = new Array(this.k);
        this.e = new Array(this.k);
        this.ia = new Array(this.k);
        this.ib = new Array(this.k);
        this.xtmp = new Array(this.k);
        this.locks = new Locks();
        this.minD = Number.MAX_VALUE;
        var i = n, j;
        while (i--) {
            j = n;
            while (--j > i) {
                var d = D[i][j];
                if (d > 0 && d < this.minD) {
                    this.minD = d;
                }
            }
        }
        if (this.minD === Number.MAX_VALUE)
            this.minD = 1;
        i = this.k;
        while (i--) {
            this.g[i] = new Array(n);
            this.H[i] = new Array(n);
            j = n;
            while (j--) {
                this.H[i][j] = new Array(n);
            }
            this.Hd[i] = new Array(n);
            this.a[i] = new Array(n);
            this.b[i] = new Array(n);
            this.c[i] = new Array(n);
            this.d[i] = new Array(n);
            this.e[i] = new Array(n);
            this.ia[i] = new Array(n);
            this.ib[i] = new Array(n);
            this.xtmp[i] = new Array(n);
        }
    }
    Descent.createSquareMatrix = function (n, f) {
        var M = new Array(n);
        for (var i = 0; i < n; ++i) {
            M[i] = new Array(n);
            for (var j = 0; j < n; ++j) {
                M[i][j] = f(i, j);
            }
        }
        return M;
    };
    Descent.prototype.offsetDir = function () {
        var _this = this;
        var u = new Array(this.k);
        var l = 0;
        for (var i = 0; i < this.k; ++i) {
            var x = u[i] = this.random.getNextBetween(0.01, 1) - 0.5;
            l += x * x;
        }
        l = Math.sqrt(l);
        return u.map(function (x) { return x *= _this.minD / l; });
    };
    Descent.prototype.computeDerivatives = function (x) {
        var _this = this;
        var n = this.n;
        if (n < 1)
            return;
        var i;
        var d = new Array(this.k);
        var d2 = new Array(this.k);
        var Huu = new Array(this.k);
        var maxH = 0;
        for (var u_1 = 0; u_1 < n; ++u_1) {
            for (i = 0; i < this.k; ++i)
                Huu[i] = this.g[i][u_1] = 0;
            for (var v = 0; v < n; ++v) {
                if (u_1 === v)
                    continue;
                var maxDisplaces = n;
                var distanceSquared = 0;
                while (maxDisplaces--) {
                    distanceSquared = 0;
                    for (i = 0; i < this.k; ++i) {
                        var dx_1 = d[i] = x[i][u_1] - x[i][v];
                        distanceSquared += d2[i] = dx_1 * dx_1;
                    }
                    if (distanceSquared > 1e-9)
                        break;
                    var rd = this.offsetDir();
                    for (i = 0; i < this.k; ++i)
                        x[i][v] += rd[i];
                }
                var distance = Math.sqrt(distanceSquared);
                var idealDistance = this.D[u_1][v];
                var weight = this.G != null ? this.G[u_1][v] : 1;
                if (weight > 1 && distance > idealDistance || !isFinite(idealDistance)) {
                    for (i = 0; i < this.k; ++i)
                        this.H[i][u_1][v] = 0;
                    continue;
                }
                if (weight > 1) {
                    weight = 1;
                }
                var idealDistSquared = idealDistance * idealDistance, gs = 2 * weight * (distance - idealDistance) / (idealDistSquared * distance), distanceCubed = distanceSquared * distance, hs = 2 * -weight / (idealDistSquared * distanceCubed);
                if (!isFinite(gs))
                    console.log(gs);
                for (i = 0; i < this.k; ++i) {
                    this.g[i][u_1] += d[i] * gs;
                    Huu[i] -= this.H[i][u_1][v] = hs * (2 * distanceCubed + idealDistance * (d2[i] - distanceSquared));
                }
            }
            for (i = 0; i < this.k; ++i)
                maxH = Math.max(maxH, this.H[i][u_1][u_1] = Huu[i]);
        }
        var r = this.snapGridSize / 2;
        var g = this.snapGridSize;
        var w = this.snapStrength;
        var k = w / (r * r);
        var numNodes = this.numGridSnapNodes;
        for (var u = 0; u < numNodes; ++u) {
            for (i = 0; i < this.k; ++i) {
                var xiu = this.x[i][u];
                var m = xiu / g;
                var f = m % 1;
                var q = m - f;
                var a = Math.abs(f);
                var dx = (a <= 0.5) ? xiu - q * g :
                    (xiu > 0) ? xiu - (q + 1) * g : xiu - (q - 1) * g;
                if (-r < dx && dx <= r) {
                    if (this.scaleSnapByMaxH) {
                        this.g[i][u] += maxH * k * dx;
                        this.H[i][u][u] += maxH * k;
                    }
                    else {
                        this.g[i][u] += k * dx;
                        this.H[i][u][u] += k;
                    }
                }
            }
        }
        if (!this.locks.isEmpty()) {
            this.locks.apply(function (u, p) {
                for (i = 0; i < _this.k; ++i) {
                    _this.H[i][u][u] += maxH;
                    _this.g[i][u] -= maxH * (p[i] - x[i][u]);
                }
            });
        }
    };
    Descent.dotProd = function (a, b) {
        var x = 0, i = a.length;
        while (i--)
            x += a[i] * b[i];
        return x;
    };
    Descent.rightMultiply = function (m, v, r) {
        var i = m.length;
        while (i--)
            r[i] = Descent.dotProd(m[i], v);
    };
    Descent.prototype.computeStepSize = function (d) {
        var numerator = 0, denominator = 0;
        for (var i = 0; i < this.k; ++i) {
            numerator += Descent.dotProd(this.g[i], d[i]);
            Descent.rightMultiply(this.H[i], d[i], this.Hd[i]);
            denominator += Descent.dotProd(d[i], this.Hd[i]);
        }
        if (denominator === 0 || !isFinite(denominator))
            return 0;
        return 1 * numerator / denominator;
    };
    Descent.prototype.reduceStress = function () {
        this.computeDerivatives(this.x);
        var alpha = this.computeStepSize(this.g);
        for (var i = 0; i < this.k; ++i) {
            this.takeDescentStep(this.x[i], this.g[i], alpha);
        }
        return this.computeStress();
    };
    Descent.copy = function (a, b) {
        var m = a.length, n = b[0].length;
        for (var i = 0; i < m; ++i) {
            for (var j = 0; j < n; ++j) {
                b[i][j] = a[i][j];
            }
        }
    };
    Descent.prototype.stepAndProject = function (x0, r, d, stepSize) {
        Descent.copy(x0, r);
        this.takeDescentStep(r[0], d[0], stepSize);
        if (this.project)
            this.project[0](x0[0], x0[1], r[0]);
        this.takeDescentStep(r[1], d[1], stepSize);
        if (this.project)
            this.project[1](r[0], x0[1], r[1]);
        for (var i = 2; i < this.k; i++)
            this.takeDescentStep(r[i], d[i], stepSize);
    };
    Descent.mApply = function (m, n, f) {
        var i = m;
        while (i-- > 0) {
            var j = n;
            while (j-- > 0)
                f(i, j);
        }
    };
    Descent.prototype.matrixApply = function (f) {
        Descent.mApply(this.k, this.n, f);
    };
    Descent.prototype.computeNextPosition = function (x0, r) {
        var _this = this;
        this.computeDerivatives(x0);
        var alpha = this.computeStepSize(this.g);
        this.stepAndProject(x0, r, this.g, alpha);
        if (this.project) {
            this.matrixApply(function (i, j) { return _this.e[i][j] = x0[i][j] - r[i][j]; });
            var beta = this.computeStepSize(this.e);
            beta = Math.max(0.2, Math.min(beta, 1));
            this.stepAndProject(x0, r, this.e, beta);
        }
    };
    Descent.prototype.run = function (iterations) {
        var stress = Number.MAX_VALUE, converged = false;
        while (!converged && iterations-- > 0) {
            var s = this.rungeKutta();
            converged = Math.abs(stress / s - 1) < this.threshold;
            stress = s;
        }
        return stress;
    };
    Descent.prototype.rungeKutta = function () {
        var _this = this;
        this.computeNextPosition(this.x, this.a);
        Descent.mid(this.x, this.a, this.ia);
        this.computeNextPosition(this.ia, this.b);
        Descent.mid(this.x, this.b, this.ib);
        this.computeNextPosition(this.ib, this.c);
        this.computeNextPosition(this.c, this.d);
        var disp = 0;
        this.matrixApply(function (i, j) {
            var x = (_this.a[i][j] + 2.0 * _this.b[i][j] + 2.0 * _this.c[i][j] + _this.d[i][j]) / 6.0, d = _this.x[i][j] - x;
            disp += d * d;
            _this.x[i][j] = x;
        });
        return disp;
    };
    Descent.mid = function (a, b, m) {
        Descent.mApply(a.length, a[0].length, function (i, j) {
            return m[i][j] = a[i][j] + (b[i][j] - a[i][j]) / 2.0;
        });
    };
    Descent.prototype.takeDescentStep = function (x, d, stepSize) {
        for (var i = 0; i < this.n; ++i) {
            x[i] = x[i] - stepSize * d[i];
        }
    };
    Descent.prototype.computeStress = function () {
        var stress = 0;
        for (var u = 0, nMinus1 = this.n - 1; u < nMinus1; ++u) {
            for (var v = u + 1, n = this.n; v < n; ++v) {
                var l = 0;
                for (var i = 0; i < this.k; ++i) {
                    var dx = this.x[i][u] - this.x[i][v];
                    l += dx * dx;
                }
                l = Math.sqrt(l);
                var d = this.D[u][v];
                if (!isFinite(d))
                    continue;
                var rl = d - l;
                var d2 = d * d;
                stress += rl * rl / d2;
            }
        }
        return stress;
    };
    Descent.zeroDistance = 1e-10;
    return Descent;
}());
exports.Descent = Descent;
var PseudoRandom = (function () {
    function PseudoRandom(seed) {
        if (seed === void 0) { seed = 1; }
        this.seed = seed;
        this.a = 214013;
        this.c = 2531011;
        this.m = 2147483648;
        this.range = 32767;
    }
    PseudoRandom.prototype.getNext = function () {
        this.seed = (this.seed * this.a + this.c) % this.m;
        return (this.seed >> 16) / this.range;
    };
    PseudoRandom.prototype.getNextBetween = function (min, max) {
        return min + this.getNext() * (max - min);
    };
    return PseudoRandom;
}());
exports.PseudoRandom = PseudoRandom;

},{}],8:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var rectangle_1 = require("./rectangle");
var Point = (function () {
    function Point() {
    }
    return Point;
}());
exports.Point = Point;
var LineSegment = (function () {
    function LineSegment(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }
    return LineSegment;
}());
exports.LineSegment = LineSegment;
var PolyPoint = (function (_super) {
    __extends(PolyPoint, _super);
    function PolyPoint() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return PolyPoint;
}(Point));
exports.PolyPoint = PolyPoint;
function isLeft(P0, P1, P2) {
    return (P1.x - P0.x) * (P2.y - P0.y) - (P2.x - P0.x) * (P1.y - P0.y);
}
exports.isLeft = isLeft;
function above(p, vi, vj) {
    return isLeft(p, vi, vj) > 0;
}
function below(p, vi, vj) {
    return isLeft(p, vi, vj) < 0;
}
function ConvexHull(S) {
    var P = S.slice(0).sort(function (a, b) { return a.x !== b.x ? b.x - a.x : b.y - a.y; });
    var n = S.length, i;
    var minmin = 0;
    var xmin = P[0].x;
    for (i = 1; i < n; ++i) {
        if (P[i].x !== xmin)
            break;
    }
    var minmax = i - 1;
    var H = [];
    H.push(P[minmin]);
    if (minmax === n - 1) {
        if (P[minmax].y !== P[minmin].y)
            H.push(P[minmax]);
    }
    else {
        var maxmin, maxmax = n - 1;
        var xmax = P[n - 1].x;
        for (i = n - 2; i >= 0; i--)
            if (P[i].x !== xmax)
                break;
        maxmin = i + 1;
        i = minmax;
        while (++i <= maxmin) {
            if (isLeft(P[minmin], P[maxmin], P[i]) >= 0 && i < maxmin)
                continue;
            while (H.length > 1) {
                if (isLeft(H[H.length - 2], H[H.length - 1], P[i]) > 0)
                    break;
                else
                    H.length -= 1;
            }
            if (i != minmin)
                H.push(P[i]);
        }
        if (maxmax != maxmin)
            H.push(P[maxmax]);
        var bot = H.length;
        i = maxmin;
        while (--i >= minmax) {
            if (isLeft(P[maxmax], P[minmax], P[i]) >= 0 && i > minmax)
                continue;
            while (H.length > bot) {
                if (isLeft(H[H.length - 2], H[H.length - 1], P[i]) > 0)
                    break;
                else
                    H.length -= 1;
            }
            if (i != minmin)
                H.push(P[i]);
        }
    }
    return H;
}
exports.ConvexHull = ConvexHull;
function clockwiseRadialSweep(p, P, f) {
    P.slice(0).sort(function (a, b) { return Math.atan2(a.y - p.y, a.x - p.x) - Math.atan2(b.y - p.y, b.x - p.x); }).forEach(f);
}
exports.clockwiseRadialSweep = clockwiseRadialSweep;
function nextPolyPoint(p, ps) {
    if (p.polyIndex === ps.length - 1)
        return ps[0];
    return ps[p.polyIndex + 1];
}
function prevPolyPoint(p, ps) {
    if (p.polyIndex === 0)
        return ps[ps.length - 1];
    return ps[p.polyIndex - 1];
}
function tangent_PointPolyC(P, V) {
    var Vclosed = V.slice(0);
    Vclosed.push(V[0]);
    return { rtan: Rtangent_PointPolyC(P, Vclosed), ltan: Ltangent_PointPolyC(P, Vclosed) };
}
function Rtangent_PointPolyC(P, V) {
    var n = V.length - 1;
    var a, b, c;
    var upA, dnC;
    if (below(P, V[1], V[0]) && !above(P, V[n - 1], V[0]))
        return 0;
    for (a = 0, b = n;;) {
        if (b - a === 1)
            if (above(P, V[a], V[b]))
                return a;
            else
                return b;
        c = Math.floor((a + b) / 2);
        dnC = below(P, V[c + 1], V[c]);
        if (dnC && !above(P, V[c - 1], V[c]))
            return c;
        upA = above(P, V[a + 1], V[a]);
        if (upA) {
            if (dnC)
                b = c;
            else {
                if (above(P, V[a], V[c]))
                    b = c;
                else
                    a = c;
            }
        }
        else {
            if (!dnC)
                a = c;
            else {
                if (below(P, V[a], V[c]))
                    b = c;
                else
                    a = c;
            }
        }
    }
}
function Ltangent_PointPolyC(P, V) {
    var n = V.length - 1;
    var a, b, c;
    var dnA, dnC;
    if (above(P, V[n - 1], V[0]) && !below(P, V[1], V[0]))
        return 0;
    for (a = 0, b = n;;) {
        if (b - a === 1)
            if (below(P, V[a], V[b]))
                return a;
            else
                return b;
        c = Math.floor((a + b) / 2);
        dnC = below(P, V[c + 1], V[c]);
        if (above(P, V[c - 1], V[c]) && !dnC)
            return c;
        dnA = below(P, V[a + 1], V[a]);
        if (dnA) {
            if (!dnC)
                b = c;
            else {
                if (below(P, V[a], V[c]))
                    b = c;
                else
                    a = c;
            }
        }
        else {
            if (dnC)
                a = c;
            else {
                if (above(P, V[a], V[c]))
                    b = c;
                else
                    a = c;
            }
        }
    }
}
function tangent_PolyPolyC(V, W, t1, t2, cmp1, cmp2) {
    var ix1, ix2;
    ix1 = t1(W[0], V);
    ix2 = t2(V[ix1], W);
    var done = false;
    while (!done) {
        done = true;
        while (true) {
            if (ix1 === V.length - 1)
                ix1 = 0;
            if (cmp1(W[ix2], V[ix1], V[ix1 + 1]))
                break;
            ++ix1;
        }
        while (true) {
            if (ix2 === 0)
                ix2 = W.length - 1;
            if (cmp2(V[ix1], W[ix2], W[ix2 - 1]))
                break;
            --ix2;
            done = false;
        }
    }
    return { t1: ix1, t2: ix2 };
}
exports.tangent_PolyPolyC = tangent_PolyPolyC;
function LRtangent_PolyPolyC(V, W) {
    var rl = RLtangent_PolyPolyC(W, V);
    return { t1: rl.t2, t2: rl.t1 };
}
exports.LRtangent_PolyPolyC = LRtangent_PolyPolyC;
function RLtangent_PolyPolyC(V, W) {
    return tangent_PolyPolyC(V, W, Rtangent_PointPolyC, Ltangent_PointPolyC, above, below);
}
exports.RLtangent_PolyPolyC = RLtangent_PolyPolyC;
function LLtangent_PolyPolyC(V, W) {
    return tangent_PolyPolyC(V, W, Ltangent_PointPolyC, Ltangent_PointPolyC, below, below);
}
exports.LLtangent_PolyPolyC = LLtangent_PolyPolyC;
function RRtangent_PolyPolyC(V, W) {
    return tangent_PolyPolyC(V, W, Rtangent_PointPolyC, Rtangent_PointPolyC, above, above);
}
exports.RRtangent_PolyPolyC = RRtangent_PolyPolyC;
var BiTangent = (function () {
    function BiTangent(t1, t2) {
        this.t1 = t1;
        this.t2 = t2;
    }
    return BiTangent;
}());
exports.BiTangent = BiTangent;
var BiTangents = (function () {
    function BiTangents() {
    }
    return BiTangents;
}());
exports.BiTangents = BiTangents;
var TVGPoint = (function (_super) {
    __extends(TVGPoint, _super);
    function TVGPoint() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return TVGPoint;
}(Point));
exports.TVGPoint = TVGPoint;
var VisibilityVertex = (function () {
    function VisibilityVertex(id, polyid, polyvertid, p) {
        this.id = id;
        this.polyid = polyid;
        this.polyvertid = polyvertid;
        this.p = p;
        p.vv = this;
    }
    return VisibilityVertex;
}());
exports.VisibilityVertex = VisibilityVertex;
var VisibilityEdge = (function () {
    function VisibilityEdge(source, target) {
        this.source = source;
        this.target = target;
    }
    VisibilityEdge.prototype.length = function () {
        var dx = this.source.p.x - this.target.p.x;
        var dy = this.source.p.y - this.target.p.y;
        return Math.sqrt(dx * dx + dy * dy);
    };
    return VisibilityEdge;
}());
exports.VisibilityEdge = VisibilityEdge;
var TangentVisibilityGraph = (function () {
    function TangentVisibilityGraph(P, g0) {
        this.P = P;
        this.V = [];
        this.E = [];
        if (!g0) {
            var n = P.length;
            for (var i = 0; i < n; i++) {
                var p = P[i];
                for (var j = 0; j < p.length; ++j) {
                    var pj = p[j], vv = new VisibilityVertex(this.V.length, i, j, pj);
                    this.V.push(vv);
                    if (j > 0)
                        this.E.push(new VisibilityEdge(p[j - 1].vv, vv));
                }
                if (p.length > 1)
                    this.E.push(new VisibilityEdge(p[0].vv, p[p.length - 1].vv));
            }
            for (var i = 0; i < n - 1; i++) {
                var Pi = P[i];
                for (var j = i + 1; j < n; j++) {
                    var Pj = P[j], t = tangents(Pi, Pj);
                    for (var q in t) {
                        var c = t[q], source = Pi[c.t1], target = Pj[c.t2];
                        this.addEdgeIfVisible(source, target, i, j);
                    }
                }
            }
        }
        else {
            this.V = g0.V.slice(0);
            this.E = g0.E.slice(0);
        }
    }
    TangentVisibilityGraph.prototype.addEdgeIfVisible = function (u, v, i1, i2) {
        if (!this.intersectsPolys(new LineSegment(u.x, u.y, v.x, v.y), i1, i2)) {
            this.E.push(new VisibilityEdge(u.vv, v.vv));
        }
    };
    TangentVisibilityGraph.prototype.addPoint = function (p, i1) {
        var n = this.P.length;
        this.V.push(new VisibilityVertex(this.V.length, n, 0, p));
        for (var i = 0; i < n; ++i) {
            if (i === i1)
                continue;
            var poly = this.P[i], t = tangent_PointPolyC(p, poly);
            this.addEdgeIfVisible(p, poly[t.ltan], i1, i);
            this.addEdgeIfVisible(p, poly[t.rtan], i1, i);
        }
        return p.vv;
    };
    TangentVisibilityGraph.prototype.intersectsPolys = function (l, i1, i2) {
        for (var i = 0, n = this.P.length; i < n; ++i) {
            if (i != i1 && i != i2 && intersects(l, this.P[i]).length > 0) {
                return true;
            }
        }
        return false;
    };
    return TangentVisibilityGraph;
}());
exports.TangentVisibilityGraph = TangentVisibilityGraph;
function intersects(l, P) {
    var ints = [];
    for (var i = 1, n = P.length; i < n; ++i) {
        var int = rectangle_1.Rectangle.lineIntersection(l.x1, l.y1, l.x2, l.y2, P[i - 1].x, P[i - 1].y, P[i].x, P[i].y);
        if (int)
            ints.push(int);
    }
    return ints;
}
function tangents(V, W) {
    var m = V.length - 1, n = W.length - 1;
    var bt = new BiTangents();
    for (var i = 0; i <= m; ++i) {
        for (var j = 0; j <= n; ++j) {
            var v1 = V[i == 0 ? m : i - 1];
            var v2 = V[i];
            var v3 = V[i == m ? 0 : i + 1];
            var w1 = W[j == 0 ? n : j - 1];
            var w2 = W[j];
            var w3 = W[j == n ? 0 : j + 1];
            var v1v2w2 = isLeft(v1, v2, w2);
            var v2w1w2 = isLeft(v2, w1, w2);
            var v2w2w3 = isLeft(v2, w2, w3);
            var w1w2v2 = isLeft(w1, w2, v2);
            var w2v1v2 = isLeft(w2, v1, v2);
            var w2v2v3 = isLeft(w2, v2, v3);
            if (v1v2w2 >= 0 && v2w1w2 >= 0 && v2w2w3 < 0
                && w1w2v2 >= 0 && w2v1v2 >= 0 && w2v2v3 < 0) {
                bt.ll = new BiTangent(i, j);
            }
            else if (v1v2w2 <= 0 && v2w1w2 <= 0 && v2w2w3 > 0
                && w1w2v2 <= 0 && w2v1v2 <= 0 && w2v2v3 > 0) {
                bt.rr = new BiTangent(i, j);
            }
            else if (v1v2w2 <= 0 && v2w1w2 > 0 && v2w2w3 <= 0
                && w1w2v2 >= 0 && w2v1v2 < 0 && w2v2v3 >= 0) {
                bt.rl = new BiTangent(i, j);
            }
            else if (v1v2w2 >= 0 && v2w1w2 < 0 && v2w2w3 >= 0
                && w1w2v2 <= 0 && w2v1v2 > 0 && w2v2v3 <= 0) {
                bt.lr = new BiTangent(i, j);
            }
        }
    }
    return bt;
}
exports.tangents = tangents;
function isPointInsidePoly(p, poly) {
    for (var i = 1, n = poly.length; i < n; ++i)
        if (below(poly[i - 1], poly[i], p))
            return false;
    return true;
}
function isAnyPInQ(p, q) {
    return !p.every(function (v) { return !isPointInsidePoly(v, q); });
}
function polysOverlap(p, q) {
    if (isAnyPInQ(p, q))
        return true;
    if (isAnyPInQ(q, p))
        return true;
    for (var i = 1, n = p.length; i < n; ++i) {
        var v = p[i], u = p[i - 1];
        if (intersects(new LineSegment(u.x, u.y, v.x, v.y), q).length > 0)
            return true;
    }
    return false;
}
exports.polysOverlap = polysOverlap;

},{"./rectangle":17}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rectangle_1 = require("./rectangle");
var vpsc_1 = require("./vpsc");
var shortestpaths_1 = require("./shortestpaths");
var NodeWrapper = (function () {
    function NodeWrapper(id, rect, children) {
        this.id = id;
        this.rect = rect;
        this.children = children;
        this.leaf = typeof children === 'undefined' || children.length === 0;
    }
    return NodeWrapper;
}());
exports.NodeWrapper = NodeWrapper;
var Vert = (function () {
    function Vert(id, x, y, node, line) {
        if (node === void 0) { node = null; }
        if (line === void 0) { line = null; }
        this.id = id;
        this.x = x;
        this.y = y;
        this.node = node;
        this.line = line;
    }
    return Vert;
}());
exports.Vert = Vert;
var LongestCommonSubsequence = (function () {
    function LongestCommonSubsequence(s, t) {
        this.s = s;
        this.t = t;
        var mf = LongestCommonSubsequence.findMatch(s, t);
        var tr = t.slice(0).reverse();
        var mr = LongestCommonSubsequence.findMatch(s, tr);
        if (mf.length >= mr.length) {
            this.length = mf.length;
            this.si = mf.si;
            this.ti = mf.ti;
            this.reversed = false;
        }
        else {
            this.length = mr.length;
            this.si = mr.si;
            this.ti = t.length - mr.ti - mr.length;
            this.reversed = true;
        }
    }
    LongestCommonSubsequence.findMatch = function (s, t) {
        var m = s.length;
        var n = t.length;
        var match = { length: 0, si: -1, ti: -1 };
        var l = new Array(m);
        for (var i = 0; i < m; i++) {
            l[i] = new Array(n);
            for (var j = 0; j < n; j++)
                if (s[i] === t[j]) {
                    var v = l[i][j] = (i === 0 || j === 0) ? 1 : l[i - 1][j - 1] + 1;
                    if (v > match.length) {
                        match.length = v;
                        match.si = i - v + 1;
                        match.ti = j - v + 1;
                    }
                    ;
                }
                else
                    l[i][j] = 0;
        }
        return match;
    };
    LongestCommonSubsequence.prototype.getSequence = function () {
        return this.length >= 0 ? this.s.slice(this.si, this.si + this.length) : [];
    };
    return LongestCommonSubsequence;
}());
exports.LongestCommonSubsequence = LongestCommonSubsequence;
var GridRouter = (function () {
    function GridRouter(originalnodes, accessor, groupPadding) {
        var _this = this;
        if (groupPadding === void 0) { groupPadding = 12; }
        this.originalnodes = originalnodes;
        this.groupPadding = groupPadding;
        this.leaves = null;
        this.nodes = originalnodes.map(function (v, i) { return new NodeWrapper(i, accessor.getBounds(v), accessor.getChildren(v)); });
        this.leaves = this.nodes.filter(function (v) { return v.leaf; });
        this.groups = this.nodes.filter(function (g) { return !g.leaf; });
        this.cols = this.getGridLines('x');
        this.rows = this.getGridLines('y');
        this.groups.forEach(function (v) {
            return v.children.forEach(function (c) { return _this.nodes[c].parent = v; });
        });
        this.root = { children: [] };
        this.nodes.forEach(function (v) {
            if (typeof v.parent === 'undefined') {
                v.parent = _this.root;
                _this.root.children.push(v.id);
            }
            v.ports = [];
        });
        this.backToFront = this.nodes.slice(0);
        this.backToFront.sort(function (x, y) { return _this.getDepth(x) - _this.getDepth(y); });
        var frontToBackGroups = this.backToFront.slice(0).reverse().filter(function (g) { return !g.leaf; });
        frontToBackGroups.forEach(function (v) {
            var r = rectangle_1.Rectangle.empty();
            v.children.forEach(function (c) { return r = r.union(_this.nodes[c].rect); });
            v.rect = r.inflate(_this.groupPadding);
        });
        var colMids = this.midPoints(this.cols.map(function (r) { return r.pos; }));
        var rowMids = this.midPoints(this.rows.map(function (r) { return r.pos; }));
        var rowx = colMids[0], rowX = colMids[colMids.length - 1];
        var coly = rowMids[0], colY = rowMids[rowMids.length - 1];
        var hlines = this.rows.map(function (r) { return ({ x1: rowx, x2: rowX, y1: r.pos, y2: r.pos }); })
            .concat(rowMids.map(function (m) { return ({ x1: rowx, x2: rowX, y1: m, y2: m }); }));
        var vlines = this.cols.map(function (c) { return ({ x1: c.pos, x2: c.pos, y1: coly, y2: colY }); })
            .concat(colMids.map(function (m) { return ({ x1: m, x2: m, y1: coly, y2: colY }); }));
        var lines = hlines.concat(vlines);
        lines.forEach(function (l) { return l.verts = []; });
        this.verts = [];
        this.edges = [];
        hlines.forEach(function (h) {
            return vlines.forEach(function (v) {
                var p = new Vert(_this.verts.length, v.x1, h.y1);
                h.verts.push(p);
                v.verts.push(p);
                _this.verts.push(p);
                var i = _this.backToFront.length;
                while (i-- > 0) {
                    var node = _this.backToFront[i], r = node.rect;
                    var dx = Math.abs(p.x - r.cx()), dy = Math.abs(p.y - r.cy());
                    if (dx < r.width() / 2 && dy < r.height() / 2) {
                        p.node = node;
                        break;
                    }
                }
            });
        });
        lines.forEach(function (l, li) {
            _this.nodes.forEach(function (v, i) {
                v.rect.lineIntersections(l.x1, l.y1, l.x2, l.y2).forEach(function (intersect, j) {
                    var p = new Vert(_this.verts.length, intersect.x, intersect.y, v, l);
                    _this.verts.push(p);
                    l.verts.push(p);
                    v.ports.push(p);
                });
            });
            var isHoriz = Math.abs(l.y1 - l.y2) < 0.1;
            var delta = function (a, b) { return isHoriz ? b.x - a.x : b.y - a.y; };
            l.verts.sort(delta);
            for (var i = 1; i < l.verts.length; i++) {
                var u = l.verts[i - 1], v = l.verts[i];
                if (u.node && u.node === v.node && u.node.leaf)
                    continue;
                _this.edges.push({ source: u.id, target: v.id, length: Math.abs(delta(u, v)) });
            }
        });
    }
    GridRouter.prototype.avg = function (a) { return a.reduce(function (x, y) { return x + y; }) / a.length; };
    GridRouter.prototype.getGridLines = function (axis) {
        var columns = [];
        var ls = this.leaves.slice(0, this.leaves.length);
        while (ls.length > 0) {
            var overlapping = ls.filter(function (v) { return v.rect['overlap' + axis.toUpperCase()](ls[0].rect); });
            var col = {
                nodes: overlapping,
                pos: this.avg(overlapping.map(function (v) { return v.rect['c' + axis](); }))
            };
            columns.push(col);
            col.nodes.forEach(function (v) { return ls.splice(ls.indexOf(v), 1); });
        }
        columns.sort(function (a, b) { return a.pos - b.pos; });
        return columns;
    };
    GridRouter.prototype.getDepth = function (v) {
        var depth = 0;
        while (v.parent !== this.root) {
            depth++;
            v = v.parent;
        }
        return depth;
    };
    GridRouter.prototype.midPoints = function (a) {
        var gap = a[1] - a[0];
        var mids = [a[0] - gap / 2];
        for (var i = 1; i < a.length; i++) {
            mids.push((a[i] + a[i - 1]) / 2);
        }
        mids.push(a[a.length - 1] + gap / 2);
        return mids;
    };
    GridRouter.prototype.findLineage = function (v) {
        var lineage = [v];
        do {
            v = v.parent;
            lineage.push(v);
        } while (v !== this.root);
        return lineage.reverse();
    };
    GridRouter.prototype.findAncestorPathBetween = function (a, b) {
        var aa = this.findLineage(a), ba = this.findLineage(b), i = 0;
        while (aa[i] === ba[i])
            i++;
        return { commonAncestor: aa[i - 1], lineages: aa.slice(i).concat(ba.slice(i)) };
    };
    GridRouter.prototype.siblingObstacles = function (a, b) {
        var _this = this;
        var path = this.findAncestorPathBetween(a, b);
        var lineageLookup = {};
        path.lineages.forEach(function (v) { return lineageLookup[v.id] = {}; });
        var obstacles = path.commonAncestor.children.filter(function (v) { return !(v in lineageLookup); });
        path.lineages
            .filter(function (v) { return v.parent !== path.commonAncestor; })
            .forEach(function (v) { return obstacles = obstacles.concat(v.parent.children.filter(function (c) { return c !== v.id; })); });
        return obstacles.map(function (v) { return _this.nodes[v]; });
    };
    GridRouter.getSegmentSets = function (routes, x, y) {
        var vsegments = [];
        for (var ei = 0; ei < routes.length; ei++) {
            var route = routes[ei];
            for (var si = 0; si < route.length; si++) {
                var s = route[si];
                s.edgeid = ei;
                s.i = si;
                var sdx = s[1][x] - s[0][x];
                if (Math.abs(sdx) < 0.1) {
                    vsegments.push(s);
                }
            }
        }
        vsegments.sort(function (a, b) { return a[0][x] - b[0][x]; });
        var vsegmentsets = [];
        var segmentset = null;
        for (var i = 0; i < vsegments.length; i++) {
            var s = vsegments[i];
            if (!segmentset || Math.abs(s[0][x] - segmentset.pos) > 0.1) {
                segmentset = { pos: s[0][x], segments: [] };
                vsegmentsets.push(segmentset);
            }
            segmentset.segments.push(s);
        }
        return vsegmentsets;
    };
    GridRouter.nudgeSegs = function (x, y, routes, segments, leftOf, gap) {
        var n = segments.length;
        if (n <= 1)
            return;
        var vs = segments.map(function (s) { return new vpsc_1.Variable(s[0][x]); });
        var cs = [];
        for (var i = 0; i < n; i++) {
            for (var j = 0; j < n; j++) {
                if (i === j)
                    continue;
                var s1 = segments[i], s2 = segments[j], e1 = s1.edgeid, e2 = s2.edgeid, lind = -1, rind = -1;
                if (x == 'x') {
                    if (leftOf(e1, e2)) {
                        if (s1[0][y] < s1[1][y]) {
                            lind = j, rind = i;
                        }
                        else {
                            lind = i, rind = j;
                        }
                    }
                }
                else {
                    if (leftOf(e1, e2)) {
                        if (s1[0][y] < s1[1][y]) {
                            lind = i, rind = j;
                        }
                        else {
                            lind = j, rind = i;
                        }
                    }
                }
                if (lind >= 0) {
                    cs.push(new vpsc_1.Constraint(vs[lind], vs[rind], gap));
                }
            }
        }
        var solver = new vpsc_1.Solver(vs, cs);
        solver.solve();
        vs.forEach(function (v, i) {
            var s = segments[i];
            var pos = v.position();
            s[0][x] = s[1][x] = pos;
            var route = routes[s.edgeid];
            if (s.i > 0)
                route[s.i - 1][1][x] = pos;
            if (s.i < route.length - 1)
                route[s.i + 1][0][x] = pos;
        });
    };
    GridRouter.nudgeSegments = function (routes, x, y, leftOf, gap) {
        var vsegmentsets = GridRouter.getSegmentSets(routes, x, y);
        for (var i = 0; i < vsegmentsets.length; i++) {
            var ss = vsegmentsets[i];
            var events = [];
            for (var j = 0; j < ss.segments.length; j++) {
                var s = ss.segments[j];
                events.push({ type: 0, s: s, pos: Math.min(s[0][y], s[1][y]) });
                events.push({ type: 1, s: s, pos: Math.max(s[0][y], s[1][y]) });
            }
            events.sort(function (a, b) { return a.pos - b.pos + a.type - b.type; });
            var open = [];
            var openCount = 0;
            events.forEach(function (e) {
                if (e.type === 0) {
                    open.push(e.s);
                    openCount++;
                }
                else {
                    openCount--;
                }
                if (openCount == 0) {
                    GridRouter.nudgeSegs(x, y, routes, open, leftOf, gap);
                    open = [];
                }
            });
        }
    };
    GridRouter.prototype.routeEdges = function (edges, nudgeGap, source, target) {
        var _this = this;
        var routePaths = edges.map(function (e) { return _this.route(source(e), target(e)); });
        var order = GridRouter.orderEdges(routePaths);
        var routes = routePaths.map(function (e) { return GridRouter.makeSegments(e); });
        GridRouter.nudgeSegments(routes, 'x', 'y', order, nudgeGap);
        GridRouter.nudgeSegments(routes, 'y', 'x', order, nudgeGap);
        GridRouter.unreverseEdges(routes, routePaths);
        return routes;
    };
    GridRouter.unreverseEdges = function (routes, routePaths) {
        routes.forEach(function (segments, i) {
            var path = routePaths[i];
            if (path.reversed) {
                segments.reverse();
                segments.forEach(function (segment) {
                    segment.reverse();
                });
            }
        });
    };
    GridRouter.angleBetween2Lines = function (line1, line2) {
        var angle1 = Math.atan2(line1[0].y - line1[1].y, line1[0].x - line1[1].x);
        var angle2 = Math.atan2(line2[0].y - line2[1].y, line2[0].x - line2[1].x);
        var diff = angle1 - angle2;
        if (diff > Math.PI || diff < -Math.PI) {
            diff = angle2 - angle1;
        }
        return diff;
    };
    GridRouter.isLeft = function (a, b, c) {
        return ((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) <= 0;
    };
    GridRouter.getOrder = function (pairs) {
        var outgoing = {};
        for (var i = 0; i < pairs.length; i++) {
            var p = pairs[i];
            if (typeof outgoing[p.l] === 'undefined')
                outgoing[p.l] = {};
            outgoing[p.l][p.r] = true;
        }
        return function (l, r) { return typeof outgoing[l] !== 'undefined' && outgoing[l][r]; };
    };
    GridRouter.orderEdges = function (edges) {
        var edgeOrder = [];
        for (var i = 0; i < edges.length - 1; i++) {
            for (var j = i + 1; j < edges.length; j++) {
                var e = edges[i], f = edges[j], lcs = new LongestCommonSubsequence(e, f);
                var u, vi, vj;
                if (lcs.length === 0)
                    continue;
                if (lcs.reversed) {
                    f.reverse();
                    f.reversed = true;
                    lcs = new LongestCommonSubsequence(e, f);
                }
                if ((lcs.si <= 0 || lcs.ti <= 0) &&
                    (lcs.si + lcs.length >= e.length || lcs.ti + lcs.length >= f.length)) {
                    edgeOrder.push({ l: i, r: j });
                    continue;
                }
                if (lcs.si + lcs.length >= e.length || lcs.ti + lcs.length >= f.length) {
                    u = e[lcs.si + 1];
                    vj = e[lcs.si - 1];
                    vi = f[lcs.ti - 1];
                }
                else {
                    u = e[lcs.si + lcs.length - 2];
                    vi = e[lcs.si + lcs.length];
                    vj = f[lcs.ti + lcs.length];
                }
                if (GridRouter.isLeft(u, vi, vj)) {
                    edgeOrder.push({ l: j, r: i });
                }
                else {
                    edgeOrder.push({ l: i, r: j });
                }
            }
        }
        return GridRouter.getOrder(edgeOrder);
    };
    GridRouter.makeSegments = function (path) {
        function copyPoint(p) {
            return { x: p.x, y: p.y };
        }
        var isStraight = function (a, b, c) { return Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) < 0.001; };
        var segments = [];
        var a = copyPoint(path[0]);
        for (var i = 1; i < path.length; i++) {
            var b = copyPoint(path[i]), c = i < path.length - 1 ? path[i + 1] : null;
            if (!c || !isStraight(a, b, c)) {
                segments.push([a, b]);
                a = b;
            }
        }
        return segments;
    };
    GridRouter.prototype.route = function (s, t) {
        var _this = this;
        var source = this.nodes[s], target = this.nodes[t];
        this.obstacles = this.siblingObstacles(source, target);
        var obstacleLookup = {};
        this.obstacles.forEach(function (o) { return obstacleLookup[o.id] = o; });
        this.passableEdges = this.edges.filter(function (e) {
            var u = _this.verts[e.source], v = _this.verts[e.target];
            return !(u.node && u.node.id in obstacleLookup
                || v.node && v.node.id in obstacleLookup);
        });
        for (var i = 1; i < source.ports.length; i++) {
            var u = source.ports[0].id;
            var v = source.ports[i].id;
            this.passableEdges.push({
                source: u,
                target: v,
                length: 0
            });
        }
        for (var i = 1; i < target.ports.length; i++) {
            var u = target.ports[0].id;
            var v = target.ports[i].id;
            this.passableEdges.push({
                source: u,
                target: v,
                length: 0
            });
        }
        var getSource = function (e) { return e.source; }, getTarget = function (e) { return e.target; }, getLength = function (e) { return e.length; };
        var shortestPathCalculator = new shortestpaths_1.Calculator(this.verts.length, this.passableEdges, getSource, getTarget, getLength);
        var bendPenalty = function (u, v, w) {
            var a = _this.verts[u], b = _this.verts[v], c = _this.verts[w];
            var dx = Math.abs(c.x - a.x), dy = Math.abs(c.y - a.y);
            if (a.node === source && a.node === b.node || b.node === target && b.node === c.node)
                return 0;
            return dx > 1 && dy > 1 ? 1000 : 0;
        };
        var shortestPath = shortestPathCalculator.PathFromNodeToNodeWithPrevCost(source.ports[0].id, target.ports[0].id, bendPenalty);
        var pathPoints = shortestPath.reverse().map(function (vi) { return _this.verts[vi]; });
        pathPoints.push(this.nodes[target.id].ports[0]);
        return pathPoints.filter(function (v, i) {
            return !(i < pathPoints.length - 1 && pathPoints[i + 1].node === source && v.node === source
                || i > 0 && v.node === target && pathPoints[i - 1].node === target);
        });
    };
    GridRouter.getRoutePath = function (route, cornerradius, arrowwidth, arrowheight) {
        var result = {
            routepath: 'M ' + route[0][0].x + ' ' + route[0][0].y + ' ',
            arrowpath: ''
        };
        if (route.length > 1) {
            for (var i = 0; i < route.length; i++) {
                var li = route[i];
                var x = li[1].x, y = li[1].y;
                var dx = x - li[0].x;
                var dy = y - li[0].y;
                if (i < route.length - 1) {
                    if (Math.abs(dx) > 0) {
                        x -= dx / Math.abs(dx) * cornerradius;
                    }
                    else {
                        y -= dy / Math.abs(dy) * cornerradius;
                    }
                    result.routepath += 'L ' + x + ' ' + y + ' ';
                    var l = route[i + 1];
                    var x0 = l[0].x, y0 = l[0].y;
                    var x1 = l[1].x;
                    var y1 = l[1].y;
                    dx = x1 - x0;
                    dy = y1 - y0;
                    var angle = GridRouter.angleBetween2Lines(li, l) < 0 ? 1 : 0;
                    var x2, y2;
                    if (Math.abs(dx) > 0) {
                        x2 = x0 + dx / Math.abs(dx) * cornerradius;
                        y2 = y0;
                    }
                    else {
                        x2 = x0;
                        y2 = y0 + dy / Math.abs(dy) * cornerradius;
                    }
                    var cx = Math.abs(x2 - x);
                    var cy = Math.abs(y2 - y);
                    result.routepath += 'A ' + cx + ' ' + cy + ' 0 0 ' + angle + ' ' + x2 + ' ' + y2 + ' ';
                }
                else {
                    var arrowtip = [x, y];
                    var arrowcorner1, arrowcorner2;
                    if (Math.abs(dx) > 0) {
                        x -= dx / Math.abs(dx) * arrowheight;
                        arrowcorner1 = [x, y + arrowwidth];
                        arrowcorner2 = [x, y - arrowwidth];
                    }
                    else {
                        y -= dy / Math.abs(dy) * arrowheight;
                        arrowcorner1 = [x + arrowwidth, y];
                        arrowcorner2 = [x - arrowwidth, y];
                    }
                    result.routepath += 'L ' + x + ' ' + y + ' ';
                    if (arrowheight > 0) {
                        result.arrowpath = 'M ' + arrowtip[0] + ' ' + arrowtip[1] + ' L ' + arrowcorner1[0] + ' ' + arrowcorner1[1]
                            + ' L ' + arrowcorner2[0] + ' ' + arrowcorner2[1];
                    }
                }
            }
        }
        else {
            var li = route[0];
            var x = li[1].x, y = li[1].y;
            var dx = x - li[0].x;
            var dy = y - li[0].y;
            var arrowtip = [x, y];
            var arrowcorner1, arrowcorner2;
            if (Math.abs(dx) > 0) {
                x -= dx / Math.abs(dx) * arrowheight;
                arrowcorner1 = [x, y + arrowwidth];
                arrowcorner2 = [x, y - arrowwidth];
            }
            else {
                y -= dy / Math.abs(dy) * arrowheight;
                arrowcorner1 = [x + arrowwidth, y];
                arrowcorner2 = [x - arrowwidth, y];
            }
            result.routepath += 'L ' + x + ' ' + y + ' ';
            if (arrowheight > 0) {
                result.arrowpath = 'M ' + arrowtip[0] + ' ' + arrowtip[1] + ' L ' + arrowcorner1[0] + ' ' + arrowcorner1[1]
                    + ' L ' + arrowcorner2[0] + ' ' + arrowcorner2[1];
            }
        }
        return result;
    };
    return GridRouter;
}());
exports.GridRouter = GridRouter;

},{"./rectangle":17,"./shortestpaths":18,"./vpsc":19}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var packingOptions = {
    PADDING: 10,
    GOLDEN_SECTION: (1 + Math.sqrt(5)) / 2,
    FLOAT_EPSILON: 0.0001,
    MAX_INERATIONS: 100
};
function applyPacking(graphs, w, h, node_size, desired_ratio, centerGraph) {
    if (desired_ratio === void 0) { desired_ratio = 1; }
    if (centerGraph === void 0) { centerGraph = true; }
    var init_x = 0, init_y = 0, svg_width = w, svg_height = h, desired_ratio = typeof desired_ratio !== 'undefined' ? desired_ratio : 1, node_size = typeof node_size !== 'undefined' ? node_size : 0, real_width = 0, real_height = 0, min_width = 0, global_bottom = 0, line = [];
    if (graphs.length == 0)
        return;
    calculate_bb(graphs);
    apply(graphs, desired_ratio);
    if (centerGraph) {
        put_nodes_to_right_positions(graphs);
    }
    function calculate_bb(graphs) {
        graphs.forEach(function (g) {
            calculate_single_bb(g);
        });
        function calculate_single_bb(graph) {
            var min_x = Number.MAX_VALUE, min_y = Number.MAX_VALUE, max_x = 0, max_y = 0;
            graph.array.forEach(function (v) {
                var w = typeof v.width !== 'undefined' ? v.width : node_size;
                var h = typeof v.height !== 'undefined' ? v.height : node_size;
                w /= 2;
                h /= 2;
                max_x = Math.max(v.x + w, max_x);
                min_x = Math.min(v.x - w, min_x);
                max_y = Math.max(v.y + h, max_y);
                min_y = Math.min(v.y - h, min_y);
            });
            graph.width = max_x - min_x;
            graph.height = max_y - min_y;
        }
    }
    function put_nodes_to_right_positions(graphs) {
        graphs.forEach(function (g) {
            var center = { x: 0, y: 0 };
            g.array.forEach(function (node) {
                center.x += node.x;
                center.y += node.y;
            });
            center.x /= g.array.length;
            center.y /= g.array.length;
            var corner = { x: center.x - g.width / 2, y: center.y - g.height / 2 };
            var offset = { x: g.x - corner.x + svg_width / 2 - real_width / 2, y: g.y - corner.y + svg_height / 2 - real_height / 2 };
            g.array.forEach(function (node) {
                node.x += offset.x;
                node.y += offset.y;
            });
        });
    }
    function apply(data, desired_ratio) {
        var curr_best_f = Number.POSITIVE_INFINITY;
        var curr_best = 0;
        data.sort(function (a, b) { return b.height - a.height; });
        min_width = data.reduce(function (a, b) {
            return a.width < b.width ? a.width : b.width;
        });
        var left = x1 = min_width;
        var right = x2 = get_entire_width(data);
        var iterationCounter = 0;
        var f_x1 = Number.MAX_VALUE;
        var f_x2 = Number.MAX_VALUE;
        var flag = -1;
        var dx = Number.MAX_VALUE;
        var df = Number.MAX_VALUE;
        while ((dx > min_width) || df > packingOptions.FLOAT_EPSILON) {
            if (flag != 1) {
                var x1 = right - (right - left) / packingOptions.GOLDEN_SECTION;
                var f_x1 = step(data, x1);
            }
            if (flag != 0) {
                var x2 = left + (right - left) / packingOptions.GOLDEN_SECTION;
                var f_x2 = step(data, x2);
            }
            dx = Math.abs(x1 - x2);
            df = Math.abs(f_x1 - f_x2);
            if (f_x1 < curr_best_f) {
                curr_best_f = f_x1;
                curr_best = x1;
            }
            if (f_x2 < curr_best_f) {
                curr_best_f = f_x2;
                curr_best = x2;
            }
            if (f_x1 > f_x2) {
                left = x1;
                x1 = x2;
                f_x1 = f_x2;
                flag = 1;
            }
            else {
                right = x2;
                x2 = x1;
                f_x2 = f_x1;
                flag = 0;
            }
            if (iterationCounter++ > 100) {
                break;
            }
        }
        step(data, curr_best);
    }
    function step(data, max_width) {
        line = [];
        real_width = 0;
        real_height = 0;
        global_bottom = init_y;
        for (var i = 0; i < data.length; i++) {
            var o = data[i];
            put_rect(o, max_width);
        }
        return Math.abs(get_real_ratio() - desired_ratio);
    }
    function put_rect(rect, max_width) {
        var parent = undefined;
        for (var i = 0; i < line.length; i++) {
            if ((line[i].space_left >= rect.height) && (line[i].x + line[i].width + rect.width + packingOptions.PADDING - max_width) <= packingOptions.FLOAT_EPSILON) {
                parent = line[i];
                break;
            }
        }
        line.push(rect);
        if (parent !== undefined) {
            rect.x = parent.x + parent.width + packingOptions.PADDING;
            rect.y = parent.bottom;
            rect.space_left = rect.height;
            rect.bottom = rect.y;
            parent.space_left -= rect.height + packingOptions.PADDING;
            parent.bottom += rect.height + packingOptions.PADDING;
        }
        else {
            rect.y = global_bottom;
            global_bottom += rect.height + packingOptions.PADDING;
            rect.x = init_x;
            rect.bottom = rect.y;
            rect.space_left = rect.height;
        }
        if (rect.y + rect.height - real_height > -packingOptions.FLOAT_EPSILON)
            real_height = rect.y + rect.height - init_y;
        if (rect.x + rect.width - real_width > -packingOptions.FLOAT_EPSILON)
            real_width = rect.x + rect.width - init_x;
    }
    ;
    function get_entire_width(data) {
        var width = 0;
        data.forEach(function (d) { return width += d.width + packingOptions.PADDING; });
        return width;
    }
    function get_real_ratio() {
        return (real_width / real_height);
    }
}
exports.applyPacking = applyPacking;
function separateGraphs(nodes, links) {
    var marks = {};
    var ways = {};
    var graphs = [];
    var clusters = 0;
    for (var i = 0; i < links.length; i++) {
        var link = links[i];
        var n1 = link.source;
        var n2 = link.target;
        if (ways[n1.index])
            ways[n1.index].push(n2);
        else
            ways[n1.index] = [n2];
        if (ways[n2.index])
            ways[n2.index].push(n1);
        else
            ways[n2.index] = [n1];
    }
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (marks[node.index])
            continue;
        explore_node(node, true);
    }
    function explore_node(n, is_new) {
        if (marks[n.index] !== undefined)
            return;
        if (is_new) {
            clusters++;
            graphs.push({ array: [] });
        }
        marks[n.index] = clusters;
        graphs[clusters - 1].array.push(n);
        var adjacent = ways[n.index];
        if (!adjacent)
            return;
        for (var j = 0; j < adjacent.length; j++) {
            explore_node(adjacent[j], false);
        }
    }
    return graphs;
}
exports.separateGraphs = separateGraphs;

},{}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var powergraph = require("./powergraph");
var linklengths_1 = require("./linklengths");
var descent_1 = require("./descent");
var rectangle_1 = require("./rectangle");
var shortestpaths_1 = require("./shortestpaths");
var geom_1 = require("./geom");
var handledisconnected_1 = require("./handledisconnected");
var EventType;
(function (EventType) {
    EventType[EventType["start"] = 0] = "start";
    EventType[EventType["tick"] = 1] = "tick";
    EventType[EventType["end"] = 2] = "end";
})(EventType = exports.EventType || (exports.EventType = {}));
;
function isGroup(g) {
    return typeof g.leaves !== 'undefined' || typeof g.groups !== 'undefined';
}
var Layout = (function () {
    function Layout() {
        var _this = this;
        this._canvasSize = [1, 1];
        this._linkDistance = 20;
        this._defaultNodeSize = 10;
        this._linkLengthCalculator = null;
        this._linkType = null;
        this._avoidOverlaps = false;
        this._handleDisconnected = true;
        this._running = false;
        this._nodes = [];
        this._groups = [];
        this._rootGroup = null;
        this._links = [];
        this._constraints = [];
        this._distanceMatrix = null;
        this._descent = null;
        this._directedLinkConstraints = null;
        this._threshold = 0.01;
        this._visibilityGraph = null;
        this._groupCompactness = 1e-6;
        this.event = null;
        this.linkAccessor = {
            getSourceIndex: Layout.getSourceIndex,
            getTargetIndex: Layout.getTargetIndex,
            setLength: Layout.setLinkLength,
            getType: function (l) { return typeof _this._linkType === "function" ? _this._linkType(l) : 0; }
        };
    }
    Layout.prototype.on = function (e, listener) {
        if (!this.event)
            this.event = {};
        if (typeof e === 'string') {
            this.event[EventType[e]] = listener;
        }
        else {
            this.event[e] = listener;
        }
        return this;
    };
    Layout.prototype.trigger = function (e) {
        if (this.event && typeof this.event[e.type] !== 'undefined') {
            this.event[e.type](e);
        }
    };
    Layout.prototype.kick = function () {
        while (!this.tick())
            ;
    };
    Layout.prototype.tick = function () {
        if (this._alpha < this._threshold) {
            this._running = false;
            this.trigger({ type: EventType.end, alpha: this._alpha = 0, stress: this._lastStress });
            return true;
        }
        var n = this._nodes.length, m = this._links.length;
        var o, i;
        this._descent.locks.clear();
        for (i = 0; i < n; ++i) {
            o = this._nodes[i];
            if (o.fixed) {
                if (typeof o.px === 'undefined' || typeof o.py === 'undefined') {
                    o.px = o.x;
                    o.py = o.y;
                }
                var p = [o.px, o.py];
                this._descent.locks.add(i, p);
            }
        }
        var s1 = this._descent.rungeKutta();
        if (s1 === 0) {
            this._alpha = 0;
        }
        else if (typeof this._lastStress !== 'undefined') {
            this._alpha = s1;
        }
        this._lastStress = s1;
        this.updateNodePositions();
        this.trigger({ type: EventType.tick, alpha: this._alpha, stress: this._lastStress });
        return false;
    };
    Layout.prototype.updateNodePositions = function () {
        var x = this._descent.x[0], y = this._descent.x[1];
        var o, i = this._nodes.length;
        while (i--) {
            o = this._nodes[i];
            o.x = x[i];
            o.y = y[i];
        }
    };
    Layout.prototype.nodes = function (v) {
        if (!v) {
            if (this._nodes.length === 0 && this._links.length > 0) {
                var n = 0;
                this._links.forEach(function (l) {
                    n = Math.max(n, l.source, l.target);
                });
                this._nodes = new Array(++n);
                for (var i = 0; i < n; ++i) {
                    this._nodes[i] = {};
                }
            }
            return this._nodes;
        }
        this._nodes = v;
        return this;
    };
    Layout.prototype.groups = function (x) {
        var _this = this;
        if (!x)
            return this._groups;
        this._groups = x;
        this._rootGroup = {};
        this._groups.forEach(function (g) {
            if (typeof g.padding === "undefined")
                g.padding = 1;
            if (typeof g.leaves !== "undefined") {
                g.leaves.forEach(function (v, i) {
                    if (typeof v === 'number')
                        (g.leaves[i] = _this._nodes[v]).parent = g;
                });
            }
            if (typeof g.groups !== "undefined") {
                g.groups.forEach(function (gi, i) {
                    if (typeof gi === 'number')
                        (g.groups[i] = _this._groups[gi]).parent = g;
                });
            }
        });
        this._rootGroup.leaves = this._nodes.filter(function (v) { return typeof v.parent === 'undefined'; });
        this._rootGroup.groups = this._groups.filter(function (g) { return typeof g.parent === 'undefined'; });
        return this;
    };
    Layout.prototype.powerGraphGroups = function (f) {
        var g = powergraph.getGroups(this._nodes, this._links, this.linkAccessor, this._rootGroup);
        this.groups(g.groups);
        f(g);
        return this;
    };
    Layout.prototype.avoidOverlaps = function (v) {
        if (!arguments.length)
            return this._avoidOverlaps;
        this._avoidOverlaps = v;
        return this;
    };
    Layout.prototype.handleDisconnected = function (v) {
        if (!arguments.length)
            return this._handleDisconnected;
        this._handleDisconnected = v;
        return this;
    };
    Layout.prototype.flowLayout = function (axis, minSeparation) {
        if (!arguments.length)
            axis = 'y';
        this._directedLinkConstraints = {
            axis: axis,
            getMinSeparation: typeof minSeparation === 'number' ? function () { return minSeparation; } : minSeparation
        };
        return this;
    };
    Layout.prototype.links = function (x) {
        if (!arguments.length)
            return this._links;
        this._links = x;
        return this;
    };
    Layout.prototype.constraints = function (c) {
        if (!arguments.length)
            return this._constraints;
        this._constraints = c;
        return this;
    };
    Layout.prototype.distanceMatrix = function (d) {
        if (!arguments.length)
            return this._distanceMatrix;
        this._distanceMatrix = d;
        return this;
    };
    Layout.prototype.size = function (x) {
        if (!x)
            return this._canvasSize;
        this._canvasSize = x;
        return this;
    };
    Layout.prototype.defaultNodeSize = function (x) {
        if (!x)
            return this._defaultNodeSize;
        this._defaultNodeSize = x;
        return this;
    };
    Layout.prototype.groupCompactness = function (x) {
        if (!x)
            return this._groupCompactness;
        this._groupCompactness = x;
        return this;
    };
    Layout.prototype.linkDistance = function (x) {
        if (!x) {
            return this._linkDistance;
        }
        this._linkDistance = typeof x === "function" ? x : +x;
        this._linkLengthCalculator = null;
        return this;
    };
    Layout.prototype.linkType = function (f) {
        this._linkType = f;
        return this;
    };
    Layout.prototype.convergenceThreshold = function (x) {
        if (!x)
            return this._threshold;
        this._threshold = typeof x === "function" ? x : +x;
        return this;
    };
    Layout.prototype.alpha = function (x) {
        if (!arguments.length)
            return this._alpha;
        else {
            x = +x;
            if (this._alpha) {
                if (x > 0)
                    this._alpha = x;
                else
                    this._alpha = 0;
            }
            else if (x > 0) {
                if (!this._running) {
                    this._running = true;
                    this.trigger({ type: EventType.start, alpha: this._alpha = x });
                    this.kick();
                }
            }
            return this;
        }
    };
    Layout.prototype.getLinkLength = function (link) {
        return typeof this._linkDistance === "function" ? +(this._linkDistance(link)) : this._linkDistance;
    };
    Layout.setLinkLength = function (link, length) {
        link.length = length;
    };
    Layout.prototype.getLinkType = function (link) {
        return typeof this._linkType === "function" ? this._linkType(link) : 0;
    };
    Layout.prototype.symmetricDiffLinkLengths = function (idealLength, w) {
        var _this = this;
        if (w === void 0) { w = 1; }
        this.linkDistance(function (l) { return idealLength * l.length; });
        this._linkLengthCalculator = function () { return linklengths_1.symmetricDiffLinkLengths(_this._links, _this.linkAccessor, w); };
        return this;
    };
    Layout.prototype.jaccardLinkLengths = function (idealLength, w) {
        var _this = this;
        if (w === void 0) { w = 1; }
        this.linkDistance(function (l) { return idealLength * l.length; });
        this._linkLengthCalculator = function () { return linklengths_1.jaccardLinkLengths(_this._links, _this.linkAccessor, w); };
        return this;
    };
    Layout.prototype.start = function (initialUnconstrainedIterations, initialUserConstraintIterations, initialAllConstraintsIterations, gridSnapIterations, keepRunning, centerGraph) {
        var _this = this;
        if (initialUnconstrainedIterations === void 0) { initialUnconstrainedIterations = 0; }
        if (initialUserConstraintIterations === void 0) { initialUserConstraintIterations = 0; }
        if (initialAllConstraintsIterations === void 0) { initialAllConstraintsIterations = 0; }
        if (gridSnapIterations === void 0) { gridSnapIterations = 0; }
        if (keepRunning === void 0) { keepRunning = true; }
        if (centerGraph === void 0) { centerGraph = true; }
        var i, j, n = this.nodes().length, N = n + 2 * this._groups.length, m = this._links.length, w = this._canvasSize[0], h = this._canvasSize[1];
        var x = new Array(N), y = new Array(N);
        var G = null;
        var ao = this._avoidOverlaps;
        this._nodes.forEach(function (v, i) {
            v.index = i;
            if (typeof v.x === 'undefined') {
                v.x = w / 2, v.y = h / 2;
            }
            x[i] = v.x, y[i] = v.y;
        });
        if (this._linkLengthCalculator)
            this._linkLengthCalculator();
        var distances;
        if (this._distanceMatrix) {
            distances = this._distanceMatrix;
        }
        else {
            distances = (new shortestpaths_1.Calculator(N, this._links, Layout.getSourceIndex, Layout.getTargetIndex, function (l) { return _this.getLinkLength(l); })).DistanceMatrix();
            G = descent_1.Descent.createSquareMatrix(N, function () { return 2; });
            this._links.forEach(function (l) {
                if (typeof l.source == "number")
                    l.source = _this._nodes[l.source];
                if (typeof l.target == "number")
                    l.target = _this._nodes[l.target];
            });
            this._links.forEach(function (e) {
                var u = Layout.getSourceIndex(e), v = Layout.getTargetIndex(e);
                G[u][v] = G[v][u] = e.weight || 1;
            });
        }
        var D = descent_1.Descent.createSquareMatrix(N, function (i, j) {
            return distances[i][j];
        });
        if (this._rootGroup && typeof this._rootGroup.groups !== 'undefined') {
            var i = n;
            var addAttraction = function (i, j, strength, idealDistance) {
                G[i][j] = G[j][i] = strength;
                D[i][j] = D[j][i] = idealDistance;
            };
            this._groups.forEach(function (g) {
                addAttraction(i, i + 1, _this._groupCompactness, 0.1);
                if (typeof g.bounds === 'undefined') {
                    x[i] = w / 2, y[i++] = h / 2;
                    x[i] = w / 2, y[i++] = h / 2;
                }
                else {
                    x[i] = g.bounds.x, y[i++] = g.bounds.y;
                    x[i] = g.bounds.X, y[i++] = g.bounds.Y;
                }
            });
        }
        else
            this._rootGroup = { leaves: this._nodes, groups: [] };
        var curConstraints = this._constraints || [];
        if (this._directedLinkConstraints) {
            this.linkAccessor.getMinSeparation = this._directedLinkConstraints.getMinSeparation;
            curConstraints = curConstraints.concat(linklengths_1.generateDirectedEdgeConstraints(n, this._links, this._directedLinkConstraints.axis, (this.linkAccessor)));
        }
        this.avoidOverlaps(false);
        this._descent = new descent_1.Descent([x, y], D);
        this._descent.locks.clear();
        for (var i = 0; i < n; ++i) {
            var o = this._nodes[i];
            if (o.fixed) {
                o.px = o.x;
                o.py = o.y;
                var p = [o.x, o.y];
                this._descent.locks.add(i, p);
            }
        }
        this._descent.threshold = this._threshold;
        this.initialLayout(initialUnconstrainedIterations, x, y);
        if (curConstraints.length > 0)
            this._descent.project = new rectangle_1.Projection(this._nodes, this._groups, this._rootGroup, curConstraints).projectFunctions();
        this._descent.run(initialUserConstraintIterations);
        this.separateOverlappingComponents(w, h, centerGraph);
        this.avoidOverlaps(ao);
        if (ao) {
            this._nodes.forEach(function (v, i) { v.x = x[i], v.y = y[i]; });
            this._descent.project = new rectangle_1.Projection(this._nodes, this._groups, this._rootGroup, curConstraints, true).projectFunctions();
            this._nodes.forEach(function (v, i) { x[i] = v.x, y[i] = v.y; });
        }
        this._descent.G = G;
        this._descent.run(initialAllConstraintsIterations);
        if (gridSnapIterations) {
            this._descent.snapStrength = 1000;
            this._descent.snapGridSize = this._nodes[0].width;
            this._descent.numGridSnapNodes = n;
            this._descent.scaleSnapByMaxH = n != N;
            var G0 = descent_1.Descent.createSquareMatrix(N, function (i, j) {
                if (i >= n || j >= n)
                    return G[i][j];
                return 0;
            });
            this._descent.G = G0;
            this._descent.run(gridSnapIterations);
        }
        this.updateNodePositions();
        this.separateOverlappingComponents(w, h, centerGraph);
        return keepRunning ? this.resume() : this;
    };
    Layout.prototype.initialLayout = function (iterations, x, y) {
        if (this._groups.length > 0 && iterations > 0) {
            var n = this._nodes.length;
            var edges = this._links.map(function (e) { return ({ source: e.source.index, target: e.target.index }); });
            var vs = this._nodes.map(function (v) { return ({ index: v.index }); });
            this._groups.forEach(function (g, i) {
                vs.push({ index: g.index = n + i });
            });
            this._groups.forEach(function (g, i) {
                if (typeof g.leaves !== 'undefined')
                    g.leaves.forEach(function (v) { return edges.push({ source: g.index, target: v.index }); });
                if (typeof g.groups !== 'undefined')
                    g.groups.forEach(function (gg) { return edges.push({ source: g.index, target: gg.index }); });
            });
            new Layout()
                .size(this.size())
                .nodes(vs)
                .links(edges)
                .avoidOverlaps(false)
                .linkDistance(this.linkDistance())
                .symmetricDiffLinkLengths(5)
                .convergenceThreshold(1e-4)
                .start(iterations, 0, 0, 0, false);
            this._nodes.forEach(function (v) {
                x[v.index] = vs[v.index].x;
                y[v.index] = vs[v.index].y;
            });
        }
        else {
            this._descent.run(iterations);
        }
    };
    Layout.prototype.separateOverlappingComponents = function (width, height, centerGraph) {
        var _this = this;
        if (centerGraph === void 0) { centerGraph = true; }
        if (!this._distanceMatrix && this._handleDisconnected) {
            var x_1 = this._descent.x[0], y_1 = this._descent.x[1];
            this._nodes.forEach(function (v, i) { v.x = x_1[i], v.y = y_1[i]; });
            var graphs = handledisconnected_1.separateGraphs(this._nodes, this._links);
            handledisconnected_1.applyPacking(graphs, width, height, this._defaultNodeSize, (height / width), centerGraph);
            this._nodes.forEach(function (v, i) {
                _this._descent.x[0][i] = v.x, _this._descent.x[1][i] = v.y;
                if (v.bounds) {
                    v.bounds.setXCentre(v.x);
                    v.bounds.setYCentre(v.y);
                }
            });
        }
    };
    Layout.prototype.resume = function () {
        return this.alpha(0.1);
    };
    Layout.prototype.stop = function () {
        return this.alpha(0);
    };
    Layout.prototype.prepareEdgeRouting = function (nodeMargin) {
        if (nodeMargin === void 0) { nodeMargin = 0; }
        this._visibilityGraph = new geom_1.TangentVisibilityGraph(this._nodes.map(function (v) {
            return v.bounds.inflate(-nodeMargin).vertices();
        }));
    };
    Layout.prototype.routeEdge = function (edge, ah, draw) {
        if (ah === void 0) { ah = 5; }
        var lineData = [];
        var vg2 = new geom_1.TangentVisibilityGraph(this._visibilityGraph.P, { V: this._visibilityGraph.V, E: this._visibilityGraph.E }), port1 = { x: edge.source.x, y: edge.source.y }, port2 = { x: edge.target.x, y: edge.target.y }, start = vg2.addPoint(port1, edge.source.index), end = vg2.addPoint(port2, edge.target.index);
        vg2.addEdgeIfVisible(port1, port2, edge.source.index, edge.target.index);
        if (typeof draw !== 'undefined') {
            draw(vg2);
        }
        var sourceInd = function (e) { return e.source.id; }, targetInd = function (e) { return e.target.id; }, length = function (e) { return e.length(); }, spCalc = new shortestpaths_1.Calculator(vg2.V.length, vg2.E, sourceInd, targetInd, length), shortestPath = spCalc.PathFromNodeToNode(start.id, end.id);
        if (shortestPath.length === 1 || shortestPath.length === vg2.V.length) {
            var route = rectangle_1.makeEdgeBetween(edge.source.innerBounds, edge.target.innerBounds, ah);
            lineData = [route.sourceIntersection, route.arrowStart];
        }
        else {
            var n = shortestPath.length - 2, p = vg2.V[shortestPath[n]].p, q = vg2.V[shortestPath[0]].p, lineData = [edge.source.innerBounds.rayIntersection(p.x, p.y)];
            for (var i = n; i >= 0; --i)
                lineData.push(vg2.V[shortestPath[i]].p);
            lineData.push(rectangle_1.makeEdgeTo(q, edge.target.innerBounds, ah));
        }
        return lineData;
    };
    Layout.getSourceIndex = function (e) {
        return typeof e.source === 'number' ? e.source : e.source.index;
    };
    Layout.getTargetIndex = function (e) {
        return typeof e.target === 'number' ? e.target : e.target.index;
    };
    Layout.linkId = function (e) {
        return Layout.getSourceIndex(e) + "-" + Layout.getTargetIndex(e);
    };
    Layout.dragStart = function (d) {
        if (isGroup(d)) {
            Layout.storeOffset(d, Layout.dragOrigin(d));
        }
        else {
            Layout.stopNode(d);
            d.fixed |= 2;
        }
    };
    Layout.stopNode = function (v) {
        v.px = v.x;
        v.py = v.y;
    };
    Layout.storeOffset = function (d, origin) {
        if (typeof d.leaves !== 'undefined') {
            d.leaves.forEach(function (v) {
                v.fixed |= 2;
                Layout.stopNode(v);
                v._dragGroupOffsetX = v.x - origin.x;
                v._dragGroupOffsetY = v.y - origin.y;
            });
        }
        if (typeof d.groups !== 'undefined') {
            d.groups.forEach(function (g) { return Layout.storeOffset(g, origin); });
        }
    };
    Layout.dragOrigin = function (d) {
        if (isGroup(d)) {
            return {
                x: d.bounds.cx(),
                y: d.bounds.cy()
            };
        }
        else {
            return d;
        }
    };
    Layout.drag = function (d, position) {
        if (isGroup(d)) {
            if (typeof d.leaves !== 'undefined') {
                d.leaves.forEach(function (v) {
                    d.bounds.setXCentre(position.x);
                    d.bounds.setYCentre(position.y);
                    v.px = v._dragGroupOffsetX + position.x;
                    v.py = v._dragGroupOffsetY + position.y;
                });
            }
            if (typeof d.groups !== 'undefined') {
                d.groups.forEach(function (g) { return Layout.drag(g, position); });
            }
        }
        else {
            d.px = position.x;
            d.py = position.y;
        }
    };
    Layout.dragEnd = function (d) {
        if (isGroup(d)) {
            if (typeof d.leaves !== 'undefined') {
                d.leaves.forEach(function (v) {
                    Layout.dragEnd(v);
                    delete v._dragGroupOffsetX;
                    delete v._dragGroupOffsetY;
                });
            }
            if (typeof d.groups !== 'undefined') {
                d.groups.forEach(Layout.dragEnd);
            }
        }
        else {
            d.fixed &= ~6;
        }
    };
    Layout.mouseOver = function (d) {
        d.fixed |= 4;
        d.px = d.x, d.py = d.y;
    };
    Layout.mouseOut = function (d) {
        d.fixed &= ~4;
    };
    return Layout;
}());
exports.Layout = Layout;

},{"./descent":7,"./geom":8,"./handledisconnected":10,"./linklengths":13,"./powergraph":14,"./rectangle":17,"./shortestpaths":18}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var shortestpaths_1 = require("./shortestpaths");
var descent_1 = require("./descent");
var rectangle_1 = require("./rectangle");
var linklengths_1 = require("./linklengths");
var Link3D = (function () {
    function Link3D(source, target) {
        this.source = source;
        this.target = target;
    }
    Link3D.prototype.actualLength = function (x) {
        var _this = this;
        return Math.sqrt(x.reduce(function (c, v) {
            var dx = v[_this.target] - v[_this.source];
            return c + dx * dx;
        }, 0));
    };
    return Link3D;
}());
exports.Link3D = Link3D;
var Node3D = (function () {
    function Node3D(x, y, z) {
        if (x === void 0) { x = 0; }
        if (y === void 0) { y = 0; }
        if (z === void 0) { z = 0; }
        this.x = x;
        this.y = y;
        this.z = z;
    }
    return Node3D;
}());
exports.Node3D = Node3D;
var Layout3D = (function () {
    function Layout3D(nodes, links, idealLinkLength) {
        var _this = this;
        if (idealLinkLength === void 0) { idealLinkLength = 1; }
        this.nodes = nodes;
        this.links = links;
        this.idealLinkLength = idealLinkLength;
        this.constraints = null;
        this.useJaccardLinkLengths = true;
        this.result = new Array(Layout3D.k);
        for (var i = 0; i < Layout3D.k; ++i) {
            this.result[i] = new Array(nodes.length);
        }
        nodes.forEach(function (v, i) {
            for (var _i = 0, _a = Layout3D.dims; _i < _a.length; _i++) {
                var dim = _a[_i];
                if (typeof v[dim] == 'undefined')
                    v[dim] = Math.random();
            }
            _this.result[0][i] = v.x;
            _this.result[1][i] = v.y;
            _this.result[2][i] = v.z;
        });
    }
    ;
    Layout3D.prototype.linkLength = function (l) {
        return l.actualLength(this.result);
    };
    Layout3D.prototype.start = function (iterations) {
        var _this = this;
        if (iterations === void 0) { iterations = 100; }
        var n = this.nodes.length;
        var linkAccessor = new LinkAccessor();
        if (this.useJaccardLinkLengths)
            linklengths_1.jaccardLinkLengths(this.links, linkAccessor, 1.5);
        this.links.forEach(function (e) { return e.length *= _this.idealLinkLength; });
        var distanceMatrix = (new shortestpaths_1.Calculator(n, this.links, function (e) { return e.source; }, function (e) { return e.target; }, function (e) { return e.length; })).DistanceMatrix();
        var D = descent_1.Descent.createSquareMatrix(n, function (i, j) { return distanceMatrix[i][j]; });
        var G = descent_1.Descent.createSquareMatrix(n, function () { return 2; });
        this.links.forEach(function (_a) {
            var source = _a.source, target = _a.target;
            return G[source][target] = G[target][source] = 1;
        });
        this.descent = new descent_1.Descent(this.result, D);
        this.descent.threshold = 1e-3;
        this.descent.G = G;
        if (this.constraints)
            this.descent.project = new rectangle_1.Projection(this.nodes, null, null, this.constraints).projectFunctions();
        for (var i = 0; i < this.nodes.length; i++) {
            var v = this.nodes[i];
            if (v.fixed) {
                this.descent.locks.add(i, [v.x, v.y, v.z]);
            }
        }
        this.descent.run(iterations);
        return this;
    };
    Layout3D.prototype.tick = function () {
        this.descent.locks.clear();
        for (var i = 0; i < this.nodes.length; i++) {
            var v = this.nodes[i];
            if (v.fixed) {
                this.descent.locks.add(i, [v.x, v.y, v.z]);
            }
        }
        return this.descent.rungeKutta();
    };
    Layout3D.dims = ['x', 'y', 'z'];
    Layout3D.k = Layout3D.dims.length;
    return Layout3D;
}());
exports.Layout3D = Layout3D;
var LinkAccessor = (function () {
    function LinkAccessor() {
    }
    LinkAccessor.prototype.getSourceIndex = function (e) { return e.source; };
    LinkAccessor.prototype.getTargetIndex = function (e) { return e.target; };
    LinkAccessor.prototype.getLength = function (e) { return e.length; };
    LinkAccessor.prototype.setLength = function (e, l) { e.length = l; };
    return LinkAccessor;
}());

},{"./descent":7,"./linklengths":13,"./rectangle":17,"./shortestpaths":18}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function unionCount(a, b) {
    var u = {};
    for (var i in a)
        u[i] = {};
    for (var i in b)
        u[i] = {};
    return Object.keys(u).length;
}
function intersectionCount(a, b) {
    var n = 0;
    for (var i in a)
        if (typeof b[i] !== 'undefined')
            ++n;
    return n;
}
function getNeighbours(links, la) {
    var neighbours = {};
    var addNeighbours = function (u, v) {
        if (typeof neighbours[u] === 'undefined')
            neighbours[u] = {};
        neighbours[u][v] = {};
    };
    links.forEach(function (e) {
        var u = la.getSourceIndex(e), v = la.getTargetIndex(e);
        addNeighbours(u, v);
        addNeighbours(v, u);
    });
    return neighbours;
}
function computeLinkLengths(links, w, f, la) {
    var neighbours = getNeighbours(links, la);
    links.forEach(function (l) {
        var a = neighbours[la.getSourceIndex(l)];
        var b = neighbours[la.getTargetIndex(l)];
        la.setLength(l, 1 + w * f(a, b));
    });
}
function symmetricDiffLinkLengths(links, la, w) {
    if (w === void 0) { w = 1; }
    computeLinkLengths(links, w, function (a, b) { return Math.sqrt(unionCount(a, b) - intersectionCount(a, b)); }, la);
}
exports.symmetricDiffLinkLengths = symmetricDiffLinkLengths;
function jaccardLinkLengths(links, la, w) {
    if (w === void 0) { w = 1; }
    computeLinkLengths(links, w, function (a, b) {
        return Math.min(Object.keys(a).length, Object.keys(b).length) < 1.1 ? 0 : intersectionCount(a, b) / unionCount(a, b);
    }, la);
}
exports.jaccardLinkLengths = jaccardLinkLengths;
function generateDirectedEdgeConstraints(n, links, axis, la) {
    var components = stronglyConnectedComponents(n, links, la);
    var nodes = {};
    components.forEach(function (c, i) {
        return c.forEach(function (v) { return nodes[v] = i; });
    });
    var constraints = [];
    links.forEach(function (l) {
        var ui = la.getSourceIndex(l), vi = la.getTargetIndex(l), u = nodes[ui], v = nodes[vi];
        if (u !== v) {
            constraints.push({
                axis: axis,
                left: ui,
                right: vi,
                gap: la.getMinSeparation(l)
            });
        }
    });
    return constraints;
}
exports.generateDirectedEdgeConstraints = generateDirectedEdgeConstraints;
function stronglyConnectedComponents(numVertices, edges, la) {
    var nodes = [];
    var index = 0;
    var stack = [];
    var components = [];
    function strongConnect(v) {
        v.index = v.lowlink = index++;
        stack.push(v);
        v.onStack = true;
        for (var _i = 0, _a = v.out; _i < _a.length; _i++) {
            var w = _a[_i];
            if (typeof w.index === 'undefined') {
                strongConnect(w);
                v.lowlink = Math.min(v.lowlink, w.lowlink);
            }
            else if (w.onStack) {
                v.lowlink = Math.min(v.lowlink, w.index);
            }
        }
        if (v.lowlink === v.index) {
            var component = [];
            while (stack.length) {
                w = stack.pop();
                w.onStack = false;
                component.push(w);
                if (w === v)
                    break;
            }
            components.push(component.map(function (v) { return v.id; }));
        }
    }
    for (var i = 0; i < numVertices; i++) {
        nodes.push({ id: i, out: [] });
    }
    for (var _i = 0, edges_1 = edges; _i < edges_1.length; _i++) {
        var e = edges_1[_i];
        var v_1 = nodes[la.getSourceIndex(e)], w = nodes[la.getTargetIndex(e)];
        v_1.out.push(w);
    }
    for (var _a = 0, nodes_1 = nodes; _a < nodes_1.length; _a++) {
        var v = nodes_1[_a];
        if (typeof v.index === 'undefined')
            strongConnect(v);
    }
    return components;
}
exports.stronglyConnectedComponents = stronglyConnectedComponents;

},{}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PowerEdge = (function () {
    function PowerEdge(source, target, type) {
        this.source = source;
        this.target = target;
        this.type = type;
    }
    return PowerEdge;
}());
exports.PowerEdge = PowerEdge;
var Configuration = (function () {
    function Configuration(n, edges, linkAccessor, rootGroup) {
        var _this = this;
        this.linkAccessor = linkAccessor;
        this.modules = new Array(n);
        this.roots = [];
        if (rootGroup) {
            this.initModulesFromGroup(rootGroup);
        }
        else {
            this.roots.push(new ModuleSet());
            for (var i = 0; i < n; ++i)
                this.roots[0].add(this.modules[i] = new Module(i));
        }
        this.R = edges.length;
        edges.forEach(function (e) {
            var s = _this.modules[linkAccessor.getSourceIndex(e)], t = _this.modules[linkAccessor.getTargetIndex(e)], type = linkAccessor.getType(e);
            s.outgoing.add(type, t);
            t.incoming.add(type, s);
        });
    }
    Configuration.prototype.initModulesFromGroup = function (group) {
        var moduleSet = new ModuleSet();
        this.roots.push(moduleSet);
        for (var i = 0; i < group.leaves.length; ++i) {
            var node = group.leaves[i];
            var module = new Module(node.id);
            this.modules[node.id] = module;
            moduleSet.add(module);
        }
        if (group.groups) {
            for (var j = 0; j < group.groups.length; ++j) {
                var child = group.groups[j];
                var definition = {};
                for (var prop in child)
                    if (prop !== "leaves" && prop !== "groups" && child.hasOwnProperty(prop))
                        definition[prop] = child[prop];
                moduleSet.add(new Module(-1 - j, new LinkSets(), new LinkSets(), this.initModulesFromGroup(child), definition));
            }
        }
        return moduleSet;
    };
    Configuration.prototype.merge = function (a, b, k) {
        if (k === void 0) { k = 0; }
        var inInt = a.incoming.intersection(b.incoming), outInt = a.outgoing.intersection(b.outgoing);
        var children = new ModuleSet();
        children.add(a);
        children.add(b);
        var m = new Module(this.modules.length, outInt, inInt, children);
        this.modules.push(m);
        var update = function (s, i, o) {
            s.forAll(function (ms, linktype) {
                ms.forAll(function (n) {
                    var nls = n[i];
                    nls.add(linktype, m);
                    nls.remove(linktype, a);
                    nls.remove(linktype, b);
                    a[o].remove(linktype, n);
                    b[o].remove(linktype, n);
                });
            });
        };
        update(outInt, "incoming", "outgoing");
        update(inInt, "outgoing", "incoming");
        this.R -= inInt.count() + outInt.count();
        this.roots[k].remove(a);
        this.roots[k].remove(b);
        this.roots[k].add(m);
        return m;
    };
    Configuration.prototype.rootMerges = function (k) {
        if (k === void 0) { k = 0; }
        var rs = this.roots[k].modules();
        var n = rs.length;
        var merges = new Array(n * (n - 1));
        var ctr = 0;
        for (var i = 0, i_ = n - 1; i < i_; ++i) {
            for (var j = i + 1; j < n; ++j) {
                var a = rs[i], b = rs[j];
                merges[ctr] = { id: ctr, nEdges: this.nEdges(a, b), a: a, b: b };
                ctr++;
            }
        }
        return merges;
    };
    Configuration.prototype.greedyMerge = function () {
        for (var i = 0; i < this.roots.length; ++i) {
            if (this.roots[i].modules().length < 2)
                continue;
            var ms = this.rootMerges(i).sort(function (a, b) { return a.nEdges == b.nEdges ? a.id - b.id : a.nEdges - b.nEdges; });
            var m = ms[0];
            if (m.nEdges >= this.R)
                continue;
            this.merge(m.a, m.b, i);
            return true;
        }
    };
    Configuration.prototype.nEdges = function (a, b) {
        var inInt = a.incoming.intersection(b.incoming), outInt = a.outgoing.intersection(b.outgoing);
        return this.R - inInt.count() - outInt.count();
    };
    Configuration.prototype.getGroupHierarchy = function (retargetedEdges) {
        var _this = this;
        var groups = [];
        var root = {};
        toGroups(this.roots[0], root, groups);
        var es = this.allEdges();
        es.forEach(function (e) {
            var a = _this.modules[e.source];
            var b = _this.modules[e.target];
            retargetedEdges.push(new PowerEdge(typeof a.gid === "undefined" ? e.source : groups[a.gid], typeof b.gid === "undefined" ? e.target : groups[b.gid], e.type));
        });
        return groups;
    };
    Configuration.prototype.allEdges = function () {
        var es = [];
        Configuration.getEdges(this.roots[0], es);
        return es;
    };
    Configuration.getEdges = function (modules, es) {
        modules.forAll(function (m) {
            m.getEdges(es);
            Configuration.getEdges(m.children, es);
        });
    };
    return Configuration;
}());
exports.Configuration = Configuration;
function toGroups(modules, group, groups) {
    modules.forAll(function (m) {
        if (m.isLeaf()) {
            if (!group.leaves)
                group.leaves = [];
            group.leaves.push(m.id);
        }
        else {
            var g = group;
            m.gid = groups.length;
            if (!m.isIsland() || m.isPredefined()) {
                g = { id: m.gid };
                if (m.isPredefined())
                    for (var prop in m.definition)
                        g[prop] = m.definition[prop];
                if (!group.groups)
                    group.groups = [];
                group.groups.push(m.gid);
                groups.push(g);
            }
            toGroups(m.children, g, groups);
        }
    });
}
var Module = (function () {
    function Module(id, outgoing, incoming, children, definition) {
        if (outgoing === void 0) { outgoing = new LinkSets(); }
        if (incoming === void 0) { incoming = new LinkSets(); }
        if (children === void 0) { children = new ModuleSet(); }
        this.id = id;
        this.outgoing = outgoing;
        this.incoming = incoming;
        this.children = children;
        this.definition = definition;
    }
    Module.prototype.getEdges = function (es) {
        var _this = this;
        this.outgoing.forAll(function (ms, edgetype) {
            ms.forAll(function (target) {
                es.push(new PowerEdge(_this.id, target.id, edgetype));
            });
        });
    };
    Module.prototype.isLeaf = function () {
        return this.children.count() === 0;
    };
    Module.prototype.isIsland = function () {
        return this.outgoing.count() === 0 && this.incoming.count() === 0;
    };
    Module.prototype.isPredefined = function () {
        return typeof this.definition !== "undefined";
    };
    return Module;
}());
exports.Module = Module;
function intersection(m, n) {
    var i = {};
    for (var v in m)
        if (v in n)
            i[v] = m[v];
    return i;
}
var ModuleSet = (function () {
    function ModuleSet() {
        this.table = {};
    }
    ModuleSet.prototype.count = function () {
        return Object.keys(this.table).length;
    };
    ModuleSet.prototype.intersection = function (other) {
        var result = new ModuleSet();
        result.table = intersection(this.table, other.table);
        return result;
    };
    ModuleSet.prototype.intersectionCount = function (other) {
        return this.intersection(other).count();
    };
    ModuleSet.prototype.contains = function (id) {
        return id in this.table;
    };
    ModuleSet.prototype.add = function (m) {
        this.table[m.id] = m;
    };
    ModuleSet.prototype.remove = function (m) {
        delete this.table[m.id];
    };
    ModuleSet.prototype.forAll = function (f) {
        for (var mid in this.table) {
            f(this.table[mid]);
        }
    };
    ModuleSet.prototype.modules = function () {
        var vs = [];
        this.forAll(function (m) {
            if (!m.isPredefined())
                vs.push(m);
        });
        return vs;
    };
    return ModuleSet;
}());
exports.ModuleSet = ModuleSet;
var LinkSets = (function () {
    function LinkSets() {
        this.sets = {};
        this.n = 0;
    }
    LinkSets.prototype.count = function () {
        return this.n;
    };
    LinkSets.prototype.contains = function (id) {
        var result = false;
        this.forAllModules(function (m) {
            if (!result && m.id == id) {
                result = true;
            }
        });
        return result;
    };
    LinkSets.prototype.add = function (linktype, m) {
        var s = linktype in this.sets ? this.sets[linktype] : this.sets[linktype] = new ModuleSet();
        s.add(m);
        ++this.n;
    };
    LinkSets.prototype.remove = function (linktype, m) {
        var ms = this.sets[linktype];
        ms.remove(m);
        if (ms.count() === 0) {
            delete this.sets[linktype];
        }
        --this.n;
    };
    LinkSets.prototype.forAll = function (f) {
        for (var linktype in this.sets) {
            f(this.sets[linktype], Number(linktype));
        }
    };
    LinkSets.prototype.forAllModules = function (f) {
        this.forAll(function (ms, lt) { return ms.forAll(f); });
    };
    LinkSets.prototype.intersection = function (other) {
        var result = new LinkSets();
        this.forAll(function (ms, lt) {
            if (lt in other.sets) {
                var i = ms.intersection(other.sets[lt]), n = i.count();
                if (n > 0) {
                    result.sets[lt] = i;
                    result.n += n;
                }
            }
        });
        return result;
    };
    return LinkSets;
}());
exports.LinkSets = LinkSets;
function intersectionCount(m, n) {
    return Object.keys(intersection(m, n)).length;
}
function getGroups(nodes, links, la, rootGroup) {
    var n = nodes.length, c = new Configuration(n, links, la, rootGroup);
    while (c.greedyMerge())
        ;
    var powerEdges = [];
    var g = c.getGroupHierarchy(powerEdges);
    powerEdges.forEach(function (e) {
        var f = function (end) {
            var g = e[end];
            if (typeof g == "number")
                e[end] = nodes[g];
        };
        f("source");
        f("target");
    });
    return { groups: g, powerEdges: powerEdges };
}
exports.getGroups = getGroups;

},{}],15:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PairingHeap = (function () {
    function PairingHeap(elem) {
        this.elem = elem;
        this.subheaps = [];
    }
    PairingHeap.prototype.toString = function (selector) {
        var str = "", needComma = false;
        for (var i = 0; i < this.subheaps.length; ++i) {
            var subheap = this.subheaps[i];
            if (!subheap.elem) {
                needComma = false;
                continue;
            }
            if (needComma) {
                str = str + ",";
            }
            str = str + subheap.toString(selector);
            needComma = true;
        }
        if (str !== "") {
            str = "(" + str + ")";
        }
        return (this.elem ? selector(this.elem) : "") + str;
    };
    PairingHeap.prototype.forEach = function (f) {
        if (!this.empty()) {
            f(this.elem, this);
            this.subheaps.forEach(function (s) { return s.forEach(f); });
        }
    };
    PairingHeap.prototype.count = function () {
        return this.empty() ? 0 : 1 + this.subheaps.reduce(function (n, h) {
            return n + h.count();
        }, 0);
    };
    PairingHeap.prototype.min = function () {
        return this.elem;
    };
    PairingHeap.prototype.empty = function () {
        return this.elem == null;
    };
    PairingHeap.prototype.contains = function (h) {
        if (this === h)
            return true;
        for (var i = 0; i < this.subheaps.length; i++) {
            if (this.subheaps[i].contains(h))
                return true;
        }
        return false;
    };
    PairingHeap.prototype.isHeap = function (lessThan) {
        var _this = this;
        return this.subheaps.every(function (h) { return lessThan(_this.elem, h.elem) && h.isHeap(lessThan); });
    };
    PairingHeap.prototype.insert = function (obj, lessThan) {
        return this.merge(new PairingHeap(obj), lessThan);
    };
    PairingHeap.prototype.merge = function (heap2, lessThan) {
        if (this.empty())
            return heap2;
        else if (heap2.empty())
            return this;
        else if (lessThan(this.elem, heap2.elem)) {
            this.subheaps.push(heap2);
            return this;
        }
        else {
            heap2.subheaps.push(this);
            return heap2;
        }
    };
    PairingHeap.prototype.removeMin = function (lessThan) {
        if (this.empty())
            return null;
        else
            return this.mergePairs(lessThan);
    };
    PairingHeap.prototype.mergePairs = function (lessThan) {
        if (this.subheaps.length == 0)
            return new PairingHeap(null);
        else if (this.subheaps.length == 1) {
            return this.subheaps[0];
        }
        else {
            var firstPair = this.subheaps.pop().merge(this.subheaps.pop(), lessThan);
            var remaining = this.mergePairs(lessThan);
            return firstPair.merge(remaining, lessThan);
        }
    };
    PairingHeap.prototype.decreaseKey = function (subheap, newValue, setHeapNode, lessThan) {
        var newHeap = subheap.removeMin(lessThan);
        subheap.elem = newHeap.elem;
        subheap.subheaps = newHeap.subheaps;
        if (setHeapNode !== null && newHeap.elem !== null) {
            setHeapNode(subheap.elem, subheap);
        }
        var pairingNode = new PairingHeap(newValue);
        if (setHeapNode !== null) {
            setHeapNode(newValue, pairingNode);
        }
        return this.merge(pairingNode, lessThan);
    };
    return PairingHeap;
}());
exports.PairingHeap = PairingHeap;
var PriorityQueue = (function () {
    function PriorityQueue(lessThan) {
        this.lessThan = lessThan;
    }
    PriorityQueue.prototype.top = function () {
        if (this.empty()) {
            return null;
        }
        return this.root.elem;
    };
    PriorityQueue.prototype.push = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var pairingNode;
        for (var i = 0, arg; arg = args[i]; ++i) {
            pairingNode = new PairingHeap(arg);
            this.root = this.empty() ?
                pairingNode : this.root.merge(pairingNode, this.lessThan);
        }
        return pairingNode;
    };
    PriorityQueue.prototype.empty = function () {
        return !this.root || !this.root.elem;
    };
    PriorityQueue.prototype.isHeap = function () {
        return this.root.isHeap(this.lessThan);
    };
    PriorityQueue.prototype.forEach = function (f) {
        this.root.forEach(f);
    };
    PriorityQueue.prototype.pop = function () {
        if (this.empty()) {
            return null;
        }
        var obj = this.root.min();
        this.root = this.root.removeMin(this.lessThan);
        return obj;
    };
    PriorityQueue.prototype.reduceKey = function (heapNode, newKey, setHeapNode) {
        if (setHeapNode === void 0) { setHeapNode = null; }
        this.root = this.root.decreaseKey(heapNode, newKey, setHeapNode, this.lessThan);
    };
    PriorityQueue.prototype.toString = function (selector) {
        return this.root.toString(selector);
    };
    PriorityQueue.prototype.count = function () {
        return this.root.count();
    };
    return PriorityQueue;
}());
exports.PriorityQueue = PriorityQueue;

},{}],16:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var TreeBase = (function () {
    function TreeBase() {
        this.findIter = function (data) {
            var res = this._root;
            var iter = this.iterator();
            while (res !== null) {
                var c = this._comparator(data, res.data);
                if (c === 0) {
                    iter._cursor = res;
                    return iter;
                }
                else {
                    iter._ancestors.push(res);
                    res = res.get_child(c > 0);
                }
            }
            return null;
        };
    }
    TreeBase.prototype.clear = function () {
        this._root = null;
        this.size = 0;
    };
    ;
    TreeBase.prototype.find = function (data) {
        var res = this._root;
        while (res !== null) {
            var c = this._comparator(data, res.data);
            if (c === 0) {
                return res.data;
            }
            else {
                res = res.get_child(c > 0);
            }
        }
        return null;
    };
    ;
    TreeBase.prototype.lowerBound = function (data) {
        return this._bound(data, this._comparator);
    };
    ;
    TreeBase.prototype.upperBound = function (data) {
        var cmp = this._comparator;
        function reverse_cmp(a, b) {
            return cmp(b, a);
        }
        return this._bound(data, reverse_cmp);
    };
    ;
    TreeBase.prototype.min = function () {
        var res = this._root;
        if (res === null) {
            return null;
        }
        while (res.left !== null) {
            res = res.left;
        }
        return res.data;
    };
    ;
    TreeBase.prototype.max = function () {
        var res = this._root;
        if (res === null) {
            return null;
        }
        while (res.right !== null) {
            res = res.right;
        }
        return res.data;
    };
    ;
    TreeBase.prototype.iterator = function () {
        return new Iterator(this);
    };
    ;
    TreeBase.prototype.each = function (cb) {
        var it = this.iterator(), data;
        while ((data = it.next()) !== null) {
            cb(data);
        }
    };
    ;
    TreeBase.prototype.reach = function (cb) {
        var it = this.iterator(), data;
        while ((data = it.prev()) !== null) {
            cb(data);
        }
    };
    ;
    TreeBase.prototype._bound = function (data, cmp) {
        var cur = this._root;
        var iter = this.iterator();
        while (cur !== null) {
            var c = this._comparator(data, cur.data);
            if (c === 0) {
                iter._cursor = cur;
                return iter;
            }
            iter._ancestors.push(cur);
            cur = cur.get_child(c > 0);
        }
        for (var i = iter._ancestors.length - 1; i >= 0; --i) {
            cur = iter._ancestors[i];
            if (cmp(data, cur.data) > 0) {
                iter._cursor = cur;
                iter._ancestors.length = i;
                return iter;
            }
        }
        iter._ancestors.length = 0;
        return iter;
    };
    ;
    return TreeBase;
}());
exports.TreeBase = TreeBase;
var Iterator = (function () {
    function Iterator(tree) {
        this._tree = tree;
        this._ancestors = [];
        this._cursor = null;
    }
    Iterator.prototype.data = function () {
        return this._cursor !== null ? this._cursor.data : null;
    };
    ;
    Iterator.prototype.next = function () {
        if (this._cursor === null) {
            var root = this._tree._root;
            if (root !== null) {
                this._minNode(root);
            }
        }
        else {
            if (this._cursor.right === null) {
                var save;
                do {
                    save = this._cursor;
                    if (this._ancestors.length) {
                        this._cursor = this._ancestors.pop();
                    }
                    else {
                        this._cursor = null;
                        break;
                    }
                } while (this._cursor.right === save);
            }
            else {
                this._ancestors.push(this._cursor);
                this._minNode(this._cursor.right);
            }
        }
        return this._cursor !== null ? this._cursor.data : null;
    };
    ;
    Iterator.prototype.prev = function () {
        if (this._cursor === null) {
            var root = this._tree._root;
            if (root !== null) {
                this._maxNode(root);
            }
        }
        else {
            if (this._cursor.left === null) {
                var save;
                do {
                    save = this._cursor;
                    if (this._ancestors.length) {
                        this._cursor = this._ancestors.pop();
                    }
                    else {
                        this._cursor = null;
                        break;
                    }
                } while (this._cursor.left === save);
            }
            else {
                this._ancestors.push(this._cursor);
                this._maxNode(this._cursor.left);
            }
        }
        return this._cursor !== null ? this._cursor.data : null;
    };
    ;
    Iterator.prototype._minNode = function (start) {
        while (start.left !== null) {
            this._ancestors.push(start);
            start = start.left;
        }
        this._cursor = start;
    };
    ;
    Iterator.prototype._maxNode = function (start) {
        while (start.right !== null) {
            this._ancestors.push(start);
            start = start.right;
        }
        this._cursor = start;
    };
    ;
    return Iterator;
}());
exports.Iterator = Iterator;
var Node = (function () {
    function Node(data) {
        this.data = data;
        this.left = null;
        this.right = null;
        this.red = true;
    }
    Node.prototype.get_child = function (dir) {
        return dir ? this.right : this.left;
    };
    ;
    Node.prototype.set_child = function (dir, val) {
        if (dir) {
            this.right = val;
        }
        else {
            this.left = val;
        }
    };
    ;
    return Node;
}());
var RBTree = (function (_super) {
    __extends(RBTree, _super);
    function RBTree(comparator) {
        var _this = _super.call(this) || this;
        _this._root = null;
        _this._comparator = comparator;
        _this.size = 0;
        return _this;
    }
    RBTree.prototype.insert = function (data) {
        var ret = false;
        if (this._root === null) {
            this._root = new Node(data);
            ret = true;
            this.size++;
        }
        else {
            var head = new Node(undefined);
            var dir = false;
            var last = false;
            var gp = null;
            var ggp = head;
            var p = null;
            var node = this._root;
            ggp.right = this._root;
            while (true) {
                if (node === null) {
                    node = new Node(data);
                    p.set_child(dir, node);
                    ret = true;
                    this.size++;
                }
                else if (RBTree.is_red(node.left) && RBTree.is_red(node.right)) {
                    node.red = true;
                    node.left.red = false;
                    node.right.red = false;
                }
                if (RBTree.is_red(node) && RBTree.is_red(p)) {
                    var dir2 = ggp.right === gp;
                    if (node === p.get_child(last)) {
                        ggp.set_child(dir2, RBTree.single_rotate(gp, !last));
                    }
                    else {
                        ggp.set_child(dir2, RBTree.double_rotate(gp, !last));
                    }
                }
                var cmp = this._comparator(node.data, data);
                if (cmp === 0) {
                    break;
                }
                last = dir;
                dir = cmp < 0;
                if (gp !== null) {
                    ggp = gp;
                }
                gp = p;
                p = node;
                node = node.get_child(dir);
            }
            this._root = head.right;
        }
        this._root.red = false;
        return ret;
    };
    ;
    RBTree.prototype.remove = function (data) {
        if (this._root === null) {
            return false;
        }
        var head = new Node(undefined);
        var node = head;
        node.right = this._root;
        var p = null;
        var gp = null;
        var found = null;
        var dir = true;
        while (node.get_child(dir) !== null) {
            var last = dir;
            gp = p;
            p = node;
            node = node.get_child(dir);
            var cmp = this._comparator(data, node.data);
            dir = cmp > 0;
            if (cmp === 0) {
                found = node;
            }
            if (!RBTree.is_red(node) && !RBTree.is_red(node.get_child(dir))) {
                if (RBTree.is_red(node.get_child(!dir))) {
                    var sr = RBTree.single_rotate(node, dir);
                    p.set_child(last, sr);
                    p = sr;
                }
                else if (!RBTree.is_red(node.get_child(!dir))) {
                    var sibling = p.get_child(!last);
                    if (sibling !== null) {
                        if (!RBTree.is_red(sibling.get_child(!last)) && !RBTree.is_red(sibling.get_child(last))) {
                            p.red = false;
                            sibling.red = true;
                            node.red = true;
                        }
                        else {
                            var dir2 = gp.right === p;
                            if (RBTree.is_red(sibling.get_child(last))) {
                                gp.set_child(dir2, RBTree.double_rotate(p, last));
                            }
                            else if (RBTree.is_red(sibling.get_child(!last))) {
                                gp.set_child(dir2, RBTree.single_rotate(p, last));
                            }
                            var gpc = gp.get_child(dir2);
                            gpc.red = true;
                            node.red = true;
                            gpc.left.red = false;
                            gpc.right.red = false;
                        }
                    }
                }
            }
        }
        if (found !== null) {
            found.data = node.data;
            p.set_child(p.right === node, node.get_child(node.left === null));
            this.size--;
        }
        this._root = head.right;
        if (this._root !== null) {
            this._root.red = false;
        }
        return found !== null;
    };
    ;
    RBTree.is_red = function (node) {
        return node !== null && node.red;
    };
    RBTree.single_rotate = function (root, dir) {
        var save = root.get_child(!dir);
        root.set_child(!dir, save.get_child(dir));
        save.set_child(dir, root);
        root.red = true;
        save.red = false;
        return save;
    };
    RBTree.double_rotate = function (root, dir) {
        root.set_child(!dir, RBTree.single_rotate(root.get_child(!dir), !dir));
        return RBTree.single_rotate(root, dir);
    };
    return RBTree;
}(TreeBase));
exports.RBTree = RBTree;

},{}],17:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var vpsc_1 = require("./vpsc");
var rbtree_1 = require("./rbtree");
function computeGroupBounds(g) {
    g.bounds = typeof g.leaves !== "undefined" ?
        g.leaves.reduce(function (r, c) { return c.bounds.union(r); }, Rectangle.empty()) :
        Rectangle.empty();
    if (typeof g.groups !== "undefined")
        g.bounds = g.groups.reduce(function (r, c) { return computeGroupBounds(c).union(r); }, g.bounds);
    g.bounds = g.bounds.inflate(g.padding);
    return g.bounds;
}
exports.computeGroupBounds = computeGroupBounds;
var Rectangle = (function () {
    function Rectangle(x, X, y, Y) {
        this.x = x;
        this.X = X;
        this.y = y;
        this.Y = Y;
    }
    Rectangle.empty = function () { return new Rectangle(Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY); };
    Rectangle.prototype.cx = function () { return (this.x + this.X) / 2; };
    Rectangle.prototype.cy = function () { return (this.y + this.Y) / 2; };
    Rectangle.prototype.overlapX = function (r) {
        var ux = this.cx(), vx = r.cx();
        if (ux <= vx && r.x < this.X)
            return this.X - r.x;
        if (vx <= ux && this.x < r.X)
            return r.X - this.x;
        return 0;
    };
    Rectangle.prototype.overlapY = function (r) {
        var uy = this.cy(), vy = r.cy();
        if (uy <= vy && r.y < this.Y)
            return this.Y - r.y;
        if (vy <= uy && this.y < r.Y)
            return r.Y - this.y;
        return 0;
    };
    Rectangle.prototype.setXCentre = function (cx) {
        var dx = cx - this.cx();
        this.x += dx;
        this.X += dx;
    };
    Rectangle.prototype.setYCentre = function (cy) {
        var dy = cy - this.cy();
        this.y += dy;
        this.Y += dy;
    };
    Rectangle.prototype.width = function () {
        return this.X - this.x;
    };
    Rectangle.prototype.height = function () {
        return this.Y - this.y;
    };
    Rectangle.prototype.union = function (r) {
        return new Rectangle(Math.min(this.x, r.x), Math.max(this.X, r.X), Math.min(this.y, r.y), Math.max(this.Y, r.Y));
    };
    Rectangle.prototype.lineIntersections = function (x1, y1, x2, y2) {
        var sides = [[this.x, this.y, this.X, this.y],
            [this.X, this.y, this.X, this.Y],
            [this.X, this.Y, this.x, this.Y],
            [this.x, this.Y, this.x, this.y]];
        var intersections = [];
        for (var i = 0; i < 4; ++i) {
            var r = Rectangle.lineIntersection(x1, y1, x2, y2, sides[i][0], sides[i][1], sides[i][2], sides[i][3]);
            if (r !== null)
                intersections.push({ x: r.x, y: r.y });
        }
        return intersections;
    };
    Rectangle.prototype.rayIntersection = function (x2, y2) {
        var ints = this.lineIntersections(this.cx(), this.cy(), x2, y2);
        return ints.length > 0 ? ints[0] : null;
    };
    Rectangle.prototype.vertices = function () {
        return [
            { x: this.x, y: this.y },
            { x: this.X, y: this.y },
            { x: this.X, y: this.Y },
            { x: this.x, y: this.Y }
        ];
    };
    Rectangle.lineIntersection = function (x1, y1, x2, y2, x3, y3, x4, y4) {
        var dx12 = x2 - x1, dx34 = x4 - x3, dy12 = y2 - y1, dy34 = y4 - y3, denominator = dy34 * dx12 - dx34 * dy12;
        if (denominator == 0)
            return null;
        var dx31 = x1 - x3, dy31 = y1 - y3, numa = dx34 * dy31 - dy34 * dx31, a = numa / denominator, numb = dx12 * dy31 - dy12 * dx31, b = numb / denominator;
        if (a >= 0 && a <= 1 && b >= 0 && b <= 1) {
            return {
                x: x1 + a * dx12,
                y: y1 + a * dy12
            };
        }
        return null;
    };
    Rectangle.prototype.inflate = function (pad) {
        return new Rectangle(this.x - pad, this.X + pad, this.y - pad, this.Y + pad);
    };
    return Rectangle;
}());
exports.Rectangle = Rectangle;
function makeEdgeBetween(source, target, ah) {
    var si = source.rayIntersection(target.cx(), target.cy()) || { x: source.cx(), y: source.cy() }, ti = target.rayIntersection(source.cx(), source.cy()) || { x: target.cx(), y: target.cy() }, dx = ti.x - si.x, dy = ti.y - si.y, l = Math.sqrt(dx * dx + dy * dy), al = l - ah;
    return {
        sourceIntersection: si,
        targetIntersection: ti,
        arrowStart: { x: si.x + al * dx / l, y: si.y + al * dy / l }
    };
}
exports.makeEdgeBetween = makeEdgeBetween;
function makeEdgeTo(s, target, ah) {
    var ti = target.rayIntersection(s.x, s.y);
    if (!ti)
        ti = { x: target.cx(), y: target.cy() };
    var dx = ti.x - s.x, dy = ti.y - s.y, l = Math.sqrt(dx * dx + dy * dy);
    return { x: ti.x - ah * dx / l, y: ti.y - ah * dy / l };
}
exports.makeEdgeTo = makeEdgeTo;
var Node = (function () {
    function Node(v, r, pos) {
        this.v = v;
        this.r = r;
        this.pos = pos;
        this.prev = makeRBTree();
        this.next = makeRBTree();
    }
    return Node;
}());
var Event = (function () {
    function Event(isOpen, v, pos) {
        this.isOpen = isOpen;
        this.v = v;
        this.pos = pos;
    }
    return Event;
}());
function compareEvents(a, b) {
    if (a.pos > b.pos) {
        return 1;
    }
    if (a.pos < b.pos) {
        return -1;
    }
    if (a.isOpen) {
        return -1;
    }
    if (b.isOpen) {
        return 1;
    }
    return 0;
}
function makeRBTree() {
    return new rbtree_1.RBTree(function (a, b) { return a.pos - b.pos; });
}
var xRect = {
    getCentre: function (r) { return r.cx(); },
    getOpen: function (r) { return r.y; },
    getClose: function (r) { return r.Y; },
    getSize: function (r) { return r.width(); },
    makeRect: function (open, close, center, size) { return new Rectangle(center - size / 2, center + size / 2, open, close); },
    findNeighbours: findXNeighbours
};
var yRect = {
    getCentre: function (r) { return r.cy(); },
    getOpen: function (r) { return r.x; },
    getClose: function (r) { return r.X; },
    getSize: function (r) { return r.height(); },
    makeRect: function (open, close, center, size) { return new Rectangle(open, close, center - size / 2, center + size / 2); },
    findNeighbours: findYNeighbours
};
function generateGroupConstraints(root, f, minSep, isContained) {
    if (isContained === void 0) { isContained = false; }
    var padding = root.padding, gn = typeof root.groups !== 'undefined' ? root.groups.length : 0, ln = typeof root.leaves !== 'undefined' ? root.leaves.length : 0, childConstraints = !gn ? []
        : root.groups.reduce(function (ccs, g) { return ccs.concat(generateGroupConstraints(g, f, minSep, true)); }, []), n = (isContained ? 2 : 0) + ln + gn, vs = new Array(n), rs = new Array(n), i = 0, add = function (r, v) { rs[i] = r; vs[i++] = v; };
    if (isContained) {
        var b = root.bounds, c = f.getCentre(b), s = f.getSize(b) / 2, open = f.getOpen(b), close = f.getClose(b), min = c - s + padding / 2, max = c + s - padding / 2;
        root.minVar.desiredPosition = min;
        add(f.makeRect(open, close, min, padding), root.minVar);
        root.maxVar.desiredPosition = max;
        add(f.makeRect(open, close, max, padding), root.maxVar);
    }
    if (ln)
        root.leaves.forEach(function (l) { return add(l.bounds, l.variable); });
    if (gn)
        root.groups.forEach(function (g) {
            var b = g.bounds;
            add(f.makeRect(f.getOpen(b), f.getClose(b), f.getCentre(b), f.getSize(b)), g.minVar);
        });
    var cs = generateConstraints(rs, vs, f, minSep);
    if (gn) {
        vs.forEach(function (v) { v.cOut = [], v.cIn = []; });
        cs.forEach(function (c) { c.left.cOut.push(c), c.right.cIn.push(c); });
        root.groups.forEach(function (g) {
            var gapAdjustment = (g.padding - f.getSize(g.bounds)) / 2;
            g.minVar.cIn.forEach(function (c) { return c.gap += gapAdjustment; });
            g.minVar.cOut.forEach(function (c) { c.left = g.maxVar; c.gap += gapAdjustment; });
        });
    }
    return childConstraints.concat(cs);
}
function generateConstraints(rs, vars, rect, minSep) {
    var i, n = rs.length;
    var N = 2 * n;
    console.assert(vars.length >= n);
    var events = new Array(N);
    for (i = 0; i < n; ++i) {
        var r = rs[i];
        var v = new Node(vars[i], r, rect.getCentre(r));
        events[i] = new Event(true, v, rect.getOpen(r));
        events[i + n] = new Event(false, v, rect.getClose(r));
    }
    events.sort(compareEvents);
    var cs = new Array();
    var scanline = makeRBTree();
    for (i = 0; i < N; ++i) {
        var e = events[i];
        var v = e.v;
        if (e.isOpen) {
            scanline.insert(v);
            rect.findNeighbours(v, scanline);
        }
        else {
            scanline.remove(v);
            var makeConstraint = function (l, r) {
                var sep = (rect.getSize(l.r) + rect.getSize(r.r)) / 2 + minSep;
                cs.push(new vpsc_1.Constraint(l.v, r.v, sep));
            };
            var visitNeighbours = function (forward, reverse, mkcon) {
                var u, it = v[forward].iterator();
                while ((u = it[forward]()) !== null) {
                    mkcon(u, v);
                    u[reverse].remove(v);
                }
            };
            visitNeighbours("prev", "next", function (u, v) { return makeConstraint(u, v); });
            visitNeighbours("next", "prev", function (u, v) { return makeConstraint(v, u); });
        }
    }
    console.assert(scanline.size === 0);
    return cs;
}
function findXNeighbours(v, scanline) {
    var f = function (forward, reverse) {
        var it = scanline.findIter(v);
        var u;
        while ((u = it[forward]()) !== null) {
            var uovervX = u.r.overlapX(v.r);
            if (uovervX <= 0 || uovervX <= u.r.overlapY(v.r)) {
                v[forward].insert(u);
                u[reverse].insert(v);
            }
            if (uovervX <= 0) {
                break;
            }
        }
    };
    f("next", "prev");
    f("prev", "next");
}
function findYNeighbours(v, scanline) {
    var f = function (forward, reverse) {
        var u = scanline.findIter(v)[forward]();
        if (u !== null && u.r.overlapX(v.r) > 0) {
            v[forward].insert(u);
            u[reverse].insert(v);
        }
    };
    f("next", "prev");
    f("prev", "next");
}
function generateXConstraints(rs, vars) {
    return generateConstraints(rs, vars, xRect, 1e-6);
}
exports.generateXConstraints = generateXConstraints;
function generateYConstraints(rs, vars) {
    return generateConstraints(rs, vars, yRect, 1e-6);
}
exports.generateYConstraints = generateYConstraints;
function generateXGroupConstraints(root) {
    return generateGroupConstraints(root, xRect, 1e-6);
}
exports.generateXGroupConstraints = generateXGroupConstraints;
function generateYGroupConstraints(root) {
    return generateGroupConstraints(root, yRect, 1e-6);
}
exports.generateYGroupConstraints = generateYGroupConstraints;
function removeOverlaps(rs) {
    var vs = rs.map(function (r) { return new vpsc_1.Variable(r.cx()); });
    var cs = generateXConstraints(rs, vs);
    var solver = new vpsc_1.Solver(vs, cs);
    solver.solve();
    vs.forEach(function (v, i) { return rs[i].setXCentre(v.position()); });
    vs = rs.map(function (r) { return new vpsc_1.Variable(r.cy()); });
    cs = generateYConstraints(rs, vs);
    solver = new vpsc_1.Solver(vs, cs);
    solver.solve();
    vs.forEach(function (v, i) { return rs[i].setYCentre(v.position()); });
}
exports.removeOverlaps = removeOverlaps;
var IndexedVariable = (function (_super) {
    __extends(IndexedVariable, _super);
    function IndexedVariable(index, w) {
        var _this = _super.call(this, 0, w) || this;
        _this.index = index;
        return _this;
    }
    return IndexedVariable;
}(vpsc_1.Variable));
exports.IndexedVariable = IndexedVariable;
var Projection = (function () {
    function Projection(nodes, groups, rootGroup, constraints, avoidOverlaps) {
        var _this = this;
        if (rootGroup === void 0) { rootGroup = null; }
        if (constraints === void 0) { constraints = null; }
        if (avoidOverlaps === void 0) { avoidOverlaps = false; }
        this.nodes = nodes;
        this.groups = groups;
        this.rootGroup = rootGroup;
        this.avoidOverlaps = avoidOverlaps;
        this.variables = nodes.map(function (v, i) {
            return v.variable = new IndexedVariable(i, 1);
        });
        if (constraints)
            this.createConstraints(constraints);
        if (avoidOverlaps && rootGroup && typeof rootGroup.groups !== 'undefined') {
            nodes.forEach(function (v) {
                if (!v.width || !v.height) {
                    v.bounds = new Rectangle(v.x, v.x, v.y, v.y);
                    return;
                }
                var w2 = v.width / 2, h2 = v.height / 2;
                v.bounds = new Rectangle(v.x - w2, v.x + w2, v.y - h2, v.y + h2);
            });
            computeGroupBounds(rootGroup);
            var i = nodes.length;
            groups.forEach(function (g) {
                _this.variables[i] = g.minVar = new IndexedVariable(i++, typeof g.stiffness !== "undefined" ? g.stiffness : 0.01);
                _this.variables[i] = g.maxVar = new IndexedVariable(i++, typeof g.stiffness !== "undefined" ? g.stiffness : 0.01);
            });
        }
    }
    Projection.prototype.createSeparation = function (c) {
        return new vpsc_1.Constraint(this.nodes[c.left].variable, this.nodes[c.right].variable, c.gap, typeof c.equality !== "undefined" ? c.equality : false);
    };
    Projection.prototype.makeFeasible = function (c) {
        var _this = this;
        if (!this.avoidOverlaps)
            return;
        var axis = 'x', dim = 'width';
        if (c.axis === 'x')
            axis = 'y', dim = 'height';
        var vs = c.offsets.map(function (o) { return _this.nodes[o.node]; }).sort(function (a, b) { return a[axis] - b[axis]; });
        var p = null;
        vs.forEach(function (v) {
            if (p) {
                var nextPos = p[axis] + p[dim];
                if (nextPos > v[axis]) {
                    v[axis] = nextPos;
                }
            }
            p = v;
        });
    };
    Projection.prototype.createAlignment = function (c) {
        var _this = this;
        var u = this.nodes[c.offsets[0].node].variable;
        this.makeFeasible(c);
        var cs = c.axis === 'x' ? this.xConstraints : this.yConstraints;
        c.offsets.slice(1).forEach(function (o) {
            var v = _this.nodes[o.node].variable;
            cs.push(new vpsc_1.Constraint(u, v, o.offset, true));
        });
    };
    Projection.prototype.createConstraints = function (constraints) {
        var _this = this;
        var isSep = function (c) { return typeof c.type === 'undefined' || c.type === 'separation'; };
        this.xConstraints = constraints
            .filter(function (c) { return c.axis === "x" && isSep(c); })
            .map(function (c) { return _this.createSeparation(c); });
        this.yConstraints = constraints
            .filter(function (c) { return c.axis === "y" && isSep(c); })
            .map(function (c) { return _this.createSeparation(c); });
        constraints
            .filter(function (c) { return c.type === 'alignment'; })
            .forEach(function (c) { return _this.createAlignment(c); });
    };
    Projection.prototype.setupVariablesAndBounds = function (x0, y0, desired, getDesired) {
        this.nodes.forEach(function (v, i) {
            if (v.fixed) {
                v.variable.weight = v.fixedWeight ? v.fixedWeight : 1000;
                desired[i] = getDesired(v);
            }
            else {
                v.variable.weight = 1;
            }
            var w = (v.width || 0) / 2, h = (v.height || 0) / 2;
            var ix = x0[i], iy = y0[i];
            v.bounds = new Rectangle(ix - w, ix + w, iy - h, iy + h);
        });
    };
    Projection.prototype.xProject = function (x0, y0, x) {
        if (!this.rootGroup && !(this.avoidOverlaps || this.xConstraints))
            return;
        this.project(x0, y0, x0, x, function (v) { return v.px; }, this.xConstraints, generateXGroupConstraints, function (v) { return v.bounds.setXCentre(x[v.variable.index] = v.variable.position()); }, function (g) {
            var xmin = x[g.minVar.index] = g.minVar.position();
            var xmax = x[g.maxVar.index] = g.maxVar.position();
            var p2 = g.padding / 2;
            g.bounds.x = xmin - p2;
            g.bounds.X = xmax + p2;
        });
    };
    Projection.prototype.yProject = function (x0, y0, y) {
        if (!this.rootGroup && !this.yConstraints)
            return;
        this.project(x0, y0, y0, y, function (v) { return v.py; }, this.yConstraints, generateYGroupConstraints, function (v) { return v.bounds.setYCentre(y[v.variable.index] = v.variable.position()); }, function (g) {
            var ymin = y[g.minVar.index] = g.minVar.position();
            var ymax = y[g.maxVar.index] = g.maxVar.position();
            var p2 = g.padding / 2;
            g.bounds.y = ymin - p2;
            ;
            g.bounds.Y = ymax + p2;
        });
    };
    Projection.prototype.projectFunctions = function () {
        var _this = this;
        return [
            function (x0, y0, x) { return _this.xProject(x0, y0, x); },
            function (x0, y0, y) { return _this.yProject(x0, y0, y); }
        ];
    };
    Projection.prototype.project = function (x0, y0, start, desired, getDesired, cs, generateConstraints, updateNodeBounds, updateGroupBounds) {
        this.setupVariablesAndBounds(x0, y0, desired, getDesired);
        if (this.rootGroup && this.avoidOverlaps) {
            computeGroupBounds(this.rootGroup);
            cs = cs.concat(generateConstraints(this.rootGroup));
        }
        this.solve(this.variables, cs, start, desired);
        this.nodes.forEach(updateNodeBounds);
        if (this.rootGroup && this.avoidOverlaps) {
            this.groups.forEach(updateGroupBounds);
            computeGroupBounds(this.rootGroup);
        }
    };
    Projection.prototype.solve = function (vs, cs, starting, desired) {
        var solver = new vpsc_1.Solver(vs, cs);
        solver.setStartingPositions(starting);
        solver.setDesiredPositions(desired);
        solver.solve();
    };
    return Projection;
}());
exports.Projection = Projection;

},{"./rbtree":16,"./vpsc":19}],18:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var pqueue_1 = require("./pqueue");
var Neighbour = (function () {
    function Neighbour(id, distance) {
        this.id = id;
        this.distance = distance;
    }
    return Neighbour;
}());
var Node = (function () {
    function Node(id) {
        this.id = id;
        this.neighbours = [];
    }
    return Node;
}());
var QueueEntry = (function () {
    function QueueEntry(node, prev, d) {
        this.node = node;
        this.prev = prev;
        this.d = d;
    }
    return QueueEntry;
}());
var Calculator = (function () {
    function Calculator(n, es, getSourceIndex, getTargetIndex, getLength) {
        this.n = n;
        this.es = es;
        this.neighbours = new Array(this.n);
        var i = this.n;
        while (i--)
            this.neighbours[i] = new Node(i);
        i = this.es.length;
        while (i--) {
            var e = this.es[i];
            var u = getSourceIndex(e), v = getTargetIndex(e);
            var d = getLength(e);
            this.neighbours[u].neighbours.push(new Neighbour(v, d));
            this.neighbours[v].neighbours.push(new Neighbour(u, d));
        }
    }
    Calculator.prototype.DistanceMatrix = function () {
        var D = new Array(this.n);
        for (var i = 0; i < this.n; ++i) {
            D[i] = this.dijkstraNeighbours(i);
        }
        return D;
    };
    Calculator.prototype.DistancesFromNode = function (start) {
        return this.dijkstraNeighbours(start);
    };
    Calculator.prototype.PathFromNodeToNode = function (start, end) {
        return this.dijkstraNeighbours(start, end);
    };
    Calculator.prototype.PathFromNodeToNodeWithPrevCost = function (start, end, prevCost) {
        var q = new pqueue_1.PriorityQueue(function (a, b) { return a.d <= b.d; }), u = this.neighbours[start], qu = new QueueEntry(u, null, 0), visitedFrom = {};
        q.push(qu);
        while (!q.empty()) {
            qu = q.pop();
            u = qu.node;
            if (u.id === end) {
                break;
            }
            var i = u.neighbours.length;
            while (i--) {
                var neighbour = u.neighbours[i], v = this.neighbours[neighbour.id];
                if (qu.prev && v.id === qu.prev.node.id)
                    continue;
                var viduid = v.id + ',' + u.id;
                if (viduid in visitedFrom && visitedFrom[viduid] <= qu.d)
                    continue;
                var cc = qu.prev ? prevCost(qu.prev.node.id, u.id, v.id) : 0, t = qu.d + neighbour.distance + cc;
                visitedFrom[viduid] = t;
                q.push(new QueueEntry(v, qu, t));
            }
        }
        var path = [];
        while (qu.prev) {
            qu = qu.prev;
            path.push(qu.node.id);
        }
        return path;
    };
    Calculator.prototype.dijkstraNeighbours = function (start, dest) {
        if (dest === void 0) { dest = -1; }
        var q = new pqueue_1.PriorityQueue(function (a, b) { return a.d <= b.d; }), i = this.neighbours.length, d = new Array(i);
        while (i--) {
            var node = this.neighbours[i];
            node.d = i === start ? 0 : Number.POSITIVE_INFINITY;
            node.q = q.push(node);
        }
        while (!q.empty()) {
            var u = q.pop();
            d[u.id] = u.d;
            if (u.id === dest) {
                var path = [];
                var v = u;
                while (typeof v.prev !== 'undefined') {
                    path.push(v.prev.id);
                    v = v.prev;
                }
                return path;
            }
            i = u.neighbours.length;
            while (i--) {
                var neighbour = u.neighbours[i];
                var v = this.neighbours[neighbour.id];
                var t = u.d + neighbour.distance;
                if (u.d !== Number.MAX_VALUE && v.d > t) {
                    v.d = t;
                    v.prev = u;
                    q.reduceKey(v.q, v, function (e, q) { return e.q = q; });
                }
            }
        }
        return d;
    };
    return Calculator;
}());
exports.Calculator = Calculator;

},{"./pqueue":15}],19:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PositionStats = (function () {
    function PositionStats(scale) {
        this.scale = scale;
        this.AB = 0;
        this.AD = 0;
        this.A2 = 0;
    }
    PositionStats.prototype.addVariable = function (v) {
        var ai = this.scale / v.scale;
        var bi = v.offset / v.scale;
        var wi = v.weight;
        this.AB += wi * ai * bi;
        this.AD += wi * ai * v.desiredPosition;
        this.A2 += wi * ai * ai;
    };
    PositionStats.prototype.getPosn = function () {
        return (this.AD - this.AB) / this.A2;
    };
    return PositionStats;
}());
exports.PositionStats = PositionStats;
var Constraint = (function () {
    function Constraint(left, right, gap, equality) {
        if (equality === void 0) { equality = false; }
        this.left = left;
        this.right = right;
        this.gap = gap;
        this.equality = equality;
        this.active = false;
        this.unsatisfiable = false;
        this.left = left;
        this.right = right;
        this.gap = gap;
        this.equality = equality;
    }
    Constraint.prototype.slack = function () {
        return this.unsatisfiable ? Number.MAX_VALUE
            : this.right.scale * this.right.position() - this.gap
                - this.left.scale * this.left.position();
    };
    return Constraint;
}());
exports.Constraint = Constraint;
var Variable = (function () {
    function Variable(desiredPosition, weight, scale) {
        if (weight === void 0) { weight = 1; }
        if (scale === void 0) { scale = 1; }
        this.desiredPosition = desiredPosition;
        this.weight = weight;
        this.scale = scale;
        this.offset = 0;
    }
    Variable.prototype.dfdv = function () {
        return 2.0 * this.weight * (this.position() - this.desiredPosition);
    };
    Variable.prototype.position = function () {
        return (this.block.ps.scale * this.block.posn + this.offset) / this.scale;
    };
    Variable.prototype.visitNeighbours = function (prev, f) {
        var ff = function (c, next) { return c.active && prev !== next && f(c, next); };
        this.cOut.forEach(function (c) { return ff(c, c.right); });
        this.cIn.forEach(function (c) { return ff(c, c.left); });
    };
    return Variable;
}());
exports.Variable = Variable;
var Block = (function () {
    function Block(v) {
        this.vars = [];
        v.offset = 0;
        this.ps = new PositionStats(v.scale);
        this.addVariable(v);
    }
    Block.prototype.addVariable = function (v) {
        v.block = this;
        this.vars.push(v);
        this.ps.addVariable(v);
        this.posn = this.ps.getPosn();
    };
    Block.prototype.updateWeightedPosition = function () {
        this.ps.AB = this.ps.AD = this.ps.A2 = 0;
        for (var i = 0, n = this.vars.length; i < n; ++i)
            this.ps.addVariable(this.vars[i]);
        this.posn = this.ps.getPosn();
    };
    Block.prototype.compute_lm = function (v, u, postAction) {
        var _this = this;
        var dfdv = v.dfdv();
        v.visitNeighbours(u, function (c, next) {
            var _dfdv = _this.compute_lm(next, v, postAction);
            if (next === c.right) {
                dfdv += _dfdv * c.left.scale;
                c.lm = _dfdv;
            }
            else {
                dfdv += _dfdv * c.right.scale;
                c.lm = -_dfdv;
            }
            postAction(c);
        });
        return dfdv / v.scale;
    };
    Block.prototype.populateSplitBlock = function (v, prev) {
        var _this = this;
        v.visitNeighbours(prev, function (c, next) {
            next.offset = v.offset + (next === c.right ? c.gap : -c.gap);
            _this.addVariable(next);
            _this.populateSplitBlock(next, v);
        });
    };
    Block.prototype.traverse = function (visit, acc, v, prev) {
        var _this = this;
        if (v === void 0) { v = this.vars[0]; }
        if (prev === void 0) { prev = null; }
        v.visitNeighbours(prev, function (c, next) {
            acc.push(visit(c));
            _this.traverse(visit, acc, next, v);
        });
    };
    Block.prototype.findMinLM = function () {
        var m = null;
        this.compute_lm(this.vars[0], null, function (c) {
            if (!c.equality && (m === null || c.lm < m.lm))
                m = c;
        });
        return m;
    };
    Block.prototype.findMinLMBetween = function (lv, rv) {
        this.compute_lm(lv, null, function () { });
        var m = null;
        this.findPath(lv, null, rv, function (c, next) {
            if (!c.equality && c.right === next && (m === null || c.lm < m.lm))
                m = c;
        });
        return m;
    };
    Block.prototype.findPath = function (v, prev, to, visit) {
        var _this = this;
        var endFound = false;
        v.visitNeighbours(prev, function (c, next) {
            if (!endFound && (next === to || _this.findPath(next, v, to, visit))) {
                endFound = true;
                visit(c, next);
            }
        });
        return endFound;
    };
    Block.prototype.isActiveDirectedPathBetween = function (u, v) {
        if (u === v)
            return true;
        var i = u.cOut.length;
        while (i--) {
            var c = u.cOut[i];
            if (c.active && this.isActiveDirectedPathBetween(c.right, v))
                return true;
        }
        return false;
    };
    Block.split = function (c) {
        c.active = false;
        return [Block.createSplitBlock(c.left), Block.createSplitBlock(c.right)];
    };
    Block.createSplitBlock = function (startVar) {
        var b = new Block(startVar);
        b.populateSplitBlock(startVar, null);
        return b;
    };
    Block.prototype.splitBetween = function (vl, vr) {
        var c = this.findMinLMBetween(vl, vr);
        if (c !== null) {
            var bs = Block.split(c);
            return { constraint: c, lb: bs[0], rb: bs[1] };
        }
        return null;
    };
    Block.prototype.mergeAcross = function (b, c, dist) {
        c.active = true;
        for (var i = 0, n = b.vars.length; i < n; ++i) {
            var v = b.vars[i];
            v.offset += dist;
            this.addVariable(v);
        }
        this.posn = this.ps.getPosn();
    };
    Block.prototype.cost = function () {
        var sum = 0, i = this.vars.length;
        while (i--) {
            var v = this.vars[i], d = v.position() - v.desiredPosition;
            sum += d * d * v.weight;
        }
        return sum;
    };
    return Block;
}());
exports.Block = Block;
var Blocks = (function () {
    function Blocks(vs) {
        this.vs = vs;
        var n = vs.length;
        this.list = new Array(n);
        while (n--) {
            var b = new Block(vs[n]);
            this.list[n] = b;
            b.blockInd = n;
        }
    }
    Blocks.prototype.cost = function () {
        var sum = 0, i = this.list.length;
        while (i--)
            sum += this.list[i].cost();
        return sum;
    };
    Blocks.prototype.insert = function (b) {
        b.blockInd = this.list.length;
        this.list.push(b);
    };
    Blocks.prototype.remove = function (b) {
        var last = this.list.length - 1;
        var swapBlock = this.list[last];
        this.list.length = last;
        if (b !== swapBlock) {
            this.list[b.blockInd] = swapBlock;
            swapBlock.blockInd = b.blockInd;
        }
    };
    Blocks.prototype.merge = function (c) {
        var l = c.left.block, r = c.right.block;
        var dist = c.right.offset - c.left.offset - c.gap;
        if (l.vars.length < r.vars.length) {
            r.mergeAcross(l, c, dist);
            this.remove(l);
        }
        else {
            l.mergeAcross(r, c, -dist);
            this.remove(r);
        }
    };
    Blocks.prototype.forEach = function (f) {
        this.list.forEach(f);
    };
    Blocks.prototype.updateBlockPositions = function () {
        this.list.forEach(function (b) { return b.updateWeightedPosition(); });
    };
    Blocks.prototype.split = function (inactive) {
        var _this = this;
        this.updateBlockPositions();
        this.list.forEach(function (b) {
            var v = b.findMinLM();
            if (v !== null && v.lm < Solver.LAGRANGIAN_TOLERANCE) {
                b = v.left.block;
                Block.split(v).forEach(function (nb) { return _this.insert(nb); });
                _this.remove(b);
                inactive.push(v);
            }
        });
    };
    return Blocks;
}());
exports.Blocks = Blocks;
var Solver = (function () {
    function Solver(vs, cs) {
        this.vs = vs;
        this.cs = cs;
        this.vs = vs;
        vs.forEach(function (v) {
            v.cIn = [], v.cOut = [];
        });
        this.cs = cs;
        cs.forEach(function (c) {
            c.left.cOut.push(c);
            c.right.cIn.push(c);
        });
        this.inactive = cs.map(function (c) { c.active = false; return c; });
        this.bs = null;
    }
    Solver.prototype.cost = function () {
        return this.bs.cost();
    };
    Solver.prototype.setStartingPositions = function (ps) {
        this.inactive = this.cs.map(function (c) { c.active = false; return c; });
        this.bs = new Blocks(this.vs);
        this.bs.forEach(function (b, i) { return b.posn = ps[i]; });
    };
    Solver.prototype.setDesiredPositions = function (ps) {
        this.vs.forEach(function (v, i) { return v.desiredPosition = ps[i]; });
    };
    Solver.prototype.mostViolated = function () {
        var minSlack = Number.MAX_VALUE, v = null, l = this.inactive, n = l.length, deletePoint = n;
        for (var i = 0; i < n; ++i) {
            var c = l[i];
            if (c.unsatisfiable)
                continue;
            var slack = c.slack();
            if (c.equality || slack < minSlack) {
                minSlack = slack;
                v = c;
                deletePoint = i;
                if (c.equality)
                    break;
            }
        }
        if (deletePoint !== n &&
            (minSlack < Solver.ZERO_UPPERBOUND && !v.active || v.equality)) {
            l[deletePoint] = l[n - 1];
            l.length = n - 1;
        }
        return v;
    };
    Solver.prototype.satisfy = function () {
        if (this.bs == null) {
            this.bs = new Blocks(this.vs);
        }
        this.bs.split(this.inactive);
        var v = null;
        while ((v = this.mostViolated()) && (v.equality || v.slack() < Solver.ZERO_UPPERBOUND && !v.active)) {
            var lb = v.left.block, rb = v.right.block;
            if (lb !== rb) {
                this.bs.merge(v);
            }
            else {
                if (lb.isActiveDirectedPathBetween(v.right, v.left)) {
                    v.unsatisfiable = true;
                    continue;
                }
                var split = lb.splitBetween(v.left, v.right);
                if (split !== null) {
                    this.bs.insert(split.lb);
                    this.bs.insert(split.rb);
                    this.bs.remove(lb);
                    this.inactive.push(split.constraint);
                }
                else {
                    v.unsatisfiable = true;
                    continue;
                }
                if (v.slack() >= 0) {
                    this.inactive.push(v);
                }
                else {
                    this.bs.merge(v);
                }
            }
        }
    };
    Solver.prototype.solve = function () {
        this.satisfy();
        var lastcost = Number.MAX_VALUE, cost = this.bs.cost();
        while (Math.abs(lastcost - cost) > 0.0001) {
            this.satisfy();
            lastcost = cost;
            cost = this.bs.cost();
        }
        return cost;
    };
    Solver.LAGRANGIAN_TOLERANCE = -1e-4;
    Solver.ZERO_UPPERBOUND = -1e-10;
    return Solver;
}());
exports.Solver = Solver;
function removeOverlapInOneDimension(spans, lowerBound, upperBound) {
    var vs = spans.map(function (s) { return new Variable(s.desiredCenter); });
    var cs = [];
    var n = spans.length;
    for (var i = 0; i < n - 1; i++) {
        var left = spans[i], right = spans[i + 1];
        cs.push(new Constraint(vs[i], vs[i + 1], (left.size + right.size) / 2));
    }
    var leftMost = vs[0], rightMost = vs[n - 1], leftMostSize = spans[0].size / 2, rightMostSize = spans[n - 1].size / 2;
    var vLower = null, vUpper = null;
    if (lowerBound) {
        vLower = new Variable(lowerBound, leftMost.weight * 1000);
        vs.push(vLower);
        cs.push(new Constraint(vLower, leftMost, leftMostSize));
    }
    if (upperBound) {
        vUpper = new Variable(upperBound, rightMost.weight * 1000);
        vs.push(vUpper);
        cs.push(new Constraint(rightMost, vUpper, rightMostSize));
    }
    var solver = new Solver(vs, cs);
    solver.solve();
    return {
        newCenters: vs.slice(0, spans.length).map(function (v) { return v.position(); }),
        lowerBound: vLower ? vLower.position() : leftMost.position() - leftMostSize,
        upperBound: vUpper ? vUpper.position() : rightMost.position() + rightMostSize
    };
}
exports.removeOverlapInOneDimension = removeOverlapInOneDimension;

},{}]},{},[1])(1)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkaXN0L2luZGV4LmpzIiwiZGlzdC9zcmMvYWRhcHRvci5qcyIsImRpc3Qvc3JjL2JhdGNoLmpzIiwiZGlzdC9zcmMvZDNhZGFwdG9yLmpzIiwiZGlzdC9zcmMvZDN2M2FkYXB0b3IuanMiLCJkaXN0L3NyYy9kM3Y0YWRhcHRvci5qcyIsImRpc3Qvc3JjL2Rlc2NlbnQuanMiLCJkaXN0L3NyYy9nZW9tLmpzIiwiZGlzdC9zcmMvZ3JpZHJvdXRlci5qcyIsImRpc3Qvc3JjL2hhbmRsZWRpc2Nvbm5lY3RlZC5qcyIsImRpc3Qvc3JjL2xheW91dC5qcyIsImRpc3Qvc3JjL2xheW91dDNkLmpzIiwiZGlzdC9zcmMvbGlua2xlbmd0aHMuanMiLCJkaXN0L3NyYy9wb3dlcmdyYXBoLmpzIiwiZGlzdC9zcmMvcHF1ZXVlLmpzIiwiZGlzdC9zcmMvcmJ0cmVlLmpzIiwiZGlzdC9zcmMvcmVjdGFuZ2xlLmpzIiwiZGlzdC9zcmMvc2hvcnRlc3RwYXRocy5qcyIsImRpc3Qvc3JjL3Zwc2MuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2YUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcmlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1VEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JZQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbmRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiXCJ1c2Ugc3RyaWN0XCI7XG5mdW5jdGlvbiBfX2V4cG9ydChtKSB7XG4gICAgZm9yICh2YXIgcCBpbiBtKSBpZiAoIWV4cG9ydHMuaGFzT3duUHJvcGVydHkocCkpIGV4cG9ydHNbcF0gPSBtW3BdO1xufVxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuX19leHBvcnQocmVxdWlyZShcIi4vc3JjL2FkYXB0b3JcIikpO1xuX19leHBvcnQocmVxdWlyZShcIi4vc3JjL2QzYWRhcHRvclwiKSk7XG5fX2V4cG9ydChyZXF1aXJlKFwiLi9zcmMvZGVzY2VudFwiKSk7XG5fX2V4cG9ydChyZXF1aXJlKFwiLi9zcmMvZ2VvbVwiKSk7XG5fX2V4cG9ydChyZXF1aXJlKFwiLi9zcmMvZ3JpZHJvdXRlclwiKSk7XG5fX2V4cG9ydChyZXF1aXJlKFwiLi9zcmMvaGFuZGxlZGlzY29ubmVjdGVkXCIpKTtcbl9fZXhwb3J0KHJlcXVpcmUoXCIuL3NyYy9sYXlvdXRcIikpO1xuX19leHBvcnQocmVxdWlyZShcIi4vc3JjL2xheW91dDNkXCIpKTtcbl9fZXhwb3J0KHJlcXVpcmUoXCIuL3NyYy9saW5rbGVuZ3Roc1wiKSk7XG5fX2V4cG9ydChyZXF1aXJlKFwiLi9zcmMvcG93ZXJncmFwaFwiKSk7XG5fX2V4cG9ydChyZXF1aXJlKFwiLi9zcmMvcHF1ZXVlXCIpKTtcbl9fZXhwb3J0KHJlcXVpcmUoXCIuL3NyYy9yYnRyZWVcIikpO1xuX19leHBvcnQocmVxdWlyZShcIi4vc3JjL3JlY3RhbmdsZVwiKSk7XG5fX2V4cG9ydChyZXF1aXJlKFwiLi9zcmMvc2hvcnRlc3RwYXRoc1wiKSk7XG5fX2V4cG9ydChyZXF1aXJlKFwiLi9zcmMvdnBzY1wiKSk7XG5fX2V4cG9ydChyZXF1aXJlKFwiLi9zcmMvYmF0Y2hcIikpO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKbWFXeGxJam9pYVc1a1pYZ3Vhbk1pTENKemIzVnlZMlZTYjI5MElqb2lJaXdpYzI5MWNtTmxjeUk2V3lJdUxpOVhaV0pEYjJ4aEwybHVaR1Y0TG5SeklsMHNJbTVoYldWeklqcGJYU3dpYldGd2NHbHVaM01pT2lJN096czdPMEZCUVVFc2JVTkJRVFpDTzBGQlF6ZENMSEZEUVVFclFqdEJRVU12UWl4dFEwRkJOa0k3UVVGRE4wSXNaME5CUVRCQ08wRkJRekZDTEhORFFVRm5RenRCUVVOb1F5dzRRMEZCZDBNN1FVRkRlRU1zYTBOQlFUUkNPMEZCUXpWQ0xHOURRVUU0UWp0QlFVTTVRaXgxUTBGQmFVTTdRVUZEYWtNc2MwTkJRV2RETzBGQlEyaERMR3REUVVFMFFqdEJRVU0xUWl4clEwRkJORUk3UVVGRE5VSXNjVU5CUVN0Q08wRkJReTlDTEhsRFFVRnRRenRCUVVOdVF5eG5RMEZCTUVJN1FVRkRNVUlzYVVOQlFUSkNJbjA9IiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19leHRlbmRzID0gKHRoaXMgJiYgdGhpcy5fX2V4dGVuZHMpIHx8IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGV4dGVuZFN0YXRpY3MgPSBmdW5jdGlvbiAoZCwgYikge1xuICAgICAgICBleHRlbmRTdGF0aWNzID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8XG4gICAgICAgICAgICAoeyBfX3Byb3RvX186IFtdIH0gaW5zdGFuY2VvZiBBcnJheSAmJiBmdW5jdGlvbiAoZCwgYikgeyBkLl9fcHJvdG9fXyA9IGI7IH0pIHx8XG4gICAgICAgICAgICBmdW5jdGlvbiAoZCwgYikgeyBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTsgfTtcbiAgICAgICAgcmV0dXJuIGV4dGVuZFN0YXRpY3MoZCwgYik7XG4gICAgfTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGQsIGIpIHtcbiAgICAgICAgZXh0ZW5kU3RhdGljcyhkLCBiKTtcbiAgICAgICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XG4gICAgICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcbiAgICB9O1xufSkoKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBsYXlvdXRfMSA9IHJlcXVpcmUoXCIuL2xheW91dFwiKTtcbnZhciBMYXlvdXRBZGFwdG9yID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoTGF5b3V0QWRhcHRvciwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBMYXlvdXRBZGFwdG9yKG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcykgfHwgdGhpcztcbiAgICAgICAgdmFyIHNlbGYgPSBfdGhpcztcbiAgICAgICAgdmFyIG8gPSBvcHRpb25zO1xuICAgICAgICBpZiAoby50cmlnZ2VyKSB7XG4gICAgICAgICAgICBfdGhpcy50cmlnZ2VyID0gby50cmlnZ2VyO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvLmtpY2spIHtcbiAgICAgICAgICAgIF90aGlzLmtpY2sgPSBvLmtpY2s7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG8uZHJhZykge1xuICAgICAgICAgICAgX3RoaXMuZHJhZyA9IG8uZHJhZztcbiAgICAgICAgfVxuICAgICAgICBpZiAoby5vbikge1xuICAgICAgICAgICAgX3RoaXMub24gPSBvLm9uO1xuICAgICAgICB9XG4gICAgICAgIF90aGlzLmRyYWdzdGFydCA9IF90aGlzLmRyYWdTdGFydCA9IGxheW91dF8xLkxheW91dC5kcmFnU3RhcnQ7XG4gICAgICAgIF90aGlzLmRyYWdlbmQgPSBfdGhpcy5kcmFnRW5kID0gbGF5b3V0XzEuTGF5b3V0LmRyYWdFbmQ7XG4gICAgICAgIHJldHVybiBfdGhpcztcbiAgICB9XG4gICAgTGF5b3V0QWRhcHRvci5wcm90b3R5cGUudHJpZ2dlciA9IGZ1bmN0aW9uIChlKSB7IH07XG4gICAgO1xuICAgIExheW91dEFkYXB0b3IucHJvdG90eXBlLmtpY2sgPSBmdW5jdGlvbiAoKSB7IH07XG4gICAgO1xuICAgIExheW91dEFkYXB0b3IucHJvdG90eXBlLmRyYWcgPSBmdW5jdGlvbiAoKSB7IH07XG4gICAgO1xuICAgIExheW91dEFkYXB0b3IucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gKGV2ZW50VHlwZSwgbGlzdGVuZXIpIHsgcmV0dXJuIHRoaXM7IH07XG4gICAgO1xuICAgIHJldHVybiBMYXlvdXRBZGFwdG9yO1xufShsYXlvdXRfMS5MYXlvdXQpKTtcbmV4cG9ydHMuTGF5b3V0QWRhcHRvciA9IExheW91dEFkYXB0b3I7XG5mdW5jdGlvbiBhZGFwdG9yKG9wdGlvbnMpIHtcbiAgICByZXR1cm4gbmV3IExheW91dEFkYXB0b3Iob3B0aW9ucyk7XG59XG5leHBvcnRzLmFkYXB0b3IgPSBhZGFwdG9yO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKbWFXeGxJam9pWVdSaGNIUnZjaTVxY3lJc0luTnZkWEpqWlZKdmIzUWlPaUlpTENKemIzVnlZMlZ6SWpwYklpNHVMeTR1TDFkbFlrTnZiR0V2YzNKakwyRmtZWEIwYjNJdWRITWlYU3dpYm1GdFpYTWlPbHRkTENKdFlYQndhVzVuY3lJNklqczdPenM3T3pzN096czdPenM3TzBGQlFVRXNiVU5CUVdsRU8wRkJSVGRETzBsQlFXMURMR2xEUVVGTk8wbEJZWEpETEhWQ1FVRmhMRTlCUVU4N1VVRkJjRUlzV1VGRFNTeHBRa0ZCVHl4VFFYbENWanRSUVhKQ1J5eEpRVUZKTEVsQlFVa3NSMEZCUnl4TFFVRkpMRU5CUVVNN1VVRkRhRUlzU1VGQlNTeERRVUZETEVkQlFVY3NUMEZCVHl4RFFVRkRPMUZCUldoQ0xFbEJRVXNzUTBGQlF5eERRVUZETEU5QlFVOHNSVUZCUnp0WlFVTmlMRXRCUVVrc1EwRkJReXhQUVVGUExFZEJRVWNzUTBGQlF5eERRVUZETEU5QlFVOHNRMEZCUXp0VFFVTTFRanRSUVVWRUxFbEJRVXNzUTBGQlF5eERRVUZETEVsQlFVa3NSVUZCUlR0WlFVTlVMRXRCUVVrc1EwRkJReXhKUVVGSkxFZEJRVWNzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXp0VFFVTjBRanRSUVVWRUxFbEJRVXNzUTBGQlF5eERRVUZETEVsQlFVa3NSVUZCUlR0WlFVTlVMRXRCUVVrc1EwRkJReXhKUVVGSkxFZEJRVWNzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXp0VFFVTjBRanRSUVVWRUxFbEJRVXNzUTBGQlF5eERRVUZETEVWQlFVVXNSVUZCUlR0WlFVTlFMRXRCUVVrc1EwRkJReXhGUVVGRkxFZEJRVWNzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXp0VFFVTnNRanRSUVVWRUxFdEJRVWtzUTBGQlF5eFRRVUZUTEVkQlFVY3NTMEZCU1N4RFFVRkRMRk5CUVZNc1IwRkJSeXhsUVVGTkxFTkJRVU1zVTBGQlV5eERRVUZETzFGQlEyNUVMRXRCUVVrc1EwRkJReXhQUVVGUExFZEJRVWNzUzBGQlNTeERRVUZETEU5QlFVOHNSMEZCUnl4bFFVRk5MRU5CUVVNc1QwRkJUeXhEUVVGRE96dEpRVU5xUkN4RFFVRkRPMGxCY0VORUxDdENRVUZQTEVkQlFWQXNWVUZCVVN4RFFVRlJMRWxCUVVjc1EwRkJRenRKUVVGQkxFTkJRVU03U1VGRGNrSXNORUpCUVVrc1IwRkJTaXhqUVVGUkxFTkJRVU03U1VGQlFTeERRVUZETzBsQlExWXNORUpCUVVrc1IwRkJTaXhqUVVGUkxFTkJRVU03U1VGQlFTeERRVUZETzBsQlExWXNNRUpCUVVVc1IwRkJSaXhWUVVGSExGTkJRVFpDTEVWQlFVVXNVVUZCYjBJc1NVRkJWeXhQUVVGUExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTTdTVUZCUVN4RFFVRkRPMGxCYTBOd1JpeHZRa0ZCUXp0QlFVRkVMRU5CUVVNc1FVRjRRMFFzUTBGQmJVTXNaVUZCVFN4SFFYZERlRU03UVVGNFExa3NjME5CUVdFN1FVRTJRekZDTEZOQlFXZENMRTlCUVU4c1EwRkJSU3hQUVVGUE8wbEJRelZDTEU5QlFVOHNTVUZCU1N4aFFVRmhMRU5CUVVVc1QwRkJUeXhEUVVGRkxFTkJRVU03UVVGRGVFTXNRMEZCUXp0QlFVWkVMREJDUVVWREluMD0iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBsYXlvdXRfMSA9IHJlcXVpcmUoXCIuL2xheW91dFwiKTtcbnZhciBncmlkcm91dGVyXzEgPSByZXF1aXJlKFwiLi9ncmlkcm91dGVyXCIpO1xuZnVuY3Rpb24gZ3JpZGlmeShwZ0xheW91dCwgbnVkZ2VHYXAsIG1hcmdpbiwgZ3JvdXBNYXJnaW4pIHtcbiAgICBwZ0xheW91dC5jb2xhLnN0YXJ0KDAsIDAsIDAsIDEwLCBmYWxzZSk7XG4gICAgdmFyIGdyaWRyb3V0ZXIgPSByb3V0ZShwZ0xheW91dC5jb2xhLm5vZGVzKCksIHBnTGF5b3V0LmNvbGEuZ3JvdXBzKCksIG1hcmdpbiwgZ3JvdXBNYXJnaW4pO1xuICAgIHJldHVybiBncmlkcm91dGVyLnJvdXRlRWRnZXMocGdMYXlvdXQucG93ZXJHcmFwaC5wb3dlckVkZ2VzLCBudWRnZUdhcCwgZnVuY3Rpb24gKGUpIHsgcmV0dXJuIGUuc291cmNlLnJvdXRlck5vZGUuaWQ7IH0sIGZ1bmN0aW9uIChlKSB7IHJldHVybiBlLnRhcmdldC5yb3V0ZXJOb2RlLmlkOyB9KTtcbn1cbmV4cG9ydHMuZ3JpZGlmeSA9IGdyaWRpZnk7XG5mdW5jdGlvbiByb3V0ZShub2RlcywgZ3JvdXBzLCBtYXJnaW4sIGdyb3VwTWFyZ2luKSB7XG4gICAgbm9kZXMuZm9yRWFjaChmdW5jdGlvbiAoZCkge1xuICAgICAgICBkLnJvdXRlck5vZGUgPSB7XG4gICAgICAgICAgICBuYW1lOiBkLm5hbWUsXG4gICAgICAgICAgICBib3VuZHM6IGQuYm91bmRzLmluZmxhdGUoLW1hcmdpbilcbiAgICAgICAgfTtcbiAgICB9KTtcbiAgICBncm91cHMuZm9yRWFjaChmdW5jdGlvbiAoZCkge1xuICAgICAgICBkLnJvdXRlck5vZGUgPSB7XG4gICAgICAgICAgICBib3VuZHM6IGQuYm91bmRzLmluZmxhdGUoLWdyb3VwTWFyZ2luKSxcbiAgICAgICAgICAgIGNoaWxkcmVuOiAodHlwZW9mIGQuZ3JvdXBzICE9PSAndW5kZWZpbmVkJyA/IGQuZ3JvdXBzLm1hcChmdW5jdGlvbiAoYykgeyByZXR1cm4gbm9kZXMubGVuZ3RoICsgYy5pZDsgfSkgOiBbXSlcbiAgICAgICAgICAgICAgICAuY29uY2F0KHR5cGVvZiBkLmxlYXZlcyAhPT0gJ3VuZGVmaW5lZCcgPyBkLmxlYXZlcy5tYXAoZnVuY3Rpb24gKGMpIHsgcmV0dXJuIGMuaW5kZXg7IH0pIDogW10pXG4gICAgICAgIH07XG4gICAgfSk7XG4gICAgdmFyIGdyaWRSb3V0ZXJOb2RlcyA9IG5vZGVzLmNvbmNhdChncm91cHMpLm1hcChmdW5jdGlvbiAoZCwgaSkge1xuICAgICAgICBkLnJvdXRlck5vZGUuaWQgPSBpO1xuICAgICAgICByZXR1cm4gZC5yb3V0ZXJOb2RlO1xuICAgIH0pO1xuICAgIHJldHVybiBuZXcgZ3JpZHJvdXRlcl8xLkdyaWRSb3V0ZXIoZ3JpZFJvdXRlck5vZGVzLCB7XG4gICAgICAgIGdldENoaWxkcmVuOiBmdW5jdGlvbiAodikgeyByZXR1cm4gdi5jaGlsZHJlbjsgfSxcbiAgICAgICAgZ2V0Qm91bmRzOiBmdW5jdGlvbiAodikgeyByZXR1cm4gdi5ib3VuZHM7IH1cbiAgICB9LCBtYXJnaW4gLSBncm91cE1hcmdpbik7XG59XG5mdW5jdGlvbiBwb3dlckdyYXBoR3JpZExheW91dChncmFwaCwgc2l6ZSwgZ3JvdXBwYWRkaW5nKSB7XG4gICAgdmFyIHBvd2VyR3JhcGg7XG4gICAgZ3JhcGgubm9kZXMuZm9yRWFjaChmdW5jdGlvbiAodiwgaSkgeyByZXR1cm4gdi5pbmRleCA9IGk7IH0pO1xuICAgIG5ldyBsYXlvdXRfMS5MYXlvdXQoKVxuICAgICAgICAuYXZvaWRPdmVybGFwcyhmYWxzZSlcbiAgICAgICAgLm5vZGVzKGdyYXBoLm5vZGVzKVxuICAgICAgICAubGlua3MoZ3JhcGgubGlua3MpXG4gICAgICAgIC5wb3dlckdyYXBoR3JvdXBzKGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIHBvd2VyR3JhcGggPSBkO1xuICAgICAgICBwb3dlckdyYXBoLmdyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7IHJldHVybiB2LnBhZGRpbmcgPSBncm91cHBhZGRpbmc7IH0pO1xuICAgIH0pO1xuICAgIHZhciBuID0gZ3JhcGgubm9kZXMubGVuZ3RoO1xuICAgIHZhciBlZGdlcyA9IFtdO1xuICAgIHZhciB2cyA9IGdyYXBoLm5vZGVzLnNsaWNlKDApO1xuICAgIHZzLmZvckVhY2goZnVuY3Rpb24gKHYsIGkpIHsgcmV0dXJuIHYuaW5kZXggPSBpOyB9KTtcbiAgICBwb3dlckdyYXBoLmdyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uIChnKSB7XG4gICAgICAgIHZhciBzb3VyY2VJbmQgPSBnLmluZGV4ID0gZy5pZCArIG47XG4gICAgICAgIHZzLnB1c2goZyk7XG4gICAgICAgIGlmICh0eXBlb2YgZy5sZWF2ZXMgIT09ICd1bmRlZmluZWQnKVxuICAgICAgICAgICAgZy5sZWF2ZXMuZm9yRWFjaChmdW5jdGlvbiAodikgeyByZXR1cm4gZWRnZXMucHVzaCh7IHNvdXJjZTogc291cmNlSW5kLCB0YXJnZXQ6IHYuaW5kZXggfSk7IH0pO1xuICAgICAgICBpZiAodHlwZW9mIGcuZ3JvdXBzICE9PSAndW5kZWZpbmVkJylcbiAgICAgICAgICAgIGcuZ3JvdXBzLmZvckVhY2goZnVuY3Rpb24gKGdnKSB7IHJldHVybiBlZGdlcy5wdXNoKHsgc291cmNlOiBzb3VyY2VJbmQsIHRhcmdldDogZ2cuaWQgKyBuIH0pOyB9KTtcbiAgICB9KTtcbiAgICBwb3dlckdyYXBoLnBvd2VyRWRnZXMuZm9yRWFjaChmdW5jdGlvbiAoZSkge1xuICAgICAgICBlZGdlcy5wdXNoKHsgc291cmNlOiBlLnNvdXJjZS5pbmRleCwgdGFyZ2V0OiBlLnRhcmdldC5pbmRleCB9KTtcbiAgICB9KTtcbiAgICBuZXcgbGF5b3V0XzEuTGF5b3V0KClcbiAgICAgICAgLnNpemUoc2l6ZSlcbiAgICAgICAgLm5vZGVzKHZzKVxuICAgICAgICAubGlua3MoZWRnZXMpXG4gICAgICAgIC5hdm9pZE92ZXJsYXBzKGZhbHNlKVxuICAgICAgICAubGlua0Rpc3RhbmNlKDMwKVxuICAgICAgICAuc3ltbWV0cmljRGlmZkxpbmtMZW5ndGhzKDUpXG4gICAgICAgIC5jb252ZXJnZW5jZVRocmVzaG9sZCgxZS00KVxuICAgICAgICAuc3RhcnQoMTAwLCAwLCAwLCAwLCBmYWxzZSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgY29sYTogbmV3IGxheW91dF8xLkxheW91dCgpXG4gICAgICAgICAgICAuY29udmVyZ2VuY2VUaHJlc2hvbGQoMWUtMylcbiAgICAgICAgICAgIC5zaXplKHNpemUpXG4gICAgICAgICAgICAuYXZvaWRPdmVybGFwcyh0cnVlKVxuICAgICAgICAgICAgLm5vZGVzKGdyYXBoLm5vZGVzKVxuICAgICAgICAgICAgLmxpbmtzKGdyYXBoLmxpbmtzKVxuICAgICAgICAgICAgLmdyb3VwQ29tcGFjdG5lc3MoMWUtNClcbiAgICAgICAgICAgIC5saW5rRGlzdGFuY2UoMzApXG4gICAgICAgICAgICAuc3ltbWV0cmljRGlmZkxpbmtMZW5ndGhzKDUpXG4gICAgICAgICAgICAucG93ZXJHcmFwaEdyb3VwcyhmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgcG93ZXJHcmFwaCA9IGQ7XG4gICAgICAgICAgICBwb3dlckdyYXBoLmdyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICAgICAgdi5wYWRkaW5nID0gZ3JvdXBwYWRkaW5nO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pLnN0YXJ0KDUwLCAwLCAxMDAsIDAsIGZhbHNlKSxcbiAgICAgICAgcG93ZXJHcmFwaDogcG93ZXJHcmFwaFxuICAgIH07XG59XG5leHBvcnRzLnBvd2VyR3JhcGhHcmlkTGF5b3V0ID0gcG93ZXJHcmFwaEdyaWRMYXlvdXQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0ptYVd4bElqb2lZbUYwWTJndWFuTWlMQ0p6YjNWeVkyVlNiMjkwSWpvaUlpd2ljMjkxY21ObGN5STZXeUl1TGk4dUxpOVhaV0pEYjJ4aEwzTnlZeTlpWVhSamFDNTBjeUpkTENKdVlXMWxjeUk2VzEwc0ltMWhjSEJwYm1keklqb2lPenRCUVVGQkxHMURRVUV5UXp0QlFVTXpReXd5UTBGQmRVTTdRVUZSZGtNc1UwRkJaMElzVDBGQlR5eERRVUZETEZGQlFWRXNSVUZCUlN4UlFVRm5RaXhGUVVGRkxFMUJRV01zUlVGQlJTeFhRVUZ0UWp0SlFVTnVSaXhSUVVGUkxFTkJRVU1zU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeEZRVUZGTEVWQlFVVXNTMEZCU3l4RFFVRkRMRU5CUVVNN1NVRkRlRU1zU1VGQlNTeFZRVUZWTEVkQlFVY3NTMEZCU3l4RFFVRkRMRkZCUVZFc1EwRkJReXhKUVVGSkxFTkJRVU1zUzBGQlN5eEZRVUZGTEVWQlFVVXNVVUZCVVN4RFFVRkRMRWxCUVVrc1EwRkJReXhOUVVGTkxFVkJRVVVzUlVGQlJTeE5RVUZOTEVWQlFVVXNWMEZCVnl4RFFVRkRMRU5CUVVNN1NVRkRNMFlzVDBGQlR5eFZRVUZWTEVOQlFVTXNWVUZCVlN4RFFVRk5MRkZCUVZFc1EwRkJReXhWUVVGVkxFTkJRVU1zVlVGQlZTeEZRVUZGTEZGQlFWRXNSVUZCUlN4VlFVRkJMRU5CUVVNc1NVRkJSeXhQUVVGQkxFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNWVUZCVlN4RFFVRkRMRVZCUVVVc1JVRkJkRUlzUTBGQmMwSXNSVUZCUlN4VlFVRkJMRU5CUVVNc1NVRkJSeXhQUVVGQkxFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNWVUZCVlN4RFFVRkRMRVZCUVVVc1JVRkJkRUlzUTBGQmMwSXNRMEZCUXl4RFFVRkRPMEZCUTNoSkxFTkJRVU03UVVGS1JDd3dRa0ZKUXp0QlFVVkVMRk5CUVZNc1MwRkJTeXhEUVVGRExFdEJRVXNzUlVGQlJTeE5RVUZOTEVWQlFVVXNUVUZCWXl4RlFVRkZMRmRCUVcxQ08wbEJRemRFTEV0QlFVc3NRMEZCUXl4UFFVRlBMRU5CUVVNc1ZVRkJRU3hEUVVGRE8xRkJRMWdzUTBGQlF5eERRVUZETEZWQlFWVXNSMEZCVVR0WlFVTm9RaXhKUVVGSkxFVkJRVVVzUTBGQlF5eERRVUZETEVsQlFVazdXVUZEV2l4TlFVRk5MRVZCUVVVc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eFBRVUZQTEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNN1UwRkRjRU1zUTBGQlF6dEpRVU5PTEVOQlFVTXNRMEZCUXl4RFFVRkRPMGxCUTBnc1RVRkJUU3hEUVVGRExFOUJRVThzUTBGQlF5eFZRVUZCTEVOQlFVTTdVVUZEV2l4RFFVRkRMRU5CUVVNc1ZVRkJWU3hIUVVGUk8xbEJRMmhDTEUxQlFVMHNSVUZCUlN4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETEZkQlFWY3NRMEZCUXp0WlFVTjBReXhSUVVGUkxFVkJRVVVzUTBGQlF5eFBRVUZQTEVOQlFVTXNRMEZCUXl4TlFVRk5MRXRCUVVzc1YwRkJWeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRWRCUVVjc1EwRkJReXhWUVVGQkxFTkJRVU1zU1VGQlJ5eFBRVUZCTEV0QlFVc3NRMEZCUXl4TlFVRk5MRWRCUVVjc1EwRkJReXhEUVVGRExFVkJRVVVzUlVGQmJrSXNRMEZCYlVJc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTTdhVUpCUTI1R0xFMUJRVTBzUTBGQlF5eFBRVUZQTEVOQlFVTXNRMEZCUXl4TlFVRk5MRXRCUVVzc1YwRkJWeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRWRCUVVjc1EwRkJReXhWUVVGQkxFTkJRVU1zU1VGQlJ5eFBRVUZCTEVOQlFVTXNRMEZCUXl4TFFVRkxMRVZCUVZBc1EwRkJUeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXp0VFFVTm9SaXhEUVVGRE8wbEJRMDRzUTBGQlF5eERRVUZETEVOQlFVTTdTVUZEU0N4SlFVRkpMR1ZCUVdVc1IwRkJSeXhMUVVGTExFTkJRVU1zVFVGQlRTeERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhWUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETzFGQlEyaEVMRU5CUVVNc1EwRkJReXhWUVVGVkxFTkJRVU1zUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXp0UlFVTndRaXhQUVVGUExFTkJRVU1zUTBGQlF5eFZRVUZWTEVOQlFVTTdTVUZEZUVJc1EwRkJReXhEUVVGRExFTkJRVU03U1VGRFNDeFBRVUZQTEVsQlFVa3NkVUpCUVZVc1EwRkJReXhsUVVGbExFVkJRVVU3VVVGRGJrTXNWMEZCVnl4RlFVRkZMRlZCUVVNc1EwRkJUU3hKUVVGTExFOUJRVUVzUTBGQlF5eERRVUZETEZGQlFWRXNSVUZCVml4RFFVRlZPMUZCUTI1RExGTkJRVk1zUlVGQlJTeFZRVUZCTEVOQlFVTXNTVUZCU1N4UFFVRkJMRU5CUVVNc1EwRkJReXhOUVVGTkxFVkJRVklzUTBGQlVUdExRVU16UWl4RlFVRkZMRTFCUVUwc1IwRkJSeXhYUVVGWExFTkJRVU1zUTBGQlF6dEJRVU0zUWl4RFFVRkRPMEZCUlVRc1UwRkJaMElzYjBKQlFXOUNMRU5CUTJoRExFdEJRVFpETEVWQlF6ZERMRWxCUVdNc1JVRkRaQ3haUVVGdlFqdEpRVWR3UWl4SlFVRkpMRlZCUVZVc1EwRkJRenRKUVVObUxFdEJRVXNzUTBGQlF5eExRVUZMTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVVNc1EwRkJReXhGUVVGRExFTkJRVU1zU1VGQlN5eFBRVUZOTEVOQlFVVXNRMEZCUXl4TFFVRkxMRWRCUVVjc1EwRkJReXhGUVVGc1FpeERRVUZyUWl4RFFVRkRMRU5CUVVNN1NVRkRha1FzU1VGQlNTeGxRVUZOTEVWQlFVVTdVMEZEVUN4aFFVRmhMRU5CUVVNc1MwRkJTeXhEUVVGRE8xTkJRM0JDTEV0QlFVc3NRMEZCUXl4TFFVRkxMRU5CUVVNc1MwRkJTeXhEUVVGRE8xTkJRMnhDTEV0QlFVc3NRMEZCUXl4TFFVRkxMRU5CUVVNc1MwRkJTeXhEUVVGRE8xTkJRMnhDTEdkQ1FVRm5RaXhEUVVGRExGVkJRVlVzUTBGQlF6dFJRVU42UWl4VlFVRlZMRWRCUVVjc1EwRkJReXhEUVVGRE8xRkJRMllzVlVGQlZTeERRVUZETEUxQlFVMHNRMEZCUXl4UFFVRlBMRU5CUVVNc1ZVRkJRU3hEUVVGRExFbEJRVWNzVDBGQlFTeERRVUZETEVOQlFVTXNUMEZCVHl4SFFVRkhMRmxCUVZrc1JVRkJlRUlzUTBGQmQwSXNRMEZCUXl4RFFVRkRPMGxCUXpWRUxFTkJRVU1zUTBGQlF5eERRVUZETzBsQlNWQXNTVUZCU1N4RFFVRkRMRWRCUVVjc1MwRkJTeXhEUVVGRExFdEJRVXNzUTBGQlF5eE5RVUZOTEVOQlFVTTdTVUZETTBJc1NVRkJTU3hMUVVGTExFZEJRVWNzUlVGQlJTeERRVUZETzBsQlEyWXNTVUZCU1N4RlFVRkZMRWRCUVVjc1MwRkJTeXhEUVVGRExFdEJRVXNzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRPVUlzUlVGQlJTeERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFbEJRVXNzVDBGQlRTeERRVUZGTEVOQlFVTXNTMEZCU3l4SFFVRkhMRU5CUVVNc1JVRkJiRUlzUTBGQmEwSXNRMEZCUXl4RFFVRkRPMGxCUTNwRExGVkJRVlVzUTBGQlF5eE5RVUZOTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVVFc1EwRkJRenRSUVVOMlFpeEpRVUZKTEZOQlFWTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1MwRkJTeXhIUVVGSExFTkJRVU1zUTBGQlF5eEZRVUZGTEVkQlFVY3NRMEZCUXl4RFFVRkRPMUZCUTI1RExFVkJRVVVzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRXQ3hKUVVGSkxFOUJRVThzUTBGQlF5eERRVUZETEUxQlFVMHNTMEZCU3l4WFFVRlhPMWxCUXk5Q0xFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVVFc1EwRkJReXhKUVVGSkxFOUJRVUVzUzBGQlN5eERRVUZETEVsQlFVa3NRMEZCUXl4RlFVRkZMRTFCUVUwc1JVRkJSU3hUUVVGVExFVkJRVVVzVFVGQlRTeEZRVUZGTEVOQlFVTXNRMEZCUXl4TFFVRkxMRVZCUVVVc1EwRkJReXhGUVVGc1JDeERRVUZyUkN4RFFVRkRMRU5CUVVNN1VVRkRPVVVzU1VGQlNTeFBRVUZQTEVOQlFVTXNRMEZCUXl4TlFVRk5MRXRCUVVzc1YwRkJWenRaUVVNdlFpeERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGQkxFVkJRVVVzU1VGQlNTeFBRVUZCTEV0QlFVc3NRMEZCUXl4SlFVRkpMRU5CUVVNc1JVRkJSU3hOUVVGTkxFVkJRVVVzVTBGQlV5eEZRVUZGTEUxQlFVMHNSVUZCUlN4RlFVRkZMRU5CUVVNc1JVRkJSU3hIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFYQkVMRU5CUVc5RUxFTkJRVU1zUTBGQlF6dEpRVU55Uml4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVOSUxGVkJRVlVzUTBGQlF5eFZRVUZWTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVVFc1EwRkJRenRSUVVNelFpeExRVUZMTEVOQlFVTXNTVUZCU1N4RFFVRkRMRVZCUVVVc1RVRkJUU3hGUVVGRkxFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNTMEZCU3l4RlFVRkZMRTFCUVUwc1JVRkJSU3hEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEV0QlFVc3NSVUZCUlN4RFFVRkRMRU5CUVVNN1NVRkRia1VzUTBGQlF5eERRVUZETEVOQlFVTTdTVUZIU0N4SlFVRkpMR1ZCUVUwc1JVRkJSVHRUUVVOUUxFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTTdVMEZEVml4TFFVRkxMRU5CUVVNc1JVRkJSU3hEUVVGRE8xTkJRMVFzUzBGQlN5eERRVUZETEV0QlFVc3NRMEZCUXp0VFFVTmFMR0ZCUVdFc1EwRkJReXhMUVVGTExFTkJRVU03VTBGRGNFSXNXVUZCV1N4RFFVRkRMRVZCUVVVc1EwRkJRenRUUVVOb1FpeDNRa0ZCZDBJc1EwRkJReXhEUVVGRExFTkJRVU03VTBGRE0wSXNiMEpCUVc5Q0xFTkJRVU1zU1VGQlNTeERRVUZETzFOQlF6RkNMRXRCUVVzc1EwRkJReXhIUVVGSExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1MwRkJTeXhEUVVGRExFTkJRVU03U1VGTGFFTXNUMEZCVHp0UlFVTklMRWxCUVVrc1JVRkRRU3hKUVVGSkxHVkJRVTBzUlVGQlJUdGhRVU5ZTEc5Q1FVRnZRaXhEUVVGRExFbEJRVWtzUTBGQlF6dGhRVU14UWl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRE8yRkJRMVlzWVVGQllTeERRVUZETEVsQlFVa3NRMEZCUXp0aFFVTnVRaXhMUVVGTExFTkJRVU1zUzBGQlN5eERRVUZETEV0QlFVc3NRMEZCUXp0aFFVTnNRaXhMUVVGTExFTkJRVU1zUzBGQlN5eERRVUZETEV0QlFVc3NRMEZCUXp0aFFVVnNRaXhuUWtGQlowSXNRMEZCUXl4SlFVRkpMRU5CUVVNN1lVRkRkRUlzV1VGQldTeERRVUZETEVWQlFVVXNRMEZCUXp0aFFVTm9RaXgzUWtGQmQwSXNRMEZCUXl4RFFVRkRMRU5CUVVNN1lVRkRNMElzWjBKQlFXZENMRU5CUVVNc1ZVRkJWU3hEUVVGRE8xbEJRM3BDTEZWQlFWVXNSMEZCUnl4RFFVRkRMRU5CUVVNN1dVRkRaaXhWUVVGVkxFTkJRVU1zVFVGQlRTeERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRlZMRU5CUVVNN1owSkJRMnBETEVOQlFVTXNRMEZCUXl4UFFVRlBMRWRCUVVjc1dVRkJXU3hEUVVGQk8xbEJRelZDTEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTFBc1EwRkJReXhEUVVGRExFTkJRVU1zUzBGQlN5eERRVUZETEVWQlFVVXNSVUZCUlN4RFFVRkRMRVZCUVVVc1IwRkJSeXhGUVVGRkxFTkJRVU1zUlVGQlJTeExRVUZMTEVOQlFVTTdVVUZEYkVNc1ZVRkJWU3hGUVVGRkxGVkJRVlU3UzBGRGVrSXNRMEZCUXp0QlFVTk9MRU5CUVVNN1FVRnlSVVFzYjBSQmNVVkRJbjA9IiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgZDN2MyA9IHJlcXVpcmUoXCIuL2QzdjNhZGFwdG9yXCIpO1xudmFyIGQzdjQgPSByZXF1aXJlKFwiLi9kM3Y0YWRhcHRvclwiKTtcbjtcbmZ1bmN0aW9uIGQzYWRhcHRvcihkM0NvbnRleHQpIHtcbiAgICBpZiAoIWQzQ29udGV4dCB8fCBpc0QzVjMoZDNDb250ZXh0KSkge1xuICAgICAgICByZXR1cm4gbmV3IGQzdjMuRDNTdHlsZUxheW91dEFkYXB0b3IoKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBkM3Y0LkQzU3R5bGVMYXlvdXRBZGFwdG9yKGQzQ29udGV4dCk7XG59XG5leHBvcnRzLmQzYWRhcHRvciA9IGQzYWRhcHRvcjtcbmZ1bmN0aW9uIGlzRDNWMyhkM0NvbnRleHQpIHtcbiAgICB2YXIgdjNleHAgPSAvXjNcXC4vO1xuICAgIHJldHVybiBkM0NvbnRleHQudmVyc2lvbiAmJiBkM0NvbnRleHQudmVyc2lvbi5tYXRjaCh2M2V4cCkgIT09IG51bGw7XG59XG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0ptYVd4bElqb2laRE5oWkdGd2RHOXlMbXB6SWl3aWMyOTFjbU5sVW05dmRDSTZJaUlzSW5OdmRYSmpaWE1pT2xzaUxpNHZMaTR2VjJWaVEyOXNZUzl6Y21NdlpETmhaR0Z3ZEc5eUxuUnpJbDBzSW01aGJXVnpJanBiWFN3aWJXRndjR2x1WjNNaU9pSTdPMEZCUVVFc2IwTkJRWEZETzBGQlEzSkRMRzlEUVVGeFF6dEJRVWRWTEVOQlFVTTdRVUUwUW1oRUxGTkJRV2RDTEZOQlFWTXNRMEZCUXl4VFFVRjNRenRKUVVNNVJDeEpRVUZKTEVOQlFVTXNVMEZCVXl4SlFVRkpMRTFCUVUwc1EwRkJReXhUUVVGVExFTkJRVU1zUlVGQlJUdFJRVU5xUXl4UFFVRlBMRWxCUVVrc1NVRkJTU3hEUVVGRExHOUNRVUZ2UWl4RlFVRkZMRU5CUVVNN1MwRkRNVU03U1VGRFJDeFBRVUZQTEVsQlFVa3NTVUZCU1N4RFFVRkRMRzlDUVVGdlFpeERRVUZETEZOQlFWTXNRMEZCUXl4RFFVRkRPMEZCUTNCRUxFTkJRVU03UVVGTVJDdzRRa0ZMUXp0QlFVVkVMRk5CUVZNc1RVRkJUU3hEUVVGRExGTkJRWFZETzBsQlEyNUVMRWxCUVUwc1MwRkJTeXhIUVVGSExFMUJRVTBzUTBGQlF6dEpRVU55UWl4UFFVRmhMRk5CUVZVc1EwRkJReXhQUVVGUExFbEJRVlVzVTBGQlZTeERRVUZETEU5QlFVOHNRMEZCUXl4TFFVRkxMRU5CUVVNc1MwRkJTeXhEUVVGRExFdEJRVXNzU1VGQlNTeERRVUZETzBGQlEzUkdMRU5CUVVNaWZRPT0iLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2V4dGVuZHMgPSAodGhpcyAmJiB0aGlzLl9fZXh0ZW5kcykgfHwgKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZXh0ZW5kU3RhdGljcyA9IGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgICAgIGV4dGVuZFN0YXRpY3MgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHxcbiAgICAgICAgICAgICh7IF9fcHJvdG9fXzogW10gfSBpbnN0YW5jZW9mIEFycmF5ICYmIGZ1bmN0aW9uIChkLCBiKSB7IGQuX19wcm90b19fID0gYjsgfSkgfHxcbiAgICAgICAgICAgIGZ1bmN0aW9uIChkLCBiKSB7IGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdOyB9O1xuICAgICAgICByZXR1cm4gZXh0ZW5kU3RhdGljcyhkLCBiKTtcbiAgICB9O1xuICAgIHJldHVybiBmdW5jdGlvbiAoZCwgYikge1xuICAgICAgICBleHRlbmRTdGF0aWNzKGQsIGIpO1xuICAgICAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICAgICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xuICAgIH07XG59KSgpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGxheW91dF8xID0gcmVxdWlyZShcIi4vbGF5b3V0XCIpO1xudmFyIEQzU3R5bGVMYXlvdXRBZGFwdG9yID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoRDNTdHlsZUxheW91dEFkYXB0b3IsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gRDNTdHlsZUxheW91dEFkYXB0b3IoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMpIHx8IHRoaXM7XG4gICAgICAgIF90aGlzLmV2ZW50ID0gZDMuZGlzcGF0Y2gobGF5b3V0XzEuRXZlbnRUeXBlW2xheW91dF8xLkV2ZW50VHlwZS5zdGFydF0sIGxheW91dF8xLkV2ZW50VHlwZVtsYXlvdXRfMS5FdmVudFR5cGUudGlja10sIGxheW91dF8xLkV2ZW50VHlwZVtsYXlvdXRfMS5FdmVudFR5cGUuZW5kXSk7XG4gICAgICAgIHZhciBkM2xheW91dCA9IF90aGlzO1xuICAgICAgICB2YXIgZHJhZztcbiAgICAgICAgX3RoaXMuZHJhZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICghZHJhZykge1xuICAgICAgICAgICAgICAgIHZhciBkcmFnID0gZDMuYmVoYXZpb3IuZHJhZygpXG4gICAgICAgICAgICAgICAgICAgIC5vcmlnaW4obGF5b3V0XzEuTGF5b3V0LmRyYWdPcmlnaW4pXG4gICAgICAgICAgICAgICAgICAgIC5vbihcImRyYWdzdGFydC5kM2FkYXB0b3JcIiwgbGF5b3V0XzEuTGF5b3V0LmRyYWdTdGFydClcbiAgICAgICAgICAgICAgICAgICAgLm9uKFwiZHJhZy5kM2FkYXB0b3JcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgbGF5b3V0XzEuTGF5b3V0LmRyYWcoZCwgZDMuZXZlbnQpO1xuICAgICAgICAgICAgICAgICAgICBkM2xheW91dC5yZXN1bWUoKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAub24oXCJkcmFnZW5kLmQzYWRhcHRvclwiLCBsYXlvdXRfMS5MYXlvdXQuZHJhZ0VuZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRyYWc7XG4gICAgICAgICAgICB0aGlzXG4gICAgICAgICAgICAgICAgLmNhbGwoZHJhZyk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBfdGhpcztcbiAgICB9XG4gICAgRDNTdHlsZUxheW91dEFkYXB0b3IucHJvdG90eXBlLnRyaWdnZXIgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICB2YXIgZDNldmVudCA9IHsgdHlwZTogbGF5b3V0XzEuRXZlbnRUeXBlW2UudHlwZV0sIGFscGhhOiBlLmFscGhhLCBzdHJlc3M6IGUuc3RyZXNzIH07XG4gICAgICAgIHRoaXMuZXZlbnRbZDNldmVudC50eXBlXShkM2V2ZW50KTtcbiAgICB9O1xuICAgIEQzU3R5bGVMYXlvdXRBZGFwdG9yLnByb3RvdHlwZS5raWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICBkMy50aW1lcihmdW5jdGlvbiAoKSB7IHJldHVybiBfc3VwZXIucHJvdG90eXBlLnRpY2suY2FsbChfdGhpcyk7IH0pO1xuICAgIH07XG4gICAgRDNTdHlsZUxheW91dEFkYXB0b3IucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gKGV2ZW50VHlwZSwgbGlzdGVuZXIpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBldmVudFR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50Lm9uKGV2ZW50VHlwZSwgbGlzdGVuZXIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5ldmVudC5vbihsYXlvdXRfMS5FdmVudFR5cGVbZXZlbnRUeXBlXSwgbGlzdGVuZXIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgcmV0dXJuIEQzU3R5bGVMYXlvdXRBZGFwdG9yO1xufShsYXlvdXRfMS5MYXlvdXQpKTtcbmV4cG9ydHMuRDNTdHlsZUxheW91dEFkYXB0b3IgPSBEM1N0eWxlTGF5b3V0QWRhcHRvcjtcbmZ1bmN0aW9uIGQzYWRhcHRvcigpIHtcbiAgICByZXR1cm4gbmV3IEQzU3R5bGVMYXlvdXRBZGFwdG9yKCk7XG59XG5leHBvcnRzLmQzYWRhcHRvciA9IGQzYWRhcHRvcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSm1hV3hsSWpvaVpETjJNMkZrWVhCMGIzSXVhbk1pTENKemIzVnlZMlZTYjI5MElqb2lJaXdpYzI5MWNtTmxjeUk2V3lJdUxpOHVMaTlYWldKRGIyeGhMM055WXk5a00zWXpZV1JoY0hSdmNpNTBjeUpkTENKdVlXMWxjeUk2VzEwc0ltMWhjSEJwYm1keklqb2lPenM3T3pzN096czdPenM3T3pzN1FVRk5RU3h0UTBGQmEwUTdRVUZIT1VNN1NVRkJNRU1zZDBOQlFVMDdTVUZuUWpWRE8xRkJRVUVzV1VGRFNTeHBRa0ZCVHl4VFFYVkNWanRSUVhaRFJDeFhRVUZMTEVkQlFVY3NSVUZCUlN4RFFVRkRMRkZCUVZFc1EwRkJReXhyUWtGQlV5eERRVUZETEd0Q1FVRlRMRU5CUVVNc1MwRkJTeXhEUVVGRExFVkJRVVVzYTBKQlFWTXNRMEZCUXl4clFrRkJVeXhEUVVGRExFbEJRVWtzUTBGQlF5eEZRVUZGTEd0Q1FVRlRMRU5CUVVNc2EwSkJRVk1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCYTBKcVJ5eEpRVUZKTEZGQlFWRXNSMEZCUnl4TFFVRkpMRU5CUVVNN1VVRkRjRUlzU1VGQlNTeEpRVUZKTEVOQlFVTTdVVUZEVkN4TFFVRkpMRU5CUVVNc1NVRkJTU3hIUVVGSE8xbEJRMUlzU1VGQlNTeERRVUZETEVsQlFVa3NSVUZCUlR0blFrRkRVQ3hKUVVGSkxFbEJRVWtzUjBGQlJ5eEZRVUZGTEVOQlFVTXNVVUZCVVN4RFFVRkRMRWxCUVVrc1JVRkJSVHR4UWtGRGVFSXNUVUZCVFN4RFFVRkRMR1ZCUVUwc1EwRkJReXhWUVVGVkxFTkJRVU03Y1VKQlEzcENMRVZCUVVVc1EwRkJReXh4UWtGQmNVSXNSVUZCUlN4bFFVRk5MRU5CUVVNc1UwRkJVeXhEUVVGRE8zRkNRVU16UXl4RlFVRkZMRU5CUVVNc1owSkJRV2RDTEVWQlFVVXNWVUZCUVN4RFFVRkRPMjlDUVVOdVFpeGxRVUZOTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1JVRkJUeXhGUVVGRkxFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTTdiMEpCUXpsQ0xGRkJRVkVzUTBGQlF5eE5RVUZOTEVWQlFVVXNRMEZCUXp0blFrRkRkRUlzUTBGQlF5eERRVUZETzNGQ1FVTkVMRVZCUVVVc1EwRkJReXh0UWtGQmJVSXNSVUZCUlN4bFFVRk5MRU5CUVVNc1QwRkJUeXhEUVVGRExFTkJRVU03WVVGRGFFUTdXVUZGUkN4SlFVRkpMRU5CUVVNc1UwRkJVeXhEUVVGRExFMUJRVTA3WjBKQlFVVXNUMEZCVHl4SlFVRkpMRU5CUVVNN1dVRkhia01zU1VGQlNUdHBRa0ZGUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03VVVGRGNFSXNRMEZCUXl4RFFVRkJPenRKUVVOTUxFTkJRVU03U1VGeVEwUXNjME5CUVU4c1IwRkJVQ3hWUVVGUkxFTkJRVkU3VVVGRFdpeEpRVUZKTEU5QlFVOHNSMEZCUnl4RlFVRkZMRWxCUVVrc1JVRkJSU3hyUWtGQlV5eERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1JVRkJSU3hMUVVGTExFVkJRVVVzUTBGQlF5eERRVUZETEV0QlFVc3NSVUZCUlN4TlFVRk5MRVZCUVVVc1EwRkJReXhEUVVGRExFMUJRVTBzUlVGQlJTeERRVUZETzFGQlF6VkZMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zVDBGQlR5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRTlCUVU4c1EwRkJReXhEUVVGRE8wbEJRM1JETEVOQlFVTTdTVUZIUkN4dFEwRkJTU3hIUVVGS08xRkJRVUVzYVVKQlJVTTdVVUZFUnl4RlFVRkZMRU5CUVVNc1MwRkJTeXhEUVVGRExHTkJRVTBzVDBGQlFTeHBRa0ZCVFN4SlFVRkpMRmxCUVVVc1JVRkJXaXhEUVVGWkxFTkJRVU1zUTBGQlF6dEpRVU5xUXl4RFFVRkRPMGxCWjBORUxHbERRVUZGTEVkQlFVWXNWVUZCUnl4VFFVRTJRaXhGUVVGRkxGRkJRVzlDTzFGQlEyeEVMRWxCUVVrc1QwRkJUeXhUUVVGVExFdEJRVXNzVVVGQlVTeEZRVUZGTzFsQlF5OUNMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUlVGQlJTeERRVUZETEZOQlFWTXNSVUZCUlN4UlFVRlJMRU5CUVVNc1EwRkJRenRUUVVOMFF6dGhRVUZOTzFsQlEwZ3NTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhGUVVGRkxFTkJRVU1zYTBKQlFWTXNRMEZCUXl4VFFVRlRMRU5CUVVNc1JVRkJSU3hSUVVGUkxFTkJRVU1zUTBGQlF6dFRRVU5xUkR0UlFVTkVMRTlCUVU4c1NVRkJTU3hEUVVGRE8wbEJRMmhDTEVOQlFVTTdTVUZEVEN3eVFrRkJRenRCUVVGRUxFTkJRVU1zUVVGdVJFUXNRMEZCTUVNc1pVRkJUU3hIUVcxRUwwTTdRVUZ1UkZrc2IwUkJRVzlDTzBGQmFVVnFReXhUUVVGblFpeFRRVUZUTzBsQlEzSkNMRTlCUVU4c1NVRkJTU3h2UWtGQmIwSXNSVUZCUlN4RFFVRkRPMEZCUTNSRExFTkJRVU03UVVGR1JDdzRRa0ZGUXlKOSIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fZXh0ZW5kcyA9ICh0aGlzICYmIHRoaXMuX19leHRlbmRzKSB8fCAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBleHRlbmRTdGF0aWNzID0gZnVuY3Rpb24gKGQsIGIpIHtcbiAgICAgICAgZXh0ZW5kU3RhdGljcyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fFxuICAgICAgICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxuICAgICAgICAgICAgZnVuY3Rpb24gKGQsIGIpIHsgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07IH07XG4gICAgICAgIHJldHVybiBleHRlbmRTdGF0aWNzKGQsIGIpO1xuICAgIH07XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgICAgIGV4dGVuZFN0YXRpY3MoZCwgYik7XG4gICAgICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgICAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XG4gICAgfTtcbn0pKCk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgbGF5b3V0XzEgPSByZXF1aXJlKFwiLi9sYXlvdXRcIik7XG52YXIgRDNTdHlsZUxheW91dEFkYXB0b3IgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhEM1N0eWxlTGF5b3V0QWRhcHRvciwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBEM1N0eWxlTGF5b3V0QWRhcHRvcihkM0NvbnRleHQpIHtcbiAgICAgICAgdmFyIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcykgfHwgdGhpcztcbiAgICAgICAgX3RoaXMuZDNDb250ZXh0ID0gZDNDb250ZXh0O1xuICAgICAgICBfdGhpcy5ldmVudCA9IGQzQ29udGV4dC5kaXNwYXRjaChsYXlvdXRfMS5FdmVudFR5cGVbbGF5b3V0XzEuRXZlbnRUeXBlLnN0YXJ0XSwgbGF5b3V0XzEuRXZlbnRUeXBlW2xheW91dF8xLkV2ZW50VHlwZS50aWNrXSwgbGF5b3V0XzEuRXZlbnRUeXBlW2xheW91dF8xLkV2ZW50VHlwZS5lbmRdKTtcbiAgICAgICAgdmFyIGQzbGF5b3V0ID0gX3RoaXM7XG4gICAgICAgIHZhciBkcmFnO1xuICAgICAgICBfdGhpcy5kcmFnID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKCFkcmFnKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRyYWcgPSBkM0NvbnRleHQuZHJhZygpXG4gICAgICAgICAgICAgICAgICAgIC5zdWJqZWN0KGxheW91dF8xLkxheW91dC5kcmFnT3JpZ2luKVxuICAgICAgICAgICAgICAgICAgICAub24oXCJzdGFydC5kM2FkYXB0b3JcIiwgbGF5b3V0XzEuTGF5b3V0LmRyYWdTdGFydClcbiAgICAgICAgICAgICAgICAgICAgLm9uKFwiZHJhZy5kM2FkYXB0b3JcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgbGF5b3V0XzEuTGF5b3V0LmRyYWcoZCwgZDNDb250ZXh0LmV2ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgZDNsYXlvdXQucmVzdW1lKCk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgLm9uKFwiZW5kLmQzYWRhcHRvclwiLCBsYXlvdXRfMS5MYXlvdXQuZHJhZ0VuZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRyYWc7XG4gICAgICAgICAgICBhcmd1bWVudHNbMF0uY2FsbChkcmFnKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIF90aGlzO1xuICAgIH1cbiAgICBEM1N0eWxlTGF5b3V0QWRhcHRvci5wcm90b3R5cGUudHJpZ2dlciA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHZhciBkM2V2ZW50ID0geyB0eXBlOiBsYXlvdXRfMS5FdmVudFR5cGVbZS50eXBlXSwgYWxwaGE6IGUuYWxwaGEsIHN0cmVzczogZS5zdHJlc3MgfTtcbiAgICAgICAgdGhpcy5ldmVudC5jYWxsKGQzZXZlbnQudHlwZSwgZDNldmVudCk7XG4gICAgfTtcbiAgICBEM1N0eWxlTGF5b3V0QWRhcHRvci5wcm90b3R5cGUua2ljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIHQgPSB0aGlzLmQzQ29udGV4dC50aW1lcihmdW5jdGlvbiAoKSB7IHJldHVybiBfc3VwZXIucHJvdG90eXBlLnRpY2suY2FsbChfdGhpcykgJiYgdC5zdG9wKCk7IH0pO1xuICAgIH07XG4gICAgRDNTdHlsZUxheW91dEFkYXB0b3IucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gKGV2ZW50VHlwZSwgbGlzdGVuZXIpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBldmVudFR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50Lm9uKGV2ZW50VHlwZSwgbGlzdGVuZXIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5ldmVudC5vbihsYXlvdXRfMS5FdmVudFR5cGVbZXZlbnRUeXBlXSwgbGlzdGVuZXIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgcmV0dXJuIEQzU3R5bGVMYXlvdXRBZGFwdG9yO1xufShsYXlvdXRfMS5MYXlvdXQpKTtcbmV4cG9ydHMuRDNTdHlsZUxheW91dEFkYXB0b3IgPSBEM1N0eWxlTGF5b3V0QWRhcHRvcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSm1hV3hsSWpvaVpETjJOR0ZrWVhCMGIzSXVhbk1pTENKemIzVnlZMlZTYjI5MElqb2lJaXdpYzI5MWNtTmxjeUk2V3lJdUxpOHVMaTlYWldKRGIyeGhMM055WXk5a00zWTBZV1JoY0hSdmNpNTBjeUpkTENKdVlXMWxjeUk2VzEwc0ltMWhjSEJwYm1keklqb2lPenM3T3pzN096czdPenM3T3pzN1FVRkhRU3h0UTBGQmFVUTdRVUZWYWtRN1NVRkJNRU1zZDBOQlFVMDdTVUZwUWpWRExEaENRVUZ2UWl4VFFVRnZRanRSUVVGNFF5eFpRVU5KTEdsQ1FVRlBMRk5CZVVKV08xRkJNVUp0UWl4bFFVRlRMRWRCUVZRc1UwRkJVeXhEUVVGWE8xRkJSWEJETEV0QlFVa3NRMEZCUXl4TFFVRkxMRWRCUVVjc1UwRkJVeXhEUVVGRExGRkJRVkVzUTBGQlF5eHJRa0ZCVXl4RFFVRkRMR3RDUVVGVExFTkJRVU1zUzBGQlN5eERRVUZETEVWQlFVVXNhMEpCUVZNc1EwRkJReXhyUWtGQlV5eERRVUZETEVsQlFVa3NRMEZCUXl4RlFVRkZMR3RDUVVGVExFTkJRVU1zYTBKQlFWTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJSMnBJTEVsQlFVa3NVVUZCVVN4SFFVRkhMRXRCUVVrc1EwRkJRenRSUVVOd1FpeEpRVUZKTEVsQlFVa3NRMEZCUXp0UlFVTlVMRXRCUVVrc1EwRkJReXhKUVVGSkxFZEJRVWM3V1VGRFVpeEpRVUZKTEVOQlFVTXNTVUZCU1N4RlFVRkZPMmRDUVVOUUxFbEJRVWtzU1VGQlNTeEhRVUZITEZOQlFWTXNRMEZCUXl4SlFVRkpMRVZCUVVVN2NVSkJRM1JDTEU5QlFVOHNRMEZCUXl4bFFVRk5MRU5CUVVNc1ZVRkJWU3hEUVVGRE8zRkNRVU14UWl4RlFVRkZMRU5CUVVNc2FVSkJRV2xDTEVWQlFVVXNaVUZCVFN4RFFVRkRMRk5CUVZNc1EwRkJRenR4UWtGRGRrTXNSVUZCUlN4RFFVRkRMR2RDUVVGblFpeEZRVUZGTEZWQlFVRXNRMEZCUXp0dlFrRkRia0lzWlVGQlRTeERRVUZETEVsQlFVa3NRMEZCVFN4RFFVRkRMRVZCUVVVc1UwRkJVeXhEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETzI5Q1FVTnlReXhSUVVGUkxFTkJRVU1zVFVGQlRTeEZRVUZGTEVOQlFVTTdaMEpCUTNSQ0xFTkJRVU1zUTBGQlF6dHhRa0ZEUkN4RlFVRkZMRU5CUVVNc1pVRkJaU3hGUVVGRkxHVkJRVTBzUTBGQlF5eFBRVUZQTEVOQlFVTXNRMEZCUXp0aFFVTTFRenRaUVVWRUxFbEJRVWtzUTBGQlF5eFRRVUZUTEVOQlFVTXNUVUZCVFR0blFrRkJSU3hQUVVGUExFbEJRVWtzUTBGQlF6dFpRVXR1UXl4VFFVRlRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMUZCUXpWQ0xFTkJRVU1zUTBGQlFUczdTVUZEVEN4RFFVRkRPMGxCZWtORUxITkRRVUZQTEVkQlFWQXNWVUZCVVN4RFFVRlJPMUZCUTFvc1NVRkJTU3hQUVVGUExFZEJRVWNzUlVGQlJTeEpRVUZKTEVWQlFVVXNhMEpCUVZNc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVWQlFVVXNTMEZCU3l4RlFVRkZMRU5CUVVNc1EwRkJReXhMUVVGTExFVkJRVVVzVFVGQlRTeEZRVUZGTEVOQlFVTXNRMEZCUXl4TlFVRk5MRVZCUVVVc1EwRkJRenRSUVVjMVJTeEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU1zU1VGQlNTeEZRVUZQTEU5QlFVOHNRMEZCUXl4RFFVRkRPMGxCUTJoRUxFTkJRVU03U1VGSFJDeHRRMEZCU1N4SFFVRktPMUZCUVVFc2FVSkJSVU03VVVGRVJ5eEpRVUZKTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1UwRkJVeXhEUVVGRExFdEJRVXNzUTBGQlF5eGpRVUZOTEU5QlFVRXNhVUpCUVUwc1NVRkJTU3haUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETEVsQlFVa3NSVUZCUlN4RlFVRjRRaXhEUVVGM1FpeERRVUZETEVOQlFVTTdTVUZEYWtVc1EwRkJRenRKUVd0RFJDeHBRMEZCUlN4SFFVRkdMRlZCUVVjc1UwRkJOa0lzUlVGQlJTeFJRVUZ2UWp0UlFVTnNSQ3hKUVVGSkxFOUJRVThzVTBGQlV5eExRVUZMTEZGQlFWRXNSVUZCUlR0WlFVTXZRaXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVWQlFVVXNRMEZCUXl4VFFVRlRMRVZCUVVVc1VVRkJVU3hEUVVGRExFTkJRVU03VTBGRGRFTTdZVUZCVFR0WlFVTklMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUlVGQlJTeERRVUZETEd0Q1FVRlRMRU5CUVVNc1UwRkJVeXhEUVVGRExFVkJRVVVzVVVGQlVTeERRVUZETEVOQlFVTTdVMEZEYWtRN1VVRkRSQ3hQUVVGUExFbEJRVWtzUTBGQlF6dEpRVU5vUWl4RFFVRkRPMGxCUTB3c01rSkJRVU03UVVGQlJDeERRVUZETEVGQmRFUkVMRU5CUVRCRExHVkJRVTBzUjBGelJDOURPMEZCZEVSWkxHOUVRVUZ2UWlKOSIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIExvY2tzID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBMb2NrcygpIHtcbiAgICAgICAgdGhpcy5sb2NrcyA9IHt9O1xuICAgIH1cbiAgICBMb2Nrcy5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gKGlkLCB4KSB7XG4gICAgICAgIHRoaXMubG9ja3NbaWRdID0geDtcbiAgICB9O1xuICAgIExvY2tzLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5sb2NrcyA9IHt9O1xuICAgIH07XG4gICAgTG9ja3MucHJvdG90eXBlLmlzRW1wdHkgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZvciAodmFyIGwgaW4gdGhpcy5sb2NrcylcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcbiAgICBMb2Nrcy5wcm90b3R5cGUuYXBwbHkgPSBmdW5jdGlvbiAoZikge1xuICAgICAgICBmb3IgKHZhciBsIGluIHRoaXMubG9ja3MpIHtcbiAgICAgICAgICAgIGYoTnVtYmVyKGwpLCB0aGlzLmxvY2tzW2xdKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIExvY2tzO1xufSgpKTtcbmV4cG9ydHMuTG9ja3MgPSBMb2NrcztcbnZhciBEZXNjZW50ID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBEZXNjZW50KHgsIEQsIEcpIHtcbiAgICAgICAgaWYgKEcgPT09IHZvaWQgMCkgeyBHID0gbnVsbDsgfVxuICAgICAgICB0aGlzLkQgPSBEO1xuICAgICAgICB0aGlzLkcgPSBHO1xuICAgICAgICB0aGlzLnRocmVzaG9sZCA9IDAuMDAwMTtcbiAgICAgICAgdGhpcy5udW1HcmlkU25hcE5vZGVzID0gMDtcbiAgICAgICAgdGhpcy5zbmFwR3JpZFNpemUgPSAxMDA7XG4gICAgICAgIHRoaXMuc25hcFN0cmVuZ3RoID0gMTAwMDtcbiAgICAgICAgdGhpcy5zY2FsZVNuYXBCeU1heEggPSBmYWxzZTtcbiAgICAgICAgdGhpcy5yYW5kb20gPSBuZXcgUHNldWRvUmFuZG9tKCk7XG4gICAgICAgIHRoaXMucHJvamVjdCA9IG51bGw7XG4gICAgICAgIHRoaXMueCA9IHg7XG4gICAgICAgIHRoaXMuayA9IHgubGVuZ3RoO1xuICAgICAgICB2YXIgbiA9IHRoaXMubiA9IHhbMF0ubGVuZ3RoO1xuICAgICAgICB0aGlzLkggPSBuZXcgQXJyYXkodGhpcy5rKTtcbiAgICAgICAgdGhpcy5nID0gbmV3IEFycmF5KHRoaXMuayk7XG4gICAgICAgIHRoaXMuSGQgPSBuZXcgQXJyYXkodGhpcy5rKTtcbiAgICAgICAgdGhpcy5hID0gbmV3IEFycmF5KHRoaXMuayk7XG4gICAgICAgIHRoaXMuYiA9IG5ldyBBcnJheSh0aGlzLmspO1xuICAgICAgICB0aGlzLmMgPSBuZXcgQXJyYXkodGhpcy5rKTtcbiAgICAgICAgdGhpcy5kID0gbmV3IEFycmF5KHRoaXMuayk7XG4gICAgICAgIHRoaXMuZSA9IG5ldyBBcnJheSh0aGlzLmspO1xuICAgICAgICB0aGlzLmlhID0gbmV3IEFycmF5KHRoaXMuayk7XG4gICAgICAgIHRoaXMuaWIgPSBuZXcgQXJyYXkodGhpcy5rKTtcbiAgICAgICAgdGhpcy54dG1wID0gbmV3IEFycmF5KHRoaXMuayk7XG4gICAgICAgIHRoaXMubG9ja3MgPSBuZXcgTG9ja3MoKTtcbiAgICAgICAgdGhpcy5taW5EID0gTnVtYmVyLk1BWF9WQUxVRTtcbiAgICAgICAgdmFyIGkgPSBuLCBqO1xuICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICBqID0gbjtcbiAgICAgICAgICAgIHdoaWxlICgtLWogPiBpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGQgPSBEW2ldW2pdO1xuICAgICAgICAgICAgICAgIGlmIChkID4gMCAmJiBkIDwgdGhpcy5taW5EKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWluRCA9IGQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLm1pbkQgPT09IE51bWJlci5NQVhfVkFMVUUpXG4gICAgICAgICAgICB0aGlzLm1pbkQgPSAxO1xuICAgICAgICBpID0gdGhpcy5rO1xuICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICB0aGlzLmdbaV0gPSBuZXcgQXJyYXkobik7XG4gICAgICAgICAgICB0aGlzLkhbaV0gPSBuZXcgQXJyYXkobik7XG4gICAgICAgICAgICBqID0gbjtcbiAgICAgICAgICAgIHdoaWxlIChqLS0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLkhbaV1bal0gPSBuZXcgQXJyYXkobik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLkhkW2ldID0gbmV3IEFycmF5KG4pO1xuICAgICAgICAgICAgdGhpcy5hW2ldID0gbmV3IEFycmF5KG4pO1xuICAgICAgICAgICAgdGhpcy5iW2ldID0gbmV3IEFycmF5KG4pO1xuICAgICAgICAgICAgdGhpcy5jW2ldID0gbmV3IEFycmF5KG4pO1xuICAgICAgICAgICAgdGhpcy5kW2ldID0gbmV3IEFycmF5KG4pO1xuICAgICAgICAgICAgdGhpcy5lW2ldID0gbmV3IEFycmF5KG4pO1xuICAgICAgICAgICAgdGhpcy5pYVtpXSA9IG5ldyBBcnJheShuKTtcbiAgICAgICAgICAgIHRoaXMuaWJbaV0gPSBuZXcgQXJyYXkobik7XG4gICAgICAgICAgICB0aGlzLnh0bXBbaV0gPSBuZXcgQXJyYXkobik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgRGVzY2VudC5jcmVhdGVTcXVhcmVNYXRyaXggPSBmdW5jdGlvbiAobiwgZikge1xuICAgICAgICB2YXIgTSA9IG5ldyBBcnJheShuKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgIE1baV0gPSBuZXcgQXJyYXkobik7XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IG47ICsraikge1xuICAgICAgICAgICAgICAgIE1baV1bal0gPSBmKGksIGopO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBNO1xuICAgIH07XG4gICAgRGVzY2VudC5wcm90b3R5cGUub2Zmc2V0RGlyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgdSA9IG5ldyBBcnJheSh0aGlzLmspO1xuICAgICAgICB2YXIgbCA9IDA7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5rOyArK2kpIHtcbiAgICAgICAgICAgIHZhciB4ID0gdVtpXSA9IHRoaXMucmFuZG9tLmdldE5leHRCZXR3ZWVuKDAuMDEsIDEpIC0gMC41O1xuICAgICAgICAgICAgbCArPSB4ICogeDtcbiAgICAgICAgfVxuICAgICAgICBsID0gTWF0aC5zcXJ0KGwpO1xuICAgICAgICByZXR1cm4gdS5tYXAoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHggKj0gX3RoaXMubWluRCAvIGw7IH0pO1xuICAgIH07XG4gICAgRGVzY2VudC5wcm90b3R5cGUuY29tcHV0ZURlcml2YXRpdmVzID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIG4gPSB0aGlzLm47XG4gICAgICAgIGlmIChuIDwgMSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdmFyIGk7XG4gICAgICAgIHZhciBkID0gbmV3IEFycmF5KHRoaXMuayk7XG4gICAgICAgIHZhciBkMiA9IG5ldyBBcnJheSh0aGlzLmspO1xuICAgICAgICB2YXIgSHV1ID0gbmV3IEFycmF5KHRoaXMuayk7XG4gICAgICAgIHZhciBtYXhIID0gMDtcbiAgICAgICAgZm9yICh2YXIgdV8xID0gMDsgdV8xIDwgbjsgKyt1XzEpIHtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLms7ICsraSlcbiAgICAgICAgICAgICAgICBIdXVbaV0gPSB0aGlzLmdbaV1bdV8xXSA9IDA7XG4gICAgICAgICAgICBmb3IgKHZhciB2ID0gMDsgdiA8IG47ICsrdikge1xuICAgICAgICAgICAgICAgIGlmICh1XzEgPT09IHYpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIHZhciBtYXhEaXNwbGFjZXMgPSBuO1xuICAgICAgICAgICAgICAgIHZhciBkaXN0YW5jZVNxdWFyZWQgPSAwO1xuICAgICAgICAgICAgICAgIHdoaWxlIChtYXhEaXNwbGFjZXMtLSkge1xuICAgICAgICAgICAgICAgICAgICBkaXN0YW5jZVNxdWFyZWQgPSAwO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5rOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkeF8xID0gZFtpXSA9IHhbaV1bdV8xXSAtIHhbaV1bdl07XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXN0YW5jZVNxdWFyZWQgKz0gZDJbaV0gPSBkeF8xICogZHhfMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoZGlzdGFuY2VTcXVhcmVkID4gMWUtOSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcmQgPSB0aGlzLm9mZnNldERpcigpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5rOyArK2kpXG4gICAgICAgICAgICAgICAgICAgICAgICB4W2ldW3ZdICs9IHJkW2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgZGlzdGFuY2UgPSBNYXRoLnNxcnQoZGlzdGFuY2VTcXVhcmVkKTtcbiAgICAgICAgICAgICAgICB2YXIgaWRlYWxEaXN0YW5jZSA9IHRoaXMuRFt1XzFdW3ZdO1xuICAgICAgICAgICAgICAgIHZhciB3ZWlnaHQgPSB0aGlzLkcgIT0gbnVsbCA/IHRoaXMuR1t1XzFdW3ZdIDogMTtcbiAgICAgICAgICAgICAgICBpZiAod2VpZ2h0ID4gMSAmJiBkaXN0YW5jZSA+IGlkZWFsRGlzdGFuY2UgfHwgIWlzRmluaXRlKGlkZWFsRGlzdGFuY2UpKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLms7ICsraSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuSFtpXVt1XzFdW3ZdID0gMDtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh3ZWlnaHQgPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHdlaWdodCA9IDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBpZGVhbERpc3RTcXVhcmVkID0gaWRlYWxEaXN0YW5jZSAqIGlkZWFsRGlzdGFuY2UsIGdzID0gMiAqIHdlaWdodCAqIChkaXN0YW5jZSAtIGlkZWFsRGlzdGFuY2UpIC8gKGlkZWFsRGlzdFNxdWFyZWQgKiBkaXN0YW5jZSksIGRpc3RhbmNlQ3ViZWQgPSBkaXN0YW5jZVNxdWFyZWQgKiBkaXN0YW5jZSwgaHMgPSAyICogLXdlaWdodCAvIChpZGVhbERpc3RTcXVhcmVkICogZGlzdGFuY2VDdWJlZCk7XG4gICAgICAgICAgICAgICAgaWYgKCFpc0Zpbml0ZShncykpXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGdzKTtcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5rOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nW2ldW3VfMV0gKz0gZFtpXSAqIGdzO1xuICAgICAgICAgICAgICAgICAgICBIdXVbaV0gLT0gdGhpcy5IW2ldW3VfMV1bdl0gPSBocyAqICgyICogZGlzdGFuY2VDdWJlZCArIGlkZWFsRGlzdGFuY2UgKiAoZDJbaV0gLSBkaXN0YW5jZVNxdWFyZWQpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5rOyArK2kpXG4gICAgICAgICAgICAgICAgbWF4SCA9IE1hdGgubWF4KG1heEgsIHRoaXMuSFtpXVt1XzFdW3VfMV0gPSBIdXVbaV0pO1xuICAgICAgICB9XG4gICAgICAgIHZhciByID0gdGhpcy5zbmFwR3JpZFNpemUgLyAyO1xuICAgICAgICB2YXIgZyA9IHRoaXMuc25hcEdyaWRTaXplO1xuICAgICAgICB2YXIgdyA9IHRoaXMuc25hcFN0cmVuZ3RoO1xuICAgICAgICB2YXIgayA9IHcgLyAociAqIHIpO1xuICAgICAgICB2YXIgbnVtTm9kZXMgPSB0aGlzLm51bUdyaWRTbmFwTm9kZXM7XG4gICAgICAgIGZvciAodmFyIHUgPSAwOyB1IDwgbnVtTm9kZXM7ICsrdSkge1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMuazsgKytpKSB7XG4gICAgICAgICAgICAgICAgdmFyIHhpdSA9IHRoaXMueFtpXVt1XTtcbiAgICAgICAgICAgICAgICB2YXIgbSA9IHhpdSAvIGc7XG4gICAgICAgICAgICAgICAgdmFyIGYgPSBtICUgMTtcbiAgICAgICAgICAgICAgICB2YXIgcSA9IG0gLSBmO1xuICAgICAgICAgICAgICAgIHZhciBhID0gTWF0aC5hYnMoZik7XG4gICAgICAgICAgICAgICAgdmFyIGR4ID0gKGEgPD0gMC41KSA/IHhpdSAtIHEgKiBnIDpcbiAgICAgICAgICAgICAgICAgICAgKHhpdSA+IDApID8geGl1IC0gKHEgKyAxKSAqIGcgOiB4aXUgLSAocSAtIDEpICogZztcbiAgICAgICAgICAgICAgICBpZiAoLXIgPCBkeCAmJiBkeCA8PSByKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnNjYWxlU25hcEJ5TWF4SCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5nW2ldW3VdICs9IG1heEggKiBrICogZHg7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLkhbaV1bdV1bdV0gKz0gbWF4SCAqIGs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdbaV1bdV0gKz0gayAqIGR4O1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5IW2ldW3VdW3VdICs9IGs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLmxvY2tzLmlzRW1wdHkoKSkge1xuICAgICAgICAgICAgdGhpcy5sb2Nrcy5hcHBseShmdW5jdGlvbiAodSwgcCkge1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBfdGhpcy5rOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuSFtpXVt1XVt1XSArPSBtYXhIO1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5nW2ldW3VdIC09IG1heEggKiAocFtpXSAtIHhbaV1bdV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBEZXNjZW50LmRvdFByb2QgPSBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICB2YXIgeCA9IDAsIGkgPSBhLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGktLSlcbiAgICAgICAgICAgIHggKz0gYVtpXSAqIGJbaV07XG4gICAgICAgIHJldHVybiB4O1xuICAgIH07XG4gICAgRGVzY2VudC5yaWdodE11bHRpcGx5ID0gZnVuY3Rpb24gKG0sIHYsIHIpIHtcbiAgICAgICAgdmFyIGkgPSBtLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGktLSlcbiAgICAgICAgICAgIHJbaV0gPSBEZXNjZW50LmRvdFByb2QobVtpXSwgdik7XG4gICAgfTtcbiAgICBEZXNjZW50LnByb3RvdHlwZS5jb21wdXRlU3RlcFNpemUgPSBmdW5jdGlvbiAoZCkge1xuICAgICAgICB2YXIgbnVtZXJhdG9yID0gMCwgZGVub21pbmF0b3IgPSAwO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuazsgKytpKSB7XG4gICAgICAgICAgICBudW1lcmF0b3IgKz0gRGVzY2VudC5kb3RQcm9kKHRoaXMuZ1tpXSwgZFtpXSk7XG4gICAgICAgICAgICBEZXNjZW50LnJpZ2h0TXVsdGlwbHkodGhpcy5IW2ldLCBkW2ldLCB0aGlzLkhkW2ldKTtcbiAgICAgICAgICAgIGRlbm9taW5hdG9yICs9IERlc2NlbnQuZG90UHJvZChkW2ldLCB0aGlzLkhkW2ldKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZGVub21pbmF0b3IgPT09IDAgfHwgIWlzRmluaXRlKGRlbm9taW5hdG9yKSlcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICByZXR1cm4gMSAqIG51bWVyYXRvciAvIGRlbm9taW5hdG9yO1xuICAgIH07XG4gICAgRGVzY2VudC5wcm90b3R5cGUucmVkdWNlU3RyZXNzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmNvbXB1dGVEZXJpdmF0aXZlcyh0aGlzLngpO1xuICAgICAgICB2YXIgYWxwaGEgPSB0aGlzLmNvbXB1dGVTdGVwU2l6ZSh0aGlzLmcpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuazsgKytpKSB7XG4gICAgICAgICAgICB0aGlzLnRha2VEZXNjZW50U3RlcCh0aGlzLnhbaV0sIHRoaXMuZ1tpXSwgYWxwaGEpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmNvbXB1dGVTdHJlc3MoKTtcbiAgICB9O1xuICAgIERlc2NlbnQuY29weSA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgIHZhciBtID0gYS5sZW5ndGgsIG4gPSBiWzBdLmxlbmd0aDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtOyArK2kpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgbjsgKytqKSB7XG4gICAgICAgICAgICAgICAgYltpXVtqXSA9IGFbaV1bal07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIERlc2NlbnQucHJvdG90eXBlLnN0ZXBBbmRQcm9qZWN0ID0gZnVuY3Rpb24gKHgwLCByLCBkLCBzdGVwU2l6ZSkge1xuICAgICAgICBEZXNjZW50LmNvcHkoeDAsIHIpO1xuICAgICAgICB0aGlzLnRha2VEZXNjZW50U3RlcChyWzBdLCBkWzBdLCBzdGVwU2l6ZSk7XG4gICAgICAgIGlmICh0aGlzLnByb2plY3QpXG4gICAgICAgICAgICB0aGlzLnByb2plY3RbMF0oeDBbMF0sIHgwWzFdLCByWzBdKTtcbiAgICAgICAgdGhpcy50YWtlRGVzY2VudFN0ZXAoclsxXSwgZFsxXSwgc3RlcFNpemUpO1xuICAgICAgICBpZiAodGhpcy5wcm9qZWN0KVxuICAgICAgICAgICAgdGhpcy5wcm9qZWN0WzFdKHJbMF0sIHgwWzFdLCByWzFdKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDI7IGkgPCB0aGlzLms7IGkrKylcbiAgICAgICAgICAgIHRoaXMudGFrZURlc2NlbnRTdGVwKHJbaV0sIGRbaV0sIHN0ZXBTaXplKTtcbiAgICB9O1xuICAgIERlc2NlbnQubUFwcGx5ID0gZnVuY3Rpb24gKG0sIG4sIGYpIHtcbiAgICAgICAgdmFyIGkgPSBtO1xuICAgICAgICB3aGlsZSAoaS0tID4gMCkge1xuICAgICAgICAgICAgdmFyIGogPSBuO1xuICAgICAgICAgICAgd2hpbGUgKGotLSA+IDApXG4gICAgICAgICAgICAgICAgZihpLCBqKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgRGVzY2VudC5wcm90b3R5cGUubWF0cml4QXBwbHkgPSBmdW5jdGlvbiAoZikge1xuICAgICAgICBEZXNjZW50Lm1BcHBseSh0aGlzLmssIHRoaXMubiwgZik7XG4gICAgfTtcbiAgICBEZXNjZW50LnByb3RvdHlwZS5jb21wdXRlTmV4dFBvc2l0aW9uID0gZnVuY3Rpb24gKHgwLCByKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHRoaXMuY29tcHV0ZURlcml2YXRpdmVzKHgwKTtcbiAgICAgICAgdmFyIGFscGhhID0gdGhpcy5jb21wdXRlU3RlcFNpemUodGhpcy5nKTtcbiAgICAgICAgdGhpcy5zdGVwQW5kUHJvamVjdCh4MCwgciwgdGhpcy5nLCBhbHBoYSk7XG4gICAgICAgIGlmICh0aGlzLnByb2plY3QpIHtcbiAgICAgICAgICAgIHRoaXMubWF0cml4QXBwbHkoZnVuY3Rpb24gKGksIGopIHsgcmV0dXJuIF90aGlzLmVbaV1bal0gPSB4MFtpXVtqXSAtIHJbaV1bal07IH0pO1xuICAgICAgICAgICAgdmFyIGJldGEgPSB0aGlzLmNvbXB1dGVTdGVwU2l6ZSh0aGlzLmUpO1xuICAgICAgICAgICAgYmV0YSA9IE1hdGgubWF4KDAuMiwgTWF0aC5taW4oYmV0YSwgMSkpO1xuICAgICAgICAgICAgdGhpcy5zdGVwQW5kUHJvamVjdCh4MCwgciwgdGhpcy5lLCBiZXRhKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgRGVzY2VudC5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKGl0ZXJhdGlvbnMpIHtcbiAgICAgICAgdmFyIHN0cmVzcyA9IE51bWJlci5NQVhfVkFMVUUsIGNvbnZlcmdlZCA9IGZhbHNlO1xuICAgICAgICB3aGlsZSAoIWNvbnZlcmdlZCAmJiBpdGVyYXRpb25zLS0gPiAwKSB7XG4gICAgICAgICAgICB2YXIgcyA9IHRoaXMucnVuZ2VLdXR0YSgpO1xuICAgICAgICAgICAgY29udmVyZ2VkID0gTWF0aC5hYnMoc3RyZXNzIC8gcyAtIDEpIDwgdGhpcy50aHJlc2hvbGQ7XG4gICAgICAgICAgICBzdHJlc3MgPSBzO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzdHJlc3M7XG4gICAgfTtcbiAgICBEZXNjZW50LnByb3RvdHlwZS5ydW5nZUt1dHRhID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB0aGlzLmNvbXB1dGVOZXh0UG9zaXRpb24odGhpcy54LCB0aGlzLmEpO1xuICAgICAgICBEZXNjZW50Lm1pZCh0aGlzLngsIHRoaXMuYSwgdGhpcy5pYSk7XG4gICAgICAgIHRoaXMuY29tcHV0ZU5leHRQb3NpdGlvbih0aGlzLmlhLCB0aGlzLmIpO1xuICAgICAgICBEZXNjZW50Lm1pZCh0aGlzLngsIHRoaXMuYiwgdGhpcy5pYik7XG4gICAgICAgIHRoaXMuY29tcHV0ZU5leHRQb3NpdGlvbih0aGlzLmliLCB0aGlzLmMpO1xuICAgICAgICB0aGlzLmNvbXB1dGVOZXh0UG9zaXRpb24odGhpcy5jLCB0aGlzLmQpO1xuICAgICAgICB2YXIgZGlzcCA9IDA7XG4gICAgICAgIHRoaXMubWF0cml4QXBwbHkoZnVuY3Rpb24gKGksIGopIHtcbiAgICAgICAgICAgIHZhciB4ID0gKF90aGlzLmFbaV1bal0gKyAyLjAgKiBfdGhpcy5iW2ldW2pdICsgMi4wICogX3RoaXMuY1tpXVtqXSArIF90aGlzLmRbaV1bal0pIC8gNi4wLCBkID0gX3RoaXMueFtpXVtqXSAtIHg7XG4gICAgICAgICAgICBkaXNwICs9IGQgKiBkO1xuICAgICAgICAgICAgX3RoaXMueFtpXVtqXSA9IHg7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGlzcDtcbiAgICB9O1xuICAgIERlc2NlbnQubWlkID0gZnVuY3Rpb24gKGEsIGIsIG0pIHtcbiAgICAgICAgRGVzY2VudC5tQXBwbHkoYS5sZW5ndGgsIGFbMF0ubGVuZ3RoLCBmdW5jdGlvbiAoaSwgaikge1xuICAgICAgICAgICAgcmV0dXJuIG1baV1bal0gPSBhW2ldW2pdICsgKGJbaV1bal0gLSBhW2ldW2pdKSAvIDIuMDtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBEZXNjZW50LnByb3RvdHlwZS50YWtlRGVzY2VudFN0ZXAgPSBmdW5jdGlvbiAoeCwgZCwgc3RlcFNpemUpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm47ICsraSkge1xuICAgICAgICAgICAgeFtpXSA9IHhbaV0gLSBzdGVwU2l6ZSAqIGRbaV07XG4gICAgICAgIH1cbiAgICB9O1xuICAgIERlc2NlbnQucHJvdG90eXBlLmNvbXB1dGVTdHJlc3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBzdHJlc3MgPSAwO1xuICAgICAgICBmb3IgKHZhciB1ID0gMCwgbk1pbnVzMSA9IHRoaXMubiAtIDE7IHUgPCBuTWludXMxOyArK3UpIHtcbiAgICAgICAgICAgIGZvciAodmFyIHYgPSB1ICsgMSwgbiA9IHRoaXMubjsgdiA8IG47ICsrdikge1xuICAgICAgICAgICAgICAgIHZhciBsID0gMDtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuazsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkeCA9IHRoaXMueFtpXVt1XSAtIHRoaXMueFtpXVt2XTtcbiAgICAgICAgICAgICAgICAgICAgbCArPSBkeCAqIGR4O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsID0gTWF0aC5zcXJ0KGwpO1xuICAgICAgICAgICAgICAgIHZhciBkID0gdGhpcy5EW3VdW3ZdO1xuICAgICAgICAgICAgICAgIGlmICghaXNGaW5pdGUoZCkpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIHZhciBybCA9IGQgLSBsO1xuICAgICAgICAgICAgICAgIHZhciBkMiA9IGQgKiBkO1xuICAgICAgICAgICAgICAgIHN0cmVzcyArPSBybCAqIHJsIC8gZDI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN0cmVzcztcbiAgICB9O1xuICAgIERlc2NlbnQuemVyb0Rpc3RhbmNlID0gMWUtMTA7XG4gICAgcmV0dXJuIERlc2NlbnQ7XG59KCkpO1xuZXhwb3J0cy5EZXNjZW50ID0gRGVzY2VudDtcbnZhciBQc2V1ZG9SYW5kb20gPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFBzZXVkb1JhbmRvbShzZWVkKSB7XG4gICAgICAgIGlmIChzZWVkID09PSB2b2lkIDApIHsgc2VlZCA9IDE7IH1cbiAgICAgICAgdGhpcy5zZWVkID0gc2VlZDtcbiAgICAgICAgdGhpcy5hID0gMjE0MDEzO1xuICAgICAgICB0aGlzLmMgPSAyNTMxMDExO1xuICAgICAgICB0aGlzLm0gPSAyMTQ3NDgzNjQ4O1xuICAgICAgICB0aGlzLnJhbmdlID0gMzI3Njc7XG4gICAgfVxuICAgIFBzZXVkb1JhbmRvbS5wcm90b3R5cGUuZ2V0TmV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5zZWVkID0gKHRoaXMuc2VlZCAqIHRoaXMuYSArIHRoaXMuYykgJSB0aGlzLm07XG4gICAgICAgIHJldHVybiAodGhpcy5zZWVkID4+IDE2KSAvIHRoaXMucmFuZ2U7XG4gICAgfTtcbiAgICBQc2V1ZG9SYW5kb20ucHJvdG90eXBlLmdldE5leHRCZXR3ZWVuID0gZnVuY3Rpb24gKG1pbiwgbWF4KSB7XG4gICAgICAgIHJldHVybiBtaW4gKyB0aGlzLmdldE5leHQoKSAqIChtYXggLSBtaW4pO1xuICAgIH07XG4gICAgcmV0dXJuIFBzZXVkb1JhbmRvbTtcbn0oKSk7XG5leHBvcnRzLlBzZXVkb1JhbmRvbSA9IFBzZXVkb1JhbmRvbTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSm1hV3hsSWpvaVpHVnpZMlZ1ZEM1cWN5SXNJbk52ZFhKalpWSnZiM1FpT2lJaUxDSnpiM1Z5WTJWeklqcGJJaTR1THk0dUwxZGxZa052YkdFdmMzSmpMMlJsYzJObGJuUXVkSE1pWFN3aWJtRnRaWE1pT2x0ZExDSnRZWEJ3YVc1bmN5STZJanM3UVVGSlNUdEpRVUZCTzFGQlEwa3NWVUZCU3l4SFFVRTJRaXhGUVVGRkxFTkJRVU03U1VGdlEzcERMRU5CUVVNN1NVRTNRa2NzYlVKQlFVY3NSMEZCU0N4VlFVRkpMRVZCUVZVc1JVRkJSU3hEUVVGWE8xRkJTWFpDTEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETzBsQlEzWkNMRU5CUVVNN1NVRkpSQ3h4UWtGQlN5eEhRVUZNTzFGQlEwa3NTVUZCU1N4RFFVRkRMRXRCUVVzc1IwRkJSeXhGUVVGRkxFTkJRVU03U1VGRGNFSXNRMEZCUXp0SlFVdEVMSFZDUVVGUExFZEJRVkE3VVVGRFNTeExRVUZMTEVsQlFVa3NRMEZCUXl4SlFVRkpMRWxCUVVrc1EwRkJReXhMUVVGTE8xbEJRVVVzVDBGQlR5eExRVUZMTEVOQlFVTTdVVUZEZGtNc1QwRkJUeXhKUVVGSkxFTkJRVU03U1VGRGFFSXNRMEZCUXp0SlFVdEVMSEZDUVVGTExFZEJRVXdzVlVGQlRTeERRVUZ2UXp0UlFVTjBReXhMUVVGTExFbEJRVWtzUTBGQlF5eEpRVUZKTEVsQlFVa3NRMEZCUXl4TFFVRkxMRVZCUVVVN1dVRkRkRUlzUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1UwRkRMMEk3U1VGRFRDeERRVUZETzBsQlEwd3NXVUZCUXp0QlFVRkVMRU5CUVVNc1FVRnlRMFFzU1VGeFEwTTdRVUZ5UTFrc2MwSkJRVXM3UVVGcFJHeENPMGxCTmtSSkxHbENRVUZaTEVOQlFXRXNSVUZCVXl4RFFVRmhMRVZCUVZNc1EwRkJiVUk3VVVGQmJrSXNhMEpCUVVFc1JVRkJRU3hSUVVGdFFqdFJRVUY2UXl4TlFVRkRMRWRCUVVRc1EwRkJReXhEUVVGWk8xRkJRVk1zVFVGQlF5eEhRVUZFTEVOQlFVTXNRMEZCYTBJN1VVRTFSSEJGTEdOQlFWTXNSMEZCVnl4TlFVRk5MRU5CUVVNN1VVRXlRek5DTEhGQ1FVRm5RaXhIUVVGWExFTkJRVU1zUTBGQlF6dFJRVU0zUWl4cFFrRkJXU3hIUVVGWExFZEJRVWNzUTBGQlF6dFJRVU16UWl4cFFrRkJXU3hIUVVGWExFbEJRVWtzUTBGQlF6dFJRVU0xUWl4dlFrRkJaU3hIUVVGWkxFdEJRVXNzUTBGQlF6dFJRVVZvUXl4WFFVRk5MRWRCUVVjc1NVRkJTU3haUVVGWkxFVkJRVVVzUTBGQlF6dFJRVVUzUWl4WlFVRlBMRWRCUVRCRUxFbEJRVWtzUTBGQlF6dFJRVmQ2UlN4SlFVRkpMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dFJRVU5ZTEVsQlFVa3NRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF6dFJRVU5zUWl4SlFVRkpMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU03VVVGRE4wSXNTVUZCU1N4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFdEJRVXNzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRNMElzU1VGQlNTeERRVUZETEVOQlFVTXNSMEZCUnl4SlFVRkpMRXRCUVVzc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZETTBJc1NVRkJTU3hEUVVGRExFVkJRVVVzUjBGQlJ5eEpRVUZKTEV0QlFVc3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRE5VSXNTVUZCU1N4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFdEJRVXNzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRNMElzU1VGQlNTeERRVUZETEVOQlFVTXNSMEZCUnl4SlFVRkpMRXRCUVVzc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZETTBJc1NVRkJTU3hEUVVGRExFTkJRVU1zUjBGQlJ5eEpRVUZKTEV0QlFVc3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRE0wSXNTVUZCU1N4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFdEJRVXNzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRNMElzU1VGQlNTeERRVUZETEVOQlFVTXNSMEZCUnl4SlFVRkpMRXRCUVVzc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZETTBJc1NVRkJTU3hEUVVGRExFVkJRVVVzUjBGQlJ5eEpRVUZKTEV0QlFVc3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRE5VSXNTVUZCU1N4RFFVRkRMRVZCUVVVc1IwRkJSeXhKUVVGSkxFdEJRVXNzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkROVUlzU1VGQlNTeERRVUZETEVsQlFVa3NSMEZCUnl4SlFVRkpMRXRCUVVzc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZET1VJc1NVRkJTU3hEUVVGRExFdEJRVXNzUjBGQlJ5eEpRVUZKTEV0QlFVc3NSVUZCUlN4RFFVRkRPMUZCUTNwQ0xFbEJRVWtzUTBGQlF5eEpRVUZKTEVkQlFVY3NUVUZCVFN4RFFVRkRMRk5CUVZNc1EwRkJRenRSUVVNM1FpeEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRE8xRkJRMklzVDBGQlR5eERRVUZETEVWQlFVVXNSVUZCUlR0WlFVTlNMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU03V1VGRFRpeFBRVUZQTEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSVHRuUWtGRFdpeEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdaMEpCUTJoQ0xFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFbEJRVWtzUlVGQlJUdHZRa0ZEZUVJc1NVRkJTU3hEUVVGRExFbEJRVWtzUjBGQlJ5eERRVUZETEVOQlFVTTdhVUpCUTJwQ08yRkJRMG83VTBGRFNqdFJRVU5FTEVsQlFVa3NTVUZCU1N4RFFVRkRMRWxCUVVrc1MwRkJTeXhOUVVGTkxFTkJRVU1zVTBGQlV6dFpRVUZGTEVsQlFVa3NRMEZCUXl4SlFVRkpMRWRCUVVjc1EwRkJReXhEUVVGRE8xRkJRMnhFTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRMWdzVDBGQlR5eERRVUZETEVWQlFVVXNSVUZCUlR0WlFVTlNMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NTVUZCU1N4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGVrSXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eEpRVUZKTEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVONlFpeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMWxCUTA0c1QwRkJUeXhEUVVGRExFVkJRVVVzUlVGQlJUdG5Ra0ZEVWl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRWxCUVVrc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzJGQlF5OUNPMWxCUTBRc1NVRkJTU3hEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4SlFVRkpMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU14UWl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVa3NTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRM3BDTEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRla0lzU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTjZRaXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRWxCUVVrc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFsQlEzcENMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NTVUZCU1N4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGVrSXNTVUZCU1N4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eEpRVUZKTEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVNeFFpeEpRVUZKTEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFbEJRVWtzUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUXpGQ0xFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1NVRkJTU3hMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVMEZETDBJN1NVRkRUQ3hEUVVGRE8wbEJSV0VzTUVKQlFXdENMRWRCUVdoRExGVkJRV2xETEVOQlFWTXNSVUZCUlN4RFFVRnRRenRSUVVNelJTeEpRVUZKTEVOQlFVTXNSMEZCUnl4SlFVRkpMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU55UWl4TFFVRkxMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJReXhGUVVGRk8xbEJRM2hDTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTndRaXhMUVVGTExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTzJkQ1FVTjRRaXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0aFFVTnlRanRUUVVOS08xRkJRMFFzVDBGQlR5eERRVUZETEVOQlFVTTdTVUZEWWl4RFFVRkRPMGxCUlU4c01rSkJRVk1zUjBGQmFrSTdVVUZCUVN4cFFrRlRRenRSUVZKSExFbEJRVWtzUTBGQlF5eEhRVUZITEVsQlFVa3NTMEZCU3l4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU14UWl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU03VVVGRFZpeExRVUZMTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNc1JVRkJSVHRaUVVNM1FpeEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4alFVRmpMRU5CUVVNc1NVRkJTU3hGUVVGRkxFTkJRVU1zUTBGQlF5eEhRVUZITEVkQlFVY3NRMEZCUXp0WlFVTjZSQ3hEUVVGRExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0VFFVTmtPMUZCUTBRc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRha0lzVDBGQlR5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRlZCUVVFc1EwRkJReXhKUVVGSExFOUJRVUVzUTBGQlF5eEpRVUZKTEV0QlFVa3NRMEZCUXl4SlFVRkpMRWRCUVVjc1EwRkJReXhGUVVGc1FpeERRVUZyUWl4RFFVRkRMRU5CUVVNN1NVRkRla01zUTBGQlF6dEpRVWROTEc5RFFVRnJRaXhIUVVGNlFpeFZRVUV3UWl4RFFVRmhPMUZCUVhaRExHbENRU3RIUXp0UlFUbEhSeXhKUVVGTkxFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTJwQ0xFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTTdXVUZCUlN4UFFVRlBPMUZCUTJ4Q0xFbEJRVWtzUTBGQlV5eERRVUZETzFGQlQyUXNTVUZCU1N4RFFVRkRMRWRCUVVjc1NVRkJTU3hMUVVGTExFTkJRVk1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTJ4RExFbEJRVWtzUlVGQlJTeEhRVUZITEVsQlFVa3NTMEZCU3l4RFFVRlRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU51UXl4SlFVRkpMRWRCUVVjc1IwRkJSeXhKUVVGSkxFdEJRVXNzUTBGQlV5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRjRU1zU1VGQlNTeEpRVUZKTEVkQlFVY3NRMEZCUXl4RFFVRkRPMUZCUjJJc1MwRkJTeXhKUVVGSkxFZEJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNSMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hGUVVGRkxFZEJRVU1zUlVGQlJUdFpRVVY0UWl4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRE8yZENRVUZGTEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dFpRVWQyUkN4TFFVRkxMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJReXhGUVVGRk8yZENRVU40UWl4SlFVRkpMRWRCUVVNc1MwRkJTeXhEUVVGRE8yOUNRVUZGTEZOQlFWTTdaMEpCU1hSQ0xFbEJRVWtzV1VGQldTeEhRVUZITEVOQlFVTXNRMEZCUXp0blFrRkRja0lzU1VGQlNTeGxRVUZsTEVkQlFVY3NRMEZCUXl4RFFVRkRPMmRDUVVONFFpeFBRVUZQTEZsQlFWa3NSVUZCUlN4RlFVRkZPMjlDUVVOdVFpeGxRVUZsTEVkQlFVY3NRMEZCUXl4RFFVRkRPMjlDUVVOd1FpeExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eERRVUZETEVWQlFVVXNSVUZCUlN4RFFVRkRMRVZCUVVVN2QwSkJRM3BDTEVsQlFVMHNTVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8zZENRVU53UXl4bFFVRmxMRWxCUVVrc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVVXNSMEZCUnl4SlFVRkZMRU5CUVVNN2NVSkJRM1JETzI5Q1FVTkVMRWxCUVVrc1pVRkJaU3hIUVVGSExFbEJRVWs3ZDBKQlFVVXNUVUZCVFR0dlFrRkRiRU1zU1VGQlRTeEZRVUZGTEVkQlFVY3NTVUZCU1N4RFFVRkRMRk5CUVZNc1JVRkJSU3hEUVVGRE8yOUNRVU0xUWl4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRE8zZENRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN2FVSkJRMnBFTzJkQ1FVTkVMRWxCUVUwc1VVRkJVU3hIUVVGSExFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNaVUZCWlN4RFFVRkRMRU5CUVVNN1owSkJRelZETEVsQlFVMHNZVUZCWVN4SFFVRkhMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1owSkJTVzVETEVsQlFVa3NUVUZCVFN4SFFVRkhMRWxCUVVrc1EwRkJReXhEUVVGRExFbEJRVWtzU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03WjBKQlJ5OURMRWxCUVVrc1RVRkJUU3hIUVVGSExFTkJRVU1zU1VGQlNTeFJRVUZSTEVkQlFVY3NZVUZCWVN4SlFVRkpMRU5CUVVNc1VVRkJVU3hEUVVGRExHRkJRV0VzUTBGQlF5eEZRVUZGTzI5Q1FVTndSU3hMUVVGTExFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhEUVVGRExFVkJRVVVzUlVGQlJTeERRVUZETzNkQ1FVRkZMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETzI5Q1FVTnFSQ3hUUVVGVE8ybENRVU5hTzJkQ1FVZEVMRWxCUVVrc1RVRkJUU3hIUVVGSExFTkJRVU1zUlVGQlJUdHZRa0ZEV2l4TlFVRk5MRWRCUVVjc1EwRkJReXhEUVVGRE8ybENRVU5rTzJkQ1FVTkVMRWxCUVUwc1owSkJRV2RDTEVkQlFVY3NZVUZCWVN4SFFVRkhMR0ZCUVdFc1JVRkRiRVFzUlVGQlJTeEhRVUZITEVOQlFVTXNSMEZCUnl4TlFVRk5MRWRCUVVjc1EwRkJReXhSUVVGUkxFZEJRVWNzWVVGQllTeERRVUZETEVkQlFVY3NRMEZCUXl4blFrRkJaMElzUjBGQlJ5eFJRVUZSTEVOQlFVTXNSVUZETlVVc1lVRkJZU3hIUVVGSExHVkJRV1VzUjBGQlJ5eFJRVUZSTEVWQlF6RkRMRVZCUVVVc1IwRkJSeXhEUVVGRExFZEJRVWNzUTBGQlF5eE5RVUZOTEVkQlFVY3NRMEZCUXl4blFrRkJaMElzUjBGQlJ5eGhRVUZoTEVOQlFVTXNRMEZCUXp0blFrRkRNVVFzU1VGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4RlFVRkZMRU5CUVVNN2IwSkJRMklzVDBGQlR5eERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJRenRuUWtGRGNFSXNTMEZCU3l4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJReXhGUVVGRk8yOUNRVU42UWl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVOQlFVTTdiMEpCUXpGQ0xFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFVkJRVVVzUjBGQlJ5eERRVUZETEVOQlFVTXNSMEZCUnl4aFFVRmhMRWRCUVVjc1lVRkJZU3hIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMR1ZCUVdVc1EwRkJReXhEUVVGRExFTkJRVU03YVVKQlEzQkhPMkZCUTBvN1dVRkRSQ3hMUVVGTExFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhEUVVGRExFVkJRVVVzUlVGQlJTeERRVUZETzJkQ1FVRkZMRWxCUVVrc1IwRkJSeXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVNc1EwRkJReXhIUVVGSExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMU5CUTJoR08xRkJSVVFzU1VGQlNTeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRmxCUVZrc1IwRkJReXhEUVVGRExFTkJRVU03VVVGRE5VSXNTVUZCU1N4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExGbEJRVmtzUTBGQlF6dFJRVU14UWl4SlFVRkpMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zV1VGQldTeERRVUZETzFGQlF6RkNMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOd1FpeEpRVUZKTEZGQlFWRXNSMEZCUnl4SlFVRkpMRU5CUVVNc1owSkJRV2RDTEVOQlFVTTdVVUZGY2tNc1MwRkJTeXhKUVVGSkxFTkJRVU1zUjBGQlZ5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRkZCUVZFc1JVRkJSU3hGUVVGRkxFTkJRVU1zUlVGQlJUdFpRVU4yUXl4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRExFVkJRVVU3WjBKQlEzcENMRWxCUVVrc1IwRkJSeXhIUVVGSExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03WjBKQlEzWkNMRWxCUVVrc1EwRkJReXhIUVVGSExFZEJRVWNzUjBGQlJ5eERRVUZETEVOQlFVTTdaMEpCUTJoQ0xFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1owSkJRMlFzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRuUWtGRFpDeEpRVUZKTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzJkQ1FVTndRaXhKUVVGSkxFVkJRVVVzUjBGQlJ5eERRVUZETEVOQlFVTXNTVUZCU1N4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eEhRVUZITEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJRenR2UWtGREwwSXNRMEZCUXl4SFFVRkhMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NSMEZCUnl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1IwRkJSeXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1owSkJRM1JFTEVsQlFVa3NRMEZCUXl4RFFVRkRMRWRCUVVjc1JVRkJSU3hKUVVGSkxFVkJRVVVzU1VGQlNTeERRVUZETEVWQlFVVTdiMEpCUTNCQ0xFbEJRVWtzU1VGQlNTeERRVUZETEdWQlFXVXNSVUZCUlR0M1FrRkRkRUlzU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeEpRVUZKTEVkQlFVY3NRMEZCUXl4SFFVRkhMRVZCUVVVc1EwRkJRenQzUWtGRE9VSXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hKUVVGSkxFZEJRVWNzUTBGQlF5eERRVUZETzNGQ1FVTXZRanQ1UWtGQlRUdDNRa0ZEU0N4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhGUVVGRkxFTkJRVU03ZDBKQlEzWkNMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzNGQ1FVTjRRanRwUWtGRFNqdGhRVU5LTzFOQlEwbzdVVUZEUkN4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eFBRVUZQTEVWQlFVVXNSVUZCUlR0WlFVTjJRaXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEV0QlFVc3NRMEZCUXl4VlFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRE8yZENRVU5zUWl4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEV0QlFVa3NRMEZCUXl4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRExFVkJRVVU3YjBKQlEzcENMRXRCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFbEJRVWtzU1VGQlNTeERRVUZETzI5Q1FVTjRRaXhMUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFbEJRVWtzUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRwUWtGRE0wTTdXVUZEVEN4RFFVRkRMRU5CUVVNc1EwRkJRenRUUVVOT08wbEJVMHdzUTBGQlF6dEpRVVZqTEdWQlFVOHNSMEZCZEVJc1ZVRkJkVUlzUTBGQlZ5eEZRVUZGTEVOQlFWYzdVVUZETTBNc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRE8xRkJRM2hDTEU5QlFVOHNRMEZCUXl4RlFVRkZPMWxCUVVVc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRE4wSXNUMEZCVHl4RFFVRkRMRU5CUVVNN1NVRkRZaXhEUVVGRE8wbEJSMk1zY1VKQlFXRXNSMEZCTlVJc1ZVRkJOa0lzUTBGQllTeEZRVUZGTEVOQlFWY3NSVUZCUlN4RFFVRlhPMUZCUTJoRkxFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNN1VVRkRha0lzVDBGQlR5eERRVUZETEVWQlFVVTdXVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzVDBGQlR5eERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdTVUZEYUVRc1EwRkJRenRKUVV0TkxHbERRVUZsTEVkQlFYUkNMRlZCUVhWQ0xFTkJRV0U3VVVGRGFFTXNTVUZCU1N4VFFVRlRMRWRCUVVjc1EwRkJReXhGUVVGRkxGZEJRVmNzUjBGQlJ5eERRVUZETEVOQlFVTTdVVUZEYmtNc1MwRkJTeXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhEUVVGRExFVkJRVVVzUlVGQlJTeERRVUZETEVWQlFVVTdXVUZETjBJc1UwRkJVeXhKUVVGSkxFOUJRVThzUTBGQlF5eFBRVUZQTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVNNVF5eFBRVUZQTEVOQlFVTXNZVUZCWVN4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFbEJRVWtzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVOdVJDeFhRVUZYTEVsQlFVa3NUMEZCVHl4RFFVRkRMRTlCUVU4c1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNTVUZCU1N4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFOQlEzQkVPMUZCUTBRc1NVRkJTU3hYUVVGWExFdEJRVXNzUTBGQlF5eEpRVUZKTEVOQlFVTXNVVUZCVVN4RFFVRkRMRmRCUVZjc1EwRkJRenRaUVVGRkxFOUJRVThzUTBGQlF5eERRVUZETzFGQlF6RkVMRTlCUVU4c1EwRkJReXhIUVVGSExGTkJRVk1zUjBGQlJ5eFhRVUZYTEVOQlFVTTdTVUZEZGtNc1EwRkJRenRKUVVWTkxEaENRVUZaTEVkQlFXNUNPMUZCUTBrc1NVRkJTU3hEUVVGRExHdENRVUZyUWl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU5vUXl4SlFVRkpMRXRCUVVzc1IwRkJSeXhKUVVGSkxFTkJRVU1zWlVGQlpTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVONlF5eExRVUZMTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNc1JVRkJSVHRaUVVNM1FpeEpRVUZKTEVOQlFVTXNaVUZCWlN4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeExRVUZMTEVOQlFVTXNRMEZCUXp0VFFVTnlSRHRSUVVORUxFOUJRVThzU1VGQlNTeERRVUZETEdGQlFXRXNSVUZCUlN4RFFVRkRPMGxCUTJoRExFTkJRVU03U1VGRll5eFpRVUZKTEVkQlFXNUNMRlZCUVc5Q0xFTkJRV0VzUlVGQlJTeERRVUZoTzFGQlF6VkRMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eE5RVUZOTEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTTdVVUZEYkVNc1MwRkJTeXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU1zUlVGQlJUdFpRVU40UWl4TFFVRkxMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJReXhGUVVGRk8yZENRVU40UWl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzJGQlEzSkNPMU5CUTBvN1NVRkRUQ3hEUVVGRE8wbEJVVThzWjBOQlFXTXNSMEZCZEVJc1ZVRkJkVUlzUlVGQll5eEZRVUZGTEVOQlFXRXNSVUZCUlN4RFFVRmhMRVZCUVVVc1VVRkJaMEk3VVVGRGFrWXNUMEZCVHl4RFFVRkRMRWxCUVVrc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEY0VJc1NVRkJTU3hEUVVGRExHVkJRV1VzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEZGQlFWRXNRMEZCUXl4RFFVRkRPMUZCUXpORExFbEJRVWtzU1VGQlNTeERRVUZETEU5QlFVODdXVUZCUlN4SlFVRkpMRU5CUVVNc1QwRkJUeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRGRFUXNTVUZCU1N4RFFVRkRMR1ZCUVdVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxGRkJRVkVzUTBGQlF5eERRVUZETzFGQlF6TkRMRWxCUVVrc1NVRkJTU3hEUVVGRExFOUJRVTg3V1VGQlJTeEpRVUZKTEVOQlFVTXNUMEZCVHl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkhja1FzUzBGQlN5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZPMWxCUXpOQ0xFbEJRVWtzUTBGQlF5eGxRVUZsTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4UlFVRlJMRU5CUVVNc1EwRkJRenRKUVZWdVJDeERRVUZETzBsQlJXTXNZMEZCVFN4SFFVRnlRaXhWUVVGelFpeERRVUZUTEVWQlFVVXNRMEZCVXl4RlFVRkZMRU5CUVdkRE8xRkJRM2hGTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRSUVVGRExFOUJRVThzUTBGQlF5eEZRVUZGTEVkQlFVY3NRMEZCUXl4RlFVRkZPMWxCUTNaQ0xFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0WlFVRkRMRTlCUVU4c1EwRkJReXhGUVVGRkxFZEJRVWNzUTBGQlF6dG5Ra0ZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzFOQlEzUkRPMGxCUTB3c1EwRkJRenRKUVVOUExEWkNRVUZYTEVkQlFXNUNMRlZCUVc5Q0xFTkJRV2RETzFGQlEyaEVMRTlCUVU4c1EwRkJReXhOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzBsQlEzUkRMRU5CUVVNN1NVRkZUeXh4UTBGQmJVSXNSMEZCTTBJc1ZVRkJORUlzUlVGQll5eEZRVUZGTEVOQlFXRTdVVUZCZWtRc2FVSkJaVU03VVVGa1J5eEpRVUZKTEVOQlFVTXNhMEpCUVd0Q0xFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTTdVVUZETlVJc1NVRkJTU3hMUVVGTExFZEJRVWNzU1VGQlNTeERRVUZETEdWQlFXVXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRGVrTXNTVUZCU1N4RFFVRkRMR05CUVdNc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRMRVZCUVVVc1MwRkJTeXhEUVVGRExFTkJRVU03VVVGTk1VTXNTVUZCU1N4SlFVRkpMRU5CUVVNc1QwRkJUeXhGUVVGRk8xbEJRMlFzU1VGQlNTeERRVUZETEZkQlFWY3NRMEZCUXl4VlFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFbEJRVXNzVDBGQlFTeExRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRV3BETEVOQlFXbERMRU5CUVVNc1EwRkJRenRaUVVNNVJDeEpRVUZKTEVsQlFVa3NSMEZCUnl4SlFVRkpMRU5CUVVNc1pVRkJaU3hEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTjRReXhKUVVGSkxFZEJRVWNzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRVZCUVVVc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVONFF5eEpRVUZKTEVOQlFVTXNZMEZCWXl4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTXNSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJRenRUUVVNMVF6dEpRVU5NTEVOQlFVTTdTVUZGVFN4eFFrRkJSeXhIUVVGV0xGVkJRVmNzVlVGQmEwSTdVVUZEZWtJc1NVRkJTU3hOUVVGTkxFZEJRVWNzVFVGQlRTeERRVUZETEZOQlFWTXNSVUZCUlN4VFFVRlRMRWRCUVVjc1MwRkJTeXhEUVVGRE8xRkJRMnBFTEU5QlFVOHNRMEZCUXl4VFFVRlRMRWxCUVVrc1ZVRkJWU3hGUVVGRkxFZEJRVWNzUTBGQlF5eEZRVUZGTzFsQlEyNURMRWxCUVVrc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eFZRVUZWTEVWQlFVVXNRMEZCUXp0WlFVTXhRaXhUUVVGVExFZEJRVWNzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4TlFVRk5MRWRCUVVjc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4VFFVRlRMRU5CUVVNN1dVRkRkRVFzVFVGQlRTeEhRVUZITEVOQlFVTXNRMEZCUXp0VFFVTmtPMUZCUTBRc1QwRkJUeXhOUVVGTkxFTkJRVU03U1VGRGJFSXNRMEZCUXp0SlFVVk5MRFJDUVVGVkxFZEJRV3BDTzFGQlFVRXNhVUpCWlVNN1VVRmtSeXhKUVVGSkxFTkJRVU1zYlVKQlFXMUNMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRla01zVDBGQlR5eERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETEVWQlFVVXNTVUZCU1N4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRE8xRkJRM0pETEVsQlFVa3NRMEZCUXl4dFFrRkJiVUlzUTBGQlF5eEpRVUZKTEVOQlFVTXNSVUZCUlN4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU14UXl4UFFVRlBMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVWQlFVVXNTVUZCU1N4RFFVRkRMRU5CUVVNc1JVRkJSU3hKUVVGSkxFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTTdVVUZEY2tNc1NVRkJTU3hEUVVGRExHMUNRVUZ0UWl4RFFVRkRMRWxCUVVrc1EwRkJReXhGUVVGRkxFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUXpGRExFbEJRVWtzUTBGQlF5eHRRa0ZCYlVJc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVONlF5eEpRVUZKTEVsQlFVa3NSMEZCUnl4RFFVRkRMRU5CUVVNN1VVRkRZaXhKUVVGSkxFTkJRVU1zVjBGQlZ5eERRVUZETEZWQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNN1dVRkRiRUlzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4TFFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRWRCUVVjc1IwRkJSeXhMUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFZEJRVWNzUjBGQlJ5eExRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEV0QlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4SFFVRkhMRVZCUTJwR0xFTkJRVU1zUjBGQlJ5eExRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0WlFVTjZRaXhKUVVGSkxFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0WlFVTmtMRXRCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE8xRkJRM0pDTEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTBnc1QwRkJUeXhKUVVGSkxFTkJRVU03U1VGRGFFSXNRMEZCUXp0SlFVVmpMRmRCUVVjc1IwRkJiRUlzVlVGQmJVSXNRMEZCWVN4RlFVRkZMRU5CUVdFc1JVRkJSU3hEUVVGaE8xRkJRekZFTEU5QlFVOHNRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRExFMUJRVTBzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hGUVVGRkxGVkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTTdXVUZEZGtNc1QwRkJRU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRWRCUVVjN1VVRkJOME1zUTBGQk5rTXNRMEZCUXl4RFFVRkRPMGxCUTNaRUxFTkJRVU03U1VGRlRTeHBRMEZCWlN4SFFVRjBRaXhWUVVGMVFpeERRVUZYTEVWQlFVVXNRMEZCVnl4RlFVRkZMRkZCUVdkQ08xRkJRemRFTEV0QlFVc3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJReXhGUVVGRk8xbEJRemRDTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NVVUZCVVN4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFRRVU5xUXp0SlFVTk1MRU5CUVVNN1NVRkZUU3dyUWtGQllTeEhRVUZ3UWp0UlFVTkpMRWxCUVVrc1RVRkJUU3hIUVVGSExFTkJRVU1zUTBGQlF6dFJRVU5tTEV0QlFVc3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFOUJRVThzUjBGQlJ5eEpRVUZKTEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzVDBGQlR5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RlFVRkZPMWxCUTNCRUxFdEJRVXNzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTzJkQ1FVTjRReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdaMEpCUTFZc1MwRkJTeXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhEUVVGRExFVkJRVVVzUlVGQlJTeERRVUZETEVWQlFVVTdiMEpCUXpkQ0xFbEJRVWtzUlVGQlJTeEhRVUZITEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0dlFrRkRja01zUTBGQlF5eEpRVUZKTEVWQlFVVXNSMEZCUnl4RlFVRkZMRU5CUVVNN2FVSkJRMmhDTzJkQ1FVTkVMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVOcVFpeEpRVUZKTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVOeVFpeEpRVUZKTEVOQlFVTXNVVUZCVVN4RFFVRkRMRU5CUVVNc1EwRkJRenR2UWtGQlJTeFRRVUZUTzJkQ1FVTXpRaXhKUVVGSkxFVkJRVVVzUjBGQlJ5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMmRDUVVObUxFbEJRVWtzUlVGQlJTeEhRVUZITEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1owSkJRMllzVFVGQlRTeEpRVUZKTEVWQlFVVXNSMEZCUnl4RlFVRkZMRWRCUVVjc1JVRkJSU3hEUVVGRE8yRkJRekZDTzFOQlEwbzdVVUZEUkN4UFFVRlBMRTFCUVUwc1EwRkJRenRKUVVOc1FpeERRVUZETzBsQmNGaGpMRzlDUVVGWkxFZEJRVmNzUzBGQlN5eERRVUZETzBsQmNWaG9SQ3hqUVVGRE8wTkJRVUVzUVVFdldVUXNTVUVyV1VNN1FVRXZXVmtzTUVKQlFVODdRVUZyV25CQ08wbEJUVWtzYzBKQlFXMUNMRWxCUVdkQ08xRkJRV2hDTEhGQ1FVRkJMRVZCUVVFc1VVRkJaMEk3VVVGQmFFSXNVMEZCU1N4SFFVRktMRWxCUVVrc1EwRkJXVHRSUVV3elFpeE5RVUZETEVkQlFWY3NUVUZCVFN4RFFVRkRPMUZCUTI1Q0xFMUJRVU1zUjBGQlZ5eFBRVUZQTEVOQlFVTTdVVUZEY0VJc1RVRkJReXhIUVVGWExGVkJRVlVzUTBGQlF6dFJRVU4yUWl4VlFVRkxMRWRCUVZjc1MwRkJTeXhEUVVGRE8wbEJSVk1zUTBGQlF6dEpRVWQ0UXl3NFFrRkJUeXhIUVVGUU8xRkJRMGtzU1VGQlNTeERRVUZETEVsQlFVa3NSMEZCUnl4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFZEJRVWNzU1VGQlNTeERRVUZETEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTnVSQ3hQUVVGUExFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NTVUZCU1N4RlFVRkZMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETzBsQlF6RkRMRU5CUVVNN1NVRkhSQ3h4UTBGQll5eEhRVUZrTEZWQlFXVXNSMEZCVnl4RlFVRkZMRWRCUVZjN1VVRkRia01zVDBGQlR5eEhRVUZITEVkQlFVY3NTVUZCU1N4RFFVRkRMRTlCUVU4c1JVRkJSU3hIUVVGSExFTkJRVU1zUjBGQlJ5eEhRVUZITEVkQlFVY3NRMEZCUXl4RFFVRkRPMGxCUXpsRExFTkJRVU03U1VGRFRDeHRRa0ZCUXp0QlFVRkVMRU5CUVVNc1FVRnNRa1FzU1VGclFrTTdRVUZzUWxrc2IwTkJRVmtpZlE9PSIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fZXh0ZW5kcyA9ICh0aGlzICYmIHRoaXMuX19leHRlbmRzKSB8fCAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBleHRlbmRTdGF0aWNzID0gZnVuY3Rpb24gKGQsIGIpIHtcbiAgICAgICAgZXh0ZW5kU3RhdGljcyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fFxuICAgICAgICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxuICAgICAgICAgICAgZnVuY3Rpb24gKGQsIGIpIHsgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07IH07XG4gICAgICAgIHJldHVybiBleHRlbmRTdGF0aWNzKGQsIGIpO1xuICAgIH07XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgICAgIGV4dGVuZFN0YXRpY3MoZCwgYik7XG4gICAgICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgICAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XG4gICAgfTtcbn0pKCk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgcmVjdGFuZ2xlXzEgPSByZXF1aXJlKFwiLi9yZWN0YW5nbGVcIik7XG52YXIgUG9pbnQgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFBvaW50KCkge1xuICAgIH1cbiAgICByZXR1cm4gUG9pbnQ7XG59KCkpO1xuZXhwb3J0cy5Qb2ludCA9IFBvaW50O1xudmFyIExpbmVTZWdtZW50ID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBMaW5lU2VnbWVudCh4MSwgeTEsIHgyLCB5Mikge1xuICAgICAgICB0aGlzLngxID0geDE7XG4gICAgICAgIHRoaXMueTEgPSB5MTtcbiAgICAgICAgdGhpcy54MiA9IHgyO1xuICAgICAgICB0aGlzLnkyID0geTI7XG4gICAgfVxuICAgIHJldHVybiBMaW5lU2VnbWVudDtcbn0oKSk7XG5leHBvcnRzLkxpbmVTZWdtZW50ID0gTGluZVNlZ21lbnQ7XG52YXIgUG9seVBvaW50ID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoUG9seVBvaW50LCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIFBvbHlQb2ludCgpIHtcbiAgICAgICAgcmV0dXJuIF9zdXBlciAhPT0gbnVsbCAmJiBfc3VwZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKSB8fCB0aGlzO1xuICAgIH1cbiAgICByZXR1cm4gUG9seVBvaW50O1xufShQb2ludCkpO1xuZXhwb3J0cy5Qb2x5UG9pbnQgPSBQb2x5UG9pbnQ7XG5mdW5jdGlvbiBpc0xlZnQoUDAsIFAxLCBQMikge1xuICAgIHJldHVybiAoUDEueCAtIFAwLngpICogKFAyLnkgLSBQMC55KSAtIChQMi54IC0gUDAueCkgKiAoUDEueSAtIFAwLnkpO1xufVxuZXhwb3J0cy5pc0xlZnQgPSBpc0xlZnQ7XG5mdW5jdGlvbiBhYm92ZShwLCB2aSwgdmopIHtcbiAgICByZXR1cm4gaXNMZWZ0KHAsIHZpLCB2aikgPiAwO1xufVxuZnVuY3Rpb24gYmVsb3cocCwgdmksIHZqKSB7XG4gICAgcmV0dXJuIGlzTGVmdChwLCB2aSwgdmopIDwgMDtcbn1cbmZ1bmN0aW9uIENvbnZleEh1bGwoUykge1xuICAgIHZhciBQID0gUy5zbGljZSgwKS5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhLnggIT09IGIueCA/IGIueCAtIGEueCA6IGIueSAtIGEueTsgfSk7XG4gICAgdmFyIG4gPSBTLmxlbmd0aCwgaTtcbiAgICB2YXIgbWlubWluID0gMDtcbiAgICB2YXIgeG1pbiA9IFBbMF0ueDtcbiAgICBmb3IgKGkgPSAxOyBpIDwgbjsgKytpKSB7XG4gICAgICAgIGlmIChQW2ldLnggIT09IHhtaW4pXG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG4gICAgdmFyIG1pbm1heCA9IGkgLSAxO1xuICAgIHZhciBIID0gW107XG4gICAgSC5wdXNoKFBbbWlubWluXSk7XG4gICAgaWYgKG1pbm1heCA9PT0gbiAtIDEpIHtcbiAgICAgICAgaWYgKFBbbWlubWF4XS55ICE9PSBQW21pbm1pbl0ueSlcbiAgICAgICAgICAgIEgucHVzaChQW21pbm1heF0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdmFyIG1heG1pbiwgbWF4bWF4ID0gbiAtIDE7XG4gICAgICAgIHZhciB4bWF4ID0gUFtuIC0gMV0ueDtcbiAgICAgICAgZm9yIChpID0gbiAtIDI7IGkgPj0gMDsgaS0tKVxuICAgICAgICAgICAgaWYgKFBbaV0ueCAhPT0geG1heClcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgbWF4bWluID0gaSArIDE7XG4gICAgICAgIGkgPSBtaW5tYXg7XG4gICAgICAgIHdoaWxlICgrK2kgPD0gbWF4bWluKSB7XG4gICAgICAgICAgICBpZiAoaXNMZWZ0KFBbbWlubWluXSwgUFttYXhtaW5dLCBQW2ldKSA+PSAwICYmIGkgPCBtYXhtaW4pXG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB3aGlsZSAoSC5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzTGVmdChIW0gubGVuZ3RoIC0gMl0sIEhbSC5sZW5ndGggLSAxXSwgUFtpXSkgPiAwKVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIEgubGVuZ3RoIC09IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaSAhPSBtaW5taW4pXG4gICAgICAgICAgICAgICAgSC5wdXNoKFBbaV0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChtYXhtYXggIT0gbWF4bWluKVxuICAgICAgICAgICAgSC5wdXNoKFBbbWF4bWF4XSk7XG4gICAgICAgIHZhciBib3QgPSBILmxlbmd0aDtcbiAgICAgICAgaSA9IG1heG1pbjtcbiAgICAgICAgd2hpbGUgKC0taSA+PSBtaW5tYXgpIHtcbiAgICAgICAgICAgIGlmIChpc0xlZnQoUFttYXhtYXhdLCBQW21pbm1heF0sIFBbaV0pID49IDAgJiYgaSA+IG1pbm1heClcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIHdoaWxlIChILmxlbmd0aCA+IGJvdCkge1xuICAgICAgICAgICAgICAgIGlmIChpc0xlZnQoSFtILmxlbmd0aCAtIDJdLCBIW0gubGVuZ3RoIC0gMV0sIFBbaV0pID4gMClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBILmxlbmd0aCAtPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGkgIT0gbWlubWluKVxuICAgICAgICAgICAgICAgIEgucHVzaChQW2ldKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gSDtcbn1cbmV4cG9ydHMuQ29udmV4SHVsbCA9IENvbnZleEh1bGw7XG5mdW5jdGlvbiBjbG9ja3dpc2VSYWRpYWxTd2VlcChwLCBQLCBmKSB7XG4gICAgUC5zbGljZSgwKS5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBNYXRoLmF0YW4yKGEueSAtIHAueSwgYS54IC0gcC54KSAtIE1hdGguYXRhbjIoYi55IC0gcC55LCBiLnggLSBwLngpOyB9KS5mb3JFYWNoKGYpO1xufVxuZXhwb3J0cy5jbG9ja3dpc2VSYWRpYWxTd2VlcCA9IGNsb2Nrd2lzZVJhZGlhbFN3ZWVwO1xuZnVuY3Rpb24gbmV4dFBvbHlQb2ludChwLCBwcykge1xuICAgIGlmIChwLnBvbHlJbmRleCA9PT0gcHMubGVuZ3RoIC0gMSlcbiAgICAgICAgcmV0dXJuIHBzWzBdO1xuICAgIHJldHVybiBwc1twLnBvbHlJbmRleCArIDFdO1xufVxuZnVuY3Rpb24gcHJldlBvbHlQb2ludChwLCBwcykge1xuICAgIGlmIChwLnBvbHlJbmRleCA9PT0gMClcbiAgICAgICAgcmV0dXJuIHBzW3BzLmxlbmd0aCAtIDFdO1xuICAgIHJldHVybiBwc1twLnBvbHlJbmRleCAtIDFdO1xufVxuZnVuY3Rpb24gdGFuZ2VudF9Qb2ludFBvbHlDKFAsIFYpIHtcbiAgICB2YXIgVmNsb3NlZCA9IFYuc2xpY2UoMCk7XG4gICAgVmNsb3NlZC5wdXNoKFZbMF0pO1xuICAgIHJldHVybiB7IHJ0YW46IFJ0YW5nZW50X1BvaW50UG9seUMoUCwgVmNsb3NlZCksIGx0YW46IEx0YW5nZW50X1BvaW50UG9seUMoUCwgVmNsb3NlZCkgfTtcbn1cbmZ1bmN0aW9uIFJ0YW5nZW50X1BvaW50UG9seUMoUCwgVikge1xuICAgIHZhciBuID0gVi5sZW5ndGggLSAxO1xuICAgIHZhciBhLCBiLCBjO1xuICAgIHZhciB1cEEsIGRuQztcbiAgICBpZiAoYmVsb3coUCwgVlsxXSwgVlswXSkgJiYgIWFib3ZlKFAsIFZbbiAtIDFdLCBWWzBdKSlcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgZm9yIChhID0gMCwgYiA9IG47Oykge1xuICAgICAgICBpZiAoYiAtIGEgPT09IDEpXG4gICAgICAgICAgICBpZiAoYWJvdmUoUCwgVlthXSwgVltiXSkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGE7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcmV0dXJuIGI7XG4gICAgICAgIGMgPSBNYXRoLmZsb29yKChhICsgYikgLyAyKTtcbiAgICAgICAgZG5DID0gYmVsb3coUCwgVltjICsgMV0sIFZbY10pO1xuICAgICAgICBpZiAoZG5DICYmICFhYm92ZShQLCBWW2MgLSAxXSwgVltjXSkpXG4gICAgICAgICAgICByZXR1cm4gYztcbiAgICAgICAgdXBBID0gYWJvdmUoUCwgVlthICsgMV0sIFZbYV0pO1xuICAgICAgICBpZiAodXBBKSB7XG4gICAgICAgICAgICBpZiAoZG5DKVxuICAgICAgICAgICAgICAgIGIgPSBjO1xuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKGFib3ZlKFAsIFZbYV0sIFZbY10pKVxuICAgICAgICAgICAgICAgICAgICBiID0gYztcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGEgPSBjO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKCFkbkMpXG4gICAgICAgICAgICAgICAgYSA9IGM7XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoYmVsb3coUCwgVlthXSwgVltjXSkpXG4gICAgICAgICAgICAgICAgICAgIGIgPSBjO1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgYSA9IGM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBMdGFuZ2VudF9Qb2ludFBvbHlDKFAsIFYpIHtcbiAgICB2YXIgbiA9IFYubGVuZ3RoIC0gMTtcbiAgICB2YXIgYSwgYiwgYztcbiAgICB2YXIgZG5BLCBkbkM7XG4gICAgaWYgKGFib3ZlKFAsIFZbbiAtIDFdLCBWWzBdKSAmJiAhYmVsb3coUCwgVlsxXSwgVlswXSkpXG4gICAgICAgIHJldHVybiAwO1xuICAgIGZvciAoYSA9IDAsIGIgPSBuOzspIHtcbiAgICAgICAgaWYgKGIgLSBhID09PSAxKVxuICAgICAgICAgICAgaWYgKGJlbG93KFAsIFZbYV0sIFZbYl0pKVxuICAgICAgICAgICAgICAgIHJldHVybiBhO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJldHVybiBiO1xuICAgICAgICBjID0gTWF0aC5mbG9vcigoYSArIGIpIC8gMik7XG4gICAgICAgIGRuQyA9IGJlbG93KFAsIFZbYyArIDFdLCBWW2NdKTtcbiAgICAgICAgaWYgKGFib3ZlKFAsIFZbYyAtIDFdLCBWW2NdKSAmJiAhZG5DKVxuICAgICAgICAgICAgcmV0dXJuIGM7XG4gICAgICAgIGRuQSA9IGJlbG93KFAsIFZbYSArIDFdLCBWW2FdKTtcbiAgICAgICAgaWYgKGRuQSkge1xuICAgICAgICAgICAgaWYgKCFkbkMpXG4gICAgICAgICAgICAgICAgYiA9IGM7XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoYmVsb3coUCwgVlthXSwgVltjXSkpXG4gICAgICAgICAgICAgICAgICAgIGIgPSBjO1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgYSA9IGM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZiAoZG5DKVxuICAgICAgICAgICAgICAgIGEgPSBjO1xuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKGFib3ZlKFAsIFZbYV0sIFZbY10pKVxuICAgICAgICAgICAgICAgICAgICBiID0gYztcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGEgPSBjO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gdGFuZ2VudF9Qb2x5UG9seUMoViwgVywgdDEsIHQyLCBjbXAxLCBjbXAyKSB7XG4gICAgdmFyIGl4MSwgaXgyO1xuICAgIGl4MSA9IHQxKFdbMF0sIFYpO1xuICAgIGl4MiA9IHQyKFZbaXgxXSwgVyk7XG4gICAgdmFyIGRvbmUgPSBmYWxzZTtcbiAgICB3aGlsZSAoIWRvbmUpIHtcbiAgICAgICAgZG9uZSA9IHRydWU7XG4gICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgICBpZiAoaXgxID09PSBWLmxlbmd0aCAtIDEpXG4gICAgICAgICAgICAgICAgaXgxID0gMDtcbiAgICAgICAgICAgIGlmIChjbXAxKFdbaXgyXSwgVltpeDFdLCBWW2l4MSArIDFdKSlcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICsraXgxO1xuICAgICAgICB9XG4gICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgICBpZiAoaXgyID09PSAwKVxuICAgICAgICAgICAgICAgIGl4MiA9IFcubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgIGlmIChjbXAyKFZbaXgxXSwgV1tpeDJdLCBXW2l4MiAtIDFdKSlcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIC0taXgyO1xuICAgICAgICAgICAgZG9uZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7IHQxOiBpeDEsIHQyOiBpeDIgfTtcbn1cbmV4cG9ydHMudGFuZ2VudF9Qb2x5UG9seUMgPSB0YW5nZW50X1BvbHlQb2x5QztcbmZ1bmN0aW9uIExSdGFuZ2VudF9Qb2x5UG9seUMoViwgVykge1xuICAgIHZhciBybCA9IFJMdGFuZ2VudF9Qb2x5UG9seUMoVywgVik7XG4gICAgcmV0dXJuIHsgdDE6IHJsLnQyLCB0MjogcmwudDEgfTtcbn1cbmV4cG9ydHMuTFJ0YW5nZW50X1BvbHlQb2x5QyA9IExSdGFuZ2VudF9Qb2x5UG9seUM7XG5mdW5jdGlvbiBSTHRhbmdlbnRfUG9seVBvbHlDKFYsIFcpIHtcbiAgICByZXR1cm4gdGFuZ2VudF9Qb2x5UG9seUMoViwgVywgUnRhbmdlbnRfUG9pbnRQb2x5QywgTHRhbmdlbnRfUG9pbnRQb2x5QywgYWJvdmUsIGJlbG93KTtcbn1cbmV4cG9ydHMuUkx0YW5nZW50X1BvbHlQb2x5QyA9IFJMdGFuZ2VudF9Qb2x5UG9seUM7XG5mdW5jdGlvbiBMTHRhbmdlbnRfUG9seVBvbHlDKFYsIFcpIHtcbiAgICByZXR1cm4gdGFuZ2VudF9Qb2x5UG9seUMoViwgVywgTHRhbmdlbnRfUG9pbnRQb2x5QywgTHRhbmdlbnRfUG9pbnRQb2x5QywgYmVsb3csIGJlbG93KTtcbn1cbmV4cG9ydHMuTEx0YW5nZW50X1BvbHlQb2x5QyA9IExMdGFuZ2VudF9Qb2x5UG9seUM7XG5mdW5jdGlvbiBSUnRhbmdlbnRfUG9seVBvbHlDKFYsIFcpIHtcbiAgICByZXR1cm4gdGFuZ2VudF9Qb2x5UG9seUMoViwgVywgUnRhbmdlbnRfUG9pbnRQb2x5QywgUnRhbmdlbnRfUG9pbnRQb2x5QywgYWJvdmUsIGFib3ZlKTtcbn1cbmV4cG9ydHMuUlJ0YW5nZW50X1BvbHlQb2x5QyA9IFJSdGFuZ2VudF9Qb2x5UG9seUM7XG52YXIgQmlUYW5nZW50ID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBCaVRhbmdlbnQodDEsIHQyKSB7XG4gICAgICAgIHRoaXMudDEgPSB0MTtcbiAgICAgICAgdGhpcy50MiA9IHQyO1xuICAgIH1cbiAgICByZXR1cm4gQmlUYW5nZW50O1xufSgpKTtcbmV4cG9ydHMuQmlUYW5nZW50ID0gQmlUYW5nZW50O1xudmFyIEJpVGFuZ2VudHMgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEJpVGFuZ2VudHMoKSB7XG4gICAgfVxuICAgIHJldHVybiBCaVRhbmdlbnRzO1xufSgpKTtcbmV4cG9ydHMuQmlUYW5nZW50cyA9IEJpVGFuZ2VudHM7XG52YXIgVFZHUG9pbnQgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhUVkdQb2ludCwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBUVkdQb2ludCgpIHtcbiAgICAgICAgcmV0dXJuIF9zdXBlciAhPT0gbnVsbCAmJiBfc3VwZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKSB8fCB0aGlzO1xuICAgIH1cbiAgICByZXR1cm4gVFZHUG9pbnQ7XG59KFBvaW50KSk7XG5leHBvcnRzLlRWR1BvaW50ID0gVFZHUG9pbnQ7XG52YXIgVmlzaWJpbGl0eVZlcnRleCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gVmlzaWJpbGl0eVZlcnRleChpZCwgcG9seWlkLCBwb2x5dmVydGlkLCBwKSB7XG4gICAgICAgIHRoaXMuaWQgPSBpZDtcbiAgICAgICAgdGhpcy5wb2x5aWQgPSBwb2x5aWQ7XG4gICAgICAgIHRoaXMucG9seXZlcnRpZCA9IHBvbHl2ZXJ0aWQ7XG4gICAgICAgIHRoaXMucCA9IHA7XG4gICAgICAgIHAudnYgPSB0aGlzO1xuICAgIH1cbiAgICByZXR1cm4gVmlzaWJpbGl0eVZlcnRleDtcbn0oKSk7XG5leHBvcnRzLlZpc2liaWxpdHlWZXJ0ZXggPSBWaXNpYmlsaXR5VmVydGV4O1xudmFyIFZpc2liaWxpdHlFZGdlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBWaXNpYmlsaXR5RWRnZShzb3VyY2UsIHRhcmdldCkge1xuICAgICAgICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcbiAgICAgICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XG4gICAgfVxuICAgIFZpc2liaWxpdHlFZGdlLnByb3RvdHlwZS5sZW5ndGggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBkeCA9IHRoaXMuc291cmNlLnAueCAtIHRoaXMudGFyZ2V0LnAueDtcbiAgICAgICAgdmFyIGR5ID0gdGhpcy5zb3VyY2UucC55IC0gdGhpcy50YXJnZXQucC55O1xuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KGR4ICogZHggKyBkeSAqIGR5KTtcbiAgICB9O1xuICAgIHJldHVybiBWaXNpYmlsaXR5RWRnZTtcbn0oKSk7XG5leHBvcnRzLlZpc2liaWxpdHlFZGdlID0gVmlzaWJpbGl0eUVkZ2U7XG52YXIgVGFuZ2VudFZpc2liaWxpdHlHcmFwaCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gVGFuZ2VudFZpc2liaWxpdHlHcmFwaChQLCBnMCkge1xuICAgICAgICB0aGlzLlAgPSBQO1xuICAgICAgICB0aGlzLlYgPSBbXTtcbiAgICAgICAgdGhpcy5FID0gW107XG4gICAgICAgIGlmICghZzApIHtcbiAgICAgICAgICAgIHZhciBuID0gUC5sZW5ndGg7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBwID0gUFtpXTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHAubGVuZ3RoOyArK2opIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBqID0gcFtqXSwgdnYgPSBuZXcgVmlzaWJpbGl0eVZlcnRleCh0aGlzLlYubGVuZ3RoLCBpLCBqLCBwaik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuVi5wdXNoKHZ2KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGogPiAwKVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5FLnB1c2gobmV3IFZpc2liaWxpdHlFZGdlKHBbaiAtIDFdLnZ2LCB2dikpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocC5sZW5ndGggPiAxKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLkUucHVzaChuZXcgVmlzaWJpbGl0eUVkZ2UocFswXS52diwgcFtwLmxlbmd0aCAtIDFdLnZ2KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG4gLSAxOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgUGkgPSBQW2ldO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSBpICsgMTsgaiA8IG47IGorKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgUGogPSBQW2pdLCB0ID0gdGFuZ2VudHMoUGksIFBqKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgcSBpbiB0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYyA9IHRbcV0sIHNvdXJjZSA9IFBpW2MudDFdLCB0YXJnZXQgPSBQaltjLnQyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRWRnZUlmVmlzaWJsZShzb3VyY2UsIHRhcmdldCwgaSwgaik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLlYgPSBnMC5WLnNsaWNlKDApO1xuICAgICAgICAgICAgdGhpcy5FID0gZzAuRS5zbGljZSgwKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBUYW5nZW50VmlzaWJpbGl0eUdyYXBoLnByb3RvdHlwZS5hZGRFZGdlSWZWaXNpYmxlID0gZnVuY3Rpb24gKHUsIHYsIGkxLCBpMikge1xuICAgICAgICBpZiAoIXRoaXMuaW50ZXJzZWN0c1BvbHlzKG5ldyBMaW5lU2VnbWVudCh1LngsIHUueSwgdi54LCB2LnkpLCBpMSwgaTIpKSB7XG4gICAgICAgICAgICB0aGlzLkUucHVzaChuZXcgVmlzaWJpbGl0eUVkZ2UodS52diwgdi52dikpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBUYW5nZW50VmlzaWJpbGl0eUdyYXBoLnByb3RvdHlwZS5hZGRQb2ludCA9IGZ1bmN0aW9uIChwLCBpMSkge1xuICAgICAgICB2YXIgbiA9IHRoaXMuUC5sZW5ndGg7XG4gICAgICAgIHRoaXMuVi5wdXNoKG5ldyBWaXNpYmlsaXR5VmVydGV4KHRoaXMuVi5sZW5ndGgsIG4sIDAsIHApKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgIGlmIChpID09PSBpMSlcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIHZhciBwb2x5ID0gdGhpcy5QW2ldLCB0ID0gdGFuZ2VudF9Qb2ludFBvbHlDKHAsIHBvbHkpO1xuICAgICAgICAgICAgdGhpcy5hZGRFZGdlSWZWaXNpYmxlKHAsIHBvbHlbdC5sdGFuXSwgaTEsIGkpO1xuICAgICAgICAgICAgdGhpcy5hZGRFZGdlSWZWaXNpYmxlKHAsIHBvbHlbdC5ydGFuXSwgaTEsIGkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwLnZ2O1xuICAgIH07XG4gICAgVGFuZ2VudFZpc2liaWxpdHlHcmFwaC5wcm90b3R5cGUuaW50ZXJzZWN0c1BvbHlzID0gZnVuY3Rpb24gKGwsIGkxLCBpMikge1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbiA9IHRoaXMuUC5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgIGlmIChpICE9IGkxICYmIGkgIT0gaTIgJiYgaW50ZXJzZWN0cyhsLCB0aGlzLlBbaV0pLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcbiAgICByZXR1cm4gVGFuZ2VudFZpc2liaWxpdHlHcmFwaDtcbn0oKSk7XG5leHBvcnRzLlRhbmdlbnRWaXNpYmlsaXR5R3JhcGggPSBUYW5nZW50VmlzaWJpbGl0eUdyYXBoO1xuZnVuY3Rpb24gaW50ZXJzZWN0cyhsLCBQKSB7XG4gICAgdmFyIGludHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMSwgbiA9IFAubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgIHZhciBpbnQgPSByZWN0YW5nbGVfMS5SZWN0YW5nbGUubGluZUludGVyc2VjdGlvbihsLngxLCBsLnkxLCBsLngyLCBsLnkyLCBQW2kgLSAxXS54LCBQW2kgLSAxXS55LCBQW2ldLngsIFBbaV0ueSk7XG4gICAgICAgIGlmIChpbnQpXG4gICAgICAgICAgICBpbnRzLnB1c2goaW50KTtcbiAgICB9XG4gICAgcmV0dXJuIGludHM7XG59XG5mdW5jdGlvbiB0YW5nZW50cyhWLCBXKSB7XG4gICAgdmFyIG0gPSBWLmxlbmd0aCAtIDEsIG4gPSBXLmxlbmd0aCAtIDE7XG4gICAgdmFyIGJ0ID0gbmV3IEJpVGFuZ2VudHMoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8PSBtOyArK2kpIHtcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPD0gbjsgKytqKSB7XG4gICAgICAgICAgICB2YXIgdjEgPSBWW2kgPT0gMCA/IG0gOiBpIC0gMV07XG4gICAgICAgICAgICB2YXIgdjIgPSBWW2ldO1xuICAgICAgICAgICAgdmFyIHYzID0gVltpID09IG0gPyAwIDogaSArIDFdO1xuICAgICAgICAgICAgdmFyIHcxID0gV1tqID09IDAgPyBuIDogaiAtIDFdO1xuICAgICAgICAgICAgdmFyIHcyID0gV1tqXTtcbiAgICAgICAgICAgIHZhciB3MyA9IFdbaiA9PSBuID8gMCA6IGogKyAxXTtcbiAgICAgICAgICAgIHZhciB2MXYydzIgPSBpc0xlZnQodjEsIHYyLCB3Mik7XG4gICAgICAgICAgICB2YXIgdjJ3MXcyID0gaXNMZWZ0KHYyLCB3MSwgdzIpO1xuICAgICAgICAgICAgdmFyIHYydzJ3MyA9IGlzTGVmdCh2MiwgdzIsIHczKTtcbiAgICAgICAgICAgIHZhciB3MXcydjIgPSBpc0xlZnQodzEsIHcyLCB2Mik7XG4gICAgICAgICAgICB2YXIgdzJ2MXYyID0gaXNMZWZ0KHcyLCB2MSwgdjIpO1xuICAgICAgICAgICAgdmFyIHcydjJ2MyA9IGlzTGVmdCh3MiwgdjIsIHYzKTtcbiAgICAgICAgICAgIGlmICh2MXYydzIgPj0gMCAmJiB2MncxdzIgPj0gMCAmJiB2MncydzMgPCAwXG4gICAgICAgICAgICAgICAgJiYgdzF3MnYyID49IDAgJiYgdzJ2MXYyID49IDAgJiYgdzJ2MnYzIDwgMCkge1xuICAgICAgICAgICAgICAgIGJ0LmxsID0gbmV3IEJpVGFuZ2VudChpLCBqKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHYxdjJ3MiA8PSAwICYmIHYydzF3MiA8PSAwICYmIHYydzJ3MyA+IDBcbiAgICAgICAgICAgICAgICAmJiB3MXcydjIgPD0gMCAmJiB3MnYxdjIgPD0gMCAmJiB3MnYydjMgPiAwKSB7XG4gICAgICAgICAgICAgICAgYnQucnIgPSBuZXcgQmlUYW5nZW50KGksIGopO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodjF2MncyIDw9IDAgJiYgdjJ3MXcyID4gMCAmJiB2MncydzMgPD0gMFxuICAgICAgICAgICAgICAgICYmIHcxdzJ2MiA+PSAwICYmIHcydjF2MiA8IDAgJiYgdzJ2MnYzID49IDApIHtcbiAgICAgICAgICAgICAgICBidC5ybCA9IG5ldyBCaVRhbmdlbnQoaSwgaik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh2MXYydzIgPj0gMCAmJiB2MncxdzIgPCAwICYmIHYydzJ3MyA+PSAwXG4gICAgICAgICAgICAgICAgJiYgdzF3MnYyIDw9IDAgJiYgdzJ2MXYyID4gMCAmJiB3MnYydjMgPD0gMCkge1xuICAgICAgICAgICAgICAgIGJ0LmxyID0gbmV3IEJpVGFuZ2VudChpLCBqKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYnQ7XG59XG5leHBvcnRzLnRhbmdlbnRzID0gdGFuZ2VudHM7XG5mdW5jdGlvbiBpc1BvaW50SW5zaWRlUG9seShwLCBwb2x5KSB7XG4gICAgZm9yICh2YXIgaSA9IDEsIG4gPSBwb2x5Lmxlbmd0aDsgaSA8IG47ICsraSlcbiAgICAgICAgaWYgKGJlbG93KHBvbHlbaSAtIDFdLCBwb2x5W2ldLCBwKSlcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gdHJ1ZTtcbn1cbmZ1bmN0aW9uIGlzQW55UEluUShwLCBxKSB7XG4gICAgcmV0dXJuICFwLmV2ZXJ5KGZ1bmN0aW9uICh2KSB7IHJldHVybiAhaXNQb2ludEluc2lkZVBvbHkodiwgcSk7IH0pO1xufVxuZnVuY3Rpb24gcG9seXNPdmVybGFwKHAsIHEpIHtcbiAgICBpZiAoaXNBbnlQSW5RKHAsIHEpKVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICBpZiAoaXNBbnlQSW5RKHEsIHApKVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICBmb3IgKHZhciBpID0gMSwgbiA9IHAubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgIHZhciB2ID0gcFtpXSwgdSA9IHBbaSAtIDFdO1xuICAgICAgICBpZiAoaW50ZXJzZWN0cyhuZXcgTGluZVNlZ21lbnQodS54LCB1LnksIHYueCwgdi55KSwgcSkubGVuZ3RoID4gMClcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5leHBvcnRzLnBvbHlzT3ZlcmxhcCA9IHBvbHlzT3ZlcmxhcDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSm1hV3hsSWpvaVoyVnZiUzVxY3lJc0luTnZkWEpqWlZKdmIzUWlPaUlpTENKemIzVnlZMlZ6SWpwYklpNHVMeTR1TDFkbFlrTnZiR0V2YzNKakwyZGxiMjB1ZEhNaVhTd2libUZ0WlhNaU9sdGRMQ0p0WVhCd2FXNW5jeUk2SWpzN096czdPenM3T3pzN096czdPMEZCUVVFc2VVTkJRWEZETzBGQlEycERPMGxCUVVFN1NVRkhRU3hEUVVGRE8wbEJRVVFzV1VGQlF6dEJRVUZFTEVOQlFVTXNRVUZJUkN4SlFVZERPMEZCU0Zrc2MwSkJRVXM3UVVGTGJFSTdTVUZEU1N4eFFrRkJiVUlzUlVGQlZTeEZRVUZUTEVWQlFWVXNSVUZCVXl4RlFVRlZMRVZCUVZNc1JVRkJWVHRSUVVGdVJTeFBRVUZGTEVkQlFVWXNSVUZCUlN4RFFVRlJPMUZCUVZNc1QwRkJSU3hIUVVGR0xFVkJRVVVzUTBGQlVUdFJRVUZUTEU5QlFVVXNSMEZCUml4RlFVRkZMRU5CUVZFN1VVRkJVeXhQUVVGRkxFZEJRVVlzUlVGQlJTeERRVUZSTzBsQlFVa3NRMEZCUXp0SlFVTXZSaXhyUWtGQlF6dEJRVUZFTEVOQlFVTXNRVUZHUkN4SlFVVkRPMEZCUmxrc2EwTkJRVmM3UVVGSmVFSTdTVUZCSzBJc05rSkJRVXM3U1VGQmNFTTdPMGxCUlVFc1EwRkJRenRKUVVGRUxHZENRVUZETzBGQlFVUXNRMEZCUXl4QlFVWkVMRU5CUVN0Q0xFdEJRVXNzUjBGRmJrTTdRVUZHV1N3NFFrRkJVenRCUVZWMFFpeFRRVUZuUWl4TlFVRk5MRU5CUVVNc1JVRkJVeXhGUVVGRkxFVkJRVk1zUlVGQlJTeEZRVUZUTzBsQlEyeEVMRTlCUVU4c1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eEhRVUZITEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVkQlFVY3NSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNSMEZCUnl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4SFFVRkhMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dEJRVU42UlN4RFFVRkRPMEZCUmtRc2QwSkJSVU03UVVGRlJDeFRRVUZUTEV0QlFVc3NRMEZCUXl4RFFVRlJMRVZCUVVVc1JVRkJVeXhGUVVGRkxFVkJRVk03U1VGRGVrTXNUMEZCVHl4TlFVRk5MRU5CUVVNc1EwRkJReXhGUVVGRkxFVkJRVVVzUlVGQlJTeEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1FVRkRha01zUTBGQlF6dEJRVVZFTEZOQlFWTXNTMEZCU3l4RFFVRkRMRU5CUVZFc1JVRkJSU3hGUVVGVExFVkJRVVVzUlVGQlV6dEpRVU42UXl4UFFVRlBMRTFCUVUwc1EwRkJReXhEUVVGRExFVkJRVVVzUlVGQlJTeEZRVUZGTEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRCUVVOcVF5eERRVUZETzBGQlUwUXNVMEZCWjBJc1ZVRkJWU3hEUVVGRExFTkJRVlU3U1VGRGFrTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1ZVRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEpRVUZMTEU5QlFVRXNRMEZCUXl4RFFVRkRMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCYmtNc1EwRkJiVU1zUTBGQlF5eERRVUZETzBsQlEzWkZMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eE5RVUZOTEVWQlFVVXNRMEZCUXl4RFFVRkRPMGxCUTNCQ0xFbEJRVWtzVFVGQlRTeEhRVUZITEVOQlFVTXNRMEZCUXp0SlFVTm1MRWxCUVVrc1NVRkJTU3hIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRiRUlzUzBGQlN5eERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUlVGQlJTeERRVUZETEVWQlFVVTdVVUZEY0VJc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4TFFVRkxMRWxCUVVrN1dVRkJSU3hOUVVGTk8wdEJRemxDTzBsQlEwUXNTVUZCU1N4TlFVRk5MRWRCUVVjc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dEpRVU51UWl4SlFVRkpMRU5CUVVNc1IwRkJXU3hGUVVGRkxFTkJRVU03U1VGRGNFSXNRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXp0SlFVTnNRaXhKUVVGSkxFMUJRVTBzUzBGQlN5eERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZPMUZCUTJ4Q0xFbEJRVWtzUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTXpRaXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRE8wdEJRM3BDTzFOQlFVMDdVVUZGU0N4SlFVRkpMRTFCUVUwc1JVRkJSU3hOUVVGTkxFZEJRVWNzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0UlFVTXpRaXhKUVVGSkxFbEJRVWtzUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU4wUWl4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNTVUZCU1N4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRk8xbEJRM1pDTEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUzBGQlN5eEpRVUZKTzJkQ1FVRkZMRTFCUVUwN1VVRkRMMElzVFVGQlRTeEhRVUZITEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1VVRkhaaXhEUVVGRExFZEJRVWNzVFVGQlRTeERRVUZETzFGQlExZ3NUMEZCVHl4RlFVRkZMRU5CUVVNc1NVRkJTU3hOUVVGTkxFVkJRVVU3V1VGRmJFSXNTVUZCU1N4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhIUVVGSExFMUJRVTA3WjBKQlEzSkVMRk5CUVZNN1dVRkZZaXhQUVVGUExFTkJRVU1zUTBGQlF5eE5RVUZOTEVkQlFVY3NRMEZCUXl4RlFVTnVRanRuUWtGRlNTeEpRVUZKTEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFMUJRVTBzUjBGQlJ5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFMUJRVTBzUjBGQlJ5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETzI5Q1FVTnNSQ3hOUVVGTk96dHZRa0ZGVGl4RFFVRkRMRU5CUVVNc1RVRkJUU3hKUVVGSkxFTkJRVU1zUTBGQlF6dGhRVU55UWp0WlFVTkVMRWxCUVVrc1EwRkJReXhKUVVGSkxFMUJRVTA3WjBKQlFVVXNRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0VFFVTnFRenRSUVVkRUxFbEJRVWtzVFVGQlRTeEpRVUZKTEUxQlFVMDdXVUZEYUVJc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOMFFpeEpRVUZKTEVkQlFVY3NSMEZCUnl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRE8xRkJRMjVDTEVOQlFVTXNSMEZCUnl4TlFVRk5MRU5CUVVNN1VVRkRXQ3hQUVVGUExFVkJRVVVzUTBGQlF5eEpRVUZKTEUxQlFVMHNSVUZCUlR0WlFVVnNRaXhKUVVGSkxFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEVkQlFVY3NUVUZCVFR0blFrRkRja1FzVTBGQlV6dFpRVVZpTEU5QlFVOHNRMEZCUXl4RFFVRkRMRTFCUVUwc1IwRkJSeXhIUVVGSExFVkJRM0pDTzJkQ1FVVkpMRWxCUVVrc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNUVUZCVFN4SFFVRkhMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNUVUZCVFN4SFFVRkhMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNN2IwSkJRMnhFTEUxQlFVMDdPMjlDUVVWT0xFTkJRVU1zUTBGQlF5eE5RVUZOTEVsQlFVa3NRMEZCUXl4RFFVRkRPMkZCUTNKQ08xbEJRMFFzU1VGQlNTeERRVUZETEVsQlFVa3NUVUZCVFR0blFrRkJSU3hEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xTkJRMnBETzB0QlEwbzdTVUZEUkN4UFFVRlBMRU5CUVVNc1EwRkJRenRCUVVOaUxFTkJRVU03UVVFNVJFUXNaME5CT0VSRE8wRkJSMFFzVTBGQlowSXNiMEpCUVc5Q0xFTkJRVU1zUTBGQlVTeEZRVUZGTEVOQlFWVXNSVUZCUlN4RFFVRnhRanRKUVVNMVJTeERRVUZETEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGRFdDeFZRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRWxCUVVzc1QwRkJRU3hKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCYmtVc1EwRkJiVVVzUTBGRE5VVXNRMEZCUXl4UFFVRlBMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03UVVGRGNrSXNRMEZCUXp0QlFVcEVMRzlFUVVsRE8wRkJSVVFzVTBGQlV5eGhRVUZoTEVOQlFVTXNRMEZCV1N4RlFVRkZMRVZCUVdVN1NVRkRhRVFzU1VGQlNTeERRVUZETEVOQlFVTXNVMEZCVXl4TFFVRkxMRVZCUVVVc1EwRkJReXhOUVVGTkxFZEJRVWNzUTBGQlF6dFJRVUZGTEU5QlFVOHNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJRMmhFTEU5QlFVOHNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhUUVVGVExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTTdRVUZETDBJc1EwRkJRenRCUVVWRUxGTkJRVk1zWVVGQllTeERRVUZETEVOQlFWa3NSVUZCUlN4RlFVRmxPMGxCUTJoRUxFbEJRVWtzUTBGQlF5eERRVUZETEZOQlFWTXNTMEZCU3l4RFFVRkRPMUZCUVVVc1QwRkJUeXhGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETEUxQlFVMHNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVOb1JDeFBRVUZQTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1UwRkJVeXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETzBGQlF5OUNMRU5CUVVNN1FVRlJSQ3hUUVVGVExHdENRVUZyUWl4RFFVRkRMRU5CUVZFc1JVRkJSU3hEUVVGVk8wbEJSelZETEVsQlFVa3NUMEZCVHl4SFFVRkhMRU5CUVVNc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdTVUZEZWtJc1QwRkJUeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVWdVFpeFBRVUZQTEVWQlFVVXNTVUZCU1N4RlFVRkZMRzFDUVVGdFFpeERRVUZETEVOQlFVTXNSVUZCUlN4UFFVRlBMRU5CUVVNc1JVRkJSU3hKUVVGSkxFVkJRVVVzYlVKQlFXMUNMRU5CUVVNc1EwRkJReXhGUVVGRkxFOUJRVThzUTBGQlF5eEZRVUZGTEVOQlFVTTdRVUZETlVZc1EwRkJRenRCUVZORUxGTkJRVk1zYlVKQlFXMUNMRU5CUVVNc1EwRkJVU3hGUVVGRkxFTkJRVlU3U1VGRE4wTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFMUJRVTBzUjBGQlJ5eERRVUZETEVOQlFVTTdTVUZIY2tJc1NVRkJTU3hEUVVGVExFVkJRVVVzUTBGQlV5eEZRVUZGTEVOQlFWTXNRMEZCUXp0SlFVTndReXhKUVVGSkxFZEJRVmtzUlVGQlJTeEhRVUZaTEVOQlFVTTdTVUZKTDBJc1NVRkJTU3hMUVVGTExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEYWtRc1QwRkJUeXhEUVVGRExFTkJRVU03U1VGRllpeExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlN6dFJRVU5zUWl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFdEJRVXNzUTBGQlF6dFpRVU5ZTEVsQlFVa3NTMEZCU3l4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8yZENRVU53UWl4UFFVRlBMRU5CUVVNc1EwRkJRenM3WjBKQlJWUXNUMEZCVHl4RFFVRkRMRU5CUVVNN1VVRkZha0lzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkROVUlzUjBGQlJ5eEhRVUZITEV0QlFVc3NRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU12UWl4SlFVRkpMRWRCUVVjc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRhRU1zVDBGQlR5eERRVUZETEVOQlFVTTdVVUZKWWl4SFFVRkhMRWRCUVVjc1MwRkJTeXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUXk5Q0xFbEJRVWtzUjBGQlJ5eEZRVUZGTzFsQlEwd3NTVUZCU1N4SFFVRkhPMmRDUVVOSUxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdhVUpCUTB3N1owSkJRMFFzU1VGQlNTeExRVUZMTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN2IwSkJRM0JDTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN08yOUNRVVZPTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1lVRkRZanRUUVVOS08yRkJRMGs3V1VGRFJDeEpRVUZKTEVOQlFVTXNSMEZCUnp0blFrRkRTaXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETzJsQ1FVTk1PMmRDUVVORUxFbEJRVWtzUzBGQlN5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMjlDUVVOd1FpeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPenR2UWtGRlRpeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMkZCUTJJN1UwRkRTanRMUVVOS08wRkJRMHdzUTBGQlF6dEJRVkZFTEZOQlFWTXNiVUpCUVcxQ0xFTkJRVU1zUTBGQlVTeEZRVUZGTEVOQlFWVTdTVUZETjBNc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEUxQlFVMHNSMEZCUnl4RFFVRkRMRU5CUVVNN1NVRkZja0lzU1VGQlNTeERRVUZUTEVWQlFVVXNRMEZCVXl4RlFVRkZMRU5CUVZNc1EwRkJRenRKUVVOd1F5eEpRVUZKTEVkQlFWa3NSVUZCUlN4SFFVRlpMRU5CUVVNN1NVRkpMMElzU1VGQlNTeExRVUZMTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRha1FzVDBGQlR5eERRVUZETEVOQlFVTTdTVUZGWWl4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU3p0UlFVTnNRaXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEV0QlFVc3NRMEZCUXp0WlFVTllMRWxCUVVrc1MwRkJTeXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzJkQ1FVTndRaXhQUVVGUExFTkJRVU1zUTBGQlF6czdaMEpCUlZRc1QwRkJUeXhEUVVGRExFTkJRVU03VVVGRmFrSXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRE5VSXNSMEZCUnl4SFFVRkhMRXRCUVVzc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTXZRaXhKUVVGSkxFdEJRVXNzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFZEJRVWM3V1VGRGFFTXNUMEZCVHl4RFFVRkRMRU5CUVVNN1VVRkpZaXhIUVVGSExFZEJRVWNzUzBGQlN5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJReTlDTEVsQlFVa3NSMEZCUnl4RlFVRkZPMWxCUTB3c1NVRkJTU3hEUVVGRExFZEJRVWM3WjBKQlEwb3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRwUWtGRFREdG5Ra0ZEUkN4SlFVRkpMRXRCUVVzc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dHZRa0ZEY0VJc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6czdiMEpCUlU0c1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dGhRVU5pTzFOQlEwbzdZVUZEU1R0WlFVTkVMRWxCUVVrc1IwRkJSenRuUWtGRFNDeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMmxDUVVOTU8yZENRVU5FTEVsQlFVa3NTMEZCU3l4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8yOUNRVU53UWl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE96dHZRa0ZGVGl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE8yRkJRMkk3VTBGRFNqdExRVU5LTzBGQlEwd3NRMEZCUXp0QlFWTkVMRk5CUVdkQ0xHbENRVUZwUWl4RFFVRkRMRU5CUVZVc1JVRkJSU3hEUVVGVkxFVkJRVVVzUlVGQmIwTXNSVUZCUlN4RlFVRnZReXhGUVVGRkxFbEJRU3RETEVWQlFVVXNTVUZCSzBNN1NVRkRiRThzU1VGQlNTeEhRVUZYTEVWQlFVVXNSMEZCVnl4RFFVRkRPMGxCUnpkQ0xFZEJRVWNzUjBGQlJ5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzBsQlEyeENMRWRCUVVjc1IwRkJSeXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJSM0JDTEVsQlFVa3NTVUZCU1N4SFFVRkhMRXRCUVVzc1EwRkJRenRKUVVOcVFpeFBRVUZQTEVOQlFVTXNTVUZCU1N4RlFVRkZPMUZCUTFZc1NVRkJTU3hIUVVGSExFbEJRVWtzUTBGQlF6dFJRVU5hTEU5QlFVOHNTVUZCU1N4RlFVRkZPMWxCUTFRc1NVRkJTU3hIUVVGSExFdEJRVXNzUTBGQlF5eERRVUZETEUxQlFVMHNSMEZCUnl4RFFVRkRPMmRDUVVGRkxFZEJRVWNzUjBGQlJ5eERRVUZETEVOQlFVTTdXVUZEYkVNc1NVRkJTU3hKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNSMEZCUnl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRE8yZENRVUZGTEUxQlFVMDdXVUZETlVNc1JVRkJSU3hIUVVGSExFTkJRVU03VTBGRFZEdFJRVU5FTEU5QlFVOHNTVUZCU1N4RlFVRkZPMWxCUTFRc1NVRkJTU3hIUVVGSExFdEJRVXNzUTBGQlF6dG5Ra0ZCUlN4SFFVRkhMRWRCUVVjc1EwRkJReXhEUVVGRExFMUJRVTBzUjBGQlJ5eERRVUZETEVOQlFVTTdXVUZEYkVNc1NVRkJTU3hKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNSMEZCUnl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRE8yZENRVUZGTEUxQlFVMDdXVUZETlVNc1JVRkJSU3hIUVVGSExFTkJRVU03V1VGRFRpeEpRVUZKTEVkQlFVY3NTMEZCU3l4RFFVRkRPMU5CUTJoQ08wdEJRMG83U1VGRFJDeFBRVUZQTEVWQlFVVXNSVUZCUlN4RlFVRkZMRWRCUVVjc1JVRkJSU3hGUVVGRkxFVkJRVVVzUjBGQlJ5eEZRVUZGTEVOQlFVTTdRVUZEYUVNc1EwRkJRenRCUVhoQ1JDdzRRMEYzUWtNN1FVRkZSQ3hUUVVGblFpeHRRa0ZCYlVJc1EwRkJReXhEUVVGVkxFVkJRVVVzUTBGQlZUdEpRVU4wUkN4SlFVRkpMRVZCUVVVc1IwRkJSeXh0UWtGQmJVSXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03U1VGRGJrTXNUMEZCVHl4RlFVRkZMRVZCUVVVc1JVRkJSU3hGUVVGRkxFTkJRVU1zUlVGQlJTeEZRVUZGTEVWQlFVVXNSVUZCUlN4RlFVRkZMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU03UVVGRGNFTXNRMEZCUXp0QlFVaEVMR3RFUVVkRE8wRkJSVVFzVTBGQlowSXNiVUpCUVcxQ0xFTkJRVU1zUTBGQlZTeEZRVUZGTEVOQlFWVTdTVUZEZEVRc1QwRkJUeXhwUWtGQmFVSXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxHMUNRVUZ0UWl4RlFVRkZMRzFDUVVGdFFpeEZRVUZGTEV0QlFVc3NSVUZCUlN4TFFVRkxMRU5CUVVNc1EwRkJRenRCUVVNelJpeERRVUZETzBGQlJrUXNhMFJCUlVNN1FVRkZSQ3hUUVVGblFpeHRRa0ZCYlVJc1EwRkJReXhEUVVGVkxFVkJRVVVzUTBGQlZUdEpRVU4wUkN4UFFVRlBMR2xDUVVGcFFpeERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVc2JVSkJRVzFDTEVWQlFVVXNiVUpCUVcxQ0xFVkJRVVVzUzBGQlN5eEZRVUZGTEV0QlFVc3NRMEZCUXl4RFFVRkRPMEZCUXpOR0xFTkJRVU03UVVGR1JDeHJSRUZGUXp0QlFVVkVMRk5CUVdkQ0xHMUNRVUZ0UWl4RFFVRkRMRU5CUVZVc1JVRkJSU3hEUVVGVk8wbEJRM1JFTEU5QlFVOHNhVUpCUVdsQ0xFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4dFFrRkJiVUlzUlVGQlJTeHRRa0ZCYlVJc1JVRkJSU3hMUVVGTExFVkJRVVVzUzBGQlN5eERRVUZETEVOQlFVTTdRVUZETTBZc1EwRkJRenRCUVVaRUxHdEVRVVZETzBGQlJVUTdTVUZEU1N4dFFrRkJiVUlzUlVGQlZTeEZRVUZUTEVWQlFWVTdVVUZCTjBJc1QwRkJSU3hIUVVGR0xFVkJRVVVzUTBGQlVUdFJRVUZUTEU5QlFVVXNSMEZCUml4RlFVRkZMRU5CUVZFN1NVRkJTU3hEUVVGRE8wbEJRM3BFTEdkQ1FVRkRPMEZCUVVRc1EwRkJReXhCUVVaRUxFbEJSVU03UVVGR1dTdzRRa0ZCVXp0QlFVbDBRanRKUVVGQk8wbEJTMEVzUTBGQlF6dEpRVUZFTEdsQ1FVRkRPMEZCUVVRc1EwRkJReXhCUVV4RUxFbEJTME03UVVGTVdTeG5RMEZCVlR0QlFVOTJRanRKUVVFNFFpdzBRa0ZCU3p0SlFVRnVRenM3U1VGRlFTeERRVUZETzBsQlFVUXNaVUZCUXp0QlFVRkVMRU5CUVVNc1FVRkdSQ3hEUVVFNFFpeExRVUZMTEVkQlJXeERPMEZCUmxrc05FSkJRVkU3UVVGSmNrSTdTVUZEU1N3d1FrRkRWeXhGUVVGVkxFVkJRMVlzVFVGQll5eEZRVU5rTEZWQlFXdENMRVZCUTJ4Q0xFTkJRVmM3VVVGSVdDeFBRVUZGTEVkQlFVWXNSVUZCUlN4RFFVRlJPMUZCUTFZc1YwRkJUU3hIUVVGT0xFMUJRVTBzUTBGQlVUdFJRVU5rTEdWQlFWVXNSMEZCVml4VlFVRlZMRU5CUVZFN1VVRkRiRUlzVFVGQlF5eEhRVUZFTEVOQlFVTXNRMEZCVlR0UlFVVnNRaXhEUVVGRExFTkJRVU1zUlVGQlJTeEhRVUZITEVsQlFVa3NRMEZCUXp0SlFVTm9RaXhEUVVGRE8wbEJRMHdzZFVKQlFVTTdRVUZCUkN4RFFVRkRMRUZCVkVRc1NVRlRRenRCUVZSWkxEUkRRVUZuUWp0QlFWYzNRanRKUVVOSkxIZENRVU5YTEUxQlFYZENMRVZCUTNoQ0xFMUJRWGRDTzFGQlJIaENMRmRCUVUwc1IwRkJUaXhOUVVGTkxFTkJRV3RDTzFGQlEzaENMRmRCUVUwc1IwRkJUaXhOUVVGTkxFTkJRV3RDTzBsQlFVa3NRMEZCUXp0SlFVTjRReXdyUWtGQlRTeEhRVUZPTzFGQlEwa3NTVUZCU1N4RlFVRkZMRWRCUVVjc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTXpReXhKUVVGSkxFVkJRVVVzUjBGQlJ5eEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRek5ETEU5QlFVOHNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhGUVVGRkxFZEJRVWNzUlVGQlJTeEhRVUZITEVWQlFVVXNSMEZCUnl4RlFVRkZMRU5CUVVNc1EwRkJRenRKUVVONFF5eERRVUZETzBsQlEwd3NjVUpCUVVNN1FVRkJSQ3hEUVVGRExFRkJWRVFzU1VGVFF6dEJRVlJaTEhkRFFVRmpPMEZCVnpOQ08wbEJSMGtzWjBOQlFXMUNMRU5CUVdVc1JVRkJSU3hGUVVGdFJEdFJRVUZ3UlN4TlFVRkRMRWRCUVVRc1EwRkJReXhEUVVGak8xRkJSbXhETEUxQlFVTXNSMEZCZFVJc1JVRkJSU3hEUVVGRE8xRkJRek5DTEUxQlFVTXNSMEZCY1VJc1JVRkJSU3hEUVVGRE8xRkJSWEpDTEVsQlFVa3NRMEZCUXl4RlFVRkZMRVZCUVVVN1dVRkRUQ3hKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRPMWxCUldwQ0xFdEJRVXNzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVWQlFVVTdaMEpCUTNoQ0xFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRuUWtGRllpeExRVUZMTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEUxQlFVMHNSVUZCUlN4RlFVRkZMRU5CUVVNc1JVRkJSVHR2UWtGREwwSXNTVUZCU1N4RlFVRkZMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVU5VTEVWQlFVVXNSMEZCUnl4SlFVRkpMR2RDUVVGblFpeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNSVUZCUlN4RFFVRkRMRU5CUVVNN2IwSkJRM1pFTEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETzI5Q1FVbG9RaXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETzNkQ1FVRkZMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NZMEZCWXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03YVVKQlF5OUVPMmRDUVVWRUxFbEJRVWtzUTBGQlF5eERRVUZETEUxQlFVMHNSMEZCUnl4RFFVRkRPMjlDUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1kwRkJZeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dGhRVU5zUmp0WlFVTkVMRXRCUVVzc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeEZRVUZGTzJkQ1FVTTFRaXhKUVVGSkxFVkJRVVVzUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1owSkJRMlFzUzBGQlN5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRVZCUVVVN2IwSkJRelZDTEVsQlFVa3NSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGRFZDeERRVUZETEVkQlFVY3NVVUZCVVN4RFFVRkRMRVZCUVVVc1JVRkJSU3hGUVVGRkxFTkJRVU1zUTBGQlF6dHZRa0ZEZWtJc1MwRkJTeXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEVWQlFVVTdkMEpCUTJJc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVTlNMRTFCUVUwc1IwRkJSeXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRTFCUVUwc1IwRkJSeXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRPM2RDUVVONlF5eEpRVUZKTEVOQlFVTXNaMEpCUVdkQ0xFTkJRVU1zVFVGQlRTeEZRVUZGTEUxQlFVMHNSVUZCUlN4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03Y1VKQlF5OURPMmxDUVVOS08yRkJRMG83VTBGRFNqdGhRVUZOTzFsQlEwZ3NTVUZCU1N4RFFVRkRMRU5CUVVNc1IwRkJSeXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVOMlFpeEpRVUZKTEVOQlFVTXNRMEZCUXl4SFFVRkhMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMU5CUXpGQ08wbEJRMHdzUTBGQlF6dEpRVU5FTEdsRVFVRm5RaXhIUVVGb1FpeFZRVUZwUWl4RFFVRlhMRVZCUVVVc1EwRkJWeXhGUVVGRkxFVkJRVlVzUlVGQlJTeEZRVUZWTzFGQlF6ZEVMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zWlVGQlpTeERRVUZETEVsQlFVa3NWMEZCVnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZMRVZCUVVVc1JVRkJSU3hEUVVGRExFVkJRVVU3V1VGRGNFVXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeGpRVUZqTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0VFFVTXZRenRKUVVOTUxFTkJRVU03U1VGRFJDeDVRMEZCVVN4SFFVRlNMRlZCUVZNc1EwRkJWeXhGUVVGRkxFVkJRVlU3VVVGRE5VSXNTVUZCU1N4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTTdVVUZEZEVJc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4blFrRkJaMElzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRTFCUVUwc1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRNVVFzUzBGQlN5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeEZRVUZGTEVOQlFVTXNSVUZCUlR0WlFVTjRRaXhKUVVGSkxFTkJRVU1zUzBGQlN5eEZRVUZGTzJkQ1FVRkZMRk5CUVZNN1dVRkRka0lzU1VGQlNTeEpRVUZKTEVkQlFVY3NTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGRGFFSXNRMEZCUXl4SFFVRkhMR3RDUVVGclFpeERRVUZETEVOQlFVTXNSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJRenRaUVVOd1F5eEpRVUZKTEVOQlFVTXNaMEpCUVdkQ0xFTkJRVU1zUTBGQlF5eEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFVkJRVVVzUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUXpsRExFbEJRVWtzUTBGQlF5eG5Ra0ZCWjBJc1EwRkJReXhEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1JVRkJSU3hGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdVMEZEYWtRN1VVRkRSQ3hQUVVGUExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTTdTVUZEYUVJc1EwRkJRenRKUVVOUExHZEVRVUZsTEVkQlFYWkNMRlZCUVhkQ0xFTkJRV01zUlVGQlJTeEZRVUZWTEVWQlFVVXNSVUZCVlR0UlFVTXhSQ3hMUVVGTExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU1zUlVGQlJUdFpRVU16UXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hGUVVGRkxFbEJRVWtzUTBGQlF5eEpRVUZKTEVWQlFVVXNTVUZCU1N4VlFVRlZMRU5CUVVNc1EwRkJReXhGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhOUVVGTkxFZEJRVWNzUTBGQlF5eEZRVUZGTzJkQ1FVTXpSQ3hQUVVGUExFbEJRVWtzUTBGQlF6dGhRVU5tTzFOQlEwbzdVVUZEUkN4UFFVRlBMRXRCUVVzc1EwRkJRenRKUVVOcVFpeERRVUZETzBsQlEwd3NOa0pCUVVNN1FVRkJSQ3hEUVVGRExFRkJhRVZFTEVsQlowVkRPMEZCYUVWWkxIZEVRVUZ6UWp0QlFXdEZia01zVTBGQlV5eFZRVUZWTEVOQlFVTXNRMEZCWXl4RlFVRkZMRU5CUVZVN1NVRkRNVU1zU1VGQlNTeEpRVUZKTEVkQlFVY3NSVUZCUlN4RFFVRkRPMGxCUTJRc1MwRkJTeXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhOUVVGTkxFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNc1JVRkJSVHRSUVVOMFF5eEpRVUZKTEVkQlFVY3NSMEZCUnl4eFFrRkJVeXhEUVVGRExHZENRVUZuUWl4RFFVTm9ReXhEUVVGRExFTkJRVU1zUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RlFVRkZMRVZCUTFZc1EwRkJReXhEUVVGRExFVkJRVVVzUlVGQlJTeERRVUZETEVOQlFVTXNSVUZCUlN4RlFVTldMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVTjBRaXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlEySXNRMEZCUXp0UlFVTk9MRWxCUVVrc1IwRkJSenRaUVVGRkxFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1MwRkRNMEk3U1VGRFJDeFBRVUZQTEVsQlFVa3NRMEZCUXp0QlFVTm9RaXhEUVVGRE8wRkJSVVFzVTBGQlowSXNVVUZCVVN4RFFVRkRMRU5CUVZVc1JVRkJSU3hEUVVGVk8wbEJSVE5ETEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhOUVVGTkxFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1RVRkJUU3hIUVVGSExFTkJRVU1zUTBGQlF6dEpRVU4yUXl4SlFVRkpMRVZCUVVVc1IwRkJSeXhKUVVGSkxGVkJRVlVzUlVGQlJTeERRVUZETzBsQlF6RkNMRXRCUVVzc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNTVUZCU1N4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRExFVkJRVVU3VVVGRGVrSXNTMEZCU3l4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEpRVUZKTEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNc1JVRkJSVHRaUVVONlFpeEpRVUZKTEVWQlFVVXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTTdXVUZETDBJc1NVRkJTU3hGUVVGRkxFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTJRc1NVRkJTU3hGUVVGRkxFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJReTlDTEVsQlFVa3NSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTXZRaXhKUVVGSkxFVkJRVVVzUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRaQ3hKUVVGSkxFVkJRVVVzUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU03V1VGREwwSXNTVUZCU1N4TlFVRk5MRWRCUVVjc1RVRkJUU3hEUVVGRExFVkJRVVVzUlVGQlJTeEZRVUZGTEVWQlFVVXNSVUZCUlN4RFFVRkRMRU5CUVVNN1dVRkRhRU1zU1VGQlNTeE5RVUZOTEVkQlFVY3NUVUZCVFN4RFFVRkRMRVZCUVVVc1JVRkJSU3hGUVVGRkxFVkJRVVVzUlVGQlJTeERRVUZETEVOQlFVTTdXVUZEYUVNc1NVRkJTU3hOUVVGTkxFZEJRVWNzVFVGQlRTeERRVUZETEVWQlFVVXNSVUZCUlN4RlFVRkZMRVZCUVVVc1JVRkJSU3hEUVVGRExFTkJRVU03V1VGRGFFTXNTVUZCU1N4TlFVRk5MRWRCUVVjc1RVRkJUU3hEUVVGRExFVkJRVVVzUlVGQlJTeEZRVUZGTEVWQlFVVXNSVUZCUlN4RFFVRkRMRU5CUVVNN1dVRkRhRU1zU1VGQlNTeE5RVUZOTEVkQlFVY3NUVUZCVFN4RFFVRkRMRVZCUVVVc1JVRkJSU3hGUVVGRkxFVkJRVVVzUlVGQlJTeERRVUZETEVOQlFVTTdXVUZEYUVNc1NVRkJTU3hOUVVGTkxFZEJRVWNzVFVGQlRTeERRVUZETEVWQlFVVXNSVUZCUlN4RlFVRkZMRVZCUVVVc1JVRkJSU3hEUVVGRExFTkJRVU03V1VGRGFFTXNTVUZCU1N4TlFVRk5MRWxCUVVrc1EwRkJReXhKUVVGSkxFMUJRVTBzU1VGQlNTeERRVUZETEVsQlFVa3NUVUZCVFN4SFFVRkhMRU5CUVVNN2JVSkJRM0pETEUxQlFVMHNTVUZCU1N4RFFVRkRMRWxCUVVrc1RVRkJUU3hKUVVGSkxFTkJRVU1zU1VGQlNTeE5RVUZOTEVkQlFVY3NRMEZCUXl4RlFVRkZPMmRDUVVONlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4SFFVRkhMRWxCUVVrc1UwRkJVeXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0aFFVTnVRenRwUWtGQlRTeEpRVUZKTEUxQlFVMHNTVUZCU1N4RFFVRkRMRWxCUVVrc1RVRkJUU3hKUVVGSkxFTkJRVU1zU1VGQlNTeE5RVUZOTEVkQlFVY3NRMEZCUXp0dFFrRkROVU1zVFVGQlRTeEpRVUZKTEVOQlFVTXNTVUZCU1N4TlFVRk5MRWxCUVVrc1EwRkJReXhKUVVGSkxFMUJRVTBzUjBGQlJ5eERRVUZETEVWQlFVVTdaMEpCUTNwRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVkQlFVY3NTVUZCU1N4VFFVRlRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzJGQlEyNURPMmxDUVVGTkxFbEJRVWtzVFVGQlRTeEpRVUZKTEVOQlFVTXNTVUZCU1N4TlFVRk5MRWRCUVVjc1EwRkJReXhKUVVGSkxFMUJRVTBzU1VGQlNTeERRVUZETzIxQ1FVTTFReXhOUVVGTkxFbEJRVWtzUTBGQlF5eEpRVUZKTEUxQlFVMHNSMEZCUnl4RFFVRkRMRWxCUVVrc1RVRkJUU3hKUVVGSkxFTkJRVU1zUlVGQlJUdG5Ra0ZEZWtNc1JVRkJSU3hEUVVGRExFVkJRVVVzUjBGQlJ5eEpRVUZKTEZOQlFWTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03WVVGRGJrTTdhVUpCUVUwc1NVRkJTU3hOUVVGTkxFbEJRVWtzUTBGQlF5eEpRVUZKTEUxQlFVMHNSMEZCUnl4RFFVRkRMRWxCUVVrc1RVRkJUU3hKUVVGSkxFTkJRVU03YlVKQlF6VkRMRTFCUVUwc1NVRkJTU3hEUVVGRExFbEJRVWtzVFVGQlRTeEhRVUZITEVOQlFVTXNTVUZCU1N4TlFVRk5MRWxCUVVrc1EwRkJReXhGUVVGRk8yZENRVU42UXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hIUVVGSExFbEJRVWtzVTBGQlV5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJRenRoUVVOdVF6dFRRVU5LTzB0QlEwbzdTVUZEUkN4UFFVRlBMRVZCUVVVc1EwRkJRenRCUVVOa0xFTkJRVU03UVVGc1EwUXNORUpCYTBORE8wRkJSVVFzVTBGQlV5eHBRa0ZCYVVJc1EwRkJReXhEUVVGUkxFVkJRVVVzU1VGQllUdEpRVU01UXl4TFFVRkxMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRTFCUVUwc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXp0UlFVTjJReXhKUVVGSkxFdEJRVXNzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNN1dVRkJSU3hQUVVGUExFdEJRVXNzUTBGQlF6dEpRVU55UkN4UFFVRlBMRWxCUVVrc1EwRkJRenRCUVVOb1FpeERRVUZETzBGQlJVUXNVMEZCVXl4VFFVRlRMRU5CUVVNc1EwRkJWU3hGUVVGRkxFTkJRVlU3U1VGRGNrTXNUMEZCVHl4RFFVRkRMRU5CUVVNc1EwRkJReXhMUVVGTExFTkJRVU1zVlVGQlFTeERRVUZETEVsQlFVa3NUMEZCUVN4RFFVRkRMR2xDUVVGcFFpeERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1JVRkJlRUlzUTBGQmQwSXNRMEZCUXl4RFFVRkRPMEZCUTI1RUxFTkJRVU03UVVGRlJDeFRRVUZuUWl4WlFVRlpMRU5CUVVNc1EwRkJWU3hGUVVGRkxFTkJRVlU3U1VGREwwTXNTVUZCU1N4VFFVRlRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF6dFJRVUZGTEU5QlFVOHNTVUZCU1N4RFFVRkRPMGxCUTJwRExFbEJRVWtzVTBGQlV5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNN1VVRkJSU3hQUVVGUExFbEJRVWtzUTBGQlF6dEpRVU5xUXl4TFFVRkxMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRTFCUVUwc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RlFVRkZPMUZCUTNSRExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVNelFpeEpRVUZKTEZWQlFWVXNRMEZCUXl4SlFVRkpMRmRCUVZjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zVFVGQlRTeEhRVUZITEVOQlFVTTdXVUZCUlN4UFFVRlBMRWxCUVVrc1EwRkJRenRMUVVOc1JqdEpRVU5FTEU5QlFVOHNTMEZCU3l4RFFVRkRPMEZCUTJwQ0xFTkJRVU03UVVGU1JDeHZRMEZSUXlKOSIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHJlY3RhbmdsZV8xID0gcmVxdWlyZShcIi4vcmVjdGFuZ2xlXCIpO1xudmFyIHZwc2NfMSA9IHJlcXVpcmUoXCIuL3Zwc2NcIik7XG52YXIgc2hvcnRlc3RwYXRoc18xID0gcmVxdWlyZShcIi4vc2hvcnRlc3RwYXRoc1wiKTtcbnZhciBOb2RlV3JhcHBlciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTm9kZVdyYXBwZXIoaWQsIHJlY3QsIGNoaWxkcmVuKSB7XG4gICAgICAgIHRoaXMuaWQgPSBpZDtcbiAgICAgICAgdGhpcy5yZWN0ID0gcmVjdDtcbiAgICAgICAgdGhpcy5jaGlsZHJlbiA9IGNoaWxkcmVuO1xuICAgICAgICB0aGlzLmxlYWYgPSB0eXBlb2YgY2hpbGRyZW4gPT09ICd1bmRlZmluZWQnIHx8IGNoaWxkcmVuLmxlbmd0aCA9PT0gMDtcbiAgICB9XG4gICAgcmV0dXJuIE5vZGVXcmFwcGVyO1xufSgpKTtcbmV4cG9ydHMuTm9kZVdyYXBwZXIgPSBOb2RlV3JhcHBlcjtcbnZhciBWZXJ0ID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBWZXJ0KGlkLCB4LCB5LCBub2RlLCBsaW5lKSB7XG4gICAgICAgIGlmIChub2RlID09PSB2b2lkIDApIHsgbm9kZSA9IG51bGw7IH1cbiAgICAgICAgaWYgKGxpbmUgPT09IHZvaWQgMCkgeyBsaW5lID0gbnVsbDsgfVxuICAgICAgICB0aGlzLmlkID0gaWQ7XG4gICAgICAgIHRoaXMueCA9IHg7XG4gICAgICAgIHRoaXMueSA9IHk7XG4gICAgICAgIHRoaXMubm9kZSA9IG5vZGU7XG4gICAgICAgIHRoaXMubGluZSA9IGxpbmU7XG4gICAgfVxuICAgIHJldHVybiBWZXJ0O1xufSgpKTtcbmV4cG9ydHMuVmVydCA9IFZlcnQ7XG52YXIgTG9uZ2VzdENvbW1vblN1YnNlcXVlbmNlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBMb25nZXN0Q29tbW9uU3Vic2VxdWVuY2UocywgdCkge1xuICAgICAgICB0aGlzLnMgPSBzO1xuICAgICAgICB0aGlzLnQgPSB0O1xuICAgICAgICB2YXIgbWYgPSBMb25nZXN0Q29tbW9uU3Vic2VxdWVuY2UuZmluZE1hdGNoKHMsIHQpO1xuICAgICAgICB2YXIgdHIgPSB0LnNsaWNlKDApLnJldmVyc2UoKTtcbiAgICAgICAgdmFyIG1yID0gTG9uZ2VzdENvbW1vblN1YnNlcXVlbmNlLmZpbmRNYXRjaChzLCB0cik7XG4gICAgICAgIGlmIChtZi5sZW5ndGggPj0gbXIubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aGlzLmxlbmd0aCA9IG1mLmxlbmd0aDtcbiAgICAgICAgICAgIHRoaXMuc2kgPSBtZi5zaTtcbiAgICAgICAgICAgIHRoaXMudGkgPSBtZi50aTtcbiAgICAgICAgICAgIHRoaXMucmV2ZXJzZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubGVuZ3RoID0gbXIubGVuZ3RoO1xuICAgICAgICAgICAgdGhpcy5zaSA9IG1yLnNpO1xuICAgICAgICAgICAgdGhpcy50aSA9IHQubGVuZ3RoIC0gbXIudGkgLSBtci5sZW5ndGg7XG4gICAgICAgICAgICB0aGlzLnJldmVyc2VkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBMb25nZXN0Q29tbW9uU3Vic2VxdWVuY2UuZmluZE1hdGNoID0gZnVuY3Rpb24gKHMsIHQpIHtcbiAgICAgICAgdmFyIG0gPSBzLmxlbmd0aDtcbiAgICAgICAgdmFyIG4gPSB0Lmxlbmd0aDtcbiAgICAgICAgdmFyIG1hdGNoID0geyBsZW5ndGg6IDAsIHNpOiAtMSwgdGk6IC0xIH07XG4gICAgICAgIHZhciBsID0gbmV3IEFycmF5KG0pO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG07IGkrKykge1xuICAgICAgICAgICAgbFtpXSA9IG5ldyBBcnJheShuKTtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgbjsgaisrKVxuICAgICAgICAgICAgICAgIGlmIChzW2ldID09PSB0W2pdKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2ID0gbFtpXVtqXSA9IChpID09PSAwIHx8IGogPT09IDApID8gMSA6IGxbaSAtIDFdW2ogLSAxXSArIDE7XG4gICAgICAgICAgICAgICAgICAgIGlmICh2ID4gbWF0Y2gubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRjaC5sZW5ndGggPSB2O1xuICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2guc2kgPSBpIC0gdiArIDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRjaC50aSA9IGogLSB2ICsgMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgbFtpXVtqXSA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1hdGNoO1xuICAgIH07XG4gICAgTG9uZ2VzdENvbW1vblN1YnNlcXVlbmNlLnByb3RvdHlwZS5nZXRTZXF1ZW5jZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGVuZ3RoID49IDAgPyB0aGlzLnMuc2xpY2UodGhpcy5zaSwgdGhpcy5zaSArIHRoaXMubGVuZ3RoKSA6IFtdO1xuICAgIH07XG4gICAgcmV0dXJuIExvbmdlc3RDb21tb25TdWJzZXF1ZW5jZTtcbn0oKSk7XG5leHBvcnRzLkxvbmdlc3RDb21tb25TdWJzZXF1ZW5jZSA9IExvbmdlc3RDb21tb25TdWJzZXF1ZW5jZTtcbnZhciBHcmlkUm91dGVyID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBHcmlkUm91dGVyKG9yaWdpbmFsbm9kZXMsIGFjY2Vzc29yLCBncm91cFBhZGRpbmcpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgaWYgKGdyb3VwUGFkZGluZyA9PT0gdm9pZCAwKSB7IGdyb3VwUGFkZGluZyA9IDEyOyB9XG4gICAgICAgIHRoaXMub3JpZ2luYWxub2RlcyA9IG9yaWdpbmFsbm9kZXM7XG4gICAgICAgIHRoaXMuZ3JvdXBQYWRkaW5nID0gZ3JvdXBQYWRkaW5nO1xuICAgICAgICB0aGlzLmxlYXZlcyA9IG51bGw7XG4gICAgICAgIHRoaXMubm9kZXMgPSBvcmlnaW5hbG5vZGVzLm1hcChmdW5jdGlvbiAodiwgaSkgeyByZXR1cm4gbmV3IE5vZGVXcmFwcGVyKGksIGFjY2Vzc29yLmdldEJvdW5kcyh2KSwgYWNjZXNzb3IuZ2V0Q2hpbGRyZW4odikpOyB9KTtcbiAgICAgICAgdGhpcy5sZWF2ZXMgPSB0aGlzLm5vZGVzLmZpbHRlcihmdW5jdGlvbiAodikgeyByZXR1cm4gdi5sZWFmOyB9KTtcbiAgICAgICAgdGhpcy5ncm91cHMgPSB0aGlzLm5vZGVzLmZpbHRlcihmdW5jdGlvbiAoZykgeyByZXR1cm4gIWcubGVhZjsgfSk7XG4gICAgICAgIHRoaXMuY29scyA9IHRoaXMuZ2V0R3JpZExpbmVzKCd4Jyk7XG4gICAgICAgIHRoaXMucm93cyA9IHRoaXMuZ2V0R3JpZExpbmVzKCd5Jyk7XG4gICAgICAgIHRoaXMuZ3JvdXBzLmZvckVhY2goZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgIHJldHVybiB2LmNoaWxkcmVuLmZvckVhY2goZnVuY3Rpb24gKGMpIHsgcmV0dXJuIF90aGlzLm5vZGVzW2NdLnBhcmVudCA9IHY7IH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5yb290ID0geyBjaGlsZHJlbjogW10gfTtcbiAgICAgICAgdGhpcy5ub2Rlcy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHYucGFyZW50ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHYucGFyZW50ID0gX3RoaXMucm9vdDtcbiAgICAgICAgICAgICAgICBfdGhpcy5yb290LmNoaWxkcmVuLnB1c2godi5pZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2LnBvcnRzID0gW107XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmJhY2tUb0Zyb250ID0gdGhpcy5ub2Rlcy5zbGljZSgwKTtcbiAgICAgICAgdGhpcy5iYWNrVG9Gcm9udC5zb3J0KGZ1bmN0aW9uICh4LCB5KSB7IHJldHVybiBfdGhpcy5nZXREZXB0aCh4KSAtIF90aGlzLmdldERlcHRoKHkpOyB9KTtcbiAgICAgICAgdmFyIGZyb250VG9CYWNrR3JvdXBzID0gdGhpcy5iYWNrVG9Gcm9udC5zbGljZSgwKS5yZXZlcnNlKCkuZmlsdGVyKGZ1bmN0aW9uIChnKSB7IHJldHVybiAhZy5sZWFmOyB9KTtcbiAgICAgICAgZnJvbnRUb0JhY2tHcm91cHMuZm9yRWFjaChmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgdmFyIHIgPSByZWN0YW5nbGVfMS5SZWN0YW5nbGUuZW1wdHkoKTtcbiAgICAgICAgICAgIHYuY2hpbGRyZW4uZm9yRWFjaChmdW5jdGlvbiAoYykgeyByZXR1cm4gciA9IHIudW5pb24oX3RoaXMubm9kZXNbY10ucmVjdCk7IH0pO1xuICAgICAgICAgICAgdi5yZWN0ID0gci5pbmZsYXRlKF90aGlzLmdyb3VwUGFkZGluZyk7XG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgY29sTWlkcyA9IHRoaXMubWlkUG9pbnRzKHRoaXMuY29scy5tYXAoZnVuY3Rpb24gKHIpIHsgcmV0dXJuIHIucG9zOyB9KSk7XG4gICAgICAgIHZhciByb3dNaWRzID0gdGhpcy5taWRQb2ludHModGhpcy5yb3dzLm1hcChmdW5jdGlvbiAocikgeyByZXR1cm4gci5wb3M7IH0pKTtcbiAgICAgICAgdmFyIHJvd3ggPSBjb2xNaWRzWzBdLCByb3dYID0gY29sTWlkc1tjb2xNaWRzLmxlbmd0aCAtIDFdO1xuICAgICAgICB2YXIgY29seSA9IHJvd01pZHNbMF0sIGNvbFkgPSByb3dNaWRzW3Jvd01pZHMubGVuZ3RoIC0gMV07XG4gICAgICAgIHZhciBobGluZXMgPSB0aGlzLnJvd3MubWFwKGZ1bmN0aW9uIChyKSB7IHJldHVybiAoeyB4MTogcm93eCwgeDI6IHJvd1gsIHkxOiByLnBvcywgeTI6IHIucG9zIH0pOyB9KVxuICAgICAgICAgICAgLmNvbmNhdChyb3dNaWRzLm1hcChmdW5jdGlvbiAobSkgeyByZXR1cm4gKHsgeDE6IHJvd3gsIHgyOiByb3dYLCB5MTogbSwgeTI6IG0gfSk7IH0pKTtcbiAgICAgICAgdmFyIHZsaW5lcyA9IHRoaXMuY29scy5tYXAoZnVuY3Rpb24gKGMpIHsgcmV0dXJuICh7IHgxOiBjLnBvcywgeDI6IGMucG9zLCB5MTogY29seSwgeTI6IGNvbFkgfSk7IH0pXG4gICAgICAgICAgICAuY29uY2F0KGNvbE1pZHMubWFwKGZ1bmN0aW9uIChtKSB7IHJldHVybiAoeyB4MTogbSwgeDI6IG0sIHkxOiBjb2x5LCB5MjogY29sWSB9KTsgfSkpO1xuICAgICAgICB2YXIgbGluZXMgPSBobGluZXMuY29uY2F0KHZsaW5lcyk7XG4gICAgICAgIGxpbmVzLmZvckVhY2goZnVuY3Rpb24gKGwpIHsgcmV0dXJuIGwudmVydHMgPSBbXTsgfSk7XG4gICAgICAgIHRoaXMudmVydHMgPSBbXTtcbiAgICAgICAgdGhpcy5lZGdlcyA9IFtdO1xuICAgICAgICBobGluZXMuZm9yRWFjaChmdW5jdGlvbiAoaCkge1xuICAgICAgICAgICAgcmV0dXJuIHZsaW5lcy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICAgICAgdmFyIHAgPSBuZXcgVmVydChfdGhpcy52ZXJ0cy5sZW5ndGgsIHYueDEsIGgueTEpO1xuICAgICAgICAgICAgICAgIGgudmVydHMucHVzaChwKTtcbiAgICAgICAgICAgICAgICB2LnZlcnRzLnB1c2gocCk7XG4gICAgICAgICAgICAgICAgX3RoaXMudmVydHMucHVzaChwKTtcbiAgICAgICAgICAgICAgICB2YXIgaSA9IF90aGlzLmJhY2tUb0Zyb250Lmxlbmd0aDtcbiAgICAgICAgICAgICAgICB3aGlsZSAoaS0tID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbm9kZSA9IF90aGlzLmJhY2tUb0Zyb250W2ldLCByID0gbm9kZS5yZWN0O1xuICAgICAgICAgICAgICAgICAgICB2YXIgZHggPSBNYXRoLmFicyhwLnggLSByLmN4KCkpLCBkeSA9IE1hdGguYWJzKHAueSAtIHIuY3koKSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkeCA8IHIud2lkdGgoKSAvIDIgJiYgZHkgPCByLmhlaWdodCgpIC8gMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcC5ub2RlID0gbm9kZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICBsaW5lcy5mb3JFYWNoKGZ1bmN0aW9uIChsLCBsaSkge1xuICAgICAgICAgICAgX3RoaXMubm9kZXMuZm9yRWFjaChmdW5jdGlvbiAodiwgaSkge1xuICAgICAgICAgICAgICAgIHYucmVjdC5saW5lSW50ZXJzZWN0aW9ucyhsLngxLCBsLnkxLCBsLngyLCBsLnkyKS5mb3JFYWNoKGZ1bmN0aW9uIChpbnRlcnNlY3QsIGopIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHAgPSBuZXcgVmVydChfdGhpcy52ZXJ0cy5sZW5ndGgsIGludGVyc2VjdC54LCBpbnRlcnNlY3QueSwgdiwgbCk7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLnZlcnRzLnB1c2gocCk7XG4gICAgICAgICAgICAgICAgICAgIGwudmVydHMucHVzaChwKTtcbiAgICAgICAgICAgICAgICAgICAgdi5wb3J0cy5wdXNoKHApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB2YXIgaXNIb3JpeiA9IE1hdGguYWJzKGwueTEgLSBsLnkyKSA8IDAuMTtcbiAgICAgICAgICAgIHZhciBkZWx0YSA9IGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBpc0hvcml6ID8gYi54IC0gYS54IDogYi55IC0gYS55OyB9O1xuICAgICAgICAgICAgbC52ZXJ0cy5zb3J0KGRlbHRhKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgbC52ZXJ0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciB1ID0gbC52ZXJ0c1tpIC0gMV0sIHYgPSBsLnZlcnRzW2ldO1xuICAgICAgICAgICAgICAgIGlmICh1Lm5vZGUgJiYgdS5ub2RlID09PSB2Lm5vZGUgJiYgdS5ub2RlLmxlYWYpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIF90aGlzLmVkZ2VzLnB1c2goeyBzb3VyY2U6IHUuaWQsIHRhcmdldDogdi5pZCwgbGVuZ3RoOiBNYXRoLmFicyhkZWx0YSh1LCB2KSkgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBHcmlkUm91dGVyLnByb3RvdHlwZS5hdmcgPSBmdW5jdGlvbiAoYSkgeyByZXR1cm4gYS5yZWR1Y2UoZnVuY3Rpb24gKHgsIHkpIHsgcmV0dXJuIHggKyB5OyB9KSAvIGEubGVuZ3RoOyB9O1xuICAgIEdyaWRSb3V0ZXIucHJvdG90eXBlLmdldEdyaWRMaW5lcyA9IGZ1bmN0aW9uIChheGlzKSB7XG4gICAgICAgIHZhciBjb2x1bW5zID0gW107XG4gICAgICAgIHZhciBscyA9IHRoaXMubGVhdmVzLnNsaWNlKDAsIHRoaXMubGVhdmVzLmxlbmd0aCk7XG4gICAgICAgIHdoaWxlIChscy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB2YXIgb3ZlcmxhcHBpbmcgPSBscy5maWx0ZXIoZnVuY3Rpb24gKHYpIHsgcmV0dXJuIHYucmVjdFsnb3ZlcmxhcCcgKyBheGlzLnRvVXBwZXJDYXNlKCldKGxzWzBdLnJlY3QpOyB9KTtcbiAgICAgICAgICAgIHZhciBjb2wgPSB7XG4gICAgICAgICAgICAgICAgbm9kZXM6IG92ZXJsYXBwaW5nLFxuICAgICAgICAgICAgICAgIHBvczogdGhpcy5hdmcob3ZlcmxhcHBpbmcubWFwKGZ1bmN0aW9uICh2KSB7IHJldHVybiB2LnJlY3RbJ2MnICsgYXhpc10oKTsgfSkpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29sdW1ucy5wdXNoKGNvbCk7XG4gICAgICAgICAgICBjb2wubm9kZXMuZm9yRWFjaChmdW5jdGlvbiAodikgeyByZXR1cm4gbHMuc3BsaWNlKGxzLmluZGV4T2YodiksIDEpOyB9KTtcbiAgICAgICAgfVxuICAgICAgICBjb2x1bW5zLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEucG9zIC0gYi5wb3M7IH0pO1xuICAgICAgICByZXR1cm4gY29sdW1ucztcbiAgICB9O1xuICAgIEdyaWRSb3V0ZXIucHJvdG90eXBlLmdldERlcHRoID0gZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgdmFyIGRlcHRoID0gMDtcbiAgICAgICAgd2hpbGUgKHYucGFyZW50ICE9PSB0aGlzLnJvb3QpIHtcbiAgICAgICAgICAgIGRlcHRoKys7XG4gICAgICAgICAgICB2ID0gdi5wYXJlbnQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRlcHRoO1xuICAgIH07XG4gICAgR3JpZFJvdXRlci5wcm90b3R5cGUubWlkUG9pbnRzID0gZnVuY3Rpb24gKGEpIHtcbiAgICAgICAgdmFyIGdhcCA9IGFbMV0gLSBhWzBdO1xuICAgICAgICB2YXIgbWlkcyA9IFthWzBdIC0gZ2FwIC8gMl07XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbWlkcy5wdXNoKChhW2ldICsgYVtpIC0gMV0pIC8gMik7XG4gICAgICAgIH1cbiAgICAgICAgbWlkcy5wdXNoKGFbYS5sZW5ndGggLSAxXSArIGdhcCAvIDIpO1xuICAgICAgICByZXR1cm4gbWlkcztcbiAgICB9O1xuICAgIEdyaWRSb3V0ZXIucHJvdG90eXBlLmZpbmRMaW5lYWdlID0gZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgdmFyIGxpbmVhZ2UgPSBbdl07XG4gICAgICAgIGRvIHtcbiAgICAgICAgICAgIHYgPSB2LnBhcmVudDtcbiAgICAgICAgICAgIGxpbmVhZ2UucHVzaCh2KTtcbiAgICAgICAgfSB3aGlsZSAodiAhPT0gdGhpcy5yb290KTtcbiAgICAgICAgcmV0dXJuIGxpbmVhZ2UucmV2ZXJzZSgpO1xuICAgIH07XG4gICAgR3JpZFJvdXRlci5wcm90b3R5cGUuZmluZEFuY2VzdG9yUGF0aEJldHdlZW4gPSBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICB2YXIgYWEgPSB0aGlzLmZpbmRMaW5lYWdlKGEpLCBiYSA9IHRoaXMuZmluZExpbmVhZ2UoYiksIGkgPSAwO1xuICAgICAgICB3aGlsZSAoYWFbaV0gPT09IGJhW2ldKVxuICAgICAgICAgICAgaSsrO1xuICAgICAgICByZXR1cm4geyBjb21tb25BbmNlc3RvcjogYWFbaSAtIDFdLCBsaW5lYWdlczogYWEuc2xpY2UoaSkuY29uY2F0KGJhLnNsaWNlKGkpKSB9O1xuICAgIH07XG4gICAgR3JpZFJvdXRlci5wcm90b3R5cGUuc2libGluZ09ic3RhY2xlcyA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBwYXRoID0gdGhpcy5maW5kQW5jZXN0b3JQYXRoQmV0d2VlbihhLCBiKTtcbiAgICAgICAgdmFyIGxpbmVhZ2VMb29rdXAgPSB7fTtcbiAgICAgICAgcGF0aC5saW5lYWdlcy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7IHJldHVybiBsaW5lYWdlTG9va3VwW3YuaWRdID0ge307IH0pO1xuICAgICAgICB2YXIgb2JzdGFjbGVzID0gcGF0aC5jb21tb25BbmNlc3Rvci5jaGlsZHJlbi5maWx0ZXIoZnVuY3Rpb24gKHYpIHsgcmV0dXJuICEodiBpbiBsaW5lYWdlTG9va3VwKTsgfSk7XG4gICAgICAgIHBhdGgubGluZWFnZXNcbiAgICAgICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKHYpIHsgcmV0dXJuIHYucGFyZW50ICE9PSBwYXRoLmNvbW1vbkFuY2VzdG9yOyB9KVxuICAgICAgICAgICAgLmZvckVhY2goZnVuY3Rpb24gKHYpIHsgcmV0dXJuIG9ic3RhY2xlcyA9IG9ic3RhY2xlcy5jb25jYXQodi5wYXJlbnQuY2hpbGRyZW4uZmlsdGVyKGZ1bmN0aW9uIChjKSB7IHJldHVybiBjICE9PSB2LmlkOyB9KSk7IH0pO1xuICAgICAgICByZXR1cm4gb2JzdGFjbGVzLm1hcChmdW5jdGlvbiAodikgeyByZXR1cm4gX3RoaXMubm9kZXNbdl07IH0pO1xuICAgIH07XG4gICAgR3JpZFJvdXRlci5nZXRTZWdtZW50U2V0cyA9IGZ1bmN0aW9uIChyb3V0ZXMsIHgsIHkpIHtcbiAgICAgICAgdmFyIHZzZWdtZW50cyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBlaSA9IDA7IGVpIDwgcm91dGVzLmxlbmd0aDsgZWkrKykge1xuICAgICAgICAgICAgdmFyIHJvdXRlID0gcm91dGVzW2VpXTtcbiAgICAgICAgICAgIGZvciAodmFyIHNpID0gMDsgc2kgPCByb3V0ZS5sZW5ndGg7IHNpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgcyA9IHJvdXRlW3NpXTtcbiAgICAgICAgICAgICAgICBzLmVkZ2VpZCA9IGVpO1xuICAgICAgICAgICAgICAgIHMuaSA9IHNpO1xuICAgICAgICAgICAgICAgIHZhciBzZHggPSBzWzFdW3hdIC0gc1swXVt4XTtcbiAgICAgICAgICAgICAgICBpZiAoTWF0aC5hYnMoc2R4KSA8IDAuMSkge1xuICAgICAgICAgICAgICAgICAgICB2c2VnbWVudHMucHVzaChzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdnNlZ21lbnRzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGFbMF1beF0gLSBiWzBdW3hdOyB9KTtcbiAgICAgICAgdmFyIHZzZWdtZW50c2V0cyA9IFtdO1xuICAgICAgICB2YXIgc2VnbWVudHNldCA9IG51bGw7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdnNlZ21lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcyA9IHZzZWdtZW50c1tpXTtcbiAgICAgICAgICAgIGlmICghc2VnbWVudHNldCB8fCBNYXRoLmFicyhzWzBdW3hdIC0gc2VnbWVudHNldC5wb3MpID4gMC4xKSB7XG4gICAgICAgICAgICAgICAgc2VnbWVudHNldCA9IHsgcG9zOiBzWzBdW3hdLCBzZWdtZW50czogW10gfTtcbiAgICAgICAgICAgICAgICB2c2VnbWVudHNldHMucHVzaChzZWdtZW50c2V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNlZ21lbnRzZXQuc2VnbWVudHMucHVzaChzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdnNlZ21lbnRzZXRzO1xuICAgIH07XG4gICAgR3JpZFJvdXRlci5udWRnZVNlZ3MgPSBmdW5jdGlvbiAoeCwgeSwgcm91dGVzLCBzZWdtZW50cywgbGVmdE9mLCBnYXApIHtcbiAgICAgICAgdmFyIG4gPSBzZWdtZW50cy5sZW5ndGg7XG4gICAgICAgIGlmIChuIDw9IDEpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHZhciB2cyA9IHNlZ21lbnRzLm1hcChmdW5jdGlvbiAocykgeyByZXR1cm4gbmV3IHZwc2NfMS5WYXJpYWJsZShzWzBdW3hdKTsgfSk7XG4gICAgICAgIHZhciBjcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBuOyBqKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoaSA9PT0gailcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgdmFyIHMxID0gc2VnbWVudHNbaV0sIHMyID0gc2VnbWVudHNbal0sIGUxID0gczEuZWRnZWlkLCBlMiA9IHMyLmVkZ2VpZCwgbGluZCA9IC0xLCByaW5kID0gLTE7XG4gICAgICAgICAgICAgICAgaWYgKHggPT0gJ3gnKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsZWZ0T2YoZTEsIGUyKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHMxWzBdW3ldIDwgczFbMV1beV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5kID0gaiwgcmluZCA9IGk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5kID0gaSwgcmluZCA9IGo7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsZWZ0T2YoZTEsIGUyKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHMxWzBdW3ldIDwgczFbMV1beV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5kID0gaSwgcmluZCA9IGo7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5kID0gaiwgcmluZCA9IGk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGxpbmQgPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICBjcy5wdXNoKG5ldyB2cHNjXzEuQ29uc3RyYWludCh2c1tsaW5kXSwgdnNbcmluZF0sIGdhcCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgc29sdmVyID0gbmV3IHZwc2NfMS5Tb2x2ZXIodnMsIGNzKTtcbiAgICAgICAgc29sdmVyLnNvbHZlKCk7XG4gICAgICAgIHZzLmZvckVhY2goZnVuY3Rpb24gKHYsIGkpIHtcbiAgICAgICAgICAgIHZhciBzID0gc2VnbWVudHNbaV07XG4gICAgICAgICAgICB2YXIgcG9zID0gdi5wb3NpdGlvbigpO1xuICAgICAgICAgICAgc1swXVt4XSA9IHNbMV1beF0gPSBwb3M7XG4gICAgICAgICAgICB2YXIgcm91dGUgPSByb3V0ZXNbcy5lZGdlaWRdO1xuICAgICAgICAgICAgaWYgKHMuaSA+IDApXG4gICAgICAgICAgICAgICAgcm91dGVbcy5pIC0gMV1bMV1beF0gPSBwb3M7XG4gICAgICAgICAgICBpZiAocy5pIDwgcm91dGUubGVuZ3RoIC0gMSlcbiAgICAgICAgICAgICAgICByb3V0ZVtzLmkgKyAxXVswXVt4XSA9IHBvcztcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBHcmlkUm91dGVyLm51ZGdlU2VnbWVudHMgPSBmdW5jdGlvbiAocm91dGVzLCB4LCB5LCBsZWZ0T2YsIGdhcCkge1xuICAgICAgICB2YXIgdnNlZ21lbnRzZXRzID0gR3JpZFJvdXRlci5nZXRTZWdtZW50U2V0cyhyb3V0ZXMsIHgsIHkpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHZzZWdtZW50c2V0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHNzID0gdnNlZ21lbnRzZXRzW2ldO1xuICAgICAgICAgICAgdmFyIGV2ZW50cyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBzcy5zZWdtZW50cy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIHZhciBzID0gc3Muc2VnbWVudHNbal07XG4gICAgICAgICAgICAgICAgZXZlbnRzLnB1c2goeyB0eXBlOiAwLCBzOiBzLCBwb3M6IE1hdGgubWluKHNbMF1beV0sIHNbMV1beV0pIH0pO1xuICAgICAgICAgICAgICAgIGV2ZW50cy5wdXNoKHsgdHlwZTogMSwgczogcywgcG9zOiBNYXRoLm1heChzWzBdW3ldLCBzWzFdW3ldKSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGV2ZW50cy5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhLnBvcyAtIGIucG9zICsgYS50eXBlIC0gYi50eXBlOyB9KTtcbiAgICAgICAgICAgIHZhciBvcGVuID0gW107XG4gICAgICAgICAgICB2YXIgb3BlbkNvdW50ID0gMDtcbiAgICAgICAgICAgIGV2ZW50cy5mb3JFYWNoKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGUudHlwZSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBvcGVuLnB1c2goZS5zKTtcbiAgICAgICAgICAgICAgICAgICAgb3BlbkNvdW50Kys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBvcGVuQ291bnQtLTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG9wZW5Db3VudCA9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIEdyaWRSb3V0ZXIubnVkZ2VTZWdzKHgsIHksIHJvdXRlcywgb3BlbiwgbGVmdE9mLCBnYXApO1xuICAgICAgICAgICAgICAgICAgICBvcGVuID0gW107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEdyaWRSb3V0ZXIucHJvdG90eXBlLnJvdXRlRWRnZXMgPSBmdW5jdGlvbiAoZWRnZXMsIG51ZGdlR2FwLCBzb3VyY2UsIHRhcmdldCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgcm91dGVQYXRocyA9IGVkZ2VzLm1hcChmdW5jdGlvbiAoZSkgeyByZXR1cm4gX3RoaXMucm91dGUoc291cmNlKGUpLCB0YXJnZXQoZSkpOyB9KTtcbiAgICAgICAgdmFyIG9yZGVyID0gR3JpZFJvdXRlci5vcmRlckVkZ2VzKHJvdXRlUGF0aHMpO1xuICAgICAgICB2YXIgcm91dGVzID0gcm91dGVQYXRocy5tYXAoZnVuY3Rpb24gKGUpIHsgcmV0dXJuIEdyaWRSb3V0ZXIubWFrZVNlZ21lbnRzKGUpOyB9KTtcbiAgICAgICAgR3JpZFJvdXRlci5udWRnZVNlZ21lbnRzKHJvdXRlcywgJ3gnLCAneScsIG9yZGVyLCBudWRnZUdhcCk7XG4gICAgICAgIEdyaWRSb3V0ZXIubnVkZ2VTZWdtZW50cyhyb3V0ZXMsICd5JywgJ3gnLCBvcmRlciwgbnVkZ2VHYXApO1xuICAgICAgICBHcmlkUm91dGVyLnVucmV2ZXJzZUVkZ2VzKHJvdXRlcywgcm91dGVQYXRocyk7XG4gICAgICAgIHJldHVybiByb3V0ZXM7XG4gICAgfTtcbiAgICBHcmlkUm91dGVyLnVucmV2ZXJzZUVkZ2VzID0gZnVuY3Rpb24gKHJvdXRlcywgcm91dGVQYXRocykge1xuICAgICAgICByb3V0ZXMuZm9yRWFjaChmdW5jdGlvbiAoc2VnbWVudHMsIGkpIHtcbiAgICAgICAgICAgIHZhciBwYXRoID0gcm91dGVQYXRoc1tpXTtcbiAgICAgICAgICAgIGlmIChwYXRoLnJldmVyc2VkKSB7XG4gICAgICAgICAgICAgICAgc2VnbWVudHMucmV2ZXJzZSgpO1xuICAgICAgICAgICAgICAgIHNlZ21lbnRzLmZvckVhY2goZnVuY3Rpb24gKHNlZ21lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VnbWVudC5yZXZlcnNlKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgR3JpZFJvdXRlci5hbmdsZUJldHdlZW4yTGluZXMgPSBmdW5jdGlvbiAobGluZTEsIGxpbmUyKSB7XG4gICAgICAgIHZhciBhbmdsZTEgPSBNYXRoLmF0YW4yKGxpbmUxWzBdLnkgLSBsaW5lMVsxXS55LCBsaW5lMVswXS54IC0gbGluZTFbMV0ueCk7XG4gICAgICAgIHZhciBhbmdsZTIgPSBNYXRoLmF0YW4yKGxpbmUyWzBdLnkgLSBsaW5lMlsxXS55LCBsaW5lMlswXS54IC0gbGluZTJbMV0ueCk7XG4gICAgICAgIHZhciBkaWZmID0gYW5nbGUxIC0gYW5nbGUyO1xuICAgICAgICBpZiAoZGlmZiA+IE1hdGguUEkgfHwgZGlmZiA8IC1NYXRoLlBJKSB7XG4gICAgICAgICAgICBkaWZmID0gYW5nbGUyIC0gYW5nbGUxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkaWZmO1xuICAgIH07XG4gICAgR3JpZFJvdXRlci5pc0xlZnQgPSBmdW5jdGlvbiAoYSwgYiwgYykge1xuICAgICAgICByZXR1cm4gKChiLnggLSBhLngpICogKGMueSAtIGEueSkgLSAoYi55IC0gYS55KSAqIChjLnggLSBhLngpKSA8PSAwO1xuICAgIH07XG4gICAgR3JpZFJvdXRlci5nZXRPcmRlciA9IGZ1bmN0aW9uIChwYWlycykge1xuICAgICAgICB2YXIgb3V0Z29pbmcgPSB7fTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYWlycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHAgPSBwYWlyc1tpXTtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb3V0Z29pbmdbcC5sXSA9PT0gJ3VuZGVmaW5lZCcpXG4gICAgICAgICAgICAgICAgb3V0Z29pbmdbcC5sXSA9IHt9O1xuICAgICAgICAgICAgb3V0Z29pbmdbcC5sXVtwLnJdID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGwsIHIpIHsgcmV0dXJuIHR5cGVvZiBvdXRnb2luZ1tsXSAhPT0gJ3VuZGVmaW5lZCcgJiYgb3V0Z29pbmdbbF1bcl07IH07XG4gICAgfTtcbiAgICBHcmlkUm91dGVyLm9yZGVyRWRnZXMgPSBmdW5jdGlvbiAoZWRnZXMpIHtcbiAgICAgICAgdmFyIGVkZ2VPcmRlciA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVkZ2VzLmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IGkgKyAxOyBqIDwgZWRnZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgZSA9IGVkZ2VzW2ldLCBmID0gZWRnZXNbal0sIGxjcyA9IG5ldyBMb25nZXN0Q29tbW9uU3Vic2VxdWVuY2UoZSwgZik7XG4gICAgICAgICAgICAgICAgdmFyIHUsIHZpLCB2ajtcbiAgICAgICAgICAgICAgICBpZiAobGNzLmxlbmd0aCA9PT0gMClcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgaWYgKGxjcy5yZXZlcnNlZCkge1xuICAgICAgICAgICAgICAgICAgICBmLnJldmVyc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgZi5yZXZlcnNlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGxjcyA9IG5ldyBMb25nZXN0Q29tbW9uU3Vic2VxdWVuY2UoZSwgZik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICgobGNzLnNpIDw9IDAgfHwgbGNzLnRpIDw9IDApICYmXG4gICAgICAgICAgICAgICAgICAgIChsY3Muc2kgKyBsY3MubGVuZ3RoID49IGUubGVuZ3RoIHx8IGxjcy50aSArIGxjcy5sZW5ndGggPj0gZi5sZW5ndGgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGVkZ2VPcmRlci5wdXNoKHsgbDogaSwgcjogaiB9KTtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChsY3Muc2kgKyBsY3MubGVuZ3RoID49IGUubGVuZ3RoIHx8IGxjcy50aSArIGxjcy5sZW5ndGggPj0gZi5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdSA9IGVbbGNzLnNpICsgMV07XG4gICAgICAgICAgICAgICAgICAgIHZqID0gZVtsY3Muc2kgLSAxXTtcbiAgICAgICAgICAgICAgICAgICAgdmkgPSBmW2xjcy50aSAtIDFdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdSA9IGVbbGNzLnNpICsgbGNzLmxlbmd0aCAtIDJdO1xuICAgICAgICAgICAgICAgICAgICB2aSA9IGVbbGNzLnNpICsgbGNzLmxlbmd0aF07XG4gICAgICAgICAgICAgICAgICAgIHZqID0gZltsY3MudGkgKyBsY3MubGVuZ3RoXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKEdyaWRSb3V0ZXIuaXNMZWZ0KHUsIHZpLCB2aikpIHtcbiAgICAgICAgICAgICAgICAgICAgZWRnZU9yZGVyLnB1c2goeyBsOiBqLCByOiBpIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZWRnZU9yZGVyLnB1c2goeyBsOiBpLCByOiBqIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gR3JpZFJvdXRlci5nZXRPcmRlcihlZGdlT3JkZXIpO1xuICAgIH07XG4gICAgR3JpZFJvdXRlci5tYWtlU2VnbWVudHMgPSBmdW5jdGlvbiAocGF0aCkge1xuICAgICAgICBmdW5jdGlvbiBjb3B5UG9pbnQocCkge1xuICAgICAgICAgICAgcmV0dXJuIHsgeDogcC54LCB5OiBwLnkgfTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaXNTdHJhaWdodCA9IGZ1bmN0aW9uIChhLCBiLCBjKSB7IHJldHVybiBNYXRoLmFicygoYi54IC0gYS54KSAqIChjLnkgLSBhLnkpIC0gKGIueSAtIGEueSkgKiAoYy54IC0gYS54KSkgPCAwLjAwMTsgfTtcbiAgICAgICAgdmFyIHNlZ21lbnRzID0gW107XG4gICAgICAgIHZhciBhID0gY29weVBvaW50KHBhdGhbMF0pO1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IHBhdGgubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBiID0gY29weVBvaW50KHBhdGhbaV0pLCBjID0gaSA8IHBhdGgubGVuZ3RoIC0gMSA/IHBhdGhbaSArIDFdIDogbnVsbDtcbiAgICAgICAgICAgIGlmICghYyB8fCAhaXNTdHJhaWdodChhLCBiLCBjKSkge1xuICAgICAgICAgICAgICAgIHNlZ21lbnRzLnB1c2goW2EsIGJdKTtcbiAgICAgICAgICAgICAgICBhID0gYjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2VnbWVudHM7XG4gICAgfTtcbiAgICBHcmlkUm91dGVyLnByb3RvdHlwZS5yb3V0ZSA9IGZ1bmN0aW9uIChzLCB0KSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBzb3VyY2UgPSB0aGlzLm5vZGVzW3NdLCB0YXJnZXQgPSB0aGlzLm5vZGVzW3RdO1xuICAgICAgICB0aGlzLm9ic3RhY2xlcyA9IHRoaXMuc2libGluZ09ic3RhY2xlcyhzb3VyY2UsIHRhcmdldCk7XG4gICAgICAgIHZhciBvYnN0YWNsZUxvb2t1cCA9IHt9O1xuICAgICAgICB0aGlzLm9ic3RhY2xlcy5mb3JFYWNoKGZ1bmN0aW9uIChvKSB7IHJldHVybiBvYnN0YWNsZUxvb2t1cFtvLmlkXSA9IG87IH0pO1xuICAgICAgICB0aGlzLnBhc3NhYmxlRWRnZXMgPSB0aGlzLmVkZ2VzLmZpbHRlcihmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgdmFyIHUgPSBfdGhpcy52ZXJ0c1tlLnNvdXJjZV0sIHYgPSBfdGhpcy52ZXJ0c1tlLnRhcmdldF07XG4gICAgICAgICAgICByZXR1cm4gISh1Lm5vZGUgJiYgdS5ub2RlLmlkIGluIG9ic3RhY2xlTG9va3VwXG4gICAgICAgICAgICAgICAgfHwgdi5ub2RlICYmIHYubm9kZS5pZCBpbiBvYnN0YWNsZUxvb2t1cCk7XG4gICAgICAgIH0pO1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IHNvdXJjZS5wb3J0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHUgPSBzb3VyY2UucG9ydHNbMF0uaWQ7XG4gICAgICAgICAgICB2YXIgdiA9IHNvdXJjZS5wb3J0c1tpXS5pZDtcbiAgICAgICAgICAgIHRoaXMucGFzc2FibGVFZGdlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICBzb3VyY2U6IHUsXG4gICAgICAgICAgICAgICAgdGFyZ2V0OiB2LFxuICAgICAgICAgICAgICAgIGxlbmd0aDogMFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCB0YXJnZXQucG9ydHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciB1ID0gdGFyZ2V0LnBvcnRzWzBdLmlkO1xuICAgICAgICAgICAgdmFyIHYgPSB0YXJnZXQucG9ydHNbaV0uaWQ7XG4gICAgICAgICAgICB0aGlzLnBhc3NhYmxlRWRnZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgc291cmNlOiB1LFxuICAgICAgICAgICAgICAgIHRhcmdldDogdixcbiAgICAgICAgICAgICAgICBsZW5ndGg6IDBcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHZhciBnZXRTb3VyY2UgPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gZS5zb3VyY2U7IH0sIGdldFRhcmdldCA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBlLnRhcmdldDsgfSwgZ2V0TGVuZ3RoID0gZnVuY3Rpb24gKGUpIHsgcmV0dXJuIGUubGVuZ3RoOyB9O1xuICAgICAgICB2YXIgc2hvcnRlc3RQYXRoQ2FsY3VsYXRvciA9IG5ldyBzaG9ydGVzdHBhdGhzXzEuQ2FsY3VsYXRvcih0aGlzLnZlcnRzLmxlbmd0aCwgdGhpcy5wYXNzYWJsZUVkZ2VzLCBnZXRTb3VyY2UsIGdldFRhcmdldCwgZ2V0TGVuZ3RoKTtcbiAgICAgICAgdmFyIGJlbmRQZW5hbHR5ID0gZnVuY3Rpb24gKHUsIHYsIHcpIHtcbiAgICAgICAgICAgIHZhciBhID0gX3RoaXMudmVydHNbdV0sIGIgPSBfdGhpcy52ZXJ0c1t2XSwgYyA9IF90aGlzLnZlcnRzW3ddO1xuICAgICAgICAgICAgdmFyIGR4ID0gTWF0aC5hYnMoYy54IC0gYS54KSwgZHkgPSBNYXRoLmFicyhjLnkgLSBhLnkpO1xuICAgICAgICAgICAgaWYgKGEubm9kZSA9PT0gc291cmNlICYmIGEubm9kZSA9PT0gYi5ub2RlIHx8IGIubm9kZSA9PT0gdGFyZ2V0ICYmIGIubm9kZSA9PT0gYy5ub2RlKVxuICAgICAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICAgICAgcmV0dXJuIGR4ID4gMSAmJiBkeSA+IDEgPyAxMDAwIDogMDtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHNob3J0ZXN0UGF0aCA9IHNob3J0ZXN0UGF0aENhbGN1bGF0b3IuUGF0aEZyb21Ob2RlVG9Ob2RlV2l0aFByZXZDb3N0KHNvdXJjZS5wb3J0c1swXS5pZCwgdGFyZ2V0LnBvcnRzWzBdLmlkLCBiZW5kUGVuYWx0eSk7XG4gICAgICAgIHZhciBwYXRoUG9pbnRzID0gc2hvcnRlc3RQYXRoLnJldmVyc2UoKS5tYXAoZnVuY3Rpb24gKHZpKSB7IHJldHVybiBfdGhpcy52ZXJ0c1t2aV07IH0pO1xuICAgICAgICBwYXRoUG9pbnRzLnB1c2godGhpcy5ub2Rlc1t0YXJnZXQuaWRdLnBvcnRzWzBdKTtcbiAgICAgICAgcmV0dXJuIHBhdGhQb2ludHMuZmlsdGVyKGZ1bmN0aW9uICh2LCBpKSB7XG4gICAgICAgICAgICByZXR1cm4gIShpIDwgcGF0aFBvaW50cy5sZW5ndGggLSAxICYmIHBhdGhQb2ludHNbaSArIDFdLm5vZGUgPT09IHNvdXJjZSAmJiB2Lm5vZGUgPT09IHNvdXJjZVxuICAgICAgICAgICAgICAgIHx8IGkgPiAwICYmIHYubm9kZSA9PT0gdGFyZ2V0ICYmIHBhdGhQb2ludHNbaSAtIDFdLm5vZGUgPT09IHRhcmdldCk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgR3JpZFJvdXRlci5nZXRSb3V0ZVBhdGggPSBmdW5jdGlvbiAocm91dGUsIGNvcm5lcnJhZGl1cywgYXJyb3d3aWR0aCwgYXJyb3doZWlnaHQpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IHtcbiAgICAgICAgICAgIHJvdXRlcGF0aDogJ00gJyArIHJvdXRlWzBdWzBdLnggKyAnICcgKyByb3V0ZVswXVswXS55ICsgJyAnLFxuICAgICAgICAgICAgYXJyb3dwYXRoOiAnJ1xuICAgICAgICB9O1xuICAgICAgICBpZiAocm91dGUubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByb3V0ZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBsaSA9IHJvdXRlW2ldO1xuICAgICAgICAgICAgICAgIHZhciB4ID0gbGlbMV0ueCwgeSA9IGxpWzFdLnk7XG4gICAgICAgICAgICAgICAgdmFyIGR4ID0geCAtIGxpWzBdLng7XG4gICAgICAgICAgICAgICAgdmFyIGR5ID0geSAtIGxpWzBdLnk7XG4gICAgICAgICAgICAgICAgaWYgKGkgPCByb3V0ZS5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChNYXRoLmFicyhkeCkgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB4IC09IGR4IC8gTWF0aC5hYnMoZHgpICogY29ybmVycmFkaXVzO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgeSAtPSBkeSAvIE1hdGguYWJzKGR5KSAqIGNvcm5lcnJhZGl1cztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXN1bHQucm91dGVwYXRoICs9ICdMICcgKyB4ICsgJyAnICsgeSArICcgJztcbiAgICAgICAgICAgICAgICAgICAgdmFyIGwgPSByb3V0ZVtpICsgMV07XG4gICAgICAgICAgICAgICAgICAgIHZhciB4MCA9IGxbMF0ueCwgeTAgPSBsWzBdLnk7XG4gICAgICAgICAgICAgICAgICAgIHZhciB4MSA9IGxbMV0ueDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHkxID0gbFsxXS55O1xuICAgICAgICAgICAgICAgICAgICBkeCA9IHgxIC0geDA7XG4gICAgICAgICAgICAgICAgICAgIGR5ID0geTEgLSB5MDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFuZ2xlID0gR3JpZFJvdXRlci5hbmdsZUJldHdlZW4yTGluZXMobGksIGwpIDwgMCA/IDEgOiAwO1xuICAgICAgICAgICAgICAgICAgICB2YXIgeDIsIHkyO1xuICAgICAgICAgICAgICAgICAgICBpZiAoTWF0aC5hYnMoZHgpID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgeDIgPSB4MCArIGR4IC8gTWF0aC5hYnMoZHgpICogY29ybmVycmFkaXVzO1xuICAgICAgICAgICAgICAgICAgICAgICAgeTIgPSB5MDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHgyID0geDA7XG4gICAgICAgICAgICAgICAgICAgICAgICB5MiA9IHkwICsgZHkgLyBNYXRoLmFicyhkeSkgKiBjb3JuZXJyYWRpdXM7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdmFyIGN4ID0gTWF0aC5hYnMoeDIgLSB4KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN5ID0gTWF0aC5hYnMoeTIgLSB5KTtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnJvdXRlcGF0aCArPSAnQSAnICsgY3ggKyAnICcgKyBjeSArICcgMCAwICcgKyBhbmdsZSArICcgJyArIHgyICsgJyAnICsgeTIgKyAnICc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYXJyb3d0aXAgPSBbeCwgeV07XG4gICAgICAgICAgICAgICAgICAgIHZhciBhcnJvd2Nvcm5lcjEsIGFycm93Y29ybmVyMjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKE1hdGguYWJzKGR4KSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHggLT0gZHggLyBNYXRoLmFicyhkeCkgKiBhcnJvd2hlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFycm93Y29ybmVyMSA9IFt4LCB5ICsgYXJyb3d3aWR0aF07XG4gICAgICAgICAgICAgICAgICAgICAgICBhcnJvd2Nvcm5lcjIgPSBbeCwgeSAtIGFycm93d2lkdGhdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgeSAtPSBkeSAvIE1hdGguYWJzKGR5KSAqIGFycm93aGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgYXJyb3djb3JuZXIxID0gW3ggKyBhcnJvd3dpZHRoLCB5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFycm93Y29ybmVyMiA9IFt4IC0gYXJyb3d3aWR0aCwgeV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnJvdXRlcGF0aCArPSAnTCAnICsgeCArICcgJyArIHkgKyAnICc7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhcnJvd2hlaWdodCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5hcnJvd3BhdGggPSAnTSAnICsgYXJyb3d0aXBbMF0gKyAnICcgKyBhcnJvd3RpcFsxXSArICcgTCAnICsgYXJyb3djb3JuZXIxWzBdICsgJyAnICsgYXJyb3djb3JuZXIxWzFdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAnIEwgJyArIGFycm93Y29ybmVyMlswXSArICcgJyArIGFycm93Y29ybmVyMlsxXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBsaSA9IHJvdXRlWzBdO1xuICAgICAgICAgICAgdmFyIHggPSBsaVsxXS54LCB5ID0gbGlbMV0ueTtcbiAgICAgICAgICAgIHZhciBkeCA9IHggLSBsaVswXS54O1xuICAgICAgICAgICAgdmFyIGR5ID0geSAtIGxpWzBdLnk7XG4gICAgICAgICAgICB2YXIgYXJyb3d0aXAgPSBbeCwgeV07XG4gICAgICAgICAgICB2YXIgYXJyb3djb3JuZXIxLCBhcnJvd2Nvcm5lcjI7XG4gICAgICAgICAgICBpZiAoTWF0aC5hYnMoZHgpID4gMCkge1xuICAgICAgICAgICAgICAgIHggLT0gZHggLyBNYXRoLmFicyhkeCkgKiBhcnJvd2hlaWdodDtcbiAgICAgICAgICAgICAgICBhcnJvd2Nvcm5lcjEgPSBbeCwgeSArIGFycm93d2lkdGhdO1xuICAgICAgICAgICAgICAgIGFycm93Y29ybmVyMiA9IFt4LCB5IC0gYXJyb3d3aWR0aF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB5IC09IGR5IC8gTWF0aC5hYnMoZHkpICogYXJyb3doZWlnaHQ7XG4gICAgICAgICAgICAgICAgYXJyb3djb3JuZXIxID0gW3ggKyBhcnJvd3dpZHRoLCB5XTtcbiAgICAgICAgICAgICAgICBhcnJvd2Nvcm5lcjIgPSBbeCAtIGFycm93d2lkdGgsIHldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzdWx0LnJvdXRlcGF0aCArPSAnTCAnICsgeCArICcgJyArIHkgKyAnICc7XG4gICAgICAgICAgICBpZiAoYXJyb3doZWlnaHQgPiAwKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LmFycm93cGF0aCA9ICdNICcgKyBhcnJvd3RpcFswXSArICcgJyArIGFycm93dGlwWzFdICsgJyBMICcgKyBhcnJvd2Nvcm5lcjFbMF0gKyAnICcgKyBhcnJvd2Nvcm5lcjFbMV1cbiAgICAgICAgICAgICAgICAgICAgKyAnIEwgJyArIGFycm93Y29ybmVyMlswXSArICcgJyArIGFycm93Y29ybmVyMlsxXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gICAgcmV0dXJuIEdyaWRSb3V0ZXI7XG59KCkpO1xuZXhwb3J0cy5HcmlkUm91dGVyID0gR3JpZFJvdXRlcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSm1hV3hsSWpvaVozSnBaSEp2ZFhSbGNpNXFjeUlzSW5OdmRYSmpaVkp2YjNRaU9pSWlMQ0p6YjNWeVkyVnpJanBiSWk0dUx5NHVMMWRsWWtOdmJHRXZjM0pqTDJkeWFXUnliM1YwWlhJdWRITWlYU3dpYm1GdFpYTWlPbHRkTENKdFlYQndhVzVuY3lJNklqczdRVUZEUVN4NVEwRkJjVU03UVVGRGNrTXNLMEpCUVcxRU8wRkJRMjVFTEdsRVFVRXdRenRCUVV0MFF6dEpRVWxKTEhGQ1FVRnRRaXhGUVVGVkxFVkJRVk1zU1VGQlpTeEZRVUZUTEZGQlFXdENPMUZCUVRkRUxFOUJRVVVzUjBGQlJpeEZRVUZGTEVOQlFWRTdVVUZCVXl4VFFVRkpMRWRCUVVvc1NVRkJTU3hEUVVGWE8xRkJRVk1zWVVGQlVTeEhRVUZTTEZGQlFWRXNRMEZCVlR0UlFVTTFSU3hKUVVGSkxFTkJRVU1zU1VGQlNTeEhRVUZITEU5QlFVOHNVVUZCVVN4TFFVRkxMRmRCUVZjc1NVRkJTU3hSUVVGUkxFTkJRVU1zVFVGQlRTeExRVUZMTEVOQlFVTXNRMEZCUXp0SlFVTjZSU3hEUVVGRE8wbEJRMHdzYTBKQlFVTTdRVUZCUkN4RFFVRkRMRUZCVUVRc1NVRlBRenRCUVZCWkxHdERRVUZYTzBGQlVYaENPMGxCUTBrc1kwRkJiVUlzUlVGQlZTeEZRVUZUTEVOQlFWRXNSVUZCVXl4RFFVRlRMRVZCUVZNc1NVRkJkMElzUlVGQlV5eEpRVUZYTzFGQlFUVkRMSEZDUVVGQkxFVkJRVUVzVjBGQmQwSTdVVUZCVXl4eFFrRkJRU3hGUVVGQkxGZEJRVmM3VVVGQmJFY3NUMEZCUlN4SFFVRkdMRVZCUVVVc1EwRkJVVHRSUVVGVExFMUJRVU1zUjBGQlJDeERRVUZETEVOQlFVODdVVUZCVXl4TlFVRkRMRWRCUVVRc1EwRkJReXhEUVVGUk8xRkJRVk1zVTBGQlNTeEhRVUZLTEVsQlFVa3NRMEZCYjBJN1VVRkJVeXhUUVVGSkxFZEJRVW9zU1VGQlNTeERRVUZQTzBsQlFVY3NRMEZCUXp0SlFVTTNTQ3hYUVVGRE8wRkJRVVFzUTBGQlF5eEJRVVpFTEVsQlJVTTdRVUZHV1N4dlFrRkJTVHRCUVVscVFqdEpRVXRKTEd0RFFVRnRRaXhEUVVGTkxFVkJRVk1zUTBGQlRUdFJRVUZ5UWl4TlFVRkRMRWRCUVVRc1EwRkJReXhEUVVGTE8xRkJRVk1zVFVGQlF5eEhRVUZFTEVOQlFVTXNRMEZCU3p0UlFVTndReXhKUVVGSkxFVkJRVVVzUjBGQlJ5eDNRa0ZCZDBJc1EwRkJReXhUUVVGVExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTJ4RUxFbEJRVWtzUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zVDBGQlR5eEZRVUZGTEVOQlFVTTdVVUZET1VJc1NVRkJTU3hGUVVGRkxFZEJRVWNzZDBKQlFYZENMRU5CUVVNc1UwRkJVeXhEUVVGRExFTkJRVU1zUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXp0UlFVTnVSQ3hKUVVGSkxFVkJRVVVzUTBGQlF5eE5RVUZOTEVsQlFVa3NSVUZCUlN4RFFVRkRMRTFCUVUwc1JVRkJSVHRaUVVONFFpeEpRVUZKTEVOQlFVTXNUVUZCVFN4SFFVRkhMRVZCUVVVc1EwRkJReXhOUVVGTkxFTkJRVU03V1VGRGVFSXNTVUZCU1N4RFFVRkRMRVZCUVVVc1IwRkJSeXhGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETzFsQlEyaENMRWxCUVVrc1EwRkJReXhGUVVGRkxFZEJRVWNzUlVGQlJTeERRVUZETEVWQlFVVXNRMEZCUXp0WlFVTm9RaXhKUVVGSkxFTkJRVU1zVVVGQlVTeEhRVUZITEV0QlFVc3NRMEZCUXp0VFFVTjZRanRoUVVGTk8xbEJRMGdzU1VGQlNTeERRVUZETEUxQlFVMHNSMEZCUnl4RlFVRkZMRU5CUVVNc1RVRkJUU3hEUVVGRE8xbEJRM2hDTEVsQlFVa3NRMEZCUXl4RlFVRkZMRWRCUVVjc1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF6dFpRVU5vUWl4SlFVRkpMRU5CUVVNc1JVRkJSU3hIUVVGSExFTkJRVU1zUTBGQlF5eE5RVUZOTEVkQlFVY3NSVUZCUlN4RFFVRkRMRVZCUVVVc1IwRkJSeXhGUVVGRkxFTkJRVU1zVFVGQlRTeERRVUZETzFsQlEzWkRMRWxCUVVrc1EwRkJReXhSUVVGUkxFZEJRVWNzU1VGQlNTeERRVUZETzFOQlEzaENPMGxCUTB3c1EwRkJRenRKUVVOakxHdERRVUZUTEVkQlFYaENMRlZCUVRSQ0xFTkJRVTBzUlVGQlJTeERRVUZOTzFGQlEzUkRMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTTdVVUZEYWtJc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXp0UlFVTnFRaXhKUVVGSkxFdEJRVXNzUjBGQlJ5eEZRVUZGTEUxQlFVMHNSVUZCUlN4RFFVRkRMRVZCUVVVc1JVRkJSU3hGUVVGRkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVWQlFVVXNSVUZCUlN4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRE8xRkJRekZETEVsQlFVa3NRMEZCUXl4SFFVRkhMRWxCUVVrc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlEzSkNMRXRCUVVzc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFVkJRVVU3V1VGRGVFSXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFbEJRVWtzUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTNCQ0xFdEJRVXNzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTzJkQ1FVTjBRaXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVU3YjBKQlEyWXNTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhMUVVGTExFTkJRVU1zU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE8yOUNRVU5xUlN4SlFVRkpMRU5CUVVNc1IwRkJSeXhMUVVGTExFTkJRVU1zVFVGQlRTeEZRVUZGTzNkQ1FVTnNRaXhMUVVGTExFTkJRVU1zVFVGQlRTeEhRVUZITEVOQlFVTXNRMEZCUXp0M1FrRkRha0lzUzBGQlN5eERRVUZETEVWQlFVVXNSMEZCUnl4RFFVRkRMRWRCUVVjc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dDNRa0ZEY2tJc1MwRkJTeXhEUVVGRExFVkJRVVVzUjBGQlJ5eERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenR4UWtGRGVFSTdiMEpCUVVFc1EwRkJRenRwUWtGRFREczdiMEpCUVUwc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRUUVVNeFFqdFJRVU5FTEU5QlFVOHNTMEZCU3l4RFFVRkRPMGxCUTJwQ0xFTkJRVU03U1VGRFJDdzRRMEZCVnl4SFFVRllPMUZCUTBrc1QwRkJUeXhKUVVGSkxFTkJRVU1zVFVGQlRTeEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eExRVUZMTEVOQlFVTXNTVUZCU1N4RFFVRkRMRVZCUVVVc1JVRkJSU3hKUVVGSkxFTkJRVU1zUlVGQlJTeEhRVUZITEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETzBsQlEyaEdMRU5CUVVNN1NVRkRUQ3dyUWtGQlF6dEJRVUZFTEVOQlFVTXNRVUV6UTBRc1NVRXlRME03UVVFelExa3NORVJCUVhkQ08wRkJhVVJ5UXp0SlFYTkVTU3h2UWtGQmJVSXNZVUZCY1VJc1JVRkJSU3hSUVVFMFFpeEZRVUZUTEZsQlFYbENPMUZCUVhoSExHbENRV3RJUXp0UlFXeElPRVVzTmtKQlFVRXNSVUZCUVN4cFFrRkJlVUk3VVVGQmNrWXNhMEpCUVdFc1IwRkJZaXhoUVVGaExFTkJRVkU3VVVGQmRVTXNhVUpCUVZrc1IwRkJXaXhaUVVGWkxFTkJRV0U3VVVGeVJIaEhMRmRCUVUwc1IwRkJhMElzU1VGQlNTeERRVUZETzFGQmMwUjZRaXhKUVVGSkxFTkJRVU1zUzBGQlN5eEhRVUZITEdGQlFXRXNRMEZCUXl4SFFVRkhMRU5CUVVNc1ZVRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEpRVUZMTEU5QlFVRXNTVUZCU1N4WFFVRlhMRU5CUVVNc1EwRkJReXhGUVVGRkxGRkJRVkVzUTBGQlF5eFRRVUZUTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1VVRkJVU3hEUVVGRExGZEJRVmNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRnNSU3hEUVVGclJTeERRVUZETEVOQlFVTTdVVUZETjBjc1NVRkJTU3hEUVVGRExFMUJRVTBzUjBGQlJ5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRTFCUVUwc1EwRkJReXhWUVVGQkxFTkJRVU1zU1VGQlJ5eFBRVUZCTEVOQlFVTXNRMEZCUXl4SlFVRkpMRVZCUVU0c1EwRkJUU3hEUVVGRExFTkJRVU03VVVGRE5VTXNTVUZCU1N4RFFVRkRMRTFCUVUwc1IwRkJSeXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEUxQlFVMHNRMEZCUXl4VlFVRkJMRU5CUVVNc1NVRkJSeXhQUVVGQkxFTkJRVU1zUTBGQlF5eERRVUZETEVsQlFVa3NSVUZCVUN4RFFVRlBMRU5CUVVNc1EwRkJRenRSUVVNM1F5eEpRVUZKTEVOQlFVTXNTVUZCU1N4SFFVRkhMRWxCUVVrc1EwRkJReXhaUVVGWkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdVVUZEYmtNc1NVRkJTU3hEUVVGRExFbEJRVWtzUjBGQlJ5eEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE8xRkJSMjVETEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1QwRkJUeXhEUVVGRExGVkJRVUVzUTBGQlF6dFpRVU5xUWl4UFFVRkJMRU5CUVVNc1EwRkJReXhSUVVGUkxFTkJRVU1zVDBGQlR5eERRVUZETEZWQlFVRXNRMEZCUXl4SlFVRkhMRTlCUVVFc1MwRkJTU3hEUVVGRExFdEJRVXNzUTBGQlV5eERRVUZETEVOQlFVTXNRMEZCUXl4TlFVRk5MRWRCUVVjc1EwRkJReXhGUVVGb1F5eERRVUZuUXl4RFFVRkRPMUZCUVhoRUxFTkJRWGRFTEVOQlFVTXNRMEZCUXp0UlFVYzVSQ3hKUVVGSkxFTkJRVU1zU1VGQlNTeEhRVUZITEVWQlFVVXNVVUZCVVN4RlFVRkZMRVZCUVVVc1JVRkJSU3hEUVVGRE8xRkJRemRDTEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1QwRkJUeXhEUVVGRExGVkJRVUVzUTBGQlF6dFpRVU5vUWl4SlFVRkpMRTlCUVU4c1EwRkJReXhEUVVGRExFMUJRVTBzUzBGQlN5eFhRVUZYTEVWQlFVVTdaMEpCUTJwRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVkQlFVY3NTMEZCU1N4RFFVRkRMRWxCUVVrc1EwRkJRenRuUWtGRGNrSXNTMEZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJRenRoUVVOcVF6dFpRVTlFTEVOQlFVTXNRMEZCUXl4TFFVRkxMRWRCUVVjc1JVRkJSU3hEUVVGQk8xRkJRMmhDTEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUjBnc1NVRkJTU3hEUVVGRExGZEJRVmNzUjBGQlJ5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU4yUXl4SlFVRkpMRU5CUVVNc1YwRkJWeXhEUVVGRExFbEJRVWtzUTBGQlF5eFZRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRWxCUVVzc1QwRkJRU3hMUVVGSkxFTkJRVU1zVVVGQlVTeERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRXRCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFXNURMRU5CUVcxRExFTkJRVU1zUTBGQlF6dFJRVXR5UlN4SlFVRkpMR2xDUVVGcFFpeEhRVUZITEVsQlFVa3NRMEZCUXl4WFFVRlhMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEU5QlFVOHNSVUZCUlN4RFFVRkRMRTFCUVUwc1EwRkJReXhWUVVGQkxFTkJRVU1zU1VGQlJ5eFBRVUZCTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWxCUVVrc1JVRkJVQ3hEUVVGUExFTkJRVU1zUTBGQlF6dFJRVU5vUml4cFFrRkJhVUlzUTBGQlF5eFBRVUZQTEVOQlFVTXNWVUZCUVN4RFFVRkRPMWxCUTNaQ0xFbEJRVWtzUTBGQlF5eEhRVUZITEhGQ1FVRlRMRU5CUVVNc1MwRkJTeXhGUVVGRkxFTkJRVU03V1VGRE1VSXNRMEZCUXl4RFFVRkRMRkZCUVZFc1EwRkJReXhQUVVGUExFTkJRVU1zVlVGQlFTeERRVUZETEVsQlFVY3NUMEZCUVN4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFdEJRVXNzUTBGQlF5eExRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eEZRVUV2UWl4RFFVRXJRaXhEUVVGRExFTkJRVU03V1VGRGVFUXNRMEZCUXl4RFFVRkRMRWxCUVVrc1IwRkJSeXhEUVVGRExFTkJRVU1zVDBGQlR5eERRVUZETEV0QlFVa3NRMEZCUXl4WlFVRlpMRU5CUVVNc1EwRkJRenRSUVVNeFF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVVklMRWxCUVVrc1QwRkJUeXhIUVVGSExFbEJRVWtzUTBGQlF5eFRRVUZUTEVOQlFVTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zVlVGQlFTeERRVUZETEVsQlFVY3NUMEZCUVN4RFFVRkRMRU5CUVVNc1IwRkJSeXhGUVVGTUxFTkJRVXNzUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEZGtRc1NVRkJTU3hQUVVGUExFZEJRVWNzU1VGQlNTeERRVUZETEZOQlFWTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eFZRVUZCTEVOQlFVTXNTVUZCUnl4UFFVRkJMRU5CUVVNc1EwRkJReXhIUVVGSExFVkJRVXdzUTBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVZDJSQ3hKUVVGSkxFbEJRVWtzUjBGQlJ5eFBRVUZQTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1NVRkJTU3hIUVVGSExFOUJRVThzUTBGQlF5eFBRVUZQTEVOQlFVTXNUVUZCVFN4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRekZFTEVsQlFVa3NTVUZCU1N4SFFVRkhMRTlCUVU4c1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeEpRVUZKTEVkQlFVY3NUMEZCVHl4RFFVRkRMRTlCUVU4c1EwRkJReXhOUVVGTkxFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTTdVVUZITVVRc1NVRkJTU3hOUVVGTkxFZEJRVWNzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1ZVRkJRU3hEUVVGRExFbEJRVWNzVDBGQlFTeERRVUZMTEVWQlFVVXNSVUZCUlN4RlFVRkZMRWxCUVVrc1JVRkJSU3hGUVVGRkxFVkJRVVVzU1VGQlNTeEZRVUZGTEVWQlFVVXNSVUZCUlN4RFFVRkRMRU5CUVVNc1IwRkJSeXhGUVVGRkxFVkJRVVVzUlVGQlJTeERRVUZETEVOQlFVTXNSMEZCUnl4RlFVRkZMRU5CUVVFc1JVRkJha1FzUTBGQmFVUXNRMEZCUXp0aFFVTTFSU3hOUVVGTkxFTkJRVU1zVDBGQlR5eERRVUZETEVkQlFVY3NRMEZCUXl4VlFVRkJMRU5CUVVNc1NVRkJSeXhQUVVGQkxFTkJRVXNzUlVGQlJTeEZRVUZGTEVWQlFVVXNTVUZCU1N4RlFVRkZMRVZCUVVVc1JVRkJSU3hKUVVGSkxFVkJRVVVzUlVGQlJTeEZRVUZGTEVOQlFVTXNSVUZCUlN4RlFVRkZMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVUVzUlVGQmVrTXNRMEZCZVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGSGVFVXNTVUZCU1N4TlFVRk5MRWRCUVVjc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNWVUZCUVN4RFFVRkRMRWxCUVVjc1QwRkJRU3hEUVVGTExFVkJRVVVzUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXl4SFFVRkhMRVZCUVVVc1JVRkJSU3hGUVVGRkxFTkJRVU1zUTBGQlF5eEhRVUZITEVWQlFVVXNSVUZCUlN4RlFVRkZMRWxCUVVrc1JVRkJSU3hGUVVGRkxFVkJRVVVzU1VGQlNTeEZRVUZGTEVOQlFVRXNSVUZCYWtRc1EwRkJhVVFzUTBGQlF6dGhRVU0xUlN4TlFVRk5MRU5CUVVNc1QwRkJUeXhEUVVGRExFZEJRVWNzUTBGQlF5eFZRVUZCTEVOQlFVTXNTVUZCUnl4UFFVRkJMRU5CUVVzc1JVRkJSU3hGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTEVWQlFVVXNSVUZCUlN4RFFVRkRMRVZCUVVVc1JVRkJSU3hGUVVGRkxFbEJRVWtzUlVGQlJTeEZRVUZGTEVWQlFVVXNTVUZCU1N4RlFVRkZMRU5CUVVFc1JVRkJla01zUTBGQmVVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkhlRVVzU1VGQlNTeExRVUZMTEVkQlFVY3NUVUZCVFN4RFFVRkRMRTFCUVUwc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF6dFJRVWRzUXl4TFFVRkxMRU5CUVVNc1QwRkJUeXhEUVVGRExGVkJRVUVzUTBGQlF5eEpRVUZITEU5QlFVRXNRMEZCUXl4RFFVRkRMRXRCUVVzc1IwRkJSeXhGUVVGRkxFVkJRVm9zUTBGQldTeERRVUZETEVOQlFVTTdVVUZIYUVNc1NVRkJTU3hEUVVGRExFdEJRVXNzUjBGQlJ5eEZRVUZGTEVOQlFVTTdVVUZEYUVJc1NVRkJTU3hEUVVGRExFdEJRVXNzUjBGQlJ5eEZRVUZGTEVOQlFVTTdVVUZIYUVJc1RVRkJUU3hEUVVGRExFOUJRVThzUTBGQlF5eFZRVUZCTEVOQlFVTTdXVUZEV2l4UFFVRkJMRTFCUVUwc1EwRkJReXhQUVVGUExFTkJRVU1zVlVGQlFTeERRVUZETzJkQ1FVTmFMRWxCUVVrc1EwRkJReXhIUVVGSExFbEJRVWtzU1VGQlNTeERRVUZETEV0QlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1RVRkJUU3hGUVVGRkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRE8yZENRVU5vUkN4RFFVRkRMRU5CUVVNc1MwRkJTeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0blFrRkRhRUlzUTBGQlF5eERRVUZETEV0QlFVc3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03WjBKQlEyaENMRXRCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVkdVFpeEpRVUZKTEVOQlFVTXNSMEZCUnl4TFFVRkpMRU5CUVVNc1YwRkJWeXhEUVVGRExFMUJRVTBzUTBGQlF6dG5Ra0ZEYUVNc1QwRkJUeXhEUVVGRExFVkJRVVVzUjBGQlJ5eERRVUZETEVWQlFVVTdiMEpCUTFvc1NVRkJTU3hKUVVGSkxFZEJRVWNzUzBGQlNTeERRVUZETEZkQlFWY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkRNVUlzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNN2IwSkJRMnhDTEVsQlFVa3NSVUZCUlN4SFFVRkhMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU1zUlVGRE0wSXNSVUZCUlN4SFFVRkhMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU1zUTBGQlF6dHZRa0ZEYUVNc1NVRkJTU3hGUVVGRkxFZEJRVWNzUTBGQlF5eERRVUZETEV0QlFVc3NSVUZCUlN4SFFVRkhMRU5CUVVNc1NVRkJTU3hGUVVGRkxFZEJRVWNzUTBGQlF5eERRVUZETEUxQlFVMHNSVUZCUlN4SFFVRkhMRU5CUVVNc1JVRkJSVHQzUWtGRGNrTXNRMEZCUlN4RFFVRkRMRWxCUVVrc1IwRkJSeXhKUVVGSkxFTkJRVU03ZDBKQlEzSkNMRTFCUVUwN2NVSkJRMVE3YVVKQlEwbzdXVUZEVEN4RFFVRkRMRU5CUVVNN1VVRnNRa1lzUTBGclFrVXNRMEZEUkN4RFFVRkRPMUZCUlU0c1MwRkJTeXhEUVVGRExFOUJRVThzUTBGQlF5eFZRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZPMWxCUldoQ0xFdEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVVNc1EwRkJReXhGUVVGRkxFTkJRVU03WjBKQlEzQkNMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zYVVKQlFXbENMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUlVGQlJTeERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGRExGTkJRVk1zUlVGQlJTeERRVUZETzI5Q1FVVnNSU3hKUVVGSkxFTkJRVU1zUjBGQlJ5eEpRVUZKTEVsQlFVa3NRMEZCUXl4TFFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFMUJRVTBzUlVGQlJTeFRRVUZUTEVOQlFVTXNRMEZCUXl4RlFVRkZMRk5CUVZNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMjlDUVVOd1JTeExRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dHZRa0ZEYmtJc1EwRkJReXhEUVVGRExFdEJRVXNzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN2IwSkJRMmhDTEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzJkQ1FVTndRaXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU5RTEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUjBnc1NVRkJTU3hQUVVGUExFZEJRVWNzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hIUVVGSExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4SFFVRkhMRU5CUVVNN1dVRkRNVU1zU1VGQlNTeExRVUZMTEVkQlFVY3NWVUZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhKUVVGTExFOUJRVUVzVDBGQlR5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCTDBJc1EwRkJLMElzUTBGQlF6dFpRVU4wUkN4RFFVRkRMRU5CUVVNc1MwRkJTeXhEUVVGRExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXp0WlFVTndRaXhMUVVGTExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFdEJRVXNzUTBGQlF5eE5RVUZOTEVWQlFVVXNRMEZCUXl4RlFVRkZMRVZCUVVVN1owSkJRM0pETEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVOMlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4SlFVRkpMRWxCUVVrc1EwRkJReXhEUVVGRExFbEJRVWtzUzBGQlN5eERRVUZETEVOQlFVTXNTVUZCU1N4SlFVRkpMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNUdHZRa0ZCUlN4VFFVRlRPMmRDUVVONlJDeExRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRWxCUVVrc1EwRkJReXhGUVVGRkxFMUJRVTBzUlVGQlJTeERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZMRTFCUVUwc1JVRkJSU3hEUVVGRExFTkJRVU1zUlVGQlJTeEZRVUZGTEUxQlFVMHNSVUZCUlN4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU03WVVGRGJFWTdVVUZEVEN4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVsUUxFTkJRVU03U1VFMVNrOHNkMEpCUVVjc1IwRkJXQ3hWUVVGWkxFTkJRVU1zU1VGQlNTeFBRVUZQTEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1ZVRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEpRVUZMTEU5QlFVRXNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJUQ3hEUVVGTExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkJMRU5CUVVNc1EwRkJRenRKUVVsMFJDeHBRMEZCV1N4SFFVRndRaXhWUVVGeFFpeEpRVUZKTzFGQlEzSkNMRWxCUVVrc1QwRkJUeXhIUVVGSExFVkJRVVVzUTBGQlF6dFJRVU5xUWl4SlFVRkpMRVZCUVVVc1IwRkJSeXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRVZCUVVVc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXp0UlFVTnNSQ3hQUVVGUExFVkJRVVVzUTBGQlF5eE5RVUZOTEVkQlFVY3NRMEZCUXl4RlFVRkZPMWxCUld4Q0xFbEJRVWtzVjBGQlZ5eEhRVUZITEVWQlFVVXNRMEZCUXl4TlFVRk5MRU5CUVVNc1ZVRkJRU3hEUVVGRExFbEJRVWNzVDBGQlFTeERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRk5CUVZNc1IwRkJSeXhKUVVGSkxFTkJRVU1zVjBGQlZ5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVWQlFXeEVMRU5CUVd0RUxFTkJRVU1zUTBGQlF6dFpRVU53Uml4SlFVRkpMRWRCUVVjc1IwRkJSenRuUWtGRFRpeExRVUZMTEVWQlFVVXNWMEZCVnp0blFrRkRiRUlzUjBGQlJ5eEZRVUZGTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1YwRkJWeXhEUVVGRExFZEJRVWNzUTBGQlF5eFZRVUZCTEVOQlFVTXNTVUZCUnl4UFFVRkJMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eEhRVUZITEVsQlFVa3NRMEZCUXl4RlFVRkZMRVZCUVhCQ0xFTkJRVzlDTEVOQlFVTXNRMEZCUXp0aFFVTXpSQ3hEUVVGRE8xbEJRMFlzVDBGQlR5eERRVUZETEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRaUVVOc1FpeEhRVUZITEVOQlFVTXNTMEZCU3l4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGQkxFTkJRVU1zU1VGQlJ5eFBRVUZCTEVWQlFVVXNRMEZCUXl4TlFVRk5MRU5CUVVNc1JVRkJSU3hEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1JVRkJNMElzUTBGQk1rSXNRMEZCUXl4RFFVRkRPMU5CUTNSRU8xRkJRMFFzVDBGQlR5eERRVUZETEVsQlFVa3NRMEZCUXl4VlFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFbEJRVXNzVDBGQlFTeERRVUZETEVOQlFVTXNSMEZCUnl4SFFVRkhMRU5CUVVNc1EwRkJReXhIUVVGSExFVkJRV0lzUTBGQllTeERRVUZETEVOQlFVRTdVVUZEY2tNc1QwRkJUeXhQUVVGUExFTkJRVU03U1VGRGJrSXNRMEZCUXp0SlFVZFBMRFpDUVVGUkxFZEJRV2hDTEZWQlFXbENMRU5CUVVNN1VVRkRaQ3hKUVVGSkxFdEJRVXNzUjBGQlJ5eERRVUZETEVOQlFVTTdVVUZEWkN4UFFVRlBMRU5CUVVNc1EwRkJReXhOUVVGTkxFdEJRVXNzU1VGQlNTeERRVUZETEVsQlFVa3NSVUZCUlR0WlFVTXpRaXhMUVVGTExFVkJRVVVzUTBGQlF6dFpRVU5TTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRE8xTkJRMmhDTzFGQlEwUXNUMEZCVHl4TFFVRkxMRU5CUVVNN1NVRkRha0lzUTBGQlF6dEpRVWRQTERoQ1FVRlRMRWRCUVdwQ0xGVkJRV3RDTEVOQlFVTTdVVUZEWml4SlFVRkpMRWRCUVVjc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRM1JDTEVsQlFVa3NTVUZCU1N4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVkQlFVY3NSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVNMVFpeExRVUZMTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEUxQlFVMHNSVUZCUlN4RFFVRkRMRVZCUVVVc1JVRkJSVHRaUVVNdlFpeEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXp0VFFVTndRenRSUVVORUxFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhOUVVGTkxFZEJRVWNzUTBGQlF5eERRVUZETEVkQlFVY3NSMEZCUnl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRM0pETEU5QlFVOHNTVUZCU1N4RFFVRkRPMGxCUTJoQ0xFTkJRVU03U1VGMVNFOHNaME5CUVZjc1IwRkJia0lzVlVGQmIwSXNRMEZCUXp0UlFVTnFRaXhKUVVGSkxFOUJRVThzUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTJ4Q0xFZEJRVWM3V1VGRFF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJRenRaUVVOaUxFOUJRVThzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1UwRkRia0lzVVVGQlVTeERRVUZETEV0QlFVc3NTVUZCU1N4RFFVRkRMRWxCUVVrc1JVRkJSVHRSUVVNeFFpeFBRVUZQTEU5QlFVOHNRMEZCUXl4UFFVRlBMRVZCUVVVc1EwRkJRenRKUVVNM1FpeERRVUZETzBsQlIwOHNORU5CUVhWQ0xFZEJRUzlDTEZWQlFXZERMRU5CUVVNc1JVRkJSU3hEUVVGRE8xRkJRMmhETEVsQlFVa3NSVUZCUlN4SFFVRkhMRWxCUVVrc1EwRkJReXhYUVVGWExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNSVUZCUlN4SFFVRkhMRWxCUVVrc1EwRkJReXhYUVVGWExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRSUVVNNVJDeFBRVUZQTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1MwRkJTeXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzFsQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNN1VVRkZOVUlzVDBGQlR5eEZRVUZGTEdOQlFXTXNSVUZCUlN4RlFVRkZMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eEZRVUZGTEZGQlFWRXNSVUZCUlN4RlFVRkZMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4RlFVRkZMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXp0SlFVTndSaXhEUVVGRE8wbEJTVVFzY1VOQlFXZENMRWRCUVdoQ0xGVkJRV2xDTEVOQlFVTXNSVUZCUlN4RFFVRkRPMUZCUVhKQ0xHbENRVmRETzFGQlZrY3NTVUZCU1N4SlFVRkpMRWRCUVVjc1NVRkJTU3hEUVVGRExIVkNRVUYxUWl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU01UXl4SlFVRkpMR0ZCUVdFc1IwRkJSeXhGUVVGRkxFTkJRVU03VVVGRGRrSXNTVUZCU1N4RFFVRkRMRkZCUVZFc1EwRkJReXhQUVVGUExFTkJRVU1zVlVGQlFTeERRVUZETEVsQlFVY3NUMEZCUVN4aFFVRmhMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEVWQlFVVXNSVUZCZUVJc1EwRkJkMElzUTBGQlF5eERRVUZETzFGQlEzQkVMRWxCUVVrc1UwRkJVeXhIUVVGSExFbEJRVWtzUTBGQlF5eGpRVUZqTEVOQlFVTXNVVUZCVVN4RFFVRkRMRTFCUVUwc1EwRkJReXhWUVVGQkxFTkJRVU1zU1VGQlJ5eFBRVUZCTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWxCUVVrc1lVRkJZU3hEUVVGRExFVkJRWEpDTEVOQlFYRkNMRU5CUVVNc1EwRkJRenRSUVVVdlJTeEpRVUZKTEVOQlFVTXNVVUZCVVR0aFFVTlNMRTFCUVUwc1EwRkJReXhWUVVGQkxFTkJRVU1zU1VGQlJ5eFBRVUZCTEVOQlFVTXNRMEZCUXl4TlFVRk5MRXRCUVVzc1NVRkJTU3hEUVVGRExHTkJRV01zUlVGQmFFTXNRMEZCWjBNc1EwRkJRenRoUVVNMVF5eFBRVUZQTEVOQlFVTXNWVUZCUVN4RFFVRkRMRWxCUVVjc1QwRkJRU3hUUVVGVExFZEJRVWNzVTBGQlV5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExGRkJRVkVzUTBGQlF5eE5RVUZOTEVOQlFVTXNWVUZCUVN4RFFVRkRMRWxCUVVjc1QwRkJRU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVWQlFVVXNSVUZCVml4RFFVRlZMRU5CUVVNc1EwRkJReXhGUVVGMFJTeERRVUZ6UlN4RFFVRkRMRU5CUVVNN1VVRkZla1lzVDBGQlR5eFRRVUZUTEVOQlFVTXNSMEZCUnl4RFFVRkRMRlZCUVVFc1EwRkJReXhKUVVGSExFOUJRVUVzUzBGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJZaXhEUVVGaExFTkJRVU1zUTBGQlF6dEpRVU0xUXl4RFFVRkRPMGxCU1Uwc2VVSkJRV01zUjBGQmNrSXNWVUZCYzBJc1RVRkJUU3hGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETzFGQlJUbENMRWxCUVVrc1UwRkJVeXhIUVVGSExFVkJRVVVzUTBGQlF6dFJRVU51UWl4TFFVRkxMRWxCUVVrc1JVRkJSU3hIUVVGSExFTkJRVU1zUlVGQlJTeEZRVUZGTEVkQlFVY3NUVUZCVFN4RFFVRkRMRTFCUVUwc1JVRkJSU3hGUVVGRkxFVkJRVVVzUlVGQlJUdFpRVU4yUXl4SlFVRkpMRXRCUVVzc1IwRkJSeXhOUVVGTkxFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTTdXVUZEZGtJc1MwRkJTeXhKUVVGSkxFVkJRVVVzUjBGQlJ5eERRVUZETEVWQlFVVXNSVUZCUlN4SFFVRkhMRXRCUVVzc1EwRkJReXhOUVVGTkxFVkJRVVVzUlVGQlJTeEZRVUZGTEVWQlFVVTdaMEpCUTNSRExFbEJRVWtzUTBGQlF5eEhRVUZSTEV0QlFVc3NRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJRenRuUWtGRGRrSXNRMEZCUXl4RFFVRkRMRTFCUVUwc1IwRkJSeXhGUVVGRkxFTkJRVU03WjBKQlEyUXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhGUVVGRkxFTkJRVU03WjBKQlExUXNTVUZCU1N4SFFVRkhMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0blFrRkROVUlzU1VGQlNTeEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1EwRkJReXhIUVVGSExFZEJRVWNzUlVGQlJUdHZRa0ZEY2tJc1UwRkJVeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0cFFrRkRja0k3WVVGRFNqdFRRVU5LTzFGQlEwUXNVMEZCVXl4RFFVRkRMRWxCUVVrc1EwRkJReXhWUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVsQlFVc3NUMEZCUVN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZxUWl4RFFVRnBRaXhEUVVGRExFTkJRVU03VVVGSE5VTXNTVUZCU1N4WlFVRlpMRWRCUVVjc1JVRkJSU3hEUVVGRE8xRkJRM1JDTEVsQlFVa3NWVUZCVlN4SFFVRkhMRWxCUVVrc1EwRkJRenRSUVVOMFFpeExRVUZMTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzVTBGQlV5eERRVUZETEUxQlFVMHNSVUZCUlN4RFFVRkRMRVZCUVVVc1JVRkJSVHRaUVVOMlF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4VFFVRlRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGNrSXNTVUZCU1N4RFFVRkRMRlZCUVZVc1NVRkJTU3hKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eFZRVUZWTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1IwRkJSeXhGUVVGRk8yZENRVU42UkN4VlFVRlZMRWRCUVVjc1JVRkJSU3hIUVVGSExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxGRkJRVkVzUlVGQlJTeEZRVUZGTEVWQlFVVXNRMEZCUXp0blFrRkROVU1zV1VGQldTeERRVUZETEVsQlFVa3NRMEZCUXl4VlFVRlZMRU5CUVVNc1EwRkJRenRoUVVOcVF6dFpRVU5FTEZWQlFWVXNRMEZCUXl4UlFVRlJMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFOQlF5OUNPMUZCUTBRc1QwRkJUeXhaUVVGWkxFTkJRVU03U1VGRGVFSXNRMEZCUXp0SlFWTk5MRzlDUVVGVExFZEJRV2hDTEZWQlFXbENMRU5CUVZNc1JVRkJSU3hEUVVGVExFVkJRVVVzVFVGQlRTeEZRVUZGTEZGQlFWRXNSVUZCUlN4TlFVRk5MRVZCUVVVc1IwRkJWenRSUVVONFJTeEpRVUZKTEVOQlFVTXNSMEZCUnl4UlFVRlJMRU5CUVVNc1RVRkJUU3hEUVVGRE8xRkJRM2hDTEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNN1dVRkJSU3hQUVVGUE8xRkJRMjVDTEVsQlFVa3NSVUZCUlN4SFFVRkhMRkZCUVZFc1EwRkJReXhIUVVGSExFTkJRVU1zVlVGQlFTeERRVUZETEVsQlFVa3NUMEZCUVN4SlFVRkpMR1ZCUVZFc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJja0lzUTBGQmNVSXNRMEZCUXl4RFFVRkRPMUZCUTJ4RUxFbEJRVWtzUlVGQlJTeEhRVUZITEVWQlFVVXNRMEZCUXp0UlFVTmFMRXRCUVVzc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFVkJRVVU3V1VGRGVFSXNTMEZCU3l4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1JVRkJSVHRuUWtGRGVFSXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJRenR2UWtGQlJTeFRRVUZUTzJkQ1FVTjBRaXhKUVVGSkxFVkJRVVVzUjBGQlJ5eFJRVUZSTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUTJoQ0xFVkJRVVVzUjBGQlJ5eFJRVUZSTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUTJoQ0xFVkJRVVVzUjBGQlJ5eEZRVUZGTEVOQlFVTXNUVUZCVFN4RlFVTmtMRVZCUVVVc1IwRkJSeXhGUVVGRkxFTkJRVU1zVFVGQlRTeEZRVU5rTEVsQlFVa3NSMEZCUnl4RFFVRkRMRU5CUVVNc1JVRkRWQ3hKUVVGSkxFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTTdaMEpCVFdRc1NVRkJTU3hEUVVGRExFbEJRVWtzUjBGQlJ5eEZRVUZGTzI5Q1FVTldMRWxCUVVrc1RVRkJUU3hEUVVGRExFVkJRVVVzUlVGQlJTeEZRVUZGTEVOQlFVTXNSVUZCUlR0M1FrRkZhRUlzU1VGQlNTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRk96UkNRVU55UWl4SlFVRkpMRWRCUVVjc1EwRkJReXhGUVVGRkxFbEJRVWtzUjBGQlJ5eERRVUZETEVOQlFVTTdlVUpCUTNSQ096WkNRVUZOT3pSQ1FVTklMRWxCUVVrc1IwRkJSeXhEUVVGRExFVkJRVVVzU1VGQlNTeEhRVUZITEVOQlFVTXNRMEZCUXp0NVFrRkRkRUk3Y1VKQlEwbzdhVUpCUTBvN2NVSkJRVTA3YjBKQlEwZ3NTVUZCU1N4TlFVRk5MRU5CUVVNc1JVRkJSU3hGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTzNkQ1FVTm9RaXhKUVVGSkxFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVN05FSkJRM0pDTEVsQlFVa3NSMEZCUnl4RFFVRkRMRVZCUVVVc1NVRkJTU3hIUVVGSExFTkJRVU1zUTBGQlF6dDVRa0ZEZEVJN05rSkJRVTA3TkVKQlEwZ3NTVUZCU1N4SFFVRkhMRU5CUVVNc1JVRkJSU3hKUVVGSkxFZEJRVWNzUTBGQlF5eERRVUZETzNsQ1FVTjBRanR4UWtGRFNqdHBRa0ZEU2p0blFrRkRSQ3hKUVVGSkxFbEJRVWtzU1VGQlNTeERRVUZETEVWQlFVVTdiMEpCUlZnc1JVRkJSU3hEUVVGRExFbEJRVWtzUTBGQlF5eEpRVUZKTEdsQ1FVRlZMRU5CUVVNc1JVRkJSU3hEUVVGRExFbEJRVWtzUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXl4SlFVRkpMRU5CUVVNc1JVRkJSU3hIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETzJsQ1FVTndSRHRoUVVOS08xTkJRMG83VVVGRFJDeEpRVUZKTEUxQlFVMHNSMEZCUnl4SlFVRkpMR0ZCUVUwc1EwRkJReXhGUVVGRkxFVkJRVVVzUlVGQlJTeERRVUZETEVOQlFVTTdVVUZEYUVNc1RVRkJUU3hEUVVGRExFdEJRVXNzUlVGQlJTeERRVUZETzFGQlEyWXNSVUZCUlN4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETzFsQlExb3NTVUZCU1N4RFFVRkRMRWRCUVVjc1VVRkJVU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFsQlEzQkNMRWxCUVVrc1IwRkJSeXhIUVVGSExFTkJRVU1zUTBGQlF5eFJRVUZSTEVWQlFVVXNRMEZCUXp0WlFVTjJRaXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRWRCUVVjc1EwRkJRenRaUVVONFFpeEpRVUZKTEV0QlFVc3NSMEZCUnl4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETzFsQlF6ZENMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETzJkQ1FVRkZMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVkQlFVY3NRMEZCUXp0WlFVTjRReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NTMEZCU3l4RFFVRkRMRTFCUVUwc1IwRkJSeXhEUVVGRE8yZENRVUZGTEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFZEJRVWNzUTBGQlF6dFJRVU16UkN4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVOUUxFTkJRVU03U1VGRlRTeDNRa0ZCWVN4SFFVRndRaXhWUVVGeFFpeE5RVUZOTEVWQlFVVXNRMEZCVXl4RlFVRkZMRU5CUVZNc1JVRkJSU3hOUVVFeVF5eEZRVUZGTEVkQlFWYzdVVUZEZGtjc1NVRkJTU3haUVVGWkxFZEJRVWNzVlVGQlZTeERRVUZETEdOQlFXTXNRMEZCUXl4TlFVRk5MRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzFGQlJUTkVMRXRCUVVzc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4WlFVRlpMRU5CUVVNc1RVRkJUU3hGUVVGRkxFTkJRVU1zUlVGQlJTeEZRVUZGTzFsQlF6RkRMRWxCUVVrc1JVRkJSU3hIUVVGSExGbEJRVmtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTjZRaXhKUVVGSkxFMUJRVTBzUjBGQlJ5eEZRVUZGTEVOQlFVTTdXVUZEYUVJc1MwRkJTeXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRVZCUVVVc1EwRkJReXhSUVVGUkxFTkJRVU1zVFVGQlRTeEZRVUZGTEVOQlFVTXNSVUZCUlN4RlFVRkZPMmRDUVVONlF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RlFVRkZMRU5CUVVNc1VVRkJVU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzJkQ1FVTjJRaXhOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEVWQlFVVXNTVUZCU1N4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVkQlFVY3NSVUZCUlN4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU03WjBKQlEyaEZMRTFCUVUwc1EwRkJReXhKUVVGSkxFTkJRVU1zUlVGQlJTeEpRVUZKTEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzUjBGQlJ5eEZRVUZGTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJRenRoUVVOdVJUdFpRVU5FTEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNc1ZVRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEpRVUZMTEU5QlFVRXNRMEZCUXl4RFFVRkRMRWRCUVVjc1IwRkJSeXhEUVVGRExFTkJRVU1zUjBGQlJ5eEhRVUZITEVOQlFVTXNRMEZCUXl4SlFVRkpMRWRCUVVjc1EwRkJReXhEUVVGRExFbEJRVWtzUlVGQkwwSXNRMEZCSzBJc1EwRkJReXhEUVVGRE8xbEJRM1pFTEVsQlFVa3NTVUZCU1N4SFFVRkhMRVZCUVVVc1EwRkJRenRaUVVOa0xFbEJRVWtzVTBGQlV5eEhRVUZITEVOQlFVTXNRMEZCUXp0WlFVTnNRaXhOUVVGTkxFTkJRVU1zVDBGQlR5eERRVUZETEZWQlFVRXNRMEZCUXp0blFrRkRXaXhKUVVGSkxFTkJRVU1zUTBGQlF5eEpRVUZKTEV0QlFVc3NRMEZCUXl4RlFVRkZPMjlDUVVOa0xFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8yOUNRVU5tTEZOQlFWTXNSVUZCUlN4RFFVRkRPMmxDUVVObU8zRkNRVUZOTzI5Q1FVTklMRk5CUVZNc1JVRkJSU3hEUVVGRE8ybENRVU5tTzJkQ1FVTkVMRWxCUVVrc1UwRkJVeXhKUVVGSkxFTkJRVU1zUlVGQlJUdHZRa0ZEYUVJc1ZVRkJWU3hEUVVGRExGTkJRVk1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRTFCUVUwc1JVRkJSU3hKUVVGSkxFVkJRVVVzVFVGQlRTeEZRVUZGTEVkQlFVY3NRMEZCUXl4RFFVRkRPMjlDUVVOMFJDeEpRVUZKTEVkQlFVY3NSVUZCUlN4RFFVRkRPMmxDUVVOaU8xbEJRMHdzUTBGQlF5eERRVUZETEVOQlFVTTdVMEZEVGp0SlFVTk1MRU5CUVVNN1NVRlRSQ3dyUWtGQlZTeEhRVUZXTEZWQlFXbENMRXRCUVdFc1JVRkJSU3hSUVVGblFpeEZRVUZGTEUxQlFUSkNMRVZCUVVVc1RVRkJNa0k3VVVGQk1VY3NhVUpCVVVNN1VVRlFSeXhKUVVGSkxGVkJRVlVzUjBGQlJ5eExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRlZCUVVFc1EwRkJReXhKUVVGSExFOUJRVUVzUzBGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVdoRExFTkJRV2RETEVOQlFVTXNRMEZCUXp0UlFVTnFSU3hKUVVGSkxFdEJRVXNzUjBGQlJ5eFZRVUZWTEVOQlFVTXNWVUZCVlN4RFFVRkRMRlZCUVZVc1EwRkJReXhEUVVGRE8xRkJRemxETEVsQlFVa3NUVUZCVFN4SFFVRkhMRlZCUVZVc1EwRkJReXhIUVVGSExFTkJRVU1zVlVGQlZTeERRVUZETEVsQlFVa3NUMEZCVHl4VlFVRlZMRU5CUVVNc1dVRkJXU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRha1lzVlVGQlZTeERRVUZETEdGQlFXRXNRMEZCUXl4TlFVRk5MRVZCUVVVc1IwRkJSeXhGUVVGRkxFZEJRVWNzUlVGQlJTeExRVUZMTEVWQlFVVXNVVUZCVVN4RFFVRkRMRU5CUVVNN1VVRkROVVFzVlVGQlZTeERRVUZETEdGQlFXRXNRMEZCUXl4TlFVRk5MRVZCUVVVc1IwRkJSeXhGUVVGRkxFZEJRVWNzUlVGQlJTeExRVUZMTEVWQlFVVXNVVUZCVVN4RFFVRkRMRU5CUVVNN1VVRkROVVFzVlVGQlZTeERRVUZETEdOQlFXTXNRMEZCUXl4TlFVRk5MRVZCUVVVc1ZVRkJWU3hEUVVGRExFTkJRVU03VVVGRE9VTXNUMEZCVHl4TlFVRk5MRU5CUVVNN1NVRkRiRUlzUTBGQlF6dEpRVWxOTEhsQ1FVRmpMRWRCUVhKQ0xGVkJRWE5DTEUxQlFVMHNSVUZCUlN4VlFVRlZPMUZCUTNCRExFMUJRVTBzUTBGQlF5eFBRVUZQTEVOQlFVTXNWVUZCUXl4UlFVRlJMRVZCUVVVc1EwRkJRenRaUVVOMlFpeEpRVUZKTEVsQlFVa3NSMEZCUnl4VlFVRlZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGVrSXNTVUZCVlN4SlFVRkxMRU5CUVVNc1VVRkJVU3hGUVVGRk8yZENRVU4wUWl4UlFVRlJMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU03WjBKQlEyNUNMRkZCUVZFc1EwRkJReXhQUVVGUExFTkJRVU1zVlVGQlZTeFBRVUZQTzI5Q1FVTTVRaXhQUVVGUExFTkJRVU1zVDBGQlR5eEZRVUZGTEVOQlFVTTdaMEpCUTNSQ0xFTkJRVU1zUTBGQlF5eERRVUZETzJGQlEwNDdVVUZEVEN4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVOUUxFTkJRVU03U1VGRlRTdzJRa0ZCYTBJc1IwRkJla0lzVlVGQk1FSXNTMEZCWXl4RlFVRkZMRXRCUVdNN1VVRkRjRVFzU1VGQlNTeE5RVUZOTEVkQlFVY3NTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlF6TkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlF6ZENMRWxCUVVrc1RVRkJUU3hIUVVGSExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVNelF5eExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVNM1FpeEpRVUZKTEVsQlFVa3NSMEZCUnl4TlFVRk5MRWRCUVVjc1RVRkJUU3hEUVVGRE8xRkJRek5DTEVsQlFVa3NTVUZCU1N4SFFVRkhMRWxCUVVrc1EwRkJReXhGUVVGRkxFbEJRVWtzU1VGQlNTeEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRVZCUVVVc1JVRkJSVHRaUVVOdVF5eEpRVUZKTEVkQlFVY3NUVUZCVFN4SFFVRkhMRTFCUVUwc1EwRkJRenRUUVVNeFFqdFJRVU5FTEU5QlFVOHNTVUZCU1N4RFFVRkRPMGxCUTJoQ0xFTkJRVU03U1VGSFl5eHBRa0ZCVFN4SFFVRnlRaXhWUVVGelFpeERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNN1VVRkRla0lzVDBGQlR5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03U1VGRGVFVXNRMEZCUXp0SlFVbGpMRzFDUVVGUkxFZEJRWFpDTEZWQlFYZENMRXRCUVdsRE8xRkJRM0pFTEVsQlFVa3NVVUZCVVN4SFFVRkhMRVZCUVVVc1EwRkJRenRSUVVOc1FpeExRVUZMTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUzBGQlN5eERRVUZETEUxQlFVMHNSVUZCUlN4RFFVRkRMRVZCUVVVc1JVRkJSVHRaUVVOdVF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGFrSXNTVUZCU1N4UFFVRlBMRkZCUVZFc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEV0QlFVc3NWMEZCVnp0blFrRkJSU3hSUVVGUkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRVZCUVVVc1EwRkJRenRaUVVNM1JDeFJRVUZSTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNN1UwRkROMEk3VVVGRFJDeFBRVUZQTEZWQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1NVRkJTeXhQUVVGQkxFOUJRVThzVVVGQlVTeERRVUZETEVOQlFVTXNRMEZCUXl4TFFVRkxMRmRCUVZjc1NVRkJTU3hSUVVGUkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVhCRUxFTkJRVzlFTEVOQlFVTTdTVUZETVVVc1EwRkJRenRKUVVsTkxIRkNRVUZWTEVkQlFXcENMRlZCUVd0Q0xFdEJRVXM3VVVGRGJrSXNTVUZCU1N4VFFVRlRMRWRCUVVjc1JVRkJSU3hEUVVGRE8xRkJRMjVDTEV0QlFVc3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eExRVUZMTEVOQlFVTXNUVUZCVFN4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzUlVGQlJUdFpRVU4yUXl4TFFVRkxMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRXRCUVVzc1EwRkJReXhOUVVGTkxFVkJRVVVzUTBGQlF5eEZRVUZGTEVWQlFVVTdaMEpCUTNaRExFbEJRVWtzUTBGQlF5eEhRVUZITEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkRXaXhEUVVGRExFZEJRVWNzUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVTmFMRWRCUVVjc1IwRkJSeXhKUVVGSkxIZENRVUYzUWl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dG5Ra0ZETjBNc1NVRkJTU3hEUVVGRExFVkJRVVVzUlVGQlJTeEZRVUZGTEVWQlFVVXNRMEZCUXp0blFrRkRaQ3hKUVVGSkxFZEJRVWNzUTBGQlF5eE5RVUZOTEV0QlFVc3NRMEZCUXp0dlFrRkRhRUlzVTBGQlV6dG5Ra0ZEWWl4SlFVRkpMRWRCUVVjc1EwRkJReXhSUVVGUkxFVkJRVVU3YjBKQlIyUXNRMEZCUXl4RFFVRkRMRTlCUVU4c1JVRkJSU3hEUVVGRE8yOUNRVU5hTEVOQlFVTXNRMEZCUXl4UlFVRlJMRWRCUVVjc1NVRkJTU3hEUVVGRE8yOUNRVU5zUWl4SFFVRkhMRWRCUVVjc1NVRkJTU3gzUWtGQmQwSXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03YVVKQlF6VkRPMmRDUVVORUxFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4SlFVRkpMRU5CUVVNc1NVRkJTU3hIUVVGSExFTkJRVU1zUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXp0dlFrRkROVUlzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4SFFVRkhMRWRCUVVjc1EwRkJReXhOUVVGTkxFbEJRVWtzUTBGQlF5eERRVUZETEUxQlFVMHNTVUZCU1N4SFFVRkhMRU5CUVVNc1JVRkJSU3hIUVVGSExFZEJRVWNzUTBGQlF5eE5RVUZOTEVsQlFVa3NRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhGUVVGRk8yOUNRVVYwUlN4VFFVRlRMRU5CUVVNc1NVRkJTU3hEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF6dHZRa0ZETDBJc1UwRkJVenRwUWtGRFdqdG5Ra0ZEUkN4SlFVRkpMRWRCUVVjc1EwRkJReXhGUVVGRkxFZEJRVWNzUjBGQlJ5eERRVUZETEUxQlFVMHNTVUZCU1N4RFFVRkRMRU5CUVVNc1RVRkJUU3hKUVVGSkxFZEJRVWNzUTBGQlF5eEZRVUZGTEVkQlFVY3NSMEZCUnl4RFFVRkRMRTFCUVUwc1NVRkJTU3hEUVVGRExFTkJRVU1zVFVGQlRTeEZRVUZGTzI5Q1FVMXdSU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU03YjBKQlEyeENMRVZCUVVVc1IwRkJSeXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJRenR2UWtGRGJrSXNSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRPMmxDUVVOMFFqdHhRa0ZCVFR0dlFrRkRTQ3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRWRCUVVjc1IwRkJSeXhEUVVGRExFMUJRVTBzUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXp0dlFrRkRMMElzUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hIUVVGSExFZEJRVWNzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXp0dlFrRkROVUlzUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hIUVVGSExFZEJRVWNzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXp0cFFrRkRMMEk3WjBKQlEwUXNTVUZCU1N4VlFVRlZMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUlVGQlJTeEZRVUZGTEVWQlFVVXNSVUZCUlN4RFFVRkRMRVZCUVVVN2IwSkJRemxDTEZOQlFWTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRE8ybENRVU5zUXp0eFFrRkJUVHR2UWtGRFNDeFRRVUZUTEVOQlFVTXNTVUZCU1N4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJRenRwUWtGRGJFTTdZVUZEU2p0VFFVTktPMUZCUlVRc1QwRkJUeXhWUVVGVkxFTkJRVU1zVVVGQlVTeERRVUZETEZOQlFWTXNRMEZCUXl4RFFVRkRPMGxCUXpGRExFTkJRVU03U1VGTFRTeDFRa0ZCV1N4SFFVRnVRaXhWUVVGdlFpeEpRVUZoTzFGQlF6ZENMRk5CUVZNc1UwRkJVeXhEUVVGRExFTkJRVkU3V1VGRGRrSXNUMEZCWXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU03VVVGRGNrTXNRMEZCUXp0UlFVTkVMRWxCUVVrc1ZVRkJWU3hIUVVGSExGVkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4RFFVRkRMRWxCUVVzc1QwRkJRU3hKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhMUVVGTExFVkJRWFpGTEVOQlFYVkZMRU5CUVVNN1VVRkRkRWNzU1VGQlNTeFJRVUZSTEVkQlFVY3NSVUZCUlN4RFFVRkRPMUZCUTJ4Q0xFbEJRVWtzUTBGQlF5eEhRVUZITEZOQlFWTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU16UWl4TFFVRkxMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRTFCUVUwc1JVRkJSU3hEUVVGRExFVkJRVVVzUlVGQlJUdFpRVU5zUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhUUVVGVExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNUVUZCVFN4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETzFsQlEzcEZMRWxCUVVrc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eFZRVUZWTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUlVGQlJUdG5Ra0ZETlVJc1VVRkJVU3hEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8yZENRVU4wUWl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE8yRkJRMVE3VTBGRFNqdFJRVU5FTEU5QlFVOHNVVUZCVVN4RFFVRkRPMGxCUTNCQ0xFTkJRVU03U1VGSlJDd3dRa0ZCU3l4SFFVRk1MRlZCUVUwc1EwRkJVeXhGUVVGRkxFTkJRVk03VVVGQk1VSXNhVUpCTkVSRE8xRkJNMFJITEVsQlFVa3NUVUZCVFN4SFFVRkhMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVk1zUTBGQlF5eERRVUZETEVWQlFVVXNUVUZCVFN4SFFVRkhMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVk1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEYmtVc1NVRkJTU3hEUVVGRExGTkJRVk1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNaMEpCUVdkQ0xFTkJRVU1zVFVGQlRTeEZRVUZGTEUxQlFVMHNRMEZCUXl4RFFVRkRPMUZCUlhaRUxFbEJRVWtzWTBGQll5eEhRVUZITEVWQlFVVXNRMEZCUXp0UlFVTjRRaXhKUVVGSkxFTkJRVU1zVTBGQlV5eERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRkJMRU5CUVVNc1NVRkJTU3hQUVVGQkxHTkJRV01zUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGNFFpeERRVUYzUWl4RFFVRkRMRU5CUVVNN1VVRkRkRVFzU1VGQlNTeERRVUZETEdGQlFXRXNSMEZCUnl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFMUJRVTBzUTBGQlF5eFZRVUZCTEVOQlFVTTdXVUZEY0VNc1NVRkJTU3hEUVVGRExFZEJRVWNzUzBGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFVkJRM2hDTEVOQlFVTXNSMEZCUnl4TFFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXp0WlFVTTNRaXhQUVVGUExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4SlFVRkpMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUlVGQlJTeEpRVUZKTEdOQlFXTTdiVUpCUTNaRExFTkJRVU1zUTBGQlF5eEpRVUZKTEVsQlFVa3NRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhGUVVGRkxFbEJRVWtzWTBGQll5eERRVUZETEVOQlFVTTdVVUZEYkVRc1EwRkJReXhEUVVGRExFTkJRVU03VVVGSFNDeExRVUZMTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzVFVGQlRTeERRVUZETEV0QlFVc3NRMEZCUXl4TlFVRk5MRVZCUVVVc1EwRkJReXhGUVVGRkxFVkJRVVU3V1VGRE1VTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1RVRkJUU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNN1dVRkRNMElzU1VGQlNTeERRVUZETEVkQlFVY3NUVUZCVFN4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTTdXVUZETTBJc1NVRkJTU3hEUVVGRExHRkJRV0VzUTBGQlF5eEpRVUZKTEVOQlFVTTdaMEpCUTNCQ0xFMUJRVTBzUlVGQlJTeERRVUZETzJkQ1FVTlVMRTFCUVUwc1JVRkJSU3hEUVVGRE8yZENRVU5VTEUxQlFVMHNSVUZCUlN4RFFVRkRPMkZCUTFvc1EwRkJReXhEUVVGRE8xTkJRMDQ3VVVGRFJDeExRVUZMTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzVFVGQlRTeERRVUZETEV0QlFVc3NRMEZCUXl4TlFVRk5MRVZCUVVVc1EwRkJReXhGUVVGRkxFVkJRVVU3V1VGRE1VTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1RVRkJUU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNN1dVRkRNMElzU1VGQlNTeERRVUZETEVkQlFVY3NUVUZCVFN4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTTdXVUZETTBJc1NVRkJTU3hEUVVGRExHRkJRV0VzUTBGQlF5eEpRVUZKTEVOQlFVTTdaMEpCUTNCQ0xFMUJRVTBzUlVGQlJTeERRVUZETzJkQ1FVTlVMRTFCUVUwc1JVRkJSU3hEUVVGRE8yZENRVU5VTEUxQlFVMHNSVUZCUlN4RFFVRkRPMkZCUTFvc1EwRkJReXhEUVVGRE8xTkJRMDQ3VVVGRlJDeEpRVUZKTEZOQlFWTXNSMEZCUnl4VlFVRkJMRU5CUVVNc1NVRkJSeXhQUVVGQkxFTkJRVU1zUTBGQlF5eE5RVUZOTEVWQlFWSXNRMEZCVVN4RlFVTjRRaXhUUVVGVExFZEJRVWNzVlVGQlFTeERRVUZETEVsQlFVY3NUMEZCUVN4RFFVRkRMRU5CUVVNc1RVRkJUU3hGUVVGU0xFTkJRVkVzUlVGRGVFSXNVMEZCVXl4SFFVRkhMRlZCUVVFc1EwRkJReXhKUVVGSExFOUJRVUVzUTBGQlF5eERRVUZETEUxQlFVMHNSVUZCVWl4RFFVRlJMRU5CUVVNN1VVRkZOMElzU1VGQlNTeHpRa0ZCYzBJc1IwRkJSeXhKUVVGSkxEQkNRVUZWTEVOQlFVTXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhOUVVGTkxFVkJRVVVzU1VGQlNTeERRVUZETEdGQlFXRXNSVUZCUlN4VFFVRlRMRVZCUVVVc1UwRkJVeXhGUVVGRkxGTkJRVk1zUTBGQlF5eERRVUZETzFGQlEzQklMRWxCUVVrc1YwRkJWeXhIUVVGSExGVkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4RFFVRkRPMWxCUTNSQ0xFbEJRVWtzUTBGQlF5eEhRVUZITEV0QlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEV0QlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEV0QlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRE5VUXNTVUZCU1N4RlFVRkZMRWRCUVVjc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeEZRVUZGTEVkQlFVY3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVWMlJDeEpRVUZKTEVOQlFVTXNRMEZCUXl4SlFVRkpMRXRCUVVzc1RVRkJUU3hKUVVGSkxFTkJRVU1zUTBGQlF5eEpRVUZKTEV0QlFVc3NRMEZCUXl4RFFVRkRMRWxCUVVrc1NVRkJTU3hEUVVGRExFTkJRVU1zU1VGQlNTeExRVUZMTEUxQlFVMHNTVUZCU1N4RFFVRkRMRU5CUVVNc1NVRkJTU3hMUVVGTExFTkJRVU1zUTBGQlF5eEpRVUZKTzJkQ1FVTm9SaXhQUVVGUExFTkJRVU1zUTBGQlF6dFpRVU5pTEU5QlFVOHNSVUZCUlN4SFFVRkhMRU5CUVVNc1NVRkJTU3hGUVVGRkxFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU4yUXl4RFFVRkRMRU5CUVVNN1VVRkhSaXhKUVVGSkxGbEJRVmtzUjBGQlJ5eHpRa0ZCYzBJc1EwRkJReXc0UWtGQk9FSXNRMEZEY0VVc1RVRkJUU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRVZCUVVVc1RVRkJUU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRVZCUTNSRExGZEJRVmNzUTBGQlF5eERRVUZETzFGQlIycENMRWxCUVVrc1ZVRkJWU3hIUVVGSExGbEJRVmtzUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1ZVRkJRU3hGUVVGRkxFbEJRVWtzVDBGQlFTeExRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGa0xFTkJRV01zUTBGQlF5eERRVUZETzFGQlEyeEZMRlZCUVZVc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4TlFVRk5MRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkhhRVFzVDBGQlR5eFZRVUZWTEVOQlFVTXNUVUZCVFN4RFFVRkRMRlZCUVVNc1EwRkJReXhGUVVGRkxFTkJRVU03V1VGRE1VSXNUMEZCUVN4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExGVkJRVlVzUTBGQlF5eE5RVUZOTEVkQlFVY3NRMEZCUXl4SlFVRkpMRlZCUVZVc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4TFFVRkxMRTFCUVUwc1NVRkJTU3hEUVVGRExFTkJRVU1zU1VGQlNTeExRVUZMTEUxQlFVMDdiVUpCUXpsRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRWxCUVVrc1MwRkJTeXhOUVVGTkxFbEJRVWtzVlVGQlZTeERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFdEJRVXNzVFVGQlRTeERRVUZETzFGQlJIWkZMRU5CUTNWRkxFTkJRVU1zUTBGQlF6dEpRVU5xUml4RFFVRkRPMGxCUlUwc2RVSkJRVmtzUjBGQmJrSXNWVUZCYjBJc1MwRkJaMElzUlVGQlJTeFpRVUZ2UWl4RlFVRkZMRlZCUVd0Q0xFVkJRVVVzVjBGQmJVSTdVVUZETDBZc1NVRkJTU3hOUVVGTkxFZEJRVWM3V1VGRFZDeFRRVUZUTEVWQlFVVXNTVUZCU1N4SFFVRkhMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1IwRkJSeXhIUVVGSExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUjBGQlJ6dFpRVU16UkN4VFFVRlRMRVZCUVVVc1JVRkJSVHRUUVVOb1FpeERRVUZETzFGQlEwWXNTVUZCU1N4TFFVRkxMRU5CUVVNc1RVRkJUU3hIUVVGSExFTkJRVU1zUlVGQlJUdFpRVU5zUWl4TFFVRkxMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NTMEZCU3l4RFFVRkRMRTFCUVUwc1JVRkJSU3hEUVVGRExFVkJRVVVzUlVGQlJUdG5Ra0ZEYmtNc1NVRkJTU3hGUVVGRkxFZEJRVWNzUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVOc1FpeEpRVUZKTEVOQlFVTXNSMEZCUnl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzJkQ1FVTTNRaXhKUVVGSkxFVkJRVVVzUjBGQlJ5eERRVUZETEVkQlFVY3NSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dG5Ra0ZEY2tJc1NVRkJTU3hGUVVGRkxFZEJRVWNzUTBGQlF5eEhRVUZITEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03WjBKQlEzSkNMRWxCUVVrc1EwRkJReXhIUVVGSExFdEJRVXNzUTBGQlF5eE5RVUZOTEVkQlFVY3NRMEZCUXl4RlFVRkZPMjlDUVVOMFFpeEpRVUZKTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTzNkQ1FVTnNRaXhEUVVGRExFbEJRVWtzUlVGQlJTeEhRVUZITEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzV1VGQldTeERRVUZETzNGQ1FVTjZRenQ1UWtGQlRUdDNRa0ZEU0N4RFFVRkRMRWxCUVVrc1JVRkJSU3hIUVVGSExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1dVRkJXU3hEUVVGRE8zRkNRVU42UXp0dlFrRkRSQ3hOUVVGTkxFTkJRVU1zVTBGQlV5eEpRVUZKTEVsQlFVa3NSMEZCUnl4RFFVRkRMRWRCUVVjc1IwRkJSeXhIUVVGSExFTkJRVU1zUjBGQlJ5eEhRVUZITEVOQlFVTTdiMEpCUXpkRExFbEJRVWtzUTBGQlF5eEhRVUZITEV0QlFVc3NRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU03YjBKQlEzSkNMRWxCUVVrc1JVRkJSU3hIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1JVRkJSU3hIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN2IwSkJRemRDTEVsQlFVa3NSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdiMEpCUTJoQ0xFbEJRVWtzUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03YjBKQlEyaENMRVZCUVVVc1IwRkJSeXhGUVVGRkxFZEJRVWNzUlVGQlJTeERRVUZETzI5Q1FVTmlMRVZCUVVVc1IwRkJSeXhGUVVGRkxFZEJRVWNzUlVGQlJTeERRVUZETzI5Q1FVTmlMRWxCUVVrc1MwRkJTeXhIUVVGSExGVkJRVlVzUTBGQlF5eHJRa0ZCYTBJc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0dlFrRkZOMFFzU1VGQlNTeEZRVUZGTEVWQlFVVXNSVUZCUlN4RFFVRkRPMjlDUVVOWUxFbEJRVWtzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVU3ZDBKQlEyeENMRVZCUVVVc1IwRkJSeXhGUVVGRkxFZEJRVWNzUlVGQlJTeEhRVUZITEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzV1VGQldTeERRVUZETzNkQ1FVTXpReXhGUVVGRkxFZEJRVWNzUlVGQlJTeERRVUZETzNGQ1FVTllPM2xDUVVGTk8zZENRVU5JTEVWQlFVVXNSMEZCUnl4RlFVRkZMRU5CUVVNN2QwSkJRMUlzUlVGQlJTeEhRVUZITEVWQlFVVXNSMEZCUnl4RlFVRkZMRWRCUVVjc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4WlFVRlpMRU5CUVVNN2NVSkJRemxETzI5Q1FVTkVMRWxCUVVrc1JVRkJSU3hIUVVGSExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRE8yOUNRVU14UWl4SlFVRkpMRVZCUVVVc1IwRkJSeXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJRenR2UWtGRE1VSXNUVUZCVFN4RFFVRkRMRk5CUVZNc1NVRkJTU3hKUVVGSkxFZEJRVWNzUlVGQlJTeEhRVUZITEVkQlFVY3NSMEZCUnl4RlFVRkZMRWRCUVVjc1QwRkJUeXhIUVVGSExFdEJRVXNzUjBGQlJ5eEhRVUZITEVkQlFVY3NSVUZCUlN4SFFVRkhMRWRCUVVjc1IwRkJSeXhGUVVGRkxFZEJRVWNzUjBGQlJ5eERRVUZETzJsQ1FVTXhSanR4UWtGQlRUdHZRa0ZEU0N4SlFVRkpMRkZCUVZFc1IwRkJSeXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0dlFrRkRkRUlzU1VGQlNTeFpRVUZaTEVWQlFVVXNXVUZCV1N4RFFVRkRPMjlDUVVNdlFpeEpRVUZKTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTzNkQ1FVTnNRaXhEUVVGRExFbEJRVWtzUlVGQlJTeEhRVUZITEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzVjBGQlZ5eERRVUZETzNkQ1FVTnlReXhaUVVGWkxFZEJRVWNzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRlZCUVZVc1EwRkJReXhEUVVGRE8zZENRVU51UXl4WlFVRlpMRWRCUVVjc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEZWQlFWVXNRMEZCUXl4RFFVRkRPM0ZDUVVOMFF6dDVRa0ZCVFR0M1FrRkRTQ3hEUVVGRExFbEJRVWtzUlVGQlJTeEhRVUZITEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzVjBGQlZ5eERRVUZETzNkQ1FVTnlReXhaUVVGWkxFZEJRVWNzUTBGQlF5eERRVUZETEVkQlFVY3NWVUZCVlN4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8zZENRVU51UXl4WlFVRlpMRWRCUVVjc1EwRkJReXhEUVVGRExFZEJRVWNzVlVGQlZTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPM0ZDUVVOMFF6dHZRa0ZEUkN4TlFVRk5MRU5CUVVNc1UwRkJVeXhKUVVGSkxFbEJRVWtzUjBGQlJ5eERRVUZETEVkQlFVY3NSMEZCUnl4SFFVRkhMRU5CUVVNc1IwRkJSeXhIUVVGSExFTkJRVU03YjBKQlF6ZERMRWxCUVVrc1YwRkJWeXhIUVVGSExFTkJRVU1zUlVGQlJUdDNRa0ZEYWtJc1RVRkJUU3hEUVVGRExGTkJRVk1zUjBGQlJ5eEpRVUZKTEVkQlFVY3NVVUZCVVN4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFZEJRVWNzUjBGQlJ5eFJRVUZSTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1MwRkJTeXhIUVVGSExGbEJRVmtzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4SFFVRkhMRWRCUVVjc1dVRkJXU3hEUVVGRExFTkJRVU1zUTBGQlF6czRRa0ZEZWtjc1MwRkJTeXhIUVVGSExGbEJRVmtzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4SFFVRkhMRWRCUVVjc1dVRkJXU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzNGQ1FVTnlSRHRwUWtGRFNqdGhRVU5LTzFOQlEwbzdZVUZCVFR0WlFVTklMRWxCUVVrc1JVRkJSU3hIUVVGSExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTnNRaXhKUVVGSkxFTkJRVU1zUjBGQlJ5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRemRDTEVsQlFVa3NSVUZCUlN4SFFVRkhMRU5CUVVNc1IwRkJSeXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTNKQ0xFbEJRVWtzUlVGQlJTeEhRVUZITEVOQlFVTXNSMEZCUnl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFsQlEzSkNMRWxCUVVrc1VVRkJVU3hIUVVGSExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTNSQ0xFbEJRVWtzV1VGQldTeEZRVUZGTEZsQlFWa3NRMEZCUXp0WlFVTXZRaXhKUVVGSkxFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRk8yZENRVU5zUWl4RFFVRkRMRWxCUVVrc1JVRkJSU3hIUVVGSExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1YwRkJWeXhEUVVGRE8yZENRVU55UXl4WlFVRlpMRWRCUVVjc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEZWQlFWVXNRMEZCUXl4RFFVRkRPMmRDUVVOdVF5eFpRVUZaTEVkQlFVY3NRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExGVkJRVlVzUTBGQlF5eERRVUZETzJGQlEzUkRPMmxDUVVGTk8yZENRVU5JTEVOQlFVTXNTVUZCU1N4RlFVRkZMRWRCUVVjc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4WFFVRlhMRU5CUVVNN1owSkJRM0pETEZsQlFWa3NSMEZCUnl4RFFVRkRMRU5CUVVNc1IwRkJSeXhWUVVGVkxFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdaMEpCUTI1RExGbEJRVmtzUjBGQlJ5eERRVUZETEVOQlFVTXNSMEZCUnl4VlFVRlZMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03WVVGRGRFTTdXVUZEUkN4TlFVRk5MRU5CUVVNc1UwRkJVeXhKUVVGSkxFbEJRVWtzUjBGQlJ5eERRVUZETEVkQlFVY3NSMEZCUnl4SFFVRkhMRU5CUVVNc1IwRkJSeXhIUVVGSExFTkJRVU03V1VGRE4wTXNTVUZCU1N4WFFVRlhMRWRCUVVjc1EwRkJReXhGUVVGRk8yZENRVU5xUWl4TlFVRk5MRU5CUVVNc1UwRkJVeXhIUVVGSExFbEJRVWtzUjBGQlJ5eFJRVUZSTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1IwRkJSeXhIUVVGSExGRkJRVkVzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4TFFVRkxMRWRCUVVjc1dVRkJXU3hEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVkQlFVY3NSMEZCUnl4WlFVRlpMRU5CUVVNc1EwRkJReXhEUVVGRE8zTkNRVU42Unl4TFFVRkxMRWRCUVVjc1dVRkJXU3hEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVkQlFVY3NSMEZCUnl4WlFVRlpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03WVVGRGNrUTdVMEZEU2p0UlFVTkVMRTlCUVU4c1RVRkJUU3hEUVVGRE8wbEJRMnhDTEVOQlFVTTdTVUZEVEN4cFFrRkJRenRCUVVGRUxFTkJRVU1zUVVGNmJFSkVMRWxCZVd4Q1F6dEJRWHBzUWxrc1owTkJRVlVpZlE9PSIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHBhY2tpbmdPcHRpb25zID0ge1xuICAgIFBBRERJTkc6IDEwLFxuICAgIEdPTERFTl9TRUNUSU9OOiAoMSArIE1hdGguc3FydCg1KSkgLyAyLFxuICAgIEZMT0FUX0VQU0lMT046IDAuMDAwMSxcbiAgICBNQVhfSU5FUkFUSU9OUzogMTAwXG59O1xuZnVuY3Rpb24gYXBwbHlQYWNraW5nKGdyYXBocywgdywgaCwgbm9kZV9zaXplLCBkZXNpcmVkX3JhdGlvLCBjZW50ZXJHcmFwaCkge1xuICAgIGlmIChkZXNpcmVkX3JhdGlvID09PSB2b2lkIDApIHsgZGVzaXJlZF9yYXRpbyA9IDE7IH1cbiAgICBpZiAoY2VudGVyR3JhcGggPT09IHZvaWQgMCkgeyBjZW50ZXJHcmFwaCA9IHRydWU7IH1cbiAgICB2YXIgaW5pdF94ID0gMCwgaW5pdF95ID0gMCwgc3ZnX3dpZHRoID0gdywgc3ZnX2hlaWdodCA9IGgsIGRlc2lyZWRfcmF0aW8gPSB0eXBlb2YgZGVzaXJlZF9yYXRpbyAhPT0gJ3VuZGVmaW5lZCcgPyBkZXNpcmVkX3JhdGlvIDogMSwgbm9kZV9zaXplID0gdHlwZW9mIG5vZGVfc2l6ZSAhPT0gJ3VuZGVmaW5lZCcgPyBub2RlX3NpemUgOiAwLCByZWFsX3dpZHRoID0gMCwgcmVhbF9oZWlnaHQgPSAwLCBtaW5fd2lkdGggPSAwLCBnbG9iYWxfYm90dG9tID0gMCwgbGluZSA9IFtdO1xuICAgIGlmIChncmFwaHMubGVuZ3RoID09IDApXG4gICAgICAgIHJldHVybjtcbiAgICBjYWxjdWxhdGVfYmIoZ3JhcGhzKTtcbiAgICBhcHBseShncmFwaHMsIGRlc2lyZWRfcmF0aW8pO1xuICAgIGlmIChjZW50ZXJHcmFwaCkge1xuICAgICAgICBwdXRfbm9kZXNfdG9fcmlnaHRfcG9zaXRpb25zKGdyYXBocyk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNhbGN1bGF0ZV9iYihncmFwaHMpIHtcbiAgICAgICAgZ3JhcGhzLmZvckVhY2goZnVuY3Rpb24gKGcpIHtcbiAgICAgICAgICAgIGNhbGN1bGF0ZV9zaW5nbGVfYmIoZyk7XG4gICAgICAgIH0pO1xuICAgICAgICBmdW5jdGlvbiBjYWxjdWxhdGVfc2luZ2xlX2JiKGdyYXBoKSB7XG4gICAgICAgICAgICB2YXIgbWluX3ggPSBOdW1iZXIuTUFYX1ZBTFVFLCBtaW5feSA9IE51bWJlci5NQVhfVkFMVUUsIG1heF94ID0gMCwgbWF4X3kgPSAwO1xuICAgICAgICAgICAgZ3JhcGguYXJyYXkuZm9yRWFjaChmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgICAgIHZhciB3ID0gdHlwZW9mIHYud2lkdGggIT09ICd1bmRlZmluZWQnID8gdi53aWR0aCA6IG5vZGVfc2l6ZTtcbiAgICAgICAgICAgICAgICB2YXIgaCA9IHR5cGVvZiB2LmhlaWdodCAhPT0gJ3VuZGVmaW5lZCcgPyB2LmhlaWdodCA6IG5vZGVfc2l6ZTtcbiAgICAgICAgICAgICAgICB3IC89IDI7XG4gICAgICAgICAgICAgICAgaCAvPSAyO1xuICAgICAgICAgICAgICAgIG1heF94ID0gTWF0aC5tYXgodi54ICsgdywgbWF4X3gpO1xuICAgICAgICAgICAgICAgIG1pbl94ID0gTWF0aC5taW4odi54IC0gdywgbWluX3gpO1xuICAgICAgICAgICAgICAgIG1heF95ID0gTWF0aC5tYXgodi55ICsgaCwgbWF4X3kpO1xuICAgICAgICAgICAgICAgIG1pbl95ID0gTWF0aC5taW4odi55IC0gaCwgbWluX3kpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBncmFwaC53aWR0aCA9IG1heF94IC0gbWluX3g7XG4gICAgICAgICAgICBncmFwaC5oZWlnaHQgPSBtYXhfeSAtIG1pbl95O1xuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHB1dF9ub2Rlc190b19yaWdodF9wb3NpdGlvbnMoZ3JhcGhzKSB7XG4gICAgICAgIGdyYXBocy5mb3JFYWNoKGZ1bmN0aW9uIChnKSB7XG4gICAgICAgICAgICB2YXIgY2VudGVyID0geyB4OiAwLCB5OiAwIH07XG4gICAgICAgICAgICBnLmFycmF5LmZvckVhY2goZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgICAgICBjZW50ZXIueCArPSBub2RlLng7XG4gICAgICAgICAgICAgICAgY2VudGVyLnkgKz0gbm9kZS55O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjZW50ZXIueCAvPSBnLmFycmF5Lmxlbmd0aDtcbiAgICAgICAgICAgIGNlbnRlci55IC89IGcuYXJyYXkubGVuZ3RoO1xuICAgICAgICAgICAgdmFyIGNvcm5lciA9IHsgeDogY2VudGVyLnggLSBnLndpZHRoIC8gMiwgeTogY2VudGVyLnkgLSBnLmhlaWdodCAvIDIgfTtcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSB7IHg6IGcueCAtIGNvcm5lci54ICsgc3ZnX3dpZHRoIC8gMiAtIHJlYWxfd2lkdGggLyAyLCB5OiBnLnkgLSBjb3JuZXIueSArIHN2Z19oZWlnaHQgLyAyIC0gcmVhbF9oZWlnaHQgLyAyIH07XG4gICAgICAgICAgICBnLmFycmF5LmZvckVhY2goZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgICAgICBub2RlLnggKz0gb2Zmc2V0Lng7XG4gICAgICAgICAgICAgICAgbm9kZS55ICs9IG9mZnNldC55O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBmdW5jdGlvbiBhcHBseShkYXRhLCBkZXNpcmVkX3JhdGlvKSB7XG4gICAgICAgIHZhciBjdXJyX2Jlc3RfZiA9IE51bWJlci5QT1NJVElWRV9JTkZJTklUWTtcbiAgICAgICAgdmFyIGN1cnJfYmVzdCA9IDA7XG4gICAgICAgIGRhdGEuc29ydChmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYi5oZWlnaHQgLSBhLmhlaWdodDsgfSk7XG4gICAgICAgIG1pbl93aWR0aCA9IGRhdGEucmVkdWNlKGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gYS53aWR0aCA8IGIud2lkdGggPyBhLndpZHRoIDogYi53aWR0aDtcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciBsZWZ0ID0geDEgPSBtaW5fd2lkdGg7XG4gICAgICAgIHZhciByaWdodCA9IHgyID0gZ2V0X2VudGlyZV93aWR0aChkYXRhKTtcbiAgICAgICAgdmFyIGl0ZXJhdGlvbkNvdW50ZXIgPSAwO1xuICAgICAgICB2YXIgZl94MSA9IE51bWJlci5NQVhfVkFMVUU7XG4gICAgICAgIHZhciBmX3gyID0gTnVtYmVyLk1BWF9WQUxVRTtcbiAgICAgICAgdmFyIGZsYWcgPSAtMTtcbiAgICAgICAgdmFyIGR4ID0gTnVtYmVyLk1BWF9WQUxVRTtcbiAgICAgICAgdmFyIGRmID0gTnVtYmVyLk1BWF9WQUxVRTtcbiAgICAgICAgd2hpbGUgKChkeCA+IG1pbl93aWR0aCkgfHwgZGYgPiBwYWNraW5nT3B0aW9ucy5GTE9BVF9FUFNJTE9OKSB7XG4gICAgICAgICAgICBpZiAoZmxhZyAhPSAxKSB7XG4gICAgICAgICAgICAgICAgdmFyIHgxID0gcmlnaHQgLSAocmlnaHQgLSBsZWZ0KSAvIHBhY2tpbmdPcHRpb25zLkdPTERFTl9TRUNUSU9OO1xuICAgICAgICAgICAgICAgIHZhciBmX3gxID0gc3RlcChkYXRhLCB4MSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZmxhZyAhPSAwKSB7XG4gICAgICAgICAgICAgICAgdmFyIHgyID0gbGVmdCArIChyaWdodCAtIGxlZnQpIC8gcGFja2luZ09wdGlvbnMuR09MREVOX1NFQ1RJT047XG4gICAgICAgICAgICAgICAgdmFyIGZfeDIgPSBzdGVwKGRhdGEsIHgyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGR4ID0gTWF0aC5hYnMoeDEgLSB4Mik7XG4gICAgICAgICAgICBkZiA9IE1hdGguYWJzKGZfeDEgLSBmX3gyKTtcbiAgICAgICAgICAgIGlmIChmX3gxIDwgY3Vycl9iZXN0X2YpIHtcbiAgICAgICAgICAgICAgICBjdXJyX2Jlc3RfZiA9IGZfeDE7XG4gICAgICAgICAgICAgICAgY3Vycl9iZXN0ID0geDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZl94MiA8IGN1cnJfYmVzdF9mKSB7XG4gICAgICAgICAgICAgICAgY3Vycl9iZXN0X2YgPSBmX3gyO1xuICAgICAgICAgICAgICAgIGN1cnJfYmVzdCA9IHgyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGZfeDEgPiBmX3gyKSB7XG4gICAgICAgICAgICAgICAgbGVmdCA9IHgxO1xuICAgICAgICAgICAgICAgIHgxID0geDI7XG4gICAgICAgICAgICAgICAgZl94MSA9IGZfeDI7XG4gICAgICAgICAgICAgICAgZmxhZyA9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByaWdodCA9IHgyO1xuICAgICAgICAgICAgICAgIHgyID0geDE7XG4gICAgICAgICAgICAgICAgZl94MiA9IGZfeDE7XG4gICAgICAgICAgICAgICAgZmxhZyA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXRlcmF0aW9uQ291bnRlcisrID4gMTAwKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgc3RlcChkYXRhLCBjdXJyX2Jlc3QpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBzdGVwKGRhdGEsIG1heF93aWR0aCkge1xuICAgICAgICBsaW5lID0gW107XG4gICAgICAgIHJlYWxfd2lkdGggPSAwO1xuICAgICAgICByZWFsX2hlaWdodCA9IDA7XG4gICAgICAgIGdsb2JhbF9ib3R0b20gPSBpbml0X3k7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIG8gPSBkYXRhW2ldO1xuICAgICAgICAgICAgcHV0X3JlY3QobywgbWF4X3dpZHRoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gTWF0aC5hYnMoZ2V0X3JlYWxfcmF0aW8oKSAtIGRlc2lyZWRfcmF0aW8pO1xuICAgIH1cbiAgICBmdW5jdGlvbiBwdXRfcmVjdChyZWN0LCBtYXhfd2lkdGgpIHtcbiAgICAgICAgdmFyIHBhcmVudCA9IHVuZGVmaW5lZDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5lLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoKGxpbmVbaV0uc3BhY2VfbGVmdCA+PSByZWN0LmhlaWdodCkgJiYgKGxpbmVbaV0ueCArIGxpbmVbaV0ud2lkdGggKyByZWN0LndpZHRoICsgcGFja2luZ09wdGlvbnMuUEFERElORyAtIG1heF93aWR0aCkgPD0gcGFja2luZ09wdGlvbnMuRkxPQVRfRVBTSUxPTikge1xuICAgICAgICAgICAgICAgIHBhcmVudCA9IGxpbmVbaV07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbGluZS5wdXNoKHJlY3QpO1xuICAgICAgICBpZiAocGFyZW50ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJlY3QueCA9IHBhcmVudC54ICsgcGFyZW50LndpZHRoICsgcGFja2luZ09wdGlvbnMuUEFERElORztcbiAgICAgICAgICAgIHJlY3QueSA9IHBhcmVudC5ib3R0b207XG4gICAgICAgICAgICByZWN0LnNwYWNlX2xlZnQgPSByZWN0LmhlaWdodDtcbiAgICAgICAgICAgIHJlY3QuYm90dG9tID0gcmVjdC55O1xuICAgICAgICAgICAgcGFyZW50LnNwYWNlX2xlZnQgLT0gcmVjdC5oZWlnaHQgKyBwYWNraW5nT3B0aW9ucy5QQURESU5HO1xuICAgICAgICAgICAgcGFyZW50LmJvdHRvbSArPSByZWN0LmhlaWdodCArIHBhY2tpbmdPcHRpb25zLlBBRERJTkc7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZWN0LnkgPSBnbG9iYWxfYm90dG9tO1xuICAgICAgICAgICAgZ2xvYmFsX2JvdHRvbSArPSByZWN0LmhlaWdodCArIHBhY2tpbmdPcHRpb25zLlBBRERJTkc7XG4gICAgICAgICAgICByZWN0LnggPSBpbml0X3g7XG4gICAgICAgICAgICByZWN0LmJvdHRvbSA9IHJlY3QueTtcbiAgICAgICAgICAgIHJlY3Quc3BhY2VfbGVmdCA9IHJlY3QuaGVpZ2h0O1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZWN0LnkgKyByZWN0LmhlaWdodCAtIHJlYWxfaGVpZ2h0ID4gLXBhY2tpbmdPcHRpb25zLkZMT0FUX0VQU0lMT04pXG4gICAgICAgICAgICByZWFsX2hlaWdodCA9IHJlY3QueSArIHJlY3QuaGVpZ2h0IC0gaW5pdF95O1xuICAgICAgICBpZiAocmVjdC54ICsgcmVjdC53aWR0aCAtIHJlYWxfd2lkdGggPiAtcGFja2luZ09wdGlvbnMuRkxPQVRfRVBTSUxPTilcbiAgICAgICAgICAgIHJlYWxfd2lkdGggPSByZWN0LnggKyByZWN0LndpZHRoIC0gaW5pdF94O1xuICAgIH1cbiAgICA7XG4gICAgZnVuY3Rpb24gZ2V0X2VudGlyZV93aWR0aChkYXRhKSB7XG4gICAgICAgIHZhciB3aWR0aCA9IDA7XG4gICAgICAgIGRhdGEuZm9yRWFjaChmdW5jdGlvbiAoZCkgeyByZXR1cm4gd2lkdGggKz0gZC53aWR0aCArIHBhY2tpbmdPcHRpb25zLlBBRERJTkc7IH0pO1xuICAgICAgICByZXR1cm4gd2lkdGg7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldF9yZWFsX3JhdGlvKCkge1xuICAgICAgICByZXR1cm4gKHJlYWxfd2lkdGggLyByZWFsX2hlaWdodCk7XG4gICAgfVxufVxuZXhwb3J0cy5hcHBseVBhY2tpbmcgPSBhcHBseVBhY2tpbmc7XG5mdW5jdGlvbiBzZXBhcmF0ZUdyYXBocyhub2RlcywgbGlua3MpIHtcbiAgICB2YXIgbWFya3MgPSB7fTtcbiAgICB2YXIgd2F5cyA9IHt9O1xuICAgIHZhciBncmFwaHMgPSBbXTtcbiAgICB2YXIgY2x1c3RlcnMgPSAwO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGlua3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGxpbmsgPSBsaW5rc1tpXTtcbiAgICAgICAgdmFyIG4xID0gbGluay5zb3VyY2U7XG4gICAgICAgIHZhciBuMiA9IGxpbmsudGFyZ2V0O1xuICAgICAgICBpZiAod2F5c1tuMS5pbmRleF0pXG4gICAgICAgICAgICB3YXlzW24xLmluZGV4XS5wdXNoKG4yKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgd2F5c1tuMS5pbmRleF0gPSBbbjJdO1xuICAgICAgICBpZiAod2F5c1tuMi5pbmRleF0pXG4gICAgICAgICAgICB3YXlzW24yLmluZGV4XS5wdXNoKG4xKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgd2F5c1tuMi5pbmRleF0gPSBbbjFdO1xuICAgIH1cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBub2RlID0gbm9kZXNbaV07XG4gICAgICAgIGlmIChtYXJrc1tub2RlLmluZGV4XSlcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICBleHBsb3JlX25vZGUobm9kZSwgdHJ1ZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGV4cGxvcmVfbm9kZShuLCBpc19uZXcpIHtcbiAgICAgICAgaWYgKG1hcmtzW24uaW5kZXhdICE9PSB1bmRlZmluZWQpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGlmIChpc19uZXcpIHtcbiAgICAgICAgICAgIGNsdXN0ZXJzKys7XG4gICAgICAgICAgICBncmFwaHMucHVzaCh7IGFycmF5OiBbXSB9KTtcbiAgICAgICAgfVxuICAgICAgICBtYXJrc1tuLmluZGV4XSA9IGNsdXN0ZXJzO1xuICAgICAgICBncmFwaHNbY2x1c3RlcnMgLSAxXS5hcnJheS5wdXNoKG4pO1xuICAgICAgICB2YXIgYWRqYWNlbnQgPSB3YXlzW24uaW5kZXhdO1xuICAgICAgICBpZiAoIWFkamFjZW50KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGFkamFjZW50Lmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBleHBsb3JlX25vZGUoYWRqYWNlbnRbal0sIGZhbHNlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZ3JhcGhzO1xufVxuZXhwb3J0cy5zZXBhcmF0ZUdyYXBocyA9IHNlcGFyYXRlR3JhcGhzO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKbWFXeGxJam9pYUdGdVpHeGxaR2x6WTI5dWJtVmpkR1ZrTG1weklpd2ljMjkxY21ObFVtOXZkQ0k2SWlJc0luTnZkWEpqWlhNaU9sc2lMaTR2TGk0dlYyVmlRMjlzWVM5emNtTXZhR0Z1Wkd4bFpHbHpZMjl1Ym1WamRHVmtMblJ6SWwwc0ltNWhiV1Z6SWpwYlhTd2liV0Z3Y0dsdVozTWlPaUk3TzBGQlFVa3NTVUZCU1N4alFVRmpMRWRCUVVjN1NVRkRha0lzVDBGQlR5eEZRVUZGTEVWQlFVVTdTVUZEV0N4alFVRmpMRVZCUVVVc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU03U1VGRGRFTXNZVUZCWVN4RlFVRkZMRTFCUVUwN1NVRkRja0lzWTBGQll5eEZRVUZGTEVkQlFVYzdRMEZEZEVJc1EwRkJRenRCUVVkR0xGTkJRV2RDTEZsQlFWa3NRMEZCUXl4TlFVRnBRaXhGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNVMEZCVXl4RlFVRkZMR0ZCUVdsQ0xFVkJRVVVzVjBGQmEwSTdTVUZCY2tNc09FSkJRVUVzUlVGQlFTeHBRa0ZCYVVJN1NVRkJSU3cwUWtGQlFTeEZRVUZCTEd0Q1FVRnJRanRKUVVWc1J5eEpRVUZKTEUxQlFVMHNSMEZCUnl4RFFVRkRMRVZCUTFZc1RVRkJUU3hIUVVGSExFTkJRVU1zUlVGRlZpeFRRVUZUTEVkQlFVY3NRMEZCUXl4RlFVTmlMRlZCUVZVc1IwRkJSeXhEUVVGRExFVkJSV1FzWVVGQllTeEhRVUZITEU5QlFVOHNZVUZCWVN4TFFVRkxMRmRCUVZjc1EwRkJReXhEUVVGRExFTkJRVU1zWVVGQllTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUTNoRkxGTkJRVk1zUjBGQlJ5eFBRVUZQTEZOQlFWTXNTMEZCU3l4WFFVRlhMRU5CUVVNc1EwRkJReXhEUVVGRExGTkJRVk1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVVTFSQ3hWUVVGVkxFZEJRVWNzUTBGQlF5eEZRVU5rTEZkQlFWY3NSMEZCUnl4RFFVRkRMRVZCUTJZc1UwRkJVeXhIUVVGSExFTkJRVU1zUlVGRllpeGhRVUZoTEVkQlFVY3NRMEZCUXl4RlFVTnFRaXhKUVVGSkxFZEJRVWNzUlVGQlJTeERRVUZETzBsQlJXUXNTVUZCU1N4TlFVRk5MRU5CUVVNc1RVRkJUU3hKUVVGSkxFTkJRVU03VVVGRGJFSXNUMEZCVHp0SlFWVllMRmxCUVZrc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF6dEpRVU55UWl4TFFVRkxMRU5CUVVNc1RVRkJUU3hGUVVGRkxHRkJRV0VzUTBGQlF5eERRVUZETzBsQlF6ZENMRWxCUVVjc1YwRkJWeXhGUVVGRk8xRkJRMW9zTkVKQlFUUkNMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU03UzBGRGVFTTdTVUZIUkN4VFFVRlRMRmxCUVZrc1EwRkJReXhOUVVGTk8xRkJSWGhDTEUxQlFVMHNRMEZCUXl4UFFVRlBMRU5CUVVNc1ZVRkJWU3hEUVVGRE8xbEJRM1JDTEcxQ1FVRnRRaXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZCTzFGQlF6RkNMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJSVWdzVTBGQlV5eHRRa0ZCYlVJc1EwRkJReXhMUVVGTE8xbEJRemxDTEVsQlFVa3NTMEZCU3l4SFFVRkhMRTFCUVUwc1EwRkJReXhUUVVGVExFVkJRVVVzUzBGQlN5eEhRVUZITEUxQlFVMHNRMEZCUXl4VFFVRlRMRVZCUTJ4RUxFdEJRVXNzUjBGQlJ5eERRVUZETEVWQlFVVXNTMEZCU3l4SFFVRkhMRU5CUVVNc1EwRkJRenRaUVVWNlFpeExRVUZMTEVOQlFVTXNTMEZCU3l4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGVkxFTkJRVU03WjBKQlF6TkNMRWxCUVVrc1EwRkJReXhIUVVGSExFOUJRVThzUTBGQlF5eERRVUZETEV0QlFVc3NTMEZCU3l4WFFVRlhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRk5CUVZNc1EwRkJRenRuUWtGRE4wUXNTVUZCU1N4RFFVRkRMRWRCUVVjc1QwRkJUeXhEUVVGRExFTkJRVU1zVFVGQlRTeExRVUZMTEZkQlFWY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNVMEZCVXl4RFFVRkRPMmRDUVVNdlJDeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMmRDUVVOUUxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdaMEpCUTFBc1MwRkJTeXhIUVVGSExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUzBGQlN5eERRVUZETEVOQlFVTTdaMEpCUTJwRExFdEJRVXNzUjBGQlJ5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEV0QlFVc3NRMEZCUXl4RFFVRkRPMmRDUVVOcVF5eExRVUZMTEVkQlFVY3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4TFFVRkxMRU5CUVVNc1EwRkJRenRuUWtGRGFrTXNTMEZCU3l4SFFVRkhMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1MwRkJTeXhEUVVGRExFTkJRVU03V1VGRGNrTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkZTQ3hMUVVGTExFTkJRVU1zUzBGQlN5eEhRVUZITEV0QlFVc3NSMEZCUnl4TFFVRkxMRU5CUVVNN1dVRkROVUlzUzBGQlN5eERRVUZETEUxQlFVMHNSMEZCUnl4TFFVRkxMRWRCUVVjc1MwRkJTeXhEUVVGRE8xRkJRMnBETEVOQlFVTTdTVUZEVEN4RFFVRkRPMGxCZFVORUxGTkJRVk1zTkVKQlFUUkNMRU5CUVVNc1RVRkJUVHRSUVVONFF5eE5RVUZOTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVZVc1EwRkJRenRaUVVWMFFpeEpRVUZKTEUxQlFVMHNSMEZCUnl4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4RFFVRkRPMWxCUlRWQ0xFTkJRVU1zUTBGQlF5eExRVUZMTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVZVc1NVRkJTVHRuUWtGRE1VSXNUVUZCVFN4RFFVRkRMRU5CUVVNc1NVRkJTU3hKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETzJkQ1FVTnVRaXhOUVVGTkxFTkJRVU1zUTBGQlF5eEpRVUZKTEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRka0lzUTBGQlF5eERRVUZETEVOQlFVTTdXVUZGU0N4TlFVRk5MRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eExRVUZMTEVOQlFVTXNUVUZCVFN4RFFVRkRPMWxCUXpOQ0xFMUJRVTBzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRXRCUVVzc1EwRkJReXhOUVVGTkxFTkJRVU03V1VGSE0wSXNTVUZCU1N4TlFVRk5MRWRCUVVjc1JVRkJSU3hEUVVGRExFVkJRVVVzVFVGQlRTeERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1MwRkJTeXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNUVUZCVFN4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zVFVGQlRTeEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRPMWxCUTNaRkxFbEJRVWtzVFVGQlRTeEhRVUZITEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzVFVGQlRTeERRVUZETEVOQlFVTXNSMEZCUnl4VFFVRlRMRWRCUVVjc1EwRkJReXhIUVVGSExGVkJRVlVzUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzVFVGQlRTeERRVUZETEVOQlFVTXNSMEZCUnl4VlFVRlZMRWRCUVVjc1EwRkJReXhIUVVGSExGZEJRVmNzUjBGQlJ5eERRVUZETEVWQlFVTXNRMEZCUXp0WlFVZDZTQ3hEUVVGRExFTkJRVU1zUzBGQlN5eERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRlZMRWxCUVVrN1owSkJRekZDTEVsQlFVa3NRMEZCUXl4RFFVRkRMRWxCUVVrc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF6dG5Ra0ZEYmtJc1NVRkJTU3hEUVVGRExFTkJRVU1zU1VGQlNTeE5RVUZOTEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTNaQ0xFTkJRVU1zUTBGQlF5eERRVUZETzFGQlExQXNRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRVQ3hEUVVGRE8wbEJTVVFzVTBGQlV5eExRVUZMTEVOQlFVTXNTVUZCU1N4RlFVRkZMR0ZCUVdFN1VVRkRPVUlzU1VGQlNTeFhRVUZYTEVkQlFVY3NUVUZCVFN4RFFVRkRMR2xDUVVGcFFpeERRVUZETzFGQlF6TkRMRWxCUVVrc1UwRkJVeXhIUVVGSExFTkJRVU1zUTBGQlF6dFJRVU5zUWl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExGVkJRVlVzUTBGQlF5eEZRVUZGTEVOQlFVTXNTVUZCU1N4UFFVRlBMRU5CUVVNc1EwRkJReXhOUVVGTkxFZEJRVWNzUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJSVE5FTEZOQlFWTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRExGVkJRVlVzUTBGQlF5eEZRVUZGTEVOQlFVTTdXVUZEYkVNc1QwRkJUeXhEUVVGRExFTkJRVU1zUzBGQlN5eEhRVUZITEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhMUVVGTExFTkJRVU03VVVGRGFrUXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkZTQ3hKUVVGSkxFbEJRVWtzUjBGQlJ5eEZRVUZGTEVkQlFVY3NVMEZCVXl4RFFVRkRPMUZCUXpGQ0xFbEJRVWtzUzBGQlN5eEhRVUZITEVWQlFVVXNSMEZCUnl4blFrRkJaMElzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0UlFVTjRReXhKUVVGSkxHZENRVUZuUWl4SFFVRkhMRU5CUVVNc1EwRkJRenRSUVVWNlFpeEpRVUZKTEVsQlFVa3NSMEZCUnl4TlFVRk5MRU5CUVVNc1UwRkJVeXhEUVVGRE8xRkJRelZDTEVsQlFVa3NTVUZCU1N4SFFVRkhMRTFCUVUwc1EwRkJReXhUUVVGVExFTkJRVU03VVVGRE5VSXNTVUZCU1N4SlFVRkpMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU03VVVGSFpDeEpRVUZKTEVWQlFVVXNSMEZCUnl4TlFVRk5MRU5CUVVNc1UwRkJVeXhEUVVGRE8xRkJRekZDTEVsQlFVa3NSVUZCUlN4SFFVRkhMRTFCUVUwc1EwRkJReXhUUVVGVExFTkJRVU03VVVGRk1VSXNUMEZCVHl4RFFVRkRMRVZCUVVVc1IwRkJSeXhUUVVGVExFTkJRVU1zU1VGQlNTeEZRVUZGTEVkQlFVY3NZMEZCWXl4RFFVRkRMR0ZCUVdFc1JVRkJSVHRaUVVVeFJDeEpRVUZKTEVsQlFVa3NTVUZCU1N4RFFVRkRMRVZCUVVVN1owSkJRMWdzU1VGQlNTeEZRVUZGTEVkQlFVY3NTMEZCU3l4SFFVRkhMRU5CUVVNc1MwRkJTeXhIUVVGSExFbEJRVWtzUTBGQlF5eEhRVUZITEdOQlFXTXNRMEZCUXl4alFVRmpMRU5CUVVNN1owSkJRMmhGTEVsQlFVa3NTVUZCU1N4SFFVRkhMRWxCUVVrc1EwRkJReXhKUVVGSkxFVkJRVVVzUlVGQlJTeERRVUZETEVOQlFVTTdZVUZETjBJN1dVRkRSQ3hKUVVGSkxFbEJRVWtzU1VGQlNTeERRVUZETEVWQlFVVTdaMEpCUTFnc1NVRkJTU3hGUVVGRkxFZEJRVWNzU1VGQlNTeEhRVUZITEVOQlFVTXNTMEZCU3l4SFFVRkhMRWxCUVVrc1EwRkJReXhIUVVGSExHTkJRV01zUTBGQlF5eGpRVUZqTEVOQlFVTTdaMEpCUXk5RUxFbEJRVWtzU1VGQlNTeEhRVUZITEVsQlFVa3NRMEZCUXl4SlFVRkpMRVZCUVVVc1JVRkJSU3hEUVVGRExFTkJRVU03WVVGRE4wSTdXVUZGUkN4RlFVRkZMRWRCUVVjc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVkQlFVY3NSVUZCUlN4RFFVRkRMRU5CUVVNN1dVRkRka0lzUlVGQlJTeEhRVUZITEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hIUVVGSExFbEJRVWtzUTBGQlF5eERRVUZETzFsQlJUTkNMRWxCUVVrc1NVRkJTU3hIUVVGSExGZEJRVmNzUlVGQlJUdG5Ra0ZEY0VJc1YwRkJWeXhIUVVGSExFbEJRVWtzUTBGQlF6dG5Ra0ZEYmtJc1UwRkJVeXhIUVVGSExFVkJRVVVzUTBGQlF6dGhRVU5zUWp0WlFVVkVMRWxCUVVrc1NVRkJTU3hIUVVGSExGZEJRVmNzUlVGQlJUdG5Ra0ZEY0VJc1YwRkJWeXhIUVVGSExFbEJRVWtzUTBGQlF6dG5Ra0ZEYmtJc1UwRkJVeXhIUVVGSExFVkJRVVVzUTBGQlF6dGhRVU5zUWp0WlFVVkVMRWxCUVVrc1NVRkJTU3hIUVVGSExFbEJRVWtzUlVGQlJUdG5Ra0ZEWWl4SlFVRkpMRWRCUVVjc1JVRkJSU3hEUVVGRE8yZENRVU5XTEVWQlFVVXNSMEZCUnl4RlFVRkZMRU5CUVVNN1owSkJRMUlzU1VGQlNTeEhRVUZITEVsQlFVa3NRMEZCUXp0blFrRkRXaXhKUVVGSkxFZEJRVWNzUTBGQlF5eERRVUZETzJGQlExbzdhVUpCUVUwN1owSkJRMGdzUzBGQlN5eEhRVUZITEVWQlFVVXNRMEZCUXp0blFrRkRXQ3hGUVVGRkxFZEJRVWNzUlVGQlJTeERRVUZETzJkQ1FVTlNMRWxCUVVrc1IwRkJSeXhKUVVGSkxFTkJRVU03WjBKQlExb3NTVUZCU1N4SFFVRkhMRU5CUVVNc1EwRkJRenRoUVVOYU8xbEJSVVFzU1VGQlNTeG5Ra0ZCWjBJc1JVRkJSU3hIUVVGSExFZEJRVWNzUlVGQlJUdG5Ra0ZETVVJc1RVRkJUVHRoUVVOVU8xTkJRMG83VVVGRlJDeEpRVUZKTEVOQlFVTXNTVUZCU1N4RlFVRkZMRk5CUVZNc1EwRkJReXhEUVVGRE8wbEJRekZDTEVOQlFVTTdTVUZKUkN4VFFVRlRMRWxCUVVrc1EwRkJReXhKUVVGSkxFVkJRVVVzVTBGQlV6dFJRVU42UWl4SlFVRkpMRWRCUVVjc1JVRkJSU3hEUVVGRE8xRkJRMVlzVlVGQlZTeEhRVUZITEVOQlFVTXNRMEZCUXp0UlFVTm1MRmRCUVZjc1IwRkJSeXhEUVVGRExFTkJRVU03VVVGRGFFSXNZVUZCWVN4SFFVRkhMRTFCUVUwc1EwRkJRenRSUVVWMlFpeExRVUZMTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEUxQlFVMHNSVUZCUlN4RFFVRkRMRVZCUVVVc1JVRkJSVHRaUVVOc1F5eEpRVUZKTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGFFSXNVVUZCVVN4RFFVRkRMRU5CUVVNc1JVRkJSU3hUUVVGVExFTkJRVU1zUTBGQlF6dFRRVU14UWp0UlFVVkVMRTlCUVU4c1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eGpRVUZqTEVWQlFVVXNSMEZCUnl4aFFVRmhMRU5CUVVNc1EwRkJRenRKUVVOMFJDeERRVUZETzBsQlIwUXNVMEZCVXl4UlFVRlJMRU5CUVVNc1NVRkJTU3hGUVVGRkxGTkJRVk03VVVGSE4wSXNTVUZCU1N4TlFVRk5MRWRCUVVjc1UwRkJVeXhEUVVGRE8xRkJSWFpDTEV0QlFVc3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNUVUZCVFN4RlFVRkZMRU5CUVVNc1JVRkJSU3hGUVVGRk8xbEJRMnhETEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zVlVGQlZTeEpRVUZKTEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEV0QlFVc3NSMEZCUnl4SlFVRkpMRU5CUVVNc1MwRkJTeXhIUVVGSExHTkJRV01zUTBGQlF5eFBRVUZQTEVkQlFVY3NVMEZCVXl4RFFVRkRMRWxCUVVrc1kwRkJZeXhEUVVGRExHRkJRV0VzUlVGQlJUdG5Ra0ZEZEVvc1RVRkJUU3hIUVVGSExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0blFrRkRha0lzVFVGQlRUdGhRVU5VTzFOQlEwbzdVVUZGUkN4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzFGQlJXaENMRWxCUVVrc1RVRkJUU3hMUVVGTExGTkJRVk1zUlVGQlJUdFpRVU4wUWl4SlFVRkpMRU5CUVVNc1EwRkJReXhIUVVGSExFMUJRVTBzUTBGQlF5eERRVUZETEVkQlFVY3NUVUZCVFN4RFFVRkRMRXRCUVVzc1IwRkJSeXhqUVVGakxFTkJRVU1zVDBGQlR5eERRVUZETzFsQlF6RkVMRWxCUVVrc1EwRkJReXhEUVVGRExFZEJRVWNzVFVGQlRTeERRVUZETEUxQlFVMHNRMEZCUXp0WlFVTjJRaXhKUVVGSkxFTkJRVU1zVlVGQlZTeEhRVUZITEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNN1dVRkRPVUlzU1VGQlNTeERRVUZETEUxQlFVMHNSMEZCUnl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRM0pDTEUxQlFVMHNRMEZCUXl4VlFVRlZMRWxCUVVrc1NVRkJTU3hEUVVGRExFMUJRVTBzUjBGQlJ5eGpRVUZqTEVOQlFVTXNUMEZCVHl4RFFVRkRPMWxCUXpGRUxFMUJRVTBzUTBGQlF5eE5RVUZOTEVsQlFVa3NTVUZCU1N4RFFVRkRMRTFCUVUwc1IwRkJSeXhqUVVGakxFTkJRVU1zVDBGQlR5eERRVUZETzFOQlEzcEVPMkZCUVUwN1dVRkRTQ3hKUVVGSkxFTkJRVU1zUTBGQlF5eEhRVUZITEdGQlFXRXNRMEZCUXp0WlFVTjJRaXhoUVVGaExFbEJRVWtzU1VGQlNTeERRVUZETEUxQlFVMHNSMEZCUnl4alFVRmpMRU5CUVVNc1QwRkJUeXhEUVVGRE8xbEJRM1JFTEVsQlFVa3NRMEZCUXl4RFFVRkRMRWRCUVVjc1RVRkJUU3hEUVVGRE8xbEJRMmhDTEVsQlFVa3NRMEZCUXl4TlFVRk5MRWRCUVVjc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU55UWl4SlFVRkpMRU5CUVVNc1ZVRkJWU3hIUVVGSExFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTTdVMEZEYWtNN1VVRkZSQ3hKUVVGSkxFbEJRVWtzUTBGQlF5eERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRTFCUVUwc1IwRkJSeXhYUVVGWExFZEJRVWNzUTBGQlF5eGpRVUZqTEVOQlFVTXNZVUZCWVR0WlFVRkZMRmRCUVZjc1IwRkJSeXhKUVVGSkxFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4TlFVRk5MRWRCUVVjc1RVRkJUU3hEUVVGRE8xRkJRM0JJTEVsQlFVa3NTVUZCU1N4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zUzBGQlN5eEhRVUZITEZWQlFWVXNSMEZCUnl4RFFVRkRMR05CUVdNc1EwRkJReXhoUVVGaE8xbEJRVVVzVlVGQlZTeEhRVUZITEVsQlFVa3NRMEZCUXl4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFdEJRVXNzUjBGQlJ5eE5RVUZOTEVOQlFVTTdTVUZEY0Vnc1EwRkJRenRKUVVGQkxFTkJRVU03U1VGRlJpeFRRVUZUTEdkQ1FVRm5RaXhEUVVGRExFbEJRVWs3VVVGRE1VSXNTVUZCU1N4TFFVRkxMRWRCUVVjc1EwRkJReXhEUVVGRE8xRkJRMlFzU1VGQlNTeERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRlZMRU5CUVVNc1NVRkJTU3hQUVVGUExFdEJRVXNzU1VGQlNTeERRVUZETEVOQlFVTXNTMEZCU3l4SFFVRkhMR05CUVdNc1EwRkJReXhQUVVGUExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTnFSaXhQUVVGUExFdEJRVXNzUTBGQlF6dEpRVU5xUWl4RFFVRkRPMGxCUlVRc1UwRkJVeXhqUVVGak8xRkJRMjVDTEU5QlFVOHNRMEZCUXl4VlFVRlZMRWRCUVVjc1YwRkJWeXhEUVVGRExFTkJRVU03U1VGRGRFTXNRMEZCUXp0QlFVTk1MRU5CUVVNN1FVRXhVRVFzYjBOQk1GQkRPMEZCVFVRc1UwRkJaMElzWTBGQll5eERRVUZETEV0QlFVc3NSVUZCUlN4TFFVRkxPMGxCUTNaRExFbEJRVWtzUzBGQlN5eEhRVUZITEVWQlFVVXNRMEZCUXp0SlFVTm1MRWxCUVVrc1NVRkJTU3hIUVVGSExFVkJRVVVzUTBGQlF6dEpRVU5rTEVsQlFVa3NUVUZCVFN4SFFVRkhMRVZCUVVVc1EwRkJRenRKUVVOb1FpeEpRVUZKTEZGQlFWRXNSMEZCUnl4RFFVRkRMRU5CUVVNN1NVRkZha0lzUzBGQlN5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExFdEJRVXNzUTBGQlF5eE5RVUZOTEVWQlFVVXNRMEZCUXl4RlFVRkZMRVZCUVVVN1VVRkRia01zU1VGQlNTeEpRVUZKTEVkQlFVY3NTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRM0JDTEVsQlFVa3NSVUZCUlN4SFFVRkhMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU03VVVGRGNrSXNTVUZCU1N4RlFVRkZMRWRCUVVjc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF6dFJRVU55UWl4SlFVRkpMRWxCUVVrc1EwRkJReXhGUVVGRkxFTkJRVU1zUzBGQlN5eERRVUZETzFsQlEyUXNTVUZCU1N4RFFVRkRMRVZCUVVVc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNN08xbEJSWGhDTEVsQlFVa3NRMEZCUXl4RlFVRkZMRU5CUVVNc1MwRkJTeXhEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXp0UlFVVXhRaXhKUVVGSkxFbEJRVWtzUTBGQlF5eEZRVUZGTEVOQlFVTXNTMEZCU3l4RFFVRkRPMWxCUTJRc1NVRkJTU3hEUVVGRExFVkJRVVVzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU03TzFsQlJYaENMRWxCUVVrc1EwRkJReXhGUVVGRkxFTkJRVU1zUzBGQlN5eERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJRenRMUVVNM1FqdEpRVVZFTEV0QlFVc3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eExRVUZMTEVOQlFVTXNUVUZCVFN4RlFVRkZMRU5CUVVNc1JVRkJSU3hGUVVGRk8xRkJRMjVETEVsQlFVa3NTVUZCU1N4SFFVRkhMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU53UWl4SlFVRkpMRXRCUVVzc1EwRkJReXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETzFsQlFVVXNVMEZCVXp0UlFVTm9ReXhaUVVGWkxFTkJRVU1zU1VGQlNTeEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRPMHRCUXpWQ08wbEJSVVFzVTBGQlV5eFpRVUZaTEVOQlFVTXNRMEZCUXl4RlFVRkZMRTFCUVUwN1VVRkRNMElzU1VGQlNTeExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRXRCUVVzc1EwRkJReXhMUVVGTExGTkJRVk03V1VGQlJTeFBRVUZQTzFGQlEzcERMRWxCUVVrc1RVRkJUU3hGUVVGRk8xbEJRMUlzVVVGQlVTeEZRVUZGTEVOQlFVTTdXVUZEV0N4TlFVRk5MRU5CUVVNc1NVRkJTU3hEUVVGRExFVkJRVVVzUzBGQlN5eEZRVUZGTEVWQlFVVXNSVUZCUlN4RFFVRkRMRU5CUVVNN1UwRkRPVUk3VVVGRFJDeExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRXRCUVVzc1EwRkJReXhIUVVGSExGRkJRVkVzUTBGQlF6dFJRVU14UWl4TlFVRk5MRU5CUVVNc1VVRkJVU3hIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEV0QlFVc3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRGJrTXNTVUZCU1N4UlFVRlJMRWRCUVVjc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXp0UlFVTTNRaXhKUVVGSkxFTkJRVU1zVVVGQlVUdFpRVUZGTEU5QlFVODdVVUZGZEVJc1MwRkJTeXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRkZCUVZFc1EwRkJReXhOUVVGTkxFVkJRVVVzUTBGQlF5eEZRVUZGTEVWQlFVVTdXVUZEZEVNc1dVRkJXU3hEUVVGRExGRkJRVkVzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4TFFVRkxMRU5CUVVNc1EwRkJRenRUUVVOd1F6dEpRVU5NTEVOQlFVTTdTVUZGUkN4UFFVRlBMRTFCUVUwc1EwRkJRenRCUVVOc1FpeERRVUZETzBGQk5VTkVMSGREUVRSRFF5SjkiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBwb3dlcmdyYXBoID0gcmVxdWlyZShcIi4vcG93ZXJncmFwaFwiKTtcbnZhciBsaW5rbGVuZ3Roc18xID0gcmVxdWlyZShcIi4vbGlua2xlbmd0aHNcIik7XG52YXIgZGVzY2VudF8xID0gcmVxdWlyZShcIi4vZGVzY2VudFwiKTtcbnZhciByZWN0YW5nbGVfMSA9IHJlcXVpcmUoXCIuL3JlY3RhbmdsZVwiKTtcbnZhciBzaG9ydGVzdHBhdGhzXzEgPSByZXF1aXJlKFwiLi9zaG9ydGVzdHBhdGhzXCIpO1xudmFyIGdlb21fMSA9IHJlcXVpcmUoXCIuL2dlb21cIik7XG52YXIgaGFuZGxlZGlzY29ubmVjdGVkXzEgPSByZXF1aXJlKFwiLi9oYW5kbGVkaXNjb25uZWN0ZWRcIik7XG52YXIgRXZlbnRUeXBlO1xuKGZ1bmN0aW9uIChFdmVudFR5cGUpIHtcbiAgICBFdmVudFR5cGVbRXZlbnRUeXBlW1wic3RhcnRcIl0gPSAwXSA9IFwic3RhcnRcIjtcbiAgICBFdmVudFR5cGVbRXZlbnRUeXBlW1widGlja1wiXSA9IDFdID0gXCJ0aWNrXCI7XG4gICAgRXZlbnRUeXBlW0V2ZW50VHlwZVtcImVuZFwiXSA9IDJdID0gXCJlbmRcIjtcbn0pKEV2ZW50VHlwZSA9IGV4cG9ydHMuRXZlbnRUeXBlIHx8IChleHBvcnRzLkV2ZW50VHlwZSA9IHt9KSk7XG47XG5mdW5jdGlvbiBpc0dyb3VwKGcpIHtcbiAgICByZXR1cm4gdHlwZW9mIGcubGVhdmVzICE9PSAndW5kZWZpbmVkJyB8fCB0eXBlb2YgZy5ncm91cHMgIT09ICd1bmRlZmluZWQnO1xufVxudmFyIExheW91dCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTGF5b3V0KCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB0aGlzLl9jYW52YXNTaXplID0gWzEsIDFdO1xuICAgICAgICB0aGlzLl9saW5rRGlzdGFuY2UgPSAyMDtcbiAgICAgICAgdGhpcy5fZGVmYXVsdE5vZGVTaXplID0gMTA7XG4gICAgICAgIHRoaXMuX2xpbmtMZW5ndGhDYWxjdWxhdG9yID0gbnVsbDtcbiAgICAgICAgdGhpcy5fbGlua1R5cGUgPSBudWxsO1xuICAgICAgICB0aGlzLl9hdm9pZE92ZXJsYXBzID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX2hhbmRsZURpc2Nvbm5lY3RlZCA9IHRydWU7XG4gICAgICAgIHRoaXMuX3J1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fbm9kZXMgPSBbXTtcbiAgICAgICAgdGhpcy5fZ3JvdXBzID0gW107XG4gICAgICAgIHRoaXMuX3Jvb3RHcm91cCA9IG51bGw7XG4gICAgICAgIHRoaXMuX2xpbmtzID0gW107XG4gICAgICAgIHRoaXMuX2NvbnN0cmFpbnRzID0gW107XG4gICAgICAgIHRoaXMuX2Rpc3RhbmNlTWF0cml4ID0gbnVsbDtcbiAgICAgICAgdGhpcy5fZGVzY2VudCA9IG51bGw7XG4gICAgICAgIHRoaXMuX2RpcmVjdGVkTGlua0NvbnN0cmFpbnRzID0gbnVsbDtcbiAgICAgICAgdGhpcy5fdGhyZXNob2xkID0gMC4wMTtcbiAgICAgICAgdGhpcy5fdmlzaWJpbGl0eUdyYXBoID0gbnVsbDtcbiAgICAgICAgdGhpcy5fZ3JvdXBDb21wYWN0bmVzcyA9IDFlLTY7XG4gICAgICAgIHRoaXMuZXZlbnQgPSBudWxsO1xuICAgICAgICB0aGlzLmxpbmtBY2Nlc3NvciA9IHtcbiAgICAgICAgICAgIGdldFNvdXJjZUluZGV4OiBMYXlvdXQuZ2V0U291cmNlSW5kZXgsXG4gICAgICAgICAgICBnZXRUYXJnZXRJbmRleDogTGF5b3V0LmdldFRhcmdldEluZGV4LFxuICAgICAgICAgICAgc2V0TGVuZ3RoOiBMYXlvdXQuc2V0TGlua0xlbmd0aCxcbiAgICAgICAgICAgIGdldFR5cGU6IGZ1bmN0aW9uIChsKSB7IHJldHVybiB0eXBlb2YgX3RoaXMuX2xpbmtUeXBlID09PSBcImZ1bmN0aW9uXCIgPyBfdGhpcy5fbGlua1R5cGUobCkgOiAwOyB9XG4gICAgICAgIH07XG4gICAgfVxuICAgIExheW91dC5wcm90b3R5cGUub24gPSBmdW5jdGlvbiAoZSwgbGlzdGVuZXIpIHtcbiAgICAgICAgaWYgKCF0aGlzLmV2ZW50KVxuICAgICAgICAgICAgdGhpcy5ldmVudCA9IHt9O1xuICAgICAgICBpZiAodHlwZW9mIGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50W0V2ZW50VHlwZVtlXV0gPSBsaXN0ZW5lcjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZXZlbnRbZV0gPSBsaXN0ZW5lcjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUudHJpZ2dlciA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGlmICh0aGlzLmV2ZW50ICYmIHR5cGVvZiB0aGlzLmV2ZW50W2UudHlwZV0gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50W2UudHlwZV0oZSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUua2ljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgd2hpbGUgKCF0aGlzLnRpY2soKSlcbiAgICAgICAgICAgIDtcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUudGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuX2FscGhhIDwgdGhpcy5fdGhyZXNob2xkKSB7XG4gICAgICAgICAgICB0aGlzLl9ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLnRyaWdnZXIoeyB0eXBlOiBFdmVudFR5cGUuZW5kLCBhbHBoYTogdGhpcy5fYWxwaGEgPSAwLCBzdHJlc3M6IHRoaXMuX2xhc3RTdHJlc3MgfSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbiA9IHRoaXMuX25vZGVzLmxlbmd0aCwgbSA9IHRoaXMuX2xpbmtzLmxlbmd0aDtcbiAgICAgICAgdmFyIG8sIGk7XG4gICAgICAgIHRoaXMuX2Rlc2NlbnQubG9ja3MuY2xlYXIoKTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICAgICAgbyA9IHRoaXMuX25vZGVzW2ldO1xuICAgICAgICAgICAgaWYgKG8uZml4ZWQpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG8ucHggPT09ICd1bmRlZmluZWQnIHx8IHR5cGVvZiBvLnB5ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICBvLnB4ID0gby54O1xuICAgICAgICAgICAgICAgICAgICBvLnB5ID0gby55O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgcCA9IFtvLnB4LCBvLnB5XTtcbiAgICAgICAgICAgICAgICB0aGlzLl9kZXNjZW50LmxvY2tzLmFkZChpLCBwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgczEgPSB0aGlzLl9kZXNjZW50LnJ1bmdlS3V0dGEoKTtcbiAgICAgICAgaWYgKHMxID09PSAwKSB7XG4gICAgICAgICAgICB0aGlzLl9hbHBoYSA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodHlwZW9mIHRoaXMuX2xhc3RTdHJlc3MgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aGlzLl9hbHBoYSA9IHMxO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2xhc3RTdHJlc3MgPSBzMTtcbiAgICAgICAgdGhpcy51cGRhdGVOb2RlUG9zaXRpb25zKCk7XG4gICAgICAgIHRoaXMudHJpZ2dlcih7IHR5cGU6IEV2ZW50VHlwZS50aWNrLCBhbHBoYTogdGhpcy5fYWxwaGEsIHN0cmVzczogdGhpcy5fbGFzdFN0cmVzcyB9KTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS51cGRhdGVOb2RlUG9zaXRpb25zID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgeCA9IHRoaXMuX2Rlc2NlbnQueFswXSwgeSA9IHRoaXMuX2Rlc2NlbnQueFsxXTtcbiAgICAgICAgdmFyIG8sIGkgPSB0aGlzLl9ub2Rlcy5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgIG8gPSB0aGlzLl9ub2Rlc1tpXTtcbiAgICAgICAgICAgIG8ueCA9IHhbaV07XG4gICAgICAgICAgICBvLnkgPSB5W2ldO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLm5vZGVzID0gZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgaWYgKCF2KSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fbm9kZXMubGVuZ3RoID09PSAwICYmIHRoaXMuX2xpbmtzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB2YXIgbiA9IDA7XG4gICAgICAgICAgICAgICAgdGhpcy5fbGlua3MuZm9yRWFjaChmdW5jdGlvbiAobCkge1xuICAgICAgICAgICAgICAgICAgICBuID0gTWF0aC5tYXgobiwgbC5zb3VyY2UsIGwudGFyZ2V0KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLl9ub2RlcyA9IG5ldyBBcnJheSgrK24pO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX25vZGVzW2ldID0ge307XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX25vZGVzO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX25vZGVzID0gdjtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLmdyb3VwcyA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIGlmICgheClcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9ncm91cHM7XG4gICAgICAgIHRoaXMuX2dyb3VwcyA9IHg7XG4gICAgICAgIHRoaXMuX3Jvb3RHcm91cCA9IHt9O1xuICAgICAgICB0aGlzLl9ncm91cHMuZm9yRWFjaChmdW5jdGlvbiAoZykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBnLnBhZGRpbmcgPT09IFwidW5kZWZpbmVkXCIpXG4gICAgICAgICAgICAgICAgZy5wYWRkaW5nID0gMTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZy5sZWF2ZXMgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICBnLmxlYXZlcy5mb3JFYWNoKGZ1bmN0aW9uICh2LCBpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdiA9PT0gJ251bWJlcicpXG4gICAgICAgICAgICAgICAgICAgICAgICAoZy5sZWF2ZXNbaV0gPSBfdGhpcy5fbm9kZXNbdl0pLnBhcmVudCA9IGc7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZW9mIGcuZ3JvdXBzICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICAgICAgZy5ncm91cHMuZm9yRWFjaChmdW5jdGlvbiAoZ2ksIGkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBnaSA9PT0gJ251bWJlcicpXG4gICAgICAgICAgICAgICAgICAgICAgICAoZy5ncm91cHNbaV0gPSBfdGhpcy5fZ3JvdXBzW2dpXSkucGFyZW50ID0gZztcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuX3Jvb3RHcm91cC5sZWF2ZXMgPSB0aGlzLl9ub2Rlcy5maWx0ZXIoZnVuY3Rpb24gKHYpIHsgcmV0dXJuIHR5cGVvZiB2LnBhcmVudCA9PT0gJ3VuZGVmaW5lZCc7IH0pO1xuICAgICAgICB0aGlzLl9yb290R3JvdXAuZ3JvdXBzID0gdGhpcy5fZ3JvdXBzLmZpbHRlcihmdW5jdGlvbiAoZykgeyByZXR1cm4gdHlwZW9mIGcucGFyZW50ID09PSAndW5kZWZpbmVkJzsgfSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5wb3dlckdyYXBoR3JvdXBzID0gZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgdmFyIGcgPSBwb3dlcmdyYXBoLmdldEdyb3Vwcyh0aGlzLl9ub2RlcywgdGhpcy5fbGlua3MsIHRoaXMubGlua0FjY2Vzc29yLCB0aGlzLl9yb290R3JvdXApO1xuICAgICAgICB0aGlzLmdyb3VwcyhnLmdyb3Vwcyk7XG4gICAgICAgIGYoZyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5hdm9pZE92ZXJsYXBzID0gZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2F2b2lkT3ZlcmxhcHM7XG4gICAgICAgIHRoaXMuX2F2b2lkT3ZlcmxhcHMgPSB2O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUuaGFuZGxlRGlzY29ubmVjdGVkID0gZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2hhbmRsZURpc2Nvbm5lY3RlZDtcbiAgICAgICAgdGhpcy5faGFuZGxlRGlzY29ubmVjdGVkID0gdjtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLmZsb3dMYXlvdXQgPSBmdW5jdGlvbiAoYXhpcywgbWluU2VwYXJhdGlvbikge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpXG4gICAgICAgICAgICBheGlzID0gJ3knO1xuICAgICAgICB0aGlzLl9kaXJlY3RlZExpbmtDb25zdHJhaW50cyA9IHtcbiAgICAgICAgICAgIGF4aXM6IGF4aXMsXG4gICAgICAgICAgICBnZXRNaW5TZXBhcmF0aW9uOiB0eXBlb2YgbWluU2VwYXJhdGlvbiA9PT0gJ251bWJlcicgPyBmdW5jdGlvbiAoKSB7IHJldHVybiBtaW5TZXBhcmF0aW9uOyB9IDogbWluU2VwYXJhdGlvblxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUubGlua3MgPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbGlua3M7XG4gICAgICAgIHRoaXMuX2xpbmtzID0geDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLmNvbnN0cmFpbnRzID0gZnVuY3Rpb24gKGMpIHtcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NvbnN0cmFpbnRzO1xuICAgICAgICB0aGlzLl9jb25zdHJhaW50cyA9IGM7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5kaXN0YW5jZU1hdHJpeCA9IGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aClcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9kaXN0YW5jZU1hdHJpeDtcbiAgICAgICAgdGhpcy5fZGlzdGFuY2VNYXRyaXggPSBkO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUuc2l6ZSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIGlmICgheClcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jYW52YXNTaXplO1xuICAgICAgICB0aGlzLl9jYW52YXNTaXplID0geDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLmRlZmF1bHROb2RlU2l6ZSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIGlmICgheClcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9kZWZhdWx0Tm9kZVNpemU7XG4gICAgICAgIHRoaXMuX2RlZmF1bHROb2RlU2l6ZSA9IHg7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5ncm91cENvbXBhY3RuZXNzID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgaWYgKCF4KVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2dyb3VwQ29tcGFjdG5lc3M7XG4gICAgICAgIHRoaXMuX2dyb3VwQ29tcGFjdG5lc3MgPSB4O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUubGlua0Rpc3RhbmNlID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgaWYgKCF4KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbGlua0Rpc3RhbmNlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2xpbmtEaXN0YW5jZSA9IHR5cGVvZiB4ID09PSBcImZ1bmN0aW9uXCIgPyB4IDogK3g7XG4gICAgICAgIHRoaXMuX2xpbmtMZW5ndGhDYWxjdWxhdG9yID0gbnVsbDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLmxpbmtUeXBlID0gZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgdGhpcy5fbGlua1R5cGUgPSBmO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUuY29udmVyZ2VuY2VUaHJlc2hvbGQgPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICBpZiAoIXgpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fdGhyZXNob2xkO1xuICAgICAgICB0aGlzLl90aHJlc2hvbGQgPSB0eXBlb2YgeCA9PT0gXCJmdW5jdGlvblwiID8geCA6ICt4O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUuYWxwaGEgPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fYWxwaGE7XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgeCA9ICt4O1xuICAgICAgICAgICAgaWYgKHRoaXMuX2FscGhhKSB7XG4gICAgICAgICAgICAgICAgaWYgKHggPiAwKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9hbHBoYSA9IHg7XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9hbHBoYSA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh4ID4gMCkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5fcnVubmluZykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ydW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyKHsgdHlwZTogRXZlbnRUeXBlLnN0YXJ0LCBhbHBoYTogdGhpcy5fYWxwaGEgPSB4IH0pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmtpY2soKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5nZXRMaW5rTGVuZ3RoID0gZnVuY3Rpb24gKGxpbmspIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiB0aGlzLl9saW5rRGlzdGFuY2UgPT09IFwiZnVuY3Rpb25cIiA/ICsodGhpcy5fbGlua0Rpc3RhbmNlKGxpbmspKSA6IHRoaXMuX2xpbmtEaXN0YW5jZTtcbiAgICB9O1xuICAgIExheW91dC5zZXRMaW5rTGVuZ3RoID0gZnVuY3Rpb24gKGxpbmssIGxlbmd0aCkge1xuICAgICAgICBsaW5rLmxlbmd0aCA9IGxlbmd0aDtcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUuZ2V0TGlua1R5cGUgPSBmdW5jdGlvbiAobGluaykge1xuICAgICAgICByZXR1cm4gdHlwZW9mIHRoaXMuX2xpbmtUeXBlID09PSBcImZ1bmN0aW9uXCIgPyB0aGlzLl9saW5rVHlwZShsaW5rKSA6IDA7XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLnN5bW1ldHJpY0RpZmZMaW5rTGVuZ3RocyA9IGZ1bmN0aW9uIChpZGVhbExlbmd0aCwgdykge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICBpZiAodyA9PT0gdm9pZCAwKSB7IHcgPSAxOyB9XG4gICAgICAgIHRoaXMubGlua0Rpc3RhbmNlKGZ1bmN0aW9uIChsKSB7IHJldHVybiBpZGVhbExlbmd0aCAqIGwubGVuZ3RoOyB9KTtcbiAgICAgICAgdGhpcy5fbGlua0xlbmd0aENhbGN1bGF0b3IgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBsaW5rbGVuZ3Roc18xLnN5bW1ldHJpY0RpZmZMaW5rTGVuZ3RocyhfdGhpcy5fbGlua3MsIF90aGlzLmxpbmtBY2Nlc3Nvciwgdyk7IH07XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5qYWNjYXJkTGlua0xlbmd0aHMgPSBmdW5jdGlvbiAoaWRlYWxMZW5ndGgsIHcpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgaWYgKHcgPT09IHZvaWQgMCkgeyB3ID0gMTsgfVxuICAgICAgICB0aGlzLmxpbmtEaXN0YW5jZShmdW5jdGlvbiAobCkgeyByZXR1cm4gaWRlYWxMZW5ndGggKiBsLmxlbmd0aDsgfSk7XG4gICAgICAgIHRoaXMuX2xpbmtMZW5ndGhDYWxjdWxhdG9yID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gbGlua2xlbmd0aHNfMS5qYWNjYXJkTGlua0xlbmd0aHMoX3RoaXMuX2xpbmtzLCBfdGhpcy5saW5rQWNjZXNzb3IsIHcpOyB9O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbiAoaW5pdGlhbFVuY29uc3RyYWluZWRJdGVyYXRpb25zLCBpbml0aWFsVXNlckNvbnN0cmFpbnRJdGVyYXRpb25zLCBpbml0aWFsQWxsQ29uc3RyYWludHNJdGVyYXRpb25zLCBncmlkU25hcEl0ZXJhdGlvbnMsIGtlZXBSdW5uaW5nLCBjZW50ZXJHcmFwaCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICBpZiAoaW5pdGlhbFVuY29uc3RyYWluZWRJdGVyYXRpb25zID09PSB2b2lkIDApIHsgaW5pdGlhbFVuY29uc3RyYWluZWRJdGVyYXRpb25zID0gMDsgfVxuICAgICAgICBpZiAoaW5pdGlhbFVzZXJDb25zdHJhaW50SXRlcmF0aW9ucyA9PT0gdm9pZCAwKSB7IGluaXRpYWxVc2VyQ29uc3RyYWludEl0ZXJhdGlvbnMgPSAwOyB9XG4gICAgICAgIGlmIChpbml0aWFsQWxsQ29uc3RyYWludHNJdGVyYXRpb25zID09PSB2b2lkIDApIHsgaW5pdGlhbEFsbENvbnN0cmFpbnRzSXRlcmF0aW9ucyA9IDA7IH1cbiAgICAgICAgaWYgKGdyaWRTbmFwSXRlcmF0aW9ucyA9PT0gdm9pZCAwKSB7IGdyaWRTbmFwSXRlcmF0aW9ucyA9IDA7IH1cbiAgICAgICAgaWYgKGtlZXBSdW5uaW5nID09PSB2b2lkIDApIHsga2VlcFJ1bm5pbmcgPSB0cnVlOyB9XG4gICAgICAgIGlmIChjZW50ZXJHcmFwaCA9PT0gdm9pZCAwKSB7IGNlbnRlckdyYXBoID0gdHJ1ZTsgfVxuICAgICAgICB2YXIgaSwgaiwgbiA9IHRoaXMubm9kZXMoKS5sZW5ndGgsIE4gPSBuICsgMiAqIHRoaXMuX2dyb3Vwcy5sZW5ndGgsIG0gPSB0aGlzLl9saW5rcy5sZW5ndGgsIHcgPSB0aGlzLl9jYW52YXNTaXplWzBdLCBoID0gdGhpcy5fY2FudmFzU2l6ZVsxXTtcbiAgICAgICAgdmFyIHggPSBuZXcgQXJyYXkoTiksIHkgPSBuZXcgQXJyYXkoTik7XG4gICAgICAgIHZhciBHID0gbnVsbDtcbiAgICAgICAgdmFyIGFvID0gdGhpcy5fYXZvaWRPdmVybGFwcztcbiAgICAgICAgdGhpcy5fbm9kZXMuZm9yRWFjaChmdW5jdGlvbiAodiwgaSkge1xuICAgICAgICAgICAgdi5pbmRleCA9IGk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHYueCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICB2LnggPSB3IC8gMiwgdi55ID0gaCAvIDI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB4W2ldID0gdi54LCB5W2ldID0gdi55O1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHRoaXMuX2xpbmtMZW5ndGhDYWxjdWxhdG9yKVxuICAgICAgICAgICAgdGhpcy5fbGlua0xlbmd0aENhbGN1bGF0b3IoKTtcbiAgICAgICAgdmFyIGRpc3RhbmNlcztcbiAgICAgICAgaWYgKHRoaXMuX2Rpc3RhbmNlTWF0cml4KSB7XG4gICAgICAgICAgICBkaXN0YW5jZXMgPSB0aGlzLl9kaXN0YW5jZU1hdHJpeDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGRpc3RhbmNlcyA9IChuZXcgc2hvcnRlc3RwYXRoc18xLkNhbGN1bGF0b3IoTiwgdGhpcy5fbGlua3MsIExheW91dC5nZXRTb3VyY2VJbmRleCwgTGF5b3V0LmdldFRhcmdldEluZGV4LCBmdW5jdGlvbiAobCkgeyByZXR1cm4gX3RoaXMuZ2V0TGlua0xlbmd0aChsKTsgfSkpLkRpc3RhbmNlTWF0cml4KCk7XG4gICAgICAgICAgICBHID0gZGVzY2VudF8xLkRlc2NlbnQuY3JlYXRlU3F1YXJlTWF0cml4KE4sIGZ1bmN0aW9uICgpIHsgcmV0dXJuIDI7IH0pO1xuICAgICAgICAgICAgdGhpcy5fbGlua3MuZm9yRWFjaChmdW5jdGlvbiAobCkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbC5zb3VyY2UgPT0gXCJudW1iZXJcIilcbiAgICAgICAgICAgICAgICAgICAgbC5zb3VyY2UgPSBfdGhpcy5fbm9kZXNbbC5zb3VyY2VdO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbC50YXJnZXQgPT0gXCJudW1iZXJcIilcbiAgICAgICAgICAgICAgICAgICAgbC50YXJnZXQgPSBfdGhpcy5fbm9kZXNbbC50YXJnZXRdO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLl9saW5rcy5mb3JFYWNoKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHUgPSBMYXlvdXQuZ2V0U291cmNlSW5kZXgoZSksIHYgPSBMYXlvdXQuZ2V0VGFyZ2V0SW5kZXgoZSk7XG4gICAgICAgICAgICAgICAgR1t1XVt2XSA9IEdbdl1bdV0gPSBlLndlaWdodCB8fCAxO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIEQgPSBkZXNjZW50XzEuRGVzY2VudC5jcmVhdGVTcXVhcmVNYXRyaXgoTiwgZnVuY3Rpb24gKGksIGopIHtcbiAgICAgICAgICAgIHJldHVybiBkaXN0YW5jZXNbaV1bal07XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAodGhpcy5fcm9vdEdyb3VwICYmIHR5cGVvZiB0aGlzLl9yb290R3JvdXAuZ3JvdXBzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdmFyIGkgPSBuO1xuICAgICAgICAgICAgdmFyIGFkZEF0dHJhY3Rpb24gPSBmdW5jdGlvbiAoaSwgaiwgc3RyZW5ndGgsIGlkZWFsRGlzdGFuY2UpIHtcbiAgICAgICAgICAgICAgICBHW2ldW2pdID0gR1tqXVtpXSA9IHN0cmVuZ3RoO1xuICAgICAgICAgICAgICAgIERbaV1bal0gPSBEW2pdW2ldID0gaWRlYWxEaXN0YW5jZTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aGlzLl9ncm91cHMuZm9yRWFjaChmdW5jdGlvbiAoZykge1xuICAgICAgICAgICAgICAgIGFkZEF0dHJhY3Rpb24oaSwgaSArIDEsIF90aGlzLl9ncm91cENvbXBhY3RuZXNzLCAwLjEpO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZy5ib3VuZHMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgIHhbaV0gPSB3IC8gMiwgeVtpKytdID0gaCAvIDI7XG4gICAgICAgICAgICAgICAgICAgIHhbaV0gPSB3IC8gMiwgeVtpKytdID0gaCAvIDI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB4W2ldID0gZy5ib3VuZHMueCwgeVtpKytdID0gZy5ib3VuZHMueTtcbiAgICAgICAgICAgICAgICAgICAgeFtpXSA9IGcuYm91bmRzLlgsIHlbaSsrXSA9IGcuYm91bmRzLlk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdGhpcy5fcm9vdEdyb3VwID0geyBsZWF2ZXM6IHRoaXMuX25vZGVzLCBncm91cHM6IFtdIH07XG4gICAgICAgIHZhciBjdXJDb25zdHJhaW50cyA9IHRoaXMuX2NvbnN0cmFpbnRzIHx8IFtdO1xuICAgICAgICBpZiAodGhpcy5fZGlyZWN0ZWRMaW5rQ29uc3RyYWludHMpIHtcbiAgICAgICAgICAgIHRoaXMubGlua0FjY2Vzc29yLmdldE1pblNlcGFyYXRpb24gPSB0aGlzLl9kaXJlY3RlZExpbmtDb25zdHJhaW50cy5nZXRNaW5TZXBhcmF0aW9uO1xuICAgICAgICAgICAgY3VyQ29uc3RyYWludHMgPSBjdXJDb25zdHJhaW50cy5jb25jYXQobGlua2xlbmd0aHNfMS5nZW5lcmF0ZURpcmVjdGVkRWRnZUNvbnN0cmFpbnRzKG4sIHRoaXMuX2xpbmtzLCB0aGlzLl9kaXJlY3RlZExpbmtDb25zdHJhaW50cy5heGlzLCAodGhpcy5saW5rQWNjZXNzb3IpKSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5hdm9pZE92ZXJsYXBzKGZhbHNlKTtcbiAgICAgICAgdGhpcy5fZGVzY2VudCA9IG5ldyBkZXNjZW50XzEuRGVzY2VudChbeCwgeV0sIEQpO1xuICAgICAgICB0aGlzLl9kZXNjZW50LmxvY2tzLmNsZWFyKCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICB2YXIgbyA9IHRoaXMuX25vZGVzW2ldO1xuICAgICAgICAgICAgaWYgKG8uZml4ZWQpIHtcbiAgICAgICAgICAgICAgICBvLnB4ID0gby54O1xuICAgICAgICAgICAgICAgIG8ucHkgPSBvLnk7XG4gICAgICAgICAgICAgICAgdmFyIHAgPSBbby54LCBvLnldO1xuICAgICAgICAgICAgICAgIHRoaXMuX2Rlc2NlbnQubG9ja3MuYWRkKGksIHApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2Rlc2NlbnQudGhyZXNob2xkID0gdGhpcy5fdGhyZXNob2xkO1xuICAgICAgICB0aGlzLmluaXRpYWxMYXlvdXQoaW5pdGlhbFVuY29uc3RyYWluZWRJdGVyYXRpb25zLCB4LCB5KTtcbiAgICAgICAgaWYgKGN1ckNvbnN0cmFpbnRzLmxlbmd0aCA+IDApXG4gICAgICAgICAgICB0aGlzLl9kZXNjZW50LnByb2plY3QgPSBuZXcgcmVjdGFuZ2xlXzEuUHJvamVjdGlvbih0aGlzLl9ub2RlcywgdGhpcy5fZ3JvdXBzLCB0aGlzLl9yb290R3JvdXAsIGN1ckNvbnN0cmFpbnRzKS5wcm9qZWN0RnVuY3Rpb25zKCk7XG4gICAgICAgIHRoaXMuX2Rlc2NlbnQucnVuKGluaXRpYWxVc2VyQ29uc3RyYWludEl0ZXJhdGlvbnMpO1xuICAgICAgICB0aGlzLnNlcGFyYXRlT3ZlcmxhcHBpbmdDb21wb25lbnRzKHcsIGgsIGNlbnRlckdyYXBoKTtcbiAgICAgICAgdGhpcy5hdm9pZE92ZXJsYXBzKGFvKTtcbiAgICAgICAgaWYgKGFvKSB7XG4gICAgICAgICAgICB0aGlzLl9ub2Rlcy5mb3JFYWNoKGZ1bmN0aW9uICh2LCBpKSB7IHYueCA9IHhbaV0sIHYueSA9IHlbaV07IH0pO1xuICAgICAgICAgICAgdGhpcy5fZGVzY2VudC5wcm9qZWN0ID0gbmV3IHJlY3RhbmdsZV8xLlByb2plY3Rpb24odGhpcy5fbm9kZXMsIHRoaXMuX2dyb3VwcywgdGhpcy5fcm9vdEdyb3VwLCBjdXJDb25zdHJhaW50cywgdHJ1ZSkucHJvamVjdEZ1bmN0aW9ucygpO1xuICAgICAgICAgICAgdGhpcy5fbm9kZXMuZm9yRWFjaChmdW5jdGlvbiAodiwgaSkgeyB4W2ldID0gdi54LCB5W2ldID0gdi55OyB9KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9kZXNjZW50LkcgPSBHO1xuICAgICAgICB0aGlzLl9kZXNjZW50LnJ1bihpbml0aWFsQWxsQ29uc3RyYWludHNJdGVyYXRpb25zKTtcbiAgICAgICAgaWYgKGdyaWRTbmFwSXRlcmF0aW9ucykge1xuICAgICAgICAgICAgdGhpcy5fZGVzY2VudC5zbmFwU3RyZW5ndGggPSAxMDAwO1xuICAgICAgICAgICAgdGhpcy5fZGVzY2VudC5zbmFwR3JpZFNpemUgPSB0aGlzLl9ub2Rlc1swXS53aWR0aDtcbiAgICAgICAgICAgIHRoaXMuX2Rlc2NlbnQubnVtR3JpZFNuYXBOb2RlcyA9IG47XG4gICAgICAgICAgICB0aGlzLl9kZXNjZW50LnNjYWxlU25hcEJ5TWF4SCA9IG4gIT0gTjtcbiAgICAgICAgICAgIHZhciBHMCA9IGRlc2NlbnRfMS5EZXNjZW50LmNyZWF0ZVNxdWFyZU1hdHJpeChOLCBmdW5jdGlvbiAoaSwgaikge1xuICAgICAgICAgICAgICAgIGlmIChpID49IG4gfHwgaiA+PSBuKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gR1tpXVtqXTtcbiAgICAgICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5fZGVzY2VudC5HID0gRzA7XG4gICAgICAgICAgICB0aGlzLl9kZXNjZW50LnJ1bihncmlkU25hcEl0ZXJhdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudXBkYXRlTm9kZVBvc2l0aW9ucygpO1xuICAgICAgICB0aGlzLnNlcGFyYXRlT3ZlcmxhcHBpbmdDb21wb25lbnRzKHcsIGgsIGNlbnRlckdyYXBoKTtcbiAgICAgICAgcmV0dXJuIGtlZXBSdW5uaW5nID8gdGhpcy5yZXN1bWUoKSA6IHRoaXM7XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLmluaXRpYWxMYXlvdXQgPSBmdW5jdGlvbiAoaXRlcmF0aW9ucywgeCwgeSkge1xuICAgICAgICBpZiAodGhpcy5fZ3JvdXBzLmxlbmd0aCA+IDAgJiYgaXRlcmF0aW9ucyA+IDApIHtcbiAgICAgICAgICAgIHZhciBuID0gdGhpcy5fbm9kZXMubGVuZ3RoO1xuICAgICAgICAgICAgdmFyIGVkZ2VzID0gdGhpcy5fbGlua3MubWFwKGZ1bmN0aW9uIChlKSB7IHJldHVybiAoeyBzb3VyY2U6IGUuc291cmNlLmluZGV4LCB0YXJnZXQ6IGUudGFyZ2V0LmluZGV4IH0pOyB9KTtcbiAgICAgICAgICAgIHZhciB2cyA9IHRoaXMuX25vZGVzLm1hcChmdW5jdGlvbiAodikgeyByZXR1cm4gKHsgaW5kZXg6IHYuaW5kZXggfSk7IH0pO1xuICAgICAgICAgICAgdGhpcy5fZ3JvdXBzLmZvckVhY2goZnVuY3Rpb24gKGcsIGkpIHtcbiAgICAgICAgICAgICAgICB2cy5wdXNoKHsgaW5kZXg6IGcuaW5kZXggPSBuICsgaSB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5fZ3JvdXBzLmZvckVhY2goZnVuY3Rpb24gKGcsIGkpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGcubGVhdmVzICE9PSAndW5kZWZpbmVkJylcbiAgICAgICAgICAgICAgICAgICAgZy5sZWF2ZXMuZm9yRWFjaChmdW5jdGlvbiAodikgeyByZXR1cm4gZWRnZXMucHVzaCh7IHNvdXJjZTogZy5pbmRleCwgdGFyZ2V0OiB2LmluZGV4IH0pOyB9KTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGcuZ3JvdXBzICE9PSAndW5kZWZpbmVkJylcbiAgICAgICAgICAgICAgICAgICAgZy5ncm91cHMuZm9yRWFjaChmdW5jdGlvbiAoZ2cpIHsgcmV0dXJuIGVkZ2VzLnB1c2goeyBzb3VyY2U6IGcuaW5kZXgsIHRhcmdldDogZ2cuaW5kZXggfSk7IH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBuZXcgTGF5b3V0KClcbiAgICAgICAgICAgICAgICAuc2l6ZSh0aGlzLnNpemUoKSlcbiAgICAgICAgICAgICAgICAubm9kZXModnMpXG4gICAgICAgICAgICAgICAgLmxpbmtzKGVkZ2VzKVxuICAgICAgICAgICAgICAgIC5hdm9pZE92ZXJsYXBzKGZhbHNlKVxuICAgICAgICAgICAgICAgIC5saW5rRGlzdGFuY2UodGhpcy5saW5rRGlzdGFuY2UoKSlcbiAgICAgICAgICAgICAgICAuc3ltbWV0cmljRGlmZkxpbmtMZW5ndGhzKDUpXG4gICAgICAgICAgICAgICAgLmNvbnZlcmdlbmNlVGhyZXNob2xkKDFlLTQpXG4gICAgICAgICAgICAgICAgLnN0YXJ0KGl0ZXJhdGlvbnMsIDAsIDAsIDAsIGZhbHNlKTtcbiAgICAgICAgICAgIHRoaXMuX25vZGVzLmZvckVhY2goZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgICAgICB4W3YuaW5kZXhdID0gdnNbdi5pbmRleF0ueDtcbiAgICAgICAgICAgICAgICB5W3YuaW5kZXhdID0gdnNbdi5pbmRleF0ueTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fZGVzY2VudC5ydW4oaXRlcmF0aW9ucyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUuc2VwYXJhdGVPdmVybGFwcGluZ0NvbXBvbmVudHMgPSBmdW5jdGlvbiAod2lkdGgsIGhlaWdodCwgY2VudGVyR3JhcGgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgaWYgKGNlbnRlckdyYXBoID09PSB2b2lkIDApIHsgY2VudGVyR3JhcGggPSB0cnVlOyB9XG4gICAgICAgIGlmICghdGhpcy5fZGlzdGFuY2VNYXRyaXggJiYgdGhpcy5faGFuZGxlRGlzY29ubmVjdGVkKSB7XG4gICAgICAgICAgICB2YXIgeF8xID0gdGhpcy5fZGVzY2VudC54WzBdLCB5XzEgPSB0aGlzLl9kZXNjZW50LnhbMV07XG4gICAgICAgICAgICB0aGlzLl9ub2Rlcy5mb3JFYWNoKGZ1bmN0aW9uICh2LCBpKSB7IHYueCA9IHhfMVtpXSwgdi55ID0geV8xW2ldOyB9KTtcbiAgICAgICAgICAgIHZhciBncmFwaHMgPSBoYW5kbGVkaXNjb25uZWN0ZWRfMS5zZXBhcmF0ZUdyYXBocyh0aGlzLl9ub2RlcywgdGhpcy5fbGlua3MpO1xuICAgICAgICAgICAgaGFuZGxlZGlzY29ubmVjdGVkXzEuYXBwbHlQYWNraW5nKGdyYXBocywgd2lkdGgsIGhlaWdodCwgdGhpcy5fZGVmYXVsdE5vZGVTaXplLCAoaGVpZ2h0IC8gd2lkdGgpLCBjZW50ZXJHcmFwaCk7XG4gICAgICAgICAgICB0aGlzLl9ub2Rlcy5mb3JFYWNoKGZ1bmN0aW9uICh2LCBpKSB7XG4gICAgICAgICAgICAgICAgX3RoaXMuX2Rlc2NlbnQueFswXVtpXSA9IHYueCwgX3RoaXMuX2Rlc2NlbnQueFsxXVtpXSA9IHYueTtcbiAgICAgICAgICAgICAgICBpZiAodi5ib3VuZHMpIHtcbiAgICAgICAgICAgICAgICAgICAgdi5ib3VuZHMuc2V0WENlbnRyZSh2LngpO1xuICAgICAgICAgICAgICAgICAgICB2LmJvdW5kcy5zZXRZQ2VudHJlKHYueSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUucmVzdW1lID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hbHBoYSgwLjEpO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hbHBoYSgwKTtcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUucHJlcGFyZUVkZ2VSb3V0aW5nID0gZnVuY3Rpb24gKG5vZGVNYXJnaW4pIHtcbiAgICAgICAgaWYgKG5vZGVNYXJnaW4gPT09IHZvaWQgMCkgeyBub2RlTWFyZ2luID0gMDsgfVxuICAgICAgICB0aGlzLl92aXNpYmlsaXR5R3JhcGggPSBuZXcgZ2VvbV8xLlRhbmdlbnRWaXNpYmlsaXR5R3JhcGgodGhpcy5fbm9kZXMubWFwKGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICByZXR1cm4gdi5ib3VuZHMuaW5mbGF0ZSgtbm9kZU1hcmdpbikudmVydGljZXMoKTtcbiAgICAgICAgfSkpO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5yb3V0ZUVkZ2UgPSBmdW5jdGlvbiAoZWRnZSwgYWgsIGRyYXcpIHtcbiAgICAgICAgaWYgKGFoID09PSB2b2lkIDApIHsgYWggPSA1OyB9XG4gICAgICAgIHZhciBsaW5lRGF0YSA9IFtdO1xuICAgICAgICB2YXIgdmcyID0gbmV3IGdlb21fMS5UYW5nZW50VmlzaWJpbGl0eUdyYXBoKHRoaXMuX3Zpc2liaWxpdHlHcmFwaC5QLCB7IFY6IHRoaXMuX3Zpc2liaWxpdHlHcmFwaC5WLCBFOiB0aGlzLl92aXNpYmlsaXR5R3JhcGguRSB9KSwgcG9ydDEgPSB7IHg6IGVkZ2Uuc291cmNlLngsIHk6IGVkZ2Uuc291cmNlLnkgfSwgcG9ydDIgPSB7IHg6IGVkZ2UudGFyZ2V0LngsIHk6IGVkZ2UudGFyZ2V0LnkgfSwgc3RhcnQgPSB2ZzIuYWRkUG9pbnQocG9ydDEsIGVkZ2Uuc291cmNlLmluZGV4KSwgZW5kID0gdmcyLmFkZFBvaW50KHBvcnQyLCBlZGdlLnRhcmdldC5pbmRleCk7XG4gICAgICAgIHZnMi5hZGRFZGdlSWZWaXNpYmxlKHBvcnQxLCBwb3J0MiwgZWRnZS5zb3VyY2UuaW5kZXgsIGVkZ2UudGFyZ2V0LmluZGV4KTtcbiAgICAgICAgaWYgKHR5cGVvZiBkcmF3ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgZHJhdyh2ZzIpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzb3VyY2VJbmQgPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gZS5zb3VyY2UuaWQ7IH0sIHRhcmdldEluZCA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBlLnRhcmdldC5pZDsgfSwgbGVuZ3RoID0gZnVuY3Rpb24gKGUpIHsgcmV0dXJuIGUubGVuZ3RoKCk7IH0sIHNwQ2FsYyA9IG5ldyBzaG9ydGVzdHBhdGhzXzEuQ2FsY3VsYXRvcih2ZzIuVi5sZW5ndGgsIHZnMi5FLCBzb3VyY2VJbmQsIHRhcmdldEluZCwgbGVuZ3RoKSwgc2hvcnRlc3RQYXRoID0gc3BDYWxjLlBhdGhGcm9tTm9kZVRvTm9kZShzdGFydC5pZCwgZW5kLmlkKTtcbiAgICAgICAgaWYgKHNob3J0ZXN0UGF0aC5sZW5ndGggPT09IDEgfHwgc2hvcnRlc3RQYXRoLmxlbmd0aCA9PT0gdmcyLlYubGVuZ3RoKSB7XG4gICAgICAgICAgICB2YXIgcm91dGUgPSByZWN0YW5nbGVfMS5tYWtlRWRnZUJldHdlZW4oZWRnZS5zb3VyY2UuaW5uZXJCb3VuZHMsIGVkZ2UudGFyZ2V0LmlubmVyQm91bmRzLCBhaCk7XG4gICAgICAgICAgICBsaW5lRGF0YSA9IFtyb3V0ZS5zb3VyY2VJbnRlcnNlY3Rpb24sIHJvdXRlLmFycm93U3RhcnRdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIG4gPSBzaG9ydGVzdFBhdGgubGVuZ3RoIC0gMiwgcCA9IHZnMi5WW3Nob3J0ZXN0UGF0aFtuXV0ucCwgcSA9IHZnMi5WW3Nob3J0ZXN0UGF0aFswXV0ucCwgbGluZURhdGEgPSBbZWRnZS5zb3VyY2UuaW5uZXJCb3VuZHMucmF5SW50ZXJzZWN0aW9uKHAueCwgcC55KV07XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gbjsgaSA+PSAwOyAtLWkpXG4gICAgICAgICAgICAgICAgbGluZURhdGEucHVzaCh2ZzIuVltzaG9ydGVzdFBhdGhbaV1dLnApO1xuICAgICAgICAgICAgbGluZURhdGEucHVzaChyZWN0YW5nbGVfMS5tYWtlRWRnZVRvKHEsIGVkZ2UudGFyZ2V0LmlubmVyQm91bmRzLCBhaCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBsaW5lRGF0YTtcbiAgICB9O1xuICAgIExheW91dC5nZXRTb3VyY2VJbmRleCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2YgZS5zb3VyY2UgPT09ICdudW1iZXInID8gZS5zb3VyY2UgOiBlLnNvdXJjZS5pbmRleDtcbiAgICB9O1xuICAgIExheW91dC5nZXRUYXJnZXRJbmRleCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2YgZS50YXJnZXQgPT09ICdudW1iZXInID8gZS50YXJnZXQgOiBlLnRhcmdldC5pbmRleDtcbiAgICB9O1xuICAgIExheW91dC5saW5rSWQgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICByZXR1cm4gTGF5b3V0LmdldFNvdXJjZUluZGV4KGUpICsgXCItXCIgKyBMYXlvdXQuZ2V0VGFyZ2V0SW5kZXgoZSk7XG4gICAgfTtcbiAgICBMYXlvdXQuZHJhZ1N0YXJ0ID0gZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgaWYgKGlzR3JvdXAoZCkpIHtcbiAgICAgICAgICAgIExheW91dC5zdG9yZU9mZnNldChkLCBMYXlvdXQuZHJhZ09yaWdpbihkKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBMYXlvdXQuc3RvcE5vZGUoZCk7XG4gICAgICAgICAgICBkLmZpeGVkIHw9IDI7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIExheW91dC5zdG9wTm9kZSA9IGZ1bmN0aW9uICh2KSB7XG4gICAgICAgIHYucHggPSB2Lng7XG4gICAgICAgIHYucHkgPSB2Lnk7XG4gICAgfTtcbiAgICBMYXlvdXQuc3RvcmVPZmZzZXQgPSBmdW5jdGlvbiAoZCwgb3JpZ2luKSB7XG4gICAgICAgIGlmICh0eXBlb2YgZC5sZWF2ZXMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBkLmxlYXZlcy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICAgICAgdi5maXhlZCB8PSAyO1xuICAgICAgICAgICAgICAgIExheW91dC5zdG9wTm9kZSh2KTtcbiAgICAgICAgICAgICAgICB2Ll9kcmFnR3JvdXBPZmZzZXRYID0gdi54IC0gb3JpZ2luLng7XG4gICAgICAgICAgICAgICAgdi5fZHJhZ0dyb3VwT2Zmc2V0WSA9IHYueSAtIG9yaWdpbi55O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBkLmdyb3VwcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGQuZ3JvdXBzLmZvckVhY2goZnVuY3Rpb24gKGcpIHsgcmV0dXJuIExheW91dC5zdG9yZU9mZnNldChnLCBvcmlnaW4pOyB9KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgTGF5b3V0LmRyYWdPcmlnaW4gPSBmdW5jdGlvbiAoZCkge1xuICAgICAgICBpZiAoaXNHcm91cChkKSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB4OiBkLmJvdW5kcy5jeCgpLFxuICAgICAgICAgICAgICAgIHk6IGQuYm91bmRzLmN5KClcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZDtcbiAgICAgICAgfVxuICAgIH07XG4gICAgTGF5b3V0LmRyYWcgPSBmdW5jdGlvbiAoZCwgcG9zaXRpb24pIHtcbiAgICAgICAgaWYgKGlzR3JvdXAoZCkpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZC5sZWF2ZXMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgZC5sZWF2ZXMuZm9yRWFjaChmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgICAgICAgICBkLmJvdW5kcy5zZXRYQ2VudHJlKHBvc2l0aW9uLngpO1xuICAgICAgICAgICAgICAgICAgICBkLmJvdW5kcy5zZXRZQ2VudHJlKHBvc2l0aW9uLnkpO1xuICAgICAgICAgICAgICAgICAgICB2LnB4ID0gdi5fZHJhZ0dyb3VwT2Zmc2V0WCArIHBvc2l0aW9uLng7XG4gICAgICAgICAgICAgICAgICAgIHYucHkgPSB2Ll9kcmFnR3JvdXBPZmZzZXRZICsgcG9zaXRpb24ueTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlb2YgZC5ncm91cHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgZC5ncm91cHMuZm9yRWFjaChmdW5jdGlvbiAoZykgeyByZXR1cm4gTGF5b3V0LmRyYWcoZywgcG9zaXRpb24pOyB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGQucHggPSBwb3NpdGlvbi54O1xuICAgICAgICAgICAgZC5weSA9IHBvc2l0aW9uLnk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIExheW91dC5kcmFnRW5kID0gZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgaWYgKGlzR3JvdXAoZCkpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZC5sZWF2ZXMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgZC5sZWF2ZXMuZm9yRWFjaChmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgICAgICAgICBMYXlvdXQuZHJhZ0VuZCh2KTtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHYuX2RyYWdHcm91cE9mZnNldFg7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB2Ll9kcmFnR3JvdXBPZmZzZXRZO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBkLmdyb3VwcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBkLmdyb3Vwcy5mb3JFYWNoKExheW91dC5kcmFnRW5kKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGQuZml4ZWQgJj0gfjY7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIExheW91dC5tb3VzZU92ZXIgPSBmdW5jdGlvbiAoZCkge1xuICAgICAgICBkLmZpeGVkIHw9IDQ7XG4gICAgICAgIGQucHggPSBkLngsIGQucHkgPSBkLnk7XG4gICAgfTtcbiAgICBMYXlvdXQubW91c2VPdXQgPSBmdW5jdGlvbiAoZCkge1xuICAgICAgICBkLmZpeGVkICY9IH40O1xuICAgIH07XG4gICAgcmV0dXJuIExheW91dDtcbn0oKSk7XG5leHBvcnRzLkxheW91dCA9IExheW91dDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSm1hV3hsSWpvaWJHRjViM1YwTG1weklpd2ljMjkxY21ObFVtOXZkQ0k2SWlJc0luTnZkWEpqWlhNaU9sc2lMaTR2TGk0dlYyVmlRMjlzWVM5emNtTXZiR0Y1YjNWMExuUnpJbDBzSW01aGJXVnpJanBiWFN3aWJXRndjR2x1WjNNaU9pSTdPMEZCUVVFc2VVTkJRVEJETzBGQlF6RkRMRFpEUVVFclNEdEJRVU12U0N4eFEwRkJhVU03UVVGRGFrTXNlVU5CUVRoRk8wRkJRemxGTEdsRVFVRXdRenRCUVVNeFF5d3JRa0ZCZFVRN1FVRkRka1FzTWtSQlFXbEZPMEZCVHpkRUxFbEJRVmtzVTBGQk9FSTdRVUZCTVVNc1YwRkJXU3hUUVVGVE8wbEJRVWNzTWtOQlFVc3NRMEZCUVR0SlFVRkZMSGxEUVVGSkxFTkJRVUU3U1VGQlJTeDFRMEZCUnl4RFFVRkJPMEZCUVVNc1EwRkJReXhGUVVFNVFpeFRRVUZUTEVkQlFWUXNhVUpCUVZNc1MwRkJWQ3hwUWtGQlV5eFJRVUZ4UWp0QlFVRkJMRU5CUVVNN1FVRXJRek5ETEZOQlFWTXNUMEZCVHl4RFFVRkRMRU5CUVUwN1NVRkRia0lzVDBGQlR5eFBRVUZQTEVOQlFVTXNRMEZCUXl4TlFVRk5MRXRCUVVzc1YwRkJWeXhKUVVGSkxFOUJRVThzUTBGQlF5eERRVUZETEUxQlFVMHNTMEZCU3l4WFFVRlhMRU5CUVVNN1FVRkRPVVVzUTBGQlF6dEJRWGRDUkR0SlFVRkJPMUZCUVVFc2FVSkJkWGxDUXp0UlFYUjVRbGNzWjBKQlFWY3NSMEZCUnl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU55UWl4clFrRkJZU3hIUVVGNVF5eEZRVUZGTEVOQlFVTTdVVUZEZWtRc2NVSkJRV2RDTEVkQlFWY3NSVUZCUlN4RFFVRkRPMUZCUXpsQ0xEQkNRVUZ4UWl4SFFVRkhMRWxCUVVrc1EwRkJRenRSUVVNM1FpeGpRVUZUTEVkQlFVY3NTVUZCU1N4RFFVRkRPMUZCUTJwQ0xHMUNRVUZqTEVkQlFVY3NTMEZCU3l4RFFVRkRPMUZCUTNaQ0xIZENRVUZ0UWl4SFFVRkhMRWxCUVVrc1EwRkJRenRSUVVjelFpeGhRVUZSTEVkQlFVY3NTMEZCU3l4RFFVRkRPMUZCUTJwQ0xGZEJRVTBzUjBGQlJ5eEZRVUZGTEVOQlFVTTdVVUZEV2l4WlFVRlBMRWRCUVVjc1JVRkJSU3hEUVVGRE8xRkJRMklzWlVGQlZTeEhRVUZITEVsQlFVa3NRMEZCUXp0UlFVTnNRaXhYUVVGTkxFZEJRVEJDTEVWQlFVVXNRMEZCUXp0UlFVTnVReXhwUWtGQldTeEhRVUZITEVWQlFVVXNRMEZCUXp0UlFVTnNRaXh2UWtGQlpTeEhRVUZITEVsQlFVa3NRMEZCUXp0UlFVTjJRaXhoUVVGUkxFZEJRVmtzU1VGQlNTeERRVUZETzFGQlEzcENMRFpDUVVGM1FpeEhRVUZITEVsQlFVa3NRMEZCUXp0UlFVTm9ReXhsUVVGVkxFZEJRVWNzU1VGQlNTeERRVUZETzFGQlEyeENMSEZDUVVGblFpeEhRVUZITEVsQlFVa3NRMEZCUXp0UlFVTjRRaXh6UWtGQmFVSXNSMEZCUnl4SlFVRkpMRU5CUVVNN1VVRkhka0lzVlVGQlN5eEhRVUZITEVsQlFVa3NRMEZCUXp0UlFXdFdka0lzYVVKQlFWa3NSMEZCTWtJN1dVRkRia01zWTBGQll5eEZRVUZGTEUxQlFVMHNRMEZCUXl4alFVRmpPMWxCUTNKRExHTkJRV01zUlVGQlJTeE5RVUZOTEVOQlFVTXNZMEZCWXp0WlFVTnlReXhUUVVGVExFVkJRVVVzVFVGQlRTeERRVUZETEdGQlFXRTdXVUZETDBJc1QwRkJUeXhGUVVGRkxGVkJRVUVzUTBGQlF5eEpRVUZKTEU5QlFVRXNUMEZCVHl4TFFVRkpMRU5CUVVNc1UwRkJVeXhMUVVGTExGVkJRVlVzUTBGQlF5eERRVUZETEVOQlFVTXNTMEZCU1N4RFFVRkRMRk5CUVZNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRTFSQ3hEUVVFMFJEdFRRVU0zUlN4RFFVRkRPMGxCZDJKT0xFTkJRVU03U1VFemQwSlZMRzFDUVVGRkxFZEJRVlFzVlVGQlZTeERRVUZ4UWl4RlFVRkZMRkZCUVdsRE8xRkJSVGxFTEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1MwRkJTenRaUVVGRkxFbEJRVWtzUTBGQlF5eExRVUZMTEVkQlFVY3NSVUZCUlN4RFFVRkRPMUZCUTJwRExFbEJRVWtzVDBGQlR5eERRVUZETEV0QlFVc3NVVUZCVVN4RlFVRkZPMWxCUTNaQ0xFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNVMEZCVXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzVVVGQlVTeERRVUZETzFOQlEzWkRPMkZCUVUwN1dVRkRTQ3hKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRkZCUVZFc1EwRkJRenRUUVVNMVFqdFJRVU5FTEU5QlFVOHNTVUZCU1N4RFFVRkRPMGxCUTJoQ0xFTkJRVU03U1VGSlV5eDNRa0ZCVHl4SFFVRnFRaXhWUVVGclFpeERRVUZSTzFGQlEzUkNMRWxCUVVrc1NVRkJTU3hEUVVGRExFdEJRVXNzU1VGQlNTeFBRVUZQTEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eExRVUZMTEZkQlFWY3NSVUZCUlR0WlFVTjZSQ3hKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFRRVU42UWp0SlFVTk1MRU5CUVVNN1NVRkxVeXh4UWtGQlNTeEhRVUZrTzFGQlEwa3NUMEZCVHl4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFVkJRVVU3V1VGQlF5eERRVUZETzBsQlEzcENMRU5CUVVNN1NVRkxVeXh4UWtGQlNTeEhRVUZrTzFGQlEwa3NTVUZCU1N4SlFVRkpMRU5CUVVNc1RVRkJUU3hIUVVGSExFbEJRVWtzUTBGQlF5eFZRVUZWTEVWQlFVVTdXVUZETDBJc1NVRkJTU3hEUVVGRExGRkJRVkVzUjBGQlJ5eExRVUZMTEVOQlFVTTdXVUZEZEVJc1NVRkJTU3hEUVVGRExFOUJRVThzUTBGQlF5eEZRVUZGTEVsQlFVa3NSVUZCUlN4VFFVRlRMRU5CUVVNc1IwRkJSeXhGUVVGRkxFdEJRVXNzUlVGQlJTeEpRVUZKTEVOQlFVTXNUVUZCVFN4SFFVRkhMRU5CUVVNc1JVRkJSU3hOUVVGTkxFVkJRVVVzU1VGQlNTeERRVUZETEZkQlFWY3NSVUZCUlN4RFFVRkRMRU5CUVVNN1dVRkRlRVlzVDBGQlR5eEpRVUZKTEVOQlFVTTdVMEZEWmp0UlFVTkVMRWxCUVUwc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNUVUZCVFN4RlFVTjBRaXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4TlFVRk5MRU5CUVVNN1VVRkROMElzU1VGQlNTeERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRPMUZCUlZRc1NVRkJTU3hEUVVGRExGRkJRVkVzUTBGQlF5eExRVUZMTEVOQlFVTXNTMEZCU3l4RlFVRkZMRU5CUVVNN1VVRkROVUlzUzBGQlN5eERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUlVGQlJTeERRVUZETEVWQlFVVTdXVUZEY0VJc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRia0lzU1VGQlNTeERRVUZETEVOQlFVTXNTMEZCU3l4RlFVRkZPMmRDUVVOVUxFbEJRVWtzVDBGQlR5eERRVUZETEVOQlFVTXNSVUZCUlN4TFFVRkxMRmRCUVZjc1NVRkJTU3hQUVVGUExFTkJRVU1zUTBGQlF5eEZRVUZGTEV0QlFVc3NWMEZCVnl4RlFVRkZPMjlDUVVNMVJDeERRVUZETEVOQlFVTXNSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03YjBKQlExZ3NRMEZCUXl4RFFVRkRMRVZCUVVVc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzJsQ1FVTmtPMmRDUVVORUxFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTTdaMEpCUTNKQ0xFbEJRVWtzUTBGQlF5eFJRVUZSTEVOQlFVTXNTMEZCU3l4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdZVUZEYWtNN1UwRkRTanRSUVVWRUxFbEJRVWtzUlVGQlJTeEhRVUZITEVsQlFVa3NRMEZCUXl4UlFVRlJMRU5CUVVNc1ZVRkJWU3hGUVVGRkxFTkJRVU03VVVGRmNFTXNTVUZCU1N4RlFVRkZMRXRCUVVzc1EwRkJReXhGUVVGRk8xbEJRMVlzU1VGQlNTeERRVUZETEUxQlFVMHNSMEZCUnl4RFFVRkRMRU5CUVVNN1UwRkRia0k3WVVGQlRTeEpRVUZKTEU5QlFVOHNTVUZCU1N4RFFVRkRMRmRCUVZjc1MwRkJTeXhYUVVGWExFVkJRVVU3V1VGRGFFUXNTVUZCU1N4RFFVRkRMRTFCUVUwc1IwRkJSeXhGUVVGRkxFTkJRVU03VTBGRGNFSTdVVUZEUkN4SlFVRkpMRU5CUVVNc1YwRkJWeXhIUVVGSExFVkJRVVVzUTBGQlF6dFJRVVYwUWl4SlFVRkpMRU5CUVVNc2JVSkJRVzFDTEVWQlFVVXNRMEZCUXp0UlFVVXpRaXhKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZETEVWQlFVVXNTVUZCU1N4RlFVRkZMRk5CUVZNc1EwRkJReXhKUVVGSkxFVkJRVVVzUzBGQlN5eEZRVUZGTEVsQlFVa3NRMEZCUXl4TlFVRk5MRVZCUVVVc1RVRkJUU3hGUVVGRkxFbEJRVWtzUTBGQlF5eFhRVUZYTEVWQlFVVXNRMEZCUXl4RFFVRkRPMUZCUTNKR0xFOUJRVThzUzBGQlN5eERRVUZETzBsQlEycENMRU5CUVVNN1NVRkhUeXh2UTBGQmJVSXNSMEZCTTBJN1VVRkRTU3hKUVVGTkxFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNVVUZCVVN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRkZCUVZFc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEY2tRc1NVRkJTU3hEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1RVRkJUU3hEUVVGRE8xRkJRemxDTEU5QlFVOHNRMEZCUXl4RlFVRkZMRVZCUVVVN1dVRkRVaXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVOdVFpeERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU5ZTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFOQlEyUTdTVUZEVEN4RFFVRkRPMGxCVjBRc2MwSkJRVXNzUjBGQlRDeFZRVUZOTEVOQlFVODdVVUZEVkN4SlFVRkpMRU5CUVVNc1EwRkJReXhGUVVGRk8xbEJRMG9zU1VGQlNTeEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRTFCUVUwc1MwRkJTeXhEUVVGRExFbEJRVWtzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4TlFVRk5MRWRCUVVjc1EwRkJReXhGUVVGRk8yZENRVWR3UkN4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU03WjBKQlExWXNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhQUVVGUExFTkJRVU1zVlVGQlZTeERRVUZETzI5Q1FVTXpRaXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRVZCUVZVc1EwRkJReXhEUVVGRExFMUJRVTBzUlVGQlZTeERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNN1owSkJRM2hFTEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVOSUxFbEJRVWtzUTBGQlF5eE5RVUZOTEVkQlFVY3NTVUZCU1N4TFFVRkxMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dG5Ra0ZETjBJc1MwRkJTeXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU1zUlVGQlJUdHZRa0ZEZUVJc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RlFVRkZMRU5CUVVNN2FVSkJRM1pDTzJGQlEwbzdXVUZEUkN4UFFVRlBMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU03VTBGRGRFSTdVVUZEUkN4SlFVRkpMRU5CUVVNc1RVRkJUU3hIUVVGSExFTkJRVU1zUTBGQlF6dFJRVU5vUWl4UFFVRlBMRWxCUVVrc1EwRkJRenRKUVVOb1FpeERRVUZETzBsQlUwUXNkVUpCUVUwc1IwRkJUaXhWUVVGUExFTkJRV2RDTzFGQlFYWkNMR2xDUVhWQ1F6dFJRWFJDUnl4SlFVRkpMRU5CUVVNc1EwRkJRenRaUVVGRkxFOUJRVThzU1VGQlNTeERRVUZETEU5QlFVOHNRMEZCUXp0UlFVTTFRaXhKUVVGSkxFTkJRVU1zVDBGQlR5eEhRVUZITEVOQlFVTXNRMEZCUXp0UlFVTnFRaXhKUVVGSkxFTkJRVU1zVlVGQlZTeEhRVUZITEVWQlFVVXNRMEZCUXp0UlFVTnlRaXhKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRkJMRU5CUVVNN1dVRkRiRUlzU1VGQlNTeFBRVUZQTEVOQlFVTXNRMEZCUXl4UFFVRlBMRXRCUVVzc1YwRkJWenRuUWtGRGFFTXNRMEZCUXl4RFFVRkRMRTlCUVU4c1IwRkJSeXhEUVVGRExFTkJRVU03V1VGRGJFSXNTVUZCU1N4UFFVRlBMRU5CUVVNc1EwRkJReXhOUVVGTkxFdEJRVXNzVjBGQlZ5eEZRVUZGTzJkQ1FVTnFReXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRE8yOUNRVU5zUWl4SlFVRkpMRTlCUVU4c1EwRkJReXhMUVVGTExGRkJRVkU3ZDBKQlEzSkNMRU5CUVVNc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4TFFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNUVUZCVFN4SFFVRkhMRU5CUVVNc1EwRkJRVHRuUWtGRGFrUXNRMEZCUXl4RFFVRkRMRU5CUVVNN1lVRkRUanRaUVVORUxFbEJRVWtzVDBGQlR5eERRVUZETEVOQlFVTXNUVUZCVFN4TFFVRkxMRmRCUVZjc1JVRkJSVHRuUWtGRGFrTXNRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhQUVVGUExFTkJRVU1zVlVGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXp0dlFrRkRia0lzU1VGQlNTeFBRVUZQTEVWQlFVVXNTMEZCU3l4UlFVRlJPM2RDUVVOMFFpeERRVUZETEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUzBGQlNTeERRVUZETEU5QlFVOHNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFMUJRVTBzUjBGQlJ5eERRVUZETEVOQlFVRTdaMEpCUTI1RUxFTkJRVU1zUTBGQlF5eERRVUZETzJGQlEwNDdVVUZEVEN4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOSUxFbEJRVWtzUTBGQlF5eFZRVUZWTEVOQlFVTXNUVUZCVFN4SFFVRkhMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zVFVGQlRTeERRVUZETEZWQlFVRXNRMEZCUXl4SlFVRkpMRTlCUVVFc1QwRkJUeXhEUVVGRExFTkJRVU1zVFVGQlRTeExRVUZMTEZkQlFWY3NSVUZCTDBJc1EwRkJLMElzUTBGQlF5eERRVUZETzFGQlEyeEdMRWxCUVVrc1EwRkJReXhWUVVGVkxFTkJRVU1zVFVGQlRTeEhRVUZITEVsQlFVa3NRMEZCUXl4UFFVRlBMRU5CUVVNc1RVRkJUU3hEUVVGRExGVkJRVUVzUTBGQlF5eEpRVUZKTEU5QlFVRXNUMEZCVHl4RFFVRkRMRU5CUVVNc1RVRkJUU3hMUVVGTExGZEJRVmNzUlVGQkwwSXNRMEZCSzBJc1EwRkJReXhEUVVGRE8xRkJRMjVHTEU5QlFVOHNTVUZCU1N4RFFVRkRPMGxCUTJoQ0xFTkJRVU03U1VGRlJDeHBRMEZCWjBJc1IwRkJhRUlzVlVGQmFVSXNRMEZCVnp0UlFVTjRRaXhKUVVGSkxFTkJRVU1zUjBGQlJ5eFZRVUZWTEVOQlFVTXNVMEZCVXl4RFFVRkRMRWxCUVVrc1EwRkJReXhOUVVGTkxFVkJRVVVzU1VGQlNTeERRVUZETEUxQlFVMHNSVUZCUlN4SlFVRkpMRU5CUVVNc1dVRkJXU3hGUVVGRkxFbEJRVWtzUTBGQlF5eFZRVUZWTEVOQlFVTXNRMEZCUXp0UlFVTXpSaXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJRenRSUVVOMFFpeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRUQ3hQUVVGUExFbEJRVWtzUTBGQlF6dEpRVU5vUWl4RFFVRkRPMGxCVlVRc09FSkJRV0VzUjBGQllpeFZRVUZqTEVOQlFWYzdVVUZEY2tJc1NVRkJTU3hEUVVGRExGTkJRVk1zUTBGQlF5eE5RVUZOTzFsQlFVVXNUMEZCVHl4SlFVRkpMRU5CUVVNc1kwRkJZeXhEUVVGRE8xRkJRMnhFTEVsQlFVa3NRMEZCUXl4alFVRmpMRWRCUVVjc1EwRkJReXhEUVVGRE8xRkJRM2hDTEU5QlFVOHNTVUZCU1N4RFFVRkRPMGxCUTJoQ0xFTkJRVU03U1VGWlJDeHRRMEZCYTBJc1IwRkJiRUlzVlVGQmJVSXNRMEZCVnp0UlFVTXhRaXhKUVVGSkxFTkJRVU1zVTBGQlV5eERRVUZETEUxQlFVMDdXVUZCUlN4UFFVRlBMRWxCUVVrc1EwRkJReXh0UWtGQmJVSXNRMEZCUXp0UlFVTjJSQ3hKUVVGSkxFTkJRVU1zYlVKQlFXMUNMRWRCUVVjc1EwRkJReXhEUVVGRE8xRkJRemRDTEU5QlFVOHNTVUZCU1N4RFFVRkRPMGxCUTJoQ0xFTkJRVU03U1VGUlJDd3lRa0ZCVlN4SFFVRldMRlZCUVZjc1NVRkJXU3hGUVVGRkxHRkJRWGRETzFGQlF6ZEVMRWxCUVVrc1EwRkJReXhUUVVGVExFTkJRVU1zVFVGQlRUdFpRVUZGTEVsQlFVa3NSMEZCUnl4SFFVRkhMRU5CUVVNN1VVRkRiRU1zU1VGQlNTeERRVUZETEhkQ1FVRjNRaXhIUVVGSE8xbEJRelZDTEVsQlFVa3NSVUZCUlN4SlFVRkpPMWxCUTFZc1owSkJRV2RDTEVWQlFVVXNUMEZCVHl4aFFVRmhMRXRCUVVzc1VVRkJVU3hEUVVGRExFTkJRVU1zUTBGQlF5eGpRVUZqTEU5QlFVOHNZVUZCWVN4RFFVRkJMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eGhRVUZoTzFOQlF6ZEhMRU5CUVVNN1VVRkRSaXhQUVVGUExFbEJRVWtzUTBGQlF6dEpRVU5vUWl4RFFVRkRPMGxCVTBRc2MwSkJRVXNzUjBGQlRDeFZRVUZOTEVOQlFUUkNPMUZCUXpsQ0xFbEJRVWtzUTBGQlF5eFRRVUZUTEVOQlFVTXNUVUZCVFR0WlFVRkZMRTlCUVU4c1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF6dFJRVU14UXl4SlFVRkpMRU5CUVVNc1RVRkJUU3hIUVVGSExFTkJRVU1zUTBGQlF6dFJRVU5vUWl4UFFVRlBMRWxCUVVrc1EwRkJRenRKUVVOb1FpeERRVUZETzBsQlZVUXNORUpCUVZjc1IwRkJXQ3hWUVVGWkxFTkJRV003VVVGRGRFSXNTVUZCU1N4RFFVRkRMRk5CUVZNc1EwRkJReXhOUVVGTk8xbEJRVVVzVDBGQlR5eEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkRPMUZCUTJoRUxFbEJRVWtzUTBGQlF5eFpRVUZaTEVkQlFVY3NRMEZCUXl4RFFVRkRPMUZCUTNSQ0xFOUJRVThzU1VGQlNTeERRVUZETzBsQlEyaENMRU5CUVVNN1NVRlhSQ3dyUWtGQll5eEhRVUZrTEZWQlFXVXNRMEZCVHp0UlFVTnNRaXhKUVVGSkxFTkJRVU1zVTBGQlV5eERRVUZETEUxQlFVMDdXVUZCUlN4UFFVRlBMRWxCUVVrc1EwRkJReXhsUVVGbExFTkJRVU03VVVGRGJrUXNTVUZCU1N4RFFVRkRMR1ZCUVdVc1IwRkJSeXhEUVVGRExFTkJRVU03VVVGRGVrSXNUMEZCVHl4SlFVRkpMRU5CUVVNN1NVRkRhRUlzUTBGQlF6dEpRVlZFTEhGQ1FVRkpMRWRCUVVvc1ZVRkJTeXhEUVVGcFFqdFJRVU5zUWl4SlFVRkpMRU5CUVVNc1EwRkJRenRaUVVGRkxFOUJRVThzU1VGQlNTeERRVUZETEZkQlFWY3NRMEZCUXp0UlFVTm9ReXhKUVVGSkxFTkJRVU1zVjBGQlZ5eEhRVUZITEVOQlFVTXNRMEZCUXp0UlFVTnlRaXhQUVVGUExFbEJRVWtzUTBGQlF6dEpRVU5vUWl4RFFVRkRPMGxCVTBRc1owTkJRV1VzUjBGQlppeFZRVUZuUWl4RFFVRlBPMUZCUTI1Q0xFbEJRVWtzUTBGQlF5eERRVUZETzFsQlFVVXNUMEZCVHl4SlFVRkpMRU5CUVVNc1owSkJRV2RDTEVOQlFVTTdVVUZEY2tNc1NVRkJTU3hEUVVGRExHZENRVUZuUWl4SFFVRkhMRU5CUVVNc1EwRkJRenRSUVVNeFFpeFBRVUZQTEVsQlFVa3NRMEZCUXp0SlFVTm9RaXhEUVVGRE8wbEJVMFFzYVVOQlFXZENMRWRCUVdoQ0xGVkJRV2xDTEVOQlFVODdVVUZEY0VJc1NVRkJTU3hEUVVGRExFTkJRVU03V1VGQlJTeFBRVUZQTEVsQlFVa3NRMEZCUXl4cFFrRkJhVUlzUTBGQlF6dFJRVU4wUXl4SlFVRkpMRU5CUVVNc2FVSkJRV2xDTEVkQlFVY3NRMEZCUXl4RFFVRkRPMUZCUXpOQ0xFOUJRVThzU1VGQlNTeERRVUZETzBsQlEyaENMRU5CUVVNN1NVRlRSQ3cyUWtGQldTeEhRVUZhTEZWQlFXRXNRMEZCVHp0UlFVTm9RaXhKUVVGSkxFTkJRVU1zUTBGQlF5eEZRVUZGTzFsQlEwb3NUMEZCVHl4SlFVRkpMRU5CUVVNc1lVRkJZU3hEUVVGRE8xTkJRemRDTzFGQlEwUXNTVUZCU1N4RFFVRkRMR0ZCUVdFc1IwRkJSeXhQUVVGUExFTkJRVU1zUzBGQlN5eFZRVUZWTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEZEVRc1NVRkJTU3hEUVVGRExIRkNRVUZ4UWl4SFFVRkhMRWxCUVVrc1EwRkJRenRSUVVOc1F5eFBRVUZQTEVsQlFVa3NRMEZCUXp0SlFVTm9RaXhEUVVGRE8wbEJSVVFzZVVKQlFWRXNSMEZCVWl4VlFVRlRMRU5CUVc5Q08xRkJRM3BDTEVsQlFVa3NRMEZCUXl4VFFVRlRMRWRCUVVjc1EwRkJReXhEUVVGRE8xRkJRMjVDTEU5QlFVOHNTVUZCU1N4RFFVRkRPMGxCUTJoQ0xFTkJRVU03U1VGSlJDeHhRMEZCYjBJc1IwRkJjRUlzVlVGQmNVSXNRMEZCVlR0UlFVTXpRaXhKUVVGSkxFTkJRVU1zUTBGQlF6dFpRVUZGTEU5QlFVOHNTVUZCU1N4RFFVRkRMRlZCUVZVc1EwRkJRenRSUVVNdlFpeEpRVUZKTEVOQlFVTXNWVUZCVlN4SFFVRkhMRTlCUVU4c1EwRkJReXhMUVVGTExGVkJRVlVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU51UkN4UFFVRlBMRWxCUVVrc1EwRkJRenRKUVVOb1FpeERRVUZETzBsQlNVUXNjMEpCUVVzc1IwRkJUQ3hWUVVGTkxFTkJRVlU3VVVGRFdpeEpRVUZKTEVOQlFVTXNVMEZCVXl4RFFVRkRMRTFCUVUwN1dVRkJSU3hQUVVGUExFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTTdZVUZEY2tNN1dVRkRSQ3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEVUN4SlFVRkpMRWxCUVVrc1EwRkJReXhOUVVGTkxFVkJRVVU3WjBKQlEySXNTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJRenR2UWtGQlJTeEpRVUZKTEVOQlFVTXNUVUZCVFN4SFFVRkhMRU5CUVVNc1EwRkJRenM3YjBKQlEzUkNMRWxCUVVrc1EwRkJReXhOUVVGTkxFZEJRVWNzUTBGQlF5eERRVUZETzJGQlEzaENPMmxDUVVGTkxFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlR0blFrRkRaQ3hKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEZGQlFWRXNSVUZCUlR0dlFrRkRhRUlzU1VGQlNTeERRVUZETEZGQlFWRXNSMEZCUnl4SlFVRkpMRU5CUVVNN2IwSkJRM0pDTEVsQlFVa3NRMEZCUXl4UFFVRlBMRU5CUVVNc1JVRkJSU3hKUVVGSkxFVkJRVVVzVTBGQlV5eERRVUZETEV0QlFVc3NSVUZCUlN4TFFVRkxMRVZCUVVVc1NVRkJTU3hEUVVGRExFMUJRVTBzUjBGQlJ5eERRVUZETEVWQlFVTXNRMEZCUXl4RFFVRkRPMjlDUVVNdlJDeEpRVUZKTEVOQlFVTXNTVUZCU1N4RlFVRkZMRU5CUVVNN2FVSkJRMlk3WVVGRFNqdFpRVU5FTEU5QlFVOHNTVUZCU1N4RFFVRkRPMU5CUTJZN1NVRkRUQ3hEUVVGRE8wbEJSVVFzT0VKQlFXRXNSMEZCWWl4VlFVRmpMRWxCUVhsQ08xRkJRMjVETEU5QlFVOHNUMEZCVHl4SlFVRkpMRU5CUVVNc1lVRkJZU3hMUVVGTExGVkJRVlVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRXJRaXhKUVVGSkxFTkJRVU1zWVVGQll5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGVExFbEJRVWtzUTBGQlF5eGhRVUZoTEVOQlFVTTdTVUZET1Vrc1EwRkJRenRKUVVWTkxHOUNRVUZoTEVkQlFYQkNMRlZCUVhGQ0xFbEJRWFZDTEVWQlFVVXNUVUZCWXp0UlFVTjRSQ3hKUVVGSkxFTkJRVU1zVFVGQlRTeEhRVUZITEUxQlFVMHNRMEZCUXp0SlFVTjZRaXhEUVVGRE8wbEJSVVFzTkVKQlFWY3NSMEZCV0N4VlFVRlpMRWxCUVhsQ08xRkJRMnBETEU5QlFVOHNUMEZCVHl4SlFVRkpMRU5CUVVNc1UwRkJVeXhMUVVGTExGVkJRVlVzUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRk5CUVZNc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMGxCUXpORkxFTkJRVU03U1VGdFFrUXNlVU5CUVhkQ0xFZEJRWGhDTEZWQlFYbENMRmRCUVcxQ0xFVkJRVVVzUTBGQllUdFJRVUV6UkN4cFFrRkpRenRSUVVvMlF5eHJRa0ZCUVN4RlFVRkJMRXRCUVdFN1VVRkRka1FzU1VGQlNTeERRVUZETEZsQlFWa3NRMEZCUXl4VlFVRkJMRU5CUVVNc1NVRkJTU3hQUVVGQkxGZEJRVmNzUjBGQlJ5eERRVUZETEVOQlFVTXNUVUZCVFN4RlFVRjBRaXhEUVVGelFpeERRVUZETEVOQlFVTTdVVUZETDBNc1NVRkJTU3hEUVVGRExIRkNRVUZ4UWl4SFFVRkhMR05CUVUwc1QwRkJRU3h6UTBGQmQwSXNRMEZCUXl4TFFVRkpMRU5CUVVNc1RVRkJUU3hGUVVGRkxFdEJRVWtzUTBGQlF5eFpRVUZaTEVWQlFVVXNRMEZCUXl4RFFVRkRMRVZCUVRORUxFTkJRVEpFTEVOQlFVTTdVVUZETDBZc1QwRkJUeXhKUVVGSkxFTkJRVU03U1VGRGFFSXNRMEZCUXp0SlFWbEVMRzFEUVVGclFpeEhRVUZzUWl4VlFVRnRRaXhYUVVGdFFpeEZRVUZGTEVOQlFXRTdVVUZCY2tRc2FVSkJTVU03VVVGS2RVTXNhMEpCUVVFc1JVRkJRU3hMUVVGaE8xRkJRMnBFTEVsQlFVa3NRMEZCUXl4WlFVRlpMRU5CUVVNc1ZVRkJRU3hEUVVGRExFbEJRVWtzVDBGQlFTeFhRVUZYTEVkQlFVY3NRMEZCUXl4RFFVRkRMRTFCUVUwc1JVRkJkRUlzUTBGQmMwSXNRMEZCUXl4RFFVRkRPMUZCUXk5RExFbEJRVWtzUTBGQlF5eHhRa0ZCY1VJc1IwRkJSeXhqUVVGTkxFOUJRVUVzWjBOQlFXdENMRU5CUVVNc1MwRkJTU3hEUVVGRExFMUJRVTBzUlVGQlJTeExRVUZKTEVOQlFVTXNXVUZCV1N4RlFVRkZMRU5CUVVNc1EwRkJReXhGUVVGeVJDeERRVUZ4UkN4RFFVRkRPMUZCUTNwR0xFOUJRVThzU1VGQlNTeERRVUZETzBsQlEyaENMRU5CUVVNN1NVRlpSQ3h6UWtGQlN5eEhRVUZNTEZWQlEwa3NPRUpCUVRCRExFVkJRekZETEN0Q1FVRXlReXhGUVVNelF5d3JRa0ZCTWtNc1JVRkRNME1zYTBKQlFUaENMRVZCUXpsQ0xGZEJRV3RDTEVWQlEyeENMRmRCUVd0Q08xRkJUblJDTEdsQ1FUSktRenRSUVRGS1J5d3JRMEZCUVN4RlFVRkJMR3REUVVFd1F6dFJRVU14UXl4blJFRkJRU3hGUVVGQkxHMURRVUV5UXp0UlFVTXpReXhuUkVGQlFTeEZRVUZCTEcxRFFVRXlRenRSUVVNelF5eHRRMEZCUVN4RlFVRkJMSE5DUVVFNFFqdFJRVU01UWl3MFFrRkJRU3hGUVVGQkxHdENRVUZyUWp0UlFVTnNRaXcwUWtGQlFTeEZRVUZCTEd0Q1FVRnJRanRSUVVWc1FpeEpRVUZKTEVOQlFWTXNSVUZEVkN4RFFVRlRMRVZCUTFRc1EwRkJReXhIUVVGblFpeEpRVUZKTEVOQlFVTXNTMEZCU3l4RlFVRkhMRU5CUVVNc1RVRkJUU3hGUVVOeVF5eERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZETEUxQlFVMHNSVUZETDBJc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNUVUZCVFN4RlFVTjBRaXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEZkQlFWY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkRka0lzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4WFFVRlhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRk5VSXNTVUZCU1N4RFFVRkRMRWRCUVVjc1NVRkJTU3hMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRWxCUVVrc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlJYWkRMRWxCUVVrc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF6dFJRVVZpTEVsQlFVa3NSVUZCUlN4SFFVRkhMRWxCUVVrc1EwRkJReXhqUVVGakxFTkJRVU03VVVGRk4wSXNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhQUVVGUExFTkJRVU1zVlVGQlF5eERRVUZETEVWQlFVVXNRMEZCUXp0WlFVTnlRaXhEUVVGRExFTkJRVU1zUzBGQlN5eEhRVUZITEVOQlFVTXNRMEZCUXp0WlFVTmFMRWxCUVVrc1QwRkJUeXhEUVVGRExFTkJRVU1zUTBGQlF5eExRVUZMTEZkQlFWY3NSVUZCUlR0blFrRkROVUlzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRoUVVNMVFqdFpRVU5FTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlF6TkNMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJSVWdzU1VGQlNTeEpRVUZKTEVOQlFVTXNjVUpCUVhGQ08xbEJRVVVzU1VGQlNTeERRVUZETEhGQ1FVRnhRaXhGUVVGRkxFTkJRVU03VVVGTE4wUXNTVUZCU1N4VFFVRlRMRU5CUVVNN1VVRkRaQ3hKUVVGSkxFbEJRVWtzUTBGQlF5eGxRVUZsTEVWQlFVVTdXVUZGZEVJc1UwRkJVeXhIUVVGSExFbEJRVWtzUTBGQlF5eGxRVUZsTEVOQlFVTTdVMEZEY0VNN1lVRkJUVHRaUVVWSUxGTkJRVk1zUjBGQlJ5eERRVUZETEVsQlFVa3NNRUpCUVZVc1EwRkJReXhEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEUxQlFVMHNSVUZCUlN4TlFVRk5MRU5CUVVNc1kwRkJZeXhGUVVGRkxFMUJRVTBzUTBGQlF5eGpRVUZqTEVWQlFVVXNWVUZCUVN4RFFVRkRMRWxCUVVjc1QwRkJRU3hMUVVGSkxFTkJRVU1zWVVGQllTeERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRnlRaXhEUVVGeFFpeERRVUZETEVOQlFVTXNRMEZCUXl4alFVRmpMRVZCUVVVc1EwRkJRenRaUVVsMlNTeERRVUZETEVkQlFVY3NhVUpCUVU4c1EwRkJReXhyUWtGQmEwSXNRMEZCUXl4RFFVRkRMRVZCUVVVc1kwRkJUU3hQUVVGQkxFTkJRVU1zUlVGQlJDeERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTXpReXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRkJMRU5CUVVNN1owSkJRMnBDTEVsQlFVa3NUMEZCVHl4RFFVRkRMRU5CUVVNc1RVRkJUU3hKUVVGSkxGRkJRVkU3YjBKQlFVVXNRMEZCUXl4RFFVRkRMRTFCUVUwc1IwRkJSeXhMUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZUTEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJRenRuUWtGRE1VVXNTVUZCU1N4UFFVRlBMRU5CUVVNc1EwRkJReXhOUVVGTkxFbEJRVWtzVVVGQlVUdHZRa0ZCUlN4RFFVRkRMRU5CUVVNc1RVRkJUU3hIUVVGSExFdEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFWTXNRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRE8xbEJRemxGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTBnc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eFBRVUZQTEVOQlFVTXNWVUZCUVN4RFFVRkRPMmRDUVVOcVFpeEpRVUZOTEVOQlFVTXNSMEZCUnl4TlFVRk5MRU5CUVVNc1kwRkJZeXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4TlFVRk5MRU5CUVVNc1kwRkJZeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzJkQ1FVTnFSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhOUVVGTkxFbEJRVWtzUTBGQlF5eERRVUZETzFsQlEzUkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xTkJRMDQ3VVVGRlJDeEpRVUZKTEVOQlFVTXNSMEZCUnl4cFFrRkJUeXhEUVVGRExHdENRVUZyUWl4RFFVRkRMRU5CUVVNc1JVRkJSU3hWUVVGVkxFTkJRVU1zUlVGQlJTeERRVUZETzFsQlEyaEVMRTlCUVU4c1UwRkJVeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUXpOQ0xFTkJRVU1zUTBGQlF5eERRVUZETzFGQlJVZ3NTVUZCU1N4SlFVRkpMRU5CUVVNc1ZVRkJWU3hKUVVGSkxFOUJRVThzU1VGQlNTeERRVUZETEZWQlFWVXNRMEZCUXl4TlFVRk5MRXRCUVVzc1YwRkJWeXhGUVVGRk8xbEJRMnhGTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRaUVVOV0xFbEJRVWtzWVVGQllTeEhRVUZITEZWQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hSUVVGUkxFVkJRVVVzWVVGQllUdG5Ra0ZET1VNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4UlFVRlJMRU5CUVVNN1owSkJRemRDTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzWVVGQllTeERRVUZETzFsQlEzUkRMRU5CUVVNc1EwRkJRenRaUVVOR0xFbEJRVWtzUTBGQlF5eFBRVUZQTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVVFc1EwRkJRenRuUWtGRGJFSXNZVUZCWVN4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEV0QlFVa3NRMEZCUXl4cFFrRkJhVUlzUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXp0blFrRnBRbkpFTEVsQlFVa3NUMEZCVHl4RFFVRkRMRU5CUVVNc1RVRkJUU3hMUVVGTExGZEJRVmNzUlVGQlJUdHZRa0ZEYWtNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenR2UWtGRE4wSXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0cFFrRkRhRU03Y1VKQlFVMDdiMEpCUTBnc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF5eERRVUZETzI5Q1FVTjJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTTdhVUpCUXpGRE8xbEJRMHdzUTBGQlF5eERRVUZETEVOQlFVTTdVMEZEVGpzN1dVRkJUU3hKUVVGSkxFTkJRVU1zVlVGQlZTeEhRVUZITEVWQlFVVXNUVUZCVFN4RlFVRkZMRWxCUVVrc1EwRkJReXhOUVVGTkxFVkJRVVVzVFVGQlRTeEZRVUZGTEVWQlFVVXNSVUZCUlN4RFFVRkRPMUZCUlRkRUxFbEJRVWtzWTBGQll5eEhRVUZITEVsQlFVa3NRMEZCUXl4WlFVRlpMRWxCUVVrc1JVRkJSU3hEUVVGRE8xRkJRemRETEVsQlFVa3NTVUZCU1N4RFFVRkRMSGRDUVVGM1FpeEZRVUZGTzFsQlEzcENMRWxCUVVrc1EwRkJReXhaUVVGaExFTkJRVU1zWjBKQlFXZENMRWRCUVVjc1NVRkJTU3hEUVVGRExIZENRVUYzUWl4RFFVRkRMR2RDUVVGblFpeERRVUZETzFsQlF6TkdMR05CUVdNc1IwRkJSeXhqUVVGakxFTkJRVU1zVFVGQlRTeERRVUZETERaRFFVRXJRaXhEUVVGRExFTkJRVU1zUlVGQlJTeEpRVUZKTEVOQlFVTXNUVUZCVFN4RlFVRkZMRWxCUVVrc1EwRkJReXgzUWtGQmQwSXNRMEZCUXl4SlFVRkpMRVZCUVU4c1EwRkJReXhKUVVGSkxFTkJRVU1zV1VGQldTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMU5CUjNwS08xRkJSVVFzU1VGQlNTeERRVUZETEdGQlFXRXNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJRenRSUVVNeFFpeEpRVUZKTEVOQlFVTXNVVUZCVVN4SFFVRkhMRWxCUVVrc2FVSkJRVThzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dFJRVVYyUXl4SlFVRkpMRU5CUVVNc1VVRkJVU3hEUVVGRExFdEJRVXNzUTBGQlF5eExRVUZMTEVWQlFVVXNRMEZCUXp0UlFVTTFRaXhMUVVGTExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTzFsQlEzaENMRWxCUVVrc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRka0lzU1VGQlNTeERRVUZETEVOQlFVTXNTMEZCU3l4RlFVRkZPMmRDUVVOVUxFTkJRVU1zUTBGQlF5eEZRVUZGTEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRuUWtGRFdDeERRVUZETEVOQlFVTXNSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03WjBKQlExZ3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRuUWtGRGJrSXNTVUZCU1N4RFFVRkRMRkZCUVZFc1EwRkJReXhMUVVGTExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJRenRoUVVOcVF6dFRRVU5LTzFGQlEwUXNTVUZCU1N4RFFVRkRMRkZCUVZFc1EwRkJReXhUUVVGVExFZEJRVWNzU1VGQlNTeERRVUZETEZWQlFWVXNRMEZCUXp0UlFVc3hReXhKUVVGSkxFTkJRVU1zWVVGQllTeERRVUZETERoQ1FVRTRRaXhGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVZDZSQ3hKUVVGSkxHTkJRV01zUTBGQlF5eE5RVUZOTEVkQlFVY3NRMEZCUXp0WlFVRkZMRWxCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zVDBGQlR5eEhRVUZITEVsQlFVa3NjMEpCUVZVc1EwRkJReXhKUVVGSkxFTkJRVU1zVFVGQlRTeEZRVUZGTEVsQlFVa3NRMEZCUXl4UFFVRlBMRVZCUVVVc1NVRkJTU3hEUVVGRExGVkJRVlVzUlVGQlJTeGpRVUZqTEVOQlFVTXNRMEZCUXl4blFrRkJaMElzUlVGQlJTeERRVUZETzFGQlEzSktMRWxCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zUjBGQlJ5eERRVUZETEN0Q1FVRXJRaXhEUVVGRExFTkJRVU03VVVGRGJrUXNTVUZCU1N4RFFVRkRMRFpDUVVFMlFpeERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1YwRkJWeXhEUVVGRExFTkJRVU03VVVGSGRFUXNTVUZCU1N4RFFVRkRMR0ZCUVdFc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF6dFJRVU4yUWl4SlFVRkpMRVZCUVVVc1JVRkJSVHRaUVVOS0xFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVZVc1EwRkJReXhGUVVGRkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTJwRkxFbEJRVWtzUTBGQlF5eFJRVUZSTEVOQlFVTXNUMEZCVHl4SFFVRkhMRWxCUVVrc2MwSkJRVlVzUTBGQlF5eEpRVUZKTEVOQlFVTXNUVUZCVFN4RlFVRkZMRWxCUVVrc1EwRkJReXhQUVVGUExFVkJRVVVzU1VGQlNTeERRVUZETEZWQlFWVXNSVUZCUlN4alFVRmpMRVZCUVVVc1NVRkJTU3hEUVVGRExFTkJRVU1zWjBKQlFXZENMRVZCUVVVc1EwRkJRenRaUVVNMVNDeEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGVkxFTkJRVU1zUlVGQlJTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRUUVVOd1JUdFJRVWRFTEVsQlFVa3NRMEZCUXl4UlFVRlJMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dFJRVU53UWl4SlFVRkpMRU5CUVVNc1VVRkJVU3hEUVVGRExFZEJRVWNzUTBGQlF5d3JRa0ZCSzBJc1EwRkJReXhEUVVGRE8xRkJSVzVFTEVsQlFVa3NhMEpCUVd0Q0xFVkJRVVU3V1VGRGNFSXNTVUZCU1N4RFFVRkRMRkZCUVZFc1EwRkJReXhaUVVGWkxFZEJRVWNzU1VGQlNTeERRVUZETzFsQlEyeERMRWxCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zV1VGQldTeEhRVUZITEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUzBGQlN5eERRVUZETzFsQlEyeEVMRWxCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zWjBKQlFXZENMRWRCUVVjc1EwRkJReXhEUVVGRE8xbEJRMjVETEVsQlFVa3NRMEZCUXl4UlFVRlJMRU5CUVVNc1pVRkJaU3hIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdXVUZEZGtNc1NVRkJTU3hGUVVGRkxFZEJRVWNzYVVKQlFVOHNRMEZCUXl4clFrRkJhMElzUTBGQlF5eERRVUZETEVWQlFVTXNWVUZCUXl4RFFVRkRMRVZCUVVVc1EwRkJRenRuUWtGRGRrTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETzI5Q1FVRkZMRTlCUVU4c1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVOeVF5eFBRVUZQTEVOQlFVTXNRMEZCUVR0WlFVTmFMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRMGdzU1VGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4RFFVRkRMRWRCUVVjc1JVRkJSU3hEUVVGRE8xbEJRM0pDTEVsQlFVa3NRMEZCUXl4UlFVRlJMRU5CUVVNc1IwRkJSeXhEUVVGRExHdENRVUZyUWl4RFFVRkRMRU5CUVVNN1UwRkRla003VVVGRlJDeEpRVUZKTEVOQlFVTXNiVUpCUVcxQ0xFVkJRVVVzUTBGQlF6dFJRVU16UWl4SlFVRkpMRU5CUVVNc05rSkJRVFpDTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hYUVVGWExFTkJRVU1zUTBGQlF6dFJRVU4wUkN4UFFVRlBMRmRCUVZjc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEUxQlFVMHNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU03U1VGRE9VTXNRMEZCUXp0SlFVVlBMRGhDUVVGaExFZEJRWEpDTEZWQlFYTkNMRlZCUVd0Q0xFVkJRVVVzUTBGQlZ5eEZRVUZGTEVOQlFWYzdVVUZET1VRc1NVRkJTU3hKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZETEUxQlFVMHNSMEZCUnl4RFFVRkRMRWxCUVVrc1ZVRkJWU3hIUVVGSExFTkJRVU1zUlVGQlJUdFpRVWN6UXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEUxQlFVMHNRMEZCUXp0WlFVTXpRaXhKUVVGSkxFdEJRVXNzUjBGQlJ5eEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRWRCUVVjc1EwRkJReXhWUVVGQkxFTkJRVU1zU1VGQlNTeFBRVUZCTEVOQlFVc3NSVUZCUlN4TlFVRk5MRVZCUVZNc1EwRkJReXhEUVVGRExFMUJRVThzUTBGQlF5eExRVUZMTEVWQlFVVXNUVUZCVFN4RlFVRlRMRU5CUVVNc1EwRkJReXhOUVVGUExFTkJRVU1zUzBGQlN5eEZRVUZGTEVOQlFVRXNSVUZCZGtVc1EwRkJkVVVzUTBGQlF5eERRVUZETzFsQlF6RkhMRWxCUVVrc1JVRkJSU3hIUVVGSExFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNSMEZCUnl4RFFVRkRMRlZCUVVFc1EwRkJReXhKUVVGSkxFOUJRVUVzUTBGQlN5eEZRVUZGTEV0QlFVc3NSVUZCUlN4RFFVRkRMRU5CUVVNc1MwRkJTeXhGUVVGRkxFTkJRVUVzUlVGQmRrSXNRMEZCZFVJc1EwRkJReXhEUVVGRE8xbEJRM1pFTEVsQlFVa3NRMEZCUXl4UFFVRlBMRU5CUVVNc1QwRkJUeXhEUVVGRExGVkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTTdaMEpCUTNSQ0xFVkJRVVVzUTBGQlF5eEpRVUZKTEVOQlFVMHNSVUZCUlN4TFFVRkxMRVZCUVVVc1EwRkJReXhEUVVGRExFdEJRVXNzUjBGQlJ5eERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJRenRaUVVNM1F5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTklMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU1zVDBGQlR5eERRVUZETEZWQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNN1owSkJRM1JDTEVsQlFVa3NUMEZCVHl4RFFVRkRMRU5CUVVNc1RVRkJUU3hMUVVGTExGZEJRVmM3YjBKQlF5OUNMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU1zVDBGQlR5eERRVUZETEZWQlFVRXNRMEZCUXl4SlFVRkpMRTlCUVVFc1MwRkJTeXhEUVVGRExFbEJRVWtzUTBGQlF5eEZRVUZGTEUxQlFVMHNSVUZCUlN4RFFVRkRMRU5CUVVNc1MwRkJTeXhGUVVGRkxFMUJRVTBzUlVGQlJTeERRVUZETEVOQlFVTXNTMEZCU3l4RlFVRkZMRU5CUVVNc1JVRkJhRVFzUTBGQlowUXNRMEZCUXl4RFFVRkRPMmRDUVVNMVJTeEpRVUZKTEU5QlFVOHNRMEZCUXl4RFFVRkRMRTFCUVUwc1MwRkJTeXhYUVVGWE8yOUNRVU12UWl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFOUJRVThzUTBGQlF5eFZRVUZCTEVWQlFVVXNTVUZCU1N4UFFVRkJMRXRCUVVzc1EwRkJReXhKUVVGSkxFTkJRVU1zUlVGQlJTeE5RVUZOTEVWQlFVVXNRMEZCUXl4RFFVRkRMRXRCUVVzc1JVRkJSU3hOUVVGTkxFVkJRVVVzUlVGQlJTeERRVUZETEV0QlFVc3NSVUZCUlN4RFFVRkRMRVZCUVdwRUxFTkJRV2xFTEVOQlFVTXNRMEZCUXp0WlFVTnNSaXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVWRJTEVsQlFVa3NUVUZCVFN4RlFVRkZPMmxDUVVOUUxFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RlFVRkZMRU5CUVVNN2FVSkJRMnBDTEV0QlFVc3NRMEZCUXl4RlFVRkZMRU5CUVVNN2FVSkJRMVFzUzBGQlN5eERRVUZETEV0QlFVc3NRMEZCUXp0cFFrRkRXaXhoUVVGaExFTkJRVU1zUzBGQlN5eERRVUZETzJsQ1FVTndRaXhaUVVGWkxFTkJRVU1zU1VGQlNTeERRVUZETEZsQlFWa3NSVUZCUlN4RFFVRkRPMmxDUVVOcVF5eDNRa0ZCZDBJc1EwRkJReXhEUVVGRExFTkJRVU03YVVKQlF6TkNMRzlDUVVGdlFpeERRVUZETEVsQlFVa3NRMEZCUXp0cFFrRkRNVUlzUzBGQlN5eERRVUZETEZWQlFWVXNSVUZCUlN4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeExRVUZMTEVOQlFVTXNRMEZCUXp0WlFVVjJReXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRkJMRU5CUVVNN1owSkJRMnBDTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1MwRkJTeXhEUVVGRExFZEJRVWNzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03WjBKQlF6TkNMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUzBGQlN5eERRVUZETEVkQlFVY3NSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdXVUZETDBJc1EwRkJReXhEUVVGRExFTkJRVU03VTBGRFRqdGhRVUZOTzFsQlEwZ3NTVUZCU1N4RFFVRkRMRkZCUVZFc1EwRkJReXhIUVVGSExFTkJRVU1zVlVGQlZTeERRVUZETEVOQlFVTTdVMEZEYWtNN1NVRkRUQ3hEUVVGRE8wbEJSMDhzT0VOQlFUWkNMRWRCUVhKRExGVkJRWE5ETEV0QlFXRXNSVUZCUlN4TlFVRmpMRVZCUVVVc1YwRkJNa0k3VVVGQmFFY3NhVUpCWlVNN1VVRm1iMFVzTkVKQlFVRXNSVUZCUVN4clFrRkJNa0k3VVVGRk5VWXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhsUVVGbExFbEJRVWtzU1VGQlNTeERRVUZETEcxQ1FVRnRRaXhGUVVGRk8xbEJRMjVFTEVsQlFVa3NSMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRWRCUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zVVVGQlVTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVOdVJDeEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGVkxFTkJRVU1zUlVGQlJTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhIUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhIUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVOcVJTeEpRVUZKTEUxQlFVMHNSMEZCUnl4dFEwRkJZeXhEUVVGRExFbEJRVWtzUTBGQlF5eE5RVUZOTEVWQlFVVXNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRE8xbEJRM1JFTEdsRFFVRlpMRU5CUVVNc1RVRkJUU3hGUVVGRkxFdEJRVXNzUlVGQlJTeE5RVUZOTEVWQlFVVXNTVUZCU1N4RFFVRkRMR2RDUVVGblFpeEZRVUZGTEVOQlFVTXNUVUZCVFN4SFFVRkhMRXRCUVVzc1EwRkJReXhGUVVGRkxGZEJRVmNzUTBGQlF5eERRVUZETzFsQlF6RkdMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zVDBGQlR5eERRVUZETEZWQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNN1owSkJRM0pDTEV0QlFVa3NRMEZCUXl4UlFVRlJMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUzBGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRuUWtGRGVrUXNTVUZCU1N4RFFVRkRMRU5CUVVNc1RVRkJUU3hGUVVGRk8yOUNRVU5XTEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1ZVRkJWU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0dlFrRkRla0lzUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4VlFVRlZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzJsQ1FVTTFRanRaUVVOTUxFTkJRVU1zUTBGQlF5eERRVUZETzFOQlEwNDdTVUZEVEN4RFFVRkRPMGxCUlVRc2RVSkJRVTBzUjBGQlRqdFJRVU5KTEU5QlFVOHNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dEpRVU16UWl4RFFVRkRPMGxCUlVRc2NVSkJRVWtzUjBGQlNqdFJRVU5KTEU5QlFVOHNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dEpRVU42UWl4RFFVRkRPMGxCU1VRc2JVTkJRV3RDTEVkQlFXeENMRlZCUVcxQ0xGVkJRWE5DTzFGQlFYUkNMREpDUVVGQkxFVkJRVUVzWTBGQmMwSTdVVUZEY2tNc1NVRkJTU3hEUVVGRExHZENRVUZuUWl4SFFVRkhMRWxCUVVrc05rSkJRWE5DTEVOQlF6bERMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zUjBGQlJ5eERRVUZETEZWQlFWVXNRMEZCUXp0WlFVTjJRaXhQUVVGUExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNUMEZCVHl4RFFVRkRMRU5CUVVNc1ZVRkJWU3hEUVVGRExFTkJRVU1zVVVGQlVTeEZRVUZGTEVOQlFVTTdVVUZEY0VRc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dEpRVU5hTEVOQlFVTTdTVUZYUkN3d1FrRkJVeXhIUVVGVUxGVkJRVlVzU1VGQlNTeEZRVUZGTEVWQlFXTXNSVUZCUlN4SlFVRkpPMUZCUVhCQ0xHMUNRVUZCTEVWQlFVRXNUVUZCWXp0UlFVTXhRaXhKUVVGSkxGRkJRVkVzUjBGQlJ5eEZRVUZGTEVOQlFVTTdVVUZKYkVJc1NVRkJTU3hIUVVGSExFZEJRVWNzU1VGQlNTdzJRa0ZCYzBJc1EwRkJReXhKUVVGSkxFTkJRVU1zWjBKQlFXZENMRU5CUVVNc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTEVsQlFVa3NRMEZCUXl4blFrRkJaMElzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRWxCUVVrc1EwRkJReXhuUWtGQlowSXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVOeVNDeExRVUZMTEVkQlFXRXNSVUZCUlN4RFFVRkRMRVZCUVVVc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVWQlEzaEVMRXRCUVVzc1IwRkJZU3hGUVVGRkxFTkJRVU1zUlVGQlJTeEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRVZCUVVVc1JVRkRlRVFzUzBGQlN5eEhRVUZITEVkQlFVY3NRMEZCUXl4UlFVRlJMRU5CUVVNc1MwRkJTeXhGUVVGRkxFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNTMEZCU3l4RFFVRkRMRVZCUXpsRExFZEJRVWNzUjBGQlJ5eEhRVUZITEVOQlFVTXNVVUZCVVN4RFFVRkRMRXRCUVVzc1JVRkJSU3hKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRPMUZCUTJwRUxFZEJRVWNzUTBGQlF5eG5Ra0ZCWjBJc1EwRkJReXhMUVVGTExFVkJRVVVzUzBGQlN5eEZRVUZGTEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1MwRkJTeXhGUVVGRkxFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNN1VVRkRla1VzU1VGQlNTeFBRVUZQTEVsQlFVa3NTMEZCU3l4WFFVRlhMRVZCUVVVN1dVRkROMElzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMU5CUTJJN1VVRkRSQ3hKUVVGSkxGTkJRVk1zUjBGQlJ5eFZRVUZCTEVOQlFVTXNTVUZCU1N4UFFVRkJMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU1zUlVGQlJTeEZRVUZZTEVOQlFWY3NSVUZCUlN4VFFVRlRMRWRCUVVjc1ZVRkJRU3hEUVVGRExFbEJRVWtzVDBGQlFTeERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRVZCUVVVc1JVRkJXQ3hEUVVGWExFVkJRVVVzVFVGQlRTeEhRVUZITEZWQlFVRXNRMEZCUXl4SlFVRkpMRTlCUVVFc1EwRkJReXhEUVVGRExFMUJRVTBzUlVGQlJTeEZRVUZXTEVOQlFWVXNSVUZEY0VZc1RVRkJUU3hIUVVGSExFbEJRVWtzTUVKQlFWVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFMUJRVTBzUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXl4RlFVRkZMRk5CUVZNc1JVRkJSU3hUUVVGVExFVkJRVVVzVFVGQlRTeERRVUZETEVWQlF6RkZMRmxCUVZrc1IwRkJSeXhOUVVGTkxFTkJRVU1zYTBKQlFXdENMRU5CUVVNc1MwRkJTeXhEUVVGRExFVkJRVVVzUlVGQlJTeEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNN1VVRkRMMFFzU1VGQlNTeFpRVUZaTEVOQlFVTXNUVUZCVFN4TFFVRkxMRU5CUVVNc1NVRkJTU3haUVVGWkxFTkJRVU1zVFVGQlRTeExRVUZMTEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hGUVVGRk8xbEJRMjVGTEVsQlFVa3NTMEZCU3l4SFFVRkhMREpDUVVGbExFTkJRVU1zU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4WFFVRlhMRVZCUVVVc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eFhRVUZYTEVWQlFVVXNSVUZCUlN4RFFVRkRMRU5CUVVNN1dVRkRiRVlzVVVGQlVTeEhRVUZITEVOQlFVTXNTMEZCU3l4RFFVRkRMR3RDUVVGclFpeEZRVUZGTEV0QlFVc3NRMEZCUXl4VlFVRlZMRU5CUVVNc1EwRkJRenRUUVVNelJEdGhRVUZOTzFsQlEwZ3NTVUZCU1N4RFFVRkRMRWRCUVVjc1dVRkJXU3hEUVVGRExFMUJRVTBzUjBGQlJ5eERRVUZETEVWQlF6TkNMRU5CUVVNc1IwRkJSeXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEZsQlFWa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGRE5VSXNRMEZCUXl4SFFVRkhMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zV1VGQldTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVNMVFpeFJRVUZSTEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRExGZEJRVmNzUTBGQlF5eGxRVUZsTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTnVSU3hMUVVGTExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWxCUVVrc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF6dG5Ra0ZEZGtJc1VVRkJVU3hEUVVGRExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRmxCUVZrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUXpWRExGRkJRVkVzUTBGQlF5eEpRVUZKTEVOQlFVTXNjMEpCUVZVc1EwRkJReXhEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4WFFVRlhMRVZCUVVVc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dFRRVU0zUkR0UlFXRkVMRTlCUVU4c1VVRkJVU3hEUVVGRE8wbEJRM0JDTEVOQlFVTTdTVUZIVFN4eFFrRkJZeXhIUVVGeVFpeFZRVUZ6UWl4RFFVRnpRanRSUVVONFF5eFBRVUZQTEU5QlFVOHNRMEZCUXl4RFFVRkRMRTFCUVUwc1MwRkJTeXhSUVVGUkxFTkJRVU1zUTBGQlF5eERRVUZUTEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGUkxFTkJRVU1zUTBGQlF5eE5RVUZQTEVOQlFVTXNTMEZCU3l4RFFVRkRPMGxCUTNCR0xFTkJRVU03U1VGSFRTeHhRa0ZCWXl4SFFVRnlRaXhWUVVGelFpeERRVUZ6UWp0UlFVTjRReXhQUVVGUExFOUJRVThzUTBGQlF5eERRVUZETEUxQlFVMHNTMEZCU3l4UlFVRlJMRU5CUVVNc1EwRkJReXhEUVVGVExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXl4RFFVRlJMRU5CUVVNc1EwRkJReXhOUVVGUExFTkJRVU1zUzBGQlN5eERRVUZETzBsQlEzQkdMRU5CUVVNN1NVRkhUU3hoUVVGTkxFZEJRV0lzVlVGQll5eERRVUZ6UWp0UlFVTm9ReXhQUVVGUExFMUJRVTBzUTBGQlF5eGpRVUZqTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1IwRkJSeXhIUVVGSExFMUJRVTBzUTBGQlF5eGpRVUZqTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRja1VzUTBGQlF6dEpRVTFOTEdkQ1FVRlRMRWRCUVdoQ0xGVkJRV2xDTEVOQlFXVTdVVUZETlVJc1NVRkJTU3hQUVVGUExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVTdXVUZEV2l4TlFVRk5MRU5CUVVNc1YwRkJWeXhEUVVGRExFTkJRVU1zUlVGQlJTeE5RVUZOTEVOQlFVTXNWVUZCVlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VTBGREwwTTdZVUZCVFR0WlFVTklMRTFCUVUwc1EwRkJReXhSUVVGUkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEYmtJc1EwRkJReXhEUVVGRExFdEJRVXNzU1VGQlNTeERRVUZETEVOQlFVTTdVMEZEYUVJN1NVRkRUQ3hEUVVGRE8wbEJTV01zWlVGQlVTeEhRVUYyUWl4VlFVRjNRaXhEUVVGUE8xRkJRM0pDTEVOQlFVVXNRMEZCUXl4RlFVRkZMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU5hTEVOQlFVVXNRMEZCUXl4RlFVRkZMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dEpRVU4wUWl4RFFVRkRPMGxCU1dNc2EwSkJRVmNzUjBGQk1VSXNWVUZCTWtJc1EwRkJVU3hGUVVGRkxFMUJRV2RETzFGQlEycEZMRWxCUVVrc1QwRkJUeXhEUVVGRExFTkJRVU1zVFVGQlRTeExRVUZMTEZkQlFWY3NSVUZCUlR0WlFVTnFReXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRkJMRU5CUVVNN1owSkJRMlFzUTBGQlF5eERRVUZETEV0QlFVc3NTVUZCU1N4RFFVRkRMRU5CUVVNN1owSkJRMklzVFVGQlRTeERRVUZETEZGQlFWRXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRuUWtGRFlpeERRVUZGTEVOQlFVTXNhVUpCUVdsQ0xFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRE8yZENRVU4wUXl4RFFVRkZMRU5CUVVNc2FVSkJRV2xDTEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhOUVVGTkxFTkJRVU1zUTBGQlF5eERRVUZETzFsQlEyaEVMRU5CUVVNc1EwRkJReXhEUVVGRE8xTkJRMDQ3VVVGRFJDeEpRVUZKTEU5QlFVOHNRMEZCUXl4RFFVRkRMRTFCUVUwc1MwRkJTeXhYUVVGWExFVkJRVVU3V1VGRGFrTXNRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhQUVVGUExFTkJRVU1zVlVGQlFTeERRVUZETEVsQlFVa3NUMEZCUVN4TlFVRk5MRU5CUVVNc1YwRkJWeXhEUVVGRExFTkJRVU1zUlVGQlJTeE5RVUZOTEVOQlFVTXNSVUZCTjBJc1EwRkJOa0lzUTBGQlF5eERRVUZETzFOQlEzaEVPMGxCUTB3c1EwRkJRenRKUVVkTkxHbENRVUZWTEVkQlFXcENMRlZCUVd0Q0xFTkJRV1U3VVVGRE4wSXNTVUZCU1N4UFFVRlBMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVU3V1VGRFdpeFBRVUZQTzJkQ1FVTklMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEVWQlFVVXNSVUZCUlR0blFrRkRhRUlzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1JVRkJSU3hGUVVGRk8yRkJRMjVDTEVOQlFVTTdVMEZEVER0aFFVRk5PMWxCUTBnc1QwRkJUeXhEUVVGRExFTkJRVU03VTBGRFdqdEpRVU5NTEVOQlFVTTdTVUZKVFN4WFFVRkpMRWRCUVZnc1ZVRkJXU3hEUVVGbExFVkJRVVVzVVVGQmEwTTdVVUZETTBRc1NVRkJTU3hQUVVGUExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVTdXVUZEV2l4SlFVRkpMRTlCUVU4c1EwRkJReXhEUVVGRExFMUJRVTBzUzBGQlN5eFhRVUZYTEVWQlFVVTdaMEpCUTJwRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVVFc1EwRkJRenR2UWtGRFpDeERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRlZCUVZVc1EwRkJReXhSUVVGUkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdiMEpCUTJoRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNWVUZCVlN4RFFVRkRMRkZCUVZFc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dHZRa0ZETVVJc1EwRkJSU3hEUVVGRExFVkJRVVVzUjBGQlV5eERRVUZGTEVOQlFVTXNhVUpCUVdsQ0xFZEJRVWNzVVVGQlVTeERRVUZETEVOQlFVTXNRMEZCUXp0dlFrRkRhRVFzUTBGQlJTeERRVUZETEVWQlFVVXNSMEZCVXl4RFFVRkZMRU5CUVVNc2FVSkJRV2xDTEVkQlFVY3NVVUZCVVN4RFFVRkRMRU5CUVVNc1EwRkJRenRuUWtGRE1VUXNRMEZCUXl4RFFVRkRMRU5CUVVNN1lVRkRUanRaUVVORUxFbEJRVWtzVDBGQlR5eERRVUZETEVOQlFVTXNUVUZCVFN4TFFVRkxMRmRCUVZjc1JVRkJSVHRuUWtGRGFrTXNRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhQUVVGUExFTkJRVU1zVlVGQlFTeERRVUZETEVsQlFVa3NUMEZCUVN4TlFVRk5MRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUlVGQlJTeFJRVUZSTEVOQlFVTXNSVUZCZUVJc1EwRkJkMElzUTBGQlF5eERRVUZETzJGQlEyNUVPMU5CUTBvN1lVRkJUVHRaUVVOSExFTkJRVVVzUTBGQlF5eEZRVUZGTEVkQlFVY3NVVUZCVVN4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVOdVFpeERRVUZGTEVOQlFVTXNSVUZCUlN4SFFVRkhMRkZCUVZFc1EwRkJReXhEUVVGRExFTkJRVU03VTBGRE5VSTdTVUZEVEN4RFFVRkRPMGxCU1Uwc1kwRkJUeXhIUVVGa0xGVkJRV1VzUTBGQlF6dFJRVU5hTEVsQlFVa3NUMEZCVHl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRk8xbEJRMW9zU1VGQlNTeFBRVUZQTEVOQlFVTXNRMEZCUXl4TlFVRk5MRXRCUVVzc1YwRkJWeXhGUVVGRk8yZENRVU5xUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFOUJRVThzUTBGQlF5eFZRVUZCTEVOQlFVTTdiMEpCUTJRc1RVRkJUU3hEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0dlFrRkRiRUlzVDBGQllTeERRVUZGTEVOQlFVTXNhVUpCUVdsQ0xFTkJRVU03YjBKQlEyeERMRTlCUVdFc1EwRkJSU3hEUVVGRExHbENRVUZwUWl4RFFVRkRPMmRDUVVOMFF5eERRVUZETEVOQlFVTXNRMEZCUXp0aFFVTk9PMWxCUTBRc1NVRkJTU3hQUVVGUExFTkJRVU1zUTBGQlF5eE5RVUZOTEV0QlFVc3NWMEZCVnl4RlFVRkZPMmRDUVVOcVF5eERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRTlCUVU4c1EwRkJReXhOUVVGTkxFTkJRVU1zVDBGQlR5eERRVUZETEVOQlFVTTdZVUZEY0VNN1UwRkRTanRoUVVGTk8xbEJRMGdzUTBGQlF5eERRVUZETEV0QlFVc3NTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJRenRUUVVWcVFqdEpRVU5NTEVOQlFVTTdTVUZIVFN4blFrRkJVeXhIUVVGb1FpeFZRVUZwUWl4RFFVRkRPMUZCUTJRc1EwRkJReXhEUVVGRExFdEJRVXNzU1VGQlNTeERRVUZETEVOQlFVTTdVVUZEWWl4RFFVRkRMRU5CUVVNc1JVRkJSU3hIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRVZCUVVVc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzBsQlF6TkNMRU5CUVVNN1NVRkhUU3hsUVVGUkxFZEJRV1lzVlVGQlowSXNRMEZCUXp0UlFVTmlMRU5CUVVNc1EwRkJReXhMUVVGTExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTTdTVUZEYkVJc1EwRkJRenRKUVVOTUxHRkJRVU03UVVGQlJDeERRVUZETEVGQmRubENSQ3hKUVhWNVFrTTdRVUYyZVVKWkxIZENRVUZOSW4wPSIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHNob3J0ZXN0cGF0aHNfMSA9IHJlcXVpcmUoXCIuL3Nob3J0ZXN0cGF0aHNcIik7XG52YXIgZGVzY2VudF8xID0gcmVxdWlyZShcIi4vZGVzY2VudFwiKTtcbnZhciByZWN0YW5nbGVfMSA9IHJlcXVpcmUoXCIuL3JlY3RhbmdsZVwiKTtcbnZhciBsaW5rbGVuZ3Roc18xID0gcmVxdWlyZShcIi4vbGlua2xlbmd0aHNcIik7XG52YXIgTGluazNEID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBMaW5rM0Qoc291cmNlLCB0YXJnZXQpIHtcbiAgICAgICAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG4gICAgICAgIHRoaXMudGFyZ2V0ID0gdGFyZ2V0O1xuICAgIH1cbiAgICBMaW5rM0QucHJvdG90eXBlLmFjdHVhbExlbmd0aCA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQoeC5yZWR1Y2UoZnVuY3Rpb24gKGMsIHYpIHtcbiAgICAgICAgICAgIHZhciBkeCA9IHZbX3RoaXMudGFyZ2V0XSAtIHZbX3RoaXMuc291cmNlXTtcbiAgICAgICAgICAgIHJldHVybiBjICsgZHggKiBkeDtcbiAgICAgICAgfSwgMCkpO1xuICAgIH07XG4gICAgcmV0dXJuIExpbmszRDtcbn0oKSk7XG5leHBvcnRzLkxpbmszRCA9IExpbmszRDtcbnZhciBOb2RlM0QgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIE5vZGUzRCh4LCB5LCB6KSB7XG4gICAgICAgIGlmICh4ID09PSB2b2lkIDApIHsgeCA9IDA7IH1cbiAgICAgICAgaWYgKHkgPT09IHZvaWQgMCkgeyB5ID0gMDsgfVxuICAgICAgICBpZiAoeiA9PT0gdm9pZCAwKSB7IHogPSAwOyB9XG4gICAgICAgIHRoaXMueCA9IHg7XG4gICAgICAgIHRoaXMueSA9IHk7XG4gICAgICAgIHRoaXMueiA9IHo7XG4gICAgfVxuICAgIHJldHVybiBOb2RlM0Q7XG59KCkpO1xuZXhwb3J0cy5Ob2RlM0QgPSBOb2RlM0Q7XG52YXIgTGF5b3V0M0QgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIExheW91dDNEKG5vZGVzLCBsaW5rcywgaWRlYWxMaW5rTGVuZ3RoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIGlmIChpZGVhbExpbmtMZW5ndGggPT09IHZvaWQgMCkgeyBpZGVhbExpbmtMZW5ndGggPSAxOyB9XG4gICAgICAgIHRoaXMubm9kZXMgPSBub2RlcztcbiAgICAgICAgdGhpcy5saW5rcyA9IGxpbmtzO1xuICAgICAgICB0aGlzLmlkZWFsTGlua0xlbmd0aCA9IGlkZWFsTGlua0xlbmd0aDtcbiAgICAgICAgdGhpcy5jb25zdHJhaW50cyA9IG51bGw7XG4gICAgICAgIHRoaXMudXNlSmFjY2FyZExpbmtMZW5ndGhzID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5yZXN1bHQgPSBuZXcgQXJyYXkoTGF5b3V0M0Quayk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgTGF5b3V0M0QuazsgKytpKSB7XG4gICAgICAgICAgICB0aGlzLnJlc3VsdFtpXSA9IG5ldyBBcnJheShub2Rlcy5sZW5ndGgpO1xuICAgICAgICB9XG4gICAgICAgIG5vZGVzLmZvckVhY2goZnVuY3Rpb24gKHYsIGkpIHtcbiAgICAgICAgICAgIGZvciAodmFyIF9pID0gMCwgX2EgPSBMYXlvdXQzRC5kaW1zOyBfaSA8IF9hLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgICAgIHZhciBkaW0gPSBfYVtfaV07XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2W2RpbV0gPT0gJ3VuZGVmaW5lZCcpXG4gICAgICAgICAgICAgICAgICAgIHZbZGltXSA9IE1hdGgucmFuZG9tKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBfdGhpcy5yZXN1bHRbMF1baV0gPSB2Lng7XG4gICAgICAgICAgICBfdGhpcy5yZXN1bHRbMV1baV0gPSB2Lnk7XG4gICAgICAgICAgICBfdGhpcy5yZXN1bHRbMl1baV0gPSB2Lno7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICA7XG4gICAgTGF5b3V0M0QucHJvdG90eXBlLmxpbmtMZW5ndGggPSBmdW5jdGlvbiAobCkge1xuICAgICAgICByZXR1cm4gbC5hY3R1YWxMZW5ndGgodGhpcy5yZXN1bHQpO1xuICAgIH07XG4gICAgTGF5b3V0M0QucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24gKGl0ZXJhdGlvbnMpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgaWYgKGl0ZXJhdGlvbnMgPT09IHZvaWQgMCkgeyBpdGVyYXRpb25zID0gMTAwOyB9XG4gICAgICAgIHZhciBuID0gdGhpcy5ub2Rlcy5sZW5ndGg7XG4gICAgICAgIHZhciBsaW5rQWNjZXNzb3IgPSBuZXcgTGlua0FjY2Vzc29yKCk7XG4gICAgICAgIGlmICh0aGlzLnVzZUphY2NhcmRMaW5rTGVuZ3RocylcbiAgICAgICAgICAgIGxpbmtsZW5ndGhzXzEuamFjY2FyZExpbmtMZW5ndGhzKHRoaXMubGlua3MsIGxpbmtBY2Nlc3NvciwgMS41KTtcbiAgICAgICAgdGhpcy5saW5rcy5mb3JFYWNoKGZ1bmN0aW9uIChlKSB7IHJldHVybiBlLmxlbmd0aCAqPSBfdGhpcy5pZGVhbExpbmtMZW5ndGg7IH0pO1xuICAgICAgICB2YXIgZGlzdGFuY2VNYXRyaXggPSAobmV3IHNob3J0ZXN0cGF0aHNfMS5DYWxjdWxhdG9yKG4sIHRoaXMubGlua3MsIGZ1bmN0aW9uIChlKSB7IHJldHVybiBlLnNvdXJjZTsgfSwgZnVuY3Rpb24gKGUpIHsgcmV0dXJuIGUudGFyZ2V0OyB9LCBmdW5jdGlvbiAoZSkgeyByZXR1cm4gZS5sZW5ndGg7IH0pKS5EaXN0YW5jZU1hdHJpeCgpO1xuICAgICAgICB2YXIgRCA9IGRlc2NlbnRfMS5EZXNjZW50LmNyZWF0ZVNxdWFyZU1hdHJpeChuLCBmdW5jdGlvbiAoaSwgaikgeyByZXR1cm4gZGlzdGFuY2VNYXRyaXhbaV1bal07IH0pO1xuICAgICAgICB2YXIgRyA9IGRlc2NlbnRfMS5EZXNjZW50LmNyZWF0ZVNxdWFyZU1hdHJpeChuLCBmdW5jdGlvbiAoKSB7IHJldHVybiAyOyB9KTtcbiAgICAgICAgdGhpcy5saW5rcy5mb3JFYWNoKGZ1bmN0aW9uIChfYSkge1xuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IF9hLnNvdXJjZSwgdGFyZ2V0ID0gX2EudGFyZ2V0O1xuICAgICAgICAgICAgcmV0dXJuIEdbc291cmNlXVt0YXJnZXRdID0gR1t0YXJnZXRdW3NvdXJjZV0gPSAxO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5kZXNjZW50ID0gbmV3IGRlc2NlbnRfMS5EZXNjZW50KHRoaXMucmVzdWx0LCBEKTtcbiAgICAgICAgdGhpcy5kZXNjZW50LnRocmVzaG9sZCA9IDFlLTM7XG4gICAgICAgIHRoaXMuZGVzY2VudC5HID0gRztcbiAgICAgICAgaWYgKHRoaXMuY29uc3RyYWludHMpXG4gICAgICAgICAgICB0aGlzLmRlc2NlbnQucHJvamVjdCA9IG5ldyByZWN0YW5nbGVfMS5Qcm9qZWN0aW9uKHRoaXMubm9kZXMsIG51bGwsIG51bGwsIHRoaXMuY29uc3RyYWludHMpLnByb2plY3RGdW5jdGlvbnMoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgdiA9IHRoaXMubm9kZXNbaV07XG4gICAgICAgICAgICBpZiAodi5maXhlZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGVzY2VudC5sb2Nrcy5hZGQoaSwgW3YueCwgdi55LCB2LnpdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLmRlc2NlbnQucnVuKGl0ZXJhdGlvbnMpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIExheW91dDNELnByb3RvdHlwZS50aWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmRlc2NlbnQubG9ja3MuY2xlYXIoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgdiA9IHRoaXMubm9kZXNbaV07XG4gICAgICAgICAgICBpZiAodi5maXhlZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGVzY2VudC5sb2Nrcy5hZGQoaSwgW3YueCwgdi55LCB2LnpdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5kZXNjZW50LnJ1bmdlS3V0dGEoKTtcbiAgICB9O1xuICAgIExheW91dDNELmRpbXMgPSBbJ3gnLCAneScsICd6J107XG4gICAgTGF5b3V0M0QuayA9IExheW91dDNELmRpbXMubGVuZ3RoO1xuICAgIHJldHVybiBMYXlvdXQzRDtcbn0oKSk7XG5leHBvcnRzLkxheW91dDNEID0gTGF5b3V0M0Q7XG52YXIgTGlua0FjY2Vzc29yID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBMaW5rQWNjZXNzb3IoKSB7XG4gICAgfVxuICAgIExpbmtBY2Nlc3Nvci5wcm90b3R5cGUuZ2V0U291cmNlSW5kZXggPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gZS5zb3VyY2U7IH07XG4gICAgTGlua0FjY2Vzc29yLnByb3RvdHlwZS5nZXRUYXJnZXRJbmRleCA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBlLnRhcmdldDsgfTtcbiAgICBMaW5rQWNjZXNzb3IucHJvdG90eXBlLmdldExlbmd0aCA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBlLmxlbmd0aDsgfTtcbiAgICBMaW5rQWNjZXNzb3IucHJvdG90eXBlLnNldExlbmd0aCA9IGZ1bmN0aW9uIChlLCBsKSB7IGUubGVuZ3RoID0gbDsgfTtcbiAgICByZXR1cm4gTGlua0FjY2Vzc29yO1xufSgpKTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSm1hV3hsSWpvaWJHRjViM1YwTTJRdWFuTWlMQ0p6YjNWeVkyVlNiMjkwSWpvaUlpd2ljMjkxY21ObGN5STZXeUl1TGk4dUxpOVhaV0pEYjJ4aEwzTnlZeTlzWVhsdmRYUXpaQzUwY3lKZExDSnVZVzFsY3lJNlcxMHNJbTFoY0hCcGJtZHpJam9pT3p0QlFVRkJMR2xFUVVFd1F6dEJRVU14UXl4eFEwRkJhVU03UVVGRGFrTXNlVU5CUVRSRU8wRkJSVFZFTERaRFFVRnZSVHRCUVVWd1JUdEpRVVZSTEdkQ1FVRnRRaXhOUVVGakxFVkJRVk1zVFVGQll6dFJRVUZ5UXl4WFFVRk5MRWRCUVU0c1RVRkJUU3hEUVVGUk8xRkJRVk1zVjBGQlRTeEhRVUZPTEUxQlFVMHNRMEZCVVR0SlFVRkpMRU5CUVVNN1NVRkROMFFzTmtKQlFWa3NSMEZCV2l4VlFVRmhMRU5CUVdFN1VVRkJNVUlzYVVKQlRVTTdVVUZNUnl4UFFVRlBMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRMW9zUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4VlFVRkRMRU5CUVZNc1JVRkJSU3hEUVVGWE8xbEJRelZDTEVsQlFVMHNSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJReXhMUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRXRCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF6dFpRVU16UXl4UFFVRlBMRU5CUVVNc1IwRkJSeXhGUVVGRkxFZEJRVWNzUlVGQlJTeERRVUZETzFGQlEzWkNMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzBsQlEyWXNRMEZCUXp0SlFVTk1MR0ZCUVVNN1FVRkJSQ3hEUVVGRExFRkJWa3dzU1VGVlN6dEJRVlpSTEhkQ1FVRk5PMEZCVjJZN1NVRlRTU3huUWtGRFZ5eERRVUZoTEVWQlEySXNRMEZCWVN4RlFVTmlMRU5CUVdFN1VVRkdZaXhyUWtGQlFTeEZRVUZCTEV0QlFXRTdVVUZEWWl4clFrRkJRU3hGUVVGQkxFdEJRV0U3VVVGRFlpeHJRa0ZCUVN4RlFVRkJMRXRCUVdFN1VVRkdZaXhOUVVGRExFZEJRVVFzUTBGQlF5eERRVUZaTzFGQlEySXNUVUZCUXl4SFFVRkVMRU5CUVVNc1EwRkJXVHRSUVVOaUxFMUJRVU1zUjBGQlJDeERRVUZETEVOQlFWazdTVUZCU1N4RFFVRkRPMGxCUTJwRExHRkJRVU03UVVGQlJDeERRVUZETEVGQllrUXNTVUZoUXp0QlFXSlpMSGRDUVVGTk8wRkJZMjVDTzBsQlRVa3NhMEpCUVcxQ0xFdEJRV1VzUlVGQlV5eExRVUZsTEVWQlFWTXNaVUZCTWtJN1VVRkJPVVlzYVVKQllVTTdVVUZpYTBVc1owTkJRVUVzUlVGQlFTeHRRa0ZCTWtJN1VVRkJNMFVzVlVGQlN5eEhRVUZNTEV0QlFVc3NRMEZCVlR0UlFVRlRMRlZCUVVzc1IwRkJUQ3hMUVVGTExFTkJRVlU3VVVGQlV5eHZRa0ZCWlN4SFFVRm1MR1ZCUVdVc1EwRkJXVHRSUVVZNVJpeG5Ra0ZCVnl4SFFVRlZMRWxCUVVrc1EwRkJRenRSUVhGQ01VSXNNRUpCUVhGQ0xFZEJRVmtzU1VGQlNTeERRVUZETzFGQmJFSnNReXhKUVVGSkxFTkJRVU1zVFVGQlRTeEhRVUZITEVsQlFVa3NTMEZCU3l4RFFVRkRMRkZCUVZFc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU53UXl4TFFVRkxMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NVVUZCVVN4RFFVRkRMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU1zUlVGQlJUdFpRVU5xUXl4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVa3NTMEZCU3l4RFFVRkRMRXRCUVVzc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF6dFRRVU0xUXp0UlFVTkVMRXRCUVVzc1EwRkJReXhQUVVGUExFTkJRVU1zVlVGQlF5eERRVUZETEVWQlFVVXNRMEZCUXp0WlFVTm1MRXRCUVdkQ0xGVkJRV0VzUlVGQllpeExRVUZCTEZGQlFWRXNRMEZCUXl4SlFVRkpMRVZCUVdJc1kwRkJZU3hGUVVGaUxFbEJRV0VzUlVGQlJUdG5Ra0ZCTVVJc1NVRkJTU3hIUVVGSExGTkJRVUU3WjBKQlExSXNTVUZCU1N4UFFVRlBMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeFhRVUZYTzI5Q1FVRkZMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNUVUZCVFN4RlFVRkZMRU5CUVVNN1lVRkROVVE3V1VGRFJDeExRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRlRUlzUzBGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTNoQ0xFdEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTTFRaXhEUVVGRExFTkJRVU1zUTBGQlF6dEpRVU5RTEVOQlFVTTdTVUZCUVN4RFFVRkRPMGxCUlVZc05rSkJRVlVzUjBGQlZpeFZRVUZYTEVOQlFWTTdVVUZEYUVJc1QwRkJUeXhEUVVGRExFTkJRVU1zV1VGQldTeERRVUZETEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJRenRKUVVOMlF5eERRVUZETzBsQlMwUXNkMEpCUVVzc1IwRkJUQ3hWUVVGTkxGVkJRWGRDTzFGQlFUbENMR2xDUVhWRFF6dFJRWFpEU3l3eVFrRkJRU3hGUVVGQkxHZENRVUYzUWp0UlFVTXhRaXhKUVVGTkxFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRTFCUVUwc1EwRkJRenRSUVVVMVFpeEpRVUZKTEZsQlFWa3NSMEZCUnl4SlFVRkpMRmxCUVZrc1JVRkJSU3hEUVVGRE8xRkJSWFJETEVsQlFVa3NTVUZCU1N4RFFVRkRMSEZDUVVGeFFqdFpRVU14UWl4blEwRkJhMElzUTBGQlF5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RlFVRkZMRmxCUVZrc1JVRkJSU3hIUVVGSExFTkJRVU1zUTBGQlF6dFJRVVYwUkN4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFOUJRVThzUTBGQlF5eFZRVUZCTEVOQlFVTXNTVUZCU1N4UFFVRkJMRU5CUVVNc1EwRkJReXhOUVVGTkxFbEJRVWtzUzBGQlNTeERRVUZETEdWQlFXVXNSVUZCYUVNc1EwRkJaME1zUTBGQlF5eERRVUZETzFGQlJ6RkVMRWxCUVUwc1kwRkJZeXhIUVVGSExFTkJRVU1zU1VGQlNTd3dRa0ZCVlN4RFFVRkRMRU5CUVVNc1JVRkJSU3hKUVVGSkxFTkJRVU1zUzBGQlN5eEZRVU5vUkN4VlFVRkJMRU5CUVVNc1NVRkJSeXhQUVVGQkxFTkJRVU1zUTBGQlF5eE5RVUZOTEVWQlFWSXNRMEZCVVN4RlFVRkZMRlZCUVVFc1EwRkJReXhKUVVGSExFOUJRVUVzUTBGQlF5eERRVUZETEUxQlFVMHNSVUZCVWl4RFFVRlJMRVZCUVVVc1ZVRkJRU3hEUVVGRExFbEJRVWtzVDBGQlFTeERRVUZETEVOQlFVTXNUVUZCVFN4RlFVRlNMRU5CUVZFc1EwRkJReXhEUVVGRExFTkJRVU1zWTBGQll5eEZRVUZGTEVOQlFVTTdVVUZGYWtVc1NVRkJUU3hEUVVGRExFZEJRVWNzYVVKQlFVOHNRMEZCUXl4clFrRkJhMElzUTBGQlF5eERRVUZETEVWQlFVVXNWVUZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhKUVVGTExFOUJRVUVzWTBGQll5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGd1FpeERRVUZ2UWl4RFFVRkRMRU5CUVVNN1VVRkplRVVzU1VGQlNTeERRVUZETEVkQlFVY3NhVUpCUVU4c1EwRkJReXhyUWtGQmEwSXNRMEZCUXl4RFFVRkRMRVZCUVVVc1kwRkJZeXhQUVVGUExFTkJRVU1zUTBGQlFTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTJoRkxFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVVNc1JVRkJhMEk3WjBKQlFXaENMR3RDUVVGTkxFVkJRVVVzYTBKQlFVMDdXVUZCVHl4UFFVRkJMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEVkQlFVY3NRMEZCUXp0UlFVRjZReXhEUVVGNVF5eERRVUZETEVOQlFVTTdVVUZGZEVZc1NVRkJTU3hEUVVGRExFOUJRVThzUjBGQlJ5eEpRVUZKTEdsQ1FVRlBMRU5CUVVNc1NVRkJTU3hEUVVGRExFMUJRVTBzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTXpReXhKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZETEZOQlFWTXNSMEZCUnl4SlFVRkpMRU5CUVVNN1VVRkRPVUlzU1VGQlNTeERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE8xRkJTVzVDTEVsQlFVa3NTVUZCU1N4RFFVRkRMRmRCUVZjN1dVRkRhRUlzU1VGQlNTeERRVUZETEU5QlFVOHNRMEZCUXl4UFFVRlBMRWRCUVVjc1NVRkJTU3h6UWtGQlZTeERRVUZqTEVsQlFVa3NRMEZCUXl4TFFVRkxMRVZCUVVVc1NVRkJTU3hGUVVGRkxFbEJRVWtzUlVGQlJTeEpRVUZKTEVOQlFVTXNWMEZCVnl4RFFVRkRMRU5CUVVNc1owSkJRV2RDTEVWQlFVVXNRMEZCUXp0UlFVVndTQ3hMUVVGTExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eE5RVUZOTEVWQlFVVXNRMEZCUXl4RlFVRkZMRVZCUVVVN1dVRkRlRU1zU1VGQlNTeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU4wUWl4SlFVRkpMRU5CUVVNc1EwRkJReXhMUVVGTExFVkJRVVU3WjBKQlExUXNTVUZCU1N4RFFVRkRMRTlCUVU4c1EwRkJReXhMUVVGTExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dGhRVU01UXp0VFFVTktPMUZCUlVRc1NVRkJTU3hEUVVGRExFOUJRVThzUTBGQlF5eEhRVUZITEVOQlFVTXNWVUZCVlN4RFFVRkRMRU5CUVVNN1VVRkROMElzVDBGQlR5eEpRVUZKTEVOQlFVTTdTVUZEYUVJc1EwRkJRenRKUVVWRUxIVkNRVUZKTEVkQlFVbzdVVUZEU1N4SlFVRkpMRU5CUVVNc1QwRkJUeXhEUVVGRExFdEJRVXNzUTBGQlF5eExRVUZMTEVWQlFVVXNRMEZCUXp0UlFVTXpRaXhMUVVGTExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eE5RVUZOTEVWQlFVVXNRMEZCUXl4RlFVRkZMRVZCUVVVN1dVRkRlRU1zU1VGQlNTeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU4wUWl4SlFVRkpMRU5CUVVNc1EwRkJReXhMUVVGTExFVkJRVVU3WjBKQlExUXNTVUZCU1N4RFFVRkRMRTlCUVU4c1EwRkJReXhMUVVGTExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dGhRVU01UXp0VFFVTktPMUZCUTBRc1QwRkJUeXhKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZETEZWQlFWVXNSVUZCUlN4RFFVRkRPMGxCUTNKRExFTkJRVU03U1VFM1JVMHNZVUZCU1N4SFFVRkhMRU5CUVVNc1IwRkJSeXhGUVVGRkxFZEJRVWNzUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXp0SlFVTjJRaXhWUVVGRExFZEJRVWNzVVVGQlVTeERRVUZETEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNN1NVRTJSWEJETEdWQlFVTTdRMEZCUVN4QlFTOUZSQ3hKUVN0RlF6dEJRUzlGV1N3MFFrRkJVVHRCUVdsR2NrSTdTVUZCUVR0SlFVdEJMRU5CUVVNN1NVRktSeXh4UTBGQll5eEhRVUZrTEZWQlFXVXNRMEZCVFN4SlFVRlpMRTlCUVU4c1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTTdTVUZEYmtRc2NVTkJRV01zUjBGQlpDeFZRVUZsTEVOQlFVMHNTVUZCV1N4UFFVRlBMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF5eERRVUZETzBsQlEyNUVMR2REUVVGVExFZEJRVlFzVlVGQlZTeERRVUZOTEVsQlFWa3NUMEZCVHl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF6dEpRVU01UXl4blEwRkJVeXhIUVVGVUxGVkJRVlVzUTBGQlRTeEZRVUZGTEVOQlFWTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1RVRkJUU3hIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdTVUZEYkVRc2JVSkJRVU03UVVGQlJDeERRVUZETEVGQlRFUXNTVUZMUXlKOSIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZnVuY3Rpb24gdW5pb25Db3VudChhLCBiKSB7XG4gICAgdmFyIHUgPSB7fTtcbiAgICBmb3IgKHZhciBpIGluIGEpXG4gICAgICAgIHVbaV0gPSB7fTtcbiAgICBmb3IgKHZhciBpIGluIGIpXG4gICAgICAgIHVbaV0gPSB7fTtcbiAgICByZXR1cm4gT2JqZWN0LmtleXModSkubGVuZ3RoO1xufVxuZnVuY3Rpb24gaW50ZXJzZWN0aW9uQ291bnQoYSwgYikge1xuICAgIHZhciBuID0gMDtcbiAgICBmb3IgKHZhciBpIGluIGEpXG4gICAgICAgIGlmICh0eXBlb2YgYltpXSAhPT0gJ3VuZGVmaW5lZCcpXG4gICAgICAgICAgICArK247XG4gICAgcmV0dXJuIG47XG59XG5mdW5jdGlvbiBnZXROZWlnaGJvdXJzKGxpbmtzLCBsYSkge1xuICAgIHZhciBuZWlnaGJvdXJzID0ge307XG4gICAgdmFyIGFkZE5laWdoYm91cnMgPSBmdW5jdGlvbiAodSwgdikge1xuICAgICAgICBpZiAodHlwZW9mIG5laWdoYm91cnNbdV0gPT09ICd1bmRlZmluZWQnKVxuICAgICAgICAgICAgbmVpZ2hib3Vyc1t1XSA9IHt9O1xuICAgICAgICBuZWlnaGJvdXJzW3VdW3ZdID0ge307XG4gICAgfTtcbiAgICBsaW5rcy5mb3JFYWNoKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHZhciB1ID0gbGEuZ2V0U291cmNlSW5kZXgoZSksIHYgPSBsYS5nZXRUYXJnZXRJbmRleChlKTtcbiAgICAgICAgYWRkTmVpZ2hib3Vycyh1LCB2KTtcbiAgICAgICAgYWRkTmVpZ2hib3Vycyh2LCB1KTtcbiAgICB9KTtcbiAgICByZXR1cm4gbmVpZ2hib3Vycztcbn1cbmZ1bmN0aW9uIGNvbXB1dGVMaW5rTGVuZ3RocyhsaW5rcywgdywgZiwgbGEpIHtcbiAgICB2YXIgbmVpZ2hib3VycyA9IGdldE5laWdoYm91cnMobGlua3MsIGxhKTtcbiAgICBsaW5rcy5mb3JFYWNoKGZ1bmN0aW9uIChsKSB7XG4gICAgICAgIHZhciBhID0gbmVpZ2hib3Vyc1tsYS5nZXRTb3VyY2VJbmRleChsKV07XG4gICAgICAgIHZhciBiID0gbmVpZ2hib3Vyc1tsYS5nZXRUYXJnZXRJbmRleChsKV07XG4gICAgICAgIGxhLnNldExlbmd0aChsLCAxICsgdyAqIGYoYSwgYikpO1xuICAgIH0pO1xufVxuZnVuY3Rpb24gc3ltbWV0cmljRGlmZkxpbmtMZW5ndGhzKGxpbmtzLCBsYSwgdykge1xuICAgIGlmICh3ID09PSB2b2lkIDApIHsgdyA9IDE7IH1cbiAgICBjb21wdXRlTGlua0xlbmd0aHMobGlua3MsIHcsIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBNYXRoLnNxcnQodW5pb25Db3VudChhLCBiKSAtIGludGVyc2VjdGlvbkNvdW50KGEsIGIpKTsgfSwgbGEpO1xufVxuZXhwb3J0cy5zeW1tZXRyaWNEaWZmTGlua0xlbmd0aHMgPSBzeW1tZXRyaWNEaWZmTGlua0xlbmd0aHM7XG5mdW5jdGlvbiBqYWNjYXJkTGlua0xlbmd0aHMobGlua3MsIGxhLCB3KSB7XG4gICAgaWYgKHcgPT09IHZvaWQgMCkgeyB3ID0gMTsgfVxuICAgIGNvbXB1dGVMaW5rTGVuZ3RocyhsaW5rcywgdywgZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIE1hdGgubWluKE9iamVjdC5rZXlzKGEpLmxlbmd0aCwgT2JqZWN0LmtleXMoYikubGVuZ3RoKSA8IDEuMSA/IDAgOiBpbnRlcnNlY3Rpb25Db3VudChhLCBiKSAvIHVuaW9uQ291bnQoYSwgYik7XG4gICAgfSwgbGEpO1xufVxuZXhwb3J0cy5qYWNjYXJkTGlua0xlbmd0aHMgPSBqYWNjYXJkTGlua0xlbmd0aHM7XG5mdW5jdGlvbiBnZW5lcmF0ZURpcmVjdGVkRWRnZUNvbnN0cmFpbnRzKG4sIGxpbmtzLCBheGlzLCBsYSkge1xuICAgIHZhciBjb21wb25lbnRzID0gc3Ryb25nbHlDb25uZWN0ZWRDb21wb25lbnRzKG4sIGxpbmtzLCBsYSk7XG4gICAgdmFyIG5vZGVzID0ge307XG4gICAgY29tcG9uZW50cy5mb3JFYWNoKGZ1bmN0aW9uIChjLCBpKSB7XG4gICAgICAgIHJldHVybiBjLmZvckVhY2goZnVuY3Rpb24gKHYpIHsgcmV0dXJuIG5vZGVzW3ZdID0gaTsgfSk7XG4gICAgfSk7XG4gICAgdmFyIGNvbnN0cmFpbnRzID0gW107XG4gICAgbGlua3MuZm9yRWFjaChmdW5jdGlvbiAobCkge1xuICAgICAgICB2YXIgdWkgPSBsYS5nZXRTb3VyY2VJbmRleChsKSwgdmkgPSBsYS5nZXRUYXJnZXRJbmRleChsKSwgdSA9IG5vZGVzW3VpXSwgdiA9IG5vZGVzW3ZpXTtcbiAgICAgICAgaWYgKHUgIT09IHYpIHtcbiAgICAgICAgICAgIGNvbnN0cmFpbnRzLnB1c2goe1xuICAgICAgICAgICAgICAgIGF4aXM6IGF4aXMsXG4gICAgICAgICAgICAgICAgbGVmdDogdWksXG4gICAgICAgICAgICAgICAgcmlnaHQ6IHZpLFxuICAgICAgICAgICAgICAgIGdhcDogbGEuZ2V0TWluU2VwYXJhdGlvbihsKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gY29uc3RyYWludHM7XG59XG5leHBvcnRzLmdlbmVyYXRlRGlyZWN0ZWRFZGdlQ29uc3RyYWludHMgPSBnZW5lcmF0ZURpcmVjdGVkRWRnZUNvbnN0cmFpbnRzO1xuZnVuY3Rpb24gc3Ryb25nbHlDb25uZWN0ZWRDb21wb25lbnRzKG51bVZlcnRpY2VzLCBlZGdlcywgbGEpIHtcbiAgICB2YXIgbm9kZXMgPSBbXTtcbiAgICB2YXIgaW5kZXggPSAwO1xuICAgIHZhciBzdGFjayA9IFtdO1xuICAgIHZhciBjb21wb25lbnRzID0gW107XG4gICAgZnVuY3Rpb24gc3Ryb25nQ29ubmVjdCh2KSB7XG4gICAgICAgIHYuaW5kZXggPSB2Lmxvd2xpbmsgPSBpbmRleCsrO1xuICAgICAgICBzdGFjay5wdXNoKHYpO1xuICAgICAgICB2Lm9uU3RhY2sgPSB0cnVlO1xuICAgICAgICBmb3IgKHZhciBfaSA9IDAsIF9hID0gdi5vdXQ7IF9pIDwgX2EubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICB2YXIgdyA9IF9hW19pXTtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygdy5pbmRleCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBzdHJvbmdDb25uZWN0KHcpO1xuICAgICAgICAgICAgICAgIHYubG93bGluayA9IE1hdGgubWluKHYubG93bGluaywgdy5sb3dsaW5rKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHcub25TdGFjaykge1xuICAgICAgICAgICAgICAgIHYubG93bGluayA9IE1hdGgubWluKHYubG93bGluaywgdy5pbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHYubG93bGluayA9PT0gdi5pbmRleCkge1xuICAgICAgICAgICAgdmFyIGNvbXBvbmVudCA9IFtdO1xuICAgICAgICAgICAgd2hpbGUgKHN0YWNrLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHcgPSBzdGFjay5wb3AoKTtcbiAgICAgICAgICAgICAgICB3Lm9uU3RhY2sgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBjb21wb25lbnQucHVzaCh3KTtcbiAgICAgICAgICAgICAgICBpZiAodyA9PT0gdilcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb21wb25lbnRzLnB1c2goY29tcG9uZW50Lm1hcChmdW5jdGlvbiAodikgeyByZXR1cm4gdi5pZDsgfSkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtVmVydGljZXM7IGkrKykge1xuICAgICAgICBub2Rlcy5wdXNoKHsgaWQ6IGksIG91dDogW10gfSk7XG4gICAgfVxuICAgIGZvciAodmFyIF9pID0gMCwgZWRnZXNfMSA9IGVkZ2VzOyBfaSA8IGVkZ2VzXzEubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgIHZhciBlID0gZWRnZXNfMVtfaV07XG4gICAgICAgIHZhciB2XzEgPSBub2Rlc1tsYS5nZXRTb3VyY2VJbmRleChlKV0sIHcgPSBub2Rlc1tsYS5nZXRUYXJnZXRJbmRleChlKV07XG4gICAgICAgIHZfMS5vdXQucHVzaCh3KTtcbiAgICB9XG4gICAgZm9yICh2YXIgX2EgPSAwLCBub2Rlc18xID0gbm9kZXM7IF9hIDwgbm9kZXNfMS5sZW5ndGg7IF9hKyspIHtcbiAgICAgICAgdmFyIHYgPSBub2Rlc18xW19hXTtcbiAgICAgICAgaWYgKHR5cGVvZiB2LmluZGV4ID09PSAndW5kZWZpbmVkJylcbiAgICAgICAgICAgIHN0cm9uZ0Nvbm5lY3Qodik7XG4gICAgfVxuICAgIHJldHVybiBjb21wb25lbnRzO1xufVxuZXhwb3J0cy5zdHJvbmdseUNvbm5lY3RlZENvbXBvbmVudHMgPSBzdHJvbmdseUNvbm5lY3RlZENvbXBvbmVudHM7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0ptYVd4bElqb2liR2x1YTJ4bGJtZDBhSE11YW5NaUxDSnpiM1Z5WTJWU2IyOTBJam9pSWl3aWMyOTFjbU5sY3lJNld5SXVMaTh1TGk5WFpXSkRiMnhoTDNOeVl5OXNhVzVyYkdWdVozUm9jeTUwY3lKZExDSnVZVzFsY3lJNlcxMHNJbTFoY0hCcGJtZHpJam9pT3p0QlFWVkpMRk5CUVZNc1ZVRkJWU3hEUVVGRExFTkJRVTBzUlVGQlJTeERRVUZOTzBsQlF6bENMRWxCUVVrc1EwRkJReXhIUVVGSExFVkJRVVVzUTBGQlF6dEpRVU5ZTEV0QlFVc3NTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJRenRSUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RlFVRkZMRU5CUVVNN1NVRkRNMElzUzBGQlN5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRPMUZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVWQlFVVXNRMEZCUXp0SlFVTXpRaXhQUVVGUExFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRE8wRkJRMnBETEVOQlFVTTdRVUZIUkN4VFFVRlRMR2xDUVVGcFFpeERRVUZETEVOQlFWY3NSVUZCUlN4RFFVRlhPMGxCUXk5RExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0SlFVTldMRXRCUVVzc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF6dFJRVUZGTEVsQlFVa3NUMEZCVHl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFdEJRVXNzVjBGQlZ6dFpRVUZGTEVWQlFVVXNRMEZCUXl4RFFVRkRPMGxCUTNSRUxFOUJRVThzUTBGQlF5eERRVUZETzBGQlEySXNRMEZCUXp0QlFVVkVMRk5CUVZNc1lVRkJZU3hEUVVGUExFdEJRV0VzUlVGQlJTeEZRVUZ6UWp0SlFVTTVSQ3hKUVVGSkxGVkJRVlVzUjBGQlJ5eEZRVUZGTEVOQlFVTTdTVUZEY0VJc1NVRkJTU3hoUVVGaExFZEJRVWNzVlVGQlF5eERRVUZETEVWQlFVVXNRMEZCUXp0UlFVTnlRaXhKUVVGSkxFOUJRVThzVlVGQlZTeERRVUZETEVOQlFVTXNRMEZCUXl4TFFVRkxMRmRCUVZjN1dVRkRjRU1zVlVGQlZTeERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRVZCUVVVc1EwRkJRenRSUVVOMlFpeFZRVUZWTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUlVGQlJTeERRVUZETzBsQlF6RkNMRU5CUVVNc1EwRkJRenRKUVVOR0xFdEJRVXNzUTBGQlF5eFBRVUZQTEVOQlFVTXNWVUZCUVN4RFFVRkRPMUZCUTFnc1NVRkJTU3hEUVVGRExFZEJRVWNzUlVGQlJTeERRVUZETEdOQlFXTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUlVGQlJTeERRVUZETEdOQlFXTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOMlJDeGhRVUZoTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRM0JDTEdGQlFXRXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03U1VGRGVFSXNRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRTQ3hQUVVGUExGVkJRVlVzUTBGQlF6dEJRVU4wUWl4RFFVRkRPMEZCUjBRc1UwRkJVeXhyUWtGQmEwSXNRMEZCVHl4TFFVRmhMRVZCUVVVc1EwRkJVeXhGUVVGRkxFTkJRVFpDTEVWQlFVVXNSVUZCTkVJN1NVRkRia2dzU1VGQlNTeFZRVUZWTEVkQlFVY3NZVUZCWVN4RFFVRkRMRXRCUVVzc1JVRkJSU3hGUVVGRkxFTkJRVU1zUTBGQlF6dEpRVU14UXl4TFFVRkxMRU5CUVVNc1QwRkJUeXhEUVVGRExGVkJRVUVzUTBGQlF6dFJRVU5ZTEVsQlFVa3NRMEZCUXl4SFFVRkhMRlZCUVZVc1EwRkJReXhGUVVGRkxFTkJRVU1zWTBGQll5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRla01zU1VGQlNTeERRVUZETEVkQlFVY3NWVUZCVlN4RFFVRkRMRVZCUVVVc1EwRkJReXhqUVVGakxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTjZReXhGUVVGRkxFTkJRVU1zVTBGQlV5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVOeVF5eERRVUZETEVOQlFVTXNRMEZCUXp0QlFVTlFMRU5CUVVNN1FVRkxSQ3hUUVVGblFpeDNRa0ZCZDBJc1EwRkJUeXhMUVVGaExFVkJRVVVzUlVGQk5FSXNSVUZCUlN4RFFVRmhPMGxCUVdJc2EwSkJRVUVzUlVGQlFTeExRVUZoTzBsQlEzSkhMR3RDUVVGclFpeERRVUZETEV0QlFVc3NSVUZCUlN4RFFVRkRMRVZCUVVVc1ZVRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEpRVUZMTEU5QlFVRXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhWUVVGVkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4SFFVRkhMR2xDUVVGcFFpeERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGeVJDeERRVUZ4UkN4RlFVRkZMRVZCUVVVc1EwRkJReXhEUVVGRE8wRkJRM1JITEVOQlFVTTdRVUZHUkN3MFJFRkZRenRCUVV0RUxGTkJRV2RDTEd0Q1FVRnJRaXhEUVVGUExFdEJRV0VzUlVGQlJTeEZRVUUwUWl4RlFVRkZMRU5CUVdFN1NVRkJZaXhyUWtGQlFTeEZRVUZCTEV0QlFXRTdTVUZETDBZc2EwSkJRV3RDTEVOQlFVTXNTMEZCU3l4RlFVRkZMRU5CUVVNc1JVRkJSU3hWUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETzFGQlF6bENMRTlCUVVFc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eE5RVUZOTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFMUJRVTBzUlVGQlJTeE5RVUZOTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eEhRVUZITEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eHBRa0ZCYVVJc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVkQlFVY3NWVUZCVlN4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU03U1VGQk4wY3NRMEZCTmtjc1JVRkRNMGNzUlVGQlJTeERRVUZETEVOQlFVTTdRVUZEWkN4RFFVRkRPMEZCU2tRc1owUkJTVU03UVVGdlFrUXNVMEZCWjBJc0swSkJRU3RDTEVOQlFVOHNRMEZCVXl4RlFVRkZMRXRCUVdFc1JVRkJSU3hKUVVGWkxFVkJRM2hHTEVWQlFYbENPMGxCUlhwQ0xFbEJRVWtzVlVGQlZTeEhRVUZITERKQ1FVRXlRaXhEUVVGRExFTkJRVU1zUlVGQlJTeExRVUZMTEVWQlFVVXNSVUZCUlN4RFFVRkRMRU5CUVVNN1NVRkRNMFFzU1VGQlNTeExRVUZMTEVkQlFVY3NSVUZCUlN4RFFVRkRPMGxCUTJZc1ZVRkJWU3hEUVVGRExFOUJRVThzUTBGQlF5eFZRVUZETEVOQlFVTXNSVUZCUXl4RFFVRkRPMUZCUTI1Q0xFOUJRVUVzUTBGQlF5eERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRkJMRU5CUVVNc1NVRkJTU3hQUVVGQkxFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVZvc1EwRkJXU3hEUVVGRE8wbEJRVFZDTEVOQlFUUkNMRU5CUXk5Q0xFTkJRVU03U1VGRFJpeEpRVUZKTEZkQlFWY3NSMEZCVlN4RlFVRkZMRU5CUVVNN1NVRkROVUlzUzBGQlN5eERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRkJMRU5CUVVNN1VVRkRXQ3hKUVVGSkxFVkJRVVVzUjBGQlJ5eEZRVUZGTEVOQlFVTXNZMEZCWXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFVkJRVVVzUjBGQlJ5eEZRVUZGTEVOQlFVTXNZMEZCWXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVOd1JDeERRVUZETEVkQlFVY3NTMEZCU3l4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eExRVUZMTEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNN1VVRkRha01zU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RlFVRkZPMWxCUTFRc1YwRkJWeXhEUVVGRExFbEJRVWtzUTBGQlF6dG5Ra0ZEWWl4SlFVRkpMRVZCUVVVc1NVRkJTVHRuUWtGRFZpeEpRVUZKTEVWQlFVVXNSVUZCUlR0blFrRkRVaXhMUVVGTExFVkJRVVVzUlVGQlJUdG5Ra0ZEVkN4SFFVRkhMRVZCUVVVc1JVRkJSU3hEUVVGRExHZENRVUZuUWl4RFFVRkRMRU5CUVVNc1EwRkJRenRoUVVNNVFpeERRVUZETEVOQlFVTTdVMEZEVGp0SlFVTk1MRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJRMGdzVDBGQlR5eFhRVUZYTEVOQlFVTTdRVUZEZGtJc1EwRkJRenRCUVhSQ1JDd3dSVUZ6UWtNN1FVRlJSQ3hUUVVGblFpd3lRa0ZCTWtJc1EwRkJUeXhYUVVGdFFpeEZRVUZGTEV0QlFXRXNSVUZCUlN4RlFVRnpRanRKUVVONFJ5eEpRVUZKTEV0QlFVc3NSMEZCUnl4RlFVRkZMRU5CUVVNN1NVRkRaaXhKUVVGSkxFdEJRVXNzUjBGQlJ5eERRVUZETEVOQlFVTTdTVUZEWkN4SlFVRkpMRXRCUVVzc1IwRkJSeXhGUVVGRkxFTkJRVU03U1VGRFppeEpRVUZKTEZWQlFWVXNSMEZCUnl4RlFVRkZMRU5CUVVNN1NVRkRjRUlzVTBGQlV5eGhRVUZoTEVOQlFVTXNRMEZCUXp0UlFVVndRaXhEUVVGRExFTkJRVU1zUzBGQlN5eEhRVUZITEVOQlFVTXNRMEZCUXl4UFFVRlBMRWRCUVVjc1MwRkJTeXhGUVVGRkxFTkJRVU03VVVGRE9VSXNTMEZCU3l4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU5rTEVOQlFVTXNRMEZCUXl4UFFVRlBMRWRCUVVjc1NVRkJTU3hEUVVGRE8xRkJSMnBDTEV0QlFXTXNWVUZCU3l4RlFVRk1MRXRCUVVFc1EwRkJReXhEUVVGRExFZEJRVWNzUlVGQlRDeGpRVUZMTEVWQlFVd3NTVUZCU3l4RlFVRkZPMWxCUVdoQ0xFbEJRVWtzUTBGQlF5eFRRVUZCTzFsQlEwNHNTVUZCU1N4UFFVRlBMRU5CUVVNc1EwRkJReXhMUVVGTExFdEJRVXNzVjBGQlZ5eEZRVUZGTzJkQ1FVVm9ReXhoUVVGaExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdaMEpCUTJwQ0xFTkJRVU1zUTBGQlF5eFBRVUZQTEVkQlFVY3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zVDBGQlR5eEZRVUZGTEVOQlFVTXNRMEZCUXl4UFFVRlBMRU5CUVVNc1EwRkJRenRoUVVNNVF6dHBRa0ZCVFN4SlFVRkpMRU5CUVVNc1EwRkJReXhQUVVGUExFVkJRVVU3WjBKQlJXeENMRU5CUVVNc1EwRkJReXhQUVVGUExFZEJRVWNzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU1zUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXp0aFFVTTFRenRUUVVOS08xRkJSMFFzU1VGQlNTeERRVUZETEVOQlFVTXNUMEZCVHl4TFFVRkxMRU5CUVVNc1EwRkJReXhMUVVGTExFVkJRVVU3V1VGRmRrSXNTVUZCU1N4VFFVRlRMRWRCUVVjc1JVRkJSU3hEUVVGRE8xbEJRMjVDTEU5QlFVOHNTMEZCU3l4RFFVRkRMRTFCUVUwc1JVRkJSVHRuUWtGRGFrSXNRMEZCUXl4SFFVRkhMRXRCUVVzc1EwRkJReXhIUVVGSExFVkJRVVVzUTBGQlF6dG5Ra0ZEYUVJc1EwRkJReXhEUVVGRExFOUJRVThzUjBGQlJ5eExRVUZMTEVOQlFVTTdaMEpCUld4Q0xGTkJRVk1zUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1owSkJRMnhDTEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNN2IwSkJRVVVzVFVGQlRUdGhRVU4wUWp0WlFVVkVMRlZCUVZVc1EwRkJReXhKUVVGSkxFTkJRVU1zVTBGQlV5eERRVUZETEVkQlFVY3NRMEZCUXl4VlFVRkJMRU5CUVVNc1NVRkJTU3hQUVVGQkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVWQlFVb3NRMEZCU1N4RFFVRkRMRU5CUVVNc1EwRkJRenRUUVVNM1F6dEpRVU5NTEVOQlFVTTdTVUZEUkN4TFFVRkxMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NWMEZCVnl4RlFVRkZMRU5CUVVNc1JVRkJSU3hGUVVGRk8xRkJRMnhETEV0QlFVc3NRMEZCUXl4SlFVRkpMRU5CUVVNc1JVRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTEVkQlFVY3NSVUZCUlN4RlFVRkZMRVZCUVVNc1EwRkJReXhEUVVGRE8wdEJRMmhETzBsQlEwUXNTMEZCWXl4VlFVRkxMRVZCUVV3c1pVRkJTeXhGUVVGTUxHMUNRVUZMTEVWQlFVd3NTVUZCU3l4RlFVRkZPMUZCUVdoQ0xFbEJRVWtzUTBGQlF5eGpRVUZCTzFGQlEwNHNTVUZCU1N4SFFVRkRMRWRCUVVjc1MwRkJTeXhEUVVGRExFVkJRVVVzUTBGQlF5eGpRVUZqTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkRMMElzUTBGQlF5eEhRVUZITEV0QlFVc3NRMEZCUXl4RlFVRkZMRU5CUVVNc1kwRkJZeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEY0VNc1IwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1MwRkRha0k3U1VGRFJDeExRVUZqTEZWQlFVc3NSVUZCVEN4bFFVRkxMRVZCUVV3c2JVSkJRVXNzUlVGQlRDeEpRVUZMTzFGQlFXUXNTVUZCU1N4RFFVRkRMR05CUVVFN1VVRkJWeXhKUVVGSkxFOUJRVThzUTBGQlF5eERRVUZETEV0QlFVc3NTMEZCU3l4WFFVRlhPMWxCUVVVc1lVRkJZU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzB0QlFVRTdTVUZETVVVc1QwRkJUeXhWUVVGVkxFTkJRVU03UVVGRGRFSXNRMEZCUXp0QlFXaEVSQ3hyUlVGblJFTWlmUT09IiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgUG93ZXJFZGdlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBQb3dlckVkZ2Uoc291cmNlLCB0YXJnZXQsIHR5cGUpIHtcbiAgICAgICAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG4gICAgICAgIHRoaXMudGFyZ2V0ID0gdGFyZ2V0O1xuICAgICAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgIH1cbiAgICByZXR1cm4gUG93ZXJFZGdlO1xufSgpKTtcbmV4cG9ydHMuUG93ZXJFZGdlID0gUG93ZXJFZGdlO1xudmFyIENvbmZpZ3VyYXRpb24gPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIENvbmZpZ3VyYXRpb24obiwgZWRnZXMsIGxpbmtBY2Nlc3Nvciwgcm9vdEdyb3VwKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHRoaXMubGlua0FjY2Vzc29yID0gbGlua0FjY2Vzc29yO1xuICAgICAgICB0aGlzLm1vZHVsZXMgPSBuZXcgQXJyYXkobik7XG4gICAgICAgIHRoaXMucm9vdHMgPSBbXTtcbiAgICAgICAgaWYgKHJvb3RHcm91cCkge1xuICAgICAgICAgICAgdGhpcy5pbml0TW9kdWxlc0Zyb21Hcm91cChyb290R3JvdXApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5yb290cy5wdXNoKG5ldyBNb2R1bGVTZXQoKSk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG47ICsraSlcbiAgICAgICAgICAgICAgICB0aGlzLnJvb3RzWzBdLmFkZCh0aGlzLm1vZHVsZXNbaV0gPSBuZXcgTW9kdWxlKGkpKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLlIgPSBlZGdlcy5sZW5ndGg7XG4gICAgICAgIGVkZ2VzLmZvckVhY2goZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIHZhciBzID0gX3RoaXMubW9kdWxlc1tsaW5rQWNjZXNzb3IuZ2V0U291cmNlSW5kZXgoZSldLCB0ID0gX3RoaXMubW9kdWxlc1tsaW5rQWNjZXNzb3IuZ2V0VGFyZ2V0SW5kZXgoZSldLCB0eXBlID0gbGlua0FjY2Vzc29yLmdldFR5cGUoZSk7XG4gICAgICAgICAgICBzLm91dGdvaW5nLmFkZCh0eXBlLCB0KTtcbiAgICAgICAgICAgIHQuaW5jb21pbmcuYWRkKHR5cGUsIHMpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgQ29uZmlndXJhdGlvbi5wcm90b3R5cGUuaW5pdE1vZHVsZXNGcm9tR3JvdXAgPSBmdW5jdGlvbiAoZ3JvdXApIHtcbiAgICAgICAgdmFyIG1vZHVsZVNldCA9IG5ldyBNb2R1bGVTZXQoKTtcbiAgICAgICAgdGhpcy5yb290cy5wdXNoKG1vZHVsZVNldCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZ3JvdXAubGVhdmVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICB2YXIgbm9kZSA9IGdyb3VwLmxlYXZlc1tpXTtcbiAgICAgICAgICAgIHZhciBtb2R1bGUgPSBuZXcgTW9kdWxlKG5vZGUuaWQpO1xuICAgICAgICAgICAgdGhpcy5tb2R1bGVzW25vZGUuaWRdID0gbW9kdWxlO1xuICAgICAgICAgICAgbW9kdWxlU2V0LmFkZChtb2R1bGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChncm91cC5ncm91cHMpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgZ3JvdXAuZ3JvdXBzLmxlbmd0aDsgKytqKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNoaWxkID0gZ3JvdXAuZ3JvdXBzW2pdO1xuICAgICAgICAgICAgICAgIHZhciBkZWZpbml0aW9uID0ge307XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBjaGlsZClcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb3AgIT09IFwibGVhdmVzXCIgJiYgcHJvcCAhPT0gXCJncm91cHNcIiAmJiBjaGlsZC5oYXNPd25Qcm9wZXJ0eShwcm9wKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmluaXRpb25bcHJvcF0gPSBjaGlsZFtwcm9wXTtcbiAgICAgICAgICAgICAgICBtb2R1bGVTZXQuYWRkKG5ldyBNb2R1bGUoLTEgLSBqLCBuZXcgTGlua1NldHMoKSwgbmV3IExpbmtTZXRzKCksIHRoaXMuaW5pdE1vZHVsZXNGcm9tR3JvdXAoY2hpbGQpLCBkZWZpbml0aW9uKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1vZHVsZVNldDtcbiAgICB9O1xuICAgIENvbmZpZ3VyYXRpb24ucHJvdG90eXBlLm1lcmdlID0gZnVuY3Rpb24gKGEsIGIsIGspIHtcbiAgICAgICAgaWYgKGsgPT09IHZvaWQgMCkgeyBrID0gMDsgfVxuICAgICAgICB2YXIgaW5JbnQgPSBhLmluY29taW5nLmludGVyc2VjdGlvbihiLmluY29taW5nKSwgb3V0SW50ID0gYS5vdXRnb2luZy5pbnRlcnNlY3Rpb24oYi5vdXRnb2luZyk7XG4gICAgICAgIHZhciBjaGlsZHJlbiA9IG5ldyBNb2R1bGVTZXQoKTtcbiAgICAgICAgY2hpbGRyZW4uYWRkKGEpO1xuICAgICAgICBjaGlsZHJlbi5hZGQoYik7XG4gICAgICAgIHZhciBtID0gbmV3IE1vZHVsZSh0aGlzLm1vZHVsZXMubGVuZ3RoLCBvdXRJbnQsIGluSW50LCBjaGlsZHJlbik7XG4gICAgICAgIHRoaXMubW9kdWxlcy5wdXNoKG0pO1xuICAgICAgICB2YXIgdXBkYXRlID0gZnVuY3Rpb24gKHMsIGksIG8pIHtcbiAgICAgICAgICAgIHMuZm9yQWxsKGZ1bmN0aW9uIChtcywgbGlua3R5cGUpIHtcbiAgICAgICAgICAgICAgICBtcy5mb3JBbGwoZnVuY3Rpb24gKG4pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5scyA9IG5baV07XG4gICAgICAgICAgICAgICAgICAgIG5scy5hZGQobGlua3R5cGUsIG0pO1xuICAgICAgICAgICAgICAgICAgICBubHMucmVtb3ZlKGxpbmt0eXBlLCBhKTtcbiAgICAgICAgICAgICAgICAgICAgbmxzLnJlbW92ZShsaW5rdHlwZSwgYik7XG4gICAgICAgICAgICAgICAgICAgIGFbb10ucmVtb3ZlKGxpbmt0eXBlLCBuKTtcbiAgICAgICAgICAgICAgICAgICAgYltvXS5yZW1vdmUobGlua3R5cGUsIG4pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIHVwZGF0ZShvdXRJbnQsIFwiaW5jb21pbmdcIiwgXCJvdXRnb2luZ1wiKTtcbiAgICAgICAgdXBkYXRlKGluSW50LCBcIm91dGdvaW5nXCIsIFwiaW5jb21pbmdcIik7XG4gICAgICAgIHRoaXMuUiAtPSBpbkludC5jb3VudCgpICsgb3V0SW50LmNvdW50KCk7XG4gICAgICAgIHRoaXMucm9vdHNba10ucmVtb3ZlKGEpO1xuICAgICAgICB0aGlzLnJvb3RzW2tdLnJlbW92ZShiKTtcbiAgICAgICAgdGhpcy5yb290c1trXS5hZGQobSk7XG4gICAgICAgIHJldHVybiBtO1xuICAgIH07XG4gICAgQ29uZmlndXJhdGlvbi5wcm90b3R5cGUucm9vdE1lcmdlcyA9IGZ1bmN0aW9uIChrKSB7XG4gICAgICAgIGlmIChrID09PSB2b2lkIDApIHsgayA9IDA7IH1cbiAgICAgICAgdmFyIHJzID0gdGhpcy5yb290c1trXS5tb2R1bGVzKCk7XG4gICAgICAgIHZhciBuID0gcnMubGVuZ3RoO1xuICAgICAgICB2YXIgbWVyZ2VzID0gbmV3IEFycmF5KG4gKiAobiAtIDEpKTtcbiAgICAgICAgdmFyIGN0ciA9IDA7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBpXyA9IG4gLSAxOyBpIDwgaV87ICsraSkge1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IGkgKyAxOyBqIDwgbjsgKytqKSB7XG4gICAgICAgICAgICAgICAgdmFyIGEgPSByc1tpXSwgYiA9IHJzW2pdO1xuICAgICAgICAgICAgICAgIG1lcmdlc1tjdHJdID0geyBpZDogY3RyLCBuRWRnZXM6IHRoaXMubkVkZ2VzKGEsIGIpLCBhOiBhLCBiOiBiIH07XG4gICAgICAgICAgICAgICAgY3RyKys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1lcmdlcztcbiAgICB9O1xuICAgIENvbmZpZ3VyYXRpb24ucHJvdG90eXBlLmdyZWVkeU1lcmdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucm9vdHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnJvb3RzW2ldLm1vZHVsZXMoKS5sZW5ndGggPCAyKVxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgdmFyIG1zID0gdGhpcy5yb290TWVyZ2VzKGkpLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEubkVkZ2VzID09IGIubkVkZ2VzID8gYS5pZCAtIGIuaWQgOiBhLm5FZGdlcyAtIGIubkVkZ2VzOyB9KTtcbiAgICAgICAgICAgIHZhciBtID0gbXNbMF07XG4gICAgICAgICAgICBpZiAobS5uRWRnZXMgPj0gdGhpcy5SKVxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgdGhpcy5tZXJnZShtLmEsIG0uYiwgaSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgQ29uZmlndXJhdGlvbi5wcm90b3R5cGUubkVkZ2VzID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgdmFyIGluSW50ID0gYS5pbmNvbWluZy5pbnRlcnNlY3Rpb24oYi5pbmNvbWluZyksIG91dEludCA9IGEub3V0Z29pbmcuaW50ZXJzZWN0aW9uKGIub3V0Z29pbmcpO1xuICAgICAgICByZXR1cm4gdGhpcy5SIC0gaW5JbnQuY291bnQoKSAtIG91dEludC5jb3VudCgpO1xuICAgIH07XG4gICAgQ29uZmlndXJhdGlvbi5wcm90b3R5cGUuZ2V0R3JvdXBIaWVyYXJjaHkgPSBmdW5jdGlvbiAocmV0YXJnZXRlZEVkZ2VzKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBncm91cHMgPSBbXTtcbiAgICAgICAgdmFyIHJvb3QgPSB7fTtcbiAgICAgICAgdG9Hcm91cHModGhpcy5yb290c1swXSwgcm9vdCwgZ3JvdXBzKTtcbiAgICAgICAgdmFyIGVzID0gdGhpcy5hbGxFZGdlcygpO1xuICAgICAgICBlcy5mb3JFYWNoKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICB2YXIgYSA9IF90aGlzLm1vZHVsZXNbZS5zb3VyY2VdO1xuICAgICAgICAgICAgdmFyIGIgPSBfdGhpcy5tb2R1bGVzW2UudGFyZ2V0XTtcbiAgICAgICAgICAgIHJldGFyZ2V0ZWRFZGdlcy5wdXNoKG5ldyBQb3dlckVkZ2UodHlwZW9mIGEuZ2lkID09PSBcInVuZGVmaW5lZFwiID8gZS5zb3VyY2UgOiBncm91cHNbYS5naWRdLCB0eXBlb2YgYi5naWQgPT09IFwidW5kZWZpbmVkXCIgPyBlLnRhcmdldCA6IGdyb3Vwc1tiLmdpZF0sIGUudHlwZSkpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGdyb3VwcztcbiAgICB9O1xuICAgIENvbmZpZ3VyYXRpb24ucHJvdG90eXBlLmFsbEVkZ2VzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZXMgPSBbXTtcbiAgICAgICAgQ29uZmlndXJhdGlvbi5nZXRFZGdlcyh0aGlzLnJvb3RzWzBdLCBlcyk7XG4gICAgICAgIHJldHVybiBlcztcbiAgICB9O1xuICAgIENvbmZpZ3VyYXRpb24uZ2V0RWRnZXMgPSBmdW5jdGlvbiAobW9kdWxlcywgZXMpIHtcbiAgICAgICAgbW9kdWxlcy5mb3JBbGwoZnVuY3Rpb24gKG0pIHtcbiAgICAgICAgICAgIG0uZ2V0RWRnZXMoZXMpO1xuICAgICAgICAgICAgQ29uZmlndXJhdGlvbi5nZXRFZGdlcyhtLmNoaWxkcmVuLCBlcyk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgcmV0dXJuIENvbmZpZ3VyYXRpb247XG59KCkpO1xuZXhwb3J0cy5Db25maWd1cmF0aW9uID0gQ29uZmlndXJhdGlvbjtcbmZ1bmN0aW9uIHRvR3JvdXBzKG1vZHVsZXMsIGdyb3VwLCBncm91cHMpIHtcbiAgICBtb2R1bGVzLmZvckFsbChmdW5jdGlvbiAobSkge1xuICAgICAgICBpZiAobS5pc0xlYWYoKSkge1xuICAgICAgICAgICAgaWYgKCFncm91cC5sZWF2ZXMpXG4gICAgICAgICAgICAgICAgZ3JvdXAubGVhdmVzID0gW107XG4gICAgICAgICAgICBncm91cC5sZWF2ZXMucHVzaChtLmlkKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBnID0gZ3JvdXA7XG4gICAgICAgICAgICBtLmdpZCA9IGdyb3Vwcy5sZW5ndGg7XG4gICAgICAgICAgICBpZiAoIW0uaXNJc2xhbmQoKSB8fCBtLmlzUHJlZGVmaW5lZCgpKSB7XG4gICAgICAgICAgICAgICAgZyA9IHsgaWQ6IG0uZ2lkIH07XG4gICAgICAgICAgICAgICAgaWYgKG0uaXNQcmVkZWZpbmVkKCkpXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gbS5kZWZpbml0aW9uKVxuICAgICAgICAgICAgICAgICAgICAgICAgZ1twcm9wXSA9IG0uZGVmaW5pdGlvbltwcm9wXTtcbiAgICAgICAgICAgICAgICBpZiAoIWdyb3VwLmdyb3VwcylcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXAuZ3JvdXBzID0gW107XG4gICAgICAgICAgICAgICAgZ3JvdXAuZ3JvdXBzLnB1c2gobS5naWQpO1xuICAgICAgICAgICAgICAgIGdyb3Vwcy5wdXNoKGcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdG9Hcm91cHMobS5jaGlsZHJlbiwgZywgZ3JvdXBzKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxudmFyIE1vZHVsZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTW9kdWxlKGlkLCBvdXRnb2luZywgaW5jb21pbmcsIGNoaWxkcmVuLCBkZWZpbml0aW9uKSB7XG4gICAgICAgIGlmIChvdXRnb2luZyA9PT0gdm9pZCAwKSB7IG91dGdvaW5nID0gbmV3IExpbmtTZXRzKCk7IH1cbiAgICAgICAgaWYgKGluY29taW5nID09PSB2b2lkIDApIHsgaW5jb21pbmcgPSBuZXcgTGlua1NldHMoKTsgfVxuICAgICAgICBpZiAoY2hpbGRyZW4gPT09IHZvaWQgMCkgeyBjaGlsZHJlbiA9IG5ldyBNb2R1bGVTZXQoKTsgfVxuICAgICAgICB0aGlzLmlkID0gaWQ7XG4gICAgICAgIHRoaXMub3V0Z29pbmcgPSBvdXRnb2luZztcbiAgICAgICAgdGhpcy5pbmNvbWluZyA9IGluY29taW5nO1xuICAgICAgICB0aGlzLmNoaWxkcmVuID0gY2hpbGRyZW47XG4gICAgICAgIHRoaXMuZGVmaW5pdGlvbiA9IGRlZmluaXRpb247XG4gICAgfVxuICAgIE1vZHVsZS5wcm90b3R5cGUuZ2V0RWRnZXMgPSBmdW5jdGlvbiAoZXMpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdGhpcy5vdXRnb2luZy5mb3JBbGwoZnVuY3Rpb24gKG1zLCBlZGdldHlwZSkge1xuICAgICAgICAgICAgbXMuZm9yQWxsKGZ1bmN0aW9uICh0YXJnZXQpIHtcbiAgICAgICAgICAgICAgICBlcy5wdXNoKG5ldyBQb3dlckVkZ2UoX3RoaXMuaWQsIHRhcmdldC5pZCwgZWRnZXR5cGUpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIE1vZHVsZS5wcm90b3R5cGUuaXNMZWFmID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jaGlsZHJlbi5jb3VudCgpID09PSAwO1xuICAgIH07XG4gICAgTW9kdWxlLnByb3RvdHlwZS5pc0lzbGFuZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3V0Z29pbmcuY291bnQoKSA9PT0gMCAmJiB0aGlzLmluY29taW5nLmNvdW50KCkgPT09IDA7XG4gICAgfTtcbiAgICBNb2R1bGUucHJvdG90eXBlLmlzUHJlZGVmaW5lZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiB0aGlzLmRlZmluaXRpb24gIT09IFwidW5kZWZpbmVkXCI7XG4gICAgfTtcbiAgICByZXR1cm4gTW9kdWxlO1xufSgpKTtcbmV4cG9ydHMuTW9kdWxlID0gTW9kdWxlO1xuZnVuY3Rpb24gaW50ZXJzZWN0aW9uKG0sIG4pIHtcbiAgICB2YXIgaSA9IHt9O1xuICAgIGZvciAodmFyIHYgaW4gbSlcbiAgICAgICAgaWYgKHYgaW4gbilcbiAgICAgICAgICAgIGlbdl0gPSBtW3ZdO1xuICAgIHJldHVybiBpO1xufVxudmFyIE1vZHVsZVNldCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTW9kdWxlU2V0KCkge1xuICAgICAgICB0aGlzLnRhYmxlID0ge307XG4gICAgfVxuICAgIE1vZHVsZVNldC5wcm90b3R5cGUuY291bnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLnRhYmxlKS5sZW5ndGg7XG4gICAgfTtcbiAgICBNb2R1bGVTZXQucHJvdG90eXBlLmludGVyc2VjdGlvbiA9IGZ1bmN0aW9uIChvdGhlcikge1xuICAgICAgICB2YXIgcmVzdWx0ID0gbmV3IE1vZHVsZVNldCgpO1xuICAgICAgICByZXN1bHQudGFibGUgPSBpbnRlcnNlY3Rpb24odGhpcy50YWJsZSwgb3RoZXIudGFibGUpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gICAgTW9kdWxlU2V0LnByb3RvdHlwZS5pbnRlcnNlY3Rpb25Db3VudCA9IGZ1bmN0aW9uIChvdGhlcikge1xuICAgICAgICByZXR1cm4gdGhpcy5pbnRlcnNlY3Rpb24ob3RoZXIpLmNvdW50KCk7XG4gICAgfTtcbiAgICBNb2R1bGVTZXQucHJvdG90eXBlLmNvbnRhaW5zID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgIHJldHVybiBpZCBpbiB0aGlzLnRhYmxlO1xuICAgIH07XG4gICAgTW9kdWxlU2V0LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiAobSkge1xuICAgICAgICB0aGlzLnRhYmxlW20uaWRdID0gbTtcbiAgICB9O1xuICAgIE1vZHVsZVNldC5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gKG0pIHtcbiAgICAgICAgZGVsZXRlIHRoaXMudGFibGVbbS5pZF07XG4gICAgfTtcbiAgICBNb2R1bGVTZXQucHJvdG90eXBlLmZvckFsbCA9IGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIGZvciAodmFyIG1pZCBpbiB0aGlzLnRhYmxlKSB7XG4gICAgICAgICAgICBmKHRoaXMudGFibGVbbWlkXSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIE1vZHVsZVNldC5wcm90b3R5cGUubW9kdWxlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHZzID0gW107XG4gICAgICAgIHRoaXMuZm9yQWxsKGZ1bmN0aW9uIChtKSB7XG4gICAgICAgICAgICBpZiAoIW0uaXNQcmVkZWZpbmVkKCkpXG4gICAgICAgICAgICAgICAgdnMucHVzaChtKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB2cztcbiAgICB9O1xuICAgIHJldHVybiBNb2R1bGVTZXQ7XG59KCkpO1xuZXhwb3J0cy5Nb2R1bGVTZXQgPSBNb2R1bGVTZXQ7XG52YXIgTGlua1NldHMgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIExpbmtTZXRzKCkge1xuICAgICAgICB0aGlzLnNldHMgPSB7fTtcbiAgICAgICAgdGhpcy5uID0gMDtcbiAgICB9XG4gICAgTGlua1NldHMucHJvdG90eXBlLmNvdW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5uO1xuICAgIH07XG4gICAgTGlua1NldHMucHJvdG90eXBlLmNvbnRhaW5zID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5mb3JBbGxNb2R1bGVzKGZ1bmN0aW9uIChtKSB7XG4gICAgICAgICAgICBpZiAoIXJlc3VsdCAmJiBtLmlkID09IGlkKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgICBMaW5rU2V0cy5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gKGxpbmt0eXBlLCBtKSB7XG4gICAgICAgIHZhciBzID0gbGlua3R5cGUgaW4gdGhpcy5zZXRzID8gdGhpcy5zZXRzW2xpbmt0eXBlXSA6IHRoaXMuc2V0c1tsaW5rdHlwZV0gPSBuZXcgTW9kdWxlU2V0KCk7XG4gICAgICAgIHMuYWRkKG0pO1xuICAgICAgICArK3RoaXMubjtcbiAgICB9O1xuICAgIExpbmtTZXRzLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiAobGlua3R5cGUsIG0pIHtcbiAgICAgICAgdmFyIG1zID0gdGhpcy5zZXRzW2xpbmt0eXBlXTtcbiAgICAgICAgbXMucmVtb3ZlKG0pO1xuICAgICAgICBpZiAobXMuY291bnQoKSA9PT0gMCkge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuc2V0c1tsaW5rdHlwZV07XG4gICAgICAgIH1cbiAgICAgICAgLS10aGlzLm47XG4gICAgfTtcbiAgICBMaW5rU2V0cy5wcm90b3R5cGUuZm9yQWxsID0gZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgZm9yICh2YXIgbGlua3R5cGUgaW4gdGhpcy5zZXRzKSB7XG4gICAgICAgICAgICBmKHRoaXMuc2V0c1tsaW5rdHlwZV0sIE51bWJlcihsaW5rdHlwZSkpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBMaW5rU2V0cy5wcm90b3R5cGUuZm9yQWxsTW9kdWxlcyA9IGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIHRoaXMuZm9yQWxsKGZ1bmN0aW9uIChtcywgbHQpIHsgcmV0dXJuIG1zLmZvckFsbChmKTsgfSk7XG4gICAgfTtcbiAgICBMaW5rU2V0cy5wcm90b3R5cGUuaW50ZXJzZWN0aW9uID0gZnVuY3Rpb24gKG90aGVyKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSBuZXcgTGlua1NldHMoKTtcbiAgICAgICAgdGhpcy5mb3JBbGwoZnVuY3Rpb24gKG1zLCBsdCkge1xuICAgICAgICAgICAgaWYgKGx0IGluIG90aGVyLnNldHMpIHtcbiAgICAgICAgICAgICAgICB2YXIgaSA9IG1zLmludGVyc2VjdGlvbihvdGhlci5zZXRzW2x0XSksIG4gPSBpLmNvdW50KCk7XG4gICAgICAgICAgICAgICAgaWYgKG4gPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5zZXRzW2x0XSA9IGk7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5uICs9IG47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICAgIHJldHVybiBMaW5rU2V0cztcbn0oKSk7XG5leHBvcnRzLkxpbmtTZXRzID0gTGlua1NldHM7XG5mdW5jdGlvbiBpbnRlcnNlY3Rpb25Db3VudChtLCBuKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKGludGVyc2VjdGlvbihtLCBuKSkubGVuZ3RoO1xufVxuZnVuY3Rpb24gZ2V0R3JvdXBzKG5vZGVzLCBsaW5rcywgbGEsIHJvb3RHcm91cCkge1xuICAgIHZhciBuID0gbm9kZXMubGVuZ3RoLCBjID0gbmV3IENvbmZpZ3VyYXRpb24obiwgbGlua3MsIGxhLCByb290R3JvdXApO1xuICAgIHdoaWxlIChjLmdyZWVkeU1lcmdlKCkpXG4gICAgICAgIDtcbiAgICB2YXIgcG93ZXJFZGdlcyA9IFtdO1xuICAgIHZhciBnID0gYy5nZXRHcm91cEhpZXJhcmNoeShwb3dlckVkZ2VzKTtcbiAgICBwb3dlckVkZ2VzLmZvckVhY2goZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgdmFyIGYgPSBmdW5jdGlvbiAoZW5kKSB7XG4gICAgICAgICAgICB2YXIgZyA9IGVbZW5kXTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZyA9PSBcIm51bWJlclwiKVxuICAgICAgICAgICAgICAgIGVbZW5kXSA9IG5vZGVzW2ddO1xuICAgICAgICB9O1xuICAgICAgICBmKFwic291cmNlXCIpO1xuICAgICAgICBmKFwidGFyZ2V0XCIpO1xuICAgIH0pO1xuICAgIHJldHVybiB7IGdyb3VwczogZywgcG93ZXJFZGdlczogcG93ZXJFZGdlcyB9O1xufVxuZXhwb3J0cy5nZXRHcm91cHMgPSBnZXRHcm91cHM7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0ptYVd4bElqb2ljRzkzWlhKbmNtRndhQzVxY3lJc0luTnZkWEpqWlZKdmIzUWlPaUlpTENKemIzVnlZMlZ6SWpwYklpNHVMeTR1TDFkbFlrTnZiR0V2YzNKakwzQnZkMlZ5WjNKaGNHZ3VkSE1pWFN3aWJtRnRaWE1pT2x0ZExDSnRZWEJ3YVc1bmN5STZJanM3UVVGUFNUdEpRVU5KTEcxQ1FVTlhMRTFCUVZjc1JVRkRXQ3hOUVVGWExFVkJRMWdzU1VGQldUdFJRVVphTEZkQlFVMHNSMEZCVGl4TlFVRk5MRU5CUVVzN1VVRkRXQ3hYUVVGTkxFZEJRVTRzVFVGQlRTeERRVUZMTzFGQlExZ3NVMEZCU1N4SFFVRktMRWxCUVVrc1EwRkJVVHRKUVVGSkxFTkJRVU03U1VGRGFFTXNaMEpCUVVNN1FVRkJSQ3hEUVVGRExFRkJURVFzU1VGTFF6dEJRVXhaTERoQ1FVRlRPMEZCVDNSQ08wbEJVMGtzZFVKQlFWa3NRMEZCVXl4RlFVRkZMRXRCUVdFc1JVRkJWU3haUVVGdlF5eEZRVUZGTEZOQlFXbENPMUZCUVhKSExHbENRV3RDUXp0UlFXeENOa01zYVVKQlFWa3NSMEZCV2l4WlFVRlpMRU5CUVhkQ08xRkJRemxGTEVsQlFVa3NRMEZCUXl4UFFVRlBMRWRCUVVjc1NVRkJTU3hMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZETlVJc1NVRkJTU3hEUVVGRExFdEJRVXNzUjBGQlJ5eEZRVUZGTEVOQlFVTTdVVUZEYUVJc1NVRkJTU3hUUVVGVExFVkJRVVU3V1VGRFdDeEpRVUZKTEVOQlFVTXNiMEpCUVc5Q0xFTkJRVU1zVTBGQlV5eERRVUZETEVOQlFVTTdVMEZEZUVNN1lVRkJUVHRaUVVOSUxFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1UwRkJVeXhGUVVGRkxFTkJRVU1zUTBGQlF6dFpRVU5xUXl4TFFVRkxMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJRenRuUWtGRGRFSXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRTlCUVU4c1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eEpRVUZKTEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xTkJRekZFTzFGQlEwUXNTVUZCU1N4RFFVRkRMRU5CUVVNc1IwRkJSeXhMUVVGTExFTkJRVU1zVFVGQlRTeERRVUZETzFGQlEzUkNMRXRCUVVzc1EwRkJReXhQUVVGUExFTkJRVU1zVlVGQlFTeERRVUZETzFsQlExZ3NTVUZCU1N4RFFVRkRMRWRCUVVjc1MwRkJTU3hEUVVGRExFOUJRVThzUTBGQlF5eFpRVUZaTEVOQlFVTXNZMEZCWXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRMmhFTEVOQlFVTXNSMEZCUnl4TFFVRkpMRU5CUVVNc1QwRkJUeXhEUVVGRExGbEJRVmtzUTBGQlF5eGpRVUZqTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkRhRVFzU1VGQlNTeEhRVUZITEZsQlFWa3NRMEZCUXl4UFFVRlBMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGJrTXNRMEZCUXl4RFFVRkRMRkZCUVZFc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTNoQ0xFTkJRVU1zUTBGQlF5eFJRVUZSTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU0xUWl4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVOUUxFTkJRVU03U1VGRlR5dzBRMEZCYjBJc1IwRkJOVUlzVlVGQk5rSXNTMEZCU3p0UlFVTTVRaXhKUVVGSkxGTkJRVk1zUjBGQlJ5eEpRVUZKTEZOQlFWTXNSVUZCUlN4RFFVRkRPMUZCUTJoRExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNTVUZCU1N4RFFVRkRMRk5CUVZNc1EwRkJReXhEUVVGRE8xRkJRek5DTEV0QlFVc3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eExRVUZMTEVOQlFVTXNUVUZCVFN4RFFVRkRMRTFCUVUwc1JVRkJSU3hGUVVGRkxFTkJRVU1zUlVGQlJUdFpRVU14UXl4SlFVRkpMRWxCUVVrc1IwRkJSeXhMUVVGTExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUXpOQ0xFbEJRVWtzVFVGQlRTeEhRVUZITEVsQlFVa3NUVUZCVFN4RFFVRkRMRWxCUVVrc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF6dFpRVU5xUXl4SlFVRkpMRU5CUVVNc1QwRkJUeXhEUVVGRExFbEJRVWtzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4TlFVRk5MRU5CUVVNN1dVRkRMMElzVTBGQlV5eERRVUZETEVkQlFVY3NRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJRenRUUVVONlFqdFJRVU5FTEVsQlFVa3NTMEZCU3l4RFFVRkRMRTFCUVUwc1JVRkJSVHRaUVVOa0xFdEJRVXNzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhMUVVGTExFTkJRVU1zVFVGQlRTeERRVUZETEUxQlFVMHNSVUZCUlN4RlFVRkZMRU5CUVVNc1JVRkJSVHRuUWtGRE1VTXNTVUZCU1N4TFFVRkxMRWRCUVVjc1MwRkJTeXhEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0blFrRkZOVUlzU1VGQlNTeFZRVUZWTEVkQlFVY3NSVUZCUlN4RFFVRkRPMmRDUVVOd1FpeExRVUZMTEVsQlFVa3NTVUZCU1N4SlFVRkpMRXRCUVVzN2IwSkJRMnhDTEVsQlFVa3NTVUZCU1N4TFFVRkxMRkZCUVZFc1NVRkJTU3hKUVVGSkxFdEJRVXNzVVVGQlVTeEpRVUZKTEV0QlFVc3NRMEZCUXl4alFVRmpMRU5CUVVNc1NVRkJTU3hEUVVGRE8zZENRVU53UlN4VlFVRlZMRU5CUVVNc1NVRkJTU3hEUVVGRExFZEJRVWNzUzBGQlN5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMmRDUVVWMlF5eFRRVUZUTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZETEVOQlFVTXNSVUZCUlN4SlFVRkpMRkZCUVZFc1JVRkJSU3hGUVVGRkxFbEJRVWtzVVVGQlVTeEZRVUZGTEVWQlFVVXNTVUZCU1N4RFFVRkRMRzlDUVVGdlFpeERRVUZETEV0QlFVc3NRMEZCUXl4RlFVRkZMRlZCUVZVc1EwRkJReXhEUVVGRExFTkJRVU03WVVGRGFrZzdVMEZEU2p0UlFVTkVMRTlCUVU4c1UwRkJVeXhEUVVGRE8wbEJRM0JDTEVOQlFVTTdTVUZIUml3MlFrRkJTeXhIUVVGTUxGVkJRVTBzUTBGQlV5eEZRVUZGTEVOQlFWTXNSVUZCUlN4RFFVRmhPMUZCUVdJc2EwSkJRVUVzUlVGQlFTeExRVUZoTzFGQlEzSkRMRWxCUVVrc1MwRkJTeXhIUVVGSExFTkJRVU1zUTBGQlF5eFJRVUZSTEVOQlFVTXNXVUZCV1N4RFFVRkRMRU5CUVVNc1EwRkJReXhSUVVGUkxFTkJRVU1zUlVGRE0wTXNUVUZCVFN4SFFVRkhMRU5CUVVNc1EwRkJReXhSUVVGUkxFTkJRVU1zV1VGQldTeERRVUZETEVOQlFVTXNRMEZCUXl4UlFVRlJMRU5CUVVNc1EwRkJRenRSUVVOcVJDeEpRVUZKTEZGQlFWRXNSMEZCUnl4SlFVRkpMRk5CUVZNc1JVRkJSU3hEUVVGRE8xRkJReTlDTEZGQlFWRXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRGFFSXNVVUZCVVN4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU5vUWl4SlFVRkpMRU5CUVVNc1IwRkJSeXhKUVVGSkxFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTXNUMEZCVHl4RFFVRkRMRTFCUVUwc1JVRkJSU3hOUVVGTkxFVkJRVVVzUzBGQlN5eEZRVUZGTEZGQlFWRXNRMEZCUXl4RFFVRkRPMUZCUTJwRkxFbEJRVWtzUTBGQlF5eFBRVUZQTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRM0pDTEVsQlFVa3NUVUZCVFN4SFFVRkhMRlZCUVVNc1EwRkJWeXhGUVVGRkxFTkJRVk1zUlVGQlJTeERRVUZUTzFsQlF6TkRMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU1zVlVGQlF5eEZRVUZGTEVWQlFVVXNVVUZCVVR0blFrRkRiRUlzUlVGQlJTeERRVUZETEUxQlFVMHNRMEZCUXl4VlFVRkJMRU5CUVVNN2IwSkJRMUFzU1VGQlNTeEhRVUZITEVkQlFXRXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8yOUNRVU42UWl4SFFVRkhMRU5CUVVNc1IwRkJSeXhEUVVGRExGRkJRVkVzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0dlFrRkRja0lzUjBGQlJ5eERRVUZETEUxQlFVMHNRMEZCUXl4UlFVRlJMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03YjBKQlEzaENMRWRCUVVjc1EwRkJReXhOUVVGTkxFTkJRVU1zVVVGQlVTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMjlDUVVOaUxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVVXNRMEZCUXl4TlFVRk5MRU5CUVVNc1VVRkJVU3hGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzI5Q1FVTXhRaXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZGTEVOQlFVTXNUVUZCVFN4RFFVRkRMRkZCUVZFc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dG5Ra0ZEZWtNc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRFVDeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTlFMRU5CUVVNc1EwRkJRenRSUVVOR0xFMUJRVTBzUTBGQlF5eE5RVUZOTEVWQlFVVXNWVUZCVlN4RlFVRkZMRlZCUVZVc1EwRkJReXhEUVVGRE8xRkJRM1pETEUxQlFVMHNRMEZCUXl4TFFVRkxMRVZCUVVVc1ZVRkJWU3hGUVVGRkxGVkJRVlVzUTBGQlF5eERRVUZETzFGQlEzUkRMRWxCUVVrc1EwRkJReXhEUVVGRExFbEJRVWtzUzBGQlN5eERRVUZETEV0QlFVc3NSVUZCUlN4SFFVRkhMRTFCUVUwc1EwRkJReXhMUVVGTExFVkJRVVVzUTBGQlF6dFJRVU42UXl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVONFFpeEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTjRRaXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU55UWl4UFFVRlBMRU5CUVVNc1EwRkJRenRKUVVOaUxFTkJRVU03U1VGRlR5eHJRMEZCVlN4SFFVRnNRaXhWUVVGdFFpeERRVUZoTzFGQlFXSXNhMEpCUVVFc1JVRkJRU3hMUVVGaE8xRkJUVFZDTEVsQlFVa3NSVUZCUlN4SFFVRkhMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNUMEZCVHl4RlFVRkZMRU5CUVVNN1VVRkRha01zU1VGQlNTeERRVUZETEVkQlFVY3NSVUZCUlN4RFFVRkRMRTFCUVUwc1EwRkJRenRSUVVOc1FpeEpRVUZKTEUxQlFVMHNSMEZCUnl4SlFVRkpMRXRCUVVzc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOd1F5eEpRVUZKTEVkQlFVY3NSMEZCUnl4RFFVRkRMRU5CUVVNN1VVRkRXaXhMUVVGTExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RlFVRkZMRWRCUVVjc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NSVUZCUlN4RlFVRkZMRVZCUVVVc1EwRkJReXhGUVVGRk8xbEJRM0pETEV0QlFVc3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhIUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJReXhGUVVGRk8yZENRVU14UWl4SlFVRkpMRU5CUVVNc1IwRkJSeXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dG5Ra0ZEZWtJc1RVRkJUU3hEUVVGRExFZEJRVWNzUTBGQlF5eEhRVUZITEVWQlFVVXNSVUZCUlN4RlFVRkZMRWRCUVVjc1JVRkJSU3hOUVVGTkxFVkJRVVVzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU03WjBKQlEycEZMRWRCUVVjc1JVRkJSU3hEUVVGRE8yRkJRMVE3VTBGRFNqdFJRVU5FTEU5QlFVOHNUVUZCVFN4RFFVRkRPMGxCUTJ4Q0xFTkJRVU03U1VGRlJDeHRRMEZCVnl4SFFVRllPMUZCUTBrc1MwRkJTeXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zVFVGQlRTeEZRVUZGTEVWQlFVVXNRMEZCUXl4RlFVRkZPMWxCUlhoRExFbEJRVWtzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlF5eE5RVUZOTEVkQlFVY3NRMEZCUXp0blFrRkJSU3hUUVVGVE8xbEJSMnBFTEVsQlFVa3NSVUZCUlN4SFFVRkhMRWxCUVVrc1EwRkJReXhWUVVGVkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRlZCUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zU1VGQlN5eFBRVUZCTEVOQlFVTXNRMEZCUXl4TlFVRk5MRWxCUVVrc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1IwRkJSeXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hIUVVGSExFTkJRVU1zUTBGQlF5eE5RVUZOTEVWQlFYaEVMRU5CUVhkRUxFTkJRVU1zUTBGQlF6dFpRVU55Unl4SlFVRkpMRU5CUVVNc1IwRkJSeXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEWkN4SlFVRkpMRU5CUVVNc1EwRkJReXhOUVVGTkxFbEJRVWtzU1VGQlNTeERRVUZETEVOQlFVTTdaMEpCUVVVc1UwRkJVenRaUVVOcVF5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVONFFpeFBRVUZQTEVsQlFVa3NRMEZCUXp0VFFVTm1PMGxCUTB3c1EwRkJRenRKUVVWUExEaENRVUZOTEVkQlFXUXNWVUZCWlN4RFFVRlRMRVZCUVVVc1EwRkJVenRSUVVNdlFpeEpRVUZKTEV0QlFVc3NSMEZCUnl4RFFVRkRMRU5CUVVNc1VVRkJVU3hEUVVGRExGbEJRVmtzUTBGQlF5eERRVUZETEVOQlFVTXNVVUZCVVN4RFFVRkRMRVZCUXpORExFMUJRVTBzUjBGQlJ5eERRVUZETEVOQlFVTXNVVUZCVVN4RFFVRkRMRmxCUVZrc1EwRkJReXhEUVVGRExFTkJRVU1zVVVGQlVTeERRVUZETEVOQlFVTTdVVUZEYWtRc1QwRkJUeXhKUVVGSkxFTkJRVU1zUTBGQlF5eEhRVUZITEV0QlFVc3NRMEZCUXl4TFFVRkxMRVZCUVVVc1IwRkJSeXhOUVVGTkxFTkJRVU1zUzBGQlN5eEZRVUZGTEVOQlFVTTdTVUZEYmtRc1EwRkJRenRKUVVWRUxIbERRVUZwUWl4SFFVRnFRaXhWUVVGclFpeGxRVUUwUWp0UlFVRTVReXhwUWtGbFF6dFJRV1JITEVsQlFVa3NUVUZCVFN4SFFVRkhMRVZCUVVVc1EwRkJRenRSUVVOb1FpeEpRVUZKTEVsQlFVa3NSMEZCUnl4RlFVRkZMRU5CUVVNN1VVRkRaQ3hSUVVGUkxFTkJRVU1zU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hKUVVGSkxFVkJRVVVzVFVGQlRTeERRVUZETEVOQlFVTTdVVUZEZEVNc1NVRkJTU3hGUVVGRkxFZEJRVWNzU1VGQlNTeERRVUZETEZGQlFWRXNSVUZCUlN4RFFVRkRPMUZCUTNwQ0xFVkJRVVVzUTBGQlF5eFBRVUZQTEVOQlFVTXNWVUZCUVN4RFFVRkRPMWxCUTFJc1NVRkJTU3hEUVVGRExFZEJRVWNzUzBGQlNTeERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU03V1VGREwwSXNTVUZCU1N4RFFVRkRMRWRCUVVjc1MwRkJTU3hEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNN1dVRkRMMElzWlVGQlpTeERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRk5CUVZNc1EwRkRPVUlzVDBGQlR5eERRVUZETEVOQlFVTXNSMEZCUnl4TFFVRkxMRmRCUVZjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZEZGtRc1QwRkJUeXhEUVVGRExFTkJRVU1zUjBGQlJ5eExRVUZMTEZkQlFWY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGRGRrUXNRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkRWQ3hEUVVGRExFTkJRVU03VVVGRFVDeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTklMRTlCUVU4c1RVRkJUU3hEUVVGRE8wbEJRMnhDTEVOQlFVTTdTVUZGUkN4blEwRkJVU3hIUVVGU08xRkJRMGtzU1VGQlNTeEZRVUZGTEVkQlFVY3NSVUZCUlN4RFFVRkRPMUZCUTFvc1lVRkJZU3hEUVVGRExGRkJRVkVzUTBGQlF5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETzFGQlF6RkRMRTlCUVU4c1JVRkJSU3hEUVVGRE8wbEJRMlFzUTBGQlF6dEpRVVZOTEhOQ1FVRlJMRWRCUVdZc1ZVRkJaMElzVDBGQmEwSXNSVUZCUlN4RlFVRmxPMUZCUXk5RExFOUJRVThzUTBGQlF5eE5RVUZOTEVOQlFVTXNWVUZCUVN4RFFVRkRPMWxCUTFvc1EwRkJReXhEUVVGRExGRkJRVkVzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXp0WlFVTm1MR0ZCUVdFc1EwRkJReXhSUVVGUkxFTkJRVU1zUTBGQlF5eERRVUZETEZGQlFWRXNSVUZCUlN4RlFVRkZMRU5CUVVNc1EwRkJRenRSUVVNelF5eERRVUZETEVOQlFVTXNRMEZCUXp0SlFVTlFMRU5CUVVNN1NVRkRUQ3h2UWtGQlF6dEJRVUZFTEVOQlFVTXNRVUY0U2tRc1NVRjNTa003UVVGNFNsa3NjME5CUVdFN1FVRXdTakZDTEZOQlFWTXNVVUZCVVN4RFFVRkRMRTlCUVd0Q0xFVkJRVVVzUzBGQlN5eEZRVUZGTEUxQlFVMDdTVUZETDBNc1QwRkJUeXhEUVVGRExFMUJRVTBzUTBGQlF5eFZRVUZCTEVOQlFVTTdVVUZEV2l4SlFVRkpMRU5CUVVNc1EwRkJReXhOUVVGTkxFVkJRVVVzUlVGQlJUdFpRVU5hTEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1RVRkJUVHRuUWtGQlJTeExRVUZMTEVOQlFVTXNUVUZCVFN4SFFVRkhMRVZCUVVVc1EwRkJRenRaUVVOeVF5eExRVUZMTEVOQlFVTXNUVUZCVFN4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTTdVMEZETTBJN1lVRkJUVHRaUVVOSUxFbEJRVWtzUTBGQlF5eEhRVUZITEV0QlFVc3NRMEZCUXp0WlFVTmtMRU5CUVVNc1EwRkJReXhIUVVGSExFZEJRVWNzVFVGQlRTeERRVUZETEUxQlFVMHNRMEZCUXp0WlFVTjBRaXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEZGQlFWRXNSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJReXhaUVVGWkxFVkJRVVVzUlVGQlJUdG5Ra0ZEYmtNc1EwRkJReXhIUVVGSExFVkJRVVVzUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXl4SFFVRkhMRVZCUVVVc1EwRkJRenRuUWtGRGJFSXNTVUZCU1N4RFFVRkRMRU5CUVVNc1dVRkJXU3hGUVVGRk8yOUNRVVZvUWl4TFFVRkxMRWxCUVVrc1NVRkJTU3hKUVVGSkxFTkJRVU1zUTBGQlF5eFZRVUZWTzNkQ1FVTjZRaXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRlZCUVZVc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dG5Ra0ZEY2tNc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eE5RVUZOTzI5Q1FVRkZMRXRCUVVzc1EwRkJReXhOUVVGTkxFZEJRVWNzUlVGQlJTeERRVUZETzJkQ1FVTnlReXhMUVVGTExFTkJRVU1zVFVGQlRTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU03WjBKQlEzcENMRTFCUVUwc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdZVUZEYkVJN1dVRkRSQ3hSUVVGUkxFTkJRVU1zUTBGQlF5eERRVUZETEZGQlFWRXNSVUZCUlN4RFFVRkRMRVZCUVVVc1RVRkJUU3hEUVVGRExFTkJRVU03VTBGRGJrTTdTVUZEVEN4RFFVRkRMRU5CUVVNc1EwRkJRenRCUVVOUUxFTkJRVU03UVVGRlJEdEpRVWRKTEdkQ1FVTlhMRVZCUVZVc1JVRkRWaXhSUVVGdFF5eEZRVU51UXl4UlFVRnRReXhGUVVOdVF5eFJRVUZ4UXl4RlFVTnlReXhWUVVGblFqdFJRVWhvUWl4NVFrRkJRU3hGUVVGQkxHVkJRWGxDTEZGQlFWRXNSVUZCUlR0UlFVTnVReXg1UWtGQlFTeEZRVUZCTEdWQlFYbENMRkZCUVZFc1JVRkJSVHRSUVVOdVF5eDVRa0ZCUVN4RlFVRkJMR1ZCUVRCQ0xGTkJRVk1zUlVGQlJUdFJRVWh5UXl4UFFVRkZMRWRCUVVZc1JVRkJSU3hEUVVGUk8xRkJRMVlzWVVGQlVTeEhRVUZTTEZGQlFWRXNRMEZCTWtJN1VVRkRia01zWVVGQlVTeEhRVUZTTEZGQlFWRXNRMEZCTWtJN1VVRkRia01zWVVGQlVTeEhRVUZTTEZGQlFWRXNRMEZCTmtJN1VVRkRja01zWlVGQlZTeEhRVUZXTEZWQlFWVXNRMEZCVFR0SlFVRkpMRU5CUVVNN1NVRkZhRU1zZVVKQlFWRXNSMEZCVWl4VlFVRlRMRVZCUVdVN1VVRkJlRUlzYVVKQlRVTTdVVUZNUnl4SlFVRkpMRU5CUVVNc1VVRkJVU3hEUVVGRExFMUJRVTBzUTBGQlF5eFZRVUZETEVWQlFVVXNSVUZCUlN4UlFVRlJPMWxCUXpsQ0xFVkJRVVVzUTBGQlF5eE5RVUZOTEVOQlFVTXNWVUZCUVN4TlFVRk5PMmRDUVVOYUxFVkJRVVVzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4VFFVRlRMRU5CUVVNc1MwRkJTU3hEUVVGRExFVkJRVVVzUlVGQlJTeE5RVUZOTEVOQlFVTXNSVUZCUlN4RlFVRkZMRkZCUVZFc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGVrUXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRVQ3hEUVVGRExFTkJRVU1zUTBGQlF6dEpRVU5RTEVOQlFVTTdTVUZGUkN4MVFrRkJUU3hIUVVGT08xRkJRMGtzVDBGQlR5eEpRVUZKTEVOQlFVTXNVVUZCVVN4RFFVRkRMRXRCUVVzc1JVRkJSU3hMUVVGTExFTkJRVU1zUTBGQlF6dEpRVU4yUXl4RFFVRkRPMGxCUlVRc2VVSkJRVkVzUjBGQlVqdFJRVU5KTEU5QlFVOHNTVUZCU1N4RFFVRkRMRkZCUVZFc1EwRkJReXhMUVVGTExFVkJRVVVzUzBGQlN5eERRVUZETEVsQlFVa3NTVUZCU1N4RFFVRkRMRkZCUVZFc1EwRkJReXhMUVVGTExFVkJRVVVzUzBGQlN5eERRVUZETEVOQlFVTTdTVUZEZEVVc1EwRkJRenRKUVVWRUxEWkNRVUZaTEVkQlFWbzdVVUZEU1N4UFFVRlBMRTlCUVU4c1NVRkJTU3hEUVVGRExGVkJRVlVzUzBGQlN5eFhRVUZYTEVOQlFVTTdTVUZEYkVRc1EwRkJRenRKUVVOTUxHRkJRVU03UVVGQlJDeERRVUZETEVGQk4wSkVMRWxCTmtKRE8wRkJOMEpaTEhkQ1FVRk5PMEZCSzBKdVFpeFRRVUZUTEZsQlFWa3NRMEZCUXl4RFFVRk5MRVZCUVVVc1EwRkJUVHRKUVVOb1F5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RlFVRkZMRU5CUVVNN1NVRkRXQ3hMUVVGTExFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTTdVVUZCUlN4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRE8xbEJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dEpRVU42UXl4UFFVRlBMRU5CUVVNc1EwRkJRenRCUVVOaUxFTkJRVU03UVVGRlJEdEpRVUZCTzFGQlEwa3NWVUZCU3l4SFFVRlJMRVZCUVVVc1EwRkJRenRKUVd0RGNFSXNRMEZCUXp0SlFXcERSeXg1UWtGQlN5eEhRVUZNTzFGQlEwa3NUMEZCVHl4TlFVRk5MRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNN1NVRkRNVU1zUTBGQlF6dEpRVU5FTEdkRFFVRlpMRWRCUVZvc1ZVRkJZU3hMUVVGblFqdFJRVU42UWl4SlFVRkpMRTFCUVUwc1IwRkJSeXhKUVVGSkxGTkJRVk1zUlVGQlJTeERRVUZETzFGQlF6ZENMRTFCUVUwc1EwRkJReXhMUVVGTExFZEJRVWNzV1VGQldTeERRVUZETEVsQlFVa3NRMEZCUXl4TFFVRkxMRVZCUVVVc1MwRkJTeXhEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETzFGQlEzSkVMRTlCUVU4c1RVRkJUU3hEUVVGRE8wbEJRMnhDTEVOQlFVTTdTVUZEUkN4eFEwRkJhVUlzUjBGQmFrSXNWVUZCYTBJc1MwRkJaMEk3VVVGRE9VSXNUMEZCVHl4SlFVRkpMRU5CUVVNc1dVRkJXU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEV0QlFVc3NSVUZCUlN4RFFVRkRPMGxCUXpWRExFTkJRVU03U1VGRFJDdzBRa0ZCVVN4SFFVRlNMRlZCUVZNc1JVRkJWVHRSUVVObUxFOUJRVThzUlVGQlJTeEpRVUZKTEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNN1NVRkROVUlzUTBGQlF6dEpRVU5FTEhWQ1FVRkhMRWRCUVVnc1ZVRkJTU3hEUVVGVE8xRkJRMVFzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETzBsQlEzcENMRU5CUVVNN1NVRkRSQ3d3UWtGQlRTeEhRVUZPTEZWQlFVOHNRMEZCVXp0UlFVTmFMRTlCUVU4c1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNN1NVRkROVUlzUTBGQlF6dEpRVU5FTERCQ1FVRk5MRWRCUVU0c1ZVRkJUeXhEUVVGelFqdFJRVU42UWl4TFFVRkxMRWxCUVVrc1IwRkJSeXhKUVVGSkxFbEJRVWtzUTBGQlF5eExRVUZMTEVWQlFVVTdXVUZEZUVJc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJRenRUUVVOMFFqdEpRVU5NTEVOQlFVTTdTVUZEUkN3eVFrRkJUeXhIUVVGUU8xRkJRMGtzU1VGQlNTeEZRVUZGTEVkQlFVY3NSVUZCUlN4RFFVRkRPMUZCUTFvc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eFZRVUZCTEVOQlFVTTdXVUZEVkN4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExGbEJRVmtzUlVGQlJUdG5Ra0ZEYWtJc1JVRkJSU3hEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTnVRaXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU5JTEU5QlFVOHNSVUZCUlN4RFFVRkRPMGxCUTJRc1EwRkJRenRKUVVOTUxHZENRVUZETzBGQlFVUXNRMEZCUXl4QlFXNURSQ3hKUVcxRFF6dEJRVzVEV1N3NFFrRkJVenRCUVhGRGRFSTdTVUZCUVR0UlFVTkpMRk5CUVVrc1IwRkJVU3hGUVVGRkxFTkJRVU03VVVGRFppeE5RVUZETEVkQlFWY3NRMEZCUXl4RFFVRkRPMGxCWjBSc1FpeERRVUZETzBsQkwwTkhMSGRDUVVGTExFZEJRVXc3VVVGRFNTeFBRVUZQTEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRiRUlzUTBGQlF6dEpRVU5FTERKQ1FVRlJMRWRCUVZJc1ZVRkJVeXhGUVVGVk8xRkJRMllzU1VGQlNTeE5RVUZOTEVkQlFVY3NTMEZCU3l4RFFVRkRPMUZCUTI1Q0xFbEJRVWtzUTBGQlF5eGhRVUZoTEVOQlFVTXNWVUZCUVN4RFFVRkRPMWxCUTJoQ0xFbEJRVWtzUTBGQlF5eE5RVUZOTEVsQlFVa3NRMEZCUXl4RFFVRkRMRVZCUVVVc1NVRkJTU3hGUVVGRkxFVkJRVVU3WjBKQlEzWkNMRTFCUVUwc1IwRkJSeXhKUVVGSkxFTkJRVU03WVVGRGFrSTdVVUZEVEN4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOSUxFOUJRVThzVFVGQlRTeERRVUZETzBsQlEyeENMRU5CUVVNN1NVRkRSQ3h6UWtGQlJ5eEhRVUZJTEZWQlFVa3NVVUZCWjBJc1JVRkJSU3hEUVVGVE8xRkJRek5DTEVsQlFVa3NRMEZCUXl4SFFVRmpMRkZCUVZFc1NVRkJTU3hKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExGRkJRVkVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExGRkJRVkVzUTBGQlF5eEhRVUZITEVsQlFVa3NVMEZCVXl4RlFVRkZMRU5CUVVNN1VVRkRka2NzUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOVUxFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXp0SlFVTmlMRU5CUVVNN1NVRkRSQ3g1UWtGQlRTeEhRVUZPTEZWQlFVOHNVVUZCWjBJc1JVRkJSU3hEUVVGVE8xRkJRemxDTEVsQlFVa3NSVUZCUlN4SFFVRmpMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zVVVGQlVTeERRVUZETEVOQlFVTTdVVUZEZUVNc1JVRkJSU3hEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTmlMRWxCUVVrc1JVRkJSU3hEUVVGRExFdEJRVXNzUlVGQlJTeExRVUZMTEVOQlFVTXNSVUZCUlR0WlFVTnNRaXhQUVVGUExFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNVVUZCVVN4RFFVRkRMRU5CUVVNN1UwRkRPVUk3VVVGRFJDeEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRZaXhEUVVGRE8wbEJRMFFzZVVKQlFVMHNSMEZCVGl4VlFVRlBMRU5CUVRSRE8xRkJReTlETEV0QlFVc3NTVUZCU1N4UlFVRlJMRWxCUVVrc1NVRkJTU3hEUVVGRExFbEJRVWtzUlVGQlJUdFpRVU0xUWl4RFFVRkRMRU5CUVZrc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eFJRVUZSTEVOQlFVTXNSVUZCUlN4TlFVRk5MRU5CUVVNc1VVRkJVU3hEUVVGRExFTkJRVU1zUTBGQlF6dFRRVU4yUkR0SlFVTk1MRU5CUVVNN1NVRkRSQ3huUTBGQllTeEhRVUZpTEZWQlFXTXNRMEZCYzBJN1VVRkRhRU1zU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4VlFVRkRMRVZCUVVVc1JVRkJSU3hGUVVGRkxFbEJRVXNzVDBGQlFTeEZRVUZGTEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGYUxFTkJRVmtzUTBGQlF5eERRVUZETzBsQlF6RkRMRU5CUVVNN1NVRkRSQ3dyUWtGQldTeEhRVUZhTEZWQlFXRXNTMEZCWlR0UlFVTjRRaXhKUVVGSkxFMUJRVTBzUjBGQllTeEpRVUZKTEZGQlFWRXNSVUZCUlN4RFFVRkRPMUZCUTNSRExFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNWVUZCUXl4RlFVRkZMRVZCUVVVc1JVRkJSVHRaUVVObUxFbEJRVWtzUlVGQlJTeEpRVUZKTEV0QlFVc3NRMEZCUXl4SlFVRkpMRVZCUVVVN1owSkJRMnhDTEVsQlFVa3NRMEZCUXl4SFFVRkhMRVZCUVVVc1EwRkJReXhaUVVGWkxFTkJRVU1zUzBGQlN5eERRVUZETEVsQlFVa3NRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhGUVVOdVF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRXRCUVVzc1JVRkJSU3hEUVVGRE8yZENRVU5zUWl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVU3YjBKQlExQXNUVUZCVFN4RFFVRkRMRWxCUVVrc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdiMEpCUTNCQ0xFMUJRVTBzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMmxDUVVOcVFqdGhRVU5LTzFGQlEwd3NRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRTQ3hQUVVGUExFMUJRVTBzUTBGQlF6dEpRVU5zUWl4RFFVRkRPMGxCUTB3c1pVRkJRenRCUVVGRUxFTkJRVU1zUVVGc1JFUXNTVUZyUkVNN1FVRnNSRmtzTkVKQlFWRTdRVUZ2UkhKQ0xGTkJRVk1zYVVKQlFXbENMRU5CUVVNc1EwRkJUU3hGUVVGRkxFTkJRVTA3U1VGRGNrTXNUMEZCVHl4TlFVRk5MRU5CUVVNc1NVRkJTU3hEUVVGRExGbEJRVmtzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVUU3UVVGRGFrUXNRMEZCUXp0QlFVVkVMRk5CUVdkQ0xGTkJRVk1zUTBGQlR5eExRVUZaTEVWQlFVVXNTMEZCWVN4RlFVRkZMRVZCUVRCQ0xFVkJRVVVzVTBGQmFVSTdTVUZEZEVjc1NVRkJTU3hEUVVGRExFZEJRVWNzUzBGQlN5eERRVUZETEUxQlFVMHNSVUZEYUVJc1EwRkJReXhIUVVGSExFbEJRVWtzWVVGQllTeERRVUZETEVOQlFVTXNSVUZCUlN4TFFVRkxMRVZCUVVVc1JVRkJSU3hGUVVGRkxGTkJRVk1zUTBGQlF5eERRVUZETzBsQlEyNUVMRTlCUVU4c1EwRkJReXhEUVVGRExGZEJRVmNzUlVGQlJUdFJRVUZETEVOQlFVTTdTVUZEZUVJc1NVRkJTU3hWUVVGVkxFZEJRV2RDTEVWQlFVVXNRMEZCUXp0SlFVTnFReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNhVUpCUVdsQ0xFTkJRVU1zVlVGQlZTeERRVUZETEVOQlFVTTdTVUZEZUVNc1ZVRkJWU3hEUVVGRExFOUJRVThzUTBGQlF5eFZRVUZWTEVOQlFVTTdVVUZETVVJc1NVRkJTU3hEUVVGRExFZEJRVWNzVlVGQlF5eEhRVUZITzFsQlExSXNTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETzFsQlEyWXNTVUZCU1N4UFFVRlBMRU5CUVVNc1NVRkJTU3hSUVVGUk8yZENRVUZGTEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1IwRkJSeXhMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEYUVRc1EwRkJReXhEUVVGRE8xRkJRMFlzUTBGQlF5eERRVUZETEZGQlFWRXNRMEZCUXl4RFFVRkRPMUZCUTFvc1EwRkJReXhEUVVGRExGRkJRVkVzUTBGQlF5eERRVUZETzBsQlEyaENMRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJRMGdzVDBGQlR5eEZRVUZGTEUxQlFVMHNSVUZCUlN4RFFVRkRMRVZCUVVVc1ZVRkJWU3hGUVVGRkxGVkJRVlVzUlVGQlJTeERRVUZETzBGQlEycEVMRU5CUVVNN1FVRm1SQ3c0UWtGbFF5SjkiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBQYWlyaW5nSGVhcCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUGFpcmluZ0hlYXAoZWxlbSkge1xuICAgICAgICB0aGlzLmVsZW0gPSBlbGVtO1xuICAgICAgICB0aGlzLnN1YmhlYXBzID0gW107XG4gICAgfVxuICAgIFBhaXJpbmdIZWFwLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xuICAgICAgICB2YXIgc3RyID0gXCJcIiwgbmVlZENvbW1hID0gZmFsc2U7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zdWJoZWFwcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgdmFyIHN1YmhlYXAgPSB0aGlzLnN1YmhlYXBzW2ldO1xuICAgICAgICAgICAgaWYgKCFzdWJoZWFwLmVsZW0pIHtcbiAgICAgICAgICAgICAgICBuZWVkQ29tbWEgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChuZWVkQ29tbWEpIHtcbiAgICAgICAgICAgICAgICBzdHIgPSBzdHIgKyBcIixcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN0ciA9IHN0ciArIHN1YmhlYXAudG9TdHJpbmcoc2VsZWN0b3IpO1xuICAgICAgICAgICAgbmVlZENvbW1hID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3RyICE9PSBcIlwiKSB7XG4gICAgICAgICAgICBzdHIgPSBcIihcIiArIHN0ciArIFwiKVwiO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAodGhpcy5lbGVtID8gc2VsZWN0b3IodGhpcy5lbGVtKSA6IFwiXCIpICsgc3RyO1xuICAgIH07XG4gICAgUGFpcmluZ0hlYXAucHJvdG90eXBlLmZvckVhY2ggPSBmdW5jdGlvbiAoZikge1xuICAgICAgICBpZiAoIXRoaXMuZW1wdHkoKSkge1xuICAgICAgICAgICAgZih0aGlzLmVsZW0sIHRoaXMpO1xuICAgICAgICAgICAgdGhpcy5zdWJoZWFwcy5mb3JFYWNoKGZ1bmN0aW9uIChzKSB7IHJldHVybiBzLmZvckVhY2goZik7IH0pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBQYWlyaW5nSGVhcC5wcm90b3R5cGUuY291bnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVtcHR5KCkgPyAwIDogMSArIHRoaXMuc3ViaGVhcHMucmVkdWNlKGZ1bmN0aW9uIChuLCBoKSB7XG4gICAgICAgICAgICByZXR1cm4gbiArIGguY291bnQoKTtcbiAgICAgICAgfSwgMCk7XG4gICAgfTtcbiAgICBQYWlyaW5nSGVhcC5wcm90b3R5cGUubWluID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtO1xuICAgIH07XG4gICAgUGFpcmluZ0hlYXAucHJvdG90eXBlLmVtcHR5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtID09IG51bGw7XG4gICAgfTtcbiAgICBQYWlyaW5nSGVhcC5wcm90b3R5cGUuY29udGFpbnMgPSBmdW5jdGlvbiAoaCkge1xuICAgICAgICBpZiAodGhpcyA9PT0gaClcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc3ViaGVhcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnN1YmhlYXBzW2ldLmNvbnRhaW5zKGgpKVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuICAgIFBhaXJpbmdIZWFwLnByb3RvdHlwZS5pc0hlYXAgPSBmdW5jdGlvbiAobGVzc1RoYW4pIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgcmV0dXJuIHRoaXMuc3ViaGVhcHMuZXZlcnkoZnVuY3Rpb24gKGgpIHsgcmV0dXJuIGxlc3NUaGFuKF90aGlzLmVsZW0sIGguZWxlbSkgJiYgaC5pc0hlYXAobGVzc1RoYW4pOyB9KTtcbiAgICB9O1xuICAgIFBhaXJpbmdIZWFwLnByb3RvdHlwZS5pbnNlcnQgPSBmdW5jdGlvbiAob2JqLCBsZXNzVGhhbikge1xuICAgICAgICByZXR1cm4gdGhpcy5tZXJnZShuZXcgUGFpcmluZ0hlYXAob2JqKSwgbGVzc1RoYW4pO1xuICAgIH07XG4gICAgUGFpcmluZ0hlYXAucHJvdG90eXBlLm1lcmdlID0gZnVuY3Rpb24gKGhlYXAyLCBsZXNzVGhhbikge1xuICAgICAgICBpZiAodGhpcy5lbXB0eSgpKVxuICAgICAgICAgICAgcmV0dXJuIGhlYXAyO1xuICAgICAgICBlbHNlIGlmIChoZWFwMi5lbXB0eSgpKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIGVsc2UgaWYgKGxlc3NUaGFuKHRoaXMuZWxlbSwgaGVhcDIuZWxlbSkpIHtcbiAgICAgICAgICAgIHRoaXMuc3ViaGVhcHMucHVzaChoZWFwMik7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGhlYXAyLnN1YmhlYXBzLnB1c2godGhpcyk7XG4gICAgICAgICAgICByZXR1cm4gaGVhcDI7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFBhaXJpbmdIZWFwLnByb3RvdHlwZS5yZW1vdmVNaW4gPSBmdW5jdGlvbiAobGVzc1RoYW4pIHtcbiAgICAgICAgaWYgKHRoaXMuZW1wdHkoKSlcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5tZXJnZVBhaXJzKGxlc3NUaGFuKTtcbiAgICB9O1xuICAgIFBhaXJpbmdIZWFwLnByb3RvdHlwZS5tZXJnZVBhaXJzID0gZnVuY3Rpb24gKGxlc3NUaGFuKSB7XG4gICAgICAgIGlmICh0aGlzLnN1YmhlYXBzLmxlbmd0aCA9PSAwKVxuICAgICAgICAgICAgcmV0dXJuIG5ldyBQYWlyaW5nSGVhcChudWxsKTtcbiAgICAgICAgZWxzZSBpZiAodGhpcy5zdWJoZWFwcy5sZW5ndGggPT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3ViaGVhcHNbMF07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgZmlyc3RQYWlyID0gdGhpcy5zdWJoZWFwcy5wb3AoKS5tZXJnZSh0aGlzLnN1YmhlYXBzLnBvcCgpLCBsZXNzVGhhbik7XG4gICAgICAgICAgICB2YXIgcmVtYWluaW5nID0gdGhpcy5tZXJnZVBhaXJzKGxlc3NUaGFuKTtcbiAgICAgICAgICAgIHJldHVybiBmaXJzdFBhaXIubWVyZ2UocmVtYWluaW5nLCBsZXNzVGhhbik7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFBhaXJpbmdIZWFwLnByb3RvdHlwZS5kZWNyZWFzZUtleSA9IGZ1bmN0aW9uIChzdWJoZWFwLCBuZXdWYWx1ZSwgc2V0SGVhcE5vZGUsIGxlc3NUaGFuKSB7XG4gICAgICAgIHZhciBuZXdIZWFwID0gc3ViaGVhcC5yZW1vdmVNaW4obGVzc1RoYW4pO1xuICAgICAgICBzdWJoZWFwLmVsZW0gPSBuZXdIZWFwLmVsZW07XG4gICAgICAgIHN1YmhlYXAuc3ViaGVhcHMgPSBuZXdIZWFwLnN1YmhlYXBzO1xuICAgICAgICBpZiAoc2V0SGVhcE5vZGUgIT09IG51bGwgJiYgbmV3SGVhcC5lbGVtICE9PSBudWxsKSB7XG4gICAgICAgICAgICBzZXRIZWFwTm9kZShzdWJoZWFwLmVsZW0sIHN1YmhlYXApO1xuICAgICAgICB9XG4gICAgICAgIHZhciBwYWlyaW5nTm9kZSA9IG5ldyBQYWlyaW5nSGVhcChuZXdWYWx1ZSk7XG4gICAgICAgIGlmIChzZXRIZWFwTm9kZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgc2V0SGVhcE5vZGUobmV3VmFsdWUsIHBhaXJpbmdOb2RlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5tZXJnZShwYWlyaW5nTm9kZSwgbGVzc1RoYW4pO1xuICAgIH07XG4gICAgcmV0dXJuIFBhaXJpbmdIZWFwO1xufSgpKTtcbmV4cG9ydHMuUGFpcmluZ0hlYXAgPSBQYWlyaW5nSGVhcDtcbnZhciBQcmlvcml0eVF1ZXVlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBQcmlvcml0eVF1ZXVlKGxlc3NUaGFuKSB7XG4gICAgICAgIHRoaXMubGVzc1RoYW4gPSBsZXNzVGhhbjtcbiAgICB9XG4gICAgUHJpb3JpdHlRdWV1ZS5wcm90b3R5cGUudG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5lbXB0eSgpKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5yb290LmVsZW07XG4gICAgfTtcbiAgICBQcmlvcml0eVF1ZXVlLnByb3RvdHlwZS5wdXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYXJncyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgYXJnc1tfaV0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICB9XG4gICAgICAgIHZhciBwYWlyaW5nTm9kZTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGFyZzsgYXJnID0gYXJnc1tpXTsgKytpKSB7XG4gICAgICAgICAgICBwYWlyaW5nTm9kZSA9IG5ldyBQYWlyaW5nSGVhcChhcmcpO1xuICAgICAgICAgICAgdGhpcy5yb290ID0gdGhpcy5lbXB0eSgpID9cbiAgICAgICAgICAgICAgICBwYWlyaW5nTm9kZSA6IHRoaXMucm9vdC5tZXJnZShwYWlyaW5nTm9kZSwgdGhpcy5sZXNzVGhhbik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBhaXJpbmdOb2RlO1xuICAgIH07XG4gICAgUHJpb3JpdHlRdWV1ZS5wcm90b3R5cGUuZW1wdHkgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAhdGhpcy5yb290IHx8ICF0aGlzLnJvb3QuZWxlbTtcbiAgICB9O1xuICAgIFByaW9yaXR5UXVldWUucHJvdG90eXBlLmlzSGVhcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucm9vdC5pc0hlYXAodGhpcy5sZXNzVGhhbik7XG4gICAgfTtcbiAgICBQcmlvcml0eVF1ZXVlLnByb3RvdHlwZS5mb3JFYWNoID0gZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgdGhpcy5yb290LmZvckVhY2goZik7XG4gICAgfTtcbiAgICBQcmlvcml0eVF1ZXVlLnByb3RvdHlwZS5wb3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLmVtcHR5KCkpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHZhciBvYmogPSB0aGlzLnJvb3QubWluKCk7XG4gICAgICAgIHRoaXMucm9vdCA9IHRoaXMucm9vdC5yZW1vdmVNaW4odGhpcy5sZXNzVGhhbik7XG4gICAgICAgIHJldHVybiBvYmo7XG4gICAgfTtcbiAgICBQcmlvcml0eVF1ZXVlLnByb3RvdHlwZS5yZWR1Y2VLZXkgPSBmdW5jdGlvbiAoaGVhcE5vZGUsIG5ld0tleSwgc2V0SGVhcE5vZGUpIHtcbiAgICAgICAgaWYgKHNldEhlYXBOb2RlID09PSB2b2lkIDApIHsgc2V0SGVhcE5vZGUgPSBudWxsOyB9XG4gICAgICAgIHRoaXMucm9vdCA9IHRoaXMucm9vdC5kZWNyZWFzZUtleShoZWFwTm9kZSwgbmV3S2V5LCBzZXRIZWFwTm9kZSwgdGhpcy5sZXNzVGhhbik7XG4gICAgfTtcbiAgICBQcmlvcml0eVF1ZXVlLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xuICAgICAgICByZXR1cm4gdGhpcy5yb290LnRvU3RyaW5nKHNlbGVjdG9yKTtcbiAgICB9O1xuICAgIFByaW9yaXR5UXVldWUucHJvdG90eXBlLmNvdW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yb290LmNvdW50KCk7XG4gICAgfTtcbiAgICByZXR1cm4gUHJpb3JpdHlRdWV1ZTtcbn0oKSk7XG5leHBvcnRzLlByaW9yaXR5UXVldWUgPSBQcmlvcml0eVF1ZXVlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKbWFXeGxJam9pY0hGMVpYVmxMbXB6SWl3aWMyOTFjbU5sVW05dmRDSTZJaUlzSW5OdmRYSmpaWE1pT2xzaUxpNHZMaTR2VjJWaVEyOXNZUzl6Y21NdmNIRjFaWFZsTG5SeklsMHNJbTVoYldWeklqcGJYU3dpYldGd2NHbHVaM01pT2lJN08wRkJRMEU3U1VGSlNTeHhRa0ZCYlVJc1NVRkJUenRSUVVGUUxGTkJRVWtzUjBGQlNpeEpRVUZKTEVOQlFVYzdVVUZEZEVJc1NVRkJTU3hEUVVGRExGRkJRVkVzUjBGQlJ5eEZRVUZGTEVOQlFVTTdTVUZEZGtJc1EwRkJRenRKUVVWTkxEaENRVUZSTEVkQlFXWXNWVUZCWjBJc1VVRkJVVHRSUVVOd1FpeEpRVUZKTEVkQlFVY3NSMEZCUnl4RlFVRkZMRVZCUVVVc1UwRkJVeXhIUVVGSExFdEJRVXNzUTBGQlF6dFJRVU5vUXl4TFFVRkxMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRkZCUVZFc1EwRkJReXhOUVVGTkxFVkJRVVVzUlVGQlJTeERRVUZETEVWQlFVVTdXVUZETTBNc1NVRkJTU3hQUVVGUExFZEJRVzFDTEVsQlFVa3NRMEZCUXl4UlFVRlJMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03V1VGREwwTXNTVUZCU1N4RFFVRkRMRTlCUVU4c1EwRkJReXhKUVVGSkxFVkJRVVU3WjBKQlEyWXNVMEZCVXl4SFFVRkhMRXRCUVVzc1EwRkJRenRuUWtGRGJFSXNVMEZCVXp0aFFVTmFPMWxCUTBRc1NVRkJTU3hUUVVGVExFVkJRVVU3WjBKQlExZ3NSMEZCUnl4SFFVRkhMRWRCUVVjc1IwRkJSeXhIUVVGSExFTkJRVU03WVVGRGJrSTdXVUZEUkN4SFFVRkhMRWRCUVVjc1IwRkJSeXhIUVVGSExFOUJRVThzUTBGQlF5eFJRVUZSTEVOQlFVTXNVVUZCVVN4RFFVRkRMRU5CUVVNN1dVRkRka01zVTBGQlV5eEhRVUZITEVsQlFVa3NRMEZCUXp0VFFVTndRanRSUVVORUxFbEJRVWtzUjBGQlJ5eExRVUZMTEVWQlFVVXNSVUZCUlR0WlFVTmFMRWRCUVVjc1IwRkJSeXhIUVVGSExFZEJRVWNzUjBGQlJ5eEhRVUZITEVkQlFVY3NRMEZCUXp0VFFVTjZRanRSUVVORUxFOUJRVThzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhSUVVGUkxFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eEhRVUZITEVOQlFVTTdTVUZEZUVRc1EwRkJRenRKUVVWTkxEWkNRVUZQTEVkQlFXUXNWVUZCWlN4RFFVRkRPMUZCUTFvc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eExRVUZMTEVWQlFVVXNSVUZCUlR0WlFVTm1MRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRPMWxCUTI1Q0xFbEJRVWtzUTBGQlF5eFJRVUZSTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVVFc1EwRkJReXhKUVVGSkxFOUJRVUVzUTBGQlF5eERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJXaXhEUVVGWkxFTkJRVU1zUTBGQlF6dFRRVU0xUXp0SlFVTk1MRU5CUVVNN1NVRkZUU3d5UWtGQlN5eEhRVUZhTzFGQlEwa3NUMEZCVHl4SlFVRkpMRU5CUVVNc1MwRkJTeXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eFJRVUZSTEVOQlFVTXNUVUZCVFN4RFFVRkRMRlZCUVVNc1EwRkJVeXhGUVVGRkxFTkJRV2xDTzFsQlF6VkZMRTlCUVU4c1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eExRVUZMTEVWQlFVVXNRMEZCUXp0UlFVTjZRaXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdTVUZEVml4RFFVRkRPMGxCUlUwc2VVSkJRVWNzUjBGQlZqdFJRVU5KTEU5QlFVOHNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJRenRKUVVOeVFpeERRVUZETzBsQlJVMHNNa0pCUVVzc1IwRkJXanRSUVVOSkxFOUJRVThzU1VGQlNTeERRVUZETEVsQlFVa3NTVUZCU1N4SlFVRkpMRU5CUVVNN1NVRkROMElzUTBGQlF6dEpRVVZOTERoQ1FVRlJMRWRCUVdZc1ZVRkJaMElzUTBGQmFVSTdVVUZETjBJc1NVRkJTU3hKUVVGSkxFdEJRVXNzUTBGQlF6dFpRVUZGTEU5QlFVOHNTVUZCU1N4RFFVRkRPMUZCUXpWQ0xFdEJRVXNzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zVVVGQlVTeERRVUZETEUxQlFVMHNSVUZCUlN4RFFVRkRMRVZCUVVVc1JVRkJSVHRaUVVNelF5eEpRVUZKTEVsQlFVa3NRMEZCUXl4UlFVRlJMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zVVVGQlVTeERRVUZETEVOQlFVTXNRMEZCUXp0blFrRkJSU3hQUVVGUExFbEJRVWtzUTBGQlF6dFRRVU5xUkR0UlFVTkVMRTlCUVU4c1MwRkJTeXhEUVVGRE8wbEJRMnBDTEVOQlFVTTdTVUZGVFN3MFFrRkJUU3hIUVVGaUxGVkJRV01zVVVGQmFVTTdVVUZCTDBNc2FVSkJSVU03VVVGRVJ5eFBRVUZQTEVsQlFVa3NRMEZCUXl4UlFVRlJMRU5CUVVNc1MwRkJTeXhEUVVGRExGVkJRVUVzUTBGQlF5eEpRVUZITEU5QlFVRXNVVUZCVVN4RFFVRkRMRXRCUVVrc1EwRkJReXhKUVVGSkxFVkJRVVVzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU1zVVVGQlVTeERRVUZETEVWQlFXcEVMRU5CUVdsRUxFTkJRVU1zUTBGQlF6dEpRVU4wUml4RFFVRkRPMGxCUlUwc05FSkJRVTBzUjBGQllpeFZRVUZqTEVkQlFVOHNSVUZCUlN4UlFVRlJPMUZCUXpOQ0xFOUJRVThzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4SlFVRkpMRmRCUVZjc1EwRkJTU3hIUVVGSExFTkJRVU1zUlVGQlJTeFJRVUZSTEVOQlFVTXNRMEZCUXp0SlFVTjZSQ3hEUVVGRE8wbEJSVTBzTWtKQlFVc3NSMEZCV2l4VlFVRmhMRXRCUVhGQ0xFVkJRVVVzVVVGQlVUdFJRVU40UXl4SlFVRkpMRWxCUVVrc1EwRkJReXhMUVVGTExFVkJRVVU3V1VGQlJTeFBRVUZQTEV0QlFVc3NRMEZCUXp0aFFVTXhRaXhKUVVGSkxFdEJRVXNzUTBGQlF5eExRVUZMTEVWQlFVVTdXVUZCUlN4UFFVRlBMRWxCUVVrc1EwRkJRenRoUVVNdlFpeEpRVUZKTEZGQlFWRXNRMEZCUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hGUVVGRkxFdEJRVXNzUTBGQlF5eEpRVUZKTEVOQlFVTXNSVUZCUlR0WlFVTjBReXhKUVVGSkxFTkJRVU1zVVVGQlVTeERRVUZETEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJRenRaUVVNeFFpeFBRVUZQTEVsQlFVa3NRMEZCUXp0VFFVTm1PMkZCUVUwN1dVRkRTQ3hMUVVGTExFTkJRVU1zVVVGQlVTeERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRaUVVNeFFpeFBRVUZQTEV0QlFVc3NRMEZCUXp0VFFVTm9RanRKUVVOTUxFTkJRVU03U1VGRlRTd3JRa0ZCVXl4SFFVRm9RaXhWUVVGcFFpeFJRVUZwUXp0UlFVTTVReXhKUVVGSkxFbEJRVWtzUTBGQlF5eExRVUZMTEVWQlFVVTdXVUZCUlN4UFFVRlBMRWxCUVVrc1EwRkJRenM3V1VGRGVrSXNUMEZCVHl4SlFVRkpMRU5CUVVNc1ZVRkJWU3hEUVVGRExGRkJRVkVzUTBGQlF5eERRVUZETzBsQlF6RkRMRU5CUVVNN1NVRkZUU3huUTBGQlZTeEhRVUZxUWl4VlFVRnJRaXhSUVVGcFF6dFJRVU12UXl4SlFVRkpMRWxCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zVFVGQlRTeEpRVUZKTEVOQlFVTTdXVUZCUlN4UFFVRlBMRWxCUVVrc1YwRkJWeXhEUVVGSkxFbEJRVWtzUTBGQlF5eERRVUZETzJGQlF6RkVMRWxCUVVrc1NVRkJTU3hEUVVGRExGRkJRVkVzUTBGQlF5eE5RVUZOTEVsQlFVa3NRMEZCUXl4RlFVRkZPMWxCUVVVc1QwRkJUeXhKUVVGSkxFTkJRVU1zVVVGQlVTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMU5CUVVVN1lVRkRNMFE3V1VGRFJDeEpRVUZKTEZOQlFWTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1VVRkJVU3hEUVVGRExFZEJRVWNzUlVGQlJTeERRVUZETEV0QlFVc3NRMEZCUXl4SlFVRkpMRU5CUVVNc1VVRkJVU3hEUVVGRExFZEJRVWNzUlVGQlJTeEZRVUZGTEZGQlFWRXNRMEZCUXl4RFFVRkRPMWxCUTNwRkxFbEJRVWtzVTBGQlV5eEhRVUZITEVsQlFVa3NRMEZCUXl4VlFVRlZMRU5CUVVNc1VVRkJVU3hEUVVGRExFTkJRVU03V1VGRE1VTXNUMEZCVHl4VFFVRlRMRU5CUVVNc1MwRkJTeXhEUVVGRExGTkJRVk1zUlVGQlJTeFJRVUZSTEVOQlFVTXNRMEZCUXp0VFFVTXZRenRKUVVOTUxFTkJRVU03U1VGRFRTeHBRMEZCVnl4SFFVRnNRaXhWUVVGdFFpeFBRVUYxUWl4RlFVRkZMRkZCUVZjc1JVRkJSU3hYUVVFMFF5eEZRVUZGTEZGQlFXbERPMUZCUTNCSkxFbEJRVWtzVDBGQlR5eEhRVUZITEU5QlFVOHNRMEZCUXl4VFFVRlRMRU5CUVVNc1VVRkJVU3hEUVVGRExFTkJRVU03VVVGRk1VTXNUMEZCVHl4RFFVRkRMRWxCUVVrc1IwRkJSeXhQUVVGUExFTkJRVU1zU1VGQlNTeERRVUZETzFGQlF6VkNMRTlCUVU4c1EwRkJReXhSUVVGUkxFZEJRVWNzVDBGQlR5eERRVUZETEZGQlFWRXNRMEZCUXp0UlFVTndReXhKUVVGSkxGZEJRVmNzUzBGQlN5eEpRVUZKTEVsQlFVa3NUMEZCVHl4RFFVRkRMRWxCUVVrc1MwRkJTeXhKUVVGSkxFVkJRVVU3V1VGREwwTXNWMEZCVnl4RFFVRkRMRTlCUVU4c1EwRkJReXhKUVVGSkxFVkJRVVVzVDBGQlR5eERRVUZETEVOQlFVTTdVMEZEZEVNN1VVRkRSQ3hKUVVGSkxGZEJRVmNzUjBGQlJ5eEpRVUZKTEZkQlFWY3NRMEZCUXl4UlFVRlJMRU5CUVVNc1EwRkJRenRSUVVNMVF5eEpRVUZKTEZkQlFWY3NTMEZCU3l4SlFVRkpMRVZCUVVVN1dVRkRkRUlzVjBGQlZ5eERRVUZETEZGQlFWRXNSVUZCUlN4WFFVRlhMRU5CUVVNc1EwRkJRenRUUVVOMFF6dFJRVU5FTEU5QlFVOHNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhYUVVGWExFVkJRVVVzVVVGQlVTeERRVUZETEVOQlFVTTdTVUZETjBNc1EwRkJRenRKUVVOTUxHdENRVUZETzBGQlFVUXNRMEZCUXl4QlFYcEhSQ3hKUVhsSFF6dEJRWHBIV1N4clEwRkJWenRCUVRoSGVFSTdTVUZGU1N4MVFrRkJiMElzVVVGQmFVTTdVVUZCYWtNc1lVRkJVU3hIUVVGU0xGRkJRVkVzUTBGQmVVSTdTVUZCU1N4RFFVRkRPMGxCUzI1RUxESkNRVUZITEVkQlFWWTdVVUZEU1N4SlFVRkpMRWxCUVVrc1EwRkJReXhMUVVGTExFVkJRVVVzUlVGQlJUdFpRVUZGTEU5QlFVOHNTVUZCU1N4RFFVRkRPMU5CUVVVN1VVRkRiRU1zVDBGQlR5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJRenRKUVVNeFFpeERRVUZETzBsQlMwMHNORUpCUVVrc1IwRkJXRHRSUVVGWkxHTkJRVms3WVVGQldpeFZRVUZaTEVWQlFWb3NjVUpCUVZrc1JVRkJXaXhKUVVGWk8xbEJRVm9zZVVKQlFWazdPMUZCUTNCQ0xFbEJRVWtzVjBGQlZ5eERRVUZETzFGQlEyaENMRXRCUVVzc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVkQlFVY3NSVUZCUlN4SFFVRkhMRWRCUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RlFVRkZPMWxCUTI1RExGZEJRVmNzUjBGQlJ5eEpRVUZKTEZkQlFWY3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRaUVVOdVF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4SFFVRkhMRWxCUVVrc1EwRkJReXhMUVVGTExFVkJRVVVzUTBGQlF5eERRVUZETzJkQ1FVTjBRaXhYUVVGWExFTkJRVU1zUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExGZEJRVmNzUlVGQlJTeEpRVUZKTEVOQlFVTXNVVUZCVVN4RFFVRkRMRU5CUVVNN1UwRkRha1U3VVVGRFJDeFBRVUZQTEZkQlFWY3NRMEZCUXp0SlFVTjJRaXhEUVVGRE8wbEJTMDBzTmtKQlFVc3NSMEZCV2p0UlFVTkpMRTlCUVU4c1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU03U1VGRGVrTXNRMEZCUXp0SlFVdE5MRGhDUVVGTkxFZEJRV0k3VVVGRFNTeFBRVUZQTEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRExFbEJRVWtzUTBGQlF5eFJRVUZSTEVOQlFVTXNRMEZCUXp0SlFVTXpReXhEUVVGRE8wbEJTMDBzSzBKQlFVOHNSMEZCWkN4VlFVRmxMRU5CUVVNN1VVRkRXaXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVONlFpeERRVUZETzBsQlNVMHNNa0pCUVVjc1IwRkJWanRSUVVOSkxFbEJRVWtzU1VGQlNTeERRVUZETEV0QlFVc3NSVUZCUlN4RlFVRkZPMWxCUTJRc1QwRkJUeXhKUVVGSkxFTkJRVU03VTBGRFpqdFJRVU5FTEVsQlFVa3NSMEZCUnl4SFFVRkhMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eEZRVUZGTEVOQlFVTTdVVUZETVVJc1NVRkJTU3hEUVVGRExFbEJRVWtzUjBGQlJ5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRk5CUVZNc1EwRkJReXhKUVVGSkxFTkJRVU1zVVVGQlVTeERRVUZETEVOQlFVTTdVVUZETDBNc1QwRkJUeXhIUVVGSExFTkJRVU03U1VGRFppeERRVUZETzBsQlNVMHNhVU5CUVZNc1IwRkJhRUlzVlVGQmFVSXNVVUZCZDBJc1JVRkJSU3hOUVVGVExFVkJRVVVzVjBGQmJVUTdVVUZCYmtRc05FSkJRVUVzUlVGQlFTeHJRa0ZCYlVRN1VVRkRja2NzU1VGQlNTeERRVUZETEVsQlFVa3NSMEZCUnl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExGZEJRVmNzUTBGQlF5eFJRVUZSTEVWQlFVVXNUVUZCVFN4RlFVRkZMRmRCUVZjc1JVRkJSU3hKUVVGSkxFTkJRVU1zVVVGQlVTeERRVUZETEVOQlFVTTdTVUZEY0VZc1EwRkJRenRKUVVOTkxHZERRVUZSTEVkQlFXWXNWVUZCWjBJc1VVRkJVVHRSUVVOd1FpeFBRVUZQTEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1VVRkJVU3hEUVVGRExGRkJRVkVzUTBGQlF5eERRVUZETzBsQlEzaERMRU5CUVVNN1NVRkxUU3cyUWtGQlN5eEhRVUZhTzFGQlEwa3NUMEZCVHl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFdEJRVXNzUlVGQlJTeERRVUZETzBsQlF6ZENMRU5CUVVNN1NVRkRUQ3h2UWtGQlF6dEJRVUZFTEVOQlFVTXNRVUY0UlVRc1NVRjNSVU03UVVGNFJWa3NjME5CUVdFaWZRPT0iLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2V4dGVuZHMgPSAodGhpcyAmJiB0aGlzLl9fZXh0ZW5kcykgfHwgKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZXh0ZW5kU3RhdGljcyA9IGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgICAgIGV4dGVuZFN0YXRpY3MgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHxcbiAgICAgICAgICAgICh7IF9fcHJvdG9fXzogW10gfSBpbnN0YW5jZW9mIEFycmF5ICYmIGZ1bmN0aW9uIChkLCBiKSB7IGQuX19wcm90b19fID0gYjsgfSkgfHxcbiAgICAgICAgICAgIGZ1bmN0aW9uIChkLCBiKSB7IGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdOyB9O1xuICAgICAgICByZXR1cm4gZXh0ZW5kU3RhdGljcyhkLCBiKTtcbiAgICB9O1xuICAgIHJldHVybiBmdW5jdGlvbiAoZCwgYikge1xuICAgICAgICBleHRlbmRTdGF0aWNzKGQsIGIpO1xuICAgICAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICAgICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xuICAgIH07XG59KSgpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIFRyZWVCYXNlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBUcmVlQmFzZSgpIHtcbiAgICAgICAgdGhpcy5maW5kSXRlciA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICB2YXIgcmVzID0gdGhpcy5fcm9vdDtcbiAgICAgICAgICAgIHZhciBpdGVyID0gdGhpcy5pdGVyYXRvcigpO1xuICAgICAgICAgICAgd2hpbGUgKHJlcyAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHZhciBjID0gdGhpcy5fY29tcGFyYXRvcihkYXRhLCByZXMuZGF0YSk7XG4gICAgICAgICAgICAgICAgaWYgKGMgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlci5fY3Vyc29yID0gcmVzO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXRlcjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZXIuX2FuY2VzdG9ycy5wdXNoKHJlcyk7XG4gICAgICAgICAgICAgICAgICAgIHJlcyA9IHJlcy5nZXRfY2hpbGQoYyA+IDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBUcmVlQmFzZS5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuX3Jvb3QgPSBudWxsO1xuICAgICAgICB0aGlzLnNpemUgPSAwO1xuICAgIH07XG4gICAgO1xuICAgIFRyZWVCYXNlLnByb3RvdHlwZS5maW5kID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgdmFyIHJlcyA9IHRoaXMuX3Jvb3Q7XG4gICAgICAgIHdoaWxlIChyZXMgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHZhciBjID0gdGhpcy5fY29tcGFyYXRvcihkYXRhLCByZXMuZGF0YSk7XG4gICAgICAgICAgICBpZiAoYyA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlcyA9IHJlcy5nZXRfY2hpbGQoYyA+IDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH07XG4gICAgO1xuICAgIFRyZWVCYXNlLnByb3RvdHlwZS5sb3dlckJvdW5kID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2JvdW5kKGRhdGEsIHRoaXMuX2NvbXBhcmF0b3IpO1xuICAgIH07XG4gICAgO1xuICAgIFRyZWVCYXNlLnByb3RvdHlwZS51cHBlckJvdW5kID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgdmFyIGNtcCA9IHRoaXMuX2NvbXBhcmF0b3I7XG4gICAgICAgIGZ1bmN0aW9uIHJldmVyc2VfY21wKGEsIGIpIHtcbiAgICAgICAgICAgIHJldHVybiBjbXAoYiwgYSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX2JvdW5kKGRhdGEsIHJldmVyc2VfY21wKTtcbiAgICB9O1xuICAgIDtcbiAgICBUcmVlQmFzZS5wcm90b3R5cGUubWluID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcmVzID0gdGhpcy5fcm9vdDtcbiAgICAgICAgaWYgKHJlcyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKHJlcy5sZWZ0ICE9PSBudWxsKSB7XG4gICAgICAgICAgICByZXMgPSByZXMubGVmdDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzLmRhdGE7XG4gICAgfTtcbiAgICA7XG4gICAgVHJlZUJhc2UucHJvdG90eXBlLm1heCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHJlcyA9IHRoaXMuX3Jvb3Q7XG4gICAgICAgIGlmIChyZXMgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHdoaWxlIChyZXMucmlnaHQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHJlcyA9IHJlcy5yaWdodDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzLmRhdGE7XG4gICAgfTtcbiAgICA7XG4gICAgVHJlZUJhc2UucHJvdG90eXBlLml0ZXJhdG9yID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IEl0ZXJhdG9yKHRoaXMpO1xuICAgIH07XG4gICAgO1xuICAgIFRyZWVCYXNlLnByb3RvdHlwZS5lYWNoID0gZnVuY3Rpb24gKGNiKSB7XG4gICAgICAgIHZhciBpdCA9IHRoaXMuaXRlcmF0b3IoKSwgZGF0YTtcbiAgICAgICAgd2hpbGUgKChkYXRhID0gaXQubmV4dCgpKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgY2IoZGF0YSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIDtcbiAgICBUcmVlQmFzZS5wcm90b3R5cGUucmVhY2ggPSBmdW5jdGlvbiAoY2IpIHtcbiAgICAgICAgdmFyIGl0ID0gdGhpcy5pdGVyYXRvcigpLCBkYXRhO1xuICAgICAgICB3aGlsZSAoKGRhdGEgPSBpdC5wcmV2KCkpICE9PSBudWxsKSB7XG4gICAgICAgICAgICBjYihkYXRhKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgO1xuICAgIFRyZWVCYXNlLnByb3RvdHlwZS5fYm91bmQgPSBmdW5jdGlvbiAoZGF0YSwgY21wKSB7XG4gICAgICAgIHZhciBjdXIgPSB0aGlzLl9yb290O1xuICAgICAgICB2YXIgaXRlciA9IHRoaXMuaXRlcmF0b3IoKTtcbiAgICAgICAgd2hpbGUgKGN1ciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdmFyIGMgPSB0aGlzLl9jb21wYXJhdG9yKGRhdGEsIGN1ci5kYXRhKTtcbiAgICAgICAgICAgIGlmIChjID09PSAwKSB7XG4gICAgICAgICAgICAgICAgaXRlci5fY3Vyc29yID0gY3VyO1xuICAgICAgICAgICAgICAgIHJldHVybiBpdGVyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaXRlci5fYW5jZXN0b3JzLnB1c2goY3VyKTtcbiAgICAgICAgICAgIGN1ciA9IGN1ci5nZXRfY2hpbGQoYyA+IDApO1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIGkgPSBpdGVyLl9hbmNlc3RvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgICAgICAgIGN1ciA9IGl0ZXIuX2FuY2VzdG9yc1tpXTtcbiAgICAgICAgICAgIGlmIChjbXAoZGF0YSwgY3VyLmRhdGEpID4gMCkge1xuICAgICAgICAgICAgICAgIGl0ZXIuX2N1cnNvciA9IGN1cjtcbiAgICAgICAgICAgICAgICBpdGVyLl9hbmNlc3RvcnMubGVuZ3RoID0gaTtcbiAgICAgICAgICAgICAgICByZXR1cm4gaXRlcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpdGVyLl9hbmNlc3RvcnMubGVuZ3RoID0gMDtcbiAgICAgICAgcmV0dXJuIGl0ZXI7XG4gICAgfTtcbiAgICA7XG4gICAgcmV0dXJuIFRyZWVCYXNlO1xufSgpKTtcbmV4cG9ydHMuVHJlZUJhc2UgPSBUcmVlQmFzZTtcbnZhciBJdGVyYXRvciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gSXRlcmF0b3IodHJlZSkge1xuICAgICAgICB0aGlzLl90cmVlID0gdHJlZTtcbiAgICAgICAgdGhpcy5fYW5jZXN0b3JzID0gW107XG4gICAgICAgIHRoaXMuX2N1cnNvciA9IG51bGw7XG4gICAgfVxuICAgIEl0ZXJhdG9yLnByb3RvdHlwZS5kYXRhID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY3Vyc29yICE9PSBudWxsID8gdGhpcy5fY3Vyc29yLmRhdGEgOiBudWxsO1xuICAgIH07XG4gICAgO1xuICAgIEl0ZXJhdG9yLnByb3RvdHlwZS5uZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5fY3Vyc29yID09PSBudWxsKSB7XG4gICAgICAgICAgICB2YXIgcm9vdCA9IHRoaXMuX3RyZWUuX3Jvb3Q7XG4gICAgICAgICAgICBpZiAocm9vdCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX21pbk5vZGUocm9vdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fY3Vyc29yLnJpZ2h0ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNhdmU7XG4gICAgICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgICAgICBzYXZlID0gdGhpcy5fY3Vyc29yO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fYW5jZXN0b3JzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fY3Vyc29yID0gdGhpcy5fYW5jZXN0b3JzLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fY3Vyc29yID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSB3aGlsZSAodGhpcy5fY3Vyc29yLnJpZ2h0ID09PSBzYXZlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX2FuY2VzdG9ycy5wdXNoKHRoaXMuX2N1cnNvcik7XG4gICAgICAgICAgICAgICAgdGhpcy5fbWluTm9kZSh0aGlzLl9jdXJzb3IucmlnaHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLl9jdXJzb3IgIT09IG51bGwgPyB0aGlzLl9jdXJzb3IuZGF0YSA6IG51bGw7XG4gICAgfTtcbiAgICA7XG4gICAgSXRlcmF0b3IucHJvdG90eXBlLnByZXYgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLl9jdXJzb3IgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHZhciByb290ID0gdGhpcy5fdHJlZS5fcm9vdDtcbiAgICAgICAgICAgIGlmIChyb290ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fbWF4Tm9kZShyb290KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9jdXJzb3IubGVmdCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHZhciBzYXZlO1xuICAgICAgICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgICAgICAgICAgc2F2ZSA9IHRoaXMuX2N1cnNvcjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX2FuY2VzdG9ycy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2N1cnNvciA9IHRoaXMuX2FuY2VzdG9ycy5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2N1cnNvciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gd2hpbGUgKHRoaXMuX2N1cnNvci5sZWZ0ID09PSBzYXZlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX2FuY2VzdG9ycy5wdXNoKHRoaXMuX2N1cnNvcik7XG4gICAgICAgICAgICAgICAgdGhpcy5fbWF4Tm9kZSh0aGlzLl9jdXJzb3IubGVmdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX2N1cnNvciAhPT0gbnVsbCA/IHRoaXMuX2N1cnNvci5kYXRhIDogbnVsbDtcbiAgICB9O1xuICAgIDtcbiAgICBJdGVyYXRvci5wcm90b3R5cGUuX21pbk5vZGUgPSBmdW5jdGlvbiAoc3RhcnQpIHtcbiAgICAgICAgd2hpbGUgKHN0YXJ0LmxlZnQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuX2FuY2VzdG9ycy5wdXNoKHN0YXJ0KTtcbiAgICAgICAgICAgIHN0YXJ0ID0gc3RhcnQubGVmdDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9jdXJzb3IgPSBzdGFydDtcbiAgICB9O1xuICAgIDtcbiAgICBJdGVyYXRvci5wcm90b3R5cGUuX21heE5vZGUgPSBmdW5jdGlvbiAoc3RhcnQpIHtcbiAgICAgICAgd2hpbGUgKHN0YXJ0LnJpZ2h0ICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLl9hbmNlc3RvcnMucHVzaChzdGFydCk7XG4gICAgICAgICAgICBzdGFydCA9IHN0YXJ0LnJpZ2h0O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2N1cnNvciA9IHN0YXJ0O1xuICAgIH07XG4gICAgO1xuICAgIHJldHVybiBJdGVyYXRvcjtcbn0oKSk7XG5leHBvcnRzLkl0ZXJhdG9yID0gSXRlcmF0b3I7XG52YXIgTm9kZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTm9kZShkYXRhKSB7XG4gICAgICAgIHRoaXMuZGF0YSA9IGRhdGE7XG4gICAgICAgIHRoaXMubGVmdCA9IG51bGw7XG4gICAgICAgIHRoaXMucmlnaHQgPSBudWxsO1xuICAgICAgICB0aGlzLnJlZCA9IHRydWU7XG4gICAgfVxuICAgIE5vZGUucHJvdG90eXBlLmdldF9jaGlsZCA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICAgICAgcmV0dXJuIGRpciA/IHRoaXMucmlnaHQgOiB0aGlzLmxlZnQ7XG4gICAgfTtcbiAgICA7XG4gICAgTm9kZS5wcm90b3R5cGUuc2V0X2NoaWxkID0gZnVuY3Rpb24gKGRpciwgdmFsKSB7XG4gICAgICAgIGlmIChkaXIpIHtcbiAgICAgICAgICAgIHRoaXMucmlnaHQgPSB2YWw7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmxlZnQgPSB2YWw7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIDtcbiAgICByZXR1cm4gTm9kZTtcbn0oKSk7XG52YXIgUkJUcmVlID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoUkJUcmVlLCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIFJCVHJlZShjb21wYXJhdG9yKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMpIHx8IHRoaXM7XG4gICAgICAgIF90aGlzLl9yb290ID0gbnVsbDtcbiAgICAgICAgX3RoaXMuX2NvbXBhcmF0b3IgPSBjb21wYXJhdG9yO1xuICAgICAgICBfdGhpcy5zaXplID0gMDtcbiAgICAgICAgcmV0dXJuIF90aGlzO1xuICAgIH1cbiAgICBSQlRyZWUucHJvdG90eXBlLmluc2VydCA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgIHZhciByZXQgPSBmYWxzZTtcbiAgICAgICAgaWYgKHRoaXMuX3Jvb3QgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuX3Jvb3QgPSBuZXcgTm9kZShkYXRhKTtcbiAgICAgICAgICAgIHJldCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLnNpemUrKztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBoZWFkID0gbmV3IE5vZGUodW5kZWZpbmVkKTtcbiAgICAgICAgICAgIHZhciBkaXIgPSBmYWxzZTtcbiAgICAgICAgICAgIHZhciBsYXN0ID0gZmFsc2U7XG4gICAgICAgICAgICB2YXIgZ3AgPSBudWxsO1xuICAgICAgICAgICAgdmFyIGdncCA9IGhlYWQ7XG4gICAgICAgICAgICB2YXIgcCA9IG51bGw7XG4gICAgICAgICAgICB2YXIgbm9kZSA9IHRoaXMuX3Jvb3Q7XG4gICAgICAgICAgICBnZ3AucmlnaHQgPSB0aGlzLl9yb290O1xuICAgICAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICAgICAgICBpZiAobm9kZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBub2RlID0gbmV3IE5vZGUoZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIHAuc2V0X2NoaWxkKGRpciwgbm9kZSk7XG4gICAgICAgICAgICAgICAgICAgIHJldCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2l6ZSsrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChSQlRyZWUuaXNfcmVkKG5vZGUubGVmdCkgJiYgUkJUcmVlLmlzX3JlZChub2RlLnJpZ2h0KSkge1xuICAgICAgICAgICAgICAgICAgICBub2RlLnJlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUubGVmdC5yZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5yaWdodC5yZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKFJCVHJlZS5pc19yZWQobm9kZSkgJiYgUkJUcmVlLmlzX3JlZChwKSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGlyMiA9IGdncC5yaWdodCA9PT0gZ3A7XG4gICAgICAgICAgICAgICAgICAgIGlmIChub2RlID09PSBwLmdldF9jaGlsZChsYXN0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ2dwLnNldF9jaGlsZChkaXIyLCBSQlRyZWUuc2luZ2xlX3JvdGF0ZShncCwgIWxhc3QpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdncC5zZXRfY2hpbGQoZGlyMiwgUkJUcmVlLmRvdWJsZV9yb3RhdGUoZ3AsICFsYXN0KSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGNtcCA9IHRoaXMuX2NvbXBhcmF0b3Iobm9kZS5kYXRhLCBkYXRhKTtcbiAgICAgICAgICAgICAgICBpZiAoY21wID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsYXN0ID0gZGlyO1xuICAgICAgICAgICAgICAgIGRpciA9IGNtcCA8IDA7XG4gICAgICAgICAgICAgICAgaWYgKGdwICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGdncCA9IGdwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBncCA9IHA7XG4gICAgICAgICAgICAgICAgcCA9IG5vZGU7XG4gICAgICAgICAgICAgICAgbm9kZSA9IG5vZGUuZ2V0X2NoaWxkKGRpcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9yb290ID0gaGVhZC5yaWdodDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9yb290LnJlZCA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH07XG4gICAgO1xuICAgIFJCVHJlZS5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgaWYgKHRoaXMuX3Jvb3QgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaGVhZCA9IG5ldyBOb2RlKHVuZGVmaW5lZCk7XG4gICAgICAgIHZhciBub2RlID0gaGVhZDtcbiAgICAgICAgbm9kZS5yaWdodCA9IHRoaXMuX3Jvb3Q7XG4gICAgICAgIHZhciBwID0gbnVsbDtcbiAgICAgICAgdmFyIGdwID0gbnVsbDtcbiAgICAgICAgdmFyIGZvdW5kID0gbnVsbDtcbiAgICAgICAgdmFyIGRpciA9IHRydWU7XG4gICAgICAgIHdoaWxlIChub2RlLmdldF9jaGlsZChkaXIpICE9PSBudWxsKSB7XG4gICAgICAgICAgICB2YXIgbGFzdCA9IGRpcjtcbiAgICAgICAgICAgIGdwID0gcDtcbiAgICAgICAgICAgIHAgPSBub2RlO1xuICAgICAgICAgICAgbm9kZSA9IG5vZGUuZ2V0X2NoaWxkKGRpcik7XG4gICAgICAgICAgICB2YXIgY21wID0gdGhpcy5fY29tcGFyYXRvcihkYXRhLCBub2RlLmRhdGEpO1xuICAgICAgICAgICAgZGlyID0gY21wID4gMDtcbiAgICAgICAgICAgIGlmIChjbXAgPT09IDApIHtcbiAgICAgICAgICAgICAgICBmb3VuZCA9IG5vZGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIVJCVHJlZS5pc19yZWQobm9kZSkgJiYgIVJCVHJlZS5pc19yZWQobm9kZS5nZXRfY2hpbGQoZGlyKSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoUkJUcmVlLmlzX3JlZChub2RlLmdldF9jaGlsZCghZGlyKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNyID0gUkJUcmVlLnNpbmdsZV9yb3RhdGUobm9kZSwgZGlyKTtcbiAgICAgICAgICAgICAgICAgICAgcC5zZXRfY2hpbGQobGFzdCwgc3IpO1xuICAgICAgICAgICAgICAgICAgICBwID0gc3I7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKCFSQlRyZWUuaXNfcmVkKG5vZGUuZ2V0X2NoaWxkKCFkaXIpKSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgc2libGluZyA9IHAuZ2V0X2NoaWxkKCFsYXN0KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNpYmxpbmcgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghUkJUcmVlLmlzX3JlZChzaWJsaW5nLmdldF9jaGlsZCghbGFzdCkpICYmICFSQlRyZWUuaXNfcmVkKHNpYmxpbmcuZ2V0X2NoaWxkKGxhc3QpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHAucmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2libGluZy5yZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUucmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkaXIyID0gZ3AucmlnaHQgPT09IHA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFJCVHJlZS5pc19yZWQoc2libGluZy5nZXRfY2hpbGQobGFzdCkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdwLnNldF9jaGlsZChkaXIyLCBSQlRyZWUuZG91YmxlX3JvdGF0ZShwLCBsYXN0KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKFJCVHJlZS5pc19yZWQoc2libGluZy5nZXRfY2hpbGQoIWxhc3QpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBncC5zZXRfY2hpbGQoZGlyMiwgUkJUcmVlLnNpbmdsZV9yb3RhdGUocCwgbGFzdCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZ3BjID0gZ3AuZ2V0X2NoaWxkKGRpcjIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdwYy5yZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUucmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBncGMubGVmdC5yZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBncGMucmlnaHQucmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZvdW5kICE9PSBudWxsKSB7XG4gICAgICAgICAgICBmb3VuZC5kYXRhID0gbm9kZS5kYXRhO1xuICAgICAgICAgICAgcC5zZXRfY2hpbGQocC5yaWdodCA9PT0gbm9kZSwgbm9kZS5nZXRfY2hpbGQobm9kZS5sZWZ0ID09PSBudWxsKSk7XG4gICAgICAgICAgICB0aGlzLnNpemUtLTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9yb290ID0gaGVhZC5yaWdodDtcbiAgICAgICAgaWYgKHRoaXMuX3Jvb3QgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuX3Jvb3QucmVkID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZvdW5kICE9PSBudWxsO1xuICAgIH07XG4gICAgO1xuICAgIFJCVHJlZS5pc19yZWQgPSBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICByZXR1cm4gbm9kZSAhPT0gbnVsbCAmJiBub2RlLnJlZDtcbiAgICB9O1xuICAgIFJCVHJlZS5zaW5nbGVfcm90YXRlID0gZnVuY3Rpb24gKHJvb3QsIGRpcikge1xuICAgICAgICB2YXIgc2F2ZSA9IHJvb3QuZ2V0X2NoaWxkKCFkaXIpO1xuICAgICAgICByb290LnNldF9jaGlsZCghZGlyLCBzYXZlLmdldF9jaGlsZChkaXIpKTtcbiAgICAgICAgc2F2ZS5zZXRfY2hpbGQoZGlyLCByb290KTtcbiAgICAgICAgcm9vdC5yZWQgPSB0cnVlO1xuICAgICAgICBzYXZlLnJlZCA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gc2F2ZTtcbiAgICB9O1xuICAgIFJCVHJlZS5kb3VibGVfcm90YXRlID0gZnVuY3Rpb24gKHJvb3QsIGRpcikge1xuICAgICAgICByb290LnNldF9jaGlsZCghZGlyLCBSQlRyZWUuc2luZ2xlX3JvdGF0ZShyb290LmdldF9jaGlsZCghZGlyKSwgIWRpcikpO1xuICAgICAgICByZXR1cm4gUkJUcmVlLnNpbmdsZV9yb3RhdGUocm9vdCwgZGlyKTtcbiAgICB9O1xuICAgIHJldHVybiBSQlRyZWU7XG59KFRyZWVCYXNlKSk7XG5leHBvcnRzLlJCVHJlZSA9IFJCVHJlZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSm1hV3hsSWpvaWNtSjBjbVZsTG1weklpd2ljMjkxY21ObFVtOXZkQ0k2SWlJc0luTnZkWEpqWlhNaU9sc2lMaTR2TGk0dlYyVmlRMjlzWVM5emNtTXZjbUowY21WbExuUnpJbDBzSW01aGJXVnpJanBiWFN3aWJXRndjR2x1WjNNaU9pSTdPenM3T3pzN096czdPenM3T3p0QlFYVkNTVHRKUVVGQk8xRkJORUpKTEdGQlFWRXNSMEZCUnl4VlFVRlZMRWxCUVVrN1dVRkRja0lzU1VGQlNTeEhRVUZITEVkQlFVY3NTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJRenRaUVVOeVFpeEpRVUZKTEVsQlFVa3NSMEZCUnl4SlFVRkpMRU5CUVVNc1VVRkJVU3hGUVVGRkxFTkJRVU03V1VGRk0wSXNUMEZCVHl4SFFVRkhMRXRCUVVzc1NVRkJTU3hGUVVGRk8yZENRVU5xUWl4SlFVRkpMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zVjBGQlZ5eERRVUZETEVsQlFVa3NSVUZCUlN4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03WjBKQlEzcERMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUlVGQlJUdHZRa0ZEVkN4SlFVRkpMRU5CUVVNc1QwRkJUeXhIUVVGSExFZEJRVWNzUTBGQlF6dHZRa0ZEYmtJc1QwRkJUeXhKUVVGSkxFTkJRVU03YVVKQlEyWTdjVUpCUTBrN2IwSkJRMFFzU1VGQlNTeERRVUZETEZWQlFWVXNRMEZCUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU03YjBKQlF6RkNMRWRCUVVjc1IwRkJSeXhIUVVGSExFTkJRVU1zVTBGQlV5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJRenRwUWtGRE9VSTdZVUZEU2p0WlFVVkVMRTlCUVU4c1NVRkJTU3hEUVVGRE8xRkJRMmhDTEVOQlFVTXNRMEZCUXp0SlFTdEdUaXhEUVVGRE8wbEJka2xITEhkQ1FVRkxMRWRCUVV3N1VVRkRTU3hKUVVGSkxFTkJRVU1zUzBGQlN5eEhRVUZITEVsQlFVa3NRMEZCUXp0UlFVTnNRaXhKUVVGSkxFTkJRVU1zU1VGQlNTeEhRVUZITEVOQlFVTXNRMEZCUXp0SlFVTnNRaXhEUVVGRE8wbEJRVUVzUTBGQlF6dEpRVWRHTEhWQ1FVRkpMRWRCUVVvc1ZVRkJTeXhKUVVGSk8xRkJRMHdzU1VGQlNTeEhRVUZITEVkQlFVY3NTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJRenRSUVVWeVFpeFBRVUZQTEVkQlFVY3NTMEZCU3l4SlFVRkpMRVZCUVVVN1dVRkRha0lzU1VGQlNTeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRmRCUVZjc1EwRkJReXhKUVVGSkxFVkJRVVVzUjBGQlJ5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMWxCUTNwRExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNSVUZCUlR0blFrRkRWQ3hQUVVGUExFZEJRVWNzUTBGQlF5eEpRVUZKTEVOQlFVTTdZVUZEYmtJN2FVSkJRMGs3WjBKQlEwUXNSMEZCUnl4SFFVRkhMRWRCUVVjc1EwRkJReXhUUVVGVExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRPMkZCUXpsQ08xTkJRMG83VVVGRlJDeFBRVUZQTEVsQlFVa3NRMEZCUXp0SlFVTm9RaXhEUVVGRE8wbEJRVUVzUTBGQlF6dEpRWFZDUml3MlFrRkJWU3hIUVVGV0xGVkJRVmNzU1VGQlNUdFJRVU5ZTEU5QlFVOHNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhKUVVGSkxFVkJRVVVzU1VGQlNTeERRVUZETEZkQlFWY3NRMEZCUXl4RFFVRkRPMGxCUXk5RExFTkJRVU03U1VGQlFTeERRVUZETzBsQlIwWXNOa0pCUVZVc1IwRkJWaXhWUVVGWExFbEJRVWs3VVVGRFdDeEpRVUZKTEVkQlFVY3NSMEZCUnl4SlFVRkpMRU5CUVVNc1YwRkJWeXhEUVVGRE8xRkJSVE5DTEZOQlFWTXNWMEZCVnl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRE8xbEJRM0pDTEU5QlFVOHNSMEZCUnl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU55UWl4RFFVRkRPMUZCUlVRc1QwRkJUeXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEVsQlFVa3NSVUZCUlN4WFFVRlhMRU5CUVVNc1EwRkJRenRKUVVNeFF5eERRVUZETzBsQlFVRXNRMEZCUXp0SlFVZEdMSE5DUVVGSExFZEJRVWc3VVVGRFNTeEpRVUZKTEVkQlFVY3NSMEZCUnl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRE8xRkJRM0pDTEVsQlFVa3NSMEZCUnl4TFFVRkxMRWxCUVVrc1JVRkJSVHRaUVVOa0xFOUJRVThzU1VGQlNTeERRVUZETzFOQlEyWTdVVUZGUkN4UFFVRlBMRWRCUVVjc1EwRkJReXhKUVVGSkxFdEJRVXNzU1VGQlNTeEZRVUZGTzFsQlEzUkNMRWRCUVVjc1IwRkJSeXhIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETzFOQlEyeENPMUZCUlVRc1QwRkJUeXhIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETzBsQlEzQkNMRU5CUVVNN1NVRkJRU3hEUVVGRE8wbEJSMFlzYzBKQlFVY3NSMEZCU0R0UlFVTkpMRWxCUVVrc1IwRkJSeXhIUVVGSExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTTdVVUZEY2tJc1NVRkJTU3hIUVVGSExFdEJRVXNzU1VGQlNTeEZRVUZGTzFsQlEyUXNUMEZCVHl4SlFVRkpMRU5CUVVNN1UwRkRaanRSUVVWRUxFOUJRVThzUjBGQlJ5eERRVUZETEV0QlFVc3NTMEZCU3l4SlFVRkpMRVZCUVVVN1dVRkRka0lzUjBGQlJ5eEhRVUZITEVkQlFVY3NRMEZCUXl4TFFVRkxMRU5CUVVNN1UwRkRia0k3VVVGRlJDeFBRVUZQTEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNN1NVRkRjRUlzUTBGQlF6dEpRVUZCTEVOQlFVTTdTVUZKUml3eVFrRkJVU3hIUVVGU08xRkJRMGtzVDBGQlR5eEpRVUZKTEZGQlFWRXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRKUVVNNVFpeERRVUZETzBsQlFVRXNRMEZCUXp0SlFVZEdMSFZDUVVGSkxFZEJRVW9zVlVGQlN5eEZRVUZGTzFGQlEwZ3NTVUZCU1N4RlFVRkZMRWRCUVVjc1NVRkJTU3hEUVVGRExGRkJRVkVzUlVGQlJTeEZRVUZGTEVsQlFVa3NRMEZCUXp0UlFVTXZRaXhQUVVGUExFTkJRVU1zU1VGQlNTeEhRVUZITEVWQlFVVXNRMEZCUXl4SlFVRkpMRVZCUVVVc1EwRkJReXhMUVVGTExFbEJRVWtzUlVGQlJUdFpRVU5vUXl4RlFVRkZMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03VTBGRFdqdEpRVU5NTEVOQlFVTTdTVUZCUVN4RFFVRkRPMGxCUjBZc2QwSkJRVXNzUjBGQlRDeFZRVUZOTEVWQlFVVTdVVUZEU2l4SlFVRkpMRVZCUVVVc1IwRkJSeXhKUVVGSkxFTkJRVU1zVVVGQlVTeEZRVUZGTEVWQlFVVXNTVUZCU1N4RFFVRkRPMUZCUXk5Q0xFOUJRVThzUTBGQlF5eEpRVUZKTEVkQlFVY3NSVUZCUlN4RFFVRkRMRWxCUVVrc1JVRkJSU3hEUVVGRExFdEJRVXNzU1VGQlNTeEZRVUZGTzFsQlEyaERMRVZCUVVVc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dFRRVU5hTzBsQlEwd3NRMEZCUXp0SlFVRkJMRU5CUVVNN1NVRkhSaXg1UWtGQlRTeEhRVUZPTEZWQlFVOHNTVUZCU1N4RlFVRkZMRWRCUVVjN1VVRkRXaXhKUVVGSkxFZEJRVWNzUjBGQlJ5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRPMUZCUTNKQ0xFbEJRVWtzU1VGQlNTeEhRVUZITEVsQlFVa3NRMEZCUXl4UlFVRlJMRVZCUVVVc1EwRkJRenRSUVVVelFpeFBRVUZQTEVkQlFVY3NTMEZCU3l4SlFVRkpMRVZCUVVVN1dVRkRha0lzU1VGQlNTeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRmRCUVZjc1EwRkJReXhKUVVGSkxFVkJRVVVzUjBGQlJ5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMWxCUTNwRExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNSVUZCUlR0blFrRkRWQ3hKUVVGSkxFTkJRVU1zVDBGQlR5eEhRVUZITEVkQlFVY3NRMEZCUXp0blFrRkRia0lzVDBGQlR5eEpRVUZKTEVOQlFVTTdZVUZEWmp0WlFVTkVMRWxCUVVrc1EwRkJReXhWUVVGVkxFTkJRVU1zU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMWxCUXpGQ0xFZEJRVWNzUjBGQlJ5eEhRVUZITEVOQlFVTXNVMEZCVXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF6dFRRVU01UWp0UlFVVkVMRXRCUVVzc1NVRkJTU3hEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEZWQlFWVXNRMEZCUXl4TlFVRk5MRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zU1VGQlNTeERRVUZETEVWQlFVVXNSVUZCUlN4RFFVRkRMRVZCUVVVN1dVRkRiRVFzUjBGQlJ5eEhRVUZITEVsQlFVa3NRMEZCUXl4VlFVRlZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGVrSXNTVUZCU1N4SFFVRkhMRU5CUVVNc1NVRkJTU3hGUVVGRkxFZEJRVWNzUTBGQlF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVN1owSkJRM3BDTEVsQlFVa3NRMEZCUXl4UFFVRlBMRWRCUVVjc1IwRkJSeXhEUVVGRE8yZENRVU51UWl4SlFVRkpMRU5CUVVNc1ZVRkJWU3hEUVVGRExFMUJRVTBzUjBGQlJ5eERRVUZETEVOQlFVTTdaMEpCUXpOQ0xFOUJRVThzU1VGQlNTeERRVUZETzJGQlEyWTdVMEZEU2p0UlFVVkVMRWxCUVVrc1EwRkJReXhWUVVGVkxFTkJRVU1zVFVGQlRTeEhRVUZITEVOQlFVTXNRMEZCUXp0UlFVTXpRaXhQUVVGUExFbEJRVWtzUTBGQlF6dEpRVU5vUWl4RFFVRkRPMGxCUVVFc1EwRkJRenRKUVVOT0xHVkJRVU03UVVGQlJDeERRVUZETEVGQk5VbEVMRWxCTkVsRE8wRkJOVWxaTERSQ1FVRlJPMEZCTmtseVFqdEpRVWxKTEd0Q1FVRlpMRWxCUVVrN1VVRkRXaXhKUVVGSkxFTkJRVU1zUzBGQlN5eEhRVUZITEVsQlFVa3NRMEZCUXp0UlFVTnNRaXhKUVVGSkxFTkJRVU1zVlVGQlZTeEhRVUZITEVWQlFVVXNRMEZCUXp0UlFVTnlRaXhKUVVGSkxFTkJRVU1zVDBGQlR5eEhRVUZITEVsQlFVa3NRMEZCUXp0SlFVTjRRaXhEUVVGRE8wbEJSVVFzZFVKQlFVa3NSMEZCU2p0UlFVTkpMRTlCUVU4c1NVRkJTU3hEUVVGRExFOUJRVThzUzBGQlN5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNN1NVRkROVVFzUTBGQlF6dEpRVUZCTEVOQlFVTTdTVUZKUml4MVFrRkJTU3hIUVVGS08xRkJRMGtzU1VGQlNTeEpRVUZKTEVOQlFVTXNUMEZCVHl4TFFVRkxMRWxCUVVrc1JVRkJSVHRaUVVOMlFpeEpRVUZKTEVsQlFVa3NSMEZCUnl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFdEJRVXNzUTBGQlF6dFpRVU0xUWl4SlFVRkpMRWxCUVVrc1MwRkJTeXhKUVVGSkxFVkJRVVU3WjBKQlEyWXNTVUZCU1N4RFFVRkRMRkZCUVZFc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dGhRVU4yUWp0VFFVTktPMkZCUTBrN1dVRkRSQ3hKUVVGSkxFbEJRVWtzUTBGQlF5eFBRVUZQTEVOQlFVTXNTMEZCU3l4TFFVRkxMRWxCUVVrc1JVRkJSVHRuUWtGSE4wSXNTVUZCU1N4SlFVRkpMRU5CUVVNN1owSkJRMVFzUjBGQlJ6dHZRa0ZEUXl4SlFVRkpMRWRCUVVjc1NVRkJTU3hEUVVGRExFOUJRVThzUTBGQlF6dHZRa0ZEY0VJc1NVRkJTU3hKUVVGSkxFTkJRVU1zVlVGQlZTeERRVUZETEUxQlFVMHNSVUZCUlR0M1FrRkRlRUlzU1VGQlNTeERRVUZETEU5QlFVOHNSMEZCUnl4SlFVRkpMRU5CUVVNc1ZVRkJWU3hEUVVGRExFZEJRVWNzUlVGQlJTeERRVUZETzNGQ1FVTjRRenQ1UWtGRFNUdDNRa0ZEUkN4SlFVRkpMRU5CUVVNc1QwRkJUeXhIUVVGSExFbEJRVWtzUTBGQlF6dDNRa0ZEY0VJc1RVRkJUVHR4UWtGRFZEdHBRa0ZEU2l4UlFVRlJMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU1zUzBGQlN5eExRVUZMTEVsQlFVa3NSVUZCUlR0aFFVTjZRenRwUWtGRFNUdG5Ra0ZGUkN4SlFVRkpMRU5CUVVNc1ZVRkJWU3hEUVVGRExFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNUMEZCVHl4RFFVRkRMRU5CUVVNN1owSkJRMjVETEVsQlFVa3NRMEZCUXl4UlFVRlJMRU5CUVVNc1NVRkJTU3hEUVVGRExFOUJRVThzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXp0aFFVTnlRenRUUVVOS08xRkJRMFFzVDBGQlR5eEpRVUZKTEVOQlFVTXNUMEZCVHl4TFFVRkxMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEU5QlFVOHNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF6dEpRVU0xUkN4RFFVRkRPMGxCUVVFc1EwRkJRenRKUVVsR0xIVkNRVUZKTEVkQlFVbzdVVUZEU1N4SlFVRkpMRWxCUVVrc1EwRkJReXhQUVVGUExFdEJRVXNzU1VGQlNTeEZRVUZGTzFsQlEzWkNMRWxCUVVrc1NVRkJTU3hIUVVGSExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNTMEZCU3l4RFFVRkRPMWxCUXpWQ0xFbEJRVWtzU1VGQlNTeExRVUZMTEVsQlFVa3NSVUZCUlR0blFrRkRaaXhKUVVGSkxFTkJRVU1zVVVGQlVTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMkZCUTNaQ08xTkJRMG83WVVGRFNUdFpRVU5FTEVsQlFVa3NTVUZCU1N4RFFVRkRMRTlCUVU4c1EwRkJReXhKUVVGSkxFdEJRVXNzU1VGQlNTeEZRVUZGTzJkQ1FVTTFRaXhKUVVGSkxFbEJRVWtzUTBGQlF6dG5Ra0ZEVkN4SFFVRkhPMjlDUVVORExFbEJRVWtzUjBGQlJ5eEpRVUZKTEVOQlFVTXNUMEZCVHl4RFFVRkRPMjlDUVVOd1FpeEpRVUZKTEVsQlFVa3NRMEZCUXl4VlFVRlZMRU5CUVVNc1RVRkJUU3hGUVVGRk8zZENRVU40UWl4SlFVRkpMRU5CUVVNc1QwRkJUeXhIUVVGSExFbEJRVWtzUTBGQlF5eFZRVUZWTEVOQlFVTXNSMEZCUnl4RlFVRkZMRU5CUVVNN2NVSkJRM2hETzNsQ1FVTkpPM2RDUVVORUxFbEJRVWtzUTBGQlF5eFBRVUZQTEVkQlFVY3NTVUZCU1N4RFFVRkRPM2RDUVVOd1FpeE5RVUZOTzNGQ1FVTlVPMmxDUVVOS0xGRkJRVkVzU1VGQlNTeERRVUZETEU5QlFVOHNRMEZCUXl4SlFVRkpMRXRCUVVzc1NVRkJTU3hGUVVGRk8yRkJRM2hETzJsQ1FVTkpPMmRDUVVORUxFbEJRVWtzUTBGQlF5eFZRVUZWTEVOQlFVTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU1zUTBGQlF6dG5Ra0ZEYmtNc1NVRkJTU3hEUVVGRExGRkJRVkVzUTBGQlF5eEpRVUZKTEVOQlFVTXNUMEZCVHl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRE8yRkJRM0JETzFOQlEwbzdVVUZEUkN4UFFVRlBMRWxCUVVrc1EwRkJReXhQUVVGUExFdEJRVXNzU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1QwRkJUeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRPMGxCUXpWRUxFTkJRVU03U1VGQlFTeERRVUZETzBsQlJVWXNNa0pCUVZFc1IwRkJVaXhWUVVGVExFdEJRVXM3VVVGRFZpeFBRVUZQTEV0QlFVc3NRMEZCUXl4SlFVRkpMRXRCUVVzc1NVRkJTU3hGUVVGRk8xbEJRM2hDTEVsQlFVa3NRMEZCUXl4VlFVRlZMRU5CUVVNc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETzFsQlF6VkNMRXRCUVVzc1IwRkJSeXhMUVVGTExFTkJRVU1zU1VGQlNTeERRVUZETzFOQlEzUkNPMUZCUTBRc1NVRkJTU3hEUVVGRExFOUJRVThzUjBGQlJ5eExRVUZMTEVOQlFVTTdTVUZEZWtJc1EwRkJRenRKUVVGQkxFTkJRVU03U1VGRlJpd3lRa0ZCVVN4SFFVRlNMRlZCUVZNc1MwRkJTenRSUVVOV0xFOUJRVThzUzBGQlN5eERRVUZETEV0QlFVc3NTMEZCU3l4SlFVRkpMRVZCUVVVN1dVRkRla0lzU1VGQlNTeERRVUZETEZWQlFWVXNRMEZCUXl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU03V1VGRE5VSXNTMEZCU3l4SFFVRkhMRXRCUVVzc1EwRkJReXhMUVVGTExFTkJRVU03VTBGRGRrSTdVVUZEUkN4SlFVRkpMRU5CUVVNc1QwRkJUeXhIUVVGSExFdEJRVXNzUTBGQlF6dEpRVU42UWl4RFFVRkRPMGxCUVVFc1EwRkJRenRKUVVOT0xHVkJRVU03UVVGQlJDeERRVUZETEVGQk9VWkVMRWxCT0VaRE8wRkJPVVpaTERSQ1FVRlJPMEZCWjBkeVFqdEpRVXRKTEdOQlFWa3NTVUZCU1R0UlFVTmFMRWxCUVVrc1EwRkJReXhKUVVGSkxFZEJRVWNzU1VGQlNTeERRVUZETzFGQlEycENMRWxCUVVrc1EwRkJReXhKUVVGSkxFZEJRVWNzU1VGQlNTeERRVUZETzFGQlEycENMRWxCUVVrc1EwRkJReXhMUVVGTExFZEJRVWNzU1VGQlNTeERRVUZETzFGQlEyeENMRWxCUVVrc1EwRkJReXhIUVVGSExFZEJRVWNzU1VGQlNTeERRVUZETzBsQlEzQkNMRU5CUVVNN1NVRkZSQ3gzUWtGQlV5eEhRVUZVTEZWQlFWVXNSMEZCUnp0UlFVTlVMRTlCUVU4c1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETzBsQlEzaERMRU5CUVVNN1NVRkJRU3hEUVVGRE8wbEJSVVlzZDBKQlFWTXNSMEZCVkN4VlFVRlZMRWRCUVVjc1JVRkJSU3hIUVVGSE8xRkJRMlFzU1VGQlNTeEhRVUZITEVWQlFVVTdXVUZEVEN4SlFVRkpMRU5CUVVNc1MwRkJTeXhIUVVGSExFZEJRVWNzUTBGQlF6dFRRVU53UWp0aFFVTkpPMWxCUTBRc1NVRkJTU3hEUVVGRExFbEJRVWtzUjBGQlJ5eEhRVUZITEVOQlFVTTdVMEZEYmtJN1NVRkRUQ3hEUVVGRE8wbEJRVUVzUTBGQlF6dEpRVU5PTEZkQlFVTTdRVUZCUkN4RFFVRkRMRUZCZUVKRUxFbEJkMEpETzBGQlJVUTdTVUZCSzBJc01FSkJRVkU3U1VGTGJrTXNaMEpCUVZrc1ZVRkJhME03VVVGQk9VTXNXVUZEU1N4cFFrRkJUeXhUUVVsV08xRkJTRWNzUzBGQlNTeERRVUZETEV0QlFVc3NSMEZCUnl4SlFVRkpMRU5CUVVNN1VVRkRiRUlzUzBGQlNTeERRVUZETEZkQlFWY3NSMEZCUnl4VlFVRlZMRU5CUVVNN1VVRkRPVUlzUzBGQlNTeERRVUZETEVsQlFVa3NSMEZCUnl4RFFVRkRMRU5CUVVNN08wbEJRMnhDTEVOQlFVTTdTVUZIUkN4MVFrRkJUU3hIUVVGT0xGVkJRVThzU1VGQlNUdFJRVU5RTEVsQlFVa3NSMEZCUnl4SFFVRkhMRXRCUVVzc1EwRkJRenRSUVVWb1FpeEpRVUZKTEVsQlFVa3NRMEZCUXl4TFFVRkxMRXRCUVVzc1NVRkJTU3hGUVVGRk8xbEJSWEpDTEVsQlFVa3NRMEZCUXl4TFFVRkxMRWRCUVVjc1NVRkJTU3hKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdXVUZETlVJc1IwRkJSeXhIUVVGSExFbEJRVWtzUTBGQlF6dFpRVU5ZTEVsQlFVa3NRMEZCUXl4SlFVRkpMRVZCUVVVc1EwRkJRenRUUVVObU8yRkJRMGs3V1VGRFJDeEpRVUZKTEVsQlFVa3NSMEZCUnl4SlFVRkpMRWxCUVVrc1EwRkJReXhUUVVGVExFTkJRVU1zUTBGQlF6dFpRVVV2UWl4SlFVRkpMRWRCUVVjc1IwRkJSeXhMUVVGTExFTkJRVU03V1VGRGFFSXNTVUZCU1N4SlFVRkpMRWRCUVVjc1MwRkJTeXhEUVVGRE8xbEJSMnBDTEVsQlFVa3NSVUZCUlN4SFFVRkhMRWxCUVVrc1EwRkJRenRaUVVOa0xFbEJRVWtzUjBGQlJ5eEhRVUZITEVsQlFVa3NRMEZCUXp0WlFVTm1MRWxCUVVrc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF6dFpRVU5pTEVsQlFVa3NTVUZCU1N4SFFVRkhMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU03V1VGRGRFSXNSMEZCUnl4RFFVRkRMRXRCUVVzc1IwRkJSeXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETzFsQlIzWkNMRTlCUVU4c1NVRkJTU3hGUVVGRk8yZENRVU5VTEVsQlFVa3NTVUZCU1N4TFFVRkxMRWxCUVVrc1JVRkJSVHR2UWtGRlppeEpRVUZKTEVkQlFVY3NTVUZCU1N4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03YjBKQlEzUkNMRU5CUVVNc1EwRkJReXhUUVVGVExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRPMjlDUVVOMlFpeEhRVUZITEVkQlFVY3NTVUZCU1N4RFFVRkRPMjlDUVVOWUxFbEJRVWtzUTBGQlF5eEpRVUZKTEVWQlFVVXNRMEZCUXp0cFFrRkRaanR4UWtGRFNTeEpRVUZKTEUxQlFVMHNRMEZCUXl4TlFVRk5MRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eEpRVUZKTEUxQlFVMHNRMEZCUXl4TlFVRk5MRU5CUVVNc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eEZRVUZGTzI5Q1FVVTFSQ3hKUVVGSkxFTkJRVU1zUjBGQlJ5eEhRVUZITEVsQlFVa3NRMEZCUXp0dlFrRkRhRUlzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4SFFVRkhMRWRCUVVjc1MwRkJTeXhEUVVGRE8yOUNRVU4wUWl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFZEJRVWNzUjBGQlJ5eExRVUZMTEVOQlFVTTdhVUpCUXpGQ08yZENRVWRFTEVsQlFVa3NUVUZCVFN4RFFVRkRMRTFCUVUwc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeE5RVUZOTEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRk8yOUNRVU42UXl4SlFVRkpMRWxCUVVrc1IwRkJSeXhIUVVGSExFTkJRVU1zUzBGQlN5eExRVUZMTEVWQlFVVXNRMEZCUXp0dlFrRkZOVUlzU1VGQlNTeEpRVUZKTEV0QlFVc3NRMEZCUXl4RFFVRkRMRk5CUVZNc1EwRkJReXhKUVVGSkxFTkJRVU1zUlVGQlJUdDNRa0ZETlVJc1IwRkJSeXhEUVVGRExGTkJRVk1zUTBGQlF5eEpRVUZKTEVWQlFVVXNUVUZCVFN4RFFVRkRMR0ZCUVdFc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRPM0ZDUVVONFJEdDVRa0ZEU1R0M1FrRkRSQ3hIUVVGSExFTkJRVU1zVTBGQlV5eERRVUZETEVsQlFVa3NSVUZCUlN4TlFVRk5MRU5CUVVNc1lVRkJZU3hEUVVGRExFVkJRVVVzUlVGQlJTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNN2NVSkJRM2hFTzJsQ1FVTktPMmRDUVVWRUxFbEJRVWtzUjBGQlJ5eEhRVUZITEVsQlFVa3NRMEZCUXl4WFFVRlhMRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXp0blFrRkhOVU1zU1VGQlNTeEhRVUZITEV0QlFVc3NRMEZCUXl4RlFVRkZPMjlDUVVOWUxFMUJRVTA3YVVKQlExUTdaMEpCUlVRc1NVRkJTU3hIUVVGSExFZEJRVWNzUTBGQlF6dG5Ra0ZEV0N4SFFVRkhMRWRCUVVjc1IwRkJSeXhIUVVGSExFTkJRVU1zUTBGQlF6dG5Ra0ZIWkN4SlFVRkpMRVZCUVVVc1MwRkJTeXhKUVVGSkxFVkJRVVU3YjBKQlEySXNSMEZCUnl4SFFVRkhMRVZCUVVVc1EwRkJRenRwUWtGRFdqdG5Ra0ZEUkN4RlFVRkZMRWRCUVVjc1EwRkJReXhEUVVGRE8yZENRVU5RTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNN1owSkJRMVFzU1VGQlNTeEhRVUZITEVsQlFVa3NRMEZCUXl4VFFVRlRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU03WVVGRE9VSTdXVUZIUkN4SlFVRkpMRU5CUVVNc1MwRkJTeXhIUVVGSExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTTdVMEZETTBJN1VVRkhSQ3hKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVkQlFVY3NSMEZCUnl4TFFVRkxMRU5CUVVNN1VVRkZka0lzVDBGQlR5eEhRVUZITEVOQlFVTTdTVUZEWml4RFFVRkRPMGxCUVVFc1EwRkJRenRKUVVkR0xIVkNRVUZOTEVkQlFVNHNWVUZCVHl4SlFVRkpPMUZCUTFBc1NVRkJTU3hKUVVGSkxFTkJRVU1zUzBGQlN5eExRVUZMTEVsQlFVa3NSVUZCUlR0WlFVTnlRaXhQUVVGUExFdEJRVXNzUTBGQlF6dFRRVU5vUWp0UlFVVkVMRWxCUVVrc1NVRkJTU3hIUVVGSExFbEJRVWtzU1VGQlNTeERRVUZETEZOQlFWTXNRMEZCUXl4RFFVRkRPMUZCUXk5Q0xFbEJRVWtzU1VGQlNTeEhRVUZITEVsQlFVa3NRMEZCUXp0UlFVTm9RaXhKUVVGSkxFTkJRVU1zUzBGQlN5eEhRVUZITEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNN1VVRkRlRUlzU1VGQlNTeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRPMUZCUTJJc1NVRkJTU3hGUVVGRkxFZEJRVWNzU1VGQlNTeERRVUZETzFGQlEyUXNTVUZCU1N4TFFVRkxMRWRCUVVjc1NVRkJTU3hEUVVGRE8xRkJRMnBDTEVsQlFVa3NSMEZCUnl4SFFVRkhMRWxCUVVrc1EwRkJRenRSUVVWbUxFOUJRVThzU1VGQlNTeERRVUZETEZOQlFWTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1MwRkJTeXhKUVVGSkxFVkJRVVU3V1VGRGFrTXNTVUZCU1N4SlFVRkpMRWRCUVVjc1IwRkJSeXhEUVVGRE8xbEJSMllzUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXp0WlFVTlFMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU03V1VGRFZDeEpRVUZKTEVkQlFVY3NTVUZCU1N4RFFVRkRMRk5CUVZNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dFpRVVV6UWl4SlFVRkpMRWRCUVVjc1IwRkJSeXhKUVVGSkxFTkJRVU1zVjBGQlZ5eERRVUZETEVsQlFVa3NSVUZCUlN4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03V1VGRk5VTXNSMEZCUnl4SFFVRkhMRWRCUVVjc1IwRkJSeXhEUVVGRExFTkJRVU03V1VGSFpDeEpRVUZKTEVkQlFVY3NTMEZCU3l4RFFVRkRMRVZCUVVVN1owSkJRMWdzUzBGQlN5eEhRVUZITEVsQlFVa3NRMEZCUXp0aFFVTm9RanRaUVVkRUxFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNUVUZCVFN4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNc1UwRkJVeXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVWQlFVVTdaMEpCUXpkRUxFbEJRVWtzVFVGQlRTeERRVUZETEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNc1UwRkJVeXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNSVUZCUlR0dlFrRkRja01zU1VGQlNTeEZRVUZGTEVkQlFVY3NUVUZCVFN4RFFVRkRMR0ZCUVdFc1EwRkJReXhKUVVGSkxFVkJRVVVzUjBGQlJ5eERRVUZETEVOQlFVTTdiMEpCUTNwRExFTkJRVU1zUTBGQlF5eFRRVUZUTEVOQlFVTXNTVUZCU1N4RlFVRkZMRVZCUVVVc1EwRkJReXhEUVVGRE8yOUNRVU4wUWl4RFFVRkRMRWRCUVVjc1JVRkJSU3hEUVVGRE8ybENRVU5XTzNGQ1FVTkpMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zVFVGQlRTeERRVUZETEVsQlFVa3NRMEZCUXl4VFFVRlRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eEZRVUZGTzI5Q1FVTXpReXhKUVVGSkxFOUJRVThzUjBGQlJ5eERRVUZETEVOQlFVTXNVMEZCVXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03YjBKQlEycERMRWxCUVVrc1QwRkJUeXhMUVVGTExFbEJRVWtzUlVGQlJUdDNRa0ZEYkVJc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eE5RVUZOTEVOQlFVTXNUMEZCVHl4RFFVRkRMRk5CUVZNc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1RVRkJUU3hEUVVGRExFOUJRVThzUTBGQlF5eFRRVUZUTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1JVRkJSVHMwUWtGRmNrWXNRMEZCUXl4RFFVRkRMRWRCUVVjc1IwRkJSeXhMUVVGTExFTkJRVU03TkVKQlEyUXNUMEZCVHl4RFFVRkRMRWRCUVVjc1IwRkJSeXhKUVVGSkxFTkJRVU03TkVKQlEyNUNMRWxCUVVrc1EwRkJReXhIUVVGSExFZEJRVWNzU1VGQlNTeERRVUZETzNsQ1FVTnVRanMyUWtGRFNUczBRa0ZEUkN4SlFVRkpMRWxCUVVrc1IwRkJSeXhGUVVGRkxFTkJRVU1zUzBGQlN5eExRVUZMTEVOQlFVTXNRMEZCUXpzMFFrRkZNVUlzU1VGQlNTeE5RVUZOTEVOQlFVTXNUVUZCVFN4RFFVRkRMRTlCUVU4c1EwRkJReXhUUVVGVExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNSVUZCUlR0blEwRkRlRU1zUlVGQlJTeERRVUZETEZOQlFWTXNRMEZCUXl4SlFVRkpMRVZCUVVVc1RVRkJUU3hEUVVGRExHRkJRV0VzUTBGQlF5eERRVUZETEVWQlFVVXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJRenMyUWtGRGNrUTdhVU5CUTBrc1NVRkJTU3hOUVVGTkxFTkJRVU1zVFVGQlRTeERRVUZETEU5QlFVOHNRMEZCUXl4VFFVRlRMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eEZRVUZGTzJkRFFVTTVReXhGUVVGRkxFTkJRVU1zVTBGQlV5eERRVUZETEVsQlFVa3NSVUZCUlN4TlFVRk5MRU5CUVVNc1lVRkJZU3hEUVVGRExFTkJRVU1zUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRPelpDUVVOeVJEczBRa0ZIUkN4SlFVRkpMRWRCUVVjc1IwRkJSeXhGUVVGRkxFTkJRVU1zVTBGQlV5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPelJDUVVNM1FpeEhRVUZITEVOQlFVTXNSMEZCUnl4SFFVRkhMRWxCUVVrc1EwRkJRenMwUWtGRFppeEpRVUZKTEVOQlFVTXNSMEZCUnl4SFFVRkhMRWxCUVVrc1EwRkJRenMwUWtGRGFFSXNSMEZCUnl4RFFVRkRMRWxCUVVrc1EwRkJReXhIUVVGSExFZEJRVWNzUzBGQlN5eERRVUZET3pSQ1FVTnlRaXhIUVVGSExFTkJRVU1zUzBGQlN5eERRVUZETEVkQlFVY3NSMEZCUnl4TFFVRkxMRU5CUVVNN2VVSkJRM3BDTzNGQ1FVTktPMmxDUVVOS08yRkJRMG83VTBGRFNqdFJRVWRFTEVsQlFVa3NTMEZCU3l4TFFVRkxMRWxCUVVrc1JVRkJSVHRaUVVOb1FpeExRVUZMTEVOQlFVTXNTVUZCU1N4SFFVRkhMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU03V1VGRGRrSXNRMEZCUXl4RFFVRkRMRk5CUVZNc1EwRkJReXhEUVVGRExFTkJRVU1zUzBGQlN5eExRVUZMTEVsQlFVa3NSVUZCUlN4SlFVRkpMRU5CUVVNc1UwRkJVeXhEUVVGRExFbEJRVWtzUTBGQlF5eEpRVUZKTEV0QlFVc3NTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVOc1JTeEpRVUZKTEVOQlFVTXNTVUZCU1N4RlFVRkZMRU5CUVVNN1UwRkRaanRSUVVkRUxFbEJRVWtzUTBGQlF5eExRVUZMTEVkQlFVY3NTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJRenRSUVVONFFpeEpRVUZKTEVsQlFVa3NRMEZCUXl4TFFVRkxMRXRCUVVzc1NVRkJTU3hGUVVGRk8xbEJRM0pDTEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1IwRkJSeXhIUVVGSExFdEJRVXNzUTBGQlF6dFRRVU14UWp0UlFVVkVMRTlCUVU4c1MwRkJTeXhMUVVGTExFbEJRVWtzUTBGQlF6dEpRVU14UWl4RFFVRkRPMGxCUVVFc1EwRkJRenRKUVVWTExHRkJRVTBzUjBGQllpeFZRVUZqTEVsQlFVazdVVUZEWkN4UFFVRlBMRWxCUVVrc1MwRkJTeXhKUVVGSkxFbEJRVWtzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXp0SlFVTnlReXhEUVVGRE8wbEJSVTBzYjBKQlFXRXNSMEZCY0VJc1ZVRkJjVUlzU1VGQlNTeEZRVUZGTEVkQlFVYzdVVUZETVVJc1NVRkJTU3hKUVVGSkxFZEJRVWNzU1VGQlNTeERRVUZETEZOQlFWTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE8xRkJSV2hETEVsQlFVa3NRMEZCUXl4VFFVRlRMRU5CUVVNc1EwRkJReXhIUVVGSExFVkJRVVVzU1VGQlNTeERRVUZETEZOQlFWTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRekZETEVsQlFVa3NRMEZCUXl4VFFVRlRMRU5CUVVNc1IwRkJSeXhGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETzFGQlJURkNMRWxCUVVrc1EwRkJReXhIUVVGSExFZEJRVWNzU1VGQlNTeERRVUZETzFGQlEyaENMRWxCUVVrc1EwRkJReXhIUVVGSExFZEJRVWNzUzBGQlN5eERRVUZETzFGQlJXcENMRTlCUVU4c1NVRkJTU3hEUVVGRE8wbEJRMmhDTEVOQlFVTTdTVUZGVFN4dlFrRkJZU3hIUVVGd1FpeFZRVUZ4UWl4SlFVRkpMRVZCUVVVc1IwRkJSenRSUVVNeFFpeEpRVUZKTEVOQlFVTXNVMEZCVXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhGUVVGRkxFMUJRVTBzUTBGQlF5eGhRVUZoTEVOQlFVTXNTVUZCU1N4RFFVRkRMRk5CUVZNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOMlJTeFBRVUZQTEUxQlFVMHNRMEZCUXl4aFFVRmhMRU5CUVVNc1NVRkJTU3hGUVVGRkxFZEJRVWNzUTBGQlF5eERRVUZETzBsQlF6TkRMRU5CUVVNN1NVRkRUQ3hoUVVGRE8wRkJRVVFzUTBGQlF5eEJRWEpOUkN4RFFVRXJRaXhSUVVGUkxFZEJjVTEwUXp0QlFYSk5XU3gzUWtGQlRTSjkiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2V4dGVuZHMgPSAodGhpcyAmJiB0aGlzLl9fZXh0ZW5kcykgfHwgKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZXh0ZW5kU3RhdGljcyA9IGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgICAgIGV4dGVuZFN0YXRpY3MgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHxcbiAgICAgICAgICAgICh7IF9fcHJvdG9fXzogW10gfSBpbnN0YW5jZW9mIEFycmF5ICYmIGZ1bmN0aW9uIChkLCBiKSB7IGQuX19wcm90b19fID0gYjsgfSkgfHxcbiAgICAgICAgICAgIGZ1bmN0aW9uIChkLCBiKSB7IGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdOyB9O1xuICAgICAgICByZXR1cm4gZXh0ZW5kU3RhdGljcyhkLCBiKTtcbiAgICB9O1xuICAgIHJldHVybiBmdW5jdGlvbiAoZCwgYikge1xuICAgICAgICBleHRlbmRTdGF0aWNzKGQsIGIpO1xuICAgICAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICAgICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xuICAgIH07XG59KSgpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHZwc2NfMSA9IHJlcXVpcmUoXCIuL3Zwc2NcIik7XG52YXIgcmJ0cmVlXzEgPSByZXF1aXJlKFwiLi9yYnRyZWVcIik7XG5mdW5jdGlvbiBjb21wdXRlR3JvdXBCb3VuZHMoZykge1xuICAgIGcuYm91bmRzID0gdHlwZW9mIGcubGVhdmVzICE9PSBcInVuZGVmaW5lZFwiID9cbiAgICAgICAgZy5sZWF2ZXMucmVkdWNlKGZ1bmN0aW9uIChyLCBjKSB7IHJldHVybiBjLmJvdW5kcy51bmlvbihyKTsgfSwgUmVjdGFuZ2xlLmVtcHR5KCkpIDpcbiAgICAgICAgUmVjdGFuZ2xlLmVtcHR5KCk7XG4gICAgaWYgKHR5cGVvZiBnLmdyb3VwcyAhPT0gXCJ1bmRlZmluZWRcIilcbiAgICAgICAgZy5ib3VuZHMgPSBnLmdyb3Vwcy5yZWR1Y2UoZnVuY3Rpb24gKHIsIGMpIHsgcmV0dXJuIGNvbXB1dGVHcm91cEJvdW5kcyhjKS51bmlvbihyKTsgfSwgZy5ib3VuZHMpO1xuICAgIGcuYm91bmRzID0gZy5ib3VuZHMuaW5mbGF0ZShnLnBhZGRpbmcpO1xuICAgIHJldHVybiBnLmJvdW5kcztcbn1cbmV4cG9ydHMuY29tcHV0ZUdyb3VwQm91bmRzID0gY29tcHV0ZUdyb3VwQm91bmRzO1xudmFyIFJlY3RhbmdsZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUmVjdGFuZ2xlKHgsIFgsIHksIFkpIHtcbiAgICAgICAgdGhpcy54ID0geDtcbiAgICAgICAgdGhpcy5YID0gWDtcbiAgICAgICAgdGhpcy55ID0geTtcbiAgICAgICAgdGhpcy5ZID0gWTtcbiAgICB9XG4gICAgUmVjdGFuZ2xlLmVtcHR5ID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gbmV3IFJlY3RhbmdsZShOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFksIE51bWJlci5ORUdBVElWRV9JTkZJTklUWSwgTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZLCBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFkpOyB9O1xuICAgIFJlY3RhbmdsZS5wcm90b3R5cGUuY3ggPSBmdW5jdGlvbiAoKSB7IHJldHVybiAodGhpcy54ICsgdGhpcy5YKSAvIDI7IH07XG4gICAgUmVjdGFuZ2xlLnByb3RvdHlwZS5jeSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICh0aGlzLnkgKyB0aGlzLlkpIC8gMjsgfTtcbiAgICBSZWN0YW5nbGUucHJvdG90eXBlLm92ZXJsYXBYID0gZnVuY3Rpb24gKHIpIHtcbiAgICAgICAgdmFyIHV4ID0gdGhpcy5jeCgpLCB2eCA9IHIuY3goKTtcbiAgICAgICAgaWYgKHV4IDw9IHZ4ICYmIHIueCA8IHRoaXMuWClcbiAgICAgICAgICAgIHJldHVybiB0aGlzLlggLSByLng7XG4gICAgICAgIGlmICh2eCA8PSB1eCAmJiB0aGlzLnggPCByLlgpXG4gICAgICAgICAgICByZXR1cm4gci5YIC0gdGhpcy54O1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9O1xuICAgIFJlY3RhbmdsZS5wcm90b3R5cGUub3ZlcmxhcFkgPSBmdW5jdGlvbiAocikge1xuICAgICAgICB2YXIgdXkgPSB0aGlzLmN5KCksIHZ5ID0gci5jeSgpO1xuICAgICAgICBpZiAodXkgPD0gdnkgJiYgci55IDwgdGhpcy5ZKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuWSAtIHIueTtcbiAgICAgICAgaWYgKHZ5IDw9IHV5ICYmIHRoaXMueSA8IHIuWSlcbiAgICAgICAgICAgIHJldHVybiByLlkgLSB0aGlzLnk7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH07XG4gICAgUmVjdGFuZ2xlLnByb3RvdHlwZS5zZXRYQ2VudHJlID0gZnVuY3Rpb24gKGN4KSB7XG4gICAgICAgIHZhciBkeCA9IGN4IC0gdGhpcy5jeCgpO1xuICAgICAgICB0aGlzLnggKz0gZHg7XG4gICAgICAgIHRoaXMuWCArPSBkeDtcbiAgICB9O1xuICAgIFJlY3RhbmdsZS5wcm90b3R5cGUuc2V0WUNlbnRyZSA9IGZ1bmN0aW9uIChjeSkge1xuICAgICAgICB2YXIgZHkgPSBjeSAtIHRoaXMuY3koKTtcbiAgICAgICAgdGhpcy55ICs9IGR5O1xuICAgICAgICB0aGlzLlkgKz0gZHk7XG4gICAgfTtcbiAgICBSZWN0YW5nbGUucHJvdG90eXBlLndpZHRoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5YIC0gdGhpcy54O1xuICAgIH07XG4gICAgUmVjdGFuZ2xlLnByb3RvdHlwZS5oZWlnaHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLlkgLSB0aGlzLnk7XG4gICAgfTtcbiAgICBSZWN0YW5nbGUucHJvdG90eXBlLnVuaW9uID0gZnVuY3Rpb24gKHIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZWN0YW5nbGUoTWF0aC5taW4odGhpcy54LCByLngpLCBNYXRoLm1heCh0aGlzLlgsIHIuWCksIE1hdGgubWluKHRoaXMueSwgci55KSwgTWF0aC5tYXgodGhpcy5ZLCByLlkpKTtcbiAgICB9O1xuICAgIFJlY3RhbmdsZS5wcm90b3R5cGUubGluZUludGVyc2VjdGlvbnMgPSBmdW5jdGlvbiAoeDEsIHkxLCB4MiwgeTIpIHtcbiAgICAgICAgdmFyIHNpZGVzID0gW1t0aGlzLngsIHRoaXMueSwgdGhpcy5YLCB0aGlzLnldLFxuICAgICAgICAgICAgW3RoaXMuWCwgdGhpcy55LCB0aGlzLlgsIHRoaXMuWV0sXG4gICAgICAgICAgICBbdGhpcy5YLCB0aGlzLlksIHRoaXMueCwgdGhpcy5ZXSxcbiAgICAgICAgICAgIFt0aGlzLngsIHRoaXMuWSwgdGhpcy54LCB0aGlzLnldXTtcbiAgICAgICAgdmFyIGludGVyc2VjdGlvbnMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA0OyArK2kpIHtcbiAgICAgICAgICAgIHZhciByID0gUmVjdGFuZ2xlLmxpbmVJbnRlcnNlY3Rpb24oeDEsIHkxLCB4MiwgeTIsIHNpZGVzW2ldWzBdLCBzaWRlc1tpXVsxXSwgc2lkZXNbaV1bMl0sIHNpZGVzW2ldWzNdKTtcbiAgICAgICAgICAgIGlmIChyICE9PSBudWxsKVxuICAgICAgICAgICAgICAgIGludGVyc2VjdGlvbnMucHVzaCh7IHg6IHIueCwgeTogci55IH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpbnRlcnNlY3Rpb25zO1xuICAgIH07XG4gICAgUmVjdGFuZ2xlLnByb3RvdHlwZS5yYXlJbnRlcnNlY3Rpb24gPSBmdW5jdGlvbiAoeDIsIHkyKSB7XG4gICAgICAgIHZhciBpbnRzID0gdGhpcy5saW5lSW50ZXJzZWN0aW9ucyh0aGlzLmN4KCksIHRoaXMuY3koKSwgeDIsIHkyKTtcbiAgICAgICAgcmV0dXJuIGludHMubGVuZ3RoID4gMCA/IGludHNbMF0gOiBudWxsO1xuICAgIH07XG4gICAgUmVjdGFuZ2xlLnByb3RvdHlwZS52ZXJ0aWNlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHsgeDogdGhpcy54LCB5OiB0aGlzLnkgfSxcbiAgICAgICAgICAgIHsgeDogdGhpcy5YLCB5OiB0aGlzLnkgfSxcbiAgICAgICAgICAgIHsgeDogdGhpcy5YLCB5OiB0aGlzLlkgfSxcbiAgICAgICAgICAgIHsgeDogdGhpcy54LCB5OiB0aGlzLlkgfVxuICAgICAgICBdO1xuICAgIH07XG4gICAgUmVjdGFuZ2xlLmxpbmVJbnRlcnNlY3Rpb24gPSBmdW5jdGlvbiAoeDEsIHkxLCB4MiwgeTIsIHgzLCB5MywgeDQsIHk0KSB7XG4gICAgICAgIHZhciBkeDEyID0geDIgLSB4MSwgZHgzNCA9IHg0IC0geDMsIGR5MTIgPSB5MiAtIHkxLCBkeTM0ID0geTQgLSB5MywgZGVub21pbmF0b3IgPSBkeTM0ICogZHgxMiAtIGR4MzQgKiBkeTEyO1xuICAgICAgICBpZiAoZGVub21pbmF0b3IgPT0gMClcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB2YXIgZHgzMSA9IHgxIC0geDMsIGR5MzEgPSB5MSAtIHkzLCBudW1hID0gZHgzNCAqIGR5MzEgLSBkeTM0ICogZHgzMSwgYSA9IG51bWEgLyBkZW5vbWluYXRvciwgbnVtYiA9IGR4MTIgKiBkeTMxIC0gZHkxMiAqIGR4MzEsIGIgPSBudW1iIC8gZGVub21pbmF0b3I7XG4gICAgICAgIGlmIChhID49IDAgJiYgYSA8PSAxICYmIGIgPj0gMCAmJiBiIDw9IDEpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgeDogeDEgKyBhICogZHgxMixcbiAgICAgICAgICAgICAgICB5OiB5MSArIGEgKiBkeTEyXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH07XG4gICAgUmVjdGFuZ2xlLnByb3RvdHlwZS5pbmZsYXRlID0gZnVuY3Rpb24gKHBhZCkge1xuICAgICAgICByZXR1cm4gbmV3IFJlY3RhbmdsZSh0aGlzLnggLSBwYWQsIHRoaXMuWCArIHBhZCwgdGhpcy55IC0gcGFkLCB0aGlzLlkgKyBwYWQpO1xuICAgIH07XG4gICAgcmV0dXJuIFJlY3RhbmdsZTtcbn0oKSk7XG5leHBvcnRzLlJlY3RhbmdsZSA9IFJlY3RhbmdsZTtcbmZ1bmN0aW9uIG1ha2VFZGdlQmV0d2Vlbihzb3VyY2UsIHRhcmdldCwgYWgpIHtcbiAgICB2YXIgc2kgPSBzb3VyY2UucmF5SW50ZXJzZWN0aW9uKHRhcmdldC5jeCgpLCB0YXJnZXQuY3koKSkgfHwgeyB4OiBzb3VyY2UuY3goKSwgeTogc291cmNlLmN5KCkgfSwgdGkgPSB0YXJnZXQucmF5SW50ZXJzZWN0aW9uKHNvdXJjZS5jeCgpLCBzb3VyY2UuY3koKSkgfHwgeyB4OiB0YXJnZXQuY3goKSwgeTogdGFyZ2V0LmN5KCkgfSwgZHggPSB0aS54IC0gc2kueCwgZHkgPSB0aS55IC0gc2kueSwgbCA9IE1hdGguc3FydChkeCAqIGR4ICsgZHkgKiBkeSksIGFsID0gbCAtIGFoO1xuICAgIHJldHVybiB7XG4gICAgICAgIHNvdXJjZUludGVyc2VjdGlvbjogc2ksXG4gICAgICAgIHRhcmdldEludGVyc2VjdGlvbjogdGksXG4gICAgICAgIGFycm93U3RhcnQ6IHsgeDogc2kueCArIGFsICogZHggLyBsLCB5OiBzaS55ICsgYWwgKiBkeSAvIGwgfVxuICAgIH07XG59XG5leHBvcnRzLm1ha2VFZGdlQmV0d2VlbiA9IG1ha2VFZGdlQmV0d2VlbjtcbmZ1bmN0aW9uIG1ha2VFZGdlVG8ocywgdGFyZ2V0LCBhaCkge1xuICAgIHZhciB0aSA9IHRhcmdldC5yYXlJbnRlcnNlY3Rpb24ocy54LCBzLnkpO1xuICAgIGlmICghdGkpXG4gICAgICAgIHRpID0geyB4OiB0YXJnZXQuY3goKSwgeTogdGFyZ2V0LmN5KCkgfTtcbiAgICB2YXIgZHggPSB0aS54IC0gcy54LCBkeSA9IHRpLnkgLSBzLnksIGwgPSBNYXRoLnNxcnQoZHggKiBkeCArIGR5ICogZHkpO1xuICAgIHJldHVybiB7IHg6IHRpLnggLSBhaCAqIGR4IC8gbCwgeTogdGkueSAtIGFoICogZHkgLyBsIH07XG59XG5leHBvcnRzLm1ha2VFZGdlVG8gPSBtYWtlRWRnZVRvO1xudmFyIE5vZGUgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIE5vZGUodiwgciwgcG9zKSB7XG4gICAgICAgIHRoaXMudiA9IHY7XG4gICAgICAgIHRoaXMuciA9IHI7XG4gICAgICAgIHRoaXMucG9zID0gcG9zO1xuICAgICAgICB0aGlzLnByZXYgPSBtYWtlUkJUcmVlKCk7XG4gICAgICAgIHRoaXMubmV4dCA9IG1ha2VSQlRyZWUoKTtcbiAgICB9XG4gICAgcmV0dXJuIE5vZGU7XG59KCkpO1xudmFyIEV2ZW50ID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBFdmVudChpc09wZW4sIHYsIHBvcykge1xuICAgICAgICB0aGlzLmlzT3BlbiA9IGlzT3BlbjtcbiAgICAgICAgdGhpcy52ID0gdjtcbiAgICAgICAgdGhpcy5wb3MgPSBwb3M7XG4gICAgfVxuICAgIHJldHVybiBFdmVudDtcbn0oKSk7XG5mdW5jdGlvbiBjb21wYXJlRXZlbnRzKGEsIGIpIHtcbiAgICBpZiAoYS5wb3MgPiBiLnBvcykge1xuICAgICAgICByZXR1cm4gMTtcbiAgICB9XG4gICAgaWYgKGEucG9zIDwgYi5wb3MpIHtcbiAgICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbiAgICBpZiAoYS5pc09wZW4pIHtcbiAgICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbiAgICBpZiAoYi5pc09wZW4pIHtcbiAgICAgICAgcmV0dXJuIDE7XG4gICAgfVxuICAgIHJldHVybiAwO1xufVxuZnVuY3Rpb24gbWFrZVJCVHJlZSgpIHtcbiAgICByZXR1cm4gbmV3IHJidHJlZV8xLlJCVHJlZShmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYS5wb3MgLSBiLnBvczsgfSk7XG59XG52YXIgeFJlY3QgPSB7XG4gICAgZ2V0Q2VudHJlOiBmdW5jdGlvbiAocikgeyByZXR1cm4gci5jeCgpOyB9LFxuICAgIGdldE9wZW46IGZ1bmN0aW9uIChyKSB7IHJldHVybiByLnk7IH0sXG4gICAgZ2V0Q2xvc2U6IGZ1bmN0aW9uIChyKSB7IHJldHVybiByLlk7IH0sXG4gICAgZ2V0U2l6ZTogZnVuY3Rpb24gKHIpIHsgcmV0dXJuIHIud2lkdGgoKTsgfSxcbiAgICBtYWtlUmVjdDogZnVuY3Rpb24gKG9wZW4sIGNsb3NlLCBjZW50ZXIsIHNpemUpIHsgcmV0dXJuIG5ldyBSZWN0YW5nbGUoY2VudGVyIC0gc2l6ZSAvIDIsIGNlbnRlciArIHNpemUgLyAyLCBvcGVuLCBjbG9zZSk7IH0sXG4gICAgZmluZE5laWdoYm91cnM6IGZpbmRYTmVpZ2hib3Vyc1xufTtcbnZhciB5UmVjdCA9IHtcbiAgICBnZXRDZW50cmU6IGZ1bmN0aW9uIChyKSB7IHJldHVybiByLmN5KCk7IH0sXG4gICAgZ2V0T3BlbjogZnVuY3Rpb24gKHIpIHsgcmV0dXJuIHIueDsgfSxcbiAgICBnZXRDbG9zZTogZnVuY3Rpb24gKHIpIHsgcmV0dXJuIHIuWDsgfSxcbiAgICBnZXRTaXplOiBmdW5jdGlvbiAocikgeyByZXR1cm4gci5oZWlnaHQoKTsgfSxcbiAgICBtYWtlUmVjdDogZnVuY3Rpb24gKG9wZW4sIGNsb3NlLCBjZW50ZXIsIHNpemUpIHsgcmV0dXJuIG5ldyBSZWN0YW5nbGUob3BlbiwgY2xvc2UsIGNlbnRlciAtIHNpemUgLyAyLCBjZW50ZXIgKyBzaXplIC8gMik7IH0sXG4gICAgZmluZE5laWdoYm91cnM6IGZpbmRZTmVpZ2hib3Vyc1xufTtcbmZ1bmN0aW9uIGdlbmVyYXRlR3JvdXBDb25zdHJhaW50cyhyb290LCBmLCBtaW5TZXAsIGlzQ29udGFpbmVkKSB7XG4gICAgaWYgKGlzQ29udGFpbmVkID09PSB2b2lkIDApIHsgaXNDb250YWluZWQgPSBmYWxzZTsgfVxuICAgIHZhciBwYWRkaW5nID0gcm9vdC5wYWRkaW5nLCBnbiA9IHR5cGVvZiByb290Lmdyb3VwcyAhPT0gJ3VuZGVmaW5lZCcgPyByb290Lmdyb3Vwcy5sZW5ndGggOiAwLCBsbiA9IHR5cGVvZiByb290LmxlYXZlcyAhPT0gJ3VuZGVmaW5lZCcgPyByb290LmxlYXZlcy5sZW5ndGggOiAwLCBjaGlsZENvbnN0cmFpbnRzID0gIWduID8gW11cbiAgICAgICAgOiByb290Lmdyb3Vwcy5yZWR1Y2UoZnVuY3Rpb24gKGNjcywgZykgeyByZXR1cm4gY2NzLmNvbmNhdChnZW5lcmF0ZUdyb3VwQ29uc3RyYWludHMoZywgZiwgbWluU2VwLCB0cnVlKSk7IH0sIFtdKSwgbiA9IChpc0NvbnRhaW5lZCA/IDIgOiAwKSArIGxuICsgZ24sIHZzID0gbmV3IEFycmF5KG4pLCBycyA9IG5ldyBBcnJheShuKSwgaSA9IDAsIGFkZCA9IGZ1bmN0aW9uIChyLCB2KSB7IHJzW2ldID0gcjsgdnNbaSsrXSA9IHY7IH07XG4gICAgaWYgKGlzQ29udGFpbmVkKSB7XG4gICAgICAgIHZhciBiID0gcm9vdC5ib3VuZHMsIGMgPSBmLmdldENlbnRyZShiKSwgcyA9IGYuZ2V0U2l6ZShiKSAvIDIsIG9wZW4gPSBmLmdldE9wZW4oYiksIGNsb3NlID0gZi5nZXRDbG9zZShiKSwgbWluID0gYyAtIHMgKyBwYWRkaW5nIC8gMiwgbWF4ID0gYyArIHMgLSBwYWRkaW5nIC8gMjtcbiAgICAgICAgcm9vdC5taW5WYXIuZGVzaXJlZFBvc2l0aW9uID0gbWluO1xuICAgICAgICBhZGQoZi5tYWtlUmVjdChvcGVuLCBjbG9zZSwgbWluLCBwYWRkaW5nKSwgcm9vdC5taW5WYXIpO1xuICAgICAgICByb290Lm1heFZhci5kZXNpcmVkUG9zaXRpb24gPSBtYXg7XG4gICAgICAgIGFkZChmLm1ha2VSZWN0KG9wZW4sIGNsb3NlLCBtYXgsIHBhZGRpbmcpLCByb290Lm1heFZhcik7XG4gICAgfVxuICAgIGlmIChsbilcbiAgICAgICAgcm9vdC5sZWF2ZXMuZm9yRWFjaChmdW5jdGlvbiAobCkgeyByZXR1cm4gYWRkKGwuYm91bmRzLCBsLnZhcmlhYmxlKTsgfSk7XG4gICAgaWYgKGduKVxuICAgICAgICByb290Lmdyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uIChnKSB7XG4gICAgICAgICAgICB2YXIgYiA9IGcuYm91bmRzO1xuICAgICAgICAgICAgYWRkKGYubWFrZVJlY3QoZi5nZXRPcGVuKGIpLCBmLmdldENsb3NlKGIpLCBmLmdldENlbnRyZShiKSwgZi5nZXRTaXplKGIpKSwgZy5taW5WYXIpO1xuICAgICAgICB9KTtcbiAgICB2YXIgY3MgPSBnZW5lcmF0ZUNvbnN0cmFpbnRzKHJzLCB2cywgZiwgbWluU2VwKTtcbiAgICBpZiAoZ24pIHtcbiAgICAgICAgdnMuZm9yRWFjaChmdW5jdGlvbiAodikgeyB2LmNPdXQgPSBbXSwgdi5jSW4gPSBbXTsgfSk7XG4gICAgICAgIGNzLmZvckVhY2goZnVuY3Rpb24gKGMpIHsgYy5sZWZ0LmNPdXQucHVzaChjKSwgYy5yaWdodC5jSW4ucHVzaChjKTsgfSk7XG4gICAgICAgIHJvb3QuZ3JvdXBzLmZvckVhY2goZnVuY3Rpb24gKGcpIHtcbiAgICAgICAgICAgIHZhciBnYXBBZGp1c3RtZW50ID0gKGcucGFkZGluZyAtIGYuZ2V0U2l6ZShnLmJvdW5kcykpIC8gMjtcbiAgICAgICAgICAgIGcubWluVmFyLmNJbi5mb3JFYWNoKGZ1bmN0aW9uIChjKSB7IHJldHVybiBjLmdhcCArPSBnYXBBZGp1c3RtZW50OyB9KTtcbiAgICAgICAgICAgIGcubWluVmFyLmNPdXQuZm9yRWFjaChmdW5jdGlvbiAoYykgeyBjLmxlZnQgPSBnLm1heFZhcjsgYy5nYXAgKz0gZ2FwQWRqdXN0bWVudDsgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gY2hpbGRDb25zdHJhaW50cy5jb25jYXQoY3MpO1xufVxuZnVuY3Rpb24gZ2VuZXJhdGVDb25zdHJhaW50cyhycywgdmFycywgcmVjdCwgbWluU2VwKSB7XG4gICAgdmFyIGksIG4gPSBycy5sZW5ndGg7XG4gICAgdmFyIE4gPSAyICogbjtcbiAgICBjb25zb2xlLmFzc2VydCh2YXJzLmxlbmd0aCA+PSBuKTtcbiAgICB2YXIgZXZlbnRzID0gbmV3IEFycmF5KE4pO1xuICAgIGZvciAoaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgdmFyIHIgPSByc1tpXTtcbiAgICAgICAgdmFyIHYgPSBuZXcgTm9kZSh2YXJzW2ldLCByLCByZWN0LmdldENlbnRyZShyKSk7XG4gICAgICAgIGV2ZW50c1tpXSA9IG5ldyBFdmVudCh0cnVlLCB2LCByZWN0LmdldE9wZW4ocikpO1xuICAgICAgICBldmVudHNbaSArIG5dID0gbmV3IEV2ZW50KGZhbHNlLCB2LCByZWN0LmdldENsb3NlKHIpKTtcbiAgICB9XG4gICAgZXZlbnRzLnNvcnQoY29tcGFyZUV2ZW50cyk7XG4gICAgdmFyIGNzID0gbmV3IEFycmF5KCk7XG4gICAgdmFyIHNjYW5saW5lID0gbWFrZVJCVHJlZSgpO1xuICAgIGZvciAoaSA9IDA7IGkgPCBOOyArK2kpIHtcbiAgICAgICAgdmFyIGUgPSBldmVudHNbaV07XG4gICAgICAgIHZhciB2ID0gZS52O1xuICAgICAgICBpZiAoZS5pc09wZW4pIHtcbiAgICAgICAgICAgIHNjYW5saW5lLmluc2VydCh2KTtcbiAgICAgICAgICAgIHJlY3QuZmluZE5laWdoYm91cnModiwgc2NhbmxpbmUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgc2NhbmxpbmUucmVtb3ZlKHYpO1xuICAgICAgICAgICAgdmFyIG1ha2VDb25zdHJhaW50ID0gZnVuY3Rpb24gKGwsIHIpIHtcbiAgICAgICAgICAgICAgICB2YXIgc2VwID0gKHJlY3QuZ2V0U2l6ZShsLnIpICsgcmVjdC5nZXRTaXplKHIucikpIC8gMiArIG1pblNlcDtcbiAgICAgICAgICAgICAgICBjcy5wdXNoKG5ldyB2cHNjXzEuQ29uc3RyYWludChsLnYsIHIudiwgc2VwKSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdmFyIHZpc2l0TmVpZ2hib3VycyA9IGZ1bmN0aW9uIChmb3J3YXJkLCByZXZlcnNlLCBta2Nvbikge1xuICAgICAgICAgICAgICAgIHZhciB1LCBpdCA9IHZbZm9yd2FyZF0uaXRlcmF0b3IoKTtcbiAgICAgICAgICAgICAgICB3aGlsZSAoKHUgPSBpdFtmb3J3YXJkXSgpKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBta2Nvbih1LCB2KTtcbiAgICAgICAgICAgICAgICAgICAgdVtyZXZlcnNlXS5yZW1vdmUodik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHZpc2l0TmVpZ2hib3VycyhcInByZXZcIiwgXCJuZXh0XCIsIGZ1bmN0aW9uICh1LCB2KSB7IHJldHVybiBtYWtlQ29uc3RyYWludCh1LCB2KTsgfSk7XG4gICAgICAgICAgICB2aXNpdE5laWdoYm91cnMoXCJuZXh0XCIsIFwicHJldlwiLCBmdW5jdGlvbiAodSwgdikgeyByZXR1cm4gbWFrZUNvbnN0cmFpbnQodiwgdSk7IH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNvbnNvbGUuYXNzZXJ0KHNjYW5saW5lLnNpemUgPT09IDApO1xuICAgIHJldHVybiBjcztcbn1cbmZ1bmN0aW9uIGZpbmRYTmVpZ2hib3Vycyh2LCBzY2FubGluZSkge1xuICAgIHZhciBmID0gZnVuY3Rpb24gKGZvcndhcmQsIHJldmVyc2UpIHtcbiAgICAgICAgdmFyIGl0ID0gc2NhbmxpbmUuZmluZEl0ZXIodik7XG4gICAgICAgIHZhciB1O1xuICAgICAgICB3aGlsZSAoKHUgPSBpdFtmb3J3YXJkXSgpKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdmFyIHVvdmVydlggPSB1LnIub3ZlcmxhcFgodi5yKTtcbiAgICAgICAgICAgIGlmICh1b3ZlcnZYIDw9IDAgfHwgdW92ZXJ2WCA8PSB1LnIub3ZlcmxhcFkodi5yKSkge1xuICAgICAgICAgICAgICAgIHZbZm9yd2FyZF0uaW5zZXJ0KHUpO1xuICAgICAgICAgICAgICAgIHVbcmV2ZXJzZV0uaW5zZXJ0KHYpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHVvdmVydlggPD0gMCkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICBmKFwibmV4dFwiLCBcInByZXZcIik7XG4gICAgZihcInByZXZcIiwgXCJuZXh0XCIpO1xufVxuZnVuY3Rpb24gZmluZFlOZWlnaGJvdXJzKHYsIHNjYW5saW5lKSB7XG4gICAgdmFyIGYgPSBmdW5jdGlvbiAoZm9yd2FyZCwgcmV2ZXJzZSkge1xuICAgICAgICB2YXIgdSA9IHNjYW5saW5lLmZpbmRJdGVyKHYpW2ZvcndhcmRdKCk7XG4gICAgICAgIGlmICh1ICE9PSBudWxsICYmIHUuci5vdmVybGFwWCh2LnIpID4gMCkge1xuICAgICAgICAgICAgdltmb3J3YXJkXS5pbnNlcnQodSk7XG4gICAgICAgICAgICB1W3JldmVyc2VdLmluc2VydCh2KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgZihcIm5leHRcIiwgXCJwcmV2XCIpO1xuICAgIGYoXCJwcmV2XCIsIFwibmV4dFwiKTtcbn1cbmZ1bmN0aW9uIGdlbmVyYXRlWENvbnN0cmFpbnRzKHJzLCB2YXJzKSB7XG4gICAgcmV0dXJuIGdlbmVyYXRlQ29uc3RyYWludHMocnMsIHZhcnMsIHhSZWN0LCAxZS02KTtcbn1cbmV4cG9ydHMuZ2VuZXJhdGVYQ29uc3RyYWludHMgPSBnZW5lcmF0ZVhDb25zdHJhaW50cztcbmZ1bmN0aW9uIGdlbmVyYXRlWUNvbnN0cmFpbnRzKHJzLCB2YXJzKSB7XG4gICAgcmV0dXJuIGdlbmVyYXRlQ29uc3RyYWludHMocnMsIHZhcnMsIHlSZWN0LCAxZS02KTtcbn1cbmV4cG9ydHMuZ2VuZXJhdGVZQ29uc3RyYWludHMgPSBnZW5lcmF0ZVlDb25zdHJhaW50cztcbmZ1bmN0aW9uIGdlbmVyYXRlWEdyb3VwQ29uc3RyYWludHMocm9vdCkge1xuICAgIHJldHVybiBnZW5lcmF0ZUdyb3VwQ29uc3RyYWludHMocm9vdCwgeFJlY3QsIDFlLTYpO1xufVxuZXhwb3J0cy5nZW5lcmF0ZVhHcm91cENvbnN0cmFpbnRzID0gZ2VuZXJhdGVYR3JvdXBDb25zdHJhaW50cztcbmZ1bmN0aW9uIGdlbmVyYXRlWUdyb3VwQ29uc3RyYWludHMocm9vdCkge1xuICAgIHJldHVybiBnZW5lcmF0ZUdyb3VwQ29uc3RyYWludHMocm9vdCwgeVJlY3QsIDFlLTYpO1xufVxuZXhwb3J0cy5nZW5lcmF0ZVlHcm91cENvbnN0cmFpbnRzID0gZ2VuZXJhdGVZR3JvdXBDb25zdHJhaW50cztcbmZ1bmN0aW9uIHJlbW92ZU92ZXJsYXBzKHJzKSB7XG4gICAgdmFyIHZzID0gcnMubWFwKGZ1bmN0aW9uIChyKSB7IHJldHVybiBuZXcgdnBzY18xLlZhcmlhYmxlKHIuY3goKSk7IH0pO1xuICAgIHZhciBjcyA9IGdlbmVyYXRlWENvbnN0cmFpbnRzKHJzLCB2cyk7XG4gICAgdmFyIHNvbHZlciA9IG5ldyB2cHNjXzEuU29sdmVyKHZzLCBjcyk7XG4gICAgc29sdmVyLnNvbHZlKCk7XG4gICAgdnMuZm9yRWFjaChmdW5jdGlvbiAodiwgaSkgeyByZXR1cm4gcnNbaV0uc2V0WENlbnRyZSh2LnBvc2l0aW9uKCkpOyB9KTtcbiAgICB2cyA9IHJzLm1hcChmdW5jdGlvbiAocikgeyByZXR1cm4gbmV3IHZwc2NfMS5WYXJpYWJsZShyLmN5KCkpOyB9KTtcbiAgICBjcyA9IGdlbmVyYXRlWUNvbnN0cmFpbnRzKHJzLCB2cyk7XG4gICAgc29sdmVyID0gbmV3IHZwc2NfMS5Tb2x2ZXIodnMsIGNzKTtcbiAgICBzb2x2ZXIuc29sdmUoKTtcbiAgICB2cy5mb3JFYWNoKGZ1bmN0aW9uICh2LCBpKSB7IHJldHVybiByc1tpXS5zZXRZQ2VudHJlKHYucG9zaXRpb24oKSk7IH0pO1xufVxuZXhwb3J0cy5yZW1vdmVPdmVybGFwcyA9IHJlbW92ZU92ZXJsYXBzO1xudmFyIEluZGV4ZWRWYXJpYWJsZSA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKEluZGV4ZWRWYXJpYWJsZSwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBJbmRleGVkVmFyaWFibGUoaW5kZXgsIHcpIHtcbiAgICAgICAgdmFyIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcywgMCwgdykgfHwgdGhpcztcbiAgICAgICAgX3RoaXMuaW5kZXggPSBpbmRleDtcbiAgICAgICAgcmV0dXJuIF90aGlzO1xuICAgIH1cbiAgICByZXR1cm4gSW5kZXhlZFZhcmlhYmxlO1xufSh2cHNjXzEuVmFyaWFibGUpKTtcbmV4cG9ydHMuSW5kZXhlZFZhcmlhYmxlID0gSW5kZXhlZFZhcmlhYmxlO1xudmFyIFByb2plY3Rpb24gPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFByb2plY3Rpb24obm9kZXMsIGdyb3Vwcywgcm9vdEdyb3VwLCBjb25zdHJhaW50cywgYXZvaWRPdmVybGFwcykge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICBpZiAocm9vdEdyb3VwID09PSB2b2lkIDApIHsgcm9vdEdyb3VwID0gbnVsbDsgfVxuICAgICAgICBpZiAoY29uc3RyYWludHMgPT09IHZvaWQgMCkgeyBjb25zdHJhaW50cyA9IG51bGw7IH1cbiAgICAgICAgaWYgKGF2b2lkT3ZlcmxhcHMgPT09IHZvaWQgMCkgeyBhdm9pZE92ZXJsYXBzID0gZmFsc2U7IH1cbiAgICAgICAgdGhpcy5ub2RlcyA9IG5vZGVzO1xuICAgICAgICB0aGlzLmdyb3VwcyA9IGdyb3VwcztcbiAgICAgICAgdGhpcy5yb290R3JvdXAgPSByb290R3JvdXA7XG4gICAgICAgIHRoaXMuYXZvaWRPdmVybGFwcyA9IGF2b2lkT3ZlcmxhcHM7XG4gICAgICAgIHRoaXMudmFyaWFibGVzID0gbm9kZXMubWFwKGZ1bmN0aW9uICh2LCBpKSB7XG4gICAgICAgICAgICByZXR1cm4gdi52YXJpYWJsZSA9IG5ldyBJbmRleGVkVmFyaWFibGUoaSwgMSk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoY29uc3RyYWludHMpXG4gICAgICAgICAgICB0aGlzLmNyZWF0ZUNvbnN0cmFpbnRzKGNvbnN0cmFpbnRzKTtcbiAgICAgICAgaWYgKGF2b2lkT3ZlcmxhcHMgJiYgcm9vdEdyb3VwICYmIHR5cGVvZiByb290R3JvdXAuZ3JvdXBzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgbm9kZXMuZm9yRWFjaChmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgICAgIGlmICghdi53aWR0aCB8fCAhdi5oZWlnaHQpIHtcbiAgICAgICAgICAgICAgICAgICAgdi5ib3VuZHMgPSBuZXcgUmVjdGFuZ2xlKHYueCwgdi54LCB2LnksIHYueSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHcyID0gdi53aWR0aCAvIDIsIGgyID0gdi5oZWlnaHQgLyAyO1xuICAgICAgICAgICAgICAgIHYuYm91bmRzID0gbmV3IFJlY3RhbmdsZSh2LnggLSB3Miwgdi54ICsgdzIsIHYueSAtIGgyLCB2LnkgKyBoMik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbXB1dGVHcm91cEJvdW5kcyhyb290R3JvdXApO1xuICAgICAgICAgICAgdmFyIGkgPSBub2Rlcy5sZW5ndGg7XG4gICAgICAgICAgICBncm91cHMuZm9yRWFjaChmdW5jdGlvbiAoZykge1xuICAgICAgICAgICAgICAgIF90aGlzLnZhcmlhYmxlc1tpXSA9IGcubWluVmFyID0gbmV3IEluZGV4ZWRWYXJpYWJsZShpKyssIHR5cGVvZiBnLnN0aWZmbmVzcyAhPT0gXCJ1bmRlZmluZWRcIiA/IGcuc3RpZmZuZXNzIDogMC4wMSk7XG4gICAgICAgICAgICAgICAgX3RoaXMudmFyaWFibGVzW2ldID0gZy5tYXhWYXIgPSBuZXcgSW5kZXhlZFZhcmlhYmxlKGkrKywgdHlwZW9mIGcuc3RpZmZuZXNzICE9PSBcInVuZGVmaW5lZFwiID8gZy5zdGlmZm5lc3MgOiAwLjAxKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIFByb2plY3Rpb24ucHJvdG90eXBlLmNyZWF0ZVNlcGFyYXRpb24gPSBmdW5jdGlvbiAoYykge1xuICAgICAgICByZXR1cm4gbmV3IHZwc2NfMS5Db25zdHJhaW50KHRoaXMubm9kZXNbYy5sZWZ0XS52YXJpYWJsZSwgdGhpcy5ub2Rlc1tjLnJpZ2h0XS52YXJpYWJsZSwgYy5nYXAsIHR5cGVvZiBjLmVxdWFsaXR5ICE9PSBcInVuZGVmaW5lZFwiID8gYy5lcXVhbGl0eSA6IGZhbHNlKTtcbiAgICB9O1xuICAgIFByb2plY3Rpb24ucHJvdG90eXBlLm1ha2VGZWFzaWJsZSA9IGZ1bmN0aW9uIChjKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIGlmICghdGhpcy5hdm9pZE92ZXJsYXBzKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB2YXIgYXhpcyA9ICd4JywgZGltID0gJ3dpZHRoJztcbiAgICAgICAgaWYgKGMuYXhpcyA9PT0gJ3gnKVxuICAgICAgICAgICAgYXhpcyA9ICd5JywgZGltID0gJ2hlaWdodCc7XG4gICAgICAgIHZhciB2cyA9IGMub2Zmc2V0cy5tYXAoZnVuY3Rpb24gKG8pIHsgcmV0dXJuIF90aGlzLm5vZGVzW28ubm9kZV07IH0pLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGFbYXhpc10gLSBiW2F4aXNdOyB9KTtcbiAgICAgICAgdmFyIHAgPSBudWxsO1xuICAgICAgICB2cy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICBpZiAocCkge1xuICAgICAgICAgICAgICAgIHZhciBuZXh0UG9zID0gcFtheGlzXSArIHBbZGltXTtcbiAgICAgICAgICAgICAgICBpZiAobmV4dFBvcyA+IHZbYXhpc10pIHtcbiAgICAgICAgICAgICAgICAgICAgdltheGlzXSA9IG5leHRQb3M7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcCA9IHY7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgUHJvamVjdGlvbi5wcm90b3R5cGUuY3JlYXRlQWxpZ25tZW50ID0gZnVuY3Rpb24gKGMpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIHUgPSB0aGlzLm5vZGVzW2Mub2Zmc2V0c1swXS5ub2RlXS52YXJpYWJsZTtcbiAgICAgICAgdGhpcy5tYWtlRmVhc2libGUoYyk7XG4gICAgICAgIHZhciBjcyA9IGMuYXhpcyA9PT0gJ3gnID8gdGhpcy54Q29uc3RyYWludHMgOiB0aGlzLnlDb25zdHJhaW50cztcbiAgICAgICAgYy5vZmZzZXRzLnNsaWNlKDEpLmZvckVhY2goZnVuY3Rpb24gKG8pIHtcbiAgICAgICAgICAgIHZhciB2ID0gX3RoaXMubm9kZXNbby5ub2RlXS52YXJpYWJsZTtcbiAgICAgICAgICAgIGNzLnB1c2gobmV3IHZwc2NfMS5Db25zdHJhaW50KHUsIHYsIG8ub2Zmc2V0LCB0cnVlKSk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgUHJvamVjdGlvbi5wcm90b3R5cGUuY3JlYXRlQ29uc3RyYWludHMgPSBmdW5jdGlvbiAoY29uc3RyYWludHMpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIGlzU2VwID0gZnVuY3Rpb24gKGMpIHsgcmV0dXJuIHR5cGVvZiBjLnR5cGUgPT09ICd1bmRlZmluZWQnIHx8IGMudHlwZSA9PT0gJ3NlcGFyYXRpb24nOyB9O1xuICAgICAgICB0aGlzLnhDb25zdHJhaW50cyA9IGNvbnN0cmFpbnRzXG4gICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChjKSB7IHJldHVybiBjLmF4aXMgPT09IFwieFwiICYmIGlzU2VwKGMpOyB9KVxuICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAoYykgeyByZXR1cm4gX3RoaXMuY3JlYXRlU2VwYXJhdGlvbihjKTsgfSk7XG4gICAgICAgIHRoaXMueUNvbnN0cmFpbnRzID0gY29uc3RyYWludHNcbiAgICAgICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKGMpIHsgcmV0dXJuIGMuYXhpcyA9PT0gXCJ5XCIgJiYgaXNTZXAoYyk7IH0pXG4gICAgICAgICAgICAubWFwKGZ1bmN0aW9uIChjKSB7IHJldHVybiBfdGhpcy5jcmVhdGVTZXBhcmF0aW9uKGMpOyB9KTtcbiAgICAgICAgY29uc3RyYWludHNcbiAgICAgICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKGMpIHsgcmV0dXJuIGMudHlwZSA9PT0gJ2FsaWdubWVudCc7IH0pXG4gICAgICAgICAgICAuZm9yRWFjaChmdW5jdGlvbiAoYykgeyByZXR1cm4gX3RoaXMuY3JlYXRlQWxpZ25tZW50KGMpOyB9KTtcbiAgICB9O1xuICAgIFByb2plY3Rpb24ucHJvdG90eXBlLnNldHVwVmFyaWFibGVzQW5kQm91bmRzID0gZnVuY3Rpb24gKHgwLCB5MCwgZGVzaXJlZCwgZ2V0RGVzaXJlZCkge1xuICAgICAgICB0aGlzLm5vZGVzLmZvckVhY2goZnVuY3Rpb24gKHYsIGkpIHtcbiAgICAgICAgICAgIGlmICh2LmZpeGVkKSB7XG4gICAgICAgICAgICAgICAgdi52YXJpYWJsZS53ZWlnaHQgPSB2LmZpeGVkV2VpZ2h0ID8gdi5maXhlZFdlaWdodCA6IDEwMDA7XG4gICAgICAgICAgICAgICAgZGVzaXJlZFtpXSA9IGdldERlc2lyZWQodik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB2LnZhcmlhYmxlLndlaWdodCA9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgdyA9ICh2LndpZHRoIHx8IDApIC8gMiwgaCA9ICh2LmhlaWdodCB8fCAwKSAvIDI7XG4gICAgICAgICAgICB2YXIgaXggPSB4MFtpXSwgaXkgPSB5MFtpXTtcbiAgICAgICAgICAgIHYuYm91bmRzID0gbmV3IFJlY3RhbmdsZShpeCAtIHcsIGl4ICsgdywgaXkgLSBoLCBpeSArIGgpO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIFByb2plY3Rpb24ucHJvdG90eXBlLnhQcm9qZWN0ID0gZnVuY3Rpb24gKHgwLCB5MCwgeCkge1xuICAgICAgICBpZiAoIXRoaXMucm9vdEdyb3VwICYmICEodGhpcy5hdm9pZE92ZXJsYXBzIHx8IHRoaXMueENvbnN0cmFpbnRzKSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5wcm9qZWN0KHgwLCB5MCwgeDAsIHgsIGZ1bmN0aW9uICh2KSB7IHJldHVybiB2LnB4OyB9LCB0aGlzLnhDb25zdHJhaW50cywgZ2VuZXJhdGVYR3JvdXBDb25zdHJhaW50cywgZnVuY3Rpb24gKHYpIHsgcmV0dXJuIHYuYm91bmRzLnNldFhDZW50cmUoeFt2LnZhcmlhYmxlLmluZGV4XSA9IHYudmFyaWFibGUucG9zaXRpb24oKSk7IH0sIGZ1bmN0aW9uIChnKSB7XG4gICAgICAgICAgICB2YXIgeG1pbiA9IHhbZy5taW5WYXIuaW5kZXhdID0gZy5taW5WYXIucG9zaXRpb24oKTtcbiAgICAgICAgICAgIHZhciB4bWF4ID0geFtnLm1heFZhci5pbmRleF0gPSBnLm1heFZhci5wb3NpdGlvbigpO1xuICAgICAgICAgICAgdmFyIHAyID0gZy5wYWRkaW5nIC8gMjtcbiAgICAgICAgICAgIGcuYm91bmRzLnggPSB4bWluIC0gcDI7XG4gICAgICAgICAgICBnLmJvdW5kcy5YID0geG1heCArIHAyO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIFByb2plY3Rpb24ucHJvdG90eXBlLnlQcm9qZWN0ID0gZnVuY3Rpb24gKHgwLCB5MCwgeSkge1xuICAgICAgICBpZiAoIXRoaXMucm9vdEdyb3VwICYmICF0aGlzLnlDb25zdHJhaW50cylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5wcm9qZWN0KHgwLCB5MCwgeTAsIHksIGZ1bmN0aW9uICh2KSB7IHJldHVybiB2LnB5OyB9LCB0aGlzLnlDb25zdHJhaW50cywgZ2VuZXJhdGVZR3JvdXBDb25zdHJhaW50cywgZnVuY3Rpb24gKHYpIHsgcmV0dXJuIHYuYm91bmRzLnNldFlDZW50cmUoeVt2LnZhcmlhYmxlLmluZGV4XSA9IHYudmFyaWFibGUucG9zaXRpb24oKSk7IH0sIGZ1bmN0aW9uIChnKSB7XG4gICAgICAgICAgICB2YXIgeW1pbiA9IHlbZy5taW5WYXIuaW5kZXhdID0gZy5taW5WYXIucG9zaXRpb24oKTtcbiAgICAgICAgICAgIHZhciB5bWF4ID0geVtnLm1heFZhci5pbmRleF0gPSBnLm1heFZhci5wb3NpdGlvbigpO1xuICAgICAgICAgICAgdmFyIHAyID0gZy5wYWRkaW5nIC8gMjtcbiAgICAgICAgICAgIGcuYm91bmRzLnkgPSB5bWluIC0gcDI7XG4gICAgICAgICAgICA7XG4gICAgICAgICAgICBnLmJvdW5kcy5ZID0geW1heCArIHAyO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIFByb2plY3Rpb24ucHJvdG90eXBlLnByb2plY3RGdW5jdGlvbnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICBmdW5jdGlvbiAoeDAsIHkwLCB4KSB7IHJldHVybiBfdGhpcy54UHJvamVjdCh4MCwgeTAsIHgpOyB9LFxuICAgICAgICAgICAgZnVuY3Rpb24gKHgwLCB5MCwgeSkgeyByZXR1cm4gX3RoaXMueVByb2plY3QoeDAsIHkwLCB5KTsgfVxuICAgICAgICBdO1xuICAgIH07XG4gICAgUHJvamVjdGlvbi5wcm90b3R5cGUucHJvamVjdCA9IGZ1bmN0aW9uICh4MCwgeTAsIHN0YXJ0LCBkZXNpcmVkLCBnZXREZXNpcmVkLCBjcywgZ2VuZXJhdGVDb25zdHJhaW50cywgdXBkYXRlTm9kZUJvdW5kcywgdXBkYXRlR3JvdXBCb3VuZHMpIHtcbiAgICAgICAgdGhpcy5zZXR1cFZhcmlhYmxlc0FuZEJvdW5kcyh4MCwgeTAsIGRlc2lyZWQsIGdldERlc2lyZWQpO1xuICAgICAgICBpZiAodGhpcy5yb290R3JvdXAgJiYgdGhpcy5hdm9pZE92ZXJsYXBzKSB7XG4gICAgICAgICAgICBjb21wdXRlR3JvdXBCb3VuZHModGhpcy5yb290R3JvdXApO1xuICAgICAgICAgICAgY3MgPSBjcy5jb25jYXQoZ2VuZXJhdGVDb25zdHJhaW50cyh0aGlzLnJvb3RHcm91cCkpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc29sdmUodGhpcy52YXJpYWJsZXMsIGNzLCBzdGFydCwgZGVzaXJlZCk7XG4gICAgICAgIHRoaXMubm9kZXMuZm9yRWFjaCh1cGRhdGVOb2RlQm91bmRzKTtcbiAgICAgICAgaWYgKHRoaXMucm9vdEdyb3VwICYmIHRoaXMuYXZvaWRPdmVybGFwcykge1xuICAgICAgICAgICAgdGhpcy5ncm91cHMuZm9yRWFjaCh1cGRhdGVHcm91cEJvdW5kcyk7XG4gICAgICAgICAgICBjb21wdXRlR3JvdXBCb3VuZHModGhpcy5yb290R3JvdXApO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBQcm9qZWN0aW9uLnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uICh2cywgY3MsIHN0YXJ0aW5nLCBkZXNpcmVkKSB7XG4gICAgICAgIHZhciBzb2x2ZXIgPSBuZXcgdnBzY18xLlNvbHZlcih2cywgY3MpO1xuICAgICAgICBzb2x2ZXIuc2V0U3RhcnRpbmdQb3NpdGlvbnMoc3RhcnRpbmcpO1xuICAgICAgICBzb2x2ZXIuc2V0RGVzaXJlZFBvc2l0aW9ucyhkZXNpcmVkKTtcbiAgICAgICAgc29sdmVyLnNvbHZlKCk7XG4gICAgfTtcbiAgICByZXR1cm4gUHJvamVjdGlvbjtcbn0oKSk7XG5leHBvcnRzLlByb2plY3Rpb24gPSBQcm9qZWN0aW9uO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKbWFXeGxJam9pY21WamRHRnVaMnhsTG1weklpd2ljMjkxY21ObFVtOXZkQ0k2SWlJc0luTnZkWEpqWlhNaU9sc2lMaTR2TGk0dlYyVmlRMjlzWVM5emNtTXZjbVZqZEdGdVoyeGxMblJ6SWwwc0ltNWhiV1Z6SWpwYlhTd2liV0Z3Y0dsdVozTWlPaUk3T3pzN096czdPenM3T3pzN096dEJRVUZCTEN0Q1FVRnRSRHRCUVVOdVJDeHRRMEZCSzBJN1FVRnJRak5DTEZOQlFXZENMR3RDUVVGclFpeERRVUZETEVOQlFXdENPMGxCUTJwRUxFTkJRVU1zUTBGQlF5eE5RVUZOTEVkQlFVY3NUMEZCVHl4RFFVRkRMRU5CUVVNc1RVRkJUU3hMUVVGTExGZEJRVmNzUTBGQlF5eERRVUZETzFGQlEzaERMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU1zVFVGQlRTeERRVUZETEZWQlFVTXNRMEZCV1N4RlFVRkZMRU5CUVVNc1NVRkJTeXhQUVVGQkxFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGcVFpeERRVUZwUWl4RlFVRkZMRk5CUVZNc1EwRkJReXhMUVVGTExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdVVUZETlVVc1UwRkJVeXhEUVVGRExFdEJRVXNzUlVGQlJTeERRVUZETzBsQlEzUkNMRWxCUVVrc1QwRkJUeXhEUVVGRExFTkJRVU1zVFVGQlRTeExRVUZMTEZkQlFWYzdVVUZETDBJc1EwRkJReXhEUVVGRExFMUJRVTBzUjBGQll5eERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRTFCUVUwc1EwRkJReXhWUVVGRExFTkJRVmtzUlVGQlJTeERRVUZETEVsQlFVc3NUMEZCUVN4clFrRkJhMElzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVGxDTEVOQlFUaENMRVZCUVVVc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETzBsQlEzcEhMRU5CUVVNc1EwRkJReXhOUVVGTkxFZEJRVWNzUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4UFFVRlBMRU5CUVVNc1EwRkJReXhEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETzBsQlEzWkRMRTlCUVU4c1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF6dEJRVU53UWl4RFFVRkRPMEZCVWtRc1owUkJVVU03UVVGRlJEdEpRVU5KTEcxQ1FVTlhMRU5CUVZNc1JVRkRWQ3hEUVVGVExFVkJRMVFzUTBGQlV5eEZRVU5VTEVOQlFWTTdVVUZJVkN4TlFVRkRMRWRCUVVRc1EwRkJReXhEUVVGUk8xRkJRMVFzVFVGQlF5eEhRVUZFTEVOQlFVTXNRMEZCVVR0UlFVTlVMRTFCUVVNc1IwRkJSQ3hEUVVGRExFTkJRVkU3VVVGRFZDeE5RVUZETEVkQlFVUXNRMEZCUXl4RFFVRlJPMGxCUVVrc1EwRkJRenRKUVVWc1FpeGxRVUZMTEVkQlFWb3NZMEZCTkVJc1QwRkJUeXhKUVVGSkxGTkJRVk1zUTBGQlF5eE5RVUZOTEVOQlFVTXNhVUpCUVdsQ0xFVkJRVVVzVFVGQlRTeERRVUZETEdsQ1FVRnBRaXhGUVVGRkxFMUJRVTBzUTBGQlF5eHBRa0ZCYVVJc1JVRkJSU3hOUVVGTkxFTkJRVU1zYVVKQlFXbENMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03U1VGRk0wb3NjMEpCUVVVc1IwRkJSaXhqUVVGbExFOUJRVThzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMGxCUlRsRExITkNRVUZGTEVkQlFVWXNZMEZCWlN4UFFVRlBMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dEpRVVU1UXl3MFFrRkJVU3hIUVVGU0xGVkJRVk1zUTBGQldUdFJRVU5xUWl4SlFVRkpMRVZCUVVVc1IwRkJSeXhKUVVGSkxFTkJRVU1zUlVGQlJTeEZRVUZGTEVWQlFVVXNSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF6dFJRVU5vUXl4SlFVRkpMRVZCUVVVc1NVRkJTU3hGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1EwRkJRenRaUVVGRkxFOUJRVThzU1VGQlNTeERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRMnhFTEVsQlFVa3NSVUZCUlN4SlFVRkpMRVZCUVVVc1NVRkJTU3hKUVVGSkxFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUVVVc1QwRkJUeXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRiRVFzVDBGQlR5eERRVUZETEVOQlFVTTdTVUZEWWl4RFFVRkRPMGxCUlVRc05FSkJRVkVzUjBGQlVpeFZRVUZUTEVOQlFWazdVVUZEYWtJc1NVRkJTU3hGUVVGRkxFZEJRVWNzU1VGQlNTeERRVUZETEVWQlFVVXNSVUZCUlN4RlFVRkZMRVZCUVVVc1IwRkJSeXhEUVVGRExFTkJRVU1zUlVGQlJTeEZRVUZGTEVOQlFVTTdVVUZEYUVNc1NVRkJTU3hGUVVGRkxFbEJRVWtzUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFTkJRVU03V1VGQlJTeFBRVUZQTEVsQlFVa3NRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU5zUkN4SlFVRkpMRVZCUVVVc1NVRkJTU3hGUVVGRkxFbEJRVWtzU1VGQlNTeERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVGRkxFOUJRVThzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRMnhFTEU5QlFVOHNRMEZCUXl4RFFVRkRPMGxCUTJJc1EwRkJRenRKUVVWRUxEaENRVUZWTEVkQlFWWXNWVUZCVnl4RlFVRlZPMUZCUTJwQ0xFbEJRVWtzUlVGQlJTeEhRVUZITEVWQlFVVXNSMEZCUnl4SlFVRkpMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU03VVVGRGVFSXNTVUZCU1N4RFFVRkRMRU5CUVVNc1NVRkJTU3hGUVVGRkxFTkJRVU03VVVGRFlpeEpRVUZKTEVOQlFVTXNRMEZCUXl4SlFVRkpMRVZCUVVVc1EwRkJRenRKUVVOcVFpeERRVUZETzBsQlJVUXNPRUpCUVZVc1IwRkJWaXhWUVVGWExFVkJRVlU3VVVGRGFrSXNTVUZCU1N4RlFVRkZMRWRCUVVjc1JVRkJSU3hIUVVGSExFbEJRVWtzUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXp0UlFVTjRRaXhKUVVGSkxFTkJRVU1zUTBGQlF5eEpRVUZKTEVWQlFVVXNRMEZCUXp0UlFVTmlMRWxCUVVrc1EwRkJReXhEUVVGRExFbEJRVWtzUlVGQlJTeERRVUZETzBsQlEycENMRU5CUVVNN1NVRkZSQ3g1UWtGQlN5eEhRVUZNTzFGQlEwa3NUMEZCVHl4SlFVRkpMRU5CUVVNc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTTdTVUZETTBJc1EwRkJRenRKUVVWRUxEQkNRVUZOTEVkQlFVNDdVVUZEU1N4UFFVRlBMRWxCUVVrc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXp0SlFVTXpRaXhEUVVGRE8wbEJSVVFzZVVKQlFVc3NSMEZCVEN4VlFVRk5MRU5CUVZrN1VVRkRaQ3hQUVVGUExFbEJRVWtzVTBGQlV5eERRVUZETEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dEpRVU55U0N4RFFVRkRPMGxCVjBRc2NVTkJRV2xDTEVkQlFXcENMRlZCUVd0Q0xFVkJRVlVzUlVGQlJTeEZRVUZWTEVWQlFVVXNSVUZCVlN4RlFVRkZMRVZCUVZVN1VVRkROVVFzU1VGQlNTeExRVUZMTEVkQlFVY3NRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTXNSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJReXhGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEY2tNc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRMRVZCUVVVc1NVRkJTU3hEUVVGRExFTkJRVU1zUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTJoRExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJReXhGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETEVWQlFVVXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVOd1F5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRVZCUVVVc1NVRkJTU3hEUVVGRExFTkJRVU1zUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXl4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlEzUkRMRWxCUVVrc1lVRkJZU3hIUVVGSExFVkJRVVVzUTBGQlF6dFJRVU4yUWl4TFFVRkxMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJReXhGUVVGRk8xbEJRM2hDTEVsQlFVa3NRMEZCUXl4SFFVRkhMRk5CUVZNc1EwRkJReXhuUWtGQlowSXNRMEZCUXl4RlFVRkZMRVZCUVVVc1JVRkJSU3hGUVVGRkxFVkJRVVVzUlVGQlJTeEZRVUZGTEVWQlFVVXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGRrY3NTVUZCU1N4RFFVRkRMRXRCUVVzc1NVRkJTVHRuUWtGQlJTeGhRVUZoTEVOQlFVTXNTVUZCU1N4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETzFOQlF6RkVPMUZCUTBRc1QwRkJUeXhoUVVGaExFTkJRVU03U1VGRGVrSXNRMEZCUXp0SlFWVkVMRzFEUVVGbExFZEJRV1lzVlVGQlowSXNSVUZCVlN4RlFVRkZMRVZCUVZVN1VVRkRiRU1zU1VGQlNTeEpRVUZKTEVkQlFVY3NTVUZCU1N4RFFVRkRMR2xDUVVGcFFpeERRVUZETEVsQlFVa3NRMEZCUXl4RlFVRkZMRVZCUVVVc1JVRkJSU3hKUVVGSkxFTkJRVU1zUlVGQlJTeEZRVUZGTEVWQlFVVXNSVUZCUlN4RlFVRkZMRVZCUVVVc1EwRkJReXhEUVVGRE8xRkJRMmhGTEU5QlFVOHNTVUZCU1N4RFFVRkRMRTFCUVUwc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETzBsQlF6VkRMRU5CUVVNN1NVRkZSQ3cwUWtGQlVTeEhRVUZTTzFGQlEwa3NUMEZCVHp0WlFVTklMRVZCUVVVc1EwRkJReXhGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRExFVkJRVVU3V1VGRGVFSXNSVUZCUlN4RFFVRkRMRVZCUVVVc1NVRkJTU3hEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNTVUZCU1N4RFFVRkRMRU5CUVVNc1JVRkJSVHRaUVVONFFpeEZRVUZGTEVOQlFVTXNSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXl4RlFVRkZPMWxCUTNoQ0xFVkJRVVVzUTBGQlF5eEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETEVWQlFVVTdVMEZCUXl4RFFVRkRPMGxCUTJ4RExFTkJRVU03U1VGRlRTd3dRa0ZCWjBJc1IwRkJka0lzVlVGRFNTeEZRVUZWTEVWQlFVVXNSVUZCVlN4RlFVTjBRaXhGUVVGVkxFVkJRVVVzUlVGQlZTeEZRVU4wUWl4RlFVRlZMRVZCUVVVc1JVRkJWU3hGUVVOMFFpeEZRVUZWTEVWQlFVVXNSVUZCVlR0UlFVTjBRaXhKUVVGSkxFbEJRVWtzUjBGQlJ5eEZRVUZGTEVkQlFVY3NSVUZCUlN4RlFVRkZMRWxCUVVrc1IwRkJSeXhGUVVGRkxFZEJRVWNzUlVGQlJTeEZRVU01UWl4SlFVRkpMRWRCUVVjc1JVRkJSU3hIUVVGSExFVkJRVVVzUlVGQlJTeEpRVUZKTEVkQlFVY3NSVUZCUlN4SFFVRkhMRVZCUVVVc1JVRkRPVUlzVjBGQlZ5eEhRVUZITEVsQlFVa3NSMEZCUnl4SlFVRkpMRWRCUVVjc1NVRkJTU3hIUVVGSExFbEJRVWtzUTBGQlF6dFJRVU0xUXl4SlFVRkpMRmRCUVZjc1NVRkJTU3hEUVVGRE8xbEJRVVVzVDBGQlR5eEpRVUZKTEVOQlFVTTdVVUZEYkVNc1NVRkJTU3hKUVVGSkxFZEJRVWNzUlVGQlJTeEhRVUZITEVWQlFVVXNSVUZCUlN4SlFVRkpMRWRCUVVjc1JVRkJSU3hIUVVGSExFVkJRVVVzUlVGRE9VSXNTVUZCU1N4SFFVRkhMRWxCUVVrc1IwRkJSeXhKUVVGSkxFZEJRVWNzU1VGQlNTeEhRVUZITEVsQlFVa3NSVUZEYUVNc1EwRkJReXhIUVVGSExFbEJRVWtzUjBGQlJ5eFhRVUZYTEVWQlEzUkNMRWxCUVVrc1IwRkJSeXhKUVVGSkxFZEJRVWNzU1VGQlNTeEhRVUZITEVsQlFVa3NSMEZCUnl4SlFVRkpMRVZCUTJoRExFTkJRVU1zUjBGQlJ5eEpRVUZKTEVkQlFVY3NWMEZCVnl4RFFVRkRPMUZCUXpOQ0xFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1JVRkJSVHRaUVVOMFF5eFBRVUZQTzJkQ1FVTklMRU5CUVVNc1JVRkJSU3hGUVVGRkxFZEJRVWNzUTBGQlF5eEhRVUZITEVsQlFVazdaMEpCUTJoQ0xFTkJRVU1zUlVGQlJTeEZRVUZGTEVkQlFVY3NRMEZCUXl4SFFVRkhMRWxCUVVrN1lVRkRia0lzUTBGQlF6dFRRVU5NTzFGQlEwUXNUMEZCVHl4SlFVRkpMRU5CUVVNN1NVRkRhRUlzUTBGQlF6dEpRVVZFTERKQ1FVRlBMRWRCUVZBc1ZVRkJVU3hIUVVGWE8xRkJRMllzVDBGQlR5eEpRVUZKTEZOQlFWTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhIUVVGSExFZEJRVWNzUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXl4SFFVRkhMRWRCUVVjc1JVRkJSU3hKUVVGSkxFTkJRVU1zUTBGQlF5eEhRVUZITEVkQlFVY3NSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJReXhIUVVGSExFZEJRVWNzUTBGQlF5eERRVUZETzBsQlEycEdMRU5CUVVNN1NVRkRUQ3huUWtGQlF6dEJRVUZFTEVOQlFVTXNRVUY0U0VRc1NVRjNTRU03UVVGNFNGa3NPRUpCUVZNN1FVRnhTWFJDTEZOQlFXZENMR1ZCUVdVc1EwRkJReXhOUVVGcFFpeEZRVUZGTEUxQlFXbENMRVZCUVVVc1JVRkJWVHRKUVVVMVJTeEpRVUZOTEVWQlFVVXNSMEZCUnl4TlFVRk5MRU5CUVVNc1pVRkJaU3hEUVVGRExFMUJRVTBzUTBGQlF5eEZRVUZGTEVWQlFVVXNSVUZCUlN4TlFVRk5MRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU1zU1VGQlNTeEZRVUZGTEVOQlFVTXNSVUZCUlN4TlFVRk5MRU5CUVVNc1JVRkJSU3hGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTEUxQlFVMHNRMEZCUXl4RlFVRkZMRVZCUVVVc1JVRkJSU3hGUVVNM1JpeEZRVUZGTEVkQlFVY3NUVUZCVFN4RFFVRkRMR1ZCUVdVc1EwRkJReXhOUVVGTkxFTkJRVU1zUlVGQlJTeEZRVUZGTEVWQlFVVXNUVUZCVFN4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRExFbEJRVWtzUlVGQlJTeERRVUZETEVWQlFVVXNUVUZCVFN4RFFVRkRMRVZCUVVVc1JVRkJSU3hGUVVGRkxFTkJRVU1zUlVGQlJTeE5RVUZOTEVOQlFVTXNSVUZCUlN4RlFVRkZMRVZCUVVVc1JVRkRNMFlzUlVGQlJTeEhRVUZITEVWQlFVVXNRMEZCUXl4RFFVRkRMRWRCUVVjc1JVRkJSU3hEUVVGRExFTkJRVU1zUlVGRGFFSXNSVUZCUlN4SFFVRkhMRVZCUVVVc1EwRkJReXhEUVVGRExFZEJRVWNzUlVGQlJTeERRVUZETEVOQlFVTXNSVUZEYUVJc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNSVUZCUlN4SFFVRkhMRVZCUVVVc1IwRkJSeXhGUVVGRkxFZEJRVWNzUlVGQlJTeERRVUZETEVWQlFVVXNSVUZCUlN4SFFVRkhMRU5CUVVNc1IwRkJSeXhGUVVGRkxFTkJRVU03U1VGRGJFUXNUMEZCVHp0UlFVTklMR3RDUVVGclFpeEZRVUZGTEVWQlFVVTdVVUZEZEVJc2EwSkJRV3RDTEVWQlFVVXNSVUZCUlR0UlFVTjBRaXhWUVVGVkxFVkJRVVVzUlVGQlJTeERRVUZETEVWQlFVVXNSVUZCUlN4RFFVRkRMRU5CUVVNc1IwRkJSeXhGUVVGRkxFZEJRVWNzUlVGQlJTeEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVkQlFVY3NSVUZCUlN4SFFVRkhMRU5CUVVNc1JVRkJSVHRMUVVNdlJDeERRVUZCTzBGQlEwd3NRMEZCUXp0QlFWcEVMREJEUVZsRE8wRkJWMFFzVTBGQlowSXNWVUZCVlN4RFFVRkRMRU5CUVRKQ0xFVkJRVVVzVFVGQmFVSXNSVUZCUlN4RlFVRlZPMGxCUTJwR0xFbEJRVWtzUlVGQlJTeEhRVUZITEUxQlFVMHNRMEZCUXl4bFFVRmxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRNVU1zU1VGQlNTeERRVUZETEVWQlFVVTdVVUZCUlN4RlFVRkZMRWRCUVVjc1JVRkJSU3hEUVVGRExFVkJRVVVzVFVGQlRTeERRVUZETEVWQlFVVXNSVUZCUlN4RlFVRkZMRU5CUVVNc1JVRkJSU3hOUVVGTkxFTkJRVU1zUlVGQlJTeEZRVUZGTEVWQlFVVXNRMEZCUXp0SlFVTnFSQ3hKUVVGSkxFVkJRVVVzUjBGQlJ5eEZRVUZGTEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRMllzUlVGQlJTeEhRVUZITEVWQlFVVXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGRFppeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhGUVVGRkxFZEJRVWNzUlVGQlJTeEhRVUZITEVWQlFVVXNSMEZCUnl4RlFVRkZMRU5CUVVNc1EwRkJRenRKUVVOeVF5eFBRVUZQTEVWQlFVVXNRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJReXhEUVVGRExFZEJRVWNzUlVGQlJTeEhRVUZITEVWQlFVVXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETEVkQlFVY3NSVUZCUlN4SFFVRkhMRVZCUVVVc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF6dEJRVU0xUkN4RFFVRkRPMEZCVUVRc1owTkJUME03UVVGRlJEdEpRVWxKTEdOQlFXMUNMRU5CUVZjc1JVRkJVeXhEUVVGWkxFVkJRVk1zUjBGQlZ6dFJRVUZ3UkN4TlFVRkRMRWRCUVVRc1EwRkJReXhEUVVGVk8xRkJRVk1zVFVGQlF5eEhRVUZFTEVOQlFVTXNRMEZCVnp0UlFVRlRMRkZCUVVjc1IwRkJTQ3hIUVVGSExFTkJRVkU3VVVGRGJrVXNTVUZCU1N4RFFVRkRMRWxCUVVrc1IwRkJSeXhWUVVGVkxFVkJRVVVzUTBGQlF6dFJRVU42UWl4SlFVRkpMRU5CUVVNc1NVRkJTU3hIUVVGSExGVkJRVlVzUlVGQlJTeERRVUZETzBsQlF6ZENMRU5CUVVNN1NVRkRUQ3hYUVVGRE8wRkJRVVFzUTBGQlF5eEJRVkpFTEVsQlVVTTdRVUZGUkR0SlFVTkpMR1ZCUVcxQ0xFMUJRV1VzUlVGQlV5eERRVUZQTEVWQlFWTXNSMEZCVnp0UlFVRnVSQ3hYUVVGTkxFZEJRVTRzVFVGQlRTeERRVUZUTzFGQlFWTXNUVUZCUXl4SFFVRkVMRU5CUVVNc1EwRkJUVHRSUVVGVExGRkJRVWNzUjBGQlNDeEhRVUZITEVOQlFWRTdTVUZCUnl4RFFVRkRPMGxCUXpsRkxGbEJRVU03UVVGQlJDeERRVUZETEVGQlJrUXNTVUZGUXp0QlFVVkVMRk5CUVZNc1lVRkJZU3hEUVVGRExFTkJRVkVzUlVGQlJTeERRVUZSTzBsQlEzSkRMRWxCUVVrc1EwRkJReXhEUVVGRExFZEJRVWNzUjBGQlJ5eERRVUZETEVOQlFVTXNSMEZCUnl4RlFVRkZPMUZCUTJZc1QwRkJUeXhEUVVGRExFTkJRVU03UzBGRFdqdEpRVU5FTEVsQlFVa3NRMEZCUXl4RFFVRkRMRWRCUVVjc1IwRkJSeXhEUVVGRExFTkJRVU1zUjBGQlJ5eEZRVUZGTzFGQlEyWXNUMEZCVHl4RFFVRkRMRU5CUVVNc1EwRkJRenRMUVVOaU8wbEJRMFFzU1VGQlNTeERRVUZETEVOQlFVTXNUVUZCVFN4RlFVRkZPMUZCUlZZc1QwRkJUeXhEUVVGRExFTkJRVU1zUTBGQlF6dExRVU5pTzBsQlEwUXNTVUZCU1N4RFFVRkRMRU5CUVVNc1RVRkJUU3hGUVVGRk8xRkJSVllzVDBGQlR5eERRVUZETEVOQlFVTTdTMEZEV2p0SlFVTkVMRTlCUVU4c1EwRkJReXhEUVVGRE8wRkJRMklzUTBGQlF6dEJRVVZFTEZOQlFWTXNWVUZCVlR0SlFVTm1MRTlCUVU4c1NVRkJTU3hsUVVGTkxFTkJRVThzVlVGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4SlFVRkxMRTlCUVVFc1EwRkJReXhEUVVGRExFZEJRVWNzUjBGQlJ5eERRVUZETEVOQlFVTXNSMEZCUnl4RlFVRmlMRU5CUVdFc1EwRkJReXhEUVVGRE8wRkJRM0pFTEVOQlFVTTdRVUZYUkN4SlFVRkpMRXRCUVVzc1IwRkJhMEk3U1VGRGRrSXNVMEZCVXl4RlFVRkZMRlZCUVVFc1EwRkJReXhKUVVGSExFOUJRVUVzUTBGQlF5eERRVUZETEVWQlFVVXNSVUZCUlN4RlFVRk9MRU5CUVUwN1NVRkRja0lzVDBGQlR5eEZRVUZGTEZWQlFVRXNRMEZCUXl4SlFVRkhMRTlCUVVFc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlNDeERRVUZITzBsQlEyaENMRkZCUVZFc1JVRkJSU3hWUVVGQkxFTkJRVU1zU1VGQlJ5eFBRVUZCTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVnc1EwRkJSenRKUVVOcVFpeFBRVUZQTEVWQlFVVXNWVUZCUVN4RFFVRkRMRWxCUVVjc1QwRkJRU3hEUVVGRExFTkJRVU1zUzBGQlN5eEZRVUZGTEVWQlFWUXNRMEZCVXp0SlFVTjBRaXhSUVVGUkxFVkJRVVVzVlVGQlF5eEpRVUZKTEVWQlFVVXNTMEZCU3l4RlFVRkZMRTFCUVUwc1JVRkJSU3hKUVVGSkxFbEJRVXNzVDBGQlFTeEpRVUZKTEZOQlFWTXNRMEZCUXl4TlFVRk5MRWRCUVVjc1NVRkJTU3hIUVVGSExFTkJRVU1zUlVGQlJTeE5RVUZOTEVkQlFVY3NTVUZCU1N4SFFVRkhMRU5CUVVNc1JVRkJSU3hKUVVGSkxFVkJRVVVzUzBGQlN5eERRVUZETEVWQlFXaEZMRU5CUVdkRk8wbEJRM3BITEdOQlFXTXNSVUZCUlN4bFFVRmxPME5CUTJ4RExFTkJRVU03UVVGRlJpeEpRVUZKTEV0QlFVc3NSMEZCYTBJN1NVRkRka0lzVTBGQlV5eEZRVUZGTEZWQlFVRXNRMEZCUXl4SlFVRkhMRTlCUVVFc1EwRkJReXhEUVVGRExFVkJRVVVzUlVGQlJTeEZRVUZPTEVOQlFVMDdTVUZEY2tJc1QwRkJUeXhGUVVGRkxGVkJRVUVzUTBGQlF5eEpRVUZITEU5QlFVRXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJTQ3hEUVVGSE8wbEJRMmhDTEZGQlFWRXNSVUZCUlN4VlFVRkJMRU5CUVVNc1NVRkJSeXhQUVVGQkxFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVZ3NRMEZCUnp0SlFVTnFRaXhQUVVGUExFVkJRVVVzVlVGQlFTeERRVUZETEVsQlFVY3NUMEZCUVN4RFFVRkRMRU5CUVVNc1RVRkJUU3hGUVVGRkxFVkJRVllzUTBGQlZUdEpRVU4yUWl4UlFVRlJMRVZCUVVVc1ZVRkJReXhKUVVGSkxFVkJRVVVzUzBGQlN5eEZRVUZGTEUxQlFVMHNSVUZCUlN4SlFVRkpMRWxCUVVzc1QwRkJRU3hKUVVGSkxGTkJRVk1zUTBGQlF5eEpRVUZKTEVWQlFVVXNTMEZCU3l4RlFVRkZMRTFCUVUwc1IwRkJSeXhKUVVGSkxFZEJRVWNzUTBGQlF5eEZRVUZGTEUxQlFVMHNSMEZCUnl4SlFVRkpMRWRCUVVjc1EwRkJReXhEUVVGRExFVkJRV2hGTEVOQlFXZEZPMGxCUTNwSExHTkJRV01zUlVGQlJTeGxRVUZsTzBOQlEyeERMRU5CUVVNN1FVRkZSaXhUUVVGVExIZENRVUYzUWl4RFFVRkRMRWxCUVhGQ0xFVkJRVVVzUTBGQlowSXNSVUZCUlN4TlFVRmpMRVZCUVVVc1YwRkJORUk3U1VGQk5VSXNORUpCUVVFc1JVRkJRU3h0UWtGQk5FSTdTVUZGYmtnc1NVRkJTU3hQUVVGUExFZEJRVWNzU1VGQlNTeERRVUZETEU5QlFVOHNSVUZEZEVJc1JVRkJSU3hIUVVGSExFOUJRVThzU1VGQlNTeERRVUZETEUxQlFVMHNTMEZCU3l4WFFVRlhMRU5CUVVNc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRMmhGTEVWQlFVVXNSMEZCUnl4UFFVRlBMRWxCUVVrc1EwRkJReXhOUVVGTkxFdEJRVXNzVjBGQlZ5eERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVTm9SU3huUWtGQlowSXNSMEZCYVVJc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVTdVVUZEZWtNc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNUVUZCVFN4RFFVRkRMRlZCUVVNc1IwRkJhVUlzUlVGQlJTeERRVUZETEVsQlFVc3NUMEZCUVN4SFFVRkhMRU5CUVVNc1RVRkJUU3hEUVVGRExIZENRVUYzUWl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzVFVGQlRTeEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRMRVZCUVhoRUxFTkJRWGRFTEVWQlFVVXNSVUZCUlN4RFFVRkRMRVZCUXpWSExFTkJRVU1zUjBGQlJ5eERRVUZETEZkQlFWY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RlFVRkZMRWRCUVVjc1JVRkJSU3hGUVVOdVF5eEZRVUZGTEVkQlFXVXNTVUZCU1N4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRemRDTEVWQlFVVXNSMEZCWjBJc1NVRkJTU3hMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlF6bENMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRMHdzUjBGQlJ5eEhRVUZITEZWQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1NVRkJUeXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkJMRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJReTlETEVsQlFVa3NWMEZCVnl4RlFVRkZPMUZCUldJc1NVRkJTU3hEUVVGRExFZEJRV01zU1VGQlNTeERRVUZETEUxQlFVMHNSVUZETVVJc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eFRRVUZUTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eFBRVUZQTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVONFF5eEpRVUZKTEVkQlFVY3NRMEZCUXl4RFFVRkRMRTlCUVU4c1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeExRVUZMTEVkQlFVY3NRMEZCUXl4RFFVRkRMRkZCUVZFc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGRE1VTXNSMEZCUnl4SFFVRkhMRU5CUVVNc1IwRkJSeXhEUVVGRExFZEJRVWNzVDBGQlR5eEhRVUZITEVOQlFVTXNSVUZCUlN4SFFVRkhMRWRCUVVjc1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eFBRVUZQTEVkQlFVY3NRMEZCUXl4RFFVRkRPMUZCUTNwRUxFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNaVUZCWlN4SFFVRkhMRWRCUVVjc1EwRkJRenRSUVVOc1F5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRkZCUVZFc1EwRkJReXhKUVVGSkxFVkJRVVVzUzBGQlN5eEZRVUZGTEVkQlFVY3NSVUZCUlN4UFFVRlBMRU5CUVVNc1JVRkJSU3hKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTTdVVUZEZUVRc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eGxRVUZsTEVkQlFVY3NSMEZCUnl4RFFVRkRPMUZCUTJ4RExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNVVUZCVVN4RFFVRkRMRWxCUVVrc1JVRkJSU3hMUVVGTExFVkJRVVVzUjBGQlJ5eEZRVUZGTEU5QlFVOHNRMEZCUXl4RlFVRkZMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF6dExRVU16UkR0SlFVTkVMRWxCUVVrc1JVRkJSVHRSUVVGRkxFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVVFc1EwRkJReXhKUVVGSkxFOUJRVUVzUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4TlFVRk5MRVZCUVVVc1EwRkJReXhEUVVGRExGRkJRVkVzUTBGQlF5eEZRVUY2UWl4RFFVRjVRaXhEUVVGRExFTkJRVU03U1VGRE5VUXNTVUZCU1N4RlFVRkZPMUZCUVVVc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eFBRVUZQTEVOQlFVTXNWVUZCUVN4RFFVRkRPMWxCUTNwQ0xFbEJRVWtzUTBGQlF5eEhRVUZqTEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNN1dVRkROVUlzUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4UlFVRlJMRU5CUVVNc1EwRkJReXhEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1VVRkJVU3hEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4VFFVRlRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXp0UlFVTjZSaXhEUVVGRExFTkJRVU1zUTBGQlF6dEpRVU5JTEVsQlFVa3NSVUZCUlN4SFFVRkhMRzFDUVVGdFFpeERRVUZETEVWQlFVVXNSVUZCUlN4RlFVRkZMRVZCUVVVc1EwRkJReXhGUVVGRkxFMUJRVTBzUTBGQlF5eERRVUZETzBsQlEyaEVMRWxCUVVrc1JVRkJSU3hGUVVGRk8xRkJRMG9zUlVGQlJTeERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRkJMRU5CUVVNc1NVRkJUU3hEUVVGRExFTkJRVU1zU1VGQlNTeEhRVUZITEVWQlFVVXNSVUZCUlN4RFFVRkRMRU5CUVVNc1IwRkJSeXhIUVVGSExFVkJRVVVzUTBGQlFTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUXpkRExFVkJRVVVzUTBGQlF5eFBRVUZQTEVOQlFVTXNWVUZCUVN4RFFVRkRMRWxCUVUwc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlFTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUXpsRUxFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVVFc1EwRkJRenRaUVVOcVFpeEpRVUZKTEdGQlFXRXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhQUVVGUExFZEJRVWNzUTBGQlF5eERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdXVUZETVVRc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eEhRVUZITEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVVFc1EwRkJReXhKUVVGSkxFOUJRVUVzUTBGQlF5eERRVUZETEVkQlFVY3NTVUZCU1N4aFFVRmhMRVZCUVhSQ0xFTkJRWE5DTEVOQlFVTXNRMEZCUXp0WlFVTnNSQ3hEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEVsQlFVa3NRMEZCUXl4UFFVRlBMRU5CUVVNc1ZVRkJRU3hEUVVGRExFbEJRVTBzUTBGQlF5eERRVUZETEVsQlFVa3NSMEZCUnl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NTVUZCU1N4aFFVRmhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU12UlN4RFFVRkRMRU5CUVVNc1EwRkJRenRMUVVOT08wbEJRMFFzVDBGQlR5eG5Ra0ZCWjBJc1EwRkJReXhOUVVGTkxFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTTdRVUZEZGtNc1EwRkJRenRCUVVWRUxGTkJRVk1zYlVKQlFXMUNMRU5CUVVNc1JVRkJaU3hGUVVGRkxFbEJRV2RDTEVWQlF6RkVMRWxCUVcxQ0xFVkJRVVVzVFVGQll6dEpRVVZ1UXl4SlFVRkpMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUlVGQlJTeERRVUZETEUxQlFVMHNRMEZCUXp0SlFVTnlRaXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMGxCUTJRc1QwRkJUeXhEUVVGRExFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTXNUVUZCVFN4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJRMnBETEVsQlFVa3NUVUZCVFN4SFFVRkhMRWxCUVVrc1MwRkJTeXhEUVVGUkxFTkJRVU1zUTBGQlF5eERRVUZETzBsQlEycERMRXRCUVVzc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJReXhGUVVGRk8xRkJRM0JDTEVsQlFVa3NRMEZCUXl4SFFVRkhMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU5rTEVsQlFVa3NRMEZCUXl4SFFVRkhMRWxCUVVrc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1NVRkJTU3hEUVVGRExGTkJRVk1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTJoRUxFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4SlFVRkpMRXRCUVVzc1EwRkJReXhKUVVGSkxFVkJRVVVzUTBGQlF5eEZRVUZGTEVsQlFVa3NRMEZCUXl4UFFVRlBMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU5vUkN4TlFVRk5MRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVa3NTMEZCU3l4RFFVRkRMRXRCUVVzc1JVRkJSU3hEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8wdEJRM3BFTzBsQlEwUXNUVUZCVFN4RFFVRkRMRWxCUVVrc1EwRkJReXhoUVVGaExFTkJRVU1zUTBGQlF6dEpRVU16UWl4SlFVRkpMRVZCUVVVc1IwRkJSeXhKUVVGSkxFdEJRVXNzUlVGQll5eERRVUZETzBsQlEycERMRWxCUVVrc1VVRkJVU3hIUVVGSExGVkJRVlVzUlVGQlJTeERRVUZETzBsQlF6VkNMRXRCUVVzc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJReXhGUVVGRk8xRkJRM0JDTEVsQlFVa3NRMEZCUXl4SFFVRkhMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU5zUWl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlExb3NTVUZCU1N4RFFVRkRMRU5CUVVNc1RVRkJUU3hGUVVGRk8xbEJRMVlzVVVGQlVTeERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVOdVFpeEpRVUZKTEVOQlFVTXNZMEZCWXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hSUVVGUkxFTkJRVU1zUTBGQlF6dFRRVU53UXp0aFFVRk5PMWxCUlVnc1VVRkJVU3hEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTnVRaXhKUVVGSkxHTkJRV01zUjBGQlJ5eFZRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRPMmRDUVVOMFFpeEpRVUZKTEVkQlFVY3NSMEZCUnl4RFFVRkRMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhIUVVGSExFMUJRVTBzUTBGQlF6dG5Ra0ZETDBRc1JVRkJSU3hEUVVGRExFbEJRVWtzUTBGQlF5eEpRVUZKTEdsQ1FVRlZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRE0wTXNRMEZCUXl4RFFVRkRPMWxCUTBZc1NVRkJTU3hsUVVGbExFZEJRVWNzVlVGQlF5eFBRVUZQTEVWQlFVVXNUMEZCVHl4RlFVRkZMRXRCUVVzN1owSkJRekZETEVsQlFVa3NRMEZCUXl4RlFVRkZMRVZCUVVVc1IwRkJSeXhEUVVGRExFTkJRVU1zVDBGQlR5eERRVUZETEVOQlFVTXNVVUZCVVN4RlFVRkZMRU5CUVVNN1owSkJRMnhETEU5QlFVOHNRMEZCUXl4RFFVRkRMRWRCUVVjc1JVRkJSU3hEUVVGRExFOUJRVThzUTBGQlF5eEZRVUZGTEVOQlFVTXNTMEZCU3l4SlFVRkpMRVZCUVVVN2IwSkJRMnBETEV0QlFVc3NRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03YjBKQlExb3NRMEZCUXl4RFFVRkRMRTlCUVU4c1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0cFFrRkRlRUk3V1VGRFRDeERRVUZETEVOQlFVTTdXVUZEUml4bFFVRmxMRU5CUVVNc1RVRkJUU3hGUVVGRkxFMUJRVTBzUlVGQlJTeFZRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRWxCUVVzc1QwRkJRU3hqUVVGakxFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RlFVRndRaXhEUVVGdlFpeERRVUZETEVOQlFVTTdXVUZEYUVVc1pVRkJaU3hEUVVGRExFMUJRVTBzUlVGQlJTeE5RVUZOTEVWQlFVVXNWVUZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhKUVVGTExFOUJRVUVzWTBGQll5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1JVRkJjRUlzUTBGQmIwSXNRMEZCUXl4RFFVRkRPMU5CUTI1Rk8wdEJRMG83U1VGRFJDeFBRVUZQTEVOQlFVTXNUVUZCVFN4RFFVRkRMRkZCUVZFc1EwRkJReXhKUVVGSkxFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTTdTVUZEY0VNc1QwRkJUeXhGUVVGRkxFTkJRVU03UVVGRFpDeERRVUZETzBGQlJVUXNVMEZCVXl4bFFVRmxMRU5CUVVNc1EwRkJUeXhGUVVGRkxGRkJRWE5DTzBsQlEzQkVMRWxCUVVrc1EwRkJReXhIUVVGSExGVkJRVU1zVDBGQlR5eEZRVUZGTEU5QlFVODdVVUZEY2tJc1NVRkJTU3hGUVVGRkxFZEJRVWNzVVVGQlVTeERRVUZETEZGQlFWRXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVNNVFpeEpRVUZKTEVOQlFVTXNRMEZCUXp0UlFVTk9MRTlCUVU4c1EwRkJReXhEUVVGRExFZEJRVWNzUlVGQlJTeERRVUZETEU5QlFVOHNRMEZCUXl4RlFVRkZMRU5CUVVNc1MwRkJTeXhKUVVGSkxFVkJRVVU3V1VGRGFrTXNTVUZCU1N4UFFVRlBMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eFJRVUZSTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRMmhETEVsQlFVa3NUMEZCVHl4SlFVRkpMRU5CUVVNc1NVRkJTU3hQUVVGUExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4UlFVRlJMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTzJkQ1FVTTVReXhEUVVGRExFTkJRVU1zVDBGQlR5eERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8yZENRVU55UWl4RFFVRkRMRU5CUVVNc1QwRkJUeXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMkZCUTNoQ08xbEJRMFFzU1VGQlNTeFBRVUZQTEVsQlFVa3NRMEZCUXl4RlFVRkZPMmRDUVVOa0xFMUJRVTA3WVVGRFZEdFRRVU5LTzBsQlEwd3NRMEZCUXl4RFFVRkJPMGxCUTBRc1EwRkJReXhEUVVGRExFMUJRVTBzUlVGQlJTeE5RVUZOTEVOQlFVTXNRMEZCUXp0SlFVTnNRaXhEUVVGRExFTkJRVU1zVFVGQlRTeEZRVUZGTEUxQlFVMHNRMEZCUXl4RFFVRkRPMEZCUTNSQ0xFTkJRVU03UVVGRlJDeFRRVUZUTEdWQlFXVXNRMEZCUXl4RFFVRlBMRVZCUVVVc1VVRkJjMEk3U1VGRGNFUXNTVUZCU1N4RFFVRkRMRWRCUVVjc1ZVRkJReXhQUVVGUExFVkJRVVVzVDBGQlR6dFJRVU55UWl4SlFVRkpMRU5CUVVNc1IwRkJSeXhSUVVGUkxFTkJRVU1zVVVGQlVTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRTlCUVU4c1EwRkJReXhGUVVGRkxFTkJRVU03VVVGRGVFTXNTVUZCU1N4RFFVRkRMRXRCUVVzc1NVRkJTU3hKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNVVUZCVVN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVTdXVUZEY2tNc1EwRkJReXhEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVOeVFpeERRVUZETEVOQlFVTXNUMEZCVHl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFOQlEzaENPMGxCUTB3c1EwRkJReXhEUVVGQk8wbEJRMFFzUTBGQlF5eERRVUZETEUxQlFVMHNSVUZCUlN4TlFVRk5MRU5CUVVNc1EwRkJRenRKUVVOc1FpeERRVUZETEVOQlFVTXNUVUZCVFN4RlFVRkZMRTFCUVUwc1EwRkJReXhEUVVGRE8wRkJRM1JDTEVOQlFVTTdRVUZGUkN4VFFVRm5RaXh2UWtGQmIwSXNRMEZCUXl4RlFVRmxMRVZCUVVVc1NVRkJaMEk3U1VGRGJFVXNUMEZCVHl4dFFrRkJiVUlzUTBGQlF5eEZRVUZGTEVWQlFVVXNTVUZCU1N4RlFVRkZMRXRCUVVzc1JVRkJSU3hKUVVGSkxFTkJRVU1zUTBGQlF6dEJRVU4wUkN4RFFVRkRPMEZCUmtRc2IwUkJSVU03UVVGRlJDeFRRVUZuUWl4dlFrRkJiMElzUTBGQlF5eEZRVUZsTEVWQlFVVXNTVUZCWjBJN1NVRkRiRVVzVDBGQlR5eHRRa0ZCYlVJc1EwRkJReXhGUVVGRkxFVkJRVVVzU1VGQlNTeEZRVUZGTEV0QlFVc3NSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJRenRCUVVOMFJDeERRVUZETzBGQlJrUXNiMFJCUlVNN1FVRkZSQ3hUUVVGblFpeDVRa0ZCZVVJc1EwRkJReXhKUVVGeFFqdEpRVU16UkN4UFFVRlBMSGRDUVVGM1FpeERRVUZETEVsQlFVa3NSVUZCUlN4TFFVRkxMRVZCUVVVc1NVRkJTU3hEUVVGRExFTkJRVU03UVVGRGRrUXNRMEZCUXp0QlFVWkVMRGhFUVVWRE8wRkJSVVFzVTBGQlowSXNlVUpCUVhsQ0xFTkJRVU1zU1VGQmNVSTdTVUZETTBRc1QwRkJUeXgzUWtGQmQwSXNRMEZCUXl4SlFVRkpMRVZCUVVVc1MwRkJTeXhGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETzBGQlEzWkVMRU5CUVVNN1FVRkdSQ3c0UkVGRlF6dEJRVVZFTEZOQlFXZENMR05CUVdNc1EwRkJReXhGUVVGbE8wbEJRekZETEVsQlFVa3NSVUZCUlN4SFFVRkhMRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zVlVGQlFTeERRVUZETEVsQlFVa3NUMEZCUVN4SlFVRkpMR1ZCUVZFc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeEZRVUZGTEVOQlFVTXNSVUZCY0VJc1EwRkJiMElzUTBGQlF5eERRVUZETzBsQlF6TkRMRWxCUVVrc1JVRkJSU3hIUVVGSExHOUNRVUZ2UWl4RFFVRkRMRVZCUVVVc1JVRkJSU3hGUVVGRkxFTkJRVU1zUTBGQlF6dEpRVU4wUXl4SlFVRkpMRTFCUVUwc1IwRkJSeXhKUVVGSkxHRkJRVTBzUTBGQlF5eEZRVUZGTEVWQlFVVXNSVUZCUlN4RFFVRkRMRU5CUVVNN1NVRkRhRU1zVFVGQlRTeERRVUZETEV0QlFVc3NSVUZCUlN4RFFVRkRPMGxCUTJZc1JVRkJSU3hEUVVGRExFOUJRVThzUTBGQlF5eFZRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRWxCUVVzc1QwRkJRU3hGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNWVUZCVlN4RFFVRkRMRU5CUVVNc1EwRkJReXhSUVVGUkxFVkJRVVVzUTBGQlF5eEZRVUU1UWl4RFFVRTRRaXhEUVVGRExFTkJRVU03U1VGRGNrUXNSVUZCUlN4SFFVRkhMRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zVlVGQlFTeERRVUZETEVsQlFVY3NUMEZCUVN4SlFVRkpMR1ZCUVZFc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeEZRVUZGTEVOQlFVTXNSVUZCY0VJc1EwRkJiMElzUTBGQlF5eERRVUZETzBsQlEzUkRMRVZCUVVVc1IwRkJSeXh2UWtGQmIwSXNRMEZCUXl4RlFVRkZMRVZCUVVVc1JVRkJSU3hEUVVGRExFTkJRVU03U1VGRGJFTXNUVUZCVFN4SFFVRkhMRWxCUVVrc1lVRkJUU3hEUVVGRExFVkJRVVVzUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXp0SlFVTTFRaXhOUVVGTkxFTkJRVU1zUzBGQlN5eEZRVUZGTEVOQlFVTTdTVUZEWml4RlFVRkZMRU5CUVVNc1QwRkJUeXhEUVVGRExGVkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNTVUZCU3l4UFFVRkJMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eFZRVUZWTEVOQlFVTXNRMEZCUXl4RFFVRkRMRkZCUVZFc1JVRkJSU3hEUVVGRExFVkJRVGxDTEVOQlFUaENMRU5CUVVNc1EwRkJRenRCUVVONlJDeERRVUZETzBGQldFUXNkME5CVjBNN1FVRmhSRHRKUVVGeFF5eHRRMEZCVVR0SlFVTjZReXg1UWtGQmJVSXNTMEZCWVN4RlFVRkZMRU5CUVZNN1VVRkJNME1zV1VGRFNTeHJRa0ZCVFN4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExGTkJRMlE3VVVGR2EwSXNWMEZCU3l4SFFVRk1MRXRCUVVzc1EwRkJVVHM3U1VGRmFFTXNRMEZCUXp0SlFVTk1MSE5DUVVGRE8wRkJRVVFzUTBGQlF5eEJRVXBFTEVOQlFYRkRMR1ZCUVZFc1IwRkpOVU03UVVGS1dTd3dRMEZCWlR0QlFVMDFRanRKUVV0SkxHOUNRVUZ2UWl4TFFVRnJRaXhGUVVNeFFpeE5RVUY1UWl4RlFVTjZRaXhUUVVGcFF5eEZRVU42UXl4WFFVRjNRaXhGUVVOb1FpeGhRVUU0UWp0UlFVb3hReXhwUWtFNFFrTTdVVUUxUWxjc01FSkJRVUVzUlVGQlFTeG5Ra0ZCYVVNN1VVRkRla01zTkVKQlFVRXNSVUZCUVN4clFrRkJkMEk3VVVGRGFFSXNPRUpCUVVFc1JVRkJRU3h4UWtGQk9FSTdVVUZLZEVJc1ZVRkJTeXhIUVVGTUxFdEJRVXNzUTBGQllUdFJRVU14UWl4WFFVRk5MRWRCUVU0c1RVRkJUU3hEUVVGdFFqdFJRVU42UWl4alFVRlRMRWRCUVZRc1UwRkJVeXhEUVVGM1FqdFJRVVZxUXl4clFrRkJZU3hIUVVGaUxHRkJRV0VzUTBGQmFVSTdVVUZGZEVNc1NVRkJTU3hEUVVGRExGTkJRVk1zUjBGQlJ5eExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRlZCUVVNc1EwRkJReXhGUVVGRkxFTkJRVU03V1VGRE5VSXNUMEZCVHl4RFFVRkRMRU5CUVVNc1VVRkJVU3hIUVVGSExFbEJRVWtzWlVGQlpTeERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOc1JDeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVVklMRWxCUVVrc1YwRkJWenRaUVVGRkxFbEJRVWtzUTBGQlF5eHBRa0ZCYVVJc1EwRkJReXhYUVVGWExFTkJRVU1zUTBGQlF6dFJRVVZ5UkN4SlFVRkpMR0ZCUVdFc1NVRkJTU3hUUVVGVExFbEJRVWtzVDBGQlR5eFRRVUZUTEVOQlFVTXNUVUZCVFN4TFFVRkxMRmRCUVZjc1JVRkJSVHRaUVVOMlJTeExRVUZMTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVVFc1EwRkJRenRuUWtGRE1VSXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhMUVVGTExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNUVUZCVFN4RlFVTjZRanR2UWtGRlF5eERRVUZETEVOQlFVTXNUVUZCVFN4SFFVRkhMRWxCUVVrc1UwRkJVeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenR2UWtGRE4wTXNUMEZCVHp0cFFrRkRVRHRuUWtGRFl5eEpRVUZKTEVWQlFVVXNSMEZCUnl4RFFVRkRMRU5CUVVNc1MwRkJTeXhIUVVGSExFTkJRVU1zUlVGQlJTeEZRVUZGTEVkQlFVY3NRMEZCUXl4RFFVRkRMRTFCUVUwc1IwRkJSeXhEUVVGRExFTkJRVU03WjBKQlEzaERMRU5CUVVNc1EwRkJReXhOUVVGTkxFZEJRVWNzU1VGQlNTeFRRVUZUTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RlFVRkZMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhGUVVGRkxFTkJRVU1zUTBGQlF6dFpRVU55UlN4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVOSUxHdENRVUZyUWl4RFFVRkRMRk5CUVZNc1EwRkJReXhEUVVGRE8xbEJRemxDTEVsQlFVa3NRMEZCUXl4SFFVRkhMRXRCUVVzc1EwRkJReXhOUVVGTkxFTkJRVU03V1VGRGNrSXNUVUZCVFN4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGQkxFTkJRVU03WjBKQlExb3NTMEZCU1N4RFFVRkRMRk5CUVZNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNUVUZCVFN4SFFVRkhMRWxCUVVrc1pVRkJaU3hEUVVGRExFTkJRVU1zUlVGQlJTeEZRVUZGTEU5QlFVOHNRMEZCUXl4RFFVRkRMRk5CUVZNc1MwRkJTeXhYUVVGWExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4VFFVRlRMRU5CUVVNc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzJkQ1FVTnFTQ3hMUVVGSkxFTkJRVU1zVTBGQlV5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhOUVVGTkxFZEJRVWNzU1VGQlNTeGxRVUZsTEVOQlFVTXNRMEZCUXl4RlFVRkZMRVZCUVVVc1QwRkJUeXhEUVVGRExFTkJRVU1zVTBGQlV5eExRVUZMTEZkQlFWY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExGTkJRVk1zUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1dVRkRja2dzUTBGQlF5eERRVUZETEVOQlFVTTdVMEZEVGp0SlFVTk1MRU5CUVVNN1NVRkhUeXh4UTBGQlowSXNSMEZCZUVJc1ZVRkJlVUlzUTBGQlRUdFJRVU16UWl4UFFVRlBMRWxCUVVrc2FVSkJRVlVzUTBGRGFrSXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNVVUZCVVN4RlFVTXpRaXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhSUVVGUkxFVkJRelZDTEVOQlFVTXNRMEZCUXl4SFFVRkhMRVZCUTB3c1QwRkJUeXhEUVVGRExFTkJRVU1zVVVGQlVTeExRVUZMTEZkQlFWY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExGRkJRVkVzUTBGQlF5eERRVUZETEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNN1NVRkRhRVVzUTBGQlF6dEpRVWRQTEdsRFFVRlpMRWRCUVhCQ0xGVkJRWEZDTEVOQlFVMDdVVUZCTTBJc2FVSkJhVUpETzFGQmFFSkhMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zWVVGQllUdFpRVUZGTEU5QlFVODdVVUZGYUVNc1NVRkJTU3hKUVVGSkxFZEJRVWNzUjBGQlJ5eEZRVUZGTEVkQlFVY3NSMEZCUnl4UFFVRlBMRU5CUVVNN1VVRkRPVUlzU1VGQlNTeERRVUZETEVOQlFVTXNTVUZCU1N4TFFVRkxMRWRCUVVjN1dVRkJSU3hKUVVGSkxFZEJRVWNzUjBGQlJ5eEZRVUZGTEVkQlFVY3NSMEZCUnl4UlFVRlJMRU5CUVVNN1VVRkRMME1zU1VGQlNTeEZRVUZGTEVkQlFXZENMRU5CUVVNc1EwRkJReXhQUVVGUExFTkJRVU1zUjBGQlJ5eERRVUZETEZWQlFVRXNRMEZCUXl4SlFVRkpMRTlCUVVFc1MwRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRVZCUVd4Q0xFTkJRV3RDTEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1ZVRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEpRVUZMTEU5QlFVRXNRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNSVUZCYWtJc1EwRkJhVUlzUTBGQlF5eERRVUZETzFGQlF5OUdMRWxCUVVrc1EwRkJReXhIUVVGakxFbEJRVWtzUTBGQlF6dFJRVU40UWl4RlFVRkZMRU5CUVVNc1QwRkJUeXhEUVVGRExGVkJRVUVzUTBGQlF6dFpRVVZTTEVsQlFVa3NRMEZCUXl4RlFVRkZPMmRDUVVOSUxFbEJRVWtzVDBGQlR5eEhRVUZITEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdaMEpCUXk5Q0xFbEJRVWtzVDBGQlR5eEhRVUZITEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1JVRkJSVHR2UWtGRGJrSXNRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhIUVVGSExFOUJRVThzUTBGQlF6dHBRa0ZEY2tJN1lVRkRTanRaUVVORUxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdVVUZEVml4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVOUUxFTkJRVU03U1VGRlR5eHZRMEZCWlN4SFFVRjJRaXhWUVVGM1FpeERRVUZOTzFGQlFUbENMR2xDUVZGRE8xRkJVRWNzU1VGQlNTeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zVDBGQlR5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExGRkJRVkVzUTBGQlF6dFJRVU12UXl4SlFVRkpMRU5CUVVNc1dVRkJXU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlEzSkNMRWxCUVVrc1JVRkJSU3hIUVVGSExFTkJRVU1zUTBGQlF5eEpRVUZKTEV0QlFVc3NSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zV1VGQldTeERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1dVRkJXU3hEUVVGRE8xRkJRMmhGTEVOQlFVTXNRMEZCUXl4UFFVRlBMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRkJMRU5CUVVNN1dVRkRlRUlzU1VGQlNTeERRVUZETEVkQlFVY3NTMEZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNVVUZCVVN4RFFVRkRPMWxCUTNCRExFVkJRVVVzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4cFFrRkJWU3hEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRTFCUVUwc1JVRkJSU3hKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETzFGQlEyeEVMRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJRMUFzUTBGQlF6dEpRVVZQTEhORFFVRnBRaXhIUVVGNlFpeFZRVUV3UWl4WFFVRnJRanRSUVVFMVF5eHBRa0ZYUXp0UlFWWkhMRWxCUVVrc1MwRkJTeXhIUVVGSExGVkJRVUVzUTBGQlF5eEpRVUZKTEU5QlFVRXNUMEZCVHl4RFFVRkRMRU5CUVVNc1NVRkJTU3hMUVVGTExGZEJRVmNzU1VGQlNTeERRVUZETEVOQlFVTXNTVUZCU1N4TFFVRkxMRmxCUVZrc1JVRkJlRVFzUTBGQmQwUXNRMEZCUXp0UlFVTXhSU3hKUVVGSkxFTkJRVU1zV1VGQldTeEhRVUZITEZkQlFWYzdZVUZETVVJc1RVRkJUU3hEUVVGRExGVkJRVUVzUTBGQlF5eEpRVUZKTEU5QlFVRXNRMEZCUXl4RFFVRkRMRWxCUVVrc1MwRkJTeXhIUVVGSExFbEJRVWtzUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRXhRaXhEUVVFd1FpeERRVUZETzJGQlEzWkRMRWRCUVVjc1EwRkJReXhWUVVGQkxFTkJRVU1zU1VGQlNTeFBRVUZCTEV0QlFVa3NRMEZCUXl4blFrRkJaMElzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCZUVJc1EwRkJkMElzUTBGQlF5eERRVUZETzFGQlEzaERMRWxCUVVrc1EwRkJReXhaUVVGWkxFZEJRVWNzVjBGQlZ6dGhRVU14UWl4TlFVRk5MRU5CUVVNc1ZVRkJRU3hEUVVGRExFbEJRVWtzVDBGQlFTeERRVUZETEVOQlFVTXNTVUZCU1N4TFFVRkxMRWRCUVVjc1NVRkJTU3hMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFURkNMRU5CUVRCQ0xFTkJRVU03WVVGRGRrTXNSMEZCUnl4RFFVRkRMRlZCUVVFc1EwRkJReXhKUVVGSkxFOUJRVUVzUzBGQlNTeERRVUZETEdkQ1FVRm5RaXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUY0UWl4RFFVRjNRaXhEUVVGRExFTkJRVU03VVVGRGVFTXNWMEZCVnp0aFFVTk9MRTFCUVUwc1EwRkJReXhWUVVGQkxFTkJRVU1zU1VGQlNTeFBRVUZCTEVOQlFVTXNRMEZCUXl4SlFVRkpMRXRCUVVzc1YwRkJWeXhGUVVGMFFpeERRVUZ6UWl4RFFVRkRPMkZCUTI1RExFOUJRVThzUTBGQlF5eFZRVUZCTEVOQlFVTXNTVUZCU1N4UFFVRkJMRXRCUVVrc1EwRkJReXhsUVVGbExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFYWkNMRU5CUVhWQ0xFTkJRVU1zUTBGQlF6dEpRVU12UXl4RFFVRkRPMGxCUlU4c05FTkJRWFZDTEVkQlFTOUNMRlZCUVdkRExFVkJRVmtzUlVGQlJTeEZRVUZaTEVWQlFVVXNUMEZCYVVJc1JVRkJSU3hWUVVGdlF6dFJRVU12Unl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFOUJRVThzUTBGQlF5eFZRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRPMWxCUTNCQ0xFbEJRVWtzUTBGQlF5eERRVUZETEV0QlFVc3NSVUZCUlR0blFrRkRWQ3hEUVVGRExFTkJRVU1zVVVGQlVTeERRVUZETEUxQlFVMHNSMEZCUnl4RFFVRkRMRU5CUVVNc1YwRkJWeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNWMEZCVnl4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU03WjBKQlEzcEVMRTlCUVU4c1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eFZRVUZWTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1lVRkRPVUk3YVVKQlFVMDdaMEpCUTBnc1EwRkJReXhEUVVGRExGRkJRVkVzUTBGQlF5eE5RVUZOTEVkQlFVY3NRMEZCUXl4RFFVRkRPMkZCUTNwQ08xbEJRMFFzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1MwRkJTeXhKUVVGSkxFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zVFVGQlRTeEpRVUZKTEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRaUVVOd1JDeEpRVUZKTEVWQlFVVXNSMEZCUnl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUlVGQlJTeEhRVUZITEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVNelFpeERRVUZETEVOQlFVTXNUVUZCVFN4SFFVRkhMRWxCUVVrc1UwRkJVeXhEUVVGRExFVkJRVVVzUjBGQlJ5eERRVUZETEVWQlFVVXNSVUZCUlN4SFFVRkhMRU5CUVVNc1JVRkJSU3hGUVVGRkxFZEJRVWNzUTBGQlF5eEZRVUZGTEVWQlFVVXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVNM1JDeERRVUZETEVOQlFVTXNRMEZCUXp0SlFVTlFMRU5CUVVNN1NVRkZSQ3cyUWtGQlVTeEhRVUZTTEZWQlFWTXNSVUZCV1N4RlFVRkZMRVZCUVZrc1JVRkJSU3hEUVVGWE8xRkJRelZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1UwRkJVeXhKUVVGSkxFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNZVUZCWVN4SlFVRkpMRWxCUVVrc1EwRkJReXhaUVVGWkxFTkJRVU03V1VGQlJTeFBRVUZQTzFGQlF6RkZMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU1zUlVGQlJTeEZRVUZGTEVWQlFVVXNSVUZCUlN4RlFVRkZMRVZCUVVVc1EwRkJReXhGUVVGRkxGVkJRVUVzUTBGQlF5eEpRVUZITEU5QlFVRXNRMEZCUXl4RFFVRkRMRVZCUVVVc1JVRkJTaXhEUVVGSkxFVkJRVVVzU1VGQlNTeERRVUZETEZsQlFWa3NSVUZCUlN4NVFrRkJlVUlzUlVGRE9VVXNWVUZCUVN4RFFVRkRMRWxCUVVrc1QwRkJRU3hEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEZWQlFWVXNRMEZCUXl4RFFVRkRMRU5CUVcxQ0xFTkJRVU1zUTBGQlF5eFJRVUZUTEVOQlFVTXNTMEZCU3l4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExGRkJRVkVzUTBGQlF5eFJRVUZSTEVWQlFVVXNRMEZCUXl4RlFVRnVSaXhEUVVGdFJpeEZRVU40Uml4VlFVRkJMRU5CUVVNN1dVRkRSeXhKUVVGSkxFbEJRVWtzUjBGQlJ5eERRVUZETEVOQlFXMUNMRU5CUVVNc1EwRkJReXhOUVVGUExFTkJRVU1zUzBGQlN5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhSUVVGUkxFVkJRVVVzUTBGQlF6dFpRVU4wUlN4SlFVRkpMRWxCUVVrc1IwRkJSeXhEUVVGRExFTkJRVzFDTEVOQlFVTXNRMEZCUXl4TlFVRlBMRU5CUVVNc1MwRkJTeXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4UlFVRlJMRVZCUVVVc1EwRkJRenRaUVVOMFJTeEpRVUZKTEVWQlFVVXNSMEZCUnl4RFFVRkRMRU5CUVVNc1QwRkJUeXhIUVVGSExFTkJRVU1zUTBGQlF6dFpRVU4yUWl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUjBGQlJ5eEpRVUZKTEVkQlFVY3NSVUZCUlN4RFFVRkRPMWxCUTNaQ0xFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXl4SFFVRkhMRWxCUVVrc1IwRkJSeXhGUVVGRkxFTkJRVU03VVVGRE0wSXNRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRXQ3hEUVVGRE8wbEJSVVFzTmtKQlFWRXNSMEZCVWl4VlFVRlRMRVZCUVZrc1JVRkJSU3hGUVVGWkxFVkJRVVVzUTBGQlZ6dFJRVU0xUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExGTkJRVk1zU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4WlFVRlpPMWxCUVVVc1QwRkJUenRSUVVOc1JDeEpRVUZKTEVOQlFVTXNUMEZCVHl4RFFVRkRMRVZCUVVVc1JVRkJSU3hGUVVGRkxFVkJRVVVzUlVGQlJTeEZRVUZGTEVOQlFVTXNSVUZCUlN4VlFVRkJMRU5CUVVNc1NVRkJSeXhQUVVGQkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVWQlFVb3NRMEZCU1N4RlFVRkZMRWxCUVVrc1EwRkJReXhaUVVGWkxFVkJRVVVzZVVKQlFYbENMRVZCUXpsRkxGVkJRVUVzUTBGQlF5eEpRVUZKTEU5QlFVRXNRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhWUVVGVkxFTkJRVU1zUTBGQlF5eERRVUZ0UWl4RFFVRkRMRU5CUVVNc1VVRkJVeXhEUVVGRExFdEJRVXNzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4UlFVRlJMRU5CUVVNc1VVRkJVU3hGUVVGRkxFTkJRVU1zUlVGQmJrWXNRMEZCYlVZc1JVRkRlRVlzVlVGQlFTeERRVUZETzFsQlEwY3NTVUZCU1N4SlFVRkpMRWRCUVVjc1EwRkJReXhEUVVGdFFpeERRVUZETEVOQlFVTXNUVUZCVHl4RFFVRkRMRXRCUVVzc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNVVUZCVVN4RlFVRkZMRU5CUVVNN1dVRkRkRVVzU1VGQlNTeEpRVUZKTEVkQlFVY3NRMEZCUXl4RFFVRnRRaXhEUVVGRExFTkJRVU1zVFVGQlR5eERRVUZETEV0QlFVc3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU1zVVVGQlVTeEZRVUZGTEVOQlFVTTdXVUZEZEVVc1NVRkJTU3hGUVVGRkxFZEJRVWNzUTBGQlF5eERRVUZETEU5QlFVOHNSMEZCUnl4RFFVRkRMRU5CUVVNN1dVRkRka0lzUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRWRCUVVjc1NVRkJTU3hIUVVGSExFVkJRVVVzUTBGQlF6dFpRVUZCTEVOQlFVTTdXVUZEZUVJc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVkQlFVY3NTVUZCU1N4SFFVRkhMRVZCUVVVc1EwRkJRenRSUVVNelFpeERRVUZETEVOQlFVTXNRMEZCUXp0SlFVTllMRU5CUVVNN1NVRkZSQ3h4UTBGQlowSXNSMEZCYUVJN1VVRkJRU3hwUWtGTFF6dFJRVXBITEU5QlFVODdXVUZEU0N4VlFVRkRMRVZCUVVVc1JVRkJSU3hGUVVGRkxFVkJRVVVzUTBGQlF5eEpRVUZMTEU5QlFVRXNTMEZCU1N4RFFVRkRMRkZCUVZFc1EwRkJReXhGUVVGRkxFVkJRVVVzUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RlFVRjRRaXhEUVVGM1FqdFpRVU4yUXl4VlFVRkRMRVZCUVVVc1JVRkJSU3hGUVVGRkxFVkJRVVVzUTBGQlF5eEpRVUZMTEU5QlFVRXNTMEZCU1N4RFFVRkRMRkZCUVZFc1EwRkJReXhGUVVGRkxFVkJRVVVzUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RlFVRjRRaXhEUVVGM1FqdFRRVU14UXl4RFFVRkRPMGxCUTA0c1EwRkJRenRKUVVWUExEUkNRVUZQTEVkQlFXWXNWVUZCWjBJc1JVRkJXU3hGUVVGRkxFVkJRVmtzUlVGQlJTeExRVUZsTEVWQlFVVXNUMEZCYVVJc1JVRkRNVVVzVlVGQmIwTXNSVUZEY0VNc1JVRkJaMElzUlVGRGFFSXNiVUpCUVhsRUxFVkJRM3BFTEdkQ1FVRjFReXhGUVVOMlF5eHBRa0ZCT0VNN1VVRkZPVU1zU1VGQlNTeERRVUZETEhWQ1FVRjFRaXhEUVVGRExFVkJRVVVzUlVGQlJTeEZRVUZGTEVWQlFVVXNUMEZCVHl4RlFVRkZMRlZCUVZVc1EwRkJReXhEUVVGRE8xRkJRekZFTEVsQlFVa3NTVUZCU1N4RFFVRkRMRk5CUVZNc1NVRkJTU3hKUVVGSkxFTkJRVU1zWVVGQllTeEZRVUZGTzFsQlEzUkRMR3RDUVVGclFpeERRVUZETEVsQlFVa3NRMEZCUXl4VFFVRlRMRU5CUVVNc1EwRkJRenRaUVVOdVF5eEZRVUZGTEVkQlFVY3NSVUZCUlN4RFFVRkRMRTFCUVUwc1EwRkJReXh0UWtGQmJVSXNRMEZCUXl4SlFVRkpMRU5CUVVNc1UwRkJVeXhEUVVGRExFTkJRVU1zUTBGQlF6dFRRVU4yUkR0UlFVTkVMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zU1VGQlNTeERRVUZETEZOQlFWTXNSVUZCUlN4RlFVRkZMRVZCUVVVc1MwRkJTeXhGUVVGRkxFOUJRVThzUTBGQlF5eERRVUZETzFGQlF5OURMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zVDBGQlR5eERRVUZETEdkQ1FVRm5RaXhEUVVGRExFTkJRVU03VVVGRGNrTXNTVUZCU1N4SlFVRkpMRU5CUVVNc1UwRkJVeXhKUVVGSkxFbEJRVWtzUTBGQlF5eGhRVUZoTEVWQlFVVTdXVUZEZEVNc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eFBRVUZQTEVOQlFVTXNhVUpCUVdsQ0xFTkJRVU1zUTBGQlF6dFpRVU4yUXl4clFrRkJhMElzUTBGQlF5eEpRVUZKTEVOQlFVTXNVMEZCVXl4RFFVRkRMRU5CUVVNN1UwRkRkRU03U1VGRFRDeERRVUZETzBsQlJVOHNNRUpCUVVzc1IwRkJZaXhWUVVGakxFVkJRV01zUlVGQlJTeEZRVUZuUWl4RlFVRkZMRkZCUVd0Q0xFVkJRVVVzVDBGQmFVSTdVVUZEYWtZc1NVRkJTU3hOUVVGTkxFZEJRVWNzU1VGQlNTeGhRVUZOTEVOQlFVTXNSVUZCUlN4RlFVRkZMRVZCUVVVc1EwRkJReXhEUVVGRE8xRkJRMmhETEUxQlFVMHNRMEZCUXl4dlFrRkJiMElzUTBGQlF5eFJRVUZSTEVOQlFVTXNRMEZCUXp0UlFVTjBReXhOUVVGTkxFTkJRVU1zYlVKQlFXMUNMRU5CUVVNc1QwRkJUeXhEUVVGRExFTkJRVU03VVVGRGNFTXNUVUZCVFN4RFFVRkRMRXRCUVVzc1JVRkJSU3hEUVVGRE8wbEJRMjVDTEVOQlFVTTdTVUZEVEN4cFFrRkJRenRCUVVGRUxFTkJRVU1zUVVGc1MwUXNTVUZyUzBNN1FVRnNTMWtzWjBOQlFWVWlmUT09IiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgcHF1ZXVlXzEgPSByZXF1aXJlKFwiLi9wcXVldWVcIik7XG52YXIgTmVpZ2hib3VyID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBOZWlnaGJvdXIoaWQsIGRpc3RhbmNlKSB7XG4gICAgICAgIHRoaXMuaWQgPSBpZDtcbiAgICAgICAgdGhpcy5kaXN0YW5jZSA9IGRpc3RhbmNlO1xuICAgIH1cbiAgICByZXR1cm4gTmVpZ2hib3VyO1xufSgpKTtcbnZhciBOb2RlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBOb2RlKGlkKSB7XG4gICAgICAgIHRoaXMuaWQgPSBpZDtcbiAgICAgICAgdGhpcy5uZWlnaGJvdXJzID0gW107XG4gICAgfVxuICAgIHJldHVybiBOb2RlO1xufSgpKTtcbnZhciBRdWV1ZUVudHJ5ID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBRdWV1ZUVudHJ5KG5vZGUsIHByZXYsIGQpIHtcbiAgICAgICAgdGhpcy5ub2RlID0gbm9kZTtcbiAgICAgICAgdGhpcy5wcmV2ID0gcHJldjtcbiAgICAgICAgdGhpcy5kID0gZDtcbiAgICB9XG4gICAgcmV0dXJuIFF1ZXVlRW50cnk7XG59KCkpO1xudmFyIENhbGN1bGF0b3IgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIENhbGN1bGF0b3IobiwgZXMsIGdldFNvdXJjZUluZGV4LCBnZXRUYXJnZXRJbmRleCwgZ2V0TGVuZ3RoKSB7XG4gICAgICAgIHRoaXMubiA9IG47XG4gICAgICAgIHRoaXMuZXMgPSBlcztcbiAgICAgICAgdGhpcy5uZWlnaGJvdXJzID0gbmV3IEFycmF5KHRoaXMubik7XG4gICAgICAgIHZhciBpID0gdGhpcy5uO1xuICAgICAgICB3aGlsZSAoaS0tKVxuICAgICAgICAgICAgdGhpcy5uZWlnaGJvdXJzW2ldID0gbmV3IE5vZGUoaSk7XG4gICAgICAgIGkgPSB0aGlzLmVzLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgdmFyIGUgPSB0aGlzLmVzW2ldO1xuICAgICAgICAgICAgdmFyIHUgPSBnZXRTb3VyY2VJbmRleChlKSwgdiA9IGdldFRhcmdldEluZGV4KGUpO1xuICAgICAgICAgICAgdmFyIGQgPSBnZXRMZW5ndGgoZSk7XG4gICAgICAgICAgICB0aGlzLm5laWdoYm91cnNbdV0ubmVpZ2hib3Vycy5wdXNoKG5ldyBOZWlnaGJvdXIodiwgZCkpO1xuICAgICAgICAgICAgdGhpcy5uZWlnaGJvdXJzW3ZdLm5laWdoYm91cnMucHVzaChuZXcgTmVpZ2hib3VyKHUsIGQpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBDYWxjdWxhdG9yLnByb3RvdHlwZS5EaXN0YW5jZU1hdHJpeCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIEQgPSBuZXcgQXJyYXkodGhpcy5uKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm47ICsraSkge1xuICAgICAgICAgICAgRFtpXSA9IHRoaXMuZGlqa3N0cmFOZWlnaGJvdXJzKGkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBEO1xuICAgIH07XG4gICAgQ2FsY3VsYXRvci5wcm90b3R5cGUuRGlzdGFuY2VzRnJvbU5vZGUgPSBmdW5jdGlvbiAoc3RhcnQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGlqa3N0cmFOZWlnaGJvdXJzKHN0YXJ0KTtcbiAgICB9O1xuICAgIENhbGN1bGF0b3IucHJvdG90eXBlLlBhdGhGcm9tTm9kZVRvTm9kZSA9IGZ1bmN0aW9uIChzdGFydCwgZW5kKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRpamtzdHJhTmVpZ2hib3VycyhzdGFydCwgZW5kKTtcbiAgICB9O1xuICAgIENhbGN1bGF0b3IucHJvdG90eXBlLlBhdGhGcm9tTm9kZVRvTm9kZVdpdGhQcmV2Q29zdCA9IGZ1bmN0aW9uIChzdGFydCwgZW5kLCBwcmV2Q29zdCkge1xuICAgICAgICB2YXIgcSA9IG5ldyBwcXVldWVfMS5Qcmlvcml0eVF1ZXVlKGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhLmQgPD0gYi5kOyB9KSwgdSA9IHRoaXMubmVpZ2hib3Vyc1tzdGFydF0sIHF1ID0gbmV3IFF1ZXVlRW50cnkodSwgbnVsbCwgMCksIHZpc2l0ZWRGcm9tID0ge307XG4gICAgICAgIHEucHVzaChxdSk7XG4gICAgICAgIHdoaWxlICghcS5lbXB0eSgpKSB7XG4gICAgICAgICAgICBxdSA9IHEucG9wKCk7XG4gICAgICAgICAgICB1ID0gcXUubm9kZTtcbiAgICAgICAgICAgIGlmICh1LmlkID09PSBlbmQpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBpID0gdS5uZWlnaGJvdXJzLmxlbmd0aDtcbiAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgICAgICB2YXIgbmVpZ2hib3VyID0gdS5uZWlnaGJvdXJzW2ldLCB2ID0gdGhpcy5uZWlnaGJvdXJzW25laWdoYm91ci5pZF07XG4gICAgICAgICAgICAgICAgaWYgKHF1LnByZXYgJiYgdi5pZCA9PT0gcXUucHJldi5ub2RlLmlkKVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB2YXIgdmlkdWlkID0gdi5pZCArICcsJyArIHUuaWQ7XG4gICAgICAgICAgICAgICAgaWYgKHZpZHVpZCBpbiB2aXNpdGVkRnJvbSAmJiB2aXNpdGVkRnJvbVt2aWR1aWRdIDw9IHF1LmQpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIHZhciBjYyA9IHF1LnByZXYgPyBwcmV2Q29zdChxdS5wcmV2Lm5vZGUuaWQsIHUuaWQsIHYuaWQpIDogMCwgdCA9IHF1LmQgKyBuZWlnaGJvdXIuZGlzdGFuY2UgKyBjYztcbiAgICAgICAgICAgICAgICB2aXNpdGVkRnJvbVt2aWR1aWRdID0gdDtcbiAgICAgICAgICAgICAgICBxLnB1c2gobmV3IFF1ZXVlRW50cnkodiwgcXUsIHQpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgcGF0aCA9IFtdO1xuICAgICAgICB3aGlsZSAocXUucHJldikge1xuICAgICAgICAgICAgcXUgPSBxdS5wcmV2O1xuICAgICAgICAgICAgcGF0aC5wdXNoKHF1Lm5vZGUuaWQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwYXRoO1xuICAgIH07XG4gICAgQ2FsY3VsYXRvci5wcm90b3R5cGUuZGlqa3N0cmFOZWlnaGJvdXJzID0gZnVuY3Rpb24gKHN0YXJ0LCBkZXN0KSB7XG4gICAgICAgIGlmIChkZXN0ID09PSB2b2lkIDApIHsgZGVzdCA9IC0xOyB9XG4gICAgICAgIHZhciBxID0gbmV3IHBxdWV1ZV8xLlByaW9yaXR5UXVldWUoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEuZCA8PSBiLmQ7IH0pLCBpID0gdGhpcy5uZWlnaGJvdXJzLmxlbmd0aCwgZCA9IG5ldyBBcnJheShpKTtcbiAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgdmFyIG5vZGUgPSB0aGlzLm5laWdoYm91cnNbaV07XG4gICAgICAgICAgICBub2RlLmQgPSBpID09PSBzdGFydCA/IDAgOiBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFk7XG4gICAgICAgICAgICBub2RlLnEgPSBxLnB1c2gobm9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKCFxLmVtcHR5KCkpIHtcbiAgICAgICAgICAgIHZhciB1ID0gcS5wb3AoKTtcbiAgICAgICAgICAgIGRbdS5pZF0gPSB1LmQ7XG4gICAgICAgICAgICBpZiAodS5pZCA9PT0gZGVzdCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXRoID0gW107XG4gICAgICAgICAgICAgICAgdmFyIHYgPSB1O1xuICAgICAgICAgICAgICAgIHdoaWxlICh0eXBlb2Ygdi5wcmV2ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICBwYXRoLnB1c2godi5wcmV2LmlkKTtcbiAgICAgICAgICAgICAgICAgICAgdiA9IHYucHJldjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhdGg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpID0gdS5uZWlnaGJvdXJzLmxlbmd0aDtcbiAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgICAgICB2YXIgbmVpZ2hib3VyID0gdS5uZWlnaGJvdXJzW2ldO1xuICAgICAgICAgICAgICAgIHZhciB2ID0gdGhpcy5uZWlnaGJvdXJzW25laWdoYm91ci5pZF07XG4gICAgICAgICAgICAgICAgdmFyIHQgPSB1LmQgKyBuZWlnaGJvdXIuZGlzdGFuY2U7XG4gICAgICAgICAgICAgICAgaWYgKHUuZCAhPT0gTnVtYmVyLk1BWF9WQUxVRSAmJiB2LmQgPiB0KSB7XG4gICAgICAgICAgICAgICAgICAgIHYuZCA9IHQ7XG4gICAgICAgICAgICAgICAgICAgIHYucHJldiA9IHU7XG4gICAgICAgICAgICAgICAgICAgIHEucmVkdWNlS2V5KHYucSwgdiwgZnVuY3Rpb24gKGUsIHEpIHsgcmV0dXJuIGUucSA9IHE7IH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZDtcbiAgICB9O1xuICAgIHJldHVybiBDYWxjdWxhdG9yO1xufSgpKTtcbmV4cG9ydHMuQ2FsY3VsYXRvciA9IENhbGN1bGF0b3I7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0ptYVd4bElqb2ljMmh2Y25SbGMzUndZWFJvY3k1cWN5SXNJbk52ZFhKalpWSnZiM1FpT2lJaUxDSnpiM1Z5WTJWeklqcGJJaTR1THk0dUwxZGxZa052YkdFdmMzSmpMM05vYjNKMFpYTjBjR0YwYUhNdWRITWlYU3dpYm1GdFpYTWlPbHRkTENKdFlYQndhVzVuY3lJNklqczdRVUZCUVN4dFEwRkJiVVE3UVVGRmJrUTdTVUZEU1N4dFFrRkJiVUlzUlVGQlZTeEZRVUZUTEZGQlFXZENPMUZCUVc1RExFOUJRVVVzUjBGQlJpeEZRVUZGTEVOQlFWRTdVVUZCVXl4aFFVRlJMRWRCUVZJc1VVRkJVU3hEUVVGUk8wbEJRVWtzUTBGQlF6dEpRVU12UkN4blFrRkJRenRCUVVGRUxFTkJRVU1zUVVGR1JDeEpRVVZETzBGQlJVUTdTVUZEU1N4alFVRnRRaXhGUVVGVk8xRkJRVllzVDBGQlJTeEhRVUZHTEVWQlFVVXNRMEZCVVR0UlFVTjZRaXhKUVVGSkxFTkJRVU1zVlVGQlZTeEhRVUZITEVWQlFVVXNRMEZCUXp0SlFVTjZRaXhEUVVGRE8wbEJTMHdzVjBGQlF6dEJRVUZFTEVOQlFVTXNRVUZTUkN4SlFWRkRPMEZCUlVRN1NVRkRTU3h2UWtGQmJVSXNTVUZCVlN4RlFVRlRMRWxCUVdkQ0xFVkJRVk1zUTBGQlV6dFJRVUZ5UkN4VFFVRkpMRWRCUVVvc1NVRkJTU3hEUVVGTk8xRkJRVk1zVTBGQlNTeEhRVUZLTEVsQlFVa3NRMEZCV1R0UlFVRlRMRTFCUVVNc1IwRkJSQ3hEUVVGRExFTkJRVkU3U1VGQlJ5eERRVUZETzBsQlEyaEdMR2xDUVVGRE8wRkJRVVFzUTBGQlF5eEJRVVpFTEVsQlJVTTdRVUZUUkR0SlFVZEpMRzlDUVVGdFFpeERRVUZUTEVWQlFWTXNSVUZCVlN4RlFVRkZMR05CUVcxRExFVkJRVVVzWTBGQmJVTXNSVUZCUlN4VFFVRTRRanRSUVVGMFNTeE5RVUZETEVkQlFVUXNRMEZCUXl4RFFVRlJPMUZCUVZNc1QwRkJSU3hIUVVGR0xFVkJRVVVzUTBGQlVUdFJRVU16UXl4SlFVRkpMRU5CUVVNc1ZVRkJWU3hIUVVGSExFbEJRVWtzUzBGQlN5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOd1F5eEpRVUZKTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRVU1zVDBGQlR5eERRVUZETEVWQlFVVTdXVUZCUlN4SlFVRkpMRU5CUVVNc1ZVRkJWU3hEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVa3NTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJSVGRFTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1JVRkJSU3hEUVVGRExFMUJRVTBzUTBGQlF6dFJRVUZETEU5QlFVOHNRMEZCUXl4RlFVRkZMRVZCUVVVN1dVRkROVUlzU1VGQlNTeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU51UWl4SlFVRkpMRU5CUVVNc1IwRkJWeXhqUVVGakxFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRlhMR05CUVdNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU5xUlN4SlFVRkpMRU5CUVVNc1IwRkJSeXhUUVVGVExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEY2tJc1NVRkJTU3hEUVVGRExGVkJRVlVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4VlFVRlZMRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzVTBGQlV5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRM2hFTEVsQlFVa3NRMEZCUXl4VlFVRlZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zVlVGQlZTeERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRk5CUVZNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0VFFVTXpSRHRKUVVOTUxFTkJRVU03U1VGVlJDeHRRMEZCWXl4SFFVRmtPMUZCUTBrc1NVRkJTU3hEUVVGRExFZEJRVWNzU1VGQlNTeExRVUZMTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRekZDTEV0QlFVc3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJReXhGUVVGRk8xbEJRemRDTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zYTBKQlFXdENMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VTBGRGNrTTdVVUZEUkN4UFFVRlBMRU5CUVVNc1EwRkJRenRKUVVOaUxFTkJRVU03U1VGUlJDeHpRMEZCYVVJc1IwRkJha0lzVlVGQmEwSXNTMEZCWVR0UlFVTXpRaXhQUVVGUExFbEJRVWtzUTBGQlF5eHJRa0ZCYTBJc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF6dEpRVU14UXl4RFFVRkRPMGxCUlVRc2RVTkJRV3RDTEVkQlFXeENMRlZCUVcxQ0xFdEJRV0VzUlVGQlJTeEhRVUZYTzFGQlEzcERMRTlCUVU4c1NVRkJTU3hEUVVGRExHdENRVUZyUWl4RFFVRkRMRXRCUVVzc1JVRkJSU3hIUVVGSExFTkJRVU1zUTBGQlF6dEpRVU12UXl4RFFVRkRPMGxCUzBRc2JVUkJRVGhDTEVkQlFUbENMRlZCUTBrc1MwRkJZU3hGUVVOaUxFZEJRVmNzUlVGRFdDeFJRVUU0UXp0UlFVVTVReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eEpRVUZKTEhOQ1FVRmhMRU5CUVdFc1ZVRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEpRVUZMTEU5QlFVRXNRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZXTEVOQlFWVXNRMEZCUXl4RlFVTjJSQ3hEUVVGRExFZEJRVk1zU1VGQlNTeERRVUZETEZWQlFWVXNRMEZCUXl4TFFVRkxMRU5CUVVNc1JVRkRhRU1zUlVGQlJTeEhRVUZsTEVsQlFVa3NWVUZCVlN4RFFVRkRMRU5CUVVNc1JVRkJReXhKUVVGSkxFVkJRVU1zUTBGQlF5eERRVUZETEVWQlEzcERMRmRCUVZjc1IwRkJSeXhGUVVGRkxFTkJRVU03VVVGRGNrSXNRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF6dFJRVU5ZTEU5QlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1MwRkJTeXhGUVVGRkxFVkJRVVU3V1VGRFpDeEZRVUZGTEVkQlFVY3NRMEZCUXl4RFFVRkRMRWRCUVVjc1JVRkJSU3hEUVVGRE8xbEJRMklzUTBGQlF5eEhRVUZITEVWQlFVVXNRMEZCUXl4SlFVRkpMRU5CUVVNN1dVRkRXaXhKUVVGSkxFTkJRVU1zUTBGQlF5eEZRVUZGTEV0QlFVc3NSMEZCUnl4RlFVRkZPMmRDUVVOa0xFMUJRVTA3WVVGRFZEdFpRVU5FTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhWUVVGVkxFTkJRVU1zVFVGQlRTeERRVUZETzFsQlFVTXNUMEZCVHl4RFFVRkRMRVZCUVVVc1JVRkJSVHRuUWtGRGNrTXNTVUZCU1N4VFFVRlRMRWRCUVVjc1EwRkJReXhEUVVGRExGVkJRVlVzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZETTBJc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eFZRVUZWTEVOQlFVTXNVMEZCVXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRE8yZENRVWQwUXl4SlFVRkpMRVZCUVVVc1EwRkJReXhKUVVGSkxFbEJRVWtzUTBGQlF5eERRVUZETEVWQlFVVXNTMEZCU3l4RlFVRkZMRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eEZRVUZGTzI5Q1FVRkZMRk5CUVZNN1owSkJTV3hFTEVsQlFVa3NUVUZCVFN4SFFVRkhMRU5CUVVNc1EwRkJReXhGUVVGRkxFZEJRVWNzUjBGQlJ5eEhRVUZITEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNN1owSkJReTlDTEVsQlFVY3NUVUZCVFN4SlFVRkpMRmRCUVZjc1NVRkJTU3hYUVVGWExFTkJRVU1zVFVGQlRTeERRVUZETEVsQlFVa3NSVUZCUlN4RFFVRkRMRU5CUVVNN2IwSkJRMjVFTEZOQlFWTTdaMEpCUldJc1NVRkJTU3hGUVVGRkxFZEJRVWNzUlVGQlJTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1VVRkJVU3hEUVVGRExFVkJRVVVzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRExFTkJRVU1zUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVU40UkN4RFFVRkRMRWRCUVVjc1JVRkJSU3hEUVVGRExFTkJRVU1zUjBGQlJ5eFRRVUZUTEVOQlFVTXNVVUZCVVN4SFFVRkhMRVZCUVVVc1EwRkJRenRuUWtGSGRrTXNWMEZCVnl4RFFVRkRMRTFCUVUwc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dG5Ra0ZEZUVJc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eEpRVUZKTEZWQlFWVXNRMEZCUXl4RFFVRkRMRVZCUVVVc1JVRkJSU3hGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdZVUZEY0VNN1UwRkRTanRSUVVORUxFbEJRVWtzU1VGQlNTeEhRVUZaTEVWQlFVVXNRMEZCUXp0UlFVTjJRaXhQUVVGUExFVkJRVVVzUTBGQlF5eEpRVUZKTEVWQlFVVTdXVUZEV2l4RlFVRkZMRWRCUVVjc1JVRkJSU3hEUVVGRExFbEJRVWtzUTBGQlF6dFpRVU5pTEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1JVRkJSU3hEUVVGRExFbEJRVWtzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXp0VFFVTjZRanRSUVVORUxFOUJRVThzU1VGQlNTeERRVUZETzBsQlEyaENMRU5CUVVNN1NVRkZUeXgxUTBGQmEwSXNSMEZCTVVJc1ZVRkJNa0lzUzBGQllTeEZRVUZGTEVsQlFXbENPMUZCUVdwQ0xIRkNRVUZCTEVWQlFVRXNVVUZCWjBJc1EwRkJRenRSUVVOMlJDeEpRVUZKTEVOQlFVTXNSMEZCUnl4SlFVRkpMSE5DUVVGaExFTkJRVThzVlVGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4SlFVRkxMRTlCUVVFc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRldMRU5CUVZVc1EwRkJReXhGUVVOcVJDeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRlZCUVZVc1EwRkJReXhOUVVGTkxFVkJRekZDTEVOQlFVTXNSMEZCWVN4SlFVRkpMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU12UWl4UFFVRlBMRU5CUVVNc1JVRkJSU3hGUVVGRk8xbEJRMUlzU1VGQlNTeEpRVUZKTEVkQlFWTXNTVUZCU1N4RFFVRkRMRlZCUVZVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU53UXl4SlFVRkpMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUzBGQlN5eExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEdsQ1FVRnBRaXhEUVVGRE8xbEJRM0JFTEVsQlFVa3NRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0VFFVTjZRanRSUVVORUxFOUJRVThzUTBGQlF5eERRVUZETEVOQlFVTXNTMEZCU3l4RlFVRkZMRVZCUVVVN1dVRkZaaXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNSMEZCUnl4RlFVRkZMRU5CUVVNN1dVRkRhRUlzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFsQlEyUXNTVUZCU1N4RFFVRkRMRU5CUVVNc1JVRkJSU3hMUVVGTExFbEJRVWtzUlVGQlJUdG5Ra0ZEWml4SlFVRkpMRWxCUVVrc1IwRkJZU3hGUVVGRkxFTkJRVU03WjBKQlEzaENMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dG5Ra0ZEVml4UFFVRlBMRTlCUVU4c1EwRkJReXhEUVVGRExFbEJRVWtzUzBGQlN5eFhRVUZYTEVWQlFVVTdiMEpCUTJ4RExFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF6dHZRa0ZEY2tJc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTTdhVUpCUTJRN1owSkJRMFFzVDBGQlR5eEpRVUZKTEVOQlFVTTdZVUZEWmp0WlFVTkVMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zVlVGQlZTeERRVUZETEUxQlFVMHNRMEZCUXp0WlFVRkRMRTlCUVU4c1EwRkJReXhGUVVGRkxFVkJRVVU3WjBKQlEycERMRWxCUVVrc1UwRkJVeXhIUVVGSExFTkJRVU1zUTBGQlF5eFZRVUZWTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1owSkJRMmhETEVsQlFVa3NRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhWUVVGVkxFTkJRVU1zVTBGQlV5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRPMmRDUVVOMFF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExGTkJRVk1zUTBGQlF5eFJRVUZSTEVOQlFVTTdaMEpCUTJwRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNTMEZCU3l4TlFVRk5MRU5CUVVNc1UwRkJVeXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZPMjlDUVVOeVF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenR2UWtGRFVpeERRVUZETEVOQlFVTXNTVUZCU1N4SFFVRkhMRU5CUVVNc1EwRkJRenR2UWtGRFdDeERRVUZETEVOQlFVTXNVMEZCVXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEZWQlFVTXNRMEZCUXl4RlFVRkRMRU5CUVVNc1NVRkJSeXhQUVVGQkxFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRlFMRU5CUVU4c1EwRkJReXhEUVVGRE8ybENRVU4yUXp0aFFVTktPMU5CUTBvN1VVRkRSQ3hQUVVGUExFTkJRVU1zUTBGQlF6dEpRVU5pTEVOQlFVTTdTVUZEVEN4cFFrRkJRenRCUVVGRUxFTkJRVU1zUVVGcVNVUXNTVUZwU1VNN1FVRnFTVmtzWjBOQlFWVWlmUT09IiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgUG9zaXRpb25TdGF0cyA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUG9zaXRpb25TdGF0cyhzY2FsZSkge1xuICAgICAgICB0aGlzLnNjYWxlID0gc2NhbGU7XG4gICAgICAgIHRoaXMuQUIgPSAwO1xuICAgICAgICB0aGlzLkFEID0gMDtcbiAgICAgICAgdGhpcy5BMiA9IDA7XG4gICAgfVxuICAgIFBvc2l0aW9uU3RhdHMucHJvdG90eXBlLmFkZFZhcmlhYmxlID0gZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgdmFyIGFpID0gdGhpcy5zY2FsZSAvIHYuc2NhbGU7XG4gICAgICAgIHZhciBiaSA9IHYub2Zmc2V0IC8gdi5zY2FsZTtcbiAgICAgICAgdmFyIHdpID0gdi53ZWlnaHQ7XG4gICAgICAgIHRoaXMuQUIgKz0gd2kgKiBhaSAqIGJpO1xuICAgICAgICB0aGlzLkFEICs9IHdpICogYWkgKiB2LmRlc2lyZWRQb3NpdGlvbjtcbiAgICAgICAgdGhpcy5BMiArPSB3aSAqIGFpICogYWk7XG4gICAgfTtcbiAgICBQb3NpdGlvblN0YXRzLnByb3RvdHlwZS5nZXRQb3NuID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gKHRoaXMuQUQgLSB0aGlzLkFCKSAvIHRoaXMuQTI7XG4gICAgfTtcbiAgICByZXR1cm4gUG9zaXRpb25TdGF0cztcbn0oKSk7XG5leHBvcnRzLlBvc2l0aW9uU3RhdHMgPSBQb3NpdGlvblN0YXRzO1xudmFyIENvbnN0cmFpbnQgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIENvbnN0cmFpbnQobGVmdCwgcmlnaHQsIGdhcCwgZXF1YWxpdHkpIHtcbiAgICAgICAgaWYgKGVxdWFsaXR5ID09PSB2b2lkIDApIHsgZXF1YWxpdHkgPSBmYWxzZTsgfVxuICAgICAgICB0aGlzLmxlZnQgPSBsZWZ0O1xuICAgICAgICB0aGlzLnJpZ2h0ID0gcmlnaHQ7XG4gICAgICAgIHRoaXMuZ2FwID0gZ2FwO1xuICAgICAgICB0aGlzLmVxdWFsaXR5ID0gZXF1YWxpdHk7XG4gICAgICAgIHRoaXMuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgIHRoaXMudW5zYXRpc2ZpYWJsZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLmxlZnQgPSBsZWZ0O1xuICAgICAgICB0aGlzLnJpZ2h0ID0gcmlnaHQ7XG4gICAgICAgIHRoaXMuZ2FwID0gZ2FwO1xuICAgICAgICB0aGlzLmVxdWFsaXR5ID0gZXF1YWxpdHk7XG4gICAgfVxuICAgIENvbnN0cmFpbnQucHJvdG90eXBlLnNsYWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy51bnNhdGlzZmlhYmxlID8gTnVtYmVyLk1BWF9WQUxVRVxuICAgICAgICAgICAgOiB0aGlzLnJpZ2h0LnNjYWxlICogdGhpcy5yaWdodC5wb3NpdGlvbigpIC0gdGhpcy5nYXBcbiAgICAgICAgICAgICAgICAtIHRoaXMubGVmdC5zY2FsZSAqIHRoaXMubGVmdC5wb3NpdGlvbigpO1xuICAgIH07XG4gICAgcmV0dXJuIENvbnN0cmFpbnQ7XG59KCkpO1xuZXhwb3J0cy5Db25zdHJhaW50ID0gQ29uc3RyYWludDtcbnZhciBWYXJpYWJsZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gVmFyaWFibGUoZGVzaXJlZFBvc2l0aW9uLCB3ZWlnaHQsIHNjYWxlKSB7XG4gICAgICAgIGlmICh3ZWlnaHQgPT09IHZvaWQgMCkgeyB3ZWlnaHQgPSAxOyB9XG4gICAgICAgIGlmIChzY2FsZSA9PT0gdm9pZCAwKSB7IHNjYWxlID0gMTsgfVxuICAgICAgICB0aGlzLmRlc2lyZWRQb3NpdGlvbiA9IGRlc2lyZWRQb3NpdGlvbjtcbiAgICAgICAgdGhpcy53ZWlnaHQgPSB3ZWlnaHQ7XG4gICAgICAgIHRoaXMuc2NhbGUgPSBzY2FsZTtcbiAgICAgICAgdGhpcy5vZmZzZXQgPSAwO1xuICAgIH1cbiAgICBWYXJpYWJsZS5wcm90b3R5cGUuZGZkdiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIDIuMCAqIHRoaXMud2VpZ2h0ICogKHRoaXMucG9zaXRpb24oKSAtIHRoaXMuZGVzaXJlZFBvc2l0aW9uKTtcbiAgICB9O1xuICAgIFZhcmlhYmxlLnByb3RvdHlwZS5wb3NpdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICh0aGlzLmJsb2NrLnBzLnNjYWxlICogdGhpcy5ibG9jay5wb3NuICsgdGhpcy5vZmZzZXQpIC8gdGhpcy5zY2FsZTtcbiAgICB9O1xuICAgIFZhcmlhYmxlLnByb3RvdHlwZS52aXNpdE5laWdoYm91cnMgPSBmdW5jdGlvbiAocHJldiwgZikge1xuICAgICAgICB2YXIgZmYgPSBmdW5jdGlvbiAoYywgbmV4dCkgeyByZXR1cm4gYy5hY3RpdmUgJiYgcHJldiAhPT0gbmV4dCAmJiBmKGMsIG5leHQpOyB9O1xuICAgICAgICB0aGlzLmNPdXQuZm9yRWFjaChmdW5jdGlvbiAoYykgeyByZXR1cm4gZmYoYywgYy5yaWdodCk7IH0pO1xuICAgICAgICB0aGlzLmNJbi5mb3JFYWNoKGZ1bmN0aW9uIChjKSB7IHJldHVybiBmZihjLCBjLmxlZnQpOyB9KTtcbiAgICB9O1xuICAgIHJldHVybiBWYXJpYWJsZTtcbn0oKSk7XG5leHBvcnRzLlZhcmlhYmxlID0gVmFyaWFibGU7XG52YXIgQmxvY2sgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEJsb2NrKHYpIHtcbiAgICAgICAgdGhpcy52YXJzID0gW107XG4gICAgICAgIHYub2Zmc2V0ID0gMDtcbiAgICAgICAgdGhpcy5wcyA9IG5ldyBQb3NpdGlvblN0YXRzKHYuc2NhbGUpO1xuICAgICAgICB0aGlzLmFkZFZhcmlhYmxlKHYpO1xuICAgIH1cbiAgICBCbG9jay5wcm90b3R5cGUuYWRkVmFyaWFibGUgPSBmdW5jdGlvbiAodikge1xuICAgICAgICB2LmJsb2NrID0gdGhpcztcbiAgICAgICAgdGhpcy52YXJzLnB1c2godik7XG4gICAgICAgIHRoaXMucHMuYWRkVmFyaWFibGUodik7XG4gICAgICAgIHRoaXMucG9zbiA9IHRoaXMucHMuZ2V0UG9zbigpO1xuICAgIH07XG4gICAgQmxvY2sucHJvdG90eXBlLnVwZGF0ZVdlaWdodGVkUG9zaXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMucHMuQUIgPSB0aGlzLnBzLkFEID0gdGhpcy5wcy5BMiA9IDA7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBuID0gdGhpcy52YXJzLmxlbmd0aDsgaSA8IG47ICsraSlcbiAgICAgICAgICAgIHRoaXMucHMuYWRkVmFyaWFibGUodGhpcy52YXJzW2ldKTtcbiAgICAgICAgdGhpcy5wb3NuID0gdGhpcy5wcy5nZXRQb3NuKCk7XG4gICAgfTtcbiAgICBCbG9jay5wcm90b3R5cGUuY29tcHV0ZV9sbSA9IGZ1bmN0aW9uICh2LCB1LCBwb3N0QWN0aW9uKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBkZmR2ID0gdi5kZmR2KCk7XG4gICAgICAgIHYudmlzaXROZWlnaGJvdXJzKHUsIGZ1bmN0aW9uIChjLCBuZXh0KSB7XG4gICAgICAgICAgICB2YXIgX2RmZHYgPSBfdGhpcy5jb21wdXRlX2xtKG5leHQsIHYsIHBvc3RBY3Rpb24pO1xuICAgICAgICAgICAgaWYgKG5leHQgPT09IGMucmlnaHQpIHtcbiAgICAgICAgICAgICAgICBkZmR2ICs9IF9kZmR2ICogYy5sZWZ0LnNjYWxlO1xuICAgICAgICAgICAgICAgIGMubG0gPSBfZGZkdjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGRmZHYgKz0gX2RmZHYgKiBjLnJpZ2h0LnNjYWxlO1xuICAgICAgICAgICAgICAgIGMubG0gPSAtX2RmZHY7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwb3N0QWN0aW9uKGMpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGRmZHYgLyB2LnNjYWxlO1xuICAgIH07XG4gICAgQmxvY2sucHJvdG90eXBlLnBvcHVsYXRlU3BsaXRCbG9jayA9IGZ1bmN0aW9uICh2LCBwcmV2KSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHYudmlzaXROZWlnaGJvdXJzKHByZXYsIGZ1bmN0aW9uIChjLCBuZXh0KSB7XG4gICAgICAgICAgICBuZXh0Lm9mZnNldCA9IHYub2Zmc2V0ICsgKG5leHQgPT09IGMucmlnaHQgPyBjLmdhcCA6IC1jLmdhcCk7XG4gICAgICAgICAgICBfdGhpcy5hZGRWYXJpYWJsZShuZXh0KTtcbiAgICAgICAgICAgIF90aGlzLnBvcHVsYXRlU3BsaXRCbG9jayhuZXh0LCB2KTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBCbG9jay5wcm90b3R5cGUudHJhdmVyc2UgPSBmdW5jdGlvbiAodmlzaXQsIGFjYywgdiwgcHJldikge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICBpZiAodiA9PT0gdm9pZCAwKSB7IHYgPSB0aGlzLnZhcnNbMF07IH1cbiAgICAgICAgaWYgKHByZXYgPT09IHZvaWQgMCkgeyBwcmV2ID0gbnVsbDsgfVxuICAgICAgICB2LnZpc2l0TmVpZ2hib3VycyhwcmV2LCBmdW5jdGlvbiAoYywgbmV4dCkge1xuICAgICAgICAgICAgYWNjLnB1c2godmlzaXQoYykpO1xuICAgICAgICAgICAgX3RoaXMudHJhdmVyc2UodmlzaXQsIGFjYywgbmV4dCwgdik7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgQmxvY2sucHJvdG90eXBlLmZpbmRNaW5MTSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG0gPSBudWxsO1xuICAgICAgICB0aGlzLmNvbXB1dGVfbG0odGhpcy52YXJzWzBdLCBudWxsLCBmdW5jdGlvbiAoYykge1xuICAgICAgICAgICAgaWYgKCFjLmVxdWFsaXR5ICYmIChtID09PSBudWxsIHx8IGMubG0gPCBtLmxtKSlcbiAgICAgICAgICAgICAgICBtID0gYztcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBtO1xuICAgIH07XG4gICAgQmxvY2sucHJvdG90eXBlLmZpbmRNaW5MTUJldHdlZW4gPSBmdW5jdGlvbiAobHYsIHJ2KSB7XG4gICAgICAgIHRoaXMuY29tcHV0ZV9sbShsdiwgbnVsbCwgZnVuY3Rpb24gKCkgeyB9KTtcbiAgICAgICAgdmFyIG0gPSBudWxsO1xuICAgICAgICB0aGlzLmZpbmRQYXRoKGx2LCBudWxsLCBydiwgZnVuY3Rpb24gKGMsIG5leHQpIHtcbiAgICAgICAgICAgIGlmICghYy5lcXVhbGl0eSAmJiBjLnJpZ2h0ID09PSBuZXh0ICYmIChtID09PSBudWxsIHx8IGMubG0gPCBtLmxtKSlcbiAgICAgICAgICAgICAgICBtID0gYztcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBtO1xuICAgIH07XG4gICAgQmxvY2sucHJvdG90eXBlLmZpbmRQYXRoID0gZnVuY3Rpb24gKHYsIHByZXYsIHRvLCB2aXNpdCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgZW5kRm91bmQgPSBmYWxzZTtcbiAgICAgICAgdi52aXNpdE5laWdoYm91cnMocHJldiwgZnVuY3Rpb24gKGMsIG5leHQpIHtcbiAgICAgICAgICAgIGlmICghZW5kRm91bmQgJiYgKG5leHQgPT09IHRvIHx8IF90aGlzLmZpbmRQYXRoKG5leHQsIHYsIHRvLCB2aXNpdCkpKSB7XG4gICAgICAgICAgICAgICAgZW5kRm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHZpc2l0KGMsIG5leHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGVuZEZvdW5kO1xuICAgIH07XG4gICAgQmxvY2sucHJvdG90eXBlLmlzQWN0aXZlRGlyZWN0ZWRQYXRoQmV0d2VlbiA9IGZ1bmN0aW9uICh1LCB2KSB7XG4gICAgICAgIGlmICh1ID09PSB2KVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIHZhciBpID0gdS5jT3V0Lmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgdmFyIGMgPSB1LmNPdXRbaV07XG4gICAgICAgICAgICBpZiAoYy5hY3RpdmUgJiYgdGhpcy5pc0FjdGl2ZURpcmVjdGVkUGF0aEJldHdlZW4oYy5yaWdodCwgdikpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG4gICAgQmxvY2suc3BsaXQgPSBmdW5jdGlvbiAoYykge1xuICAgICAgICBjLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gW0Jsb2NrLmNyZWF0ZVNwbGl0QmxvY2soYy5sZWZ0KSwgQmxvY2suY3JlYXRlU3BsaXRCbG9jayhjLnJpZ2h0KV07XG4gICAgfTtcbiAgICBCbG9jay5jcmVhdGVTcGxpdEJsb2NrID0gZnVuY3Rpb24gKHN0YXJ0VmFyKSB7XG4gICAgICAgIHZhciBiID0gbmV3IEJsb2NrKHN0YXJ0VmFyKTtcbiAgICAgICAgYi5wb3B1bGF0ZVNwbGl0QmxvY2soc3RhcnRWYXIsIG51bGwpO1xuICAgICAgICByZXR1cm4gYjtcbiAgICB9O1xuICAgIEJsb2NrLnByb3RvdHlwZS5zcGxpdEJldHdlZW4gPSBmdW5jdGlvbiAodmwsIHZyKSB7XG4gICAgICAgIHZhciBjID0gdGhpcy5maW5kTWluTE1CZXR3ZWVuKHZsLCB2cik7XG4gICAgICAgIGlmIChjICE9PSBudWxsKSB7XG4gICAgICAgICAgICB2YXIgYnMgPSBCbG9jay5zcGxpdChjKTtcbiAgICAgICAgICAgIHJldHVybiB7IGNvbnN0cmFpbnQ6IGMsIGxiOiBic1swXSwgcmI6IGJzWzFdIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfTtcbiAgICBCbG9jay5wcm90b3R5cGUubWVyZ2VBY3Jvc3MgPSBmdW5jdGlvbiAoYiwgYywgZGlzdCkge1xuICAgICAgICBjLmFjdGl2ZSA9IHRydWU7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBuID0gYi52YXJzLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICAgICAgdmFyIHYgPSBiLnZhcnNbaV07XG4gICAgICAgICAgICB2Lm9mZnNldCArPSBkaXN0O1xuICAgICAgICAgICAgdGhpcy5hZGRWYXJpYWJsZSh2KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnBvc24gPSB0aGlzLnBzLmdldFBvc24oKTtcbiAgICB9O1xuICAgIEJsb2NrLnByb3RvdHlwZS5jb3N0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgc3VtID0gMCwgaSA9IHRoaXMudmFycy5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgIHZhciB2ID0gdGhpcy52YXJzW2ldLCBkID0gdi5wb3NpdGlvbigpIC0gdi5kZXNpcmVkUG9zaXRpb247XG4gICAgICAgICAgICBzdW0gKz0gZCAqIGQgKiB2LndlaWdodDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3VtO1xuICAgIH07XG4gICAgcmV0dXJuIEJsb2NrO1xufSgpKTtcbmV4cG9ydHMuQmxvY2sgPSBCbG9jaztcbnZhciBCbG9ja3MgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEJsb2Nrcyh2cykge1xuICAgICAgICB0aGlzLnZzID0gdnM7XG4gICAgICAgIHZhciBuID0gdnMubGVuZ3RoO1xuICAgICAgICB0aGlzLmxpc3QgPSBuZXcgQXJyYXkobik7XG4gICAgICAgIHdoaWxlIChuLS0pIHtcbiAgICAgICAgICAgIHZhciBiID0gbmV3IEJsb2NrKHZzW25dKTtcbiAgICAgICAgICAgIHRoaXMubGlzdFtuXSA9IGI7XG4gICAgICAgICAgICBiLmJsb2NrSW5kID0gbjtcbiAgICAgICAgfVxuICAgIH1cbiAgICBCbG9ja3MucHJvdG90eXBlLmNvc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBzdW0gPSAwLCBpID0gdGhpcy5saXN0Lmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGktLSlcbiAgICAgICAgICAgIHN1bSArPSB0aGlzLmxpc3RbaV0uY29zdCgpO1xuICAgICAgICByZXR1cm4gc3VtO1xuICAgIH07XG4gICAgQmxvY2tzLnByb3RvdHlwZS5pbnNlcnQgPSBmdW5jdGlvbiAoYikge1xuICAgICAgICBiLmJsb2NrSW5kID0gdGhpcy5saXN0Lmxlbmd0aDtcbiAgICAgICAgdGhpcy5saXN0LnB1c2goYik7XG4gICAgfTtcbiAgICBCbG9ja3MucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIChiKSB7XG4gICAgICAgIHZhciBsYXN0ID0gdGhpcy5saXN0Lmxlbmd0aCAtIDE7XG4gICAgICAgIHZhciBzd2FwQmxvY2sgPSB0aGlzLmxpc3RbbGFzdF07XG4gICAgICAgIHRoaXMubGlzdC5sZW5ndGggPSBsYXN0O1xuICAgICAgICBpZiAoYiAhPT0gc3dhcEJsb2NrKSB7XG4gICAgICAgICAgICB0aGlzLmxpc3RbYi5ibG9ja0luZF0gPSBzd2FwQmxvY2s7XG4gICAgICAgICAgICBzd2FwQmxvY2suYmxvY2tJbmQgPSBiLmJsb2NrSW5kO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBCbG9ja3MucHJvdG90eXBlLm1lcmdlID0gZnVuY3Rpb24gKGMpIHtcbiAgICAgICAgdmFyIGwgPSBjLmxlZnQuYmxvY2ssIHIgPSBjLnJpZ2h0LmJsb2NrO1xuICAgICAgICB2YXIgZGlzdCA9IGMucmlnaHQub2Zmc2V0IC0gYy5sZWZ0Lm9mZnNldCAtIGMuZ2FwO1xuICAgICAgICBpZiAobC52YXJzLmxlbmd0aCA8IHIudmFycy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHIubWVyZ2VBY3Jvc3MobCwgYywgZGlzdCk7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZShsKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGwubWVyZ2VBY3Jvc3MociwgYywgLWRpc3QpO1xuICAgICAgICAgICAgdGhpcy5yZW1vdmUocik7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEJsb2Nrcy5wcm90b3R5cGUuZm9yRWFjaCA9IGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIHRoaXMubGlzdC5mb3JFYWNoKGYpO1xuICAgIH07XG4gICAgQmxvY2tzLnByb3RvdHlwZS51cGRhdGVCbG9ja1Bvc2l0aW9ucyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5saXN0LmZvckVhY2goZnVuY3Rpb24gKGIpIHsgcmV0dXJuIGIudXBkYXRlV2VpZ2h0ZWRQb3NpdGlvbigpOyB9KTtcbiAgICB9O1xuICAgIEJsb2Nrcy5wcm90b3R5cGUuc3BsaXQgPSBmdW5jdGlvbiAoaW5hY3RpdmUpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdGhpcy51cGRhdGVCbG9ja1Bvc2l0aW9ucygpO1xuICAgICAgICB0aGlzLmxpc3QuZm9yRWFjaChmdW5jdGlvbiAoYikge1xuICAgICAgICAgICAgdmFyIHYgPSBiLmZpbmRNaW5MTSgpO1xuICAgICAgICAgICAgaWYgKHYgIT09IG51bGwgJiYgdi5sbSA8IFNvbHZlci5MQUdSQU5HSUFOX1RPTEVSQU5DRSkge1xuICAgICAgICAgICAgICAgIGIgPSB2LmxlZnQuYmxvY2s7XG4gICAgICAgICAgICAgICAgQmxvY2suc3BsaXQodikuZm9yRWFjaChmdW5jdGlvbiAobmIpIHsgcmV0dXJuIF90aGlzLmluc2VydChuYik7IH0pO1xuICAgICAgICAgICAgICAgIF90aGlzLnJlbW92ZShiKTtcbiAgICAgICAgICAgICAgICBpbmFjdGl2ZS5wdXNoKHYpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuICAgIHJldHVybiBCbG9ja3M7XG59KCkpO1xuZXhwb3J0cy5CbG9ja3MgPSBCbG9ja3M7XG52YXIgU29sdmVyID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTb2x2ZXIodnMsIGNzKSB7XG4gICAgICAgIHRoaXMudnMgPSB2cztcbiAgICAgICAgdGhpcy5jcyA9IGNzO1xuICAgICAgICB0aGlzLnZzID0gdnM7XG4gICAgICAgIHZzLmZvckVhY2goZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgIHYuY0luID0gW10sIHYuY091dCA9IFtdO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5jcyA9IGNzO1xuICAgICAgICBjcy5mb3JFYWNoKGZ1bmN0aW9uIChjKSB7XG4gICAgICAgICAgICBjLmxlZnQuY091dC5wdXNoKGMpO1xuICAgICAgICAgICAgYy5yaWdodC5jSW4ucHVzaChjKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuaW5hY3RpdmUgPSBjcy5tYXAoZnVuY3Rpb24gKGMpIHsgYy5hY3RpdmUgPSBmYWxzZTsgcmV0dXJuIGM7IH0pO1xuICAgICAgICB0aGlzLmJzID0gbnVsbDtcbiAgICB9XG4gICAgU29sdmVyLnByb3RvdHlwZS5jb3N0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5icy5jb3N0KCk7XG4gICAgfTtcbiAgICBTb2x2ZXIucHJvdG90eXBlLnNldFN0YXJ0aW5nUG9zaXRpb25zID0gZnVuY3Rpb24gKHBzKSB7XG4gICAgICAgIHRoaXMuaW5hY3RpdmUgPSB0aGlzLmNzLm1hcChmdW5jdGlvbiAoYykgeyBjLmFjdGl2ZSA9IGZhbHNlOyByZXR1cm4gYzsgfSk7XG4gICAgICAgIHRoaXMuYnMgPSBuZXcgQmxvY2tzKHRoaXMudnMpO1xuICAgICAgICB0aGlzLmJzLmZvckVhY2goZnVuY3Rpb24gKGIsIGkpIHsgcmV0dXJuIGIucG9zbiA9IHBzW2ldOyB9KTtcbiAgICB9O1xuICAgIFNvbHZlci5wcm90b3R5cGUuc2V0RGVzaXJlZFBvc2l0aW9ucyA9IGZ1bmN0aW9uIChwcykge1xuICAgICAgICB0aGlzLnZzLmZvckVhY2goZnVuY3Rpb24gKHYsIGkpIHsgcmV0dXJuIHYuZGVzaXJlZFBvc2l0aW9uID0gcHNbaV07IH0pO1xuICAgIH07XG4gICAgU29sdmVyLnByb3RvdHlwZS5tb3N0VmlvbGF0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBtaW5TbGFjayA9IE51bWJlci5NQVhfVkFMVUUsIHYgPSBudWxsLCBsID0gdGhpcy5pbmFjdGl2ZSwgbiA9IGwubGVuZ3RoLCBkZWxldGVQb2ludCA9IG47XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICB2YXIgYyA9IGxbaV07XG4gICAgICAgICAgICBpZiAoYy51bnNhdGlzZmlhYmxlKVxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgdmFyIHNsYWNrID0gYy5zbGFjaygpO1xuICAgICAgICAgICAgaWYgKGMuZXF1YWxpdHkgfHwgc2xhY2sgPCBtaW5TbGFjaykge1xuICAgICAgICAgICAgICAgIG1pblNsYWNrID0gc2xhY2s7XG4gICAgICAgICAgICAgICAgdiA9IGM7XG4gICAgICAgICAgICAgICAgZGVsZXRlUG9pbnQgPSBpO1xuICAgICAgICAgICAgICAgIGlmIChjLmVxdWFsaXR5KVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoZGVsZXRlUG9pbnQgIT09IG4gJiZcbiAgICAgICAgICAgIChtaW5TbGFjayA8IFNvbHZlci5aRVJPX1VQUEVSQk9VTkQgJiYgIXYuYWN0aXZlIHx8IHYuZXF1YWxpdHkpKSB7XG4gICAgICAgICAgICBsW2RlbGV0ZVBvaW50XSA9IGxbbiAtIDFdO1xuICAgICAgICAgICAgbC5sZW5ndGggPSBuIC0gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdjtcbiAgICB9O1xuICAgIFNvbHZlci5wcm90b3R5cGUuc2F0aXNmeSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuYnMgPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5icyA9IG5ldyBCbG9ja3ModGhpcy52cyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5icy5zcGxpdCh0aGlzLmluYWN0aXZlKTtcbiAgICAgICAgdmFyIHYgPSBudWxsO1xuICAgICAgICB3aGlsZSAoKHYgPSB0aGlzLm1vc3RWaW9sYXRlZCgpKSAmJiAodi5lcXVhbGl0eSB8fCB2LnNsYWNrKCkgPCBTb2x2ZXIuWkVST19VUFBFUkJPVU5EICYmICF2LmFjdGl2ZSkpIHtcbiAgICAgICAgICAgIHZhciBsYiA9IHYubGVmdC5ibG9jaywgcmIgPSB2LnJpZ2h0LmJsb2NrO1xuICAgICAgICAgICAgaWYgKGxiICE9PSByYikge1xuICAgICAgICAgICAgICAgIHRoaXMuYnMubWVyZ2Uodik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAobGIuaXNBY3RpdmVEaXJlY3RlZFBhdGhCZXR3ZWVuKHYucmlnaHQsIHYubGVmdCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdi51bnNhdGlzZmlhYmxlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBzcGxpdCA9IGxiLnNwbGl0QmV0d2Vlbih2LmxlZnQsIHYucmlnaHQpO1xuICAgICAgICAgICAgICAgIGlmIChzcGxpdCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmJzLmluc2VydChzcGxpdC5sYik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYnMuaW5zZXJ0KHNwbGl0LnJiKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5icy5yZW1vdmUobGIpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmluYWN0aXZlLnB1c2goc3BsaXQuY29uc3RyYWludCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2LnVuc2F0aXNmaWFibGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHYuc2xhY2soKSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5hY3RpdmUucHVzaCh2KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYnMubWVyZ2Uodik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICBTb2x2ZXIucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnNhdGlzZnkoKTtcbiAgICAgICAgdmFyIGxhc3Rjb3N0ID0gTnVtYmVyLk1BWF9WQUxVRSwgY29zdCA9IHRoaXMuYnMuY29zdCgpO1xuICAgICAgICB3aGlsZSAoTWF0aC5hYnMobGFzdGNvc3QgLSBjb3N0KSA+IDAuMDAwMSkge1xuICAgICAgICAgICAgdGhpcy5zYXRpc2Z5KCk7XG4gICAgICAgICAgICBsYXN0Y29zdCA9IGNvc3Q7XG4gICAgICAgICAgICBjb3N0ID0gdGhpcy5icy5jb3N0KCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNvc3Q7XG4gICAgfTtcbiAgICBTb2x2ZXIuTEFHUkFOR0lBTl9UT0xFUkFOQ0UgPSAtMWUtNDtcbiAgICBTb2x2ZXIuWkVST19VUFBFUkJPVU5EID0gLTFlLTEwO1xuICAgIHJldHVybiBTb2x2ZXI7XG59KCkpO1xuZXhwb3J0cy5Tb2x2ZXIgPSBTb2x2ZXI7XG5mdW5jdGlvbiByZW1vdmVPdmVybGFwSW5PbmVEaW1lbnNpb24oc3BhbnMsIGxvd2VyQm91bmQsIHVwcGVyQm91bmQpIHtcbiAgICB2YXIgdnMgPSBzcGFucy5tYXAoZnVuY3Rpb24gKHMpIHsgcmV0dXJuIG5ldyBWYXJpYWJsZShzLmRlc2lyZWRDZW50ZXIpOyB9KTtcbiAgICB2YXIgY3MgPSBbXTtcbiAgICB2YXIgbiA9IHNwYW5zLmxlbmd0aDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG4gLSAxOyBpKyspIHtcbiAgICAgICAgdmFyIGxlZnQgPSBzcGFuc1tpXSwgcmlnaHQgPSBzcGFuc1tpICsgMV07XG4gICAgICAgIGNzLnB1c2gobmV3IENvbnN0cmFpbnQodnNbaV0sIHZzW2kgKyAxXSwgKGxlZnQuc2l6ZSArIHJpZ2h0LnNpemUpIC8gMikpO1xuICAgIH1cbiAgICB2YXIgbGVmdE1vc3QgPSB2c1swXSwgcmlnaHRNb3N0ID0gdnNbbiAtIDFdLCBsZWZ0TW9zdFNpemUgPSBzcGFuc1swXS5zaXplIC8gMiwgcmlnaHRNb3N0U2l6ZSA9IHNwYW5zW24gLSAxXS5zaXplIC8gMjtcbiAgICB2YXIgdkxvd2VyID0gbnVsbCwgdlVwcGVyID0gbnVsbDtcbiAgICBpZiAobG93ZXJCb3VuZCkge1xuICAgICAgICB2TG93ZXIgPSBuZXcgVmFyaWFibGUobG93ZXJCb3VuZCwgbGVmdE1vc3Qud2VpZ2h0ICogMTAwMCk7XG4gICAgICAgIHZzLnB1c2godkxvd2VyKTtcbiAgICAgICAgY3MucHVzaChuZXcgQ29uc3RyYWludCh2TG93ZXIsIGxlZnRNb3N0LCBsZWZ0TW9zdFNpemUpKTtcbiAgICB9XG4gICAgaWYgKHVwcGVyQm91bmQpIHtcbiAgICAgICAgdlVwcGVyID0gbmV3IFZhcmlhYmxlKHVwcGVyQm91bmQsIHJpZ2h0TW9zdC53ZWlnaHQgKiAxMDAwKTtcbiAgICAgICAgdnMucHVzaCh2VXBwZXIpO1xuICAgICAgICBjcy5wdXNoKG5ldyBDb25zdHJhaW50KHJpZ2h0TW9zdCwgdlVwcGVyLCByaWdodE1vc3RTaXplKSk7XG4gICAgfVxuICAgIHZhciBzb2x2ZXIgPSBuZXcgU29sdmVyKHZzLCBjcyk7XG4gICAgc29sdmVyLnNvbHZlKCk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbmV3Q2VudGVyczogdnMuc2xpY2UoMCwgc3BhbnMubGVuZ3RoKS5tYXAoZnVuY3Rpb24gKHYpIHsgcmV0dXJuIHYucG9zaXRpb24oKTsgfSksXG4gICAgICAgIGxvd2VyQm91bmQ6IHZMb3dlciA/IHZMb3dlci5wb3NpdGlvbigpIDogbGVmdE1vc3QucG9zaXRpb24oKSAtIGxlZnRNb3N0U2l6ZSxcbiAgICAgICAgdXBwZXJCb3VuZDogdlVwcGVyID8gdlVwcGVyLnBvc2l0aW9uKCkgOiByaWdodE1vc3QucG9zaXRpb24oKSArIHJpZ2h0TW9zdFNpemVcbiAgICB9O1xufVxuZXhwb3J0cy5yZW1vdmVPdmVybGFwSW5PbmVEaW1lbnNpb24gPSByZW1vdmVPdmVybGFwSW5PbmVEaW1lbnNpb247XG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0ptYVd4bElqb2lkbkJ6WXk1cWN5SXNJbk52ZFhKalpWSnZiM1FpT2lJaUxDSnpiM1Z5WTJWeklqcGJJaTR1THk0dUwxZGxZa052YkdFdmMzSmpMM1p3YzJNdWRITWlYU3dpYm1GdFpYTWlPbHRkTENKdFlYQndhVzVuY3lJNklqczdRVUZCU1R0SlFVdEpMSFZDUVVGdFFpeExRVUZoTzFGQlFXSXNWVUZCU3l4SFFVRk1MRXRCUVVzc1EwRkJVVHRSUVVwb1F5eFBRVUZGTEVkQlFWY3NRMEZCUXl4RFFVRkRPMUZCUTJZc1QwRkJSU3hIUVVGWExFTkJRVU1zUTBGQlF6dFJRVU5tTEU5QlFVVXNSMEZCVnl4RFFVRkRMRU5CUVVNN1NVRkZiMElzUTBGQlF6dEpRVVZ3UXl4dFEwRkJWeXhIUVVGWUxGVkJRVmtzUTBGQlZ6dFJRVU51UWl4SlFVRkpMRVZCUVVVc1IwRkJSeXhKUVVGSkxFTkJRVU1zUzBGQlN5eEhRVUZITEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNN1VVRkRPVUlzU1VGQlNTeEZRVUZGTEVkQlFVY3NRMEZCUXl4RFFVRkRMRTFCUVUwc1IwRkJSeXhEUVVGRExFTkJRVU1zUzBGQlN5eERRVUZETzFGQlF6VkNMRWxCUVVrc1JVRkJSU3hIUVVGSExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTTdVVUZEYkVJc1NVRkJTU3hEUVVGRExFVkJRVVVzU1VGQlNTeEZRVUZGTEVkQlFVY3NSVUZCUlN4SFFVRkhMRVZCUVVVc1EwRkJRenRSUVVONFFpeEpRVUZKTEVOQlFVTXNSVUZCUlN4SlFVRkpMRVZCUVVVc1IwRkJSeXhGUVVGRkxFZEJRVWNzUTBGQlF5eERRVUZETEdWQlFXVXNRMEZCUXp0UlFVTjJReXhKUVVGSkxFTkJRVU1zUlVGQlJTeEpRVUZKTEVWQlFVVXNSMEZCUnl4RlFVRkZMRWRCUVVjc1JVRkJSU3hEUVVGRE8wbEJRelZDTEVOQlFVTTdTVUZGUkN3clFrRkJUeXhIUVVGUU8xRkJRMGtzVDBGQlR5eERRVUZETEVsQlFVa3NRMEZCUXl4RlFVRkZMRWRCUVVjc1NVRkJTU3hEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4RlFVRkZMRU5CUVVNN1NVRkRla01zUTBGQlF6dEpRVU5NTEc5Q1FVRkRPMEZCUVVRc1EwRkJReXhCUVc1Q1JDeEpRVzFDUXp0QlFXNUNXU3h6UTBGQllUdEJRWEZDTVVJN1NVRkxTU3h2UWtGQmJVSXNTVUZCWXl4RlFVRlRMRXRCUVdVc1JVRkJVeXhIUVVGWExFVkJRVk1zVVVGQmVVSTdVVUZCZWtJc2VVSkJRVUVzUlVGQlFTeG5Ra0ZCZVVJN1VVRkJOVVlzVTBGQlNTeEhRVUZLTEVsQlFVa3NRMEZCVlR0UlFVRlRMRlZCUVVzc1IwRkJUQ3hMUVVGTExFTkJRVlU3VVVGQlV5eFJRVUZITEVkQlFVZ3NSMEZCUnl4RFFVRlJPMUZCUVZNc1lVRkJVU3hIUVVGU0xGRkJRVkVzUTBGQmFVSTdVVUZJTDBjc1YwRkJUU3hIUVVGWkxFdEJRVXNzUTBGQlF6dFJRVU40UWl4clFrRkJZU3hIUVVGWkxFdEJRVXNzUTBGQlF6dFJRVWN6UWl4SlFVRkpMRU5CUVVNc1NVRkJTU3hIUVVGSExFbEJRVWtzUTBGQlF6dFJRVU5xUWl4SlFVRkpMRU5CUVVNc1MwRkJTeXhIUVVGSExFdEJRVXNzUTBGQlF6dFJRVU51UWl4SlFVRkpMRU5CUVVNc1IwRkJSeXhIUVVGSExFZEJRVWNzUTBGQlF6dFJRVU5tTEVsQlFVa3NRMEZCUXl4UlFVRlJMRWRCUVVjc1VVRkJVU3hEUVVGRE8wbEJRemRDTEVOQlFVTTdTVUZGUkN3d1FrRkJTeXhIUVVGTU8xRkJRMGtzVDBGQlR5eEpRVUZKTEVOQlFVTXNZVUZCWVN4RFFVRkRMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU1zVTBGQlV6dFpRVU40UXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eExRVUZMTEVkQlFVY3NTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhSUVVGUkxFVkJRVVVzUjBGQlJ5eEpRVUZKTEVOQlFVTXNSMEZCUnp0clFrRkRia1FzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4TFFVRkxMRWRCUVVjc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eFJRVUZSTEVWQlFVVXNRMEZCUXp0SlFVTnFSQ3hEUVVGRE8wbEJRMHdzYVVKQlFVTTdRVUZCUkN4RFFVRkRMRUZCYWtKRUxFbEJhVUpETzBGQmFrSlpMR2REUVVGVk8wRkJiVUoyUWp0SlFVMUpMR3RDUVVGdFFpeGxRVUYxUWl4RlFVRlRMRTFCUVd0Q0xFVkJRVk1zUzBGQmFVSTdVVUZCTlVNc2RVSkJRVUVzUlVGQlFTeFZRVUZyUWp0UlFVRlRMSE5DUVVGQkxFVkJRVUVzVTBGQmFVSTdVVUZCTlVVc2IwSkJRV1VzUjBGQlppeGxRVUZsTEVOQlFWRTdVVUZCVXl4WFFVRk5MRWRCUVU0c1RVRkJUU3hEUVVGWk8xRkJRVk1zVlVGQlN5eEhRVUZNTEV0QlFVc3NRMEZCV1R0UlFVd3ZSaXhYUVVGTkxFZEJRVmNzUTBGQlF5eERRVUZETzBsQlN5dEZMRU5CUVVNN1NVRkZia2NzZFVKQlFVa3NSMEZCU2p0UlFVTkpMRTlCUVU4c1IwRkJSeXhIUVVGSExFbEJRVWtzUTBGQlF5eE5RVUZOTEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1VVRkJVU3hGUVVGRkxFZEJRVWNzU1VGQlNTeERRVUZETEdWQlFXVXNRMEZCUXl4RFFVRkRPMGxCUTNoRkxFTkJRVU03U1VGRlJDd3lRa0ZCVVN4SFFVRlNPMUZCUTBrc1QwRkJUeXhEUVVGRExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNSVUZCUlN4RFFVRkRMRXRCUVVzc1IwRkJSeXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVsQlFVa3NSMEZCUnl4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXp0SlFVTTVSU3hEUVVGRE8wbEJSMFFzYTBOQlFXVXNSMEZCWml4VlFVRm5RaXhKUVVGakxFVkJRVVVzUTBGQk1FTTdVVUZEZEVVc1NVRkJTU3hGUVVGRkxFZEJRVWNzVlVGQlF5eERRVUZETEVWQlFVVXNTVUZCU1N4SlFVRkxMRTlCUVVFc1EwRkJReXhEUVVGRExFMUJRVTBzU1VGQlNTeEpRVUZKTEV0QlFVc3NTVUZCU1N4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEVWQlFYWkRMRU5CUVhWRExFTkJRVU03VVVGRE9VUXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU1zVlVGQlFTeERRVUZETEVsQlFVY3NUMEZCUVN4RlFVRkZMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eExRVUZMTEVOQlFVTXNSVUZCWkN4RFFVRmpMRU5CUVVNc1EwRkJRenRSUVVOMFF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGQkxFTkJRVU1zU1VGQlJ5eFBRVUZCTEVWQlFVVXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eEZRVUZpTEVOQlFXRXNRMEZCUXl4RFFVRkRPMGxCUTNoRExFTkJRVU03U1VGRFRDeGxRVUZETzBGQlFVUXNRMEZCUXl4QlFYUkNSQ3hKUVhOQ1F6dEJRWFJDV1N3MFFrRkJVVHRCUVhkQ2NrSTdTVUZOU1N4bFFVRlpMRU5CUVZjN1VVRk1ka0lzVTBGQlNTeEhRVUZsTEVWQlFVVXNRMEZCUXp0UlFVMXNRaXhEUVVGRExFTkJRVU1zVFVGQlRTeEhRVUZITEVOQlFVTXNRMEZCUXp0UlFVTmlMRWxCUVVrc1EwRkJReXhGUVVGRkxFZEJRVWNzU1VGQlNTeGhRVUZoTEVOQlFVTXNRMEZCUXl4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRE8xRkJRM0pETEVsQlFVa3NRMEZCUXl4WFFVRlhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03U1VGRGVFSXNRMEZCUXp0SlFVVlBMREpDUVVGWExFZEJRVzVDTEZWQlFXOUNMRU5CUVZjN1VVRkRNMElzUTBGQlF5eERRVUZETEV0QlFVc3NSMEZCUnl4SlFVRkpMRU5CUVVNN1VVRkRaaXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOc1FpeEpRVUZKTEVOQlFVTXNSVUZCUlN4RFFVRkRMRmRCUVZjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU4yUWl4SlFVRkpMRU5CUVVNc1NVRkJTU3hIUVVGSExFbEJRVWtzUTBGQlF5eEZRVUZGTEVOQlFVTXNUMEZCVHl4RlFVRkZMRU5CUVVNN1NVRkRiRU1zUTBGQlF6dEpRVWRFTEhORFFVRnpRaXhIUVVGMFFqdFJRVU5KTEVsQlFVa3NRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hIUVVGSExFbEJRVWtzUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4SFFVRkhMRWxCUVVrc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXp0UlFVTjZReXhMUVVGTExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eE5RVUZOTEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU03V1VGRE5VTXNTVUZCU1N4RFFVRkRMRVZCUVVVc1EwRkJReXhYUVVGWExFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRM1JETEVsQlFVa3NRMEZCUXl4SlFVRkpMRWRCUVVjc1NVRkJTU3hEUVVGRExFVkJRVVVzUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXp0SlFVTnNReXhEUVVGRE8wbEJSVThzTUVKQlFWVXNSMEZCYkVJc1ZVRkJiVUlzUTBGQlZ5eEZRVUZGTEVOQlFWY3NSVUZCUlN4VlFVRnBRenRSUVVFNVJTeHBRa0ZqUXp0UlFXSkhMRWxCUVVrc1NVRkJTU3hIUVVGSExFTkJRVU1zUTBGQlF5eEpRVUZKTEVWQlFVVXNRMEZCUXp0UlFVTndRaXhEUVVGRExFTkJRVU1zWlVGQlpTeERRVUZETEVOQlFVTXNSVUZCUlN4VlFVRkRMRU5CUVVNc1JVRkJSU3hKUVVGSk8xbEJRM3BDTEVsQlFVa3NTMEZCU3l4SFFVRkhMRXRCUVVrc1EwRkJReXhWUVVGVkxFTkJRVU1zU1VGQlNTeEZRVUZGTEVOQlFVTXNSVUZCUlN4VlFVRlZMRU5CUVVNc1EwRkJRenRaUVVOcVJDeEpRVUZKTEVsQlFVa3NTMEZCU3l4RFFVRkRMRU5CUVVNc1MwRkJTeXhGUVVGRk8yZENRVU5zUWl4SlFVRkpMRWxCUVVrc1MwRkJTeXhIUVVGSExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRPMmRDUVVNM1FpeERRVUZETEVOQlFVTXNSVUZCUlN4SFFVRkhMRXRCUVVzc1EwRkJRenRoUVVOb1FqdHBRa0ZCVFR0blFrRkRTQ3hKUVVGSkxFbEJRVWtzUzBGQlN5eEhRVUZITEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1MwRkJTeXhEUVVGRE8yZENRVU01UWl4RFFVRkRMRU5CUVVNc1JVRkJSU3hIUVVGSExFTkJRVU1zUzBGQlN5eERRVUZETzJGQlEycENPMWxCUTBRc1ZVRkJWU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlEyeENMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRMGdzVDBGQlR5eEpRVUZKTEVkQlFVY3NRMEZCUXl4RFFVRkRMRXRCUVVzc1EwRkJRenRKUVVNeFFpeERRVUZETzBsQlJVOHNhME5CUVd0Q0xFZEJRVEZDTEZWQlFUSkNMRU5CUVZjc1JVRkJSU3hKUVVGak8xRkJRWFJFTEdsQ1FVMURPMUZCVEVjc1EwRkJReXhEUVVGRExHVkJRV1VzUTBGQlF5eEpRVUZKTEVWQlFVVXNWVUZCUXl4RFFVRkRMRVZCUVVVc1NVRkJTVHRaUVVNMVFpeEpRVUZKTEVOQlFVTXNUVUZCVFN4SFFVRkhMRU5CUVVNc1EwRkJReXhOUVVGTkxFZEJRVWNzUTBGQlF5eEpRVUZKTEV0QlFVc3NRMEZCUXl4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdXVUZETjBRc1MwRkJTU3hEUVVGRExGZEJRVmNzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0WlFVTjJRaXhMUVVGSkxFTkJRVU1zYTBKQlFXdENMRU5CUVVNc1NVRkJTU3hGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzFGQlEzSkRMRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJRMUFzUTBGQlF6dEpRVWRFTEhkQ1FVRlJMRWRCUVZJc1ZVRkJVeXhMUVVFMlFpeEZRVUZGTEVkQlFWVXNSVUZCUlN4RFFVRXdRaXhGUVVGRkxFbEJRVzFDTzFGQlFXNUhMR2xDUVV0RE8xRkJURzFFTEd0Q1FVRkJMRVZCUVVFc1NVRkJZeXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVRkZMSEZDUVVGQkxFVkJRVUVzVjBGQmJVSTdVVUZETDBZc1EwRkJReXhEUVVGRExHVkJRV1VzUTBGQlF5eEpRVUZKTEVWQlFVVXNWVUZCUXl4RFFVRkRMRVZCUVVVc1NVRkJTVHRaUVVNMVFpeEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFsQlEyNUNMRXRCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zUzBGQlN5eEZRVUZGTEVkQlFVY3NSVUZCUlN4SlFVRkpMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRGRrTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRVQ3hEUVVGRE8wbEJTMFFzZVVKQlFWTXNSMEZCVkR0UlFVTkpMRWxCUVVrc1EwRkJReXhIUVVGbExFbEJRVWtzUTBGQlF6dFJRVU42UWl4SlFVRkpMRU5CUVVNc1ZVRkJWU3hEUVVGRExFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1NVRkJTU3hGUVVGRkxGVkJRVUVzUTBGQlF6dFpRVU5xUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExGRkJRVkVzU1VGQlNTeERRVUZETEVOQlFVTXNTMEZCU3l4SlFVRkpMRWxCUVVrc1EwRkJReXhEUVVGRExFVkJRVVVzUjBGQlJ5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRPMmRDUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdVVUZETVVRc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRFNDeFBRVUZQTEVOQlFVTXNRMEZCUXp0SlFVTmlMRU5CUVVNN1NVRkZUeXhuUTBGQlowSXNSMEZCZUVJc1ZVRkJlVUlzUlVGQldTeEZRVUZGTEVWQlFWazdVVUZETDBNc1NVRkJTU3hEUVVGRExGVkJRVlVzUTBGQlF5eEZRVUZGTEVWQlFVVXNTVUZCU1N4RlFVRkZMR05CUVU4c1EwRkJReXhEUVVGRExFTkJRVU03VVVGRGNFTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRE8xRkJRMklzU1VGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4RlFVRkZMRVZCUVVVc1NVRkJTU3hGUVVGRkxFVkJRVVVzUlVGQlJTeFZRVUZETEVOQlFVTXNSVUZCUlN4SlFVRkpPMWxCUTJoRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNVVUZCVVN4SlFVRkpMRU5CUVVNc1EwRkJReXhMUVVGTExFdEJRVXNzU1VGQlNTeEpRVUZKTEVOQlFVTXNRMEZCUXl4TFFVRkxMRWxCUVVrc1NVRkJTU3hEUVVGRExFTkJRVU1zUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNN1owSkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0UlFVTTVSU3hEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU5JTEU5QlFVOHNRMEZCUXl4RFFVRkRPMGxCUTJJc1EwRkJRenRKUVVWUExIZENRVUZSTEVkQlFXaENMRlZCUVdsQ0xFTkJRVmNzUlVGQlJTeEpRVUZqTEVWQlFVVXNSVUZCV1N4RlFVRkZMRXRCUVRKRE8xRkJRWFpITEdsQ1FWVkRPMUZCVkVjc1NVRkJTU3hSUVVGUkxFZEJRVWNzUzBGQlN5eERRVUZETzFGQlEzSkNMRU5CUVVNc1EwRkJReXhsUVVGbExFTkJRVU1zU1VGQlNTeEZRVUZGTEZWQlFVTXNRMEZCUXl4RlFVRkZMRWxCUVVrN1dVRkROVUlzU1VGQlNTeERRVUZETEZGQlFWRXNTVUZCU1N4RFFVRkRMRWxCUVVrc1MwRkJTeXhGUVVGRkxFbEJRVWtzUzBGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4SlFVRkpMRVZCUVVVc1EwRkJReXhGUVVGRkxFVkJRVVVzUlVGQlJTeExRVUZMTEVOQlFVTXNRMEZCUXl4RlFVTnVSVHRuUWtGRFNTeFJRVUZSTEVkQlFVY3NTVUZCU1N4RFFVRkRPMmRDUVVOb1FpeExRVUZMTEVOQlFVTXNRMEZCUXl4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRE8yRkJRMnhDTzFGQlEwd3NRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRTQ3hQUVVGUExGRkJRVkVzUTBGQlF6dEpRVU53UWl4RFFVRkRPMGxCU1VRc01rTkJRVEpDTEVkQlFUTkNMRlZCUVRSQ0xFTkJRVmNzUlVGQlJTeERRVUZYTzFGQlEyaEVMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU03V1VGQlJTeFBRVUZQTEVsQlFVa3NRMEZCUXp0UlFVTjZRaXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJRenRSUVVOMFFpeFBRVUZOTEVOQlFVTXNSVUZCUlN4RlFVRkZPMWxCUTFBc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVOc1FpeEpRVUZKTEVOQlFVTXNRMEZCUXl4TlFVRk5MRWxCUVVrc1NVRkJTU3hEUVVGRExESkNRVUV5UWl4RFFVRkRMRU5CUVVNc1EwRkJReXhMUVVGTExFVkJRVVVzUTBGQlF5eERRVUZETzJkQ1FVTjRSQ3hQUVVGUExFbEJRVWtzUTBGQlF6dFRRVU51UWp0UlFVTkVMRTlCUVU4c1MwRkJTeXhEUVVGRE8wbEJRMnBDTEVOQlFVTTdTVUZIVFN4WFFVRkxMRWRCUVZvc1ZVRkJZU3hEUVVGaE8xRkJTM1JDTEVOQlFVTXNRMEZCUXl4TlFVRk5MRWRCUVVjc1MwRkJTeXhEUVVGRE8xRkJRMnBDTEU5QlFVOHNRMEZCUXl4TFFVRkxMRU5CUVVNc1owSkJRV2RDTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhGUVVGRkxFdEJRVXNzUTBGQlF5eG5Ra0ZCWjBJc1EwRkJReXhEUVVGRExFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXp0SlFVTTNSU3hEUVVGRE8wbEJSV01zYzBKQlFXZENMRWRCUVM5Q0xGVkJRV2RETEZGQlFXdENPMUZCUXpsRExFbEJRVWtzUTBGQlF5eEhRVUZITEVsQlFVa3NTMEZCU3l4RFFVRkRMRkZCUVZFc1EwRkJReXhEUVVGRE8xRkJRelZDTEVOQlFVTXNRMEZCUXl4clFrRkJhMElzUTBGQlF5eFJRVUZSTEVWQlFVVXNTVUZCU1N4RFFVRkRMRU5CUVVNN1VVRkRja01zVDBGQlR5eERRVUZETEVOQlFVTTdTVUZEWWl4RFFVRkRPMGxCUjBRc05FSkJRVmtzUjBGQldpeFZRVUZoTEVWQlFWa3NSVUZCUlN4RlFVRlpPMUZCUzI1RExFbEJRVWtzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4blFrRkJaMElzUTBGQlF5eEZRVUZGTEVWQlFVVXNSVUZCUlN4RFFVRkRMRU5CUVVNN1VVRkRkRU1zU1VGQlNTeERRVUZETEV0QlFVc3NTVUZCU1N4RlFVRkZPMWxCUTFvc1NVRkJTU3hGUVVGRkxFZEJRVWNzUzBGQlN5eERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVONFFpeFBRVUZQTEVWQlFVVXNWVUZCVlN4RlFVRkZMRU5CUVVNc1JVRkJSU3hGUVVGRkxFVkJRVVVzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRVZCUVVVc1JVRkJSU3hGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXp0VFFVTnNSRHRSUVVWRUxFOUJRVThzU1VGQlNTeERRVUZETzBsQlEyaENMRU5CUVVNN1NVRkZSQ3d5UWtGQlZ5eEhRVUZZTEZWQlFWa3NRMEZCVVN4RlFVRkZMRU5CUVdFc1JVRkJSU3hKUVVGWk8xRkJRemRETEVOQlFVTXNRMEZCUXl4TlFVRk5MRWRCUVVjc1NVRkJTU3hEUVVGRE8xRkJRMmhDTEV0QlFVc3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRTFCUVUwc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RlFVRkZPMWxCUXpORExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGJFSXNRMEZCUXl4RFFVRkRMRTFCUVUwc1NVRkJTU3hKUVVGSkxFTkJRVU03V1VGRGFrSXNTVUZCU1N4RFFVRkRMRmRCUVZjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFRRVU4yUWp0UlFVTkVMRWxCUVVrc1EwRkJReXhKUVVGSkxFZEJRVWNzU1VGQlNTeERRVUZETEVWQlFVVXNRMEZCUXl4UFFVRlBMRVZCUVVVc1EwRkJRenRKUVVOc1F5eERRVUZETzBsQlJVUXNiMEpCUVVrc1IwRkJTanRSUVVOSkxFbEJRVWtzUjBGQlJ5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTTdVVUZEYkVNc1QwRkJUeXhEUVVGRExFVkJRVVVzUlVGQlJUdFpRVU5TTEVsQlFVa3NRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVWQlEyaENMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zVVVGQlVTeEZRVUZGTEVkQlFVY3NRMEZCUXl4RFFVRkRMR1ZCUVdVc1EwRkJRenRaUVVONlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETzFOQlF6TkNPMUZCUTBRc1QwRkJUeXhIUVVGSExFTkJRVU03U1VGRFppeERRVUZETzBsQlUwd3NXVUZCUXp0QlFVRkVMRU5CUVVNc1FVRnNTMFFzU1VGclMwTTdRVUZzUzFrc2MwSkJRVXM3UVVGdlMyeENPMGxCUjBrc1owSkJRVzFDTEVWQlFXTTdVVUZCWkN4UFFVRkZMRWRCUVVZc1JVRkJSU3hEUVVGWk8xRkJRemRDTEVsQlFVa3NRMEZCUXl4SFFVRkhMRVZCUVVVc1EwRkJReXhOUVVGTkxFTkJRVU03VVVGRGJFSXNTVUZCU1N4RFFVRkRMRWxCUVVrc1IwRkJSeXhKUVVGSkxFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTjZRaXhQUVVGUExFTkJRVU1zUlVGQlJTeEZRVUZGTzFsQlExSXNTVUZCU1N4RFFVRkRMRWRCUVVjc1NVRkJTU3hMUVVGTExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRla0lzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU03V1VGRGFrSXNRMEZCUXl4RFFVRkRMRkZCUVZFc1IwRkJSeXhEUVVGRExFTkJRVU03VTBGRGJFSTdTVUZEVEN4RFFVRkRPMGxCUlVRc2NVSkJRVWtzUjBGQlNqdFJRVU5KTEVsQlFVa3NSMEZCUnl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNN1VVRkRiRU1zVDBGQlR5eERRVUZETEVWQlFVVTdXVUZCUlN4SFFVRkhMRWxCUVVrc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMRVZCUVVVc1EwRkJRenRSUVVOMlF5eFBRVUZQTEVkQlFVY3NRMEZCUXp0SlFVTm1MRU5CUVVNN1NVRkZSQ3gxUWtGQlRTeEhRVUZPTEZWQlFVOHNRMEZCVVR0UlFVbFlMRU5CUVVNc1EwRkJReXhSUVVGUkxFZEJRVWNzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNN1VVRkRPVUlzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03U1VGTGRFSXNRMEZCUXp0SlFVVkVMSFZDUVVGTkxFZEJRVTRzVlVGQlR5eERRVUZSTzFGQlMxZ3NTVUZCU1N4SlFVRkpMRWRCUVVjc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eE5RVUZOTEVkQlFVY3NRMEZCUXl4RFFVRkRPMUZCUTJoRExFbEJRVWtzVTBGQlV5eEhRVUZITEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03VVVGRGFFTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhOUVVGTkxFZEJRVWNzU1VGQlNTeERRVUZETzFGQlEzaENMRWxCUVVrc1EwRkJReXhMUVVGTExGTkJRVk1zUlVGQlJUdFpRVU5xUWl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eFJRVUZSTEVOQlFVTXNSMEZCUnl4VFFVRlRMRU5CUVVNN1dVRkRiRU1zVTBGQlV5eERRVUZETEZGQlFWRXNSMEZCUnl4RFFVRkRMRU5CUVVNc1VVRkJVU3hEUVVGRE8xTkJTVzVETzBsQlEwd3NRMEZCUXp0SlFVbEVMSE5DUVVGTExFZEJRVXdzVlVGQlRTeERRVUZoTzFGQlEyWXNTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eExRVUZMTEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhMUVVGTExFTkJRVU1zUzBGQlN5eERRVUZETzFGQlNYaERMRWxCUVVrc1NVRkJTU3hIUVVGSExFTkJRVU1zUTBGQlF5eExRVUZMTEVOQlFVTXNUVUZCVFN4SFFVRkhMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zVFVGQlRTeEhRVUZITEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNN1VVRkRiRVFzU1VGQlNTeERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRTFCUVUwc1IwRkJSeXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEUxQlFVMHNSVUZCUlR0WlFVTXZRaXhEUVVGRExFTkJRVU1zVjBGQlZ5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1NVRkJTU3hEUVVGRExFTkJRVU03V1VGRE1VSXNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFRRVU5zUWp0aFFVRk5PMWxCUTBnc1EwRkJReXhEUVVGRExGZEJRVmNzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03V1VGRE0wSXNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFRRVU5zUWp0SlFVdE1MRU5CUVVNN1NVRkZSQ3gzUWtGQlR5eEhRVUZRTEZWQlFWRXNRMEZCWjBNN1VVRkRjRU1zU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4UFFVRlBMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03U1VGRGVrSXNRMEZCUXp0SlFVZEVMSEZEUVVGdlFpeEhRVUZ3UWp0UlFVTkpMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZETEZWQlFVRXNRMEZCUXl4SlFVRkhMRTlCUVVFc1EwRkJReXhEUVVGRExITkNRVUZ6UWl4RlFVRkZMRVZCUVRGQ0xFTkJRVEJDTEVOQlFVTXNRMEZCUXp0SlFVTjBSQ3hEUVVGRE8wbEJSMFFzYzBKQlFVc3NSMEZCVEN4VlFVRk5MRkZCUVhOQ08xRkJRVFZDTEdsQ1FXVkRPMUZCWkVjc1NVRkJTU3hEUVVGRExHOUNRVUZ2UWl4RlFVRkZMRU5CUVVNN1VVRkROVUlzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4UFFVRlBMRU5CUVVNc1ZVRkJRU3hEUVVGRE8xbEJRMllzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRk5CUVZNc1JVRkJSU3hEUVVGRE8xbEJRM1JDTEVsQlFVa3NRMEZCUXl4TFFVRkxMRWxCUVVrc1NVRkJTU3hEUVVGRExFTkJRVU1zUlVGQlJTeEhRVUZITEUxQlFVMHNRMEZCUXl4dlFrRkJiMElzUlVGQlJUdG5Ra0ZEYkVRc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRPMmRDUVVOcVFpeExRVUZMTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFOUJRVThzUTBGQlF5eFZRVUZCTEVWQlFVVXNTVUZCUlN4UFFVRkJMRXRCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFXWXNRMEZCWlN4RFFVRkRMRU5CUVVNN1owSkJRelZETEV0QlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03WjBKQlEyWXNVVUZCVVN4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dGhRVXR3UWp0UlFVTk1MRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJRMUFzUTBGQlF6dEpRVzlDVEN4aFFVRkRPMEZCUVVRc1EwRkJReXhCUVd4SVJDeEpRV3RJUXp0QlFXeElXU3gzUWtGQlRUdEJRVzlJYmtJN1NVRlBTU3huUWtGQmJVSXNSVUZCWXl4RlFVRlRMRVZCUVdkQ08xRkJRWFpETEU5QlFVVXNSMEZCUml4RlFVRkZMRU5CUVZrN1VVRkJVeXhQUVVGRkxFZEJRVVlzUlVGQlJTeERRVUZqTzFGQlEzUkVMRWxCUVVrc1EwRkJReXhGUVVGRkxFZEJRVWNzUlVGQlJTeERRVUZETzFGQlEySXNSVUZCUlN4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGQkxFTkJRVU03V1VGRFVpeERRVUZETEVOQlFVTXNSMEZCUnl4SFFVRkhMRVZCUVVVc1JVRkJSU3hEUVVGRExFTkJRVU1zU1VGQlNTeEhRVUZITEVWQlFVVXNRMEZCUXp0UlFVazFRaXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU5JTEVsQlFVa3NRMEZCUXl4RlFVRkZMRWRCUVVjc1JVRkJSU3hEUVVGRE8xRkJRMklzUlVGQlJTeERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRkJMRU5CUVVNN1dVRkRVaXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGNFSXNRMEZCUXl4RFFVRkRMRXRCUVVzc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCU1hoQ0xFTkJRVU1zUTBGQlF5eERRVUZETzFGQlEwZ3NTVUZCU1N4RFFVRkRMRkZCUVZFc1IwRkJSeXhGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEZWQlFVRXNRMEZCUXl4SlFVRkxMRU5CUVVNc1EwRkJReXhOUVVGTkxFZEJRVWNzUzBGQlN5eERRVUZETEVOQlFVTXNUMEZCVHl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU0xUkN4SlFVRkpMRU5CUVVNc1JVRkJSU3hIUVVGSExFbEJRVWtzUTBGQlF6dEpRVU51UWl4RFFVRkRPMGxCUlVRc2NVSkJRVWtzUjBGQlNqdFJRVU5KTEU5QlFVOHNTVUZCU1N4RFFVRkRMRVZCUVVVc1EwRkJReXhKUVVGSkxFVkJRVVVzUTBGQlF6dEpRVU14UWl4RFFVRkRPMGxCU1VRc2NVTkJRVzlDTEVkQlFYQkNMRlZCUVhGQ0xFVkJRVms3VVVGRE4wSXNTVUZCU1N4RFFVRkRMRkZCUVZFc1IwRkJSeXhKUVVGSkxFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4VlFVRkJMRU5CUVVNc1NVRkJTeXhEUVVGRExFTkJRVU1zVFVGQlRTeEhRVUZITEV0QlFVc3NRMEZCUXl4RFFVRkRMRTlCUVU4c1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEYWtVc1NVRkJTU3hEUVVGRExFVkJRVVVzUjBGQlJ5eEpRVUZKTEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU03VVVGRE9VSXNTVUZCU1N4RFFVRkRMRVZCUVVVc1EwRkJReXhQUVVGUExFTkJRVU1zVlVGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4SlFVRkxMRTlCUVVFc1EwRkJReXhEUVVGRExFbEJRVWtzUjBGQlJ5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVdRc1EwRkJZeXhEUVVGRExFTkJRVU03U1VGRE9VTXNRMEZCUXp0SlFVVkVMRzlEUVVGdFFpeEhRVUZ1UWl4VlFVRnZRaXhGUVVGWk8xRkJRelZDTEVsQlFVa3NRMEZCUXl4RlFVRkZMRU5CUVVNc1QwRkJUeXhEUVVGRExGVkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNTVUZCU3l4UFFVRkJMRU5CUVVNc1EwRkJReXhsUVVGbExFZEJRVWNzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRjZRaXhEUVVGNVFpeERRVUZETEVOQlFVTTdTVUZEZWtRc1EwRkJRenRKUVRKQ1R5dzJRa0ZCV1N4SFFVRndRanRSUVVOSkxFbEJRVWtzVVVGQlVTeEhRVUZITEUxQlFVMHNRMEZCUXl4VFFVRlRMRVZCUXpOQ0xFTkJRVU1zUjBGQlpTeEpRVUZKTEVWQlEzQkNMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zVVVGQlVTeEZRVU5xUWl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFMUJRVTBzUlVGRFdpeFhRVUZYTEVkQlFVY3NRMEZCUXl4RFFVRkRPMUZCUTNCQ0xFdEJRVXNzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUlVGQlJTeERRVUZETEVWQlFVVTdXVUZEZUVJc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTJJc1NVRkJTU3hEUVVGRExFTkJRVU1zWVVGQllUdG5Ra0ZCUlN4VFFVRlRPMWxCUXpsQ0xFbEJRVWtzUzBGQlN5eEhRVUZITEVOQlFVTXNRMEZCUXl4TFFVRkxMRVZCUVVVc1EwRkJRenRaUVVOMFFpeEpRVUZKTEVOQlFVTXNRMEZCUXl4UlFVRlJMRWxCUVVrc1MwRkJTeXhIUVVGSExGRkJRVkVzUlVGQlJUdG5Ra0ZEYUVNc1VVRkJVU3hIUVVGSExFdEJRVXNzUTBGQlF6dG5Ra0ZEYWtJc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dG5Ra0ZEVGl4WFFVRlhMRWRCUVVjc1EwRkJReXhEUVVGRE8yZENRVU5vUWl4SlFVRkpMRU5CUVVNc1EwRkJReXhSUVVGUk8yOUNRVUZGTEUxQlFVMDdZVUZEZWtJN1UwRkRTanRSUVVORUxFbEJRVWtzVjBGQlZ5eExRVUZMTEVOQlFVTTdXVUZEYWtJc1EwRkJReXhSUVVGUkxFZEJRVWNzVFVGQlRTeERRVUZETEdWQlFXVXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhOUVVGTkxFbEJRVWtzUTBGQlF5eERRVUZETEZGQlFWRXNRMEZCUXl4RlFVTnNSVHRaUVVOSkxFTkJRVU1zUTBGQlF5eFhRVUZYTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETzFsQlF6RkNMRU5CUVVNc1EwRkJReXhOUVVGTkxFZEJRVWNzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0VFFVTndRanRSUVVORUxFOUJRVThzUTBGQlF5eERRVUZETzBsQlEySXNRMEZCUXp0SlFVbEVMSGRDUVVGUExFZEJRVkE3VVVGRFNTeEpRVUZKTEVsQlFVa3NRMEZCUXl4RlFVRkZMRWxCUVVrc1NVRkJTU3hGUVVGRk8xbEJRMnBDTEVsQlFVa3NRMEZCUXl4RlFVRkZMRWRCUVVjc1NVRkJTU3hOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRPMU5CUTJwRE8xRkJTVVFzU1VGQlNTeERRVUZETEVWQlFVVXNRMEZCUXl4TFFVRkxMRU5CUVVNc1NVRkJTU3hEUVVGRExGRkJRVkVzUTBGQlF5eERRVUZETzFGQlF6ZENMRWxCUVVrc1EwRkJReXhIUVVGbExFbEJRVWtzUTBGQlF6dFJRVU42UWl4UFFVRlBMRU5CUVVNc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eFpRVUZaTEVWQlFVVXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExGRkJRVkVzU1VGQlNTeERRVUZETEVOQlFVTXNTMEZCU3l4RlFVRkZMRWRCUVVjc1RVRkJUU3hEUVVGRExHVkJRV1VzU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1JVRkJSVHRaUVVOcVJ5eEpRVUZKTEVWQlFVVXNSMEZCUnl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFdEJRVXNzUlVGQlJTeEZRVUZGTEVkQlFVY3NRMEZCUXl4RFFVRkRMRXRCUVVzc1EwRkJReXhMUVVGTExFTkJRVU03V1VGTk1VTXNTVUZCU1N4RlFVRkZMRXRCUVVzc1JVRkJSU3hGUVVGRk8yZENRVU5ZTEVsQlFVa3NRMEZCUXl4RlFVRkZMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzJGQlEzQkNPMmxDUVVGTk8yZENRVU5JTEVsQlFVa3NSVUZCUlN4RFFVRkRMREpDUVVFeVFpeERRVUZETEVOQlFVTXNRMEZCUXl4TFFVRkxMRVZCUVVVc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eEZRVUZGTzI5Q1FVVnFSQ3hEUVVGRExFTkJRVU1zWVVGQllTeEhRVUZITEVsQlFVa3NRMEZCUXp0dlFrRkRka0lzVTBGQlV6dHBRa0ZEV2p0blFrRkZSQ3hKUVVGSkxFdEJRVXNzUjBGQlJ5eEZRVUZGTEVOQlFVTXNXVUZCV1N4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFVkJRVVVzUTBGQlF5eERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRPMmRDUVVNM1F5eEpRVUZKTEV0QlFVc3NTMEZCU3l4SlFVRkpMRVZCUVVVN2IwSkJRMmhDTEVsQlFVa3NRMEZCUXl4RlFVRkZMRU5CUVVNc1RVRkJUU3hEUVVGRExFdEJRVXNzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXp0dlFrRkRla0lzU1VGQlNTeERRVUZETEVWQlFVVXNRMEZCUXl4TlFVRk5MRU5CUVVNc1MwRkJTeXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETzI5Q1FVTjZRaXhKUVVGSkxFTkJRVU1zUlVGQlJTeERRVUZETEUxQlFVMHNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJRenR2UWtGRGJrSXNTVUZCU1N4RFFVRkRMRkZCUVZFc1EwRkJReXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEZWQlFWVXNRMEZCUXl4RFFVRkRPMmxDUVVONFF6dHhRa0ZCVFR0dlFrRkpTQ3hEUVVGRExFTkJRVU1zWVVGQllTeEhRVUZITEVsQlFVa3NRMEZCUXp0dlFrRkRka0lzVTBGQlV6dHBRa0ZEV2p0blFrRkRSQ3hKUVVGSkxFTkJRVU1zUTBGQlF5eExRVUZMTEVWQlFVVXNTVUZCU1N4RFFVRkRMRVZCUVVVN2IwSkJTMmhDTEVsQlFVa3NRMEZCUXl4UlFVRlJMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzJsQ1FVTjZRanR4UWtGQlRUdHZRa0ZKU0N4SlFVRkpMRU5CUVVNc1JVRkJSU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0cFFrRkRjRUk3WVVGRFNqdFRRVTFLTzBsQlNVd3NRMEZCUXp0SlFVZEVMSE5DUVVGTExFZEJRVXc3VVVGRFNTeEpRVUZKTEVOQlFVTXNUMEZCVHl4RlFVRkZMRU5CUVVNN1VVRkRaaXhKUVVGSkxGRkJRVkVzUjBGQlJ5eE5RVUZOTEVOQlFVTXNVMEZCVXl4RlFVRkZMRWxCUVVrc1IwRkJSeXhKUVVGSkxFTkJRVU1zUlVGQlJTeERRVUZETEVsQlFVa3NSVUZCUlN4RFFVRkRPMUZCUTNaRUxFOUJRVThzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4UlFVRlJMRWRCUVVjc1NVRkJTU3hEUVVGRExFZEJRVWNzVFVGQlRTeEZRVUZGTzFsQlEzWkRMRWxCUVVrc1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlF6dFpRVU5tTEZGQlFWRXNSMEZCUnl4SlFVRkpMRU5CUVVNN1dVRkRhRUlzU1VGQlNTeEhRVUZITEVsQlFVa3NRMEZCUXl4RlFVRkZMRU5CUVVNc1NVRkJTU3hGUVVGRkxFTkJRVU03VTBGRGVrSTdVVUZEUkN4UFFVRlBMRWxCUVVrc1EwRkJRenRKUVVOb1FpeERRVUZETzBsQmNFdE5MREpDUVVGdlFpeEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRPMGxCUXpkQ0xITkNRVUZsTEVkQlFVY3NRMEZCUXl4TFFVRkxMRU5CUVVNN1NVRnZTM0JETEdGQlFVTTdRMEZCUVN4QlFYcExSQ3hKUVhsTFF6dEJRWHBMV1N4M1FrRkJUVHRCUVdsTWJrSXNVMEZCWjBJc01rSkJRVEpDTEVOQlFVTXNTMEZCWjBRc1JVRkJSU3hWUVVGdFFpeEZRVUZGTEZWQlFXMUNPMGxCUjJ4SkxFbEJRVTBzUlVGQlJTeEhRVUZsTEV0QlFVc3NRMEZCUXl4SFFVRkhMRU5CUVVNc1ZVRkJRU3hEUVVGRExFbEJRVWtzVDBGQlFTeEpRVUZKTEZGQlFWRXNRMEZCUXl4RFFVRkRMRU5CUVVNc1lVRkJZU3hEUVVGRExFVkJRVGRDTEVOQlFUWkNMRU5CUVVNc1EwRkJRenRKUVVOeVJTeEpRVUZOTEVWQlFVVXNSMEZCYVVJc1JVRkJSU3hEUVVGRE8wbEJRelZDTEVsQlFVMHNRMEZCUXl4SFFVRkhMRXRCUVVzc1EwRkJReXhOUVVGTkxFTkJRVU03U1VGRGRrSXNTMEZCU3l4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFVkJRVVU3VVVGRE5VSXNTVUZCVFN4SlFVRkpMRWRCUVVjc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEV0QlFVc3NSMEZCUnl4TFFVRkxMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlF6VkRMRVZCUVVVc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeFZRVUZWTEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeEhRVUZITEV0QlFVc3NRMEZCUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzB0QlF6TkZPMGxCUTBRc1NVRkJUU3hSUVVGUkxFZEJRVWNzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RlFVTnNRaXhUUVVGVExFZEJRVWNzUlVGQlJTeERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1JVRkRja0lzV1VGQldTeEhRVUZITEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFZEJRVWNzUTBGQlF5eEZRVU5vUXl4aFFVRmhMRWRCUVVjc1MwRkJTeXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMRWRCUVVjc1EwRkJReXhEUVVGRE8wbEJRekZETEVsQlFVa3NUVUZCVFN4SFFVRmhMRWxCUVVrc1JVRkJSU3hOUVVGTkxFZEJRV0VzU1VGQlNTeERRVUZETzBsQlEzSkVMRWxCUVVrc1ZVRkJWU3hGUVVGRk8xRkJRMW9zVFVGQlRTeEhRVUZITEVsQlFVa3NVVUZCVVN4RFFVRkRMRlZCUVZVc1JVRkJSU3hSUVVGUkxFTkJRVU1zVFVGQlRTeEhRVUZITEVsQlFVa3NRMEZCUXl4RFFVRkRPMUZCUXpGRUxFVkJRVVVzUTBGQlF5eEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNN1VVRkRhRUlzUlVGQlJTeERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRlZCUVZVc1EwRkJReXhOUVVGTkxFVkJRVVVzVVVGQlVTeEZRVUZGTEZsQlFWa3NRMEZCUXl4RFFVRkRMRU5CUVVNN1MwRkRNMFE3U1VGRFJDeEpRVUZKTEZWQlFWVXNSVUZCUlR0UlFVTmFMRTFCUVUwc1IwRkJSeXhKUVVGSkxGRkJRVkVzUTBGQlF5eFZRVUZWTEVWQlFVVXNVMEZCVXl4RFFVRkRMRTFCUVUwc1IwRkJSeXhKUVVGSkxFTkJRVU1zUTBGQlF6dFJRVU16UkN4RlFVRkZMRU5CUVVNc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETzFGQlEyaENMRVZCUVVVc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeFZRVUZWTEVOQlFVTXNVMEZCVXl4RlFVRkZMRTFCUVUwc1JVRkJSU3hoUVVGaExFTkJRVU1zUTBGQlF5eERRVUZETzB0QlF6ZEVPMGxCUTBRc1NVRkJTU3hOUVVGTkxFZEJRVWNzU1VGQlNTeE5RVUZOTEVOQlFVTXNSVUZCUlN4RlFVRkZMRVZCUVVVc1EwRkJReXhEUVVGRE8wbEJRMmhETEUxQlFVMHNRMEZCUXl4TFFVRkxMRVZCUVVVc1EwRkJRenRKUVVObUxFOUJRVTg3VVVGRFNDeFZRVUZWTEVWQlFVVXNSVUZCUlN4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFVkJRVVVzUzBGQlN5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhWUVVGQkxFTkJRVU1zU1VGQlNTeFBRVUZCTEVOQlFVTXNRMEZCUXl4UlFVRlJMRVZCUVVVc1JVRkJXaXhEUVVGWkxFTkJRVU03VVVGRE5VUXNWVUZCVlN4RlFVRkZMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEZGQlFWRXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhSUVVGUkxFTkJRVU1zVVVGQlVTeEZRVUZGTEVkQlFVY3NXVUZCV1R0UlFVTXpSU3hWUVVGVkxFVkJRVVVzVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1VVRkJVU3hGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEZOQlFWTXNRMEZCUXl4UlFVRlJMRVZCUVVVc1IwRkJSeXhoUVVGaE8wdEJRMmhHTEVOQlFVTTdRVUZEVGl4RFFVRkRPMEZCYUVORUxHdEZRV2REUXlKOSJdfQ==
