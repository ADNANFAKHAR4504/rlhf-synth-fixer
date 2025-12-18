# Multi-Environment Infrastructure Deployment

Hey team,

We've got a fintech startup that's been burned by configuration drift between their environments. They've had production incidents because dev, staging, and prod weren't configured consistently. The business wants us to solve this with infrastructure as code that guarantees consistency while still allowing the right variations per environment.

I've been asked to create this using **CloudFormation with YAML**. They're running a multi-account AWS setup with separate accounts for each environment, and they want to use StackSets to deploy the same template everywhere with parameter overrides.

The core problem is maintaining identical infrastructure patterns across three environments while varying things like instance sizes, backup retention, and alarm thresholds. Right now they're manually configuring each environment which leads to drift over time.

## What we need to build

Create a multi-environment infrastructure deployment using **CloudFormation with YAML** that deploys consistently across dev, staging, and production AWS accounts.

### Core Requirements

1. **VPC Infrastructure**
   - VPC with public and private subnets across 2 availability zones
   - Environment-specific CIDR blocks: 10.0.0.0/16 (dev), 10.1.0.0/16 (staging), 10.2.0.0/16 (prod)
   - Same subnet structure but different IP ranges per environment
   - Internet Gateway for public subnets

2. **Compute Resources**
   - Application Load Balancer with identical listener rules across environments

3. **Database**
   - RDS MySQL instances with environment-specific backup retention:
     - Dev: 0 days (no backups)
     - Staging: 7 days
     - Production: 30 days
   - Multi-AZ only for production
   - Use Systems Manager Parameter Store dynamic references for database passwords

4. **Storage**
   - S3 buckets with naming pattern: {company}-{environmentSuffix}-{purpose}
   - Versioning enabled only for staging and production
   - Separate buckets for static assets and application data

5. **Serverless Functions**
   - Lambda functions for data processing with environment-specific memory:
     - Dev: 128MB
     - Staging: 256MB
     - Production: 512MB
   - Environment-specific IAM roles with least privilege

### Technical Requirements

- All infrastructure defined using **CloudFormation with YAML**
- Deploy via CloudFormation StackSets for cross-account deployment
- Use Parameters for environment-specific values
- Use Conditions to control resource properties based on environment
- Use Mappings for environment-specific configurations
- Use Systems Manager Parameter Store for secrets (database passwords)
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** parameter for uniqueness

### Deployment Requirements (CRITICAL)

- All resource names MUST include the **environmentSuffix** parameter for uniqueness across environments
- NO DeletionPolicy: Retain or DeletionPolicy: Snapshot on any resources
- NO deletion protection enabled on any resources
- All resources must be fully destroyable for testing purposes
- S3 buckets should not have deletion protection
- Resources should be designed for ephemeral test deployments

### AWS Services

- VPC with subnets, route tables, Internet Gateway
- Application Load Balancer with target groups and listeners
- EC2 instances (managed by ASG)
- RDS MySQL database
- S3 buckets for static assets and data
- Lambda functions with execution roles
- IAM roles and policies
- Systems Manager Parameter Store for secrets

### Constraints

- Use CloudFormation StackSets for cross-account deployment
- Parameter overrides for environment-specific values
- Same VPC structure, different CIDR ranges per environment
- RDS automated backups only in staging and production
- Systems Manager Parameter Store dynamic references for database passwords
- Consistent S3 bucket naming pattern: {company}-{environmentSuffix}-{purpose}
- Least privilege IAM roles per environment
- All environments must use identical resource structure

## Success Criteria

- Functionality: Single template deploys to all three environments with parameter overrides
- Consistency: Same infrastructure pattern across all environments
- Flexibility: Environment-specific variations (instance types, backup retention, thresholds) work correctly
- Security: Database passwords use Parameter Store dynamic references, IAM follows least privilege
- Resource Naming: All resources include environmentSuffix parameter
- Destroyability: All resources can be fully deleted without retain policies
- Code Quality: Clean YAML, well-structured with Parameters, Conditions, and Mappings

