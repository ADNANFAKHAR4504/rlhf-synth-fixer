Hey team,

We're facing a common but critical challenge with our financial services infrastructure. Right now we have development, staging, and production environments across multiple AWS accounts, and we keep running into configuration drift issues. Someone makes a manual change in dev, forgets to document it, and then we get deployment failures or security vulnerabilities when we try to roll to staging or prod. It's becoming a real problem for our operations and compliance teams.

I need to build infrastructure that maintains identical configurations across all three environments but with environment-specific customizations where needed. The business wants us to use AWS CloudFormation StackSets to deploy across multiple accounts, and everything needs to be parameterized so we can control environment differences through parameters rather than template changes.

## What we need to build

Create a multi-environment infrastructure deployment system using **CloudFormation with JSON** that can be deployed consistently across development, staging, and production AWS accounts. This needs to support a web application with networking, compute, database, storage, and monitoring components.

### Core Requirements

1. **Networking Infrastructure**
   - VPC with two public subnets and two private subnets across different availability zones
   - Internet Gateway for public subnet connectivity
   - NAT Gateway for private subnet internet access
   - Route Tables configured appropriately for public and private subnets
   - Environment-specific CIDR blocks (dev: 10.1.0.0/16, staging: 10.2.0.0/16, prod: 10.3.0.0/16)

2. **Application Load Balancing**
   - Application Load Balancer deployed in public subnets
   - HTTPS listener using AWS Certificate Manager certificate
   - Target Group for routing traffic to EC2 instances
   - Security groups configured for ALB access

3. **Auto Scaling Compute**
   - Auto Scaling Group with EC2 instances in private subnets
   - Launch Configuration or Launch Template with environment-appropriate instance types
   - Security groups allowing traffic from ALB
   - IAM instance profile for EC2 instances

4. **Database Layer**
   - RDS MySQL instance in private subnets
   - DB Subnet Group spanning both private subnets
   - Multi-AZ deployment enabled for production only (use Conditions)
   - Automated backups with 7-day retention
   - Security groups restricting access to EC2 instances

5. **Storage**
   - S3 buckets with environment-prefixed names for application logs
   - S3 buckets for static content with environment-prefixed names
   - Versioning enabled on all buckets
   - Lifecycle policies configured

6. **Monitoring and Notifications**
   - CloudWatch alarms monitoring CPU utilization (threshold: 80%) on EC2 instances
   - SNS topics for alarm notifications with environment-specific email endpoints
   - CloudWatch Logs integration

7. **Environment-Specific Configuration**
   - Use Conditions to enable/disable features based on environment (e.g., Multi-AZ only for prod)
   - All environment values must be parameterized (environment name, instance types, database size, CIDR blocks)
   - No hardcoded environment-specific values in template

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use CloudFormation StackSets for multi-account deployment
- Use Parameters section for environment name, instance type, database size, CIDR blocks, and ACM certificate ARN
- Use Conditions section for environment-dependent resources (Multi-AZ, instance counts)
- Use Mappings if needed for environment-specific configurations
- Resource names must include **EnvironmentSuffix** parameter for uniqueness
- Follow naming convention: resourceType-${EnvironmentSuffix}
- Deploy to **us-east-1** region
- Use AWS Certificate Manager for SSL/TLS certificates on ALB
- Security groups must implement least privilege access

### Constraints

- Must work with CloudFormation StackSets across multiple AWS accounts
- All environment-specific values must be parameters (no hardcoded values)
- RDS must have automated backups enabled with 7-day retention minimum
- Each environment uses separate VPC with /16 CIDR block
- ALB must use ACM for SSL/TLS (certificate ARN as parameter)
- All S3 buckets must have versioning enabled
- All S3 buckets must have lifecycle policies configured
- CloudWatch alarms must monitor CPU and send to environment-specific SNS topics
- All resources must be destroyable (no Retain deletion policies)
- Include proper DependsOn where needed for resource ordering
- Security groups must restrict access appropriately

## Success Criteria

- Functionality: Template deploys successfully via StackSets to multiple accounts
- Configuration: All environment differences controlled through parameters
- Consistency: Same template produces identical infrastructure patterns across environments
- Conditions: Multi-AZ and other prod features only enabled for production environment
- Security: Least privilege IAM, proper security group rules, encryption where applicable
- Monitoring: CloudWatch alarms active and sending to correct SNS topics
- Storage: S3 buckets properly configured with versioning and lifecycle policies
- Database: RDS configured with automated backups and appropriate Multi-AZ settings
- Resource Naming: All resources include EnvironmentSuffix for uniqueness
- Code Quality: Valid JSON CloudFormation template, well-structured, documented with descriptions

## What to deliver

- Complete CloudFormation JSON template (single file)
- Parameters section with: EnvironmentName, EnvironmentSuffix, InstanceType, DBInstanceClass, VpcCidr, ACMCertificateArn, AlarmEmail
- Conditions section for environment-dependent resources (IsProduction for Multi-AZ)
- Resources including: VPC, Subnets (2 public, 2 private), Internet Gateway, NAT Gateway, Route Tables, ALB, Target Group, Launch Template or Launch Configuration, Auto Scaling Group, RDS Instance, DB Subnet Group, S3 Buckets (logs and static), CloudWatch Alarms, SNS Topics, Security Groups, IAM Roles and Instance Profile
- Outputs section for: ALB DNS name, RDS endpoint, S3 bucket names
- Proper DependsOn attributes for resource ordering
- Metadata with descriptions for clarity