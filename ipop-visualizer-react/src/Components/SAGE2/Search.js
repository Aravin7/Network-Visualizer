import React from 'react';
import { Typeahead } from 'react-bootstrap-typeahead';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import "../../CSS/SAGE2.css";

class Search extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            selected: [],
            element: []
        };
        window.searchComponent = this;
    }

    componentDidMount() {
        let value = {
            width: 851,
            height: 400,
            sage2w: 3840,
            sage2h: 2160,
        }
        window.SAGE2_AppState.callFunctionInContainer('setWindowSize', value);

        let message = {
            nameOfComponent: `searchComponent`,
            callback: `responeSearchOption`
        }
        window.SAGE2_AppState.callFunctionInContainer('sendDataToSearch', message);
    }

    responeSearchOption = (message) => {
        var element = [];
        if (Object.entries(message).length === 0 && message.constructor === Object) {
            this.setState({ element: element });
        }
        else {
            var promise = new Promise((resolve, reject) => {
                for (let i = 0; i < message.elements.nodes.length; i++) {
                    element.push(message.elements.nodes[i])
                }
                for (let i = 0; i < message.elements.edges.length; i++) {
                    element.push(message.elements.edges[i])
                }
                resolve(true);
            })

            promise.then(() => {
                this.setState({element: element});
            }).catch((error) => {
                console.log(`Error func responeSearchOption > ${error}`);
            })
        }
    }

    selectOption = (id) => {
        let packet = {
            nameOfComponent: `graphComponent`,
            callback: `handleSelectCyElement`,
            targetId: id,
            passfunc: `selectOption`,
        }
        window.SAGE2_AppState.callFunctionInContainer('sendSelectOption', packet);
    }

    render() {

        const customFilterBy = (option, props) => {
            if (option.group === 'nodes') {
                return (option.data.label.toLowerCase().indexOf(props.text.toLowerCase()) !== -1
                    ||
                    option.data.id.toLowerCase().indexOf(props.text.toLowerCase()) !== -1);
            }
            else {
                return (option.data.id.toLowerCase().indexOf(props.text.toLowerCase()) !== -1
                    ||
                    option.data.label.toLowerCase().indexOf(props.text.toLowerCase()) !== -1
                );
            }
        }


        return (
            <div id="searchPage">
                <Typeahead
                    {...this.state}
                    id='typeahead-search'
                    selectHintOnEnter
                    labelKey={(element) => {
                        if (element.group === 'nodes') {
                            return (`${element.data.label}`);
                        }
                        else {
                            return (`${element.data.label}`);
                        }
                    }}
                    maxResults={3}
                    filterBy={customFilterBy}
                    onChange={selected => {
                        try {
                            this.setState({ selected });
                            this.selectOption(selected[0].data.id);
                        } catch (e) {

                        }
                    }}
                    options={this.state.element}
                    placeholder="Search node or edge..."
                    renderMenuItemChildren={(option) => {
                        return (
                            <>
                                <div className="optionsLabel">
                                    {option.data.label}
                                </div>
                                <small>ID:{option.data.id}</small>
                            </>
                        )
                    }}
                />
            </div>
        )
    }

}

export default Search;