/*
    @TODO for convex shape and circle collision, maybe we can use 
    edge circle collision
*/
let canvas = document.getElementById('canvas');
let ctx = canvas.getContext("2d");

let timeStep = 1.0 / 60.0;
let physicSystem = new PhysicsSystem(new vec2(0.0, 98));
let bodies = [];
let showContacts = false;

function createBox(position, dims, invMass, orientation) 
{
    let body = new Body(position, invMass);
    body.orientation = orientation;
    body.initBox(dims.x, dims.y);
    body.calculateInertia();
    bodies.push(body);
    physicSystem.addBody(body)
    return body;
}

// Radius of bounding circle
function generateConvexPolygon(out_vertices, radius)
{
    let n = Math.floor(Math.random() * 6.) + 3;
    let step = Math.PI * 2.0 / n;
    for(let i = 0; i < n; ++i)
    {
        let x = Math.cos(i * step + Math.random() * step * 0.5);
        let y = Math.sin(i * step + Math.random() * step * 0.5);
        out_vertices.push(new vec2(x * radius, y * radius));
    }
}

function createPolygon(position, radius, invMass, orientation) 
{
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

canvas.onmousedown = function(evt)
{
    if(evt.button === 0)
    {
       createPolygon(new vec2(evt.clientX, evt.clientY), Math.random() * 15.0 + 20., 1.0, 0.0);
    }
}


function drawPolygon(body)
{
    let vertices = body.shape.getVerticesWorld(body.position, body.orientation)
    ctx.beginPath();
    ctx.strokeStyle = body.color;
    ctx.moveTo(vertices[0].x, vertices[0].y);
    for(let i = 1; i < vertices.length; ++i)
    {
        ctx.lineTo(vertices[i].x, vertices[i].y);
    }
    ctx.closePath();
    ctx.stroke();
}

function drawBody(body) 
{
    drawPolygon(body);        
}

function setup() 
{
    createBox(new vec2(-10, canvas.height * 0.5), new vec2(10, canvas.height * 0.5), 0.0, 0.0);
    createBox(new vec2(canvas.width + 10, canvas.height* 0.5), new vec2(10, canvas.height * 0.5), 0.0, 0.0);
    createBox(new vec2(canvas.width * 0.5, canvas.height - 10), new vec2(canvas.width * 0.5, 10), 0.0, 0.0);
    createBox(new vec2(canvas.width * 0.5, canvas.height * 0.5), new vec2(20, 20), 1.0, 0.0);
    createPolygon(new vec2(400, 200), 30., 1.0, Math.PI * 0.0);
    update();
}

function update() {
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    physicSystem.step(timeStep);
    for (let i = 0; i < bodies.length; ++i) 
    {
        drawBody(bodies[i]);
    }

    if(showContacts)
        physicSystem.drawManifolds(ctx);

    DrawDebugData(ctx);
    requestAnimationFrame(update);
}
setup();

