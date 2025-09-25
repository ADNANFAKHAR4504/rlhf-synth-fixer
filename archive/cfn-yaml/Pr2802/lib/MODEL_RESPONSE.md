What this model delivered

A single-file CloudFormation template (TapStack.yml) that creates a secure, multi-tier VPC stack in us-east-1 and deploys with default parameters (no prompts required). The template avoids pre-existing resource references, avoids credentials, and excludes any certificate/ACM configuration per your constraints.

Key design choices

Parameters with safe defaults so ChangeSets work immediately:

AllowedSshCidr defaults to 203.0.113.0/32 (replace with your IP).

Reasonable defaults for VPC and subnets across two AZs.

Bucket names not hardcoded to avoid DNS/lint failures; CFN auto-names them.

Least privilege IAM managed policies; no inline policies.

TLS in transit enforced via S3 bucket policies and private-DNS interface endpoints.

Cost hygiene via a daily EventBridge + Lambda that deletes stale, unattached EBS volumes.

Components created

Networking: VPC, 2× public subnets, 2× private subnets, IGW, 2× NAT, proper routes and associations.

Security groups: Bastion (SSH restricted), Private (SSH from bastion only), VPC endpoint SG (HTTPS within VPC).

KMS: CMK + alias for S3 & CloudTrail.

S3: App bucket (SSE-KMS), Logs bucket (SSE-KMS + versioning + lifecycle).

S3 policies: Deny non-TLS uploads; enforce SSE-KMS and CMK key-id; CloudTrail write permissions.

CloudTrail: Multi-region, log validation, IsLogging=true, KMS-encrypted, S3 delivery.

VPC endpoints: Gateway S3 (policy scoped to the two buckets), Interface SSM/EC2Messages/SSMMessages with private DNS.

Compute: Bastion EC2 (public subnet, SSM agent + SSH hardening), Private ASG via Launch Template across private subnets.

IAM: AppDataAccessPolicy, MfaEnforcementPolicy, LambdaEbsCleanupPolicy; roles & instance profiles; ConsoleUsers group.

Automation: Lambda (Python 3.12) + EventBridge schedule for EBS cleanup (pagination, UTC time handling, optional tag requirement).

Outputs: IDs/ARNs/names for core network, buckets, KMS, CloudTrail, bastion, SGs, instance role/profile, Lambda and schedule rule.

How requirements are satisfied

KMS for S3: App + logs buckets use SSE-KMS with the stack’s CMK; bucket policy enforces the correct key.

IAM roles for EC2 to S3/KMS: Private instance role attaches a managed policy granting S3 object ops and minimal KMS actions.

HTTPS/TLS: Bucket policies enforce aws:SecureTransport=true; VPC interface endpoints use private DNS for TLS-backed APIs.

SSH restriction: Bastion SG allows port 22 only from AllowedSshCidr; private SG only from bastion SG.

CloudTrail: Enabled, multi-region, log file validation, KMS encryption, delivery to logs bucket.

MFA: Managed policy that denies sensitive console/API actions when MFA is not present; applied via a dedicated group.

No credentials: The template contains no keys/secrets.

Auto-delete unattached EBS: Scheduled Lambda deletes available volumes older than retention, with optional AutoDelete=true tag guard.

Network segmentation: App runs in private subnets; bastion in public; NAT for egress.

Region: Designed and validated for us-east-1.

Notes and trade-offs

Auto-naming S3 buckets ensures DNS compliance and smoother first-try deploys.

MFA policy is attached to a group to avoid impacting non-human principals.

NAT per AZ improves resilience but has cost implications; can be reduced to one NAT for dev.
