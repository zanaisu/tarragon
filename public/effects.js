class EffectsEngine {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.particles = new Map();
        this.explosions = [];
        this.waterRipples = [];
        this.muzzleFlashes = [];
        this.bloodSplatters = [];
        this.weatherSystem = null;
        this.skybox = null;
        this.timeOfDay = 0.5; // 0 = midnight, 0.5 = noon, 1 = midnight
        
        this.init();
    }
    
    init() {
        this.createSkybox();
        this.setupPostProcessing();
        this.createWeatherSystem();
        this.setupLighting();
    }
    
    createSkybox() {
        const skyboxGeometry = new THREE.SphereGeometry(1500, 32, 32);
        const skyboxMaterial = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0x0077ff) },
                bottomColor: { value: new THREE.Color(0xffffff) },
                offset: { value: 400 },
                exponent: { value: 0.6 },
                time: { value: 0 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                uniform float offset;
                uniform float exponent;
                uniform float time;
                varying vec3 vWorldPosition;
                
                void main() {
                    float h = normalize(vWorldPosition + offset).y;
                    float mixValue = max(pow(max(h, 0.0), exponent), 0.0);
                    
                    // Add subtle color variation based on time
                    vec3 dayColor = mix(bottomColor, topColor, mixValue);
                    vec3 sunsetColor = mix(vec3(1.0, 0.4, 0.1), vec3(0.8, 0.2, 0.8), mixValue);
                    vec3 nightColor = mix(vec3(0.1, 0.1, 0.2), vec3(0.0, 0.0, 0.1), mixValue);
                    
                    vec3 finalColor;
                    if (time < 0.3) {
                        finalColor = mix(nightColor, sunsetColor, time / 0.3);
                    } else if (time < 0.7) {
                        finalColor = mix(sunsetColor, dayColor, (time - 0.3) / 0.4);
                    } else {
                        finalColor = mix(dayColor, nightColor, (time - 0.7) / 0.3);
                    }
                    
                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `,
            side: THREE.BackSide
        });
        
        this.skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
        this.scene.add(this.skybox);
    }
    
    setupPostProcessing() {
        // Add bloom effect, color grading, etc.
        this.bloomPass = {
            enabled: true,
            strength: 0.5,
            radius: 0.8,
            threshold: 0.2
        };
    }
    
    createWeatherSystem() {
        this.weatherSystem = {
            rain: {
                particles: [],
                intensity: 0,
                enabled: false
            },
            fog: {
                density: 0.001,
                enabled: true
            },
            wind: {
                direction: new THREE.Vector3(1, 0, 0),
                strength: 0.3
            }
        };
        
        // Create rain particles
        for (let i = 0; i < 1000; i++) {
            const rainDrop = new THREE.Vector3(
                (Math.random() - 0.5) * 2000,
                500 + Math.random() * 500,
                (Math.random() - 0.5) * 2000
            );
            rainDrop.velocity = new THREE.Vector3(0, -50, 0);
            this.weatherSystem.rain.particles.push(rainDrop);
        }
    }
    
    setupLighting() {
        // Dynamic lighting based on time of day
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1);
        this.sunLight.position.set(100, 100, 50);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 4096;
        this.sunLight.shadow.mapSize.height = 4096;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 2000;
        this.sunLight.shadow.camera.left = -500;
        this.sunLight.shadow.camera.right = 500;
        this.sunLight.shadow.camera.top = 500;
        this.sunLight.shadow.camera.bottom = -500;
        this.scene.add(this.sunLight);
        
        this.moonLight = new THREE.DirectionalLight(0x6666ff, 0.2);
        this.moonLight.position.set(-100, 100, -50);
        this.scene.add(this.moonLight);
    }
    
    updateTimeOfDay(deltaTime) {
        this.timeOfDay += deltaTime * 0.01; // Slow progression
        if (this.timeOfDay > 1) this.timeOfDay = 0;
        
        // Update skybox
        if (this.skybox && this.skybox.material.uniforms) {
            this.skybox.material.uniforms.time.value = this.timeOfDay;
        }
        
        // Update lighting
        const sunIntensity = Math.max(0, Math.sin(this.timeOfDay * Math.PI * 2));
        const moonIntensity = Math.max(0, -Math.sin(this.timeOfDay * Math.PI * 2)) * 0.3;
        
        this.sunLight.intensity = sunIntensity;
        this.moonLight.intensity = moonIntensity;
        
        // Update sun position
        const sunAngle = this.timeOfDay * Math.PI * 2;
        this.sunLight.position.set(
            Math.cos(sunAngle) * 500,
            Math.sin(sunAngle) * 500,
            50
        );
    }
    
    createExplosion(position, size = 1) {
        const explosion = {
            position: position.clone(),
            particles: [],
            age: 0,
            maxAge: 2,
            size: size
        };
        
        // Create explosion particles
        for (let i = 0; i < 50 * size; i++) {
            const particle = {
                position: position.clone(),
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 20 * size,
                    Math.random() * 15 * size,
                    (Math.random() - 0.5) * 20 * size
                ),
                life: 1 + Math.random(),
                maxLife: 1 + Math.random(),
                size: 0.5 + Math.random() * 1.5 * size,
                color: new THREE.Color().setHSL(
                    Math.random() * 0.1 + 0.05, // Orange/red hues
                    0.8 + Math.random() * 0.2,
                    0.5 + Math.random() * 0.3
                )
            };
            explosion.particles.push(particle);
        }
        
        this.explosions.push(explosion);
        return explosion;
    }
    
    createMuzzleFlash(position, direction) {
        const flash = {
            position: position.clone(),
            direction: direction.clone().normalize(),
            age: 0,
            maxAge: 0.1,
            intensity: 1
        };
        
        // Create flash geometry
        const flashGeometry = new THREE.ConeGeometry(2, 8, 8);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff88,
            transparent: true,
            opacity: 0.8
        });
        
        flash.mesh = new THREE.Mesh(flashGeometry, flashMaterial);
        flash.mesh.position.copy(position);
        flash.mesh.lookAt(position.clone().add(direction));
        flash.mesh.rotateX(Math.PI / 2);
        
        this.scene.add(flash.mesh);
        this.muzzleFlashes.push(flash);
        
        return flash;
    }
    
    createWaterSplash(position, intensity = 1) {
        const splash = {
            position: position.clone(),
            particles: [],
            age: 0,
            maxAge: 1.5,
            intensity: intensity
        };
        
        // Create water droplet particles
        for (let i = 0; i < 30 * intensity; i++) {
            const particle = {
                position: position.clone(),
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 10 * intensity,
                    Math.random() * 8 * intensity + 2,
                    (Math.random() - 0.5) * 10 * intensity
                ),
                life: 0.5 + Math.random() * 1,
                maxLife: 0.5 + Math.random() * 1,
                size: 0.2 + Math.random() * 0.5,
                gravity: -9.8
            };
            splash.particles.push(particle);
        }
        
        // Create ripple effect
        this.createWaterRipple(position, intensity);
        
        return splash;
    }
    
    createWaterRipple(position, intensity = 1) {
        const ripple = {
            position: position.clone(),
            radius: 0,
            maxRadius: 20 * intensity,
            age: 0,
            maxAge: 2,
            intensity: intensity
        };
        
        // Create ripple geometry
        const rippleGeometry = new THREE.RingGeometry(0, 1, 32);
        const rippleMaterial = new THREE.MeshBasicMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        ripple.mesh = new THREE.Mesh(rippleGeometry, rippleMaterial);
        ripple.mesh.position.copy(position);
        ripple.mesh.position.y = 0.1; // Slightly above water
        ripple.mesh.rotation.x = -Math.PI / 2;
        
        this.scene.add(ripple.mesh);
        this.waterRipples.push(ripple);
        
        return ripple;
    }
    
    createBloodSplatter(position, direction) {
        const splatter = {
            position: position.clone(),
            particles: [],
            age: 0,
            maxAge: 3
        };
        
        // Create blood droplets
        for (let i = 0; i < 15; i++) {
            const particle = {
                position: position.clone(),
                velocity: direction.clone()
                    .multiplyScalar(5 + Math.random() * 10)
                    .add(new THREE.Vector3(
                        (Math.random() - 0.5) * 5,
                        Math.random() * 3,
                        (Math.random() - 0.5) * 5
                    )),
                life: 2 + Math.random(),
                maxLife: 2 + Math.random(),
                size: 0.1 + Math.random() * 0.3,
                gravity: -9.8
            };
            splatter.particles.push(particle);
        }
        
        this.bloodSplatters.push(splatter);
        return splatter;
    }
    
    createTracer(startPos, endPos, color = 0xffff00) {
        const direction = new THREE.Vector3().subVectors(endPos, startPos);
        const distance = direction.length();
        direction.normalize();
        
        const tracerGeometry = new THREE.CylinderGeometry(0.05, 0.05, distance);
        const tracerMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8
        });
        
        const tracer = new THREE.Mesh(tracerGeometry, tracerMaterial);
        tracer.position.copy(startPos).add(direction.clone().multiplyScalar(distance / 2));
        tracer.lookAt(endPos);
        tracer.rotateX(Math.PI / 2);
        
        this.scene.add(tracer);
        
        // Remove tracer after short time
        setTimeout(() => {
            this.scene.remove(tracer);
            tracerGeometry.dispose();
            tracerMaterial.dispose();
        }, 100);
        
        return tracer;
    }
    
    update(deltaTime) {
        this.updateTimeOfDay(deltaTime);
        this.updateExplosions(deltaTime);
        this.updateMuzzleFlashes(deltaTime);
        this.updateWaterRipples(deltaTime);
        this.updateBloodSplatters(deltaTime);
        this.updateWeather(deltaTime);
    }
    
    updateExplosions(deltaTime) {
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            explosion.age += deltaTime;
            
            // Update particles
            for (const particle of explosion.particles) {
                particle.life -= deltaTime;
                if (particle.life <= 0) continue;
                
                // Apply physics
                particle.velocity.y -= 9.8 * deltaTime; // Gravity
                particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime));
                
                // Render particle (simplified - in real implementation use particle system)
                const progress = 1 - (particle.life / particle.maxLife);
                particle.size *= 0.98; // Shrink over time
            }
            
            if (explosion.age >= explosion.maxAge) {
                this.explosions.splice(i, 1);
            }
        }
    }
    
    updateMuzzleFlashes(deltaTime) {
        for (let i = this.muzzleFlashes.length - 1; i >= 0; i--) {
            const flash = this.muzzleFlashes[i];
            flash.age += deltaTime;
            
            const progress = flash.age / flash.maxAge;
            flash.intensity = 1 - progress;
            
            if (flash.mesh) {
                flash.mesh.material.opacity = flash.intensity;
                flash.mesh.scale.setScalar(1 + progress * 2);
            }
            
            if (flash.age >= flash.maxAge) {
                if (flash.mesh) {
                    this.scene.remove(flash.mesh);
                    flash.mesh.geometry.dispose();
                    flash.mesh.material.dispose();
                }
                this.muzzleFlashes.splice(i, 1);
            }
        }
    }
    
    updateWaterRipples(deltaTime) {
        for (let i = this.waterRipples.length - 1; i >= 0; i--) {
            const ripple = this.waterRipples[i];
            ripple.age += deltaTime;
            
            const progress = ripple.age / ripple.maxAge;
            ripple.radius = ripple.maxRadius * progress;
            
            if (ripple.mesh) {
                ripple.mesh.scale.setScalar(ripple.radius);
                ripple.mesh.material.opacity = (1 - progress) * 0.3;
            }
            
            if (ripple.age >= ripple.maxAge) {
                if (ripple.mesh) {
                    this.scene.remove(ripple.mesh);
                    ripple.mesh.geometry.dispose();
                    ripple.mesh.material.dispose();
                }
                this.waterRipples.splice(i, 1);
            }
        }
    }
    
    updateBloodSplatters(deltaTime) {
        for (let i = this.bloodSplatters.length - 1; i >= 0; i--) {
            const splatter = this.bloodSplatters[i];
            splatter.age += deltaTime;
            
            // Update blood particles
            for (const particle of splatter.particles) {
                particle.life -= deltaTime;
                if (particle.life <= 0) continue;
                
                particle.velocity.y += particle.gravity * deltaTime;
                particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime));
            }
            
            if (splatter.age >= splatter.maxAge) {
                this.bloodSplatters.splice(i, 1);
            }
        }
    }
    
    updateWeather(deltaTime) {
        if (this.weatherSystem.rain.enabled) {
            for (const rainDrop of this.weatherSystem.rain.particles) {
                rainDrop.add(rainDrop.velocity.clone().multiplyScalar(deltaTime));
                
                // Reset rain drops that fall below water level
                if (rainDrop.y < 0) {
                    rainDrop.y = 500 + Math.random() * 500;
                    rainDrop.x = (Math.random() - 0.5) * 2000;
                    rainDrop.z = (Math.random() - 0.5) * 2000;
                    
                    // Create small splash where rain hits water
                    if (Math.random() < 0.1) {
                        this.createWaterSplash(new THREE.Vector3(rainDrop.x, 0, rainDrop.z), 0.3);
                    }
                }
            }
        }
    }
    
    setWeatherIntensity(type, intensity) {
        if (this.weatherSystem[type]) {
            this.weatherSystem[type].intensity = Math.max(0, Math.min(1, intensity));
            
            if (type === 'rain') {
                this.weatherSystem.rain.enabled = intensity > 0;
            }
        }
    }
    
    dispose() {
        // Clean up all effects and dispose of geometries/materials
        this.explosions = [];
        this.waterRipples = [];
        this.muzzleFlashes = [];
        this.bloodSplatters = [];
        
        if (this.skybox) {
            this.scene.remove(this.skybox);
            this.skybox.geometry.dispose();
            this.skybox.material.dispose();
        }
    }
}