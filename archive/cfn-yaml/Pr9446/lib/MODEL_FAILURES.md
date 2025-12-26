# Model Failures Documentation

## Overview

This document tracks common failure patterns and issues encountered during the implementation of the AWS CloudFormation Automated EC2 Backup Solution.

## Common Failure Patterns

### 1. IAM Role Trust Relationships

**Issue**: Lambda function fails to execute due to incorrect trust relationship in IAM role.

**Solution**: Ensure the Lambda execution role has the correct trust policy allowing `lambda.amazonaws.com` as a trusted entity.

```yaml
AssumeRolePolicyDocument:
  Version: '2012-10-17'
  Statement:
    - Effect: Allow
      Principal:
        Service: lambda.amazonaws.com
      Action: sts:AssumeRole
```

### 2. S3 Bucket Policy Conflicts

**Issue**: S3 bucket creation fails due to conflicting bucket policies or public access settings.

**Solution**: Ensure `PublicAccessBlockConfiguration` is set before applying bucket policies. Use `DependsOn` to establish proper resource ordering.

### 3. EventBridge to Lambda Permission

**Issue**: EventBridge rule fails to invoke Lambda function due to missing permissions.

**Solution**: Create a `AWS::Lambda::Permission` resource that grants EventBridge the ability to invoke the Lambda function:

```yaml
LambdaInvokePermission:
  Type: AWS::Lambda::Permission
  Properties:
    FunctionName: !Ref BackupLambdaFunction
    Action: lambda:InvokeFunction
    Principal: events.amazonaws.com
    SourceArn: !GetAtt BackupScheduleRule.Arn
```

### 4. SSM Agent Not Running on EC2

**Issue**: SSM Run Command fails because SSM agent is not installed or running on the EC2 instance.

**Solution**:
- Use an AMI with SSM agent pre-installed (Amazon Linux 2 AMIs include it by default)
- Ensure the EC2 instance has the `AmazonSSMManagedInstanceCore` managed policy attached
- Verify the instance has network connectivity to SSM endpoints

### 5. VPC Endpoint Requirements

**Issue**: Lambda function in VPC cannot reach AWS services.

**Solution**: For Lambda functions in a VPC, ensure either:
- NAT Gateway is configured for outbound internet access
- VPC Endpoints are created for required AWS services (S3, SSM, CloudWatch Logs)

### 6. Security Group Configuration

**Issue**: EC2 instance cannot communicate with required services.

**Solution**: The security group should:
- Allow HTTPS (443) inbound for web traffic
- Allow all outbound traffic for SSM agent communication
- Not require SSH (22) for backup operations - SSM handles this securely

### 7. CloudWatch Logs Permissions

**Issue**: Lambda function cannot write logs to CloudWatch.

**Solution**: Ensure the Lambda execution role has the following permissions:
- `logs:CreateLogGroup`
- `logs:CreateLogStream`
- `logs:PutLogEvents`

## LocalStack-Specific Issues

### 1. S3 Path Style URLs

**Issue**: S3 operations fail with DNS resolution errors in LocalStack.

**Solution**: Configure S3 client with `forcePathStyle: true` for LocalStack compatibility.

### 2. Stack Name Variations

**Issue**: Integration tests fail because CI/CD uses different stack naming convention.

**Solution**: Implement dynamic stack name discovery that checks for multiple naming patterns.

### 3. CloudFormation Resource Status

**Issue**: Some CloudFormation operations return different status values in LocalStack.

**Solution**: Accept both `CREATE_COMPLETE` and `UPDATE_COMPLETE` as valid success states.

## Testing Recommendations

1. Always verify IAM role permissions before deploying Lambda functions
2. Test SSM connectivity before relying on Run Command for backups
3. Validate S3 bucket configurations including encryption and lifecycle policies
4. Ensure EventBridge rules have proper target configurations
5. Monitor CloudWatch Logs for Lambda execution errors

## References

- AWS CloudFormation Best Practices
- AWS Lambda Security Best Practices
- AWS Systems Manager Run Command Documentation
- LocalStack CloudFormation Support Documentation
