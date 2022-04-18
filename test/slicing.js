
let canvas = document.getElementById('canvas');
let ctx = canvas.getContext("2d");

let timeStep = 1.0 / 60.0;
let physicSystem = new PhysicsSystem(new vec2(0.0, 98));
let staticBody;
let bodies = [];
/*
252 128
231 380

120 294
445 172
*/
let state = {
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    mouseX: 0,
    mouseY: 0,
    dragged: false
}

canvas.onmousedown = function (evt) {
    state.dragged = true;
    state.startX = evt.clientX;
    state.startY = evt.clientY;
}

canvas.onmouseup = function (evt) {
    state.dragged = false;
    state.endX = evt.clientX;
    state.endY = evt.clientY;

    onDragEnd();
}

function removeBody(body) {
    for (let i = 0; i < bodies.length; ++i) {
        if (bodies[i] === body) {
            bodies.splice(i, 1);
            return;
        }
    }
}

canvas.onmousemove = function (evt) {
    state.mouseX = evt.clientX;
    state.mouseY = evt.clientY;
}

function checkDirectionInLine(a0, b0, p)
{
    /*
    let denom = b0.x - a0.x;
    let num = b0.y - a0.y;

    if(denom == 0)
    {
        return -(a0.x - p.x);
    }
    else {
        return -((num / denom) * (p.x - a0.x) - (p.y - a0.y));
    }
    */
   return (b0.x - a0.x) * (p.y - a0.y) - (b0.y - a0.y) * (p.x - a0.x);
}

function createPolygonFromVertices(worldVerts, invMass) {

    let pos = new vec2(0.0, 0.0);
    for(let vert of worldVerts)
    {
        pos = pos.add(vert);
    }
    let scaling = 1.0 / worldVerts.length;
    pos = pos.scale(scaling);


    worldVerts = worldVerts.map(vert => vert.subtract(pos));

    let body = new Body(pos, invMass);
    body.orientation = 0.0;
    let shape = new PolygonShape();
    shape.vertices = worldVerts;

    body.shape = shape;
    body.calculateInertia();

    bodies.push(body);
    physicSystem.addBody(body)
    return body;
}


function onDragEnd() {
    let points = linePolygonIntersection(staticBody);
    let position = staticBody.position;
    if (points.length == 2) {

        let vertices = staticBody.shape.vertices.map(v => v.add(position));
        let p0 = points[0];
        let p1 = points[1];

        let pos = [], neg = [];
        let prevSign = 0;
        for(let i = 0; i < vertices.length; ++i)
        {
            let sign = checkDirectionInLine(p0, p1, vertices[i]);

            if(sign > 0)
                pos.push(vertices[i]);
            
            if(i > 0)
            {
                if(prevSign > 0 && sign < 0)
                {
                    pos.push(p0);
                    pos.push(p1);
                    neg.push(p0);
                }
                else if(prevSign < 0 && sign > 0)
                {
                    neg.push(p1);
                }
            }

            if(sign < 0) 
                neg.push(vertices[i]);

            prevSign = sign;
        }

        if(prevSign < 0)
            neg.push(p1);

        physicSystem.removeBody(staticBody);
        removeBody(staticBody);
        staticBody = createPolygonFromVertices(pos, 0.0);
        createPolygonFromVertices(neg, 1.0);
        
        
    }
}

function createBox(position, dims, invMass, orientation) {
    let body = new Body(position, invMass);
    body.orientation = orientation;
    body.initBox(dims.x, dims.y);
    body.calculateInertia();
    bodies.push(body);
    physicSystem.addBody(body)
    return body;
}

// Change the role of line and ray
// Check if the t is between 0 and 1 when the rd is normalized
// if between 0-1 it intersect else not
function linelineIntersection(a0, b0, a1, b1) {
    let r0 = a1;
    let rd = b1.subtract(a1);

    let denom = (b0.x - a0.x);
    let t = 0.;
    if (Math.abs(denom) < 0.0000001) {
        t = -(r0.x - a0.x) / rd.x;
    }
    else {
        let slope = (b0.y - a0.y) / denom;
        t = (slope * (r0.x - a0.x) - r0.y + a0.y) / (rd.y - slope * rd.x);
    }
    return new vec2(r0.x + t * rd.x, r0.y + t * rd.y);
}

function isPointOnLineSegment(a0, b0, p) {
    let minX = Math.min(a0.x, b0.x);
    let minY = Math.min(a0.y, b0.y);

    let maxX = Math.max(a0.x, b0.x);
    let maxY = Math.max(a0.y, b0.y);

    if (p.x < minX || p.x > maxX || p.y < minY || p.y > maxY)
        return false;
    return true;
}

function linePolygonIntersection(body) {
    let position = body.position;
    let vertices = body.shape.vertices.map(v => v.add(position));
    /*
    120 294
    445 172
    */
    let a1 = new vec2(state.startX, state.startY);
    let b1 = new vec2(state.mouseX, state.mouseY);

    let points = [];
    for (let i = 0; i < vertices.length; ++i) {
        let a0 = vertices[i];
        let b0 = vertices[(i + 1) % vertices.length];
        let p = linelineIntersection(a0, b0, a1, b1);
        if (isPointOnLineSegment(a0, b0, p))
            points.push(p);
    }

    for (let p of points) {
        ctx.fillStyle = "#0f0";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5.0, 0.0, Math.PI * 2.0);
        ctx.closePath();
        ctx.fill();
    }

    return points;
}

// Radius of bounding circle
// Just an easy way to check collision
// Doesn't generate convex shape all the time
// In such case the collision routine fails

function generateConvexPolygon(out_vertices, radius) {
    let n = Math.floor(Math.random() * 6.0) + 3;
    let step = Math.PI * 2.0 / n;
    for (let i = 0; i < n; ++i) {
        let x = Math.cos(i * step + Math.random() * step * 0.5);
        let y = Math.sin(i * step + Math.random() * step * 0.5);
        out_vertices.push(new vec2(x * radius, y * radius));
    }
}

function createPolygon(position, radius, invMass, orientation) {
    let body = new Body(position, invMass);
    body.orientation = orientation;
    let shape = new PolygonShape();
    generateConvexPolygon(shape.vertices, radius);
    body.shape = shape;
    body.calculateInertia();

    bodies.push(body);
    physicSystem.addBody(body)
    return body;
}


function drawPolygon(body) {
    let vertices = body.shape.getVerticesWorld(body.position, body.orientation)
    ctx.beginPath();
    ctx.strokeStyle = body.color;
    ctx.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < vertices.length; ++i) {
        ctx.lineTo(vertices[i].x, vertices[i].y);
    }
    ctx.closePath();
    ctx.stroke();
}

function drawBody(body) {
    drawPolygon(body);
}

function drawRay() {
    if (state.dragged) {
        ctx.strokeStyle = "#f00";
        ctx.beginPath();
        ctx.moveTo(state.startX, state.startY);
        ctx.lineTo(state.mouseX, state.mouseY);
        ctx.closePath();
        ctx.stroke();
    }
}

function setup() {
    createBox(new vec2(-10, canvas.height * 0.5), new vec2(10, canvas.height * 0.5), 0.0, 0.0);
    createBox(new vec2(canvas.width + 10, canvas.height * 0.5), new vec2(10, canvas.height * 0.5), 0.0, 0.0);
    createBox(new vec2(canvas.width * 0.5, canvas.height - 10), new vec2(canvas.width * 0.5, 10), 0.0, 0.0);
    staticBody = createBox(new vec2(canvas.width * 0.5, canvas.height * 0.5), new vec2(80, 80), 0.0, 0.0);
    update();
}

let frameTime = 0.0;

function update() {
    /*
    120 294
    445 172
    */
    let start = new Date().getMilliseconds();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    physicSystem.step(timeStep);
    for (let i = 0; i < bodies.length; ++i) {
        drawBody(bodies[i]);
    }


    drawRay();

    DrawDebugData(ctx);

    let end = new Date().getMilliseconds();
    frameTime = (end - start);
    ctx.fillStyle = "#fff";
    ctx.font = "12px Arial";
    ctx.fillText("FrameTime: " + String(frameTime.toFixed(2)), 5, 14);
    requestAnimationFrame(update);
}

setup();


