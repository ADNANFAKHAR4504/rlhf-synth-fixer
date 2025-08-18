Goal

Stand up a minimally opinionated, production-grade baseline with encryption at rest everywhere, least-privilege IAM, and complete API logging + operational monitoring.

Scope (single region)

Operate in one region only (parameterizable, default may be us-east-1).

One AWS account (no cross-account resources).

IPv4 VPC with both public and private subnets across at least two AZs.

No external dependencies beyond what’s declared as Parameters.

Deliverable

A single CloudFormation YAML template that can be deployed as-is and creates all resources below, with sensible defaults and parameters. Use deterministic logical IDs, clear descriptions, and consistent tagging.

Parameters (define these)

ProjectName (default: iac-nova-model-breaking)

Environment (default: prod)

Region (default: stack region; allow override)

VpcCidr (default: 10.0.0.0/16)

PublicSubnetCidrs (list, 2 values)

PrivateSubnetCidrs (list, 2 values)

KeyPairName (type AWS::EC2::KeyPair::KeyName)

InstanceType (default e.g., t3.micro)

AlertEmail (string; used to subscribe to alarms)

Optional: AllowSshCidr (default 0.0.0.0/0, but restrictable)

Resources to create
Networking

VPC with DNS support & hostnames enabled.

Two public and two private subnets (distinct AZs), route tables, Internet Gateway, and a single NAT Gateway (cost-aware) in one public subnet.

Security Groups:

BastionSG: inbound SSH from AllowSshCidr; egress all.

AppSG: no public ingress; allow only required ports from BastionSG (e.g., SSH) and from within VPC if needed.

KMS (encryption at rest)

Two CMKs (symmetric):

KmsKeyData (alias: alias/${ProjectName}/${Environment}/data)

KmsKeyLogs (alias: alias/${ProjectName}/${Environment}/logs)

Enable key rotation on both.

Key policies that:

Grant administrative access to the account root.

Grant required encrypt/decrypt permissions to: EC2 instances (via role), S3 (for bucket SSE-KMS), CloudTrail, CloudWatch Logs, and SNS topic used by alarms.

S3 (all SSE-KMS with bucket-level enforcement)

AppDataBucket (private):

Default SSE-KMS with KmsKeyData.

Bucket policy denies:

Unencrypted PUTs (s3:x-amz-server-side-encryption must be aws:kms).

Wrong KMS key.

Non-TLS (aws:SecureTransport = false).

Any public access.

Block Public Access: all four settings true.

TrailLogsBucket (private, write-only for the trail):

Default SSE-KMS with KmsKeyLogs.

Policy allowing CloudTrail to write with the correct ACL and encryption headers.

TLS-only + public access block as above.

Object Ownership: BucketOwnerPreferred.

Compute (EC2 with encrypted EBS)

Bastion host in a public subnet:

Launch Template or Instance configured with:

Root volume encrypted with KmsKeyData.

Any additional EBS volumes also encrypted with KmsKeyData.

Associate BastionSG.

Application instance in a private subnet:

No public IP.

Block device mappings encrypted with KmsKeyData.

Associate AppSG.

Optional user data: install CloudWatch agent (logs/metrics) and SSM agent.

IAM (least privilege)

Instance role + instance profile for bastion/app:

Minimal permissions:

SSM core managed policy for Session Manager access (no broad admin).

CloudWatch agent put-metrics/logs only to specific log groups.

S3 access scoped to AppDataBucket (list/get/put only to a specific prefix like apps/${Environment}/).

KMS permissions scoped to grants on KmsKeyData and KmsKeyLogs as needed by the instance/agents (encrypt/decrypt for data paths only).

EC2 Describe* read-only where necessary.

CloudTrail to CloudWatch Logs role with the minimal policy required to put logs.

Logging & Monitoring

CloudTrail (single-region):

Delivers to TrailLogsBucket with SSE-KMS (KmsKeyLogs).

Also delivers to CloudWatch Logs:

Create a Log Group with KMS key KmsKeyLogs and a reasonable retention (e.g., 90 days).

CloudWatch:

Create log groups for the EC2 CloudWatch agent with KMS encryption using KmsKeyLogs.

Metric Filters on the CloudTrail log group:

Unauthorized API calls

Console sign-in without MFA

Root account usage

Alarms wired to an SNS Topic (topic encrypted with KmsKeyLogs); create an email subscription to AlertEmail (acknowledge manual confirmation may be needed).

Outputs

IDs and ARNs: VPC, Subnets, Security Groups, Instance IDs, S3 bucket names, KMS key ARNs, CloudTrail name, CloudWatch Log Group ARNs, SNS topic ARN.

Tags

Apply to all taggable resources:

Project = ${ProjectName}

Environment = ${Environment}

Region = ${Region}

Owner = Security

DataClassification = Confidential (buckets & volumes)

Security guardrails to enforce in template

S3 bucket policies that deny:

Unencrypted uploads or uploads using the wrong KMS key.

Insecure transport (no TLS).

Any public ACLs or policies; also enable BlockPublicAccess.

EBS: every block device mapping explicitly sets Encrypted: true and KmsKeyId: !Ref KmsKeyData.

Least-privilege IAM: no wildcards on resource where avoidable; scope ARNs to the specific buckets, keys, log groups, and prefixes.

CloudTrail writes must include the correct SSE-KMS headers and target bucket conditions.

Validation checklist (what the template must satisfy)

S3: Both buckets report ServerSideEncryptionConfiguration using aws:kms with the intended key; bucket policy prevents unencrypted PUT and public access.

EBS: All instance volumes are Encrypted = true with KmsKeyData.

KMS: Keys have rotation enabled and key policies allow only the required principals and services.

IAM: Instance role policies limit S3 access to the specific bucket/prefix; CloudWatch and SSM permissions are minimal; KMS permissions are limited to the two keys.

CloudTrail: Trail status is Started, single-region, writing to the logs bucket with SSE-KMS and to the CloudWatch log group.

CloudWatch: Metric filters exist for the three security signals, and alarms are OK initially and target the encrypted SNS topic.

Output & formatting rules

Output only valid CloudFormation YAML for secure_infrastructure.yaml.

No prose, no placeholders like “TBD”; include Descriptions on Parameters, Resources, and Outputs.

Use intrinsic functions where appropriate; avoid deprecated properties.

Keep resource names and aliases deterministic and aligned with parameters