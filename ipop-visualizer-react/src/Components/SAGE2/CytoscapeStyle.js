var CytoscapeStyle = [
    {
        selector: 'node',
        style: {
            width: "100%",
            height: "100%",
            "background-color": "#9FC556",
            "label": "data(label)",
            "text-valign": "center",
            "text-outline-color": "#9FC556",
            "text-outline-width": "4%",
            "font-size": "40px",
            "color": "#111",
            // "text-"

        }

    }, {
        selector: "node.selected",
        style: {
            width: "100%",
            height: "100%",
            "border-width": "50%",
            "border-color": "white",
            "border-opacity": "0.2",
            "background-color": "#9FC556"
        }
    },
    {
        selector: 'edge',
        style: {
            width:8,
            'curve-style': 'haystack',
            //"line-color": "#56C5BC",
            "line-color": `data(color)`,
            
        }
    }, {
        selector: "edge.selected",
        style: {
            "line-color": "white",
        }
    }, {
        selector: 'node.transparent',
        style: {
            'opacity': '0.2',
        }
    },
    {
        selector: 'edge.transparent',
        style: {
            'opacity': '0.2',
        }
    },
    {
        selector: 'node.Subgraph',
        style: {
            'display':'none',
        }
    },
    {
        selector: 'edge.Subgraph',
        style: {
            'display': 'none',
        }
    }
]

export default CytoscapeStyle;