function binarySearch(vertices, translate, value, start, end) {
    let mid = Math.ceil((start + end) / 2);
    if (end === start + 1) {
        return { start, end };
    }

    if (vertices[mid].x + translate.x < value) {
        return binarySearch(vertices, translate, value, mid, end);
    }
    else if (vertices[mid].x + translate.x > value) {
        return binarySearch(vertices, translate, value, start, mid);
    }
    else {
        return { start: mid, end: mid };
    }
}


function CircleEdgeCollision(a, b, manifold) {
    // binary search over the edges to find the nearest two vertices
    let p1 = a.position;
    let p2 = b.position;
    let radius = a.shape.radius;

    let vertices = b.shape.vertices;

    // Boundary condition
    if (p1.x + radius < vertices[0].x + p2.x)
        return false;
    if (p1.x - radius > vertices[vertices.length - 1].x + p2.x)
        return false;

    let lines = binarySearch(vertices, p2, p1.x, 0, vertices.length - 1);

    if (lines.start === lines.end) {
        let ptOnEdge = vertices[lines.start].add(p2);
        let normal = ptOnEdge.subtract(p1);
        let len = vec2.length(normal);
        if (len < radius) {
            let penetration = radius - len;
            normal = normal.scale(1.0 / len);
            let point = p1.add(normal.scale(penetration));
            manifold.addContact(point, normal, penetration);
            return true;
        }
        return false;
    }
    else {
        let s = vertices[lines.start];
        let e = vertices[lines.end];
        let normal = new vec2(e.y - s.y, s.x - e.x);
        normal = vec2.normalize(normal);

        let ptOnLine = p2.add(e);
        let distance = vec2.dot(normal, p1.subtract(ptOnLine));
        if (distance < radius && distance > 0.0) {
            normal = normal.scale(-1);
            let penetration = radius - distance;
            let point = p1.add(normal.scale(radius));
            manifold.addContact(point, normal, -penetration);
            return true;
        }
    }
    return false;
}

function CircleCircleCollision(a, b, manifold) {
    let normal = b.position.subtract(a.position);
    let radiiSum = a.shape.radius + b.shape.radius;
    let distSqr = vec2.lengthSquared(normal);
    if (distSqr < radiiSum * radiiSum) {
        let dist = Math.sqrt(distSqr);
        let penetration = radiiSum - dist;
        normal = normal.scale(1.0 / dist);
        let point = a.position.add(normal.scale(a.shape.radius));
        manifold.addContact(point, normal, -penetration);
        return true;
    }
    return false;
}

function BoxCircleCollision(a, b, manifold) {
    let circlePosBoxSpace = b.position.subtract(a.position);
    circlePosBoxSpace = mat2.rotate(-a.orientation).multiplyVec(circlePosBoxSpace);

    let dims = new vec2(a.shape.vertices[1].x - a.shape.vertices[0].x, a.shape.vertices[2].y - a.shape.vertices[1].y).scale(0.5);
    let closestPoint = vec2.clamp(circlePosBoxSpace, dims.scale(-1), dims);

    closestPoint = mat2.rotate(a.orientation).multiplyVec(closestPoint);
    closestPoint = closestPoint.add(a.position);

    let normal = b.position.subtract(closestPoint);
    let lenSqr = vec2.lengthSquared(normal);
    if (lenSqr < b.shape.radius * b.shape.radius) {
        let len = Math.sqrt(lenSqr);
        let penetration = b.shape.radius - len;
        normal = normal.scale(1.0 / len);
        let point = b.position.subtract(normal.scale(b.shape.radius));
        manifold.addContact(point, normal, -penetration);
        return true;
    }
    return false;
}

function generateCollisionAxis(vertices, out_axis) {

    let last = vertices.length;
    let start = vertices[last - 1]
    for (let i = 0; i < last; ++i) {
        let end = vertices[i];
        let edge = end.subtract(start);
        let normal = new vec2(edge.y, -edge.x);
        normal = vec2.normalize(normal);
        out_axis.push({ axis: normal, ptOnAxis: start });
        start = end;
    }
    /*
        let tl = vertices[0];
        let tr = vertices[1];
        let br = vertices[2];
        let bl = vertices[3];

        out_axis.push({ axis: vec2.normalize(tr.subtract(tl)), ptOnAxis: tr });
        out_axis.push({ axis: vec2.normalize(br.subtract(tr)), ptOnAxis: br });
        out_axis.push({ axis: vec2.normalize(bl.subtract(br)), ptOnAxis: bl });
        out_axis.push({ axis: vec2.normalize(tl.subtract(bl)), ptOnAxis: tl });
    */
}

function findIncidentReferenceFace(vertices, axes, normal) {
    let bestCorrelation = vec2.dot(axes[0].axis, normal);
    let bestAxis = 0;
    for (let i = 0; i < axes.length; ++i) {
        let correlation = vec2.dot(axes[i].axis, normal);
        if (correlation > bestCorrelation) {
            bestCorrelation = correlation;
            bestAxis = i;
        }
    }

    let out_incRefFace = axes[bestAxis];
    let out_vertices = [];
    let out_adjEdges = [];


    let prev = (bestAxis === 0) ? (axes.length - 1) : (bestAxis - 1);
    let next = (bestAxis + 1) % axes.length

    out_vertices.push(vertices[bestAxis]);
    out_vertices.push(vertices[prev]);

    out_adjEdges.push(axes[prev]);
    out_adjEdges.push(axes[next]);

    /*
        if (bestAxis === 0) {
            out_vertices.push(vertices[2]);
            out_vertices.push(vertices[1]);
            out_adjEdges.push(axes[3]);
            out_adjEdges.push(axes[1]);
        }
        else if (bestAxis === 1) {
            out_vertices.push(vertices[3]);
            out_vertices.push(vertices[2]);
            out_adjEdges.push(axes[2]);
            out_adjEdges.push(axes[0]);
        }
        else if (bestAxis === 2) {
            out_vertices.push(vertices[0]);
            out_vertices.push(vertices[3]);
            out_adjEdges.push(axes[3]);
            out_adjEdges.push(axes[1]);
        }
        else if (bestAxis === 3) {
            out_vertices.push(vertices[1]);
            out_vertices.push(vertices[0]);
            out_adjEdges.push(axes[2]);
            out_adjEdges.push(axes[0]);
        }
    */

    return {
        face: out_incRefFace,
        edges: out_adjEdges,
        verts: out_vertices
    }
}

function findSupportPoint(axis, ptOnAxis, vertices) {
    let maxProjection = vec2.dot(axis, vertices[0].subtract(ptOnAxis));
    let supportPoint = vertices[0];

    for (let i = 1; i < vertices.length; ++i) {
        let projection = vec2.dot(axis, vertices[i].subtract(ptOnAxis));
        if (projection > maxProjection) {
            maxProjection = projection;
            supportPoint = vertices[i];
        }
    }
    return { supportPoint, projection: maxProjection };
}

function lineIntersection(s1, e1, s2, e2) {
    let delta1 = e1.subtract(s1);
    let delta2 = e2.subtract(s2);
    //debugger;
    let x, y;
    if (delta1.x === 0.0) {
        // m1 is infinite
        x = s1.x;
        let m2 = delta2.y / delta2.x;
        y = s2.y + m2 * (x - s2.x);
    }
    else if (delta2.x === 0.0) {
        // m2 is infinine
        x = s2.x;
        let m1 = delta1.y / delta1.x;
        y = s1.y + m1 * (x - s1.x);
    }
    else {
        let m1 = (e1.y - s1.y) / (e1.x - s1.x);
        let m2 = (e2.y - s2.y) / (e2.x - s2.x);
        x = (e2.y - e1.y - m2 * e2.x + m1 * e1.x) / (m1 - m2);
        y = e2.y + m2 * (x - e2.x);
    }
    return new vec2(x, y);
}

function BoxBoxCollision(a, b, manifold) {
    let verticesA = a.shape.getVerticesWorld(a.position, a.orientation);
    let verticesB = b.shape.getVerticesWorld(b.position, b.orientation);

    let axesA = [];
    let axesB = [];
    generateCollisionAxis(verticesA, axesA);
    generateCollisionAxis(verticesB, axesB);

    let minProjection = Number.MAX_SAFE_INTEGER;
    let mtv;
    for (let i = 0; i < axesA.length; ++i) {
        let { axis, ptOnAxis } = axesA[i];
        let result = findSupportPoint(axis.scale(-1), ptOnAxis, verticesB);
        if (result.projection < 0.0)
            return false;

        if (result.projection < minProjection) {
            minProjection = result.projection;
            mtv = axis;
        }
    }

    for (let i = 0; i < axesB.length; ++i) {
        let { axis, ptOnAxis } = axesB[i];
        let result = findSupportPoint(axis.scale(-1), ptOnAxis, verticesA);
        if (result.projection < 0.0)
            return false;

        if (result.projection < minProjection) {
            minProjection = result.projection;
            mtv = axis;
        }
    }
    let ba = b.position.subtract(a.position);
    if (ba.x === undefined || mtv === undefined)
        return;
    if (vec2.dot(ba, mtv) < 0.0)
        mtv = mtv.scale(-1)

    let incRefA = findIncidentReferenceFace(verticesA, axesA, mtv);
    let incRefB = findIncidentReferenceFace(verticesB, axesB, mtv.scale(-1));

    let correlation = vec2.dot(incRefA.face.axis, mtv);
    let incFace, refFace;
    if (correlation > vec2.dot(incRefB.face.axis, mtv)) {
        incFace = incRefA;
        refFace = incRefB;
    }
    else {
        incFace = incRefB;
        refFace = incRefA;
    }

    let vertStart = incFace.verts[0];
    let vertEnd = incFace.verts[1];

    for (let i = 0; i < refFace.edges.length; ++i) {
        let edge = refFace.edges[i];
        let d1 = vec2.dot(vertStart.subtract(edge.ptOnAxis), edge.axis);
        let d2 = vec2.dot(vertEnd.subtract(edge.ptOnAxis), edge.axis);

        let edgeStart = edge.ptOnAxis;
        let edgeEnd = edgeStart.add(new vec2(-edge.axis.y, edge.axis.x));

        if (d1 < 0.0 && d2 < 0.0) {
            // both is inside
        }
        else if (d1 >= 0.0 && d2 < 0.0) {
            vertStart = lineIntersection(vertStart, vertEnd, edgeStart, edgeEnd);
        }
        else if (d1 < 0.0 && d2 >= 0.0) {
            // end outside, start inside
            vertEnd = lineIntersection(vertStart, vertEnd, edgeStart, edgeEnd);
        }
    }

    manifold.incFaceStart = vertStart;
    manifold.incFaceEnd = vertEnd;
    
    manifold.refFaceStart = refFace.verts[0];
    manifold.refFaceEnd = refFace.verts[1];

    if (vec2.dot(refFace.face.axis, vertStart.subtract(refFace.face.ptOnAxis)) < 0.0)
        manifold.addContact(vertStart, mtv, -minProjection);
    if (vec2.dot(refFace.face.axis, vertEnd.subtract(refFace.face.ptOnAxis)) < 0.0)
        manifold.addContact(vertEnd, mtv, -minProjection);

    return true;
}