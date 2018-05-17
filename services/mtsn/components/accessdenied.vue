<template>
    <div class="layout-view ma-4">
        <b>ДОСТУП ЗАКРЫТ</b>
        <span>(пользователь не имеет соответствующих прав)</span>

        <v-icon color="red darken-2" class="shadow ma-2">fas fa-minus-circle fa-2x</v-icon>
        <span>{{name}}</span>

        <!--<v-btn color="blue darken-2" flat="flat" @click="signin">ВОЙТИ</v-btn>-->
    </div>
</template>

<style scoped>
    .layout-view {
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: auto;
        height: 100%;
    }

    .layout-view {
        flex-direction: column;
    }

    .layout-view p {
        width: 50vw;
    }

    .layout-view h1 {
        margin-top: 8px;
        margin-bottom: 8px;
    }

</style>

<script>
    module.exports = {
        extends: component,
        mounted() {
        },
        methods: {
            signin() {
                this.$bus.$emit('signin');
            }
        }
    }

    //# sourceURL=unauthorized.js
</script>