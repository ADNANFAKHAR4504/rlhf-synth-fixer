# CDK Java IAC Diagnosis/Edits

Hello, I need a CDK Java code that satisfies all the below requirements. Here's what it should include.

## Stack Structure

Single unified stack called TapStack, no separate network/data/compute stacks. Everything lives in one place to avoid circular dependencies.

## What Gets Created

VPC Setup
- CIDR block 10.0.0.0/16 with 2 availability zones
- Public and private subnets (24-bit mask)
- 1 NAT Gateway for cost savings
- VPC endpoints for S3 and DynamoDB to reduce NAT costs

Security Group
- For Lambda functions
- Allows HTTPS (443) from within VPC
- Outbound allows all

S3 Bucket
- Named like tap-data-bucket-{env}-{account}
- S3-managed encryption, versioning enabled
- Lifecycle rules: transition to IA after 90 days, delete old versions after 30 days
- Block all public access
- Retention policy to keep bucket on stack deletion

Lambda Function
- Python 3.11 runtime
- Runs in private subnets with VPC config
- 256MB memory, 30 second timeout
- Inline code that lists objects from input/ prefix in S3
- Environment variables for BUCKET_NAME and ENVIRONMENT

CloudWatch Logs
- Log group at /aws/lambda/tap-processor-{env}
- 1 week retention
- Gets destroyed with stack

IAM Role
- Least privilege policies, everything scoped to specific resources
- S3: GetObject/GetObjectVersion on input/*, PutObject on output/*
- S3: ListBucket with condition for input/* and output/* prefixes
- CloudWatch: CreateLogStream and PutLogEvents on specific log group
- SSM: GetParameter on /tap/{env}/* path
- VPC execution: network interface permissions (uses wildcard because ENIs are dynamic)

## Cross-Stack Sharing

SSM Parameters
- /tap/{env}/vpc-id
- /tap/{env}/data-bucket-name
- /tap/{env}/data-bucket-arn

CloudFormation Outputs
- VPC ID, Security Group ID, Bucket Name/ARN, Function ARN
- All exported with environment suffix in the name

## Environment Support

Uses environmentSuffix from CDK context or defaults to "dev". Pass it like:
```
cdk deploy -c environmentSuffix=prod
```

Gets account and region from CDK_DEFAULT_ACCOUNT and CDK_DEFAULT_REGION environment variables.

## CDK Nag Integration

Aspects.of(app).add(new AwsSolutionsChecks()) runs on the whole app.

Suppressions with justifications:
- VPC Flow Logs disabled for dev cost savings
- S3 SSL enforcement handled via IAM not bucket policy
- Security group outbound all needed for VPC endpoints
- IAM wildcard for CloudWatch log streams (required) and VPC ENIs (dynamic resources)
- S3 access logging not needed for this use case
- Python 3.11 is current runtime

## File Structure

Just need:
- Main.java with TapStack class and TapStackProps class all in one file
- Main class with main() method
- build.gradle with dependencies for CDK, S3, Lambda, EC2, IAM, Logs, SSM, and cdk-nag

## How It Should Work

Run cdk synth - should complete with CDK Nag checks passing (with suppressions)
Run cdk deploy --all - deploys everything
Run cdk deploy --all again - should show no changes, nothing gets replaced

Resource names use stable patterns so redeployment doesn't recreate stuff. Bucket name includes account ID for global uniqueness.

Lambda has actual working Python code that connects to S3, not just a placeholder. It lists files from the input/ prefix and returns them in a JSON response.

## Important Notes

Everything uses least privilege. Wildcards only where absolutely necessary (log streams, VPC ENIs) with comments explaining why.

All resources have proper logical IDs that don't change between deployments.

The inline policies are scoped tight - S3 permissions split between read (input/*) and write (output/*) paths.

VPC execution policy needs wildcards because Lambda creates network interfaces dynamically - can't know the resource IDs ahead of time.

Just give me code that works out of the box without modifications.