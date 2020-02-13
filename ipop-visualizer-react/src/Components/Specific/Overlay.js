import React from 'react';
import overlay_ic from '../../Images/Icons/overlay_ic.svg';
import Button from 'react-bootstrap/Button';

class Overlay extends React.Component {
    
    render() {
        return (<Button onClick={this.props.onclick} type="button" variant="link" className="Overlay">
            <img className="overlay_ic" src={overlay_ic} alt="overlay_ic" />
            <div className="OverlayID">{this.props.children}</div>
        </Button>)
    }
}

export default Overlay;