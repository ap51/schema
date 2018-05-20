<template>
    <v-dialog v-if="visible" v-model="visible" persistent max-width="500px">

        <v-card>
            <v-card-title>
                <v-icon class="mr-1 blue--text text--darken-2">fas fa-user-circle</v-icon>
                <span class="headline blue--text text--darken-2">sign in</span>
            </v-card-title>
            <v-card-text>
                <v-card-text>
                    <v-form ref="form" class="form" lazy-validation @submit.prevent>
                        <v-text-field v-model="email"
                                      label="Email"
                                      required
                                      prepend-icon="fas fa-at"
                                      autofocus
                                      color="blue darken-2"
                                      :rules="[
                                          () => !!email || 'This field is required',
                                      ]"
                        ></v-text-field>
                        <v-text-field v-model="password"
                                      label="Password"
                                      type="password"
                                      required
                                      prepend-icon="fas fa-key"
                                      color="blue darken-2"
                                      :rules="[
                                          () => !!password || 'This field is required',
                                      ]"
                        ></v-text-field>
                    </v-form>
                    <small>*indicates required field</small>
                </v-card-text>
            </v-card-text>
            <v-card-actions>
                <v-btn color="blue darken-2" flat @click.native="signup(true)">sign up</v-btn>
                <v-btn color="blue darken-2" flat @click.native="forgot">I FORGOT</v-btn>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-2" flat @click.native="cancel">cancel</v-btn>
                <v-btn color="blue darken-2" flat @click.native="signin">sign in</v-btn>
            </v-card-actions>

        </v-card>

        <signup :visible="dialogs.signup.visible" :object="dialogs.signup.object" @saved="submitted" @cancel="signup(false)"></signup>

    </v-dialog>
</template>

<style scoped>
</style>

<script>
    module.exports = {
        extends: component,
        components: {
            'signup': httpVueLoader('signup'),
        },
        props: [
            'visible'
        ],
        data() {
            return {
                dialogs: {
                    signup: {
                        visible: false,
                        object: void 0
                    }
                }
            }
        },
        methods: {
            signup(visible) {
                //visible && this.$emit('cancel');
                visible && (this.dialogs.signup.object = this.entities.user[0]);
                !visible && (this.dialogs.signup.object = void 0);
                this.dialogs.signup.visible = visible;
            },
            cancel() {
                this.$emit('cancel');

            },
            submitted() {
                this.$request(`layout.update`, void 0, {callback: () => {
                        this.$emit('cancel');
                        this.update();
                    }
                });
            },
            signin() {
                if (this.$refs.form.validate()) {
                    let data = {
                        email: this.email,
                        password: md5(`${this.email}.${this.password}`),
                    };

                    this.$request(`signin.submit`, data, { callback: this.submitted, encode: true });

                }
                else this.$bus.$emit('snackbar', 'Data entered don\'t match validation rules');
            }
        }
    }

    //# sourceURL=signin.js
</script>