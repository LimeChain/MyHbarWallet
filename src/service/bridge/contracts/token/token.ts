import Web3 from "web3";
import { Contract } from "web3-eth-contract";
import { BigNumber } from "bignumber.js";

import { TokenABI } from "../abis";

declare const TOKEN_CONTRACT_ADDRESS: string;
declare const ROUTER_CONTRACT_ADDRESS: string;

// TokenService wraps a contract instance of the WrappedToken contract
export class TokenService {
    private contract: Contract;

    constructor(provider: Web3) {
        this.contract = new provider.eth.Contract(TokenABI, TOKEN_CONTRACT_ADDRESS);
    }

    private static instance: TokenService;
    public static getInstance(provider: Web3) {
        if (!TokenService.instance) {
            TokenService.instance = new TokenService(provider);
        }

        return TokenService.instance;
    }

    // Read operations

    public balanceOf(address: string): Promise<BigNumber> {
        return this.contract.methods.balanceOf(address).call();
    }

    // Write operations

    public approve(amount: BigNumber, options: any = null): Promise<any> {
        return this.contract.methods
            .approve(ROUTER_CONTRACT_ADDRESS, amount)
            .send(options);
    }
}