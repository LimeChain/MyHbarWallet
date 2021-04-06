<template>
    <div id="transfer-summary">
        <span class="title">{{ $t("interfaceWrapHbar.summary") }}</span>
        <div class="separator" />
        <p class="row">
            <span class="label">{{ $t("interfaceWrapHbar.asset") }}<InfoButton message="Test Message" /></span>
            <span class="value">Hbar</span>
        </p>
        <p class="row">
            <span class="label">{{ $t("interfaceWrapHbar.receiver") }}</span>
            <span class="value">Test</span>
        </p>
        <p class="row">
            <span class="label">{{ $t("common.amount") }}</span>
            <span class="value">1000</span>
        </p>
        <p class="row">
            <span class="label">{{ $t("interfaceWrapHbar.service.fee") }}</span>
            <span class="value">100</span>
        </p>
        <div class="separator" />
        <p class="row">
            <span class="label">{{ $t("interfaceWrapHbar.totalToReceive") }}</span>
            <span class="value">15</span>
        </p>
    </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, SetupContext } from "@vue/composition-api";
import InfoButton from "../InfoButton.vue";

export interface State {
    isOpen: boolean;
    isBusy: boolean;
    step: number;
    progress: string;
}

export default defineComponent({
    name: "ModalWrapTokens",
    props: { state: Object as PropType<State> },
    components: { InfoButton },
    model: {
        prop: "state",
        event: "change"
    },
    setup(props, context: SetupContext): object {
        function handleChange(): void {
            context.emit("change", { ...props.state, isOpen: false, isBusy: false });
        }
        return {
            props,
            handleChange
        };
    }
});

</script>

<style lang="postcss" scoped>
.title{
    font-weight: bold;
    font-size: 18px;
    line-height: 22px;
    color: #333333;
}

.row{
    display: flex;
    justify-content: space-between;
}

.row .label{
    font-weight: 500;
    font-size: 14px;
    line-height: 17px;
    color: #828282;
    display: flex;
    align-items: center;
}

.row .value{
    font-weight: bold;
    font-size: 14px;
    line-height: 17px;
    color: #333333;
}

.separator {
    border-bottom: 1px solid var(--color-jupiter);
    height: 1px;
    margin-block: 15px;
    width: 100%;
}
</style>

<style>
#transfer-summary .icon{
    width: 15px;
}
</style>
