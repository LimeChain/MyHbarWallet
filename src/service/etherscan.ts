import { externalRequest } from "./request";

const ETHERSCAN_API_KEY = "Y2UTKP86K5EYBGZ64YIH6N3IBGNQAJ8M21";

export const etherscanGasPriceTrackerEndpoint =
    `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${ETHERSCAN_API_KEY}`;

export async function gasPriceOracle(): Promise<any> {
    try {
        return await externalRequest(`${etherscanGasPriceTrackerEndpoint}`);
    } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(error);
    }
}
