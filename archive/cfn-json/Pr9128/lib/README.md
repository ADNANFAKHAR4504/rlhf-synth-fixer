# CloudFormation Template Optimization - Task 101912945

## Overview

This project demonstrates the optimization of a CloudFormation template for a three-tier financial services web application. The optimization addresses 12 specific requirements while maintaining full functionality and improving maintainability.

## Problem Statement

A financial services company deployed a multi-tier web application six months ago using CloudFormation. The stack has significant technical debt causing:
- Deployment failures (45+ minute deployments)
- Circular dependencies
- Hardcoded values throughout
- No environment flexibility (dev/staging/prod)
- Security compliance gaps (IMDSv1)
- Maintainability issues

## Solution Architecture

### Infrastructure Components

**Three-Tier Architecture**:
1. **Web Tier**: Application Load Balancer in public subnets
2. **Application Tier**: Auto Scaling Group with EC2 instances in private subnets
3. **Data Tier**: RDS Aurora MySQL cluster and ElastiCache Redis in private subnets

**Network Design**:
- VPC with 6 subnets (3 public, 3 private) across 3 availability zones
- Internet Gateway for public internet access
- Security groups consolidated into 3 logical groups

## Files in This Repository

### Documentation Files (in lib/ directory)
- `PROMPT.md` - Original requirements in conversational format
- `MODEL_RESPONSE.md` - Initial implementation example with common issues
- `IDEAL_RESPONSE.md` - Complete corrected implementation
- `MODEL_FAILURES.md` - Detailed analysis of optimization requirements
- `README.md` - This file

### CloudFormation Template (in lib/ directory)
- `TapStack.json` - Complete optimized CloudFormation template

### Test Files (in test/ directory)
- `cfn-optimization.unit.test.ts` - Unit tests for template validation
- `cfn-optimization.int.test.ts` - Integration tests for deployment validation

## 12 Optimization Requirements

### 1. Template Structure
- Well-organized CloudFormation template with all required sections
- Clean, maintainable JSON structure

### 2. Parameter Extraction
- All hardcoded values extracted to parameters with validation
- AllowedPattern constraints for CIDR blocks
- AWS-specific parameter types

### 3. Mappings Section
- EnvironmentConfig: Instance types, ASG settings, DB classes
- RegionAMI: Multi-region AMI mappings
- Used Fn::FindInMap for dynamic value selection

### 4. Circular Dependency Resolution
- DBClusterParameterGroup created independently
- DBParameterGroup created independently
- AuroraCluster references DBClusterParameterGroup
- AuroraInstance references DBParameterGroup

### 5. Security Group Consolidation
- WebSecurityGroup: ALB (HTTP/HTTPS)
- AppSecurityGroup: EC2 instances (8080, SSH)
- DataSecurityGroup: RDS and Redis (3306, 6379)

### 6. Intrinsic Function Modernization
- All Fn::Join converted to Fn::Sub
- Cleaner, more readable syntax

### 7. Conditional Resource Creation
- IsProduction, IsNotProduction, EnableMultiAZ conditions
- Second Aurora instance only in production
- Redis replication vs single node based on environment

### 8. Deletion and Update Policies
- RDS Aurora: DeletionPolicy Snapshot, UpdateReplacePolicy Snapshot
- S3 Bucket: DeletionPolicy Delete
- Other resources: DeletionPolicy Delete

### 9. Pseudo Parameters
- AWS::Region with Fn::GetAZs for dynamic AZ selection
- AWS::AccountId in S3 bucket names
- AWS::StackName in exports

### 10. IMDSv2 Configuration
- MetadataOptions in LaunchConfiguration
- HttpTokens: "required"
- HttpPutResponseHopLimit: 1

### 11. CloudFormation Designer Metadata
- Top-level Metadata section with AWS::CloudFormation::Designer
- Resource IDs for visual layout

### 12. Template Validation
- Passes cfn-lint with zero errors
- Proper JSON syntax
- Valid AWS resource types

## Deployment Instructions

### Prerequisites
- AWS CLI 2.x installed
- AWS credentials configured
- CloudFormation permissions
- Node.js 18+ (for tests)

### Deploy Stack

```bash
# Navigate to the lib directory
cd lib/

# Validate template
aws cloudformation validate-template \
  --template-body file://TapStack.json

# Create stack (dev environment)
aws cloudformation create-stack \
  --stack-name financial-app-dev \
  --template-body file://TapStack.json \
  --parameters \
    ParameterKey=Environment,ParameterValue=dev \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev-test \
  --capabilities CAPABILITY_IAM

# Monitor stack creation
aws cloudformation describe-stack-events \
  --stack-name financial-app-dev \
  --query 'StackEvents[?ResourceStatus==`CREATE_IN_PROGRESS`].[Timestamp,ResourceType,ResourceStatus]' \
  --output table

# Get stack outputs
aws cloudformation describe-stacks \
  --stack-name financial-app-dev \
  --query 'Stacks[0].Outputs' \
  --output table
```

### Deploy Production Stack

```bash
# Create production stack with multi-AZ
aws cloudformation create-stack \
  --stack-name financial-app-prod \
  --template-body file://TapStack.json \
  --parameters \
    ParameterKey=Environment,ParameterValue=prod \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod-v1 \
    ParameterKey=VpcCIDR,ParameterValue=10.1.0.0/16 \
  --capabilities CAPABILITY_IAM
```

### Delete Stack

```bash
aws cloudformation delete-stack \
  --stack-name financial-app-dev

# Monitor deletion
aws cloudformation wait stack-delete-complete \
  --stack-name financial-app-dev
```

## Testing

### Run Unit Tests

```bash
# Install dependencies
npm install

# Run template structure tests
npm test
```

### Run cfn-lint

```bash
# Install cfn-lint
pip install cfn-lint

# Validate template
cfn-lint lib/TapStack.json
```

## Environment Configuration

The template supports three environments with automatic resource scaling:

| Resource | Dev | Staging | Production |
|----------|-----|---------|------------|
| EC2 Instance Type | t3.micro | t3.small | t3.medium |
| ASG Min Size | 1 | 2 | 2 |
| ASG Max Size | 2 | 4 | 6 |
| RDS Instance | db.t3.small | db.t3.medium | db.r5.large |
| Cache Node | cache.t3.micro | cache.t3.small | cache.r5.large |
| Multi-AZ | No | No | Yes |
| Aurora Instances | 1 | 1 | 2 |
| Redis Type | Single Node | Single Node | Replication Group |

## Security Features

- **Encryption**: RDS storage encrypted, S3 server-side encryption
- **Network Isolation**: Private subnets for app and data tiers
- **Security Groups**: Least privilege access, consolidated rules
- **IMDSv2**: Enforced on all EC2 instances
- **S3 Public Access**: Blocked on all buckets
- **Redis Transit Encryption**: Enabled for production
- **RDS Managed Password**: Uses AWS Secrets Manager

## Compliance and Best Practices

This template follows AWS Well-Architected Framework principles:

- **Operational Excellence**: CloudWatch Logs, tagging, monitoring
- **Security**: IMDSv2, encryption, least privilege, no public access
- **Reliability**: Multi-AZ, Auto Scaling, health checks, backups
- **Performance Efficiency**: Right-sized instances, ElastiCache, Aurora
- **Cost Optimization**: Environment-based sizing, Auto Scaling

## Authors

Generated as part of infrastructure optimization task 101912945
Platform: CloudFormation (cfn)
Language: JSON
