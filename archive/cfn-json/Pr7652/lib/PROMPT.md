# Payment Processing Infrastructure - Multi-Environment Deployment

Hey team,

We need to build a payment processing infrastructure system that can be deployed consistently across multiple AWS accounts for a fintech startup. They have three environments - development, staging, and production - and each needs to maintain identical configurations while allowing for environment-specific tuning like instance sizes and database capacities. I've been asked to create this using **CloudFormation with JSON**.

The business challenge here is pretty clear: they're processing payments and need to ensure their infrastructure is consistent across all environments to reduce deployment risks and configuration drift. Right now they don't have a reliable way to replicate their setup, which is causing headaches when promoting changes from dev to production.

This is a classic multi-account AWS setup using CloudFormation StackSets. Each environment lives in its own AWS account, and we need one template that works for all of them with parameterized differences.

## What we need to build

Create a payment processing infrastructure using **CloudFormation with JSON** that deploys consistently across development, staging, and production AWS accounts.

### Core Requirements

1. **Networking Infrastructure**
   - VPC with 2 public and 2 private subnets across 2 availability zones
   - NAT gateways for private subnet internet access
   - Proper routing tables and internet gateway configuration

2. **Application Load Balancing**
   - Application Load Balancer deployed in public subnets
   - Target group pointing to EC2 instances in private subnets
   - Proper health checks and listener configuration

3. **Compute Auto Scaling**
   - Auto Scaling Group with environment-specific instance types
   - Dev: t3.micro instances
   - Staging: t3.small instances
   - Production: m5.large instances
   - Launch templates with proper security groups

4. **Database Layer**
   - RDS PostgreSQL instance with environment-specific sizing
   - Dev: db.t3.small single-AZ
   - Staging: db.t3.medium single-AZ
   - Production: db.r5.large Multi-AZ
   - Encrypted storage with automated backups enabled

5. **Storage Services**
   - S3 bucket for payment logs with lifecycle policies
   - S3 bucket for transaction archives with lifecycle policies
   - Both buckets must have versioning and encryption enabled

6. **Serverless Processing**
   - Lambda functions for payment validation logic
   - Environment variables for API endpoint configuration
   - Proper IAM execution roles with least privilege

7. **Message Queuing**
   - SQS queues for asynchronous payment processing
   - Environment-specific visibility timeouts
   - Dead letter queue configuration

8. **Monitoring and Alerting**
   - CloudWatch alarms for EC2 CPU utilization
   - CloudWatch alarms for RDS CPU and memory
   - CloudWatch alarms for SQS queue depth
   - Environment-specific thresholds

9. **Parameterization**
   - Use Parameters for all environment-specific values
   - Instance types, database sizes, alarm thresholds
   - Enable parameter overrides during StackSet deployment

10. **Regional Mappings**
    - Mappings for region-specific AMI IDs
    - Environment configuration mappings
    - Support for us-east-1 region

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use CloudFormation StackSets for multi-account deployment
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Deploy to **us-east-1** region
- All resources must be destroyable (no Retain deletion policies, no DeletionProtection)
- Implement proper IAM roles with least privilege access
- Include proper error handling and logging

### Constraints

- Template must be valid CloudFormation JSON syntax
- S3 buckets require versioning and encryption enabled
- RDS instances must use encrypted storage with automated backups
- Lambda functions must use environment variables (not hardcoded values)
- Each environment deploys to a different AWS account via StackSets
- Multi-AZ only for production RDS instance
- All security groups follow least privilege principle

## Success Criteria

- **Functionality**: Template deploys successfully via StackSets to multiple accounts
- **Parameterization**: All environment-specific values controlled via Parameters
- **Consistency**: Same template works across dev, staging, and production with only parameter differences
- **Security**: Encrypted storage, least privilege IAM, secure network configuration
- **Monitoring**: CloudWatch alarms configured with appropriate thresholds
- **Resource Naming**: All resources include environmentSuffix parameter
- **Destroyability**: All resources can be cleanly deleted (no Retain policies)
- **Code Quality**: Valid JSON, well-structured, documented

## What to deliver

- Complete CloudFormation JSON template
- VPC, subnets, IGW, NAT gateways, route tables
- Application Load Balancer with target groups
- Auto Scaling Group with launch template
- RDS PostgreSQL instance
- S3 buckets with lifecycle policies
- Lambda functions with IAM roles
- SQS queues with DLQ configuration
- CloudWatch alarms
- Proper Parameters and Mappings sections
- IAM roles and policies
- Security groups
- Documentation and deployment instructions
