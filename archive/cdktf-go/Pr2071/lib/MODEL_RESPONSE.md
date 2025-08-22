Implemented a Go CDKTF stack that provisions:

- aws_s3_bucket with versioning, public access block, and SSE AES256
- aws_cloudwatch_log_group with 30-day retention
- aws_iam_role, aws_iam_policy, and attachment for least privilege
- aws_lambda_function (python3.12) and environment variables
- aws_s3_bucket_notification to trigger the Lambda
- aws_lambda_permission to allow S3 invoke

Outputs: bucket_name, lambda_function_name, lambda_function_arn.
