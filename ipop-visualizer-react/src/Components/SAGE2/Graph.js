import React from "react";
import "../../CSS/SAGE2.css";
import ReactDOM from "react-dom";
import Cytoscape from 'react-cytoscapejs';
import CreateGraphContents from './CreateGraphContents';
import CollapseButton from "./CollapseButton";
import Card from "react-bootstrap/Card";
import RightPanel from "./RightPanel";
import CytoscapeStyle from './CytoscapeStyle';
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import Select from "react-select";
import Config from "../../Config/config";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-tippy/dist/tippy.css";
import C3Chart from 'react-c3js'
import 'c3/c3.css'

class Graph extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            nodes: [], links: [], initMinZoom: 0.2, initMaxZoom: 2, setMinZoom: 0.2, setMaxZoom: 2
            , switchToggle: false
            , isShowRightPanel: false
            , isAutoRefresh: false
            , nodeDetails: null
            , linkDetails: null
            , currentSelectedElement: null
            , graphType: null
            , multiWindowState: false
            , targetId: null
            , viewSelector: { label: "Topology", value: "Topology" } /** Deault view */
            , /*selectedOverlay: '101000F', graphType: 'main' /** For React test */
        };
        this.viewOptions = [
            { label: "Topology", value: "Topology" },
            { label: "Subgraph", value: "Subgraph" },
            // { label: "Map", value: "Map" },
        ]
        this.miniZoom = [
            { label: "0.2", value: "0.2" },
            { label: "1", value: "1" },
        ]
        this.maxZoom = [
            { label: "2", value: "2" },
            { label: "5", value: "5" },
        ]
        this.timer = null;
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
        this.customStyles = {
            control: styles => ({ ...styles }),
            option: (provided) => {
                return {
                    ...provided,
                    'font-size': '30px',
                };
            },
            singleValue: (provided, state) => {
                return {
                    ...provided,
                    'font-size': '30px',
                };
            },
        };
        window.graphComponent = this;
    }

    zoomIn = () => {
        try {
            var currentZoom = this.cy.zoom();
            this.cy.zoom(currentZoom + 0.1);
            document.getElementById('zoomSlider').value = (this.cy.zoom());
        }
        catch (e) {
            console.log('Cytoscape is not ready...');
        }
    }

    zoomOut = () => {
        try {
            var currentZoom = this.cy.zoom();
            this.cy.zoom(currentZoom - 0.1);
            document.getElementById('zoomSlider').value = (this.cy.zoom());
        } catch (e) {
            console.log('Cytoscape is not ready...');
        }
    }

    componentDidMount() {
        //this.fetchData();
        this.toggleRightPanel(true);
        this.requestGraphProperty();
        this.requestToolProperty();

        // For test transmissionGraph
        var date = new Date()
        var dateList = []
        for (let index = 0; index < 6; index++) {
            dateList.push(date.setMinutes(date.getMinutes() + (index + 1)))
        }
        this.setState({ testDate: dateList })
    }

    componentWillUnmount() {
        if (this.timer) {
            clearInterval(this.timer);
        }
    }

    /**
     * Section of method `request` && `respone` method for cummunicate SAGE2.
     * Includes >
     * @method requestGraphProperty
     * @method responseGraphProperty
     * @method requestToolProperty
     * @method responseToolProperty
     */

    /**
     * Method to reqest graph property from SAGE2.
     * 
     * @method requestGraphProperty
     */
    requestGraphProperty = () => {
        let packet = {
            nameOfComponent: `graphComponent`,
            callback: `responseGraphProperty`,
        }
        window.SAGE2_AppState.callFunctionInContainer(`requestGraphProperty`, packet);
    }

    /**
     * Method callback to get graph property from SAGE2.
     * 
     * @method responseGraphProperty
     */
    responseGraphProperty = (packet) => {
        packet = JSON.parse(packet);
        this.setState({ selectedOverlay: packet.overlayId, graphType: packet.graphType });
        if (packet.graphType === 'main') {
            var value = {
                width: 1280,
                height: 960,
                sage2w: 3840,
                sage2h: 2160,
            }
            window.SAGE2_AppState.callFunctionInContainer('setWindowSize', value);
            this.fetchData();
        }
        else {
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
                this.createSubGraph(packet).then((value) => {
                    this.setState({ renderGraph: true, targetId: packet.targetId, viewSelector: { label: "Subgraph", value: "Subgraph" } });
                    this.renderGraph();
                }).then(() => {
                    if (packet.targetId) {
                        this.handleSelectCyElement(packet.targetId);
                    }
                })
                    .catch((e) => {
                        console.log(`Error Message: ${e}`);
                    });
            })
        }
        this.setState({ graphType: packet.graphType });
    }

    /**
     * Method call for get Tool property data (mulitiState, etc.) from SAGE2 application.
     * 
     * @method requestToolProperty
     */
    requestToolProperty = () => {
        var packet = {
            func: `MultiState`,
            data: {
                nameOfComponent: `graphComponent`,
                callback: `responseToolProperty`,
            }
        }
        window.SAGE2_AppState.callFunctionInContainer(`request`, packet);

    }

    /**
     * Method for call back when SAGE2 send Tool property data (multiState, etc.)
     * 
     * @method responseToolProperty
     */
    responseToolProperty = (packet) => {
        packet = JSON.parse(packet);
        this.setState({ multiWindowState: packet.multiWindowState }, () => {
            if (this.state.graphType === 'main' && this.state.currentSelectedElement) {
                this.handleSelectCyElement(this.state.currentSelectedElement.id());
            }
        })
    }

    /**
     * End section of method `request` && `respone`.
     */

    /**
     * Section of method `create`.
     * Includes >
     * @method createSubGraph
     * @method createEdgeDetail
     * @method createNodeDetail
     */

    /**
     * Method create sub graph from window which is sub graph type.
     * 
     * @method createSubGraph
     */
    createSubGraph = (packet) => {
        return new Promise((resolve, reject) => {
            try {
                var ipop = new CreateGraphContents();
                var nodeList = [];
                var linkList = [];
                ipop.init(this.state.selectedOverlay, packet.nodes, packet.links);
                this.setState({ ipop: ipop });
                Object.keys(packet.nodes[this.state.selectedOverlay]['current_state']).sort().forEach(node => {
                    /** Test lat lng for map view. */
                    var [lat, lng] = [this.getRandomInRange(34, 40, 3), this.getRandomInRange(132, 140, 3)]
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
                //delete this.viewOptions[0]; /** Remove Topology view from Subgraph view select options. */
                resolve(true);
            }
            catch (e) {
                console.log(`fail:${e}`);
                reject(false);
            }
        })
    }

    /**
     * Method to create node detail in right panel.
     * 
     * @method createNodeDetail
     */
    createNodeDetail = (flag) => {
        var rightPanelContent;
        if (flag) {
            var sourceNode = this.state.nodeDetails.sourceNode;
            var connectedNodes = this.state.nodeDetails.connectedNodes;
            var ipop = this.state.ipop;
            fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${this.nodeLocations[sourceNode.nodeID][0]},${this.nodeLocations[sourceNode.nodeID][1]}&key=AIzaSyBjkkk4UyMh4-ihU1B1RR7uGocXpKECJhs&language=en`)
                .then(res => res.json()).then((data) => {
                    return data.results[data.results.length - 3].formatted_address;
                }).then((location) => {
                    rightPanelContent = <div id="elementDetails">
                        <h2>{sourceNode.nodeName}</h2>
                        <div className="DetailsLabel">Node ID</div>
                        {sourceNode.nodeID}
                        <div className="DetailsLabel">State</div>
                        {sourceNode.nodeState}
                        <div className="DetailsLabel">City/State/Country</div>
                        {/* {sourceNode.location} wait for real data. */}
                        {location}
                        <br /><br />
                        <div id="connectedNode">
                            {connectedNodes.map(connectedNode => {
                                try {
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
                                } catch (e) {

                                }
                            })}
                        </div>
                    </div>
                    this.toggleRightPanel(false);

                }).then(() => {
                    ReactDOM.render(rightPanelContent, document.getElementById("rightPanelContent"));
                }).catch((e) => {
                    console.log(`Error createNodeDetail > ${e.message}`);
                })
        }
        else {
            rightPanelContent = <div></div>
            this.toggleRightPanel(true);
            ReactDOM.render(rightPanelContent, document.getElementById("rightPanelContent"));
        }
        //ReactDOM.render(rightPanelContent, document.getElementById("rightPanelContent"));
    }

    /**
     * Method to create edge detail in right panel.
     * 
     * @method createEdgeDetail
     */
    createEdgeDetail = (flag) => {
        var rightPanelContent;
        if (flag) {
            var linkDetails = this.state.linkDetails.linkDetails;
            var sourceNodeDetails = this.state.linkDetails.sourceNodeDetails;
            var targetNodeDetails = this.state.linkDetails.targetNodeDetails;

            /** For test in demo location wait for real data. */
            fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${this.nodeLocations[sourceNodeDetails.nodeID][0]},${this.nodeLocations[sourceNodeDetails.nodeID][1]}&key=AIzaSyBjkkk4UyMh4-ihU1B1RR7uGocXpKECJhs&language=en`)
                .then(res => res.json()).then(data => {
                    return data.results[data.results.length - 3].formatted_address;
                }).then(sourceLocation => {
                    fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${this.nodeLocations[targetNodeDetails.nodeID][0]},${this.nodeLocations[targetNodeDetails.nodeID][1]}&key=AIzaSyBjkkk4UyMh4-ihU1B1RR7uGocXpKECJhs&language=en`)
                        .then(res => res.json()).then(data => {
                            return data.results[data.results.length - 3].formatted_address;
                        }).then(targetLocation => {
                            rightPanelContent = <div id='elementDetails'>
                                <h2>{linkDetails.InterfaceName}</h2>

                                <div className="row">

                                    <div className="col-10" style={{ paddingRight: "0" }}>

                                        <CollapseButton className="sourceNodeBtn" key={sourceNodeDetails.nodeID + "Btn"} id={sourceNodeDetails.nodeID + "Btn"} name={sourceNodeDetails.nodeName}>

                                            <div className="DetailsLabel">Node ID</div>
                                            {sourceNodeDetails.nodeID}

                                            <div className="DetailsLabel">State</div>
                                            {sourceNodeDetails.nodeState}

                                            <div className="DetailsLabel">City/State/Country</div>
                                            {/* {sourceNodeDetails.nodeLocation} */}
                                            {sourceLocation}

                                        </CollapseButton>

                                        <CollapseButton className="targetNodeBtn" key={targetNodeDetails.nodeID + "Btn"} id={targetNodeDetails.nodeID + "Btn"} name={targetNodeDetails.nodeName}>

                                            <div className="DetailsLabel">Node ID</div>
                                            {targetNodeDetails.nodeID}

                                            <div className="DetailsLabel">State</div>
                                            {targetNodeDetails.nodeState}

                                            <div className="DetailsLabel">City/State/Country</div>
                                            {/* {targetNodeDetails.nodeLocation} */}
                                            {targetLocation}

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

                                <Card.Body id='transmissionGraph' style={{ margin: '0', padding: '0' }} className="transmissionCard">
                                    <C3Chart style={{ color: 'black' }}
                                        data={{
                                            x: 'x',
                                            // xFormat: '%Y%m%d', // 'xFormat' can be used as custom format of 'x'
                                            columns: [
                                                ['x', this.state.testDate[0], this.state.testDate[1], this.state.testDate[2], this.state.testDate[3], this.state.testDate[4], this.state.testDate[5]],
                                                // ['x', '20130101', '20130102', '20130103', '20130104', '20130105', '20130106'],
                                                ['sent', 30, 200, 100, 400, 150, 250],
                                                ['received', 130, 340, 200, 500, 250, 350]
                                            ],
                                            colors: {
                                                sent: '#8FD24D',
                                                received: '#42B2C3'
                                            },
                                            types: {
                                                sent: 'area',
                                                received: 'area'
                                            }
                                        }}
                                        size={{
                                            width: 550,
                                            height: 330
                                        }}
                                        zoom={{
                                            enabled: true
                                        }}
                                        axis={{
                                            x: {
                                                show: false,
                                                type: 'timeseries',
                                                localtime: false,
                                                tick: {
                                                    format: '%Y-%m-%d %H:%M:%S'
                                                }
                                            }
                                        }}
                                        tooltip={{
                                            format: {
                                                title: function (d) { return d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() },
                                                value: function (value, ratio, id) {
                                                    return value
                                                }
                                            }
                                        }}
                                        legend={{ show: false }}
                                    ></C3Chart>
                                </Card.Body>


                            </div>
                            this.toggleRightPanel(false);

                        })
                        .then(() => {
                            ReactDOM.render(rightPanelContent, document.getElementById("rightPanelContent"));
                        })
                })

            // rightPanelContent = <div id='elementDetails'>
            //     <h2>{linkDetails.InterfaceName}</h2>

            //     <div className="row">

            //         <div className="col-10" style={{ paddingRight: "0" }}>

            //             <CollapseButton className="sourceNodeBtn" key={sourceNodeDetails.nodeID + "Btn"} id={sourceNodeDetails.nodeID + "Btn"} name={sourceNodeDetails.nodeName}>

            //                 <div className="DetailsLabel">Node ID</div>
            //                 {sourceNodeDetails.nodeID}

            //                 <div className="DetailsLabel">State</div>
            //                 {sourceNodeDetails.nodeState}

            //                 <div className="DetailsLabel">City/Country</div>
            //                 {sourceNodeDetails.nodeLocation}

            //             </CollapseButton>

            //             <CollapseButton className="targetNodeBtn" key={targetNodeDetails.nodeID + "Btn"} id={targetNodeDetails.nodeID + "Btn"} name={targetNodeDetails.nodeName}>

            //                 <div className="DetailsLabel">Node ID</div>
            //                 {targetNodeDetails.nodeID}

            //                 <div className="DetailsLabel">State</div>
            //                 {targetNodeDetails.nodeState}

            //                 <div className="DetailsLabel">City/Country</div>
            //                 {targetNodeDetails.nodeLocation}

            //             </CollapseButton>

            //         </div>

            //         <div className="col" style={{ margin: "auto", padding: "0", textAlign: "center" }}>
            //             <button onClick={this.handleSwitch} id="switchBtn" />
            //         </div>

            //     </div>

            //     <div className="DetailsLabel">Tunnel ID</div>
            //     {linkDetails.TunnelID}
            //     <div className="DetailsLabel">Interface Name</div>
            //     {linkDetails.InterfaceName}
            //     <div className="DetailsLabel">MAC</div>
            //     {linkDetails.MAC}
            //     <div className="DetailsLabel">State</div>
            //     {linkDetails.State}
            //     <div className="DetailsLabel">Tunnel Type</div>
            //     {linkDetails.TunnelType}
            //     <div className="DetailsLabel">ICE Connection Type</div>
            //     {linkDetails.ICEConnectionType}
            //     <div className="DetailsLabel">ICE Role</div>
            //     {linkDetails.ICERole}
            //     <div className="DetailsLabel">Remote Address</div>
            //     {linkDetails.RemoteAddress}
            //     <div className="DetailsLabel">Local Address</div>
            //     {linkDetails.LocalAddress}
            //     <div className="DetailsLabel">Latency</div>
            //     {linkDetails.Latency}
            //     <br /><br />

            //     <Card.Body className="transmissionCard">
            //         Sent
            //                 <div className="DetailsLabel">Byte Sent</div>
            //         -
            //                 <div className="DetailsLabel">Total Byte Sent</div>
            //         {linkDetails.Stats[0].sent_total_bytes}
            //     </Card.Body>

            //     <Card.Body className="transmissionCard">
            //         Received
            //                 <div className="DetailsLabel">Byte Received</div>
            //         -
            //                 <div className="DetailsLabel">Total Byte Received</div>
            //         {linkDetails.Stats[0].recv_total_bytes}
            //     </Card.Body>
            // </div>
            // this.toggleRightPanel(false);
        }
        else {
            rightPanelContent = <div></div>
            this.toggleRightPanel(true);
        }
        ReactDOM.render(rightPanelContent, document.getElementById("rightPanelContent"));
    }
    /**
     * End section of method `create`
     */

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

    /**
     * Method for get IPOP data from IPOP server.
     * 
     * @method fetchData
     */
    fetchData = () => {
        var intervalNo = new Date().toISOString().split(".")[0];
        //var serverIP = '52.139.216.32:5000'; /** IP for IPOP server. */
        var serverIP = `${Config.IPOP.ip}:${Config.IPOP.port}`;
        var allowOrigin = 'https://cors-anywhere.herokuapp.com/';  /* you need to allow origin to get data from outside server*/

        var nodeURL = allowOrigin + "http://" + serverIP + "/IPOP/overlays/" + this.state.selectedOverlay + "/nodes?interval=" + intervalNo + "&current_state=True";
        var linkURL = allowOrigin + "http://" + serverIP + "/IPOP/overlays/" + this.state.selectedOverlay + "/links?interval=" + intervalNo + "&current_state=True";

        var nodeList = [];
        var linkList = [];
        var ipop = new CreateGraphContents();

        fetch(nodeURL)
            .then(res => res.json())
            .then(nodes =>
                fetch(linkURL)
                    .then(res => res.json())
                    .then(links => {
                        ipop.init(this.state.selectedOverlay, nodes, links);
                        this.setState({ ipop: ipop });
                        Object.keys(nodes[this.state.selectedOverlay]['current_state']).sort().forEach(node => {
                            /** Test lat lng for map view. */
                            var [lat, lng] = [this.getRandomInRange(34, 40, 3), this.getRandomInRange(132, 140, 3)]
                            var nodeJSON = `{ "data": { "id": "${node}", "label": "${nodes[this.state.selectedOverlay]['current_state'][node]['NodeName']}", "lat":"${this.nodeLocations[node][0]}", "lng":"${this.nodeLocations[node][1]}"}}`

                            // var nodeJSON = `{ "data": { "id": "` + node + `", "label": "` + nodes[this.state.selectedOverlay]['current_state'][node]['NodeName'] + `" } }`
                            var linkIds = Object.keys(links[this.state.selectedOverlay]['current_state'][node]);

                            linkIds.forEach(linkIds => {
                                var source = links[this.state.selectedOverlay]['current_state'][node][linkIds]["SrcNodeId"];
                                var target = links[this.state.selectedOverlay]['current_state'][node][linkIds]["TgtNodeId"];
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
                                if (Object.keys(nodes[this.state.selectedOverlay]['current_state']).includes(target)) {
                                    var linkJSON = `{ "data": {"id": "${linkIds}", "source": "${source}", "target": "${target}", "label": "${ipop.getLinkDetails(source, linkIds).InterfaceName}", "color":"${colorCode}" } }`;
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
                    ).then(() => {
                        this.setState({ renderGraph: true }, () => {
                            this.renderGraph();
                        });
                    }).then(() => {
                        this.setDataForSearch(this.cy.json());
                    })
            )
    }

    autoFetchData = () => {
        var intervalNo = new Date().toISOString().split(".")[0];
        //var serverIP = '52.139.216.32:5000'; /** IP for IPOP server. */
        var serverIP = `${Config.IPOP.ip}:${Config.IPOP.port}`;
        var allowOrigin = 'https://cors-anywhere.herokuapp.com/';  /* you need to allow origin to get data from outside server*/

        var nodeURL = allowOrigin + "http://" + serverIP + "/IPOP/overlays/" + this.state.selectedOverlay + "/nodes?interval=" + intervalNo + "&current_state=True";
        var linkURL = allowOrigin + "http://" + serverIP + "/IPOP/overlays/" + this.state.selectedOverlay + "/links?interval=" + intervalNo + "&current_state=True";

        var nodeList = [];
        var linkList = [];
        var ipop = new CreateGraphContents();

        fetch(nodeURL)
            .then(res => res.json())
            .then(nodes =>
                fetch(linkURL)
                    .then(res => res.json())
                    .then(links => {
                        ipop.init(this.state.selectedOverlay, nodes, links);
                        this.setState({ ipop: ipop });
                        Object.keys(nodes[this.state.selectedOverlay]['current_state']).forEach(node => {
                            /** Test lat lng for map view. */
                            var [lat, lng] = [this.getRandomInRange(34, 40, 3), this.getRandomInRange(132, 140, 3)]
                            var nodeJSON = `{ "data": { "id": "${node}", "label": "${nodes[this.state.selectedOverlay]['current_state'][node]['NodeName']}", "lat":"${this.nodeLocations[node][0]}", "lng":"${this.nodeLocations[node][1]}"}}`

                            // var nodeJSON = `{ "data": { "id": "` + node + `", "label": "` + nodes[this.state.selectedOverlay]['current_state'][node]['NodeName'] + `" } }`
                            var linkIds = Object.keys(links[this.state.selectedOverlay]['current_state'][node]);

                            linkIds.forEach(linkIds => {
                                var source = links[this.state.selectedOverlay]['current_state'][node][linkIds]["SrcNodeId"];
                                var target = links[this.state.selectedOverlay]['current_state'][node][linkIds]["TgtNodeId"];
                                var colorCode;
                                switch (ipop.getLinkDetails(source, linkIds).TunnelType) {
                                    case 'CETypeILongDistance':
                                        colorCode = '#5E4FA2';
                                        break;
                                    case 'CETypeLongDistance':
                                        colorCode = '#5E4FA2';
                                        break;
                                    case 'CETypePredecessor':
                                        colorCode = '#5E4FA2';
                                        break;
                                    case 'CETypeSuccessor':
                                        colorCode = '#5E4FA2';
                                        break;
                                }
                                if (Object.keys(nodes[this.state.selectedOverlay]['current_state']).includes(target)) {
                                    var linkJSON = `{ "data": {"id": "${linkIds}", "source": "${source}", "target": "${target}", "label": "${ipop.getLinkDetails(source, linkIds).InterfaceName}", "color":"${colorCode}" } }`;
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
                    ).then(() => {
                        this.setState({ renderGraph: true }, () => {
                            this.renderGraph();
                        });
                    }).then(() => {
                        this.setDataForSearch(this.cy.json());
                    })
            )
    }

    /**
     * Section of `handle` method.
     * Includes >
     * @method handleClickCyElement @method handleSelectCyElement @method handleSwitch
     * @method handleZoomSlider @method handleMouseOverPage @method handleConfigToggle
     */

    /**
     * Method handle selected element when action is from inside.
     * 
     * @method handleClickCyElement
     */
    handleClickCyElement = (id) => {
        switch (this.state.graphType) {
            case 'main':
                var packet = {
                    //url: 'http://150.29.149.79:3000/graph', /** IP for React client server */
                    url: `${Config.React.perfix}${Config.React.ip}:${Config.React.port}/graph`,
                    targetId: id,
                    targetLabel: this.state.currentSelectedElement.data('label'),
                    overlayId: this.state.selectedOverlay,
                    type: 'subGraph',
                }
                if (this.state.multiWindowState) { window.SAGE2_AppState.callFunctionInContainer('openGraph', packet) };
                var packet4map = {
                    appId: `map`,
                    nameOfComponent: `graphComponent`,
                    callback: `handleSelectElement`,
                    targetId: this.state.currentSelectedElement.data().id,
                }
                console.log('set data select for map  ')
                window.SAGE2_AppState.callFunctionInContainer(`sendSelectNodeToMap`, packet4map);
                break;
            case 'sub':
                if (this.state.currentSelectedElement) {
                    var packet = {
                        name: `SelectedFromSub`,
                        data: {
                            oldTargetId: this.state.targetId,
                            newTargetId: this.state.currentSelectedElement.id(),
                            newTargetLabel: this.state.currentSelectedElement.data('label'),
                        }
                    }
                    this.setState(prevState => {
                        return { targetId: prevState.currentSelectedElement.id() }
                    }, () => {
                        window.SAGE2_AppState.callFunctionInContainer('set', packet);
                    })
                }
                break;
        }
    }

    /**
     * Method handle selected element when action is from outside (like from main graph.).
     * 
     * @method handleSelectCyElement
     */
    handleSelectCyElement = (id) => {
        try {
            var element = this.cy.elements(`#${id}`);
            element.select();
            element.trigger('click');
        }
        catch (e) {
            console.log('Cytoscape Not Ready...');
        }
    }

    /**
     * Method to handle slider zoom.
     * 
     * @method handleZoomSlider
     */
    handleZoomSlider = (e) => {
        try {
            this.cy.zoom(parseFloat(e.target.value));
        } catch (e) {
            console.log('Cytoscape is not ready...  ');

        }
    }

    /**
     * Method to handle switch button in right panel.
     * 
     * @method handleSwitch
     */
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

    /**
     * Mthod handle when mouse over on cytoscape.
     * 
     * @method handleMouseOverPage
     */
    handleMouseOverPage = (e) => {
        if (this.state.graphType === 'sub' && this.state.currentSelectedElement)
            this.handleClickCyElement(this.state.currentSelectedElement.id());
        //console.log(`TargetId:${this.state.targetId}, CurrentElement:${this.state.currentSelectedElement.id()}`);
    }

    handleSetMinZoom = (e) => {
        if (this.cy) {
            try {
                this.cy.minZoom(parseFloat(e.value));
                document.getElementById("zoomSlider").min = parseFloat(e.value);
            } finally {
                if (this.cy.zoom() < parseFloat(e.value)) {
                    this.cy.zoom(parseFloat(e.value));
                }
                this.setState({ setMinZoom: e.value })
            }
        }
    }

    handleSetMaxZoom = (e) => {
        if (this.cy) {
            try {
                this.cy.maxZoom(parseFloat(e.value));
                document.getElementById("zoomSlider").max = parseFloat(e.value);
            } finally {
                if (this.cy.zoom() > parseFloat(e.value)) {
                    this.cy.zoom(parseFloat(e.value));
                }
                this.setState({ setMinZoom: e.value })
            }
        }
    }

    handleViewSelector = (e) => {
        if (this.cy) {
            this.cy.elements().removeClass(this.state.viewSelector.value);
            this.cy.elements().removeClass('selected');
        }
        var prevView = null;
        this.setState((prev) => {
            prevView = prev.viewSelector.value;
            return { viewSelector: e };
        }, () => {
            try {
                this[`render${e.value}View`](prevView);
            }
            catch (e) {
                console.log(e.message);
            }
        })
    }

    handleWheel = (e) => {
        try {
            document.getElementById("zoomSlider").value = (this.cy.zoom());
        } catch (e) {
            console.log(`Error func handleWheel > ${e.message}`)
        }
    }

    handleMakerClicked = (node) => {
        node.trigger('click');
    }

    handleRefresh = () => {
        try {
            this.cy.zoom(0.8);
            document.getElementById('zoomSlider').value = this.cy.zoom();
            this.cy.center();
        } catch (e) {
            console.log(`Error func handleRefresh > ${e.message}`)
        }
    }

    handleAutoRefresh = () => {
        this.setState(prevState => {
            return { isAutoRefresh: !prevState.isAutoRefresh }
        }, () => {
            if (this.state.isAutoRefresh) {
                this.timer = setInterval(() => {
                    try {
                        /** some action. */
                    } catch (error) {
                        console.log(`Error func handleAutoRefresh > ${error}`)
                    }
                }, 1000)
            }
            else {
                clearInterval(this.timer);
            }
        })
    }

    /**
     * End section `handle` method.
     */

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
            } catch (e) {
                console.log(e)
                reject(false)
            }
        })

        promise.then(function (linkDetails) {
            that.setState(prevState => {
                return { linkDetails: { "linkDetails": linkDetails, "sourceNodeDetails": prevState.linkDetails.targetNodeDetails, "targetNodeDetails": prevState.linkDetails.sourceNodeDetails } }
            }, () => {
                that.createEdgeDetail(true);
            })
        }).catch(function (e) {
            console.log(e)
        })
    }

    /**
	* Method called when click node elements on graph.
	*
	* @method eventClickNode
    */
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
            if (this.state.graphType === 'main') {
                if (!this.state.multiWindowState) this.createNodeDetail(true); /** Node Detail */
                else this.createNodeDetail(false);
            }
            else {
                this.createNodeDetail(true)
            }
            this.renderAnimationClicked(node);
        })
    }

    /**
	* Method called when click edge elements on graph.
	*
	* @method eventClickEdge
    */
    eventClickEdge = (edge) => {
        var [linkDetails, sourceNode, targetNode, sourceNodeDetails, targetNodeDetails]
            = [this.state.ipop.getLinkDetails(edge.data('source'), edge.data('id')), edge.data('source'), edge.data('target'), this.state.ipop.getNodeDetails(edge.data('target')), this.state.ipop.getNodeDetails(edge.data('source'))];
        this.setState({ linkDetails: { linkDetails, sourceNode, targetNode, sourceNodeDetails, targetNodeDetails } },
            () => {
                if (this.state.graphType === 'main') {
                    if (!this.state.multiWindowState) this.createEdgeDetail(true); /** Edge Detail */
                    else this.createEdgeDetail(false);
                }
                else {
                    this.createEdgeDetail(true);
                }
                this.renderAnimationClicked(edge);
            })
    }

    /**
     * Method for toggle detail panel in the right page.
     * 
     * @method toggleRightPanel
     */
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

    /**
     * Section of method render.
     */
    renderGraph = () => {
        ReactDOM.render(
            <Cytoscape id="cy"
                cy={(cy) => {
                    this.cy = cy;
                    var _this = this;
                    this.cy.maxZoom(this.state.initMaxZoom);
                    this.cy.minZoom(this.state.initMinZoom);
                    this.cy.zoom(0.8);
                    this.cy.center();
                    this.cy.on('click', (event) => {
                        if (event.target !== cy) {
                            console.log(`${this.state.graphType}:click!!`)
                            /** reset style */
                            cy.elements().removeClass(this.state.viewSelector.value);
                            cy.elements().removeClass('selected');
                            var element = event.target;
                            _this.setState({ currentSelectedElement: element }, () => {
                                _this.handleClickCyElement(element.id()); /** for open sub graph */
                            })
                            if (element.isNode()) {
                                _this.eventClickNode(element);
                            }
                            else {
                                _this.eventClickEdge(element);
                            }
                        }
                        else {
                            if (_this.state.graphType === 'main') {
                                cy.elements().removeClass(this.state.viewSelector.value);
                                cy.elements().removeClass('selected');
                            }
                            else {
                                cy.elements().removeClass('selected');
                            }
                            _this.setState(prevState => {
                                return {
                                    currentSelectedElement: null,
                                }
                            })
                            _this.createNodeDetail(false);
                        }
                    })
                    this.cy.on('mouseover', (event) => {
                        event.preventDefault();
                        _this.handleMouseOverPage();
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
            , document.getElementById('midArea'))
    }

    renderAnimationClicked = (element) => {
        if (element) {
            if (this.state.viewSelector.value !== 'Map' || this.state.viewSelector.value !== 'Log') {
                if (element.isNode()) {
                    this.cy.elements().difference(element.outgoers().union(element.incomers())).not(element).addClass(this.state.viewSelector.value);
                }
                else {
                    this.cy.elements().difference(element.connectedNodes()).not(element).addClass(this.state.viewSelector.value);
                }
                element.addClass('selected');
            }
        }
    }

    renderTopologyView = () => {
        var promise = new Promise((resolve, reject) => {
            this.renderGraph();
            resolve(this.state.currentSelectedElement);
        })
        promise.then((value) => {
            try {
                value.trigger('click');
            } catch (e) {
            }
        })
    }

    renderSubgraphView = (prev) => {
        var promise = new Promise((resolve, reject) => {
            if (prev === `Map`) {
                this.renderGraph();
            }
            resolve(this.state.currentSelectedElement);
        })
        promise.then((value) => {
            try {
                value.trigger('click');
            } catch (e) {
                this.renderGraph();
            }
        })
    }

    /** For test random lat lng  */
    getRandomInRange(from, to, fixed) {
        return (Math.random() * (to - from) + from).toFixed(fixed) * 1;
    }

    /**
     * End section of method render.
     */

    render() {
        return <>
            <div id="container" className="container-fluid">
                <div id="mainContent" className="row" style={{ color: "white" }}>
                    <div id="leftTools" className="col-1">

                        <OverlayTrigger rootClose={true} trigger="click" placement="right" overlay={
                            <Popover >
                                <Popover.Title as="h3">IPOP Network Visualizer : View</Popover.Title>
                                <Popover.Content id="viewContent">
                                    <div>
                                        <Select
                                            styles={window.innerWidth > 1280 ? this.customStyles : ''}
                                            options={this.viewOptions}
                                            onChange={value => this.handleViewSelector(value)}
                                            value={this.state.viewSelector}
                                            defaultValue={this.state.viewSelector}
                                        />
                                    </div>
                                </Popover.Content>
                            </Popover>}>
                            <button id="viewBtn"></button>
                        </OverlayTrigger>

                        <OverlayTrigger rootClose={true} trigger="click" placement="right" overlay={
                            <Popover>
                                <Popover.Title as="h3">IPOP Network Visualizer : Configure</Popover.Title>
                                <Popover.Content id="configContent">
                                    <div className="row">
                                        <div className="col">
                                            <label>Minimun zoom</label>
                                        </div>
                                        <div className="col">
                                            <Select
                                                styles={window.innerWidth > 1280 ? this.customStyles : ''}
                                                options={this.miniZoom}
                                                onChange={value => this.handleSetMinZoom(value)}
                                                value={{ label: this.state.setMinZoom, value: this.state.minZoom }}
                                                defaultValue={{ label: this.state.setMinZoom, value: this.state.setMinZoom }}
                                            />
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col">
                                            <label>Maximum zoom</label>
                                        </div>
                                        <div className="col">
                                            <Select
                                                styles={window.innerWidth > 1280 ? this.customStyles : ''}
                                                options={this.maxZoom}
                                                onChange={value => this.handleSetMaxZoom(value)}
                                                value={{ label: this.state.setMaxZoom, value: this.state.maxZoom }}
                                                defaultValue={{ label: this.state.setMaxZoom, value: this.state.setMaxZoom }}
                                            />
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col">
                                            <label>Auto Refresh</label>
                                        </div>
                                        <div className="col">
                                            <input type="checkbox"
                                                className="autoRefreshCheck"
                                                defaultChecked={this.state.isAutoRefresh}
                                                onChange={this.handleAutoRefresh}
                                            ></input>
                                        </div>
                                    </div>
                                </Popover.Content>
                            </Popover>}>
                            <button onClick={this.handleConfigToggle} id="configBtn" className="leftToolsBtn"></button>
                        </OverlayTrigger>

                        <button onClick={this.handleRefresh} id="refreshBtn"></button>
                        <button onClick={this.zoomIn} id="plusBtn"></button>
                        <div>
                            <input id="zoomSlider" onChange={this.handleZoomSlider} type="range"
                                min={this.state.initMinZoom} max={this.state.initMaxZoom} step={0.1}
                                defaultValue={0.8}></input>
                        </div>
                        <button onClick={this.zoomOut} id="minusBtn"></button>
                    </div>
                    <section onWheel={this.handleWheel} id="midArea" className="col-9">
                        {this.state.renderGraph ? (<></>) : (<div className="loader">Loading...</div>)}
                    </section>
                    <button onClick={this.toggleRightPanel} id="overlayRightPanelBtn" />
                    <RightPanel rightPanelTopic='Details'></RightPanel>
                </div>
            </div>
        </>
    }

}

export default Graph;