<template>
    <InterfaceForm :title="$t('interfaceWrapHbar.title')">
        <TextInput
            :value="state.amount"
            :error="state.amountErrorMessage"
            :suffix="hbarSuffix"
            :valid="isAmountValid"
            has-input
            :label="$t('common.amount')"
            show-validation
            @input="handleInput"
        />

        <TextInput
            :value="state.ethAddress"
            :error="state.eth"
            :valid="isEthAddressValid"
            has-input
            :label="$t('common.ethAddress')"
            show-validation
            @input="handleEthAddressInput"
        />

        <OptionalGasPriceField :value="state.gasPrice" @input="handleGasPriceInput" />

        <template v-slot:footer>
            <Button
                :busy="state.isBusy"
                :disabled="!isEthAddressValid || !isAmountValid"
                :label="buttonLabel"
                @click="handleShowSummary"
            />
        </template>

        <ModalSuccess
            v-model="state.modalSuccessState"
            @dismiss="handleModalSuccessDismiss"
        >
            <div class="success">
                <i18n path="modalSuccess.txId">
                    <strong>{{ state.transactionId }}</strong>
                </i18n>
                <i18n path="modalSuccess.transferred">
                    <strong>{{ amount }}</strong>
                    <strong>{{ state.accountString }}</strong>
                </i18n>
                <div class="empty">
                    <Notice :symbol="mdiHelpCircleOutline" v-if="!state.showEthMessage">
                        {{ $t('interfaceWrapHbar.wrapWaitEthTx') }}
                    </Notice>
                </div>
                <div v-if="state.showEthMessage">
                    <a
                    :href="state.ethereumTransaction"
                    target="_blank"
                    >Ethereum Transaction</a>
                </div>
            </div>
        </ModalSuccess>

        <ModalFeeSummary
            v-model="state.modalSummaryState"
            @submit="handleSendTransfer"
        />
    </InterfaceForm>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, ref, Ref, SetupContext, watch } from "@vue/composition-api";
import { BigNumber } from "bignumber.js";
import { AccountId } from "@hashgraph/sdk";
import Web3 from "web3";
import { mdiHelpCircleOutline } from "@mdi/js";

import TextInput from "../components/TextInput.vue";
import InterfaceForm from "../components/InterfaceForm.vue";
import Button from "../components/Button.vue";
import IDInput, { IdInputElement } from "../components/IDInput.vue";
import { convert, getValueOfUnit, Unit } from "../../service/units";
import ModalFeeSummary, { Item, State as ModalSummaryState } from "../components/ModalFeeSummary.vue";
import { formatHbar, validateHbar } from "../../service/format";
import OptionalGasPriceField from "../components/OptionalGasPriceField.vue";
import ModalSuccess, { State as ModalSuccessState } from "../components/ModalSuccess.vue";
import Notice from "../components/Notice.vue";
import { LoginMethod } from "../../domain/wallets/wallet";
import { actions, getters } from "../store";
import { txMetadata } from "../../service/hedera-validator";
import { gasPriceOracle } from "../../service/etherscan";
import Bridge from "../../contracts/bridge.json";
import Whbar from "../../contracts/whbar.json";
let timeout: any = null;
let web3: any;
declare const window: any;

// Defined in vue.config.js.
declare const BRIDGE_CONTRACT_ADDRESS: string;
declare const WHBAR_CONTRACT_ADDRESS: string;
declare const ETHERSCAN_TX_URL: string;

interface State {
    amount: string | null;
    account: AccountId | null;
    accountString: string | null;
    memo: string | null;
    isBusy: boolean;
    idErrorMessage: string | null;
    amountErrorMessage: string | null;
    idValid: boolean;
    transactionId: string;
    modalSummaryState: ModalSummaryState;
    modalSuccessState: ModalSuccessState;
    ethAddress: string | null;
    ethAddressErrorMessage: string | null;
    gasPrice: string;
    txFee: string;
    serviceFee: string;
    web3Provider: any;
    bridge: any;
    whbar: any;
    ethereumTransaction: any;
    showEthMessage: boolean;
}

const estimatedFeeHbar = new BigNumber(0.01);
const estimatedFeeTinybar = estimatedFeeHbar.multipliedBy(getValueOfUnit(Unit.Hbar));

// Defined in vue.config.js.
declare const ETHEREUM_BRIDGE_CUSTODIAL_ACCOUNT: string;
declare const ETHEREUM_BRIDGE_TOPIC_ID: string;

function getAccountFromString(accountString: string): AccountId {
    const parts = accountString.split(".");
    return new AccountId({ shard: parseInt(parts[ 0 ]), realm: parseInt(parts[ 1 ]), account: parseInt(parts[ 2 ]) });
}

function constructMemo(address: string | null, txFee: string | null, gasPriceGwei: string | null): string {
    return `${address}-${txFee}-${gasPriceGwei}`;
}

export default defineComponent({
    components: {
        TextInput,
        InterfaceForm,
        Button,
        ModalSuccess,
        ModalFeeSummary,
        OptionalGasPriceField,
        IDInput,
        Notice
    },
    props: {},
    setup(_: object | null, context: SetupContext) {
        const state = reactive<State>({
            amount: "",
            account: null,
            accountString: "",
            memo: "",
            isBusy: false,
            idErrorMessage: "",
            amountErrorMessage: "",
            idValid: false,
            transactionId: "",
            modalSummaryState: {
                isOpen: false,
                isBusy: false,
                isFileSummary: false,
                account: "",
                amount: "",
                items: [],
                txType: "transfer",
                submitLabel: context.root.$t("interfaceSendTransfer.feeSummary.continue").toString(),
                cancelLabel: context.root.$t("interfaceSendTransfer.feeSummary.dismiss").toString(),
                termsShowNonOperator: true,
                isWrapSummary: true
            },
            modalSuccessState: {
                isOpen: false,
                hasAction: false
            },
            ethAddress: "",
            ethAddressErrorMessage: "",
            gasPrice: "",
            txFee: "",
            serviceFee: "",
            web3Provider: null,
            bridge: null,
            whbar: null,
            ethereumTransaction: null,
            showEthMessage: false
        });

        onMounted(async() => {
            await initWeb3();
            const gasPriceInfo = await gasPriceOracle();
            state.gasPrice = gasPriceInfo.result.SafeGasPrice;
            const metadata = await txMetadata(state.gasPrice);
            state.txFee = new BigNumber(metadata.txFee).toString();
        });

        state.account = getAccountFromString(ETHEREUM_BRIDGE_CUSTODIAL_ACCOUNT);

        const idInput: Ref<IdInputElement | null> = ref(null);

        function handleAccount(value: string, account: AccountId | null): void {
            state.idErrorMessage = "";
            state.account = account;
        }

        function handleEthAddressInput(value: string | null): void {
            state.ethAddress = value;
        }

        async function handleGasPriceInput(value: string): Promise<void> {
            clearTimeout(timeout);
            timeout = setTimeout(async() => {
                if (value && value !== "0") {
                    state.gasPrice = value;
                    const metadata = await txMetadata(state.gasPrice);
                    state.txFee = new BigNumber(metadata.txFee).toString();
                }
            }, 300);
        }

        watch(
            () => state.account,
            (newValue: AccountId | null) => {
                if (newValue) {
                    state.accountString = `${newValue.shard}.${newValue.realm}.${newValue.account}`;
                }
            }
        );

        async function initWeb3(): Promise<void> {
            if (window.ethereum) {
                state.web3Provider = window.ethereum;
                try {
                    await window.ethereum.enable();
                    web3 = new Web3(state.web3Provider);
                } catch (error) {
                    console.error(context.root.$t("interfaceUnwrapWHbar.userDeniedAccess").toString());
                    return;
                }
            } else if (window.web3) {
                state.web3Provider = window.web3.givenProvider;
                web3 = new Web3(state.web3Provider);
            } else {
                console.error(context.root.$t("interfaceUnwrapWHbar.noWeb3Provider").toString());
                return;
            }
            await initContracts();
        }

        async function initContracts(): Promise<void> {
            state.bridge = await new web3.eth.Contract(Bridge.abi, BRIDGE_CONTRACT_ADDRESS);
            state.whbar = await new web3.eth.Contract(Whbar.abi, WHBAR_CONTRACT_ADDRESS);
            state.bridge.setProvider(state.web3Provider);
            state.whbar.setProvider(state.web3Provider);
        }

        function handleValid(valid: boolean): void {
            state.idValid = valid;
        }

        const isAmountValid = computed(() => {
            if (state.amount) {
                return (
                    new BigNumber(state.amount).isGreaterThan(new BigNumber(0)) && validateHbar(state.amount)
                );
            }
            return false;
        });

        const isServiceFeeValid = computed(() => {
            if (state.serviceFee) {
                return (
                    new BigNumber(state.serviceFee).isGreaterThan(new BigNumber(0)) && validateHbar(state.serviceFee)
                );
            }
            return false;
        });

        const isTxFeeValid = computed(() => {
            if (state.txFee) {
                return (
                    new BigNumber(state.txFee).isGreaterThan(new BigNumber(0)) && validateHbar(state.txFee)
                );
            }
            return false;
        });

        const isEthAddressValid = computed(() => {
            if (state.ethAddress) {
                return (
                    Web3.utils.isAddress(state.ethAddress)
                );
            }
            return false;
        });

        const amount = computed(() => {
            if (state.amount) {
                return formatHbar(new BigNumber(state.amount));
            }
            return formatHbar(new BigNumber(0));
        });

        const truncate = computed(() => amount.value && amount.value.length > 15 ?
            `${amount.value.slice(0, 13)}...` :
            amount.value);

        const buttonLabel = computed(() => {
            let testAmount = 0;

            if (state.amount != null) {
                const amount = new BigNumber(state.amount);

                if (amount.gt(1)) testAmount = 2;
                else if (amount.lt(1)) testAmount = 0;
                else testAmount = 1;
            }

            return context.root
                .$tc("interfaceWrapHbar.wrapHbar", testAmount, { count: truncate.value })
                .toString();
        });

        // Modal Fee Summary State
        const summaryAmount = computed(() => amount.value);
        const summaryAccount = computed(() => state.accountString);
        const summaryItems = computed((): Item[] => [
            {
                description: context.root.$t("interfaceSendTransfer.transferAmount").toString(),
                value:
                            isAmountValid && state.amount ?
                                new BigNumber(state.amount) :
                                new BigNumber(0)
            },
            {
                description: context.root.$t("interfaceWrapHbar.hederaNetworkFee").toString(),
                value: estimatedFeeHbar
            },
            {
                description: context.root.$t("interfaceWrapHbar.ethereumNetworkFee").toString(),
                value: isTxFeeValid && state.txFee ?
                    new BigNumber(convert(state.txFee, Unit.Tinybar, Unit.Hbar, false)) : new BigNumber(0)
            },
            {
                description: context.root.$t("interfaceWrapHbar.bridgeServiceFee").toString(),
                value: isServiceFeeValid && state.serviceFee ? new BigNumber(state.serviceFee) : new BigNumber(0)
            }
        ]);

        async function handleShowSummary(): Promise<void> {
            const amountBn = new BigNumber(summaryAmount.value);
            const txFee = new BigNumber(convert(
                state.txFee.toString(),
                Unit.Tinybar,
                Unit.Hbar,
                false
            ));
            if (amountBn.lt(txFee)) {
                state.amountErrorMessage = `Amount must be at least ${txFee} hbars`;
                return;
            }
            const contractServiceFee = await state.bridge.methods.serviceFee().call();
            const serviceFee = amountBn.minus(txFee).multipliedBy(contractServiceFee).dividedBy(100000);

            if (amountBn.minus(txFee).minus(serviceFee).lte(0)) {
                state.amountErrorMessage = `Amount must be at least ${txFee.plus(serviceFee)} hbars (includes bridge service fee)`;
                return;
            }

            state.serviceFee = serviceFee.toString();
            console.log(constructMemo(state.ethAddress, state.txFee.toString(), state.gasPrice));
            state.modalSummaryState.account = summaryAccount.value!;
            state.modalSummaryState.amount = summaryAmount.value!;
            const items: readonly Item[] = summaryItems.value!;
            state.modalSummaryState.items = items;
            state.modalSummaryState.isOpen = true;
        }

        // Taken from [UnitConverter]
        function boundInput(
            event: Event,
            inputValue: string,
            stateValue: string
        ): void {
            // If the computed value from the round-trip from {input} -> left -> right
            // is different than {input} then we should replace {input} so as
            // to prevent typing more

            const computedValueNum = new BigNumber(stateValue);
            const valueNum = new BigNumber(inputValue);

            if (!computedValueNum.eq(valueNum)) {
                // Computed value is different from input value; replace
                (event.target as HTMLInputElement).value = stateValue;
            } else {
                // Strip non-digit chars from input
                (event.target as HTMLInputElement).value = inputValue.replace(
                    /[^\d.]/,
                    ""
                );
            }
        }

        // Taken from [UnitConverter]
        function handleInput(value: string, event: Event): void {
            if (!/^\d*\.?\d*$/.test(value)) {
                value = state.amount || "";
            }

            state.amount = value;
            state.amountErrorMessage = "";

            const roundTrippedAmount = convert(
                state.amount,
                Unit.Hbar,
                Unit.Tinybar,
                false
            );

            state.amount = convert(
                roundTrippedAmount,
                Unit.Tinybar,
                Unit.Hbar,
                false
            );

            boundInput(event, value, state.amount);
        }

        async function handleError(error: { status: { code: number }; name: string }): Promise<void> {
            // eslint-disable-next-line require-atomic-updates
            state.idErrorMessage = "";
            // eslint-disable-next-line require-atomic-updates
            state.amountErrorMessage = "";

            const { HederaStatusError, Status } = await import(/* webpackChunkName: "hashgraph" */ "@hashgraph/sdk");

            if (error instanceof HederaStatusError) {
                const errorMessage = (await actions.handleHederaError({
                    error,
                    showAlert: false
                })).message;

                // Small duplication of effort to assign errorMessage to correct TextInput
                switch (error.status.code) {
                    case Status.InvalidAccountId.code:
                    case Status.AccountRepeatedInAccountAmounts.code:
                        state.idErrorMessage = errorMessage;
                        break;
                    case Status.InsufficientAccountBalance.code:
                        state.amountErrorMessage = errorMessage;
                        break;
                    default:
                        if (errorMessage !== "") {
                            actions.alert({
                                message: errorMessage,
                                level: "warn"
                            });
                        } else {
                            throw error; // Unhandled Error Modal will open
                        }
                }
            } else if (
                error.name === "TransportStatusError" &&
                    getters.currentUser().wallet.getLoginMethod() ===
                        LoginMethod.Ledger
            ) {
                actions.handleLedgerError({
                    error,
                    showAlert: true
                });
            } else {
                throw error;
            }
        }

        // eslint-disable-next-line sonarjs/cognitive-complexity
        async function handleSendTransfer(): Promise<void> {
            state.isBusy = true;
            state.modalSummaryState.isBusy = true;
            const client = getters.currentUser().session.client;

            try {
                if (state.account == null) {
                    throw new Error(context.root
                        .$t("common.error.nullAccountOnInterface")
                        .toString());
                }

                if (state.amount == null) {
                    throw new Error(context.root
                        .$t("common.error.nullTransferAmount")
                        .toString());
                }

                const recipient: AccountId | null = state.account;
                const { CryptoTransferTransaction, Hbar } = await import(/* webpackChunkName: "hashgraph" */ "@hashgraph/sdk");
                const sendAmount = new Hbar(state.amount);

                const tx = new CryptoTransferTransaction()
                    .addSender(
                        getters.currentUser().session.account,
                        sendAmount
                    )
                    .addRecipient(recipient, sendAmount)
                    .setMaxTransactionFee(Hbar.fromTinybar(estimatedFeeTinybar));

                state.memo = constructMemo(state.ethAddress, state.txFee.toString(), state.gasPrice);

                if (state.memo == null || state.memo === "") {
                    state.memo = " "; // Hack for Nano X paging
                }

                tx.setTransactionMemo(state.memo);

                const transactionIntermediate = await tx.execute(client);
                const receipt = await transactionIntermediate.getReceipt(client);

                if (receipt != null) {
                    const { shard, realm, account } = transactionIntermediate.accountId;
                    const { seconds, nanos } = transactionIntermediate.validStart;

                    // build the transaction id from the data.
                    state.transactionId = `${shard}.${realm}.${account}-${seconds}-${nanos}`;

                    const hexTransactionId = web3.utils.sha3(state.transactionId);

                    state.bridge.once("Mint", { topics: [ null, null, hexTransactionId ]}, (error: any, result: any) => {
                        if (error) {
                            console.error(error);
                            return;
                        }

                        state.ethereumTransaction = `${ETHERSCAN_TX_URL}${result.transactionHash}`;
                        state.showEthMessage = true;
                    });
                }

                // Refresh Balance
                await actions.refreshBalancesAndRate();

                // eslint-disable-next-line require-atomic-updates
                state.modalSummaryState.isOpen = false;
                state.modalSuccessState.isOpen = true;
            } catch (error) {
                handleError(error);
            } finally {
                // eslint-disable-next-line require-atomic-updates
                state.modalSummaryState.isBusy = false;
                state.modalSummaryState.isOpen = false;
                state.isBusy = false;
            }
        }

        async function handleModalSuccessDismiss(): Promise<void> {
            state.modalSuccessState.isOpen = false;
            state.isBusy = false;
            state.amount = "";
            state.memo = "";
            state.ethAddress = "";
            const gasPriceInfo = await gasPriceOracle();
            state.gasPrice = gasPriceInfo.result.SafeGasPrice;
            const metadata = await txMetadata(state.gasPrice);
            state.txFee = new BigNumber(metadata.txFee).toString();
            state.serviceFee = "";
            state.ethereumTransaction = null;
            state.showEthMessage = false;
        }

        return {
            amount,
            state,
            summaryAmount,
            summaryAccount,
            summaryItems,
            buttonLabel,
            isAmountValid,
            hbarSuffix: Unit.Hbar,
            tinybarSuffix: Unit.Tinybar,
            idInput,
            handleShowSummary,
            handleSendTransfer,
            handleModalSuccessDismiss,
            truncate,
            handleInput,
            handleValid,
            handleAccount,
            isEthAddressValid,
            handleEthAddressInput,
            handleGasPriceInput,
            mdiHelpCircleOutline
        };
    }
});
</script>
<style lang="postcss" scoped>
.success > span:first-of-type {
    display: block;
    padding-block-end: 20px;
}
</style>
