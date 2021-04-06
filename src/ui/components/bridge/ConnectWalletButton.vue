<template>
    <Button
        :compact="true"
        label="Connect Wallet"
    />
</template>

<script lang="ts">
import Button from "../Button.vue";
import { SetupContext } from "@vue/composition-api";

function connect(): void{
    let a = 4;
    a = 3;
}

export default {
    name: "ConnectWalletButton",
    components: { Button },
    props: {},
    setup(props, context: SetupContext): object {
        let a = 4;
        a = 3;
    }
};
</script>

<style scoped>
button{
    border-radius: 30px;
    font-size: 12px;
    inset-inline-end: 10px;
    min-width: 10px;
    padding: 8px 12px;
}
</style>
