<template>
    <v-dialog v-model="visible" hide-overlay persistent max-width="500px">

        <v-card>
            <v-card-title>
                <v-icon class="mr-1 blue--text text--darken-2">fas fa-user-circle</v-icon>
                <span class="headline blue--text text--darken-2">sign in</span>
            </v-card-title>
            <v-card-text>
                <v-container grid-list-md>
                    <v-layout wrap >
                        <v-form ref="form" class="form" lazy-validation @submit.prevent>
                            <v-flex xs12>
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
                            </v-flex>
                            <v-flex xs12>
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
                            </v-flex>
                        </v-form>
                    </v-layout>
                </v-container>
                <small>*indicates required field</small>
            </v-card-text>
            <v-card-actions>
                <v-btn color="blue darken-2" flat @click.native="signup">sign up</v-btn>
                <v-btn color="blue darken-2" flat @click.native="forgot">I FORGOT</v-btn>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-2" flat @click.native="cancel">cancel</v-btn>
                <v-btn color="blue darken-2" flat @click.native="signin">sign in</v-btn>
            </v-card-actions>

        </v-card>

        <!--<signup :visible="dialog.visible" :object="dialog.object" @save="registrate" @cancel="cancelRegistration"></signup>-->
    </v-dialog>
</template>

<style scoped>
</style>

<script>
    module.exports = {
        extends: component,
        components: {
            //'signup': httpVueLoader('signup')
        },
        props: [
            'visible'
        ],
        data() {
            return {
            }
        },
        methods: {
            cancel() {
                this.$emit('cancel');

            },
            submitted() {
                this.$request(`layout.update`, void 0, {callback: () => {
                        this.$emit('cancel');
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