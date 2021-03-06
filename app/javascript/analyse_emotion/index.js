import 'numeric'
import 'jsfeat'
import clm from 'clmtrackr/clmtrackr'
import pModel from 'clmtrackr/models/model_pca_20_svm'
import 'analyse_emotion/emotion_classifier'
import 'analyse_emotion/emotionmodel'
import Stats from 'analyse_emotion/stats'

var cc = document.getElementById('image').getContext('2d');
var overlay = document.getElementById('overlay');
var overlayCC = overlay.getContext('2d');

var img = new Image();
img.onload = function() {
	cc.drawImage(img,0,0,625, 500);
};
img.src = './assets/IMG_0574.JPG';

var ctrack = new clm.tracker({stopOnConvergence : true});
ctrack.init(pModel);

var stats = new Stats();
stats.domElement.style.position = 'absolute';
stats.domElement.style.top = '0px';
document.getElementById('container').appendChild( stats.domElement );

var drawRequest;

function animateClean() {
	ctrack.start(document.getElementById('image'));
	drawLoop();
}

function animate(box) {
	ctrack.start(document.getElementById('image'), box);
	drawLoop();
}

function drawLoop() {
	drawRequest = requestAnimationFrame(drawLoop);
	overlayCC.clearRect(0, 0, 720, 576);
	if (ctrack.getCurrentPosition()) {
		ctrack.draw(overlay);
	}
}

document.getElementById("start").addEventListener("click", function(){
  animateClean();
});

// detect if tracker fails to find a face
document.addEventListener("clmtrackrNotFound", function(event) {
	ctrack.stop();
	alert("The tracking had problems with finding a face in this image. Try selecting the face in the image manually.")
}, false);

// detect if tracker loses tracking of face
document.addEventListener("clmtrackrLost", function(event) {
	ctrack.stop();
	alert("The tracking had problems converging on a face in this image. Try selecting the face in the image manually.")
}, false);

// detect if tracker has converged
document.addEventListener("clmtrackrConverged", function(event) {
	document.getElementById('convergence').innerHTML = "CONVERGED";
	document.getElementById('convergence').style.backgroundColor = "#00FF00";
	// stop drawloop
	cancelRequestAnimFrame(drawRequest);
}, false);

// update stats on iteration
document.addEventListener("clmtrackrIteration", function(event) {
	stats.update();
}, false);

// manual selection of faces (with jquery imgareaselect plugin)
function selectBox() {
	overlayCC.clearRect(0, 0, 720, 576);
	document.getElementById('convergence').innerHTML = "";
	ctrack.reset();
	$('#overlay').addClass('hide');
	$('#image').imgAreaSelect({
		handles : true,
		onSelectEnd : function(img, selection) {
			// create box
			var box = [selection.x1, selection.y1, selection.width, selection.height];

			// do fitting
			animate(box);
			$('#overlay').removeClass('hide');
		},
		autoHide : true
	});
}

// function to start showing images
function loadImage() {
	if (fileList.indexOf(fileIndex) < 0) {
		var reader = new FileReader();
		reader.onload = (function(theFile) {
			return function(e) {
				// check if positions already exist in storage

				// Render thumbnail.
				var canvas = document.getElementById('image')
				var cc = canvas.getContext('2d');
				var img = new Image();
				img.onload = function() {
					if (img.height > 500 || img.width > 700) {
						var rel = img.height/img.width;
						var neww = 700;
						var newh = neww*rel;
						if (newh > 500) {
							newh = 500;
							neww = newh/rel;
						}
						canvas.setAttribute('width', neww);
						canvas.setAttribute('height', newh);
						cc.drawImage(img,0,0,neww, newh);
					} else {
						canvas.setAttribute('width', img.width);
						canvas.setAttribute('height', img.height);
						cc.drawImage(img,0,0,img.width, img.height);
					}
				}
				img.src = e.target.result;
			};
		})(fileList[fileIndex]);
		reader.readAsDataURL(fileList[fileIndex]);
		overlayCC.clearRect(0, 0, 720, 576);
		document.getElementById('convergence').innerHTML = "";
		ctrack.reset();
	}

}

// set up file selector and variables to hold selections
var fileList, fileIndex;
if (window.File && window.FileReader && window.FileList) {
	function handleFileSelect(evt) {
		var files = evt.target.files;
		fileList = [];
		for (var i = 0;i < files.length;i++) {
			if (!files[i].type.match('image.*')) {
				continue;
			}
			fileList.push(files[i]);
		}
		if (files.length > 0) {
			fileIndex = 0;
		}

		loadImage();
	}
	// document.getElementById('files').addEventListener('change', handleFileSelect, false);
} else {
	$('#files').addClass("hide");
	$('#loadimagetext').addClass("hide");
}
