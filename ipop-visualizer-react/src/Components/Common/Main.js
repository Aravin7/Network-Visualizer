import React from "react";
import "../../CSS/Main.css";
import ReactDOM from "react-dom";
import "react-tippy/dist/tippy.css";
import { Tooltip } from "react-tippy";
import Card from "react-bootstrap/Card";
import GraphContent from "./GraphContent";
import "bootstrap/dist/css/bootstrap.min.css";
import Accordion from "react-bootstrap/Accordion";
import ipop_ic from "../../Images/Icons/ipop_ic.svg";
import overlay_ic from "../../Images/Icons/overlay_ic.svg";

class Main extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentView: "topology", overlays: [], overlaysObj: {}, selectedOverlay: false, selectedOverlayId: ""
           
        }
    }

    componentDidMount() {
        var intervalNo = new Date().toISOString().split(".")[0];
        var serverIP = '18.220.44.57:5000';
        var allowOrigin = 'https://cors-anywhere.herokuapp.com/';  /* you need to allow origin to get data from outside server*/
        var url = allowOrigin + 'http://' + serverIP + '/IPOP/overlays?interval=' + intervalNo + '&current_state=True'

        fetch(url).then(res => res.json())
            .then((overlays) => {
                this.setState({ overlaysObj: overlays });
                this.setState({ overlays: Object.keys(this.state.overlaysObj['current_state']) });
            })
            .catch(err => {
                alert(err);
            })
    }

    renderGraphContent = (overlayId) => {
        ReactDOM.render(<GraphContent selectedOverlay={overlayId} />, document.getElementById("mainContent"))
        // return ;
    }

    renderOverlays = () => {
        if (this.state.selectedOverlay) {
            return this.renderGraphContent(this.state.selectedOverlayId);
        } else {
            let overlays = this.state.overlays.map((overlay) => {
                return <Tooltip className="overlayTooltips" key={overlay} duration="500" animation="scale" interactive distance={40} position="bottom" arrow={true} open={true}
                    html={(<div>{overlay}</div>)}>
                    <button onClick={this.selectOverlay.bind(this, overlay)} id={overlay} className="overlay">
                        <img src={overlay_ic} alt="overlay_ic" className="overlay_ic"></img>
                    </button>
                </Tooltip>
            });
            return overlays;
        }
    }

    selectOverlay = (overlayId) => {
        this.setState({ selectedOverlay: true, selectedOverlayId: overlayId })
    }

    renderOverlayBtn = () => {
        let overlayBtn = this.state.overlays.map((overlay) => {
            return <Accordion className="overlayBtn" key={overlay + "_btn"} id={overlay + "_btn"} style={{ marginTop: "2.5%" }}>
                <Accordion.Toggle as={Card.Header} style={{ color: "white", background: "transparent", border: "transparent", outline: "none" }} eventKey={overlay}>
                    {overlay}
                </Accordion.Toggle>
                <Accordion.Collapse as={Card.Body} eventKey={overlay} style={{ backgroundColor: "#213758", padding: "1%" }}>
                    <div>Number of nodes : {this.state.overlaysObj['current_state'][overlay].NumNodes}<br />
                        Number of links : {this.state.overlaysObj['current_state'][overlay].NumLinks}</div>
                </Accordion.Collapse>
            </Accordion>
        });
        return overlayBtn;
    }

    render() {
        return (<div id="container" className="container-fluid">
            <header className="row">
                <img src={ipop_ic} alt="ipop_ic" />

                <div id="ipopTitle" className="col-3">
                    <h6>IPOP NETWORK VISUALIZER</h6>
                </div>

                <div className="col-6" style={{ textAlign: "center" }}>
                    <select hidden id="viewSelector">
                        <option value="Topology">Topology</option>
                    </select>
                </div>

                <div className="col">
                    <input hidden id="search" type="search" placeholder="search"></input>
                </div>
            </header>

            <div id="mainContent" className="row" style={{ backgroundColor: "#101B2B", color: "white" }}>

                <section id="midArea" className="col-10">
                    {this.renderOverlays()}
                </section>

                <section id="rightPanel" className="col">
                    <h6>Overlays</h6>
                    <input id="search" type="search" placeholder="search"></input>
                    {this.renderOverlayBtn()}
                </section>

            </div>

        </div>)
    }
}

export default Main;