# Accounting Operations Guide

This guide covers the **Operations** tab in the CMS Accounting page — where accountants manage manual adjustments, settlements, and reconciliation issues.

## Overview

The Operations tab provides four main functions:

1. **Manual adjustment** — Post corrections directly to the ledger
2. **Nabil settlement** — Mark manual bank payments as settled
3. **Reconciliation drift** — Review and resolve Stripe ↔ ledger mismatches

## Manual Adjustment

Use to record corrections, refunds, or fee adjustments outside normal payment flows.

**Steps:**

1. Select **Merchant** (autocomplete by name)
2. Choose adjustment **Type:**
   - `correction` — Fix an error (e.g., wrong fee calculated)
   - `refund` — Return money (creates negative ledger entry)
   - `fee_correction` — Adjust platform commission
3. Enter **Reason code** (e.g., `PROMO_DISCOUNT`, `PAYMENT_ERROR`)
4. Enter **Amount** in cents (e.g., `1050` = €10.50)
5. Set **Currency** (default: EUR)
6. (Optional) Link to external reference (e.g., ticket ID, invoice number)
7. (Optional) Add a reason note for audit trail
8. Click **Create adjustment**

**Result:** New ledger entry appears immediately with `entry_type=adjustment`.

## Nabil Settlement

Use when you confirm a manual bank transfer (Nabil or other offline payment) has cleared.

**Steps:**

1. Find the ledger entry ID for the payment (from Ledger tab)
2. Enter **Ledger entry id**
3. Enter **Settlement reference** (e.g., bank transaction ID, confirmation number)
4. Click **Mark settled**

**Result:** Ledger entry `settlement_status` changes from `pending_manual` to a settled state.

## Reconciliation Drift

### What is drift?

A mismatch between Stripe balance transactions and platform ledger entries. Each reconciliation run compares them and records differences.

### Severity

- **Warning** — Amount mismatch but both systems have the transaction
- **Critical** — Missing ledger entry or missing Stripe transaction (blocks statement generation)

### How to resolve

The Operations tab shows all **open drift issues**, deduplicated by reference + type.

**Per issue you see:**

- **Severity chip** — warning or critical
- **Drift type** — `missing_ledger`, `amount_mismatch`, `missing_stripe`
- **Row count chip** — shows if duplicates exist (e.g., "21 duplicate rows")
- **Details** — Payment reference, ledger amount, Stripe amount, error message

**To resolve:**

1. Review the issue (click the row to see full details)
2. Investigate:
   - Check if it's a known Stripe delay (< 2 hours old)
   - Check if the ledger entry is genuinely missing
   - Check the payment intent in Stripe dashboard
3. Click **Resolve** — marks **all** duplicate rows for this issue as resolved
4. The page shows success count: "Resolved 21 duplicate drift rows for pi_xxx"

**After resolving critical drift:**
- Statement generation is no longer blocked
- Next reconciliation run may re-create the row if the underlying issue persists
- That's expected — drift is acknowledged, not necessarily fixed

### Summary card

At the top of the Accounting page:

- **Open drift** — number of unique issues (groups)
- **Row count** — total number of drift rows (when duplicates exist)
- **Critical** — count of critical (blocking) issues
- **Runs** — total reconciliation runs executed

## Workflow Tips

### Finding a merchant ID

Use the **Merchant** autocomplete in Manual Adjustment — type the name and it fills the ID.

### Checking recent activity

- **Ledger tab** — See all payments, refunds, adjustments by date
- **Statements tab** — See generated monthly statements
- **Invoices tab** — See issued invoices and delivery status

### Emergency procedures

**Critical drift blocking statement generation:**
1. Review the blocking drift rows (Operations tab)
2. If safe, mark them resolved
3. Retry statement generation
4. Or use `force=true` if you're confident the issue is known and acceptable

**Duplicate drift rows not decreasing:**
1. Check that reconciliation is running (button at top of Accounting page)
2. Run manually if needed: click **Run Stripe reconciliation**
3. Wait for next reconciliation cycle
4. Duplicates should drop as the unique index prevents re-insertion

## Related APIs (for developers)

See `finnep-accounting-service/README.md` for backend drift documentation.
