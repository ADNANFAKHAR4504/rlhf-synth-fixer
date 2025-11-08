# Task: Cloud Environment Setup - Pulumi Python

## Background
A fintech startup needs to establish a secure cloud foundation for their payment processing platform. They require network isolation between different application tiers and strict security boundaries to meet PCI compliance requirements.

## Environment
Production-grade network infrastructure deployed in us-east-1 across 3 availability zones. Core components include VPC with public, private, and database subnet tiers, NAT Gateways for outbound connectivity, VPC Flow Logs for compliance monitoring, and Application Load Balancer for ingress. Requires Go 1.19+, AWS CDK 2.100+ installed via npm, AWS CLI configured with appropriate IAM permissions. The VPC uses 10.0.0.0/16 CIDR with careful subnet allocation to support future growth.

## Problem Statement
Create a CDK Go program to deploy a three-tier VPC architecture for a payment processing application. The configuration must:

1. Create a VPC with CIDR 10.0.0.0/16 across three availability zones.
2. Implement three subnet tiers per AZ: public (10.0.1-3.0/24), private (10.0.11-13.0/24), and database (10.0.21-23.0/24).
3. Deploy one NAT Gateway per availability zone in the public subnets.
4. Configure route tables so private subnets route through NAT Gateways and database subnets have no internet routes.
5. Create security groups for web tier (ports 80/443 from internet), app tier (port 8080 from web tier only), and database tier (port 5432 from app tier only).
6. Set up VPC Flow Logs with CloudWatch Logs as destination, capturing all traffic types.
7. Implement Network ACLs that deny all traffic by default, then allow only necessary ports between tiers.
8. Add VPC endpoints for S3 and DynamoDB to reduce NAT Gateway costs.
9. Tag all resources with Environment=Production and Project=PaymentPlatform.
10. Export VPC ID, subnet IDs, and security group IDs as CloudFormation outputs.

Expected output: A complete CDK Go application that synthesizes CloudFormation templates creating the specified network architecture with proper isolation between tiers, high availability across zones, and compliance-ready logging.

## Constraints
1. VPC must use non-overlapping CIDR blocks that allow for future expansion
2. All database subnets must be completely private with no internet gateway attachments
3. NAT instances are prohibited; use NAT Gateways for outbound connectivity
4. Security groups must follow least-privilege principles with no 0.0.0.0/0 inbound rules
5. Each availability zone must have dedicated subnets for each tier
6. VPC Flow Logs must be enabled and sent to CloudWatch Logs
7. Network ACLs must explicitly deny all traffic by default except required ports

## Platform: Pulumi
## Language: Python
## Difficulty: hard

**Note**: The problem statement mentions CDK Go, but the task metadata specifies Pulumi Python. Please implement this solution using Pulumi with Python as specified in the task metadata.