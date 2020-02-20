// SAGE2 is available for use under the SAGE2 Software License
//
// University of Illinois at Chicago's Electronic Visualization Laboratory (EVL)
// and University of Hawai'i at Manoa's Laboratory for Advanced Visualization and
// Applications (LAVA)
//
// See full text, terms and conditions in the LICENSE.txt included file
//
// Copyright (c) 2014-17

/*
Supplement to get some additional input functionality.
	In particular backspace and sending keypresses to nodes with out value property.

*/


// ------------------------------------------------------------------------------------------------------------------
// 1

var s2InjectForKeys = {};

/*
Unsure why but after testing, page doesn't get keydowns, so this conversion function needs to be injected.

Quote from MDN:
	The keypress event is fired when a key is pressed down, and that key normally produces a character value (use input instead).

Element that check for keydown will not be normally activated. This has been confirmed Youtube and spacebar for pausing video.
*/

document.addEventListener("keypress", function(e) {
	var kue = new CustomEvent("keydown", {bubbles:true});
	kue.target = e.target;
	kue.view = e.view;
	kue.detail = e.detail;
	kue.char = e.char;
	kue.key = e.key;
	kue.charCode = e.charCode;
	kue.keyCode = e.keyCode;
	kue.which = e.which;
	kue.location = e.location;
	kue.repeat = e.repeat;
	kue.locale = e.locale;
	kue.ctrlKey = e.ctrlKey;
	kue.shiftKey = e.shiftKey;
	kue.altKey = e.altKey;
	kue.metaKey = e.metaKey;
	// If a keypress is received and the target isn't an input node
	if (e.target.value === undefined) {
		// Set the lastClickedElement to the target of event (since it needs to get there)
		s2InjectForKeys.lastClickedElement = e.target;
		s2InjectForKeys.lastClickedElement.dispatchEvent(kue);
		// Prevent weird page effects like spacebar causing page to scroll down
		e.preventDefault();
	} else {
		// Else it was an input target
		addDeleteBackspaceHandlerToInputElement(e.target);
	}
});

// After any click, track the node clicked to send further events to it.
document.addEventListener("click", function(e) {
	// s2InjectForKeys.lastClickedElement = document.elementFromPoint(e.clientX, e.clientY); // Disabling this for now
	addDeleteBackspaceHandlerToInputElement(e.target);
});

/**
 * Adds handler to input element to remove text.
 *
 * @method     addDeleteBackspaceHandlerToInputElement
 * @param      {Object} element The input element
 */
function addDeleteBackspaceHandlerToInputElement(element) {
	// Only add to elements which have text input
	if ((!element) || (element.value === undefined) || (element.type !== "text")) {
		return;
	}
	// Prevent double add
	if (element.deleteKeyHandler === undefined){
		element.deleteKeyHandler = function(e) {
			if (e.keyCode == 8) {
				let tempValue, tempSelectionStart;
				// check if there is a selection
				if (this.selectionStart !== undefined && (this.selectionStart !== this.selectionEnd)) {
					tempSelectionStart = this.selectionStart;
					tempValue = "";
					tempValue = this.value.substring(0, this.selectionStart);
					tempValue += this.value.substring(this.selectionEnd);
					this.value = tempValue;
					this.selectionStart = tempSelectionStart;
					this.selectionEnd = tempSelectionStart;
				} else if (this.selectionStart !== undefined) {
					tempSelectionStart = this.selectionStart;
					tempValue = "";
					tempValue = this.value.substring(0, this.selectionStart - 1); // Removes character at selection start
					tempValue += this.value.substring(this.selectionStart);
					this.value = tempValue;
					this.selectionStart = tempSelectionStart - 1;
					this.selectionEnd = tempSelectionStart - 1;
				}
				else {
					this.value = this.value.substring(0, this.value.length - 1);
				}
			}
		};
		element.addEventListener("keyup", element.deleteKeyHandler);
	}
}

/**
 * Loads a css file into the DOM
 *
 * @method     loadCSS
 * @param      {String}  res     The resource
 */
function loadCSS(res) {
	var style = document.createElement("link");
	style.setAttribute("type", "text/css");
	style.setAttribute("rel",  "stylesheet");
	style.setAttribute("href", res);
	style.onload = style.onreadystatechange = function() {
		console.log('loadCCS> file loaded: ' + res);
	};
	document.body.appendChild(style);
}

/**
 * Loads a js file into the DOM
 *
 * @method     loadJS
 * @param      {String}    res     The resource
 * @param      {Function}  cb      callback to call when done
 */
function loadJS(res, cb) {
	var script = document.createElement("script");
	script.type  = "text/javascript";
	script.async = false;
	script.src = res;
	script.onload = script.onreadystatechange = function() {
		console.log('loadJS> file loaded: ' + res);
		if (cb) {
			cb();
		}
	};
	document.body.appendChild(script);
}

// Start the code
// --------------

// wait for the page (webview) to load
var scriptAddInterval = setInterval(function() {
	if (document.readyState === "complete") {
		// stop trying
		clearInterval(scriptAddInterval);
		// load some runtime files and process hack
		if (location.hostname.indexOf("appear.in") !== -1) {
			// apparently JQuery is already loaded in appear.in
			// just call the hack
			processAppearIn();
		}
	}
	// try to load every second till done
}, 1000);


// Specific to appear.in hack
// --------------------------

function processAppearIn() {
	var doneCam  = false;
	var doneAin  = false;
	var doneAout = false;

	var scriptSearch = setInterval(function() {
		var cam = $('[name="cameraInputSelector"]').val();
		if (cam && !doneCam) {
			console.log('Appear.in> Found cam: ' + cam);
			$('[name="cameraInputSelector"]').attr('multiple', true);
			var hcam = $('[name="cameraInputSelector"]').height();
			$('[name="cameraInputSelector"]').height(2 * hcam);
			doneCam = true;
		}
		var ain = $('[name="audioInputSelector"]').val();
		if (ain && !doneAin) {
			console.log('Appear.in> Found audio input: ' + ain);
			$('[name="audioInputSelector"]').attr('multiple', true);
			var hin = $('[name="audioInputSelector"]').height();
			$('[name="audioInputSelector"]').height(2 * hin);
			doneAin = true;
		}
		var aout = $('[name="audioOutputSelector"]').val();
		if (aout && !doneAout) {
			console.log('Appear.in> Found audio output: ' + aout);
			$('[name="audioOutputSelector"]').attr('multiple', true);
			var hout = $('[name="audioOutputSelector"]').height();
			$('[name="audioOutputSelector"]').height(2 * hout);
			doneAout = true;
		}
		if (doneCam && doneAin && doneAout) {
			// if all done, cancel the timer
			clearInterval(scriptSearch);
			console.log('Appear.in> All done hacking');
		}
		// try every 1s till done
	}, 1000);
}

