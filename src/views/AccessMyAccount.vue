<template>
    <div class="access-my-account">
        <div class="wrap">
            <PageTitle :title="$t('common.accessMyAccount')">
                {{ $t("accessMyAccount.dontHaveAnAccount") }}
                <router-link :to="{ name: 'create-account' }">
                    {{ $t("accessMyAccount.createANewAccount") }}
                </router-link>
            </PageTitle>
            <AccessAccount />
        </div>

        <FAQs />
    </div>
</template>

<script lang="ts">
import AccessAccount from "../components/AccessAccount.vue";
import FAQs from "../components/FAQs.vue";
import PageTitle from "../components/PageTitle.vue";
import { createComponent } from "@vue/composition-api";

export default createComponent({
    components: {
        FAQs,
        AccessAccount,
        PageTitle
    },
    setup() {
        return {};
    }
});
</script>

<style lang="postcss" scoped>
a {
    color: var(--color-melbourne-cup);
    cursor: pointer;
    text-decoration: none;
}

.access-my-account {
    display: flex;
    flex-direction: column;
}

.wrap {
    align-items: center;
    display: flex;
    flex-direction: column;
    padding: 80px 0;

    @media (max-width: 600px) {
        padding: 20px 0;
    }
}
</style>
