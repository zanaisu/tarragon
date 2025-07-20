class WeaponSystem {
    constructor(audioEngine, effectsEngine) {
        this.audioEngine = audioEngine;
        this.effectsEngine = effectsEngine;
        this.weapons = new Map();
        this.currentWeapon = null;
        this.isReloading = false;
        this.isFiring = false;
        this.lastShotTime = 0;
        
        this.initWeapons();
    }
    
    initWeapons() {
        // Assault Rifle
        this.weapons.set('rifle', {
            name: 'AK-47',
            type: 'automatic',
            damage: 35,
            fireRate: 600, // rounds per minute
            maxAmmo: 30,
            currentAmmo: 30,
            reloadTime: 2.5,
            range: 800,
            accuracy: 0.85,
            recoil: {
                horizontal: 0.02,
                vertical: 0.03,
                recovery: 0.95
            },
            projectileSpeed: 800,
            penetration: 0.7,
            muzzleVelocity: 715,
            sound: 'rifle_shot',
            model: null,
            animations: {
                fire: null,
                reload: null,
                draw: null
            }
        });
        
        // Pistol
        this.weapons.set('pistol', {
            name: 'Desert Eagle',
            type: 'semi',
            damage: 65,
            fireRate: 300,
            maxAmmo: 7,
            currentAmmo: 7,
            reloadTime: 1.8,
            range: 400,
            accuracy: 0.92,
            recoil: {
                horizontal: 0.01,
                vertical: 0.05,
                recovery: 0.98
            },
            projectileSpeed: 600,
            penetration: 0.8,
            muzzleVelocity: 450,
            sound: 'pistol_shot',
            model: null,
            animations: {
                fire: null,
                reload: null,
                draw: null
            }
        });
        
        // Shotgun
        this.weapons.set('shotgun', {
            name: 'Remington 870',
            type: 'pump',
            damage: 25, // per pellet
            pellets: 8,
            fireRate: 120,
            maxAmmo: 6,
            currentAmmo: 6,
            reloadTime: 3.2,
            range: 200,
            accuracy: 0.65,
            spread: 0.15, // Shotgun spread
            recoil: {
                horizontal: 0.03,
                vertical: 0.08,
                recovery: 0.9
            },
            projectileSpeed: 400,
            penetration: 0.3,
            muzzleVelocity: 400,
            sound: 'shotgun_shot',
            model: null,
            animations: {
                fire: null,
                reload: null,
                draw: null
            }
        });
        
        // Sniper Rifle
        this.weapons.set('sniper', {
            name: 'AWP',
            type: 'bolt',
            damage: 150,
            fireRate: 40,
            maxAmmo: 5,
            currentAmmo: 5,
            reloadTime: 3.7,
            range: 2000,
            accuracy: 0.98,
            recoil: {
                horizontal: 0.01,
                vertical: 0.12,
                recovery: 0.85
            },
            projectileSpeed: 1200,
            penetration: 0.95,
            muzzleVelocity: 853,
            sound: 'sniper_shot',
            model: null,
            animations: {
                fire: null,
                reload: null,
                draw: null
            }
        });
        
        // SMG
        this.weapons.set('smg', {
            name: 'MP5',
            type: 'automatic',
            damage: 28,
            fireRate: 800,
            maxAmmo: 25,
            currentAmmo: 25,
            reloadTime: 2.1,
            range: 300,
            accuracy: 0.78,
            recoil: {
                horizontal: 0.025,
                vertical: 0.02,
                recovery: 0.96
            },
            projectileSpeed: 650,
            penetration: 0.5,
            muzzleVelocity: 400,
            sound: 'smg_shot',
            model: null,
            animations: {
                fire: null,
                reload: null,
                draw: null
            }
        });
        
        // LMG
        this.weapons.set('lmg', {
            name: 'M249',
            type: 'automatic',
            damage: 45,
            fireRate: 500,
            maxAmmo: 100,
            currentAmmo: 100,
            reloadTime: 4.5,
            range: 1000,
            accuracy: 0.75,
            recoil: {
                horizontal: 0.04,
                vertical: 0.05,
                recovery: 0.88
            },
            projectileSpeed: 900,
            penetration: 0.85,
            muzzleVelocity: 915,
            sound: 'lmg_shot',
            model: null,
            animations: {
                fire: null,
                reload: null,
                draw: null
            }
        });
        
        this.currentWeapon = this.weapons.get('rifle');
    }
    
    switchWeapon(weaponName) {
        if (this.weapons.has(weaponName) && !this.isReloading) {
            this.currentWeapon = this.weapons.get(weaponName);
            this.audioEngine.play('weapon_pickup', 0.7);
            return true;
        }
        return false;
    }
    
    canFire() {
        if (!this.currentWeapon || this.isReloading || this.currentWeapon.currentAmmo <= 0) {
            return false;
        }
        
        const now = Date.now();
        const fireInterval = 60000 / this.currentWeapon.fireRate; // Convert RPM to milliseconds
        
        return (now - this.lastShotTime) >= fireInterval;
    }
    
    fire(camera, targetPosition = null) {
        if (!this.canFire()) {
            // Play empty click sound
            this.audioEngine.play('weapon_empty', 0.5);
            return null;
        }
        
        this.lastShotTime = Date.now();
        this.currentWeapon.currentAmmo--;
        
        // Calculate shot data
        const shotData = this.calculateShot(camera, targetPosition);
        
        // Play weapon sound
        this.audioEngine.play(this.currentWeapon.sound, 1.0, 1.0 + (Math.random() - 0.5) * 0.1);
        
        // Create muzzle flash
        const muzzlePosition = camera.getWorldPosition(new THREE.Vector3());
        const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        this.effectsEngine.createMuzzleFlash(muzzlePosition, direction);
        
        // Apply recoil
        this.applyRecoil(camera);
        
        // Handle different weapon types
        if (this.currentWeapon.type === 'shotgun') {
            return this.fireShotgun(camera, shotData);
        } else {
            return this.fireSingleProjectile(camera, shotData);
        }
    }
    
    calculateShot(camera, targetPosition) {
        const origin = camera.getWorldPosition(new THREE.Vector3());
        let direction;
        
        if (targetPosition) {
            direction = new THREE.Vector3().subVectors(targetPosition, origin).normalize();
        } else {
            direction = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        }
        
        // Apply weapon accuracy/spread
        const spread = (1 - this.currentWeapon.accuracy) * 0.1;
        if (this.currentWeapon.spread) {
            // Shotgun spread
            direction.x += (Math.random() - 0.5) * this.currentWeapon.spread;
            direction.y += (Math.random() - 0.5) * this.currentWeapon.spread;
            direction.z += (Math.random() - 0.5) * this.currentWeapon.spread;
        } else {
            // Regular weapon spread
            direction.x += (Math.random() - 0.5) * spread;
            direction.y += (Math.random() - 0.5) * spread;
        }
        
        direction.normalize();
        
        return {
            origin: origin,
            direction: direction,
            damage: this.currentWeapon.damage,
            speed: this.currentWeapon.projectileSpeed,
            range: this.currentWeapon.range,
            penetration: this.currentWeapon.penetration
        };
    }
    
    fireSingleProjectile(camera, shotData) {
        const projectile = {
            id: Date.now() + Math.random(),
            position: shotData.origin.clone(),
            velocity: shotData.direction.clone().multiplyScalar(shotData.speed),
            damage: shotData.damage,
            range: shotData.range,
            penetration: shotData.penetration,
            distanceTraveled: 0,
            weapon: this.currentWeapon.name
        };
        
        // Create tracer effect
        const endPos = shotData.origin.clone().add(
            shotData.direction.clone().multiplyScalar(shotData.range)
        );
        this.effectsEngine.createTracer(shotData.origin, endPos);
        
        return [projectile];
    }
    
    fireShotgun(camera, shotData) {
        const projectiles = [];
        const pelletCount = this.currentWeapon.pellets || 8;
        
        for (let i = 0; i < pelletCount; i++) {
            // Each pellet has its own spread
            const pelletDirection = shotData.direction.clone();
            pelletDirection.x += (Math.random() - 0.5) * this.currentWeapon.spread;
            pelletDirection.y += (Math.random() - 0.5) * this.currentWeapon.spread;
            pelletDirection.z += (Math.random() - 0.5) * this.currentWeapon.spread;
            pelletDirection.normalize();
            
            const projectile = {
                id: Date.now() + Math.random() + i,
                position: shotData.origin.clone(),
                velocity: pelletDirection.multiplyScalar(shotData.speed),
                damage: shotData.damage,
                range: shotData.range,
                penetration: shotData.penetration,
                distanceTraveled: 0,
                weapon: this.currentWeapon.name,
                isPellet: true
            };
            
            projectiles.push(projectile);
            
            // Create shorter tracers for pellets
            const endPos = shotData.origin.clone().add(
                pelletDirection.clone().multiplyScalar(shotData.range * 0.5)
            );
            this.effectsEngine.createTracer(shotData.origin, endPos, 0xffaa00);
        }
        
        return projectiles;
    }
    
    applyRecoil(camera) {
        const recoil = this.currentWeapon.recoil;
        
        // Apply vertical recoil
        camera.rotation.x -= recoil.vertical * (0.5 + Math.random() * 0.5);
        
        // Apply horizontal recoil
        camera.rotation.y += (Math.random() - 0.5) * recoil.horizontal * 2;
        
        // Clamp camera rotation
        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
        
        // Schedule recoil recovery
        setTimeout(() => {
            camera.rotation.x *= recoil.recovery;
            camera.rotation.y *= recoil.recovery;
        }, 50);
    }
    
    startReload() {
        if (this.isReloading || this.currentWeapon.currentAmmo >= this.currentWeapon.maxAmmo) {
            return false;
        }
        
        this.isReloading = true;
        this.audioEngine.play('weapon_reload');
        
        setTimeout(() => {
            this.currentWeapon.currentAmmo = this.currentWeapon.maxAmmo;
            this.isReloading = false;
        }, this.currentWeapon.reloadTime * 1000);
        
        return true;
    }
    
    updateProjectiles(projectiles, deltaTime, scene, collisionObjects) {
        const hits = [];
        
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const projectile = projectiles[i];
            
            // Update position
            const movement = projectile.velocity.clone().multiplyScalar(deltaTime);
            projectile.position.add(movement);
            projectile.distanceTraveled += movement.length();
            
            // Check range
            if (projectile.distanceTraveled >= projectile.range) {
                projectiles.splice(i, 1);
                continue;
            }
            
            // Check collisions
            const hit = this.checkProjectileCollision(projectile, collisionObjects);
            if (hit) {
                hits.push({
                    projectile: projectile,
                    hit: hit,
                    damage: this.calculateDamage(projectile, hit)
                });
                
                // Create impact effects
                this.createImpactEffects(hit.point, hit.normal, hit.material);
                
                // Remove projectile unless it penetrates
                if (!this.shouldPenetrate(projectile, hit)) {
                    projectiles.splice(i, 1);
                }
            }
        }
        
        return hits;
    }
    
    checkProjectileCollision(projectile, collisionObjects) {
        const raycaster = new THREE.Raycaster(
            projectile.position,
            projectile.velocity.clone().normalize(),
            0,
            projectile.velocity.length() * 0.016 // One frame of movement
        );
        
        const intersections = raycaster.intersectObjects(collisionObjects, true);
        
        if (intersections.length > 0) {
            const intersection = intersections[0];
            return {
                point: intersection.point,
                normal: intersection.face.normal,
                object: intersection.object,
                distance: intersection.distance,
                material: this.getMaterialType(intersection.object)
            };
        }
        
        return null;
    }
    
    getMaterialType(object) {
        // Determine material type based on object properties
        if (object.userData.material) {
            return object.userData.material;
        }
        
        // Default material detection based on object name/properties
        if (object.name.includes('water')) return 'water';
        if (object.name.includes('metal') || object.name.includes('boat')) return 'metal';
        if (object.name.includes('wood') || object.name.includes('tree')) return 'wood';
        if (object.name.includes('rock') || object.name.includes('island')) return 'stone';
        
        return 'generic';
    }
    
    createImpactEffects(position, normal, material) {
        // Play appropriate impact sound
        switch (material) {
            case 'metal':
                this.audioEngine.play('bullet_hit_metal');
                break;
            case 'wood':
                this.audioEngine.play('bullet_hit_wood');
                break;
            case 'water':
                this.audioEngine.play('bullet_hit_water');
                this.effectsEngine.createWaterSplash(position, 0.5);
                break;
            default:
                this.audioEngine.play('bullet_hit_generic', 0.7);
        }
        
        // Create spark/debris particles
        if (material !== 'water') {
            this.effectsEngine.createImpactSparks(position, normal, material);
        }
    }
    
    calculateDamage(projectile, hit) {
        let damage = projectile.damage;
        
        // Distance-based damage falloff
        const falloffStart = projectile.range * 0.3;
        if (projectile.distanceTraveled > falloffStart) {
            const falloffFactor = 1 - ((projectile.distanceTraveled - falloffStart) / (projectile.range - falloffStart));
            damage *= Math.max(0.2, falloffFactor);
        }
        
        // Material-based damage modification
        switch (hit.material) {
            case 'metal':
                damage *= 0.8; // Reduced damage on metal
                break;
            case 'water':
                damage *= 0.6; // Water resistance
                break;
        }
        
        return Math.round(damage);
    }
    
    shouldPenetrate(projectile, hit) {
        const penetrationChance = projectile.penetration;
        const materialResistance = this.getMaterialResistance(hit.material);
        
        return Math.random() < (penetrationChance - materialResistance);
    }
    
    getMaterialResistance(material) {
        switch (material) {
            case 'metal': return 0.8;
            case 'stone': return 0.9;
            case 'wood': return 0.3;
            case 'water': return 0.1;
            default: return 0.5;
        }
    }
    
    getWeaponInfo() {
        if (!this.currentWeapon) return null;
        
        return {
            name: this.currentWeapon.name,
            ammo: this.currentWeapon.currentAmmo,
            maxAmmo: this.currentWeapon.maxAmmo,
            isReloading: this.isReloading,
            damage: this.currentWeapon.damage,
            fireRate: this.currentWeapon.fireRate,
            accuracy: this.currentWeapon.accuracy
        };
    }
    
    getAllWeapons() {
        const weaponList = [];
        for (const [key, weapon] of this.weapons) {
            weaponList.push({
                id: key,
                name: weapon.name,
                type: weapon.type,
                damage: weapon.damage,
                fireRate: weapon.fireRate,
                maxAmmo: weapon.maxAmmo,
                range: weapon.range
            });
        }
        return weaponList;
    }
}