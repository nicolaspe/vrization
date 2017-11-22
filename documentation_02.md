# The word is progress!

## Surfaces!
[Creation](https://stackoverflow.com/questions/9252764/how-to-create-a-custom-mesh-on-three-js)

[Updating the surface](https://github.com/mrdoob/three.js/issues/1091)

```
soundSurf.geometry.verticesNeedUpdate = true;
soundSurf.geometry.elementsNeedUpdate = true;
```


## Particles!
[link](https://aerotwist.com/tutorials/creating-particles-with-three-js/)

**PARTICLE DRAWING ORDER!!!**


# VR World!

BIG thanks to [Or Fleisher](http://orfleisher.com/)

[Web VR UI](https://github.com/googlevr/webvr-ui)

[WebVR](https://webvr.info/developers/)

First of all `renderer.vr.enabled = true;`

`document.body.appendChild( WEBVR.getButton( renderer ) );`

### New controls
Orbit Controls is not useful for this, it's best to use the new VRControls `var controls = new THREE.VRControls(camera);`

### Chrome extensions!
[WebVR API Emulation](https://chrome.google.com/webstore/detail/webvr-api-emulation/gbdnpaebafagioggnhkacnaaahpiefil)

### Change in Pipeline!
```
function update(){
	renderer.animate(animate);
}
function animate() {
	// requestAnimationFrame(animate); // <- NOT ANYMORE!!
	controls.update();
	renderer.render(scene, camera);
}
update();
```

## Let's go mobile!
To use it on Android devices...
[request token](https://github.com/GoogleChrome/OriginTrials/blob/gh-pages/developer-guide.md)

[Remote debugging](https://developers.google.com/web/tools/chrome-devtools/remote-debugging/)

[How???](https://developers.google.com/web/fundamentals/vr/getting-started-with-webvr/)

Install [Google VR Services](https://play.google.com/store/apps/details?id=com.google.vr.vrcore)

But for other devices (ahem, iPhone, ahem), you need to use something additional: [WebVR Polyfill](https://github.com/googlevr/webvr-polyfill) to fill the ...



## Future!
- Add texture and layers to the surfaces, as seen in this [example](http://learningthreejs.com/blog/2013/09/16/how-to-make-the-earth-in-webgl/)
- [Inspiration](https://gamedevelopment.tutsplus.com/articles/how-to-learn-threejs-for-game-development--gamedev-11787?_ga=2.181558695.1839948992.1509825661-539836398.1509825661)

[more resources](https://developer.mozilla.org/en-US/docs/Web/API/WebVR_API/Using_the_WebVR_API)
