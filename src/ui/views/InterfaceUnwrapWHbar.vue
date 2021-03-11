<template>
    <InterfaceForm :title="$t('interfaceUnwrapWHbar.title')">
        <div v-if="state.web3Provider && state.web3Provider.selectedAddress">
            Address {{ state.web3Provider.selectedAddress }}, {{ state.whbarBalance }} WHBAR
        </div>
        <TextInput
            :value="state.amount"
            :error="state.amountErrorMessage"
            :suffix="whbarSuffix"
            :valid="isAmountValid"
            has-input
            :label="$t('common.amount')"
            show-validation
            @input="handleInput"
        />

        <IDInput
            ref="idInput"
            :error="state.idErrorMessage"
            :valid="state.idValid"
            :label="$t('common.toAccount')"
            show-validation
            @valid="handleValid"
            @input="handleAccount"
        />

        <OptionalGasPriceField :value="state.gasPrice" @input="handleGasPriceInput" />

        <template v-slot:footer>
            <Button
                :busy="state.isBusy"
                :disabled="!state.idValid || !isAmountValid"
                :label="buttonLabel"
                @click="handleShowSummary"
            />
        </template>

        <ModalSuccess
            v-model="state.modalSuccessState"
            @dismiss="handleModalSuccessDismiss"
        >
            <div class="success">
                <i18n path="modalSuccess.transferred">
                    <strong>{{ amount }}</strong>
                    <strong>{{ state.accountString }}</strong>
                </i18n>
                <div v-if="state.ethereumTransaction">
                    <a
                    :href="state.ethereumTransaction"
                    target="_blank"
                    >Ethereum Transaction</a>
                </div>
            </div>
        </ModalSuccess>

        <ModalUnwrapSummary
            v-model="state.modalSummaryState"
            @submit="handleSendTransfer"
        />
    </InterfaceForm>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, ref, Ref, SetupContext, watch } from "@vue/composition-api";
import { BigNumber } from "bignumber.js";
import { AccountId } from "@hashgraph/sdk";

import TextInput from "../components/TextInput.vue";
import InterfaceForm from "../components/InterfaceForm.vue";
import Button from "../components/Button.vue";
import IDInput, { IdInputElement } from "../components/IDInput.vue";
import { convert, getValueOfUnit, Unit } from "../../service/units";
import ModalUnwrapSummary, { Item, State as ModalSummaryState } from "../components/ModalUnwrapSummary.vue";
import { formatHbar, validateHbar } from "../../service/format";
import OptionalMemoField from "../components/OptionalMemoField.vue";
import ModalSuccess, { State as ModalSuccessState } from "../components/ModalSuccess.vue";
import { actions } from "../store";
import { gasPriceOracle } from "../../service/etherscan";
import OptionalGasPriceField from "../components/OptionalGasPriceField.vue";
import Web3 from "web3";
import Bridge from "../../contracts/bridge.json";
import Whbar from "../../contracts/whbar.json";

let timeout: any = null;
let web3: any;
declare const window: any;

interface State {
    amount: string;
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
    gasPrice: string;
    web3Provider: any;
    bridge: any;
    whbar: any;
    serviceFee: string;
    whbarBalance: string;
    ethBalance: string;
    estimatedApproveTx: string;
    gasLimitApproveTx: string;
    estimatedUnwrapTx: string;
    ethereumTransaction: string;
}

// Defined in vue.config.js.
declare const BRIDGE_CONTRACT_ADDRESS: string;
declare const WHBAR_CONTRACT_ADDRESS: string;
declare const ETHEREUM_CHAIN_ID: string;
declare const ETHEREUM_NETWORK: string;
declare const ETHERSCAN_TX_URL: string;

export default defineComponent({
    components: {
        TextInput,
        InterfaceForm,
        Button,
        ModalSuccess,
        ModalUnwrapSummary,
        OptionalMemoField,
        IDInput,
        OptionalGasPriceField
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
                txType: "unwrapHbar",
                submitLabel: context.root.$t("interfaceSendTransfer.feeSummary.continue").toString(),
                cancelLabel: context.root.$t("interfaceSendTransfer.feeSummary.dismiss").toString(),
                termsShowNonOperator: false
            },
            modalSuccessState: {
                isOpen: false,
                hasAction: false
            },
            gasPrice: "",
            web3Provider: null,
            bridge: null,
            whbar: null,
            serviceFee: "",
            whbarBalance: "",
            ethBalance: "",
            estimatedApproveTx: "",
            gasLimitApproveTx: "",
            estimatedUnwrapTx: "",
            ethereumTransaction: ""
        });

        onMounted(async() => {
            await initWeb3();
            const gasPriceInfo = await gasPriceOracle();
            state.gasPrice = gasPriceInfo.result.SafeGasPrice;
        });

        const idInput: Ref<IdInputElement | null> = ref(null);

        function handleAccount(value: string, account: AccountId | null): void {
            state.idErrorMessage = "";
            state.account = account;
        }

        watch(
            () => state.account,
            (newValue: AccountId | null) => {
                if (newValue) {
                    state.accountString = `${newValue.shard}.${newValue.realm}.${newValue.account}`;
                }
            }
        );

        function handleValid(valid: boolean): void {
            state.idValid = valid;
        }

        async function handleGasPriceInput(value: string): Promise<void> {
            clearTimeout(timeout);
            timeout = setTimeout(async() => {
                if (value && value !== "0") {
                    state.gasPrice = value;
                }
            }, 300);
        }

        async function initWeb3(): Promise<void> {
            if (window.ethereum) {
                state.web3Provider = window.ethereum;
                try {
                    const result = await window.ethereum.request({ method: "eth_requestAccounts" });
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

            if (state.web3Provider.chainId !== ETHEREUM_CHAIN_ID) {
                console.error(context.root.$t("interfaceUnwrapWHBar.invalidChainId", { network: ETHEREUM_NETWORK }));
                return;
            }

            await initContracts();
            web3.currentProvider.on("chainChanged", () => reloadWindow);
            web3.currentProvider.on("accountsChanged", (accounts: string[]) => {
                if (accounts.length === 0) {
                    reloadWindow();
                    return;
                }
                updateBalance();
            });
        }

        async function initContracts(): Promise<void> {
            state.bridge = await new web3.eth.Contract(Bridge.abi, BRIDGE_CONTRACT_ADDRESS);
            state.whbar = await new web3.eth.Contract(Whbar.abi, WHBAR_CONTRACT_ADDRESS);
            state.bridge.setProvider(state.web3Provider);
            state.whbar.setProvider(state.web3Provider);
            await updateBalance();
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

        const isEstimatedApproveValid = computed(() => {
            if (state.serviceFee) {
                return (
                    new BigNumber(state.estimatedApproveTx).isGreaterThan(new BigNumber(0))
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
                .$tc("interfaceUnwrapWHbar.unwrapWHbar", testAmount, { count: truncate.value })
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
                description: context.root.$t("interfaceWrapHbar.bridgeServiceFee").toString(),
                value: isServiceFeeValid && state.serviceFee ? new BigNumber(state.serviceFee) : new BigNumber(0)
            },
            {
                description: context.root.$t("interfaceWrapHbar.ethereumNetworkFee").toString(),
                value: isEstimatedApproveValid && state.estimatedApproveTx ? new BigNumber(state.estimatedApproveTx) : new BigNumber(0)
            }
        ]);

        async function handleShowSummary(): Promise<void> {
            await updateBalance();

            const amountBn = new BigNumber(state.amount ? state.amount : 0);

            if (amountBn.gt(state.whbarBalance)) {
                state.amountErrorMessage = "Insufficient balance";
                return;
            }

            const contractServiceFee = await state.bridge.methods.serviceFee().call();
            const serviceFee = amountBn.multipliedBy(contractServiceFee).dividedBy(100000);

            if (amountBn.minus(serviceFee).lte(0)) {
                state.amountErrorMessage = "Invalid amount provided";
                return;
            }

            const tinyBarAmount = convert(
                state.amount,
                Unit.Hbar,
                Unit.Tinybar,
                false
            );

            const gasPriceWei = web3.utils.toWei(state.gasPrice, "gwei");
            const options = { from: state.web3Provider.selectedAddress, gasPrice: gasPriceWei };

            const gasLimitApproveTxWei = await state.whbar.methods.approve(BRIDGE_CONTRACT_ADDRESS, tinyBarAmount).estimateGas(options);
            const bnGasPrice = new BigNumber(String(gasPriceWei));
            const bnApproveWei = new BigNumber(String(gasLimitApproveTxWei)).multipliedBy(bnGasPrice);

            state.gasLimitApproveTx = gasLimitApproveTxWei;
            state.estimatedApproveTx = web3.utils.fromWei(bnApproveWei.toString(), "ether");
            // state.bridge.methods.burn(tinyBarAmount, web3.utils.fromAscii(state.account?.toString())).estimateGas(options, handleEstimation);

            state.serviceFee = serviceFee.toString();

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

        async function updateBalance(): Promise<void> {
            state.whbarBalance = "";
            const balance = await state.whbar.methods.balanceOf(state.web3Provider.selectedAddress).call();
            state.whbarBalance = convert(
                balance,
                Unit.Tinybar,
                Unit.Hbar,
                false
            );
        }

        // eslint-disable-next-line sonarjs/cognitive-complexity
        async function handleSendTransfer(): Promise<void> {
            state.isBusy = true;
            state.modalSummaryState.isBusy = true;
            const whbarsAmount = parseInt(state.amount) * 10 ** 8;

            const fromAddress = state.web3Provider.selectedAddress;
            const gasPrice = web3.utils.toWei(state.gasPrice, "gwei");

            const approveOptions = { from: fromAddress, gasPrice, gas: state.gasLimitApproveTx };
            const burnOptions = { from: fromAddress, gasPrice };

            try {
                await state.whbar.methods
                    .approve(BRIDGE_CONTRACT_ADDRESS, whbarsAmount)
                    .send(approveOptions);

                await submitBurn(whbarsAmount, burnOptions);
            } catch (error) {
                handleModalSummaryDimiss();
                throw new Error(error);
            }
        }

        async function handleModalSuccessDismiss(): Promise<void> {
            state.modalSuccessState.isOpen = false;
            state.isBusy = false;
            state.amount = "";
            state.account = null;
            state.accountString = "";
            (idInput.value! as IdInputElement).clear();
            state.memo = "";
            state.accountString = "";
            state.serviceFee = "";
            state.ethereumTransaction = "";
            const gasPriceInfo = await gasPriceOracle();
            state.gasPrice = gasPriceInfo.result.SafeGasPrice;
            await updateBalance();
        }

        function submitBurn(whbarsAmount: any, options: any): void {
            state.bridge.methods.burn(whbarsAmount, web3.utils.fromAscii(state.account?.toString()))
                .send(options)
                .on("transactionHash", visualizeSuccessModal)
                .on("error", handleModalSummaryDimiss);
        }

        async function visualizeSuccessModal(hash: string): Promise<void> {
            state.ethereumTransaction = `${ETHERSCAN_TX_URL}${hash}`;

            await actions.refreshBalancesAndRate();
            state.bridge.once("Burn", { topics: [ null, web3.utils.padLeft(state.web3Provider.selectedAddress, 64) ]}, async(error: any, result: any) => {
                if (error) {
                    console.error(error);
                    return;
                }
                await updateBalance();
            });
            state.modalSummaryState.isOpen = false;
            state.modalSuccessState.isOpen = true;
        }

        async function handleModalSummaryDimiss(): Promise<void> {
            state.modalSummaryState.isOpen = false;
            await clearState();
        }

        async function clearState(): Promise<void> {
            state.isBusy = false;
            state.amount = "";
            state.account = null;
            state.accountString = "";
            (idInput.value! as IdInputElement).clear();
            state.memo = "";
            state.accountString = "";
            state.serviceFee = "";
            state.ethereumTransaction = "";
            const gasPriceInfo = await gasPriceOracle();
            state.gasPrice = gasPriceInfo.result.SafeGasPrice;
            await updateBalance();
        }

        return {
            amount,
            state,
            summaryAmount,
            summaryAccount,
            summaryItems,
            buttonLabel,
            isAmountValid,
            whbarSuffix: "WHBAR",
            tinybarSuffix: Unit.Tinybar,
            idInput,
            handleShowSummary,
            handleSendTransfer,
            handleModalSuccessDismiss,
            truncate,
            handleInput,
            handleValid,
            handleAccount,
            handleGasPriceInput
        };
    }
});

function reloadWindow(): void {
    window.location.reload();
}
</script>
<style lang="postcss" scoped>
.success > span:first-of-type {
    display: block;
    padding-block-end: 20px;
}
</style>
