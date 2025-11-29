Problem Context

You must generate a complete, production-ready Terraform configuration in a single file (main.tf) that implements a highly available AWS VPC architecture.
The entire solution must be implemented fully in Terraform.
The environment must reside exclusively in us-west-2, support high availability, and meet all networking, security, and EC2 requirements.
This Terraform should be clean, well-structured, readable, and ready to run.

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

With corresponding Elastic IPs.

Routing:

Public route table with default route via IGW.

Private route tables with default routes via respective NAT Gateways.

EC2 instances (2 total):

One in each private subnet

Instance type: t2.micro

Must have Elastic IP association

Root EBS volume must have encryption at rest enabled

Security Group:

Allow inbound SSH ONLY from a user-provided CIDR (make a variable: allowed_ssh_cidr)

Allow all outbound

Outputs required:

VPC ID

All subnet IDs (public + private)

Ensure no resource has deletion protection enabled.

Entire configuration must be delivered as one single Terraform file (main.tf) — no modules, no multi-file structure.

Constraints

Must be Terraform only.

Entire solution must be delivered in one file only (main.tf).

AWS region must be us-west-2.

Must strictly follow CIDR requirements:

VPC: 10.0.0.0/16

Four subnets: each /24, unique, no overlap

Two public subnets + two private subnets across separate AZs.

NAT Gateway per public subnet.

EC2 instances must each:

Reside in private subnets

Include Elastic IP

Have encrypted EBS volume

Must output VPC + all subnet IDs.

No deletion protection must be enabled on any resource.

Expected Output

Produce a fully working, complete main.tf file containing:

Provider block

Variables 

All resources (VPC, subnets, IGW, NAT, route tables, EC2, SG, EIPs, etc.)

Outputs block

Comments explaining major sections

Valid Terraform 1.5+ syntax

Everything MUST be included in a single main.tf file.

Output Instructions
Generate a single-file Terraform configuration (main.tf) implementing all requirements above.
Ensure the output is formatted as valid Terraform HCL code 
Include comments throughout explaining key security best practices.
Do not summarize or break into sections — produce one full Terraform file as the output.