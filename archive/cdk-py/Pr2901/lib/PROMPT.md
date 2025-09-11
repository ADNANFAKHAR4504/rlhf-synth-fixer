# AWS Security Infrastructure Automation

## Task Overview
As an AWS cloud infrastructure expert, Create a production-ready AWS infrastructure using Python CDK that implements enterprise security best practices and meets NIST compliance standards. Deploy to us-west-2 region.

## Core Requirements

### 1. Identity & Access (IAM)
- Create least-privilege IAM roles for each service, Lambda, EC2.
- Enforce MFA for all human users
- Set up password policies and session limits
- Configure trust relationships and permission boundaries

### 2. Data Protection
- Implement KMS encryption everywhere, S3, EBS, Lambda env vars, Parameter Store, CloudWatch Logs.
- Enable key rotation and create separate keys for different data types
- Force encryption in transit
- Set up S3 with versioning, access logging, and blocked public access

### 3. Network Security
- Design minimal Security Groups
- Deploy EC2 in private subnets with Session Manager access
- Enable VPC flow logs
- Implement network segmentation, web/app/database tiers

### 4. Secrets & Configuration
- Store all sensitive data in Parameter Store as SecureStrings
- Use hierarchical naming, /app/prod/db/password
- Implement granular IAM access policies

### 5. Monitoring & Compliance
- Set up CloudWatch alarms for security events:
  - Root logins, failed auth attempts, unauthorized API calls
  - Security group/IAM/KMS changes
  - Lambda errors and resource usage
- Create SNS notifications and security dashboards
- Enable CloudTrail, GuardDuty, and Config rules
- Map controls to NIST framework

### 6. Lambda & Compute
- Configure CloudWatch logging with retention
- Enable X-Ray tracing
- Enforce IMDSv2 for EC2
- Implement automated patching strategy

### 7. Resource Management
- Tag everything with: Environment='prod', Owner='security-team', CostCenter='tap', CreatedDate, ManagedBy='turing-iac'
- Generate outputs for all created resources
- Use CDK aspects for consistent tagging