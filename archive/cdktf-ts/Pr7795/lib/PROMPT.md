# Multi-Environment Infrastructure Deployment

Hey team,

We need to build a comprehensive multi-environment infrastructure platform for our financial services trading applications. I've been asked to create this using **CDKTF with TypeScript**. The business is operating across development, staging, and production environments and they're struggling with configuration drift and manual environment synchronization.

The current situation is that we have three separate AWS accounts (dev: 123456789012, staging: 234567890123, prod: 345678901234) and the team manually maintains similar infrastructure in each environment. This leads to drift, inconsistencies, and deployment failures when promoting code through environments. The trading applications are critical systems, so we need reliable, consistent infrastructure that can be validated before deployment.

What makes this challenging is that while we need identical infrastructure patterns across all three environments, each environment has specific requirements like different instance sizes, CIDR ranges, and security certificates. We also need to support cross-environment data replication from production to staging for testing purposes, while maintaining strict isolation between environments for security and compliance.

## What we need to build

Create a multi-environment infrastructure platform using **CDKTF with TypeScript** that deploys identical infrastructure patterns across development, staging, and production environments while maintaining environment-specific configurations.

### Core Infrastructure Components

1. **Networking Foundation**
   - Isolated VPCs for each environment with 3 availability zones
   - Environment-specific CIDR ranges following pattern 10.{env}.0.0/16 (1=dev, 2=staging, 3=prod)
   - Consistent subnet layouts across all environments
   - Public and private subnets in each AZ

2. **Database Infrastructure**
   - RDS Aurora PostgreSQL clusters with reusable L3 constructs
   - Environment-specific instance counts and sizes
   - Cross-environment read replicas (production to staging)
   - Aurora Serverless preferred for cost optimization

3. **Application Platform**
   - ECS Fargate services with environment-specific task definitions
   - Shared ECR repository for container images
   - Application Load Balancers with environment-specific SSL certificates
   - Target groups and health checks

4. **Storage and Configuration**
   - S3 buckets with environment-prefixed names
   - Consistent lifecycle policies across environments
   - AWS Systems Manager Parameter Store for sensitive values
   - Hierarchical parameter paths per environment

5. **Monitoring and Observability**
   - CloudWatch dashboards aggregating metrics across environments
   - Environment-specific alarm thresholds
   - Centralized logging configuration

### Technical Requirements

- All infrastructure defined using **CDKTF with TypeScript**
- Use **RDS Aurora PostgreSQL** for database clusters
- Use **ECS Fargate** for container orchestration
- Use **Application Load Balancer** for traffic distribution
- Use **S3** for static asset storage
- Use **CloudWatch** for monitoring and dashboards
- Use **AWS Certificate Manager** for SSL certificates
- Use **AWS Systems Manager Parameter Store** for configuration
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: {resource-type}-{environment}-suffix
- Deploy to **us-east-1** region

### Architecture Patterns

- Define a base CDKTF app structure with separate stacks per environment
- Create abstract stack class that all environment stacks inherit from
- Build reusable L3 constructs that accept environment-specific parameters
- Implement CDKTF validation constructs for consistency checks
- Use CDKTF context for environment-specific configuration
- Avoid hardcoding any environment-specific values

### Security and Compliance

- IAM roles with least-privilege policies
- Restrict cross-environment access at IAM level
- All resources must be destroyable (no Retain policies)
- Environment-specific SSL certificates from ACM
- Secure parameter storage for sensitive values
- Proper encryption for data at rest and in transit

### Deployment and Operations

- CDKTF pipelines that validate infrastructure before deployment
- Custom validation constructs for consistency checks
- Stack dependencies to ensure proper deployment order
- Automated drift detection capability
- Synthesis-time validation using CDKTF aspects
- Generate deployment manifest documenting all resources per environment

### Tagging Strategy

- Implement consistent tagging across all resources
- Required tags: environment, cost-center, deployment-timestamp
- Enable cost tracking and resource organization
- Support compliance and governance requirements

## Deployment Requirements (CRITICAL)

- All resource names MUST include environmentSuffix parameter
- All resources MUST be destroyable (RemovalPolicy.DESTROY, no RETAIN policies)
- Infrastructure MUST be synthesizable without errors
- CDKTF context values MUST be used for environment-specific configuration
- Custom validation MUST run at synthesis time
- Stack dependencies MUST be explicitly defined

## Success Criteria

- Functionality: Identical infrastructure deployed across all three environments with controlled environment-specific variations
- Consistency: Infrastructure validated at synthesis time to prevent drift
- Security: Least-privilege IAM policies and proper isolation between environments
- Reliability: Stack dependencies ensure proper deployment order
- Observability: Centralized monitoring with environment-specific thresholds
- Resource Naming: All resources include environmentSuffix for uniqueness
- Code Quality: TypeScript with proper typing, comprehensive tests, full documentation
- Deployability: Complete CDKTF application that synthesizes and deploys successfully

## What to deliver

- Complete CDKTF TypeScript implementation with modular stack architecture
- Abstract base stack class with environment-specific implementations
- Reusable L3 constructs for RDS Aurora, VPC, ECS, ALB, S3
- Custom validation constructs for synthesis-time checks
- Configuration management using CDKTF context and SSM Parameter Store
- IAM roles and policies for all services
- CloudWatch dashboards and alarms
- Comprehensive unit tests for all constructs and stacks
- Integration tests validating stack synthesis
- Documentation including deployment instructions and architecture overview
- Deployment manifest generation logic
