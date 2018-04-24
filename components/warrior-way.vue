<template>
    <div class="layout-view">
        <v-card class="w-card w-schema ma-1">
            <v-card-title primary-title>
                <div class="blue--text text--darken-2 headline">Схема</div>
            </v-card-title>
            <v-card-title class="blue--text text--darken-2 schema">
                <div id="network">VISJS</div>
            </v-card-title>
        </v-card>
        <v-card class="w-card w-preview ma-1">
            <v-card-title primary-title>
                <div class="blue--text text--darken-2 headline">Просмотр</div>
            </v-card-title>
            <v-card-actions>
                <v-btn color="blue darken-2"  flat dark><v-icon>fas fa-globe</v-icon>Listen now</v-btn>
            </v-card-actions>
        </v-card>
    </div>
</template>

<style scoped>
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

    #network {
        flex: 1;
    }
</style>

<script>
    module.exports = {
        extends: component,
        data() {
            this.network = void 0;
            
            return {
                data: {
                    nodes: new vis.DataSet([]),
                    edges: new vis.DataSet([])
                },
            }
        },
        mounted() {
            // randomly create some nodes and edges
/*             for (var i = 0; i < 22; i++) {
                this.nodes_array.push({
                    id: i, 
                    label: String(i), 
                    title: 'THIS IS TITLE',
                    icon: {
                        face: 'FontAwesome',
                        code: '\uf2bc',
                        size: 50,
                        color: '#1976D2'
                    }
                });
            }
 */
/*             this.edges_array.push({from: 0, to: 1});
            this.edges_array.push({from: 0, to: 6});
            this.edges_array.push({from: 0, to: 13});
            this.edges_array.push({from: 0, to: 11});
            this.edges_array.push({from: 1, to: 10});
            this.edges_array.push({from: 1, to: 7});
            this.edges_array.push({from: 1, to: 12});
            this.edges_array.push({from: 1, to: 2});
            this.edges_array.push({from: 2, to: 3});
            this.edges_array.push({from: 2, to: 4});
            this.edges_array.push({from: 3, to: 5});
            this.edges_array.push({from: 2, to: 8});
            this.edges_array.push({from: 2, to: 9});
            this.edges_array.push({from: 3, to: 14});
            this.edges_array.push({from: 6, to: 10});
            this.edges_array.push({from: 16, to: 15});
            this.edges_array.push({from: 15, to: 17});
            this.edges_array.push({from: 18, to: 17});
            this.edges_array.push({from: 19, to: 20});
            this.edges_array.push({from: 19, to: 21});

 */            // create a network
            var container = document.getElementById('network');

/*             var data = {
                nodes: new vis.DataSet(this.nodes),
                edges: new vis.DataSet(this.edges_array)
            };
 */
            var options = {
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
                    tooltipDelay: 300,
                    zoomView: true
                },
                layout: {
                    hierarchical: {
                        sortMethod: 'directed'
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
                            face: 'arial',
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
            
            network.once('stabilized', function(e) {
                network.fit();
            });
        },
        computed: {
/*             nodes() {
                this.entities.nodes && this.data.nodes.add(this.entities.nodes);
            },
            edges() {
                this.entities.edges && this.data.edges.add(this.entities.edges);
            } */
        },
        watch: {
            'entities.nodes': function(nodes) {
                this.data.nodes.add(nodes);
                //this.network.fit();
            },
            'entities.edges': function(edges) {
                this.data.edges.add(edges);
                //this.network.fit();
            }
        }
    }

    //# sourceURL=warrior-way.js
</script>