// CANVAS VARIABLES
var container = document.querySelector('#sketch');
var wid = window.innerWidth;
var hei = window.innerHeight;

// INITIALIZATION
var scene  = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(40, wid/hei, 0.1, 6000);
var renderer = new THREE.WebGLRenderer();
renderer.setSize(wid, hei);
camera.position.set(0, 350, 0);
camera.rotation.set(0, -1.385, 0);
container.appendChild(renderer.domElement);

// VR
renderer.vr.enabled = true;

var controls = new THREE.VRControls( camera );
controls.update();

navigator.getVRDisplays().then(displays => {
  // Filter down to devices that can present.
  displays = displays.filter(display => display.capabilities.canPresent);

  // If there are no devices available, quit out.
  if (displays.length === 0) {
    console.warn('No devices available able to present.');
    return;
  }

  // Store the first display we find. A more production-ready version should
  // allow the user to choose from their available displays.
  this._vr.display = displays[0];
  this._vr.display.depthNear = DemoVR.CAMERA_SETTINGS.near;
  this._vr.display.depthFar = DemoVR.CAMERA_SETTINGS.far;
});


// RESIZE EVENT!
window.addEventListener( 'resize', onWindowResize, false );
function onWindowResize(){
	wid = document.body.clientWidth;
	camera.aspect = wid/hei;
  camera.updateProjectionMatrix();
  renderer.setSize(wid, hei);
}

document.body.appendChild( WEBVR.getButton( renderer ) );

// set AudioContext to Tone.js
// THREE.setContext(Tone.context);


// LIGHT
var light = new THREE.PointLight( 0xffffff, 1, 6000, 2 );
light.position.set(1000, 400, 300);
scene.add(light);


// SKYDOME
// https://www.eso.org/public/usa/images/eso0932a/
let skyGeo = new THREE.SphereGeometry(2000, 25, 25);
var loader = new THREE.TextureLoader();
// let skyTexture = loader.load("eso0932a_sphere.jpg");
let skyMat = new THREE.MeshPhongMaterial({
	map: loader.load("../media/eso0932a_sphere.jpg"),
});
var skyDome = new THREE.Mesh(skyGeo, skyMat);
skyDome.material.side = THREE.BackSide;
scene.add(skyDome);


// PARTICLES
let part_num = 1000;
var particles;

function createParticles(){
	// create geometry
	let part_geo = new THREE.Geometry();
	// add the vertices
	for (let i = 0; i < part_num; i++) {
		let theta = Math.random() *2*Math.PI;
		let radio = Math.random()*1900;
		let posX = radio *Math.sin(theta);
		let posZ = radio *Math.cos(theta);
		let posY = Math.random()*550;

		part_geo.vertices.push( new THREE.Vector3(posX, posY, posZ) );
	}
	// create material
	let part_mat = new THREE.PointsMaterial({
		color: 0xdd99ff,
		size: 20,
		map: loader.load("../media/particle_img.png"),
		transparent: true,
		blending: THREE.AdditiveBlending,
	});
	// create particle system!
	particles = new THREE.Points(part_geo, part_mat);

	scene.add(particles);
}


// SURFACE
var soundSurf;
let zpread = 800;

function createSurface(){
	// create material
	let sound_mat = new THREE.MeshPhongMaterial({
		color: "hsl(270, 80%, 35%)",
		emissive: "hsl(270, 50%, 1%)",
		specular: "hsl(0, 80%, 80%)",
		// flatShading: true,
		// wireframe: true
	});
	sound_mat.side = THREE.DoubleSide;

	// initialize geometry + sound surface!
	let sound_geo = new THREE.Geometry();
	soundSurf = new THREE.Mesh(sound_geo, sound_mat);
	soundSurf.position.x = 1500;
	soundSurf.position.y = -500;

	// create vertices
	for (let i = 0; i < 2; i++) {
		for (let j = 0; j < fft_dim; j++) {
			let posX = 10 * (i-1);
			let posY = 0;
			let posZ = (j/fft_dim)*zpread -zpread/2;

			sound_geo.vertices.push( new THREE.Vector3(posX, posY, posZ) );
		}
	}

	createFaces();
	soundSurf.geometry.computeVertexNormals();
	soundSurf.geometry.computeFaceNormals();

	scene.add(soundSurf);
}

// create face for the last row of vertices added
function createFaces(){
	let baseIndex = soundSurf.geometry.vertices.length - (2*fft_dim);

	for (let i = 0; i < fft_dim-1; i++) {
		let pointA = baseIndex + i;
		let pointB = baseIndex + i +1;
		let pointC = baseIndex + i +fft_dim;
		let pointD = baseIndex + i +fft_dim +1;

		let newFaceA = new THREE.Face3( pointA, pointB, pointC );
		let newFaceB = new THREE.Face3( pointB, pointD, pointC );

		soundSurf.geometry.faces.push( newFaceA );
		soundSurf.geometry.faces.push( newFaceB );
	}
}

function displaceSurface(){
	soundSurf.position.x -= disp;
}



/*
 * === MUSIC ===
 */

// ANALYSIS (+function) & POINTS
let fft_dim = 64;
let fft = new Tone.FFT(fft_dim);
let disp = 4;

function drawFFT(){
	// only act and draw if it's playing
	if (playing) {
		let values = fft.getValue();
		let curr_len = soundSurf.geometry.vertices.length;

		// if there are points already, displace them!
		if (curr_len > 0) {
			displaceSurface();
		}

		// do nothing if the fft value is too low!
		let maxVal = maxFromArray(values);
		if (maxVal <= -200) { } // if the value is too low, don't do anything
		else {  // create the new points
			for (let i = 0; i < fft_dim; i++) {
				let maxX = soundSurf.geometry.vertices[curr_len-1].x;
				let posX = maxX + disp;
				let posY = (values[i] +200)*2;
				let posZ = (i/fft_dim)*zpread -zpread/2;
				soundSurf.geometry.vertices.push( new THREE.Vector3(posX, posY, posZ) );
			}

			// create faces and compute normals
			createFaces();
			soundSurf.geometry.computeVertexNormals();
			soundSurf.geometry.computeFaceNormals();
			soundSurf.geometry.verticesNeedUpdate = true;
			soundSurf.geometry.elementsNeedUpdate = true;
		}
	}
}

function maxFromArray(arr){
	let m = -1000;
	for (var i = 0; i < arr.length; i++) {
		if (arr[i] > m){
			m = arr[i];
		}
	}
	return m;
}



// PLAYER + button
/* set main Buffer callback function */
Tone.Buffer.on('load', loadPlayButton);
/* create the button */
var playing = false;
var play_button = document.createElement("INPUT");
play_button.setAttribute("type", "button");
play_button.value = "Play";
play_button.disabled = true;
document.querySelector("#controls").appendChild(play_button);
/* create the player */
var player = new Tone.Player({
	// 'url':'../media/apocalypsisaquarius.mp3'
	'url':'../media/hellfire.mp3'
});
player.fan(fft).toMaster();
player.autostart = false;

// EVENT FUNCTIONS
function loadPlayButton() {
	// enable the button
	play_button.disabled = false;
	console.log("audio ready");
}

play_button.addEventListener("click", function() {
	if(playing){
		// stop the player
		player.stop();
		play_button.value = "Play";
	} else {
		player.start();
		play_button.value = "Stop";
	}
	playing = !playing;
});


/*
 * == ANIMATION ==
 */

// initialize graphics
createParticles();
createSurface();

// interval function : call drawFFT
window.setInterval(drawFFT, 50);

function update(){
	renderer.animate(animate);
}
function animate() {
	// requestAnimationFrame(animate);  // <- NOT ANYMORE!!
	controls.update();
	renderer.render(scene, camera);
}
update();
