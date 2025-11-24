# model_failure.md — Media Pipeline CI/CD

This document captures the **expected model failures**, common mistakes, and incorrect outputs that an automated model or generator often produces for this task.  
It helps reviewers verify whether the generated CI/CD pipeline meets all requirements and avoids known pitfalls.

---

# 1. General CI/CD Structure Failures

### Failure: Missing Jobs
- Pipeline omits key jobs such as:
  - `validation`
  - `build`
  - `test`
  - `security`
  - `storage-setup`
  - `deploy-infrastructure-dev`
  - `deploy-services-dev`
  - `integration-test-dev`
  - `deploy-staging`
  - `performance-test`
  - `canary-analysis`
  - `e2e-test`
  - `compliance-validation`
  - `deploy-production`
  - `smoke-test`
  - `monitoring`
  - `disaster-recovery`

### Failure: Missing Needs Chain
- Steps improperly parallelized.
- Staging deployed before dev integration tests.
- Production deployed without approvals.

---

# 2. Azure Identity & Security Failures

### Failure: Not Using Federated Credentials
- Using secrets instead of:
  ```
  permissions:
    id-token: write
    contents: read
  ```

### Failure: Missing azure/login@v2 Configuration
- Failing to specify client-id, tenant-id, or subscription-id.

### Failure: Secret-Based ACR Login
- Using docker login with username/password rather than `azure/docker-login@v1`.

---

# 3. Build System Failures

### Failure: Missing GPU Build Arg
- Not enabling GPU builds:
  ```
  --build-arg ENABLE_GPU=true
  ```

### Failure: Images Not Tagged with SHA
- Tags like `latest` instead of:
  ```
  ${{ github.sha }}
  ```

### Failure: Missing React or Functions Build
- Build step omits either:
  - React admin dashboard
  - Azure Functions bundle

### Failure: Missing Bicep Compilation
- Not producing compiled JSON artifacts.

---

# 4. Validation Failures

### Failure: Missing Bicep Build
- CI does not run `az bicep build`.

### Failure: Missing Validation Tools
- No Shellcheck
- No Hadolint
- No Yamllint

### Failure: Missing Azure Policy-as-Code Step
- Not including a placeholder or real enforcement.

---

# 5. Testing Failures

### Failure: Missing Azurite Integration Testing
- CI does not use Azurite for blob-triggered workflows.

### Failure: Missing VMAF Quality Tests
- Not validating transcoding output quality.

### Failure: Missing K6 Load Test
- Pipeline does not include 1000 concurrent uploads load test.

### Failure: Missing Component Tests
- Go tests not executed.
- React tests missing.
- Jest tests missing.

---

# 6. Security Failures

### Failure: Missing Vulnerability Scans
- No Trivy scan for container images.
- No Grype or Snyk.

### Failure: Not Failing on CRITICAL Vulnerabilities
- Trivy severity not enforced.

### Failure: Missing Checkov Scan
- No IaC policy validation.

### Failure: Missing OWASP ZAP API Scan
- Pipeline lacks API security checks.

---

# 7. Deployment Failures

### Failure: Blue/Green Not Implemented
- Staging environment uses a single AKS cluster.

### Failure: Missing Traffic Manager Rollout Steps
- No progressive rollout steps (0 → 20 → 50 → 100).

### Failure: Missing Helm Deploy for AKS
- Transcoding-worker charts not deployed.

### Failure: Missing Azure Functions Slot Deployment
- Functions deployed directly without staging slots.

---

# 8. Performance & Canary Failures

### Failure: Missing Locust Test
- Performance test phase not included.

### Failure: Missing Canary Metrics
- No comparison of:
  - GPU utilization
  - CDN hit rate
  - Error rates

### Failure: Missing Auto-Rollback
- No script call to:
  ```
  rollback-blue-green.sh
  ```

---

# 9. Compliance Failures

### Failure: Missing Compliance Step
- No validation of encryption, Private Link, RBAC, or diagnostics.

### Failure: Cosmos Backup Not Checked
- Missing validation of backup + restore configuration.

---

# 10. Production Release Failures

### Failure: Missing Protected Environment Approval
- Production deployment triggered without required team approvals.

### Failure: Missing Multi-Region Rollout
- Only deploying to a single region instead of:
  - eastus
  - westeurope
  - southeastasia

### Failure: Missing Circuit Breaker Logic
- No health-check gate between region deployments.

---

# 11. Smoke Test Failures

### Failure: Missing Multi-Region Tests
- No tests executed across:
  - Front Door endpoints
  - Regional Media Services
  - CDN edge nodes

---

# 12. Monitoring & DR Failures

### Failure: Monitoring Not Configured
- No setup for:
  - Log Analytics
  - App Insights
  - Alerts
  - Cost anomaly detection

### Failure: Missing Disaster Recovery Drill
- No weekly job testing:
  - Cosmos restore
  - Storage GRS failover
  - Front Door failover

---

# Purpose of model_failure.md
This file is used during review to ensure that the generated model output:  
- Does not omit critical stages  
- Does not violate Azure security patterns  
- Implements required Blue/Green deployment logic  
- Enforces GPU-based build and test paths  
- Follows all multi-region architecture requirements  

If any of the failures above appear in the generated output, the model is considered out-of-spec .

