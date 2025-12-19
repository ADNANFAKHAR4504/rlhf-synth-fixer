Build a modular Terraform configuration (Terraform ≥1.5) for a payment-processing platform that can be deployed to three environments using Terraform workspaces: dev, staging, and prod. Use the AWS provider (5.x). Produce a main module plus reusable child modules for networking, compute, database, and storage. Keep the code reusable and workspace-driven, no hard-coded environment-specific values.

Requirements (must be implemented exactly):

Module structure & workspaces One root (main) configuration that composes child modules: modules/network, modules/compute, modules/database, and modules/storage. Use Terraform workspaces and workspace-specific .tfvars files (e.g., dev.tfvars, staging.tfvars, prod.tfvars) to drive environment differences. Show example terraform workspace commands to deploy to each environment.

Networking: Each environment gets a VPC with 2 public and 2 private subnets (across 2 AZs). CIDR ranges must not overlap between environments and must be derived from variables/locals (do not hardcode concrete CIDRs). Create appropriate route tables, internet gateway, NAT (or NAT gateway replacement) for private subnets. Implement Network ACLs that restrict database access so only application subnets can reach DB subnets.

Compute (ECS Fargate) : Create an ECS cluster and Fargate service that runs a payment-processing task definition. Task/container counts must be environment-specific: prod ≥ 3 tasks, staging = 1, dev = 1 (driven by workspace variables/local map). Expose the service behind an Application Load Balancer. Configure ALB listener(s) and target group(s) pointing to the ECS service.

Database (RDS PostgreSQL) ; Provision RDS PostgreSQL instances with encrypted storage. Each environment must use its own KMS key (environment-scoped). Use environment-specific instance sizes via variables. Production must use Multi-AZ; dev/staging single-AZ is acceptable. Ensure DB subnet group uses private subnets only. Enforce security so only ECS task subnets/security-groups can connect.

S3 (transaction logs), Create a unique S3 bucket per environment for transaction logs. Enable versioning, server-side encryption, and add a lifecycle policy (e.g., transition and expiry rules); lifecycle rules must be present and configurable per environment. Bucket names must be derived from workspace + project variables to guarantee uniqueness.

IAM and least privilege : Implement IAM roles and task-execution / task roles for ECS tasks that allow access only to that environment’s RDS and S3 resources. Use IAM policies scoped to resource ARNs that include workspace/environment variables. Also create roles/policies needed for ALB, logging, etc., with least privilege.

CloudWatch logging Create CloudWatch Log Groups for the ECS tasks and other components. Set retention by environment: dev = 7 days, staging = 30 days, prod = 90 days (driven by workspace variables).

Tagging Tag every resource with at least: Environment, Project, and ManagedBy. Tags should be applied consistently using locals and a tags map.

Security & networking constraints: Network ACLs and Security Groups must ensure database access is restricted to app subnets/security-groups only. Ensure RDS is not publicly accessible.

Variables & locals : Use variables and locals to define environment-specific settings (instance sizes, task counts, bucket name suffixes, kms keys, CIDR base, log retention, etc.) while keeping module interfaces reusable. Avoid sprinkling environment conditionals throughout modules; prefer passing environment-specific values from root module's locals mapping keyed by workspace.

Deliverables to produce in the repo layout:

main.tf, providers.tf, variables.tf, outputs.tf (root calling modules).

modules/network/* (VPC, subnets, route tables, ACLs).

modules/compute/* (ECS cluster, task definition, Fargate service, IAM roles, ALB integration).

modules/database/* (RDS instance, subnet group, KMS key creation or reference, security groups).

modules/storage/* (S3 bucket with versioning, lifecycle policy).

environments/dev.tfvars, environments/staging.tfvars, environments/prod.tfvars (workspace-specific variable files).

Example terraform commands (concise) demonstrating how to create/select a workspace and apply using the correct .tfvars (e.g., terraform workspace new dev / terraform workspace select dev then terraform apply -var-file=environments/dev.tfvars).

Constraints & non-functional requirements:

Do not hardcode regions or concrete CIDR blocks ; derive them from variables/locals so the same code works across environments (user can pick region).

Use Terraform 1.5+ syntax and follow best practices for module inputs/outputs.

Ensure all RDS storage is encrypted and uses environment-specific KMS keys.

Ensure production has Multi-AZ RDS and at least 3 ECS tasks.

Ensure S3 buckets have versioning & lifecycle policies and are uniquely named per workspace.

Keep IAM policies least-privilege and scoped to same-environment resources only.

Output format: Provide the Terraform files described above