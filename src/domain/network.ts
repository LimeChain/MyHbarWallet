// If NodeId is ever exported from the SDK, replace this
export interface NodeId {
    shard: number;
    realm: number;
    node: number;
}

// Cannot use computed members in string enum
// So cannot translate these with i18n here
// Instead, use their keys, then translate for display later
export enum NetworkName {
    MAINNET = "network.mainnet",
    TESTNET = "network.testnet",
    PREVIEW = "network.previewnet",
    CUSTOM = "network.custom"
}

export interface NetworkSettings {
    proxy: string | null;
    address: string;
    node: NodeId;
    name: NetworkName;
    bridge?: BridgeSettings;
}

export interface BridgeSettings {
    routerContractAddress: string; // address of router contract address
    bridgeAccount: string; // Hedera account id of bridge
    validator: string;
    etherscanTxUrl: string;
    infuraApiUrl: string;
    ethereumChainId: string;
    ethereumNetwork: string;
    mirrorNodeUrl: string;
}

// Likewise, cannot use computed keys, so duplicate them here
export const availableNetworks: { [key: string]: NetworkSettings } = {
    "network.testnet": {
        proxy: "https://grpc-web.testnet.myhbarwallet.com",
        address: "0.testnet.hedera.com:50211",
        node: { shard: 0, realm: 0, node: 3 },
        name: NetworkName.TESTNET,
        bridge: {
            routerContractAddress: "0x24c61EB6c08dEB5A78EafCd84F6Fa50d2890A80D",
            bridgeAccount: "0.0.512994",
            validator: "http://34.89.159.242/api/v1/",
            etherscanTxUrl: "https://ropsten.etherscan.io/tx/",
            infuraApiUrl: "wss://ropsten.infura.io/ws/v3/41e87d933f3d489e8bb910eaec0948b9",
            ethereumChainId: "0x3",
            ethereumNetwork: "Ropsten",
            mirrorNodeUrl: "http://testnet.mirrornode.hedera.com/api/v1/transactions/"
        }
    },
    "network.previewnet": {
        proxy: "https://grpc-web.previewnet.myhbarwallet.com",
        address: "0.previewnet.hedera.com:50211",
        node: { shard: 0, realm: 0, node: 3 },
        name: NetworkName.PREVIEW,
        bridge: {
            routerContractAddress: "0x4c08D852c710163a4e0Afe516558c5332D9dc7Dd",
            bridgeAccount: "0.0.30739",
            validator: "http://35.234.123.113/api/v1/",
            etherscanTxUrl: "https://ropsten.etherscan.io/tx/",
            infuraApiUrl: "wss://ropsten.infura.io/ws/v3/41e87d933f3d489e8bb910eaec0948b9",
            ethereumChainId: "0x3",
            ethereumNetwork: "Ropsten",
            mirrorNodeUrl: "http://previewnet.mirrornode.hedera.com/api/v1/transactions/"
        }
    },
    "network.mainnet": {
        proxy: "https://grpc-web.myhbarwallet.com",
        address: "35.237.200.180:50211",
        node: { shard: 0, realm: 0, node: 3 },
        name: NetworkName.MAINNET
    }
};
