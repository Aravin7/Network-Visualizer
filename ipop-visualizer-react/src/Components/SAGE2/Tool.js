import React from 'react';
import Button from 'react-bootstrap/Button';
import overlay_ic from '../../Images/Icons/IconToolPage/Overlay.svg';
import refresh_ic from '../../Images/Icons/IconToolPage/Refresh.svg';
import search_ic from '../../Images/Icons/IconToolPage/Search.svg';
import info_ic from '../../Images/Icons/IconToolPage/Info.svg';
import rearrange_ic from '../../Images/Icons/IconToolPage/Rearrange.svg';
import map_view_ic from '../../Images/Icons/IconToolPage/map_view_ic.svg';
import multi_ic from '../../Images/Icons/IconToolPage/multi_ic.svg';
import single_ic from '../../Images/Icons/IconToolPage/single_ic.svg';
import "../../CSS/SAGE2.css";
import Config from "../../Config/config";

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
            width: 1200,
            height: 200,
            sage2w: 3840,
            sage2h: 2160,
        }
        this.setWindowSize(packet)
    }

    handleOnClick = (target) => {
        switch (target) {
            case 'overlay':
                //window.open('http://150.29.149.79:3000/overlay'); /* IP for direct to React client server.*/
                window.open(`${Config.React.perfix}${Config.React.ip}:${Config.React.port}/overlay`)
                break;
            case 'search':
                var packet = {
                    name: 'Search',
                    data: {
                        //url: 'http://150.29.149.79:3000/search', /* IP for direct to React client server.*/
                        url: `${Config.React.perfix}${Config.React.ip}:${Config.React.port}/search`,
                        appName: 'search',
                        appId: `search`,
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
            case 'info':
                var packet = {
                    name: `Info`,
                    data: {
                        appName: `Legend`,
                        //url: `http://150.29.149.79:3000/info`, /* IP for direct to React client server.*/
                        url: `${Config.React.perfix}${Config.React.ip}:${Config.React.port}/info`,
                        appId: `info`
                    }
                }
                window.SAGE2_AppState.callFunctionInContainer(`open`, packet);
                break;
            case 'map':
                var packet = {
                    name: 'MapView',
                    data: {
                        appName: `Map`,
                        //url: `http://150.29.149.79:3000/map`, /* IP for direct to React client server.*/
                        url: `${Config.React.perfix}${Config.React.ip}:${Config.React.port}/map`,
                        appId: `map`
                    }
                }
                window.SAGE2_AppState.callFunctionInContainer(`open`, packet);
                break;
            case 'reposition':
                window.SAGE2_AppState.callFunctionInContainer(`reposition`, {});
            break;
            case 'refresh':
                window.SAGE2_AppState.callFunctionInContainer(`refreshGraph`, {});
            break;
        }
    }

    setWindowSize = (size) => {
        var packet = {
            width: size.width,
            height: size.height,
            // sage2w: size.sage2w,
            // sage2h: size.sage2h,
        }
        window.SAGE2_AppState.callFunctionInContainer('setWindowSize', packet);
    }



    render() {
        return (
            <div className='ToolPage'>
                <Button type="button" variant="link" className="" onClick={(e) => this.handleOnClick('overlay')}><img src={overlay_ic} alt="overlay_ic" /></Button>
                <Button type="button" variant="link" className="" onClick={(e) => this.handleOnClick('refresh')}><img src={refresh_ic} alt="refresh_ic" /></Button>
                <Button type="button" variant="link" className="" onClick={(e) => this.handleOnClick('search')}><img src={search_ic} alt="search_ic" /></Button>
                <Button type="button" variant="link" className="" onClick={(e) => this.handleOnClick('info')}><img src={info_ic} alt="info_ic" /></Button>
                <Button type="button" variant="link" className="" onClick={(e) => this.handleOnClick('reposition')}><img src={rearrange_ic} alt="rearrange_ic" /></Button>
                <Button type="button" variant="link" className="" onClick={(e) => this.handleOnClick('multi')}><img src={this.state.isMulti ? multi_ic : single_ic} alt="multi_ic" /></Button>
                <Button type="button" variant="link" className="" onClick={(e) => this.handleOnClick('map')}><img src={map_view_ic} alt="map_view_ic" /></Button>
            </div>
        )
    }

}

export default Tool;
