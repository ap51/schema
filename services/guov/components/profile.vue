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

                                <div class="elevation-0 ma-2" @click="selectFile" style="cursor: pointer;display: flex;flex-direction: column;align-items: center;width: 150px;height: 150px;max-width: 150px;max-height: 150px;">
                                    <img crossorigin="anonymous" ref="avatar" style="max-width: 150px;max-height: 150px;margin: auto;display: block;" :src="image">
                                </div>
                                <v-btn small flat @click="removeImage" color="red darken-2" >
                                    <v-icon color="red darken-2" style="font-size: 16px; height: 20px;" class="mr-1">fas fa-times</v-icon>
                                    remove avatar
                                </v-btn>
                            </v-flex>
                            <v-flex xs12>
                                <v-text-field v-model="object.public_id"
                                    label="Public ID"
                                    required
                                    prepend-icon="fas fa-id-card"
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
                blob: void 0,
                image: 'files/ava.png',
            }
        },
        beforeCreate() {
        },
        created() {
        },
        computed: {
        },
        methods: {
            cancel() {
                this.$emit('cancel');
            },
            onFileChange(e) {
                let files = e.target.files || e.dataTransfer.files;

                if (!files.length)
                    return;

                this.object.file_name = files[0].name;

                this.createImage(files[0]);
            },
            createImage(file) {
                let reader = new FileReader();
                let self = this;

                reader.onload = (e) => {
                    self.image = e.target.result;
                };

                reader.readAsDataURL(file);
            },
            removeImage: async function (e) {
                this.image = 'files/ava.png';
                //this.blob = await blobUtil.imgSrcToBlob(this.$refs.avatar.src);
                console.log(this.blob);
            },
            selectFile() {
                this.$refs.file_input.click();
            },
            async save() {
                this.object.file_name = this.object.file_name || 'ava.png';

                let data = new FormData();
                let fields = Object.entries(this.object);

                fields.forEach(item => {
                    let [name, value] = item;
                    data.append(name, value);
                });

                this.blob = await blobUtil.imgSrcToBlob(this.$refs.avatar.src);
                data.append('avatar', this.blob);

                this.$request('profile.save', data, {encode: 'form-data', callback: this.cancel});
            }
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
