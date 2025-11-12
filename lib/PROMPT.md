# Multi-Region Infrastructure Deployment

Hey team,

We need to build a comprehensive multi-region infrastructure deployment system for a financial services company. I've been asked to create this using **CDKTF with Python**. The business is running trading platforms across three geographic regions and needs to ensure identical infrastructure configurations while maintaining data residency compliance for each region.

The company currently faces challenges with configuration drift between their regional deployments and needs a robust solution that allows them to deploy identical infrastructure patterns while supporting region-specific customizations like encryption keys and certificates. They're dealing with strict regulatory requirements and need to demonstrate infrastructure consistency across all regions.

## What we need to build

Create a multi-region infrastructure deployment system using **CDKTF with Python** that provisions identical infrastructure across three AWS regions with environment-specific variations. This needs to support a financial services trading platform with strict data residency and compliance requirements.

### Core Requirements

1. **Module Structure**
   - Define a reusable module structure that accepts region-specific parameters
   - Support CIDR blocks, KMS key ARNs, and ACM certificate ARNs as inputs
   - Enable module invocation three times for three different regions

2. **Network Infrastructure**
   - Create VPCs in us-east-1, us-east-1, and us-east-2 regions
   - Use non-overlapping CIDR ranges: 10.0.0.0/16, 10.1.0.0/16, 10.2.0.0/16
   - Deploy 3 private and 3 public subnets per region
   - Ensure VPC CIDR blocks do not overlap between regions

3. **Database Layer**
   - Deploy RDS Aurora MySQL clusters in each region
   - Configure automated backups with encrypted snapshots
   - Set up cross-region read replicas for disaster recovery
   - Enable point-in-time recovery for all database instances

4. **Serverless Compute**
   - Set up Lambda functions that process data from regional S3 buckets
   - Configure region-specific IAM roles for Lambda execution
   - Use environment-specific IAM permissions following least privilege

5. **API Layer**
   - Configure API Gateway endpoints in each region
   - Set up custom domains using region-specific ACM certificates
   - Use data sources to reference existing Route53 hosted zones

6. **Global State Management**
   - Implement DynamoDB global tables for session state management
   - Enable replication across all three regions
   - Configure point-in-time recovery for all DynamoDB tables

7. **Environment Management**
   - Use Terraform workspaces to manage dev, staging, and prod environments
   - Support environment separation within each region
   - Enable workspace-based configuration switching

8. **Storage Layer**
   - Create S3 buckets for static content in each region
   - Apply region-specific KMS encryption keys for data at rest
   - Configure lifecycle policies for cost optimization
   - Use AES256 encryption with region-specific KMS keys

9. **Monitoring and Alerting**
   - Configure CloudWatch alarms to detect infrastructure drift between regions
   - Alert on configuration inconsistencies
   - Implement logging for all critical resources

10. **Validation and Safety**
    - Implement variable validation to prevent CIDR overlap
    - Ensure required tags are present on all resources
    - Validate region-specific parameter consistency

11. **State Management**
    - Use terraform_remote_state data sources to share outputs between regional deployments
    - Configure S3 backend for state storage
    - Implement DynamoDB state locking to prevent concurrent modifications

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use AWS provider for resource provisioning
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environment-suffix}`
- Deploy to us-east-1, us-east-1, and us-east-2 regions (primary region: ap-southeast-1)
- Use Python for all infrastructure code and stack definitions
- Main entry point: tap.py
- Stack definition: lib/tap_stack.py

### AWS Services

- VPC (Virtual Private Cloud)
- RDS Aurora MySQL
- Lambda
- S3 (Simple Storage Service)
- API Gateway
- DynamoDB (with Global Tables)
- KMS (Key Management Service)
- IAM (Identity and Access Management)
- CloudWatch
- ACM (AWS Certificate Manager)
- Route53

### Constraints

- RDS instances must use encrypted snapshots for cross-region replication
- VPC CIDR blocks must not overlap between regions
- All S3 buckets must use AES256 encryption with region-specific KMS keys
- Lambda functions must use environment-specific IAM roles
- DynamoDB tables must have point-in-time recovery enabled
- API Gateway custom domains must use region-specific ACM certificates
- All resources must be tagged with Environment, Region, and CostCenter
- All resources must be destroyable for CI/CD workflows (no Retain policies)
- Use data sources to reference existing Route53 hosted zones
- Implement remote state locking with DynamoDB
- Follow principle of least privilege for all IAM roles
- Enable appropriate logging and monitoring for compliance

## Success Criteria

- **Functionality**: Successfully deploys identical infrastructure across three AWS regions with region-specific customizations
- **Performance**: Supports cross-region replication with minimal latency for global state management
- **Reliability**: Includes automated backups, point-in-time recovery, and disaster recovery mechanisms
- **Security**: Implements encryption at rest and in transit, follows least privilege IAM principles
- **Consistency**: Zero configuration drift between regional deployments as monitored by CloudWatch
- **Resource Naming**: All resources include environmentSuffix following naming convention
- **Environment Management**: Successfully separates dev, staging, and prod using Terraform workspaces
- **Code Quality**: Python code is well-structured, modular, tested, and documented

## What to deliver

- Complete CDKTF Python implementation with modular structure
- Main entry point (tap.py) that orchestrates multi-region deployment
- Stack definition (lib/tap_stack.py) with region-specific module invocations
- VPC configuration with non-overlapping CIDR ranges
- RDS Aurora MySQL clusters with cross-region read replicas
- Lambda functions with regional S3 bucket integration
- API Gateway with custom domain configuration
- DynamoDB global tables for session management
- S3 buckets with KMS encryption and lifecycle policies
- CloudWatch alarms for drift detection
- IAM roles and policies following least privilege
- Variable validation logic for CIDR overlap prevention
- Terraform workspace configuration for environment management
- Remote state configuration with S3 backend and DynamoDB locking
- Documentation covering deployment process and architecture
- Unit tests for infrastructure components
