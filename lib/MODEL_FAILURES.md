## MODEL_FAILURE.md

### Summary
The generated CloudFormation YAML template fails to meet multiple security, reliability, and best practice expectations outlined in the original prompt. The issues include incorrect S3 bucket policies, lack of IAM policy separation, missing NACLs, improper EC2 key handling, and unvalidated components.

---

### Detailed Failures

#### 1. 🔐 S3 Bucket Policy Misconfiguration
- **Issue**: Bucket policy attempts to deny insecure transport using an unresolved intrinsic reference: `!Sub "arn:aws:s3:::${S3Bucket}/*"` inside the policy's `Resource`. This results in deployment failure due to circular dependency.
- **Fix**: Replace with explicit bucket name or use `!Join` workaround. Alternatively, move policy to a separate `AWS::S3::BucketPolicy` resource.

#### 2. 🔐 Missing KMS Encryption for RDS
- **Issue**: RDS is deployed without KMS key encryption.
- **Fix**: Add `StorageEncrypted: true` and `KmsKeyId: !Ref MyKmsKey`.

#### 3. 🚫 No NACLs Defined
- **Issue**: Prompt requests network ACLs configured with best practices. These are missing entirely.
- **Fix**: Add `AWS::EC2::NetworkAcl` and `AWS::EC2::SubnetNetworkAclAssociation` resources.

#### 4. ⚠️ Hardcoded RDS Credentials
- **Issue**: `MasterUsername` and `MasterUserPassword` are hardcoded.
- **Fix**: Use `AWS::SecretsManager::Secret` and reference it securely.

#### 5. 🔐 IAM Role Lacks Granular Policies
- **Issue**: IAM roles lack least privilege granularity and reuse the same policy for EC2 access to S3.
- **Fix**: Split roles by resource and restrict by action and condition.

#### 6. ❌ Launch Configuration is Deprecated
- **Issue**: `AWS::AutoScaling::LaunchConfiguration` is outdated.
- **Fix**: Use `AWS::AutoScaling::LaunchTemplate` instead.

---

### Conclusion
The model response contains valid CloudFormation syntax but does **not fully satisfy** the security, high availability, and best practice criteria requested. Therefore, it **breaks the model** as per expert-level expectations.
