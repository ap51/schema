<template>
    <keep-alive>
        <component :is="component"></component>
    </keep-alive>
</template>

<style scoped>

</style>

<script>
    module.exports = {
        extends: component,
        props: ['component'],
        data() {
            return {
                
            }
        }
    }

    //# sourceURL=location.js
</script>