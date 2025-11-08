# Payment Processing Infrastructure Migration to AWS

Hey team,

We need to build a complete infrastructure migration solution for a financial services company that's moving their payment processing system from on-premises to AWS. This is a critical business system handling transaction validation and fraud detection workloads. The company has strict requirements around data isolation between their development and production environments, which makes sense given the sensitive nature of payment data.

The existing on-premises setup has served them well, but they need the scalability, reliability, and cost benefits of AWS. However, they can't compromise on security or performance during the migration. We've been asked to create this using **AWS CDK v2 with Go bindings** to give them infrastructure as code that's both type-safe and easy to maintain.

The key challenge here is setting up truly separate environments that share the same codebase but can have wildly different resource configurations. Development needs to be cost-effective for testing, while production needs to handle real financial transactions with appropriate capacity and redundancy.

## What we need to build

Create a complete payment processing infrastructure migration system using **AWS CDK v2 with Go bindings** that supports both development and production environments with different resource configurations.

### Core Requirements

1. **Reusable Stack Architecture**
   - Define a single CDK stack that accepts environment-specific parameters
   - Support easy switching between dev and prod configurations
   - Use CDK context variables for environment selection

2. **Network Infrastructure**
   - Create separate VPCs for each environment with different CIDR ranges
   - Development: 10.0.0.0/16
   - Production: 10.1.0.0/16
   - Public and private subnets across 2 availability zones for both environments

3. **Database Layer**
   - Deploy RDS PostgreSQL 14 instances with environment-specific sizing
   - Development: db.t3.small instance type
   - Production: db.r5.large instance type
   - Automated backups with 7-day retention for both environments

4. **Compute Layer**
   - Set up Lambda functions for transaction validation using Go runtime
   - Development: 512MB memory allocation
   - Production: 2048MB memory allocation
   - Environment-specific function configurations

5. **Storage Layer**
   - Configure S3 buckets with versioning enabled
   - Implement lifecycle policies for data management
   - Use naming conventions that include environment suffix for uniqueness

6. **Message Queuing**
   - Implement SQS queues with different visibility timeouts
   - Development: 30 seconds visibility timeout
   - Production: 120 seconds visibility timeout

7. **Access Management**
   - Create IAM roles with least-privilege policies
   - Environment-specific permissions
   - Secure access patterns between services

8. **Monitoring and Alerting**
   - Set up CloudWatch alarms with environment-appropriate thresholds
   - Different alert sensitivity for dev vs prod
   - Comprehensive monitoring coverage

9. **Security Controls**
   - Configure security groups allowing database access only from Lambda functions
   - Implement proper network isolation
   - Follow AWS security best practices

10. **Deployment Pipeline**
    - Configure CodePipeline for infrastructure deployment
    - Manual approval gates for production deployments
    - Automated deployment to development environment

### Technical Requirements

- All infrastructure defined using **AWS CDK v2 with Go bindings**
- Use VPC with public/private subnets across 2 availability zones
- Use RDS PostgreSQL 14 with automated backups and 7-day retention
- Use Lambda with Go runtime and environment-specific memory allocations
- Use S3 with versioning enabled and lifecycle policies
- Use SQS for message queuing with environment-specific timeouts
- Use IAM for access management with least-privilege policies
- Use CloudWatch for monitoring and alarms
- Use Security Groups for network access control
- Use CodePipeline for deployment automation
- Resource names must include environmentSuffix parameter for uniqueness
- Follow naming convention: {resource-type}-{environment-suffix}
- Deploy to us-east-1 region
- Go version 1.19 or higher
- AWS CDK version 2.100 or higher

### Constraints

- Use CDK context variables for environment-specific parameter overrides
- RDS instances must have automated backups with 7-day retention period
- Lambda functions must use Go runtime with environment-specific memory allocations
- All S3 buckets must have versioning enabled and lifecycle policies configured
- CodePipeline must include manual approval step for production deployments
- All resources must be destroyable without Retain policies
- Include proper error handling and logging throughout
- Follow AWS Well-Architected Framework best practices

## Success Criteria

- Functionality: Complete infrastructure supporting both dev and prod environments with all 10 core requirements implemented
- Performance: Appropriate resource sizing for each environment (smaller for dev, production-grade for prod)
- Reliability: Multi-AZ deployment, automated backups, proper redundancy
- Security: Network isolation, least-privilege IAM, security group restrictions, database access only from Lambda
- Resource Naming: All resources include environmentSuffix parameter with consistent naming pattern
- Code Quality: Type-safe Go code, well-tested, comprehensive documentation
- Deployability: Single codebase deploys to both environments via context switching
- Cost Optimization: Development environment uses cost-effective resources while production uses appropriate capacity

## What to deliver

- Complete AWS CDK v2 Go application with environment-aware stack
- VPC infrastructure with public/private subnets across 2 AZs
- RDS PostgreSQL 14 instances with automated backups
- Lambda functions with Go runtime and environment-specific configuration
- S3 buckets with versioning and lifecycle policies
- SQS queues with environment-specific settings
- IAM roles and policies with least-privilege access
- CloudWatch alarms and monitoring
- Security groups with proper access restrictions
- CodePipeline with manual approval for production
- Unit tests for all components
- Documentation covering deployment process and environment switching
- Instructions for using CDK context to select environments
