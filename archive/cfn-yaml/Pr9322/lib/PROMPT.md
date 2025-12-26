## AWS CloudFormation Secure Infrastructure for Compliance

Need to create a secure AWS CloudFormation YAML template that implements least-privilege infrastructure with IAM roles, CloudTrail logging, VPC subnets, S3 encryption, and EC2 monitoring. The infrastructure must be deployed in us-east-1 region and follow the 'my-app-*' naming convention.

**Context:**
We have a VPC already set up with CIDR block 10.0.0.0/16. Every IAM role must follow the Least Privilege Principle - scope policies tightly to specific resources only. This needs to meet our organizational security and compliance requirements.

**Requirements:**

**1. IAM Role with Minimal S3 Permissions**
- Create an IAM role named `my-app-Role-ReadS3`
- Attach an inline policy that grants only read-only S3 access to the bucket `my-app-bucket`
- Use minimal necessary actions: `s3:GetObject`, `s3:ListBucket`, `s3:GetBucketLocation`
- Limit resource ARNs to specific bucket: `arn:aws:s3:::my-app-bucket` and objects in that bucket only
- Include explicit trust policy specifying `ec2.amazonaws.com` as the principal

**2. CloudTrail Multi-Region Compliance**
- Enable AWS CloudTrail across all regions using `IsMultiRegionTrail: true`
- Capture global service events with `IncludeGlobalServiceEvents: true`
- Create S3 bucket for CloudTrail logs: `my-app-cloudtrail-logs-<unique-suffix>`
- Encrypt CloudTrail log bucket with KMS
- Implement bucket policy allowing only CloudTrail service to put objects
- Ensure `IsLogging: true` for compliance verification

**3. VPC and Subnet Redundancy**
- Accept existing VPC ID as a Parameter called `ExistingVPCId` instead of creating new VPC
- Create at least two subnets in different Availability Zones
- Name subnets: `my-app-Subnet-A`, `my-app-Subnet-B`
- Use non-overlapping /24 CIDRs like 10.0.1.0/24, 10.0.2.0/24
- Attach relevant tags and route table associations

**4. S3 Bucket Encryption with KMS**
- Create KMS Customer Master Key with alias `alias/my-app/s3`
- Configure key policy allowing account admins and CloudFormation stack access
- Encrypt all data at rest in `my-app-bucket` using SSE-KMS
- Set `SSEAlgorithm: aws:kms` and `KmsMasterKeyId` to the created CMK
- Enforce TLS and block public access

**5. EC2 Detailed Monitoring**
- Enable detailed monitoring with `Monitoring: true` on EC2 instances
- Collect 1-minute metrics for performance and usage insights
- If creating Launch Template/AutoScalingGroup, enable detailed monitoring there too
- Provide sample `AWS::EC2::Instance` resource demonstrating monitoring configuration

**Constraints:**
- **Least Privilege**: IAM policies must be minimal and scope to specific buckets/keys only
- **Naming Convention**: Every resource name must use `my-app-` prefix
- **Parameters**: Expose parameters for configurable values like VPC ID, AZs
- **Security Controls**: Apply tags, S3 Block Public Access, KMS encryption
- **Specific Scoping**: Use exact ARNs - specify bucket names and key aliases explicitly

**Deliverables:**
- Single CloudFormation YAML template deployable to us-east-1
- Production-quality template with comments and parameter descriptions
- README documenting deployment steps and validation procedures
- Validation steps for all five requirements
- Example CLI commands for testing IAM role permissions

**Validation:**
- IAM policy contains only the three allowed S3 actions and specific bucket ARNs
- CloudTrail exists with `IsMultiRegionTrail: true` and logs delivered to KMS-encrypted bucket
- S3 bucket default encryption is SSE-KMS with created CMK
- At least two subnet IDs created in different AZs
- EC2 instances show `Monitoring.State: enabled`
- IAM role can be assumed and used to read from `my-app-bucket`

**Implementation:**
- Use `AWS::CloudTrail::Trail` with multi-region configuration
- Use `AWS::KMS::Key` with `AWS::KMS::Alias` for CMK with key rotation enabled
- Use `AWS::S3::Bucket` with `BucketEncryption` and `PublicAccessBlockConfiguration`
- Use `AWS::IAM::Policy` inline rather than managed policies
- Use intrinsic functions for ARNs and avoid hardcoding except where required
- Document any manual post-deployment steps for existing resources
