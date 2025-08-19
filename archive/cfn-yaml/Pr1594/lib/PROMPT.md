Create a production-ready AWS CloudFormation template in YAML that provisions a minimal yet secure baseline aligned with the constraints below. The template must be self-contained, lint-clean, and ready to deploy in us-east-1.

Hard Constraints (must follow exactly)

Region: us-east-1 (assume deployment there; do not create Region parameters).

Do NOT create: AWS Config, Config Recorder, Delivery Channel, or CloudTrail.

Naming: Prefix all named resources with Prod-.

Tagging: Apply tag Owner: TechTeam to every resource that supports tags.

Logging: All log-capable resources created by this template must send logs to one centralized CloudWatch Logs group.

Encryption at rest:

All S3 buckets must use SSE-KMS with a customer-managed KMS key (CMK) that has key rotation enabled.

The CloudWatch Logs group must be encrypted with a CMK.

IAM Least Privilege: Every IAM role/policy must be scoped narrowly to only what is required.

MFA Enforcement: Include an IAM managed policy and an IAM group that enforces MFA for console users (deny actions when aws:MultiFactorAuthPresent is false except the minimal calls needed to enroll MFA and change password).

Deliverables
Return only a single CloudFormation YAML document with these sections (no prose outside the YAML):

AWSTemplateFormatVersion

Description (state that it is us-east-1; explicitly mention no Config/CloudTrail)

Parameters (keep minimal and practical: prefix, bucket name suffix, log retention days)

Metadata (optional UI grouping for parameters)

Conditions (if needed)

Resources (as specified below)

Outputs (useful ARNs/names/ids)

Resources to Include (Exact expectations)

KMS CMK for Logs

EnableKeyRotation: true

Alias like alias/Prod-logs

Key policy that allows the account root full admin on the key.

Centralized CloudWatch Logs Group

Name pattern /Prod/central

KmsKeyId referencing the Logs CMK

RetentionInDays parameterized (default 90)

Tagged with Owner: TechTeam

KMS CMK for S3

EnableKeyRotation: true

Alias like alias/Prod-s3

Key policy like above.

At least one S3 bucket for secure artifacts/logs

Name pattern Prod-<suffix>-<AccountId>-<Region> where <suffix> is parameterized (lowercase)

BucketEncryption with SSE-KMS and the specific S3 CMK + BucketKeyEnabled: true

PublicAccessBlockConfiguration: all true

OwnershipControls set to BucketOwnerEnforced

Bucket policy that enforces:

TLS only (aws:SecureTransport = true)

SSE-KMS only (s3:x-amz-server-side-encryption = aws:kms)

Specific CMK only (s3:x-amz-server-side-encryption-aws-kms-key-id must equal the CMK ID)

Centralized Logging Wiring Example

Provide one example IAM role (e.g., for EC2/Lambda) with least privilege to create a log stream and put log events only in the centralized log group ARN (use ${LogGroupArn}:*).

This role is an example for future workloads to adopt centralized logging; no EC2/Lambda resources are required.

MFA Enforcement Controls

A Managed Policy (e.g., Prod-DenyWithoutMFA) that denies all actions when aws:MultiFactorAuthPresent is false, except the minimal set needed to:

iam:CreateVirtualMFADevice, iam:EnableMFADevice, iam:ListMFADevices, iam:ListVirtualMFADevices, iam:GetUser, iam:ResyncMFADevice, iam:ChangePassword, and sts:GetSessionToken.

Exclude actions invoked via AWS services using aws:ViaAWSService allowance logic as appropriate.

An IAM Group (e.g., Prod-MFA-Required) that attaches the above managed policy. (Note: This does not affect the root user.)

IAM & Policy Quality Bar

Policies must be as narrow as possible:

Logs writer role: only logs:CreateLogStream and logs:PutLogEvents on the specific centralized group (and its streams), plus logs:DescribeLogGroups if strictly needed.

Avoid wildcard on Action where possible; if needed, keep them targeted and justified.

Avoid permissive resource ARNs (*); scope to the log group or specific resource ARNs.

Assume role trust policies: grant only the minimum principals (e.g., ec2.amazonaws.com, lambda.amazonaws.com) where used.

Parameters (minimal, practical)

ResourcePrefix (Default Prod)

OwnerTag (Default TechTeam)

LogRetentionDays (Default 90, Min 1)

BucketNameSuffix (Default secure-artifacts, lowercase regex)

Outputs (useful for ops & integration)

Central Log Group name and ARN

S3 bucket name

KMS key ARNs (Logs and S3)

MFA group name

Do / Don’t

DO ensure every taggable resource includes Owner: TechTeam.

DO ensure every named resource starts with Prod-.

DO enable KMS key rotation.

DO make the template pass cfn-lint and be valid YAML.

DON’T add AWS Config, Config Recorder, Delivery Channel, or CloudTrail.

DON’T add unmanaged/wildcard-broad permissions.

DON’T output prose—return only the YAML.

Validation & Quality Checks (the template you return must satisfy all):

cfn-lint reports no errors.

All S3 buckets use SSE-KMS with the specific CMK and TLS enforcement in bucket policy.

CloudWatch Logs group is KMS-encrypted with the Logs CMK and retention is set.

Example logs writer role is least-privilege and references only the centralized log group ARN.

MFA enforcement managed policy + group are present and correctly scoped.

All resources are prefixed with Prod- and tagged Owner:TechTeam.

Style & Structure

Keep comments minimal.

Prefer !Sub for ARNs and names.

Use clear logical IDs (e.g., LogsKmsKey, CentralLogGroup, S3KmsKey, SecureBucket, MFARequiredGroup).

Avoid unnecessary parameters/conditions.

Return only the final CloudFormation YAML implementing everything above.
