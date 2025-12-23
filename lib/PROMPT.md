I need to build a serverless API using CloudFormation YAML that works with LocalStack. The setup needs a Lambda function running python3.11 that handles HTTP requests coming through API Gateway. When requests come in, Lambda should process them and save the data to an S3 bucket.

For the API Gateway part, set it up as a REST API with proxy integration so all paths go to the same Lambda function. I want both the root path and any wildcard paths to work.

The Lambda needs an IAM role but keep it minimal - just enough permissions to write logs to its CloudWatch log group, do S3 operations on the data bucket like GetObject, PutObject, DeleteObject and ListBucket, and KMS permissions to decrypt and generate data keys since the bucket uses encryption.

The S3 bucket should encrypt everything with a customer-managed KMS key, block public access, and have versioning turned on. Lambda will write processed request data here.

Set up a CloudWatch log group for Lambda with 14 day retention so I can see what requests come in and what responses go out.

Create a KMS key for the S3 bucket encryption and add an alias to make it easier to reference. Lambda needs to access this key when writing encrypted data to S3.

Since this runs on LocalStack, don't include key rotation, bucket lifecycle policies, or CloudWatch alarms - LocalStack doesn't support those well. Also use inline IAM policies instead of managed policy ARNs.

The stack should output the API Gateway URL so I can test it, plus the Lambda ARN, S3 bucket name, and KMS key details.

The Lambda code itself should take incoming requests from API Gateway, pull out the HTTP method, path, query parameters, and body, then save all that as JSON files in S3 organized by date. Return a success response with the request ID and where it saved the file in S3.
