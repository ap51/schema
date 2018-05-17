<template>
        <v-app ref="layout">
            <v-content>
                <v-toolbar color="blue darken-2" dark dense>
                    <v-toolbar-title class="mr-2"><v-icon class="mr-1 mb-1">{{icon}}</v-icon><small>{{header}}</small></v-toolbar-title>

                    <v-tabs v-model="active" color="blue darken-2"
                            :right="false">

                        <v-tabs-slider color="yellow"></v-tabs-slider>

                        <v-tab v-for="tab in tabs"
                             :key="tab.name"
                             :to="tab.to || tab.name"
                             v-if="!tab.invisible">

                                <v-icon class="mr-1 mb-1">{{ tab.icon}}</v-icon>

                                {{ tab.name }}
                        </v-tab>

                    </v-tabs>


                    <v-toolbar-items >
                        <v-btn v-if="!auth.name" flat @click="signin(true)">
                            <v-icon class="mr-1 mb-1">fas fa-sign-in-alt</v-icon>вход
                        </v-btn>

                        <v-btn v-if="auth.name" flat @click="account(true)">
                            <v-icon class="mr-1 mb-1">fas fa-user-circle</v-icon>{{auth.name}}
                        </v-btn>

                        <v-btn v-if="auth.name"  flat @click="signout(true)">
                            <v-icon class="mr-1 mb-1">fas fa-sign-out-alt</v-icon>
                        </v-btn>

                    </v-toolbar-items>

                </v-toolbar>

                <signin :visible="dialogs.signin.visible" @cancel="signin(false)"></signin>
                <signout :visible="dialogs.signout.visible" @cancel="signout(false)"></signout>
                <account :visible="dialogs.account.visible" :object="dialogs.account.object" @cancel="account(false)"></account>

                <v-card class="base-layout">
                    <location :component="location"></location>
                </v-card>

            </v-content>
        </v-app>
</template>

<style scoped>
    .toolbar__title {
        overflow: visible;
    }

    .base-layout {
        height: calc(100vh - 64px)!important;
        margin: 8px;
        border: 1px solid #ccc;
    }
    button i, a i {
        font-size: 17px;
    }
</style>

<script>
    module.exports = {
        name: 'layout',
        extends: component,
        components: {
            'signin': httpVueLoader('signin'),
            'signout': httpVueLoader('signout'),
            'account': httpVueLoader('account'),
            'location': httpVueLoader('location'),
        },
        data() {
            return {
                active: void 0,
                dialogs: {
                    signin: {
                        visible: false,
                        object: void 0
                    },
                    signout: {
                        visible: false,
                        object: void 0
                    },
                    account: {
                        visible: false,
                        object: void 0
                    },
                },
            }
        },
        created() {
            this.$bus.$on('signin', () => {
                this.dialogs.signin.visible = true;
            });
        },
        activated() {

        },
        computed: {
            entity() {
                return this.entities.user && this.entities.user[this.auth.id] || {};
            },
            active_tab: {
                get() {
                    return this.tabs.find(tab => tab.active);
                },
                cache: false
            },
            tab_found() {
                return !!(this.active ? this.tabs.find(tab => this.address.ident == (tab.to || tab.name)) : false);
            },
        },
        methods: {
            account(visible) {
                visible && (this.dialogs.account.object = this.entities.user[this.auth.id]);
                this.dialogs.account.visible = visible;
            },
            signin(visible) {
                //this.dialogs.signin.object = void 0;
                this.dialogs.signin.visible = visible;
            },
            signout(visible) {
                //this.dialogs.signout.object = void 0;
                this.dialogs.signout.visible = visible;
            }
        },
        watch: {
        }
    }

    //# sourceURL=layout.js
</script>