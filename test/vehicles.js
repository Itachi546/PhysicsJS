let canvas = document.getElementById('canvas');
let ctx = canvas.getContext("2d");

let timeStep = 1.0 / 60.0;
let physicSystem;
let bodies = [];
let showContacts = false;
let tireA, tireB, tireC;

function createCircle(position, radius, invMass, orientation) 
{
    let body = new Body(position, invMass);
    body.orientation = orientation;
    body.initCircle(radius);
    bodies.push(body);
    physicSystem.addBody(body)
    return body;
}

function createEdge() 
{
    let body = new Body(new vec2(0.0, 460.0), 0.0);
    body.orientation = 0.0;
    body.inverseInertia = 0.0;

    let edge = new EdgeShape();

    let xOffset = 20;
    let numPoints = Math.ceil(canvas.width / xOffset);
    for(let i = 0; i  < numPoints; i++)
    {
        let x = i * xOffset;
        let y = Math.sin(x * 0.01) * 40.;
        y += Math.sin(x * 0.05) * 10.0;
        y += Math.cos(x) * 2.;
        edge.addVertex(new vec2(x, y));
    }
    
    body.shape = edge;
    body.shape.type = ShapeType.EDGE;
    bodies.push(body);
    physicSystem.addBody(body)
    return body;
}

function drawCircle(body)
{
    let position = body.position;
    let radius = body.shape.radius;

    ctx.beginPath();
    ctx.strokeStyle = body.color;
    ctx.arc(position.x, position.y, radius, 0.0, Math.PI * 2.0);
    ctx.closePath();
    ctx.stroke();

    let end = new vec2(1.0, 0.0);
    let rotate = mat2.rotate(body.orientation);
    end = rotate.multiplyVec(end);
    end = end.scale(radius);

    ctx.beginPath();
    ctx.strokeStyle = body.color;
    ctx.moveTo(position.x, position.y);
    ctx.lineTo(position.x + end.x, position.y + end.y);
    ctx.closePath();
    ctx.stroke();
}

function drawEdge(body)
{
    ctx.strokeStyle = body.color;
    let vertices = body.shape.vertices;
    let position = body.position;
    ctx.beginPath();
    
    let start = vertices[0];
    for(let i = 1; i < vertices.length; ++i)
    {
        ctx.moveTo(position.x + start.x, position.y + start.y)
        ctx.lineTo(position.x + vertices[i].x, position.y + vertices[i].y);
        start = vertices[i];
    }
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = "#f88";
    let size = 4.0;
    for(let i = 0; i < vertices.length; ++i)
    {
        ctx.fillRect(position.x + vertices[i].x - size * 0.5, position.y + vertices[i].y - size * 0.5, size, size);
    }
}

window.onmousedown = function(evt)
{
    if(evt.button === 0)
        createCircle(new vec2(evt.clientX, evt.clientY), Math.random() * 10.0 + 10.0, 1.0, 0.0);
}

window.onkeydown = function(evt)
{
    let force = new vec2(200.0, 0.0);
    if(evt.key === "ArrowRight")
    {
        tireA.addForce(force);
        tireB.addForce(force);
        tireC.addForce(force);
    }
    else if(evt.key === "ArrowLeft")
    {
        tireA.addForce(force.scale(-1));
        tireB.addForce(force.scale(-1));
        tireC.addForce(force.scale(-1));
    }
}

function drawBody(body) 
{
    if(body.shape.type === ShapeType.CIRCLE)
        drawCircle(body);
    else if(body.shape.type === ShapeType.EDGE)
        drawEdge(body);
}

function setup() {
    physicSystem = new PhysicsSystem(new vec2(0.0, 98));
    createEdge();
    tireA = createCircle(new vec2(0, 300), 10, 1.0, 0.0);    
    tireB = createCircle(new vec2(30, 300), 10, 1.0, 0.0);
    tireC = createCircle(new vec2(15, 280), 10, 1.0, 0.0);
    let joint1 = new DistanceJoint(tireA, tireB, tireA.position, tireB.position);
    physicSystem.addConstraints(joint1);
    let joint2 = new DistanceJoint(tireA, tireC, tireA.position, tireC.position);
    physicSystem.addConstraints(joint2);
    let joint3 = new DistanceJoint(tireB, tireC, tireB.position, tireC.position);
    physicSystem.addConstraints(joint3);
    update();
}

function update() {
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    physicSystem.step(timeStep);

    for (let i = 0; i < bodies.length; ++i) {
        drawBody(bodies[i]);
    }

    physicSystem.drawJoint();
    if(showContacts)
        physicSystem.drawManifolds();

    DrawDebugData(ctx);
    requestAnimationFrame(update);
}

setup();