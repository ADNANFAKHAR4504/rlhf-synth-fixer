Act as a Senior Cloud Security Engineer. You are tasked with building a secure and foundational AWS network and database infrastructure using CDK for Terraform (CDKTF) in TypeScript. The goal is to create a production-ready, private environment that adheres to strict security and organizational best practices.

Required Files:
Your final output must consist of exactly two files:

lib/modules.ts: Contains all the reusable, modular CDKTF constructs for the VPC, Security Groups, RDS Instance, and S3 Bucket.

lib/tap-stack.ts: The main stack file that imports the constructs from modules.ts, composes the final infrastructure, and defines stack outputs.

Environment & Naming:
Cloud Provider: AWS

Region: us-west-2

IaC Tool: CDKTF (TypeScript)

Project Name: aurora

Environment Type: prod

Naming Convention: All resources must be named using the format: aurora-prod-{resource-name} (e.g., aurora-prod-main-vpc, aurora-prod-rds-sg).

Tagging (Required on all resources):

Environment = prod

Owner = CloudEngineering

Infrastructure Requirements:
VPC (Virtual Private Cloud)

Create a new VPC with a CIDR block of 10.0.0.0/16.

It must contain public subnets (for resources like a NAT Gateway) and private subnets (for the RDS instance).

Configure a NAT Gateway in a public subnet to allow outbound internet access from the private subnets.

Security Groups

Bastion Host Security Group:

Allows inbound SSH traffic (port 22) only from the IP range 203.0.113.0/24.

This will be used for a conceptual bastion host; you don't need to create the EC2 instance itself, just the security group for it.

RDS Security Group:

Does not allow any public inbound traffic.

Must allow inbound traffic on the PostgreSQL port (5432) only from within the VPC (e.g., from the private subnets or another security group).

RDS Database Instance

Provision a PostgreSQL RDS instance (db.t3.micro).

It must be deployed within one of the private subnets of the VPC.

Storage encryption must be enabled.

It should not have a publicly accessible IP address.

Associate it with the RDS Security Group.

S3 Bucket for Logging

Create an S3 bucket intended for storing application or VPC flow logs.

Public access must be completely blocked.

Server-side encryption (SSE-S3) must be enabled.

Versioning must be enabled to prevent accidental data loss.

Constraints & Security Mandates:
All AWS resources must be deployed in the us-west-2 region.

All resources must strictly adhere to the specified tagging and naming conventions.

The RDS instance must be encrypted and placed in a private subnet.

Security group rules must enforce the principle of least privilege as described.

The entire infrastructure must be defined within the two specified files (modules.ts and tap-stack.ts), demonstrating proper modularity.

The final code must pass cdktf synth and be ready for cdktf deploy without errors.

Deliverables:
lib/modules.ts: A file exporting reusable CDKTF constructs for the VPC, RDS instance, S3 bucket, and Security Groups. Each construct should be configurable via props.

lib/tap-stack.ts: The main stack file that instantiates the modules to build the complete infrastructure.

Stack Outputs: The tap-stack.ts file should export the following outputs:

VpcId

RdsInstanceEndpoint

LogBucketName
