Create an AWS CloudFormation template in JSON format to deploy a secure web application infrastructure.

The template must provision the following resources and configurations in the us-east-1 region:

S3 Bucket:
 Create an S3 bucket for storing application assets.
 Enable versioning on the bucket.
 Encrypt the bucket using a customer-managed AWS KMS key.

IAM & Lambda:
 Define a Lambda function and a corresponding IAM execution role.
 The IAM role must follow the principle of least privilege, granting only the permissions the function absolutely needs.
 The function should be configured to access sensitive data (like an API key) stored in AWS Secrets Manager.

CloudFront and WAF:
 Set up a CloudFront distribution to serve content from the S3 bucket.
 The distribution must use an SSL certificate from AWS Certificate Manager (ACM).
 Protect the distribution by attaching an AWS WAF WebACL to guard against common web exploits.

API Gateway:
 Include an API Gateway with logging enabled for all stages.

Tagging:
 Apply the following tags to all created resources: Environment, Project, and Owner.

Finally, please make sure the CloudFormation JSON is well-structured and includes comments explaining the security-related resources. The final template should be valid and pass a check using the AWS CLI command aws cloudformation validate-template.