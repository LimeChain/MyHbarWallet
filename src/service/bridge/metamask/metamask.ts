import Web3 from "web3";
import { BigNumber } from "bignumber.js";
import { RouterABI } from "../contracts/abis";

declare let window: any;

declare const ETHEREUM_CHAIN_ID: string;
declare const ETHEREUM_NETWORK: string;
declare const ROUTER_CONTRACT_ADDRESS: string;

function reloadWindow(): void {
    window.location.reload();
}

export class MetamaskService {
    private metamaskProvider: any;
    private web3: Web3;

    public async initWeb3(): Promise<void> {
        if (window.ethereum) {
            await window.ethereum.request({ method: "eth_requestAccounts" });
            this.metamaskProvider = window.ethereum;
            this.web3 = new Web3(this.metamaskProvider);
            this.web3.currentProvider.on("chainChanged", reloadWindow);
            this.web3.currentProvider.on("accountsChanged", (accounts: string[]) => {
                if (accounts.length === 0) {
                    reloadWindow();
                }
            });
        } else {
            throw new Error("Metamask not found");
        }

        if (this.metamaskProvider.chainId !== ETHEREUM_CHAIN_ID) {
            throw new Error(`Invalid network selected. It should be ${ETHEREUM_NETWORK}`);
        }
    }

    public selectedAddress(): string {
        return this.metamaskProvider.selectedAddress;
    }

    public croppedSelectedAddress(): string {
        return `${this.metamaskProvider.selectedAddress?.substr(0, 6)}...${this.metamaskProvider.selectedAddress?.substr(this.metamaskProvider.selectedAddress.length - 6)}`;
    }

    public async mint(transactionId: string, wrappedToken: string, receiver: string, amount: BigNumber, signatures: string[], handleReceipt: any, handleError: any): Promise<any> {
        const options = { from: this.selectedAddress() };

        const contract = new this.web3.eth.Contract(RouterABI, ROUTER_CONTRACT_ADDRESS);
        return contract.methods
            .mint(transactionId, wrappedToken, receiver, amount, signatures)
            .send(options)
            .on("receipt", handleReceipt)
            .on("error", handleError);
    }
}
