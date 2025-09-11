# AWS Security Infrastructure Automation Prompt

## Task Overview
Hi cloud expert, i see that your response to my previous prompt was not completed, it stopped at the compliance stack. Remember, you are to create a production-ready AWS infrastructure using Python CDK that implements enterprise security best practices and meets NIST compliance standards. Deploy to us-west-2 region. Here are the requirements:

### 1. Identity & Access (IAM)
- Least-privilege roles per service (Lambda, EC2)
- MFA enforcement, password policies, session limits
- Trust relationships and permission boundaries

### 2. Data Protection
- KMS encryption for all resources, S3, EBS, Lambda vars, Parameter Store, CloudWatch
- Key rotation, separate keys by data type
- S3: versioning, access logs, public block, HTTPS-only

### 3. Network Security
- Minimal Security Groups, private EC2 subnets
- Session Manager access
- VPC flow logs, tier segmentation, web/app/db

### 4. Secrets & Configuration
- Parameter Store SecureStrings with hierarchical naming, /app/prod/*
- Granular IAM access policies

### 5. Monitoring & Compliance
- CloudWatch alarms: root logins, auth failures, unauthorized calls, config changes, Lambda errors
- SNS notifications, security dashboards
- CloudTrail, GuardDuty, Config rules, NIST mapping

### 6. Lambda & Compute
- CloudWatch logs with retention, X-Ray tracing
- EC2: IMDSv2 enforcement, automated patching

### 7. Resource Management
- Tags: Environment='prod', Owner='security-team', CostCenter='tap', CreatedDate, ManagedBy='turing-iac'
- Output all resource ARNs/IDs
- CDK aspects for consistent tagging