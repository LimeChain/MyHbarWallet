<template>
    <div class="interface">
        <InterfaceNavigation />
        <div class="main-container">
            <div class="main">
                <router-view />
            </div>
            <AccountCard
                v-if="account"
                :realm="account.realm"
                :shard="account.shard"
                :account="account.account"
                class="info-account"
                @Add="handleAddSession"
                @ChangeSession="handleChangeSession"
                @List="handleOpenSessionList"
            />
            <BalanceCard class="info-balance" />
            <NetworkCard class="info-network" />
        </div>

        <ModalAccessAccount v-model="state.modalAccessAccountState" />
    </div>
</template>
<script lang="ts">
import InterfaceNavigation from "../components/InterfaceNavigation.vue";
import NetworkCard from "../components/NetworkCard.vue";
import BalanceCard from "../components/BalanceCard.vue";
import AccountCard from "../components/AccountCard.vue";
import {
    computed,
    createComponent,
    SetupContext,
    reactive
} from "@vue/composition-api";
import store from "../store";
import { CHANGE_SESSION } from "../store/actions";
import { Session, Sessions } from "../store/modules/wallet";
import ModalAccessAccount from "../components/ModalAccessAccount.vue";

interface State {
    modalAccessAccount: boolean;
}

export default createComponent({
    components: {
        InterfaceNavigation,
        NetworkCard,
        BalanceCard,
        AccountCard,
        ModalAccessAccount
    },
    setup(props: object, context: SetupContext) {
        const state = reactive({
            modalAccessAccountState: {
                isOpen: false
            }
        });

        if (store.state.wallet.currentSession === null) {
            throw new Error(
                context.root.$t("common.error.noSession").toString()
            );
        }

        // Boolean used to determine if the user has been to interface
        // Otherwise don't show the Logout modal
        store.state.interfaceMenu.hasBeenToInterface = true;

        const account = computed(() =>
            store.state.wallet.currentSession != null
                ? store.state.wallet.currentSession.account
                : null
        );

        function handleAddSession(): void {
            state.modalAccessAccountState.isOpen = true;
        }

        function handleOpenSessionList(): void {
            console.log(
                (store.state.wallet.sessions as Sessions<
                    Session
                >).getSessionList()
            );
        }

        async function handleChangeSession(): Promise<void> {
            if (
                (store.state.wallet.currentSession as Session).account
                    .account == 2
            ) {
                const session = (store.state.wallet.sessions as Sessions<
                    Session
                >).getSession(4) as Session;
                await store.dispatch(CHANGE_SESSION, session);
            } else if (
                (store.state.wallet.currentSession as Session).account
                    .account == 4
            ) {
                const session = (store.state.wallet.sessions as Sessions<
                    Session
                >).getSession(2) as Session;
                await store.dispatch(CHANGE_SESSION, session);
            }
        }

        return {
            account,
            handleAddSession,
            handleChangeSession,
            state
        };
    }
});
</script>

<style lang="postcss" scoped>
.interface {
    display: flex;
    flex-grow: 1;
}

.main-container {
    background-color: var(--color-boysenberry-shadow);
    display: grid;
    flex-grow: 1;
    grid-gap: 15px;
    grid-template-areas:
        "info-account info-balance info-network"
        "main main main";
    grid-template-columns: repeat(3, calc(100% * (1 / 3) - (30px / 3)));
    grid-template-rows: min-content 1fr;
    padding: 20px;

    @media (max-width: 1024px) {
        grid-template-areas:
            "info-account info-account info-account"
            "main main main";
        grid-template-columns: 1fr;
    }
}

.main {
    grid-area: main;
    min-height: 400px;
}

.info-account {
    flex-grow: 1;
    flex-shrink: 0;
    grid-area: info-account;
}

.info-balance {
    flex-shrink: 0;
    grid-area: info-balance;

    @media (max-width: 1024px) {
        display: none;
    }
}

.info-network {
    flex-shrink: 0;
    grid-area: info-network;

    @media (max-width: 1024px) {
        display: none;
    }
}

.actions:first-child {
    display: inline;
}
</style>
