declare module '@cashfreepayments/cashfree-js' {
  interface CashfreeCheckoutOptions {
    paymentSessionId: string;
    redirectTarget?: '_modal' | '_self' | '_blank' | string;
  }
  interface CashfreeCheckoutResult {
    error?:          { message: string };
    redirect?:       boolean;
    paymentDetails?: unknown;
  }
  interface CashfreeInstance {
    checkout(opts: CashfreeCheckoutOptions): Promise<CashfreeCheckoutResult>;
  }
  export function load(opts: { mode: 'sandbox' | 'production' }): Promise<CashfreeInstance>;
}
