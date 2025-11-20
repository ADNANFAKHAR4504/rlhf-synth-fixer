Hey team,

We need a single Terraform file (`main.tf`, Terraform 1.5+ compatible) that stands on its own as a **production-ready, security-first data analytics stack** for a financial services company in `us-east-1`.

Think of this as something we would actually check into our main branch: clean, well-commented, and aligned with PCI-DSS expectations. The environment lives in a dedicated **security VPC** that connects to spoke VPCs through a Transit Gateway and is run with strict controls: no direct internet access, centralized logging, immutable audit trails, and automated security responses.

Below is what we want this file to do.

## High-level goal

Build a **single-file** Terraform configuration (`main.tf`) that:
- Creates the security VPC and all supporting resources in `us-east-1`
- Implements defense-in-depth across network, identity, data, monitoring, and response
- Clearly maps key controls to relevant PCI-DSS requirements via comments
- Can be applied without any extra supporting Terraform files

## What needs to be in `main.tf`

### 1. Security VPC and networking
- VPC named `security-vpc` in `us-east-1` with private subnets across three AZs (for example, `us-east-1a`, `us-east-1b`, `us-east-1c`).
- No Internet Gateway attached to this VPC.
- Route tables and subnet associations so that egress goes through a Transit Gateway (use a variable like `var.transit_gateway_id` or an appropriate data source).

### 2. VPC Flow Logs
- Enable VPC Flow Logs for the security VPC.
- Deliver logs to an S3 bucket in a separate security account (use something like `var.flow_logs_account_id` together with `data.aws_caller_identity`).
- The flow logs bucket should have:
	- Object Lock enabled
	- Versioning and server-side encryption
	- A lifecycle that expires data after 90 days
	- Logging turned on
	- A bucket policy that allows the VPC Flow Logs service principal and the security account to write.

### 3. S3 data lake and logging buckets
- Create a data lake S3 bucket with:
	- Server-side encryption using a customer-managed KMS key (refer to a pre-existing key via a data source such as `data.aws_kms_key.existing_data_key` or a variable)
	- Versioning enabled
	- An MFA Delete note: this can only be enabled via CLI/console, so add a clear comment and a `null_resource` with the CLI call to document how to turn it on.
	- Access logging to a separate logging bucket (e.g., `data_lake_access_logs_bucket`).
	- Public access blocked and bucket policies that limit access to the security account and specific IAM roles.
- Make sure lifecycle rules and retention/replication settings are consistent with long-term compliance.

### 4. IAM roles and permission boundaries
- Define IAM role templates for EC2 instance profiles that rely on session-based credentials (assume-role pattern) rather than long-lived keys.
- Use trust policies that allow SSM and appropriate principals to assume the roles.
- Apply an IAM permission boundary via a variable or data source (for example, `var.iam_permission_boundary_arn`).
- Attach inline policies that explicitly deny very sensitive actions (for example, `iam:DeleteUser`, `kms:ScheduleKeyDeletion`, `s3:DeleteBucket`) where appropriate.

### 5. GuardDuty and automated remediation
- Turn on GuardDuty with S3 protection.
- Create an EventBridge rule that listens for high-severity findings and triggers a Lambda function (for example, `guardduty_remediation_lambda`).
- The Lambda should be able to:
	- Isolate compromised instances by moving them into a quarantine security group
	- Quarantine S3 objects (for example, by tagging them or moving them into a quarantine bucket)
- Give the Lambda an IAM role with only the permissions it really needs.

### 6. AWS Security Hub
- Enable Security Hub and turn on the CIS AWS Foundations Benchmark.
- Add a commented example of how we would plug in a custom security standard or custom checks.

### 7. AWS Config
- Add a configuration recorder and delivery channel that sends configuration snapshots to an S3 bucket (either the CloudTrail bucket or a dedicated config bucket).
- Create at least these Config rules:
	- `required-tags` that enforces `DataClassification`, `ComplianceScope`, and `Environment`
	- `s3-bucket-public-read-prohibited`
	- `ec2-imdsv2-check` to require IMDSv2
- In comments, call out how these findings roll into Security Hub.

### 8. Security groups and NACLs
- Model security groups in a clean logical section using `locals` and dynamic blocks so the rules are easy to maintain.
- Security groups should have explicit ingress/egress with descriptive `description` values.
- Use NACLs where you need explicit denies (for example, block SSH and RDP at the network edge). Include a short note that NACLs can deny, while security groups are stateful allow lists.

### 9. CloudTrail
- Create a multi-region CloudTrail that:
	- Captures management events
	- Uses event selectors for S3 object-level (data) events and Lambda invocations
- Store logs in an S3 bucket in the security account with:
	- Object Lock enabled
	- Versioning
	- Log file validation turned on
	- A restrictive bucket policy and lifecycle rules that match compliance needs

### 10. SSM Session Manager as the only access path
- Configure AWS Systems Manager so Session Manager is the only interactive access path for EC2.
- Make sure SSH (22) and RDP (3389) are blocked in both security groups and NACLs.
- Add comments or simple examples showing how we would verify that no key-based SSH/RDP is open.

### 11. KMS and key rotation
- Use data sources to look up any pre-existing KMS keys (unless we explicitly need to create a new one).
- If we create keys, keep policies tight and restrict usage to the right roles and principals.
- Document and implement a 90-day rotation story:
	- Native `rotation_enabled` only supports annual rotation, so set up an EventBridge rule plus a Lambda that rotates keys every 90 days, or
	- Clearly explain in comments how this is handled if we lean on the built-in rotation plus additional operational controls.
- Make sure key policies are explicit and follow least privilege.

### 12. Tagging
- Use the provider `default_tags` block to enforce required tags.
- At minimum, make sure `DataClassification`, `ComplianceScope`, and `Environment` are always present and align with the Config rule mentioned earlier.

### 13. Deletion protection
- For any resource that supports deletion protection (for example, database services), explicitly turn it off in the configuration and add a short comment explaining why.

### 14. Outputs
- Expose outputs for the key pieces we’ll need downstream, such as:
	- `vpc_id`
	- `private_subnet_ids`
	- `data_lake_bucket_arn`
	- `cloudtrail_bucket_arn`
	- `guardduty_detector_id`
	- `security_hub_arn`
	- Relevant KMS key ARNs (or data-source backed references)

## Constraints to respect

- Region: `us-east-1` only.
- Terraform version: `>= 1.5.0`.
- AWS provider: `~> 5.0`.
- Use data sources wherever we’re wiring to pre-existing objects, including:
	- Transit Gateway ID
	- Pre-existing KMS key ARNs (if provided)
	- Permission boundary policy ARNs
	- Security account ID
- All S3 buckets must:
	- Have versioning enabled
	- Block public access
	- Emit access logs
- The security VPC must not have an Internet Gateway.
- Transit Gateway should be the path for all outbound traffic from private subnets.
- IAM roles must attach the permission boundary where required.
- GuardDuty findings with severity at or above HIGH should trigger the remediation Lambda.
- Config rules should be wired so their findings surface in Security Hub.
- No resource should have deletion protection turned on.
- Naming and tagging should be consistent and include PCI-DSS-related comments where it helps future reviewers.

## Shape of the Terraform file

In `main.tf`, pull all of this together as a single, self-contained configuration with:
- A `terraform` block that sets `required_version` and the AWS provider requirement
- A single `aws` provider (region `us-east-1`) plus a `default_tags` block
- `variable` blocks for all key inputs, including:
	- Transit Gateway ID
	- Pre-existing KMS key ARN(s)
	- IAM permission boundary ARN
	- Security account ID
	- Log retention days
	- Environment and data classification metadata
- `locals` for repeated values, naming patterns, and security group rule definitions
- `data` blocks for existing resources (caller identity, region, KMS keys, IAM policies, etc.)
- Resource blocks for everything mentioned above:
	- VPC, subnets, route tables, TGW attachments
	- Flow logs, S3 buckets, IAM roles and policies
	- GuardDuty, Security Hub, AWS Config, CloudTrail
	- EventBridge rules, Lambda functions, SSM configuration, KMS constructs
- Dynamic blocks for security group rules that iterate over local maps/lists
- Helpful comments before major sections that:
	- Explain the purpose of the control
	- Call out the relevant PCI-DSS requirement(s) where it makes sense
- `output` blocks for the ARNs and IDs called out earlier

If Terraform cannot natively perform an action (for example, enabling S3 MFA Delete), document the exact CLI call in a `null_resource` with `local-exec`, and call out in comments that this requires MFA and cannot be fully automated in a standard Terraform run.

The end result should be a **single** `main.tf` that someone on the team can read top-to-bottom and immediately understand the security posture, the PCI-DSS mapping, and how to apply it in `us-east-1` without needing any extra Terraform files.
