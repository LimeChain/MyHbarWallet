<template>
    <Button
        :compact="true"
        :label="props.walletAddress"
        @click="connectToMetamask"
    />
</template>

<script lang="ts">
import Button from "../Button.vue";
import { defineComponent, SetupContext, PropType } from "@vue/composition-api";

// export interface State {}

export default defineComponent({
    name: "ConnectWalletButton",
    components: { Button },
    props: {
        state: Object as PropType<{}>,
        walletAddress: { type: String }
    },
    model: {
        prop: "state",
        event: "connect"
    },
    setup(props, context: SetupContext): object {
        function connectToMetamask(): void {
            context.emit("connect");
        }

        return {
            props,
            connectToMetamask
        };
    }
});
</script>

<style scoped>
button{
    font-size: 12px;
    inset-inline-end: 10px;
    min-width: 10px;
    padding: 8px 12px;
}

</style>
