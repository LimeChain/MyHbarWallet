import Web3 from "web3";
import { WebsocketProvider } from "web3-core";

import { getters } from "../../../ui/store";

export class InfuraProviderService {
    private provider: WebsocketProvider;

    public constructor() {
        this.provider = new Web3.providers.WebsocketProvider(getters.currentNetwork().bridge?.infuraApiUrl!);
    }

    public getProvider(): WebsocketProvider {
        return this.provider;
    }
}
