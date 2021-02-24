import { externalRequest } from "./request";

export const metadataEndpoint =
    "http://localhost:6200/api/v1/metadata?gasPriceGwei=";

export async function txMetadata(gasPriceGwei: string): Promise<any> {
    try {
        return await externalRequest(`${metadataEndpoint}${gasPriceGwei}`);
    } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(error);
    }
}
