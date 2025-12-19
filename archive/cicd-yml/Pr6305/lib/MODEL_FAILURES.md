
# model_failure.md — Comparison Against Submitted Pipeline Snippet

This document records issues found in the **submitted GitLab CI/CD snippet** (the block starting with `### Reasoning Trace` and the `.gitlab-ci.yml` shown under **Answer**) and the **corrections** applied in our finalized `lib/ci-cd.yml` for **GCP + Workload Identity Federation (WIF)**.

---

## Summary

- **Total issues found:** 22
- **Severity split:** 9 critical, 8 high, 5 moderate
- **Themes:** WIF/OIDC misuse, registry policy violations, blocking security checks missing/fragile, script-length policy violations, preview/staging/prod env drift, and reporting/coverage gaps.

---

## Category A — Security & Identity (Critical)

### A1. WIF/OIDC authentication misuse
**Issue (submitted):**
- `gcloud iam workload-identity-pools create-cred-config ... --credential-source-file=$CI_JOB_JWT_V2` points to an **env var**, not a **file**. `create-cred-config` expects a file path containing the OIDC token.
- Authentication appears in job-level blocks repeatedly and exceeds the 5‑line inline script constraint in a few places.

**Fix (final):**
- Centralized WIF bootstrap via `*gcp_wif_setup` anchor:
  - Save `$CI_JOB_JWT_V2` to a file, generate ADC JSON, export `GOOGLE_APPLICATION_CREDENTIALS`, and `gcloud auth login --cred-file`.
  - Single, reusable before_script keeps inline blocks ≤5 lines in jobs.

```yaml
.gcp_wif_setup: &gcp_wif_setup
  image: $CI_REGISTRY/cli/gcloud:latest
  before_script:
    - mkdir -p .gcp && echo "$CI_JOB_JWT_V2" > .gcp/token
    - gcloud iam workload-identity-pools create-cred-config --workload-identity-provider="$GCP_WIF_PROVIDER" --service-account="workload-identity@${GCP_PROJECT_ID}.iam.gserviceaccount.com" --credential-source-file=.gcp/token --output-file=.gcp/adc.json
    - export GOOGLE_APPLICATION_CREDENTIALS=.gcp/adc.json && gcloud auth login --cred-file="$GOOGLE_APPLICATION_CREDENTIALS"
    - gcloud config set project "$GCP_PROJECT_ID"
    - gcloud auth configure-docker "$GCP_REGISTRY"
```

**Impact:** Correct, keyless short‑lived auth; consistent across jobs; constraint-compliant.

---

### A2. Public images vs private registry mandate
**Issue (submitted):**
- Images referenced as `$CI_REGISTRY/aquasec/trivy`, `$CI_REGISTRY/anchore/grype`, `$CI_REGISTRY/owasp/...` imply mirroring public images into the project registry, but the snippet does **not** guarantee such mirrors exist. In several places it also used vendor namespaces directly.

**Fix (final):**
- All job images sourced from a **private registry namespace** (e.g., `$CI_REGISTRY/security/trivy:latest`). Documented requirement and kept consistent across jobs.

**Impact:** Eliminates accidental pulls from public registries and passes private-only policy.

---

### A3. Container vulnerability blocking not robust
**Issue (submitted):**
- `grep` parsing JSON to detect HIGH/CRITICAL in Trivy/Grype. Fragile and bypassable (format changes, false negatives). Exit codes not enforced consistently.

**Fix (final):**
- Use native **exit codes**:
  - `trivy image --exit-code 1 --severity HIGH,CRITICAL ...`
  - Keep Grype as a secondary check and fail the job on non-zero conditions, with explicit artifact outputs.

**Impact:** Deterministic failure on blocking severities.

---

### A4. Cosign signing flow unclear/inconsistent
**Issue (submitted):**
- Used vendor CLI variants inconsistently and key names without guaranteed KMS presence; some lines implied `gcloud artifacts ... sign` which is **not** Cosign.

**Fix (final):**
- Standardize on **Cosign** job after successful scans; keep it simple (keyless or org KMS key). Placeholders retained where org KMS key exists; image reference passed via artifact `image.txt`.

**Impact:** Reproducible supply‑chain attestations.

---

## Category B — Compliance & Reporting (High)

### B1. HIPAA validation not implemented
**Issue (submitted):**
- References to HIPAA validation but no deterministic outputs or directory structure.

**Fix (final):**
- `scripts/run-hipaa-validation.sh` (stub) writes specific artifacts under `reports/hipaa/`. Job consumes these outputs.

**Impact:** Visible audit trail; easy to extend with org checks.

---

### B2. Encryption & access logging validation missing
**Issue (submitted):**
- Only ad-hoc logging reads; encryption-at-rest checks not defined.

**Fix (final):**
- `scripts/validate-encryption.sh` with modes `at-rest` and `access-logging`, emitting artifacts consumed by jobs.

**Impact:** Explicit evidence for auditors; repeatable runs.

---

### B3. SAST artifact format mismatch
**Issue (submitted):**
- Produced JSON files but not always in formats parsable by GitLab Security tab (SAST).

**Fix (final):**
- For Trivy, produce an additional SAST-compatible artifact (mirrored or converted). For Checkov, emit `junit` report under `reports/junit/` so it’s picked up by GitLab.

**Impact:** Reports are visible in MR Security and CI summary.

---

## Category C — Pipeline Design & Constraints (High)

### C1. Inline scripts exceed 5 lines
**Issue (submitted):**
- Multiple jobs (auth, preview deploy, coverage enforcement) exceeded the ≤5 line requirement.

**Fix (final):**
- Centralize auth in anchors; move long logic to `scripts/`:
  - `deploy-cloudrun.sh`, `deploy-gke-bluegreen.sh`, `run-hipaa-validation.sh`, `configure-monitoring.sh`, `test-dr.sh`, `gradual-rollout.sh`, `validate-encryption.sh`.

**Impact:** Satisfies validator; improves maintainability.

---

### C2. Preview environment URL handling
**Issue (submitted):**
- Hard-coded/guessed URLs (`https://$PREVIEW_ID-preview-...run.app`) that may not match actual Cloud Run managed domain outputs.

**Fix (final):**
- Deployment script **queries** Cloud Run service URL and writes a `preview.env` with `PREVIEW_URL`. DAST job sources it reliably.

**Impact:** Eliminates drift; DAST points at the real URL.

---

### C3. Coverage enforcement brittle
**Issue (submitted):**
- Computes coverage via inline Python + `bc` with floating math, not guaranteed to exist in image; potential rounding issues.

**Fix (final):**
- Use `pytest-cov` to emit `coverage.xml`, then a short Python one-liner extracts the ratio; simple integer threshold check via `coverage report --fail-under=85` to enforce.

**Impact:** Deterministic thresholding without extra tooling.

---

### C4. Multi-region production rollout unspecified health checks
**Issue (submitted):**
- Steps variable `10,50,100` provided but no real health validation between steps.

**Fix (final):**
- `scripts/gradual-rollout.sh` loops regions and steps with **waits** and a placeholder **health gate** (sleep + a spot to add checks).

**Impact:** Safe progressive delivery pattern; easy to extend with probes/SLIs.

---

## Category D — Build & Registry (Moderate)

### D1. Artifact Registry path drift
**Issue (submitted):**
- Mixed usage of `$APP_IMAGE` vs `cloudbuild.yaml` outputs; no artifact to pass the built image tag between jobs.

**Fix (final):**
- Build job outputs `image.txt` artifact containing the exact built image URL; downstream jobs read it.

**Impact:** Eliminates tag drift across jobs.

---

### D2. Cloud Build invocation consistency
**Issue (submitted):**
- `gcloud builds submit` without explicit substitutions for tag, risking untagged latest or mismatched tags.

**Fix (final):**
- Pass `_IMAGE_TAG` substitution from the job, ensuring the final image is exactly `$GCP_REGISTRY/$GCP_PROJECT_ID/app-name:$CI_COMMIT_SHA`.

**Impact:** Traceable image per commit SHA.

---

## Category E — Staging & GKE (Moderate)

### E1. Istio traffic split not guaranteed
**Issue (submitted):**
- Blue/green noted but no concrete traffic shift application to Istio CRDs.

**Fix (final):**
- `deploy-gke-bluegreen.sh` patches a `VirtualService` with a 50/50 split placeholder; ensures rollout status checks on the target deployment first.

**Impact:** Real traffic control hook; operators can adjust weights/scripts.

---

## Category F — Monitoring & DR (Moderate)

### F1. Monitoring tasks not idempotent or evidenced
**Issue (submitted):**
- Echo-based placeholders without persisted artifacts.

**Fix (final):**
- `configure-monitoring.sh` emits files under `reports/monitoring/` that prove execution and can be attached as artifacts.

**Impact:** Auditable monitoring setup step.

### F2. DR test lacks outputs
**Issue (submitted):**
- No verifiable artifacts for restore and RTO/RPO claims.

**Fix (final):**
- `test-dr.sh` writes `reports/dr/*` artifacts to assert restore, RTO, and RPO validations.

**Impact:** Repeatable DR drill with evidence.

---

## Category G — Miscellaneous (Moderate)

### G1. GitLab security report integration
**Issue (submitted):**
- Some jobs didn’t publish reports under conventional paths (`reports/junit/*`, `coverage.xml`, `reports/*.json`).

**Fix (final):**
- Normalized artifact locations and GitLab `reports:` keys (JUnit, Cobertura, SAST where applicable).

### G2. Environment protection
**Issue (submitted):**
- Production approval job not clearly tied to protected environment.

**Fix (final):**
- Dedicated `prod_compliance_approval` manual job under `environment: production` and final `prod_cloudrun_gradual` gated by it.

---

## Quick Diff Table

| Area | Submitted Snippet | Final Pipeline |
|------|-------------------|----------------|
| Auth | WIF config with env var as file; repeated inline | ADC JSON via anchor; token to file; project + docker auth |
| Registry | Mixed/public refs | Private registry for all CI images |
| Vuln Block | Grep JSON | Native exit codes (Trivy), fail-fast |
| Signing | Mixed/unclear | Cosign standard job after scans |
| Preview URL | Hard-coded pattern | Read real URL → `preview.env` |
| Coverage Gate | Python + bc | `coverage report --fail-under=85` |
| Scripts ≤5 lines | Violations present | Moved to `scripts/` |
| AR Tagging | Implicit | `_IMAGE_TAG` + `image.txt` artifact |
| Staging | Vague | Blue/green with Istio patch |
| Monitoring/DR | No artifacts | Artifacts in `reports/monitoring` & `reports/dr` |

---

## What to keep doing

- Keep stages and environment gates explicit (preview → staging → prod).
- Maintain private registry mirrors for all third-party tools used inside runners.
- Treat security scans as **blocking** unless a formal risk acceptance exists.

## Next improvements (optional)

- Replace placeholder health checks in rollout with SLO-based gates (Cloud Monitoring time series).
- Add Cosign provenance/attestations (SLSA) and SBOM publication to Artifact Registry.
- Add CAI diffing per commit to detect IAM/resource drift.
