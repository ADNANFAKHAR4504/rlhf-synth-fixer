# Task: Cloud Environment Setup

## Problem Statement
Create a Pulumi TypeScript program to set up a foundational AWS cloud environment for a payment processing system. The configuration must: 1. Create a VPC with CIDR block 10.0.0.0/16 in ap-southeast-2 region. 2. Configure three public subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24) across different availability zones. 3. Configure three private subnets (10.0.101.0/24, 10.0.102.0/24, 10.0.103.0/24) in the same availability zones. 4. Set up an Internet Gateway and attach it to the VPC. 5. Create NAT Gateways in each public subnet for outbound internet access from private subnets. 6. Configure route tables for public subnets (0.0.0.0/0 → Internet Gateway) and private subnets (0.0.0.0/0 → respective NAT Gateway). 7. Create an S3 bucket with versioning enabled for storing transaction logs. 8. Set up VPC Flow Logs to capture network traffic and store logs in CloudWatch Logs. 9. Apply resource tags: Environment=production, Project=payment-processing, ManagedBy=pulumi. 10. Export VPC ID, subnet IDs, and S3 bucket name as stack outputs. Expected output: A fully configured VPC with public and private subnets across multiple AZs, NAT Gateways for outbound connectivity, S3 bucket for log storage, and VPC Flow Logs for network monitoring. All resources should be properly tagged and key resource IDs exported for use by other stacks.

## Context
A fintech startup needs to establish a new AWS environment for their payment processing application. The infrastructure must provide network isolation, monitoring capabilities, and storage for transaction logs while meeting compliance requirements.

## Environment Information
AWS cloud environment in ap-southeast-2 region featuring VPC with multi-AZ public and private subnets, NAT Gateways for outbound connectivity, S3 for transaction log storage, and CloudWatch for VPC Flow Logs. Requires Pulumi CLI 3.x, Node.js 16+, TypeScript 4.x, and AWS credentials configured. Infrastructure spans three availability zones with proper network segmentation for payment processing workloads.

## Constraints
1. All subnets must be created in different availability zones for high availability
2. NAT Gateways must have Elastic IPs allocated from AWS pool
3. S3 bucket must have a unique name following pattern: payment-logs-{random-suffix}
4. VPC Flow Logs must capture ALL traffic (accepted and rejected)
5. Private subnets must not have direct internet access except through NAT Gateways
6. All resources must use consistent naming convention: payment-{resource-type}-{az-suffix}
