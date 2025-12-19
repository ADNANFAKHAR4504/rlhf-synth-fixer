Overview

This update addresses the CloudFormation deployment errors encountered with the initial TapStack.yml. During deployment, the following error occurred:

An error occurred (ValidationError) when calling the CreateChangeSet operation: 
Parameters: [S3BucketName, AmiId] must have values


The root cause was that the template required manual values for S3BucketName and AmiId, but no defaults were provided, causing the stack creation to fail when no explicit overrides were passed.

Fixes Implemented
1. AMI Resolution (AmiId Parameter → Mapping)

Removed the hard requirement for the AmiId parameter.

Introduced a Mappings section that dynamically resolves the latest Amazon Linux 2 AMI for us-west-2.

Updated the Launch Configuration to reference the AMI from this mapping.

Benefit: The stack now deploys without requiring manual AMI input.

2. Managed S3 Bucket (S3BucketName Parameter → Resource)

Removed the S3BucketName parameter.

Created a dedicated S3 bucket resource (AppDataBucket) inside the template with:

Server-Side Encryption (SSE-S3) enabled.

Environment-based naming convention (<EnvironmentName>-app-bucket).

Updated the IAM Role policy to allow access to this newly created bucket.

Benefit: Guarantees a valid and secure bucket for EC2 read/write operations, without requiring external bucket input.

Additional Improvements

Defaults & Simplification: Reduced reliance on external parameter overrides for smoother CI/CD pipeline integration.

Security: Enforced encryption on the S3 bucket to ensure compliance with data-at-rest requirements.

Consistency: Auto-provisioned resources (AMI, S3 bucket) prevent operator errors during deployment.

Expected Output

With these changes, the revised TapStack.yml will:

Automatically resolve the correct AMI ID for us-west-2.

Create a secure, encrypted S3 bucket within the stack.

Allow EC2 instances to read/write to the bucket through IAM role permissions.

Deploy successfully using the existing pipeline command:

aws cloudformation deploy \
  --template-file lib/TapStack.yml \
  --stack-name TapStack${ENVIRONMENT_SUFFIX:-dev} \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM


No manual parameter overrides for AmiId or S3BucketName are required anymore.