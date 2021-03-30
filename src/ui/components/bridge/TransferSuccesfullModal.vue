<template>
    <ModalSuccess
        v-model="state.modalSuccessState"
        @dismiss="handleModalSuccessDismiss"
    >
        <div class="success">
            <i18n path="modalSuccess.txId">
                <strong>{{ state.transactionId }}</strong>
            </i18n>
            <i18n path="modalSuccess.wrapHbar">
                <strong>{{ state.wrapAmount }}</strong>
                <strong>{{ state.ethAddress }}</strong>
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

</template>

<script>
export default {
name: "TransferSuccesfullModal"
}
</script>

<style scoped>

</style>
