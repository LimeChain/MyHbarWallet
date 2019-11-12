<template>
    <div class="modal-access-account">
        <Modal
            :is-open="state.isOpen"
            :title="$t('modalAccessAccount.title')"
            @change="handleModalChangeIsOpen"
        >
            <AccessAccount is-modal @close="handleModalChangeIsOpen" />
        </Modal>
    </div>
</template>

<script lang="ts">
import AccessAccount from "../components/AccessAccount.vue";
import Modal from "../components/Modal.vue";
import { createComponent, PropType } from "@vue/composition-api";

export interface State {
    isOpen: boolean;
}

export interface Props {
    state: State;
}

export default createComponent({
    components: {
        AccessAccount,
        Modal
    },
    model: {
        prop: "state",
        event: "change"
    },
    props: {
        state: Object as PropType<State>
    },
    setup(props: Props, context) {
        function handleModalChangeIsOpen(isOpen: boolean): void {
            context.emit("change", { ...props.state, isOpen });
        }

        return { handleModalChangeIsOpen };
    }
});
</script>
