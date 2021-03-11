<template>
    <Modal
        :is-open="state.isOpen"
        :title="$t('modalFeeSummary.title')"
        not-closable
        @change="handleChange"
    >
        <ModalFeeSummaryTitle
            :amount="state.amount"
            :account="state.account"
            :type="state.txType"
        />
        <div class="separator" />
        <div class="modal-fee-summary-terms">
            <div
                v-if="state.account != null && state.account !== ''"
                class="term"
            >
                <span class="description">Receiving Account
                    <InfoButton :message="$t('modalFeeSummary.whatIsOperator')" />
                </span>
                <span class="value">{{ state.account }}</span>
            </div>
        </div>
        <div class="separator" />
          <ModalUnwrapSummaryItems :items="state.items" />
        <div class="buttons">
            <Button
                compact
                outline
                :label="state.cancelLabel ? state.cancelLabel : $t('common.cancel')"
                class="button"
                type="button"
                @click="handleChange"
            />
            <Button
                compact
                :busy="state.isBusy"
                :label="state.submitLabel ? state.submitLabel : $t('common.continue')"
                class="button"
                type="submit"
                @submit="handleSubmit"
                @click="handleSubmit"
            />
        </div>
    </Modal>
</template>

<script lang="ts">
import { defineComponent, PropType, SetupContext } from "@vue/composition-api";
import { BigNumber } from "bignumber.js";

import InfoButton from "./InfoButton.vue";

import Button from "./Button.vue";
import Modal from "./Modal.vue";
import ModalFeeSummaryTitle from "./ModalFeeSummaryTitle.vue";
import ModalFeeSummaryItems from "./ModalFeeSummaryItems.vue";
import ModalFeeSummaryTerms from "./ModalFeeSummaryTerms.vue";
import ModalUnwrapSummaryItems from "./ModalUnwrapSummaryItems.vue";

export interface Item {
    description: string;
    value: BigNumber | import("@hashgraph/sdk").Hbar | string;
}

export interface State {
    isOpen: boolean;
    isBusy: boolean;
    isFileSummary: boolean;
    account: string;
    amount: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: any[] | readonly any[];
    txType: string;
    submitLabel: string | null;
    cancelLabel: string | null;
    termsShowNonOperator: boolean;
}

export default defineComponent({
    name: "ModalUnwrapSummary",
    props: { state: Object as PropType<State> },
    components: {
        Button,
        Modal,
        ModalFeeSummaryTitle,
        ModalFeeSummaryItems,
        ModalUnwrapSummaryItems,
        ModalFeeSummaryTerms,
        InfoButton
    },
    model: {
        prop: "state",
        event: "change"
    },
    setup(
        props,
        context: SetupContext
    ): object {
        function handleChange(): void {
            context.emit("change", { ...props.state, isOpen: false, isBusy: false });
        }

        function handleSubmit(): void {
            if (!props.state!.isFileSummary) {
                context.emit("submit");
            } else {
                context.emit("submit", true);
            }
        }

        return {
            props,
            BigNumber,
            handleChange,
            handleSubmit
        };
    }
});
</script>

<style lang="postcss" scoped>
.buttons {
    display: flex;
    justify-content: space-between;
    margin-block-start: 40px;
    width: 100%;

    @media (max-width: 600px) {
        align-items: center;
        flex-direction: column-reverse;
    }
}

.button {
    width: 200px;

    @media (max-width: 600px) {
        width: 100%;

        &:last-child {
            margin-block-end: 15px;
        }
    }
}

.separator {
    border-bottom: 1px solid var(--color-jupiter);
    height: 1px;
    margin-block: 15px;
    width: 100%;
}

.modal-unwrap-summary-terms {
    align-items: center;
    display: flex;
    flex-direction: column;
    font-family: "Inconsolata", monospace;
}

.description {
    color: var(--color-washed-black);
    flex-grow: 1;
    font-weight: 500;
}

.value {
    color: var(--color-china-blue);
    font-size: 16px;
    font-weight: 600;
    height: 14px;
    padding: 0;
    text-align: end;
    white-space: pre;
}

.term {
    align-items: center;
    display: flex;
    justify-content: space-between;
    margin-block-end: 5px;
    width: 100%;
}

</style>
