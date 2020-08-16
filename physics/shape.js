const ShapeType = 
{
    CIRCLE: "circle",
    POLYGON: "polygon"
};

class CircleShape
{
    constructor(radius)
    {
        this.radius = radius;
        this.type = ShapeType.CIRCLE;
    }
}

class PolygonShape
{
    constructor()
    {
        this.type = ShapeType.POLYGON;
        this.vertices = [];
    }

    setAsBox(dims)
    {
        let tl = new vec2(-dims.x, -dims.y);
        let tr = new vec2(dims.x, -dims.y);
        let bl = new vec2(-dims.x, dims.y);
        let br = new vec2(dims.x, dims.y);

        this.vertices.push(tl);
        this.vertices.push(tr);
        this.vertices.push(br);
        this.vertices.push(bl);
    }

    getVerticesWorld(position, orientation) 
    {
        let vertices = [];
        let rotate = mat2.rotate(orientation);
        for(let i = 0; i < this.vertices.length; ++i)
        {
            vertices.push(position.add(rotate.multiplyVec(this.vertices[i]), orientation));
        }
        return vertices;
    }
}