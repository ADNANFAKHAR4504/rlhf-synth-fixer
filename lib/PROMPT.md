Problem Context

You must generate a complete, production-ready Terraform configuration that implements a highly available AWS VPC architecture.
The entire solution must be implemented fully in Terraform using a properly organized multi-file structure.
The environment must reside exclusively in us-west-2, support high availability, and meet all networking, security, and EC2 requirements.
This Terraform should be clean, well-structured, readable, and ready to run with multi-environment support.

Core Implementation Requirements

Implement all of the following in Terraform:

Configure AWS provider locked to region us-west-2.

Create a VPC:

CIDR: 10.0.0.0/16.

Create two public subnets, each with:

/24 CIDR

Placed in different AZs

Create two private subnets, each with:

/24 CIDR

Placed in different AZs

Internet Gateway for public access.

NAT Gateways:

One NAT Gateway per public subnet.

With corresponding Elastic IPs for outbound internet access.

Routing:

Public route table with default route via IGW.

Private route tables with default routes via respective NAT Gateways.

EC2 instances (2 total):

One in each private subnet

Instance type: t2.micro

Private subnet instances (no direct public IPs for security compliance)

Root EBS volume must have encryption at rest enabled

Security Group:

Allow inbound SSH ONLY from a user-provided CIDR (make a variable: allowed_ssh_cidr)

Allow all outbound

Outputs required:

VPC ID

All subnet IDs (public + private)

EC2 private IP addresses

NAT Gateway public IPs

Ensure no resource has deletion protection enabled.

Configuration must be delivered using proper multi-file structure with organized separation of concerns:
- provider.tf: Provider configuration and versioning
- variables.tf: Variable definitions with defaults and descriptions  
- tap_stack.tf: Main infrastructure resources
All resources must support multi-environment deployment using environment_suffix variable.

Constraints

Must be Terraform only.

Solution must use proper multi-file structure for maintainability and organization.

AWS region must be us-west-2.

Must strictly follow CIDR requirements:

VPC: 10.0.0.0/16

Four subnets: each /24, unique, no overlap

Two public subnets + two private subnets across separate AZs.

NAT Gateway per public subnet.

EC2 instances must each:

Reside in private subnets

Have encrypted EBS volume

Use NAT Gateways for secure outbound internet access (no direct public IPs)

All resources must use environment_suffix variable in Name tags for multi-environment deployment support.

Must output VPC + all subnet IDs.

No deletion protection must be enabled on any resource.

Expected Output

Produce a fully working, complete multi-file Terraform configuration containing:

provider.tf:
- AWS provider configuration
- Version constraints
- Region specification

variables.tf:
- Variable definitions with defaults
- Environment suffix for multi-environment support
- SSH CIDR variable
- Proper descriptions

tap_stack.tf:
- All infrastructure resources (VPC, subnets, IGW, NAT, route tables, EC2, SG, EIPs, etc.)
- Environment-aware naming using variables
- Outputs block
- Comments explaining major sections

Valid Terraform 1.5+ syntax with proper file organization.

Output Instructions
Generate a properly organized multi-file Terraform configuration implementing all requirements above.
Ensure all files are formatted as valid Terraform HCL code.
Include comments throughout explaining key security best practices.
Use environment_suffix variable consistently across all resource names for multi-environment support.
Structure files for maintainability and clear separation of concerns.