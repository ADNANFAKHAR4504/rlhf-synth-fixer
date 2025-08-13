Develop a single, valid CloudFormation template named FinApp-Security.yaml for deployment in the us-east-1 region. The template must provision the following resources according to the specified naming convention (FinApp-<ResourceType>) and security constraints.

1. Secure S3 Bucket (FinAppS3Bucket)

Encryption at Rest: The AWS::S3::Bucket must be configured to enforce server-side encryption using S3-managed keys (SSE-S3). This should be the default encryption setting for all objects uploaded to the bucket.

Encryption in Transit: The bucket must have a Bucket Policy that explicitly denies any request that is not sent over a secure connection (SSL/TLS). This is a critical control to enforce transport layer security.

Access Control: The bucket must be configured to block all public access.

2. Least-Privilege IAM Role (FinAppS3AccessRole)

Role Definition: Create an AWS::IAM::Role that can be assumed by the EC2 service (ec2.amazonaws.com).

Least-Privilege Policy: Create a corresponding AWS::IAM::Policy that grants the absolute minimum permissions required for an application to interact with the S3 bucket. The policy must:

Allow only the following actions: s3:GetObject, s3:PutObject, and s3:DeleteObject.

Scope these permissions down to the specific ARN of the FinAppS3Bucket and the objects within it. No other bucket should be accessible.

Instance Profile: Create an AWS::IAM::InstanceProfile to make this role attachable to an EC2 instance.

Template Outputs:

To ensure the resources can be easily referenced by other parts of the application, the template must export the following values in the Outputs section:

S3BucketName: The name of the created S3 bucket.

S3AccessRoleArn: The ARN of the created IAM role.

Expected Result:

A single, valid FinApp-Security.yaml file. The template must be well-structured, pass all AWS CloudFormation validation and security checks, and be ready to deploy a secure, compliant storage foundation for a financial application.