Add data source for AWS account ID to properly reference account-specific resources:

- Add `data "aws_caller_identity" "current" {}`

Fix KMS key policies to include proper principals and permissions:

- Add Lambda service principal to lambda_key policy for decryption
- Ensure all KMS policies allow root user access for management

Correct VPC endpoint configuration:

- Fix route_table_ids references to use aws_route_table.private.id after route table definition
- Ensure proper ordering of resource declarations

Add missing route table associations:

- Add aws_route_table_association resources for private subnets

Fix S3 bucket naming:

- Replace `var.account_id` with `data.aws_caller_identity.current.account_id` in bucket names

Enhance S3 encryption configuration:

- Add `bucket_key_enabled = true` to server-side encryption rule

Complete SQS DLQ configuration:

- Add `visibility_timeout_seconds = 60` to notification_dlq

Add missing API Gateway authorizer IAM role and policy:

- Add aws_iam_role "api_gateway_authorizer_role"
- Add aws_iam_policy "lambda_invoke_policy"
- Add aws_iam_role_policy_attachment "api_gateway_lambda_invoke"

Add Lambda permissions for EventBridge invocation:

- Add aws_lambda_permission "allow_eventbridge"

Add depends_on for Lambda functions:

- Add depends_on = [aws_cloudwatch_log_group.*_lambda_logs] to all Lambda functions

Fix SNS topic encryption:

- Add `kms_master_key_id = aws_kms_key.lambda_key.key_id` to alarm_notification topic

Standardize resource naming:

- Append `${var.environment_suffix}` to all resource names for environment isolation

Enhance tagging strategy:

- Ensure consistent Name tags across all resources using environment suffix

Fix CloudWatch dashboard widget configurations:

- Correct API Gateway metric dimensions to use proper resource names
- Ensure all metric references use correct function/table names

Add explicit security group configurations:

- Define ingress rules for VPC endpoint security groups
- Ensure Lambda security group allows necessary outbound traffic

Correct EventBridge rule event pattern:

- Fix event pattern structure for proper event matching

Add reserved concurrency settings:

- Configure appropriate reserved_concurrent_executions for each Lambda function

Fix Lambda environment variable references:

- Ensure DYNAMODB_TABLE uses aws_dynamodb_table.transactions.name
- Add S3_BUCKET reference for fraud_scoring function

Complete IAM policy statements:

- Add missing KMS permissions for all keys
- Include EventBridge PutEvents permission
- Add explicit deny for non-VPC access
