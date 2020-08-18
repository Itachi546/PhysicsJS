let canvas = document.getElementById('canvas');
let width = 800;
let height = 600;

canvas.width = width;
canvas.height = height;

let ctx = canvas.getContext("2d");
let timeStep = 1.0 / 60.0;
let physicSystem;
let bodies = [];
let showContacts = false;

let selectionMenu = document.getElementById("scene");

let contactVisibilityCheckbox = document.getElementById("showContacts");
let id = [];

contactVisibilityCheckbox.oninput = function(evt)
{
    showContacts = evt.target.checked;
}

selectionMenu.oninput = function(evt)
{
    currentIndex = evt.target.selectedIndex;

    if(currentIndex === 0)
    {
        clearGlobalStates();
        frictionScene();
    }
    else if(currentIndex === 1)
    {
        clearGlobalStates();
        bridgeScene();
    }
    else
    {
        clearGlobalStates();
        pendulumScene();
    }
}

function clearGlobalStates()
{
    physicSystem.clear();
    bodies = [];
    for(let i = 0; i < id.length; ++i)
        clearTimeout(id[i]);
    id = [];
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

function drawRect(body)
{
    let vertices = body.shape.getVerticesWorld(body.position, body.orientation)

    ctx.beginPath();
    ctx.strokeStyle = body.color;
    ctx.moveTo(vertices[0].x, vertices[0].y);
    for(let i = 1; i < vertices.length; ++i)
    {
        ctx.lineTo(vertices[i].x, vertices[i].y);
    }
        //ctx.lineTo(br.x, br.y);
    //ctx.lineTo(bl.x, bl.y);
    ctx.closePath();
    ctx.stroke();
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

function drawBody(body) 
{
    let shapeType = body.shape.type;
    if(shapeType === ShapeType.CIRCLE)
        drawCircle(body);
    else if(shapeType == ShapeType.POLYGON)
        drawRect(body);
}

window.onmousedown = function (evt) {
    if (evt.button === 0) {
        let position = new vec2(evt.clientX, evt.clientY);
        if(Math.random() > 0.5)
        {
            
            let size = new vec2(10.0 + Math.random() * 10., 10.0 + Math.random() * 10.);
            createBox(position, size, 1.0, 0.0);
        }
        else
        {
            let radius = 10.0 + Math.random() * 10.;
            createCircle(position, radius, 1.0, 0.0);
        }
    }
}

function pendulumScene() {
    for (let i = 0; i < 5; ++i) {
        createBox(new vec2(width * 0.5, height * 0.89 - i * 45), new vec2(20, 20), 1.0, 0.0);
    }

    // Static platform
    createBox(new vec2(width * 0.5, height), new vec2(width * 0.5, height * 0.05), 0.0, 0.0);

    //Pendulum
    a = createBox(new vec2(width * 0.5, height * 0.1), new vec2(20, 5), 0.0, 0.0);
    b = createBox(new vec2(width * 0.0, height * 0.1), new vec2(20, 20), 0.25, 0.0);

    let joint = new DistanceJoint(a, b, a.position, b.position.add(new vec2(20.0, 0.0)));
    physicSystem.addConstraints(joint);
}

function windMill()
{
    let c = createBox(new vec2(width * 0.5, height * 0.7), new vec2(3.0, 40.0), 0.0, 0);
    let d = createBox(new vec2(width * 0.5, height * 0.63), new vec2(60.0, 3.0), 1.0, 0);
    let joint = new DistanceJoint(c, d, d.position, d.position);
    physicSystem.addConstraints(joint);

    for(let i = 0; i < 10; ++i)
    {
        let x = (Math.random() * 2.0 - 1.0) * 60.0 + width * 0.5;
        let y = height * 0.3 - i * 30.0;

        createBox(new vec2(x, y), new vec2(10, 10), 1,0, 0.0);
    }
}

function frictionScene() {
    createBox(new vec2(width * 0.5, height), new vec2(width * 0.5, height * 0.05), 0.0, 0.0);
    createBox(new vec2(width * 0.35, height * 0.25), new vec2(200, 10), 0.0, 0.38);
    createBox(new vec2(width * 0.75, height * 0.45), new vec2(200, 10), 0.0, -0.38);

    let a = createBox(new vec2(width * 0.15, height * 0.0), new vec2(10., 10.0), 4.0, 0);
    a.friction = 0.0;

    function sleep(ms) {
        return new Promise(resolve => {
            id.push(setTimeout(resolve, ms))
        });
    }

    async function createObjects() {
        for (let i = 1; i <= 5; i++) {
            await sleep(5500);
            let b = createBox(new vec2(width * 0.15, height * 0.0), new vec2(10.0, 10.0), 4.0, 0);
            b.friction = i / 5.0;
        }
    }
    createObjects();
}

function bridgeScene() {
    for (let i = 0; i < 5; ++i) {
        createBox(new vec2(width * 0.5, height * 0.3 - i * 45), new vec2(20, 20), 1.0, Math.PI * 0.0);
    }

    let yPos = height * 0.4;
    let start = createBox(new vec2(width * 0.1, yPos), new vec2(20, 5), 0.0, 0.0);

    let xOffset = 40.0;
    let numBody = Math.floor((0.8 * width) / xOffset);
    for (let i = 0; i < numBody; ++i) {
        let invMass = 0.5;
        if (i === numBody - 1)
            invMass = 0.0;
        let b = createBox(new vec2(width * 0.1 + xOffset * (i + 1), yPos), new vec2(20, 5), invMass, 0.0);
        let anchorPoint = start.position.add(new vec2(20.0, 0.0));
        let joint = new DistanceJoint(start, b, anchorPoint, anchorPoint);
        physicSystem.addConstraints(joint);
        start = b;
    }
}

function setup() {
    physicSystem = new PhysicsSystem(new vec2(0.0, 98));
    frictionScene();
    update();
}

function update() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);

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