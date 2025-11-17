The requirement is to deploy identical network topologies for three environments: development, staging, and production, across multiple AWS regions (us-east-1, eu-west-1, and ap-southeast-2).
Each environment should maintain a consistent structure but apply environment-specific configurations for CIDRs, NAT strategies, and port access rules.

The Infrastructure Goal

Each environment should include:

A dedicated VPC with unique, non-overlapping CIDR ranges:

dev → 10.1.0.0/16

staging → 10.2.0.0/16

prod → 10.3.0.0/16

Exactly three Availability Zones, each with one public and one private subnet (using /24 allocations).

A shared Internet Gateway for all public subnets.

NAT Gateways based on environment type:

Dev → single NAT for cost efficiency

Staging and Prod → one NAT per AZ for high availability

Route tables configured dynamically per subnet with correct routing for Internet and NAT.

Security groups that follow environment-based port access:

Dev: allow 8000–8999

Staging: allow 9000–9999

Prod: allow only 443

Consistent naming conventions and tagging across all resources.

Terraform Design Approach

This will all be handled in a single file (tap_stack.tf), where resources are dynamically created using for_each and locals for logic-driven configuration.
Environment data (like CIDRs, port ranges, NAT count) should be defined through Terraform maps or variables, making it easy to switch environments through workspaces or variable inputs.

For example:

terraform workspace select dev would automatically load CIDR and port rules for the dev environment.

The same logic applies for staging or prod, ensuring full parity across deployments.

The stack should be capable of spinning up a full network environment in any of the supported AWS regions without manual modification. The only difference across environments should come from their configuration values, not from the Terraform code structure.

Key Implementation Details

Tagging and Naming:
Every resource name should include the environment prefix, e.g.,
dev-vpc, staging-nat-az1, prod-private-rtb.
Apply consistent tags for compliance and cost visibility:

Environment = dev|staging|prod
Project     = fintech-core-network
ManagedBy   = terraform
Compliance  = SOC2


Outputs:
Expose key resource details like VPC ID, public/private subnet IDs, NAT EIP addresses, and route table IDs to support downstream components or automation scripts.

Expected Deliverable

A complete Terraform configuration consisting of:
tap_stack.tf — contains the full logic for networking setup across all environments.


When executed, the setup should:

Deploy a fully functional and consistent network in AWS.

Respect all environment-specific rules automatically.

Remain flexible for replication across regions.

Require no additional modules or file imports.

The code should follow AWS and Terraform best practices — secure defaults, least privilege for security groups, and reusable patterns within a single configuration file.

This stack should feel like a real-world, production-ready Terraform deployment that’s simple, self-contained, and easy to extend if new environments are introduced later. 

Let’s make the recovery pipeline both autonomous and resilient — fully AWS-native, tightly integrated, and deployable with a single Terraform apply.
 Constraints-

1. Use consistent, descriptive naming conventions defined by locals or input variables for all resources for easier management.
2. Give character size 4 suffix in small letters only with each resource so that stack dont get error of "resource already exists". Also use small characters only for this suffix. use this suffix "mult".
3. I dont need a provider block as I already have provider.tf file also please keep the tap_stack region agnostic which can be used for any regions.

5. Define provider block with each resource to avoid region conflicts
Eg
provider      = aws.us_east_1
provider      = aws.us_west_2
provider      = aws.ap_southeast_2

My provider.tf looks like this

provider "aws" {
  alias  = "us_east_1"
  region = var.primary_region
}

provider "aws" {
  alias  = "us_west_2"
  region = var.secondary_region
}

provider "aws" {
  alias  = "ap_southeast_2"
  region = var.third_region
}

Declare all necessary input variables, locals, resources, and outputs within this single file, excluding sensitive outputs, and referencing the AWS region only via variable (assume AWS providers handled elsewhere).

Provide outputs for aa essential identifiers and for all resources being created in this stack.

Ensure the entire Terraform code is well-commented, concise, fully deployable, and compliant with best security and infrastructure practices without using any external modules or pre-existing resources.

Can you generate the full response ,continue seamlessly  until the entire task is fully completed.
