import './style.css';
import * as THREE from 'three';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import vertexShader from './shaders/vertex.glsl?raw';
import fragmentShader from './shaders/fragment.glsl?raw';
import simplexNoise4d from './shaders/simplexNoise4d.glsl?raw';
import textVertex from './shaders/textVertex.glsl?raw';
import { Text } from "troika-three-text";
import gsap from 'gsap/all';

// Setup loading manager
const loadingManager = new THREE.LoadingManager();
loadingManager.onStart = function (url, itemsLoaded, itemsTotal) {
    console.log('Started loading: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');
};
loadingManager.onLoad = function () {
    console.log('Loading complete!');
};
loadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
    console.log('Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');
};
loadingManager.onError = function (url) {
    console.log('There was an error loading ' + url);
};


const blobs = [
    {
        name: "Gentle Ripples",
        background: "#9D73F7",
        config: {
            uPositionFrequency: 0.8,
            uPositionStrength: 1.2,
            uSmallWavePositionFrequency: 1.0,
            uSmallWavePositionStrength: 1.5,
            roughness: 0.4,
            metalness: 0.6,
            envMapIntensity: 1.2,
            clearcoat: 0.3,
            clearcoatRoughness: 0.3,
            transmission: 0.2,
            flatShading: false,
            wireframe: false,
            map: "pink-floyd",
        },
    },
    {
        name: "Wild Waves",
        background: "#5300B1",
        config: {
            uPositionFrequency: 2.9,
            uPositionStrength: 1.5,
            uSmallWavePositionFrequency: 1.0,
            uSmallWavePositionStrength: 1.5,
            roughness: 0.2,
            metalness: 0.8,
            envMapIntensity: 1.5,
            clearcoat: 0.7,
            clearcoatRoughness: 0.1,
            transmission: 0.12,
            flatShading: false,
            wireframe: false,
            map: "purple-rain",
        },
    },
    {
        name: "Tiny Bubbles",
        background: "#45ACD8",
        config: {
            uPositionFrequency: 2.0,
            uPositionStrength: 0.8,
            uSmallWavePositionFrequency: 2.5,
            uSmallWavePositionStrength: 0.7,
            roughness: 0.1,
            metalness: 0.9,
            envMapIntensity: 1.8,
            clearcoat: 0.9,
            clearcoatRoughness: 0.05,
            transmission: 0.3,
            flatShading: false,
            wireframe: false,
            map: "lucky-day",
        },
    },

];

let isAnimating = false;

let currentIndex = 0;

// Create scene, camera and renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color('#333');
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
});
renderer.debug.checkShaderErrors = true;
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
document.body.appendChild(renderer.domElement);

// Create orbit controls
// const controls = new OrbitControls(camera, renderer.domElement);
camera.position.z = 5;

// Load HDRI environment map
const rgbeLoader = new RGBELoader(loadingManager);
rgbeLoader.load(
    "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_08_1k.hdr",
    function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture;
        // scene.background = texture;
    }
);
const uniforms = {
    u_time: { value: 0 },
    uPositionFrequency: { value: blobs[currentIndex].config.uPositionFrequency },
    uPositionStrength: { value: blobs[currentIndex].config.uPositionStrength },
    uTimeFrequency: { value: 0.4 },
    uSmallWavePositionFrequency: { value: blobs[currentIndex].config.uSmallWavePositionFrequency },
    uSmallWaveTimeFrequency: { value: 0.9 },
    uSmallWavePositionStrength: { value: blobs[currentIndex].config.uSmallWavePositionStrength },
};

// Create shader material
const textureLoader = new THREE.TextureLoader(loadingManager);
const shaderMaterial = new CustomShaderMaterial({
    baseMaterial: THREE.MeshPhysicalMaterial,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: uniforms,
    map: textureLoader.load(`./gradients/${blobs[currentIndex].config.map}.png`),
    metalness: blobs[currentIndex].config.metalness,
    roughness: blobs[currentIndex].config.roughness,
    envMapIntensity: blobs[currentIndex].config.envMapIntensity,
    clearcoat: blobs[currentIndex].config.clearcoat,
    clearcoatRoughness: blobs[currentIndex].config.clearcoatRoughness,
    transmission: blobs[currentIndex].config.transmission,
    flatShading: blobs[currentIndex].config.flatShading,
    wireframe: blobs[currentIndex].config.wireframe,
    // wireframe: true,
});

const mergedGeometry = mergeVertices(new THREE.IcosahedronGeometry(1, 100));
mergedGeometry.computeTangents();

// Create sphere
const sphere = new THREE.Mesh(mergedGeometry, shaderMaterial);
scene.add(sphere);



const clock = new THREE.Clock();


const textMaterial = new THREE.ShaderMaterial({
    fragmentShader: `void main(){gl_FragColor = vec4(1.0);}`,
    vertexShader: textVertex,
    side: THREE.DoubleSide,
    uniforms: {
        progress: { value: 0.0 },
        direction: { value: 1 },
    },
});

const texts = blobs.map((blob, index) => {
    const myText = new Text();
    myText.text = blob.name;
    myText.font = `./aften_screen.woff`;
    myText.anchorX = 'center';
    myText.anchorY = 'middle';
    myText.material = textMaterial;
    myText.letterSpacing = -0.08;
    myText.fontSize = window.innerWidth / 1500;
    myText.color = blob.background;
    myText.position.set(0, 0, 2);
    if (index !== 0) {
        myText.scale.set(0, 0, 0);
        myText.position.x = -8; // Set initial position off-screen
    }
    myText.glyphGeometryDetail = 20;
    myText.sync();
    scene.add(myText);
    return myText;
})



window.addEventListener('wheel', (e) => {
    if (isAnimating) return;
    isAnimating = true;

    let direction = Math.sign(e.deltaY);
    let next = (currentIndex + direction + blobs.length) % blobs.length;

    // Hide current text
    gsap.to(texts[currentIndex].scale, {
        x: 0,
        y: 0,
        z: 0,
        duration: 1,
        ease: "power2.inOut"
    });

    // Show and position next text
    texts[next].scale.set(1, 1, 1);
    texts[next].position.x = direction * 8;

    gsap.to(textMaterial.uniforms.progress, {
        value: .5,
        duration: 2,
        ease: 'linear',
        onComplete: () => {
            currentIndex = next;
            isAnimating = false;
            textMaterial.uniforms.progress.value = 0;
        }
    })

    gsap.to(sphere.rotation, {
        y: sphere.rotation.y + Math.PI * 4 * -direction,
        duration: 1,
        ease: "power2.inOut",
    });

    gsap.to(texts[next].position, {
        x: 0,
        duration: 1,
        ease: "power2.inOut",
    })

    const bg = new THREE.Color(blobs[next].background);
    gsap.to(scene.background, {
        r: bg.r,
        g: bg.g,
        b: bg.b,
        duration: 1,
        ease: 'linear',
    });

    updateBlob(blobs[next].config);

    
})


function updateBlob(config) {
    if (config.uPositionFrequency) {
        gsap.to(uniforms.uPositionFrequency, {
            value: config.uPositionFrequency,
            duration: 1,
            ease: 'power2.inOut'
        });
    }
    if (config.uPositionStrength) {
        gsap.to(uniforms.uPositionStrength, {
            value: config.uPositionStrength,
            duration: 1,
            ease: 'power2.inOut'
        });
    }
    if (config.uTimeFrequency) {
        gsap.to(uniforms.uTimeFrequency, {
            value: config.uTimeFrequency,
            duration: 1,
            ease: 'power2.inOut'
        });
    }
    if (config.uSmallWavePositionFrequency) {
        gsap.to(uniforms.uSmallWavePositionFrequency, {
            value: config.uSmallWavePositionFrequency,
            duration: 1,
            ease: 'power2.inOut'
        });
    }
    if (config.uSmallWaveTimeFrequency) {
        gsap.to(uniforms.uSmallWaveTimeFrequency, {
            value: config.uSmallWaveTimeFrequency,
            duration: 1,
            ease: 'power2.inOut'
        });
    }
    if (config.uSmallWavePositionStrength) {
        gsap.to(uniforms.uSmallWavePositionStrength, {
            value: config.uSmallWavePositionStrength,
            duration: 1,
            ease: 'power2.inOut'
        });
    }
    if (config.map !== undefined) {
        setTimeout(() => {
            shaderMaterial.map = textureLoader.load(`./gradients/${config.map}.png`);
        }, 400);
    }
    if (config.metalness !== undefined) {
        gsap.to(material, {
            metalness: config.metalness,
            duration: 1,
            ease: 'power2.inOut'
        });
    }
    if (config.roughness !== undefined) {
        gsap.to(material, {
            roughness: config.roughness,
            duration: 1,
            ease: 'power2.inOut'
        });
    }
}


loadingManager.onLoad = () => {
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        uniforms.u_time.value = clock.getElapsedTime();
        // sphere.rotation.x += 0.01;
        // sphere.rotation.y += 0.01;
        renderer.render(scene, camera);
        // controls.update();
    }
    const bg = new THREE.Color(blobs[currentIndex].background);
    gsap.to(scene.background, { r: bg.r, g: bg.g, b: bg.b, duration: 1, ease: 'linear' });
    animate();

}


// Handle window resize
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
});
