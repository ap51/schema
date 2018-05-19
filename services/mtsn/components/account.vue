<template>
    <v-dialog v-if="visible" v-model="visible" persistent max-width="400px" content-class="dlg">
        <v-card>
            <v-card-title>
                <v-icon class="mr-1 blue--text text--darken-2">fas fa-user-circle</v-icon>
                <span class="headline blue--text text--darken-2">account</span>
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
                <v-btn color="blue darken-2" flat @click.native="profile(true)">profile</v-btn>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-2" flat @click.native="cancel">cancel</v-btn>
                <v-btn color="blue darken-2" flat @click.native="save">save</v-btn>
            </v-card-actions>
        </v-card>

        <profile :visible="dialogs.profile.visible" :object="dialogs.profile.object" @cancel="profile(false)" @save="profileSave"></profile>

    </v-dialog>
</template>

<style scoped>

</style>

<script>
    module.exports = {
        extends: component,
        components: {
            'profile': httpVueLoader('profile'),
        },
        props: [
            'visible',
            'object'
        ],
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
            },
        },
        methods: {
            profile(visible) {
                let user_id = this.auth.id || 0;
                visible && (this.dialogs.profile.object = this.entities.profile[this.entities.user[user_id].profile]);
                !visible && (this.dialogs.profile.object = void 0);
                this.dialogs.profile.visible = visible;
            },
            cancel() {
                this.$emit('cancel');
            },
            save() {
                let user = this.entity;

                if (this.$refs.form.validate()) {

                    user.password = user.password ? md5(`${user.email}.${user.password}`) : void 0;

                    !user.password && (delete user.password);

                    this.$request('account.save', user, {callback: this.cancel});

                    if(this.dialogs.profile.changed) {
                        let data = new FormData();
                        let fields = Object.entries(this.entity);

                        fields.forEach(item => {
                            let [name, value] = item;
                            data.append(name, value);
                        });

                        this.$request('profile.save', data, {
                            encode: 'form-data',
                            callback: this.cancel
                        });
                    }

                    //delete this.object.password;
                }
                else this.$bus.$emit('snackbar', 'Data entered don\'t match validation rules');
            },
            profileSave(profile) {
                //this.dialogs.profile.data = profile;
                this.dialogs.profile.changed = true;

                let user_id = this.auth.id || 0;
                Object.assign(this.entity, profile);

                this.profile(false);
            }
        },
        watch: {
            /* 'visible': function(n) {
                console.log('visible')
            } */
        }
    }

    //# sourceURL=account.js
</script>