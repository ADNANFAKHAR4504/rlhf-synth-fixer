I need to build a serverless API using CloudFormation YAML that works with LocalStack. The API Gateway receives HTTP requests and routes them to a Lambda function that processes the requests and stores data in an S3 bucket.

Set up API Gateway as a REST API integrated with Lambda using proxy integration. All paths route to the same Lambda function - both root and wildcard paths connect to Lambda for processing.

Lambda connects to multiple services: it sends logs to CloudWatch, writes processed data to S3, and uses KMS to encrypt data before storing. The IAM role grants minimal permissions - CloudWatch access for logging, S3 operations on the data bucket like GetObject, PutObject, DeleteObject and ListBucket, plus KMS permissions to decrypt and generate data keys.

The S3 bucket receives processed data from Lambda. A customer-managed KMS key encrypts all objects that Lambda writes to the bucket. Public access is blocked and versioning is enabled.

Lambda sends all logs to a dedicated CloudWatch log group with 14 day retention. This captures incoming requests from API Gateway and outgoing responses.

The KMS key encrypts S3 bucket data. Lambda accesses this key when writing encrypted files to S3. Add an alias for easier reference.

For LocalStack compatibility, skip key rotation, bucket lifecycle policies, and CloudWatch alarms since LocalStack doesn't support those well. Use inline IAM policies instead of managed policy ARNs.

Stack outputs include the API Gateway URL for testing, Lambda ARN, S3 bucket name, and KMS key details.

When API Gateway forwards a request to Lambda, Lambda extracts the HTTP method, path, query parameters, and body, then writes that data as JSON files to S3 organized by date. Lambda returns a success response with the request ID and S3 file location.
