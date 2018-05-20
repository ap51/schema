<template>
        <v-card>
            <v-card-title>
                <v-icon class="mr-1 blue--text text--darken-2">fas fa-user-circle</v-icon>
                <span class="headline blue--text text--darken-2">{{title}}</span>
            </v-card-title>
            <v-card-text>
                <v-card-text>
                    <v-form ref="form" lazy-validation @submit.prevent>
                        <v-text-field v-model="entity.name"
                                      autofocus
                                      validate-on-blur
                                      label="Name"
                                      required
                                      prepend-icon="fas fa-user"
                                      color="blue darken-2"
                                      hint="any string value"
                                      :rules="[
                                          () => !!entity.name || 'This field is required',
                                      ]"
                        ></v-text-field>
                        <v-text-field v-model="entity.email"
                                      validate-on-blur
                                      label="EMail"
                                      required
                                      prepend-icon="fas fa-at"
                                      color="blue darken-2"
                                      hint="any string value"
                                      :rules="[
                                          () => !!entity.email || 'This field is required',
                                      ]"
                        ></v-text-field>
                        <v-text-field v-model="entity.password"
                                      :required="!entity.id"
                                      validate-on-blur
                                      label="Password"
                                      prepend-icon="fas fa-key"
                                      color="blue darken-2"
                                      hint="any string value"
                                      placeholder="enter password to change"
                                      :rules="[
                                          () => (!entity.id && !!entity.password) || ((!!entity.id && !entity.password)) || ((!!entity.id && !!entity.password)) || 'This field is required'
                                      ]"
                        ></v-text-field>

                    </v-form>
                    <small>*indicates required field</small>
                </v-card-text>

            </v-card-text>
            <v-card-actions>
                <v-btn color="blue darken-2" flat @click.native="profile">profile</v-btn>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-2" flat @click.native="cancel">cancel</v-btn>
                <v-btn color="blue darken-2" flat @click.native="save">save</v-btn>
            </v-card-actions>

            <profile :visible="dialogs.profile.visible" :object="dialogs.profile.object" @cancel="profile" @save="onProfileSave"></profile>

        </v-card>
</template>

<style scoped>

</style>

<script>
    module.exports = {
        extends: component,
        components: {
            'profile': httpVueLoader('profile'),
        },
        props: {
            object: Object,
            title: {
                type: String,
                default: 'account'
            },
        },
        data() {
            return {
                email: '',
                password: '',
                dialogs: {
                    profile: {
                        visible: false,
                        object: void 0
                    }
                }
            }
        },
        computed: {
            entity() {
                return {...this.object};
            }
        },
        methods: {
            cancel() {
                this.$emit('cancel');
            },
            profile(data) {
                let visible = !this.dialogs.profile.visible;

                let user_id = this.auth.id || 0;
                visible && (this.dialogs.profile.object = this.dialogs.profile.object ? {...this.dialogs.profile.object} : this.entities.profile[this.entities.user[user_id].profile]);

                this.dialogs.profile.visible = visible;
            },
            onProfileSave(data) {
                this.dialogs.profile.object = data;
                this.profile();
            },
            save() {
                if (this.$refs.form.validate()) {
                    let user = this.entity;

                    user.password = user.password ? md5(`${user.email}.${user.password}`) : void 0;
                    !user.password && (delete user.password);

                    let callback = void 0;

                    if(this.dialogs.profile.object) {
                        callback = (res) => {
                            this.dialogs.profile.object.user = Object.keys(res.data.entities.user)[0]; //created user id

                            delete this.dialogs.profile.object.image_data; //не нужная информация

                            let data = new FormData();
                            let fields = Object.entries(this.dialogs.profile.object);

                            fields.forEach(item => {
                                let [name, value] = item;
                                data.append(name, value);
                            });

                            this.$request('profile.save', data, {
                                encode: 'form-data',
                                callback: () => this.$emit('saved')
                            });
                        }
                    }

                    this.$emit('save', {user, callback});
                }
                else this.$bus.$emit('snackbar', 'Data entered don\'t match validation rules');
            }
        }
    }

    //# sourceURL=account-card.js
</script>