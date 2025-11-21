# model_failure.md –  HIPAA CI/CD (GCP / Cloud Build)

This document explains when an answer to the prompt should be considered incorrect or incomplete, and what typical failure patterns look like.

The goal is clear: a HIPAA‑compliant, production‑grade `cloudbuild.yaml` that uses external shell scripts for non‑trivial logic, for a healthcare analytics platform running on GCP.

---

## 1. High‑level failure criteria

An answer should be treated as failed if one or more of the following is true.

### 1.1 HIPAA requirements are ignored or broken

The pipeline does not mention or enforce key HIPAA controls, for example:

- No reference to VPC Service Controls.
- CMEK encryption is not required or validated.
- Audit logging and routing to a SIEM project are missing.
- There is no PHI detection on logs or outputs.
- The requirement for no public IPs on sensitive resources is ignored.

Or, the pipeline still allows deployment when:

- Trivy finds HIGH or CRITICAL vulnerabilities.
- PHI detection finds unredacted PHI.
- Encryption, access‑control, or compliance validation steps fail.

### 1.2 No usable `cloudbuild.yaml`

Examples:

- The answer is mostly prose with no real YAML.
- The YAML is so broken that it cannot realistically be fixed into a valid Cloud Build configuration.
- Required substitutions such as `_ENVIRONMENT`, `_ARTIFACT_REGISTRY`, `_COMPLIANCE_BUCKET`, `_SECURITY_PROJECT_ID`, `_SIEM_PROJECT_ID` are defined but never used in steps.

### 1.3 “All scripts external” is not respected

The prompt explicitly requires external scripts for the main operational logic. An answer fails if:

- It includes long inline Bash blocks (more than a few lines of logic) where the work clearly belongs in one of these scripts:

  - `deploy-gke-hipaa.sh`
  - `deploy-dataproc-hipaa.sh`
  - `run-pyspark-job.sh`
  - `validate-encryption.sh`
  - `validate-access-controls.sh`
  - `validate-audit-logs.sh`
  - `test-backup-restore.sh`
  - `run-phi-detection.sh`
  - `generate-compliance-report.sh`
  - `configure-monitoring.sh`

- It renames, omits, or replaces these scripts without a good reason, even though the prompt calls them out by name.

### 1.4 Multi‑environment behaviour is ignored

The `_ENVIRONMENT` variable (dev, staging, prod) is only mentioned superficially and does not affect behaviour. For example:

- Dev, staging, and prod run exactly the same flow.
- There is no mention that production deployment must require a manual approval gate.
- Dev is not treated as an environment where ephemeral deployments are acceptable.
- Staging is not associated with tag‑based or controlled promotion.

### 1.5 Security and compliance steps are missing or vague

The prompt lists specific tools and checks. A failed answer omits or hand‑waves them. Typical misses:

- Leaves out one or more of:
  - Pylint
  - Mypy
  - Bandit
  - Safety
  - Terraform validation with HIPAA‑focused Checkov policies
  - Trivy
  - Semgrep
  - Prowler
  - Presidio
  - Great Expectations
- Mentions tools only in comments or prose, without real steps in the pipeline.

### 1.6 Data protection model is broken

Examples:

- Allows or assumes public IPs on GKE, Dataproc, or Vertex AI without stating that public IPs must be disabled.
- Does not require CMEK for data at rest.
- Does not check that TLS 1.3 (or at least strong TLS) is used in transit.
- Lacks validation steps for:
  - KMS key rotation policies.
  - VPC‑SC egress protections.
  - Audit logs flowing into a dedicated SIEM project.

### 1.7 Coverage and testing requirements are missed

The answer fails to enforce core testing constraints, such as:

- No enforcement of pytest coverage greater than 85 percent for Python modules.
- No Great Expectations data quality tests on a BigQuery test dataset.
- No Dataproc and PySpark integration testing with BigQuery.

### 1.8 Reporting and notification are incomplete

For example:

- No step to generate a compliance report and write it to

  `gs://${_COMPLIANCE_BUCKET}/reports/${BUILD_ID}`

- No step that notifies the security team using the required Pub/Sub topic

  `projects/${_SECURITY_PROJECT_ID}/topics/hipaa-deployments`

- No mention that build logs and notifications must avoid including PHI.

---

## 2. Typical failure patterns

### 2.1 “Toy” pipeline with minimal stages

What it looks like:

- Only a few steps such as build, unit test, and deploy.
- No HIPAA‑specific stages like VPC‑SC validation, Presidio PHI checks, Prowler HIPAA assessments, or SIEM‑oriented audit log checks.
- Ignores the external scripts requirement and places everything inline.

Why this is a failure:

- It does not reflect a regulated, security‑first deployment.
- It would not pass a realistic HIPAA or security review.

### 2.2 Inline script bloat

Example of a bad pattern:

```yaml
steps:
  - name: gcr.io/cloud-builders/gcloud
    entrypoint: bash
    args:
      - -c
      - |
        gcloud services enable bigquery.googleapis.com
        gcloud services enable dataproc.googleapis.com
        gcloud compute networks create my-net --subnet-mode=custom
        gcloud compute firewall-rules create allow-all ...
        # many more lines of inline shell
```

Problems:

- Violates the requirement that non‑trivial logic must live in external scripts.
- Harder to test, reuse, and audit.

A better pattern:

```yaml
steps:
  - id: "env-validation-hipaa"
    name: gcr.io/cloud-builders/gcloud
    entrypoint: bash
    args:
      - -c
      - |
        ./scripts/validate-env-hipaa.sh           "${_VPC_SC_PERIMETER}"           "${_KMS_KEYRING}"           "${_SIEM_PROJECT_ID}"           "${_ENVIRONMENT}"
```

### 2.3 PHI detection is missing or not enforced

Bad pattern:

- No step using Presidio (or equivalent) to scan logs and outputs.
- No statement that finding PHI should fail the build.
- No protection against PHI leaking into Cloud Build logs, monitoring data, or notifications.

This is a failure because the prompt explicitly calls out PHI detection in logs and the need for blocking behaviour when PHI appears where it should not.

### 2.4 Superficial use of security tools

Examples:

```yaml
- name: semgrep/semgrep
  args: ["semgrep"]
```

- No rulesets or policies configured.
- No failure conditions defined.

```yaml
- name: aquasec/trivy
  args: ["trivy", "image", "my-image"]
```

- No severity thresholds.
- The build does not fail even if high‑severity issues are found.

Why this is a failure:

- The tools are present in name only.
- Security scans do not drive decisions; deployment can proceed even when serious issues exist.

A stronger approach:

- Configure Trivy so that HIGH and CRITICAL vulnerabilities fail the build.
- Run Semgrep with healthcare‑relevant rulesets and fail on unsafe patterns.
- Run Prowler with HIPAA profiles and fail on non‑compliant findings.

### 2.5 No real multi‑environment behaviour

Common issues:

- `_ENVIRONMENT` is defined but never passed into scripts or used in decisions.
- There is no difference between dev, staging, and prod flows.
- Production deployment is not guarded by a manual approval step.

Why this matters:

- The prompt requires:
  - Dev: automatic deployments are acceptable.
  - Staging: controlled deployment, usually tied to tags or promotion.
  - Production: manual approval required.
- Ignoring this undermines safety for a regulated workload.

---

## 3. How to think about severity

Use the following rough guide when deciding how bad a given answer is.

### High quality (acceptable)

- Provides a syntactically sound `cloudbuild.yaml`.
- Includes the core HIPAA stages:
  - Environment validation (VPC‑SC, KMS, audit logging, org policies).
  - Python quality gates (Pylint, Mypy, Bandit, Safety).
  - Terraform validation plus HIPAA‑focused Checkov checks.
  - Trivy, Semgrep, Prowler, Presidio.
  - Great Expectations for data quality.
  - Backup and restore verification.
- Uses external scripts consistently for complex shell logic.
- Wires in `_ENVIRONMENT`, `_ARTIFACT_REGISTRY`, `_COMPLIANCE_BUCKET`, `_SECURITY_PROJECT_ID`, `_SIEM_PROJECT_ID` in a meaningful way.
- Clearly blocks deployment if:
  - PHI is detected in logs or outputs.
  - High‑severity vulnerabilities are found.
  - Compliance checks fail.

### Partial or borderline

- YAML is mostly correct but:
  - One or two required tools are missing or only hinted at.
  - Some HIPAA checks are described but not fully implemented as concrete steps.
  - External scripts are used, but a few jobs still hold more inline logic than they should.
- Can be brought up to standard with moderate edits.

### Clear failure

- No actual Cloud Build YAML is produced, or the YAML is unusable.
- HIPAA‑specific requirements (VPC‑SC, PHI detection, SIEM routing, CMEK) are absent.
- All or most logic is inline shell, ignoring the external script requirement.
- Coverage, vulnerability blocking, and production approval are not enforced.

---

## 4. Example snippets

### 4.1 Example of poor HIPAA awareness

```yaml
steps:
  - name: gcr.io/cloud-builders/docker
    args: ["build", "-t", "gcr.io/$PROJECT_ID/app", "."]
  - name: gcr.io/cloud-builders/docker
    args: ["push", "gcr.io/$PROJECT_ID/app"]
```

Issues:

- No environment validation.
- No security scanning.
- No mention of encryption, PHI, or audit logging.

### 4.2 Example that moves in the right direction

```yaml
steps:
  - id: "dependency-scan-safety"
    name: "${_ARTIFACT_REGISTRY}/hipaa-tools/safety:latest"
    args:
      - "check"
      - "--full-report"
      - "-r"
      - "requirements.txt"

  - id: "phi-detection-logs"
    name: "${_ARTIFACT_REGISTRY}/hipaa-tools/presidio:latest"
    entrypoint: bash
    args:
      - -c
      - |
        ./scripts/run-phi-detection.sh           "${_ENVIRONMENT}"           "${_SIEM_PROJECT_ID}"
```

Positive aspects:

- Uses private Artifact Registry images designed for HIPAA workloads.
- Calls out an external script dedicated to PHI scanning.
- Ties PHI detection directly into the pipeline flow.

---

## 5. Summary

An answer fails when it treats this as a simple “build and deploy” configuration rather than a HIPAA‑grade, security‑focused pipeline.

Major red flags include:

- Little or no attention to VPC Service Controls, CMEK, TLS, PHI detection, SIEM routing, and backup verification.
- No real multi‑environment logic or production approval gates.
- use of emojis in model response
- Long inline shell blocks instead of the required external scripts.
- Security and compliance tools present only in name, not as hard gates.

A good answer integrates all of these concerns into a coherent Cloud Build pipeline, where any serious security, privacy, or compliance issue will stop the deployment instead of being silently ignored.
