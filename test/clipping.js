// SutherlandHodgeman Clipping in 2D

let canvas = document.getElementById("canvas");
canvas.width = 400;
canvas.height = 400;

let ctx = canvas.getContext("2d");

function lineIntersection(s1, e1, s2, e2) {
    let delta1 = e1.subtract(s1);
    let delta2 = e2.subtract(s2);
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

function drawQuad(vertices, color) {
    ctx.strokeStyle = color;
    let start = vertices[0];

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    for (let i = 1; i < vertices.length; ++i) {
        let vertex = vertices[i];
        ctx.lineTo(vertex.x, vertex.y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.stroke();
}

function beginClip(vertices, clipLine) {
    let clipStart = clipLine.start;
    let clipEnd = clipLine.end;

    let normal = new vec2(clipEnd.y - clipStart.y, clipStart.x - clipEnd.x);
    normal = vec2.normalize(normal);
    let outVertices = [];

    let start = vertices[vertices.length - 1];
    for (let i = 0; i < vertices.length; ++i) {
        let end = vertices[i];
        let d1 = vec2.dot(normal, start.subtract(clipStart));
        let d2 = vec2.dot(normal, end.subtract(clipStart));

        if (d1 >= 0.0 && d2 < 0.0) {
            let newPoint = lineIntersection(start, end, clipStart, clipEnd);
            outVertices.push(start);
            outVertices.push(newPoint);
        }
        else if (d1 >= 0.0 && d2 >= 0.0) {
            outVertices.push(start);
        }
        else if (d1 < 0.0 && d2 >= 0.0) {
            let newPoint = lineIntersection(start, end, clipStart, clipEnd);
            outVertices.push(newPoint);
            outVertices.push(end);
        }
        start = end;
    }
    return outVertices;
}

let vertices = [];
vertices.push(new vec2(100, 100));
vertices.push(new vec2(200, 100));
vertices.push(new vec2(200, 200));
vertices.push(new vec2(100, 200));

let clipLine = [];
clipLine.push({
    start: new vec2(110, 50),
    end: new vec2(110, 300)
});

clipLine.push({
    start: new vec2(150, 300),
    end: new vec2(150, 50)
});

function update() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawQuad(vertices, "#fff");

    let newQuad = [];
    for (let i = 0; i < clipLine.length; ++i) {
        newQuad = beginClip(vertices, clipLine[i]);
        vertices = newQuad;
    }

    for (let i = 0; i < clipLine.length; ++i) {
        let start = clipLine[i].start;
        let end = clipLine[i].end;

        ctx.strokeStyle = "#0f0";
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.closePath();
        ctx.stroke();

        let normal = new vec2(end.y - start.y, start.x - end.x);
        normal = vec2.normalize(normal);
        normal = normal.scale(30);
        ctx.strokeStyle = "#f00";
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(start.x + normal.x, start.y + normal.y);
        ctx.closePath();
        ctx.stroke();
    }


    if (newQuad.length > 0)
        drawQuad(newQuad, "#f00");
    //requestAnimationFrame(update);
}

update();