Role

You are a senior Terraform + AWS security engineer. Write production-ready, Terraform 0.14+ configurations with clear, minimal code and strong security defaults.

Task

Create a multi-account, multi-env AWS setup (dev, test, prod) using Terraform. Each env lives in its own AWS account and must be isolated. Output only two files provider.tf and tap_stack.tf. Code must satisfy all requirements below and pass terraform validate and terraform plan in a demo AWS account.

Environments

Envs: dev, test, prod

Region: us-east-1 for all envs

Each env deployed to a distinct AWS account via AssumeRole or dedicated credentials

Naming convention for all resources: <env>-<service>-<resource> (e.g., dev-net-vpc, prod-sec-kms)

Inputs (use as variables with sane defaults and comments)

var.account_ids = { dev = "111111111111", test = "222222222222", prod = "333333333333" }

var.owner (string), var.purpose (string)

var.ip_allowlist = ["203.0.113.0/24"] (restrict SSH/RDP/HTTP ingress as required)

var.s3_block_public_access = true

var.tags_common = { Environment = "<env>", Owner = var.owner, Purpose = var.purpose }

Hard Requirements (must implement)

Provider: Use only the official AWS provider; pin a conservative version.

Terraform version: required_version = ">= 0.14"

Encryption:

Create AWS KMS CMKs (per env) and use them for:

S3 buckets (server-side encryption)

RDS at rest (storage encryption + KMS key)

Any other data-at-rest storage you define

RDS:

All RDS instances encrypted at rest with the env KMS key

Minimal example engine (e.g., Postgres/MySQL), no public access, subnet groups, SGs restricted

CloudFront (HTTPS-only):

CloudFront distribution that forces HTTPS only

Use an AWS-managed certificate (ACM in us-east-1)

Minimal S3 origin (private bucket) with Origin Access Control (OAC) or Origin Access Identity (OAI)

IAM (least privilege):

Define example IAM roles/policies for workload access following least privilege

Use AssumeRole per env to target each account

Security Groups:

Ingress rules only from var.ip_allowlist for SSH(22), RDP(3389), or web (80/443) as applicable

No wide‐open 0.0.0.0/0 ingress except CloudFront viewer (handled by CloudFront itself)

S3:

All buckets private by default

Block Public Access enabled (account-per-env and bucket-level)

Access controlled via bucket policies (principals limited to CloudFront origin or specific roles)

Logging:

Enable and configure service logging wherever supported:

CloudTrail (all management events)

S3 server access logs / CloudTrail to S3

CloudFront access logs (to a dedicated logging bucket)

RDS enhanced monitoring disabled by default but Aurora/RDS logs to CloudWatch if applicable

CloudWatch Alarms:

Use CloudTrail + CloudWatch to detect and alarm on failed attempts to modify IAM policies

Create metric filters + alarms + SNS topic + subscription (HTTPS) for notifications

Tagging:

Every resource must include tags: Environment, Owner, Purpose (plus any AWS-required tags)

Foldering & Files:

Structure:

/terraform/
  
    provider.tf
    tap_stack.tf
  

Prefer no extra files beyond the two required per env unless a tiny local module meaningfully reduces duplication.

State & Backends:

Show an example remote S3 backend + DynamoDB locking per env (name with <env>-tf-state), but you may comment it if execution environment handles state.

Outputs:

Minimal outputs (e.g., CloudFront domain name, RDS endpoint, logging bucket names)

Implementation Notes

Use aws providers with alias and AssumeRole for each env/account.

Enforce HTTPS viewer protocol policy in CloudFront.

Use OAC for CloudFront → S3 (preferred) or OAI if you must.

For IAM failed-change alarms: Create a CloudWatch Logs metric filter on CloudTrail log group matching UnauthorizedOperation or AccessDenied events affecting IAM policy modifications; then a CloudWatch Alarm to an SNS topic with an HTTPS subscription.

For SGs: parameterize allowed CIDRs via var.ip_allowlist.

Keep defaults cost-safe (t3.micro/t4g.micro where applicable) and no public RDS.

No hardcoded secrets. No plaintext keys.

Constraints (must all be satisfied)

Terraform 0.14+ syntax only

All resources tagged with Environment, Owner, Purpose

KMS for data encryption

RDS encrypted at rest

CloudFront for secure HTTPS-only content delivery

IAM roles with minimum necessary permissions

Security Groups limited to specific IP ranges

S3 private + bucket policies

Logging enabled wherever supported

CloudWatch Alarms for failed IAM policy modification attempts

Different AWS accounts per env

Deliverables (exactly this)

For each of dev, test, prod, complte output  will be only two files with runnable code:

provider.tf and tap_stack.tf

terraform block with required_version & provider constraints

aws provider(s), region us-east-1

AssumeRole setup per env (role ARN derived from var.account_ids)

(Optionally commented) S3 backend + DynamoDB lock per env

Common variables + locals for tags and naming

tap_stack.tf

KMS CMK and aliases

S3 buckets: app/content, logs, state (if showing backend) with Block Public Access

CloudFront distribution (HTTPS-only) + OAC/OAI + origin policies

RDS subnet group, parameter group (if needed), encrypted RDS instance with SGs

IAM roles + least-privilege policies (attach only what’s used)

Security groups with var.ip_allowlist

CloudTrail (all management events), log group, and S3 destination

CloudWatch Logs metric filter + Alarm + SNS topic + HTTPS subscription for failed IAM policy change attempts

Resource tags applied everywhere via merge(local.common_tags, {...})

Minimal outputs (CloudFront domain, RDS endpoint, logging bucket)

Style & Quality

Prefer small, composable resources, descriptive names, and comments explaining key security choices.

Use locals for naming convention and tag maps.

Keep it idempotent and lint-friendly. Avoid deprecated fields and 0.0.0.0/0 ingress.

No placeholders for required values; where a placeholder is unavoidable, add a clear # TODO: comment.

Validation

At the end, provide:

Exact commands to run for each env:

cd terraform init && terraform fmt -check && terraform validate && terraform plan


Note any variables that must be set (TF_VAR_owner, TF_VAR_purpose, TF_VAR_ip_allowlist, TF_VAR_account_ids) and show example terraform.tfvars content for one env.

Output Format

Return only the three env folders with two files each in properly labeled code blocks:

/provider.tf

/tap_stack.tf