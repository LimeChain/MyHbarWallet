export interface State {
    queue: Error[];
}

export interface LedgerError {
    name?: string;
    message?: string;
    statusCode?: number;
}

export interface LedgerErrorPayload {
    error: LedgerError;
    showAlert: boolean;
}

export interface LedgerErrorTuple {
    message: string;
    error: LedgerError;
}

export interface HederaStatusErrorPayload {
    error: { status: { code: number }; name: string, message: string }
    showAlert: boolean;
}

export interface HederaStatusErrorTuple {
    message: string;
    error: import("@hashgraph/sdk").ReceiptStatusError | import("@hashgraph/sdk").PrecheckStatusError;
}
