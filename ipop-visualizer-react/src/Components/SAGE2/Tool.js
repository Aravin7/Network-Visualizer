import React from 'react';
import Button from 'react-bootstrap/Button';
import overlay_ic from '../../Images/Icons/IconToolPage/Overlay.svg';
import refresh_ic from '../../Images/Icons/IconToolPage/Refresh.svg';
import search_ic from '../../Images/Icons/IconToolPage/Search.svg';
import info_ic from '../../Images/Icons/IconToolPage/Info.svg';
import rearrange_ic from '../../Images/Icons/IconToolPage/Rearrange.svg';
import "../../CSS/SAGE2.css";

class Tool extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isMulti: false,
        }
        window.toolComponent = this;
    }

    componentDidMount() {
        var packet = {
            width: 1000,
            height: 200
        }
        this.setWindowSize(packet)
    }

    handleOnClick = (target) => {
        switch (target) {
            case 'overlay':
                window.open('http://150.29.149.79:3000/overlay'); /* IP for direct to React client server.*/
                break;
            case 'search':
                var packet = {
                    name: 'Search',
                    data: {
                        url: 'http://150.29.149.79:3000/search', /* IP for direct to React client server.*/
                        appName: 'search',
                    }
                }
                window.SAGE2_AppState.callFunctionInContainer('open', packet);
                break;
            case 'multi':
                this.setState((prevState) => {
                    return { isMulti: !prevState.isMulti }
                }, () => {
                    var packet = {
                        name: 'MultiWindowState',
                        data: this.state.isMulti,
                    }
                    window.SAGE2_AppState.callFunctionInContainer('set', packet);
                })
                break;
            case 'info' :
            var packet = {
                name: `Info`,
                data: {
                    appName: `Legend`,
                    url: `http://150.29.149.79:3000/info`,
                    appId: `info`
                }
            }
            window.SAGE2_AppState.callFunctionInContainer(`open`,packet);
            break;
        }
    }

    setWindowSize = (size) => {
        var packet = {
            width: size.width,
            height: size.height,
        }
        window.SAGE2_AppState.callFunctionInContainer('setWindowSize', packet);
    }



    render() {
        return (
            <div className='ToolPage'>
                <Button type="button" variant="link" className="" onClick={(e) => this.handleOnClick('overlay')}><img src={overlay_ic} alt="overlay_ic" /></Button>
                <Button type="button" variant="link" className=""><img src={refresh_ic} alt="refresh_ic" /></Button>
                <Button type="button" variant="link" className="" onClick={(e) => this.handleOnClick('search')}><img src={search_ic} alt="search_ic" /></Button>
                <Button type="button" variant="link" className="" onClick={(e) => this.handleOnClick('info')}><img src={info_ic} alt="info_ic" /></Button>
                <Button type="button" variant="link" className=""><img src={rearrange_ic} alt="rearrange_ic" /></Button>
                <Button variant="primary" onClick={(e) => this.handleOnClick('multi')}>{this.state.isMulti ? 'Multi-Window:ON' : 'Multi-Window:OFF'}</Button>
            </div>
        )
    }

}

export default Tool;
