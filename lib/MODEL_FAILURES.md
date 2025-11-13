# model_failure.md
_CI/CD Pipeline Optimization (GitHub Actions, AWS, PCI-DSS)_

## 1. Context

This sub-task required a **single enterprise-grade GitHub Actions workflow** for an e-commerce microservices platform on AWS with:

- Terraform + ECS Fargate infra
- Multi-env (dev, staging, prod) via workspaces
- OIDC-only AWS auth
- Strict PCI-DSS controls (Prowler, Security Hub, etc.)
- Hard rule: **all shell `run:` blocks ≤ 5 lines**, complex logic in `lib/scripts/*.sh`
- Pipeline: validation → build → test → security → infra-preview → dev → staging → E2E → live security → performance → compliance → prod approval → prod deploy → smoke → monitoring → rollback

The initial CI/CD + scripts implementation was functional, but the automated review highlighted multiple issues that prevented it from being fully production‑grade and PCI‑DSS compliant.

This document captures failures, their impact, and the corrections applied.

---

## 2. Key Failures

### 2.1 Shellcheck path mismatch
**Issue:**  
Workflow used `shellcheck scripts/*.sh` instead of `lib/scripts/*.sh`.

**Impact:**  
Validation job fails; incorrect directory referencing.

**Fix:**  
Updated to:
```yaml
shellcheck lib/scripts/*.sh
```

---

### 2.2 Missing `terraform init` before `terraform validate`
**Issue:**  
`terraform validate` was executed without `terraform init`.

**Impact:**  
Validation job fails on fresh GitHub runners.

**Fix:**  
```yaml
terraform init -backend=false -input=false
terraform validate
```

---

### 2.3 ECS networking variables not used
**Issue:**  
Scripts ignored `SECURITY_GROUPS` and `SUBNET_IDS`.

**Impact:**  
ECS tasks could not place or lacked correct PCI segmentation.

**Fix:**  
Scripts now use JSON arrays:
```
securityGroups=${SECURITY_GROUPS_JSON}
subnets=${SUBNET_IDS_JSON}
```

---

### 2.4 ECS task definitions not updated with new image
**Issue:**  
Only `force-new-deployment` was used.

**Impact:**  
Tasks redeployed old images; new Docker images not applied.

**Fix:**  
Scripts now fetch, modify, and register new task definitions with updated image tags.

---

### 2.5 Rollback task family extraction bug
**Issue:**  
Used `basename` against task definition ARN.

**Impact:**  
Incorrect family name → rollback fails.

**Fix:**  
```bash
FAMILY=$(echo "$TASK_DEF_ARN" | awk -F'/' '{print $2}' | cut -d':' -f1)
```

---

### 2.6 Missing rollback logic in blue‑green deployments
**Issue:**  
No rollback when GREEN target group unhealthy.

**Impact:**  
Staging downtime possible.

**Fix:**  
Scripts now:
- Validate GREEN health
- Revert ALB listener to BLUE on failure

---

### 2.7 SQLMap dangerous defaults
**Issue:**  
`sqlmap` used with defaults that could damage staging DB.

**Fix:**  
Added safe flags:
```
--risk=1 --technique=B --skip-heuristics
```

---

### 2.8 Trivy exit‑code too strict
**Issue:**  
Failed on any vulnerability.

**Fix:**  
Now fails only on HIGH/CRITICAL:
```
--severity HIGH,CRITICAL
```

---

### 2.9 Missing installation steps for CLI tools
The pipeline invoked:
- tfsec, tflint, checkov, yamllint
- snyk, trivy, grype, semgrep, trufflehog, prowler, parliament
- zap-cli, nuclei, sqlmap
- k6, jmeter
- newman
- infracost, driftctl
- flyway, sentry-cli

**Issue:**  
GitHub runners do not include these by default.

**Fix:**  
Short installation steps added per job.

---

### 2.10 Go cache pattern incomplete
**Fix:**  
Updated:
```
hashFiles('**/go.sum')
```

---

### 2.11 Monitoring script JSON and error handling
**Issues:**  
- Inline JSON malformed  
- curl failures hidden  

**Fix:**  
- JSON now built with `jq`  
- curl exit codes checked  

---

## 3. Root Causes
- Inconsistent directory propagation  
- Incorrect assumptions about GitHub runner tools  
- Simplified ECS logic (not real-world task definition updates)  
- Missing rollback and health validation paths  
- Security tools not tuned for enterprise usage  
- Too-lenient or too-dangerous scanner defaults  

---

## 4. Final Outcome
After corrections:

- Validation job is deterministic  
- ECS deployments functional and image-aware  
- Rollbacks safe and predictable  
- Blue-green deployment fully reversible  
- PCI-DSS checks hardened  
- All required scanners properly installed  
- Monitoring integrations reliable  
- Full CI/CD pipeline reliable for prod workloads  

---

## 5. Lessons Learned
1. Enforce directory consistency early  
2. Never assume CLI tools exist  
3. ECS = task definition updates **always**  
4. DAST tools must be sandboxed  
5. Blue‑green must include rollback logic  
6. Monitoring/observability must fail fast  
7. Use JSON arrays for AWS network configuration  
8. Validate Terraform before applying  

---

**This model_failure.md documents the gap between the initial output and the production‑grade corrected version.**
