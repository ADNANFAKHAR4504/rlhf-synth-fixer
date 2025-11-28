# CircleCI CI/CD Pipeline Optimization  
Fintech Payment Platform • PCI-DSS Compliance • GCP • CircleCI

---

## Objective  
The goal is to build a complete, production-grade CI/CD pipeline on CircleCI for a fintech payment processing platform.  
The platform must operate securely under PCI-DSS requirements and run on Google Cloud Platform using Workload Identity Federation for authentication.

The system includes:
- GKE for transaction processing  
- Cloud Spanner for global financial records  
- Pub/Sub for event streaming  
- Cloud HSM for cryptographic operations  
- Terraform for infrastructure provisioning  
- Python and Node microservices  
- Security and compliance scanning across all stages  

This prompt defines everything required from the assistant to generate the final CI/CD pipeline and supporting scripts.

---

## Required Deliverables

### 1. Full `.circleci/config.yml`  
A complete CircleCI v2.1 configuration must be generated.  
The pipeline must include:

### Orbs  
- circleci/gcp-cli@3.1  
- circleci/gcp-gcr@0.16  
- circleci/kubernetes@1.3  
- circleci/node@5.1  
- circleci/python@2.1  

### Executors  
- node-app-executor using `${PRIVATE_REGISTRY}/node:20-bullseye`  
- python-executor using `${PRIVATE_REGISTRY}/python:3.11-slim`  
- gcloud-executor using `${PRIVATE_REGISTRY}/google/cloud-sdk:alpine`  
- machine-executor using `ubuntu-2204:current`  

### Custom Commands  
- auth-gcp (Workload Identity Federation)  
- install-tools (kubectl, helm, skaffold, cloud-sql-proxy)

### Pipeline Jobs  
The configuration must contain the following jobs:

Validation  
- validate-python  
- validate-node  
- validate-infrastructure  
- scan-vulnerabilities  

Build  
- build-python-services  
- build-node-services  

Testing  
- unit-test-python  
- unit-test-node  
- integration-test  
- integration-test-staging  

Security  
- security-sast  
- security-secrets  
- pci-compliance  

Performance and Load  
- performance-test  
- load-test-spanner  

Deployment  
- deploy-dev  
- smoke-test-dev  
- deploy-staging-infrastructure  
- canary-staging  
- blue-green-production  
- smoke-test-production  
- setup-monitoring  
- production-validation  
- rollback-production  

Workflow Requirements  
- All dependencies defined correctly  
- Approvals before staging and production deployments  
- Production jobs run only on the main branch  
- Multi-region support for GKE and Spanner  

---

## External Scripts Required  
The assistant must generate a ZIP file containing stub implementations for these scripts:

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

Each script must:
- Include a bash shebang  
- Use `set -euo pipefail`  
- Be functional placeholders
- Print a clear message indicating which script is running  

---

## Acceptance Criteria  
The generated CI/CD pipeline must meet the following requirements:

- Fully aligned with PCI-DSS guidelines  
- Authentication strictly through Workload Identity Federation  
- No usage of service account key files  
- Container images scanned and signed using Cosign and KMS  
- All scanning and test artifacts stored in CircleCI  
- Terraform and Skaffold used for deployments  
- Multi-region GKE, Spanner, and Pub/Sub supported  
- Canary and blue-green deployment strategies implemented  
- OWASP ZAP, Prowler, Checkov, Semgrep, Gitleaks, and Trivy integrated  
- CircleCI syntax used throughout with no elements from other CI systems  

---

## Required Output Format  
The assistant must provide:

1. A downloadable `ci-cd.yml` file  
2. A downloadable `scripts-sub_T10.zip` file  
3. A downloadable `prompt.md` file (this document)

---

## End of prompt.md for Sub_T10
