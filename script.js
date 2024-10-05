const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
document.body.appendChild(renderer.domElement);

const planetData = [
    { name: "Mercury", radius: 1.5, distance: 30, orbitalPeriod: 0.24, color: 0x8c7c6d, texture: 'images/mercury.png' },
    { name: "Venus", radius: 2, distance: 45, orbitalPeriod: 0.62, color: 0xffd700, texture: 'images/venus.png' },
    { name: "Earth", radius: 2, distance: 60, orbitalPeriod: 1, color: 0x6b93d6, texture: 'images/earth.png' },
    { name: "Mars", radius: 1.8, distance: 75, orbitalPeriod: 1.88, color: 0xc1440e, texture: 'images/mars.png' },
    { name: "Jupiter", radius: 4, distance: 100, orbitalPeriod: 2.5, color: 0xd8ca9d, texture: 'images/jupiter.png' },
    { name: "Saturn", radius: 3.5, distance: 125, orbitalPeriod: 3, color: 0xead6b8, texture: 'images/saturn.png' },
    { name: "Uranus", radius: 3, distance: 150, orbitalPeriod: 3.5, color: 0xc8e4e4, texture: 'images/uranus.png' },
    { name: "Neptune", radius: 3, distance: 175, orbitalPeriod: 4, color: 0x3d5ef5, texture: 'images/neptune.png' }
];

const textureLoader = new THREE.TextureLoader();
const sunGeometry = new THREE.SphereGeometry(10, 32, 32);
const sunTexture = textureLoader.load('images/sun.png');
const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

const celestialObjects = [];
const objectOrbits = [];
const labels = [];

function createCelestialObject(data) {
    const geometry = new THREE.SphereGeometry(data.radius, 32, 32);
    const material = new THREE.MeshPhongMaterial({
        color: data.color,
        specular: 0x333333,
        shininess: 5,
        map: textureLoader.load(data.texture)
    });
    const mesh = new THREE.Mesh(geometry, material);
    
    const orbitRadius = data.distance;
    const orbit = new THREE.Object3D();
    orbit.add(mesh);
    mesh.position.x = orbitRadius;

    scene.add(orbit);
    celestialObjects.push(mesh);
    objectOrbits.push(orbit);

    const orbitGeometry = new THREE.RingGeometry(orbitRadius - 0.1, orbitRadius + 0.1, 128);
    const orbitMaterial = new THREE.MeshBasicMaterial({ color: data.color, side: THREE.DoubleSide, transparent: true, opacity: 0.3 });
    const orbitLine = new THREE.Mesh(orbitGeometry, orbitMaterial);
    orbitLine.rotation.x = Math.PI / 2;
    scene.add(orbitLine);

    // Create label
    const label = document.createElement('div');
    label.className = 'label';
    label.innerText = data.name;
    document.body.appendChild(label);
    labels.push(label);

    return { mesh, orbit, orbitLine, label };
}

planetData.forEach(createCelestialObject);

const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 2, 300);
scene.add(pointLight);

camera.position.set(0, 100, 200);
camera.lookAt(scene.position);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let simulationSpeed = 1;
let time = 0;
let cameraMode = 'orbit';
let followedObject = null;

function animate() {
    requestAnimationFrame(animate);

    time += 0.005 * simulationSpeed;

    objectOrbits.forEach((orbit, index) => {
        const objectData = planetData[index];
        orbit.rotation.y = time / objectData.orbitalPeriod;
        celestialObjects[index].rotation.y += 0.01 * simulationSpeed;

        // Update label position
        const label = labels[index];
        const labelPosition = celestialObjects[index].getWorldPosition(new THREE.Vector3());
        label.style.left = `${labelPosition.x + window.innerWidth / 2}px`;
        label.style.top = `${-labelPosition.y + window.innerHeight / 2}px`;
        label.style.opacity = 1; // Show label
    });

    if (cameraMode === 'orbit') {
        camera.position.x = Math.sin(time * 0.1) * 200;
        camera.position.z = Math.cos(time * 0.1) * 200;
        camera.position.y = Math.sin(time * 0.05) * 50 + 50;
        camera.lookAt(scene.position);
    } else if (cameraMode === 'top') {
        camera.position.set(0, 250, 0);
        camera.lookAt(scene.position);
    } else if (cameraMode === 'follow' && followedObject) {
        const objectWorldPosition = new THREE.Vector3();
        followedObject.getWorldPosition(objectWorldPosition);
        camera.position.set(
            objectWorldPosition.x + 10,
            objectWorldPosition.y + 5,
            objectWorldPosition.z + 10
        );
        camera.lookAt(objectWorldPosition);
    }

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(celestialObjects);

    if (intersects.length > 0) {
        const objectIndex = celestialObjects.indexOf(intersects[0].object);
        const objectData = planetData[objectIndex];

        // Show detailed information
        document.getElementById('info').innerHTML = `
            <h2>${objectData.name}</h2>
            <p>Radius: ${objectData.radius.toFixed(1)} units</p>
            <p>Distance from Sun: ${objectData.distance} units</p>
            <p>Orbital Period: ${objectData.orbitalPeriod.toFixed(2)} Earth years</p>
        `;
        
        // Keep the label for the hovered object visible
        labels.forEach((label, index) => {
            label.style.opacity = (index === objectIndex) ? 1 : 0; // Show only the hovered label
        });
    } else {
        document.getElementById('info').innerHTML = '<h2>Wanna See Info?</h2><p>Hover over an object to see information</p>';
        
        // Hide all labels when not hovering
        labels.forEach(label => label.style.opacity = 0);
    }

    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

document.addEventListener('mousemove', onMouseMove, false);

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

const speedControl = document.getElementById('speed');
const speedValue = document.getElementById('speedValue');

speedControl.addEventListener('input', function() {
    simulationSpeed = parseFloat(this.value);
    speedValue.textContent = simulationSpeed.toFixed(1) + 'x';
});

const cameraModeControl = document.getElementById('cameraMode');
cameraModeControl.addEventListener('change', function() {
    cameraMode = this.value;
    document.getElementById('objectSelector').style.display = cameraMode === 'follow' ? 'block' : 'none';
});

const showOrbitsControl = document.getElementById('showOrbits');
showOrbitsControl.addEventListener('change', function() {
    objectOrbits.forEach((orbit, index) => {
        orbit.children[1].visible = this.checked;
    });
});

const followObjectSelect = document.getElementById('followObject');
planetData.forEach((object, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = object.name;
    followObjectSelect.appendChild(option);
});

followObjectSelect.addEventListener('change', function() {
    const selectedIndex = parseInt(this.value);
    followedObject = celestialObjects[selectedIndex];
});

document.getElementById('objectSelector').style.display = 'none';