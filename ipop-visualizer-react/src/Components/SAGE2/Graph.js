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

class Graph extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            nodes: [], links: [], minZoom: 0.2
            , maxZoom: 2, zoom: 1
            , renderGraph: false
            , switchToggle: false
            , isShowRightPanel: false
            , /*selectedOverlay: '101000F', graphType: 'main' /** For React test */
        };
        window.graphComponent = this;
    }

    zoomIn = () => {
        if (this.state.zoom < this.state.maxZoom) {
            this.setState(prevState => {
                return { zoom: prevState.zoom + 0.1 }
            })
        }
    }

    zoomOut = () => {
        if (this.state.zoom > this.state.minZoom) {
            this.setState(prevState => {
                return { zoom: prevState.zoom - 0.1 }
            })
        }
    }

    handleZoomSlider = (e) => {
        var newZoom = e.target.value;
        this.setState(prevState => {
            if (prevState.zoom > newZoom) {
                return { zoom: prevState.zoom - (this.state.zoom - newZoom) };
            }
            else if (prevState.zoom < newZoom) {
                return { zoom: prevState.zoom + (newZoom - this.state.zoom) }
            }
        })
    }

    componentDidMount() {
        //this.fetchData();
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
        if (packet.graphType === 'main') {
            let value = {
                width: 2160,
                height: 1640
            }
            window.SAGE2_AppState.callFunctionInContainer('setWindowSize', value);
            this.fetchData();
        }
        else {
            this.createSubGraph(packet).then((value) => {
                this.setState({ renderGraph: value });
            }).then(() => {
                if (packet.targetId) {
                    this.handleSelectCyElement(packet.targetId);
                }
            });
        }
        this.setState({ graphType: packet.graphType });
    }

    createSubGraph = (packet) => {
        return new Promise((resolve, reject) => {
            try {
                var ipop = new CreateGraphContents();
                var nodeList = [];
                var linkList = [];
                ipop.init(this.state.selectedOverlay, packet.nodes, packet.links);
                this.setState({ ipop: ipop });
                Object.keys(packet.nodes[this.state.selectedOverlay]['current_state']).forEach(node => {
                    var nodeJSON = `{ "data": { "id": "${node}", "label": "${packet.nodes[this.state.selectedOverlay]['current_state'][node]['NodeName']}"}}`
                    var linkIds = Object.keys(packet.links[this.state.selectedOverlay]['current_state'][node]);

                    linkIds.forEach(linkIds => {
                        var source = packet.links[this.state.selectedOverlay]['current_state'][node][linkIds]["SrcNodeId"];
                        var target = packet.links[this.state.selectedOverlay]['current_state'][node][linkIds]["TgtNodeId"];
                        if (Object.keys(packet.nodes[this.state.selectedOverlay]['current_state']).includes(target)) {
                            var linkJSON = `{ "data": {"id": "${linkIds}", "source": "${source}", "target": "${target}" } }`;
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

    setOverlayElements = (nodes, links) => {
        let packet = {
            name: `OverlayElements`,
            data: {
                nodes,
                links,
            },
        }
        window.SAGE2_AppState.callFunctionInContainer(`set`, packet);
    }

    setDataForSearch = (element) => {
        let packet = {
            name: 'DataForSearch',
            data: {
                element
            },
        }
        window.SAGE2_AppState.callFunctionInContainer(`set`, packet);
    }

    fetchData = () => {
        var intervalNo = new Date().toISOString().split(".")[0];
        var serverIP = '18.220.44.57:5000';
        var allowOrigin = 'https://cors-anywhere.herokuapp.com/';  /* you need to allow origin to get data from outside server*/

        var nodeURL = allowOrigin + "http://" + serverIP + "/IPOP/overlays/" + this.state.selectedOverlay + "/nodes?interval=" + intervalNo + "&current_state=True";
        var linkURL = allowOrigin + "http://" + serverIP + "/IPOP/overlays/" + this.state.selectedOverlay + "/links?interval=" + intervalNo + "&current_state=True";

        var nodeList = [];
        var linkList = [];
        var ipop = new CreateGraphContents();

        /** Old version */
        fetch(nodeURL)
            .then(res => res.json())
            .then(nodes =>
                fetch(linkURL)
                    .then(res => res.json())
                    .then(links => {
                        ipop.init(this.state.selectedOverlay, nodes, links);
                        this.setState({ ipop: ipop });
                        Object.keys(nodes[this.state.selectedOverlay]['current_state']).forEach(node => {
                            var nodeJSON = `{ "data": { "id": "` + node + `", "label": "` + nodes[this.state.selectedOverlay]['current_state'][node]['NodeName'] + `" } }`
                            var linkIds = Object.keys(links[this.state.selectedOverlay]['current_state'][node]);

                            linkIds.forEach(linkIds => {
                                var source = links[this.state.selectedOverlay]['current_state'][node][linkIds]["SrcNodeId"];
                                var target = links[this.state.selectedOverlay]['current_state'][node][linkIds]["TgtNodeId"];

                                if (Object.keys(nodes[this.state.selectedOverlay]['current_state']).includes(target)) {
                                    var linkJSON = `{ "data": {"id": "${linkIds}", "source": "${source}", "target": "${target}", "label": "${ipop.getLinkDetails(source, linkIds).InterfaceName}" } }`;
                                    linkList.push(JSON.parse(linkJSON));
                                }
                                this.setState({ links: linkList });
                            });
                            nodeList.push(JSON.parse(nodeJSON));
                            this.setState({ nodes: nodeList })
                            this.setOverlayElements(nodes, links);
                        }
                        )
                    }
                    ).then(res => {
                        this.setState({ renderGraph: true });
                    }).then(res => {
                        this.setDataForSearch(this.cy.json());
                    })
            )
    }

    /** click from inside */
    handleClickCyElement = (id) => {
        console.log(`selected:${id}`);
        switch (this.state.graphType) {
            case 'main':
                let packet = {
                    url: 'http://150.29.149.79:3000/graph', /** IP for React client server */
                    targetId: id,
                    overlayId: this.state.selectedOverlay,
                    type: 'subGraph',
                }
                window.SAGE2_AppState.callFunctionInContainer('openGraph', packet);
                break;
        }
    }

    /** select from outside */
    handleSelectCyElement = (id) => {
        var element = this.cy.elements(`#${id}`);
        element.select();
        element.trigger('click');
    }

    createNodeDetail = (connectedNodes, nodeDetails) => {
        var rightPanelContent;
        if (connectedNodes && nodeDetails) {
            rightPanelContent = <div>
                <h5>{nodeDetails.nodeName}</h5>

                <div className="DetailsLabel">Node ID</div>
                {nodeDetails.nodeID}

                <div className="DetailsLabel">State</div>
                {nodeDetails.nodeState}

                <div className="DetailsLabel">City/Country</div>
                {nodeDetails.nodeLocation}

                <div id="connectedNode" style={{ overflow: "auto" }}>
                    {connectedNodes.map(connectedNode => {
                        var connectedNodeDetail = this.state.ipop.findConnectedNodeDetails(nodeDetails.nodeID, connectedNode.id())
                        var connectedNodeBtn =
                            <CollapseButton key={this.state.ipop.getNodeName(connectedNode.id()) + "Btn"} id={this.state.ipop.getNodeName(connectedNode.id()) + "Btn"} name={this.state.ipop.getNodeName(connectedNode.id())}>
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
        }
        else {
            rightPanelContent = <div></div>
        }
        ReactDOM.render(rightPanelContent, document.getElementById("rightPanelContent"));
    }

    handleSwitch = () => {
        this.setState(prevState => {
            return { switchToggle: !prevState.switchToggle }
        })
    }

    createEdgeDetail = (element, linkDetails) => {
        var rightPanelContent;
        if (linkDetails && element) {

            var sourceNodeDetails;
            var targetNodeDetails;

            if (this.state.switchToggle) {
                sourceNodeDetails = this.state.ipop.getNodeDetails(element.data().target);
                targetNodeDetails = this.state.ipop.getNodeDetails(element.data().source);
            } else {
                sourceNodeDetails = this.state.ipop.getNodeDetails(element.data().source);
                targetNodeDetails = this.state.ipop.getNodeDetails(element.data().target);
            }

            rightPanelContent = <div>
                <h5>{linkDetails.InterfaceName}</h5>

                <div className="row">

                    <div className="col-10" style={{ paddingRight: "0" }}>

                        <CollapseButton className="sourceNodeBtn" key={sourceNodeDetails.nodeID + "Btn"} id={sourceNodeDetails.nodeID + "Btn"} name={sourceNodeDetails.nodeName}>

                            <div className="DetailsLabel">Node ID</div>
                            {sourceNodeDetails.nodeID}

                            <div className="DetailsLabel">State</div>
                            {sourceNodeDetails.nodeState}

                            <div className="DetailsLabel">City/Country</div>
                            {sourceNodeDetails.nodeLocation}

                        </CollapseButton>

                        <CollapseButton className="targetNodeBtn" key={targetNodeDetails.nodeID + "Btn"} id={targetNodeDetails.nodeID + "Btn"} name={targetNodeDetails.nodeName}>

                            <div className="DetailsLabel">Node ID</div>
                            {targetNodeDetails.nodeID}

                            <div className="DetailsLabel">State</div>
                            {targetNodeDetails.nodeState}

                            <div className="DetailsLabel">City/Country</div>
                            {targetNodeDetails.nodeLocation}

                        </CollapseButton>

                    </div>

                    <div className="col" style={{ margin: "auto", padding: "0", textAlign: "center" }}>
                        <button onClick={this.handleSwitch} id="switchBtn" />
                    </div>

                </div>

                <div className="DetailsLabel">Tunnel ID</div>
                {linkDetails.TunnelID}
                <div className="DetailsLabel">Interface Name</div>
                {linkDetails.InterfaceName}
                <div className="DetailsLabel">MAC</div>
                {linkDetails.MAC}
                <div className="DetailsLabel">State</div>
                {linkDetails.State}
                <div className="DetailsLabel">Tunnel Type</div>
                {linkDetails.TunnelType}
                <div className="DetailsLabel">ICE Connection Type</div>
                {linkDetails.ICEConnectionType}
                <div className="DetailsLabel">ICE Role</div>
                {linkDetails.ICERole}
                <div className="DetailsLabel">Remote Address</div>
                {linkDetails.RemoteAddress}
                <div className="DetailsLabel">Local Address</div>
                {linkDetails.LocalAddress}
                <div className="DetailsLabel">Latency</div>
                {linkDetails.Latency}

                <Card.Body className="transmissionCard">
                    Sent
                            <div className="DetailsLabel">Byte Sent</div>
                    -
                            <div className="DetailsLabel">Total Byte Sent</div>
                    {linkDetails.Stats[0].sent_total_bytes}
                </Card.Body>

                <Card.Body className="transmissionCard">
                    Received
                            <div className="DetailsLabel">Byte Received</div>
                    -
                            <div className="DetailsLabel">Total Byte Received</div>
                    {linkDetails.Stats[0].recv_total_bytes}
                </Card.Body>
            </div>
        }
        else {
            rightPanelContent = <div></div>
        }
        ReactDOM.render(rightPanelContent, document.getElementById("rightPanelContent"));
    }

    // toggle overlay right panel
    togglePanel = () => {
        this.setState(prevState => {
            return { isShowRightPanel: !prevState.isShowRightPanel };
        })
        if (this.state.isShowRightPanel) {
            document.getElementById("rightPanel").hidden = true;
        } else {
            document.getElementById("rightPanel").hidden = false;
        }
    }

    render() {
        return <>
            <div id="container" className="container-fluid">
                <div id="mainContent" className="row" style={{ backgroundColor: "#101B2B", color: "white" }}>

                    <div id="leftTools" className="col-1">
                        <button id="infoBtn"></button>
                        <button id="configBtn"></button>
                        <button onClick={this.zoomIn} id="plusBtn"></button>
                        <div id="zoomSlider">
                            <input onChange={this.handleZoomSlider} type="range" min={this.state.minZoom} max={this.state.maxZoom} step="0.1" value={this.state.zoom}></input>
                        </div>
                        <button onClick={this.zoomOut} id="minusBtn"></button>
                    </div>

                    <section id="midArea" className="col-9">

                        {/* Space for create graph */}
                        {this.state.renderGraph ?
                            (
                                <Cytoscape id="cy"
                                    cy={(cy) => {
                                        this.cy = cy;
                                        var _this = this;

                                        this.cy.zoom(this.state.zoom)
                                        this.cy.center()

                                        /** Handle event click on elements */
                                        this.cy.on('click', (event) => {
                                            if (event.target !== cy) {
                                                /** reset style */
                                                cy.elements().removeClass('transparent');
                                                cy.elements().removeClass('selected');
                                                var element = event.target;
                                                _this.handleClickCyElement(element.id());
                                                if (_this.state.graphType === 'main') {
                                                    // if (element.isNode()) {
                                                    //     cy.elements().difference(element.outgoers().union(element.incomers())).not(element).addClass('transparent'); /** Style for test */
                                                    //     var neighborElement = cy.elements(element.incomers().union(element.outgoers()));
                                                    //     var connectedNodes = neighborElement.filter((ele) => {
                                                    //         return ele.isNode();
                                                    //     })
                                                    //     var nodeDetails = _this.state.ipop.getNodeDetails(event.target.id());
                                                    //     _this.createNodeDetail(connectedNodes, nodeDetails);

                                                    // }
                                                    // else {
                                                    //     cy.elements().difference(element.connectedNodes()).not(element).addClass('transparent'); /** Style for test */
                                                    //     _this.createEdgeDetail(element, _this.state.ipop.getLinkDetails(element.data().source, element.data().id));
                                                    // }
                                                    element.addClass('selected');
                                                }
                                                else {
                                                    if (element.isNode()) {
                                                        /** Set clickable for connected elements */
                                                        cy.elements().difference(element.outgoers().union(element.incomers())).not(element).addClass('transparent');
                                                        cy.elements(element.incomers().union(element.outgoers())).style('display','element')
                                                        /** Set unclickable for not connected elements */
                                                        cy.elements().difference(element.outgoers().union(element.incomers())).not(element).style('display','none');
                                                        var neighborElement = cy.elements(element.incomers().union(element.outgoers()));
                                                        var connectedNodes = neighborElement.filter((ele) => {
                                                            return ele.isNode();
                                                        })
                                                        var nodeDetails = _this.state.ipop.getNodeDetails(event.target.id());
                                                        _this.createNodeDetail(connectedNodes, nodeDetails);
                                                    }
                                                    else {
                                                        cy.elements().difference(element.connectedNodes()).not(element).addClass('transparent');
                                                        /** Set unclickable for not connected elements */
                                                        cy.elements().difference(element.connectedNodes()).not(element).style('display','none')
                                                        _this.createEdgeDetail(element, _this.state.ipop.getLinkDetails(element.data().source, element.data().id));
                                                    }
                                                    element.addClass('selected');

                                                }

                                            }
                                            else {
                                                /** Click other than nodes and edges */
                                                if (_this.state.graphType === 'main') {
                                                    cy.elements().removeClass('transparent');
                                                    cy.elements().removeClass('selected');
                                                }
                                                else {
                                                    cy.elements().removeClass('selected');
                                                }
                                                _this.createNodeDetail();
                                            }
                                        })

                                    }}

                                    elements={Cytoscape.normalizeElements({
                                        nodes: this.state.nodes,
                                        edges: this.state.links
                                    })}

                                    stylesheet={[
                                        {
                                            selector: 'node',
                                            style: {
                                                width: 36.37,
                                                height: 36.37,
                                                "background-color": "#9FC556",
                                                "label": "data(label)",
                                                "text-valign": "center",
                                                "text-outline-color": "#9FC556",
                                                "text-outline-width": "5%",
                                                "text-outline-opacity": "1"
                                            }

                                        }, {
                                            selector: "node.selected",
                                            style: {
                                                width: 36.37,
                                                height: 36.37,
                                                "border-width": "50%",
                                                "border-color": "white",
                                                "border-opacity": "0.2",
                                                "background-color": "#9FC556"
                                            }
                                        },
                                        {
                                            selector: 'edge',
                                            style: {
                                                'curve-style': 'haystack',
                                                "line-color": "#56C5BC",
                                            }
                                        }, {
                                            selector: "edge.selected",
                                            style: {
                                                "line-color": "white",
                                            }
                                        }, {
                                            selector: 'node.transparent',
                                            style: {
                                                'opacity': '0.1',
                                            }
                                        },
                                        {
                                            selector: 'edge.transparent',
                                            style: {
                                                'opacity': '0.1',
                                            }
                                        },
                                    ]}

                                    //style={{ width: window.innerWidth, height: window.innerHeight }}

                                    layout={{ name: "circle" }}

                                />
                            )
                            :
                            (<h1>Loading...</h1>)}

                    </section>

                    <button onClick={this.togglePanel} id="overlayRightPanelBtn" />
                    <RightPanel rightPanelTopic='Details'></RightPanel>


                </div>
            </div>
        </>
    }

}

export default Graph;