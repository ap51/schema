<template>

    <v-dialog v-if="visible" v-model="visible" persistent max-width="400px">
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
                                <label class="blue--text text--darken-2" color="">Avatar</label>
                                <input style="display: none" type="file" @change="onFileChange" ref="file_input" accept="image/*">

                                <div class="elevation-0 ma-2" @click="selectFile" style="cursor: pointer;display: flex;flex-direction: column;align-items: center;width: 150px;height: 150px;max-width: 150px;max-height: 150px;">
                                    <img crossorigin="anonymous" ref="avatar" style="max-width: 150px;max-height: 150px;margin: auto;display: block;" :src="image">
<!--
                                    <img style="max-width: 150px;max-height: 150px;margin: auto;display: block;" :src="image">
-->
                                </div>
                                <v-btn small flat @click="removeImage" color="red darken-2" >
                                    <v-icon color="red darken-2" style="font-size: 16px; height: 20px;" class="mr-1">fas fa-times</v-icon>
                                    remove avatar
                                </v-btn>
                            </v-flex>
                            <v-flex xs12>
                                <v-text-field v-model="entity.public_id"
                                    label="Public ID"
                                    required
                                    prepend-icon="fas fa-id-card"
                                    color="blue darken-2"
                                    hint="RegEpxr: ^[a-zA-Z0-9-]{4,}$"
                                    :rules="[
                                        () => {
                                            return (!!entity.public_id && /^[a-zA-Z0-9-]{4,}$/.test(entity.public_id)) || 'Value must equals ^[a-zA-Z0-9-]{4,}$'
                                        }
                                    ]"
                                ></v-text-field>
                            </v-flex>
                            <v-flex xs12>
                                <v-text-field v-model="entity.status"
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
                //image: 'files/ava.png',
            }
        },
        beforeCreate() {
        },
        created() {
            this.$bus.$on('merge:profile', (entities) => {
                let user_id = this.auth.id || 0;
                this.entities.profile[user_id].image = entities.profile[user_id].image;
            });
        },
        computed: {
            entity() {
                return {...this.object};
            },
            image() {
                //!this.blob && this.object.image && (this.blob = this.object.image);
                if(!this.blob && this.entity.image) {
                    let binary = new Uint8Array(this.entity.image.data);
                    let blob = new Blob([binary], {type: this.entity.mimeType});
                    blob.size ? this.createImage(blob) : this.blob = this.entity.image;
                    //this.blob = blob;
                }

                //!this.blob && this.object.image && this.createImage(new Blob(this.object.image.data, {type: this.object.mimeType}));
                return this.blob;
            }
        },
        methods: {
            cancel() {
                this.blob = void 0;
                //this.blob = this.image;
                this.$emit('cancel');
            },
            onFileChange(e) {
                let files = e.target.files || e.dataTransfer.files;

                if (!files.length)
                    return;

                this.entity.avatar = files[0].name;

                this.createImage(files[0]);
                //this.blob = files[0];
            },
            createImage(file) {
                let reader = new FileReader();
                let self = this;

                reader.onload = (e) => {
                    self.blob = e.target.result;
                };

                reader.readAsDataURL(file);
            },
            removeImage: async function (e) {
                //this.image = 'files/ava.png';
                this.blob = 'files/ava.png';//await blobUtil.imgSrcToBlob(this.$refs.avatar.src);
                Vue.nextTick(async () => {
                    this.createImage(await blobUtil.imgSrcToBlob(this.$refs.avatar.src));
                });
                //console.log(this.blob);
            },
            selectFile() {
                this.$refs.file_input.click();
            },
            dataURItoBlob(dataURI) {
                // convert base64 to raw binary data held in a string
                let byteString = atob(dataURI.split(',')[1]);

                // separate out the mime component
                let mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

                // write the bytes of the string to an ArrayBuffer
                let ab = new ArrayBuffer(byteString.length);
                let ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++) {
                    ia[i] = byteString.charCodeAt(i);
                }

                // write the ArrayBuffer to a blob, and you're done
                return new Blob([ab], { type: mimeString });
            },
            async save() {
                if (this.$refs.form.validate()) {

                    this.entity.avatar = this.entity.avatar || 'ava.png';

                    let data = new FormData();
                    let fields = Object.entries(this.entity);

                    fields.forEach(item => {
                        let [name, value] = item;
                        data.append(name, value);
                    });

                    let blob = this.dataURItoBlob(this.$refs.avatar.src);
                    //let blob = await blobUtil.imgSrcToBlob(this.$refs.avatar.src);
                    data.append('image', blob);
                    this.createImage(blob);

                    Object.assign(this.object, this.entity);
                    this.$request('profile.save', data, {encode: 'form-data', callback: this.cancel});
                }
                else this.$bus.$emit('snackbar', 'Data entered don\'t match validation rules');

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
