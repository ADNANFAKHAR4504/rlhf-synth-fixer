### 🔴 Critical Failures & Security Vulnerabilities

These issues violate core security principles and must be fixed.

1.  **Overly Permissive KMS Key Policy**
    * **Finding:** The `NovaKMSKey` policy grants the account root principal (`AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'`) full administrative permissions (`kms:*`) over the key.
    * **Location:** `Resources.NovaKMSKey.Properties.KeyPolicy`
    * **Impact:** This is a major security risk. It violates the principle of least privilege by allowing any IAM user with administrative access to potentially delete or manage this critical encryption key, which would render all encrypted data unrecoverable.
    * **Recommendation:** The root principal should **never** be given `kms:*`. Key administration should be handled by specific IAM policies attached to a designated administrators group. The key policy itself should only grant usage permissions to the specific IAM roles and services that require them.

2.  **Insecure Plaintext Database Credentials**
    * **Finding:** The template requires the database master username and password to be passed in as plaintext parameters (`DBMasterUsername`, `DBMasterPassword`).
    * **Location:** `Parameters` section and `Resources.NovaRDSInstance.Properties`
    * **Impact:** This is a severe security anti-pattern. Credentials will be visible in the CloudFormation console and stored in plaintext in the stack configuration, exposing them to anyone with read access to the stack.
    * **Recommendation:** Use **AWS Secrets Manager** to store and manage the database credentials. The RDS resource can then reference the secret directly and securely using dynamic references (e.g., `{{resolve:secretsmanager:secret-name}}`).

3.  **Missing VPC Peering Connection**
    * **Finding:** A core requirement was to establish a secure connection between the regional VPCs using VPC Peering. The template **does not define** an `AWS::EC2::VPCPeeringConnection` resource or the necessary routes in the route tables to facilitate inter-VPC traffic.
    * **Impact:** The two regional infrastructures would be completely isolated, failing a primary design requirement. The template is designed to be deployed via StackSets, but it lacks the logic to connect the resulting stacks.

4.  **Invalid S3 Replication Configuration**
    * **Finding:** The `NovaS3Bucket`'s `ReplicationConfiguration` hardcodes a bucket ARN for the secondary region. However, the backup bucket (`NovaS3BackupBucket`) is only created when the template is deployed in the secondary region.
    * **Location:** `Resources.NovaS3Bucket.Properties.ReplicationConfiguration`
    * **Impact:** When deploying the primary stack in `us-east-1`, the stack creation will **fail** because the target replication bucket in `us-west-2` does not exist yet.

---

### 🟡 Best Practice Deviations

These items are not critical failures but deviate from modern, robust IaC practices.

1.  **Hardcoded AMI IDs**
    * **Finding:** The template uses hardcoded AMI IDs in the `Mappings` section.
    * **Location:** `Mappings.RegionMap`
    * **Impact:** AMI IDs change frequently. This makes the template brittle and requires manual updates to use the latest patched OS.
    * **Recommendation:** Use an **SSM Parameter Store public parameter** to dynamically fetch the latest Amazon Linux 2023 AMI for the given region. This ensures the template always uses the most recent, secure AMI.

2.  **Incomplete IAM Least Privilege for EC2 Role**
    * **Finding:** The `NovaEC2Role` policy grants access to the entire S3 bucket (`s3:ListBucket` on the bucket ARN) and all objects within it.
    * **Location:** `Resources.NovaEC2Role.Properties.Policies`
    * **Impact:** While better than a wildcard, it could be more restrictive. If the application only needs to access a specific prefix (folder) within the bucket, the policy should be scoped down to that prefix (e.g., `arn:aws:s3:::my-bucket/data/*`).

3.  **Incomplete Final `Outputs` Section**
    * **Finding:** The YAML file cuts off abruptly in the middle of the `KMSKeyId` output definition.
    * **Location:** The very end of the file.
    * **Impact:** This is a syntax error that will cause the template to fail validation.
