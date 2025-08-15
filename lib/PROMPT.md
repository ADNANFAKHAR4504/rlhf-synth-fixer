# Prompt: Secure AWS Infrastructure – Single Terraform File

You are an expert Terraform engineer. Generate **a single, production-ready Terraform file** that provisions a brand-new, secure AWS environment from scratch — no references to pre-existing resources.

---

## Output Format & Files

- Create exactly **one HCL file** at:  
  `lib/tap_stack.tf`
- This **single file must contain**:
  1. **All `variable` blocks** (with sensible defaults and type constraints)  
  2. **Local values**  
  3. **All `resource` definitions** (create everything new; do not import or point to existing resources)  
  4. **Any `data` sources only when strictly necessary** (e.g., caller identity)  
  5. **`output` blocks** for key artifacts (IDs/ARNs/names)  
  6. **Inline documentation** (concise comments explaining non-obvious choices)
- I **already have `provider.tf`** with the AWS provider configured. **Do not** include any provider configuration in `lib/tap_stack.tf`.

---

## Region Handling

- `provider.tf` consumes a variable named **`aws_region`**.  
- In `lib/tap_stack.tf`, **declare**:

```hcl
variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
}
Use var.aws_region consistently for region-specific resources and ARNs.

Naming, Tagging & Environments
Support two environments via a variable "environment" with validation allowing only "prod" or "dev".

All names must be prefixed with:

prod- when var.environment == "prod"

dev- when var.environment == "dev"

Implement a locals map for mandatory tags and apply to every resource that supports tags:

environment = var.environment

project = var.project

owner = var.owner

What to Build (Greenfield Only)
Create new resources to satisfy the following security & compliance requirements. Favor least privilege, encryption, and logging by default.

1. IAM (Least Privilege)
Minimal IAM roles and policies for:

Applications/EC2

API Gateway execution (if needed)

CloudTrail delivery to S3

VPC Flow Logs to CloudWatch

AWS Config recorder/delivery

GuardDuty (as needed)

Do not grant iam:PassRole unless explicitly required; if required, scope to the exact role ARN and specific services.

Create an IAM password policy enforcing:

Min length ≥ 14

Uppercase, lowercase, numbers, symbols

Prevent password reuse

Rotation (e.g., 90 days)

2. Networking & VPC
Create a new VPC with public and private subnets across two AZs in var.aws_region.

VPC Flow Logs enabled to CloudWatch Logs via IAM role/policy with least privilege.

Security Groups:

Restrict ingress to necessary ports (e.g., SSH from allowed CIDR, HTTPS if required)

Restrict egress to necessary destinations (default allow all if strictly needed)

3. Compute (Baseline)
Define an EC2 instance profile (role + instance profile) with minimal permissions.

Optional EC2 instance via deploy_ec2 variable (default: false).

If launched, place in private subnet with application SG.

4. Storage (S3)
Create at least two S3 buckets:

*-logs bucket for CloudTrail/Config/Access logs

*-data bucket for app data

All S3 buckets:

SSE-S3 encryption

Block public access

Versioning enabled

Bucket policies requiring TLS

Lifecycle policies:

Logs retention

Data retention

5. RDS
Private RDS instance:

Encrypted (KMS)

Backups enabled

Not publicly accessible

SG allows inbound only from app SG.

6. API Gateway + Logging
Minimal API Gateway (HTTP or REST)

Stage logging to CloudWatch enabled.

7. CloudTrail
Enabled for var.aws_region or multi-region

Logs to encrypted logs bucket

Log file validation enabled.

8. AWS Config
Enable recorder + delivery channel to logs bucket.

Add core managed Config rules:

s3-bucket-server-side-encryption-enabled

cloudtrail-enabled

encrypted-volumes

restricted-ssh

vpc-flow-logs-enabled

9. GuardDuty
Enable GuardDuty detector.

10. KMS (Key Management)
Use AWS-managed keys unless use_cmk is true.

If CMK is used:

Restrict key policy

Create alias

Variables to Include (At Minimum)
hcl
Copy
Edit
variable "aws_region" { description = "AWS region"; type = string }
variable "environment" { description = "Environment"; type = string; default = "dev" }
variable "project" { description = "Project name"; type = string; default = "tap" }
variable "owner" { description = "Owner"; type = string; default = "platform-team" }
variable "allowed_ssh_cidrs" { type = list(string); default = [] }
variable "api_access_log_retention_days" { type = number; default = 30 }
variable "vpc_flow_log_retention_days" { type = number; default = 90 }
variable "rds_engine" { type = string; default = "postgres" }
variable "rds_instance_class" { type = string; default = "db.t3.micro" }
variable "rds_allocated_storage" { type = number; default = 20 }
variable "rds_backup_retention_days" { type = number; default = 7 }
variable "rds_deletion_protection" { type = bool; default = true }
variable "deploy_ec2" { type = bool; default = false }
variable "use_cmk" { type = bool; default = false }
variable "s3_data_retention_days" { type = number; default = 365 }
variable "s3_logs_retention_days" { type = number; default = 1825 }
Constraints & Best Practices
Least privilege IAM policies

No iam:PassRole unless required

All S3 buckets: SSE-S3, versioning, public access block

All EC2: private, restricted SGs

RDS: encrypted, private, backups

VPC Flow Logs: CloudWatch, dedicated log group

AWS Config: recorder, delivery, rules

CloudTrail: encrypted logs, validation

GuardDuty: enabled

IAM Password Policy: complexity, rotation

Tagging: apply local.common_tags

Naming: prefix with env (prod-, dev-)

Deliverable Quality Gates
Passes terraform fmt -check & terraform validate

No provider blocks in lib/tap_stack.tf

Creates all resources (no imports)

Idempotent on reapply

Outputs:

VPC ID

Subnet IDs

SG IDs

RDS endpoint

S3 bucket names/ARNs

CloudTrail details

Config recorder

GuardDuty ID

API Gateway ID/stage

Implementation Notes
Use locals for name prefixes and tags

Use bucket policies to enforce TLS

Prefer AWS-managed KMS unless use_cmk is true