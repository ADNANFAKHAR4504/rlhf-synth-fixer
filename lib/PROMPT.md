# Task: Infrastructure as Code - Secure VPC Foundation

## Problem Statement

Create a Terraform configuration to deploy a production-ready VPC foundation with security-first design. The configuration must:

1. Create a VPC with DNS hostnames and DNS resolution enabled.
2. Deploy 3 public subnets and 3 private subnets across different availability zones.
3. Configure an Internet Gateway attached to the VPC.
4. Create NAT Gateways in public subnets with Elastic IPs.
5. Set up route tables with proper associations for public and private traffic flow.
6. Implement Network ACLs with explicit deny rules for known malicious IP ranges.
7. Configure VPC Flow Logs writing to an S3 bucket with lifecycle policies.
8. Create an S3 Gateway Endpoint with policy restrictions.
9. Output subnet IDs grouped by tier (public/private) for use by other modules.
10. Tag all resources with Environment, Project, and ManagedBy tags.

**Expected output:** A modular Terraform configuration that creates a secure, multi-AZ VPC with proper network segmentation, monitoring, and cost-optimized routing for private subnet outbound traffic.

## Background

A fintech startup needs to establish a secure cloud foundation for their new payment processing platform. The infrastructure must support PCI DSS compliance requirements with proper network isolation and monitoring. The team has chosen Terraform to manage their AWS infrastructure as code.

## Environment

AWS multi-AZ deployment in us-east-1 region for a secure VPC foundation. Core services include VPC with 6 subnets (3 public, 3 private) across 3 availability zones, Internet Gateway, NAT Gateways for outbound traffic, S3 VPC Gateway Endpoint, and VPC Flow Logs to S3. Network ACLs configured for additional security layer. Requires Terraform 1.5+ with AWS provider 5.x. Infrastructure designed for hosting containerized workloads with strict network isolation requirements.

## Constraints

- VPC must use /16 CIDR block from 10.0.0.0/8 range
- All subnets must have explicit availability zone assignments
- NAT Gateways must be deployed in at least 2 AZs for redundancy
- S3 VPC endpoint must restrict access to specific bucket prefixes
- Flow logs must capture ALL traffic types including accepted connections
- Security group rules must use description fields for audit purposes
