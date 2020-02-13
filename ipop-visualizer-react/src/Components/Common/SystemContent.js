import React from 'react';
import testData from '../../TestData/testData.json'
import Overlay from '../Specific/Overlay';
import RightPane from '../Common/RightPane.js';
import Button from 'react-bootstrap/Button';
import NodeGraph from '../Specific/NodeGraph.js';

class SystemContent extends React.Component {

    constructor(props) {
        super(props);
        this.state = { selectedOverlay: true, overlays: Object.keys(testData.Overlays) }
    }

    handleOnclick = ()=> {
        this.setState({ selectedOverlay: true });
    }

    setContent = (isSelected)=> {
        if (isSelected !== true) {
            return <div>
                {this.state.overlays.map(overlay => <Overlay onclick={this.handleOnclick} key={overlay}>{overlay}</Overlay>)}
                <div className="overlays_pane">
                    <RightPane>
                        <div>Overlays List</div>
                        {this.state.overlays.map(overlay => <Button className="OverlayBtn" key={overlay}>{overlay}</Button>)}
                    </RightPane>
                </div>
            </div>
                ;
        } else {
            return <NodeGraph overlay={testData.Overlays[this.state.overlays[0]]} nodes={testData.Nodes[this.state.overlays[0]]} links={testData.Links[this.state.overlays[0]]} />;
        }
    }

    render() {
        return (<div className="SystemContent">{this.setContent(this.state.selectedOverlay)}</div>)
    }
}

export default SystemContent;