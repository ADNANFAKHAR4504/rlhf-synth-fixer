# Multi-Environment Infrastructure Migration

Hey team,

We have a startup client that's hit a growth milestone. They've been running everything in a single AWS environment with a monolithic setup, but they're now experiencing deployment conflicts and the occasional scary production incident from accidental changes. They need us to help them implement a proper development-to-production pipeline with separate environments for dev, staging, and production.

The current setup has everything managed in one AWS account, which means when someone deploys to test something, there's risk of affecting production systems. We need to migrate them to a multi-account architecture where each environment lives in its own AWS account with proper isolation. The business is asking for this to be built using **Pulumi with Python** so they can leverage their team's Python expertise.

This is a medium-complexity infrastructure setup spanning VPC networking, compute resources with auto-scaling, database services, load balancing, and storage. The architecture needs to support three distinct environments with different resource sizing and configurations based on their usage patterns.

## What we need to build

Create a multi-environment infrastructure system using **Pulumi with Python** that supports dev, staging, and production environments across separate AWS accounts in the us-east-1 region.

### Core Requirements

1. **VPC Network Architecture**
   - Create VPC with environment-specific CIDR blocks: dev (10.0.0.0/16), staging (10.1.0.0/16), prod (10.2.0.0/16)
   - Configure public and private subnets across 2 availability zones for high availability
   - Set up Internet Gateway for public subnet internet access
   - Deploy NAT Gateway for private subnet outbound connectivity
   - Configure route tables for proper traffic routing

2. **Compute Auto Scaling**
   - Deploy Auto Scaling Group with EC2 instances
   - Environment-specific instance types: t3.micro for dev, t3.small for staging, t3.medium for prod
   - Configure launch template with appropriate AMI and user data
   - Set up scaling policies based on environment needs
   - Create IAM role and instance profile for EC2 instances

3. **Application Load Balancer**
   - Deploy Application Load Balancer in public subnets
   - Configure target group for Auto Scaling Group
   - Set up security group rules for HTTP/HTTPS traffic
   - Configure health checks for target instances
   - Enable access logs to S3

4. **RDS MySQL Database**
   - Deploy RDS MySQL with Single-AZ for dev and staging environments
   - Deploy RDS MySQL with Multi-AZ for production environment for high availability
   - Configure DB subnet group spanning private subnets
   - Set up security group allowing access from EC2 instances only
   - Enable automated backups for production (7-day retention minimum)
   - Configure appropriate instance sizes based on environment

5. **S3 Storage**
   - Create S3 buckets for static assets with environment-specific naming
   - Enable versioning only for production buckets
   - Configure bucket policies for ALB access logs
   - Enable encryption at rest for all buckets
   - Implement lifecycle policies where appropriate

6. **CloudWatch Monitoring**
   - Create CloudWatch alarms with environment-specific thresholds
   - Monitor EC2 CPU utilization
   - Monitor RDS connections and storage
   - Monitor ALB response times and error rates
   - Set up SNS topic for alarm notifications

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **VPC** for network isolation with environment-specific CIDR ranges
- Use **EC2 Auto Scaling** for compute with environment-appropriate sizing
- Use **Elastic Load Balancing** (Application Load Balancer) for traffic distribution
- Use **RDS** MySQL for database with Single-AZ for dev/staging, Multi-AZ for production
- Use **S3** for static assets and ALB logs with encryption enabled
- Use **CloudWatch** for monitoring and alarms with environment-specific thresholds
- Use **IAM** for roles and policies following least-privilege principle
- Resource names must include **environmentSuffix** parameter for uniqueness across environments
- Follow naming convention: {resource-type}-{environment-suffix}
- Deploy to **us-east-1** region
- Use Pulumi config for environment-specific parameters
- Implement conditional logic in Python for environment-based resource configuration

### Constraints

- Multi-account deployment using Pulumi stack configuration approach
- All resources must be tagged with Environment and CostCenter tags
- S3 bucket names must include environment suffix for global uniqueness
- Production RDS must have automated backups enabled with minimum 7-day retention
- All resources must be destroyable without Retain policies for testing purposes
- Security groups must follow least-privilege principle with minimal necessary access
- Enable encryption at rest for S3 buckets and RDS instances
- Use AWS-managed services where possible for reduced operational overhead
- VPC must span exactly 2 availability zones for cost optimization while maintaining HA
- Private subnets must use NAT Gateway for outbound internet access
- All sensitive data must be parameterized, not hardcoded

## Success Criteria

- **Functionality**: Infrastructure deploys successfully to dev, staging, and prod environments using different Pulumi stacks
- **Isolation**: Each environment has isolated VPC with no cross-environment network access
- **Scalability**: Auto Scaling Group properly scales based on load with environment-appropriate limits
- **Availability**: Production uses Multi-AZ RDS and spans multiple AZs for compute resources
- **Security**: Security groups allow only necessary traffic, encryption enabled for data at rest
- **Monitoring**: CloudWatch alarms configured with appropriate thresholds that trigger notifications
- **Recoverability**: Production RDS has automated backups enabled with point-in-time recovery capability
- **Resource Naming**: All resources include environmentSuffix for clear identification and uniqueness
- **Code Quality**: Clean Python code following PEP 8 style guidelines with type hints
- **Outputs**: Stack exports ALB DNS name and RDS endpoint for application configuration

## What to deliver

- Complete Pulumi Python implementation in lib/tap_stack.py and supporting modules
- VPC stack module with subnets, route tables, gateways for network foundation
- Compute stack module with Auto Scaling Group, launch template, and IAM roles
- Load balancer stack module with ALB, target groups, and listeners
- Database stack module with RDS instance, subnet group, and parameter group
- Storage stack module with S3 buckets and policies
- Monitoring stack module with CloudWatch alarms and SNS topics
- Pulumi config schema for environment-specific parameters
- Stack outputs for ALB DNS name and RDS endpoint
- Unit tests for all stack components with minimum 90 percent coverage
- Integration tests validating resource creation and configuration
- Documentation covering deployment instructions and configuration options
