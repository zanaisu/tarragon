class PhysicsEngine {
    constructor(scene) {
        this.scene = scene;
        this.gravity = -9.81;
        this.waterLevel = 0;
        this.boats = new Map();
        this.projectiles = [];
        this.particles = [];
        this.waves = [];
        this.windForce = new THREE.Vector3(0.5, 0, 0.3);
        this.currentFlow = new THREE.Vector3(0.1, 0, 0.05);
        
        this.initWaterPhysics();
    }
    
    initWaterPhysics() {
        // Create wave system
        this.waveParameters = {
            amplitude: 1.5,
            frequency: 0.02,
            speed: 0.5,
            direction: new THREE.Vector3(1, 0, 0.5).normalize(),
            time: 0
        };
        
        // Create multiple wave systems for complexity
        this.waveSystems = [
            {
                amplitude: 1.5,
                frequency: 0.02,
                speed: 0.5,
                direction: new THREE.Vector3(1, 0, 0.5).normalize()
            },
            {
                amplitude: 0.8,
                frequency: 0.035,
                speed: 0.7,
                direction: new THREE.Vector3(-0.5, 0, 1).normalize()
            },
            {
                amplitude: 0.4,
                frequency: 0.05,
                speed: 1.2,
                direction: new THREE.Vector3(0.8, 0, -0.3).normalize()
            }
        ];
    }
    
    registerBoat(id, mesh, properties = {}) {
        const boat = {
            id: id,
            mesh: mesh,
            velocity: new THREE.Vector3(0, 0, 0),
            angularVelocity: new THREE.Vector3(0, 0, 0),
            mass: properties.mass || 1000,
            drag: properties.drag || 0.95,
            angularDrag: properties.angularDrag || 0.98,
            buoyancy: properties.buoyancy || 800,
            stability: properties.stability || 0.8,
            maxSpeed: properties.maxSpeed || 25,
            acceleration: properties.acceleration || 15,
            turnRate: properties.turnRate || 1.5,
            dimensions: properties.dimensions || { length: 20, width: 8, height: 4 },
            centerOfMass: properties.centerOfMass || new THREE.Vector3(0, -1, 0),
            isInWater: true,
            wakeParticles: [],
            lastPosition: mesh.position.clone()
        };
        
        this.boats.set(id, boat);
        return boat;
    }
    
    updateBoat(id, input, deltaTime) {
        const boat = this.boats.get(id);
        if (!boat) return;
        
        // Calculate water height at boat position
        const waterHeight = this.getWaterHeightAtPosition(boat.mesh.position);
        
        // Check if boat is in water
        boat.isInWater = boat.mesh.position.y <= waterHeight + boat.dimensions.height * 0.5;
        
        if (boat.isInWater) {
            this.updateBoatInWater(boat, input, deltaTime, waterHeight);
        } else {
            this.updateBoatInAir(boat, deltaTime);
        }
        
        // Update wake effects
        this.updateBoatWake(boat, deltaTime);
        
        // Apply final transformations
        boat.mesh.position.copy(boat.mesh.position);
        boat.lastPosition.copy(boat.mesh.position);
    }
    
    updateBoatInWater(boat, input, deltaTime, waterHeight) {
        // Calculate buoyancy force
        const submersion = Math.max(0, waterHeight - boat.mesh.position.y + boat.dimensions.height * 0.5);
        const buoyancyForce = boat.buoyancy * submersion;
        
        // Apply input forces
        const forwardForce = input.forward * boat.acceleration;
        const turnForce = input.turn * boat.turnRate;
        
        // Calculate forward direction
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(boat.mesh.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(boat.mesh.quaternion);
        
        // Apply propulsion
        boat.velocity.add(forward.multiplyScalar(forwardForce * deltaTime));
        
        // Apply water resistance (drag)\n        boat.velocity.multiplyScalar(Math.pow(boat.drag, deltaTime * 60));\n        \n        // Apply current and wind\n        boat.velocity.add(this.currentFlow.clone().multiplyScalar(deltaTime));\n        boat.velocity.add(this.windForce.clone().multiplyScalar(deltaTime * 0.1));\n        \n        // Limit maximum speed\n        if (boat.velocity.length() > boat.maxSpeed) {\n            boat.velocity.normalize().multiplyScalar(boat.maxSpeed);\n        }\n        \n        // Apply angular forces\n        const angularForce = turnForce * Math.max(0.1, boat.velocity.length() / boat.maxSpeed);\n        boat.angularVelocity.y += angularForce * deltaTime;\n        \n        // Angular drag\n        boat.angularVelocity.multiplyScalar(Math.pow(boat.angularDrag, deltaTime * 60));\n        \n        // Update position\n        boat.mesh.position.add(boat.velocity.clone().multiplyScalar(deltaTime));\n        \n        // Update rotation\n        boat.mesh.rotateY(boat.angularVelocity.y * deltaTime);\n        \n        // Apply wave motion for realistic bobbing\n        const waveEffect = this.calculateWaveEffectAtPosition(boat.mesh.position);\n        boat.mesh.position.y = waterHeight + waveEffect.height;\n        \n        // Apply wave-induced rotation\n        const waveRotation = this.calculateWaveRotation(boat.mesh.position, boat.dimensions);\n        boat.mesh.rotation.x = waveRotation.x * 0.1;\n        boat.mesh.rotation.z = waveRotation.z * 0.1;\n        \n        // Stability correction\n        boat.mesh.rotation.x *= boat.stability;\n        boat.mesh.rotation.z *= boat.stability;\n    }\n    \n    updateBoatInAir(boat, deltaTime) {\n        // Apply gravity\n        boat.velocity.y += this.gravity * deltaTime;\n        \n        // Air resistance\n        boat.velocity.multiplyScalar(Math.pow(0.99, deltaTime * 60));\n        \n        // Update position\n        boat.mesh.position.add(boat.velocity.clone().multiplyScalar(deltaTime));\n        \n        // Check for water re-entry\n        const waterHeight = this.getWaterHeightAtPosition(boat.mesh.position);\n        if (boat.mesh.position.y <= waterHeight) {\n            // Splash effect on water entry\n            this.createSplashEffect(boat.mesh.position, boat.velocity.length());\n            \n            // Reduce velocity on impact\n            boat.velocity.multiplyScalar(0.7);\n            boat.mesh.position.y = waterHeight;\n        }\n    }\n    \n    getWaterHeightAtPosition(position) {\n        let height = this.waterLevel;\n        \n        // Sum all wave systems\n        for (const wave of this.waveSystems) {\n            const distance = position.dot(wave.direction);\n            const waveHeight = wave.amplitude * Math.sin(\n                distance * wave.frequency + this.waveParameters.time * wave.speed\n            );\n            height += waveHeight;\n        }\n        \n        return height;\n    }\n    \n    calculateWaveEffectAtPosition(position) {\n        const effect = {\n            height: 0,\n            velocity: new THREE.Vector3(0, 0, 0),\n            normal: new THREE.Vector3(0, 1, 0)\n        };\n        \n        for (const wave of this.waveSystems) {\n            const distance = position.dot(wave.direction);\n            const phase = distance * wave.frequency + this.waveParameters.time * wave.speed;\n            \n            const waveHeight = wave.amplitude * Math.sin(phase);\n            const waveDerivative = wave.amplitude * wave.frequency * Math.cos(phase);\n            \n            effect.height += waveHeight;\n            \n            // Calculate wave velocity\n            const waveVel = wave.direction.clone()\n                .multiplyScalar(wave.amplitude * wave.frequency * wave.speed * Math.cos(phase));\n            effect.velocity.add(waveVel);\n            \n            // Calculate normal (simplified)\n            effect.normal.add(wave.direction.clone().multiplyScalar(-waveDerivative));\n        }\n        \n        effect.normal.normalize();\n        return effect;\n    }\n    \n    calculateWaveRotation(position, dimensions) {\n        // Sample wave heights at boat corners to calculate rotation\n        const frontPos = position.clone().add(new THREE.Vector3(0, 0, -dimensions.length * 0.5));\n        const backPos = position.clone().add(new THREE.Vector3(0, 0, dimensions.length * 0.5));\n        const leftPos = position.clone().add(new THREE.Vector3(-dimensions.width * 0.5, 0, 0));\n        const rightPos = position.clone().add(new THREE.Vector3(dimensions.width * 0.5, 0, 0));\n        \n        const frontHeight = this.getWaterHeightAtPosition(frontPos);\n        const backHeight = this.getWaterHeightAtPosition(backPos);\n        const leftHeight = this.getWaterHeightAtPosition(leftPos);\n        const rightHeight = this.getWaterHeightAtPosition(rightPos);\n        \n        return {\n            x: (frontHeight - backHeight) / dimensions.length,\n            z: (rightHeight - leftHeight) / dimensions.width\n        };\n    }\n    \n    updateBoatWake(boat, deltaTime) {\n        const speed = boat.velocity.length();\n        \n        if (speed > 2 && boat.isInWater) {\n            // Create wake particles\n            const wakeIntensity = Math.min(speed / boat.maxSpeed, 1);\n            \n            if (Math.random() < wakeIntensity * 0.5) {\n                const wakePosition = boat.mesh.position.clone();\n                wakePosition.add(new THREE.Vector3(\n                    (Math.random() - 0.5) * boat.dimensions.width,\n                    0,\n                    boat.dimensions.length * 0.3\n                ).applyQuaternion(boat.mesh.quaternion));\n                \n                const wakeParticle = {\n                    position: wakePosition,\n                    velocity: boat.velocity.clone().multiplyScalar(-0.3),\n                    life: 3 + Math.random() * 2,\n                    maxLife: 3 + Math.random() * 2,\n                    size: 1 + Math.random() * 2\n                };\n                \n                boat.wakeParticles.push(wakeParticle);\n            }\n        }\n        \n        // Update existing wake particles\n        for (let i = boat.wakeParticles.length - 1; i >= 0; i--) {\n            const particle = boat.wakeParticles[i];\n            particle.life -= deltaTime;\n            particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime));\n            particle.velocity.multiplyScalar(0.98); // Friction\n            \n            if (particle.life <= 0) {\n                boat.wakeParticles.splice(i, 1);\n            }\n        }\n    }\n    \n    createSplashEffect(position, intensity) {\n        // Create splash particles\n        for (let i = 0; i < intensity * 10; i++) {\n            const particle = {\n                position: position.clone().add(new THREE.Vector3(\n                    (Math.random() - 0.5) * 5,\n                    0,\n                    (Math.random() - 0.5) * 5\n                )),\n                velocity: new THREE.Vector3(\n                    (Math.random() - 0.5) * intensity * 2,\n                    Math.random() * intensity + 2,\n                    (Math.random() - 0.5) * intensity * 2\n                ),\n                life: 1 + Math.random() * 2,\n                maxLife: 1 + Math.random() * 2,\n                size: 0.2 + Math.random() * 0.5,\n                type: 'splash'\n            };\n            \n            this.particles.push(particle);\n        }\n    }\n    \n    updateProjectilePhysics(projectiles, deltaTime) {\n        for (let i = projectiles.length - 1; i >= 0; i--) {\n            const projectile = projectiles[i];\n            \n            // Apply gravity to projectiles\n            projectile.velocity.y += this.gravity * deltaTime * 0.1;\n            \n            // Apply air resistance\n            projectile.velocity.multiplyScalar(Math.pow(0.999, deltaTime * 60));\n            \n            // Check water interaction\n            const waterHeight = this.getWaterHeightAtPosition(projectile.position);\n            if (projectile.position.y <= waterHeight) {\n                // Projectile hits water\n                this.createSplashEffect(projectile.position, 0.5);\n                \n                // Slow down projectile in water\n                projectile.velocity.multiplyScalar(0.3);\n                \n                // Reduce range in water\n                projectile.range *= 0.5;\n            }\n            \n            // Update position\n            projectile.position.add(projectile.velocity.clone().multiplyScalar(deltaTime));\n        }\n    }\n    \n    update(deltaTime) {\n        this.waveParameters.time += deltaTime;\n        \n        // Update all registered boats\n        for (const [id, boat] of this.boats) {\n            // This would be called with input from the game loop\n            // this.updateBoat(id, input, deltaTime);\n        }\n        \n        // Update particles\n        this.updateParticles(deltaTime);\n        \n        // Update projectiles\n        this.updateProjectilePhysics(this.projectiles, deltaTime);\n    }\n    \n    updateParticles(deltaTime) {\n        for (let i = this.particles.length - 1; i >= 0; i--) {\n            const particle = this.particles[i];\n            \n            particle.life -= deltaTime;\n            \n            if (particle.type === 'splash') {\n                // Apply gravity to splash particles\n                particle.velocity.y += this.gravity * deltaTime;\n                \n                // Check if splash particle hits water again\n                const waterHeight = this.getWaterHeightAtPosition(particle.position);\n                if (particle.position.y <= waterHeight && particle.velocity.y < 0) {\n                    particle.velocity.y *= -0.3; // Bounce with energy loss\n                    particle.position.y = waterHeight;\n                }\n            }\n            \n            // Update position\n            particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime));\n            \n            // Apply air resistance\n            particle.velocity.multiplyScalar(Math.pow(0.98, deltaTime * 60));\n            \n            // Remove expired particles\n            if (particle.life <= 0) {\n                this.particles.splice(i, 1);\n            }\n        }\n    }\n    \n    getBoatPhysicsInfo(id) {\n        const boat = this.boats.get(id);\n        if (!boat) return null;\n        \n        return {\n            velocity: boat.velocity.clone(),\n            speed: boat.velocity.length(),\n            isInWater: boat.isInWater,\n            waterHeight: this.getWaterHeightAtPosition(boat.mesh.position),\n            wakeParticles: boat.wakeParticles.length\n        };\n    }\n    \n    setWind(direction, strength) {\n        this.windForce = direction.clone().normalize().multiplyScalar(strength);\n    }\n    \n    setCurrent(direction, strength) {\n        this.currentFlow = direction.clone().normalize().multiplyScalar(strength);\n    }\n    \n    addProjectile(projectile) {\n        this.projectiles.push(projectile);\n    }\n    \n    removeProjectile(projectileId) {\n        this.projectiles = this.projectiles.filter(p => p.id !== projectileId);\n    }\n    \n    dispose() {\n        this.boats.clear();\n        this.projectiles = [];\n        this.particles = [];\n    }\n}