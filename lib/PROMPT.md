# Financial Transaction Processing Platform

Hey team,

We need to build a production-grade web application infrastructure for processing financial transactions. I've been asked to create this using CDKTF with Python. The business is launching a new customer portal for a financial services company, and we need rock-solid infrastructure that meets PCI-DSS compliance requirements while handling variable traffic loads during market hours.

This is a comprehensive deployment that includes everything from networking to monitoring. The application will process sensitive transaction data, so security and reliability are paramount. We need multi-AZ redundancy, automated scaling, secure secrets management, and complete observability.

The architecture needs to support Auto Scaling Groups behind an Application Load Balancer, with CloudFront and WAF protecting the front end. The database layer uses Aurora MySQL with automated backups and encryption. We also need proper secrets rotation, comprehensive monitoring, and lifecycle policies for log retention.

## What we need to build

Create a highly available web application infrastructure using **CDKTF with Python** for processing financial transactions in the us-east-1 region.

### Core Requirements

1. Network Infrastructure
   - VPC with 3 public and 3 private subnets across different availability zones
   - Appropriate route tables for public and private subnets
   - NAT gateways for private subnet internet access
   - Internet gateway for public subnet connectivity

2. Compute Layer
   - Auto Scaling Group with launch template
   - Amazon Linux 2023 AMI with t3.large instances
   - User data script to install application dependencies
   - IMDSv2 enforcement with IMDSv1 disabled
   - Auto Scaling policies based on CPU utilization (scale up at 70%, scale down at 30%)
   - Scheduled scaling actions for business hours capacity (8AM-6PM EST)
   - Minimum 3 instances during business hours

3. Load Balancing
   - Application Load Balancer in public subnets
   - Target group with health checks verifying /health endpoint
   - Health checks must validate HTTP 200 response and database connectivity
   - HTTPS listeners with SSL/TLS termination

4. Database
   - RDS Aurora MySQL 8.0 cluster with Multi-AZ deployment
   - 2 Aurora instances for high availability
   - Encryption at rest using KMS
   - Automated backups with 7-day retention period
   - Point-in-time recovery enabled
   - Performance Insights enabled for monitoring
   - SSL/TLS encryption required for all connections with certificate validation

5. Content Delivery
   - CloudFront distribution with custom origin pointing to ALB
   - Caching policies for static content
   - Application must be accessible only through CloudFront
   - AWS WAF web ACL attached to CloudFront with rate limiting rules

6. Storage
   - S3 bucket for static assets (public read through CloudFront only)
   - S3 bucket for application logs (private with server-side encryption)
   - Lifecycle policy for logs with 90-day retention
   - All S3 data encrypted at rest

7. Secrets Management
   - Secrets Manager secrets for database credentials
   - Lambda function for automatic rotation every 30 days
   - Secrets must be referenced securely by EC2 instances and Lambda functions

8. Monitoring and Alerting
   - CloudWatch log groups for application logs
   - Metric filters for error tracking
   - SNS topic for critical alerts
   - Custom metrics for application performance

9. Security
   - IAM roles and policies following least privilege principle
   - IAM role for EC2 instances with necessary permissions
   - IAM role for Lambda functions with rotation permissions
   - KMS keys for encryption
   - Security groups with minimal required access
   - All resources must use IMDSv2

10. Resource Tagging
    - All resources must include Environment, Application, and CostCenter tags
    - Resource names must include environmentSuffix for uniqueness

### Technical Requirements

- All infrastructure defined using CDKTF with Python
- Use VPC for network isolation
- Use EC2 Auto Scaling for compute layer
- Use Application Load Balancer for traffic distribution
- Use RDS Aurora MySQL for database
- Use CloudFront for CDN with WAF protection
- Use S3 for static assets and logs
- Use Secrets Manager for credential management
- Use Lambda for secrets rotation
- Use CloudWatch for logging and monitoring
- Use IAM for access control
- Use KMS for encryption keys
- Use SNS for notifications
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to us-east-1 region
- Terraform version 1.5+ with AWS provider 5.x

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (no Retain policies or DeletionPolicy: Retain)
- Use RemovalPolicy.DESTROY or equivalent for all resources
- Database deletion protection should be disabled for test environments
- S3 buckets must allow force deletion with auto_delete_objects enabled
- All resources must support clean teardown for testing
- Resource names must include environmentSuffix parameter for test isolation

### Constraints

- Health checks must verify both HTTP response and database connectivity
- Database backups must occur daily with point-in-time recovery for 7 days
- Auto-scaling must maintain minimum 3 instances during business hours (8AM-6PM EST)
- Application accessible only through CloudFront with WAF rules enabled
- Secrets must be stored in Secrets Manager with automatic rotation every 30 days
- All database connections must use SSL/TLS encryption with certificate validation
- Application logs must be stored in S3 with server-side encryption and 90-day retention
- All EC2 instances must use IMDSv2 and disable IMDSv1
- All resources must be tagged with Environment, Application, and CostCenter tags
- All resources must support clean deletion for test environments
- Include proper error handling and logging
- Follow PCI-DSS compliance requirements

### Code Organization

Organize infrastructure into modular files:
- main.py - Main stack with stack definition and synthesis
- vpc.py - VPC, subnets, route tables, NAT gateways, Internet gateway
- compute.py - Launch template, Auto Scaling Group, scaling policies
- alb.py - Application Load Balancer, target groups, listeners
- database.py - Aurora MySQL cluster, instances, parameter groups
- cdn.py - CloudFront distribution, WAF web ACL, cache policies
- storage.py - S3 buckets for static assets and logs with lifecycle policies
- secrets.py - Secrets Manager secrets, Lambda rotation function
- monitoring.py - CloudWatch log groups, metric filters, SNS topics
- security.py - IAM roles, policies, security groups, KMS keys

## Success Criteria

- Functionality: Complete infrastructure deploys successfully with all components
- High Availability: Multi-AZ deployment with minimum 3 instances during business hours
- Security: PCI-DSS compliant with encryption, secrets management, and WAF protection
- Scalability: Auto-scaling responds to CPU utilization and scheduled events
- Monitoring: Comprehensive logging and alerting through CloudWatch and SNS
- Resource Naming: All resources include environmentSuffix for test isolation
- Compliance: Health checks validate database connectivity, logs retained 90 days
- Code Quality: Python code, modular organization, well-documented, production-ready
- Destroyability: All resources can be cleanly destroyed for testing

## What to deliver

- Complete CDKTF Python implementation organized into modular files
- VPC with 3 public and 3 private subnets across availability zones
- EC2 Auto Scaling Group with launch template and scaling policies
- Application Load Balancer with health checks
- RDS Aurora MySQL cluster with encryption and backups
- CloudFront distribution with WAF web ACL
- S3 buckets for static assets and logs
- Secrets Manager with Lambda rotation function
- CloudWatch logging and SNS alerting
- IAM roles and KMS encryption keys
- cdktf.json configuration file
- requirements.txt with Python dependencies
- Unit tests for all components
- Documentation with deployment instructions
