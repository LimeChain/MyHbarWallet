import { externalRequest } from "./request";

declare const VALIDATOR_METADATA_ENDPOINT: string;

export async function txMetadata(gasPriceGwei: string): Promise<any> {
    try {
        return await externalRequest(`${VALIDATOR_METADATA_ENDPOINT}${gasPriceGwei}`);
    } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(error);
    }
}
