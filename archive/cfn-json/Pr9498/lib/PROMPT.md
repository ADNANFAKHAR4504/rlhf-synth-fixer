Create an AWS CloudFormation template in JSON format to deploy a secure web application infrastructure with integrated content delivery and serverless processing.

The template must provision these resources in the us-east-1 region with clear integration patterns:

S3 Bucket:
 Create an S3 bucket for storing application assets that CloudFront will serve.
 Enable versioning on the bucket.
 Encrypt the bucket using a customer-managed AWS KMS key.
 Configure the bucket policy to allow CloudFront Origin Access Control to read objects.

IAM & Lambda:
 Define a Lambda function and a corresponding IAM execution role with least privilege access.
 The IAM role must grant only the permissions needed for the function to retrieve secrets from AWS Secrets Manager and write logs to CloudWatch.
 Configure the function to access sensitive data such as API keys stored in Secrets Manager.
 The function should integrate with API Gateway to process incoming requests.

CloudFront and WAF:
 Set up a CloudFront distribution that serves content from the S3 bucket using Origin Access Control.
 The distribution must use an SSL certificate from AWS Certificate Manager for HTTPS connections.
 Protect the distribution by attaching an AWS WAF WebACL to guard against common web exploits like SQL injection and XSS attacks.
 Configure CloudFront to forward appropriate headers to the origin.

API Gateway:
 Create an API Gateway REST API that triggers the Lambda function for backend processing.
 Enable CloudWatch logging for all stages to track API usage and errors.

Tagging:
 Apply Environment, Project, and Owner tags to all created resources for proper resource management.

Make sure the CloudFormation JSON is well-structured with clear resource dependencies. The template should be valid and pass validation using the AWS CLI command aws cloudformation validate-template.