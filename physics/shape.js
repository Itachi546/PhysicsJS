const ShapeType = 
{
    CIRCLE: "circle",
    POLYGON: "polygon",
    EDGE : "edge"
};

// https://en.wikipedia.org/wiki/List_of_moments_of_inertia
// Calculation of rotational inertia of planar polygon with axis on it's centroid
function calculateInertiaForConvexShape(vertices)
{
    let n = vertices.length;
    let numerator = 0.0;
    let denominator = 0.0;

    for(let i = 0; i < n; i++)
    {
        let v1 = vertices[i];
        let v2 = vertices[(i + 1) % n];
        
        let k = vec2.cross(v1, v2);
        denominator += k;
        numerator += k * (vec2.dot(v1, v1) + vec2.dot(v2, v2) + vec2.dot(v1, v2));    
    }
    return numerator / (denominator * 6.0);
}
class CircleShape
{
    constructor(radius)
    {
        this.radius = radius;
        this.type = ShapeType.CIRCLE;

    }

    calculateAABB(position, orientation)
    {
        return {
            center : new vec2(position.x, position.y),
            halfSize : new vec2(this.radius,this.radius)
        }
    }
}

class PolygonShape
{
    constructor()
    {
        this.type = ShapeType.POLYGON;
        this.vertices = [];
    }

    // Strict ordering in clockwise direction
    // No need to add starting vertices at the end again
    addVertex(vertex)
    {
        this.vertices.push(vertex);
        return {
            center:new vec2(0.0, 0.0), 
            halfSize: new vec2(this.radius, this.radius)
        };
    }
    
    // @NOTE, @TODO maybe it is not required to be calculated in every frame
    calculateAABB(position, orientation)
    {
        let rotate = mat2.rotate(orientation);
        let max = rotate.multiplyVec(this.vertices[0]);
        let min = new vec2(max.x, max.y);

        for(let i = 1; i < this.vertices.length; ++i)
        {
            let v = rotate.multiplyVec(this.vertices[i]);
            max.x = Math.max(max.x, v.x);
            max.y = Math.max(max.y, v.y);
            min.x = Math.min(min.x, v.x);
            min.y = Math.min(min.y, v.y);
        }
        let size = (max.subtract(min)).scale(0.5);
        return {
            center:position.add(min.add(size)),
            halfSize: size
        };
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

class EdgeShape
{
    constructor()
    {
        this.vertices = [];
    }

    // Currently insert by sorting it in increasing x direction
    addVertex(vertex)
    {
        this.vertices.push(vertex);
    }

    calculateAABB(position, orientation)
    {
        return null;
    }
}