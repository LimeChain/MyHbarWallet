import Web3 from "web3";
import { WebsocketProvider } from "web3-core";
import { toUtf8 } from "web3-utils";
import { Contract } from "web3-eth-contract";
import { BigNumber } from "bignumber.js";

import { RouterABI } from "../abis";

declare const ROUTER_CONTRACT_ADDRESS: string;

// RouterService wraps a contract instance of the Router contract
export class RouterService {
    private static instance: RouterService;

    private contract: Contract;

    public constructor(provider: WebsocketProvider) {
        const web3 = new Web3(provider);

        this.contract = new web3.eth.Contract(RouterABI, ROUTER_CONTRACT_ADDRESS);
        this.contract.setProvider(provider);
    }

    public static getInstance(provider: WebsocketProvider): RouterService {
        if (!RouterService.instance) {
            RouterService.instance = new RouterService(provider);
        }

        return RouterService.instance;
    }

    // Read-only operations

    public async serviceFee(): Promise<BigNumber> {
        return this.contract.methods.serviceFee().call();
    }

    public async wrappedTokensCount(): Promise<BigNumber> {
        return this.contract.methods.wrappedTokensCount().call();
    }

    public async wrappedTokenAt(index: number): Promise<string> {
        return this.contract.methods.wrappedTokenAt(index).call();
    }

    public async nativeToWrappedToken(nativeToken: string): Promise<string> {
        return this.contract.methods.nativeToWrappedToken(nativeToken).call();
    }

    public async wrappedToNativeToken(wrappedToken: string): Promise<string> {
        return this.contract.methods.wrappedToNativeToken(wrappedToken).call();
    }

    // Write operations

    // Executes Router's burn method
    public async burn(amount: BigNumber, receiverAccount: string, wrappedToken: string, options: any = null): Promise<any> {
        return this.contract.methods
            .burn(amount, receiverAccount, wrappedToken)
            .send(options);
    }

    public async getTokens(): Promise<Map<string, string>> {
        const tokensCount = await this.wrappedTokensCount();
        let wrappedTokens = [];
        for (let i = 0; i < Number(tokensCount); i++) {
            wrappedTokens.push(this.wrappedTokenAt(i));
        }

        wrappedTokens = await Promise.all(wrappedTokens);
        let nativeTokens = [];
        for (const wrappedToken of wrappedTokens) {
            nativeTokens.push(this.wrappedToNativeToken(wrappedToken));
        }
        nativeTokens = await Promise.all(nativeTokens);

        const resultMap = new Map();

        // eslint-disable-next-line unicorn/no-for-loop
        for (let i = 0; i < wrappedTokens.length; i++) {
            resultMap.set(toUtf8(nativeTokens[ i ]), wrappedTokens[ i ]);
        }
        return resultMap;
    }
}
