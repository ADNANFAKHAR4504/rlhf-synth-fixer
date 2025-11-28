# model_failure.md  
CircleCI CI/CD Pipeline Optimization  
Fintech Payment Platform (PCI-DSS • GCP • CircleCI)

---

## Purpose  
This document defines the expected failure conditions .  
Any generated output that triggers these failure cases must be considered incomplete, incorrect, or invalid.

---

# 1. Structural Failures

## 1.1 Missing Required Jobs  
The CI/CD pipeline must include every required job.  
If any job listed in the prompt is missing, renamed, or partially implemented, the output fails validation.

Required job groups include:

- Validation  
- Security  
- Build  
- Unit and Integration Testing  
- Performance and Load Testing  
- Deployment (dev, staging, production)  
- Canary rollout  
- Blue‑green production deployment  
- Production monitoring and validation  
- Rollback procedures  

## 1.2 Missing Required Scripts  
The following scripts must be present in the ZIP archive.  
Missing any script is considered a failure.

```
validate-pci-controls.sh
spanner-load-test.sh
configure-hsm.sh
test-hsm-integration.sh
deploy-canary-flagger.sh
test-cardholder-data-encryption.sh
validate-tokenization.sh
run-payment-dast.sh
pci-dss-validation.sh
validate-audit-logs.sh
check-network-segmentation.sh
deploy-blue-green.sh
configure-monitoring.sh
configure-logging.sh
setup-incident-response.sh
production-health-check.sh
verify-pci-compliance-prod.sh
test-disaster-recovery.sh
rollback.sh
run-zap-pci-scan.sh
```

## 1.3 Incorrect Project Structure  
The output must include exactly:

- `ci-cd.yml`  
- `scripts-sub_T10.zip`  
- `prompt.md`  
- `model_failure.md`  

Incorrect naming or missing files results in failure.

---

# 2. Syntax and Formatting Failures

## 2.1 Invalid CircleCI YAML  
The configuration must pass:

```
circleci config validate
```

Common reasons for failure:

- Wrong indentation  
- Invalid orbs usage  
- Incorrect executor definitions  
- Typing errors in job or step names  
- Misplaced "requires" fields  
- Using GitHub Actions or GitLab syntax inside CircleCI  

## 2.2 Incorrect Workflow Graph  
The workflow must respect all dependencies and approval gates.  
Missing approvals or incorrect ordering constitutes failure.

---

# 3. Compliance Failures

## 3.1 Service Account Key Usage  
Any appearance of `GOOGLE_APPLICATION_CREDENTIALS` or JSON key files is an automatic failure.  
Authentication must use Workload Identity Federation only.

## 3.2 Missing PCI-DSS Controls  
The CI/CD pipeline must include:

- Infrastructure scanning (Checkov with PCI rules)  
- Application scanning (Semgrep PCI rules, CodeQL)  
- Secret scanning (Gitleaks, detect-secrets, TruffleHog)  
- DAST scanning (OWASP ZAP)  
- Compliance validation (Prowler PCI group)  

Missing any of these invalidates the output.

## 3.3 Missing Image Scanning  
The build pipeline must enforce:

- Trivy image scanning  
- Grype scanning  
- Cosign signing with KMS  

Missing or incorrectly implementing these is a failure.

---

# 4. Deployment Failures

## 4.1 Missing Terraform Workspaces  
Each environment must use its own workspace:

- dev  
- staging  
- prod  

Incorrect use of terraform apply or workspace selection results in failure.

## 4.2 Missing Canary or Blue‑Green Strategy  
Staging must use Flagger-based canary deployment.  
Production must use blue‑green deployment.  
Any deviation is considered failure.

## 4.3 Missing Smoke Tests  
Smoke tests must run after dev and production deployments.

---

# 5. Artifacts and Reporting Failures

## 5.1 Missing Artifacts  
The pipeline must store all:

- Lint results  
- Test results  
- Coverage reports  
- Compliance outputs  
- DAST and SAST results  
- SBOM files  
- Deployment logs  

Missing any job’s artifacts results in failure.

## 5.2 Incorrect Paths  
Artifacts must be saved in paths referenced in CircleCI steps.  
Mismatched paths result in pipeline failures.

---

# 6. General Quality Failures

## 6.1 Placeholder Text  
Any placeholder text such as:

- “fill here”
- “dummy”
- “TODO:” without context  
- Incomplete commands  
- Incomplete YAML syntax  

is considered a failure.

## 6.2 Informal or conversational writing inside CI/CD or scripts  
The generated files must use production‑quality, concise wording.  
No commentary or conversational phrasing is acceptable.

---

# End of model_failure.md 
