class BoatBattleFPS {
    constructor() {
        this.socket = io();
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.clock = new THREE.Clock();
        
        this.playerId = null;
        this.players = new Map();
        this.boats = new Map();
        this.bullets = new Map();
        this.islands = [];
        
        this.keys = {};
        this.mouse = { x: 0, y: 0 };
        this.isPointerLocked = false;
        
        this.playerData = {
            health: 100,
            boatHealth: 100,
            score: 0,
            position: { x: 0, y: 10, z: 0 },
            rotation: { x: 0, y: 0 },
            velocity: { x: 0, z: 0 }
        };
        
        this.boat = null;
        this.water = null;
        
        this.init();
        this.setupEventListeners();
        this.setupSocketEvents();
        this.animate();
    }
    
    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setClearColor(0x87CEEB);
        document.getElementById('gameContainer').appendChild(this.renderer.domElement);
        
        this.scene.fog = new THREE.Fog(0x87CEEB, 100, 1500);
        
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(500, 500, 500);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        this.createWater();
        this.createPlayerBoat();
    }
    
    createWater() {
        const waterGeometry = new THREE.PlaneGeometry(4000, 4000, 100, 100);
        const waterMaterial = new THREE.MeshLambertMaterial({
            color: 0x006994,
            transparent: true,
            opacity: 0.8
        });
        
        this.water = new THREE.Mesh(waterGeometry, waterMaterial);
        this.water.rotation.x = -Math.PI / 2;
        this.water.position.y = 0;
        this.scene.add(this.water);
    }
    
    createPlayerBoat() {
        const boatGroup = new THREE.Group();
        
        const hullGeometry = new THREE.BoxGeometry(8, 2, 20);
        const hullMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const hull = new THREE.Mesh(hullGeometry, hullMaterial);
        hull.position.y = 1;
        hull.castShadow = true;
        boatGroup.add(hull);
        
        const mastGeometry = new THREE.CylinderGeometry(0.2, 0.2, 15);
        const mastMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        const mast = new THREE.Mesh(mastGeometry, mastMaterial);
        mast.position.set(0, 8.5, -5);
        mast.castShadow = true;
        boatGroup.add(mast);
        
        this.boat = boatGroup;
        this.scene.add(this.boat);
        
        this.camera.position.set(0, 12, 5);
        this.boat.add(this.camera);
    }
    
    createOtherPlayerBoat(playerId) {
        const boatGroup = new THREE.Group();
        
        const hullGeometry = new THREE.BoxGeometry(8, 2, 20);
        const hullMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6B6B });
        const hull = new THREE.Mesh(hullGeometry, hullMaterial);
        hull.position.y = 1;
        hull.castShadow = true;
        boatGroup.add(hull);
        
        const mastGeometry = new THREE.CylinderGeometry(0.2, 0.2, 15);
        const mastMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        const mast = new THREE.Mesh(mastGeometry, mastMaterial);
        mast.position.set(0, 8.5, -5);
        mast.castShadow = true;
        boatGroup.add(mast);
        
        const nameSprite = this.createPlayerNameSprite(playerId);
        nameSprite.position.set(0, 20, 0);
        boatGroup.add(nameSprite);
        
        this.boats.set(playerId, boatGroup);
        this.scene.add(boatGroup);
        
        return boatGroup;
    }
    
    createPlayerNameSprite(playerId) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.fillStyle = 'white';
        context.font = '24px Arial';
        context.textAlign = 'center';
        context.fillText(playerId.substring(0, 8), canvas.width / 2, canvas.height / 2 + 8);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(20, 5, 1);
        
        return sprite;
    }
    
    createIsland(islandData) {
        const islandGroup = new THREE.Group();
        
        const geometry = new THREE.CylinderGeometry(islandData.radius, islandData.radius, islandData.height, 16);
        const material = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        const island = new THREE.Mesh(geometry, material);
        
        island.position.set(islandData.x, islandData.height / 2, islandData.z);
        island.castShadow = true;
        island.receiveShadow = true;
        
        for (let i = 0; i < 10; i++) {
            const treeGeometry = new THREE.CylinderGeometry(1, 1, 8);
            const treeMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
            const tree = new THREE.Mesh(treeGeometry, treeMaterial);
            
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * (islandData.radius - 5);
            tree.position.set(
                islandData.x + Math.cos(angle) * distance,
                islandData.height + 4,
                islandData.z + Math.sin(angle) * distance
            );
            tree.castShadow = true;
            islandGroup.add(tree);
        }
        
        islandGroup.add(island);
        this.scene.add(islandGroup);
        
        return islandGroup;
    }
    
    createBullet() {
        const geometry = new THREE.SphereGeometry(0.2, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
        return new THREE.Mesh(geometry, material);
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
        });
        
        document.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
        });
        
        document.addEventListener('click', () => {
            if (!this.isPointerLocked) {
                this.renderer.domElement.requestPointerLock();
            } else {
                this.shoot();
            }
        });
        
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === this.renderer.domElement;
        });
        
        document.addEventListener('mousemove', (event) => {
            if (this.isPointerLocked) {
                this.mouse.x += event.movementX * 0.002;
                this.mouse.y -= event.movementY * 0.002;
                this.mouse.y = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.mouse.y));
            }
        });
        
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    setupSocketEvents() {
        this.socket.on('gameInit', (data) => {
            this.playerId = data.playerId;
            
            data.gameState.islands.forEach(island => {
                this.islands.push(this.createIsland(island));
            });
            
            data.gameState.players.forEach(player => {
                if (player.id !== this.playerId) {
                    this.players.set(player.id, player);
                    this.createOtherPlayerBoat(player.id);
                }
            });
            
            this.updatePlayerCount();
        });
        
        this.socket.on('playerJoined', (data) => {
            this.players.set(data.player.id, data.player);
            this.createOtherPlayerBoat(data.player.id);
            this.updatePlayerCount();
        });
        
        this.socket.on('playerLeft', (playerId) => {
            this.players.delete(playerId);
            const boat = this.boats.get(playerId);
            if (boat) {
                this.scene.remove(boat);
                this.boats.delete(playerId);
            }
            this.updatePlayerCount();
        });
        
        this.socket.on('playerMoved', (data) => {
            const boat = this.boats.get(data.id);
            if (boat) {
                boat.position.set(data.x, 2, data.z);
                boat.rotation.y = data.rotation;
            }
        });
        
        this.socket.on('bulletFired', (bullet) => {
            if (bullet.playerId !== this.playerId) {
                const bulletMesh = this.createBullet();
                bulletMesh.position.set(bullet.x, bullet.y, bullet.z);
                this.bullets.set(bullet.id, bulletMesh);
                this.scene.add(bulletMesh);
            }
        });
        
        this.socket.on('bulletsUpdate', (bullets) => {
            bullets.forEach(bullet => {
                const bulletMesh = this.bullets.get(bullet.id);
                if (bulletMesh && bullet.playerId !== this.playerId) {
                    bulletMesh.position.set(bullet.x, bullet.y, bullet.z);
                }
            });
        });
        
        this.socket.on('bulletExpired', (bulletId) => {
            const bulletMesh = this.bullets.get(bulletId);
            if (bulletMesh) {
                this.scene.remove(bulletMesh);
                this.bullets.delete(bulletId);
            }
        });
        
        this.socket.on('playerDamaged', (data) => {
            if (data.playerId === this.playerId) {
                this.playerData.health = data.health;
                this.playerData.boatHealth = data.boatHealth;
                this.updateUI();
            }
        });
        
        this.socket.on('playerKilled', (data) => {
            if (data.victim === this.playerId) {
                this.playerData.health = 100;
                this.playerData.boatHealth = 100;
                this.boat.position.set(data.newPosition.x, 2, data.newPosition.z);
                this.updateUI();
            }
            
            if (data.killer === this.playerId) {
                this.playerData.score += 1;
                this.updateUI();
            }
        });
    }
    
    updateMovement() {
        const speed = 0.5;
        const rotationSpeed = 0.03;
        
        if (this.keys['KeyW']) this.playerData.velocity.z -= speed;
        if (this.keys['KeyS']) this.playerData.velocity.z += speed;
        if (this.keys['KeyA']) this.playerData.velocity.x -= speed;
        if (this.keys['KeyD']) this.playerData.velocity.x += speed;
        
        this.playerData.velocity.x *= 0.9;
        this.playerData.velocity.z *= 0.9;
        
        this.boat.position.x += this.playerData.velocity.x;
        this.boat.position.z += this.playerData.velocity.z;
        
        this.boat.rotation.y = this.mouse.x;
        this.camera.rotation.x = this.mouse.y;
        
        this.socket.emit('playerMove', {
            x: this.boat.position.x,
            z: this.boat.position.z,
            rotation: this.boat.rotation.y,
            playerRotation: this.mouse.x,
            velocity: this.playerData.velocity
        });
    }
    
    shoot() {
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.camera.quaternion);
        
        const bulletData = {
            x: this.camera.getWorldPosition(new THREE.Vector3()).x,
            y: this.camera.getWorldPosition(new THREE.Vector3()).y,
            z: this.camera.getWorldPosition(new THREE.Vector3()).z,
            direction: {
                x: direction.x,
                y: direction.y,
                z: direction.z
            }
        };
        
        this.socket.emit('playerShoot', bulletData);
    }
    
    updateUI() {
        document.getElementById('health').textContent = this.playerData.health;
        document.getElementById('boatHealth').textContent = this.playerData.boatHealth;
        document.getElementById('score').textContent = this.playerData.score;
    }
    
    updatePlayerCount() {
        document.getElementById('playerCount').textContent = this.players.size + 1;
        
        const playersDiv = document.getElementById('players');
        playersDiv.innerHTML = '';
        
        this.players.forEach((player, id) => {
            const playerDiv = document.createElement('div');
            playerDiv.textContent = `${id.substring(0, 8)} - Score: ${player.score}`;
            playersDiv.appendChild(playerDiv);
        });
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.isPointerLocked) {
            this.updateMovement();
        }
        
        if (this.water) {
            this.water.material.opacity = 0.8 + Math.sin(Date.now() * 0.001) * 0.1;
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

const game = new BoatBattleFPS();