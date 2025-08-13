# Nova Model – Task 2 Prompt Gaps & Failures

## 1. Region Requirement

- **Failure:** Did not explicitly enforce deployment to the required `us-east-1` region.
- **Impact:** Resources could be deployed in a default or unintended AWS region, violating compliance and availability requirements.

## 2. Default IAM Policy

- **Failure:** No creation or attachment of a "default" least-privilege IAM policy for resources.
- **Impact:** Resources have no enforced access control baseline, increasing risk of privilege escalation.

## 3. S3 Logging

- **Failure:** Did not provision a dedicated logging bucket or enable server access logging for S3 resources.
- **Impact:** Lacks traceability for object changes and access, making security investigations difficult.

## 4. Database Security

- **Failure:** No database resource defined; no private subnet placement or security group restrictions.
- **Impact:** Missing compliance requirement for private, non-public database deployment.

## 5. Encryption with KMS

- **Failure:** No AWS KMS key creation or encryption applied to resources.
- **Impact:** Sensitive data at rest is left unencrypted or using default S3 encryption without customer-managed keys.

## 6. Tagging

- **Failure:** Did not apply the required tag `environment=production` to all resources.
- **Impact:** Breaks cost allocation, automation, and environment identification processes.

## 7. Single-File Implementation

- **Failure:** Code split across multiple files (`app.py`, `web_app_stack.py`) instead of a single `tap_stack.py`.
- **Impact:** Violates single-file deliverable requirement; harder to review and deploy as a self-contained module.

## 8. Infrastructure Resources Missing

- **Failure:** Provided only a CDK app entry point with no actual infrastructure (S3, RDS, IAM, etc.).
- **Impact:** Cannot meet any functional part of the infrastructure specification.

## 9. Documentation

- **Failure:** Lacked comments explaining resource purpose, security configurations, and design rationale.
- **Impact:** Reduces maintainability and security audit readiness.

---

**Summary:**  
Nova’s output was essentially a boilerplate CDK app initialization, without implementing **any** of the infrastructure, security, logging, encryption, or tagging requirements specified in the prompt. Significant rework was required to achieve a production-ready, compliant deployment in a single-file `tap_stack.py` format.
