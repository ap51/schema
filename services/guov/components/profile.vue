<template>
    <v-dialog v-model="visible" persistent max-width="400px" hide-overlay>
<!--
        <v-toolbar flat color="white lighten-2" dense class="elevation-1 ma-1">
            <v-toolbar-title>{{name}}:</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn flat to="profile:ap-51"><v-icon color="green darken-2" class="mr-1 mb-1">far fa-check-circle</v-icon>profile ap-51</v-btn>
            <v-btn flat to="profile:jd"><v-icon color="green darken-2" class="mr-1 mb-1">far fa-check-circle</v-icon>profile jd</v-btn>
            <v-btn flat to="feed:jd"><v-icon color="green darken-2" class="mr-1 mb-1">far fa-check-circle</v-icon>feed jd</v-btn>
            &lt;!&ndash; <v-btn flat="flat" :disabled="selected.length === 0" @click.stop="remove"><v-icon color="red darken-2" class="mr-1 mb-1">fas fa-times</v-icon>remove</v-btn> &ndash;&gt;
            <v-btn :disabled="!changed" flat="flat" @click.stop="apply({...object})"><v-icon color="green darken-2" class="mr-1 mb-1">far fa-check-circle</v-icon>apply</v-btn>
        </v-toolbar>
-->
        <v-card flat>
            <v-card-text>
                <v-container grid-list-md>
                    <v-layout>
                        <v-form  ref="form" @submit.prevent>
                            <v-flex flat xs12>
<!--
                                <v-btn
                                    @click="$refs.pictureInput.removeImage()"
                                    color="red darken-2"
                                    fab
                                    dark
                                    small
                                    v-if="object.avatar"
                                    class="remove-btn">
                                    
                                    <v-icon style="font-size: 20px; height: 22px;">fas fa-times</v-icon>
                                </v-btn>
-->

                                <picture-input
                                    ref="pictureInput"
                                    width="200"
                                    height="200"
                                    accept="image/jpeg,image/png"
                                    size="10"
                                    :prefill="prefill"
                                    >

                                </picture-input>

                            </v-flex>
                            <v-flex xs12>
                                <v-text-field v-model="object.public_id"
                                            label="Public ID"
                                            required
                                            prepend-icon="fas fa-id-card"
                                            autofocus
                                            color="blue darken-2"
                                            hint="RegEpxr: ^[a-zA-Z0-9-]{4,}$"
                                            :rules="[
                                                () => {
                                                    return (!!object.public_id && /^[a-zA-Z0-9-]{4,}$/.test(object.public_id)) || 'Value must equals ^[a-zA-Z0-9-]{4,}$'
                                                }
                                            ]"
                                ></v-text-field>
                            </v-flex>
                            <v-flex xs12>
                                <v-text-field v-model="object.status"
                                            label="Status text"
                                            prepend-icon="far fa-comment-alt"
                                            color="blue darken-2"
                                            hint="any string value"
                                ></v-text-field>
                            </v-flex>
<!--  
                            <v-flex xs12>
                                <v-text-field v-model="object.avatar"
                                            validate-on-blur
                                            label="Owner"
                                            required
                                            prepend-icon="fas fa-user"
                                            color="blue darken-2"
                                            hint="any string value"
                                            :rules="[
                                                () => !!object.avatar || 'This field is required',
                                            ]"
                                ></v-text-field>
                            </v-flex>

-->                        
                        </v-form>
                    </v-layout>
                    <small>*indicates required field</small>
                </v-container>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>


<script>

    module.exports = {
        extends: component,
        props: [
            'visible',
            'object'
        ],
        components: {
            'picture-input': httpVueLoader('picture-input')
        },

        data() {
            return {
                frame: false,
                //changed: false,
                internal_object: void 0,
                internal_prefill: '',
                strings: {
                    upload: '<h1>Bummer!</h1>',
                    //drag: 'Drag a 😺 GIF or GTFO'
                    drag: 'Select an avatar'
                }
            }
        },
        beforeCreate() {
        },
        created() {
            //let add = this.parseRoute(this.$state.shared.location);
            //console.log(add.component);
            //let fp = FilePond.create();
            //this.prefill = `${this.state.base}files/images/${this.current_user.avatar}` || 'https://s3.amazonaws.com/uifaces/faces/twitter/yayteejay/128.jpg';
        },
        computed: {
            prefill() {
/*
                console.log('PREFILL:', this.name);
                this.internal_prefill = this.internal_prefill || ((this.current_user && this.current_user.avatar) ? `${this.state.base}files/images/${this.current_user.avatar}` : '');
                return this.internal_prefill;
*/
                return 'https://s3.amazonaws.com/uifaces/faces/twitter/matthewkay_/128.jpg'
            },
/*
            object() {
                //console.log(this.state.locationToggle);
                this.internal_object = this.internal_object || (this.current_user && {...this.current_user});
                return this.internal_object;
            },
*/
            changed() {
                return JSON.stringify(this.internal_object) !== JSON.stringify(this.current_user);
            }
        },
        methods: {
            onChange(image) {
                console.log('New picture selected!');
                if (image) {
                    console.log('Picture loaded.');
                    this.image = image;
                    this.internal_object.avatar = this.$refs.pictureInput.file.name;
                    //this.checkChanges();
                } else {
                    console.log('FileReader API not supported: use the <form>, Luke!')
                }
            },
            onPrefill(image) {
                //this.internal_object.avatar = this.internal_object.avatar || 'avatar.jpg';
                //this.checkChanges();
            },
            onRemove(image) {
                this.internal_object.avatar = '';
                console.log('Removed');
                //this.checkChanges();
            },
            applied(res) {
                this.changed = false;
            },
            apply(profile) {
                this.$request(`${this.$state.base_api}profile.save`, profile, {callback: this.applied});
            },
        },
        watch: {
            'state.locationToggle': function () {
            }
        }
    }

    //# sourceURL=profile.js
</script>

<style scoped>
    iframe {
        width: 100%;
        height: 100%;
        border: none;
    }
    
    .remove-btn {
        position: absolute!important;
        top: 24px!important;
        right: 22px!important;
    }

    .picture-inner {
        top: -204px!important
    }

    .picture-preview {
        width: 100%;
        height: 100%;
        position: relative;
        box-sizing: border-box;
        background-color: transparent!important;
        padding: 8px!important;
    }

    .profile-details {
        display: flex;
        align-items: center;
        overflow: auto;
        height: 100%;
        width: 100%;
    }

/*
    .profile-details div:first-child {
        min-width: 150px;
    }
*/

    div.profile {
        width: 40%;
        margin: 4px;
    }

    div.applications {
        width: 60%;
        margin: 4px;
        height: auto;
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
