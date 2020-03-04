import React from "react";
import "../../CSS/SAGE2.css";
import ReactDOM from "react-dom";
import Cytoscape from 'react-cytoscapejs';
import "bootstrap/dist/css/bootstrap.min.css";
import "react-tippy/dist/tippy.css";
import CreateGraphContents from './CreateGraphContents';
import RightPanel from "./RightPanel";
import CytoscapeStyle from './CytoscapeStyle';
import GoogleMapReact from "google-map-react";

class Map extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            nodes: [], links: [], initMinZoom: 0.2, initMaxZoom: 2, setMinZoom: 0.2, setMaxZoom: 2
            , renderGraph: false
            , currentSelectedElement: null
            , center: { lat: 35.6762, lng: 139.6503 }
            , zoom: 0
            ,

        }
        this.nodeLocations = {
            a100001feb6040628e5fb7e70b04f001: [35.667780, 139.792468],
            a100002feb6040628e5fb7e70b04f002: [36.063169, 140.135293],
            a100003feb6040628e5fb7e70b04f003: [36.036767, 139.139504],
            a100004feb6040628e5fb7e70b04f004: [36.124898, 138.014066],
            a100005feb6040628e5fb7e70b04f005: [35.176555, 136.856869],
            a100006feb6040628e5fb7e70b04f006: [34.992293, 135.762571],
            a100007feb6040628e5fb7e70b04f007: [34.682988, 135.528840],
            a100008feb6040628e5fb7e70b04f008: [35.864095, 139.667933],
            a100009feb6040628e5fb7e70b04f009: [36.640714, 138.955405],
            a100010feb6040628e5fb7e70b04f010: [34.377240, 132.457048]
        }
        this.googleMapReact = React.createRef();
        window.graphComponent = this;
    }

    componentDidMount = () => {
        this.toggleRightPanel(true);
        this.requestGraphProperty();
    }

    requestGraphProperty = () => {
        let packet = {
            nameOfComponent: `graphComponent`,
            callback: `responseGraphProperty`,
        }
        window.SAGE2_AppState.callFunctionInContainer(`requestGraphProperty`, packet);
    }

    responseGraphProperty = (packet) => {
        packet = JSON.parse(packet);
        this.setState({ selectedOverlay: packet.overlayId });
        var promise = new Promise((resolve, reject) => {
            var value = {
                width: 1024,
                height: 768,
                sage2w: 3840,
                sage2h: 2160,
            }
            window.SAGE2_AppState.callFunctionInContainer('setWindowSize', value);
            resolve(true);
        })
        promise.then(() => {
            this.createCytoscapeElement(packet).then(() => {
                this.renderGraph();
            })
                .then(() => {
                    if (packet.targetId) {
                        var element = this.cy.elements(`#${packet.targetId}`);
                        this.setState({ currentSelectedElement: element });
                    }
                    this.cy.elements().style({ 'display': 'none' })
                    this.setState({ renderGraph: true })
                })
        })
    }

    createCytoscapeElement = (packet) => {
        return new Promise((resolve, reject) => {
            try {
                var ipop = new CreateGraphContents();
                var nodeList = [];
                var linkList = [];
                ipop.init(this.state.selectedOverlay, packet.nodes, packet.links);
                this.setState({ ipop: ipop });
                Object.keys(packet.nodes[this.state.selectedOverlay]['current_state']).sort().forEach(node => {
                    /** Test lat lng for map view. */
                    var [lat, lng] = [this.getRandomInRange(35.5, 36, 3), this.getRandomInRange(139.5, 140, 3)]
                    var nodeJSON = `{ "data": { "id": "${node}", "label": "${packet.nodes[this.state.selectedOverlay]['current_state'][node]['NodeName']}", "lat":"${this.nodeLocations[node][0]}", "lng":"${this.nodeLocations[node][1]}"}}`

                    //var nodeJSON = `{ "data": { "id": "${node}", "label": "${packet.nodes[this.state.selectedOverlay]['current_state'][node]['NodeName']}"}}`
                    var linkIds = Object.keys(packet.links[this.state.selectedOverlay]['current_state'][node]);

                    linkIds.forEach(linkIds => {
                        var source = packet.links[this.state.selectedOverlay]['current_state'][node][linkIds]["SrcNodeId"];
                        var target = packet.links[this.state.selectedOverlay]['current_state'][node][linkIds]["TgtNodeId"];
                        var colorCode;
                        switch (ipop.getLinkDetails(source, linkIds).TunnelType) {
                            case 'CETypeILongDistance':
                                colorCode = '#5E4FA2';
                                break;
                            case 'CETypeLongDistance':
                                colorCode = '#5E4FA2';
                                break;
                            case 'CETypePredecessor':
                                colorCode = '#01665E';
                                break;
                            case 'CETypeSuccessor':
                                colorCode = '#01665E';
                                break;
                        }
                        if (Object.keys(packet.nodes[this.state.selectedOverlay]['current_state']).includes(target)) {
                            var linkJSON = `{ "data": {"id": "${linkIds}", "source": "${source}", "target": "${target}", "label": "${ipop.getLinkDetails(source, linkIds).InterfaceName}", "color":"${colorCode}" } }`;
                            linkList.push(JSON.parse(linkJSON));
                        }
                    })

                    nodeList.push(JSON.parse(nodeJSON));
                })
                this.setState({ nodes: nodeList, links: linkList });
                resolve(true);
            }
            catch (e) {
                console.log(`fail:${e}`);
                reject(false);
            }
        })
    }

    handleMakerClicked = (node) => {
        var packet = {
            name: `SelectedFromMap`,
            data: {
                appId: `map`,
                targetId: node.data().id,
            }
        }
        window.SAGE2_AppState.callFunctionInContainer(`set`, packet);
        this.resetAnimation(this.state.currentSelectedElement);
        var center = { lat: parseFloat(node.data().lat), lng: parseFloat(node.data().lng) }
        this.setState({ currentSelectedElement: node, center: center, zoom: 10 }, () => {
            document.getElementById(`nodeMaker-${this.state.currentSelectedElement.data().id}`).classList.add(`selected`);
        })
    }

    handleSelectElement = (id) => {
        try {
            this.resetAnimation(this.state.currentSelectedElement);
            var element = this.cy.elements(`#${id}`);
            if (element.isNode()) {
                var center = { lat: parseFloat(element.data().lat), lng: parseFloat(element.data().lng) }
                this.setState({ center: center, zoom: 10, currentSelectedElement: element }, () => {
                    document.getElementById(`nodeMaker-${element.data().id}`).classList.add(`selected`);
                })
            }
            else {
                var promise = new Promise((resolve, reject) => {
                    var center = {};
                    var zoom = 1;
                    if (element.connectedNodes().length == 2) {
                        var [lat1, lng1, lat2, lng2] = [element.connectedNodes()[0].data().lat, element.connectedNodes()[0].data().lng, element.connectedNodes()[1].data().lat, element.connectedNodes()[1].data().lng];
                        var [lat, lng] = this.midpoint(parseFloat(lat1), parseFloat(lng1), parseFloat(lat2), parseFloat(lng2));
                        center = { lat: lat, lng: lng };
                        zoom = this.getZoomLevel(this.getDistanceBetweenPoints(lat1, lng1, lat2, lng2) * 0.001)
                        console.log(`Distance in Kilometers: ${this.getDistanceBetweenPoints(lat1, lng1, lat2, lng2) * 0.001}`);
                        resolve({ center, zoom });
                    }
                    else {
                        reject('Error handleSelectElement > Edge connect more than 2 nodes.');
                    }
                })
                promise.then((packet) => {
                    this.setState({ center: packet.center, zoom: packet.zoom, currentSelectedElement: element }, () => {
                        this.state.currentSelectedElement.connectedNodes().forEach((node) => {
                            document.getElementById(`nodeMaker-${node.data().id}`).classList.add(`selected`);
                        })
                    })
                }).catch((e) => {
                    console.log(`Error handleSelectElement > ${e}`)
                })
            }
        } catch (e) {
            console.log(`Error handleSelectElement > ${e}`)
        }
    }

    midpoint(lat1, lng1, lat2, lng2) {
        lat1 = this.deg2rad(lat1);
        lng1 = this.deg2rad(lng1);
        lat2 = this.deg2rad(lat2);
        lng2 = this.deg2rad(lng2);

        var dlng = lng2 - lng1;
        var Bx = Math.cos(lat2) * Math.cos(dlng);
        var By = Math.cos(lat2) * Math.sin(dlng);
        var lat3 = Math.atan2(Math.sin(lat1) + Math.sin(lat2),
            Math.sqrt((Math.cos(lat1) + Bx) * (Math.cos(lat1) + Bx) + By * By));
        var lng3 = lng1 + Math.atan2(By, (Math.cos(lat1) + Bx));

        return [(lat3 * 180) / Math.PI, (lng3 * 180) / Math.PI];
    }

    deg2rad(degrees) {
        return degrees * Math.PI / 180;
    };

    getDistanceBetweenPoints = (lat1, lng1, lat2, lng2) => {
        let R = 6378137 /** The radius of the planet earth in meters */
        let dLat = this.deg2rad(lat2 - lat1);
        let dLong = this.deg2rad(lng2 - lng1);
        let a = Math.sin(dLat / 2)
            *
            Math.sin(dLat / 2)
            +
            Math.cos(this.deg2rad(lat1))
            *
            Math.cos(this.deg2rad(lat1))
            *
            Math.sin(dLong / 2)
            *
            Math.sin(dLong / 2)
        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        let distance = R * c;
        return distance;
    }

    getZoomLevel = (distance) => {
        var zoom;
        if (distance > 0 && distance < 20) {
            zoom = 10;
        }
        else if (distance > 20 && distance < 100) {
            zoom = 9;
        }
        else if (distance > 100 && distance < 500) {
            zoom = 8;
        }
        else if (distance > 500 && distance < 1500) {
            zoom = 7;
        }
        else if (distance > 1500 && distance < 5000) {
            zoom = 5;
        }
        else {
            zoom = 1;
        }
        return zoom;

    }


    resetAnimation = (element) => {
        if (element) {
            if (element.isNode()) {
                document.getElementById(`nodeMaker-${element.data().id}`).classList.remove(`selected`);
            }
            else {
                element.connectedNodes().forEach((node) => {
                    document.getElementById(`nodeMaker-${node.data().id}`).classList.remove(`selected`);
                })
            }
        }
    }

    renderGraph = () => {
        ReactDOM.render(
            <Cytoscape id="cy"
                cy={(cy) => {
                    this.cy = cy;
                    var _this = this;
                }}
                elements={Cytoscape.normalizeElements({
                    nodes: this.state.nodes,
                    edges: this.state.links
                })}
                stylesheet={CytoscapeStyle}
                style={{ width: window.innerWidth, height: window.innerHeight }}
                layout={{ name: "circle" }}
            />
            , document.getElementById('cy'))
    }

    getRandomInRange(from, to, fixed) {
        return (Math.random() * (to - from) + from).toFixed(fixed) * 1;
    }

    toggleRightPanel = (flag) => {
        if (typeof flag === 'object' && flag !== null) {
            this.setState(prevState => {
                return { isShowRightPanel: !prevState.isShowRightPanel };
            }, () => {
                document.getElementById("rightPanel").hidden = this.state.isShowRightPanel;
            })
        }
        else {
            this.setState({ isShowRightPanel: flag }, () => {
                document.getElementById("rightPanel").hidden = this.state.isShowRightPanel
            })
        }
    }

    handleGoogleApiLoaded = ({ map, maps }) => {
        console.log(`Render react-google-map completed...`);
        if (this.state.currentSelectedElement) {
            this.handleSelectElement(this.state.currentSelectedElement.data().id);
        }
    }

    render() {
        return (
            <>
                <div id="container" className="container-fluid">
                    <div id="mainContent" className="row" style={{ color: "white" }}>
                        <section id="midArea" className="col-9">
                            <div id="cy"></div>
                            {this.state.renderGraph ? (<>
                                <GoogleMapReact
                                    bootstrapURLKeys={{
                                        key: "AIzaSyBjkkk4UyMh4-ihU1B1RR7uGocXpKECJhs",
                                        language: 'en'
                                    }}
                                    //defaultCenter={this.state.center}
                                    center={this.state.center}
                                    defaultZoom={1}
                                    zoom={this.state.zoom}
                                    ref={this.googleMapReact}
                                    yesIWantToUseGoogleMapApiInternals
                                    onGoogleApiLoaded={this.handleGoogleApiLoaded}
                                >
                                    {this.cy.elements("node").map(node => {
                                        return <button key={node.data().id + `Maker`} onClick={this.handleMakerClicked.bind(this, node)} id={`nodeMaker-${node.data().id}`} className="nodeMarker" lat={node.data().lat} lng={node.data().lng}>
                                            <label className="markerLabel">
                                                {node.data().label}
                                            </label>
                                        </button>
                                    })}
                                </GoogleMapReact>
                            </>) : (<div className="loader">Loading...</div>)}
                        </section>
                        <button onClick={this.toggleRightPanel} id="overlayRightPanelBtn" />
                        <RightPanel rightPanelTopic='Details'></RightPanel>
                    </div>
                </div>
            </>
        )
    }
}

export default Map;