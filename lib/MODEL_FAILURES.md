# Failures

- **Region configuration mismatch**  
  Default region hardcoded to us-east-1 in Pulumi.yaml; prompt required region agnostic or default region support (should dynamically use config or default to us-west-2 ).

- **Lambda VPC deployment missing**  
  No VPC, subnets, or security groups defined — Lambda runs outside a VPC, contrary to AWS best-practice isolation for sensitive processing.

- **IAM policy not fully least-privilege**  
  Uses broad AWSLambdaBasicExecutionRole and full S3 actions on entire buckets; should restrict to s3:GetObject , s3:PutObject for exact prefixes and avoid managed policies.

- **CloudWatch logging partially implemented**  
  Logging enabled but no error or throttle alarms beyond Lambda; lacks monitoring for S3 event or processing failures.

- **Dead-letter config incomplete**  
  DLQ configuration defined but target_arn left empty — no error handling mechanism in place.

- **Event trigger configuration not linked to bucket lifecycle**  
  S3 BucketNotification created without explicit depends*on linking to aws.lambda*.Permission ; may fail due to missing dependency ordering.

- **S3 encryption key type**  
  Uses AES256 (S3-managed key), while prompt preferred AWS-managed KMS key (SSE-KMS) for stricter security.

- **Destination bucket caching comment ambiguous**  
  Mentions “optimized for web display” but doesn’t set specific metadata headers or bucket policies for caching/CDN.

- **Lambda concurrent execution hardcoded**  
   reserved_concurrent_executions=100 is arbitrary — no autoscaling consideration or configurability from Pulumi config.

- **No explicit S3 notification filter test or condition**  
  Uses filter_prefix="uploads/" and blank suffix without validation; could trigger unintended files.

- **CloudWatch alarms partial**  
  Only duration/error alarms; missing invocation, throttle, or timeout alarms.

- **KMS key usage missing**  
  Encryption uses default S3 AES256 — lacks explicit KMS integration or per-bucket CMK.

- **Lambda layer packaging assumes prebuilt directory**  
  No Pulumi automation or dependency packaging in pipeline; relies on manual shell script.

- **Bucket naming non-unique across regions/accounts**  
  Static bucket names without randomness or account suffix may cause naming conflicts in multi-account environments.

- **No IAM policy for CloudWatch alarms or permissions**  
  Lambda role not granted cloudwatch:PutMetricData or logs:DescribeLogStreams if required for advanced monitoring.
