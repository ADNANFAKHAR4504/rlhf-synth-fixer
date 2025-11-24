# Multi-Environment Payment Processing Infrastructure

Hey team,

We've got a challenging situation here. Our financial services client is dealing with configuration drift issues that are causing real problems in their payment processing systems. Manual changes keep getting made in production that don't make it back to dev and staging, and it's creating testing failures and deployment risks. We need to build a rock-solid solution that ensures their infrastructure is completely consistent across all three environments.

The business is asking us to create this using **Pulumi with Python**. They want a single codebase that can deploy identical infrastructure patterns to dev, staging, and production, with each environment having its own appropriate configurations. The key here is preventing drift while maintaining flexibility for environment-specific settings.

This is a multi-account setup spanning three AWS accounts, all in us-east-1. Each environment needs its own isolated VPC, Lambda functions for payment processing, DynamoDB tables for transactions, and S3 buckets for audit logs. But here's the critical part - they need to be able to deploy to any environment with a single command, and every resource needs to be tracked for compliance.

## What we need to build

Create a payment processing infrastructure system using **Pulumi with Python** that deploys consistently across three environments (dev, staging, production) while supporting environment-specific configurations.

### Core Requirements

1. **Reusable Infrastructure Components**
   - Define reusable Pulumi constructs for the payment processing stack
   - Accept environment-specific parameters for configuration overrides
   - Support instantiation for dev, staging, and prod environments

2. **Lambda Functions**
   - Payment processing functions with ARM64 architecture for cost optimization
   - Environment-specific memory allocation: dev (512MB), staging (1024MB), prod (2048MB)
   - Proper IAM roles with least-privilege access

3. **DynamoDB Tables**
   - Transaction storage with environment-specific capacity modes
   - Dev environment: on-demand capacity
   - Staging and prod: provisioned capacity with appropriate settings
   - Point-in-time recovery enabled ONLY in production
   - Multi-AZ redundancy for production

4. **S3 Buckets**
   - Audit log storage with environment-specific lifecycle policies
   - Dev: 30-day log retention
   - Staging: 90-day log retention
   - Production: 365-day log retention

5. **Network Infrastructure**
   - Isolated VPCs for each environment with proper segmentation
   - 2 public subnets and 2 private subnets per environment
   - Appropriate route tables, internet gateway, and NAT gateway configuration

6. **CloudWatch Monitoring**
   - Environment-specific alarm thresholds for Lambda errors
   - DynamoDB throttling alarms with appropriate thresholds per environment
   - Proper alarm actions and notifications

7. **Deployment Automation**
   - Deployment script targeting specific environments using Pulumi stack context
   - Environment selection via command-line parameters
   - Single-command deployment capability

8. **Compliance Tracking**
   - Generate JSON manifest file for each environment
   - List all deployed resources and their configurations
   - Export inventory using Pulumi outputs

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **VPC** for network isolation across environments
- Use **Lambda** (ARM64 architecture) for payment processing functions
- Use **DynamoDB** for transaction storage with appropriate capacity modes
- Use **S3** for audit logs with lifecycle policies
- Use **IAM** for roles and least-privilege policies
- Use **CloudWatch** for monitoring and alarms
- Resource names must include **environmentSuffix** for uniqueness across environments
- Follow naming convention: `{resource-type}-{environment}-suffix`
- Deploy to **us-east-1** region
- Support three AWS accounts:
  - Development: Account ID 123456789012
  - Staging: Account ID 234567890123
  - Production: Account ID 345678901234

### Deployment Requirements (CRITICAL)

- All resources must be **destroyable** (no Retain policies or DeletionPolicy: Retain)
- Use RemovalPolicy.DESTROY or equivalent for all resources
- Lambda functions must be deletable without manual intervention
- S3 buckets must allow destruction (set appropriate deletion policies)
- DynamoDB tables must be destroyable
- VPC components must be cleanly removable
- **FORBIDDEN**: Do not use RetainOnDelete, Retain, or similar preservation policies

### Constraints

- Use Pulumi constructs (ComponentResource) to define reusable components that can be instantiated for each environment
- Implement environment-specific parameter overrides using Pulumi config or stack context values
- All Lambda functions MUST use ARM64 architecture for cost optimization
- DynamoDB tables must have point-in-time recovery enabled ONLY in production
- IAM roles must restrict cross-environment access with proper boundary policies
- Implement comprehensive tagging strategy including Environment, CostCenter, and DataClassification tags
- Each environment must maintain network isolation while sharing common infrastructure patterns
- Include proper error handling and validation in all components
- Generate environment inventory files using Pulumi outputs for compliance tracking

## Success Criteria

- **Functionality**: Deploy identical infrastructure patterns to all three environments with environment-specific configurations
- **Reusability**: Single codebase supports dev, staging, and prod deployments
- **Configuration**: Environment-specific memory, capacity, retention, and threshold settings applied correctly
- **Security**: IAM roles enforce least-privilege and prevent cross-environment access
- **Monitoring**: CloudWatch alarms configured with appropriate environment-specific thresholds
- **Compliance**: JSON manifest generated for each environment listing all resources
- **Deployment**: Single-command deployment to any environment via Pulumi stack selection
- **Resource Naming**: All resources include environmentSuffix for proper identification
- **Destroyability**: All resources can be cleanly destroyed without manual intervention
- **Code Quality**: Modular Pulumi Python code, well-structured, documented, includes deployment scripts

## What to deliver

- Complete **Pulumi with Python** implementation using ComponentResource patterns
- VPC infrastructure with isolated networks per environment
- Lambda functions (ARM64) with environment-specific memory configurations
- DynamoDB tables with appropriate capacity modes and PITR for production only
- S3 buckets with environment-specific lifecycle policies
- IAM roles and policies with least-privilege access
- CloudWatch alarms with environment-specific thresholds
- Deployment script for targeting specific environments
- JSON manifest generation for compliance tracking
- Comprehensive documentation including setup and deployment instructions
- Unit tests for component validation
