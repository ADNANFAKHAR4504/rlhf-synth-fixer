```yaml

## High-level user prompt — AWS CloudFormation Secure Infrastructure for Compliance

**Goal (one sentence):**
Design and implement a secure, compliance-ready AWS CloudFormation YAML template that creates a least-privilege infrastructure with IAM roles, CloudTrail logging, VPC subnets, S3 encryption, and EC2 monitoring to meet organizational security requirements.

**Problem Statement:**
You need to create a comprehensive AWS CloudFormation template that implements secure infrastructure components to comply with organizational security standards. The infrastructure must be deployed in us-east-1 region and follow the 'my-app-*' naming convention. A VPC already exists with CIDR block 10.0.0.0/16, and all IAM roles must adhere to the Least Privilege Principle.

**Requirements (must implement):**

**1. IAM Role with Minimal S3 Permissions**
- Create an IAM role named using the convention `my-app-Role-ReadS3`
- Attach an `AWS::IAM::Policy` resource (inline policy) that grants only read-only S3 access to the bucket `my-app-bucket`
- Use minimal necessary actions: `s3:GetObject`, `s3:ListBucket`, `s3:GetBucketLocation`
- Limit resource ARNs to `arn:aws:s3:::my-app-bucket` and `arn:aws:s3:::my-app-bucket/*`
- Include explicit trust policy specifying the intended principal (e.g., `ec2.amazonaws.com`)

**2. CloudTrail Multi-Region Compliance**
- Enable AWS CloudTrail across all regions using `IsMultiRegionTrail: true`
- Capture global service events with `IncludeGlobalServiceEvents: true`
- Create S3 bucket for CloudTrail logs: `my-app-cloudtrail-logs-<unique-suffix>`
- Encrypt CloudTrail log bucket with KMS
- Implement bucket policy allowing only CloudTrail service to put objects
- Ensure `IsLogging: true` for compliance verification

**3. VPC and Subnet Redundancy**
- Accept existing VPC ID as a Parameter (`ExistingVPCId`) rather than creating new VPC
- Create at least two subnets in different Availability Zones
- Name subnets: `my-app-Subnet-A`, `my-app-Subnet-B`, etc.
- Use non-overlapping /24 CIDRs (e.g., 10.0.1.0/24, 10.0.2.0/24)
- Attach relevant tags and route table associations

**4. S3 Bucket Encryption with KMS**
- Create KMS Customer Master Key (CMK) with alias `alias/my-app/s3`
- Configure key policy allowing account admins and CloudFormation stack access
- Encrypt all data at rest in `my-app-bucket` using SSE-KMS
- Set `SSEAlgorithm: aws:kms` and `KmsMasterKeyId` to the created CMK
- Enforce TLS (deny non-SSL requests) and block public access

**5. EC2 Detailed Monitoring**
- Enable detailed monitoring (`Monitoring: true`) on EC2 instances
- Collect 1-minute metrics for performance and usage insights
- If creating Launch Template/AutoScalingGroup, enable detailed monitoring
- Provide sample `AWS::EC2::Instance` resource demonstrating monitoring configuration

**Constraints & Best Practice Requirements:**
- **Least Privilege**: IAM policies must be minimal and resource-scoped
- **No Wildcards**: Avoid `*` for actions or resources unless absolutely necessary
- **Naming Convention**: All resources must use `my-app-*` prefix
- **Parameters**: Expose parameters for configurable values (VPC ID, AZs, etc.)
- **Security Controls**: Apply tags, S3 Block Public Access, KMS encryption
- **No Broad Permissions**: Avoid `s3:*` or `kms:*` unless specifically justified

**Expected Deliverables:**
- Single CloudFormation YAML template deployable to us-east-1
- Production-quality template with comments and parameter descriptions
- README documenting deployment steps and validation procedures
- Validation steps for all five requirements
- Example CLI commands for testing IAM role permissions

**Validation Requirements:**
- IAM policy contains only allowed S3 actions and resource ARNs
- CloudTrail exists with `IsMultiRegionTrail: true` and logs delivered to KMS-encrypted bucket
- S3 bucket default encryption is SSE-KMS with created CMK
- At least two subnet IDs created in different AZs
- EC2 instances show `Monitoring.State: enabled`
- IAM role can be assumed and used to read from `my-app-bucket`

**Implementation Notes:**
- Use `AWS::CloudTrail::Trail` with multi-region configuration
- Use `AWS::KMS::Key` + `AWS::KMS::Alias` for CMK with key rotation enabled
- Use `AWS::S3::Bucket` with `BucketEncryption` and `PublicAccessBlockConfiguration`
- Use `AWS::IAM::Policy` (inline) rather than managed policies
- Use intrinsic functions for ARNs and avoid hardcoding except where required
- Document any manual post-deployment steps for existing resources
```
