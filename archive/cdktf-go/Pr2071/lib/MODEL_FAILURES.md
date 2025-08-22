Potential gaps and mitigations for the Go CDKTF serverless stack:

- Missing provider region → default to AWS_REGION env with fallback us-east-1.
- Lambda code packaging → embed minimal zip bytes and provide source_code_hash.
- S3 trigger wiring → use escape hatch to set lambda_function block in notification.
- Test fragility → assert presence of resource types in synthesized cdk.tf.json only.
- Least privilege → restrict S3 write prefixes and only needed log permissions.
