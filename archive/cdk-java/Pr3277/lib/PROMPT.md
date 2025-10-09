CDK Java Implementation Requirements

## What I Need

I need you to generate a complete CDK Java application that follows AWS best practices. The code should be production-ready and pass all compliance checks.

## Core Requirements

### Security - IAM Policies
- Use least-privilege IAM policies everywhere
- No wildcard permissions unless absolutely necessary
- Scope actions and resources as tightly as possible
- If you must use wildcards, explain why in comments

### Fix Circular Dependencies
- Make sure there are no circular dependencies between stacks
- Use these approaches:
  - Split resources into separate stacks when it makes sense
  - Use addDependency() to set explicit dependencies
  - Pass values between stacks using CloudFormation outputs
  - Store shared config in SSM Parameter Store

### Keep Resources Stable
- Use stable logical IDs so resources don't get replaced unexpectedly
- Don't use random or dynamic values in resource names
- Make sure re-deploying doesn't recreate existing resources

### Add CDK Nag
- Include cdk-nag compliance checking
- Suppress findings only when really needed
- Add clear justifications for any suppressions
- Goal is zero high/medium findings

## What to Build

Create a multi-stack application with:

**Network Stack**
- VPC with public and private subnets
- Security groups with minimal rules
- VPC endpoints for S3 and DynamoDB

**Data Stack**
- S3 bucket with encryption and versioning
- Proper bucket policies

**Compute Stack**
- Lambda function that can read/write to the S3 bucket
- IAM role with only the permissions it needs

**Cross-Stack References**
- Show how to properly share resources between stacks
- Use outputs and imports correctly

## Include These Files

- CdkApp.java (main entry point)
- All stack classes (NetworkStack, DataStack, ComputeStack)
- pom.xml with required dependencies
- Show how to integrate cdk-nag

## Expected Results

When I run this code:
```bash
cdk synth
Should complete with no errors
bashcdk deploy --all
Should deploy everything successfully
bashcdk deploy --all
Running deploy again should show "No changes" - nothing gets replaced
The cdk-nag checks should pass with zero high/medium severity findings (except properly suppressed ones).
Testing
The code should allow me to:

Deploy successfully on first try
Re-deploy without replacing any resources
Test that the Lambda can actually access S3 as intended
See that IAM permissions are properly scoped

Just give me complete, working code that I can deploy right away.
RetryClaude does not have the ability to run the code it generates yet.