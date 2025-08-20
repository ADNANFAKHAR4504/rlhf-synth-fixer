A concise Go CDKTF implementation that creates an S3 → Lambda pipeline without a VPC:

- Provider: region from AWS_REGION or us-east-1.
- S3 bucket: versioning enabled, public access blocked, SSE AES256.
- CloudWatch Log Group: 30-day retention.
- IAM: Lambda assume-role, custom policy for S3 read, prefix-scoped writes, and logs write; attachment to role.
- Lambda: python3.12, env vars, reserved concurrency, packaged via minimal local zip bytes.
- S3 notifications: object-created events invoke the Lambda; explicit lambda permission for S3 principal.
- Outputs: bucket_name, lambda_function_name, lambda_function_arn.

Tests (Go): synthesize app and assert expected resource types in cdk.tf.json; no live AWS calls.
