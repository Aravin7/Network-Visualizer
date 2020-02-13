import React from 'react';
import ipop_ic from '../../Images/Icons/ipop_ic.svg';
import Form from 'react-bootstrap/Form';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown';


class Header extends React.Component {

    render() {
        return (<div className="Header">
            <div className="ipop_logo">
                <img src={ipop_ic} alt="ipop_ic"></img>
            </div>
            <div className="IPOPTitle">
                IPOP NETWORK VISUALIZER
            </div>
            <div className="ViewSelector">
                <DropdownButton id="ViewSelectorDropdown" drop="right" title="Topology">
                    <Dropdown.Item href="#" >Topology</Dropdown.Item>
                    <Dropdown.Item href="#">Subgraph</Dropdown.Item>
                    <Dropdown.Item href="#">Map</Dropdown.Item>
                    <Dropdown.Item href="#">Log</Dropdown.Item>
                    <Dropdown.Item href="#">Tunnel Utilization</Dropdown.Item>
                    <Dropdown.Item href="#">Network Flow</Dropdown.Item>
                </DropdownButton>
            </div>
            <div className="Search">
                <Form.Control type="Search" placeholder="Search..." />
            </div>
        </div>
        )
    }
}

export default Header;