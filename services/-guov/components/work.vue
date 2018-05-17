<template>
    <div class="layout-view">
        <v-card class="w-card w-schema ma-1">
            <v-card-title primary-title>
                <div class="blue--text text--darken-2 headline">Схема</div>
            </v-card-title>
            <v-card-title class="blue--text text--darken-2 schema">
                <v-menu 
                        :position-x="popup.x + 50"
                        :position-y="popup.y"
                        :close-on-content-click="false"
                        :close-on-click="false"
                        :nudge-width="400"
                        v-model="popup.visible"
                        right
                        top
                        >

                    <step></step>
                </v-menu>
                <div id="network">VISJS</div>
            </v-card-title>
        </v-card>
        <v-card class="w-card w-preview ma-1">
            <v-card-title primary-title>
                <div class="blue--text text--darken-2 headline">Просмотр</div>
            </v-card-title>
            <v-card-actions>
                <v-btn color="blue darken-2" flat dark @click="addEdge"><v-icon>fas fa-globe</v-icon>Listen now</v-btn>
            </v-card-actions>
        </v-card>

    </div>
</template>

<style scoped>
    .vis-tooltip {
        display: none;
    }
    .layout-view {
        display: flex;
        justify-content: center;
        align-items: stretch;
        overflow: auto;
        height: 100%;
    }

    .w-schema {
        flex: 2;
        display: flex;
        flex-direction: column;
    }

    .w-preview {
        flex: 1;
    }


    .schema {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        flex: 1;
    }

/*     .schema {
        height: 100%;
        width: 100%;
    } */

/*     #network {
        height: 100%;
        width: 100%;
    }
 */
    #network {
        flex: 1;
    }
 </style>

<script>
    module.exports = {
        extends: component,
        components: {
            'step': httpVueLoader('step')
        },
        data() {
            this.network = void 0;
            
            return {
                popup: {
                    visible: false,
                    x: 0,
                    y: 0
                },
                data: {
                    nodes: new vis.DataSet([]),
                    edges: new vis.DataSet([])
                },
            }
        },
        mounted() {
            let self = this;

            // create a network
            let container = document.getElementById('network');

            let options = {
                interaction:{
                    dragNodes:true,
                    dragView: true,
                    hideEdgesOnDrag: true,
                    hideNodesOnDrag: false,
                    hover: true,
                    hoverConnectedEdges: false,
                    multiselect: false,
                    navigationButtons: false,
                    selectable: true,
                    selectConnectedEdges: false,
                    tooltipDelay: 600,
                    zoomView: true
                },
                layout: {
                    hierarchical: {
                        //sortMethod: 'directed'
                    }
                },
                edges: {
                    smooth: {
                        enabled: true,
                        type: "continuous",
                        roundness: 0.5
                    },
                    arrows: {
                        to : {
                            enabled: true,
                            scaleFactor: 0.5
                        },
                        from: {
                            enabled: true,
                            type: 'circle',
                            scaleFactor: 0.1
                        }
                    },
                    arrowStrikethrough: false,
                    color: {
                        color:'#455A64',
                        highlight:'#455A64',
                        hover: '#455A64',
                        inherit: 'from',
                        opacity: 1.0
                    },
                    shadow:{
                        enabled: true,
                        color: 'rgba(0, 0, 0, 0.2)',
                        size:10,
                        x:5,
                        y:5
                    }
                },
                nodes: {
                    icon: {
                        face: 'FontAwesome',
                        size: 50,  //50,
                        color:'#2B7CE9'
                    },
                    font: {
                        color: '#343434',
                        size: 14, // px
                        face: 'arial',
                        background: 'none',
                        strokeWidth: 0, // px
                        strokeColor: '#ffffff',
                        align: 'center',
                        multi: false,
                        vadjust: 0,
                        bold: {
                            color: '#343434',
                            size: 140, // px
                            face: 'Roboto Condensed',
                            vadjust: 0,
                            mod: 'bold'
                        },
                        ital: {
                            color: '#343434',
                            size: 140, // px
                            face: 'arial',
                            vadjust: 0,
                            mod: 'italic',
                        },
                        boldital: {
                            color: '#343434',
                            size: 140, // px
                            face: 'arial',
                            vadjust: 0,
                            mod: 'bold italic'
                        },
                        mono: {
                            color: '#343434',
                            size: 150, // px
                            face: 'courier new',
                            vadjust: 2,
                            mod: ''
                        }
                        },
                    color: {
                        border: '#2B7CE9',
                        background: '#97C2FC',
                        highlight: {
                            border: '#2B7CE9',
                            background: '#D2E5FF'
                        },
                        hover: {
                            border: '#2B7CE9',
                            background: '#D2E5FF'
                        }
                        },
                    shadow:{
                        enabled: true,
                        color: 'rgba(0, 0, 0, 0.2)',
                        size:10,
                        x:5,
                        y:5
                    },
                    shape: 'icon',
                    shapeProperties: {
                        borderDashes: false, // only for borders
                        borderRadius: 6,     // only for box shape
                        interpolation: false,  // only for image and circularImage shapes
                        useImageSize: false,  // only for image and circularImage shapes
                        useBorderWithImage: false  // only for image shape
                    }
                }
            };

            let data = this.data;
/*
            let data = {
                nodes: new vis.DataSet(this.nodes),
                edges: new vis.DataSet(this.edges)
            };
*/

            this.network = new vis.Network(container, data, options);

            let network = this.network;

            network.on('hoverNode', function(e) {
                let selected = network.getSelection().nodes[0];
                if(selected !== e.node) {
                    let node = data.nodes.get(e.node);
                    node.icon.size = node.icon.size + 15;
                    node.icon.color = '#388E3C';
                    data.nodes.update(node);

                }
            });

            network.on('blurNode', function(e) {
                let selected = network.getSelection().nodes[0];
                if(selected !== e.node) {
                    let node = data.nodes.get(e.node);
                    node.icon.size = node.icon.size - 15;
                    node.icon.color = '#2B7CE9';
                    data.nodes.update(node);

                }
            });

            network.on('showPopup', function(id) {
                let node = data.nodes.get(id);

                let e = network.getPositions([id])
                let pos = e[id];
                pos = network.canvasToDOM({...pos});

                self.popup.x = pos.x;
                self.popup.y = pos.y;
                self.popup.visible = true;
            });

            network.on('hidePopup', function(e) {
                self.popup.visible = false;
            });

            network.on('selectNode', function(e) {
                let node = data.nodes.get(e.nodes[0]);
                node.icon.size = 65;
                node.icon.color = '#F57C00';
                data.nodes.update(node);
            });
            
            network.on('deselectNode', function(e) {
                let node = data.nodes.get(e.previousSelection.nodes[0]);
                node.icon.size = 50;
                node.icon.color = '#2B7CE9';
                data.nodes.update(node);
            });

            network.on('deselectNode', function(e) {
                let node = data.nodes.get(e.previousSelection.nodes[0]);
                node.icon.size = 50;
                node.icon.color = '#2B7CE9';
                data.nodes.update(node);
            });

            network.once('stabilized', function(e) {
                network.fit();
            });
        },
        computed: {
             nodes() {
                return this.entities.node;
            },
            edges() {
                return this.entities.edge;
            }
        },
        watch: {
            'entities.node': function(nodes) {
                this.data.nodes.update(Object.values(nodes));
                //this.network.fit();
            },
            'entities.edge': function(edges) {
                this.data.edges.update(Object.values(edges));
                //this.network.fit();
            }
        },
        methods: {
            addEdge() {
                this.data.edges.add({from: 11, to: 12});
            }
        }
    }

    //# sourceURL=work.js
</script>