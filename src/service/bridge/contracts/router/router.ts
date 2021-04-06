import Web3 from "web3";
import { Contract } from "web3-eth-contract";
import { BigNumber } from "bignumber.js";

import { RouterABI } from "../abis";

declare const ROUTER_CONTRACT_ADDRESS: string;

// RouterService wraps a contract instance of the Router contract
export class RouterService {
    private contract: Contract;

    constructor(provider: Web3) {
        this.contract = new provider.eth.Contract(RouterABI, ROUTER_CONTRACT_ADDRESS);
    }

    private static instance: RouterService;
    public static getInstance(provider: Web3) {
        if (!RouterService.instance) {
            RouterService.instance = new RouterService(provider);
        }

        return RouterService.instance;
    }

    // Read-only operations

    public serviceFee(): Promise<BigNumber> {
        return this.contract.methods.serviceFee().call();
    }

    public wrappedTokensCount(): Promise<BigNumber> {
        return this.contract.methods.wrappedTokensCount().call();
    }

    public wrappedTokenAt(index: number): Promise<string> {
        return this.contract.methods.wrappedTokenAt(index).call();
    }

    public nativeToWrappedToken(nativeToken: string): Promise<string> {
        return this.contract.methods.nativeToWrappedToken(nativeToken).call();
    }

    // Write operations

    // Executes Router's mint method
    public mint(transactionId: string, wrappedToken: string, receiver: string, amount: BigNumber, signatures: string[], options: any = null): Promise<any> {
        return this.contract.methods
            .mint(transactionId, wrappedToken, receiver, amount, signatures)
            .send(options);
    }

    // Executes Router's burn method
    public burn(amount: BigNumber, receiverAccount: string, wrappedToken: string, options: any = null): Promise<any> {
        return this.contract.methods
            .burn(amount, receiverAccount, wrappedToken)
            .send(options);
    }

    // TODO: Mint Subscriptions
    // TODO: Burn Subscriptions
}