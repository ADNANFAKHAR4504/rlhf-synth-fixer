You are an expert AWS Cloud Engineer specializing in Infrastructure as Code using the AWS CDK for Terraform (CDKTF) with TypeScript. Your task is to generate a complete, production-ready, and modular CDKTF project that sets up a secure and scalable network foundation in AWS.

The project must strictly adhere to the following file structure and technical specifications.

Project Requirements
1. Technology Stack:

Framework: AWS CDK for Terraform (CDKTF)

Language: TypeScript

AWS Provider Version: 3.42.0 or later.

2. File Structure:
Organize the entire project into the following two files. Do not create any other files; all logic must be contained within these two.

lib/modules.ts: This file must contain a reusable, modular VpcModule class (L3 construct). This module will encapsulate all the networking resources (VPC, subnets, gateways, route tables, security groups) and accept configuration options.

lib/tap-stack.ts: This is the main stack file. It will import and instantiate the VpcModule from lib/modules.ts to compose the final infrastructure. It should be clean and primarily focused on composition, not resource definition.

Infrastructure Specifications
1. General Configuration:

AWS Region: All resources must be deployed to us-west-2.

Tagging: All created resources must be tagged with { "Environment": "Production" }.
2. VpcModule in lib/modules.ts:
This class must create the following resources:

VPC:

Create a single Vpc with the CIDR block 10.0.0.0/16.

Subnets:

Create two public subnets in different Availability Zones (e.g., us-west-2a, us-west-2b).

CIDRs: 10.0.1.0/24 and 10.0.2.0/24.

These subnets must automatically assign public IP addresses to instances launched within them.

Create two private subnets in the same Availability Zones.

CIDRs: 10.0.101.0/24 and 10.0.102.0/24.

Gateways & Routing:

An Internet Gateway attached to the VPC.

A public route table that routes all outbound traffic (0.0.0.0/0) to the Internet Gateway. Associate this with both public subnets.

An Elastic IP and a NAT Gateway for one of the private subnets to allow outbound internet access.

A private route table that routes all outbound traffic (0.0.0.0/0) to the NAT Gateway. Associate this with both private subnets.

Security Groups:

Create a security group named production-web-sg.

Ingress: Allow HTTP (port 80) and HTTPS (port 443) traffic from anywhere (0.0.0.0/0).

Egress: Allow all outbound traffic.

Create a security group named production-ssh-sg.

Ingress: Allow SSH (port 22) traffic only from the CIDR block 203.0.113.0/24.

Egress: Allow all outbound traffic.

3. TapStack in lib/tap-stack.ts:
This class must perform the following actions:

Configure the AWS provider for the us-west-2 region.

Instantiate the VpcModule from lib/modules.ts to create the networking infrastructure.

Apply the Environment: Production tag to all resources within the stack.

Expected Output
Provide the complete, runnable code for both lib/modules.ts and lib/tap-stack.ts in a single response. The code must be well-commented, explaining the purpose of each resource and configuration choice. The final output should be ready to be synthesized by cdktf synth and deployed via terraform apply.