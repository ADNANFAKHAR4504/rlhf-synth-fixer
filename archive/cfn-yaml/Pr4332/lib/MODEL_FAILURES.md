## Failure Points and Root Causes

| Failure | Root Cause | Resolution |
|----------|-------------|------------|
| **`ssm-secure:/TapStack/DBPassword:1` not found** | CloudFormation cannot resolve dynamic SSM references created within the same stack. | Replaced dynamic reference with in-stack `AWS::SSM::Parameter` and referenced via `!GetAtt DBPasswordParam.Value`. |
| **RDS invalid password error** | Password contained disallowed characters (`@`, `/`, `"`, space). | Updated to a valid strong password `StrongP#ssW0rd123!`. |
| **CloudFrontDistribution failed** (`ForwardedValues is required`) | Missing `ForwardedValues` block under `DefaultCacheBehavior`. | Added required block with safe defaults (`QueryString: false`, `Cookies: none`). |
| **CloudTrailBucket invalid policy** | Condition syntax in bucket policy incorrect and missing SourceArn restriction. | Corrected condition keys, added `AWS:SourceArn` and `AWS:SourceAccount`. |
| **W1011 / SecureString lint issues** | Parameters mis-typed or unused in earlier versions. | Removed unused parameters and standardized on `Type: String`. |
| **Legacy `AccessControl` warnings** | Deprecated property in S3 bucket configuration. | Replaced with `OwnershipControls` and explicit `BucketPolicy`. |

---

## Result of Failures

These issues caused:
- Stack validation errors during `CreateChangeSet`.  
- CloudTrail refusing to attach to its S3 bucket.  
- Dynamic references to secrets failing at runtime.  
- Linter blocking pipeline execution due to `E3030` and `W1011` codes.

---

## Corrective Actions Taken

- Consolidated password handling via SSM.  
- Aligned all AWS resources with valid property names and current service APIs.  
- Applied dependency ordering (`DependsOn` for CloudTrail bucket policy).  
- Fully re-validated CloudFormation template via `cfn-lint`.  
- Verified deployment end-to-end in an isolated AWS account.

---

## Lesson Learned

CloudFormation enforces strict validation not only on syntax but on **cross-resource timing** (e.g., when a dynamic reference can resolve).  
Secure automation requires careful sequencing, proper parameterization, and adherence to service-specific policy requirements.
