Need a production-ready secure infrastructure baseline in CloudFormation. Everything should be encrypted at rest, IAM should follow least privilege, and we need full API logging plus operational monitoring.

## Scope

Single region deployment - should be parameterizable but defaults to us-east-1. Single AWS account, no cross-account stuff. Need IPv4 VPC with public and private subnets in at least two availability zones. Don't pull in external dependencies beyond what's in Parameters.

## What to deliver

One CloudFormation YAML template that deploys everything below. Make resource names deterministic and tag everything consistently.

## Parameters needed

- ProjectName - defaults to iac-nova-model-breaking
- Environment - defaults to prod
- Region - stack region by default but allow override
- VpcCidr - defaults to 10.0.0.0/16
- PublicSubnetCidrs - list with 2 values
- PrivateSubnetCidrs - list with 2 values
- KeyPairName - EC2 key pair type
- InstanceType - defaults to t3.micro
- AlertEmail - string for CloudWatch alarm subscriptions
- AllowSshCidr - optional, defaults to 0.0.0.0/0 but should be restrictable

## Infrastructure Components

### Networking

VPC with DNS support and hostnames enabled. Two public subnets and two private subnets in different AZs. Need route tables, Internet Gateway, and ONE NAT Gateway in a public subnet to keep costs down.

Security groups:
- BastionSG - SSH inbound from AllowSshCidr, egress all
- AppSG - no public ingress, SSH only from BastionSG and internal VPC traffic

### Encryption Keys

Two symmetric CMKs:
- KmsKeyData with alias: alias/ProjectName/Environment/data
- KmsKeyLogs with alias: alias/ProjectName/Environment/logs

Enable rotation on both keys.

Key policies should grant root admin access and give encrypt/decrypt permissions to EC2 instances via role, S3 for bucket encryption, CloudTrail, CloudWatch Logs, and SNS alarms topic.

### S3 Buckets

All buckets need SSE-KMS with enforcement at the bucket policy level.

**AppDataBucket** - private bucket
- Default encryption with KmsKeyData
- Bucket policy must deny:
  * Unencrypted PUTs - require s3:x-amz-server-side-encryption = aws:kms
  * Wrong KMS key
  * Non-TLS connections - aws:SecureTransport must be true
  * Any public access
- Block Public Access: enable all four settings
- Versioning enabled

**TrailLogsBucket** - private, write-only for CloudTrail
- Default encryption with KmsKeyLogs
- Policy allows CloudTrail to write with correct ACL and encryption headers
- TLS-only enforcement
- Block Public Access enabled
- Object ownership: BucketOwnerPreferred

### EC2 Instances

**Bastion host** in public subnet:
- Root volume encrypted with KmsKeyData
- Any additional EBS volumes also encrypted with KmsKeyData
- Attach BastionSG
- User data to install CloudWatch agent and SSM agent

**Application instance** in private subnet:
- No public IP
- All EBS volumes encrypted with KmsKeyData
- Attach AppSG
- User data to install CloudWatch agent and SSM agent

### IAM

Instance role plus instance profile for bastion and app:
- SSM core managed policy for Session Manager access - no admin stuff
- CloudWatch agent can only put metrics and logs to specific log groups
- S3 access scoped to AppDataBucket - list/get/put only to apps/Environment/ prefix
- KMS permissions scoped to KmsKeyData and KmsKeyLogs - only encrypt/decrypt for data paths
- EC2 Describe read-only where needed

CloudTrail to CloudWatch Logs role with minimal policy to put logs.

### Logging and Monitoring

**CloudTrail** - single region:
- Delivers to TrailLogsBucket with SSE-KMS using KmsKeyLogs
- Also sends to CloudWatch Logs:
  * Create log group with KMS key KmsKeyLogs
  * Set retention to 90 days

**CloudWatch:**
- Log groups for EC2 CloudWatch agent with KMS encryption using KmsKeyLogs
- Metric filters on CloudTrail log group for:
  * Unauthorized API calls
  * Console sign-in without MFA
  * Root account usage
- Alarms wired to SNS topic encrypted with KmsKeyLogs
- Email subscription to AlertEmail - manual confirmation needed

### Outputs

Export these:
- VPC, subnet, and security group IDs
- Instance IDs
- S3 bucket names
- KMS key ARNs
- CloudTrail name
- CloudWatch log group ARNs
- SNS topic ARN

### Tags

Apply to all resources:
- Project = ProjectName parameter
- Environment = Environment parameter
- Region = Region parameter
- Owner = Security
- DataClassification = Confidential on buckets and volumes

## Security Requirements

S3 bucket policies must deny:
- Unencrypted uploads or wrong KMS key
- Insecure transport without TLS
- Public ACLs or policies
- Enable BlockPublicAccess on all buckets

EBS: every block device mapping sets Encrypted: true and KmsKeyId: !Ref KmsKeyData

IAM: use least privilege - no wildcards on resource ARNs where possible. Scope to specific buckets, keys, log groups, and prefixes.

CloudTrail writes must have correct SSE-KMS headers and target bucket conditions.

## Validation checklist

S3 buckets should report ServerSideEncryptionConfiguration using aws:kms with intended key. Bucket policy prevents unencrypted PUT and public access.

All instance volumes are Encrypted = true with KmsKeyData.

KMS keys have rotation enabled. Key policies allow only required principals and services.

Instance role policies limit S3 access to specific bucket/prefix. CloudWatch and SSM permissions are minimal. KMS permissions limited to the two keys.

CloudTrail trail status is Started, single-region, writing to logs bucket with SSE-KMS and to CloudWatch log group.

CloudWatch metric filters exist for three security signals. Alarms are OK initially and target encrypted SNS topic.

## Format

Output only valid CloudFormation YAML. No placeholders or TBD. Include descriptions on parameters, resources, and outputs. Use intrinsic functions where appropriate, avoid deprecated properties. Keep resource names deterministic and aligned with parameters.
