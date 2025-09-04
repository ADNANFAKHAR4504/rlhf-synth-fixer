Create an expert-level Terraform code tap_stack.tf to achieve multi-environment consistency and replication across 'dev', 'staging', and 'production'. The stack must meet the following requirements: 1. Use environment-specific parameters to adjust configurations for each target environment. 2. Define IAM roles and policies with the least privileges required. 3. Facilitate easy deployment across different AWS regions (us-east-1, us-west-2, eu-central-1). 4. All resources must be consistently tagged with ‘Environment’, ‘Owner’, and ‘CostCenter’. 5. Implement AWS Config rules to maintain compliance with organizational standards. 6. Employ intrinsic functions for template optimization. 7. Ensure resources can be tracked and billed appropriately.

provider.tf

lib/tap_stack.tf

No external modules, no additional files.

A) provider.tf — Providers, versions, and backend (no variables here)

Author a complete provider.tf that:

Pins Terraform and AWS provider versions:

terraform block with:

required_version (e.g., >= 1.6.0)

required_providers:

aws from hashicorp/aws with version >= 5.0

Declares four AWS providers:

Default provider uses var.aws_region (which is declared in lib/tap_stack.tf)

Aliased providers for all target regions:

provider "aws" { alias = "use1" region = "us-east-1" }

provider "aws" { alias = "usw2" region = "us-west-2" }

provider "aws" { alias = "euc1" region = "eu-central-1" }

Configure a remote state backend in S3 (secured) to manage Terraform state (versioning and locking):

Inside the terraform block add backend "s3" with placeholders:

bucket (state bucket name)

key (e.g., nova-model-breaking/tfstate/${terraform.workspace}.tfstate)

region (e.g., us-east-1)

dynamodb_table (for state locking)

encrypt = true

Note: backend arguments are typically provided via -backend-config on terraform init; do not reference variables in the backend config.

Do not declare any variables in provider.tf. The variable aws_region is defined in lib/tap_stack.tf and consumed by the default provider here.

B) lib/tap_stack.tf — Single logic file (everything else goes here)

Author a single Terraform configuration at ./lib/tap_stack.tf that contains:

All variable declarations (including aws_region for the default provider in provider.tf)

Locals

Data sources

Resources

Outputs

Do not put any provider blocks here. Build all resources directly (no external modules). This is a brand‑new stack.

Non‑negotiables

Exactly one logic file: lib/tap_stack.tf

No external modules

Implement multi‑environment consistency & replication for environments: dev, staging, production using environment‑specific parameters

Implement multi‑region capability across us-east-1, us-west-2, eu-central-1 by attaching resources to provider aliases:

provider = aws.use1

provider = aws.usw2

provider = aws.euc1

All Terraform logic (variables, locals, resources, outputs) must be in lib/tap_stack.tf

No provider blocks in tap_stack.tf (providers live only in provider.tf)

No external modules; build resources directly

The variable aws_region must be declared in tap_stack.tf and is consumed by provider.tf

Follow best practices:

Least‑privilege IAM

Avoid 0.0.0.0/0 on sensitive ports (restrict SSH/RDP)

Encrypt where possible (S3, EBS, RDS, Logs, KMS)

Consistent tagging across all resources

No secrets in outputs