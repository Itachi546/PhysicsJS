class DistanceJoint
{
    constructor(a, b, anchorPoint)
    {
        this.a = a;
        this.b = b;
        this.anchorPoint = anchorPoint;

        this.anchorA = this.anchorPoint.subtract(this.a.position);
        this.anchorB = this.anchorPoint.subtract(this.b.position);

        this.softness = 0.0;
        this.biasFactor = 0.2;

        this.r1 = new vec2(0.0, 0.0);
        this.r2 = new vec2(0.0, 0.0);

        this.constraintMass = 0.0;

        this.distance = vec2.length(this.b.position.subtract(this.a.position));
    }

    preStep(invDt)
    {
        this.normal = this.b.position.subtract(this.a.position);
        let newDist = vec2.length(this.normal);
        this.normal = vec2.normalize(this.normal);

        let rotateA = mat2.rotate(this.a.orientation);
        this.r1 = rotateA.multiplyVec(this.anchorA);
        
        let rotateB = mat2.rotate(this.b.orientation);
        this.r2 = rotateB.multiplyVec(this.anchorB);

        let rn1 = vec2.cross(this.normal, this.r1);
        let rn2 = vec2.cross(this.normal, this.r2);

        this.constraintMass = this.a.inverseMass + this.b.inverseMass + 
                              this.a.inverseInertia * rn1 * rn1 + this.b.inverseInertia * rn2 * rn2;

        const bias = 0.1;
        this.bias = -bias * invDt * (newDist - this.distance);
    }
    
    applyImpulse()
    {
        let va = this.a.velocity.add(vec2.crossSV(this.a.angularVelocity, this.r1));
        let vb = this.b.velocity.add(vec2.crossSV(this.b.angularVelocity, this.r2));

        let dv = vb.subtract(va);
        let dvN = vec2.dot(dv, this.normal);
        let Pn = this.normal.scale((-dvN + this.bias) / this.constraintMass);
        
        this.a.applyLinearImpulse(Pn.scale(-1));
        this.a.applyAngularImpulse(-vec2.cross(this.r1, Pn));

        this.b.applyLinearImpulse(Pn);
        this.b.applyAngularImpulse(vec2.cross(this.r2, Pn));
        
    }
}