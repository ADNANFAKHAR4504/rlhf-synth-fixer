I need you to generate a complete, production-grade Terraform configuration based on the following requirements. Follow the instructions strictly. Do not hardcode anything. Everything must be parameterized, region-agnostic, and cross-account executable.

OBJECTIVE

Create a Terraform configuration that deploys and synchronizes identical infrastructure stacks across three AWS regions in a single AWS account, while preserving environment-specific variations using Terraform workspaces.

The regions/environments are:

us-east-1-prod

eu-west-1-prod

ap-southeast-1-staging

These must be implemented as Terraform workspaces, not separate AWS accounts.

WHAT YOU MUST GENERATE

Produce a complete Terraform setup with the following characteristics:

1. File structure under lib/ directory

Use this exact structure:

lib/
  provider.tf
  variables.tf
  tap_stack.tf       # main resources + module calls
  us-east-1-prod.tfvars
  eu-west-1-prod.tfvars
  ap-southeast-1-staging.tfvars
  modules/
    vpc/
      ...
    ecs/
      ...
    rds_aurora_global/
      ...
    s3/
      ...
    validation/
      ...


You may add module files as needed.

2. PROVIDER REQUIREMENTS
• Must configure AWS provider aliases for all three regions.
• Must NOT hardcode account IDs or ARNs.
• Must use variables for assume_role ARN if needed in the future:
variable "assume_role_arn" {}

• Provider definition example:
provider "aws" {
  alias  = "use1"
  region = var.aws_region
  assume_role {
    role_arn = var.assume_role_arn
  }
}

• Region must come from workspace-specific tfvars.
• Everything must be fully multi-region and re-deployable with zero conflicts.
3. MODULE REQUIREMENTS

Create modules with version pinning (= 1.0.0 style) for at least:

VPC (3 AZs, public/private subnets, NAT gateways, route tables, tagging)

ECS Fargate service + cluster + ALB target group

RDS Aurora Global Database

us-east-1 = primary

eu-west-1 = secondary

S3 with replication rules

replication from both prod regions → staging region


checks tags, VPC CIDR blocks, ECS CPU/memory, DB size, S3 replication, etc.

Validation Module

ensures parameter consistency

errors if misconfigured

Each module must:

✔ Accept region-specific inputs
✔ Accept environment name as variable
✔ Use consistent naming

4. NAMING REQUIREMENTS

Use a consistent naming convention like:

"${local.project_name}-${local.region}-${local.environment}-<resource>"


Example for KMS key:

resource "aws_kms_key" "main" {
  description = "${local.project_name}-${local.region}-KMS-${local.environment}"
}


You must define locals such as:

locals {
  project_name = "ProjectName"
  environment  = var.environment_suffix
  region       = var.aws_region

  common_tags = {
    Project     = local.project_name
    Environment = local.environment
    Region      = local.region
  }
}


Must ensure no naming collisions across regions.


5. ENVIRONMENT-SPECIFIC VARIABLES

Each workspace tfvars must specify:

Region

VPC CIDR

Subnet CIDRs

ECS task CPU/memory

Aurora instance size

S3 replication toggle

Environment suffix

No hardcoded values inside modules.

7. WORKSPACE LOGIC

Use workspace naming automatically:

terraform workspace select us-east-1-prod
terraform apply -var-file="lib/us-east-1-prod.tfvars"


Automatic environment derivation example:

locals {
  environment_suffix = terraform.workspace
}

8. MAIN STACK (tap_stack.tf)

Should:

Call modules

Pass workspace-derived variables

Use provider aliases correctly

Use pinned module versions

Produce outputs that summarize configuration differences


ABSOLUTE RULES

No account IDs
No ARNs
No region names hardcoded in modules
No console-side steps
No single-file Terraform
✔ Everything must be dynamic, variable-driven, and multi-region.

YOUR OUTPUT MUST INCLUDE

All required .tf files

Variables

Locals

Module definitions

Example tfvars

Provider alias configuration

Naming strategy

Everything placed cleanly in lib/ directory