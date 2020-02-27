import React from "react";
import "../../CSS/SAGE2.css";
import ReactDOM from "react-dom";
import Cytoscape from 'react-cytoscapejs';
import "bootstrap/dist/css/bootstrap.min.css";
import "react-tippy/dist/tippy.css";
import CreateGraphContents from './CreateGraphContents';
import CollapseButton from "./CollapseButton";
import Card from "react-bootstrap/Card";
import RightPanel from "./RightPanel";
import CytoscapeStyle from './CytoscapeStyle';
import { nullLiteral } from "@babel/types";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import Select from "react-select";
import GoogleMapReact from "google-map-react";
import { Button } from 'react-bootstrap';

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
            a100001feb6040628e5fb7e70b04f001: [13.751769, 100.501287],
            a100002feb6040628e5fb7e70b04f002: [29.639507, -82.317875],
            a100003feb6040628e5fb7e70b04f003: [32.808629, 130.710253],
            a100004feb6040628e5fb7e70b04f004: [35.723056, 140.826576],
            a100005feb6040628e5fb7e70b04f005: [36.095354, 140.029521],
            a100006feb6040628e5fb7e70b04f006: [30.613987, 104.068328],
            a100007feb6040628e5fb7e70b04f007: [35.948014, 140.182366],
            a100008feb6040628e5fb7e70b04f008: [21.120823, 79.103034],
            a100009feb6040628e5fb7e70b04f009: [57.954472, 102.738448],
            a100010feb6040628e5fb7e70b04f010: [36.062328, 140.135625],
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
        //console.log(`packet:${packet}`);
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
                //this.setState({renderGraph:true})
                this.renderGraph();
            })
                .then(() => {
                    this.cy.elements().style({ 'display': 'none' })
                    this.setState({ renderGraph: true })
                    //this.renderMapView();
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
        console.log('selected')
        try {
            this.resetAnimation(this.state.currentSelectedElement);
            var element = this.cy.elements(`#${id}`);
            if (element.isNode()) {
                var center = { lat: parseFloat(element.data().lat), lng: parseFloat(element.data().lng) }
                this.setState({ center: center, zoom: 15, currentSelectedElement: element }, () => {
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
                        resolve({center, zoom});
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
                    console.log(e)
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

    getZoomLevel = (distance) =>{
        var zoom;
        if(distance > 0 && distance < 20){
            zoom = 12;
        }
        else if(distance > 20 && distance < 100){
            zoom = 10;
        }
        else if(distance > 100 && distance < 500){
            zoom = 8;
        }
        else if(distance > 500 && distance < 1500){
            zoom = 4;
        }
        else if(distance > 1500 && distance < 5000){
            zoom = 2;
        }
        else{
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

    // renderMapView = () => {
    //     var map = <GoogleMapReact
    //         bootstrapURLKeys={{
    //             key: "AIzaSyBjkkk4UyMh4-ihU1B1RR7uGocXpKECJhs",
    //             language: 'en'
    //         }}
    //         defaultCenter={this.state.center}
    //         center={this.state.center}
    //         defaultZoom={this.state.zoom}
    //     >
    //         {this.cy.elements("node").map(node => {
    //             return <button onClick={this.handleMakerClicked.bind(this, node)} id={node.data().id} className="nodeMarker" lat={node.data().lat} lng={node.data().lng}>
    //                 {node.data().label}
    //             </button>
    //         })}
    //     </GoogleMapReact>
    //     ReactDOM.render(map, document.getElementById("midArea"));
    // }

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
                                >
                                    {this.cy.elements("node").map(node => {
                                        return <button ref={this.nodeMaker} onClick={this.handleMakerClicked.bind(this, node)} id={`nodeMaker-${node.data().id}`} className="nodeMarker" lat={node.data().lat} lng={node.data().lng}>
                                            {node.data().label}
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