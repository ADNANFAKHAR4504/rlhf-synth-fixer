# Serverless Media Processing Pipeline with CI/CD Integration

Hey team,

We need to build a serverless image processing pipeline that automatically generates thumbnails when images are uploaded to S3. I've been looking at how we can implement this using **AWS CDK with TypeScript** and make it work seamlessly with our CI/CD pipeline for automated deployments across multiple environments.

The business wants an event-driven architecture that processes images on-demand without maintaining servers. When users upload images to a source bucket, the system should automatically detect the upload, process the image to create a thumbnail, and store it in a separate destination bucket. This needs to be cost-effective and scale automatically with demand.

Since this is a CI/CD Pipeline Integration task, the infrastructure must support automated deployment through GitHub Actions with proper security controls, approval gates, and multi-environment support. The pipeline needs to deploy to dev automatically, then require manual approval for staging and production deployments.

## What we need to build

Create a serverless image processing pipeline using **AWS CDK with TypeScript** that integrates with a CI/CD deployment workflow.

### Core Requirements

1. **Source and Destination S3 Buckets**
   - Create S3 bucket for image uploads (source bucket)
   - Create separate S3 bucket for storing thumbnails (destination bucket)
   - Configure S3 event notifications on source bucket to trigger processing
   - Both buckets must include environmentSuffix in their names for uniqueness

2. **Lambda Image Processing Function**
   - Create Lambda function to process images and generate thumbnails
   - Use Sharp library (or similar) for image manipulation
   - Function should read from source bucket and write to destination bucket
   - Include proper error handling for invalid images or processing failures
   - Configure CloudWatch Logs for monitoring and debugging

3. **IAM Permissions**
   - Create Lambda execution role with least privilege permissions
   - Grant read access to source S3 bucket
   - Grant write access to destination S3 bucket
   - Grant CloudWatch Logs permissions for logging
   - No overly broad permissions (avoid S3 wildcard access)

4. **Multi-Environment Support** (reference lib/ci-cd.yml)
   - Infrastructure must support dev, staging, and prod environments
   - Use environment context from CDK for environment-specific configuration
   - Resource naming must include environmentSuffix parameter
   - Compatible with GitHub Actions OIDC authentication
   - Support cross-account role assumptions for staging and prod

5. **Error Handling and Monitoring**
   - Implement try-catch blocks in Lambda function
   - Log all processing attempts and outcomes
   - Handle edge cases (non-image files, corrupted images, missing files)
   - Return meaningful error messages

### Technical Requirements

- All infrastructure defined using **AWS CDK with TypeScript**
- Deploy to **us-east-1** region
- Use AWS Lambda for serverless compute
- Use Amazon S3 for storage (source and destination buckets)
- Use CloudWatch Logs for logging
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environmentSuffix
- Lambda function code in lib/lambda/ directory
- Support environment parameters from CDK context

### Deployment Requirements (CRITICAL)

- All resources must be **destroyable** - NO Retain policies or DeletionProtection
- Use RemovalPolicy.DESTROY for S3 buckets (with autoDeleteObjects: true)
- Lambda function must NOT use deprecated Node.js versions (use Node.js 20+)
- Lambda should bundle dependencies (including Sharp library)
- Infrastructure must deploy successfully via automated CI/CD pipeline
- Support for cdk-nag security scanning

### AWS Services to Use

- **Amazon S3**: Source and destination buckets with event notifications
- **AWS Lambda**: Image processing function with Sharp layer
- **IAM**: Execution roles and policies with least privilege
- **CloudWatch Logs**: Centralized logging for Lambda execution

### Constraints

- **Region**: us-east-1 (default)
- **Complexity**: hard
- **Security**: Implement least privilege IAM permissions - no wildcard S3 access
- **Serverless**: Use Lambda and S3 only, no EC2 or containers
- **Performance**: Lambda should process images within reasonable timeout (30s max)
- **Cost**: Optimize for minimal costs using serverless architecture
- **Destroyability**: All resources must be fully destroyable without manual intervention

## Success Criteria

- **Functionality**: Images uploaded to source bucket trigger Lambda processing
- **Thumbnails**: Generated thumbnails stored in destination bucket with correct naming
- **Performance**: Lambda processes images within timeout limits
- **Security**: IAM roles follow least privilege principle
- **Logging**: CloudWatch Logs capture all processing events and errors
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **CI/CD Integration**: Infrastructure deploys successfully through automated pipeline
- **Code Quality**: TypeScript code is well-structured, typed, and follows CDK best practices
- **Destroyability**: Stack can be completely destroyed without errors

## What to deliver

- Complete AWS CDK TypeScript infrastructure code in lib/
- Main stack file (tap-stack.ts) with S3 buckets, Lambda, and IAM resources
- Lambda function code for image processing (lib/lambda/process-image/)
- Unit test placeholders in test/ directory
- All resources properly configured with environmentSuffix parameter
- Documentation on how the pipeline works
