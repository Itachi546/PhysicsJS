class PhysicsSystem
{
    constructor(gravity)
    {
        this.gravity = gravity;
        this.bodies = [];
        this.manifolds = [];
        this.constraints = [];
    }

    step(dt)
    {
        this.broadPhase();
        
        let invDt = 1.0 / dt;

        this.integrateForce(dt);
        
        for(let i = 0; i < this.manifolds.length; ++i)
            this.manifolds[i].preStep(invDt);

        for(let i = 0; i < this.constraints.length; ++i)
            this.constraints[i].preStep(invDt);
        
        for(let j = 0; j < 5; ++j)
        {
            for(let i = 0; i < this.manifolds.length; ++i)
                this.manifolds[i].applyImpulse();

            for(let i = 0; i < this.constraints.length; ++i)
                this.constraints[i].applyImpulse();
       
        }

        this.integrateVelocity(dt);
    }

    integrateForce(dt)
    {
        this.bodies.forEach((body)=>{
            if(body.inverseMass > 0.0 && body.awake)
            {
                let acceleration = body.force.scale(body.inverseMass);
                body.velocity = body.velocity.add((acceleration.add(this.gravity)).scale(dt));
                body.angularVelocity += body.torque * body.inverseInertia * dt;
            }
        });
    }

    integrateVelocity(dt)
    {
        this.bodies.forEach((body)=>{
            if(body.inverseMass > 0.0 && body.awake)
            {
                let velocity = body.velocity;
                body.position = body.position.add(velocity.scale(dt));

                body.orientation += body.angularVelocity * dt;
                body.clearForce();
            }
        });
    }

    addBody(body)
    {
        this.bodies.push(body);
    }

    addConstraints(c)
    {
        this.constraints.push(c);
    }

    broadPhase()
    {
        for(let i = 0; i < bodies.length; ++i)
        {
            for(let j = i + 1; j < bodies.length; ++j)
            {
                let manifold = new Manifold(bodies[i], bodies[j]);
                let found = this.findManifold(bodies[i], bodies[j]);
                if(BoxBoxCollision(bodies[i], bodies[j], manifold))
                {
                    if(found !== -1)
                    {
                        this.manifolds[found].update(manifold.contacts);
                    }
                    else
                    {
                        this.manifolds.push(manifold);
                    }
                }
                else
                {
                    if(found !== -1)
                        this.manifolds.splice(found, 1);
                }
            }
        }
    }

    clear()
    {
        this.constraints = [];
        this.bodies = [];
        this.manifolds = [];
    }

    drawJoint(ctx)
    {
        for(let i = 0; i < this.constraints.length; ++i)
        {
            ctx.strokeStyle = "#fff"
            ctx.beginPath();
            let start = this.constraints[i].a.position;
            let end = this.constraints[i].b.position;

            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.closePath();
            ctx.stroke();
            /*
            ctx.fillStyle = "#f00";
            ctx.beginPath();
            ctx.arc(start.x + rA.x, start.y + rA.y, 2.0, 0.0, Math.PI * 2.0);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = "#f00";
            ctx.beginPath();
            ctx.arc(end.x + rB.x, end.y + rB.y, 2.0, 0.0, Math.PI * 2.0);
            ctx.closePath();
            ctx.fill();
            */
        }
    }
    drawManifolds(ctx)
    {
        for(let i = 0; i < this.manifolds.length; ++i)
        {
            let contacts = this.manifolds[i].contacts;
            for(let i = 0; i < contacts.length; ++i)
            {
                let contact = contacts[i];
                let start = contact.position;
                let end = contact.position.add(contact.normal.scale(20.0));

                ctx.fillStyle = "#00f";
                ctx.beginPath();
                ctx.arc(start.x, start.y, 4.0, 0.0, Math.PI * 2.0);
                ctx.closePath();
                ctx.fill();

                ctx.strokeStyle = "#f00";
                ctx.beginPath();
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(end.x, end.y);
                ctx.closePath();
                ctx.stroke();

            }
        }
    }


    findManifold(a, b)
    {
        for(let i = 0; i < this.manifolds.length; ++i)
        {
            if(this.manifolds[i].a === a && this.manifolds[i].b === b)
                return i;
            if(this.manifolds[i].a === b && this.manifolds[i].b === a)
                return i;
        }
        return -1;
    }
}