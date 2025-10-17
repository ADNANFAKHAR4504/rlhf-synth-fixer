You are an expert AWS Infrastructure Engineer. Create infrastructure using **CloudFormation with JSON** for an e-commerce order processing monitoring system.

## Requirements

Build a monitoring infrastructure for an e-commerce order processing application deployed in ap-southeast-1. The system must:

1. **DynamoDB Table** for storing order events with the following schema:
   - Primary key: orderId (String)
   - Sort key: timestamp (Number)
   - Global Secondary Index: status-timestamp-index with status as partition key and timestamp as sort key
   - Enable point-in-time recovery
   - Use on-demand billing mode

2. **S3 Bucket** for order audit logs with:
   - Versioning enabled
   - Server-side encryption using AES256
   - Lifecycle policy to transition objects to Glacier after 90 days
   - Block all public access

3. **Lambda Function** that processes order status changes:
   - Runtime: nodejs20.x
   - Triggered by DynamoDB Streams
   - Write audit logs to S3
   - Environment variables for S3 bucket name

4. **SNS Topic** for order processing alerts with:
   - Email subscription endpoint for critical order failures
   - Encryption at rest using AWS managed keys

5. **CloudWatch Alarm** to monitor Lambda errors:
   - Trigger when error rate exceeds 5% over 5 minutes
   - Send notifications to SNS topic

6. **IAM Roles and Policies**:
   - Lambda execution role with permissions for DynamoDB streams, S3 write, SNS publish, and CloudWatch logs
   - Follow least privilege principle

## Technical Constraints

- Region: ap-southeast-1
- ALL resource names MUST include the ${EnvironmentSuffix} parameter
- Use naming pattern: {resource-type}-${EnvironmentSuffix}
- Enable encryption for all data at rest
- Tag all resources with Environment and Purpose tags
- Ensure infrastructure is fully destroyable (no DeletionPolicy: Retain)

## Lambda Function Code

The Lambda function should:
- Parse DynamoDB stream records
- Extract order information (orderId, status, timestamp)
- Write JSON formatted audit log to S3 with key pattern: `orders/{orderId}/{timestamp}.json`
- Publish to SNS if order status is "FAILED"
- Handle errors gracefully with proper logging

## Outputs

Export the following stack outputs:
- DynamoDB table name and ARN
- S3 bucket name and ARN
- Lambda function name and ARN
- SNS topic ARN
- CloudWatch alarm name

## Success Criteria

- All resources deploy successfully in ap-southeast-1
- DynamoDB streams enabled and connected to Lambda
- Lambda can write to S3 and publish to SNS
- CloudWatch alarm properly configured
- All resources properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
