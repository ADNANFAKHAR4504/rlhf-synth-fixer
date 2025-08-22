You are an expert DevOps engineer specializing in production-grade Infrastructure as Code using the Terraform CDK for TypeScript (cdktf).

Your task is to generate a complete, secure, and modular cdktf project to deploy a foundational web environment on AWS. The code must be organized into exactly two files as specified below and adhere strictly to all constraints.

Project Requirements & Constraints
File Structure:

lib/modules.ts: This file must contain all the reusable infrastructure components as separate TypeScript classes (Constructs). Do not place the main stack here.

lib/tap-stack.ts: This file must define the main stack (TerraformStack). It should import the constructs from lib/modules.ts and compose them to build the final infrastructure.

Global Constraints:

AWS Region: The provider must be configured for us-west-2.

Terraform Version: The project should be compatible with Terraform version 0.14 or later.

Tagging: All created resources must have a default tag of Environment: Production.

Module Specifications (lib/modules.ts):

VPC Module:

Create a VpcModule construct.

It should provision a VPC with the CIDR block 10.0.0.0/16.

It must create public and private subnets, each distributed across two Availability Zones.

Include an Internet Gateway for the public subnets and NAT Gateways for the private subnets to allow outbound internet access.


EC2 Web Server Module:

Create an Ec2InstanceModule construct.

The instance should use a current Amazon Linux 2 AMI and be of type t3.micro.

It must be placed in one of the public subnets and be assigned a public IP address.

It must have a Security Group that allows:

Inbound HTTP (port 80) and HTTPS (port 443) traffic from anywhere (0.0.0.0/0).

Inbound SSH (port 22) traffic only from the placeholder IP YOUR_IP_HERE/32. Add a comment indicating that the user must replace this value.

Main Stack Specification (lib/tap-stack.ts):

Define the main stack which extends TerraformStack.


Pass the necessary outputs from the VPC module (e.g., VPC ID, public subnet ID) as inputs to the EC2 module.

Expected Output
Provide the complete, production-ready TypeScript code for the two files. The code should be well-commented to explain the logic and resource configurations. Present the code for lib/modules.ts first, followed by lib/tap-stack.ts.