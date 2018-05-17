<template>
    <div class="layout-view">
        <v-card flat width="60vw">
            <v-container grid-list-lg>
                <v-layout column>
                    <v-flex xs12 class="elevation-1">
                        <v-card flat color="white " class="blue--text text--darken-2">
                            <div class="ma-2">
                                <div class="title">{{auth.name}}</div>
                                <div class="caption">{{'anything...'}}</div>
                            </div>

                            <v-card-actions>
                                 <v-tabs v-model="active" color="white" class="blue--text text--darken-2" dark dense :right="false" show-arrows>

                                    <v-tabs-slider color="orange darken-2"></v-tabs-slider>

                                    <v-tab class="blue--text text--darken-2" color="blue darken-2" v-for="tab in tabs"
                                        :key="tab.name"
                                        :to="tab.to || tab.name">

                                        <v-icon class="mr-1 mb-1">{{ tab.icon}}</v-icon>

                                        {{tab.name}}
                                    </v-tab>

                                </v-tabs>
                            </v-card-actions>
                        </v-card>
                    </v-flex>
                    <v-flex xs12>
                        <!--<router-view name="tabs[active].name"></router-view>-->
                        <location :component="location"></location>
<!--
                        <keep-alive>
                            <component :is="location"></component>
                        </keep-alive>
-->
                    </v-flex>
                </v-layout>
            </v-container>
        </v-card>
    </div>
</template>

<script>
    module.exports = {
        extends: component,
        components: {
            'location': httpVueLoader('location'),
            /*
                        'feed': httpVueLoader('feed'),
                        'friends': httpVueLoader('friends'),
                        'charts': httpVueLoader('charts'),
                        'profile': httpVueLoader('profile'),
                        'search': httpVueLoader('search'),
                        'phones': httpVueLoader('phones'),
                        'applications': httpVueLoader('applications'),
            */
        },
        data() {
            return {
                active: '',
            }
        },
        created() {
            //console.log('public create', this.active);
            //this.loader.register(Vue, this.tabs[0].to || this.tabs[0].name);
            //this.$router.replace(this.tabs[0].to || this.tabs[0].name);
            //console.log(this.tabs[this.active].name);
        },
        activated() {
            //console.log('ACTIVE', this.active)
            //this.active = (!(this.active === '') && this.active) || this.tabs[0].to || this.tabs[0].name;
            //newValue = this.active.replace(Vue.prototype.$state.base_ui, '');
            //newValue !== this.state.path && this.$router.replace(newValue);
        },
        computed: {
        },
        watch: {
            'active': function (new_value, old_value) {
                this.$emit('event', {name: 'active:changed', value: new_value});
                //console.log(this.tabs[newValue])
                //let location = this.parseRoute(newValue);
                //this.loader.register(Vue, location.component);
/*                 newValue = newValue.replace(Vue.prototype.$state.base_ui, '');
                let tab = this.shared.layout_tabs.find(tab => tab.to === oldValue.replace(Vue.prototype.$state.base_ui, '') || tab.dynamic);
                newValue && tab && (tab.to = newValue);
                newValue && newValue !== this.state.path && this.$router.replace(newValue);
 */
            }
        }
    }

    //# sourceURL=private.js
</script>

<style scoped>
    .table tbody tr:hover, .table tbody tr[active] {
        background: #E3F2FD!important;
    }

    .table tbody tr button {
        display: none;
    }

    .table tbody tr:hover button, .table tbody tr[active] button {
        display: inline-flex;
        margin: 4px;
    }

    .layout-view {
        display: flex;
        align-items: center;
        overflow: auto;
        height: 100%;
    }

    .layout-view {
        flex-direction: column;
    }

    .layout-view p {
        width: 50vw;
        text-align: center;
    }

    .layout-view h1 {
        margin-top: 8px;
        margin-bottom: 8px;
    }

</style>
