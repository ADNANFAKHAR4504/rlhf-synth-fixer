# Model Response - Terraform Infrastructure Implementation

## Reasoning Trace

This is a comprehensive Terraform infrastructure task requiring multiple AWS services across three environments. Let me break down what I need to create:

### 1. Environment Configuration
- Three environments: dev, staging, prod
- Each with specific configurations for VPC CIDRs, instance types, etc.
- Consistent tagging strategy across all resources

### 2. Core Infrastructure Components

#### Networking
- VPC with public and private subnets
- Internet Gateway for public access
- NAT Gateway for private subnet outbound access
- Route tables and associations
- Security groups with appropriate rules

#### Compute
- EC2 instances in appropriate subnets
- Auto Scaling Groups for high availability
- Application Load Balancer for traffic distribution
- Launch templates with proper configurations

#### Database
- RDS instances with Multi-AZ deployment
- Subnet groups for database placement
- Parameter groups for database configuration
- Security groups for database access

#### Storage
- S3 buckets for various purposes
- KMS keys for encryption
- Bucket policies for access control
- Lifecycle policies for cost optimization

#### Security & Compliance
- IAM roles and policies
- CloudTrail for audit logging
- Config for compliance monitoring
- Secrets Manager for sensitive data

#### Monitoring
- CloudWatch alarms
- Log groups
- SNS topics for notifications
- Dashboards for monitoring

### 3. Implementation Strategy
- Use for_each loops for environment-specific resources
- Implement proper variable definitions
- Use locals for common configurations
- Follow Terraform best practices
- Ensure proper resource dependencies

### 4. Outputs
- VPC IDs and subnet IDs
- Security group IDs
- Load balancer DNS names
- Database endpoints
- S3 bucket names

This approach ensures scalability, maintainability, and follows AWS best practices for multi-environment deployments.
