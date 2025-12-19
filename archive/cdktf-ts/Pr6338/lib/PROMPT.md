# Multi-Environment Infrastructure Deployment

Hey team,

We need to build a multi-environment infrastructure deployment system for our financial services trading applications. The business wants to ensure identical infrastructure configurations across development, staging, and production environments while maintaining environment-specific parameters like instance sizes and database credentials. Currently, the team struggles with configuration drift and manual environment synchronization, which is causing issues with consistency and reliability.

We have a single AWS account in the us-east-1 region where we need to deploy three isolated environments (dev, staging, and prod). Each environment needs isolated VPCs with 3 availability zones, RDS Aurora PostgreSQL clusters, ECS Fargate services, Application Load Balancers, and S3 buckets for static assets. The infrastructure should be managed using **CDKTF with TypeScript** to leverage the power of both Terraform's state management and TypeScript's type safety.

The challenge is to create a system where we can deploy consistent infrastructure across all three environments within a single AWS account while allowing controlled variations for environment-specific requirements like database instance sizes, ECS task counts, and alarm thresholds.

## What we need to build

Create a multi-environment infrastructure deployment system using **CDKTF with TypeScript** that manages AWS resources for development, staging, and production environments within a single AWS account.

### Core Requirements

1. **Base CDKTF Application Structure**
   - Separate stacks for each environment (dev, staging, prod)
   - Common abstract stack class that all environments inherit from
   - Environment-specific configuration management

2. **Reusable L3 Constructs**
   - Custom RDS Aurora cluster construct accepting environment-specific parameters
   - Parameters: instance count, instance size, backup retention
   - Should be reusable across all environments

3. **VPC Configuration**
   - Consistent subnet layouts across all environments
   - Environment-specific CIDR ranges: 10.{env}.0.0/16
   - dev=1 (10.1.0.0/16), staging=2 (10.2.0.0/16), prod=3 (10.3.0.0/16)
   - 3 availability zones per environment
   - Public and private subnets

4. **ECS Fargate Services**
   - Environment-specific task definitions
   - Pull container images from shared ECR repository
   - Variable task counts based on environment
   - Auto-scaling configurations

5. **Application Load Balancers**
   - Environment-specific SSL certificates from ACM
   - Health checks and routing rules
   - Integration with ECS services

6. **S3 Buckets**
   - Environment-prefixed names for static assets
   - Consistent lifecycle policies across environments
   - Proper encryption and access controls

7. **IAM Roles and Policies**
   - Least-privilege policies for ECS tasks
   - Cross-environment access restrictions
   - Service-specific roles

8. **RDS Aurora Read Replicas**
   - Production database can replicate to staging environment
   - Read replica setup within the same account across different environments
   - For testing with production-like data

9. **CloudWatch Dashboards**
   - Aggregate metrics across all environments
   - Environment-specific alarm thresholds
   - Centralized monitoring

10. **CDK Pipelines**
    - Validate infrastructure consistency before deployment
    - Custom validation constructs
    - Automated deployment workflows

11. **Configuration Management**
    - CDKTF context values for environment-specific settings
    - SSM parameters for sensitive values
    - Hierarchical parameter paths by environment

12. **Deployment Manifest**
    - Document all resources created per environment
    - Configuration tracking
    - Resource inventory

### Technical Requirements

- All infrastructure defined using **CDKTF with TypeScript**
- Use **RDS Aurora PostgreSQL** for database clusters
- Use **ECS Fargate** for container orchestration
- Use **Application Load Balancer** for traffic distribution
- Use **S3** for static asset storage
- Use **CloudWatch** for monitoring and alarms
- Use **ACM** for SSL certificate management
- Use **ECR** for container image storage
- Use **SSM Parameter Store** for configuration values
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environment}-{suffix}` or `{resource-type}-{environmentSuffix}`
- Deploy to **us-east-1** region
- VPC CIDR pattern: 10.{env}.0.0/16 where env is 1 for dev, 2 for staging, 3 for prod
- Single account deployment with multiple isolated environments

### Constraints

- Use CDKTF stack dependencies for proper deployment order
- Use CDKTF custom resources to verify environment parity post-deployment
- Use CDKTF context values for environment-specific configuration (no hardcoding)
- Implement automated drift detection using cdktf diff in deployment pipeline
- Configure read replicas between environments (e.g., production to staging) within the same account
- Each environment must have isolated VPCs with consistent CIDR block patterns to prevent conflicts
- Environment configurations must be validated at synthesis time using CDKTF aspects
- Implement tagging strategy: environment, cost center, deployment timestamp
- Use AWS Systems Manager Parameter Store for sensitive values with hierarchical paths
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging
- Follow AWS Well-Architected Framework best practices

## Success Criteria

- **Functionality**: All three environments deploy successfully within the same account with identical infrastructure patterns
- **Configuration**: Environment-specific values properly managed through CDKTF context and SSM
- **Security**: IAM roles follow least-privilege principle with proper environment isolation
- **Monitoring**: CloudWatch dashboards aggregate metrics with environment-specific thresholds
- **Database**: Production data can replicate to staging read replica within the same account
- **Resource Naming**: All resources include environmentSuffix for uniqueness to avoid conflicts
- **Validation**: Custom validation constructs verify environment parity
- **Code Quality**: Clean TypeScript code, well-structured, properly typed
- **Deployability**: Infrastructure can be synthesized and deployed without errors

## What to deliver

- Complete CDKTF TypeScript implementation
- Base abstract stack class for common infrastructure
- Environment-specific stack implementations (dev, staging, prod)
- Reusable L3 construct for RDS Aurora clusters
- VPC configurations with environment-specific CIDR ranges
- ECS Fargate service definitions with task specifications
- Application Load Balancer configurations with ACM certificates
- S3 bucket definitions with lifecycle policies
- IAM roles and policies with least-privilege access
- RDS Aurora read replica configuration from prod to staging
- CloudWatch dashboard definitions with environment-specific alarms
- Configuration management using CDKTF context and SSM parameters
- Custom validation constructs for environment parity checks
- Unit tests for all infrastructure components
- Documentation including deployment instructions and architecture overview
