# Provisioning of Infrastructure Environments

CRITICAL REQUIREMENT: This task MUST be implemented using CDK with Python

Platform: cdk
Language: py
Region: us-east-1

Do not substitute or change the platform or language. All infrastructure code must be written using the specified platform and language combination.

---

## Problem Statement

Create a CDK Python program to deploy a VPC with private connectivity to AWS services using VPC endpoints. The configuration must:

1. Create a VPC with CIDR 10.0.0.0/16 and three private subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24) across different AZs
2. Deploy S3 gateway endpoint with custom route table associations
3. Deploy DynamoDB gateway endpoint with policy excluding 'logs/*' prefix
4. Create interface endpoints for EC2, SSM, SSM Messages, and EC2 Messages
5. Deploy CloudWatch Logs interface endpoint with access logging enabled
6. Configure security groups for interface endpoints allowing only port 443 inbound
7. Enable private DNS for all interface endpoints
8. Add cost allocation tags: Environment=Production, CostCenter=Finance
9. Create endpoint policies restricting access to account '123456789012'
10. Deploy Secrets Manager interface endpoint for credential retrieval
11. Output endpoint IDs and DNS names for verification

Expected output: A CDK stack that creates a fully isolated VPC with all specified VPC endpoints configured for private AWS service access, including proper security groups, endpoint policies, and DNS configuration for seamless private connectivity.

---

## Background

A financial services company needs to establish secure private connectivity between their VPC resources and AWS services without traversing the public internet. They require VPC endpoints for critical services while maintaining strict network isolation and monitoring capabilities.

## Environment Setup

AWS infrastructure in us-east-1 region requiring VPC with private subnets across 3 availability zones for endpoint deployment. Uses AWS CDK 2.x with Python 3.9+, requires AWS CLI configured with appropriate permissions. Target services include S3, DynamoDB, EC2, SSM, CloudWatch Logs, and Secrets Manager. VPC CIDR is 10.0.0.0/16 with /24 private subnets. No internet gateway or NAT gateway needed as all traffic flows through VPC endpoints. Security groups and NACLs configured for least-privilege access.

## Constraints and Requirements

- All VPC endpoints must be deployed in private subnets only
- S3 gateway endpoint must use a custom route table
- Interface endpoints must have security groups allowing only HTTPS traffic
- Enable private DNS for all interface endpoints
- Each endpoint must have resource tags for cost allocation
- Endpoint policies must restrict access to specific AWS accounts
- CloudWatch Logs endpoint must capture all endpoint access logs
- SSM endpoints must be in at least two availability zones
- DynamoDB gateway endpoint must exclude specific S3 prefixes
- All endpoints must use customer-managed KMS keys for encryption where applicable

---

## Implementation Guidelines

### Platform Requirements
- Use CDK as the IaC framework
- All code must be written in Python
- Follow CDK best practices for resource organization
- Ensure all resources use the environmentSuffix variable for naming

### Security and Compliance
- Implement encryption at rest for all data stores using AWS KMS
- Enable encryption in transit using TLS/SSL
- Follow the principle of least privilege for IAM roles and policies
- Enable logging and monitoring using CloudWatch
- Tag all resources appropriately

### Testing
- Write unit tests with good coverage
- Integration tests must validate end-to-end workflows using deployed resources
- Load test outputs from cfn-outputs/flat-outputs.json

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- Important: Secrets should be fetched from existing Secrets Manager entries, not created
- Avoid DeletionPolicy: Retain unless required

## Target Region
Deploy all resources to: us-east-1

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
