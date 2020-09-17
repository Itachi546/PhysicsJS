let canvas = document.getElementById('canvas');
let ctx = canvas.getContext("2d");

let timeStep = 1.0 / 60.0;
let physicSystem = new PhysicsSystem(new vec2(0.0, 98));
let bodies = [];
let tireA, tireB, tireC;
let startPos;
let xOffset = 80;
let camOffset = new vec2(-100.0, -150.0);
let amplitude = 2.0;
let frequency = 1.0;
let showVertex = false;

function createCircle(position, radius, invMass, orientation) 
{
    let body = new Body(position, invMass);
    body.orientation = orientation;
    body.initCircle(radius);
    body.calculateInertia();
    bodies.push(body);
    physicSystem.addBody(body)
    return body;
}

function getHeight(x)
{
    let y = Math.sin(x * 0.01 + 40) * 40.;
    y += Math.sin(x * 0.05) * 10.0;
    y += Math.cos(x) * 2.;
    return y;
}

function updateEdge(edge)
{
    edge.vertices = [];
    let numPoints = Math.ceil(canvas.width / xOffset + 200.0);
    let phase = 0.0;
    for(let i = 0; i  < numPoints; i++)
    {
        let x = i * xOffset + Math.floor(camOffset.x / xOffset) * xOffset + phase;
        let y = getHeight(frequency * x) * amplitude;
        edge.addVertex(new vec2(x, y));
    }
}

function createEdge() 
{
    let body = new Body(new vec2(0.0, 460.0), 0.0);
    body.orientation = 0.0;
    body.inverseInertia = 0.0;

    let edge = new EdgeShape();
    updateEdge(edge);
    
    body.shape = edge;
    body.shape.type = ShapeType.EDGE;
    bodies.push(body);
    physicSystem.addBody(body)
    return body;
}

function drawCircle(body)
{
    let position = body.position;
    let offset = camOffset.scale(-1);
    
    let radius = body.shape.radius;
    ctx.beginPath();
    ctx.strokeStyle = body.color;
    ctx.arc(position.x + offset.x, position.y + offset.y, radius, 0.0, Math.PI * 2.0);
    ctx.closePath();
    ctx.stroke();

    let end = new vec2(1.0, 0.0);
    let rotate = mat2.rotate(body.orientation);
    end = rotate.multiplyVec(end);
    end = end.scale(radius);

    ctx.beginPath();
    ctx.strokeStyle = body.color;
    ctx.moveTo(position.x + offset.x, position.y + offset.y);
    ctx.lineTo(position.x + end.x + offset.x, position.y + end.y + offset.y);
    ctx.closePath();
    ctx.stroke();
}

function drawEdge(body)
{
    ctx.strokeStyle = body.color;
    let vertices = body.shape.vertices;
    let position = body.position;
    let offset = camOffset.scale(-1);
    ctx.beginPath();
    
    let start = vertices[0];
    for(let i = 1; i < vertices.length; ++i)
    {
        ctx.moveTo(position.x + start.x + offset.x, position.y + start.y + offset.y)
        ctx.lineTo(position.x + vertices[i].x + offset.x, position.y + vertices[i].y + offset.y);
        start = vertices[i];
    }
    ctx.closePath();
    ctx.stroke();

    if(showVertex)
    {
        ctx.fillStyle = "#f88";
        let size = 4.0;
        for(let i = 0; i < vertices.length; ++i)
        {
            ctx.fillRect(position.x + vertices[i].x - size * 0.5 + offset.x, position.y + vertices[i].y - size * 0.5 + offset.y, size, size);
        }
    }
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

function getPlayerPos()
{
    let sum = tireA.position.add(tireB.position);
    sum = sum.add(tireC.position);
    sum = sum.scale(0.333);
    return sum;
}

let edge;
function setup() 
{
    edge = createEdge();
    tireA = createCircle(new vec2(220, 300), 10, 1.0, 0.0);    
    tireB = createCircle(new vec2(250, 300), 10, 1.0, 0.0);
    tireC = createCircle(new vec2(235, 280), 10, 1.0, 0.0);

    startPos = getPlayerPos();
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
    let newPos = getPlayerPos()
    camOffset = camOffset.add(newPos.subtract(startPos));
    startPos = new vec2(newPos.x, newPos.y);
    updateEdge(edge.shape);

    physicSystem.step(timeStep);

    for (let i = 0; i < bodies.length; ++i) 
    {
        drawBody(bodies[i]);
    }

    ctx.strokeStyle = "#fff";
    ctx.beginPath();
    ctx.moveTo(tireA.position.x - camOffset.x, tireA.position.y - camOffset.y);
    ctx.lineTo(tireB.position.x - camOffset.x, tireB.position.y - camOffset.y);
    ctx.lineTo(tireC.position.x - camOffset.x, tireC.position.y - camOffset.y);
    ctx.closePath();
    ctx.stroke();
    
    DrawDebugData(ctx);
    requestAnimationFrame(update);
}
setup();

let slider = document.getElementById("subdivision");
slider.value = xOffset;
slider.oninput = function(evt)
{
    xOffset = evt.target.value;
}

let visible = document.getElementById("visible");
visible.checked = showVertex;
visible.oninput = function(evt)
{
    showVertex = evt.target.checked;
    
}
