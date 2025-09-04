You are a senior cloud platform engineer. Generate working Terraform (HCL) for AWS that fully implements the secure infrastructure described below.
Important file rule: Produce exactly two Terraform files and nothing else for the IaC:

provider.tf providers, required versions, backend (local by default), and provider configuration.

main.tf all variables/locals/resources/data/outputs live here (no additional .tf files, no external Terraform modules).
Inline comments must explain key blocks and security decisions.

Where details are missing, choose secure, cost‑aware, standards‑aligned defaults and list them in an Assumptions preface comment at the top of main.tf.

Tool & Language

Terraform (HCL) only.

Providers: hashicorp/aws (pin to a stable, recent version), us‑west‑2 region hard‑set.

Code must pass terraform fmt and terraform validate.

Project Metadata

projectName: IaC - AWS Nova Model Breaking

Environment: single account/region build in us-west-2 (must be enforced in code).

Hard Constraints (must be satisfied by resources and defaults)

Region & Network

All resources in us-west-2.

Custom VPC with at least two AZs (e.g., us-west-2a, us-west-2b).

Public subnets (for ALB + bastion) and private subnets (for app + DB).

NAT gateways for private egress; route tables per subnet tier.

Security

Least‑privilege IAM roles/policies for compute, logging, backups, Config, and CloudTrail; no hard‑coded credentials.

KMS (CMK) for encrypting sensitive data (use where supported).

Server‑side encryption enabled on all data stores (S3, EBS, RDS, CloudTrail/Config buckets, ALB logs, etc.).

Security groups: inbound only port 443 to the web tier; bastion restricted to SSH from a small, variable‑driven CIDR allowlist; no broad 0.0.0.0/0 except for ALB:443 if required.

WAFv2 Web ACL attached to the public ALB with managed rule groups for common exploits; allowlist/denylist variables.

Block public access for all storage (S3) unless explicitly allowed via a variable (default: disabled).

Availability & Patching

Deploy across at least two AZs for HA.

All compute AMIs must be the latest patched images (use SSM Parameter Store lookups for Amazon Linux 2023).

Databases have automatic backups and multi‑AZ where applicable.

Audit & Compliance

AWS Config recorders + delivery channel (to encrypted S3) monitoring all supported resources.

AWS CloudTrail org‑agnostic, all‑management + data events for S3 and Lambda; logs delivered to encrypted, versioned S3 with access logging and retention; CloudWatch Logs integration enabled.

Access Pattern

Bastion host in a public subnet (small, patched AMI) to reach private resources; uses IAM role, SSM Agent enabled for Session Manager (preferred), restricted inbound SSH (from allowlist CIDR variable).

Application/DB instances use instance profiles/IAM roles only.

Required Components to Implement
Networking

VPC (CIDR default 10.0.0.0/16), 2+ AZs, public + private subnets, IGW, NAT GW(s), route tables, NACLs (sane defaults).

VPC endpoints (Gateway for S3; Interface endpoints for SSM/EC2 Messages/SSM Messages/Secrets Manager/KMS) to reduce public egress from private subnets.

Ingress, Load Balancing & WAF

ALB (HTTPHTTPS redirect) fronting web/app tier in private subnets via Target Groups; ACM cert for TLS.

WAFv2 Web ACL (managed rules: AWSManagedRulesCommonRuleSet, KnownBadInputs, SQLi, etc.) associated to the ALB.

Compute

Example Auto Scaling Group or Launch Template (Graviton preferred if compatible) for web/app, using latest AMI via SSM.

Example RDS (e.g., PostgreSQL) in private subnets:

Multi‑AZ, storage encryption (KMS), automated backups + retention, copy tags to snapshots.

Parameter group (secure defaults); SG allows inbound only from app tier SG on the DB port.

Storage & Encryption

Central S3 log bucket (unique name via random suffix): versioning, SSE‑KMS, public access block, lifecycle (e.g., transition to IA/Glacier).

Any other S3 buckets (artifacts, backups) also SSE enabled and public‑blocked by default.

EBS encryption by default via account setting or per‑volume with KMS key.

IAM (Least Privilege)

Roles & policies for:

EC2 app/web (read from Secrets Manager/SSM Parameter Store; least privilege).

Bastion (SSM Session Manager, minimal).

RDS enhanced monitoring (if used).

CloudTrail + Config delivery to S3, KMS permissions.

Deny policies or SCP‑like patterns are out of scopefocus on role policies.

Observability, Audit & Compliance

CloudTrail (multi‑region), S3 + CloudWatch Logs, log file validation.

AWS Config: all resources, conformance packs optional; at least recorders + delivery channel + configuration aggregator (single account).

CloudWatch: metric alarms (ALB 5xx, ASG CPU, RDS storage/CPU/freeable memory, status checks).

Bastion Access

Small instance in public subnet, EIP optional.

Inbound SSH restricted to var.bastion_allowed_cidrs (default empty).

SSM Agent enabled and documented as preferred entry.

Strict File Output Format

provider.tf

terraform block (required_version; AWS provider version constraints).

provider "aws" pinned to us-west-2.

(Optional) S3 backend commented template with notes; default to local for portability.

main.tf

Top comment block Assumptions (explicit defaults).

variable and locals for CIDRs, AZs, instance sizes, retention days, allowed CIDRs, tags, names.

data sources: SSM AMI lookups, caller identity, partition, region.

All resources defined here (VPC, subnets, IGW/NAT/RTs, SGs, ALB+TG+Listeners+ACM, WAFv2, EC2 LT/ASG, RDS, S3 buckets, KMS keys/aliases, VPC endpoints, IAM roles/policies/instance profiles, CloudTrail, Config, CW Alarms).

Outputs section (see below).

Security Defaults to Enforce in Code

No public RDS; RDS SG only allows from app SG on DB port.

ALB is public; app instances are private.

HTTPS‑only (redirect HTTPHTTPS at ALB).

S3: block_public_acls, block_public_policy, ignore_public_acls, restrict_public_buckets all true on every bucket unless var.allow_public_storage is explicitly set.

KMS: one customer‑managed key for general data, separate key (optional) for logs; key policies restrict principals; rotation enabled.

IAM: policies are resource‑scoped; avoid * where possible; use condition keys.

Outputs & Resource Inventory (required)

In main.tf outputs:

VPC ID, subnet IDs (public/private), route table IDs.

ALB DNS name, listener ARNs, WAF WebACL ARN.

ACM certificate ARN.

Security Group IDs (web/alb/app/db/bastion).

RDS endpoint, identifier, backup window, backup retention.

CloudTrail trail name, S3 log bucket name/ARN, CloudWatch log group name.

AWS Config recorder/delivery channel names, Config bucket name.

KMS key ARNs/aliases used.

Bastion instance ID, SSM target name (if applicable).

Add a Markdown‑styled comment block at the end of main.tf titled Resource Inventory & Console Links with:

Names/IDs/ARNs and quick console URLs (region‑aware) for VPC, ALB, WAF, RDS, S3 log bucket, CloudTrail, AWS Config, KMS keys.

Testing & Policy Verification (must be provided)

Include a brief README comment at the bottom of main.tf describing how to run tests.

Terratest (Go) provide a single file example snippet (e.g., test/terraform.int.test.ts and test/terraform.unit.test.ts. go inline in a fenced code block) that:

terraform init/plan/apply on a temp workspace,

asserts VPC created with 2+ AZ subnets,

asserts SG rules restrict inbound to 443 (and SSH only on bastion from allowlist),

asserts S3 log bucket has versioning + SSE‑KMS,

asserts CloudTrail/Config resources exist.

Conftest/OPA provide example policy snippets (inline fenced code blocks) that reject:

any resource with S3 public access,

any SG ingress that is not 443 for web tier,

any resource without tags or encryption.

Keep the Terratest and OPA snippets as examples; the IaC itself must still be complete and runnable with only provider.tf and main.tf.

Variables (suggested, all defined in main.tf)

vpc_cidr default 10.0.0.0/16

public_subnet_cidrs default ["10.0.1.0/24","10.0.2.0/24"]

private_subnet_cidrs default ["10.0.11.0/24","10.0.12.0/24"]

allowed_https_cidrs default ["0.0.0.0/0"] (can narrow)

bastion_allowed_cidrs default [] (empty only SSM Session Manager)

tags map with Environment, Project, Owner, CostCenter

db_engine/db_version sensible defaults (e.g., postgres 15)

enable_multi_az_db default true

log_retention_days (CloudWatch), s3_lifecycle_days

allow_public_storage default false

Style & Quality

Heavily commented HCL for educational clarity.

Use for_each/dynamic judiciously to keep code readable.

Prefer Graviton instance families when practical; document if not used.

Call out cost levers in comments (NAT count, ALB/WAF, RDS class, retention).

Deliverables to Output

provider.tf content (code block).

main.tf content (single file with variables, locals, data, resources, outputs, and the inventory/README comments).

Example test snippets as separate fenced code blocks in the answer.

Clear apply instructions in a short fenced block:

terraform init
terraform apply -var='allowed_https_cidrs=["x.y.z.w/32"]' -auto-approve


Note any Assumptions and how to override via variables.

Now generate the two Terraform files exactly as specified (provider.tf, main.tf) plus the requested test/policy snippets and short apply instructions, ensuring every requirement above is met.