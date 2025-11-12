
Hey team,

We're building payment processing infrastructure for a fintech startup, and we need to ensure the same configuration works consistently across development, staging, and production environments. We've had a few incidents recently where configuration drift between environments caused deployment failures and security issues, so we need to get this right.

The business is asking for a single CloudFormation template that can deploy to all three environments with the appropriate sizing and configuration for each. Dev needs to be lightweight and cost-effective for rapid iteration, staging needs to be similar to prod for realistic testing, and production needs high availability and long backup retention. We're working with existing VPC infrastructure, so the template needs to reference existing resources via parameters.

## What we need to build

Create a multi-environment payment processing infrastructure using **CloudFormation with JSON** that deploys consistently across dev, staging, and production. The same template should work for all environments by accepting parameters and using Conditions to control environment-specific resources.

## Core Requirements

1. **Environment Configuration Management**
   - Accept environment type parameter (dev, staging, prod)
   - Use Mappings section to define environment-specific instance sizes, backup retention, and auto-scaling settings
   - Control RDS instance types: db.t3.micro for dev, db.t3.small for staging, db.t3.medium for prod
   - Enable Multi-AZ deployment only for staging and production using Conditions
   - Set backup retention: 1 day for dev, 7 days for staging, 30 days for prod

2. **RDS PostgreSQL Database**
   - Deploy RDS PostgreSQL instances in private subnets
   - Enable Multi-AZ only for staging and prod (Condition-based)
   - Store database passwords in AWS Secrets Manager
   - Enable encryption at rest for all environments
   - Configure CloudWatch alarms for CPU utilization with environment-specific thresholds
   - Reference existing subnets via Parameters

3. **Application Load Balancer and Auto Scaling**
   - Deploy Application Load Balancers in public subnets
   - Create target groups pointing to EC2 instances
   - Configure Auto Scaling Groups with launch templates
   - Vary instance types by environment: t3.micro for dev, t3.small for staging, t3.medium for prod
   - Reference existing VPC and security groups via Parameters

4. **S3 Static Content Storage**
   - Create S3 buckets for static content
   - Enable environment-specific versioning policies
   - Enable encryption at rest
   - Apply lifecycle policies based on environment

5. **Resource Naming and Tagging**
   - Follow naming convention: {project}-{resource-type}-{environment}-{environmentSuffix}
   - All resource names must include **environmentSuffix** parameter for uniqueness
   - Tag all resources with Environment, Project, and ManagedBy tags

6. **Security and Secrets Management**
   - Store all sensitive values like database passwords in AWS Secrets Manager
   - Reference secrets securely in RDS instances
   - Configure security groups to restrict database access to application subnets only
   - Reference existing IAM roles via Parameters

## Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use Parameters for environment-specific values and existing resource references
- Use Mappings for environment-based configuration lookup
- Use Conditions for environment-specific resource creation (Multi-AZ, etc.)
- Use Outputs to export resource identifiers for cross-stack references
- Deploy to **us-east-1** region
- Reference existing VPC (6 subnets: 3 public, 3 private across 3 AZs) via Parameters
- Reference existing IAM roles and security groups via Parameters
- Resource names must include **environmentSuffix** for uniqueness
- Follow CloudFormation naming: Use !Sub for string interpolation with ${EnvironmentSuffix}
- All resources must be destroyable (no Retain deletion policies)
- Include proper DependsOn relationships where needed

## Constraints

- Must work with existing VPC infrastructure (do not create new VPC)
- Must use JSON format (not YAML)
- All environment-specific values must be parameterized or mapped
- Database passwords must be in Secrets Manager (never hardcoded)
- Security groups must restrict RDS access to application subnets only
- Automated backups required with environment-specific retention
- No DeletionProtection or Retain policies allowed
- Must support deployment via separate parameter files (dev.json, staging.json, prod.json)

## Success Criteria

- **Functionality**: Single template deploys correctly to all three environments
- **Configuration**: Instance sizes and Multi-AZ settings match environment requirements
- **Consistency**: Same template produces expected variations based on parameters
- **Security**: Secrets in Secrets Manager, encryption enabled, proper network isolation
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Monitoring**: CloudWatch alarms configured with environment-appropriate thresholds
- **Tagging**: Environment, Project, and ManagedBy tags on all resources
- **Code Quality**: JSON, well-structured, includes parameter files

## What to deliver

- Complete CloudFormation JSON template
- Separate parameter files for each environment (dev.json, staging.json, prod.json)
- Parameters section for environment type, VPC/subnet IDs, IAM roles, environmentSuffix
- Mappings section for environment-specific instance sizes and configurations
- Conditions section for environment-specific resource creation
- RDS PostgreSQL instance with DB subnet group
- Application Load Balancer with target groups
- Auto Scaling Group with launch template
- S3 bucket with versioning and encryption
- Secrets Manager secret for database password
- CloudWatch alarms for monitoring
- Security groups (if not using existing)
- Outputs for resource ARNs and endpoints
- Well-structured JSON with logical resource organization
