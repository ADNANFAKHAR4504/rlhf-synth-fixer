Problem Statement:
You are tasked with creating a security-focused serverless application using AWS and Terraform HCL. The application should consist of a series of AWS components that ensure data security, access management, and monitoring.

# Requirements include:

Provision a secure S3 bucket with encryption and disable public access.

Deploy a Lambda function using Node.js 14.x with specific timeout and environment configurations.

Set up CloudWatch monitoring and logging with necessary encryption,

Implement an IAM role with least privilege and cross-account accessibility, and

Create a CloudFront distribution paired with a Web Application Firewall (WAF).

Environment This environment will be set up within the us-west-2 AWS region. Resources must follow naming conventions beginning with 'secureApp-'. This includes setting up infrastructure to handle security, logging, and monitoring, with Terraform deployed resources accessed by IAM roles and services.

# Constraints Items:

Must use Terraform HCL to define resources.

Ensure the S3 bucket is encrypted using AES-256 encryption.

IAM role should have least privilege access to S3 and CloudWatch services.

Lambda function must have a timeout set to a maximum of 30 seconds.

All resources should be deployed in the us-west-2 region.

S3 bucket should block all public access settings.

Setup a CloudWatch alarm for Lambda function errors with a threshold of 5 errors within 1 minute.

Encrypt CloudWatch log groups using KMS managed keys.

All resource names must be prefixed with 'secureApp-'.

All outputs should be exportable and properly tagged.

Lambda should be deployed with Node.js 14.x runtime.

Define a CloudFront distribution with S3 as origin with SSL enabled.

Implement a WAF with a basic IP rule set attached to CloudFront.

Resource stack should be reusable with parameterized inputs.

Follow the AWS best practices for handling secrets.

Utilize environment variables for configuration details of Lambda.

Ensure no hardcoded secrets within codebase.

Role for Lambda should be cross-account accessible.

# Non-negotiable:

The provider.tf already exists and holds the AWS provider + S3 backend.

Do not put a provider block in main.tf. That stays in provider.tf.

The variable "aws_region" must be declared in main.tf and is consumed by provider.tf.

Quality, Testing & Linting

Output HCL must be formatted and readable (terraform fmt compatible).

Include tflint friendly code and avoid deprecated attributes.

Provide a short Makefile or scripts/ entries with commands to run terraform fmt, terraform validate, terraform plan, tflint, and a suggested tfsec or checkov command for static security checks.

Provide a simple unit/acceptance checklist in the README describing how to validate:

S3 has AES-256 (SSE-S3) enabled and public access blocked.

Lambda runtime is nodejs14.x and timeout <= 30s.

CloudWatch log group kms_key_id is set and the key exists.

Alarm triggers at >=5 errors within 1 minute.

CloudFront distribution serves via HTTPS, and WAF is attached.

IAM role ARN includes trust policy for the Lambda service and the configured trusted_account_ids.

# Output Expectations:

- Produce a complete, runnable Terraform HCL modules.
