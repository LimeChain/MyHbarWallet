import Web3 from "web3";
import { toUtf8 } from "web3-utils";
import { Contract } from "web3-eth-contract";
import { BigNumber } from "bignumber.js";

import { RouterABI, TokenABI } from "../abis";
import { getters } from "../../../../ui/store";
import { InfuraProviderService } from "../../provider/infura-provider";

// RouterService wraps a contract instance of the Router contract
export class RouterService extends InfuraProviderService {
    private contract: Contract;

    public constructor() {
        super();

        this.contract = new this.web3.eth.Contract(RouterABI, getters.currentNetwork().bridge?.routerContractAddress);
        this.contract.setProvider(this.getProvider());
    }

    // Read-only operations

    public async wrappedAssetsCount(): Promise<BigNumber> {
        return this.contract.methods.wrappedAssetsCount().call();
    }

    public async wrappedAssetAt(index: number): Promise<string> {
        return this.contract.methods.wrappedAssetAt(index).call();
    }

    public async nativeToWrapped(native: string): Promise<string> {
        return this.contract.methods.nativeToWrapped(native).call();
    }

    public async wrappedToNative(wrapped: string): Promise<string> {
        return this.contract.methods.wrappedToNative(wrapped).call();
    }

    // Write operations

    // Executes Router's burn method
    public async burn(amount: BigNumber, receiverAccount: string, wrappedToken: string, options: any = null): Promise<any> {
        return this.contract.methods
            .burn(amount, receiverAccount, wrappedToken)
            .send(options);
    }

    // Returns an array of all wrapped assets {address, symbols}
    public async getWrappedAssets(): Promise<any[]> {
        const tokensCount = await this.wrappedAssetsCount();

        const assets = [];
        for (let i = 0; i < Number(tokensCount); i++) {
            assets.push(this.getWrappedAsset(i));
        }

        return Promise.all(assets);
    }

    public async getWrappedAsset(index: number): Promise<any> {
        const address = await this.wrappedAssetAt(index);
        const web3 = new Web3(this.getProvider());
        const wrappedAssetContract = new web3.eth.Contract(TokenABI, address);
        wrappedAssetContract.setProvider(this.getProvider());

        const symbol = await wrappedAssetContract.methods.symbol().call();
        const decimals = await wrappedAssetContract.methods.decimals().call();

        return {
            address,
            symbol,
            decimals
        };
    }

    // Returns a map of all contract assets (native, wrapped)
    public async getAssets(): Promise<Map<string, string>> {
        const tokensCount = await this.wrappedAssetsCount();
        let wrappedTokens = [];
        for (let i = 0; i < Number(tokensCount); i++) {
            wrappedTokens.push(this.wrappedAssetAt(i));
        }

        wrappedTokens = await Promise.all(wrappedTokens);
        let nativeTokens = [];
        for (const wrappedToken of wrappedTokens) {
            nativeTokens.push(this.wrappedToNative(wrappedToken));
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
