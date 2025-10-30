# Task: Cloud Environment Setup

## Background
A financial services startup needs to establish a secure AWS environment for their new payment processing application. The infrastructure must comply with PCI DSS requirements for network segmentation and access control. The development team requires separate environments for testing and production workloads.

## Environment
Production-grade AWS environment in us-east-1 region for payment processing application. Requires multi-AZ VPC setup with 6 subnets (3 public, 3 private) across 3 availability zones. Infrastructure includes NAT Gateways for outbound internet access from private subnets, VPC endpoints for AWS services, and CloudWatch Logs for VPC Flow Logs. CloudFormation YAML template deployment via AWS CLI or Console. No existing infrastructure dependencies.

## Problem Statement
Create a CloudFormation template to deploy a production-ready VPC infrastructure for a payment processing application. The configuration must:

1. Create a VPC with CIDR 10.0.0.0/16 and enable DNS hostnames and DNS resolution.
2. Deploy 6 subnets across 3 availability zones - 3 public subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24) and 3 private subnets (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24).
3. Configure an Internet Gateway attached to the VPC with routes from public subnets.
4. Deploy NAT Gateways in the first two public subnets with Elastic IPs.
5. Create route tables for public and private subnets with appropriate routes.
6. Enable VPC Flow Logs to CloudWatch Logs with a retention period of 30 days.
7. Create VPC endpoints for S3 and DynamoDB services.
8. Define security groups for web tier (ports 80, 443) and application tier (port 8080) with restrictive ingress rules.
9. Implement Network ACLs that deny all traffic by default and allow only necessary ports.
10. Tag all resources with Environment=Production, Owner=FinanceTeam, CostCenter=TECH001.

## Expected Output
A complete CloudFormation YAML template that creates a highly available, secure VPC infrastructure with proper network segmentation, logging enabled, and all resources properly tagged for cost tracking and compliance.

## Constraints
1. VPC must use CIDR block 10.0.0.0/16 for production environment
2. All subnets must have explicit route table associations
3. NAT Gateways must be deployed in at least two availability zones
4. VPC Flow Logs must be enabled and stored in CloudWatch Logs
5. Network ACLs must explicitly deny all traffic by default except required ports
6. Security groups must follow least privilege principle with no 0.0.0.0/0 ingress rules
7. All resources must be tagged with Environment, Owner, and CostCenter tags
8. Private subnets must not have direct internet gateway routes
9. VPC endpoints for S3 and DynamoDB must be configured for private access
10. CloudFormation outputs must include all subnet IDs and security group IDs for cross-stack references

## Metadata
- Task ID: 101000773
- Platform: CloudFormation
- Language: YAML
- Difficulty: hard
- Subtask Type: Cloud Environment Setup
