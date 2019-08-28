/* initial variable */
const server_url = '/server_ip';
var intervalNo = new Date().toISOString().split(".")[0];
var serverIP;
var allowOrigin;
var url;
var isUpdate = false;
var allNodes;



/* request config from server */
fetch(server_url).then(res => res.json())
    .then(data => {
        serverIP = data.server.ip;
        allowOrigin = data.server.allowOrigin; /* you need to allow origin to get data from outside server*/
        url = allowOrigin + 'http://' + serverIP + '/IPOP/overlays?interval=' + intervalNo + '&current_state=True';
    })
    .then(() => {
        showAllOverlays();
    })
    .catch(err => {
        alert(err);
    })

var showAllOverlays = function () {

    $.getJSON(url)
        .then(function (overlays, status) {
            if (status == "error") throw error;
            overlayIDList = Object.keys(overlays['current_state']);

            $("#loader").hide();
            for (let index = 0; index < overlayIDList.length; index++) {

                var html = '<div class="col-md-3"  style="z-index: 9999999999;" ><div class="container" style="width: 210px;height: 200px;padding: 5;"><input id="layer-btn' + index + '" type="image"  src="/static/icons/overlayIcon.svg" style=" width:200 ;height:150;outline:none"><a href="#" class="btn card-layer" style="background-color: #213758;border: 3px solid #405b80;">' + overlayIDList[index] + '</a></div></div>';
                $("#groupOfOverlays").append(html);

                $(document).ready(function () {
                    $("#layer-btn" + index).click(function () {
                        requestIPOPData(overlayIDList[index]);
                    });
                });
            }
        }).catch(function (error) {
            alert(error);
        });
}


/* request data from server */
async function requestIPOPData(overlayID) {


    $("#groupOfOverlays").hide();
    $(".cloudBtn").hide();
    $("#loader").show();
    $("#cy").empty();

    var nodeURL = allowOrigin + "http://" + serverIP + "/IPOP/overlays/" + overlayID + "/nodes?interval=" + intervalNo + "&current_state=True";
    var edgeURL = allowOrigin + "http://" + serverIP + "/IPOP/overlays/" + overlayID + "/links?interval=" + intervalNo + "&current_state=True";

    /* update graph*/
    if (isUpdate) {
        intervalNo = new Date().toISOString().split(".")[0];
        nodeURL = allowOrigin + "http://" + serverIP + "/IPOP/overlays/" + overlayID + "/nodes?interval=" + intervalNo + "&current_state=True";
        edgeURL = allowOrigin + "http://" + serverIP + "/IPOP/overlays/" + overlayID + "/links?interval=" + intervalNo + "&current_state=True";
        url = allowOrigin + 'http://' + serverIP + '/IPOP/overlays?interval=' + intervalNo + '&current_state=True'
    }

    /*************OLD SYSTEM*************/
    // let query;
    // await $.get(`/ipopData?${query}`, overlays => {

    //     var ipopObj = new BuildIPOPData();
    //     /* you can set data by another way */
    //     /* in this case i just sleepy*/

    //     ipopObj.setOverlayID(overlayID);
    //     ipopObj.setOverlays(overlays.ipop['Overlays'][overlayID]);
    //     ipopObj.setLinks(overlays.ipop['Links'][overlayID]);
    //     ipopObj.setNodes(overlays.ipop['Nodes'][overlayID]);

    //     /* show overlay ID on overlay's tag */
    //     $(document).ready(function () {
    //         $("#overlayShowUp").load("/icons.html", function (responseTxt, statusTxt, xhr) {
    //             if (statusTxt == "success") {
    //                 $('.overlayTag').show();
    //                 $('#overLayID').html('Overlay: <strong>' + overlayID + '</strong>');
    //                 $('#travel').hide();
    //                 $('.minus').show();
    //                 $('.zoom').show();
    //                 $('.info').show();

    //             } else {
    //                 alert("Error: " + xhr.status + ": " + xhr.statusText);
    //             }
    //         });
    //     });

    //     createGraph(ipopObj);
    // });
    /********END OF OLD SYSTEM*********/

    $.getJSON(url)
        .then(function (overlays, status) {
            if (status == "error") throw error;
            $.getJSON(nodeURL).then(function (nodes) {
                $.getJSON(edgeURL).then(function (links) {

                    var ipopObj = new BuildIPOPData();
                    /* you can set data by another way */
                    /* in this case i just sleepy*/
                    ipopObj.setOverlayID(overlayID);
                    ipopObj.setOverlays(overlays['current_state'][overlayID]);
                    ipopObj.setLinks(links[overlayID]['current_state']);
                    ipopObj.setNodes(nodes[overlayID]['current_state']);


                    /* show overlay ID on overlay's tag */
                    $(document).ready(function () {
                        $("#overlayShowUp").load("/icons.html", function (responseTxt, statusTxt, xhr) {
                            if (statusTxt == "success") {
                                $('.overlayTag').show();
                                $('#overLayID').html('Overlay: <strong>' + overlayID + '</strong>');
                                $('#travel').hide();
                                $('.minus').show();
                                $('.zoom').show();
                                $('.info').show();

                                $("#refresh").click(function () {
                                    updateGraph(ipopObj.getOverlayID())
                                });
                                setTimeout(updateGraph, 3600000, ipopObj.getOverlayID());

                            } else {
                                alert("Error: " + xhr.status + ": " + xhr.statusText);
                            }
                        });
                    });

                    /* crate a graph on the website*/
                    createGraph(ipopObj);

                })
            })
        }).catch(function (error) {
            alert(error);
        });
}


// requestIPOPData("101000F") /* test when vm is down */
/*showAllOverlays();*/

/* create graph */
var createGraph = function (ipopObj) {

    let nodeList = [];
    let linkList = [];
    for (var i = 0; i < ipopObj.getNumNodes(); i++) {

        var nodeID = ipopObj.getNodeIDList()[i];
        var nodeName = ipopObj.getNodeList()[nodeID]['NodeName'];
        var jsonStr = '{ "data": { "id": "' + nodeID + '", "name": "' + nodeName + '" },"grabbable": false,"selectable": true}';
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


    /* this is object to create a graph */
    var cy = window.cy = cytoscape({
        container: document.getElementById('cy'),
        style: [
            {
                selector: 'node',
                style: {
                    // 'content': 'data(id)'
                    width: 36.37,
                    height: 36.37,
                    "background-color": "#9FC556"
                }

            }, {
                selector: "node:selected",
                style: {
                    width: 36.37,
                    height: 36.37,
                    "border-width": "72.67",
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

    /* wait loading graph */
    var layout = cy.layout({ name: 'circle' });
    layout.pon('layoutstop').then(function (event) {
        $("#loader").hide();
    });
    layout.run();
    /******************************/


    var allowTobuildTippy = true;
    var buildTippyCondition = ipopObj.getNumNodes() > 50;

    /* check condition */
    if (buildTippyCondition) {
        allowTobuildTippy = false;
    }

    /* build Tippy*/
    var tippyList = makeTippyAllNode(ipopObj, cy, allowTobuildTippy);

    /* zoom and show tippy event */
    if (buildTippyCondition) {
        cy.on('zoom', function (e) {
            // console.log(e.target._private.zoom);
            $(".tippy-popper").remove();
            if (e.target._private.zoom > 0.98) {
                tippyList = makeTippyAllNode(ipopObj, cy, true);
            }
        });
    }

    /* handdling any event when user mouseover on node */
    mouseOverEvent(ipopObj, cy);

    /* handdling any event when user click element on graph */
    clickEvent(ipopObj, cy, tippyList);

    isUpdate = true;

    allNodes = cy.nodes();

/* for see all nodes data */
}


/* the event when you click on web page */
var clickEvent = function (ipopObj, cy, tippyList) {
    var tippyID = null;
    var nodeIdTippy = null;
    var isClicked = true;
    cy.on('click', function (event) {

        if (event.target !== cy) {
            let objID = event.target.id();

            if (!ipopObj.getNodeIDList().includes(objID)) {

                /* event of edge */

                restageEvent(tippyID, nodeIdTippy, tippyList);

                let sourceID = cy.edges('[id = "' + objID + '"]').data("source");
                let targetID = cy.edges('[id = "' + objID + '"]').data("target");
                let nodeI = cy.getElementById(objID);
                tippyID = makeTippy(nodeI, objID.substr(0, 7), "right", false, 'edge');
                tippyID.show();


                $('#travel').show();
                $('#overLayBox').hide();
                $("#overlayIDIntravel").html('Overlay: <strong>' + ipopObj.getOverlayID() + '</strong>');
                $("#inTravel").html('Link: <strong>' + objID.substr(0, 7) + '</strong>');
                $("#detail").html("");


                /* select edge to show node is connected by the edge */
                edgeSelect(cy, objID, sourceID, targetID);


                /* show edge's detail */
                $(document).ready(function () {
                    $("#edgeDetail").load("/edge_detail.html", function (responseTxt, statusTxt, xhr) {

                        if (statusTxt == "success") {
                            $("#edgeDetail").show();
                            $("#edgeName").html(objID.substr(0, 7));
                            $("#sourceNode").html("");
                            $("#targetNode").html("");
                            $("#edgDet").html("");


                            addSorceNodeData(ipopObj, sourceID);
                            addTargetNodeData(ipopObj, targetID);
                            addLinkData(ipopObj, sourceID, objID);


                            $(document).ready(function () {
                                $("#cross").click(function () {
                                    location.reload();
                                    $("#edgeDetail").hide();
                                });

                                $("#swap-icon").click(function () {

                                    if (isClicked) {
                                        $("#sourceNode").html("");
                                        $("#targetNode").html("");
                                        $("#edgDet").html("");
                                        addSorceNodeData(ipopObj, targetID);
                                        addTargetNodeData(ipopObj, sourceID);
                                        addLinkData(ipopObj, targetID, objID);
                                        isClicked = false;
                                    } else {
                                        $("#sourceNode").html("");
                                        $("#targetNode").html("");
                                        $("#edgDet").html("");
                                        addSorceNodeData(ipopObj, sourceID);
                                        addTargetNodeData(ipopObj, targetID);
                                        addLinkData(ipopObj, sourceID, objID);
                                        isClicked = true;
                                    }

                                });
                            });

                        } else {
                            alert("Error: " + xhr.status + ": " + xhr.statusText);
                        }
                    });
                });

            } else {
            /* Event of  node  */

                let nodeName = ipopObj.getNodeList()[objID]["NodeName"];


                $('#travel').show();
                $('#overLayBox').hide();
                $("#overlayIDIntravel").html('Overlay: <strong>' + ipopObj.getOverlayID() + '</strong>');
                $("#inTravel").html('Node: <strong>' + nodeName + '</strong>');

                cy.style().selector('node').style({ width: 36.37, height: 36.37, "background-color": "#9FC556" }).update();
                cy.style().selector('edge').style({ 'curve-style': 'haystack', 'line-color': '#56C5BC', 'z-index': "999999" }).update();
                restageEvent(tippyID, nodeIdTippy, tippyList);

                nodeIdTippy = objID;
                tippyList[nodeIdTippy].set({ theme: 'edge' });

                nodeSelect(cy, objID, ipopObj);     /* select node to show the node that it connect */


                $(document).ready(function () {
                    $("#edgeDetail").html("");
                    $("#detail").load("/detail.html", function (responseTxt, statusTxt, xhr) {

                        if (statusTxt == "success") {
                            $("#detail").show();

                            currentNodeDataAdding(nodeName, objID);
                            ortherNodeDataAdding(ipopObj, objID);

                            $(document).ready(function () {
                                $("#cross").click(function () {
                                    location.reload();
                                    $("#detail").hide();
                                });
                            });

                        } else {
                            alert("Error: " + xhr.status + ": " + xhr.statusText);
                        }
                    });
                });
            }
        } else {

            /* if user click on each part that not graph */
            restageEvent(tippyID, nodeIdTippy, tippyList);
            cy.style().selector('node').style({ width: 36.37, height: 36.37, "background-color": "#9FC556" }).update();
            cy.style().selector('edge').style({ 'curve-style': 'haystack', 'line-color': '#56C5BC', 'z-index': "999999" }).update();

            $('#travel').hide();
            $('#overLayBox').show();
            $("#detail").html("");
            $("#edgeDetail").html("");

        }
    });
}

/* the event when you mouse Over on node in web page*/
var mouseOverEvent = function (ipopObj, cy) {
    var nodeDataTippy = null;

    cy.on('mouseover', 'node', function (event) {

        let nodeID = event.target.id();
        let content1 = ' <div class="inner"  style="margin: auto;text-align:left;">';
        let lineContent = '<hr style="border-color:#405B80;margin-top: -6px;margin-bottom: 6px">';
        let topicList = ['Node ID', '# of lncident Edges'];
        let dataList = [];
        // let ipv4 = ipopObj.getNodeList()[nodeID]["IP4"];

        var tgtLinkCount = 0;
        ipopObj.getLinkIDListOf(nodeID).forEach((linkID) => {
            var tgtNodeID = ipopObj.getLinkListOf(nodeID)[linkID]["TgtNodeId"];
            if (ipopObj.getNodeIDList().includes(tgtNodeID)) {
                tgtLinkCount++;
            }
        });

        dataList.push('<p class="data">' + nodeID.substr(0, 7) + '</p>');
        dataList.push('<p class="data">' + tgtLinkCount + '</p>');
        dataList.push('<p class="data">' + '-' + '</p>');

        htmlContent = "";
        let index = 0;
        topicList.forEach((content => {
            htmlContent = htmlContent + '<p class="topic">' + content + '</p>';
            htmlContent = htmlContent + dataList[index];
            index++;

            if (index != topicList.length) {
                htmlContent = htmlContent + lineContent;
            }
        }))

        $("#hoverDetail").html(content1 + htmlContent + '</div>');


        if (nodeDataTippy == null) {
            nodeDataTippy = makeTippyNodeData(cy.getElementById(event.target.id()), 'nodeData', $("#hoverDetail").html());
        } else {
            nodeDataTippy.destroy();
            nodeDataTippy = makeTippyNodeData(cy.getElementById(event.target.id()), 'nodeData', $("#hoverDetail").html());
        }
        nodeDataTippy.show();

        $("#hoverDetail").html("");
    });

    cy.on('mouseout', 'node', function () {
        if (nodeDataTippy != null) {
            nodeDataTippy.destroy();
            nodeDataTippy = null;
        }
    });
}

/*  update graph on visualizer */
var updateGraph = function (overlaysID) {

    $(".tippy-popper").remove();

    requestIPOPData(overlaysID);
}

/* draw color when select node */
var nodeSelect = function (cy, objID, ipopObj) {
    cy.style().selector('node').style({ width: 20, height: 20, 'background-color': '#4B6483' }).update();
    cy.style().selector('edge').style({ 'curve-style': 'haystack', 'line-color': '#4B6483', 'z-index': "0" }).update();
    cy.style().selector('node[id=\"' + objID + '\"]').style({ width: 36.37, height: 36.37, "background-color": "#9FC556" }).update();

    ipopObj.getLinkIDListOf(objID).forEach((linkID) => {
        tID = cy.edges('[id = "' + linkID + '"]').data("target");
        if (tID == objID) {
            tID = cy.edges('[id = "' + linkID + '"]').data("source");
        }
        cy.style().selector('node[id=\"' + tID + '\"]').style({ width: 36.37, height: 36.37, "background-color": "#9FC556" }).update();
        cy.style().selector('edge[id=\"' + linkID + '\"]').style({ 'curve-style': 'haystack', 'line-color': '#56C5BC', 'z-index': "999999999" }).update();
    })

};


/* draw color when select edge */
var edgeSelect = function (cy, objID, sourceID, targetID) {
    cy.style().selector('node').style({ width: 20, height: 20, 'background-color': '#4B6483' }).update();
    cy.style().selector('edge').style({ 'curve-style': 'haystack', 'line-color': '#4B6483', 'z-index': "0" }).update();
    cy.style().selector('node[id=\"' + sourceID + '\"]').style({ width: 36.37, height: 36.37, "background-color": "#9FC556" }).update();
    cy.style().selector('node[id=\"' + targetID + '\"]').style({ width: 36.37, height: 36.37, "background-color": "#9FC556" }).update();
    cy.style().selector('edge[id=\"' + objID + '\"]').style({ 'curve-style': 'haystack', 'line-color': '#56C5BC', 'z-index': "999999" }).update();
};

/*******************************************************This 3 function you can refactor it to be only 1 function ****************************************************************************** */
/* function for make all node base on makeTippy*/
var makeTippyAllNode = function (ipopObj, cy, allowTobuildTippy) {
    var count = 1;
    var placement = 'right';
    var tippyList = {};
    var tippyID;

    /* this is a code for set tippy position on web page*/
    ipopObj.getNodeIDList().forEach((nodeID) => {

        var halfOflist = Math.ceil(ipopObj.getNodeIDList().length / 2) + 1;
        if (count == 1) {
            placement = 'top';
        } else if (count == halfOflist) {
            placement = 'left';    // actully it should be bottom
        } else if (count > halfOflist) {
            placement = 'left';
        } else {
            placement = 'right';
        }

        let nodeName = ipopObj.getNodeList()[nodeID]["NodeName"];
        let nodeI = cy.getElementById(nodeID);
        tippyID = makeTippy(nodeI, nodeName, placement, false, 'node');
        tippyList[nodeID] = tippyID;


        /* fucntion to show tippy if you delete or comment that tippy will be gone*/
        if (allowTobuildTippy) {
            tippyID.show();
        }


        count++;
    });


    return tippyList;
}


/* tippy is description when you hover node or edge */
var makeTippy = function (node, text, placement, isHide, theme) {
    return tippy(node.popperRef(), {
        content: function () {
            var div = document.createElement('div');
            div.innerHTML = text;
            div.style.cssText = '';
            return div;
        },
        trigger: 'manual',
        arrow: true,
        placement: placement,
        hideOnClick: isHide,
        multiple: true,
        sticky: true,
        size: "large",
        theme: theme,
        duration: [0, 0]
    });
};

/* Tippy for describe node */
var makeTippyNodeData = function (node, theme, htmlEle) {
    return tippy(node.popperRef(), {
        content: function () {
            return htmlEle;
        },
        trigger: 'manual',
        arrow: true,
        multiple: true,
        sticky: true,
        size: "large",
        theme: theme,
        zIndex: 1000000
    });
};

/************************************************************************************************************************************* */

var currentNodeDataAdding = function (nodeName, objID) {
    $("#nodeName").html(nodeName);

    let topic = ["Node ID", "State", "Location"];
    let data = [];

    data.push(objID.substr(0, 7));
    data.push("Connected");
    data.push("Gaineville, FL");

    htmlContent = "";
    let index = 0;
    topic.forEach((content => {
        htmlContent = htmlContent + '<p class="topic">' + content + '</p>';
        htmlContent = htmlContent + '<p class="data">' + data[index] + '</p>';
        index++;
    }))
    $("#node1").html(htmlContent);
}


var ortherNodeDataAdding = function (ipopObj, objID) {

    var linkIDList = ipopObj.getLinkIDListOf(objID);
    var tgtNodeList = [];


    linkIDList.forEach((linkID) => {
        var tgtNodeID = ipopObj.getLinkListOf(objID)[linkID]["TgtNodeId"];

        if (ipopObj.getNodeIDList().includes(tgtNodeID)) {

            node = {
                "name": ipopObj.getNodeList()[tgtNodeID]["NodeName"],
                "id": tgtNodeID,
                "linkId": linkID
            }

            tgtNodeList.push(node);

        }

    });
    tgtNodeList.sort((a, b) => (a.name > b.name) ? 1 : -1)

    $("#connectedCount").html("Connected Node(" + tgtNodeList.length + ")");

    $.get("/ortherNodeDetail.html", function (data) {
        for (let index = 0; index < tgtNodeList.length; index++) {

            if (index == 0) {
                $("#warpper").html(data);
            } else {
                $("#warpper").append(data);
            }

            $('#card2_show').attr('id', 'show' + index);
            $('#card2_hide').attr('id', 'hide' + index);
            $('#showName').attr('id', 'showName' + index);
            $('#hideName').attr('id', 'hideName' + index);
            $('#otherNodeData').attr('id', 'otherNodeData' + index);
            $('#sentData').attr('id', 'sentData' + index);
            $('#rcvData').attr('id', 'rcvData' + index);
            $('#brief').attr('id', 'brief' + index);
            $('#cardBody').attr('id', 'cardBody' + index);
            $('#showName' + index).html(tgtNodeList[index].name);
            $('#hideName' + index).html(tgtNodeList[index].name);


            let tgtNodeTopic = ["Node ID", "Tunnel ID", "Interface Name", "MAC", "State"];
            let tgtNodeData = [];

            var bit7NodeID = tgtNodeList[index].id.substr(0, 7);
            tgtNodeData.push(bit7NodeID);
            var bit7LinkID = tgtNodeList[index].linkId.substr(0, 7);
            tgtNodeData.push(bit7LinkID);
            tgtNodeData.push(ipopObj.getLinkListOf(objID)[tgtNodeList[index].linkId]["InterfaceName"]);
            tgtNodeData.push(ipopObj.getLinkListOf(objID)[tgtNodeList[index].linkId]["MAC"]);

            if (ipopObj.getLinkListOf(objID)[tgtNodeList[index].linkId]["State"] == "CEStateConnected") {
                tgtNodeData.push("Connected");
            } else {
                tgtNodeData.push("-");
            }

            htmlContent = "";
            let i = 0;
            tgtNodeTopic.forEach((content => {
                htmlContent = htmlContent + '<p class="topic">' + content + '</p>';
                htmlContent = htmlContent + '<p class="data">' + tgtNodeData[i] + '</p>';
                i++;
            }))
            $('#otherNodeData' + index).html(htmlContent);


            tgtNodeTopic = [];
            tgtNodeData = [];
            content2 = '<p style="font-size:17px;font-weight:500;color:#56C5BC;line-height: 7px">Sent</p>'
            tgtNodeTopic = ["Bytes Sents(Bs)", "Total Bytes Sents(MB)"];

            try {
                btSent = ipopObj.getLinkListOf(objID)[tgtNodeList[index].linkId]["Stats"][0]["sent_bytes_second"];
                tgtNodeData.push(btSent);
                tbtSent = ipopObj.getLinkListOf(objID)[tgtNodeList[index].linkId]["Stats"][0]["sent_total_bytes"];
                tgtNodeData.push(tbtSent);
            } catch (err) {
                tgtNodeData.push("no information");
                tgtNodeData.push("no information");
            }
            htmlContent = "";
            i = 0;
            tgtNodeTopic.forEach((content => {
                htmlContent = htmlContent + '<p class="topic">' + content + '</p>';
                htmlContent = htmlContent + '<p class="data">' + tgtNodeData[i] + '</p>';
                i++;
            }))

            $('#sentData' + index).html(content2 + htmlContent);


            tgtNodeTopic = [];
            tgtNodeData = [];
            content = '<p style="font-size:17px;font-weight:500;color:#56C5BC;line-height: 7px">Received</p>'
            tgtNodeTopic = ["Bytes Received(Bs)", "Total Bytes Received(MB)"];

            try {
                btRcv = ipopObj.getLinkListOf(objID)[tgtNodeList[index].linkId]["Stats"][0]["recv_bytes_second"];
                tgtNodeData.push(btRcv);
                tbtRcv = ipopObj.getLinkListOf(objID)[tgtNodeList[index].linkId]["Stats"][0]["recv_total_bytes"];
                tgtNodeData.push(tbtRcv);
            } catch (err) {
                tgtNodeData.push("no information");
                tgtNodeData.push("no information");
            }

            htmlContent = "";
            i = 0;
            tgtNodeTopic.forEach((content => {
                htmlContent = htmlContent + '<p class="topic">' + content + '</p>';
                htmlContent = htmlContent + '<p class="data">' + tgtNodeData[i] + '</p>';
                i++;
            }))

            $('#rcvData' + index).html(content + htmlContent);
            $('#brief' + index).html("");

        }

        $(document).ready(function () {
            for (let index = 0; index < tgtNodeList.length; index++) {
                $("#show" + index + ",#hide" + index).click(function () {
                    if ($("#show" + index).is(":hidden")) {
                        $("#hide" + index).hide();
                        $("#show" + index).show();
                        $("#cardBody" + index).slideUp("slow");
                    } else {
                        $("#cardBody" + index).slideDown("slow");
                        $("#hide" + index).show();
                        $("#show" + index).hide();
                    }
                });
            }
        });
    });
}


var addSorceNodeData = function (ipopObj, sourceID) {

    $('#sourceNameShow').html(ipopObj.getNodeList()[sourceID]['NodeName']);
    $('#sourceNameHide').html(ipopObj.getNodeList()[sourceID]['NodeName']);

    let topic = ["Node ID", "State", "Location"];
    let data = [];

    data.push(sourceID.substr(0, 7));
    data.push("Connected");
    data.push("Gaineville, FL");
    // data.push("-");
    // data.push("-");
    // data.push(ipopObj.getNodeList()[sourceID]["IP4"]);
    // data.push("-");

    htmlContent = "";
    let index = 0;
    topic.forEach((content => {
        htmlContent = htmlContent + '<p class="topic">' + content + '</p>';
        htmlContent = htmlContent + '<p class="data">' + data[index] + '</p>';
        index++;
    }))

    $("#sourceData").html(htmlContent);
}

var addTargetNodeData = function (ipopObj, targetID) {

    $('#tgtNameShow').html(ipopObj.getNodeList()[targetID]['NodeName']);
    $('#tgtNameHide').html(ipopObj.getNodeList()[targetID]['NodeName']);


    let topic = ["Node ID", "State", "Location"];
    let data = [];

    data.push(targetID.substr(0, 7));
    data.push("Connected");
    data.push("Gaineville, FL");

    htmlContent = "";
    let index = 0;
    topic.forEach((content => {
        htmlContent = htmlContent + '<p class="topic">' + content + '</p>';
        htmlContent = htmlContent + '<p class="data">' + data[index] + '</p>';
        index++;
    }))

    $("#tgtData").html(htmlContent);
}


addLinkData = function (ipopObj, sourceID, objID) {
    let content1 = '<div class="card-body" style=" border-radius: 0px;border-radius: 6px " id="card2_body"><div class="inner">';

    let tgtNodeTopic = ["Tunnel ID", "Interface Name", "MAC", "State"];
    let tgtNodeData = [];

    var bit7LinkID = objID.substr(0, 7);
    tgtNodeData.push(bit7LinkID);
    tgtNodeData.push(ipopObj.getLinkListOf(sourceID)[objID]["InterfaceName"]);
    tgtNodeData.push(ipopObj.getLinkListOf(sourceID)[objID]["MAC"]);

    if (ipopObj.getLinkListOf(sourceID)[objID]["State"] == "CEStateConnected") {
        tgtNodeData.push("Connected");
    } else {
        tgtNodeData.push("-");
    }


    let htmlContent = "";
    let i = 0;
    tgtNodeTopic.forEach((content => {
        htmlContent = htmlContent + '<p class="topic">' + content + '</p>';
        htmlContent = htmlContent + '<p class="data">' + tgtNodeData[i] + '</p>';
        i++;
    }))

    let content2 = '</div><div class="boxInner"><p style="font-size:17px;font-weight:500;color:#56C5BC;line-height: 7px">Sent</p>';
    tgtNodeTopic = [];
    tgtNodeData = [];
    tgtNodeTopic = ["Bytes Sents(Bs)", "Total Bytes Sents(MB)"];

    try {
        btSent = ipopObj.getLinkListOf(sourceID)[objID]["Stats"][0]["sent_bytes_second"];
        tgtNodeData.push(tbtSent);
        tbtSent = ipopObj.getLinkListOf(sourceID)[objID]["Stats"][0]["sent_total_bytes"];
        tgtNodeData.push(tbtSent);
    } catch (err) {
        tgtNodeData.push("no information");
        tgtNodeData.push("no information");
    }

    let htmlContent2 = "";
    i = 0;
    tgtNodeTopic.forEach((content => {
        htmlContent2 = htmlContent2 + '<p class="topic">' + content + '</p>';
        htmlContent2 = htmlContent2 + '<p class="data">' + tgtNodeData[i] + '</p>';
        i++;
    }))


    let content3 = '</div><div class="boxInner"><p style="font-size:17px;font-weight:500;color:#56C5BC;line-height: 7px">Received</p>';
    tgtNodeTopic = [];
    tgtNodeData = [];
    tgtNodeTopic = ["Bytes Received(Bs)", "Total Bytes Received(MB)"];

    try {
        btRcv = ipopObj.getLinkListOf(sourceID)[objID]["Stats"][0]["recv_bytes_second"];
        tgtNodeData.push(btRcv);
        tbtRcv = ipopObj.getLinkListOf(sourceID)[objID]["Stats"][0]["recv_total_bytes"];
        tgtNodeData.push(tbtRcv);
    } catch (err) {
        tgtNodeData.push("no information");
        tgtNodeData.push("no information");
    }

    let htmlContent3 = "";
    i = 0;
    tgtNodeTopic.forEach((content => {
        htmlContent3 = htmlContent3 + '<p class="topic">' + content + '</p>';
        htmlContent3 = htmlContent3 + '<p class="data">' + tgtNodeData[i] + '</p>';
        i++;
    }))

    $("#edgDet").append(content1 + htmlContent + content2 + htmlContent2 + content3 + htmlContent3 + "</div>");
}

/* restate of clickEvent */
var restageEvent = function (tippyID, nodeIdTippy, tippyList) {
    temp = null

    if (tippyID != null) {
        tippyID.hide();
    }

    if (nodeIdTippy != null) {
        tippyList[nodeIdTippy].set({ theme: 'node' });
    }

}

/* for search */
$(document).ready(function () {

    var search = $('#searchForm').typeahead(
         {
            hint: true,
            highlight: true,
            minLength: 1,
        },
        {
        name: 'search-datasetr',
        source: function (query, cb) {

            function matches(str, q) {
                str = (str || '').toLowerCase();
                q = (q || '').toLowerCase();
                return str.match(q);
            }

            let fields = ['name', 'id'];
            let sortBy = 'name';

            function anyFieldMatches(n) {

                for (let i = 0; i < fields.length; i++) {
                    let f = fields[i];
                    if (matches(n.data(f), query)) {
                        return true;
                    }
                }
                return false;
            }

            function getData(n) {
                return n.data();
            }

            function sortByName(n1, n2) {
                if (n1.data(sortBy) < n2.data(sortBy)) {
                    return -1;
                }
                else if (n1.data(sortBy) > n2.data(sortBy)) {
                    return 1;
                }
                return 0;
            }

            var res = allNodes.stdFilter(anyFieldMatches).sort(sortByName).map(getData);
            cb(res);
            },
        templates: {
            empty: [
                `<p><strong>Unable</strong> to find any node that match the current query.</p>`
            ].join('\n'),
            suggestion: function (data) {
                return `<p>${data.name} - ${data.id}</p>`;
            }
            },

        }).on(
            {
                'typeahead:selected': function (event, data) {
                    search.typeahead('val', '');
                    let target = data.id;
                    cy.getElementById(target).trigger('click');
                },
                'keypress': function (event) {
                    var keycode = (event.keyCode ? event.keyCode : event.which);
                    if (keycode == '13') {
                        $(".tt-suggestion:first-child").trigger('click');
                        return false;
                    }
                }
            });

 /*   $("#searchForm").typeahead({
        name: 'search-dataset',
        source: function (query, cb) {

            function matches(str, q) {
                str = (str || '').toLowerCase();
                q = (q || '').toLowerCase();
                return str.match(q);
            }

            let fields = ['name', 'id'];
            let sortBy = 'name';

            function anyFieldMatches(n) {

                for (let i = 0; i < fields.length; i++) {
                    let f = fields[i];
                    if (matches(n.data(f), query)) {
                        return true;
                    }
                }
                return false;
            }

            function getData(n) {
                return n.data();
            }

            function sortByName(n1, n2) {
                if (n1.data(sortBy) < n2.data(sortBy)) {
                    return -1;
                }
                else if (n1.data(sortBy) > n2.data(sortBy)) {
                    return 1;
                }
                return 0;
            }

            var res = allNodes.stdFilter(anyFieldMatches).sort(sortByName).map(getData);
            cb(res);
        },
        updater: function (item) {
            let target = item.id;
            cy.getElementById(target).trigger('click');
        },
    }).keypress(function (event) {
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if (keycode == '13') {
            $(".tt-suggestion:first-child", this).trigger('click');
            return false;
        }
    })*/



  /*  .on('keyup', function (e) {
        if (e.which == 13) {
            $(".tt-suggestion:first-child", this).trigger('click');
        }
        return false;
    });*/




    /*search();*/
    

   /* $('input[type="search"][class="form-control border-0"]').keypress(function (event) {
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if (keycode == '13') {
            let searchText = $('input[type="search"][class="form-control border-0"]').val();
            if (allNodes != null) {
                let searchTarget = cy.getElementById(searchText);
                if (searchTarget != null) {
                    searchTarget.trigger('click');
                }
                else {
                    alert("Not Matching");
                }
            }
            else {
                    alert("Not Matching");
            }
            $('input[type="search"][class="form-control border-0"]').val("");
            return false;
        }
    })*/
})





