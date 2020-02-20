import React from "react";
import ReactDOM from "react-dom";
import RightPanel from "./RightPanel";
import Card from "react-bootstrap/Card";
import Cytoscape from 'react-cytoscapejs';
import ViewSelector from "./ViewSelector";
import CollapseButton from "./CollapseButton";
import Popover from "react-bootstrap/Popover";
import cytoscapeStyle from "./cytoscapeStyle.js";
import { Typeahead } from "react-bootstrap-typeahead";
import CreateGraphContents from "./CreateGraphContents";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import connected_ic from "../../Images/Icons/connected_ic.svg"
import no_tunnel_ic from "../../Images/Icons/no_tunnel_ic.svg"
import not_reporting_ic from "../../Images/Icons/not_reporting_ic.svg"
import longdistance_ic from "../../Images/Icons/longdistance_ic.svg"
import ondemand_ic from "../../Images/Icons/ondemand_ic.svg"
import static_ic from "../../Images/Icons/static_ic.svg"
import successor_ic from "../../Images/Icons/successor_ic.svg"



class GraphContent extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            initMinZoom: 0.2,
            initMaxZoom: 2,
            // wheelSensitive:0.1,
            ipop: null,
            graphElement: [],
            dataReady: false,
            refresh: false,
            // cytoscape: null,
            switchToggle: false,
            infoToggle: true,
            configToggle: true,
            nodeDetails: null,
            linkDetails: null,
            currentSelectedElement: null
        }
    }

    componentDidMount() {
        // document.getElementById("searchBar").remove(document.getElementById("searchOverlay"))
        document.getElementById("overlayRightPanelBtn").click();
        this.fetchData();
    }

    renderNodeDetails = () => {
        // console.log("redering node");

        var sourceNode = this.state.nodeDetails.sourceNode;
        var connectedNodes = this.state.nodeDetails.connectedNodes;

        var ipop = this.state.ipop;

        var nodeContent = <div>

            <h5>{sourceNode.nodeName}</h5>

            <div className="DetailsLabel">Node ID</div>
            {sourceNode.nodeID}

            <div className="DetailsLabel">State</div>
            {sourceNode.nodeState}

            <div className="DetailsLabel">City/Country</div>
            {sourceNode.nodeLocation}
            <br /><br />

            <div id="connectedNode" style={{ overflow: "auto" }}>
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
        ReactDOM.render(nodeContent, document.getElementById("rightPanelContent"))
    }

    renderLinkDetails = () => {

        var linkDetails = this.state.linkDetails.linkDetails;
        var sourceNodeDetails = this.state.linkDetails.sourceNodeDetails;
        var targetNodeDetails = this.state.linkDetails.targetNodeDetails;

        var linkContent = <div>
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
            <br /><br />

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

        ReactDOM.render(linkContent, document.getElementById("rightPanelContent"))
    }

    handleSwitch = () => {

        var that = this;
        var promise = new Promise(function (resolve, reject) {
            try {
                that.setState(prevState => {
                    return { switchToggle: !prevState.switchToggle }
                })

                resolve(true)
            } catch{
                reject(false)
            }
        })

        promise.then(function () {
            that.swap()
        }).catch(function (e) {

        });

    }

    swap = () => {

        var that = this;
        var linkDetails;
        var promise = new Promise(function (resolve, reject) {
            try {
                if (that.state.switchToggle) {
                    linkDetails = that.state.ipop.getLinkDetails(that.state.currentSelectedElement.data().target, that.state.currentSelectedElement.data().id);
                } else {
                    linkDetails = that.state.ipop.getLinkDetails(that.state.currentSelectedElement.data().source, that.state.currentSelectedElement.data().id);
                }
                resolve(linkDetails)
            } catch{
                reject(false)
            }
        })

        promise.then(function (linkDetails) {
            that.setState(prevState => {
                return { linkDetails: { "linkDetails": linkDetails, "sourceNodeDetails": prevState.linkDetails.targetNodeDetails, "targetNodeDetails": prevState.linkDetails.sourceNodeDetails } }
            })
        }).then(function () {
            that.renderLinkDetails();
        }).catch(function (e) {

        })

    }

    setNodeDetails = (node) => {
        // console.log("setting node ");
        var that = this;
        var promise = new Promise(function (resolve, reject) {
            try {
                var sourceNode = that.state.ipop.getNodeDetails(node.data().id);

                var connectedNodes = that.state.cytoscape.elements(node.incomers().union(node.outgoers())).filter((element) => {
                    return element.isNode();
                });

                that.setState({ nodeDetails: { "sourceNode": sourceNode, "connectedNodes": connectedNodes } })

                resolve(true)
            } catch{
                reject(false)
            }
        })

        promise.then(function () {
            that.renderNodeDetails();
        }).catch(function () {

        })
    }

    setLinkDetails = (link) => {
        var that = this;
        var promise = new Promise(function (resolve, reject) {
            try {
                var linkDetails = that.state.ipop.getLinkDetails(link.data().source, link.data().id);

                var sourceNode = link.data().source;

                var targetNode = link.data().target;

                var sourceNodeDetails = that.state.ipop.getNodeDetails(link.data().source);

                var targetNodeDetails = that.state.ipop.getNodeDetails(link.data().target);

                that.setState({ linkDetails: { "linkDetails": linkDetails, "sourceNode": sourceNode, "targetNode": targetNode, "sourceNodeDetails": sourceNodeDetails, "targetNodeDetails": targetNodeDetails } })

                resolve(true);
            } catch{
                reject(false);
            }
        })

        promise.then(function () {
            that.renderLinkDetails();
        }).catch(function () {

        })
    }

    renderGraph = () => {
        ReactDOM.render(<Cytoscape id="cy"
            cy={(cy) => {

                this.cy = cy;

                this.setState({ cytoscape: cy });

                this.cy.maxZoom(this.state.initMaxZoom);
                this.cy.minZoom(this.state.initMinZoom);
                this.cy.zoom(0.8);
                this.cy.center();

                var that = this;

                this.cy.on("click", function (e) {
                    var selectedElement = e.target[0];
                    var relatedElement;
                    var notRelatedElement;
                    try {
                        // console.log(e.target[0]===this.cy);
                        if (document.getElementById("rightPanel").hidden === true) {
                            document.getElementById("overlayRightPanelBtn").click();
                        }
                        if (selectedElement.isNode()) {
                            // console.log(`selected from clicked : ${JSON.stringify(e.target.data())}`);
                            that.setNodeDetails(selectedElement);
                            relatedElement = selectedElement.outgoers().union(selectedElement.incomers()).union(selectedElement);
                            notRelatedElement = that.cy.elements().difference(selectedElement.outgoers().union(selectedElement.incomers())).not(selectedElement)
                        } else if (selectedElement.isEdge()) {
                            that.setLinkDetails(selectedElement)
                            relatedElement = selectedElement.connectedNodes().union(selectedElement);
                            notRelatedElement = that.cy.elements().difference(selectedElement.connectedNodes()).not(selectedElement);
                        }
                        relatedElement.removeClass("hide")
                        notRelatedElement.addClass("hide");

                    } catch {
                        // console.log(e.target[0]===this.cy);
                        if (e.target[0] === this.cy) {
                            document.getElementById("overlayRightPanelBtn").click();
                            ReactDOM.render(<></>, document.getElementById("rightPanelContent"))
                            that.cy.elements().removeClass("hide");
                        }
                    }

                    that.setState({ switchToggle: false, currentSelectedElement: e.target })

                })

            }}
            wheelSensitivity={0.1}

            elements={Cytoscape.normalizeElements({
                nodes: this.state.graphElement[0],
                edges: this.state.graphElement[1]
            })}


            stylesheet={cytoscapeStyle}

            style={{ width: window.innerWidth, height: window.innerHeight }}

            layout={{ name: "circle" }}

        />, document.getElementById("midArea"))

        ReactDOM.render(<ViewSelector />, document.getElementById("viewSelector"));

        ReactDOM.render(<Typeahead selectHintOnEnter id="searchGraphElement"

            onChange={(selected) => {
                try {
                    if (this.state.currentSelectedElement !== null) {
                        this.state.currentSelectedElement.unselect();
                    }
                    selected[0].select();
                    selected[0].trigger("click");
                    this.setState({ switchToggle: false, currentSelectedElement: selected[0] })
                } catch{

                }
            }}
            labelKey={(element) => { return (`${element.data().label}`); }}
            filterBy={this.elementFilter}
            options={this.cy.elements().map(element => { return element; })}
            selected={this.state.selected}
            placeholder="Search node or tunnel"
            renderMenuItemChildren={(element) => {
                return (
                    <div className="searchResult">
                        <div className="resultLabel">
                            {element.data().label}
                        </div>
                        <small>ID : {element.data().id}</small>
                    </div>

                )
            }}

        > </Typeahead>, document.getElementById("searchBar"))
    }

    elementFilter = (element, props) => {
        if (element.group === 'nodes') {
            return (element.data().label.toLowerCase().indexOf(props.text.toLowerCase()) !== -1
                ||
                element.data().id.toLowerCase().indexOf(props.text.toLowerCase()) !== -1);
        }
        else {
            return (element.data().label.toLowerCase().indexOf(props.text.toLowerCase()) !== -1
                ||
                element.data().id.toLowerCase().indexOf(props.text.toLowerCase()) !== -1);
        }
    }

    fetchData = () => {
        var selectedOverlay = this.props.selectedOverlay;
        var intervalNo = new Date().toISOString().split(".")[0];
        var serverIP = '18.220.44.57:5000';
        var allowOrigin = 'https://cors-anywhere.herokuapp.com/';  /* you need to allow origin to get data from outside server*/

        var nodeURL = allowOrigin + "http://" + serverIP + "/IPOP/overlays/" + selectedOverlay + "/nodes?interval=" + intervalNo + "&current_state=True";
        var linkURL = allowOrigin + "http://" + serverIP + "/IPOP/overlays/" + selectedOverlay + "/links?interval=" + intervalNo + "&current_state=True";

        var ipop = new CreateGraphContents();
        var nodeConf = [];
        var linkConf = [];
        var targetConf, sourceConf;

        fetch(nodeURL).then(res => res.json()).then(nodes => {
            fetch(linkURL).then(res => res.json()).then(links => {
                console.log(links);

                ipop.init(this.props.selectedOverlay, nodes, links);
                this.setState({ ipop: ipop });
            }).then(() => {
                ipop.getNodeIDs().forEach(nodeID => {
                    nodeConf.push(JSON.parse(`{ "data": { "id": "${nodeID}", "label": "${ipop.getNodeName(nodeID)}" ,"type":""} }`));
                    ipop.getLinkIDs(nodeID).forEach(linkID => {
                        sourceConf = ipop.getSourceNode(nodeID, linkID);
                        targetConf = ipop.getTargetNode(nodeID, linkID);
                        var linkColor;
                        switch (ipop.getLinkDetails(nodeID, linkID).TunnelType) {
                            case 'CETypeILongDistance':
                                linkColor = '#5E4FA2';
                                break;
                            case 'CETypeLongDistance':
                                linkColor = '#5E4FA2';
                                break;
                            case 'CETypePredecessor':
                                linkColor = '#01665E';
                                break;
                            case 'CETypeSuccessor':
                                linkColor = '#01665E';
                                break;
                            default: break;
                        }
                        linkConf.push(JSON.parse(`{ "data": { "source": "${sourceConf}", "target": "${targetConf}","id":"${linkID}" ,"label":"${ipop.getLinkName(nodeID, linkID)}","type":"${ipop.getLinkObj()[nodeID][linkID]["Type"]}","color":"${linkColor}"} }`));
                    })
                });

                this.setState({ graphElement: [nodeConf, linkConf] })
                this.setState({ dataReady: true })
            }).then(() => {
                this.renderGraph()
            })
        })
    }

    handleRefresh = () => {
        this.cy.zoom(0.8);
        this.cy.center();
    }

    zoomIn = () => {
        var currentZoom = this.cy.zoom();
        this.cy.zoom(currentZoom + 0.1);
        document.getElementById("zoomSlider").value = (this.cy.zoom())
    }

    zoomOut = () => {
        var currentZoom = this.cy.zoom();
        this.cy.zoom(currentZoom - 0.1);
        document.getElementById("zoomSlider").value = (this.cy.zoom())
    }

    handleZoomSlider = (e) => {
        this.cy.zoom(parseFloat(e.target.value));
    }

    handleWheel = (e) => {
        document.getElementById("zoomSlider").value = (this.cy.zoom())
    }

    handleSetMinZoom = (e) => {
        try {
            this.cy.minZoom(parseFloat(e.target.value));
            document.getElementById("zoomSlider").min = parseFloat(e.target.value);
        } finally {
            if (this.cy.zoom() < parseFloat(e.target.value)) {
                this.cy.zoom(parseFloat(e.target.value));
            }
        }
    }

    handleSetMaxZoom = (e) => {
        try {

            this.cy.maxZoom(parseFloat(e.target.value));
            document.getElementById("zoomSlider").max = parseFloat(e.target.value);
        } finally {
            if (this.cy.zoom() > parseFloat(e.target.value)) {
                this.cy.zoom(parseFloat(e.target.value));
            }
        }
    }

    // handleSetZoomSensitive = (e) => {
    //     this.setState({wheelSensitive:e.target.value});
    // }

    componentDidUpdate() {
    }

    handleBackToHome = () => {
        if (window.confirm("Your current process will be loss. Are you sure to go back ?") === true) {
            window.location.reload(true);
        }
    }

    render() {
        return <>
            <div id="leftTools" className="col-3">
                <div>
                    <button onClick={this.handleBackToHome} id="homeBtn" className="leftToolsBtn"></button>
                </div>
                <div>
                    <button onClick={this.handleRefresh} id="refreshBtn" className="leftToolsBtn"></button>
                </div>
                <div>
                    <OverlayTrigger rootClose={true} trigger="click" placement="right" overlay={
                        <Popover>
                            <Popover.Title as="h3">IPOP Network Visualizer Legend</Popover.Title>
                            {/* <Card id="infoContent"> */}
                            <Popover.Content id="infoContent">
                                <table>
                                    <thead>
                                        <tr>
                                            <th colSpan={2}>Node</th>
                                            <th colSpan={2}>Tunnel</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td style={{ width: "5%", margin: "auto" }}><img className="node_img" src={connected_ic} alt="connected_node" /></td>
                                            <td>Connected</td>
                                            <td style={{ width: "15%" }}><img className="tunnel_img" src={longdistance_ic} alt="longdistance_tunnel" /></td>
                                            <td>Long Distance</td>
                                        </tr>
                                        <tr>
                                            <td style={{ width: "5%" }}><img className="node_img" src={not_reporting_ic} alt="not_reporting_node" /></td>
                                            <td>Not Reporting</td>
                                            <td style={{ width: "15%" }}><img className="tunnel_img" src={ondemand_ic} alt="ondemand_tunnel" /></td>
                                            <td>On Demand</td>
                                        </tr>
                                        <tr>
                                            <td style={{ width: "5%" }}><img className="node_img" src={no_tunnel_ic} alt="no_tunnel_node" /></td>
                                            <td>No Tunnels</td>
                                            <td style={{ width: "15%" }}><img className="tunnel_img" src={static_ic} alt="static_tunnel" /></td>
                                            <td>Static</td>
                                        </tr>
                                        <tr>
                                            <td ></td>
                                            <td></td>
                                            <td style={{ width: "15%" }}><img className="tunnel_img" src={successor_ic} alt="successor_tnnel" /></td>
                                            <td>Successor</td>
                                        </tr>
                                    </tbody>
                                </table>
                                {/* </Card> */}
                            </Popover.Content>
                        </Popover>}>
                        <button onClick={this.handleInfoToggle} id="infoBtn" className="leftToolsBtn"></button>
                    </OverlayTrigger>
                </div>
                <div>
                    <OverlayTrigger rootClose={true} trigger="click" placement="right" overlay={
                        <Popover>
                            <Popover.Title as="h3">Configure</Popover.Title>
                            <Popover.Content id="configContent">
                                <div className="row">
                                    <div className="col">
                                        <label>Minimun zoom</label>
                                    </div>
                                    <div className="col">
                                        <select onChange={this.handleSetMinZoom} id="minZoomSelector" value={this.state.minZoom}>
                                            <option id="0.2">0.2</option>
                                            <option id="1">1</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col">
                                        <label>Maximum zoom</label>
                                    </div>
                                    <div className="col">
                                        <select onChange={this.handleSetMaxZoom} id="maxZoomSelector" value={this.state.maxZoom}>
                                            <option>2</option>
                                            <option>5</option>
                                        </select>
                                    </div>
                                </div>
                                {/* <div className="row">
                                    <div className="col">
                                        <label>Zoom sensitivity</label>
                                    </div>
                                    <div className="col">
                                        <select onChange={this.handleSetZoomSensitive} id="zoomSensitiveSelector">
                                            <option>0.1</option>
                                            <option>1</option>
                                        </select>
                                    </div>
                                </div> */}
                            </Popover.Content>
                        </Popover>}>
                        <button onClick={this.handleConfigToggle} id="configBtn" className="leftToolsBtn"></button>
                    </OverlayTrigger>
                </div>
                <div>
                    <button onClick={this.zoomIn} id="plusBtn" className="leftToolsBtn"></button>
                </div>
                <div>
                    <input id="zoomSlider" onChange={this.handleZoomSlider} type="range" min={this.state.initMinZoom}
                        max={this.state.initMaxZoom} step={0.1} defaultValue={0.8}></input>
                </div>
                <div>
                    <button onClick={this.zoomOut} id="minusBtn" className="leftToolsBtn"></button>
                </div>

            </div>

            <section onWheel={this.handleWheel} id="midArea" className="col-9">
            </section>

            <RightPanel rightPanelTopic="Details"></RightPanel>

        </>
    }
}

export default GraphContent;
