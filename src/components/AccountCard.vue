<template>
    <div class="account">
        <Identicon :size="60" :value="publicKeyString" class="account-image" />
        <div class="content">
            <div class="top">
                <div class="title">
                    {{ $t("accountCard.account") }}
                </div>
                <div class="account-num">
                    <span>{{ shard }}.{{ realm }}.</span
                    ><strong>{{ account }}</strong>
                    <span v-if="store.state.wallet.sessions.length > 1"
                        >...</span
                    >
                </div>
                <div class="multi-login-icons">
                    <MaterialDesignIcon
                        :icon="mdiChevronDown"
                        class="down-icon"
                        @click="handleChangeSession"
                    />
                    <MaterialDesignIcon
                        :icon="mdiPlus"
                        class="plus-icon"
                        @click="handleAddSession"
                    />
                </div>
            </div>
            <div class="actions">
                <Tooltip
                    :message="$t('accountCard.accountQrCode')"
                    class="action"
                >
                    <MaterialDesignIcon
                        :icon="mdiQrcode"
                        class="qr-icon"
                        @click="showQrCode"
                    />
                </Tooltip>
                <Tooltip
                    v-if="hasKeys"
                    :message="$t('accountCard.keys')"
                    class="action"
                >
                    <MaterialDesignIcon
                        :icon="mdiKey"
                        class="key-icon"
                        @click="showKeys"
                    />
                </Tooltip>
                <ExportKeystoreButton
                    v-if="hasPrivateKey"
                    :private-key="privateKeyString"
                    class="action"
                />
            </div>
        </div>
        <ModalViewAccountId
            v-model="state.viewAccountQrCodeIsOpen"
            :value="{ shard, realm, account }"
        />
        <ModalViewKeys
            v-if="hasKeys"
            v-model="state.viewKeysIsOpen"
            :public-key="publicKeyString"
            :private-key="privateKeyString"
        />
    </div>
</template>

<script lang="ts">
import MaterialDesignIcon from "../components/MaterialDesignIcon.vue";
import { mdiQrcode, mdiKey, mdiPlus, mdiChevronDown } from "@mdi/js";
import Tooltip from "../components/Tooltip.vue";
import {
    computed,
    createComponent,
    reactive,
    watch
} from "@vue/composition-api";
import Identicon from "../components/Identicon.vue";
import ModalViewAccountId from "../components/ModalViewAccountId.vue";
import ExportKeystoreButton from "./ExportKeystoreButton.vue";
import ModalViewKeys from "./ModalViewKeys.vue";
import store from "../store";
import { LOG_IN, CHANGE_SESSION } from "../store/actions";
import { Id, Session, Sessions } from "../store/modules/wallet";
import SoftwareWallet from "../wallets/software/SoftwareWallet";
import { LoginMethod } from "../wallets/Wallet";
import settings from "../settings";

async function getPrivateKey(): Promise<
    import("@hashgraph/sdk").Ed25519PrivateKey | null
> {
    if (store.state.wallet.currentSession !== null) {
        if (store.state.wallet.currentSession.wallet.hasPrivateKey()) {
            return store.state.wallet.currentSession.wallet.getPrivateKey();
        }
    }

    return null;
}

async function getPublicKey(): Promise<
    import("@hashgraph/sdk").PublicKey | null
> {
    if (store.state.wallet.currentSession !== null) {
        return store.state.wallet.currentSession.wallet.getPublicKey();
    }

    return null;
}

interface Props {
    shard: number;
    realm: number;
    account: number;
}

export default createComponent({
    components: {
        MaterialDesignIcon,
        Tooltip,
        Identicon,
        ModalViewAccountId,
        ModalViewKeys,
        ExportKeystoreButton
    },
    props: {
        shard: Number,
        realm: Number,
        account: Number
    },
    setup() {
        const state = reactive({
            viewAccountQrCodeIsOpen: false,
            viewKeysIsOpen: false,
            publicKey: null as import("@hashgraph/sdk").PublicKey | null,
            privateKey: null as
                | import("@hashgraph/sdk").Ed25519PrivateKey
                | null
        });

        watch(
            getPublicKey,
            async (
                result: Promise<import("@hashgraph/sdk").PublicKey | null>
            ) => {
                state.publicKey = await result;
            }
        );

        watch(
            getPrivateKey,
            async (
                result: Promise<
                    import("@hashgraph/sdk").Ed25519PrivateKey | null
                >
            ) => {
                state.privateKey = await result;
            }
        );

        const hasPrivateKey = computed(() =>
            store.state.wallet.currentSession !== null
                ? store.state.wallet.currentSession.wallet.hasPrivateKey()
                : false
        );
        const hasPublicKey = computed(() => state.publicKey !== null);
        const hasKeys = computed(
            () => hasPrivateKey.value || hasPublicKey.value
        );

        const privateKeyString = computed(() => {
            if (state.privateKey !== null) {
                return state.privateKey.toString(true);
            }

            return "";
        });

        const publicKeyString = computed(() => {
            if (state.publicKey !== null) {
                return (state.publicKey as import("@hashgraph/sdk").Ed25519PublicKey).toString(
                    true
                );
            }

            return "";
        });

        async function handleAddSession(): Promise<void> {
            const { Client } = await (import("@hashgraph/sdk") as Promise<
                typeof import("@hashgraph/sdk")
            >);
            const account: Id = { realm: 0, shard: 0, account: 4 };
            const wallet = new SoftwareWallet(
                LoginMethod.PrivateKey,
                state.privateKey as import("@hashgraph/sdk").Ed25519PrivateKey,
                state.publicKey as import("@hashgraph/sdk").Ed25519PublicKey
            );

            const operator = {
                account,
                privateKey: state.privateKey as import("@hashgraph/sdk").Ed25519PrivateKey
            } as import("@hashgraph/sdk").Operator;

            const client = new Client({
                nodes: {
                    [settings.network.proxy]: {
                        shard: 0,
                        realm: 0,
                        account: 3
                    }
                },
                operator
            });
            await store.dispatch(LOG_IN, {
                account,
                wallet,
                client
            });
            console.log(store.state.wallet.sessions);
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

        function showKeys(): void {
            state.viewKeysIsOpen = true;
        }

        function showQrCode(): void {
            state.viewAccountQrCodeIsOpen = true;
        }

        return {
            mdiQrcode,
            mdiKey,
            mdiPlus,
            mdiChevronDown,
            state,
            hasPrivateKey,
            hasPublicKey,
            privateKeyString,
            publicKeyString,
            hasKeys,
            showKeys,
            showQrCode,
            handleAddSession,
            store,
            handleChangeSession
        };
    }
});
</script>

<style lang="postcss" scoped>
.account {
    background-color: var(--color-hera-blue);
    border-radius: 4px;
    color: var(--color-white);
    display: flex;
    padding: 25px;

    @media (max-width: 1024px) {
        padding: 10px;
    }
}

.account-image {
    align-self: flex-start;
    border: 3px solid var(--color-white);
    border-radius: 50%;
    flex-shrink: 0;
    margin-block-start: 10px;
    margin-inline-end: 25px;
    user-select: none;
    width: 60px;

    @media (max-width: 1024px) {
        height: 41px;
        margin-block-start: 0;
        margin-inline-end: 0;
        width: 41px;
    }
}

.title {
    font-size: 22px;
    font-weight: 500;
    user-select: none;

    @media (max-width: 1024px) {
        display: none;
    }
}

.account-num {
    display: inline-block;
    font-size: 14px;
    user-select: none;

    & > span {
        opacity: 0.5;
    }

    & > strong {
        font-weight: 400;
        opacity: 1;
    }

    &:nth-child(3) {
        inset-block-end: 0;
        margin-block-end: 12px;
        overflow: hidden;
        position: absolute;
        text-overflow: ellipsis;

        /* intrinsic sizing for stretch not supported without prefix */
        /* stylelint-disable */
        width: stretch;
        width: -webkit-fill-available;
        width: -moz-available;
        /* stylelint-enable */
        word-break: normal;

        @media (max-width: 1024px) {
            display: none;
        }
    }
}

.multi-login-icons {
    display: inline-block;
}

.actions {
    align-items: center;
    display: flex;
    margin-inline-end: 8px;
}

.action {
    cursor: pointer;
}

.action + .action {
    margin-inline-start: 15px;
}

.content {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    justify-content: space-between;
    width: calc(100% - 60px - 25px);

    @media (max-width: 1024px) {
        flex-direction: row;
    }
}

.top {
    /* Make room for second subtitle, the public key */
    padding-block-end: 33px;
    position: relative;

    @media (max-width: 1024px) {
        align-self: center;
        margin-inline-start: 10px;
        padding-block-end: 0;
    }
}
</style>
