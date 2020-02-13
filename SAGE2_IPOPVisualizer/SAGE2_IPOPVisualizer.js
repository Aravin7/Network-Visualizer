"use strict";

var SAGE2_IPOPVisualizer = SAGE2_App.extend({
	init: function (data) {
		if (this.isElectron()) {
			this.SAGE2Init("webview", data);
			this.createLayer("rgba(0,0,0,0.85)");
			this.layer.style.overflow = "hidden";
			this.pre = document.createElement('pre');
			this.pre.style.whiteSpace = "pre-wrap";
			this.layer.appendChild(this.pre);
		} else {
			this.SAGE2Init("div", data);
			this.element.innerHTML = "<h1>Webview only supported using Electron as a display client</h1>";
			return;
		}
		// Set the DOM id
		this.element.id = "div_" + data.id;
		//this.element.style.backgroundColor = "white"; 

		// move and resize callbacks
		this.resizeEvents = "continuous";
		this.modifiers = [];
		this.contentType = "web";
		// make HTML fit the screen
		this.element.style.display = "inline-flex";

		// Webview settings
		this.element.autosize = "on";
		this.element.plugins = "on";
		this.element.allowpopups = false;
		this.element.allowfullscreen = false;
		// turn off nodejs intergration for now
		this.element.nodeintegration = 0;
		// add the preload clause
		this.addPreloadFile();

		this.title = "SAGE2_IPOPVisualizer";
		// Set a session per webview, so not zoom sharing per origin
		this.element.partition = data.id;
		this.zoomFactor = 1;
		this.autoRefresh = null;
		var _this = this;

		//
		this.children = new Array();
		this.appName = ``;
		this.graphProperty = {
			overlayId: ``,
			graphType: ``,
			selectedElementId: ``,
			nodes: {},
			links: {},
			targetId: ``,
		};
		this.cyElement = {};

		// this.element.addEventListener('page-title-updated', (event) => {
		//     //_this.updateTitle(_this.title + ': ' + event.title);
		// 	//console.log('page-title-updated:' + event.title);
		// 	_this.updateTitle(_this.title + ': ' + event.message);
		// })

		this.element.addEventListener('new-window', (event) => {
			if (event.url.startsWith('http:') || event.url.startsWith('https:')) {
				// _this.newWindow(event.url);
				//console.log(JSON.stringify(event));
				this.launchAppWithValues(_this.title, {
					url: event.url
				}, 500, 500)
			} else {
				console.log('Webview>	Not a HTTP URL, not opening [', event.url, ']', event);
			}
		})

		this.element.addEventListener('console-message', (event) => {
			try {
				let obj = JSON.parse(event.message);
				if (obj.s2) {
					if (obj.s2 === "state") {
						_this.messageUpdateStateValue(obj.nameOfValue, obj.value, obj.propagateChanges)
					} else if (obj.s2 === "functionCall") {
						if (_this[obj.nameOfFunction]) { // only if function exists
							_this[obj.nameOfFunction](obj.value)
						} else {
							console.log("ERROR> WebAppCore> Webpage attempted to call function: " + obj.nameOfFunction + ". But it doesn't exist.");
						}
					}
				}
			} catch (e) {
				console.log('Webview> console-message:' + event.message);
			}
		})

		if (typeof data.customLaunchParams != 'undefined') {
			//this.element.src = data.customLaunchParams.url;
			this.handleCustomLaunchParams(data.customLaunchParams);
		} else {
			this.element.src = 'http://150.29.149.79:3000/'; /* IP for React client server*/
			this.appName = 'Tool';
			this.updateTitle(`${this.title}: ${this.appName}`);
		}
	},
    /**
	 * Determines if electron is the renderer (instead of a browser)
	 *
	 * @method     isElectron
	 * @return     {Boolean}  True if electron, False otherwise.
	 */
	isElectron: function () {
		return (typeof window !== 'undefined' && window.process && window.process.type === "renderer");
	},

    /**
	 * Loads the components to do a file preload on a webpage.
	 * Needs to be within an Electron browser to work.
	 *
	 * @method     addPreloadFile
	 */
	addPreloadFile: function () {
		// if it's not running inside Electron, do not bother
		if (!this.isElectron) {
			return;
		}
		// load the nodejs path module
		var path = require("path");
		// access the remote electron process
		var app = require("electron").remote.app;
		// get the application path
		var appPath = app.getAppPath();
		// split the path at node_modules
		var subPath = appPath.split("node_modules");
		// take the first element which contains the current folder of the application
		var rootPath = subPath[0];
		// add the relative path to the webview folder
		var preloadPath = path.join(rootPath, 'public/uploads/apps/ipop', 'SAGE2_script_supplement.js');
		// finally make it a local URL and pass it to the webview element
		this.element.preload = "file://" + preloadPath;
	},

	event: function (eventType, position, user_id, data, date) {
		if (this.isElectron()) {
			var x = Math.round(position.x);
			var y = Math.round(position.y);
			var _this = this;
			if (eventType === "pointerPress") {
				this.element.sendInputEvent({ // click
					type: "mouseDown",
					x: x, y: y,
					button: data.button,
					modifiers: this.modifiers,
					clickCount: 1
				});
			} else if (eventType === "pointerMove") {
				this.element.sendInputEvent({ // move
					type: "mouseMove",
					modifiers: this.modifiers,
					x: x, y: y
				});
			} else if (eventType === "pointerRelease") {
				this.element.sendInputEvent({ // click release
					type: "mouseUp",
					x: x, y: y,
					button: data.button,
					modifiers: this.modifiers,
					clickCount: 1
				});
			} else if (eventType === "pointerScroll") {
				this.element.sendInputEvent({ // Scroll events: reverse the amount to get correct direction
					type: "mouseWheel",
					deltaX: 0, deltaY: -1 * data.wheelDelta,
					x: x, y: y,
					modifiers: this.modifiers,
					canScroll: true
				});
			} else if (eventType === "widgetEvent") { // widget events
			} else if (eventType === "keyboard") {
				this.element.sendInputEvent({ // type: "keyDown"
					type: "char",
					keyCode: data.character
				});
				setTimeout(function () {
					_this.element.sendInputEvent({
						type: "keyUp",
						keyCode: data.character
					});
				}, 0);
			} else if (eventType === "specialKey") {
				this.modifiers = []; // store the modifiers values
				if (data.status && data.status.SHIFT) {
					this.modifiers.push("shift");
				}
				if (data.status && data.status.CTRL) {
					this.modifiers.push("control");
				}
				if (data.status && data.status.ALT) {
					this.modifiers.push("alt");
				}
				if (data.status && data.status.CMD) {
					this.modifiers.push("meta");
				}
				if (data.status && data.status.CAPS) {
					this.modifiers.push("capsLock");
				}
				if (data.code === 16) { // SHIFT key
					if (data.state === "down") {
						this.element.sendInputEvent({
							type: "keyDown",
							keyCode: "Shift"
						});
					} else {
						this.element.sendInputEvent({
							type: "keyUp",
							keyCode: "Shift"
						});
					}
				}
				if (data.code === 8 || data.code === 46) { // backspace key
					if (data.state === "down") { // Currently only allow on keyup have finer control
					} else {
						this.element.sendInputEvent({
							type: "keyUp",
							keyCode: "Backspace"
						});
					}
				}
				if (data.code === 37 && data.state === "down") { // arrow left
					if (data.status.ALT) {
						this.element.goBack();
					} else {
						this.element.sendInputEvent({
							type: "keyDown",
							keyCode: "Left",
							modifiers: null
						});
					}
					this.refresh(date);
				} else if (data.code === 38 && data.state === "down") { // arrow up
					if (data.status.ALT) {
						this.zoomPage({ dir: "zoomin" });
					} else {
						this.element.sendInputEvent({
							type: "keyDown",
							keyCode: "Up",
							modifiers: null
						});
					}
					this.refresh(date);
				} else if (data.code === 39 && data.state === "down") { // arrow right
					if (data.status.ALT) {
						this.element.goForward();
					} else {
						this.element.sendInputEvent({
							type: "keyDown",
							keyCode: "Right",
							modifiers: null
						});
					}
					this.refresh(date);
				} else if (data.code === 40 && data.state === "down") { // arrow down
					if (data.status.ALT) {
						this.zoomPage({ dir: "zoomout" });
					} else {
						this.element.sendInputEvent({
							type: "keyDown",
							keyCode: "Down",
							modifiers: null
						});
					}
					this.refresh(date);
				} else if (data.code === 82 && data.state === "down") {	// r key
					if (data.status.ALT) {
						this.isLoading = true; // ALT-r reloads
						this.reloadPage({});
					}
					this.refresh(date);
				}
			}
		}
	},
	load: function (date) {
		// OPTIONAL
		// The state will be automatically passed to your webpage through the handler you gave to SAGE2_AppState
		// Use this if you want to alter the state BEFORE it is passed to your webpage. Access with this.state
	},
	draw: function (date) {
		// OPTIONAL
		// Your webpage will be in charge of its view
		// Use this if you want to so something within the SAGE2 Display variables
		// Be sure to set 'this.maxFPS' within init() if this is desired.
		// FPS only works if instructions sets animation true
	},
	resize: function () {
		// OPTIONAL
	},
	getContextEntries: function () {
		// OPTIONAL
		// This can be used to allow UI interaction to your webpage
		// Entires are added after entries of enableUiContextMenuEntries 
		var entries = [];
		// entries.push({
		// 	description: "This text is seen in the UI",
		// 	callback: "makeAFunctionMatchingThisString", // The string will specify which function to activate
		// 	parameters: {},
		// 	// The called function will be passed an Object.
		// 	// Each of the parameter properties will be in that object
		// 	// Some properties are reserved and may be automatically filled in.
		// });
		return entries;
	},

    /**
	* Method called by SAGE2, and calls the application 'quit' method
	*
	* @method terminate
    */
	terminate: function () {
		if (typeof this.quit === 'function') {
			this.quit();
		}
		if (isMaster && this.hasFileBuffer === true) {
			wsio.emit('closeFileBuffer', { id: this.div.id });
		}
		//this.handleCloseGraph();
		this.terminateChildren();
		SAGE2RemoteSitePointer.appQuitHidePointers(this);
		this.serverDataRemoveAllValuesGivenToServer();
	},

	terminateChildren: function () {
		for (var i = 0; i < this.childrenAppIds.length; i++) {
			try {
				applications[this.childrenAppIds[i]]['terminateChildren']();
			}
			catch (error) {
				console.log("terminateChildren: " + error);
			}
		}
		this.close();
	},

	setWindowSize: function (packet) {
		this.sendResize(packet.width, packet.height);
	},

	launchNewApp: function (packet) {
		this.launchAppWithValues(this.title, packet, 200, 0);
	},

	callFunctionInComponent: function (nameOfComponent, nameOfFunction, value) {
		let message = {
			nameOfComponent,
			nameOfFunction,
			value: value,
		}
		this.element.executeJavaScript(`SAGE2_AppState.callFunctionInComponent(${JSON.stringify(message)});`);
	},

	openGraph: function (packet) {
		switch (packet.type) {
			case 'mainGraph':
				let messageMain = {
					appName: `main_${packet.overlayId}`,
					overlayId: packet.overlayId,
					url: packet.url,
					graphType: `main`,
					paramsType: `graph`,
				}
				if (!this.children.includes(packet.overlayId)) {
					this.children.push(packet.overlayId);
					this.launchNewApp(messageMain);
				}
				break;
			case 'subGraph':
				let messageSub = {
					appName: `sub_${this.graphProperty.overlayId}`,
					url: packet.url,
					overlayId: this.graphProperty.overlayId,
					graphType: `sub`,
					paramsType: `graph`,
					nodes: this.graphProperty.nodes,
					links: this.graphProperty.links,
					targetId: packet.targetId,
				}
				if (!this.children.includes(packet.targetId)) {
					this.children.push(packet.targetId);
					this.launchNewApp(messageSub);
				}
				break;
		}
	},

	handleCustomLaunchParams: function (packet) {
		//console.log(`params:${JSON.stringify(packet)}`);
		if (packet.hasOwnProperty('appName')) {
			this.updateTitle(`${this.title}: ${packet.appName}`);
			this.appName = packet.appName;
		}
		if (packet.hasOwnProperty('paramsType')) {
			this.graphProperty.overlayId = packet.overlayId;
			this.graphProperty.graphType = packet.graphType;
			this.graphProperty.nodes = packet.nodes;
			this.graphProperty.links = packet.links;
			this.graphProperty.targetId = packet.targetId;
		}
		if (packet.hasOwnProperty('url')) {
			this.element.src = packet.url;
		}

		this.cyElement = packet.options;

	},

	requestMainGraph: function (packet) {
		/* Make Tool is parent for main graph */
		this.sendDataToParentApp('openGraph', packet);
		/* Close overlay page */
		this.close()
	},

	requestGraphProperty: function (packet) {
		this.callFunctionInComponent(packet.nameOfComponent, packet.callback, JSON.stringify(this.graphProperty));
	},

	set: function (packet) {
		this[`set${packet.name}`](packet.data);
	},

	setOverlayElements(data) {
		this.graphProperty.nodes = data.nodes;
		this.graphProperty.links = data.links;
	},

	setDataForSearch: function (packet) {
		if (this.graphProperty.graphType === 'main') {
			this.sendDataToParentApp('setDataForSearch', packet);
		}
		if (this.appName === 'Tool') {
			if (this.children.includes('search')) {
				let message = {
					nameOfComponent: `searchComponent`,
					callback: `responeSearchOption`,
					value: packet.element,
				}
				this.sendDataToChildrenApps('sendDataToSearch', message);
			}
			else {
				this.cyElement = packet.element;
			}
		}
	},

	sendDataToSearch: function (packet) {
		if (this.appName === 'search') {
			this.callFunctionInComponent(packet.nameOfComponent,
				packet.callback,
				typeof packet.value === 'undefined' ? this.cyElement : packet.value);
		}
	},

	open: function (packet) {
		this[`open${packet.name}`](packet.data);
	},

	openSearch: function (packet) {
		if (!this.children.includes('search')) {
			this.children.push('search');
			let message = {
				appName: packet.appName,
				url: packet.url,
				options: this.cyElement,
			}
			this.launchNewApp(message);
		}
	},

	sendSelectOption: function (packet) {
		this.sendDataToParentApp(packet.passfunc, packet);
	},

	selectOption: function (packet) {
		if (this.graphProperty.graphType === 'main') {
			this.selectCyElement(packet);
		}
		else { /** for Tool application */
			this.sendDataToChildrenApps('selectOption', packet);
		}
	},

	selectCyElement: function (packet) {
		this.callFunctionInComponent(packet.nameOfComponent, packet.callback, packet.targetId);
	},

	removeMainGraph: function(overlayId){
		var index = this.children.indexOf(overlayId);
		if (index !== -1) this.children.splice(index, 1);
		if (this.children.includes('search')) {
			let message = {
				nameOfComponent: `searchComponent`,
				callback: `responeSearchOption`,
				value: {},
			}
			this.sendDataToChildrenApps('sendDataToSearch', message);
		}
		else {
			this.cyElement = {};
		}
	},

	removeSubGraph: function(packet){
		if(this.graphProperty.overlayId === packet.overlayId){
			var index = this.children.indexOf(packet.targetId);
		if (index !== -1) this.children.splice(index, 1);
		}
	},

	handleCloseGraph: function(){
		if(this.graphProperty.graphType === 'main'){
			this.sendDataToParentApp('removeMainGraph',this.graphProperty.overlayId);
		}
		else if(this.graphProperty.graphType === 'sub'){
			let packet = {
				overlayId: this.graphProperty.overlayId,
				targetId: this.graphProperty.targetId
			}
			this.sendDataToParentApp('removeSubGraph',packet);
		}
	},

})