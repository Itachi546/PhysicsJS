class PhysicsSystem {

    constructor(gravity) {
        this.gravity = gravity;
        this.bodies = [];
        this.manifolds = [];
        this.constraints = [];
    }

    step(dt) {

        this.checkCollision();

        let invDt = 1.0 / dt;

        this.integrateForce(dt);

        for (let i = 0; i < this.manifolds.length; ++i)
            this.manifolds[i].preStep(invDt);

        for (let i = 0; i < this.constraints.length; ++i)
            this.constraints[i].preStep(invDt);

        for (let j = 0; j < 5; ++j) {
            for (let i = 0; i < this.manifolds.length; ++i)
                this.manifolds[i].applyImpulse();

            for (let i = 0; i < this.constraints.length; ++i)
                this.constraints[i].applyImpulse();

        }

        this.integrateVelocity(dt);
    }

    integrateForce(dt) {
        this.bodies.forEach((body) => {
            if (body.inverseMass > 0.0 && body.awake) {
                let acceleration = body.force.scale(body.inverseMass);
                body.velocity = body.velocity.add((acceleration.add(this.gravity)).scale(dt));
                const angularDamping = 0.0;
                body.angularVelocity += body.torque * body.inverseInertia * dt - body.angularVelocity * angularDamping;
            }
        });
    }

    integrateVelocity(dt) {
        this.bodies.forEach((body) => {
            if (body.inverseMass > 0.0 && body.awake) {
                let velocity = body.velocity;
                body.position = body.position.add(velocity.scale(dt));

                body.orientation += body.angularVelocity * dt;
                body.clearForce();
            }
        });
    }

    addBody(body) {
        this.bodies.push(body);
    }

    addConstraints(c) {
        this.constraints.push(c);
    }

    narrowPhase(bodyA, bodyB) {
        let shapeAType = bodyA.shape.type;
        let shapeBType = bodyB.shape.type;


        let intersect = false;
        let manifold = new Manifold(bodyA, bodyB);

        let contactCoherence = true;

        if (shapeAType === ShapeType.POLYGON && shapeBType === ShapeType.POLYGON) {
            intersect = BoxBoxCollision(bodyA, bodyB, manifold);
        }
        else if (shapeAType === ShapeType.CIRCLE && shapeBType === ShapeType.CIRCLE) {
            intersect = CircleCircleCollision(bodyA, bodyB, manifold);
        }
        else if (shapeAType === ShapeType.POLYGON && shapeBType === ShapeType.CIRCLE) {
            intersect = BoxCircleCollision(bodyA, bodyB, manifold);
        }
        else if (shapeAType === ShapeType.CIRCLE && shapeBType === ShapeType.POLYGON) {
            manifold.swapBodies();
            intersect = BoxCircleCollision(bodyB, bodyA, manifold);
        }
        else if (shapeAType === ShapeType.CIRCLE && shapeBType === ShapeType.EDGE) {
            //No contact coherence for circle and edge
            // This cause instability if two points on edge are very close
            // less than the threshold

            intersect = CircleEdgeCollision(bodyA, bodyB, manifold);
            contactCoherence = false;
        }
        else if (shapeAType === ShapeType.EDGE && shapeBType === ShapeType.CIRCLE) {
            manifold.swapBodies();
            intersect = CircleEdgeCollision(bodyB, bodyA, manifold);
            contactCoherence = false;
        }

        // Check for existing manifold
        let found = this.findManifold(manifold.a, manifold.b);
        if (!contactCoherence) {
            if (found !== -1)
                this.manifolds.splice(found, 1);
            found = -1;
        }

        if (intersect) {
            if (found !== -1) {
                this.manifolds[found].update(manifold.contacts);
            }
            else {
                this.manifolds.push(manifold);
            }
        }
        else {
            if (found !== -1)
                this.manifolds.splice(found, 1);
        }
        // end 
    }

    checkCollision() {
        for (let i = 0; i < bodies.length; ++i) {
            for (let j = i + 1; j < bodies.length; ++j) {
                let bodyA = bodies[i];
                let bodyB = bodies[j];

                let isPart = false;
                for(let k = 0; k < bodyB.joint.length; ++k)
                {
                    if(bodyA.isPartOfJoint(bodyB.joint[k]))
                    {
                        isPart = true;
                        break;
                    }
                }
                if(isPart) 
                    continue;

                // @TODO uncomment it later
                if (bodyA.inverseMass === 0 && bodyB.inverseMass === 0)
                    continue;

                if(AABBOverlap(bodyA.calculateAABB(), bodyB.calculateAABB()))
                {
                    this.narrowPhase(bodyA, bodyB);
                }

            }
        }
    }

    clear() {
        this.constraints = [];
        this.bodies = [];
        this.manifolds = [];
    }

    drawJoint() {
        for (let i = 0; i < this.constraints.length; ++i) {
            let start = this.constraints[i].a.position.add(this.constraints[i].r1);
            let end = this.constraints[i].b.position.add(this.constraints[i].r2);
            DrawLine(start, end);
        }
    }

    drawManifolds() {
        for (let i = 0; i < this.manifolds.length; ++i) {
            let contacts = this.manifolds[i].contacts;
            for (let i = 0; i < contacts.length; ++i) {
                let contact = contacts[i];
                let start = contact.position;
                let end = contact.position.add(contact.normal.scale(20.0));

                DrawPoint(start, "#00f")
                DrawLine(start, end, "#f00");
            }
        }
    }


    findManifold(a, b) {
        for (let i = 0; i < this.manifolds.length; ++i) {
            if (this.manifolds[i].a === a && this.manifolds[i].b === b)
                return i;
            if (this.manifolds[i].a === b && this.manifolds[i].b === a)
                return i;
        }
        return -1;
    }
}