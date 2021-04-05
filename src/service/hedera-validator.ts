import { externalRequest } from "./request";

declare const VALIDATOR_ENDPOINT: string;

export async function txMetadata(gasPriceGwei: string): Promise<any> {
    try {
        return await externalRequest(`${VALIDATOR_ENDPOINT}metadata?gasPriceGwei=${gasPriceGwei}`);
    } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(error);
    }
}

export async function txData(transactionId: string): Promise<any> {
    try {
        return await externalRequest(`${VALIDATOR_ENDPOINT}transfers/${transactionId}`);
    } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(error);
    }
}
