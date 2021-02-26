import { externalRequest } from "./request";

declare const ETHERSCAN_API_KEY: string;
declare const ETHERSCAN_GAS_PRICE_ENDPOINT: string;

export async function gasPriceOracle(): Promise<any> {
    try {
        return await externalRequest(`${ETHERSCAN_GAS_PRICE_ENDPOINT}${ETHERSCAN_API_KEY}`);
    } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(error);
    }
}
