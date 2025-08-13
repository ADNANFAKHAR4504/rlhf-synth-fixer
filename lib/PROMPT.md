You are a Cloud Compliance Officer responsible for implementing a new data protection standard for sensitive information. Your task is to create a definitive AWS CloudFormation template in YAML that provisions a new S3 bucket in the us-west-2 region. This bucket must serve as a "gold standard" for security and compliance, incorporating multiple layers of protection.

Core Task:

Develop a single, valid CloudFormation template named secure_s3_bucket.yaml. The template must provision all necessary resources to create a secure S3 bucket environment that meets the following stringent requirements.

1. Foundational Resources (Dependencies)

KMS Key: Before creating the primary bucket, provision a new AWS::KMS::Key. This key is dedicated to encrypting the S3 bucket's data.

Logging Bucket: Provision a separate AWS::S3::Bucket to serve as the destination for access logs. This logging bucket should have basic security settings, such as blocking public access.

2. Primary S3 Bucket (secure-data-<unique-id>)

Naming: The AWS::S3::Bucket name must be unique. Construct the name by concatenating secure-data- with the stack's unique ID (AWS::StackId).

Versioning: The bucket must have versioning enabled to protect against accidental overwrites and deletions.

Deletion Protection: The bucket resource in the template must have a DeletionPolicy of Retain to prevent accidental deletion of the bucket when the CloudFormation stack is deleted.

Server-Side Encryption: Configure the bucket's BucketEncryption property to enforce server-side encryption using the specific AWS KMS key created in the first step.

Access Logging: Configure server access logging on the bucket, directing all logs to the dedicated logging bucket created earlier.

3. Comprehensive Bucket Policy

The AWS::S3::BucketPolicy is the most critical component and must enforce the following rules simultaneously:

Deny Unencrypted Uploads: Include a statement with a Deny effect that rejects any s3:PutObject action if the request does not include the x-amz-server-side-encryption header specifying the use of the correct KMS key.

Enforce Encryption in Transit: Include a statement with a Deny effect that rejects any S3 action if the aws:SecureTransport condition is false. This ensures all requests are made via HTTPS.

Grant Cross-Account Access:

Use a CloudFormation Parameter of type String to accept the AWS Account ID of a trusted external partner.

Include a statement with an Allow effect that grants a specific external IAM role (e.g., arn:aws:iam::${ExternalAccountIdParameter}:role/ExternalDataReaderRole) read-only access (s3:GetObject).

Template Outputs:

The template must export the following values in the Outputs section for easy reference:

SecureBucketName: The full name of the primary data bucket.

KMSKeyArn: The ARN of the KMS key used for encryption.

Expected Result:

A single, valid secure_s3_bucket.yaml file. The template must be self-contained, well-commented, and ready to deploy a fully compliant and secure S3 bucket environment that passes all validation checks without errors.