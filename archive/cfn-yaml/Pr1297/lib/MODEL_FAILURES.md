# Model Failures for IAM Role with MFA and Least Privilege (CloudFormation)

This document lists common model failures and misconfigurations when generating a CloudFormation YAML template for secure IAM role and policy management, based on the requirements provided.

---

## 1. MFA Enforcement
- **Failure:** IAM role does not require MFA for AssumeRole actions.
- **Impact:** Users can assume the role without extra authentication, increasing risk of unauthorized access.
- **Mitigation:** Add a `Condition` block with `BoolIfExists` or `StringEquals` for `aws:MultiFactorAuthPresent` in the trust policy.

## 2. Least Privilege Principle
- **Failure:** IAM policies grant broad permissions (e.g., `Action: "*"`, `Resource: "*"`).
- **Impact:** Role can perform unintended actions, violating least privilege.
- **Mitigation:** Scope `Action` and `Resource` to only what is required for the use case.

## 3. Overly Restrictive Policies
- **Failure:** Policies are so restrictive that legitimate operations fail.
- **Impact:** Users or services cannot perform necessary tasks.
- **Mitigation:** Test policies to ensure all required actions are permitted.

## 4. Missing Policy Attachment
- **Failure:** IAM role is created but no policies are attached.
- **Impact:** Role cannot perform any actions, even if assumed.
- **Mitigation:** Attach at least one policy to the role.

## 5. Incorrect Trust Policy
- **Failure:** Trust policy allows unintended principals or lacks MFA enforcement.
- **Impact:** Unauthorized entities can assume the role.
- **Mitigation:** Restrict `Principal` and enforce MFA in the trust relationship.

## 6. Template Validation Errors
- **Failure:** CloudFormation template has syntax errors or missing required properties.
- **Impact:** Stack creation fails.
- **Mitigation:** Validate template before deployment.

## 7. Lack of Policy Versioning or Updates
- **Failure:** Policies are not updated as requirements change.
- **Impact:** Security posture degrades over time.
- **Mitigation:** Regularly review and update IAM policies.

---

*Update this document as new model failure scenarios are discovered or requirements change.*
