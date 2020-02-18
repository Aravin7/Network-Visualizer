class CreateGraphContents {

    constructor() {

        var nodesObj = null;
        var linksObj = null;
        var selectedOverlay = null;

        this.init = function (overlay, nodes, links) {
            this.setSelectedOverlay(overlay);
            this.setNodeObj(nodes);
            this.setLinkObj(links);
        }

        this.setNodeObj = function (nodes) {
            nodesObj = nodes[this.getSelectedOverlay()]["current_state"];
        }

        this.getNodeObj = function () {
            return nodesObj;
        }

        this.setLinkObj = function (links) {
            linksObj = links[this.getSelectedOverlay()]["current_state"];
        }

        this.getLinkObj = function () {
            return linksObj;
        }

        this.setSelectedOverlay = function (overlay) {
            selectedOverlay = overlay;
        }

        this.getSelectedOverlay = function (overlay) {
            return selectedOverlay;
        }

        this.getNodeIDs = function () {
            return Object.keys(this.getNodeObj()).sort();
        }

        this.getNodeName = function (nodeID) {
            return this.getNodeObj()[nodeID]["NodeName"];
        }

        this.getNodeDetails = function (nodeID) {
            var nodeDetails = {
                "nodeName": this.getNodeName(nodeID),
                "nodeID": nodeID,
                "nodeState": "Connected",
                "nodeLocation": "Mississippi, USA"
            }
            return nodeDetails;
        }

        this.getLinkIDs = function (nodeID) {
            return Object.keys(this.getLinkObj()[nodeID]);
        }

        this.getLinkName = function (nodeID, linkID) {
            return this.getLinkObj()[nodeID][linkID]["interfaceName"]
        }

        this.getLinkDetails = function (srcNode, linkID) {
            var linkDetails = {
                "TunnelID": this.getLinkObj()[srcNode][linkID]["EdgeId"],
                "InterfaceName": this.getLinkObj()[srcNode][linkID]["InterfaceName"],
                "MAC": this.getLinkObj()[srcNode][linkID]["MAC"],
                "State": this.getLinkObj()[srcNode][linkID]["State"],
                "TunnelType": this.getLinkObj()[srcNode][linkID]["Type"],
                "ICEConnectionType": "-",
                "ICERole": "-",
                "RemoteAddress": "-",
                "LocalAddress": "-",
                "Latency": "-",
                "Stats": this.getLinkObj()[srcNode][linkID]["Stats"]
            }

            return linkDetails;
        }

        this.findConnectedNodeDetails = function (srcNode, tgtNode) {
            var connectedNodeDetails;

            this.getLinkIDs(srcNode).forEach(link => {
                if (this.getLinkObj()[srcNode][link]["TgtNodeId"] === tgtNode) {
                    connectedNodeDetails = {
                        "TunnelID": this.getLinkObj()[srcNode][link]["EdgeId"],
                        "InterfaceName": this.getLinkObj()[srcNode][link]["InterfaceName"],
                        "MAC": this.getLinkObj()[srcNode][link]["MAC"],
                        "State": this.getLinkObj()[srcNode][link]["State"],
                        "TunnelType": this.getLinkObj()[srcNode][link]["Type"],
                        "ICEConnectionType": "-",
                        "ICERole": "-",
                        "RemoteAddress": "-",
                        "LocalAddress": "-",
                        "Latency": "-",
                        "Stats": this.getLinkObj()[srcNode][link]["Stats"]
                    }
                }
            })

            return connectedNodeDetails;
        }

        this.getTargetNode = function (nodeID, linkID) {
            return this.getLinkObj()[nodeID][linkID]["TgtNodeId"];
        }

        this.getSourceNode = function (nodeID, linkID) {
            return this.getLinkObj()[nodeID][linkID]["SrcNodeId"];
        }

    }

}

export default CreateGraphContents;