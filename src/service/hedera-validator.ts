import { externalRequest } from "./request";

import { getters } from "../ui/store";

export async function txMetadata(gasPriceGwei: string): Promise<any> {
    try {
        return await externalRequest(`${getters.currentNetwork().bridge?.validator!}metadata?gasPriceGwei=${gasPriceGwei}`);
    } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(error);
    }
}

export async function txData(transactionId: string): Promise<any> {
    try {
        return await externalRequest(`${getters.currentNetwork().bridge?.validator!}transfers/${transactionId}`);
    } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(error);
    }
}
