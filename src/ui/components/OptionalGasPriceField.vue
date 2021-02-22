<template>
    <div class="gas-price-container">
        <div class="header">
            <div class="text">
                {{ $t("common.gasPrice") }}
            </div>
            <div class="gas-price-switch">
                <div class="text">
                    {{ $t("common.optional") }}
                </div>
                <SwitchButton
                    v-model="state.showGasPrice"
                    class="btn"
                    @change="handleChangeShowGasPrice"
                />
            </div>
        </div>
        <div
            class="gas-price-input"
            :class="{ expanded: state.showGasPrice }"
        >
            <TextInput
                ref="input"
                :value="value"
                :placeholder="$t('common.gasPrice')"
                :tabindex="state.showGasPrice ? null : '-1'"
                @input="handleInput"
            />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, reactive, SetupContext } from "@vue/composition-api";

import TextInput from "./TextInput.vue";
import SwitchButton from "./SwitchButton.vue";

interface Context extends SetupContext {
    refs: {
        input: HTMLInputElement;
    };
}

export default defineComponent({
    name: "OptionalMemoField",
    components: {
        TextInput,
        SwitchButton
    },
    model: {
        prop: "value",
        event: "input"
    },
    props: { value: { type: String, default: "" }},
    setup(props, context) {
        const state = reactive({ showGasPrice: false });

        function handleInput(gasPrice: string): void {
            context.emit("input", gasPrice);
        }

        function handleChangeShowGasPrice(showGasPrice: boolean): void {
            if (showGasPrice) {
                if (
                    ((context as unknown) as Context).refs.input !== undefined
                ) {
                    ((context as unknown) as Context).refs.input.focus();
                }
            } else {
                context.emit("input", "");
            }
        }

        return { state, handleInput, handleChangeShowGasPrice };
    }
});
</script>

<style scoped lang="postcss">
.gas-price-container {
    border-bottom: 2px solid var(--color-peral);
    border-top: 2px solid var(--color-peral);
    margin-block-end: 20px;
    padding: 20px 0;
}

.gas-price-switch {
    align-items: center;
    align-self: flex-end;
    display: flex;

    & > .text {
        color: var(--color-melbourne-cup);
        font-size: 16px;
        margin-inline-end: 13px;
    }
}

.gas-price-container > .header {
    align-items: center;
    display: flex;
    flex-grow: 0;
    justify-content: space-between;
    padding: 0 10px;
    width: 100%;

    & > .text {
        color: var(--color-washed-black);
        font-size: 16px;
        font-weight: 600;
    }
}

.gas-price-input {
    padding-inline: 10px;
    transition: max-height 0.3s ease, padding-block-start 0.3s ease;

    @media screen and (prefers-reduced-motion: reduce) {
        transition: none;
    }
}

.gas-price-input:not(.expanded) {
    max-height: 0;
    opacity: 0;
    padding-block-start: 0;
}

.gas-price-input.expanded {
    max-height: 800px;
    opacity: 1;
    padding-block-start: 30px;
}
</style>
