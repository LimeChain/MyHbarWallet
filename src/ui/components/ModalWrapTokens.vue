<template>
    <div class="modalWrapTokens">
    <Modal
        :is-open="state.isOpen"
        not-closable
        @change="handleChange"
    >
        <template>
            Steps {{state.step}}/2
        </template>
        <template v-if="state.step === 1">
            <ModalFeeSummary />
        </template>
        <template v-else-if="state.step === 2">
            <h1>Step 2</h1>
        </template>
        <template>
            <div class="progress-bar">
                <span v-bind:style="{ width: state.progress }"></span>
            </div>
            <div class="status-info">
                <p>Sending</p>
            </div>
        </template>
    </Modal>
    </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, SetupContext } from "@vue/composition-api";

import Button from "./Button.vue";
import Modal from "./Modal.vue";

import ModalFeeSummaryTitle from "./ModalFeeSummaryTitle.vue";
import ModalFeeSummaryItems from "./ModalFeeSummaryItems.vue";
import ModalFeeSummaryTerms from "./ModalFeeSummaryTerms.vue";
import ModalWrapSummaryItems from "./ModalWrapSummaryItems.vue";

export interface State {
    isOpen: boolean;
    isBusy: boolean;
    step: number;
    progress: string;
}

export default defineComponent({
    name: "ModalWrapTokens",
    props: { state: Object as PropType<State> },
    components: {
        Button,
        Modal,
        ModalFeeSummaryTitle,
        ModalFeeSummaryItems,
        ModalWrapSummaryItems,
        ModalFeeSummaryTerms
    },
    model: {
        prop: "state",
        event: "change"
    },
    setup(props, context: SetupContext): object {
        function handleChange(): void {
            context.emit("change", { ...props.state, isOpen: false, isBusy: false });
        }

        async function setProgress(x: number): Promise<void> {
            let currentProgress = parseInt(props.state.progress);
            if (x >= currentProgress) {
                for (let i = currentProgress; i <= x; i += 1) {
                    currentProgress++;
                    props.state.progress = `${currentProgress}%`;
                    await new Promise((resolve) => setTimeout(resolve, 200));
                }
            }
        }

        props.state.step = 1;
        props.state.progress = "10%";

        setProgress(80);

        return {
            props,
            handleChange
        };
    }
});

</script>

<style lang="postcss" scoped>

.modal > header{
      border-radius: 20px;
}

.progress-bar {
  height: 10px;
  position: relative;
  background: #F3F7FB;
  border-radius: 5px;
  padding: 1px;
  box-shadow: inset 0 -1px 1px rgba(255, 255, 255, 0.3);
  text-align: center;
}
.progress-bar > span {
  display: block;
  height: 100%;
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
  border-top-left-radius: 10px;
  border-bottom-left-radius: 10px;
  background-color: #62C0AA;
  box-shadow:
    inset 0 2px 9px  rgba(255,255,255,0.3),
    inset 0 -2px 6px rgba(0,0,0,0.4);
  position: relative;
  overflow: hidden;
}

.status-info > p{
    color: #62C0AA;
    text-align: center;
    font-family: Montserrat;
    font-size: 12px;
}
</style>
