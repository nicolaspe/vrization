/*
 *
 * VRLIZATION
 *
 */

// global threejs/VR variables
let clock;
let container;
let renderer;
let scene;
let camera;
let controls;
let loader;
let lastRenderTime;

let effect;
let vrDisplay;    // variable for the display
let vrButton;     // button to render in VR
let vrFrame;      // variable for VR frame data needed for display

// globar environment variables
let particles;
let soundSurf;
let zpread = 800;
let disp = 4;

// global tone variables
let fft_dim = 64;
let fft;
let player;
let playing = false;
let play_button;

window.addEventListener('load', onLoad);
// onLoad();
function onLoad(){
  clock = new THREE.Clock();
  container = document.querySelector('#sketch');
  let wid = window.innerWidth;
  let hei = window.innerHeight;

  // INITIALIZATION
  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(wid, hei);
  container.appendChild(renderer.domElement);
  effect = new THREE.VREffect(renderer);
  effect.setSize(window.innerWidth, window.innerHeight);
  scene  = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(40, wid/hei, 0.1, 1000);
  // camera.position.set(0, 350, 0);
  // camera.rotation.set(0, -1.385, 0);
  controls = new THREE.VRControls( camera );
  controls.standing = true;
  controls.update();
  camera.position.y = controls.userHeight;

  loader = new THREE.TextureLoader();

  // set AudioContext to Tone.js
  // THREE.setContext(Tone.context);

  // Initialize (Web)VR
  renderer.vr.enabled = true;
  setupVRStage();
  // vrButton = WEBVR.getButton( vrDisplay, renderer );
  // document.body.appendChild( vrButton );
  let vrui_options = {
    color: 'white',
    background: false,
    corners: 'round'
  };
  vrButton = new webvrui.EnterVRButton(renderer.domElement, vrui_options);
  vrButton.on("enter", function(){
    console.log("Enter VR");
  });
  vrButton.on("exit", function(){
    console.log("Exit VR");
    camera.quaternion.set(0, 0, 0, 1);
    camera.position.set(0, controls.userHeight, 0);
  });
  vrButton.on("hide", function(){
    document.getElementById('vr_bb').style.display = 'none';
  });
  vrButton.on("show", function(){
    document.getElementById('vr_bb').style.display = 'inherit';
  });
  document.getElementById('vr_bb').appendChild(vrButton.domElement);

  // EVENTS
  window.addEventListener('resize', onWindowResize, true );
  window.addEventListener('vrdisplaypresentchange', onWindowResize, true);
  window.setInterval(drawFFT, 50);

  // initialization
  createTone();
  createEnvironment();

  update();
}

// sets up the VR stage
function setupVRStage(){
  // get available displays
  navigator.getVRDisplays().then( function(displays){
    if(displays.length > 0) {
      vrDisplay = displays[0];
      // set parameters according to the stage
      if(vrDisplay.stageParameters) {
        setStageDimensions(vrDisplay.stageParameters);
      }
      vrDisplay.requestAnimationFrame(animate);
    }
  });
}
// rearrange the scene according to the stage
// (does nothing for now)
function setStageDimensions(stage){
  ;
}

function update(){
	renderer.animate(animate);
}
function animate(timestamp) {
  let delta = Math.min(timestamp - lastRenderTime, 500);
  lastRenderTime = timestamp;

  if(vrDisplay.isPresenting){
    controls.update();

    effect.render(scene, camera);
    vrDisplay.requestAnimationFrame(animate);
  } else {
    controls.update();

    renderer.render(scene, camera);
    window.requestAnimationFrame(animate);
  }

	// renderer.render(scene, camera);
  // requestAnimationFrame(animate);  // <- NOT ANYMORE!!
}
// update();

/*
 * === EVENTS ===
 */
function onWindowResize(){
  let wid = window.innerWidth;
  let hei = window.innerHeight;
  effect.setSize(wid, hei);
	camera.aspect = wid/hei;
  camera.updateProjectionMatrix();
  renderer.setSize(wid, hei);
}
function loadPlayButton() {
	// enable the button
	play_button.disabled = false;
	console.log("Audio ready");
}


/*
 * === ENVIRONMENT CREATION ===
 */
// create graphic objects
function createEnvironment(){
  createLight();
  createDome();
  createParticles(20);
}
// create lights
function createLight(){
  let light = new THREE.PointLight( 0xffffff, 1, 1500, 2 );
  light.position.set(400, 000, 50);
  scene.add(light);
}
// create skyDome
function createDome(){
  // https://www.eso.org/public/usa/images/eso0932a/
  let skyGeo = new THREE.SphereGeometry(500, 25, 25);
  let skyMat = new THREE.MeshPhongMaterial({
  	map: loader.load("../media/eso0932a_sphere.jpg"),
  });
  let skyDome = new THREE.Mesh(skyGeo, skyMat);
  skyDome.material.side = THREE.BackSide;
  scene.add(skyDome);
}
// create particle system
function createParticles(part_num){
	// create geometry
	let part_geo = new THREE.Geometry();
	// add the vertices
	for (let i = 0; i < part_num; i++) {
    // spherical coordinates, mathematical convention
		let theta = Math.random() *2*Math.PI;
    let gamma = Math.random() *Math.PI;
		let radio = Math.random()*350;
		let posX = radio *Math.sin(theta);
		let posZ = radio *Math.cos(theta);
		let posY = radio *Math.cos(gamma);

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
// create sound surface
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
// create surface's faces for the last row of vertices added
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
// create tone related objetcs
function createTone(){
  // create FFT
  fft = new Tone.FFT(fft_dim);

  // set main Buffer callback function
  Tone.Buffer.on('load', loadPlayButton);

  // button
  play_button = document.createElement("INPUT");
  play_button.setAttribute("type", "button");
  play_button.value = "Play";
  play_button.disabled = true;
  // document.querySelector("#controls").appendChild(play_button);

  // player
  player = new Tone.Player({
  	'url':'../media/hellfire.mp3'
  });
  player.fan(fft).toMaster();
  player.autostart = false;
}
// drawing fft onto the surface
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
// get max value from array
function maxFromArray(arr){
	let m = -1000;
	for (var i = 0; i < arr.length; i++) {
		if (arr[i] > m){
			m = arr[i];
		}
	}
	return m;
}