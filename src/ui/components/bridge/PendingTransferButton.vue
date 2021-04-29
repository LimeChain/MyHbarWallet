<template>
    <router-link
        to="/interface/wrap-hbar"
        @mouseenter="handleMouseOver"
        @mouseleave="handleMouseOut"
    >
    <button class="pending-trensfer-button">
        <MaterialDesignIcon
            class="spinner"
            :icon="mdiLoading"
            spin
        />

        <span>{{ label }}</span>
    </button>
    <!-- <div class="tooltip">
        There is a pending Bridge transfer. Click above to finish the operation
    </div> -->
    </router-link>
</template>

<script lang="ts">
import { defineComponent, reactive, watch, SetupContext } from "@vue/composition-api";

import { mdiLoading } from "@mdi/js";

import MaterialDesignIcon from "../MaterialDesignIcon.vue";
import Tooltip from "../Tooltip.vue";

type Context = SetupContext & {
    refs: {
        ttEl: HTMLElement;
    };
};

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
    setup(props, context) {
        const state = reactive({ hovered: false });

        watch(
            () => props.busy
        );

        function handleMouseOver(): void {
            console.log("hover");
            state.hovered = true;
        }

        function handleMouseOut(): void {
            state.hovered = false;
        }

        function getPosition(): void {
            const tt = (context as Context).refs.ttEl;
            if (tt) {
                const curleft = tt.getBoundingClientRect().left;
                if (curleft > 2 * (window.innerWidth / 3)) tt.classList.add("on-right");
            }
        }

        return {
            mdiLoading,
            handleMouseOver,
            handleMouseOut
        };
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
    font-weight: normal;
    line-height: 15px;
    outline: none;
    padding: 5px;
    position: relative;
    user-select: none;
    white-space: nowrap;
    display: flex;
    align-items: center;
    cursor: pointer;
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

.tooltip{
    background: #FFFFFF;
    box-shadow: 0px 0px 15px rgba(0, 0, 0, 0.1);
    border-radius: 5px;
    position: relative;
    left: -100px;
    z-index: 9999;
    display: block;
    border: 1px solid var(--color-basalt-grey);
    color: var(--color-china-blue);
    cursor: default;
    font-size: 14px;
    inset-block-end: calc(100% + 12px);
    inset-inline-start: calc((100% / 2));
    line-height: 2;
    margin: 0 auto;
    max-width: 400px;
    padding: 6px 12px;
    pointer-events: none;
    text-align: start;
    transform: translateX(-50%);
    transition: opacity 225ms ease;
    width: max-content;

    &::before {
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 8px solid var(--color-basalt-grey);
        content: "";
        height: 10px;
        inset-block-end: -11px;
        inset-inline: 0;
        margin: 0 auto;
        position: absolute;
        width: 10px;
    }

    &::after {
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 8px solid white;
        content: "";
        height: 10px;
        inset-block-end: -10px;
        inset-inline: 0;
        margin: 0 auto;
        position: absolute;
        width: 10px;
    }
}
</style>
