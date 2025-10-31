# Multi-Environment Payment Processing Infrastructure

Hey team,

We need to build a payment processing infrastructure that can be consistently replicated across three environments for a fintech startup. They're struggling with configuration drift between dev, staging, and production, and want a single source of truth that can deploy identical architectures with just environment-specific sizing and naming differences. I've been asked to create this using **AWS CloudFormation with YAML**.

The business requirement is clear: one master template that accepts an environment parameter and deploys the same payment processing stack across all three environments. The architecture needs to be production-grade with proper isolation, security, and monitoring, but sized appropriately for each environment to control costs.

This is a critical system handling payment transactions, so we need high availability, automated backups, proper logging, and monitoring with environment-specific thresholds. The infrastructure includes VPCs with full networking setup, Aurora MySQL for data persistence, ECS Fargate for containerized services, load balancing, and S3 for transaction logs with cross-region replication.

## What we need to build

Create a multi-environment payment processing infrastructure using **AWS CloudFormation with YAML** that deploys consistent architecture across development, staging, and production environments with environment-specific configurations.

### Core Requirements

1. **Environment Parameterization**
   - Master template with Environment parameter accepting dev, staging, or prod values
   - Environment-specific resource sizing controlled by conditions
   - Consistent naming convention: {EnvironmentName}-{ResourceType}-{Property}
   - All resource names must include **environmentSuffix** parameter for uniqueness

2. **Network Infrastructure**
   - VPC with environment-specific CIDR ranges:
     - Production: 10.0.0.0/16
     - Staging: 10.1.0.0/16
     - Development: 10.2.0.0/16
   - Public and private subnets across 2 availability zones per environment
   - Internet Gateway for public subnets
   - NAT Gateways for private subnet internet access
   - Appropriate route tables for subnet routing

3. **Database Layer**
   - RDS Aurora MySQL cluster with environment-appropriate instance classes:
     - Production: db.r5.large
     - Staging/Dev: db.t3.medium
   - Multi-AZ deployment for high availability
   - Automated snapshots with environment-specific retention:
     - Production: 30 days
     - Other environments: 7 days
   - Encrypted storage using KMS
   - DB subnet group across private subnets

4. **Container Services**
   - ECS cluster for each environment
   - Fargate services running payment API containers
   - Task definitions with environment-specific capacity settings
   - Service auto-scaling based on environment
   - Integration with Application Load Balancer

5. **Load Balancing**
   - Application Load Balancer in public subnets
   - HTTPS listener with SSL certificate
   - Target groups for ECS services
   - Health checks configured for payment API
   - Environment-specific domain routing

6. **Storage and Logging**
   - S3 buckets for transaction logs with environment prefix
   - Cross-region replication from production to staging and development
   - Versioning enabled on all buckets
   - Encryption at rest using S3-managed keys
   - Lifecycle policies for log retention

7. **Monitoring and Alerting**
   - CloudWatch alarms with environment-specific thresholds:
     - CPU utilization monitoring for ECS tasks
     - Memory utilization tracking
     - Database connection count alerts
     - Different thresholds for prod vs non-prod environments
   - CloudWatch log groups for application logs
   - SNS topics for alarm notifications

8. **Security Configuration**
   - Security groups with least-privilege access
   - Allow inter-environment communication through specific ports only
   - Database security group allowing access only from ECS tasks
   - ALB security group for HTTPS traffic
   - No public access to database or ECS tasks

9. **Backup and Disaster Recovery**
   - Automated RDS snapshots
   - Production database snapshots copied to lower environments weekly
   - S3 bucket replication for transaction logs
   - Point-in-time recovery enabled for Aurora

10. **Stack Outputs**
    - Application Load Balancer DNS names
    - Database cluster endpoints and reader endpoints
    - S3 bucket names for transaction logs
    - ECS cluster names
    - VPC IDs and subnet IDs

### Technical Requirements

- All infrastructure defined using **AWS CloudFormation with YAML**
- Use **AWS VPC** for network isolation
- Use **RDS Aurora MySQL** for database
- Use **ECS Fargate** for containerized workloads
- Use **Application Load Balancer** for traffic distribution
- Use **S3** for transaction log storage
- Use **CloudWatch** for monitoring and logging
- Use **KMS** for encryption key management
- Use **SNS** for notifications
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: `{resource-type}-${environmentSuffix}`
- Deploy production to **eu-west-1** region
- Deploy staging to **eu-west-2** region
- Deploy development to **eu-central-1** region
- Single template deployable across all regions

### Constraints

- All environments must use identical resource configurations except for instance sizes and capacity
- Each environment must have isolated VPC with non-overlapping CIDR ranges
- Database snapshots from production must be automatically copied to lower environments
- S3 bucket names must include environment prefix to prevent naming conflicts
- No hardcoded values - use parameters and mappings for environment-specific settings
- All resources must be destroyable (no Retain deletion policies)
- Include proper error handling and validation for parameters
- Use CloudFormation conditions for environment-specific logic
- Security groups must enforce strict access control between environments

## Success Criteria

- Functionality: Single template successfully deploys to all three environments with appropriate configurations
- Performance: Resources sized correctly per environment without over-provisioning
- Reliability: High availability across multiple AZs with automated failover
- Security: Proper isolation, encryption, and least-privilege access controls
- Resource Naming: All resources include environmentSuffix parameter
- Code Quality: Valid CloudFormation YAML, well-structured, properly documented
- Consistency: Identical architecture across environments with only sizing differences
- Automation: Fully automated deployment with no manual intervention required

## What to deliver

- Complete AWS CloudFormation YAML implementation
- Single master template with environment parameterization
- VPC with environment-specific CIDR ranges
- RDS Aurora MySQL cluster with automated backups
- ECS Fargate cluster with auto-scaling
- Application Load Balancer with SSL
- S3 buckets with cross-region replication
- CloudWatch monitoring and alarms
- Security groups with proper access controls
- Parameter definitions for environment selection
- Conditions for environment-specific resource sizing
- Mappings for CIDR ranges and instance types
- Stack outputs for all key resources
- Documentation of deployment process and parameter usage
