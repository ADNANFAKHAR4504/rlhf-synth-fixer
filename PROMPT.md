# Task: z5g2n4 - CDKTF Python VPC Infrastructure

## Metadata
- Platform: CDKTF
- Language: Python
- Difficulty: expert
- Category: Failure Recovery and High Availability
- Subtask: Failure Recovery Automation

## Background
A financial services company needs to establish a secure, isolated network foundation in AWS for their new digital banking platform. The infrastructure must support strict network segmentation between application tiers while maintaining high availability across multiple availability zones.

## Problem Statement
Create a CDKTF Python program to deploy a production-ready VPC infrastructure for a financial services platform. The configuration must:

1. Create a VPC with CIDR 10.0.0.0/16 and enable DNS hostnames/resolution.
2. Deploy 6 subnets across 3 AZs (one public, one private per AZ) with /24 CIDR blocks.
3. Create an Internet Gateway and attach it to the VPC.
4. Deploy one NAT Gateway in each public subnet with Elastic IPs.
5. Configure separate route tables for public and private subnets with appropriate routes.
6. Create S3 bucket with versioning for VPC Flow Logs storage.
7. Enable VPC Flow Logs capturing ALL traffic and storing in S3.
8. Configure S3 lifecycle rule to transition logs to Glacier after 30 days.
9. Create custom Network ACLs with explicit deny-all rules as baseline.
10. Tag all resources with Environment=Production and Project=DigitalBanking.
11. Output the VPC ID, subnet IDs grouped by type, and NAT Gateway IPs.

Expected output: A CDKTF Python application that synthesizes Terraform configuration for a highly available, secure VPC with proper network segmentation, monitoring, and compliance features suitable for financial services workloads.

## Requirements
Production-grade network infrastructure deployed in eu-west-1 (Ireland) across 3 availability zones. Core components include custom VPC with public/private subnet tiers, redundant NAT Gateways for outbound connectivity, and VPC Flow Logs for compliance. Requires Python 3.8+, CDKTF 0.19+, and Terraform 1.5+ installed locally. AWS credentials must have permissions for VPC, EC2, S3, and CloudWatch services. Infrastructure designed for multi-tier applications with strict network isolation between public-facing and private resources.

## Constraints
- VPC CIDR must be /16 to accommodate future growth with at least 4096 available IPs per subnet
- Each availability zone must have exactly one public and one private subnet with non-overlapping CIDR blocks
- NAT Gateways must be deployed in each AZ for high availability, not shared across zones
- All route tables must have explicit associations - no reliance on main route table
- VPC Flow Logs must be enabled and stored in S3 with 30-day lifecycle policy
- Network ACLs must explicitly deny all traffic by default except for documented exceptions

## Deliverables
1. CDKTF Python application with proper project structure
2. VPC with DNS support enabled
3. 6 subnets across 3 AZs (3 public, 3 private)
4. Internet Gateway attached to VPC
5. 3 NAT Gateways (one per public subnet) with Elastic IPs
6. Route tables configured for public and private subnets
7. S3 bucket with versioning for VPC Flow Logs
8. VPC Flow Logs enabled and configured
9. S3 lifecycle policy for log retention
10. Network ACLs with deny-all baseline
11. Resource tags applied consistently
12. Outputs for VPC ID, subnet IDs, and NAT Gateway IPs
