Generate secure CloudFormation (JSON)

System / Role: You are an expert AWS CloudFormation template generator specializing in security and compliance. Produce valid JSON CloudFormation only, no extra text, no explanation.

Task: Generate a CloudFormation JSON template that implements a secure infrastructure in REGION and satisfies all constraints listed below. The template must be syntactically valid for AWS CloudFormation and follow AWS best practices where applicable.

Constraints (every clause must be satisfied):

Deploy all resources in REGION.

Use AWS KMS for encryption at rest for all services that store data (S3, RDS, EBS, EFS if present, Lambda environment variables if used). If KMS_KEY_ALIAS is create, create a CMK with automatic rotation enabled; otherwise reference the provided alias.

IAM roles and policies must follow least-privilege: provide narrowly-scoped managed or inline policies, use Condition where appropriate, and never attach overly-broad wildcards like "Resource": "*" unless absolutely required (and justify in Metadata only).

Ensure S3 buckets enforce encryption with SSE-KMS (preferred) or SSE-S3, block public access, and set a bucket policy to deny PUT/GET unless request is encrypted.

Enable CloudTrail across the account region for all supported services and deliver logs to a dedicated, encrypted S3 logging bucket with proper lifecycle (90 days cold, 365 days archive — adapt if necessary).

Only allow EC2 LaunchTemplates/LaunchConfigurations/Instances to use images listed in APPROVED_AMI_IDS (validate via AllowedValues for parameters or use a Condition and intrinsic functions to fail template creation if not matched).

Security groups: allow inbound 80 and 443 only from TRUSTED_IP_RANGES and only allow other inbound traffic where strictly necessary. Egress may be limited where possible.

Create a VPC with at least three AZs (3 public/private subnets), attach VPC Flow Logs to a CloudWatch Log Group or S3 (enable capture of all traffic).

Enable AWS Config Recorder, Delivery Channel, and a Config Rule set to track resource changes; store configuration snapshots in encrypted S3.

Implement AWS WAF (regional) with the specified WAF_RULESET attached to the Application Load Balancer.

Include a CloudFormation resource to subscribe to AWS Shield Advanced for the account (or document, in Metadata, the manual activation step if account-level activation is required and cannot be executed via CloudFormation in that region).

Ensure all EC2 user-data passed to instances is stored encrypted in SSM Parameter Store (SecureString) and referenced securely by the instances (or use cfn-init with encrypted parameters); do not place plaintext secrets in the template.

Create CloudWatch Alarms for UnauthorizedAPICalls (CloudTrail metric filter) and for sudden CPU/network spikes for critical resources and output alarm ARNs.

RDS instances must be created with PubliclyAccessible: false, stored in private subnets, with DeletionProtection: true, and automated daily snapshots (via BackupRetentionPeriod and optionally AWS Backup resource for scheduled snapshots).

Lambda functions must have execution roles that only have permissions required for their operation (no * actions) and environment variables flagged as NoEcho in Parameters if provided.

Public S3 buckets (if any) must have access logging enabled to the logging bucket, and a Block Public Access configuration that denies public policies/ACLs.

Template must include Outputs for key resource identifiers (VPC ID, ALB DNS, KMS Key ARN, CloudTrail S3 bucket, RDS endpoint, list of created roles/ARNs).

Output format rules:

Return only valid CloudFormation JSON (RFC-compliant). Do not add explanatory text.

Use Parameters for inputs: Region, ApprovedAmiId (or list), TrustedIpRanges, KmsKeyAlias, RdsSnapshotRetentionDays, and InstanceType where applicable.

Include Metadata blocks to provide short human-readable justification wherever the template makes a security decision.

Add Conditions to validate required inputs.

Include AWS::CloudFormation::Interface to order parameters when helpful.

Every resource that stores data must reference the KMS CMK or default to SSE-S3 where service does not support KMS.

Verification: Append (as a separate JSON string under the top-level property "TemplateVerification") a shell script snippet (POSIX bash) that:

Runs aws cloudformation validate-template --template-body file://template.json.

Runs cfn-lint checks for common best practices.

Checks that CloudTrail is enabled: aws cloudtrail describe-trails and verifies the S3 bucket.

Verifies S3 buckets have ServerSideEncryptionConfiguration set to KMS or AES256.

Queries created security groups to ensure only 80/443 are open to TRUSTED_IP_RANGES.

Verifies RDS instances are PubliclyAccessible=false.

Verifies Config recorder is recording and that Config delivery channel exists.

Outputs non-zero exit code if any check fails.

Final instruction: Produce the CloudFormation JSON template with the TemplateVerification section appended at the end of the JSON document.