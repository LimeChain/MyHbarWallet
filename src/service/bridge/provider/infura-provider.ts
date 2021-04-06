import Web3 from "web3";

import { WebsocketProvider } from "web3-core";

declare const INFURA_API_URL: string;

export class InfuraProviderService {
    private provider: WebsocketProvider;

    constructor() {
        this.provider = new Web3.providers.WebsocketProvider(INFURA_API_URL);
    }

    private static instance: InfuraProviderService;
    public static getInstance() {
        if (!InfuraProviderService.instance) {
            InfuraProviderService.instance = new InfuraProviderService();
        }

        return InfuraProviderService.instance;
    }

    public getProvider() {
        return this.provider;
    }
}