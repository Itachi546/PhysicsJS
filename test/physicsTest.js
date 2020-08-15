
let canvas = document.getElementById('canvas');
let width = 800;
let height = 600;

canvas.width = width;
canvas.height = height;

let ctx = canvas.getContext("2d");
let timeStep = 1.0 / 60.0;
let physicSystem;
let bodies = [];

let selectionMenu = document.getElementById("scene");
let id = [];

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

function createBody(position, dims, invMass, orientation) {
    let body = new Body(position, dims, invMass, "box");
    body.orientation = orientation;
    bodies.push(body);
    physicSystem.addBody(body)
    return body;
}

function drawBody(body) {

    let position = body.position;
    let dims = body.dims;

    let rotate = mat2.rotate(body.orientation);
    let tl = position.add(rotate.multiplyVec(new vec2(-dims.x, -dims.y), body.orientation));
    let tr = position.add(rotate.multiplyVec(new vec2(dims.x, -dims.y), body.orientation));
    let bl = position.add(rotate.multiplyVec(new vec2(-dims.x, dims.y), body.orientation));
    let br = position.add(rotate.multiplyVec(new vec2(dims.x, dims.y), body.orientation));

    ctx.beginPath();
    ctx.strokeStyle = body.color;
    ctx.moveTo(tl.x, tl.y);
    ctx.lineTo(tr.x, tr.y);
    ctx.lineTo(br.x, br.y);
    ctx.lineTo(bl.x, bl.y);
    ctx.closePath();
    ctx.stroke();

    /*
    ctx.beginPath();
    ctx.strokeStyle = body.color;
    ctx.arc(position.x, position.y, dims.x, 0.0, Math.PI * 2.0);
    ctx.closePath();
    ctx.stroke();

    let end = new vec2(1.0, 0.0);
    end = vec2.rotate(end, body.orientation);
    end = end.scale(dims.x);

    ctx.beginPath();
    ctx.strokeStyle = body.color;
    ctx.moveTo(position.x, position.y);
    ctx.lineTo(position.x + end.x, position.y + end.y);
    ctx.closePath();
    ctx.stroke();
    */
    //ctx.strokeRect(position.x - dims.x, position.y - dims.y, dims.x * 2.0, dims.y * 2.0);
}

window.onmousedown = function (evt) {
    if (evt.button === 0) {
        let position = new vec2(evt.clientX, evt.clientY);
        let size = new vec2(20, 20);
        createBody(position, size, 1.0, 0.0);
    }
}

function pendulumScene() {
    for (let i = 0; i < 5; ++i) {
        createBody(new vec2(width * 0.5, height * 0.89 - i * 45), new vec2(20, 20), 1.0, 0.0);
    }

    // Static platform
    createBody(new vec2(width * 0.5, height), new vec2(width * 0.5, height * 0.05), 0.0, 0.0);

    //Pendulum
    a = createBody(new vec2(width * 0.5, height * 0.1), new vec2(20, 5), 0.0, 0.0);
    b = createBody(new vec2(width * 0.0, height * 0.1), new vec2(20, 20), 0.25, 0.0);

    let joint = new DistanceJoint(a, b, a.position);
    physicSystem.addConstraints(joint);
}

function frictionScene() {
    createBody(new vec2(width * 0.5, height), new vec2(width * 0.5, height * 0.05), 0.0, 0.0);
    createBody(new vec2(width * 0.35, height * 0.25), new vec2(200, 10), 0.0, 0.38);

    createBody(new vec2(width * 0.75, height * 0.45), new vec2(200, 10), 0.0, -0.38);


    let a = createBody(new vec2(width * 0.15, height * 0.0), new vec2(10, 10), 1.0, 0);
    a.friction = 0.0;

    function sleep(ms) {
        return new Promise(resolve => {
            id.push(setTimeout(resolve, ms))
        });
    }

    async function createObjects() {
        for (let i = 1; i <= 5; i++) {
            await sleep(5500);
            let b = createBody(new vec2(width * 0.15, height * 0.0), new vec2(10, 10), 1.0, 0);
            b.friction = i / 5.0;
        }
    }

    createObjects();
}

function bridgeScene() {
    for (let i = 0; i < 5; ++i) {
        createBody(new vec2(width * 0.5, height * 0.3 - i * 45), new vec2(20, 20), 1.0, Math.PI * 0.0);
    }

    let yPos = height * 0.4;
    let start = createBody(new vec2(width * 0.1, yPos), new vec2(10, 10), 0.0, 0.0);

    let xOffset = 20.0;
    let numBody = Math.floor((0.8 * width) / xOffset);
    for (let i = 0; i < numBody; ++i) {
        let invMass = 1.0;
        if (i === numBody - 1)
            invMass = 0.0;

        let b = createBody(new vec2(width * 0.1 + xOffset * (i + 1), yPos), new vec2(10, 10), invMass, 0.0);
        let joint = new DistanceJoint(start, b, start.position);
        physicSystem.addConstraints(joint);
        start = b;
    }
}

function setup() {
    physicSystem = new PhysicsSystem(new vec2(0.0, 98));
    //bridgeScene();    
    //pendulumScene();
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

    physicSystem.drawJoint(ctx);
    //physicSystem.drawManifolds(ctx);

    requestAnimationFrame(update);
}

setup();