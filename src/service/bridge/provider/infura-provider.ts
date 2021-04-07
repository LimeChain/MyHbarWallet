import Web3 from "web3";

import { WebsocketProvider } from "web3-core";

declare const INFURA_API_URL: string;

export class InfuraProviderService {
    private static instance: InfuraProviderService;

    private provider: WebsocketProvider;

    public constructor() {
        this.provider = new Web3.providers.WebsocketProvider(INFURA_API_URL);
    }

    public static getInstance(): InfuraProviderService {
        if (!InfuraProviderService.instance) {
            InfuraProviderService.instance = new InfuraProviderService();
        }

        return InfuraProviderService.instance;
    }

    public getProvider(): WebsocketProvider {
        return this.provider;
    }
}
