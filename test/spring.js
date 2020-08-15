let width = 400,
    height = 400;
let canvas = document.getElementById("canvas");
canvas.width = height;
canvas.height = height;
let ctx = canvas.getContext("2d");
let dt = 0.0166;

function length(x, y) {
    return Math.sqrt(x * x + y * y);
}

function drawSpringSegment(x, y, totalLength, numSegment, force) 
{
    let halfSegLength = totalLength / (numSegment * 2.0);
    let b = halfSegLength * 0.5 + force * halfSegLength * 0.5;
    let h = Math.sqrt(halfSegLength * halfSegLength - b * b);

    let startX = x;
    for (let i = 0; i < numSegment; ++i)
    {
        ctx.strokeStyle = "#fff";
        ctx.beginPath();
        ctx.moveTo(startX, y);
        startX += b;
        ctx.lineTo(startX, y - h);
        ctx.closePath();
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(startX, y - h);
        startX += b;
        ctx.lineTo(startX, y);
        ctx.closePath();
        ctx.stroke();
    }
    return startX;
}

class Spring {
    constructor(x, y) 
    {
        this.x = x;
        this.y = y;

        this.v = 0.0;
        this.a = 0.0;

        this.delta = 0.0;

        this.totalLength = 200;
        this.restLength = 100;
        this.springConstant = 0.8;
        this.vx = 0.0;
        this.active = true;
    }

    stretch(dx)
    {
        this.delta = Math.max(Math.min(dx, 100), -50);
    }

    update()
    {
        if(this.active)
        {
            let a = -this.springConstant * this.delta * 30;
            this.vx += a * dt - 0.001 * this.vx;;
            this.delta += this.vx * dt;
        }
    }

    draw(ctx) 
    {
        ctx.strokeStyle = "#fff";
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 20.0);
        ctx.lineTo(this.x, this.y + 20.0);

        let percentUnstretched = 0.1;
        let currentLen = this.delta + this.restLength;

        let startX = this.x + currentLen * percentUnstretched;
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(startX, this.y);
        ctx.closePath();
        ctx.stroke();

        let force = (this.delta + 50.0) / 150.0;
        startX = drawSpringSegment(startX, this.y, (1.0 - percentUnstretched) * this.totalLength, 6, force);

        ctx.beginPath();
        ctx.moveTo(startX, this.y);
        startX += percentUnstretched * currentLen;
        ctx.lineTo(startX, this.y);
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        startX += 10.0;
        ctx.arc(startX, this.y, 10.0, 0, Math.PI * 2.0);
        ctx.closePath();
        ctx.stroke();
    }
};

let spring = new Spring(40, 200, 100);
let dragged = false;
let lastMouse;

window.onmousemove = function(evt)
{
    if(dragged)
    {
        
        let delta = evt.screenX - lastMouse;
        spring.stretch(delta);
    }
}

window.onmousedown = function(evt)
{
    if(evt.button == 0)
    {
        lastMouse = evt.screenX;
        dragged = true;
        spring.active = false;
    }
}
window.onmouseup = function(evt)
{
    dragged = false;
    spring.active = true;
}

function update() 
{
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);
    spring.update();
    spring.draw(ctx);
    requestAnimationFrame(update);
}
update();
