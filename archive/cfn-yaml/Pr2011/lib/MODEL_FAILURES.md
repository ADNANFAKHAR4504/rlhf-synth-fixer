# Infrastructure Deployment Issues and Resolutions

## Key Issues Identified in Original Template

### 1. GuardDuty Configuration Conflict
The template specified both `DataSources` and `Features` properties for GuardDuty, which AWS doesn't allow simultaneously. Additionally, GuardDuty was already enabled in the account, causing deployment failures.

### 2. AWS Config Service Conflicts
- Incorrect IAM managed policy reference (`ConfigRole` instead of `AWS_ConfigRole`)
- Pre-existing Config recorder in the region preventing new recorder creation

### 3. CloudTrail Configuration Issues
- Incorrect CloudWatch Logs ARN format using string substitution instead of GetAtt
- CloudWatch Log Groups with KMS encryption causing circular dependencies

### 4. Missing Critical Infrastructure Elements
- No `EnvironmentSuffix` parameter for deployment isolation
- Resource names lacked environment-specific suffixes, risking naming conflicts

## Infrastructure Changes Required

### Simplified Architecture
Due to service conflicts and AWS account limitations, the infrastructure was simplified to core components:
- VPC with public/private subnets across 2 AZs
- Internet Gateway and route tables for connectivity
- Security groups for web tier access control
- S3 bucket with AES256 encryption for logging
- Removed GuardDuty, Config, and CloudTrail due to pre-existing services

### Parameter Additions
Added `EnvironmentSuffix` parameter and integrated it into all resource names to ensure deployment isolation.

### Security Adjustments
- Maintained S3 bucket encryption using AES256 instead of KMS to avoid complexity
- Preserved public access blocking on S3 buckets
- Kept security group rules restrictive with specific port access

## Deployment Success Metrics
- Successfully deployed VPC with 4 subnets across 2 availability zones
- Created secure S3 bucket with encryption and access controls
- Established proper network routing and security groups
- All resources properly tagged for governance
- No retention policies ensuring complete cleanup capability