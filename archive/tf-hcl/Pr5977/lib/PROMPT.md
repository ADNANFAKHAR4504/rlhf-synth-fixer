# Provisioning of Infrastructure Environments

Important note: This task needs to be implemented using Terraform with HCL. The platform is tf, the language is hcl, and the region is us-east-1. Please don't substitute or change the platform or language - all infrastructure code should be written using Terraform HCL.

---

## Background
A fintech startup needs to establish their initial AWS infrastructure for a payment processing application. The company requires a secure, compliant environment that separates development and production workloads while maintaining cost efficiency during their growth phase.

## Problem Statement
Create a Terraform configuration to establish a multi-environment AWS infrastructure for a payment processing platform. The configuration must: 

1. Define separate VPCs for development (10.0.0.0/16) and production (172.16.0.0/16) environments with 3 availability zones each. 
2. Create RDS Aurora PostgreSQL clusters in private subnets with automated backups and point-in-time recovery enabled. 
3. Deploy Lambda functions for payment validation and transaction processing with environment-specific configurations. 
4. Set up API Gateway REST APIs with request validation and throttling limits (dev: 100 req/sec, prod: 1000 req/sec). 
5. Configure S3 buckets for storing transaction logs and customer documents with cross-region replication for production. 
6. Implement CloudWatch dashboards showing API latency, Lambda errors, and RDS connection metrics. 
7. Create SNS topics for alerting on failed transactions and system errors with email subscriptions. 
8. Set up VPC endpoints for S3, DynamoDB, and Lambda to avoid internet gateway costs. 
9. Define IAM policies that allow Lambda functions to access only their designated S3 buckets and RDS clusters. 
10. Configure AWS WAF rules on API Gateway to block common attack patterns. 

Expected output: A modular Terraform configuration with separate files for networking, compute, storage, and monitoring resources. Variables should control environment-specific settings, and outputs should include API endpoints, RDS endpoints, and S3 bucket names for application configuration.

## Constraints and Requirements
- Use only Terraform 1.5 or higher with AWS provider version 5.x
- All resources must be tagged with Environment, Project, and Owner tags
- VPC CIDR blocks must not overlap between environments
- S3 buckets must have versioning enabled and lifecycle policies configured
- RDS instances must use encrypted storage with customer-managed KMS keys
- Lambda functions must run in private subnets with VPC endpoints for AWS services
- API Gateway must use custom domain names with ACM certificates
- CloudWatch log groups must have retention policies of 30 days
- IAM roles must follow least privilege principle with explicit deny statements

## Environment Setup
Multi-environment AWS infrastructure spanning us-east-1 and us-east-2 regions for production and development respectively. Core services include VPC with public/private subnets across 3 AZs, RDS Aurora PostgreSQL clusters, Lambda functions for payment processing, API Gateway for REST endpoints, S3 for document storage, and CloudWatch for monitoring. Requires Terraform 1.5+, AWS CLI configured with appropriate credentials, and git for version control. Network architecture includes NAT gateways for private subnet internet access and VPC peering between environments.

---

## Implementation Guidelines

### Platform Requirements
- Use Terraform as the IaC framework
- All code must be written in HCL
- Follow Terraform best practices for resource organization
- Ensure all resources use the `environmentSuffix` variable for naming

### Security and Compliance
- Implement encryption at rest for all data stores using AWS KMS
- Enable encryption in transit using TLS/SSL
- Follow the principle of least privilege for IAM roles and policies
- Enable logging and monitoring using CloudWatch
- Tag all resources appropriately

### Testing
- Write unit tests with good coverage
- Integration tests must validate end-to-end workflows using deployed resources
- Load test outputs from `cfn-outputs/flat-outputs.json`

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- **Important**: Secrets should be fetched from existing Secrets Manager entries, not created
- Avoid DeletionPolicy: Retain unless required

## Target Region
Deploy all resources to: **us-east-1**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
