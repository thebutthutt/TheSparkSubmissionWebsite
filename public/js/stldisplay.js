import * as THREE from '/three/build/three.module.js';
import {
    OrbitControls
} from '/three/examples/jsm/controls/OrbitControls.js';
import {
    STLLoader
} from '/three/examples/jsm/loaders/STLLoader.js';

function STLViewer(model, elementID) {
    var elem = document.getElementById(elementID);

    var camera = new THREE.PerspectiveCamera(70,
        elem.clientWidth / elem.clientHeight, 1, 1000);

    var renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });

    var onProgress = function (xhr) {
        if (xhr.lengthComputable) {
            var percentComplete = xhr.loaded / xhr.total * 100;
            $(".progress-bar").attr('aria-valuenow', Math.round(percentComplete, 2));
            $(".progress-bar").attr('style', "width: " + Math.round(percentComplete, 2) + "%");
        }
    };

    renderer.setSize(elem.clientWidth, elem.clientHeight);
    elem.appendChild(renderer.domElement);

    window.addEventListener('resize', function () {
        renderer.setSize(elem.clientWidth, elem.clientHeight);
        camera.aspect = elem.clientWidth / elem.clientHeight;
        camera.updateProjectionMatrix();
    }, false);

    var controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.rotateSpeed = 2;
    controls.dampingFactor = 0.1;
    controls.enableZoom = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2;

    var scene = new THREE.Scene();

    const planeSize = 229;

    const loader = new THREE.TextureLoader();
    const texture = loader.load('/public/checker.png');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    const repeats = planeSize / 20;
    texture.repeat.set(repeats, repeats);

    const planeGeo = new THREE.PlaneBufferGeometry(planeSize, planeSize);
    const planeMat = new THREE.MeshPhongMaterial({
        map: texture,
        side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(planeGeo, planeMat);
    mesh.rotation.x = Math.PI * -.5;
    scene.add(mesh);

    scene.add(new THREE.HemisphereLight(0xffffff, 1.5));

    (new STLLoader()).load(model, function (geometry) {
        var material = new THREE.MeshPhongMaterial({
            color: 0x33ccff,
            specular: 100,
            shininess: 100
        });
        var mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;
        scene.add(mesh);

        var middle = new THREE.Vector3();
        geometry.computeBoundingBox();

        var size = new THREE.Vector3;
        geometry.boundingBox.getSize(size);

        geometry.boundingBox.getCenter(middle);
        mesh.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(
            -middle.x, -middle.y, 0));

        camera.position.z = 120;
        camera.position.y = 250;

        var animate = function () {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };

        animate();

    }, onProgress);
}

$(document).ready(function () {
    var relativePath = $("#model").attr('filename').split('app').pop();
    STLViewer(relativePath, "model");
});