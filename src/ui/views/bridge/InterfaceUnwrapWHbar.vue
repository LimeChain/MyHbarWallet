<template>
    <div id="unwrapHbar">
    <InterfaceForm :title="$t('interfaceUnwrapWHbar.title')" :description="$t('interfaceWrapHbar.description')">
        <span class="connect-wallet-bar">
            <ConnectWalletButton
                :walletAddress="state.metamask ? state.metamask.croppedSelectedAddress() : 'Connect Wallet'"
                @connect="handleConnectToMetamask" />
        </span>
        <span class="label">{{ $t('interfaceWrapHbar.assetLabel') }}</span>
        <Select
            v-model="state.selectedAsset"
            class="select"
            :options="availableAssets"
            @change="handleSelectChange"
        />
        <div
            v-if="state.assetSelectionError"
            class="error"
        >
            {{ state.assetSelectionError }}
        </div>

        <IDInput
            ref="idInput"
            class="account"
            :error="state.accountError"
            :valid="state.accountValid"
            :label="$t('common.toAccount')"
            show-validation
            @input="handleAccount"
            @valid="handleAccountValid"
        />
        <div>
        <div class="balance-container">
            <span class="label-small">{{ $t('interfaceWrapHbar.balanceLabel') }}</span>
            <span class="balance-value">{{ state.assetBalance }}</span>
        </div>

        <TextInput
            :value="state.amount"
            :error="state.amountErrorMessage"
            :valid="isAmountValid"
            has-input
            :label="$t('common.amount')"
            show-validation
            @input="handleInput"
            :suffix="state.asset"
        />
        </div>

        <template v-slot:footer>
            <!-- <Button
                :busy="state.isBusy"
                :disabled="!isEthAddressValid || !isAmountValid || !isSelectedAssetValid"
                :label="$t('interfaceWrapHbar.transferButton')"
                @click="handleShowSummary"
            /> -->
            <Button
                :busy="state.isBusy"
                :disabled="!isAmountValid || !isAssetValid || !state.accountValid || !isMetamaskConnected"
                :label="$t('interfaceWrapHbar.transferButton')"
                @click="handleShowModalUnWrapTokens"
            />
        </template>

        <ModalSuccess
            v-model="state.modalSuccessState"
            @dismiss="handleModalSuccessDismiss"
        >
            <div class="success">
                <p>Transferred <strong>{{state.totalToReceive}} {{state.asset}}</strong> to <strong>{{state.ethAddress}}</strong></p>
                <div class="transactions-list">
                    <p>{{$t("interfaceWrapHbar.transaction.list.title")}}</p>
                    <a :href="state.hederaExplorerTx" target="_blank">{{$t("interfaceWrapHbar.deposit.transaction")}}
                        <MaterialDesignIcon
                                class="launch-icon"
                                :icon="mdiLaunch"
                        />
                    </a>
                </div>
            </div>
        </ModalSuccess>

        <ModalUnwrapTokens
            v-model="state.modalUnWrapTokensState"
            @deposit="handleDeposit"
        />
    </InterfaceForm>
    </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, ref, Ref, SetupContext, watch } from "@vue/composition-api";
import { BigNumber } from "bignumber.js";
import { AccountId } from "@hashgraph/sdk";
import Web3 from "web3";
import { mdiLaunch, mdiHelpCircleOutline } from "@mdi/js";

import TextInput from "../../components/TextInput.vue";
import InterfaceForm from "../../components/InterfaceForm.vue";
import Button from "../../components/Button.vue";
import IDInput, { IdInputElement } from "../../components/IDInput.vue";
import { getValueOfUnit, Unit } from "../../../service/units";
import { RouterService } from "../../../service/bridge/contracts/router/router";
import { TokenService } from "../../../service/bridge/contracts/token/token";
import { InfuraProviderService } from "../../../service/bridge/provider/infura-provider";
import { MetamaskService } from "../../../service/bridge/metamask/metamask";
import { Permit, Domain, permitData } from "../../../service/bridge/contracts/permit";
import ModalSuccess, { State as ModalSuccessState } from "../../components/ModalSuccess.vue";
import Notice from "../../components/Notice.vue";
import { actions, getters } from "../../store";
import { txData } from "../../../service/hedera-validator";
import Select from "../../components/Select.vue";
import ModalUnwrapTokens, { State as ModalUnwrapTokensState } from "../../components/bridge/ModalUnwrapTokens.vue";
import ConnectWalletButton from "../../components/bridge/ConnectWalletButton.vue";
import MaterialDesignIcon from "../../components/MaterialDesignIcon.vue";

let web3: any;
let transactionInterval: any = null;
declare const window: any;

// Defined in vue.config.js.

interface State {
    amount: string | null;
    account: AccountId | null;
    accountString: string | null;
    accountValid: boolean | null;
    memo: string | null;
    isBusy: boolean;
    idErrorMessage: string | null;
    amountErrorMessage: string | null;
    idValid: boolean;
    transactionId: string;
    modalSuccessState: ModalSuccessState;
    modalUnWrapTokensState: ModalUnwrapTokensState;
    ethAddress: string | null;
    ethAddressErrorMessage: string | null;
    gasPrice: string;
    txFee: string;
    serviceFee: string;
    ethereumTransaction: any;
    showEthMessage: boolean;
    wrapAmount: string;
    asset: string;
    selectedAsset: string;
    assetSelectionError: string;
    bridgeTokens: Map<string, any> | null;
    providerService: InfuraProviderService | null;
    routerService: RouterService | null;
    tokenService: TokenService | null;
    contractTokens: any[];
    assetBalance: string;
    metamask: MetamaskService | null;
    transactionData: any;
    totalToReceive: string;
    hederaExplorerTx: string;
}

function oneHourDeadline(currentTimestamp: number): number {
    const oneHour = 60 * 60;
    return currentTimestamp + oneHour;
}

export default defineComponent({
    components: {
        ConnectWalletButton,
        TextInput,
        InterfaceForm,
        Button,
        ModalSuccess,
        ModalUnwrapTokens,
        IDInput,
        Notice,
        Select,
        MaterialDesignIcon
    },
    props: {},
    setup(_: object | null, context: SetupContext) {
        const state = reactive<State>({
            amount: "",
            account: null,
            accountString: "",
            accountValid: null,
            memo: "",
            isBusy: false,
            idErrorMessage: "",
            amountErrorMessage: "",
            idValid: false,
            transactionId: "",
            modalSuccessState: {
                isOpen: false,
                hasAction: false
            },
            modalUnWrapTokensState: {
                isOpen: false,
                isBusy: false,
                noticeText: "",
                depositDisabled: false,
                depositBusy: false,
                depositCompleted: false,
                asset: "",
                receiver: "",
                amount: "",
                serviceFee: "",
                totalToReceive: ""
            },
            ethAddress: "",
            ethAddressErrorMessage: "",
            gasPrice: "",
            txFee: "",
            serviceFee: "",
            ethereumTransaction: null,
            showEthMessage: false,
            wrapAmount: "",
            asset: "",
            selectedAsset: "",
            assetSelectionError: "",
            bridgeTokens: null,
            providerService: null,
            routerService: null,
            contractTokens: [],
            assetBalance: "0",
            metamask: null,
            transactionData: null,
            totalToReceive: "",
            hederaExplorerTx: "",
            tokenService: null
        });

        onMounted(async() => {
            state.routerService = new RouterService();
            state.tokenService = new TokenService();
            await getBridgeTokens();
        });

        const bridgeTokens = computed(() => {
            if (state.bridgeTokens) {
                return [ ...state.bridgeTokens.keys() ];
            }
            return [];
        });

        const firstToken = computed(() => {
            if (bridgeTokens.value != null) return bridgeTokens.value[ 0 ];
            return null;
        });

        const idInput: Ref<IdInputElement | null> = ref(null);

        function handleAccount(value: string, account: AccountId | null): void {
            state.idErrorMessage = "";
            state.account = account;
        }

        async function getBridgeTokens(): Promise<void> {
            // retrieve from contract
            state.contractTokens = await state.routerService?.getWrappedAssets()!;
            const symbolToToken = new Map<string, any>();

            for (const token of state.contractTokens) {
                symbolToToken.set(token.symbol, token);
            }

            state.bridgeTokens = symbolToToken;
        }

        watch(
            () => state.account,
            (newValue: AccountId | null) => {
                if (newValue) {
                    state.accountString = `${newValue.shard}.${newValue.realm}.${newValue.account}`;
                }
            }
        );

        function handleAccountValid(valid: boolean): void {
            state.accountValid = valid;
        }

        const tokens = computed(() => getters.currentUserTokens() || []);

        const isAmountValid = computed(() => {
            if (state.amount) {
                const bigAmount = new BigNumber(state.amount);
                return (
                    !bigAmount.isNaN() &&
                    bigAmount.isGreaterThan(new BigNumber(0))
                );
            }
            return false;
        });

        const isAssetValid = computed(() => {
            if (state.asset) {
                return true;
            }

            return false;
        });

        const isMetamaskConnected = computed(() => state.metamask);

        const scaleFactor = computed(() => {
            const decimals = tokens.value!.filter(
                (token) => token.tokenId.toString() === state.bridgeTokens?.get(state.asset)?.tokenId.toString()
            )[ 0 ].decimals;

            return new BigNumber(
                Math.pow(10, decimals)
            );
        });

        function validateTokenBalance(amount: BigNumber): boolean {
            const adjustedAmount = amount.multipliedBy(scaleFactor.value);
            if (tokens.value != null) {
                return tokens.value.filter(
                    (token) => token.tokenId.toString() === state.bridgeTokens?.get(state.asset)?.tokenId.toString()
                )[ 0 ].balance.isGreaterThan(adjustedAmount);
            }
            return false;
        }

        const isSelectedAssetValid = computed(() => {
            if (state.assetSelectionError) {
                return false;
            }

            return true;
        });

        const availableAssets = computed(() => {
            if (bridgeTokens.value.length > 0) {
                const firstAsset = bridgeTokens.value[ 0 ];
                return bridgeTokens.value;
            }

            return [];
        });

        const isTokenAmountValid = computed(() => {
            if (state.amount) {
                const bigAmount = new BigNumber(state.amount);
                return (
                    !bigAmount.isNaN() &&
                    bigAmount.isGreaterThan(new BigNumber(0)) &&
                    validateTokenBalance(bigAmount)
                );
            }
            return false;
        });

        async function handleAmount(amount: string): Promise<boolean> {
            state.amountErrorMessage = null;
            state.amount = amount;

            const asset = state.bridgeTokens?.get(state.asset);
            const balance = await state.tokenService?.balanceOf(
                asset.address,
                state.metamask!.selectedAddress());

            const balanceBn = new BigNumber(balance!);
            const amountBn = new BigNumber(amount).multipliedBy(10 ** asset.decimals);

            const isLessThan = amountBn.isLessThan(balanceBn);

            if (!isLessThan) {
                state.amountErrorMessage = context.root.$t("interfaceSendToken.insufficientTokenBalance").toString();
                return false;
            }

            return true;
        }

        async function handleShowModalUnWrapTokens(): Promise<void> {
            const isValidAmount = await handleAmount(state.amount!);
            if (!isValidAmount) {
                return;
            }
            const contractServiceFee = getters.currentNetwork().bridge?.serviceFee!;
            const amountBn = new BigNumber(state.amount ? state.amount : 0);
            const serviceFee = amountBn.multipliedBy(contractServiceFee).dividedBy(100000);
            state.totalToReceive = amountBn.minus(serviceFee).toString();

            // state.modalUnWrapTokensState.noticeText = context.root.$t("interfaceWrapHbar.deposit.notice", { amount: state.amount?.toString(), asset: state.asset }).toString();
            state.modalUnWrapTokensState.asset = state.asset;
            state.modalUnWrapTokensState.receiver = state.accountString!;
            state.modalUnWrapTokensState.amount = state.amount?.toString()!;
            state.modalUnWrapTokensState.serviceFee = serviceFee.toString();
            state.modalUnWrapTokensState.totalToReceive = state.totalToReceive;
            state.modalUnWrapTokensState.noticeText = context.root.$t("interfaceUnWrapHbar.deposit.notice", { amount: state.amount?.toString(), asset: state.asset }).toString();
            state.modalUnWrapTokensState.isOpen = true;
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

            // const roundTrippedAmount = convert(
            //     state.amount,
            //     Unit.Hbar,
            //     Unit.Tinybar,
            //     false
            // );

            // state.amount = convert(
            //     roundTrippedAmount,
            //     Unit.Tinybar,
            //     Unit.Hbar,
            //     false
            // );

            boundInput(event, value, state.amount);
        }

        async function handleSelectChange(changedTo: string): Promise<void> {
            state.asset = changedTo;
            console.log(state.asset);
            if (!state.metamask) {
                state.assetSelectionError = "";
                state.assetBalance = "0";
                return;
            }

            state.assetBalance = await getBalance();
            state.assetSelectionError = "";
        }

        async function visualizeSuccessModal(receipt: any): Promise<void> {
            state.hederaExplorerTx = `${getters.currentNetwork().bridge?.mirrorNodeUrl}${state.transactionId}`;
            state.ethereumTransaction = `${getters.currentNetwork().bridge?.etherscanTxUrl}${receipt.transactionHash}`;

            await actions.refreshBalancesAndRate();
            state.modalUnWrapTokensState.isOpen = false;
            state.modalSuccessState.isOpen = true;
            state.isBusy = false;
        }

        async function handleModalSuccessDismiss(error: any, receipt: any): Promise<void> {
            if (receipt) {
                visualizeSuccessModal(receipt.transactionHash);
                return;
            }

            state.modalSuccessState.isOpen = false;
            state.isBusy = false;
            state.amount = "";
            state.memo = "";
            state.serviceFee = "";
            state.ethereumTransaction = null;
            state.showEthMessage = false;
            state.assetBalance = await getBalance();
            state.modalUnWrapTokensState = {
                isOpen: false,
                isBusy: false,
                noticeText: "",
                depositBusy: false,
                depositCompleted: false,
                depositDisabled: false,
                asset: "",
                receiver: "",
                amount: "",
                serviceFee: "",
                totalToReceive: ""
            };
        }

        async function handleValidatorTransactionData(transactionId: string): Promise<void> {
            clearInterval(transactionInterval);
            transactionInterval = setInterval(async() => {
                const transactionData = await txData(transactionId);
                if (transactionData.majority === true) {
                    state.transactionData = transactionData;
                    state.modalUnWrapTokensState.noticeText = context.root.$t("interfaceWrapHbar.claim.notice", { amount: state.totalToReceive, asset: state.asset }).toString();
                    state.modalUnWrapTokensState.depositBusy = false;
                    state.modalUnWrapTokensState.depositCompleted = true;
                    clearInterval(transactionInterval);
                }
            }, 5000);
        }

        async function handleDeposit(): Promise<void> {
            state.modalUnWrapTokensState.noticeText = context.root.$t("interfaceWrapHbar.waitForDeposit").toString();
            state.modalUnWrapTokensState.depositBusy = true;
            const asset = state.bridgeTokens?.get(state.asset);

            const deadline = oneHourDeadline(await state.routerService!.getLatestBlockTimestamp());
            const amountBn = new BigNumber(state.amount!).multipliedBy(10 ** asset.decimals);
            const data = await unsignedData(asset.address, amountBn.toNumber(), deadline);
            const signature = await state.metamask!.signTypedV4Data(data);

            await burnWithPermit(asset.address, state.accountString!, amountBn, deadline, signature);
        }

        async function burnWithPermit(contractAddress: string, account: string, amount: BigNumber, deadline: number, signature: any): Promise<void> {
            const bytesAccount = Web3.utils.fromAscii(account);

            try {
                await state.metamask?.burnWithPermit(
                    contractAddress,
                    bytesAccount,
                    amount,
                    deadline,
                    signature.v,
                    signature.r,
                    signature.s
                );
            } catch (error) {
                console.log(error);
            }
        }

        async function unsignedData(contractAddress: string, amount: number, deadline: number): Promise<string> {
            const contractData = await state.tokenService?.getPermitData(contractAddress, state.metamask!.selectedAddress());
            const id = await state.metamask?.chainId();

            const message: Permit = {
                owner: state.metamask!.selectedAddress(),
                spender: contractData.controller,
                value: amount,
                nonce: contractData.nonce,
                deadline // get latest block and add 1h in seconds
            };

            const domain: Domain = {
                name: contractData.name,
                version: "1",
                chainId: id!,
                verifyingContract: contractAddress
            };

            return permitData(domain, message);
        }

        async function getBalance(): Promise<string> {
            const asset = state.bridgeTokens?.get(state.asset);
            const balance = await state.tokenService?.balanceOf(
                asset.address,
                state.metamask!.selectedAddress())!;

            return new BigNumber(balance)
                .dividedBy(10 ** asset.decimals).toString();
        }

        async function handleConnectToMetamask(): Promise<void> {
            if (state.metamask) {
                actions.alert({
                    message: "Metamask already connected",
                    level: "success"
                });
                return;
            }
            const metamask = new MetamaskService();
            await metamask.initWeb3();
            state.metamask = metamask;
            if (state.asset) {
                state.assetBalance = await getBalance();
            }
            // state.metamaskAddress = metamask.selectedAddress();
            actions.alert({
                message: "Metamask successfully connected",
                level: "success"
            });
        }

        return {
            state,
            isAmountValid,
            hbarSuffix: Unit.Hbar,
            tinybarSuffix: Unit.Tinybar,
            idInput,
            handleModalSuccessDismiss,
            handleShowModalUnWrapTokens,
            handleInput,
            handleAccount,
            mdiHelpCircleOutline,
            mdiLaunch,
            availableAssets,
            handleSelectChange,
            isSelectedAssetValid,
            handleDeposit,
            handleConnectToMetamask,
            isMetamaskConnected,
            handleAccountValid,
            isAssetValid
        };
    }
});
</script>
<style lang="postcss" scoped>
.label{
    font-family: Montserrat;
    font-style: normal;
    font-weight: bold;
    line-height: 15px;
    display: inline-block;
    font-size: 16px;
    height: 24px;
    padding: 0 8px;
}

.connect-wallet-bar{
    text-align: right;
}

.balance-container{
    display:block;
    position: relative;
    top: 20px;
    text-align: right;
}

.label-small{
    font-family: Montserrat;
    font-style: normal;
    font-size: 12px;
    color: #828282;
    margin: 3px;
}

.balance-value{
    font-family: Montserrat;
    font-style: normal;
    font-size: 12px;
    font-weight: 700;
    margin: 3px;
}

.submit-options{
    display: inline-block;
}

.submit-options input{
    margin: 3px;
    background-color: #62C0AA;
}

.success > span:first-of-type {
    display: block;
    padding-block-end: 20px;
}

.success p{
    font-family: Montserrat;
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    line-height: 17px;
    text-align: center;
    color: #828282;
}

.success strong{
    color: black;
}

.success .transactions-list p{
    color: #BDBDBD;
    margin: 0;
}
.success .transactions-list a{
    font-weight: 500;
    font-size: 12px;
    line-height: 15px;
    color: #62C0AA;
}
.success .transactions-list{
    margin-top: 50px;
    text-align: center;
}

.error {
    color: var(--color-lightish-red);
    font-size: 14px;
    margin: 7px 0 0 15px;
}

.launch-icon{
    width: 18px;
}
</style>

<style lang="postcss">
#unwrapHbar .form-main{
    grid-row-gap: 0;
}

#unwrapHbar .select-value-container {
    border: 1px solid #62c0aa;
    border-radius: 4px;
    box-sizing: border-box;
    width: 145px;
    margin-bottom: 13px;
}

#unwrapHbar .select-value-container {
    font-family: Montserrat;
    font-size: 14px;
    font-style: normal;
    font-weight: bold;
    line-height: 17px;
}

#unwrapHbar .select-option {
    font-family: Montserrat;
    font-size: 14px;
    font-style: normal;
    font-weight: bold;
    line-height: 17px;
    width: 145px;
}

#unwrapHbar .select-menu {
    width: 145px;
}

#unwrapHbar .icon {
    color: #62c0aa;
}
</style>
