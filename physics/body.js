class Body
{
    constructor(position, dims, invMass, bodyType, color = "#fff")
    {
        this.position = position;
        this.velocity = new vec2(0.0, 0.0);

        this.force = new vec2(0.0, 0.0);
        this.restitution = 0.2;
        this.friction = 0.2;
        this.inverseMass = invMass;
        this.dims = dims;

        this.angularVelocity = 0.0;
        this.orientation = 0.0;
        this.torque = 0.0;
        this.inverseInertia = 0.0;

        this.color = color;
        this.bodyType = bodyType;

        this.awake = true;

        if(bodyType == "box")
            this.initBox();
        else
            this.initCircle();
    }

    initBox()
    {
        this.inverseInertia = 12.0 * this.inverseMass / (this.dims.x * this.dims.x + this.dims.y * this.dims.y);
    }

    initCircle()
    {
        this.inverseInertia = this.inverseMass /(this.dims.x * this.dims.x);
    }
    
    clearForce()
    {
        this.force = new vec2(0.0, 0.0);
        this.torque = 0.0;
    }

    addForce(force)
    {
        this.awake = true;
        this.force = force;
    }

    addTorque(torque)
    {
        this.awake = true;
        this.torque = torque;
    }

    applyLinearImpulse(force)
    {
        this.velocity = this.velocity.add(force.scale(this.inverseMass));
    }

    applyAngularImpulse(force)
    {
        this.angularVelocity += force * this.inverseInertia;
    }
}