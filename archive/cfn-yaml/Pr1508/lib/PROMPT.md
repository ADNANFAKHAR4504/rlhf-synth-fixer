Prompt:
You are an expert AWS CloudFormation developer. Your task is to write one or more YAML-formatted CloudFormation templates that enforce strict security and compliance controls across multiple AWS accounts and regions.
Requirements
You must produce valid CloudFormation YAML that adheres to the following security rules:
S3 Bucket Security
All S3 buckets must be private by default.
Apply a Public Access Block configuration that denies all public ACLs and public policies.
Include a bucket policy that explicitly denies any public access.
CloudTrail
Enable AWS CloudTrail logging in all regions.
Must include global service events.
Log files must be encrypted with a KMS Customer Managed Key (CMK).
Store logs in a secure, access-controlled S3 bucket.
AWS Config
Enable AWS Config to monitor compliance with tagging policies across all resources.
Include a recorder, delivery channel, and at least one managed rule or custom rule for tagging compliance.
AWS Lambda
All AWS Lambda functions must run within a VPC.
Include required VpcConfig with subnets and security groups defined.
RDS Security
All RDS instances must use KMS CMKs for encryption at rest.
StorageEncrypted must be set to true.
IAM Security
Only allow IAM roles to have assumable permissions.
Avoid any trust policies that allow the AWS account root user.
Explicitly deny access to the root account where applicable.
Application Load Balancer (ALB)
Enforce SSL/TLS for all ALB listeners.
HTTP (port 80) traffic must be redirected to HTTPS (port 443).
TLS security policy must enforce TLS 1.2 or higher.
Output Format
The output must be a valid CloudFormation YAML template (or multiple templates if needed).
Use YAML fenced code blocks for the template(s) example:
Example CloudFormation Resource
Resources:
MyExample:
Type: AWS::S3::Bucket
Properties:
BucketName: my-secure-bucket
Do not include any explanatory text outside the YAML code blocks.
The templates must pass AWS CloudFormation validation (aws cloudformation validate-template) and follow AWS best practices.