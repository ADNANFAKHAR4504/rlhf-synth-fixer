# MODEL_FAILURES

This document details the failures and gaps identified in the model responses when compared to the requirements in the prompt and the actual deployment errors encountered.

---

## 1. **Incorrect RDS CloudWatch Logs Export**

**Failure:**  
The model response uses `enabled_cloudwatch_logs_exports = ["error", "general", "slow_query"]` for the RDS instance.  
**Issue:**  
AWS expects `"slowquery"` (no underscore), not `"slow_query"`.  
**Impact:**  
Terraform fails with:  
```
Error: expected enabled_cloudwatch_logs_exports.2 to be one of [...], got slow_query
```
**Resolution:**  
Update to `enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]`.

---

## 2. **Deprecated GuardDuty Configuration**

**Failure:**  
The model response uses the `datasources` block in `aws_guardduty_detector`.  
**Issue:**  
This block is deprecated.  
**Impact:**  
Terraform warns and may fail future deployments.  
**Resolution:**  
Replace with individual `aws_guardduty_detector_feature` resources for S3, EKS, and Malware protection.

---

## 3. **CloudTrail KMS Key Policy Insufficient**

**Failure:**  
The KMS key policy does not grant CloudTrail and CloudWatch Logs services sufficient permissions.  
**Issue:**  
CloudTrail and CloudWatch Logs cannot use the KMS key for encryption.  
**Impact:**  
Deployment fails with `InsufficientEncryptionPolicyException` and `AccessDeniedException` errors.  
**Resolution:**  
Update the KMS key policy to explicitly allow CloudTrail and CloudWatch Logs service principals the required actions.

---

## 4. **GuardDuty Detector Already Exists**

**Failure:**  
The model always tries to create a new GuardDuty detector.  
**Issue:**  
If a detector already exists, AWS returns a `BadRequestException`.  
**Impact:**  
Deployment fails if a detector is present.  
**Resolution:**  
Use a data source to check for an existing detector and only create a new one if none exists.

---

## 5. **CloudWatch Log Group KMS Key Reference**

**Failure:**  
CloudWatch Log Groups reference the KMS key before it is fully available or permitted.  
**Issue:**  
KMS key permissions or resource creation order may cause `AccessDeniedException`.  
**Impact:**  
Deployment fails for log group creation.  
**Resolution:**  
Ensure KMS key policy allows CloudWatch Logs, and use proper resource dependencies.

---

## 6. **Provider Region Consistency**

**Failure:**  
Some model responses use `region = var.aws_region`, but the provider file hardcodes `us-west-2`.  
**Issue:**  
Potential for region mismatch if variables are not set correctly.  
**Impact:**  
Resources may deploy to the wrong region.  
**Resolution:**  
Ensure all provider blocks consistently use the variable and default to `us-west-2`.

---

## 7. **General Resource Dependency and Ordering**

**Failure:**  
Some resources (e.g., log groups, CloudTrail) may not declare explicit `depends_on` for KMS or bucket policies.  
**Issue:**  
Terraform may attempt to create resources before permissions are in place.  
**Impact:**  
Deployment errors due to missing permissions.  
**Resolution:**  
Add `depends_on` where necessary to enforce correct resource creation order.

---

## Summary Table

| Failure Area              | Model Issue              | Impact              | Required Fix                    |
| ------------------------- | ------------------------ | ------------------- | ------------------------------- |
| RDS Log Export            | Wrong log name           | Plan/apply fails    | Use "slowquery"                 |
| GuardDuty Detector        | Deprecated block         | Warning/future fail | Use feature resources           |
| CloudTrail KMS Policy     | Insufficient permissions | CloudTrail fails    | Update KMS policy               |
| GuardDuty Detector Exists | Always creates           | Deploy fails        | Use data source                 |
| CloudWatch Log Group KMS  | KMS not permitted        | Log group fails     | Update KMS policy, depends_on   |
| Provider Region           | Inconsistent region      | Wrong region        | Use variable, default us-west-2 |
| Resource Dependencies     | Missing depends_on       | Deploy fails        | Add depends_on                  |

---

## **Action Items**

- Update RDS log export to use `"slowquery"`.
- Replace GuardDuty `datasources` with `aws_guardduty_detector_feature` resources.
- Expand KMS key policy for CloudTrail and CloudWatch Logs.
- Use data source for GuardDuty detector existence.
- Ensure CloudWatch Log Groups have correct KMS permissions and dependencies.
- Standardize provider region usage.
- Add explicit `depends_on` for resources