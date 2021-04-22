import Web3 from "web3";
import { WebsocketProvider } from "web3-core";

import { getters } from "../../../ui/store";

export class InfuraProviderService {
    protected web3: any;

    private provider: WebsocketProvider;

    public constructor() {
        this.provider = new Web3.providers.WebsocketProvider(getters.currentNetwork().bridge?.infuraApiUrl!);
        this.web3 = new Web3(this.provider);
    }

    public getProvider(): WebsocketProvider {
        return this.provider;
    }

    public async getLatestBlockTimestamp(): Promise<number> {
        const blockNumber = await this.web3.eth.getBlockNumber();
        const block = await this.web3.eth.getBlock(blockNumber);

        return block.timestamp;
    }
}
