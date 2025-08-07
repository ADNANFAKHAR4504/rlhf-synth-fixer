Write a production-ready AWS CloudFormation template in YAML that defines a highly available serverless application infrastructure to be deployed in the us-west-2 region. The template must meet all of the following requirements, without exception:

Naming Convention: All resources must be named using the prefix "ServerlessApp" followed by their type (e.g., ServerlessAppLambda, ServerlessAppS3Bucket, ServerlessAppSecret).

Region & High Availability: All resources must be explicitly deployed to us-west-2 and distributed for high availability across multiple Availability Zones where possible.

Lambda Setup:

Deploy at least one AWS Lambda function as the core compute resource.

The Lambda function must be automatically triggered by file uploads (e.g., object created events) to a designated S3 bucket.

Lambda code/configuration should include secure access to sensitive values stored in AWS Secrets Manager.

S3 Bucket:

Create a specific S3 bucket (with ServerlessApp naming) to trigger the Lambda on file upload events.

Secrets Management:

Store all sensitive information needed by the Lambda in AWS Secrets Manager.

Ensure IAM policies grant Lambda only the minimal (least-privilege) permissions required to access its secrets.

IAM Roles and Policies:

Define all required IAM roles, policies, and trust relationships for Lambda, S3, and Secrets Manager.

All permissions must strictly adhere to the principle of least privilege.

CloudWatch Monitoring:

Integrate AWS CloudWatch to monitor Lambda’s invocation count and error rates via appropriate metrics and alarms.

Best Practices & Compliance:

The template must be free from AWS best practice violations.

It must strictly follow the specified project naming convention for all resources.

It must pass all CloudFormation validations.

Constraints:

The entire infrastructure must be described exclusively in AWS CloudFormation YAML syntax (no JSON, no scripts outside YAML).

All resources must be highly available and fault tolerant wherever possible.

Use variables and parameters appropriately for resource naming and configuration.

No requirements should be omitted or assumed; all must be clearly and explicitly implemented.

Expected Output:
A single CloudFormation YAML template that provisions the specified environment, adheres to the naming convention, implements all required infrastructure, access control, monitoring, and security, and passes validation checks.
