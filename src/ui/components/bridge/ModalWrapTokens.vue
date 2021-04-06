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
            <Notice>{{ state.noticeText }}</Notice>
        <template>
            <p class="fee-display">
                <span class="fee-label">{{ $t("interfaceWrapHbar.hedera.fee") }}<InfoButton message="Test Message" /></span>
                <span class="fee-value">0.1</span>
            </p>
        </template>
        <template v-if="state.step === 1">
            <div class="buttons-containter">
                <Button
                    :busy="state.isBusy"
                    :disabled="false"
                    :compact="true"
                    :label="$t('interfaceWrapHbar.deposit')"
                    @click="handleDeposit"
                />
                <Button
                    :busy="state.claimBusy"
                    :compact="true"
                    :disabled="true"
                    :label="$t('interfaceWrapHbar.claim')"
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
                        <span class="step1-label">{{$t('interfaceWrapHbar.deposit')}}</span>
                    </span>
                    <span class="middle"></span>
                    <span class="step-wrapper">
                        <span class="step2 step-inactive">2</span>
                        <span class="step2-label step-label-inactive">{{$t('interfaceWrapHbar.claim')}}</span>
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

import TransferSummary from "./TransferSummary.vue";

export interface State {
    isOpen: boolean;
    isBusy: boolean;
    step: number;
    progress: string;
    noticeText: string;
    depositBusy: boolean;
    claimBusy: boolean;
}

export default defineComponent({
    name: "ModalWrapTokens",
    props: { state: Object as PropType<State> },
    components: {
        TransferSummary,
        Button,
        Modal,
        Notice
    },
    model: {
        prop: "state",
        event: "change"
    },
    setup(props, context: SetupContext): object {
        props.state.noticeText = "Transfer hbar to ...";
        props.state.depositBusy = false;
        function handleChange(): void {
            context.emit("change", { ...props.state, isOpen: false, isBusy: false });
        }

        function handleDeposit(): void {
            props.state.isBusy = true;
            props.state.depositBusy = true;
            props.state.noticeText = context.root.$t("interfaceWrapHbar.waitForDeposit");
            console.log("click");
        }
        function handleClaim(): void {
            props.state.claimBusy = true;
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

.fee-display{
    display: flex;
    justify-content: space-between;
    margin-bottom: 0;
}

.fee-display .fee-label{
    font-weight: 500;
    font-size: 14px;
    line-height: 17px;
    color: #828282;
    display: flex;
    align-items: center;
}

.fee-display .fee-value{
    font-weight: bold;
    font-size: 14px;
    line-height: 17px;
    color: #333333;
}

.steps-component{
    margin-left: 10px;
    margin-right: 10px;
}

.steps-display{
    display: flex;
    align-items: center;
    width: 70%;
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
    font-size: 12px;
}

</style>

<style>

#modal-wrap-tokens {
    font-family: Montserrat;
    font-style: normal;
}

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
