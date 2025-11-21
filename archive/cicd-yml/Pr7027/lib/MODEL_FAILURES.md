# model_failure.md — CI/CD Pipeline (Google Cloud Build)

This document captures **intended failure scenarios**, **common mistakes**, and **validator rejection reasons** encountered when generating the `cloudbuild.yaml` . It mirrors the style used in earlier tasks .

---

#   1. Missing External Scripts
Cloud Build rejects when referenced scripts do not exist or are not executable:

```
Step #14: scripts/deploy-gke.sh: no such file or directory
```

Scripts required:
- deploy-gke.sh
- deploy-dataflow.sh
- run-migrations.sh
- canary-analysis.sh
- chaos-tests.sh
- promote-blue-green.sh
- rollback.sh
- validate-finra.sh
- validate-sox.sh
- check-licenses.sh
- configure-monitoring.sh

**Cause:** Steps >5 lines must be externalized.  
**Fix:** Provide `scripts/` folder with executable `.sh` files.

---

#   2. Using Public Images Instead of Private Artifact Registry
Prompt requires:

> **All builders from private Artifact Registry. No public images.**

Incorrect:
```
name: "gcr.io/cloud-builders/docker"
```

Correct:
```
name: "${_ARTIFACT_REGISTRY}/ci-tools/kaniko-executor:latest"
```

---

#   3. Missing Workload Identity (Using SA Keys)
Forbidden:
```
GOOGLE_APPLICATION_CREDENTIALS: key.json
```

Failure reason:  
**Pipeline must rely solely on Workload Identity Federation.**

---

#   4. Not Using `waitFor` Correctly
Missing or incorrect ordering triggers inconsistent builds:

Example failure:
```
Error: Image not found for Trivy scan
```

Cause:  
Trivy scanned before images were built.

Fix:
```
waitFor:
  - "build-order-engine"
```

---

#   5. Skipping Coverage Requirement
Prompt requires **>90% coverage** for both:
- Node (Jest)
- Go (race detector + coverage)

Failures:
```
Coverage below 90% — failing build.
```

Reason:  
Coverage gates must explicitly fail the build.

---

#   6. Missing Compliance Scripts (FINRA / SOX)
Validator expects:

```
scripts/validate-finra.sh
scripts/validate-sox.sh
```

If missing:
```
Step error: not found
```

---

#   7. Terraform Backend/Plan Storage Mismatch
Prompt requires:
```
gs://${_STATE_BUCKET}/plans/${BUILD_ID}/tfplan
```

Failures when:
- Wrong path  
- Missing bucket  
- Missing folder creation  

---

#   8. Canary Deployment Without SLO Enforcement
SLOs required:
- p50 < 10ms  
- p95 < 50ms  
- p99 < 100ms  

If missing:
```
canary-analysis: SLO checks missing — FAIL
```

---

#   9. Performance Test Not Simulating 100k Orders/Sec
Validation failure:
```
k6 load script does not reach required throughput: 100k ops/sec
```

---

#   10. Chaos Tests Missing
Chaos Mesh step required:
- network latency injection  
- pod-kill scenarios  
- auto-validation  

Missing step:
```
chaos-tests.sh not executed
```

---

#   11. Not Archiving Build Artifacts to GCS
Prompt requires 90-day retention in:

```
gs://${_ARTIFACTS_BUCKET}/builds/${BUILD_ID}/
```

Missing:
```
Artifact archival skipped — FAIL
```

---

#   12. No BigQuery Audit Logging
Required step:
```
bq insert trading_audit.deployments ...
```

Missing audit causes compliance rejection.

---

#   13. Using Unsupported Cloud Build Options
Failures if:
- timeout missing  
- dynamicSubstitutions missing  
- substitutionOption missing

Mandatory:
```
machineType: E2_HIGHCPU_32
logging: CLOUD_LOGGING_ONLY
dynamic_substitutions: true
substitution_option: ALLOW_LOOSE
timeout: 3600s
```

---

#   14. Using Inline Scripts >5 Lines
Validator rejects long inline steps:

```
Error: step script too long — must be externalized
```

---

#   15. Deploying to Prod on Non-Main Branch
Failure case:
```
terraform apply attempted on feature branch — BLOCKED
```

Prod apply must only occur when:
- branch = main  
OR
- _ENV = prod

---

# Summary
This `model_failure.md` allows you to test validators, automated reviewers, or RLHF scoring systems by ensuring failure conditions are well documented and consistent .

