# Model Failures

## 1. Incorrect Resource Packaging

- The model returned code that did not work in resolving the Lambda code in the code folder.  
- This packaging logic failed to locate and bundle the required handler file, resulting in deployment errors.
- This also introduced the risk of bundling unnecessary files, which could increase package size and slow down deployment.

---

## 2. Overly Broad S3 Permissions

- The model-generated IAM policy granted access to all S3 buckets in the account.
- This violates the principle of least privilege and risks unintended access to unrelated or sensitive S3 data.
- Recommended to scope permissions only to the target S3 bucket and its objects using the bucket ARN.