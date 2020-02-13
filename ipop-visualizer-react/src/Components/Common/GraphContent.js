import React from "react";
import ReactDOM from "react-dom";
import Cytoscape from 'react-cytoscapejs';

class GraphContent extends React.Component {

    constructor(props) {
        super(props);
        this.state = { nodes: [], links: [], minZoom: 0.2, maxZoom:2, zoom: 1 }
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

    checkAllData = () => {
        if (this.state.nodes.length === 10) {
            var cy = <Cytoscape id="cy"
                cy={(cy) => {
                    this.cy = cy;

                    this.cy.zoom(this.state.zoom)
                    this.cy.center()

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

                style={{ width: 1280, height: 720 }}

                layout={{ name: "circle" }}
            />
            return ReactDOM.render(cy, document.getElementById("midArea"));
        }
    }

    componentDidMount() {
        this.fetchData();
    }

    componentDidUpdate() {
        this.checkAllData()
    }


    fetchData = () => {
        var intervalNo = new Date().toISOString().split(".")[0];
        var serverIP = '18.220.44.57:5000';
        var allowOrigin = 'https://cors-anywhere.herokuapp.com/';  /* you need to allow origin to get data from outside server*/

        var nodeURL = allowOrigin + "http://" + serverIP + "/IPOP/overlays/" + this.props.selectedOverlay + "/nodes?interval=" + intervalNo + "&current_state=True";
        var linkURL = allowOrigin + "http://" + serverIP + "/IPOP/overlays/" + this.props.selectedOverlay + "/links?interval=" + intervalNo + "&current_state=True";

        var nodeList = [];
        var linkList = [];

        fetch(nodeURL)
            .then(res => res.json())
            .then(nodes =>
                fetch(linkURL)
                    .then(res => res.json())
                    .then(links =>
                        Object.keys(nodes[this.props.selectedOverlay]['current_state']).forEach(node => {
                            var nodeJSON = `{ "data": { "id": "` + node + `", "label": "` + nodes[this.props.selectedOverlay]['current_state'][node]['NodeName'] + `" } }`
                            var linkIds = Object.keys(links[this.props.selectedOverlay]['current_state'][node]);

                            linkIds.forEach(linkIds => {
                                var source = links[this.props.selectedOverlay]['current_state'][node][linkIds]["SrcNodeId"];
                                var target = links[this.props.selectedOverlay]['current_state'][node][linkIds]["TgtNodeId"];

                                if (Object.keys(nodes[this.props.selectedOverlay]['current_state']).includes(target)) {
                                    var linkJSON = `{ "data": { "source": "` + source + `", "target": "` + target + `" } }`;
                                    linkList.push(JSON.parse(linkJSON));
                                }
                                this.setState({ links: linkList });
                            });
                            nodeList.push(JSON.parse(nodeJSON));
                            this.setState({ nodes: nodeList })
                        }
                        ))
            )
    }

    render() {
        return <>
            <section id="leftTools" className="col-1">
                <button id="homeBtn"></button>
                <button id="refreshBtn"></button>
                <button id="infoBtn"></button>
                <button id="configBtn"></button>
                <button onClick={this.zoomIn} id="plusBtn"></button>
                <div id="zoomSlider">
                    <input onChange={this.handleZoomSlider} type="range" min={this.state.minZoom} max={this.state.maxZoom} step="0.1" value={this.state.zoom}></input>
                </div>
                <button onClick={this.zoomOut} id="minusBtn"></button>
            </section>

            <section id="midArea" className="col-9">

            </section>

            <section  className="col">

            </section></>
    }
}

export default GraphContent;
