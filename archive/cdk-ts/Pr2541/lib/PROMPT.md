# CDK TypeScript IAM Roles Task

I need to convert a CloudFormation task into a CDK TypeScript application. The goal is to create secure IAM roles with least privilege access across multiple AWS regions.

## What I'm Building

A CDK TypeScript app that creates IAM roles for different workloads (Lambda, EC2, CodeBuild, CodePipeline) with proper security controls. The stack should work across multiple regions and include rollback protection.

## Key Requirements

### IAM Security
- Create separate roles for each workload (Lambda, EC2, CodeBuild, CodePipeline)
- Use least privilege - only the minimum permissions needed
- Scope permissions to specific resources using ARNs
- Add conditions where possible (like kms:ViaService)

### Multi-Region Support
- Deploy the same logical setup to two regions
- Handle region-specific naming and tagging
- Export role ARNs for cross-stack references

### Stack Protection
- Enable automatic rollback on deployment failures
- Add stack policy to protect critical resources (KMS key, S3 bucket, CloudWatch logs)
- Enable termination protection for production environments

### Resources to Create
- KMS key for encryption (protected resource)
- S3 bucket for application logs (protected resource)  
- CloudWatch Log Group for application logs (protected resource)
- IAM roles for each workload with specific permissions

## Technical Constraints

- Use AWS CDK v2 with TypeScript
- Keep configuration minimal but complete
- Ensure all resources can be cleaned up when stack is destroyed
- Follow AWS security best practices
- Make bucket names lowercase
- Include proper removal policies

## Expected Output

The CDK app should create:
1. A main stack class (`TapStack`) with all resources
2. Entry point in `bin/tap.ts` 
3. Proper unit tests with good coverage
4. Integration tests for the complete stack

## Integration Test Requirements

The integration tests expect the stack name to be `TapStack${environmentSuffix}` where environmentSuffix comes from context or props. This is important for the CI/CD pipeline.

## What I Don't Want

- Overly complex configurations
- Unnecessary resources
- Hardcoded values that should be parameterized
- Missing test coverage
- Resources that can't be cleaned up

The focus should be on creating a clean, secure, and maintainable CDK application that follows AWS best practices.