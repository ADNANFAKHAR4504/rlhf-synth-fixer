# Infrastructure Issues Fixed During QA

## Critical Infrastructure Fixes

### 1. DynamoDB TTL Configuration (Fixed)
**Issue**: The property `ttlSpecification` and `timeToLiveSpecification` are not valid in CDKTF for DynamoDB tables.
**Fix**: Changed to the correct property name `ttl` as per CDKTF AWS provider specification.

### 2. API Gateway CloudWatch Logging (Fixed)
**Issue**: API Gateway method settings attempted to enable logging without a configured CloudWatch role ARN.
**Fix**: Removed `loggingLevel` and `dataTraceEnabled` from method settings to avoid deployment failures. These can be added after configuring an account-level CloudWatch role for API Gateway.

### 3. DynamoDB Attribute Naming Convention (Fixed)
**Issue**: DynamoDB attributes were using camelCase (userId, referralTimestamp) instead of snake_case.
**Fix**: Updated to use snake_case (user_id, referral_timestamp) for consistency with AWS best practices and to match Lambda function expectations.

### 4. Lambda Handler Configuration (Fixed)
**Issue**: Lambda functions were referencing incorrect handler paths.
**Fix**: Updated handler to `index.handler` and reorganized Lambda code into proper directory structure with `index.js` files.

### 5. Lambda Environment Variables (Fixed)
**Issue**: Environment variables in Lambda functions were missing required suffixes (_NAME) and region configuration.
**Fix**: Updated all environment variable names to match what the Lambda code expects (e.g., REFERRAL_TABLE_NAME, IDEMPOTENCY_TABLE_NAME, REPORTS_BUCKET_NAME).

### 6. Missing Idempotency Table (Fixed)
**Issue**: The payout processor requires an idempotency table to prevent duplicate payouts, but it wasn't created in the initial implementation.
**Fix**: Added DynamoDB table for idempotency with TTL enabled to automatically clean up old entries.

### 7. S3 Bucket Lifecycle Transition (Fixed)
**Issue**: S3 lifecycle policy was attempting to transition to Glacier after 90 days, but the ID was inconsistent.
**Fix**: Updated lifecycle rule ID from 'archive-old-reports' to 'transition-to-glacier' for clarity.

### 8. Construct Naming Conflicts (Fixed)
**Issue**: TerraformOutput constructs had the same IDs as other resources, causing conflicts.
**Fix**: Renamed output IDs to avoid conflicts (e.g., 'referral-table-name' instead of 'referral-table').

### 9. EventBridge Schedule Expression (Fixed)
**Issue**: Schedule was set to run at midnight UTC which might conflict with other batch jobs.
**Fix**: Updated to run at 2 AM UTC to avoid peak processing times.

## Deployment Considerations

### CloudWatch Logging for API Gateway
To enable full API Gateway logging in production:
1. Create an IAM role for API Gateway to write to CloudWatch Logs
2. Set the role ARN in API Gateway account settings
3. Re-enable `loggingLevel` and `dataTraceEnabled` in method settings

### Resource Naming
All resources include the environment suffix to ensure isolation between deployments and avoid naming conflicts.

### Security Improvements
- All DynamoDB tables have point-in-time recovery enabled
- S3 bucket has versioning, encryption, and public access blocking
- Lambda functions use least-privilege IAM policies
- Dead letter queue configured for payout processing

### Monitoring
- CloudWatch dashboard created for real-time monitoring
- X-Ray tracing ready (Lambda Insights layer included)
- Metrics enabled for API Gateway throttling

### Cost Optimization
- DynamoDB tables use on-demand billing
- S3 lifecycle policy transitions old reports to Glacier
- Lambda functions sized appropriately for workload