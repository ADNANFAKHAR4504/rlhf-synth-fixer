# Model Failure — SecureS3 CDK Stack

This file documents all potential failure scenarios, misconfigurations, and test failures that could occur in the TAPStack deployment. Each issue is categorized by component with diagnostic advice and mitigation.

---

## 🧩 Configuration & Deployment Failures

| Area                  | Failure Description                                                                 | How to Detect/Test                                                                 | Root Cause                                                                                   | Resolution                                                                                   |
|-----------------------|--------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------|
| CDK Synthesis         | `cdk synth` throws error due to missing props                                        | Terminal error from CDK CLI                                                         | `props.environment_suffix` is `None` or not passed                                           | Ensure props are initialized with fallback/default or explicitly passed                     |
| CDK Deployment        | `cdk deploy` fails with permissions error                                            | AWS denies deploy or CloudFormation fails                                           | Lack of IAM permission to create bucket/KMS/key policy                                       | Ensure deployer has `AdministratorAccess` or sufficient role permissions                    |
| Missing Principal ARNs| `jsii` kernel crash: “resource-based policy must have a principal”                   | Synth or deploy fails on `kms.Key.add_to_resource_policy()`                         | `principal_arns` list is empty or not defined                                                | Add default/test ARN or conditionally skip policy statement if no ARNs                      |
| Stack Removal         | `cdk destroy` hangs or fails to clean up                                             | Bucket is not empty / KMS key in use                                                | Auto-delete flag not set or dependent stacks still use the resource                          | Enable `auto_delete_objects=True` and use `RemovalPolicy.DESTROY` during dev                |

---

## 🔐 Security & Compliance Failures

| Area                | Failure Description                                                                    | How to Detect/Test                                                                | Root Cause                                                                                     | Resolution                                                                                     |
|---------------------|-----------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------|
| Unencrypted Uploads | S3 allows non-KMS-encrypted uploads                                                     | Upload succeeds using `aws s3 cp` without `--sse`                                 | Bucket policy missing `DenyUnEncryptedObjectUploads`                                            | Ensure bucket policy explicitly denies uploads without `s3:x-amz-server-side-encryption`       |
| Wrong KMS Key       | Upload succeeds with another KMS key                                                   | Upload object with unrelated `--sse-kms-key-id`                                   | Missing or misconfigured `DenyIncorrectKMSKey` bucket policy                                    | Add policy to deny `s3:PutObject` where `kms-key-id != secure KMS`                             |
| Public Access       | Bucket allows public or anonymous access                                               | Upload or read via unauthenticated means                                          | `BlockPublicAccess.BLOCK_ALL` not applied or overridden                                        | Set `block_public_access=s3.BlockPublicAccess.BLOCK_ALL` explicitly                           |
| Principal Overreach | Principal ARNs granted full access beyond intended buckets or keys                     | IAM policy audit                                                                  | Using `"*"` in policy actions or principals                                                     | Use exact ARNs and scoped actions (`s3:GetObject`, `kms:Encrypt`) only                         |

---

## 📤 Outputs & Integration Failures

| Area              | Failure Description                                                       | How to Detect/Test                                                    | Root Cause                                                  | Resolution                                                  |
|-------------------|----------------------------------------------------------------------------|----------------------------------------------------------------------|-------------------------------------------------------------|-------------------------------------------------------------|
| Outputs Missing   | CloudFormation does not export S3/KMS values                              | CF console has no exports                                            | `CfnOutput` not defined or incorrect scope                  | Define `CfnOutput` in nested stack or main stack            |
| Outputs Incorrect | Bucket ARN is wrong / contains stack tokens                               | Output shows `${Token[...]}` or incorrect value                     | Reference is incorrect (e.g., `str(bucket)` vs `bucket.bucket_arn`) | Use `.bucket_arn`, `.key_arn`, `.bucket_name` explicitly   |

---

## 🧪 Testing Failures

| Test Area            | Test Case Description                                                  | Potential Test Failure                                                         | Likely Cause                                              | Suggested Fix                                               |
|----------------------|------------------------------------------------------------------------|---------------------------------------------------------------------------------|------------------------------------------------------------|-------------------------------------------------------------|
| Unit Test - S3       | Validate versioning and encryption                                     | Test fails due to missing `BucketEncryption` or `VersioningConfiguration`     | Bucket properties not applied                             | Ensure correct CDK props (`versioned=True`, `encryption=...`)|
| Unit Test - KMS      | Validate KMS key creation and alias                                    | `resource_count_is("AWS::KMS::Key", 1)` fails                                  | Key not created or improperly scoped                      | Review key instantiation and ensure alias is attached       |
| Unit Test - Policy   | Assert deny on unencrypted uploads                                     | Assertion fails on `s3:PutObject` condition mismatch                          | Policy misspelled or misconfigured                         | Match on `StringNotEquals` condition for `aws:kms`          |
| Integration Test     | Run full `cdk synth → deploy → destroy`                                | Stack fails to deploy or outputs fail                                          | Props missing, account mismatch, or resource conflict      | Ensure environment variables and props are passed correctly |
| Access Control Test  | IAM user can access bucket without policy                              | Manual role access test fails to restrict actions                             | Bucket policy or key policy too permissive                | Audit and restrict IAM access using test ARNs               |

---

## 🧰 Best Practices Missing

| Checkpoint                   | Why It Matters                                                                 | Fix Recommendation                                                           |
|-----------------------------|---------------------------------------------------------------------------------|------------------------------------------------------------------------------|
| No Key Rotation             | Long-lived static encryption keys are a security risk                          | Set `enable_key_rotation=True` on `kms.Key`                                 |
| No Tagging                  | Resources are untagged, leading to lack of traceability                        | Tag bucket/key using `Tags.of(resource).add(...)`                           |
| No Outputs                  | Downstream stacks/tools can't reference bucket/key                             | Add `CfnOutput` for key ARNs and bucket info                                |
| No Principal Validation     | Resources created with overbroad access                                        | Validate `principal_arns` before applying policy                            |
| No Lifecycle Policy         | S3 bucket may accumulate stale or unused data                                  | Add `lifecycle_rules` to archive/delete old versions                        |

---

## 📍 CI/CD Pipeline Pitfalls (if integrated)

| Step             | Failure/Warning                                                              | Cause                                                   | Fix                                                        |
|------------------|------------------------------------------------------------------------------|----------------------------------------------------------|-------------------------------------------------------------|
| CDK synth fails  | `Missing context value: environmentSuffix`                                   | `cdk deploy` not provided with `-c environmentSuffix=...`| Always set via context or default fallback in app code      |
| Stack fails on GitHub | IAM access denied for deploy runner                                       | GitHub runner lacks IAM deploy role                     | Attach IAM role with `sts:AssumeRole` or `cdk bootstrap`    |

---

## ✅ Recommendations Summary

- Always validate `principal_arns` are non-empty
- Avoid using reserved CDK property names (like `environment`)
- Write unit tests for encryption, policies, and access control
- Include environment suffix in all resource names
- Add lifecycle rules and access logging for production readiness
