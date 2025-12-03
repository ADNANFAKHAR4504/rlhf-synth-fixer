# Model Failures for AWS Compliance Monitoring System

This document catalogs common failures encountered when models attempted to implement the compliance monitoring system.

## Critical Failures (7)

### 1. Missing IAM Permissions for Lambda
**Severity**: Critical
**Description**: Lambda function created without proper IAM permissions to perform compliance checks. The Lambda role was either missing entirely or lacked read permissions for S3, EC2, IAM, CloudTrail, and VPC services.
**Impact**: Lambda function fails at runtime with "AccessDenied" errors when trying to perform compliance checks.
**Correct Approach**: Create an IAM role with policies granting specific read-only permissions: s3:GetEncryptionConfiguration, s3:ListBuckets, ec2:DescribeSecurityGroups, iam:GetAccountPasswordPolicy, cloudtrail:DescribeTrails, ec2:DescribeFlowLogs, and CloudWatch Logs write permissions.

### 2. Lambda Function Without Inline Code
**Severity**: Critical
**Description**: Lambda function created with empty or placeholder code, no actual implementation of compliance checks.
**Impact**: Lambda executes but performs no useful work, system doesn't detect any compliance violations.
**Correct Approach**: Implement all 5 compliance checks inline using AWS SDK v3: S3 encryption, EC2 security groups, IAM password policy, CloudTrail logging, and VPC flow logs.

### 3. Missing EventBridge Permissions
**Severity**: Critical
**Description**: EventBridge rule created to trigger Lambda but Lambda resource policy missing, preventing EventBridge from invoking the function.
**Impact**: Scheduled runs fail silently, Lambda never executes on schedule.
**Correct Approach**: Add aws.lambda.Permission resource granting events.amazonaws.com principal permission to invoke the Lambda function with the EventBridge rule as the source ARN.

### 4. Using AWS SDK v2 Instead of v3
**Severity**: Critical
**Description**: Lambda code uses deprecated AWS SDK v2 (require('aws-sdk')) instead of AWS SDK v3 modular imports.
**Impact**: Code fails in nodejs20.x runtime, increased Lambda package size, slower cold starts.
**Correct Approach**: Use AWS SDK v3 with modular imports: @aws-sdk/client-s3, @aws-sdk/client-ec2, @aws-sdk/client-iam, @aws-sdk/client-cloudtrail.

### 5. Incorrect Schedule Expression
**Severity**: Critical
**Description**: EventBridge rule created with invalid cron or rate expression (e.g., "every 12 hours" instead of "rate(12 hours)").
**Impact**: EventBridge rule fails to create or doesn't trigger as expected.
**Correct Approach**: Use valid rate expression: "rate(12 hours)" for the schedule.

### 6. Missing SNS Topic Subscription
**Severity**: Critical
**Description**: SNS topic created but Lambda doesn't publish messages to it when violations are found.
**Impact**: Compliance violations detected but no notifications sent, defeating the purpose of the monitoring system.
**Correct Approach**: Pass SNS topic ARN to Lambda via environment variable, use SNS SDK to publish formatted violation messages.

### 7. Lambda Timeout Too Short
**Severity**: Critical
**Description**: Lambda timeout set to default 3 seconds, insufficient for performing 5 different compliance checks across AWS services.
**Impact**: Lambda times out before completing checks, partial results or no results reported.
**Correct Approach**: Set Lambda timeout to 300 seconds as specified in requirements.

## High Severity Failures (6)

### 8. Missing Error Handling in Lambda
**Severity**: High
**Description**: Lambda code doesn't wrap AWS API calls in try-catch blocks, single API failure crashes entire function.
**Impact**: One failing compliance check prevents other checks from running, incomplete compliance reports.
**Correct Approach**: Wrap each compliance check in individual try-catch blocks, continue execution even if one check fails, report errors separately.

### 9. No Retry Logic for Transient Failures
**Severity**: High
**Description**: Lambda makes single attempts at API calls without retry logic for rate limiting or transient AWS API failures.
**Impact**: Intermittent failures lead to false negatives in compliance reports.
**Correct Approach**: Implement exponential backoff retry logic or use AWS SDK v3's built-in retry configuration.

### 10. CloudWatch Dashboard Not Created
**Severity**: High
**Description**: CloudWatch dashboard resource missing or empty, no visualization of compliance metrics.
**Impact**: No operational visibility into system performance or compliance trends.
**Correct Approach**: Create aws.cloudwatch.Dashboard with widgets showing Lambda metrics, custom metrics for each compliance check, and violation counts.

### 11. Missing Resource Tags
**Severity**: High
**Description**: Resources created without required tags (Environment, Project, ManagedBy).
**Impact**: Resources don't meet organization's tagging policy, difficult to track costs and ownership.
**Correct Approach**: Apply tags to all resources: Environment: production, Project: compliance-monitoring, ManagedBy: pulumi.

### 12. Lambda Logs Not Configured
**Severity**: High
**Description**: Lambda executes but doesn't create CloudWatch log group or has insufficient permissions to write logs.
**Impact**: No visibility into Lambda execution, debugging failures is impossible.
**Correct Approach**: Ensure Lambda IAM role has logs:CreateLogGroup, logs:CreateLogStream, logs:PutLogEvents permissions.

### 13. Hard-Coded Region Instead of Using Variable
**Severity**: High
**Description**: AWS resources hard-coded to specific region instead of using us-east-1 consistently or from configuration.
**Impact**: Resources may be created in wrong region, inconsistent deployment.
**Correct Approach**: Use pulumi config or environment variable for region, ensure all resources use the same region.

## Medium Severity Failures (2)

### 14. Missing Pulumi Stack Outputs
**Severity**: Medium
**Description**: Required outputs not exported (Lambda ARN, SNS topic ARN, dashboard URL, IAM role ARN).
**Impact**: Other systems or users can't discover resource identifiers without manual AWS console lookup.
**Correct Approach**: Export all required outputs using pulumi.export() with proper naming.

### 15. Lambda Memory Size Not Optimized
**Severity**: Medium
**Description**: Lambda created with default 128 MB memory instead of specified 512 MB.
**Impact**: Potential performance issues with multiple concurrent AWS SDK operations, longer execution times.
**Correct Approach**: Set Lambda memorySize to 512 MB as specified in requirements.

## Summary

Total Failures: 15
- Critical: 7 (prevent system from working)
- High: 6 (system works but with significant issues)
- Medium: 2 (system works but doesn't meet specifications)

Most common failure categories:
1. IAM permissions and security (failures #1, #3, #12)
2. Lambda implementation issues (failures #2, #4, #7, #8, #15)
3. Missing integrations (failures #6, #10, #14)
4. Configuration errors (failures #5, #9, #11, #13)
