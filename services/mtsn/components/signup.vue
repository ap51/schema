<template>
    <v-dialog v-if="visible" v-model="visible" persistent max-width="400px" content-class="dlg">
        <account-card title="sign up" :object="object" @cancel="cancel" @saved="saved" @save="save"></account-card>
    </v-dialog>
</template>

<style scoped>

</style>

<script>
    module.exports = {
        extends: component,
        components: {
            'account-card': httpVueLoader('account-card'),
        },
        props: [
            'visible',
            'object'
        ],
        data() {
            return {
            }
        },
        computed: {
        },
        methods: {
            cancel() {
                this.$emit('cancel');
            },
            saved() {
                this.$emit('saved');
                this.$emit('cancel');
            },
            save(data) {
                let {user, callback} = data;

                callback = callback || this.saved;

                this.$request('signup.save', user, {callback});
            },
        },
        watch: {
            /* 'visible': function(n) {
                console.log('visible')
            } */
        }
    }

    //# sourceURL=signup.js
</script>