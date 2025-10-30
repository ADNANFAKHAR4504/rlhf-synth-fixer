# Environment Migration

> **CRITICAL REQUIREMENT: This task MUST be implemented using CloudFormation with JSON**
>
> Platform: **cfn**
> Language: **json**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background

A financial services company needs to migrate their payment processing infrastructure from a legacy on-premises system to AWS. The existing system handles credit card transactions and must maintain PCI compliance during the migration.

## Problem Statement

Create a CloudFormation JSON template to migrate a payment processing system from on-premises to AWS cloud infrastructure. The configuration must:

1. Define separate CloudFormation stacks for staging and production environments with shared base constructs
2. Create RDS Aurora MySQL clusters with encryption enabled and automatic failover
3. Deploy Lambda functions that read database credentials from Secrets Manager
4. Set up API Gateway with request throttling and API key authentication
5. Implement SQS queues with dead letter queues for failed transaction processing
6. Configure CloudWatch alarms for RDS CPU utilization and Lambda errors
7. Create IAM roles with least-privilege policies for each service
8. Use CloudFormation parameters to manage environment-specific configuration
9. Implement stack dependencies to ensure correct deployment order

**Expected output**: A complete CloudFormation JSON template with multiple stack definitions, shared resources for common components, and environment-specific parameter files that enable seamless migration from development through staging to production environments.

## Environment Setup

Multi-environment AWS infrastructure spanning us-east-1 (production) and us-east-2 (staging) regions. Core services include:
- RDS Aurora MySQL for transaction data
- Lambda functions for payment processing logic
- API Gateway for REST endpoints
- SQS for asynchronous job processing

VPC setup requires private subnets across 3 availability zones with NAT gateways for outbound traffic. Each environment needs separate KMS keys, RDS clusters, and Lambda deployment packages.

**Required tools**:
- AWS CLI configured with appropriate credentials
- CloudFormation deployment permissions

## Constraints and Requirements

1. Use AWS CDK v2 with Go bindings exclusively
2. Implement blue-green deployment pattern for zero-downtime migration
3. All data must be encrypted at rest and in transit using AWS KMS
4. RDS instances must use Multi-AZ deployment with automated backups
5. Lambda functions must use environment-specific configurations loaded from Parameter Store
6. Network traffic between services must remain within private subnets
7. Deploy identical stacks to both staging and production environments with different parameters

---

## Implementation Guidelines

### Platform Requirements
- Use CloudFormation (cfn) as the IaC framework
- All code must be written in JSON format
- Follow CloudFormation best practices for resource organization
- Ensure all resources use the `environmentSuffix` variable for naming

### Security and Compliance
- Implement encryption at rest for all data stores using AWS KMS
- Enable encryption in transit using TLS/SSL
- Follow the principle of least privilege for IAM roles and policies
- Enable logging and monitoring using CloudWatch
- Tag all resources appropriately for PCI compliance

### Testing
- Write unit tests with good coverage
- Integration tests must validate end-to-end workflows using deployed resources
- Load test outputs from `cfn-outputs/flat-outputs.json`

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- **Important**: Secrets should be fetched from existing Secrets Manager entries, not created
- Avoid DeletionPolicy: Retain unless required

## Target Region

Deploy all resources to: **us-east-1** (production) and **us-east-2** (staging)

## AWS Services Required

Based on the problem statement, the following AWS services are mentioned:
- RDS Aurora MySQL
- Lambda
- API Gateway
- SQS
- CloudWatch
- IAM
- AWS Secrets Manager
- AWS KMS
- VPC
- Parameter Store (AWS Systems Manager)

## Success Criteria

- Infrastructure deploys successfully to both regions
- All security and compliance constraints are met (PCI compliance)
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
- Multi-AZ deployment is functional
- Blue-green deployment pattern is implemented
