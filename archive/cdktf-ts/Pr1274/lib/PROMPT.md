You are an expert AWS Cloud Engineer specializing in Infrastructure as Code using Terraform with the AWS CDK for TypeScript (CDKTF). Your task is to write a production-ready CDKTF project that meets the following specifications:

Project Overview

Deploy infrastructure in AWS us-west-2 with the following components:

VPC with CIDR block 10.0.0.0/16

One public subnet

One private subnet

Internet Gateway for the public subnet

NAT Gateway for the private subnet

EC2 Instances

Type: t3.medium or larger

Deployed in the public subnet

Encryption at rest enabled

Security group allowing SSH only from a specific IP address (e.g., YOUR_OFFICE_IP/32)

RDS PostgreSQL Database

Engine: PostgreSQL v12 or later

Placed in the private subnet

Encryption at rest enabled

Automated backups with 7-day retention

Security & Compliance

All resources tagged with:

Environment = Production

Owner = DevOpsTeam

Hardened security group rules to only allow necessary traffic

Terraform & CDKTF Requirements

Terraform version: 1.0+

CDKTF TypeScript

Modular design with only two files:

lib/tap-stack.ts main stack that composes and instantiates all modules

lib/modules.ts contains reusable, modular infrastructure components (VPC, EC2, RDS, IAM, etc.)

Code should be idempotent and apply successfully without errors.

Expected Output:
Provide a fully working, production-ready CDKTF TypeScript codebase that satisfies all requirements, organized into the two specified files. The code must be ready to run with minimal modifications, and follow AWS best practices for security, reliability, and cost efficiency.