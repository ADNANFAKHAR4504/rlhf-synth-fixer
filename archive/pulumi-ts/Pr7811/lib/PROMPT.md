# AWS Compliance Monitoring System

Create a comprehensive AWS compliance monitoring system using Pulumi TypeScript that automatically checks and reports on AWS resource compliance across multiple categories. The system should use Lambda functions to perform periodic compliance checks and store results for audit purposes.

## Requirements

### Core Infrastructure

1. **Lambda Function for Compliance Checks**
   - Create a Lambda function that performs the following compliance checks:
     - S3 bucket encryption verification
     - EC2 security group rule validation (no overly permissive rules)
     - IAM password policy compliance
     - CloudTrail logging enablement
     - VPC flow logs verification
   - Lambda should be written in Node.js (TypeScript)
   - Lambda should use AWS SDK v3
   - Include proper error handling and logging

2. **IAM Role and Permissions**
   - Create an IAM role for the Lambda function
   - Grant minimum required permissions:
     - Read-only access to S3 (s3:GetEncryptionConfiguration, s3:ListBuckets)
     - Read-only access to EC2 (ec2:DescribeSecurityGroups)
     - Read-only access to IAM (iam:GetAccountPasswordPolicy)
     - Read-only access to CloudTrail (cloudtrail:DescribeTrails, cloudtrail:GetTrailStatus)
     - Read-only access to VPC (ec2:DescribeFlowLogs)
     - CloudWatch Logs write permissions

3. **EventBridge Schedule**
   - Schedule the Lambda to run every 12 hours
   - Use EventBridge (CloudWatch Events) rule
   - Ensure proper permissions for EventBridge to invoke Lambda

4. **SNS Topic for Alerts**
   - Create an SNS topic for compliance violation notifications
   - Lambda should publish to this topic when violations are found
   - Export the topic ARN as an output

5. **CloudWatch Dashboard**
   - Create a CloudWatch dashboard to visualize:
     - Number of compliance checks performed
     - Number of violations found
     - Lambda execution duration and errors
   - Include widgets for each compliance check category

### Outputs

Export the following as Pulumi stack outputs:
- Lambda function ARN
- Lambda function name
- SNS topic ARN
- CloudWatch dashboard URL
- IAM role ARN

### Constraints

- Use AWS region: us-east-1
- All resources should be tagged with:
  - Environment: production
  - Project: compliance-monitoring
  - ManagedBy: pulumi
- Lambda timeout: 300 seconds
- Lambda memory: 512 MB
- Lambda runtime: nodejs20.x

## Implementation Notes

- Use Pulumi's `@pulumi/aws` package
- Implement the Lambda function code inline or as a separate asset
- Ensure all resources follow AWS best practices
- Include proper error handling in Lambda code
- Use environment variables for Lambda configuration
- Implement retry logic for AWS API calls in Lambda
