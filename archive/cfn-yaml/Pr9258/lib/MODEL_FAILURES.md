# Model Failures

This document identifies issues found in the model's implementation and explains the fixes applied.

## Missing KMS Policy for Lambda

The Lambda function needs to use the KMS key to decrypt data from DynamoDB, but the original KMS key policy only allowed DynamoDB service access. Lambda couldn't decrypt the data.

Wrong approach: Only DynamoDB service principal in KMS policy

Should include: Lambda execution role needs kms:Decrypt permission on the KMS key

Fixed by adding KMS access policy to the Lambda execution role that allows Decrypt and DescribeKey actions on the specific KMS key ARN.

## SNS Email Subscription Not Configured

Model created an SNS topic but forgot to add the email subscription. The CloudWatch alarm would send notifications to a topic with no subscribers, so nobody gets alerted.

Missing: SNS::Subscription resource linking the topic to the SNSEmail parameter

Added SNS subscription resource that connects the alarm topic to the email address provided in parameters.

## API Gateway Stage Deployment Configuration

The API Gateway deployment was created but the stage wasn't properly configured with throttling settings and logging. This means rate limiting wouldn't work and access logs wouldn't be captured.

Issue: Stage settings for throttling and logging were incomplete

Fixed by ensuring the API Gateway stage has proper MethodSettings with throttling configuration (100 req/s rate, 50 burst) and access log settings pointing to the CloudWatch log group.

## Lambda Function Code Inline vs Package

For production deployments, Lambda code should be packaged and uploaded to S3 or provided as a deployment package, not just inline code. Inline code is fine for simple examples but this is a production-ready template.

However, for testing and LocalStack compatibility, inline code works better since it doesn't require S3 bucket setup or package management. The inline Python code handles the basic functionality correctly.

## LocalStack Compatibility Adjustments

The following modifications were made to ensure LocalStack Community Edition compatibility. These are intentional architectural decisions, not bugs.

| Feature | LocalStack Limitation | Solution Applied | Production Status |
|---------|----------------------|------------------|-------------------|
| SNS Email Subscription | Email notifications not fully supported | Protocol set to email, subscription included | Enabled in AWS |
| KMS Key Rotation | EnableKeyRotation may have limited support | Kept in template for AWS compatibility | Enabled in AWS |
| API Gateway Custom Domains | Not supported in Community | Removed custom domain references | Re-add for AWS |
| CloudWatch Alarms with Actions | Limited SNS integration | Alarm configured but testing may be limited | Full support in AWS |
| IAM Policy Conditions | Complex conditions may not work | Used simple resource-based policies | Full policies in AWS |

### Environment Detection Pattern

CloudFormation templates don't have built-in environment detection like CDK, but the template uses parameters (Environment, LogLevel) to allow different configurations for LocalStack vs AWS deployments.

### Services Verified Working in LocalStack

- Lambda (full support)
- API Gateway (basic REST API support)
- DynamoDB (full support)
- KMS (basic encryption)
- IAM (role and policy support)
- CloudWatch Logs (log group support)
- SNS (topic creation)

### Services with Limited Support

- SNS email notifications (topics work, but email delivery is mocked)
- CloudWatch Alarms (created but may not trigger in LocalStack)
- KMS key rotation (setting is accepted but rotation may not execute)

## Testing Considerations

The template is designed to work in both LocalStack and AWS environments. When testing in LocalStack:

1. Use default parameter values
2. SNS email notifications will be mocked
3. CloudWatch alarms will be created but may not trigger
4. All core functionality (Lambda, API Gateway, DynamoDB) works correctly

When deploying to AWS:

1. Provide a real email address for SNSEmail parameter
2. Confirm SNS subscription via email
3. CloudWatch alarms will send real notifications
4. All features work as expected
