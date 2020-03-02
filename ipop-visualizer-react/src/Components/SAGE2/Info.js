import React from "react";
import ReactDOM from "react-dom";
/** Info */
import Popover from "react-bootstrap/Popover";
import connected_ic from "../../Images/Icons/IconInfo/connected_ic.svg"
import no_tunnel_ic from "../../Images/Icons/IconInfo/no_tunnel_ic.svg"
import not_reporting_ic from "../../Images/Icons/IconInfo/not_reporting_ic.svg"
import longdistance_ic from "../../Images/Icons/IconInfo/longdistance_ic.svg"
import ondemand_ic from "../../Images/Icons/IconInfo/ondemand_ic.svg"
import static_ic from "../../Images/Icons/IconInfo/static_ic.svg"
import successor_ic from "../../Images/Icons/IconInfo/successor_ic.svg"
/** */

class Info extends React.Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        var packet = {
            width: 700,
            height: 500,
            sage2w: 3840,
            sage2h: 2160,
        }
        window.SAGE2_AppState.callFunctionInContainer('setWindowSize', packet);
    }

    render() {
        return (
            <table className='info'>
                <thead>
                    <tr>
                        <th colSpan={2}>Node</th>
                        <th colSpan={2}>Tunnel</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style={{ width: "5%" }}><img className="node_img" src={connected_ic} alt="connected_node" /></td>
                        <td>Connected</td>
                        <td style={{ width: "10%" }}><img className="tunnel_img" src={longdistance_ic} alt="longdistance_tunnel" /></td>
                        <td>Long Distance</td>
                    </tr>
                    <tr>
                        <td style={{ width: "5%" }}><img className="node_img" src={not_reporting_ic} alt="not_reporting_node" /></td>
                        <td>Not Reporting</td>
                        <td style={{ width: "10%" }}><img className="tunnel_img" src={ondemand_ic} alt="ondemand_tunnel" /></td>
                        <td>On Demand</td>
                    </tr>
                    <tr>
                        <td style={{ width: "5%" }}><img className="node_img" src={no_tunnel_ic} alt="no_tunnel_node" /></td>
                        <td>No Tunnels</td>
                        <td style={{ width: "10%" }}><img className="tunnel_img" src={static_ic} alt="static_tunnel" /></td>
                        <td>Static</td>
                    </tr>
                    <tr>
                        <td ></td>
                        <td></td>
                        <td style={{ width: "10%" }}><img className="tunnel_img" src={successor_ic} alt="successor_tnnel" /></td>
                        <td>Successor</td>
                    </tr>
                </tbody>
            </table>

        )
    }
}

export default Info;