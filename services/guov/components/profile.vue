<template>

    <v-dialog v-model="visible" persistent max-width="400px">
        <v-card flat >
            <v-card-title>
                <v-icon class="mr-1 blue--text text--darken-2">fas fa-user-circle</v-icon>
                <span class="headline blue--text text--darken-2">profile</span>
            </v-card-title>
            <v-card-text>
                <v-container grid-list-md>
                    <v-layout>
                        <v-form  ref="form" @submit.prevent>
                            <v-flex flat xs12 style="display: flex;flex-direction: column;align-items: center;">
                                <div class="blue--text text--darken-2" color="">Avatar</div>
                                <input style="display: none" type="file" @change="onFileChange" ref="file_input" accept="image/*">

                                <div class="elevation-1 ma-2" @click="selectFile" style="display: flex;flex-direction: column;align-items: center;width: 200px;height: 200px;max-width: 200px;max-height: 200px;">
                                    <img style="max-width: 200px;max-height: 200px;margin: auto;display: block;" :src="image">
                                </div>
                                <v-btn small icon @click="removeImage" color="red--text text--darken-2" >
                                    <v-icon color="red darken-2" style="font-size: 16px; height: 20px;">fas fa-times</v-icon>
                                </v-btn>

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
                        </v-form>
                    </v-layout>
                    <small>*indicates required field</small>
                </v-container>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-2" flat @click.native="cancel">cancel</v-btn>
                <v-btn color="blue darken-2" flat @click.native="save({...object})">save</v-btn>
            </v-card-actions>
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
                image: 'https://s3.amazonaws.com/uifaces/faces/twitter/adhamdannaway/128.jpg',
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
        },
        computed: {
        },
        methods: {
            onFileChange(e) {
                var files = e.target.files || e.dataTransfer.files;
                if (!files.length)
                    return;
                this.createImage(files[0]);
            },
            
            createImage(file) {
                var image = new Image();
                var reader = new FileReader();
                var vm = this;

                reader.onload = (e) => {
                    vm.image = e.target.result;
                };
                reader.readAsDataURL(file);
            },
            
            removeImage: function (e) {
                this.image = 'https://s3.amazonaws.com/uifaces/faces/twitter/adhamdannaway/128.jpg';
            },
            
            selectFile() {
                this.$refs.file_input.click();
            },

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
        },
        watch: {
        }
    }

    //# sourceURL=profile.js
</script>

<style scoped>
    .dlg {
        background: #ddd;
    }

    img.image {
        max-width: 100px;
        max-height: 100px;
        margin: auto;
        display: block;
    }
    input {
        display: none!important;
    }
    div.wrapper {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        margin: auto;
        margin-bottom: 10px;
        width: 100px;
        height: 100px;
        max-width: 100px;
        max-height: 100px;
        border: 1px solid #eee
    }    

</style>
