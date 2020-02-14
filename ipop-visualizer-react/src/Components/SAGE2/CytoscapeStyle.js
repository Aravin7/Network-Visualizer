var CytoscapeStyle = [
    {
        selector: 'node',
        style: {
            width: 36.37,
            height: 36.37,
            "background-color": "#9FC556",
            "label": "data(label)",
            "text-valign": "center",
            "text-outline-color": "#9FC556",
            "text-outline-width": "5%",
            "text-outline-opacity": "1",
        }

    }, {
        selector: "node.selected",
        style: {
            width: 36.37,
            height: 36.37,
            "border-width": "50%",
            "border-color": "white",
            "border-opacity": "0.2",
            "background-color": "#9FC556"
        }
    },
    {
        selector: 'edge',
        style: {
            'curve-style': 'haystack',
            "line-color": "#56C5BC",
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
]

export default CytoscapeStyle;