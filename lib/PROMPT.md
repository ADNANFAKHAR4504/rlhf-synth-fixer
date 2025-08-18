# Terraform AWS Production Stack Prompt

Hey team, I need help creating a production-ready AWS infrastructure in a single Terraform file called **`tap_stack.tf`**.

We already have `provider.tf` set up with AWS provider and backend configuration, so **do not repeat or duplicate backend config in `tap_stack.tf`**. Everything else (variables, resources, outputs) should live inside `tap_stack.tf`.

## What We’re Building

We need a secure VPC stack in AWS with the following components:

* **VPC**: /16 (default `10.0.0.0/16`)
* **Subnets**: 1 public subnet and 2 private subnets in different AZs
* **Networking**: Internet Gateway, NAT Gateway with Elastic IP
* **Bastion Host**: In the public subnet, SSH restricted by a **variable** `bastion_allowed_cidr`
* **App Server**: In a private subnet, reachable only via the bastion
* **S3 Bucket**: Secure bucket with versioning, KMS encryption, and blocked public access
* **KMS Key**: Customer-managed key with rotation enabled
* **IAM Roles**: Minimal permissions, attached only where needed
* **Security Groups**: No dynamic IPs — must rely on variables like `bastion_allowed_cidr`
* **Monitoring**: Detailed monitoring enabled on EC2 instances

## Important Constraints

1. Everything must go in **`tap_stack.tf`** (variables, locals, resources, outputs).
2. **All variables must be declared in this file** — including `aws_region`, `vpc_cidr`, subnets, instance types, and especially `bastion_allowed_cidr`.
3. Do not use external modules or import existing resources — build everything new.
4. Do not add backend configuration — it already exists in `provider.tf`.
5. Use modern Terraform practices: version constraints, least-privilege IAM, tagging.
6. Naming convention: `prod-<resource>-<purpose>` (e.g., `prod-bastion-host`).
7. Tag everything with `Environment=Prod` plus other useful tags.

## Security Must-Haves

* Bastion host restricted by `bastion_allowed_cidr` (must be explicitly declared).
* Private EC2 accessible only from the bastion host.
* S3 bucket fully locked down (versioning, KMS, block public access).
* KMS CMK with rotation enabled.
* Minimal IAM roles.
* Detailed monitoring enabled.

## Variables (must be declared in the file)

* `aws_region` = "us-east-1"
* `vpc_cidr` = "10.0.0.0/16"
* `public_subnet` = "10.0.1.0/24"
* `private_subnets` = \["10.0.2.0/24", "10.0.3.0/24"]
* `bastion_allowed_cidr` = "" (required — no default 0.0.0.0/0)
* `bastion_instance_type` = "t3.micro"
* `app_instance_type` = "t3.small"

## Deliverable

* A single `tap_stack.tf` containing all variables, resources, and outputs.
* Clear comments explaining non-trivial parts (like security groups, KMS).
* Short usage instructions at the top (`terraform init`, `terraform plan`, `terraform apply`).
* Must pass `terraform fmt` and `terraform validate`.
* Terraform plan should show:

  * VPC + networking
  * Bastion + app servers
  * S3 bucket with KMS and versioning
  * IAM roles + policies
  * Security groups with locked-down rules
  * Monitoring and tagging applied everywhere
