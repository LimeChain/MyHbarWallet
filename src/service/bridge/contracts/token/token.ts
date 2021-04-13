import Web3 from "web3";
import { Contract } from "web3-eth-contract";
import { BigNumber } from "bignumber.js";

import { TokenABI } from "../abis";

// TokenService wraps a contract instance of the WrappedToken contract
export class TokenService {
    private static instance: TokenService;

    private contract: Contract;

    constructor(address: string, provider: Web3) {
        this.contract = new provider.eth.Contract(TokenABI, address);
    }

    // Read operations

    public balanceOf(address: string): Promise<BigNumber> {
        return this.contract.methods.balanceOf(address).call();
    }

    // Write operations

    public approve(address: string, amount: BigNumber, options: any = null): Promise<any> {
        return this.contract.methods
            .approve(address, amount)
            .send(options);
    }
}