`burner.ts` is copied without modifications from the official pm-AMM hackathon kit:

https://github.com/sparkfun-labs/pm-amm/blob/b6fa0f22f47c8d0b07b2e9ebc3268b9a27292b18/examples/burner-wallet/burner.ts

Source retrieved on 2026-09-30. The upstream HACKATHON.md identifies sparkfun-labs/pm-amm as the canonical kit repository. Licensed under MIT; see LICENSE.pm-amm.

`quote.ts` adapts the reference application's `clientSideQuote` from
https://github.com/EwanBorgPad/pm-amm/blob/b1dbaa7ac04665d6f0c4cb1fb3aef0c704c7283d/app/src/hooks/use-swap-quote.ts
with reserve time scaling from the verified quickstart. All curve calculations use the official SDK/math; the app adds only unit conversion and 1% minOutput protection.
