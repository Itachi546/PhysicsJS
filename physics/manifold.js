let accumulateImpulse = false;
let warmStarting = false;

class Contact 
{
    constructor(position, normal, penetration) {
        this.position = position;
        this.normal = normal;
        this.penetration = penetration;

        this.massNormal = 0.0;
        this.massTangent = 0.0;
        this.bias = 0.0;

        // Accumulated normal impulse
        this.Pn = 0.0;
        // Accumulated tangent impulse
        this.Pt = 0.0;
        // Accumulated impulse for position bias
        this.Pnb = 0.0;
    }
}

class Manifold {
    constructor(a, b) {
        this.a = a;
        this.b = b;
        // @TODO temp
        /*
        this.incFaceStart = new vec2(0.0, 0.0);
        this.incFaceEnd = new vec2(0.0, 0.0);

        this.refFaceStart = new vec2(0.0, 0.0);
        this.refFaceEnd = new vec2(0.0, 0.0);
        */
        this.contacts = [];
    }

    swapBodies()
    {
        this.b = [this.a, this.a = this.b][0];
    }

    addContact(position, normal, penetration) {
        this.contacts.push(new Contact(
            position, normal, penetration
        ));
    }

    update(newContacts) {
        let updatedContacts = [];
        for (let j = 0; j < newContacts.length; ++j) {
            for (let i = 0; i < this.contacts.length; ++i) {
                let p1 = this.contacts[i];
                let p2 = newContacts[j];

                const threshold = 0.01;
                if (vec2.lengthSquared(p1, p2) > threshold) {
                    // Generated contact is new
                    updatedContacts.push(newContacts[j]);
                    break;
                }
                else {
                    // Generated contact is old
                    if(warmStarting)
                    {
                        newContacts[j].Pn = this.contacts[i].Pn;
                        newContacts[j].Pt = this.contacts[i].Pt;
                    }
                    updatedContacts.push(newContacts[j]);
                    break;
                }
            }
        }

        this.contacts = updatedContacts;
    }


    preStep(invDt) {
        const kAllowedPenetration = 0.01;
        const biasFactor = 0.2;
        for (let i = 0; i < this.contacts.length; ++i) {
            let contact = this.contacts[i];
            let rA = contact.position.subtract(this.a.position);
            let rB = contact.position.subtract(this.b.position);

            let rnA = vec2.dot(rA, contact.normal);
            let rnB = vec2.dot(rB, contact.normal);

            let kNormal = this.a.inverseMass + this.b.inverseMass;
            kNormal += this.a.inverseInertia * (vec2.dot(rA, rA) - rnA * rnA) +
                this.b.inverseInertia * (vec2.dot(rB, rB) - rnB * rnB);


            contact.massNormal = 1.0 / kNormal;

            let tangent = vec2.crossVS(contact.normal, 1.0);

            let rtA = vec2.dot(rA, tangent);
            let rtB = vec2.dot(rB, tangent);
            let kTangent = this.a.inverseMass + this.b.inverseMass;
            kTangent += this.a.inverseInertia * (vec2.dot(rA, rA) - rtA * rtA) +
                this.b.inverseInertia * (vec2.dot(rB, rB) - rtB * rtB);
            contact.massTangent = 1.0 / kTangent;
            contact.bias = -biasFactor * invDt * Math.min(0.0, contact.penetration + kAllowedPenetration);

            if (accumulateImpulse) 
            {
                let P = (contact.normal.scale(contact.Pn)).add(tangent.scale(contact.Pt));
                this.a.applyLinearImpulse(P.scale(-1.0));
                this.a.applyAngularImpulse(-vec2.cross(rA, P))

                this.b.applyLinearImpulse(P);
                this.b.applyAngularImpulse(vec2.cross(rB, P))
            }
        }
    }

    applyImpulse() {

        for (let i = 0; i < this.contacts.length; ++i) 
        {
            let contact = this.contacts[i];
            let rA = contact.position.subtract(this.a.position);
            let rB = contact.position.subtract(this.b.position);

            let vB = this.b.velocity.add(vec2.crossSV(this.b.angularVelocity, rB));
            let vA = this.a.velocity.add(vec2.crossSV(this.a.angularVelocity, rA));

            let dV = vB.subtract(vA);
            let dvN = vec2.dot(dV, contact.normal);

            let e = this.a.restitution * this.b.restitution;
            let dPn = contact.massNormal * (-dvN * (1.0 + e) + contact.bias);

            if(accumulateImpulse)
            {
                // Clamp the accumulated impulse
                let Pn0 = contact.Pn;
                contact.Pn = Math.max(Pn0 + dPn, 0.0);
                dPn = contact.Pn - Pn0;
            }
            else
            {
                dPn = Math.max(dPn, 0.0);
            }
            let Pn = contact.normal.scale(dPn);
            
            this.a.applyLinearImpulse(Pn.scale(-1.0));
            this.a.applyAngularImpulse(-vec2.cross(rA, Pn))

            this.b.applyLinearImpulse(Pn);
            this.b.applyAngularImpulse(vec2.cross(rB, Pn))
            
            // Friction stuff
            vB = this.b.velocity.add(vec2.crossSV(this.b.angularVelocity, rB));
            vA = this.a.velocity.add(vec2.crossSV(this.a.angularVelocity, rA));
            dV = vB.subtract(vA);

            let tangent = vec2.crossVS(contact.normal, 1.0);
            let dvT = vec2.dot(dV, tangent);
            let dPt = contact.massTangent * (-dvT * (1.0 + e));

            //let friction = Math.sqrt(this.a.friction * this.b.friction);
            let friction = this.a.friction * this.b.friction;
            if(accumulateImpulse)
            {
                let maxPt = friction * contact.Pn;
                let oldTangentImpulse = contact.Pt;
                contact.Pt = Math.max(-maxPt, Math.min(dPt + oldTangentImpulse, maxPt));
                dPt = contact.Pt - oldTangentImpulse;
            }
            else
            {
                let maxPt = friction * dPn;
                dPt = Math.max(-maxPt, Math.min(dPt, maxPt));
            }
            let Pt = tangent.scale(dPt);

            this.a.applyLinearImpulse(Pt.scale(-1.0));
            this.a.applyAngularImpulse(-vec2.cross(rA, Pt))

            this.b.applyLinearImpulse(Pt);
            this.b.applyAngularImpulse(vec2.cross(rB, Pt))
        }
    }
}