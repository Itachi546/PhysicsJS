class vec2
{
    constructor(x, y)
    {
        this.x = x;
        this.y = y;
    }

    clone()
    {
        return new vec2(this.x, this.y);
    }
    add(other)
    {
        return new vec2(this.x + other.x, this.y + other.y);
    }

    subtract(other)
    {
        return new vec2(this.x - other.x, this.y - other.y);
    }

    scale(other)
    {
        return new vec2(this.x * other.x, this.y * other.y);
    }

    scale(other)
    {
        return new vec2(this.x * other, this.y * other);
    }

    static dot(a, b)
    {
        return (a.x * b.x + a.y * b.y);
    }

    static cross(a, b)
    {
        return a.x * b.y - a.y * b.x;
    }

    static crossVS(a, s)
    {
        return new vec2(s * a.y, -s * a.x);
    }

    static crossSV(s, a)
    {
        return new vec2(-s * a.y, s * a.x);
    }
    static length(a)
    {
        return Math.sqrt(a.x * a.x + a.y * a.y);
    }
    static lengthSquared(a)
    {
        return a.x * a.x + a.y * a.y;
    }

    static distance(a, b)
    {
        let delta = new vec2(b.x - a.x, b.y - a.y);
        return Math.sqrt(delta.x * delta.x + delta.y * delta.y);
    }

    static normalize(a)
    {
        let len = this.length(a);
        let invLen = 1.0 / len;
        if(len == 0.0)
            return new vec2(0.0, 0.0);
        else
            return new vec2(a.x * invLen, a.y * invLen);
    }

    static clamp(v, min, max)
    {
        return new vec2(
            Math.min(max.x, Math.max(v.x, min.x)),
            Math.min(max.y, Math.max(v.y, min.y)),
        );
    }
}

class mat2
{
    constructor()
    {
        this.m00 = 1.0;
        this.m01 = 0.0;
        this.m10 = 0.0;
        this.m11 = 1.0;
    }

    multiplyVec(v)
    {
        return new vec2(
            this.m00 * v.x + this.m01 * v.y,
            this.m10 * v.x + this.m11 * v.y
        );
    }

    multiplyMat(m)
    {
        let res = new mat2();
        res.m00 = this.m00 * m.m00 + this.m01 * m.m10;
        res.m01 = this.m00 * m.m01 + this.m01 * m.m11;

        res.m10 = this.m10 * m.m00 + this.m11 * m.m10;
        res.m11 = this.m10 * m.m01 + this.m11 * m.m11;

        return res;
    }

    static rotate(ang)
    {
        let cA = Math.cos(ang);
        let sA = Math.sin(ang);

        let res = new mat2();
        res.m00 = cA;
        res.m01 = -sA;
        res.m10 = sA;
        res.m11 = cA;
        return res;
    }
    
}