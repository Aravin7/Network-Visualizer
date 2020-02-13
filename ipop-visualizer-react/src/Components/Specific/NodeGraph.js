import React from 'react';
import Button from 'react-bootstrap/Button';
import CytoscapeComponent from 'react-cytoscapejs';
import home_ic from '../../Images/Icons/home_ic.svg';
import refresh_ic from '../../Images/Icons/refresh_ic.svg';
import info_ic from '../../Images/Icons/info_ic.svg';
import config_ic from '../../Images/Icons/config_ic.svg';
import plus_ic from '../../Images/Icons/plus_ic.svg';
import minus_ic from '../../Images/Icons/minus_ic.svg';
import RightPane from '../Common/RightPane';
import ReactDOM from 'react-dom';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/form';

class NodeGraph extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            overlay: this.props.overlay,
            nodes: this.props.nodes, links: this.props.links, minZoom: 0.2, maxZoom:2, zoom: 1, selectedNodeID: "",
            toggleConfig: false, toggleInfo: false
        }
    }

    createGraph = () => {
        let nodeList = [];
        let linkList = [];


        for (let i = 0; i < this.state.overlay.NumNodes; i++) {
            let nodeID = Object.keys(this.state.nodes)[i];
            let nodeJSON = "{data:{id:'" + nodeID + "',label:'" + this.state.nodes[nodeID]['NodeName'] + "'}}";
            let linkIDList = Object.keys(this.state.links[nodeID]);

            linkIDList.forEach(linkID => {
                var srcNodeID = this.state.links[nodeID][linkID]['SrcNodeId'];
                var tgtNodeID = this.state.links[nodeID][linkID]['TgtNodeId'];

                if (Object.keys(this.state.nodes).includes(tgtNodeID)) {
                    var linkJSON = "{data : {source:'" + srcNodeID + "',target:'" + tgtNodeID + "'}}";
                    linkList.push(linkJSON);
                }
            });
            nodeList.push(nodeJSON);

        }
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

    handleRefresh = () => {
        this.cy.center();
    }

    handleSelectNode = () => {
        console.log(this.state.selectedNodeID)
    }

    toggleConfig = () => {
        return this.state.toggleConfig;
    }

    closeConfig = () => {
        this.setState({ toggleConfig: false });
    }

    openConfig = () => {
        this.setState({ toggleConfig: true });
    }

    toggleInfo = () => {
        return this.state.toggleInfo;
    }

    closeInfo = () => {
        this.setState({ toggleInfo: false });
    }

    openInfo = () => {
        this.setState({ toggleInfo: true });
    }

    handleMinZoomChange = (e) => {
        this.setState({ minZoom: e.target.value })
    }

    handleMaxZoomChange = (e) => {
        this.setState({ maxZoom: e.target.value })
    }

    render() {

        return (<div>
        <div className="leftToolsbar">
            {console.log( new Date().toISOString().split(".")[0])}
                <Button type="button" variant="link" className="toolBtn"><img src={home_ic} alt="home_ic" /></Button>
                <Button id="refresh" onClick={this.handleRefresh} type="button" variant="link" className="toolBtn"><img src={refresh_ic} alt="refresh_ic" /></Button>
                <Button onClick={this.openInfo} type="button" variant="link" className="toolBtn"><img src={info_ic} alt="info_ic" /></Button>

                <Modal id="infoModal" show={this.toggleInfo()} animation={false} size="sm">

                    <Modal.Body>

                        <Button variant="primary" onClick={this.closeInfo} >
                            Done
                        </Button>

                    </Modal.Body>

                </Modal>

                <Button onClick={this.openConfig} type="button" variant="link" className="toolBtn"><img src={config_ic} alt="config_ic" /></Button>
                <Modal id="configModal" show={this.toggleConfig()} animation={false} size="sm">

                    <Modal.Body>

                        <Form.Row>
                            <Form.Group>
                                <div>Min Zoom</div>
                                <select id="minZoom" title={this.state.minZoom} onChange={this.handleMinZoomChange} onLoad={this.handleMinZoomChange}>
                                    <option value={0.2} >0.2</option>
                                    <option value={1}>1</option>
                                </select>
                            </Form.Group>

                            <Form.Group>
                                <div>Max Zoom</div>
                                <select id="maxZoom" title={this.state.maxZoom} value={this.state.maxZoom} onChange={this.handleMaxZoomChange} onLoad={this.handleMaxZoomChange}>
                                    <option value={2} >2</option>
                                    <option value={5}>5</option>
                                </select>
                            </Form.Group>
                        </Form.Row>
                        
                        <div><input type="checkbox" label="Auto Refresh"></input>Auto Refresh</div>


                        <Button variant="secondary" onClick={this.closeConfig} >
                            cancel
                        </Button>

                        <Button variant="primary" onClick={this.closeConfig} >
                            Done
                        </Button>

                    </Modal.Body>

                </Modal>
                <Button onClick={this.zoomIn} type="button" variant="link" className="toolBtn"><img src={plus_ic} alt="plus_ic" /></Button>
                <input id="zoom-slider-bar" onChange={this.handleZoomSlider} type="range" min={this.state.minZoom} max={this.state.maxZoom} step="0.1" value={this.state.zoom} />
                <Button onClick={this.zoomOut} type="button" variant="link" className="toolBtn"><img src={minus_ic} alt="minus_ic" /></Button>
            </div>

            <div id="rightToolsbar">

            </div>

            <CytoscapeComponent id="cy"
                cy={(cy) => {
                    this.cy = cy;

                    this.cy.zoom(this.state.zoom)

                    // add click event on node
                    this.cy.on('tap', 'node', function (evt) {
                        var node = evt.target;
                        console.log('tapped ' + node.data('label'));
                        var details = <RightPane>
                            <div>NODE NAME</div>
                            <Button >hide</Button>
                            <br />

                            <div className="nodeIDLabel">Node ID</div>
                            <div>-</div><br />

                            <div className="stateLabel">State</div>
                            <div>-</div><br />

                            <div className="cityLabel">City/Country</div>
                            <div>-</div><br />

                            <div>Connected Node ()</div>
                            <Button></Button>

                        </RightPane>
                        ReactDOM.render(details, document.getElementById("rightToolsbar"));
                    });

                    // add click event on tunnel
                    this.cy.on('tap', 'edge', function (evt) {
                        var edge = evt.target;
                        console.log('tapped ' + edge.id());
                    });

                }}

                elements={CytoscapeComponent.normalizeElements({
                    nodes: [
                        { data: { id: 'a000010feb6040628e5fb7e70b04f010', label: 'nd-010' } },
                        { data: { id: 'a000011feb6040628e5fb7e70b04f011', label: 'nd-011' } },
                        { data: { id: 'a000012feb6040628e5fb7e70b04f012', label: 'nd-012' } },
                        { data: { id: 'a000013feb6040628e5fb7e70b04f013', label: 'nd-013' } },
                        { data: { id: 'a000014feb6040628e5fb7e70b04f014', label: 'nd-014' } },
                        { data: { id: 'a000015feb6040628e5fb7e70b04f015', label: 'nd-015' } },
                        { data: { id: 'a000016feb6040628e5fb7e70b04f016', label: 'nd-016' } },
                        { data: { id: 'a000017feb6040628e5fb7e70b04f017', label: 'nd-017' } },
                        { data: { id: 'a000018feb6040628e5fb7e70b04f018', label: 'nd-018' } },
                        { data: { id: 'a000019feb6040628e5fb7e70b04f019', label: 'nd-019' } },
                        { data: { id: 'a000020feb6040628e5fb7e70b04f020', label: 'nd-020' } },
                        { data: { id: 'a000021feb6040628e5fb7e70b04f021', label: 'nd-021' } }
                    ],
                    edges: [
                        { data: { source: 'a000010feb6040628e5fb7e70b04f010', target: 'a000011feb6040628e5fb7e70b04f011' } },
                        { data: { source: 'a000011feb6040628e5fb7e70b04f011', target: 'a000012feb6040628e5fb7e70b04f012' } },
                        { data: { source: 'a000012feb6040628e5fb7e70b04f012', target: 'a000013feb6040628e5fb7e70b04f013' } },
                        { data: { source: 'a000013feb6040628e5fb7e70b04f013', target: 'a000014feb6040628e5fb7e70b04f014' } },
                        { data: { source: 'a000014feb6040628e5fb7e70b04f014', target: 'a000015feb6040628e5fb7e70b04f015' } },
                        { data: { source: 'a000015feb6040628e5fb7e70b04f015', target: 'a000016feb6040628e5fb7e70b04f016' } },
                        { data: { source: 'a000016feb6040628e5fb7e70b04f016', target: 'a000017feb6040628e5fb7e70b04f017' } },
                        { data: { source: 'a000017feb6040628e5fb7e70b04f017', target: 'a000018feb6040628e5fb7e70b04f018' } },
                        { data: { source: 'a000018feb6040628e5fb7e70b04f018', target: 'a000019feb6040628e5fb7e70b04f019' } },
                        { data: { source: 'a000019feb6040628e5fb7e70b04f019', target: 'a000020feb6040628e5fb7e70b04f020' } },
                        { data: { source: 'a000020feb6040628e5fb7e70b04f020', target: 'a000021feb6040628e5fb7e70b04f021' } },
                        { data: { source: 'a000021feb6040628e5fb7e70b04f021', target: 'a000010feb6040628e5fb7e70b04f010' } },
                    ]
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
                        selector: "node:selected",
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
                        selector: "edge:selected",
                        style: {
                            "line-color": "white",
                        }
                    }
                ]}

                style={{ width: window.innerWidth, height: window.innerHeight - ((window.innerHeight * 4) / 100) }}

                layout={{ name: "circle" }}

                minZoom={this.state.handleMinZoomChange}

                maxZoom={this.state.handleMaxZoomChange}
            />

            <div className="bottomToolsbar">
                <input id="timelapse-slider-bar" type="range" min="0" max="1" step="1" value="0" />
            </div>

        </div>)
    }
}

export default NodeGraph;