Hey team,

We need to build a robust multi-environment infrastructure management system for our trading platform. The business is concerned about configuration drift and inconsistencies across our dev, staging, and production environments, which has led to several deployment issues and compliance concerns. I've been asked to create this using TypeScript with Pulumi to ensure type safety and reusable infrastructure components.

The trading platform team wants a single codebase that can deploy identical infrastructure patterns across all three environments while maintaining environment-specific configurations. They need clear visibility into what's different between environments and mechanisms to detect when actual infrastructure drifts from the desired state. This is critical for passing our upcoming SOC 2 audit.

Our current approach involves separate CloudFormation templates per environment, which has become unmaintainable. The business wants us to leverage Pulumi's ComponentResource pattern to create reusable building blocks and use proper configuration management to handle environment-specific settings. The solution needs to be production-ready with comprehensive testing and documentation.

## What we need to build

Create a multi-environment infrastructure management system using **Pulumi with TypeScript** for a trading platform that ensures consistency across dev, staging, and production environments while supporting environment-specific configurations.

### Core Requirements

1. Reusable Infrastructure Components
   - Define base infrastructure template using Pulumi ComponentResource classes for VPC, ECS cluster, and RDS database
   - Each component must be independently testable and reusable across environments
   - Components should accept configuration objects with TypeScript interfaces for type safety

2. Multi-Environment Configuration Management
   - Implement environment-specific configuration using Pulumi config files with TypeScript interfaces
   - Create separate config files for dev, staging, and prod environments
   - Configuration must include region settings, instance sizes, scaling parameters, and resource tags

3. VPC Infrastructure
   - Create VPCs in different regions with identical CIDR schemes but environment-specific tags
   - VPCs must include public and private subnets across multiple availability zones
   - Implement proper route tables, internet gateways, and NAT gateways

4. Container Orchestration
   - Deploy ECS Fargate services with environment-specific container counts: dev (1 task), staging (2 tasks), prod (4 tasks)
   - Configure proper task definitions with environment-specific CPU and memory allocations
   - Implement auto-scaling policies for staging and production environments

5. Database Infrastructure
   - Set up RDS Aurora clusters with environment-specific instance classes: dev (db.t3.medium), staging (db.r5.large), prod (db.r5.xlarge)
   - Use Aurora Serverless v2 where appropriate for cost optimization
   - Configure automated backups and retention policies per environment
   - All database resources must be destroyable for testing purposes

6. Load Balancing and SSL
   - Configure Application Load Balancers with environment-specific SSL certificates from ACM
   - Implement proper health checks and target group configurations
   - Set up listener rules for routing traffic to ECS services

7. Cross-Stack Integration
   - Implement cross-stack references to share VPC and security group IDs between stacks
   - Use Pulumi StackReference to access outputs from other stacks
   - Ensure proper dependency management between infrastructure components

8. Storage Configuration
   - Create S3 buckets with environment-specific lifecycle policies and encryption settings
   - Implement versioning and object lock policies for production
   - Configure bucket policies with proper access controls

9. Monitoring and Observability
   - Set up CloudWatch dashboards that aggregate metrics across all environments
   - Create unified views showing performance metrics from all three environments
   - Implement custom metrics and alarms for critical resources

10. Drift Detection
    - Implement a drift detection mechanism that compares actual vs desired state across environments
    - Create automated checks that run periodically to identify configuration drift
    - Generate reports highlighting differences between actual and expected configurations

11. IAM Configuration
    - Configure IAM roles with environment-specific trust policies and permission boundaries
    - Implement least privilege access patterns
    - Create separate service roles for ECS tasks, RDS, and Lambda functions

12. Configuration Reporting
    - Output a comparison report showing configuration differences between environments
    - Generate comprehensive documentation of deployed resources per environment
    - Create visual reports showing resource counts and configurations across environments

### Technical Requirements

- All infrastructure defined using Pulumi with TypeScript
- Use AWS SDK v2 for Pulumi (@pulumi/aws version 5.x or 6.x)
- Use AWS services: VPC, ECS Fargate, RDS Aurora, ALB, ACM, S3, CloudWatch, IAM
- Resource names must include environmentSuffix for uniqueness across environments
- Follow naming convention: resource-type-environment-suffix
- Deploy to us-east-1 region (configurable per environment)
- Use Pulumi ComponentResource for all reusable infrastructure patterns
- Implement proper TypeScript interfaces for all configuration objects
- All configuration values must be externalized using Pulumi config

### Deployment Requirements (CRITICAL)

- All resources must be destroyable - NO retainOnDelete or Retain policies
- RDS instances must use DeletionPolicy: Delete for test environments
- S3 buckets must be force-destroyable (including objects)
- Resource names MUST include environmentSuffix parameter to ensure uniqueness
- Use format: resource-type-${environmentSuffix} for all resource names
- Aurora clusters should use Serverless v2 for cost optimization in dev/staging
- Avoid slow-provisioning resources like NAT Gateways where possible
- Lambda functions using Node.js 18+ must include AWS SDK v3 in dependencies

### Constraints

- Solution must support deployment to three separate environments without code changes
- Configuration drift must be detectable within 5 minutes
- All resources must be tagged with environment, owner, and cost-center tags
- Infrastructure must be deployable and destroyable within 30 minutes
- No hardcoded values - all environment-specific settings in config files
- Must support both same-region and cross-region deployments
- All sensitive data (passwords, keys) must use AWS Secrets Manager
- Components must be independently unit-testable

## Success Criteria

- Functionality: Successfully deploy identical infrastructure patterns to all three environments with environment-specific configurations
- Performance: Complete deployment of full stack within 30 minutes per environment
- Reliability: Automated drift detection identifies configuration changes within 5 minutes
- Security: All IAM roles follow least privilege, all data encrypted at rest and in transit
- Resource Naming: All resources include environmentSuffix for uniqueness
- Code Quality: TypeScript with strict type checking, comprehensive unit tests, 80%+ coverage
- Maintainability: Single codebase manages all environments, configuration externalized
- Documentation: Complete deployment instructions, architecture diagrams, configuration guide

## What to deliver

- Complete Pulumi TypeScript implementation with ComponentResource pattern
- VPC, ECS Fargate, RDS Aurora, ALB, ACM, S3, CloudWatch, IAM configurations
- Three Pulumi config files: Pulumi.dev.yaml, Pulumi.staging.yaml, Pulumi.prod.yaml
- Drift detection mechanism with automated reporting
- Cross-stack reference implementation using StackReference
- Unit tests for all ComponentResource classes
- Integration tests for multi-environment deployment
- README with deployment instructions and architecture overview
- Configuration comparison report generator
- Complete documentation of all environment-specific settings
