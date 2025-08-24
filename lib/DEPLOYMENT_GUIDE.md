# Financial Infrastructure Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying, managing, and troubleshooting the financial application infrastructure using Pulumi and Java.

## Prerequisites

### Software Requirements
- **Java**: OpenJDK 17 or higher
- **Gradle**: 8.0+ (included via wrapper)
- **Pulumi CLI**: Latest version
- **AWS CLI**: Configured with appropriate credentials

### AWS Permissions Required
The deployment requires the following AWS permissions:
- EC2: Full access (VPC, instances, security groups)
- S3: Full access (bucket creation, policies, encryption)
- KMS: Key management permissions
- IAM: Role and policy creation
- CloudTrail: Trail configuration
- CloudWatch: Metrics and alarms creation
- SNS: Topic and subscription management

### Environment Setup
```bash
# Verify Java version
java -version  # Should be 17+

# Build the project
./gradlew build

# Run tests to ensure everything works
./gradlew test
```

## Deployment Process

### 1. Pre-Deployment Checks

#### Verify Project Structure
```bash
# Ensure all required files are present
ls -la lib/src/main/java/app/Main.java
ls -la Pulumi.yaml
ls -la build.gradle
```

#### Run Code Quality Checks
```bash
# Lint the code
./gradlew checkstyleMain

# Compile and test
./gradlew build

# Verify test coverage
./gradlew jacocoTestReport
```

### 2. Pulumi Stack Configuration

#### Initialize Pulumi
```bash
# Login to Pulumi (if not already done)
pulumi login

# Create a new stack (first time only)
pulumi stack init financial-app-dev

# Or select existing stack
pulumi stack select financial-app-dev
```

#### Configure AWS Settings
```bash
# Set AWS region (default: us-east-1)
pulumi config set aws:region us-east-1

# Verify AWS credentials
aws sts get-caller-identity
```

### 3. Infrastructure Deployment

#### Build Java Application
```bash
# Clean and build the project
./gradlew clean build -x test

# Verify JAR file creation
ls -la build/libs/
```

#### Deploy Infrastructure
```bash
# Preview changes (recommended first)
pulumi preview

# Deploy the infrastructure
pulumi up

# For automated deployment (non-interactive)
pulumi up --yes
```

#### Monitor Deployment Progress
The deployment creates resources in this order:
1. VPC and networking components
2. Security groups and IAM roles
3. KMS keys and encryption setup
4. S3 buckets and policies
5. EC2 instances
6. CloudTrail and monitoring setup

Typical deployment time: 5-8 minutes

### 4. Post-Deployment Verification

#### Check Stack Outputs
```bash
# View all stack outputs
pulumi stack output

# Check specific outputs
pulumi stack output vpcId
pulumi stack output instanceIds
pulumi stack output s3BucketName
```

#### Verify Resource Creation
```bash
# List created resources
pulumi stack --show-urns

# Check resource status
aws ec2 describe-instances --filters "Name=tag:Project,Values=financial-app"
aws s3 ls | grep financial-cloudtrail-logs
```

#### Test Infrastructure
```bash
# Run integration tests
./gradlew integrationTest

# Verify CloudTrail logging
aws cloudtrail describe-trails
aws logs describe-log-groups
```

## Configuration Management

### Environment Variables
```bash
# Optional: Set custom environment suffix
export ENVIRONMENT_SUFFIX=dev-$(date +%Y%m%d)

# Optional: Override AWS region
export AWS_DEFAULT_REGION=us-west-2
```

### Resource Naming
All resources are created with randomized suffixes to avoid conflicts:
- VPC: `financial-app-vpc-{random}`
- S3 Bucket: `financial-cloudtrail-logs-{random}`
- EC2 Instances: `financial-app-instance-{random}`
- KMS Key: `financial-app-kms-key-{random}`

### Customization Options

#### Instance Configuration
Edit `lib/src/main/java/app/Main.java`:
```java
// Modify instance type
.instanceType("t3.micro")  // Change to t3.small, t3.medium, etc.

// Adjust EBS volume size
.blockDeviceMappings(InstanceEbsBlockDeviceArgs.builder()
    .deviceName("/dev/xvda")
    .ebs(args -> args
        .volumeType("gp3")
        .volumeSize(20)  // Change size in GB
    ))
```

#### Network Configuration
```java
// Modify VPC CIDR
.cidrBlock("10.0.0.0/16")  // Change to your preferred range

// Adjust subnet configuration
.cidrBlock("10.0.1.0/24")  // Public subnet
.cidrBlock("10.0.2.0/24")  // Private subnet
```

## Monitoring and Maintenance

### CloudWatch Dashboards
After deployment, monitor infrastructure through:
- CloudWatch Console → Dashboards
- EC2 Console → Instances
- CloudTrail Console → Event history

### Log Monitoring
```bash
# View CloudWatch logs
aws logs describe-log-groups --log-group-name-prefix financial-app

# Stream instance logs
aws logs tail financial-app-logs --follow
```

### Metrics and Alarms
The infrastructure includes:
- CPU utilization alarms (>70% threshold)
- SNS notifications for alerts
- CloudWatch dashboards for visualization

### Backup and Recovery
```bash
# Export stack configuration
pulumi stack export --file backup.json

# Create infrastructure backup
aws s3 cp backup.json s3://your-backup-bucket/

# Restore from backup (if needed)
pulumi stack import --file backup.json
```

## Troubleshooting

### Common Deployment Issues

#### 1. AWS Permissions Errors
```bash
# Error: Access denied for resource creation
# Solution: Verify IAM permissions
aws sts get-caller-identity
aws iam list-attached-user-policies --user-name your-username
```

#### 2. Resource Already Exists
```bash
# Error: Resource with name already exists
# Solution: Use different environment suffix
export ENVIRONMENT_SUFFIX=unique-$(date +%s)
pulumi up
```

#### 3. CloudTrail S3 Bucket Policy Issues
```bash
# Error: InsufficientS3BucketPolicyException
# Solution: Verify S3 bucket policy allows CloudTrail access
aws s3api get-bucket-policy --bucket your-cloudtrail-bucket
```

#### 4. KMS Key Policy Problems
```bash
# Error: MalformedPolicyDocumentException
# Solution: Ensure KMS key policy allows necessary services
aws kms get-key-policy --key-id your-key-id --policy-name default
```

### Debugging Steps

#### Enable Verbose Logging
```bash
# Enable Pulumi debug logging
export PULUMI_DEBUG_COMMANDS=true
export PULUMI_DEBUG_GRPC=true
pulumi up -v=9
```

#### Check AWS CloudTrail Events
```bash
# View recent API calls
aws logs filter-log-events --log-group-name CloudTrail/financial-app
```

#### Validate Resource Dependencies
```bash
# Check resource creation order
pulumi stack graph | dot -Tpng > dependency-graph.png
```

### Recovery Procedures

#### Partial Deployment Failure
```bash
# Cancel current operation
pulumi cancel

# Fix configuration issues
# Re-run deployment
pulumi up
```

#### Complete Stack Recovery
```bash
# Destroy and recreate (if necessary)
pulumi destroy --yes
pulumi up --yes
```

## Security Maintenance

### Regular Security Tasks

#### 1. Update Dependencies
```bash
# Update Gradle dependencies
./gradlew dependencyUpdates

# Update Pulumi providers
pulumi plugin install resource aws --reinstall
```

#### 2. Review Access Logs
```bash
# Analyze CloudTrail logs for suspicious activity
aws logs filter-log-events \
    --log-group-name CloudTrail/financial-app \
    --start-time $(date -d '1 day ago' +%s)000
```

#### 3. Rotate KMS Keys
```bash
# Create new key version (automatic rotation)
aws kms enable-key-rotation --key-id your-key-id

# Verify rotation status
aws kms get-key-rotation-status --key-id your-key-id
```

### Compliance Checks

#### Monthly Reviews
- Review CloudTrail logs for unauthorized access
- Verify encryption status of all resources
- Check security group rules for unnecessary exposure
- Validate IAM role permissions against principle of least privilege

#### Quarterly Assessments
- Update security documentation
- Review and update backup procedures
- Conduct disaster recovery testing
- Update incident response procedures

## Performance Optimization

### Cost Management
```bash
# Monitor costs
aws ce get-cost-and-usage \
    --time-period Start=2024-01-01,End=2024-02-01 \
    --granularity MONTHLY \
    --metrics BlendedCost

# Optimize resources
- Use Reserved Instances for long-term workloads
- Enable S3 Intelligent Tiering
- Monitor and optimize CloudWatch log retention
```

### Performance Tuning
- Monitor CloudWatch metrics for resource utilization
- Adjust instance types based on actual usage
- Optimize security group rules for performance
- Consider VPC endpoints for AWS service access

## Cleanup and Destruction

### Safe Cleanup Process
```bash
# Stop running instances (if needed)
aws ec2 stop-instances --instance-ids $(pulumi stack output instanceIds)

# Empty S3 buckets (required before destruction)
aws s3 rm s3://$(pulumi stack output s3BucketName) --recursive

# Destroy infrastructure
pulumi destroy --yes

# Remove Pulumi stack (optional)
pulumi stack rm financial-app-dev
```

### Verification of Cleanup
```bash
# Verify no resources remain
aws ec2 describe-instances --filters "Name=tag:Project,Values=financial-app"
aws s3 ls | grep financial-cloudtrail-logs
aws kms list-keys | grep financial-app
```

## Support and Contact

For technical support:
1. Check this documentation first
2. Review AWS CloudTrail logs for errors
3. Consult Pulumi documentation at pulumi.com
4. Review test output for configuration issues

Remember to follow security best practices and maintain proper access controls throughout the infrastructure lifecycle.