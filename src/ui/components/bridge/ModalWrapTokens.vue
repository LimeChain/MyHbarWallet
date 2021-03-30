<template>
    <div id="modal-wrap-tokens">
    <Modal
        :is-open="state.isOpen"
        not-closable
        :title="$t('interfaceWrapHbar.title')"
        @change="handleChange"
    >
            <TransferSummary
                :amount="state.amount"
                :account="state.account"
                :type="state.txType"
            />
            <Notice>Deposit 10Hbars for transfering to Ethereum</Notice>
        <template v-if="state.step === 1">
            <div class="buttons-containter">
                <Button
                    :busy="state.isBusy"
                    :disabled="false"
                    :compact="true"
                    label="Deposit"
                    @click="handleDeposit"
                />
                <Button
                    :busy="state.isBusy"
                    :compact="true"
                    :disabled="true"
                    label="Claim"
                    @click="handleClaim"
                />
            </div>
        </template>
        <template v-if="state.step === 2">
            <div class="progress-bar">
                <span v-bind:style="{ width: state.progress }"></span>
            </div>
            <div class="status-info">
                <p>Sending</p>
            </div>
        </template>
        <template>
            <div class="steps-component">
                <div class="steps-display">
                    <span class="step-wrapper">
                        <span class="step1">1</span>
                        <span class="step1-label">Deposit</span>
                    </span>
                    <span class="middle"></span>
                    <span class="step-wrapper">
                        <span class="step2 step-inactive">2</span>
                        <span class="step2-label step-label-inactive">Claim</span>
                    </span>
                </div>
            </div>
        </template>

        <!--
        <template>
            <div class="progress-bar">
                <span v-bind:style="{ width: state.progress }"></span>
            </div>
            <div class="status-info">
                <p>Sending</p>
            </div>
        </template>
        -->
    </Modal>
    </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, SetupContext } from "@vue/composition-api";

import Button from "../Button.vue";
import Modal from "../Modal.vue";
import Notice from "../Notice.vue";

import ModalFeeSummaryTitle from "./ModalFeeSummaryTitle.vue";
import ModalFeeSummaryItems from "./ModalFeeSummaryItems.vue";
import ModalFeeSummaryTerms from "./ModalFeeSummaryTerms.vue";
import ModalWrapSummaryItems from "./ModalWrapSummaryItems.vue";
import TransferSummary from "./TransferSummary.vue";

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
        TransferSummary,
        Button,
        Modal,
        Notice,
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

        function handleDeposit(): void {
            props.state.step = 2;
        }
        function handleClaim(): void {
            props.state.step = 1;
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
            handleChange,
            handleDeposit,
            handleClaim
        };
    }
});

</script>

<style lang="postcss" scoped>
.buttons-containter{
    width: 100%;
}

.buttons-containter button{
    width: 40%;
    margin: 5%;
}

.steps-component{
    margin-left: 10px;
    margin-right: 10px;
}

.steps-display{
    display: flex;
    align-items: center;
    width: 60%;
    margin: auto;
}

.step-wrapper{
    display: flex;
    flex-direction: column;
    align-items: center;
}

.step1, .step2{
    display: inline-block;
    text-align: center;
    line-height: 26px;
    width: 26px;
    height: 26px;
    color: #62C0AA;
    background-color: rgba(98, 192, 170, 0.2);
    border: 1px solid rgba(98, 192, 170, 0.2);;
    border-radius: 13px;
}

.step-inactive{
    background-color: rgba(0, 0, 0, 0.05);
    color: #BDBDBD;
}

.step1-label, .step2-label{
    font-family: Montserrat;
    font-style: normal;
    font-weight: bold;
    font-size: 14px;
    line-height: 17px;
    margin-left: 10px;
    margin-right: 10px;
    color: #62C0AA;
}

.step-label-inactive{
    color: #BDBDBD;
}

.middle{
    flex-grow: 1;
    border-bottom: 2px solid #E5E5E5;
    margin-bottom: 20px
}

.progress-bar {
  height: 10px;
  position: relative;
  background: #F3F7FB;
  border-radius: 5px;
  padding: 1px;
  box-shadow: inset 0 -1px 1px rgba(255, 255, 255, 0.3);
  text-align: center;
    margin-top: 30px;
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

<style>
#modal-wrap-tokens .notice{
    background: rgba(98, 192, 170, 0.1);
    border-radius: 5px;
}

#modal-wrap-tokens .notice .message{
    font-family: Montserrat;
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    line-height: 17px;
    color: #62C0AA;
}

</style>
