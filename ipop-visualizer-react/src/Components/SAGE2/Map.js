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
            , nodeDetails: null
            , linkDetails: null
            , center: { lat: 35.6762, lng: 139.6503 }
            , zoom: 0
            , targetId: null
            ,

        }
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
                    var nodeJSON = `{ "data": { "id": "${node}", "label": "${packet.nodes[this.state.selectedOverlay]['current_state'][node]['NodeName']}", "lat":"${lat}", "lng":"${lng}"}}`

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
        if(this.state.targetId){
            var resetStyle = this.state.targetId;
            this.setState({targetId:null}, () => {
                document.getElementById(`${resetStyle}`).setAttribute('style','background-color:#8AA626;');
            })
        }
        node.trigger('click');
    }

    handleSelectElement = (id) => {
        try {
            var element = this.cy.elements(`#${id}`);
            if (element.isNode()) {
                var center = { lat: parseFloat(element.data().lat), lng: parseFloat(element.data().lng) }
                var oldTargetId = this.state.targetId ? this.state.targetId : null;
                this.setState({ center: center, targetId: id, zoom:10 }, () => {
                    if(oldTargetId){
                        document.getElementById(`${oldTargetId}`).setAttribute('style','background-color:#8AA626;');
                    }
                    var currentElement = document.getElementById(`${element.data().id}`);
                    currentElement.setAttribute('style','background-color:aqua;');
                    element.trigger('click');
                    //document.getElementById(`${element.data().id}`).setAttribute('style','background-color:red;');
                });
            }
        } catch (e) {

        }
    }

    eventClickNode = (node) => {
        var sourceNode = this.state.ipop.getNodeDetails(node.data('id'));
        var connectedNodes = this.cy.elements(node.incomers().union(node.outgoers())).filter((ele) => {
            return ele.isNode();
        })
        this.setState({
            nodeDetails: {
                'sourceNode': sourceNode, 'connectedNodes': connectedNodes,
            }
        }, () => {
            //this.createNodeDetail(true)
        })
    }

    createNodeDetail = (flag) => {
        var rightPanelContent;
        if (flag) {
            var sourceNode = this.state.nodeDetails.sourceNode;
            var connectedNodes = this.state.nodeDetails.connectedNodes;
            var ipop = this.state.ipop;
            rightPanelContent = <div id="elementDetails">

                <h2>{sourceNode.nodeName}</h2>

                <div className="DetailsLabel">Node ID</div>
                {sourceNode.nodeID}

                <div className="DetailsLabel">State</div>
                {sourceNode.nodeState}

                <div className="DetailsLabel">City/Country</div>
                {sourceNode.nodeLocation}
                <br /><br />

                <div id="connectedNode">
                    {connectedNodes.map(connectedNode => {
                        var connectedNodeDetail = ipop.findConnectedNodeDetails(sourceNode.nodeID, connectedNode.id())
                        var connectedNodeBtn =
                            <CollapseButton key={ipop.getNodeName(connectedNode.id()) + "Btn"} id={ipop.getNodeName(connectedNode.id()) + "Btn"} name={ipop.getNodeName(connectedNode.id())}>
                                <div className="DetailsLabel">Node ID</div>
                                {connectedNode.id()}
                                <div className="DetailsLabel">Tunnel ID</div>
                                {connectedNodeDetail.TunnelID}
                                <div className="DetailsLabel">Interface Name</div>
                                {connectedNodeDetail.InterfaceName}
                                <div className="DetailsLabel">MAC</div>
                                {connectedNodeDetail.MAC}
                                <div className="DetailsLabel">State</div>
                                {connectedNodeDetail.State}
                                <div className="DetailsLabel">Tunnel Type</div>
                                {connectedNodeDetail.TunnelType}
                                <div className="DetailsLabel">ICE Connection Type</div>
                                {connectedNodeDetail.ICEConnectionType}
                                <div className="DetailsLabel">ICE Role</div>
                                {connectedNodeDetail.ICERole}
                                <div className="DetailsLabel">Remote Address</div>
                                {connectedNodeDetail.RemoteAddress}
                                <div className="DetailsLabel">Local Address</div>
                                {connectedNodeDetail.LocalAddress}
                                <div className="DetailsLabel">Latency</div>
                                {connectedNodeDetail.Latency}
                                <Card.Body className="transmissionCard">
                                    Sent
                                            <div className="DetailsLabel">Byte Sent</div>
                                    -
                                            <div className="DetailsLabel">Total Byte Sent</div>
                                    {connectedNodeDetail.Stats[0].sent_total_bytes}
                                </Card.Body>

                                <Card.Body className="transmissionCard">
                                    Received
                                            <div className="DetailsLabel">Byte Received</div>
                                    -
                                            <div className="DetailsLabel">Total Byte Received</div>
                                    {connectedNodeDetail.Stats[0].recv_total_bytes}
                                </Card.Body>

                            </CollapseButton>

                        return connectedNodeBtn;
                    })}
                </div>

            </div>
            this.toggleRightPanel(false);
        }
        else {
            rightPanelContent = <div></div>
            this.toggleRightPanel(true);
        }
        ReactDOM.render(rightPanelContent, document.getElementById("rightPanelContent"));
    }


    renderGraph = () => {
        ReactDOM.render(
            <Cytoscape id="cy"
                cy={(cy) => {
                    this.cy = cy;
                    var _this = this;
                    this.cy.on('click', (event) => {
                        if (event.target !== cy) {
                            var element = event.target;
                            if (element.isNode()) {
                                _this.eventClickNode(element);
                            }
                        }
                    })
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
                                    defaultCenter={this.state.center}
                                    center={this.state.center}
                                    defaultZoom={this.state.zoom}
                                    zoom={this.state.zoom}
                                >
                                    {this.cy.elements("node").map(node => {
                                        return <button ref={this.nodeMaker} onClick={this.handleMakerClicked.bind(this, node)} id={node.data().id} className="nodeMarker" lat={node.data().lat} lng={node.data().lng}>
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