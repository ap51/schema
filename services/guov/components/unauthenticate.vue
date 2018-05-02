<template>
    <div class="layout-view ma-4">
        <h1>не аутентифицированный доступ</h1>
        <h2>(не выполнен вход в систему)</h2>

        <v-icon color="red darken-2" class="shadow ma-2">fas fa-user-secret fa-3x</v-icon>
        <h2>{{name}}</h2>

        <v-btn color="blue darken-2" flat="flat" @click="signin">ВОЙТИ</v-btn>
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