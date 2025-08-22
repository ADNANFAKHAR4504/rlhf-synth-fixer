Im working on an AWS project using CDK for Terraform (CDKTF) with TypeScript, and I need a complete, production-ready setup that builds a secure and scalable network on AWS.

Heres what Im looking for:

Tech stack & setup

Framework: AWS CDK for Terraform (CDKTF)

Language: TypeScript

AWS provider version: 3.42.0 or later

AWS region: us-west-2

All resources tagged with: { "Environment": "Production" }

Project structure
I only want two files:

lib/modules.ts This should have a reusable VpcModule (L3 construct) that sets up all the networking (VPC, subnets, gateways, route tables, security groups) and takes configuration options.

lib/tap-stack.ts The main stack that imports VpcModule and focuses on composition only (no direct resource definitions).

VPC requirements (inside VpcModule):

VPC: CIDR 10.0.0.0/16

Public subnets: Two subnets in different AZs (us-west-2a and us-west-2b), CIDRs 10.0.1.0/24 and 10.0.2.0/24, must auto-assign public IPs.

Private subnets: Two subnets in the same AZs, CIDRs 10.0.101.0/24 and 10.0.102.0/24.

Gateways & routes:

Internet Gateway for public subnets

Public route table IGW for 0.0.0.0/0

Elastic IP + NAT Gateway in one private subnet

Private route table NAT Gateway for 0.0.0.0/0

Security groups:

production-web-sg: allow HTTP (80) & HTTPS (443) from anywhere, egress all traffic

production-ssh-sg: allow SSH (22) only from 203.0.113.0/24, egress all traffic

Stack requirements (tap-stack.ts):

Configure AWS provider for us-west-2

Instantiate VpcModule to create networking infrastructure

Ensure all resources have the Environment: Production tag

What I need from you:
Give me the complete, working code for both modules.ts and tap-stack.ts in one go. Please include clear comments explaining why each resource/config is there. The code should be ready to run with cdktf synth and then deploy with terraform apply.