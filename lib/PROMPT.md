You are an expert Terraform engineer. Generate a brand-new, security-first, multi-region Terraform stack for the project “IaC - AWS Nova Model Breaking.” Deliver exactly two files and nothing else:

provider.tf

lib/tap_stack.tf

No external modules, no additional files.

A) provider.tf — Provider, versions, and backend (no variables here)

Author a complete provider.tf that:

Pins Terraform and AWS provider versions:

A terraform block with required_version (for example, >= 1.6.0) and required_providers:

aws from hashicorp/aws with version >= 5.0

Declares three AWS providers for multi-region operations, plus a default:

Default provider uses var.aws_region (which is declared in lib/tap_stack.tf)

Aliased providers for the two target regions:

provider "aws" { alias = "use1" region = "us-east-1" }

provider "aws" { alias = "usw2" region = "us-west-2" }

Configure remote state backend in S3 with versioning to secure Terraform state:

Add a backend "s3" block inside the terraform block

Use keys like:

bucket (state bucket name)

key (e.g., nova-model-breaking/tfstate/primary.tfstate)

region (choose a control region, e.g., us-east-1)

dynamodb_table (for state locking)

encrypt = true

Note: backend arguments are set via terraform init -backend-config=... at runtime; do not reference variables in the backend config.

Do not declare any variables in provider.tf. The variable aws_region is defined in lib/tap_stack.tf and consumed here by the default provider.

B) lib/tap_stack.tf — Single logic file (everything else goes here)

Author a single Terraform configuration at ./lib/tap_stack.tf that contains:

All variable declarations (including aws_region for the default provider in provider.tf)

Locals

Data sources

Resources

Outputs

Do not put any provider blocks here. Build all resources directly (no external modules). This is a brand-new stack.

Non-negotiables

Exactly one logic file: lib/tap_stack.tf

No external modules

Implement the full solution across us-east-1 and us-west-2 by attaching resources to provider aliases:

provider = aws.use1

provider = aws.usw2

Follow principle of least privilege for IAM

Encrypt at rest using AWS KMS (S3, EBS, RDS, Logs where applicable)

Isolate workloads to private subnets wherever possible

Emit useful outputs for CI/tests (no secrets)

Apply consistent tagging: Environment, Project, Owner, plus ManagedBy = "terraform"

C) Functional scope to implement in lib/tap_stack.tf

Implement the following, for both regions (us-east-1, us-west-2) using the aliased providers:

Variables

aws_region (string) — consumed by provider.tf default provider

environment (string; default "dev")

project (string; default "iac-aws-nova-model-breaking")

owner (string; default "platform-team")

bastion_allowed_cidrs (list(string); default []) — CIDRs allowed to SSH into bastion

asg_min_size (number; default 2)

asg_max_size (number; default 6)

asg_desired_capacity (number; default 2)

cpu_scale_up_threshold (number; default 70) — for autoscaling on CPU utilization

rds_instance_class (string; default "db.t3.micro")

rds_engine (string; default "postgres")

rds_engine_version (string; for example "14")

rds_backup_retention_days (number; default 7)

cloudfront_acm_certificate_arn (string) — ACM cert ARN in us-east-1 for HTTPS on CloudFront

terraform_role_arn (string; optional) — if you wish to restrict Terraform operations via IAM

Any other variables needed to satisfy requirements without hardcoding

All defaults live in this file (no tfvars)

Locals

local.tags = { Environment = var.environment, Project = var.project, Owner = var.owner, ManagedBy = "terraform" }

Region suffix mapping for deterministic names, e.g. { use1 = "use1", usw2 = "usw2" }

A consistent naming helper: format("%s-%s-%s", var.project, var.environment, local.region_suffix)

Networking (per region)

Create a VPC with /16 CIDR (use distinct non-overlapping CIDRs per region)

Create 2 public subnets and 2 private subnets in different AZs

Internet Gateway for public egress

NAT Gateway(s) for private subnets’ egress (at least one per region; per-AZ if you choose)

Route tables: public subnets route to IGW; private subnets route to NAT

VPC Flow Logs to CloudWatch Logs with KMS encryption and log retention

VPC Peering (cross-region)

Establish VPC Peering between the two VPCs (requester in us-east-1, accepter in us-west-2)

Accept the peering connection in the opposite region

Add necessary route table entries in each VPC for inter-VPC traffic

Ensure no overlapping CIDRs

Bastion Host (per region)

One EC2 t3.micro bastion in a public subnet

Latest Amazon Linux 2 AMI via SSM parameter

Security group:

Inbound SSH (22) only from var.bastion_allowed_cidrs (deny 0.0.0.0/0 by default)

Outbound 0.0.0.0/0

Enable SSM in user data to prefer Session Manager

EBS volume encryption (KMS)

Application EC2 Auto Scaling (per region)

Launch Template with:

Amazon Linux 2 AMI (SSM lookup)

Instance profile/role with least privilege (CloudWatch logs, SSM)

EBS encryption by default

Auto Scaling Group in private subnets

Apply a Target Tracking or Step Scaling policy on Average CPU Utilization, scaling when > var.cpu_scale_up_threshold (70%)

Attach to a regional Application Load Balancer (ALB) in public subnets

Elastic Load Balancing with automatic failover

Create ALBs in each region with HTTP/HTTPS listeners and target groups for the ASG

Implement Route 53 failover between the two regional ALBs using health checks:

One primary record in us-east-1 and a secondary in us-west-2

Health check monitors the ALB target/endpoint

Apply least-privilege permissions

RDS (per region)

Deploy RDS in private subnets

Engine, version, and instance class from variables

Storage encryption with KMS

Backup retention >= var.rds_backup_retention_days

Deletion protection on for production (you can key off var.environment)

Security group allowing inbound only from the app instances’ SG (and optionally bastion for maintenance via RDS Proxy or jump host pattern, but never public)

S3 (per region)

Create application buckets with:

KMS encryption (CMK or AWS-managed KMS)

Bucket versioning enabled

Block public access

Optional lifecycle policies for cost control

Create a central or per-region logging bucket (also encrypted) and enable access logging

CloudFront over HTTPS

A CloudFront distribution that serves S3 content or ALB origin over HTTPS

Use var.cloudfront_acm_certificate_arn for TLS

Enforce minimum TLS policy, redirect HTTP → HTTPS

Restrict origins and behaviors appropriately

Optional: attach a WAF regional/web ACL if desired

IAM (least privilege)

Define roles and policies for:

Bastion instance profile (SSM, CloudWatch)

ASG EC2 instances (logs/metrics, SSM)

RDS enhanced monitoring (optional)

S3 access scoped to specific buckets

Restrict Terraform operations by creating an IAM policy example that limits allowed actions to necessary services and ARNs (document in comments how to attach to the role executing Terraform)

CloudWatch Monitoring

Log groups for services (bastion/ASG user data logs, application logs)

Alarms for:

EC2 ASG CPU utilization

ALB 5XX errors

RDS CPU or FreeStorageSpace thresholds

SNS topics per region for alarm notifications (no subscriptions if none provided)

Security Groups

Bastion SG: inbound SSH from var.bastion_allowed_cidrs

App SG: inbound from ALB on HTTP/HTTPS (or only HTTPS if preferred)

RDS SG: inbound only from App SG on DB port

Deny any unnecessary ports and protocols

Secrets

Use AWS Secrets Manager to store RDS credentials

Reference the secret in RDS configuration where applicable

Do not output secret values

CloudTrail

Enable a multi-region CloudTrail for management events

Log file validation on

Send to an encrypted S3 bucket (with access logging and block public access)

D) Data sources and correctness

Fetch latest Amazon Linux 2 AMI via SSM parameter in each region:

data "aws_ssm_parameter" "al2_ami_use1"  { name = "/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2" provider = aws.use1 }
data "aws_ssm_parameter" "al2_ami_usw2"  { name = "/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2" provider = aws.usw2 }


Scope all data sources and resources to the correct provider alias per region.

E) Security and best practices checklist

IAM: least privilege, scoped resources and ARNs

Networking: private subnets for ASG/RDS; bastion only in public; NAT for egress

SSH: never 0.0.0.0/0 unless explicitly allowed; default to deny

Encryption: KMS for S3, EBS, RDS, and logs where supported

CloudFront HTTPS with ACM in us-east-1

CloudTrail enabled and encrypted

No secrets in outputs

F) Outputs (non-sensitive, per region)

Provide minimal, non-sensitive outputs such as:

VPC IDs

Private subnet IDs

Bastion public DNS

ALB DNS names

RDS endpoints (no usernames/passwords)

S3 bucket names for app and logging

CloudTrail trail ARN

Route53 failover record names

G) File deliverables format

Return two code blocks only, in this order:

provider.tf

lib/tap_stack.tf

Both must be complete, valid Terraform HCL, ready for terraform init and terraform apply. They must satisfy:

Multi-region (us-east-1, us-west-2) via provider aliases

VPC peering between the two regions

ASG with CPU-based scaling threshold of 70%

Encrypted S3 and RDS

CloudFront over HTTPS

Bastion host for SSH

CloudWatch logs and alarms

Secure remote state in S3 with versioning

Least-privilege IAM and restrictive security groups

Deterministic naming and consistent tagging

All Terraform logic in lib/tap_stack.tf; no provider blocks in that file; providers and backend live in provider.tf only.