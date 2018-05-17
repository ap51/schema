<template>
    <v-dialog v-model="visible" persistent max-width="400px">
        <v-card>
            <v-card-title>
                <v-icon class="mr-1 blue--text text--darken-2">fas fa-sign-out-alt</v-icon>
                <span class="headline blue--text text--darken-2">sign out</span>
            </v-card-title>
            <v-card-text>
                THIS ACTION WILL SIGN YOU OUT!
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-2" flat @click.native="cancel">cancel</v-btn>
                <v-btn color="blue darken-2" flat @click.native="submit">sign out</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<style scoped>
    .flex {
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
    }

</style>

<script>
    module.exports = {
        extends: component,
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
                        this.update();
                    }
                });
/*
                this.$emit('cancel');
                this.clearCache({reload: true});
*/
            },
            submit() {
                this.$request('signout.submit', void 0, {method: 'DELETE', callback: this.submitted});
            }
        }
    }

    //# sourceURL=signout.js
</script>