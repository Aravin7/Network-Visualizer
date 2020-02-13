import React from 'react';
import Button from 'react-bootstrap/Button';
import overlay_ic from '../../Images/Icons/IconToolPage/Overlay.svg';
import refresh_ic from '../../Images/Icons/IconToolPage/Refresh.svg';
import search_ic from '../../Images/Icons/IconToolPage/Search.svg';
import info_ic from '../../Images/Icons/IconToolPage/Info.svg';
import rearrange_ic from '../../Images/Icons/IconToolPage/Rearrange.svg';

class Tool extends React.Component {
    constructor(props) {
        super(props);
        window.toolComponent = this;
    }

    componentDidMount() {
        let value = {
            width: 851,
            height: 200
        }
        window.SAGE2_AppState.callFunctionInContainer('setWindowSize', value);
    }

    handleOnClick = (target) => {
        switch (target) {
            case 'overlay':
                window.open('http://150.29.149.79:3000/overlay'); /* IP for direct to React client server.*/
                break;
            case 'search':
                let packet = {
                    name: 'Search',
                    data: {
                        url: 'http://150.29.149.79:3000/search', /* IP for direct to React client server.*/
                        appName: 'search',
                    }
                }
                window.SAGE2_AppState.callFunctionInContainer('open', packet);
                break;
        }
    }

    render() {
        return (
            <div className='ToolPage' style={{ backgroundColor: "#101B2B", color: "white" }}>
                <Button type="button" variant="link" className="" onClick={(e) => this.handleOnClick('overlay')}><img src={overlay_ic} alt="overlay_ic" /></Button>
                <Button type="button" variant="link" className=""><img src={refresh_ic} alt="refresh_ic" /></Button>
                <Button type="button" variant="link" className="" onClick={(e) => this.handleOnClick('search')}><img src={search_ic} alt="search_ic" /></Button>
                <Button type="button" variant="link" className=""><img src={info_ic} alt="info_ic" /></Button>
                <Button type="button" variant="link" className=""><img src={rearrange_ic} alt="rearrange_ic" /></Button>
            </div>
        )
    }

}

export default Tool;
