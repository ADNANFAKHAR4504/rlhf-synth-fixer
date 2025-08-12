# MODEL_FAILURES.md

This document records discrepancies between **MODEL_RESPONSE.md** and **PROMPT.md**, with concrete evidence and impact. The evaluated response is **Terraform HCL**; the prompt explicitly requires **Terraform CDK (CDKTF) in TypeScript**.

---

## Repro (what was evaluated)

* Reviewed `lib/MODEL_RESPONSE.md` against `lib/PROMPT.md`.
* No synth/deploy attempted because there is **no CDKTF app** (no `bin/`, no TS constructs, no `cdktf.json`, no `package.json`).

> Observed structure in MODEL\_RESPONSE: `modules/*/*.tf`, `environments/*/*.tf`, `backend/*.tf`. No TypeScript files present.

---

## Findings

### Technology Mismatch

* **Violates:** “All code must be written using **Terraform CDK (TypeScript)**.”
* **Evidence:** Response consists entirely of `*.tf` (HCL). No TypeScript, no CDKTF.
* **Impact:** Cannot run `cdktf synth`/`cdktf deploy`. Fails core requirement.

### Missing CDKTF Application Scaffolding

* **Violates:** “Directory structure should include `bin/` (entrypoint), `modules/` or `lib/` (reusable stacks), `test/`,.”
* **Evidence:** No `bin/`, no `lib/` TS constructs, no `cdktf.json`, no `package.json`, no tests.
* **Impact:** No executable CDKTF app; cannot synthesize or test.

### Secrets Handling Not Per Prompt

* **Violates:** “Database credentials must not be hardcoded. Use `passwordSecretArn` or `passwordEnvVarName` at synth.”
* **Evidence:** RDS module expects a plain `password` variable; no Secrets Manager or synth-time env handling.
* **Impact:** Security requirement unmet.

### Multi-Environment Validation Not Demonstrated

* **Violates:** “Validate that the configuration is deployable in all environments without changing logic.”
* **Evidence:** No CDKTF workspaces or commands; no tests proving dev/staging/prod deployability.
* **Impact:** Cannot prove environment portability.

### Testing Absent

* **Violates:** “`test/` for unit and integration tests.”
* **Evidence:** No test framework or tests.
* **Impact:** No automated verification of DRY constraints or cross-stack wiring.

### Version Pinning Incomplete for CDKTF Toolchain

* **Violates:** “Provider and module version pinning.”
* **Evidence:** AWS provider is pinned in HCL, but no CDKTF/TypeScript dependency pins (no `package.json`).
* **Impact:** Non-deterministic builds even if later ported.

### Backend/State Isolation Shown in HCL, Not in CDKTF

* **Violates:** “Configure a remote S3 + DynamoDB backend for state isolation” (within the CDKTF solution).
* **Evidence:** HCL `backend "s3"` blocks exist; CDKTF-native backend/workspace config absent.
* **Impact:** Doesn’t satisfy state isolation requirement for a CDKTF app.

### Separation of Concerns Only Partial in Naming

* **Violates:** “Use environment suffixes and workspace-specific variables/overrides.”
* **Evidence:** Naming uses `${environment}`; CDKTF workspace/override mechanics not present.
* **Impact:** Partially met; needs CDKTF implementation.

---

## Summary

The provided response is a reasonable **HCL modular design**, but it **does not implement the required CDKTF TypeScript solution** and therefore cannot be synthesized, tested, or deployed per the prompt.

---

## Remediation plan (for IDEAL\_RESPONSE.md)

1. **Port to CDKTF (TypeScript):** Implement `VpcStack`, `SecurityStack`, `Ec2Stack`, `RdsStack`, `S3Stack` in `lib/` with shared props for DRY.
2. **Scaffold app:** Add `bin/app.ts`, `cdktf.json`, `package.json` with pinned CDKTF & providers; include `README.md`.
3. **Secrets:** Support both `passwordSecretArn` (AWS Secrets Manager) and `passwordEnvVarName` (`process.env.DB_PASSWORD` at synth).
4. **State & envs:** Configure remote **S3 + DynamoDB** backend and CDKTF workspaces for `dev/staging/prod`; ensure no code changes per env.
5. **Tests:**

   * Unit: synth and assert resources in `cdk.tf.json`.
   * Integration: assert cross-stack outputs (e.g., VPC ID consumed by EC2/RDS; S3 naming policy).
6. **Runbook:** Provide commands:

   ```bash
   npm ci && npm run build
   npx cdktf synth
   npx cdktf deploy --app "node bin/app.js" --auto-approve
   npm test
   ```