let __debugLines = [];
let __debugPoints = [];

function DrawLine(start, end, color = "#fff") {
    __debugLines.push({
        start, end, color
    });
}

function DrawPoint(point, color = "#fff") {
    __debugPoints.push({
        point, color
    });
}

function DrawDebugData(ctx)
{
    for(let i = 0; i < __debugLines.length; ++i)
    {
        ctx.strokeStyle = __debugLines[i].color;
        ctx.beginPath();
        let start = __debugLines[i].start;
        let end = __debugLines[i].end;        
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.closePath();
        ctx.stroke();
    }
    
    for(let i = 0; i < __debugPoints.length; ++i)
    {
        ctx.fillStyle = __debugPoints[i].color;
        let start = __debugPoints[i].point;
        ctx.beginPath();
        ctx.arc(start.x, start.y, 4.0, 0.0, Math.PI * 2.0);
        ctx.closePath();
        ctx.fill();
    }

    __debugLines = [];
    __debugPoints = []
}