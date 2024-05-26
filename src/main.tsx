import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

import './index.css'



ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// import * as THREE from 'three';

// const scene = new THREE.Scene();
// const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// const renderer = new THREE.WebGLRenderer();
// renderer.setSize(window.innerWidth, window.innerHeight);
// document.body.appendChild(renderer.domElement);

// // const geometry = new THREE.CircleGeometry(1, 20, 1);

// const geometry = new THREE.BoxGeometry(1, 1, 1);
// const material = new THREE.MeshStandardMaterial({ color: 0xffffff, });
// const light = new THREE.PointLight(0xffffff, 10);
// const cube1 = new THREE.Mesh(geometry, material);
// const cube2 = new THREE.Mesh(geometry, material);
// scene.add(cube1);
// scene.add(cube2);
// scene.add(light);

// camera.position.z = 8;
// light.position.set(4, 3, 5);


// let elapsedTime = 0;
// let lastTime = 0;

// const velocity1 = new THREE.Vector3(0, 0, 0);
// const position1 = cube1.position.clone();
// const initialPosition2 = new THREE.Vector3(3, 0, 0);
// const initialVelocity2 = new THREE.Vector3(0, 0, 0);
// // const initialVelocity2 = new THREE.Vector3(5, 3, 0);
// const velocity2 = initialVelocity2.clone();
// const position2 = initialPosition2.clone();

// const d = 3;

// let cursorX = 0, cursorY = 0;
// window.addEventListener('mousemove', (event) => {
//   cursorX = event.clientX;
//   cursorY = event.clientY;
// });



// window.addEventListener('keydown', (event) => {
//   if (event.key === 'R') {
//     velocity1.set(0, 0, 0);
//     position1.set(0, 0, 0);

//     velocity2.set(initialVelocity2.x, initialVelocity2.y, initialVelocity2.z);
//     position2.set(initialPosition2.x, initialPosition2.y, initialPosition2.z);
//   }
// })

// function animate() {
//   requestAnimationFrame(animate);
//   renderer.render(scene, camera);

//   elapsedTime = performance.now() - lastTime;
//   if (elapsedTime > 1000 / 180) {
//     physicsLoop(elapsedTime);
//     lastTime = performance.now();
//     elapsedTime = 0;
//   }

// }
// animate();

// function physicsLoop(delta: number) {
//   delta /= 1000;
//   console.log('hi')
//   const gravity = new THREE.Vector3(0, 0, 0);
//   // const gravity = new THREE.Vector3(0, 0, 0);

//   const raycaster = new THREE.Raycaster();
//   raycaster.setFromCamera(new THREE.Vector2(cursorX / window.innerWidth * 2 - 1, -cursorY / window.innerHeight * 2 + 1), camera);
//   function calculateDragForce(position: THREE.Vector3) {
//     const k = 10;
//     const tmp = new THREE.Vector3();
//     camera.getWorldDirection(tmp);
//     tmp.normalize();
//     const projectionDistance = position.clone().sub(camera.position).dot(tmp);
//     const dir = raycaster.ray.direction.clone();
//     const t = projectionDistance / dir.dot(tmp);
//     dir.multiplyScalar(t);
//     const mousePoint = raycaster.ray.origin.clone().add(dir);

//     console.log(Math.pow(delta, 2))
//     const fac = Math.pow(position1.clone().sub(mousePoint).length(), 1);
//     return mousePoint.clone().sub(position).multiplyScalar(k * fac);
//   }

//   const force1 = gravity.clone() // .add(calculateDragForce(position1)).multiplyScalar(delta);
//   const force2 = gravity.clone()//.add(calculateDragForce(position2)).multiplyScalar(delta);

//   const m1 = Infinity;
//   const m2 = 1;
//   gravity.multiplyScalar(delta);

//   velocity1.add(force1.multiplyScalar(1 / m1));
//   velocity2.add(force2.multiplyScalar(1 / m2));


//   // constraint: |x1 - x2| - d = sqrt((x1 - x2)^2) - d = 0
//   // dC/dx1 = (x1-x2)/|x1-x2|
//   // dC/dx2 = (x2-x1)/|x1-x2|

//   const prevPosition1 = position1.clone();
//   const prevPosition2 = position2.clone();

//   position1.add(velocity1.clone().multiplyScalar(delta));
//   position2.add(velocity2.clone().multiplyScalar(delta));

//   // solve constraints
//   // * C = |x1 - x2| - d = 0
//   const C = position1.clone().sub(position2).length() - d;
//   const C1 = position1.clone().sub(position2).normalize();
//   const C2 = position2.clone().sub(position1).normalize();
//   const s = C / (Math.pow(C1.length(), 2) / m1 + Math.pow(C2.length(), 2) / m2);

//   position1.sub(C1.clone().multiplyScalar(s / m1));
//   position2.sub(C2.clone().multiplyScalar(s / m2));

//   velocity1.set(position1.x - prevPosition1.x, position1.y - prevPosition1.y, position1.z - prevPosition1.z);
//   velocity1.multiplyScalar(1 / delta);
//   velocity2.set(position2.x - prevPosition2.x, position2.y - prevPosition2.y, position2.z - prevPosition2.z);
//   velocity2.multiplyScalar(1 / delta);

//   cube1.position.set(position1.x, position1.y, position1.z);
//   cube2.position.set(position2.x, position2.y, position2.z);
// }



