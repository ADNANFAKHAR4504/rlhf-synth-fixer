ROLE
You are a senior Terraform engineer. Produce production-ready, valid HCL that passes `terraform validate` and plans cleanly.

OBJECTIVE
Set up a scalable, secure AWS environment in us-east-1 using Terraform. Use a variable for EC2 instance type, least-privilege IAM roles, AWS Secrets Manager for all sensitive data, and a VPC with one public and one private subnet. Apply the tag `Environment = "Production"` to all resources. Output exactly two files: `provider.tf` and `tap_stack.tf`.

REQUIREMENTS

1. Region and syntax

   * Use Terraform 0.14+ syntax.
   * All resources deploy to us-east-1.
   * Do not hardcode us-east-1; read from `var.aws_region` with default `us-east-1`.

2. Tagging

   * Apply `Environment = "Production"` to every resource (use provider `default_tags`).
   * Also support `Owner` and `Purpose` tags via variables.

3. Variables

   * Declare `variable "aws_region"` with default `us-east-1`.
   * Declare `variable "instance_type"` (used by EC2), default a safe type (e.g., t3.micro).
   * Declare `variable "owner"`, `variable "purpose"` with secure non-empty defaults.

4. Networking

   * Create one VPC.
   * Create at least one public subnet and one private subnet (prefer distinct AZs discovered via data source).
   * Create an Internet Gateway.
   * Public route table must route 0.0.0.0/0 to the IGW and be associated to public subnet(s).
   * Private subnet(s) have no direct ingress from the internet.
   * Security groups follow least privilege:
     • Public SG: allow inbound 80 and 443 only from a variable `approved_cidrs` list; deny everything else; egress allowed.
     • Private SG: no public inbound; allow only necessary intra-VPC traffic (e.g., from public SG).

5. IAM least privilege

   * Create an IAM role and instance profile for EC2 with the minimum permissions required to read a specific Secrets Manager secret ARN only (no wildcards; scope to that secret).
   * Use `aws_iam_policy_document` and `jsonencode` to build policies.
   * Trust policy limited to `ec2.amazonaws.com`.

6. Secrets Manager

   * Create a Secrets Manager secret (name via variable) and a placeholder secret version (do NOT store real secrets in code; value comes from variable).
   * Enforce access only over TLS using policy conditions where applicable.
   * EC2 role policy must allow `secretsmanager:GetSecretValue` on that single secret ARN only.

7. Compute

   * Launch a small EC2 instance in the private subnet (no public IP) using `var.instance_type`.
   * Attach the instance profile created above.
   * Use appropriate security group (private SG).

8. Outputs

   * Output VPC ID, subnet IDs, instance ID, instance profile/role ARN, and secret ARN for verification.

CONSTRAINTS (HARD)

* Only two files: `provider.tf` and `tap_stack.tf`.
* AWS provider only; no external modules.
* No plaintext secrets in code; use variables and Secrets Manager.
* Use data sources for AZ discovery; avoid hardcoded AZ names.
* Names must be deterministic and unique (e.g., include a short suffix from account\_id and environment if needed).

FILES TO PRODUCE (STRICT)

1. provider.tf

   * `terraform` block with `required_version >= 0.14` and AWS in `required_providers` (>= 3.0).
   * Variables: `aws_region` (default us-east-1), `environment` (default "prod"), `owner`, `purpose`.
   * `provider "aws"` using `region = var.aws_region`.
   * `default_tags` applying `Environment = "Production"`, plus `Owner` and `Purpose`.

2. tap_stack.tf

   * Variables: `instance_type`, `approved_cidrs` (list(string)), `secret_name`, `secret_value` (sensitive = true).
   * Data: `aws_caller_identity`, `aws_availability_zones` (state = "available").
   * Locals: name prefix, common tags.
   * VPC, subnets (public/private), IGW, route tables + associations.
   * Security groups as specified (public web 80/443 from `approved_cidrs`; private minimal).
   * Secrets Manager secret and secret version (value from `var.secret_value`).
   * IAM role, policy (least privilege to that secret only), and instance profile.
   * EC2 instance in private subnet with the instance profile attached.
   * Outputs for VPC ID, subnet IDs, instance ID, role/profile ARN, and secret ARN.

QUALITY & STYLE

* Clear, concise comments on security decisions.
* Least privilege everywhere; no wildcard Actions/Resources.
* Deterministic naming; avoid random pets.
* `terraform validate` must pass with no edits.

VALIDATION CHECKLIST (SELF-VERIFY)

* Region uses `var.aws_region` and defaults to us-east-1.
* All resources carry `Environment = "Production"` and Owner/Purpose.
* VPC with one public and one private subnet; IGW + public route 0.0.0.0/0.
* SGs least-privilege (public: 80/443 from approved CIDRs; private: restricted).
* Secrets stored in Secrets Manager; no plaintext secrets in code.
* EC2 instance type comes from `var.instance_type`.
* IAM role grants `secretsmanager:GetSecretValue` only to the specific secret.
* Outputs expose required IDs/ARNs.

DELIVER NOW
Output exactly TWO fenced HCL code blocks labeled with filenames:

1. provider.tf
2. tap_stack.tf
   No prose or explanations—just the two files.