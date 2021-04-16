import { externalRequest } from "../request";

import { getters } from "../../ui/store";

export async function getToken(tokenId: string): Promise<any> {
    return externalRequest(`${getters.currentNetwork().bridge?.mirrorNodeUrl!}tokens/${tokenId}`);
}
