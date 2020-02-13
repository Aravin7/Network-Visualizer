import React from 'react';
import { Typeahead } from 'react-bootstrap-typeahead';
import 'react-bootstrap-typeahead/css/Typeahead.css';

const element = [];

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
        let message = {
            nameOfComponent: `searchComponent`,
            callback: `responeSearchOption`
        }
        window.SAGE2_AppState.callFunctionInContainer('sendDataToSearch', message);
    }

    responeSearchOption = (message) => {
        //console.log(`options:${JSON.stringify(message)}`)
        if (Object.entries(message).length === 0 && message.constructor === Object) {
            //Do Nothing
        }
        else {
            for (let i = 0; i < message.elements.nodes.length; i++) {
                element.push(message.elements.nodes[i])
            }
            for (let i = 0; i < message.elements.edges.length; i++) {
                element.push(message.elements.edges[i])
            }
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
                return (option.data.id.toLowerCase().indexOf(props.text.toLowerCase()) !== -1);
            }
        }


        return (
            <Typeahead
                {...this.state}
                id='typeahead-search'
                selectHintOnEnter
                labelKey={(element) => {
                    if (element.group === 'nodes') {
                        return (`${element.data.label}`);
                    }
                    else {
                        return (`${element.data.id}`);
                    }
                }}
                maxResults={5}
                filterBy={customFilterBy}
                onChange={selected => {
                    try {
                        this.setState({ selected });
                        //console.log(selected[0].data.id);
                        this.selectOption(selected[0].data.id);
                    } catch (e) {

                    }
                }}
                options={element}
                placeholder="search here"
                renderMenuItemChildren={(option) => {
                    return (
                        <>
                            <div>
                                {option.data.label}
                            </div>
                            <small>ID:{option.data.id}</small>
                        </>
                    )
                }}
            />
        )
    }

}

export default Search;