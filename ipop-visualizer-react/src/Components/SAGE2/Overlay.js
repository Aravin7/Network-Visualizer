import React from "react";
//import "../../CSS/Main.css";
import ReactDOM from "react-dom";
import "react-tippy/dist/tippy.css";
import { Tooltip } from "react-tippy";
import Card from "react-bootstrap/Card";
import "bootstrap/dist/css/bootstrap.min.css";
import Accordion from "react-bootstrap/Accordion";
import ipop_ic from "../../Images/Icons/ipop_ic.svg";
import overlay_ic from "../../Images/Icons/overlay_ic.svg";

class Overlay extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            overlays: [], overlaysObj: {}, selectedOverlayId: '',
        }
        window.overlayComponent = this;
    }

    componentDidMount() {
        var intervalNo = new Date().toISOString().split('.')[0];
        var serverIP = '52.139.216.32:5000'; /* Server IP for get overlay */
        var allowOrigin = 'https://cors-anywhere.herokuapp.com/';  /* you need to allow origin to get data from outside server*/
        var url = `${allowOrigin}http://${serverIP}/IPOP/overlays?interval=${intervalNo}&current_state=True`
        fetch(url).then(res => res.json())
            .then((overlays) => {
                this.setState({ overlaysObj: overlays });
                this.setState({ overlays: Object.keys(this.state.overlaysObj['current_state']) });
            })
            .catch(err => {
                console.log(err);
            })
    }

    renderOverlays = () => {
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

    selectOverlay = (overlayId) => {
        this.setState({selectedOverlayId: overlayId})
        let packet = {
            type: `mainGraph`,
            url: `http://150.29.149.79:3000/graph`,/** IP for React client server */
            overlayId: overlayId,
        }
        window.SAGE2_AppState.callFunctionInContainer('requestMainGraph',packet);
    }

    render() {
        return (
            <>
                <div id="container" className="container-fluid">
                    <div id="mainContent" className="row" style={{ backgroundColor: "#101B2B", color: "white" }}>
                        <section id="midArea" className="col-10">
                            {this.renderOverlays()}
                        </section>
                    </div>

                </div>
            </>
        )
    }

}

export default Overlay;