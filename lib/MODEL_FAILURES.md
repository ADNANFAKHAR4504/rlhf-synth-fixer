# MODEL_FAILURES.md

## Fault 1: Inadequate Encryption and Security Configuration

The model's implementation uses weaker encryption methods and lacks proper security controls:

- **DynamoDB Table**: Uses `encryption=dynamodb.TableEncryption.AWS_MANAGED` instead of the required `CUSTOMER_MANAGED` with a custom KMS key
- **S3 Bucket**: Uses `encryption=s3.BucketEncryption.S3_MANAGED` instead of KMS encryption with a customer-managed key
- **Missing KMS Keys**: No customer-managed KMS keys are defined for encrypting S3, DynamoDB, or sensitive data
- **No Secrets Manager**: Fails to use AWS Secrets Manager for storing sensitive environment variables

## Fault 2: Missing CloudFront Distribution for S3 Static Website Hosting

The model's implementation lacks proper static website hosting configuration:

- **No CloudFront Distribution**: The S3 bucket is not properly configured with CloudFront for content delivery
- **Missing Website Configuration**: The S3 bucket doesn't have `website_index_document` and `website_error_document` properties set
- **No Error Responses Handling**: Missing CloudFront error responses configuration for 403/404 errors to redirect to index.html
- **No SSL Enforcement**: Missing `enforce_ssl=True` on the S3 bucket

## Fault 3: Insufficient Monitoring and Alarm Configuration

The model's implementation has weak monitoring and alarm settings:

- **Basic Alarm Configuration**: Alarms use minimal settings (threshold=1, evaluation_periods=1) without proper configuration for datapoints_to_alarm or treat_missing_data
- **Missing WAF Protection**: No Web Application Firewall (WAF) for API Gateway to protect against common web exploits and control traffic
- **No CloudWatch Dashboard**: No dashboard is created to visualize metrics
- **Missing Advanced Metrics**: Doesn't include comprehensive metrics for API Gateway (4XX/5XX errors, count) and Lambda (duration, invocations)
