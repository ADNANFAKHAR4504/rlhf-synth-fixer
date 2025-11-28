# Task: VPC with Dual-Stack Networking and Security Controls

## Background
Your organization is migrating a legacy on-premises application to AWS and requires a production-grade network foundation. The application consists of web servers, application servers, and database servers that must be isolated in separate network tiers with strict security boundaries. The infrastructure must support both IPv4 and IPv6 traffic while maintaining compliance with corporate security policies.

## Problem Statement
Create a CloudFormation template to deploy a production VPC with dual-stack networking. The configuration must:
1. Create a VPC with both IPv4 (10.0.0.0/16) and auto-assigned IPv6 CIDR blocks
2. Deploy 6 subnets across 3 AZs - one public and one private subnet per AZ
3. Configure Internet Gateway with proper route table associations for public subnets
4. Deploy NAT Gateways in each public subnet with Elastic IPs for redundancy
5. Create separate route tables for public and private subnets with appropriate routes
6. Enable VPC Flow Logs with CloudWatch Logs destination and required IAM role
7. Implement custom Network ACLs with explicit ingress/egress rules for security
8. Apply consistent tagging schema across all resources for cost tracking
9. Use intrinsic functions for dynamic resource naming and cross-references
10. Configure all resources with DeletionPolicy: Delete for environment cleanup

## Constraints
- VPC must use CIDR block 10.0.0.0/16 for IPv4 and auto-assign IPv6 CIDR
- Each availability zone must have exactly one public and one private subnet
- Public subnets must use /24 CIDR blocks starting from 10.0.1.0
- Private subnets must use /24 CIDR blocks starting from 10.0.11.0
- NAT Gateways must be deployed in each AZ for high availability
- All route tables must have explicit names following pattern: {vpc-name}-{subnet-type}-rt-{az}
- Network ACLs must deny all traffic by default except explicitly allowed rules
- VPC Flow Logs must be enabled and sent to CloudWatch Logs with 7-day retention
- All resources must have DeletionPolicy set to Delete for clean teardown
- Tags must include Environment, Owner, and CostCenter on all resources

## Expected Deliverables
1. CloudFormation template (JSON format) with all required resources
2. Comprehensive test suite with 100% code coverage
3. Integration tests that validate all deployed resources
4. Documentation of implementation decisions and trade-offs
