import type { AccountId, TokenId, Client } from "@hashgraph/sdk";
import { BigNumber } from "bignumber.js";

import { NetworkName, NetworkSettings } from "../domain/network";
import { Session } from "../domain/user";
import Wallet from "../domain/wallets/wallet";
import { Token } from "../domain/token";

import { kabutoRequest } from "./request";

// Construct a Client
export async function constructClient(
    account: import("@hashgraph/sdk").AccountId,
    wallet: Wallet,
    network: NetworkSettings
): Promise<import("@hashgraph/sdk").Client | undefined> {
    let privateKey: import("@hashgraph/sdk").PrivateKey | null = null;
    let publicKey: import("@hashgraph/sdk").PublicKey | null = null;
    // let signer: (message: Uint8Array) => Promise<Uint8Array>;

    if (wallet.hasPrivateKey()) {
        privateKey = await wallet.getPrivateKey();
    }

    publicKey = await wallet.getPublicKey() as import("@hashgraph/sdk").PublicKey;
    const signer = wallet.signTransaction.bind(wallet) as (message: Uint8Array) => Promise<Uint8Array>;

    let client: import("@hashgraph/sdk").Client | undefined;
    const { Client, AccountId } = await import(/* webpackChunkName: "hashgraph" */ "@hashgraph/sdk");

    if (network.name !== NetworkName.CUSTOM) {
        if (network.name === NetworkName.MAINNET) {
            client = Client.forMainnet();
        } else if (network.name === NetworkName.TESTNET) {
            client = Client.forTestnet();
        } else if (network.name === NetworkName.PREVIEW) {
            client = Client.forPreviewnet();
        }
    } else {
        const accountId = new AccountId(network.node.shard,
            network.node.realm,
            network.node.node);
        client = Client.forNetwork({ [ network.proxy || network.address ]: accountId });
    }

    if (client != null) {
        if (wallet.hasPrivateKey()) {
            client.setOperator(account, privateKey!);
        } else {
            client.setOperatorWith(account, publicKey, signer);
        }
    }

    return client;
}

// Does the operator key belong to this account?
export async function testClient(
    account: import("@hashgraph/sdk").AccountId,
    client: import("@hashgraph/sdk").Client | undefined
): Promise<boolean> {
    const { TransferTransaction, Status } = await import(/* webpackChunkName: "hashgraph" */ "@hashgraph/sdk");

    if (client != null) {
        try {
            const tx = new TransferTransaction();
            tx.addHbarTransfer(account, 0); // Transfer 0 Tinybar
            tx.setMaxTransactionFee(1); // Max Fee 1 Tinybar
            await (await tx.execute(client)).getReceipt(client);
        } catch (error) {
            await handleError(error);
        }
    }

    return false;
}

async function handleError(error: { status: { code: number }; name: string }): Promise<void> {
    const { ReceiptStatusError, PrecheckStatusError, Status } = await import("@hashgraph/sdk");

    if (error instanceof PrecheckStatusError || error instanceof ReceiptStatusError) {
        console.log(error);
        // If the transaction fails with Insufficient Tx Fee, this means
        // that the account ID verification succeeded before this point
        // Same for Insufficient Payer Balance
        if (error.status.code === Status.InsufficientTxFee._code ||
            error.status.code === Status.InsufficientPayerBalance._code) {
            return;
        }
    }
    throw error;
}

export async function constructSession(
    account: import("@hashgraph/sdk").AccountId,
    wallet: Wallet,
    network: NetworkSettings
): Promise<Session | undefined> { // Throws
    try {
        const client = await constructClient(account, wallet, network);
        if (await testClient(account, client)) { // Throws
            if (client != null) {
                return {
                    account,
                    client
                };
            }
        }
    } catch (error) {
        throw error;
    }
}

export async function getBalance(
    accountId: AccountId,
    client: Client
): Promise<import("@hashgraph/sdk/lib/account/AccountBalance").default | null> {
    try {
        const { AccountBalanceQuery } = await import(/* webpackChunkName: "hashgraph" */ "@hashgraph/sdk");

        return new AccountBalanceQuery()
            .setAccountId(accountId)
            .execute(client);
    } catch (error) {
        throw error;
    }
}

interface token {
    id: string;
    decimals: number;
}
interface TokensResult {
    tokens: token[];
}

export async function getTokenDecimals(keys: string[], testnet = false): Promise<Map<string, number>> {
    // /v1/token?q={"$or": [{"id": "0.0.253281"}, {"id": "0.0.253335"}]}
    const queryList: Array<Record<string, string>> = [];
    keys.forEach((key) => {
        queryList.push({ id: key });
    });

    const results = new Map<string, number>();
    const promises: Array<Promise<TokensResult>> = [];

    let i = 0;
    while (i * 50 < keys.length) {
        const querySublist = queryList.slice(i * 50, (i + 1) * 50);
        i += 1;

        promises.push(kabutoRequest<TokensResult>(`v1/token?q={"$or": ${JSON.stringify(querySublist)}}`, testnet));
    }

    (await Promise.all(promises)).forEach((tokensResult) => {
        tokensResult.tokens.forEach((token) => {
            results.set(token.id, token.decimals);
        });
    });

    return results;
}

export async function getTokens(
    accountId: AccountId,
    client: Client,
    testnet?: boolean
): Promise<Token[] | null> {
    const { AccountBalanceQuery } = await import(/* webpackChunkName: "hashgraph" */ "@hashgraph/sdk");

    try {
        const tokenBalances = await new AccountBalanceQuery()
            .setAccountId(accountId)
            .execute(client);
        const tokens: Token[] = [];

        if (!tokenBalances.tokens) {
            return tokens;
        }

        const keys = [ ...tokenBalances.tokens.keys() ];
        const balances = [ ...tokenBalances.tokens.values() ];

        // const keys = [ ...tokenBalances.keys() ];
        // const balances = [ ...tokenBalances.values() ];
        const decimals: Map<string, number> = await getTokenDecimals(keys.map((key) => key.toString()), testnet ?? false);

        for (const [ i, element ] of keys.entries()) {
            tokens.push({
                tokenId: element,
                balance: new BigNumber(balances[ i ].toString()),
                decimals: decimals.get(element.toString())!
            });
        }

        return tokens;
    } catch (error) {
        throw error;
    }
}

export async function associateTokenWithAccount(
    tokenId: TokenId,
    accountId: AccountId,
    client: Client
): Promise<void> {
    const { TokenAssociateTransaction } = await import(/* webpackChunkName: "hashgraph" */ "@hashgraph/sdk");
    try {
        await (await new TokenAssociateTransaction()
            .setAccountId(accountId)
            .setTokenIds([ tokenId ])
            .execute(client))
            .getReceipt(client);
    } catch (error) {
        throw error;
    }
}

export async function sendToken(
    tokenId: TokenId,
    recipient: AccountId,
    client: Client,
    amount: BigNumber,
    memo?: string | null
): Promise<void> {
    try {
        const { TransferTransaction } = await import(/* webpackChunkName: "hashgraph" */ "@hashgraph/sdk");
        const tx = new TransferTransaction()
            .addTokenTransfer(tokenId, recipient, amount.toNumber())
            .addTokenTransfer(tokenId, client.operatorAccountId!, amount.toNumber());

        if (memo != null) {
            tx.setTransactionMemo(memo);
        }

        await (await tx
            .execute(client))
            .getReceipt(client);
    } catch (error) {
        throw error;
    }
}
