let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

let width = 400;
    height = 400;
canvas.width = width;
canvas.height= height;

let theta = Math.PI + Math.PI * 0.4;
let length = 200.0;
let px = 200.0,
    py = 100,
    damping = 0.001,
    angVel = 0.0;


let slider = document.getElementById("dampingFactor");
slider.value = damping * 100.;
slider.oninput = function(evt)
{
    damping = slider.value * 0.01;
}

let enableDamping = false;
let checkbox = document.getElementById("damping");
checkbox.checked = enableDamping;
checkbox.oninput = function(evt)
{
    enableDamping = checkbox.checked;
}



function update()
{
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);
    ctx.fill();

    let dirX = Math.cos(-Math.PI * 0.5 + theta);
    let dirY = Math.sin(-Math.PI * 0.5 + theta);

    ctx.strokeStyle = "#fff"
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + length * dirX, py + length * dirY);
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = "#fff"
    ctx.beginPath();
    ctx.moveTo(px - 10, py);
    ctx.lineTo(px + 10, py);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(px + dirX *(length + 10), py + dirY * (length + 10), 10, 0.0, Math.PI * 2.0);
    ctx.closePath();
    ctx.stroke();

    let acc = 9.8 * Math.sin(theta);
    if(enableDamping)
    {
        angVel += acc * 0.016 - damping * angVel;
    }
    else
    {
        angVel += acc * 0.016;
    }
    
    theta += angVel * 0.0166;

    requestAnimationFrame(update);
}
update();