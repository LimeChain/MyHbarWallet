<template>
    <router-link to="/interface/wrap-hbar">
    <button class="pending-trensfer-button">
        <MaterialDesignIcon
            class="spinner"
            :icon="mdiLoading"
            spin
        />

        <span>{{ label }}</span>
    </button>
    </router-link>
</template>

<script lang="ts">
import { defineComponent, reactive, watch } from "@vue/composition-api";
import { mdiLoading } from "@mdi/js";

import MaterialDesignIcon from "../MaterialDesignIcon.vue";
import Tooltip from "../Tooltip.vue";

export default defineComponent({
    name: "PendingTransferButton",
    components: {
        MaterialDesignIcon,
        Tooltip
    },
    props: {
        label: { type: String, required: true },
        busy: { type: Boolean }
    },
    setup(props) {
        const state = reactive({ showProgress: true });

        watch(
            () => props.busy
        );

        return { mdiLoading };
    }
});
</script>

<style scoped lang="postcss">
button {
    background: rgba(30, 147, 255, 0.1);
    border-radius: 5px;
    border: 1px solid rgba(30, 147, 255, 0.1);
    color: #1E93FF;
    font-size: 13px;
    font-family: Roboto;
    font-style: normal;
    ont-weight: normal;
    line-height: 15px;
    outline: none;
    padding: 5px;
    position: relative;
    user-select: none;
    white-space: nowrap;
    display: flex;
    align-items: center;
}

span{
    margin-left: 5px;
    margin-right: 5px;
}

.spinner{
    line-height: 15px;
}

a{
    text-decoration: none;
}
</style>
