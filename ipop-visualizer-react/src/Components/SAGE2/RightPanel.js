  
import React from "react";

class RightPanel extends React.Component {
    render() {
        return <section id="rightPanel">
            <h1 className={this.props.rightPanelTopic}>{this.props.rightPanelTopic}</h1>
            <div id="rightPanelContent">{this.props.children}</div>
        </section>
    }
}

export default RightPanel;