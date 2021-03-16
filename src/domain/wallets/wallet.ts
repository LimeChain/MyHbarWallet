export default interface Wallet {
    hasPrivateKey(): boolean;
    getPrivateKey(): Promise<import("@hashgraph/sdk").PrivateKey>;
    getPublicKey(): Promise<import("@hashgraph/sdk").PublicKey | null>;
    getLoginMethod(): LoginMethod;
    signTransaction(arg0: Buffer | Uint8Array): Promise<Uint8Array | null>;
}

export enum LoginMethod {
    KeyStore="file",
    PrivateKey="key",
    Mnemonic="phrase",
    PasswordMnemonic="phrasepassword",
    Ledger="ledger",
    Trezor="trezor"
}
