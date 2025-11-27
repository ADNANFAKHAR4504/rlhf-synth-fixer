Generate a complete, production-grade, fully modular Terraform configuration for the following task.
The output must not contain any hardcoded AWS account IDs, region names, ARNs, or fixed values. Everything must be fully parameterized and cross-account compatible.

Overall Task

Create a Terraform configuration that deploys a multi-region AWS Transit Gateway hub-and-spoke network architecture, meeting the following technical requirements:

Transit Gateway Hub (us-east-1)

Create a Transit Gateway in the hub region with:

DNS support enabled

Multicast disabled

VPC Deployments (in us-east-1 hub region)

Deploy three VPCs for:

prod → 10.0.0.0/16

staging → 10.1.0.0/16

dev → 10.2.0.0/16

Each VPC must include:

3 public subnets (across 3 AZs)

3 private subnets (across the same 3 AZs)

Dedicated TGW attachment subnets (/28 in each AZ)

Transit Gateway Attachments & Routing

Create VPC attachments for each VPC using the dedicated /28 subnets.

Create three TGW route tables:

prod route table

staging route table

dev route table

Routing rules must enforce:

prod must not communicate with dev

staging can communicate with both prod and dev

prod ↔ staging is allowed

dev ↔ staging is allowed

Multi-Region TGW Peering

Create Transit Gateways in:

us-west-2

eu-west-1

Create TGW peering attachments between:

hub (us-east-1) ↔ us-west-2

hub (us-east-1) ↔ eu-west-1

NACL Requirements

Network ACLs must restrict inter-VPC traffic to only:

HTTPS (443)

SSH (22)

RDP (3389)

All other traffic must be denied.

Logging

Enable VPC Flow Logs on all VPCs:

Capture interval: 60 seconds

Destination: CloudWatch Logs

Fully encrypted using a KMS CMK

Default VPC Route Tables

All VPC private route tables must send inter-VPC traffic to the Transit Gateway.

Blackhole Routes

Add TGW blackhole routes for unused RFC1918 ranges:

172.16.0.0/12

192.168.0.0/16

Outputs

Output:

Transit Gateway IDs

TGW route table IDs

VPC IDs

Subnet IDs

TGW attachment IDs

Required Terraform Structure

Everything must be organized inside:

/lib
  provider.tf
  variables.tf
  tap_stack.tf   # Main resource composition

/modules
  /vpc
  /tgw
  /routes
  /nacl
  /flowlogs
  /kms


Each module must be reusable, generic, and accept variables.

Additional Requirements
✔ Zero Hardcoding

No literal values for:

account IDs

region names

ARNs

CIDR lists

subnet lists

Everything must be variables or derived from locals.

✔ Cross-Account Executability

Terraform must work across multiple AWS accounts without modification.

✔ Use Proper Locals Structure

Include a locals block like:

locals {
  project_name = "ProjectName"
  environment  = var.environment_suffix
  region       = var.aws_region

  common_tags = {
    Project     = local.project_name
    Environment = local.environment
    Owner       = "SecurityTeam"
  }
}

✔ KMS CMK for all logging

Include reusable module:

resource "aws_kms_key" "main" {
  description = "${local.project_name}-KMS-${local.environment}"
}

✔ Multi-region providers

Use:

provider "aws" {
  region = var.aws_region
}

provider "aws" {
  alias  = "us_west_2"
  region = var.spoke_region_1
}

provider "aws" {
  alias  = "eu_west_1"
  region = var.spoke_region_2
}

✔ Must comply with RFC1918 addressing

No overlapping CIDRs.

Final Output Format

Produce:

Complete Terraform code

All module files

Main tap_stack.tf

Provider blocks

Variables and outputs

Reusable modules

Correct routing logic for TGW

All tagging applied via local.common_tags

No placeholder values — everything parameterized

Fully functional deployable configuration