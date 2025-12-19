Review the provided TapStack.yml networking template and fix the deployment issues. The current deployment error is:

An error occurred (ValidationError) when calling the CreateChangeSet operation: Parameters: [S3BucketName, AmiId] must have values

Key Issues

The template defines parameters S3BucketName and AmiId, but the deployment command did not provide values.

Without these values, CloudFormation validation fails.

Required Fixes

Update the template to provide safe defaults for parameters where possible.

For AmiId, use a Mappings section (AWS Region → latest Amazon Linux 2 AMI) so that it auto-resolves and does not require manual input.

For S3BucketName, either:

Add a default bucket name with environment suffix, or

Make it optional by creating a new bucket in the template and passing that name automatically.

Expected Output

A revised TapStack.yml that:

No longer fails deployment due to missing parameters.

Uses a default AMI mapping for Amazon Linux 2 in us-west-2.

Provides a secure S3 bucket with encryption enabled, so EC2 IAM role has a guaranteed resource to read/write.

Passes aws cloudformation validate-template and deploys successfully without requiring manual parameter overrides.