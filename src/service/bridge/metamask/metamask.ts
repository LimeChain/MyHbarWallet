import Web3 from "web3";

declare let window: any;

declare const ETHEREUM_CHAIN_ID: string;
declare const ETHEREUM_NETWORK: string;

export class MetamaskService {
    private metamaskProvider: any;
    private web3: Web3;

    public async initWeb3(): Promise<void> {
        if (window.ethereum) {
            await window.ethereum.request({ method: "eth_requestAccounts" });
            this.metamaskProvider = window.ethereum;
            this.web3 = new Web3(this.metamaskProvider);
        } else {
            throw new Error("Metamask not found");
        }

        if (this.metamaskProvider.chainId !== ETHEREUM_CHAIN_ID) {
            throw new Error(`Invalid network selected. It should be ${ETHEREUM_NETWORK}`);
        }
    }

    selectedAddress(): string {
        return this.metamaskProvider.selectedAddress;
    }

    // TODO: Metamask 'onChainChanged' && 'accountsChanged' callbacks
}