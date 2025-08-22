Here are **5 expert-level faults** found when comparing `MODEL_RESPONSE.md` with `IDEAL_RESPONSE.md`:

1. **KMS Policy Misconfiguration**
   - In the model response, the IAM policy for KMS (`KMSAccess` statement) uses `resources: ['*']`, which is overly permissive and violates least privilege.
   - The ideal response restricts KMS permissions to the specific KMS key ARN used for encrypting S3 buckets.

2. **Missing Explicit Bucket Resource Restrictions**
   - The model response grants `s3:ListBucket` and object-level permissions without ensuring that **only specific bucket ARNs** are used consistently in all statements. Some statements use `resources: ['*']` for non-KMS actions.
   - The ideal response always scopes S3 permissions strictly to the intended buckets and their objects.

3. **KMS Key Policy Not Defined**
   - The model creates a KMS key but does not define a **KMS key policy** granting appropriate principals access.
   - The ideal response explicitly defines the KMS key policy, ensuring only intended IAM roles/users can use the key.

4. **Backend Bucket Encryption Algorithm**
   - The backend S3 bucket in the model uses AES256 encryption instead of AWS best practice for sensitive infrastructure state, which is **AWS KMS encryption**.
   - The ideal response configures backend encryption with a **customer-managed KMS key** for stronger security controls.

5. **IAM Role Trust Policy Hardcoded to EC2 Service**
   - The trust policy in the model is limited to `ec2.amazonaws.com`, which may not align with the requirement that specific **roles and users** access the S3 buckets. This could break intended workflows for non-EC2 principals.
   - The ideal response makes the trust policy flexible and configurable, allowing only the explicitly defined roles/users to assume it.
