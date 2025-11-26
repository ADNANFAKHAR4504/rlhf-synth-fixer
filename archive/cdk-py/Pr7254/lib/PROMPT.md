# Task: Multi-Account Transit Gateway Network Architecture

## Problem Statement

Create a CDK Python program to deploy a multi-account transit gateway network architecture.

MANDATORY REQUIREMENTS (Must complete):
1. Deploy a Transit Gateway in the network hub account with DNS support enabled (CORE: Transit Gateway)
2. Create three VPCs across different accounts: production (10.0.0.0/16), development (10.1.0.0/16), and shared services (10.2.0.0/16) (CORE: VPC)
3. Configure Route53 Resolver endpoints in the shared services VPC for centralized DNS (CORE: Route53 Resolver)
4. Implement transit gateway route tables with isolation between production and development
5. Set up VPC attachments with association and propagation rules
6. Configure security group rules allowing only necessary inter-VPC communication
7. Enable VPC Flow Logs to S3 buckets with 30-day lifecycle policies
8. Tag all resources with Environment, CostCenter, and ManagedBy tags

OPTIONAL ENHANCEMENTS (If time permits):
• Add AWS Network Firewall in shared services VPC (OPTIONAL: Network Firewall) - provides centralized security inspection
• Implement Direct Connect virtual interfaces (OPTIONAL: Direct Connect) - enables hybrid connectivity
• Add RAM sharing for cross-account resource access (OPTIONAL: Resource Access Manager) - simplifies multi-account management

Expected output: A CDK Python application that deploys a production-ready hub-and-spoke network with centralized DNS resolution and proper network segmentation across multiple AWS accounts.

## Background

A financial services company needs to establish a hub-and-spoke network architecture across multiple AWS accounts. They require centralized DNS resolution and network connectivity between isolated production, development, and shared services environments while maintaining strict network segmentation.

## Environment

Multi-account AWS environment deployed across us-east-1 region using Transit Gateway for hub-and-spoke networking, VPCs with private and public subnets, and Route53 Resolver for centralized DNS. Requires CDK 2.x with Python 3.9+, AWS CLI configured with cross-account assume role permissions. Architecture includes production VPC (10.0.0.0/16), development VPC (10.1.0.0/16), and shared services VPC (10.2.0.0/16) with transit gateway attachments. Network segmentation enforced through route tables and security groups.

## Constraints

- Transit Gateway must use custom route tables, not the default route table
- Production and development VPCs must not have direct routing between them
- All VPC subnets must be private with no internet gateway attachments
- Route53 Resolver endpoints must use at least 2 availability zones
- Security groups must follow least-privilege with explicit CIDR blocks
- Cross-account stack deployments must use CDK's cross-account capabilities
- VPC Flow Logs must capture ALL traffic, not just accepted or rejected
- All IAM roles must include external ID for cross-account trust relationships
