<template>
    <div class="layout-view ma-4">
        <b>ПРОИЗОШЛА КАКАЯ-ТО ХЕРНЯ...</b>
        <span>(страница не найдена)</span>

        <v-icon color="red darken-2" class="shadow ma-2">fas fa-unlink fa-2x</v-icon>
        <!--<h2>{{name}}</h2>-->
        <span>{{address.url}}</span>

        <v-btn color="blue darken-2" flat>Попросить сервер еще раз</v-btn>
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
            console.log(this.name)
        },
        activated() {
            console.log(this.name)
        },
        methods: {
/*
            asdasreload1() {
                //window.location.pathname = this.$state.base + this.$state.path;
                //this.$page(this.address.ident);
            }
*/
        },
    }

    //# sourceURL=not-found.js
</script>