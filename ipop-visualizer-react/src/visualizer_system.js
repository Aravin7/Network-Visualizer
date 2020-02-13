/* initial variable */
const server_url = '/server_ip';
var intervalNo = new Date().toISOString().split(".")[0];
var serverIP;
var allowOrigin;
var url;
var isUpdate = false;
var allNodes;

/* request config from server */
var fetchData = function() {
    fetch(server_url).then(res => res.json())
        .then(data => {
            serverIP = data.server.ip;
            allowOrigin = data.server.allowOrigin; /* you need to allow origin to get data from outside server*/
            url = allowOrigin + 'http://' + serverIP + '/IPOP/overlays?interval=' + intervalNo + '&current_state=True';
        })
        .then(() => {
            $("#loading").show();
            showAllOverlays();
        })
        .catch(err => {
            alert(err);
        })
}

var showAllOverlays = function() {

    $.getJSON(url)
        .then(function(overlays, status) {
            if (status == "error") throw error;

            overlayIDList = Object.keys(overlays['current_state']);

            // create overlays container
            var overlays_content = $("<div id='overlays-content'></div>");
            $(".main-content").append(overlays_content);

            for (let index = 0; index < overlayIDList.length; index++) {

                // create overlay card
                var overlay_card = '<div id = "overlay-card-' + index + '" class="card overlay-card"><img class="card-img-top overlay-card-img" src="/static/icons/overlayIcon.svg" alt="overlay-icon"><span class="badge overlay-card-badge">' + overlayIDList[index] + '</span></div>'

                $("#overlays-content").append(overlay_card);

                $("#overlay-card-" + index).click(function() {
                    $("#overlay-name").html("Overlay : " + overlayIDList[index])
                    requestIPOPData(overlayIDList[index]);
                });

            }

            $("#loading").hide()

        }).catch(function(error) {
            alert(error);
        });

}

/* request data from server */
async function requestIPOPData(overlayID) {
    $("#overlays-content").remove();
    $("#loading").show();

    var nodeURL = allowOrigin + "http://" + serverIP + "/IPOP/overlays/" + overlayID + "/nodes?interval=" + intervalNo + "&current_state=True";
    var edgeURL = allowOrigin + "http://" + serverIP + "/IPOP/overlays/" + overlayID + "/links?interval=" + intervalNo + "&current_state=True";

    /* update graph*/
    if (isUpdate) {
        intervalNo = new Date().toISOString().split(".")[0];
        nodeURL = allowOrigin + "http://" + serverIP + "/IPOP/overlays/" + overlayID + "/nodes?interval=" + intervalNo + "&current_state=True";
        edgeURL = allowOrigin + "http://" + serverIP + "/IPOP/overlays/" + overlayID + "/links?interval=" + intervalNo + "&current_state=True";
        url = allowOrigin + 'http://' + serverIP + '/IPOP/overlays?interval=' + intervalNo + '&current_state=True'
    }

    $.getJSON(url)
        .then(function(overlays, status) {

            if (status == "error") throw error;

            $.getJSON(nodeURL).then(function(nodes) {
                // alert(JSON.stringify(nodes));
                $.getJSON(edgeURL).then(function(links) {

                    var ipopObj = new BuildIPOPData();
                    /* you can set data by another way */
                    /* in this case i just sleepy*/
                    ipopObj.setOverlayID(overlayID);
                    ipopObj.setOverlays(overlays['current_state'][overlayID]);
                    ipopObj.setLinks(links[overlayID]['current_state']);
                    ipopObj.setNodes(nodes[overlayID]['current_state']);

                    /* crate a graph on the website*/
                    createGraph(ipopObj);

                })
            })

        }).catch(function(error) {
            alert(error);
        });
}

/* create graph */
var createGraph = function(ipopObj) {
    let nodeList = [];
    let linkList = [];

    for (var i = 0; i < ipopObj.getNumNodes(); i++) {

        var nodeID = ipopObj.getNodeIDList()[i];
        var jsonStr = '{ "data": { "id": "' + nodeID + '" },"grabbable": true,"selectable": true}';
        var linkIDList = ipopObj.getLinkIDListOf(nodeID);

        /* build cytoscape node and link json */
        linkIDList.forEach((linkID) => {
            var tgtNodeID = ipopObj.getLinkListOf(nodeID)[linkID]["TgtNodeId"];
            var srcNodeID = ipopObj.getLinkListOf(nodeID)[linkID]["SrcNodeId"];

            if (ipopObj.getNodeIDList().includes(tgtNodeID)) {
                var linkStr = '{ "data": { "id": "' + linkID + '", "source": "' + srcNodeID + '", "target": "' + tgtNodeID + '" } }'
                linkList.push(JSON.parse(linkStr));
            }

        });
        nodeList.push(JSON.parse(jsonStr));
    }

    var nodes_content = $("<div id='nodes-content'></div>");
    $(".main-content").append(nodes_content);
    var graph_content = $("<div id='graph-content'></div>");
    // var details_content = $("<div id='details-content'></div>");
    $(".main-content").append(graph_content);
    // $(".main-content").append(details_content);
    $('#nodes-content').load("/static/views/nodes_page.html #icon-hud");
    // $('#details-content').load("/static/views/node_details.html #details");
    // if (!show_details) {
    //     $('#details').hide()
    // }


    /* this is object to create a graph */
    var cy = window.cy = cytoscape({
        container: document.getElementById('graph-content'),
        layout: { name: 'circle' },
        style: [{
                selector: 'node',
                style: {
                    width: 36.37,
                    height: 36.37,
                    "background-color": "#9FC556"
                }

            }, {
                selector: "node:selected",
                style: {
                    width: 36.37,
                    height: 36.37,
                    "border-width": "20",
                    "border-color": "#56C5BC",
                    "border-opacity": "0.3",
                    "background-color": "#9FC556"
                }
            },
            {
                selector: 'edge',
                style: {
                    'curve-style': 'haystack',
                    'z-index': "999999",
                    "line-color": "#56C5BC",
                }
            }, {
                selector: "edge:selected",
                style: {
                    'width': 10,
                    "line-color": "#56C5BC"
                }
            }
        ],

        elements: {
            nodes: nodeList,
            edges: linkList
        }
    });

    cy.minZoom(parseFloat($('#min-zoom-value option:selected').val()));
    cy.maxZoom(parseFloat($('#max-zoom-value option:selected').val()));
    cy.center(cy.$(".graph-content"));

    // node onclick event
    cy.on('click', 'node', function(evt) {
        // var node = evt.target;
        // alert('tapped ' + node.toISOString());
    });

    $("#loading").hide();


    // initial graph viewport rendering
    $('#graph-content').ready(function() {
        cy.minZoom(parseFloat($('#min-zoom-value option:selected').val()));
        cy.maxZoom(parseFloat($('#max-zoom-value option:selected').val()));
        $('#zoom-slider-bar').val(cy.zoom());

        $('#min-value').text("min-zoom :" + cy.minZoom());
        $('#max-value').text("max-zoom :" + cy.maxZoom());
        $('#zoom-value').text('value : ' + $('#zoom-slider-bar').val());
    });

    // zoom range event 
    $(document).on('input', '#zoom-slider-bar', function() {
        $('#zoom-value').text('value : ' + $('#zoom-slider-bar').val());
        cy.zoom(parseFloat($('#zoom-slider-bar').val()))
    });

    // refresh btn 
    $(document).on('click', '#refresh-btn', function() {
        cy.center();
    });

    // minimum zoom btn 
    $(document).on('change', "#min-zoom", function() {
        cy.minZoom(parseFloat($('#min-zoom-value option:selected').val()));
        $('#min-value').text("min-zoom :" + cy.minZoom());
        $('#zoom-slider-bar').attr('min', cy.minZoom());

    });

    // maximum zoom btn 
    $(document).on('change', "#max-zoom", function() {
        cy.maxZoom(parseFloat($('#max-zoom-value option:selected').val()));
        $('#max-value').text("max-zoom :" + cy.maxZoom());
        $('#zoom-slider-bar').attr('max', cy.maxZoom());
    });

    // $(document).on('change', "#sensitivity", function() {
    //     cy.maxZoom();
    //     $('#sen-value').text("sensitivity :" + $('#sensitivity-value option:selected').val());
    // });

    // zoom more btn 
    $(document).on('click', "#zoom-more-btn", function() {
        $('#zoom-slider-bar').val(parseFloat($('#zoom-slider-bar').val()) + parseFloat($('#zoom-slider-bar').attr('step')));
        cy.zoom(parseFloat($('#zoom-slider-bar').val()) + parseFloat($('#zoom-slider-bar').attr('step')));
        $('#zoom-value').text('value : ' + $('#zoom-slider-bar').val());
    });

    // zoom less btn 
    $(document).on('click', "#zoom-less-btn", function() {
        $('#zoom-slider-bar').val(parseFloat($('#zoom-slider-bar').val()) - parseFloat($('#zoom-slider-bar').attr('step')));
        cy.zoom(parseFloat($('#zoom-slider-bar').val()) - parseFloat($('#zoom-slider-bar').attr('step')));
        $('#zoom-value').text('value : ' + $('#zoom-slider-bar').val());
    });

    $(document).on('click', '.option-btn', function() {
        $('.collapse.show').collapse('hide');
    })

}

// run 
fetchData();