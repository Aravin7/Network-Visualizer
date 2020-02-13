import React from 'react';

class RightPane extends React.Component{
    render(){
        return(<div className="RightPane">{this.props.children}</div>)
    }
}

export default RightPane;