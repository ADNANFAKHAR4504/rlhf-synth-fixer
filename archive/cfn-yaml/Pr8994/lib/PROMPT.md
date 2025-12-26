Write a production-ready AWS CloudFormation template in YAML that defines a highly available serverless application infrastructure to be deployed in the us-west-2 region. The template must meet all of the following requirements, without exception:

Naming Convention: All resources must be named using the prefix "ServerlessApp" followed by their type such as ServerlessAppLambda, ServerlessAppS3Bucket, ServerlessAppSecret.

Region and High Availability: All resources must be explicitly deployed to us-west-2 and distributed for high availability across multiple Availability Zones where possible.

Service Connectivity and Integration:

S3 bucket connects to Lambda function through event notifications. When files are uploaded to the S3 bucket, the bucket automatically triggers the Lambda function using S3 event notifications configured in the bucket properties.

Lambda function reads sensitive configuration values from AWS Secrets Manager during execution. The Lambda function uses the AWS SDK to retrieve secrets from Secrets Manager using the secret ARN provided through environment variables.

Lambda function assumes an IAM role that grants permissions to access Secrets Manager. The IAM role attached to the Lambda function includes policies that allow reading secrets from Secrets Manager using least-privilege access.

CloudWatch collects metrics from Lambda function invocations and errors. CloudWatch automatically captures Lambda invocation metrics and error rates, which are then monitored by CloudWatch alarms.

CloudWatch alarms trigger notifications when Lambda error thresholds are exceeded or invocation counts reach specified limits.

Lambda Setup:

Deploy at least one AWS Lambda function as the core compute resource.

The Lambda function must be automatically triggered by file uploads such as object created events to a designated S3 bucket.

Lambda code and configuration should include secure access to sensitive values stored in AWS Secrets Manager.

S3 Bucket:

Create a specific S3 bucket with ServerlessApp naming to trigger the Lambda on file upload events.

Secrets Management:

Store all sensitive information needed by the Lambda in AWS Secrets Manager.

Ensure IAM policies grant Lambda only the minimal least-privilege permissions required to access its secrets.

IAM Roles and Policies:

Define all required IAM roles, policies, and trust relationships for Lambda, S3, and Secrets Manager.

Each IAM policy must grant only the specific actions needed for each service. Use least-privilege access by specifying exact actions such as GetItem PutItem and Query for DynamoDB operations. Restrict resource ARNs to specific table names and avoid using broad resource patterns. Do not use overly permissive policy names or grant unnecessary administrative capabilities.

CloudWatch Monitoring:

Integrate AWS CloudWatch to monitor Lambda invocation count and error rates via appropriate metrics and alarms.

Best Practices and Compliance:

The template must be free from AWS best practice violations.

It must strictly follow the specified project naming convention for all resources.

It must pass all CloudFormation validations.

Constraints:

The entire infrastructure must be described exclusively in AWS CloudFormation YAML syntax with no JSON and no scripts outside YAML.

All resources must be highly available and fault tolerant wherever possible.

Use variables and parameters appropriately for resource naming and configuration.

No requirements should be omitted or assumed. All must be clearly and explicitly implemented.

Expected Output:
A single CloudFormation YAML template that provisions the specified environment, adheres to the naming convention, implements all required infrastructure, access control, monitoring, and security, and passes validation checks.
