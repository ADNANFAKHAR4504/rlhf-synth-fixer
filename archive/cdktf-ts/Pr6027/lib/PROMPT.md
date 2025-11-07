# Task: wajbh - VPC Infrastructure for Payment Processing Platform

## Problem Statement

Create a Terraform configuration to deploy a production-ready VPC infrastructure for a payment processing platform. The configuration must:

1. Create a VPC with CIDR block 10.0.0.0/16 in us-east-1 region.
2. Deploy 3 public subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24) across 3 AZs for load balancer placement.
3. Deploy 6 private subnets - 3 for application tier (10.0.16.0/23, 10.0.18.0/23, 10.0.20.0/23) and 3 for database tier (10.0.32.0/23, 10.0.34.0/23, 10.0.36.0/23).
4. Configure NAT instances (t3.micro) in each public subnet with appropriate routing for private subnets.
5. Implement custom Network ACLs allowing only HTTPS (443), SSH (22) from specific IP, and ephemeral ports (1024-65535).
6. Create a Transit Gateway and attach the VPC with proper route table associations.
7. Enable VPC Flow Logs with S3 bucket storage and lifecycle policy for 90-day retention.
8. Configure VPC endpoints for S3 and DynamoDB with appropriate route table associations.
9. Create security groups for web, app, and database tiers with strict ingress/egress rules.
10. Apply consistent tagging strategy across all resources.

Expected output: A modular Terraform configuration with separate files for VPC, subnets, routing, security, and endpoints. The infrastructure should support a three-tier architecture with proper network isolation and be ready for Transit Gateway peering with other regions.

## Context

A fintech startup needs to establish a secure cloud foundation for their payment processing platform. The infrastructure must comply with PCI DSS requirements for network segmentation and access control. The platform will handle sensitive financial data and requires strict isolation between public-facing and internal components.

## Environment Details

AWS environment in us-east-1 region for a new fintech platform requiring PCI DSS compliant network architecture. Infrastructure includes custom VPC with 3 AZs, public and private subnet tiers, NAT instances for outbound connectivity, Transit Gateway for multi-region readiness, and VPC endpoints for AWS services. Requires Terraform 1.5+ with AWS provider 5.x configured. The setup involves network segmentation with dedicated subnets for web tier (public), application tier (private), and database tier (private). Flow logs enabled for compliance auditing.

## Constraints

- VPC must span exactly 3 availability zones for high availability
- Public subnets must use /24 CIDR blocks, private subnets must use /23 blocks
- All private subnets must route through NAT instances instead of NAT Gateways
- Network ACLs must explicitly deny all traffic except required ports
- VPC Flow Logs must be enabled and stored in S3 with 90-day retention
- Transit Gateway attachment must be configured for future multi-region expansion
- All resources must be tagged with Environment, Project, and CostCenter tags
- Security groups must follow least-privilege principle with no 0.0.0.0/0 ingress rules
- VPC endpoints must be created for S3 and DynamoDB to avoid internet routing

## Task Metadata

- Platform: CDKTF
- Language: TypeScript
- Difficulty: hard
- Subtask: Provisioning of Infrastructure Environments
- Subject Labels: Environment Migration; Cloud Environment Setup; Multi-Environment Consistency and Replication
