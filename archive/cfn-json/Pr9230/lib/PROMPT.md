# Multi-Environment Infrastructure Deployment

Hey team,

We're working with a financial services company that's struggling with configuration drift across their development, staging, and production environments. They've been manually managing infrastructure and it's become a nightmare - what works in dev breaks in staging, prod has different configurations, and nobody's really sure what's deployed where anymore.

I need to build them a solution using **CloudFormation with JSON** that lets them deploy identical infrastructure across all three environments while still allowing environment-specific customizations for compute and storage capacity. The business wants this to be bulletproof - they're in financial services, so compliance and consistency are critical.

The tricky part is they need this to work across multiple AWS accounts with one account per environment, linked through AWS Organizations, and they want disaster recovery capability with cross-region replication to us-west-2. They've asked me specifically to use nested stacks so they can manage different infrastructure layers independently and reuse components.

## What we need to build

Create a multi-environment infrastructure orchestration system using **CloudFormation with JSON** that deploys consistent infrastructure across development, staging, and production environments.

### Core Requirements

1. **Master Template with Nested Stacks**
   - Design a master CloudFormation template that orchestrates deployments
   - Create separate nested stack templates for VPC, database, and compute resources
   - Nested stacks should be reusable across environments
   - Templates must use S3 bucket URLs for nested stack references

2. **Environment-Specific Configuration**
   - Use CloudFormation Mappings to define environment-specific values
   - Instance sizes: t3.micro for dev, t3.small for staging, t3.medium for prod
   - Lambda memory: 256MB for dev and staging, 512MB for production
   - Parameters must allow environment selection without hardcoding values
   - All infrastructure component names must include environmentSuffix parameter for uniqueness

3. **Database Infrastructure**
   - Deploy RDS Aurora PostgreSQL clusters with encryption at rest enabled
   - Configure automated backups with minimum 7-day retention
   - Set up read replicas for high availability
   - Use Aurora Serverless v2 for faster provisioning
   - Enable Multi-AZ deployment for staging and production

4. **Compute Infrastructure**
   - Configure Lambda functions for data processing workloads
   - Use environment variables for all configuration without hardcoded values
   - Implement proper IAM roles with least privilege access for specific S3 buckets and RDS resources
   - Set up VPC integration for Lambda functions

5. **Network Infrastructure**
   - Create VPCs with public and private subnets across 2 Availability Zones
   - VPC CIDR blocks must not overlap: 10.0.0.0/16 for dev, 10.1.0.0/16 for staging, 10.2.0.0/16 for prod
   - Implement VPC peering between environments with proper route tables
   - Configure security groups for inter-environment communication
   - Use CloudFormation Conditions to create NAT Gateways only for staging and production

6. **Storage and Replication**
   - Set up S3 buckets with versioning enabled
   - Configure intelligent tiering for cost optimization
   - Enable cross-region replication to us-west-2 for disaster recovery
   - Implement lifecycle policies for 30-day transitions to Glacier storage class

7. **Monitoring and Alerting**
   - Configure CloudWatch Alarms for critical metrics
   - RDS CPU utilization threshold: alert if greater than 80 percent
   - Lambda error rate: alert if greater than 10 errors per minute
   - Create SNS topics for alarm notifications
   - Set up separate SNS topics per environment

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use nested stacks for modular, reusable infrastructure components
- Implement CloudFormation StackSets for cross-region replication capability
- All infrastructure component names must include **environmentSuffix** parameter for uniqueness across parallel deployments
- Follow naming convention: resource-name-${EnvironmentSuffix}
- Deploy to **us-east-1** region as primary with disaster recovery in **us-west-2**
- All templates must be valid JSON with AWSTemplateFormatVersion: 2010-09-09

### Deployment Requirements - CRITICAL

- **environmentSuffix Parameter**: All named resources MUST use the pattern with EnvironmentSuffix to ensure uniqueness
- **Destroyability**: All resources must be cleanly destroyable without DeletionPolicy Retain or DeletionProtection flags
- **Service-Specific Constraints**:
  - DO NOT create GuardDuty detectors since they are account-level services with one per account limit
  - For AWS Config, use correct IAM policy with service-role/AWS_ConfigRole
  - For Lambda Node.js version 18 and above, use AWS SDK v3 since aws-sdk v2 not included by default
  - Use Aurora Serverless v2 for RDS to avoid slow provisioning times

### Constraints

- All resources must be tagged with Environment, Project, and CostCenter tags for cost allocation
- Use CloudFormation Conditions to control resource creation based on environment type
- RDS encryption must use AWS managed keys without customer managed KMS keys to avoid retention issues
- S3 buckets must have public access blocked by default
- IAM roles must follow least privilege principle with specific resource ARNs instead of wildcard permissions
- Lambda functions must have timeout and memory limits appropriate for their workload
- VPC endpoints should be considered for cost optimization where applicable
- All passwords and sensitive values must use CloudFormation parameters with NoEcho true property

### Success Criteria

- **Functionality**: Complete working infrastructure that deploys successfully across all three environments
- **Consistency**: Identical infrastructure topology across dev, staging, and prod with only configuration differences
- **Scalability**: Easy to add new environments by changing parameter values
- **Maintainability**: Clear separation of concerns using nested stacks
- **Monitoring**: Comprehensive CloudWatch alarms covering critical metrics
- **Security**: Encryption enabled, IAM least privilege, security groups properly configured
- **Disaster Recovery**: Cross-region replication working for critical data
- **Naming Convention**: All named resources include environmentSuffix for parallel deployment safety
- **Destroyability**: Clean stack deletion without retained resources

## What to deliver

- Complete **CloudFormation JSON** implementation with master and nested stack templates
- Master template that orchestrates VPC, database, and compute nested stacks
- VPC nested stack with subnets, route tables, NAT gateways with CloudFormation Conditions, and VPC peering
- Database nested stack with RDS Aurora PostgreSQL cluster, encryption, and backups
- Compute nested stack with Lambda functions and IAM roles
- S3 bucket configuration with cross-region replication and lifecycle policies
- CloudWatch alarms and SNS topics for monitoring
- Parameter mappings for environment-specific configurations
- Outputs section with critical resource ARNs and endpoints
- All templates must be production-ready and deployable without modifications
