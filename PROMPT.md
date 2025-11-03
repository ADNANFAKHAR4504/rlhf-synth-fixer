# IaC Program Optimization

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using Pulumi with TypeScript**
>
> Platform: **pulumi**
> Language: **ts**
> Region: **ap-northeast-2**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Problem Statement

Create a Pulumi TypeScript program to optimize an existing Lambda-based image processing infrastructure. The configuration must:

1. Refactor three Lambda functions (thumbnail generator, watermark applier, metadata extractor) to use ARM64 architecture for cost savings.
2. Implement Lambda SnapStart for the Java-based watermark function to reduce cold starts.
3. Configure reserved concurrency of 50 for the thumbnail function and 25 for others.
4. Set memory allocations based on profiling data: thumbnail (1024MB), watermark (512MB), metadata (256MB).
5. Create Lambda layers for shared dependencies to reduce deployment package sizes.
6. Configure CloudWatch Log retention to 7 days instead of the current never-expire setting.
7. Add X-Ray tracing to identify performance bottlenecks.
8. Implement proper IAM roles with least privilege access to S3 buckets.
9. Set up Lambda function URLs with CORS configuration for direct invocation.
10. Configure environment variables for S3 bucket names using Pulumi config.

**Expected output:** A fully optimized Pulumi program that reduces Lambda costs by approximately 40% through architecture changes, right-sized memory allocation, and proper concurrency limits while improving cold start performance.

---

## Background

Your company's image processing service uses Lambda functions that are experiencing cold start delays and high memory usage. The existing Pulumi infrastructure needs optimization to reduce costs and improve performance while maintaining functionality.

## Environment Setup

AWS ap-northeast-2 region with existing Lambda functions processing images from S3. Current setup uses x86_64 architecture with oversized memory allocations. Requires Pulumi 3.x with TypeScript, Node.js 18+, and AWS CLI configured. Functions interact with S3 buckets in the same region for input/output image storage. CloudWatch Logs currently retaining all logs indefinitely, causing unnecessary costs.

## Constraints and Requirements

- Lambda layers must be under 50MB unzipped to meet AWS limits
- Function URLs must use IAM authentication, not public access
- X-Ray tracing must sample at 10% to control costs
- All Lambda functions must use the same KMS key for environment variable encryption
- Reserved concurrency total across all functions cannot exceed 100
- Lambda SnapStart can only be applied to Java runtime functions

---

## Implementation Guidelines

### Platform Requirements
- Use Pulumi as the IaC framework
- All code must be written in TypeScript
- Follow Pulumi best practices for resource organization
- Ensure all resources use the `environmentSuffix` variable for naming

### Lambda Optimization Requirements
- **Architecture**: Convert all functions from x86_64 to ARM64 (Graviton2) for cost savings
- **Memory Allocation**:
  - Thumbnail generator: 1024MB
  - Watermark applier: 512MB
  - Metadata extractor: 256MB
- **Concurrency**:
  - Thumbnail generator: 50 reserved concurrent executions
  - Watermark applier: 25 reserved concurrent executions
  - Metadata extractor: 25 reserved concurrent executions
- **SnapStart**: Enable for Java-based watermark function only
- **Lambda Layers**: Create shared dependency layers (must be under 50MB unzipped)

### CloudWatch Configuration
- Set log retention to 7 days for all Lambda function log groups
- Enable X-Ray tracing with 10% sampling rate for cost control

### Lambda Function URLs
- Configure direct invocation URLs for all three functions
- Use IAM authentication (not public access)
- Configure CORS settings appropriately

### Security Requirements
- Implement IAM roles with least privilege access to S3 buckets
- Use the same KMS key for encrypting environment variables across all functions
- Environment variables for S3 bucket names should be sourced from Pulumi config

### Resource Naming
- All resources must use the `environmentSuffix` variable for naming
- Example: `thumbnail-lambda-${environmentSuffix}`

### Testing
- Write unit tests with good coverage
- Integration tests must validate end-to-end workflows using deployed resources
- Load test outputs from `cfn-outputs/flat-outputs.json`

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- **Important**: Secrets should be fetched from existing Secrets Manager entries, not created
- Avoid DeletionPolicy: Retain unless required

## Target Region
Deploy all resources to: **ap-northeast-2**

## Success Criteria
- Infrastructure deploys successfully with all three Lambda functions optimized
- ARM64 architecture is used for all functions
- SnapStart is enabled for the Java watermark function
- Reserved concurrency is properly configured (total not exceeding 100)
- Lambda layers are created and under 50MB unzipped
- CloudWatch Logs retention is set to 7 days
- X-Ray tracing is enabled with 10% sampling
- Function URLs are configured with IAM authentication
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
