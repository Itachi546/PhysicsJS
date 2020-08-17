class Body
{
    constructor(position, invMass, color = "#fff")
    {
        this.position = position;
        this.velocity = new vec2(0.0, 0.0);

        this.force = new vec2(0.0, 0.0);
        this.restitution = 0.5;
        this.friction = 0.5;
        this.inverseMass = invMass;

        this.angularVelocity = 0.0;
        this.orientation = 0.0;
        this.torque = 0.0;
        this.inverseInertia = 0.0;

        this.color = color;

        this.shape = null;
        this.joint = null;

        // TODO to be implemented
        this.awake = true;
    }

    initBox(width, height)
    {
        this.shape = new PolygonShape();
        this.shape.setAsBox(new vec2(width, height), this.orientation);
        this.inverseInertia = 12.0 * this.inverseMass / (width * width + height * height);
    }

    initCircle(radius)
    {
        this.shape = new CircleShape(radius);
        this.inverseInertia = (2.0 * this.inverseMass) /(radius * radius);
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