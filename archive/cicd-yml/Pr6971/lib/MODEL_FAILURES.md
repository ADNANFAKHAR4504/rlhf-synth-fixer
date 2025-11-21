# MODEL_FAILURE – Sub_T05 (CI/CD Pipeline Optimization for GCP ML Platform)

## 1. Context
Sub_T05 is the CI/CD Pipeline Optimization task for a GCP‑based ML platform using GitHub Actions.  
The goal was to produce a single workflow with six jobs, two strict bash scripts, Workload Identity Federation, security scanning, model packaging, GCS uploads, Terraform deployment, and Vertex AI model deployment.

This document describes the failures found in earlier model responses before the final corrected solution.

---

## 2. Failure: Missing Container Vulnerability Scanning
Initial workflow versions did not include any container vulnerability scanning step.  
Since Sub_T05 is an “optimization” task, security coverage is evaluated during automated review.  
The absence of Trivy or any security scanner caused the pipeline to fail required checks.

**Fix:** Added a complete Trivy scanning step failing on HIGH/CRITICAL vulnerabilities.

---

## 3. Failure: Wrong Script Paths
Previous responses referenced scripts at:
```
lib/scripts/train_model.sh
lib/scripts/deploy_vertex_model.sh
```
The required path was:
```
scripts/train_model.sh
scripts/deploy_vertex_model.sh
```
This would have caused runtime failures because those paths did not exist.

**Fix:** Updated all workflow script paths to use `scripts/`.

---

## 4. Failure: Non‑recursive GCS Upload
The early `train_model.sh` used:
```
gsutil cp "${VERSION_DIR}"/* gs://...
```
This silently skipped nested directories, which commonly occur when saving ML artifacts.

**Fix:** Added `-r` flag to ensure complete uploads:
```
gsutil -m cp -r "${VERSION_DIR}"/* gs://...
```

---

## 5. Failure: Faulty Environment Variable Construction
Earlier versions attempted to reference environment variables inside the same `env:` block, which GitHub Actions does not evaluate in order.  
Additionally, the workflow used `vars.GCP_REGION` when only `env.GCP_REGION` was available.

This caused registry path construction and region configuration to be unreliable.

**Fix:** Simplified environment variable usage and moved dependent values into job‑level `env` blocks.

---

## 6. Failure: Missing Artifact Validation
### 6.1 Missing verification of model artifact output
The workflow previously assumed training succeeded even when no artifacts were produced.  
This would lead to empty GCS uploads and later deployment failures.

**Fix:** Added explicit checks verifying the artifact directory exists and contains files.

### 6.2 Weak `.model_version` validation
The deployment script read `.model_version` without confirming:

- it exists  
- it contains a non‑empty value  
- whitespace is trimmed  

This caused unpredictable behaviour in Vertex AI deployment commands.

**Fix:** Added stricter validation and sanitisation of `.model_version`.

---

## 7. Failure: Validation Jobs Allowing Soft Failures
At one stage, pylint, mypy, and bandit had `|| true` appended, which turned them into advisory checks.  
For Sub_T05, these tools are meant to act as quality gates. Soft failures violated the optimisation requirement.

**Fix:** All validation steps now fail properly when issues are detected.

---

## 8. Summary
Earlier failed versions had issues with:

- Missing security scanning  
- Incorrect script paths  
- Incomplete artifact uploads  
- Faulty environment variable resolution  
- Weak artifact validation  
- Validation checks incorrectly allowed to pass  

These were corrected in the final implementation, producing a stable, production‑ready CI/CD workflow for Sub_T05.

