Hey team,

We're migrating a legacy loan processing application from on-premises physical servers to AWS. The application currently runs on bare metal with local databases and needs to be completely containerized while maintaining strict compliance requirements. The financial services company has mandated that we keep development, staging, and production environments completely isolated with no cross-environment networking.

This is a production migration project, so everything needs to be built with enterprise-grade reliability and security from day one. The application processes sensitive financial data, which means encryption everywhere, automated credential management, and comprehensive audit logging are non-negotiable. We also need to maintain the ability to scale the containerized services independently while keeping costs under control.

The team has decided to use **Pulumi with Python** for this infrastructure. We need to build a complete multi-tier architecture that spans networking, compute, database, and security layers while following AWS best practices for financial services workloads.

## What we need to build

Create a production-ready containerized application infrastructure using **Pulumi with Python** for a loan processing application migration in the us-east-1 region.

### Core Infrastructure Requirements

1. **VPC Architecture**
   - Define a VPC with public and private subnets across 3 availability zones
   - Deploy NAT gateways for private subnet internet access
   - Configure internet gateway for public subnet connectivity
   - Set up route tables for proper traffic routing between subnets

2. **Container Orchestration**
   - Set up an ECS cluster with Fargate launch type for running containerized services
   - Define ECS task definitions with proper IAM roles and CloudWatch logging
   - Configure ECS services with appropriate resource allocation
   - Ensure tasks run in private subnets with security group protection

3. **Database Layer**
   - Create an RDS PostgreSQL instance in private subnets with encryption and automated backups
   - Use customer-managed KMS keys for database encryption
   - Configure automated backups with appropriate retention
   - Deploy in Multi-AZ configuration for high availability

4. **Load Balancing**
   - Configure an Application Load Balancer in public subnets with target group for ECS services
   - Set up health checks for container instances
   - Configure listeners for HTTP/HTTPS traffic
   - Enable ALB access logs stored in S3

5. **Security and Secrets Management**
   - Implement Secrets Manager for database credentials with automatic rotation every 30 days
   - Configure Lambda function for credential rotation
   - Set up ECR repository with image scanning and lifecycle policies
   - Create necessary security groups with least-privilege access patterns
   - Implement proper IAM roles for ECS tasks using service authentication

6. **Configuration and Monitoring**
   - Configure Parameter Store entries for application configuration
   - Implement CloudWatch Log Groups with 30-day retention policies
   - Set up centralized logging for ECS container logs
   - Enable Container Insights for ECS monitoring

7. **Storage for Logs**
   - Set up S3 bucket for ALB access logs with lifecycle rules
   - Configure 90-day retention policy for log files
   - Enable server-side encryption for log storage
   - Apply proper bucket policies for ALB log delivery

8. **Resource Organization**
   - Apply consistent tagging strategy across all resources
   - Include Environment, Project, and CostCenter tags on every resource
   - Use resource naming convention with environmentSuffix for uniqueness

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **ECS Fargate** for container orchestration (no EC2-based ECS)
- Use **RDS PostgreSQL 14.x** with customer-managed KMS encryption
- Use **Application Load Balancer** for traffic distribution
- Use **Secrets Manager** with Lambda-based rotation for database credentials
- Use **ECR** with image scanning enabled and lifecycle policies
- Use **CloudWatch** with 30-day retention for container logs
- Use **Parameter Store** for non-sensitive configuration
- Use **S3** with 90-day lifecycle for ALB access logs
- Use **KMS** customer-managed keys for RDS encryption
- Deploy to **us-east-1** region
- Each environment must have its own VPC with no peering between them
- All resources must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-{environmentSuffix}
- Container images stored in private ECR repositories
- ECS tasks must use IAM roles for service authentication, not access keys
- All resources must be destroyable (no Retain policies or deletion protection)

### Constraints

- Use AWS Fargate for container orchestration instead of EC2-based ECS
- RDS instances must use encrypted storage with customer-managed KMS keys
- Each environment must have its own VPC with no peering between them
- Database credentials must be stored in AWS Secrets Manager with automatic rotation enabled
- Container images must be stored in private ECR repositories with image scanning enabled
- ALB access logs must be stored in S3 with lifecycle policies for 90-day retention
- ECS tasks must use IAM roles for service authentication, not access keys
- CloudWatch Log Groups must have 30-day retention for container logs
- Parameter Store must be used for non-sensitive configuration values
- All resources must be tagged with Environment, Project, and CostCenter tags
- No hardcoded credentials or secrets in code
- All resources must support cleanup (no permanent retention policies)

## Success Criteria

- Functionality: Complete VPC with 3-AZ architecture, ECS Fargate cluster, RDS PostgreSQL with encryption, ALB with target groups, Secrets Manager with rotation, ECR with scanning, proper IAM roles, security groups, Parameter Store, CloudWatch logs, and S3 for ALB logs
- Security: KMS encryption for RDS, Secrets Manager for credentials with 30-day rotation, private ECR repositories with scanning, least-privilege IAM roles, security groups with minimal ports, no hardcoded credentials
- Reliability: Multi-AZ deployment for database, automated backups for RDS, health checks on ALB, proper VPC architecture across 3 AZs
- Monitoring: CloudWatch Log Groups with 30-day retention, centralized ECS logging, ALB access logs in S3 with 90-day retention
- Compliance: Complete environment isolation, encrypted storage, audit logging, proper tagging with Environment/Project/CostCenter
- Resource Naming: All resources include environmentSuffix for uniqueness
- Code Quality: Python with proper error handling, well-structured, documented

## What to deliver

- Complete Pulumi Python implementation
- VPC with public/private subnets across 3 AZs, NAT gateways, internet gateway, route tables
- ECS Fargate cluster with task definitions, services, IAM roles, CloudWatch logging
- RDS PostgreSQL with KMS encryption, automated backups, Multi-AZ deployment
- Application Load Balancer with target groups, health checks, listeners
- Secrets Manager with database credentials and Lambda rotation (30-day cycle)
- ECR repository with image scanning and lifecycle policies
- Security groups for ALB, ECS tasks, and RDS with least-privilege rules
- Parameter Store for application configuration
- CloudWatch Log Groups with 30-day retention
- S3 bucket for ALB logs with 90-day lifecycle policy
- KMS customer-managed keys for RDS encryption
- Consistent tagging across all resources (Environment, Project, CostCenter)
- Proper resource naming with environmentSuffix
- All components properly integrated and production-ready
