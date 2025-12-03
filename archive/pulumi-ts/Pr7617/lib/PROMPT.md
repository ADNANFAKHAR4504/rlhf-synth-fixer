Hey team,

We need to optimize our existing Lambda-based image processing pipeline. The current setup is working but it's costing us more than it should, and we're seeing performance issues with cold starts. I've been asked to refactor this using Pulumi with TypeScript to implement some cost-saving measures and performance improvements.

We have three Lambda functions handling image processing: a thumbnail generator, a watermark applier written in Java, and a metadata extractor. The business wants us to move to ARM64 architecture for better cost efficiency, implement SnapStart for the Java function to reduce cold starts, and add proper observability with X-Ray tracing. We also need to clean up our CloudWatch logs which are piling up since we never set retention policies.

The team wants everything properly configured with reserved concurrency based on our usage patterns, and we need to set up Lambda layers to reduce our deployment package sizes. We should also add function URLs for direct invocation with proper CORS settings.

## What we need to build

Create an optimized Lambda infrastructure using **Pulumi with TypeScript** for our image processing pipeline.

### Core Requirements

1. **Lambda Function Refactoring**
   - Migrate all three Lambda functions to ARM64 architecture for cost savings
   - Thumbnail generator function with 1024MB memory
   - Watermark applier function with 512MB memory (Java runtime)
   - Metadata extractor function with 256MB memory

2. **Performance Optimization**
   - Enable Lambda SnapStart for the Java-based watermark function to reduce cold starts
   - Configure reserved concurrency: 50 for thumbnail generator, 25 for watermark and metadata functions
   - Set memory allocations based on profiling data

3. **Dependency Management**
   - Create Lambda layers for shared dependencies to reduce deployment package sizes
   - Ensure layers are ARM64 compatible
   - Share common libraries across functions where appropriate

4. **Logging and Retention**
   - Configure CloudWatch Log Groups with 7-day retention for all Lambda functions
   - Replace the current never-expire setting to control costs
   - Ensure proper log group naming

5. **Observability**
   - Add X-Ray tracing to all Lambda functions to identify performance bottlenecks
   - Configure Active tracing mode
   - Include X-Ray permissions in IAM roles

6. **Security and Access**
   - Implement separate IAM roles for each Lambda function with least privilege
   - Grant minimal required permissions to S3 buckets
   - Include CloudWatch Logs and X-Ray permissions
   - No overly permissive policies

7. **Lambda Function URLs**
   - Set up function URLs for all three Lambda functions for direct invocation
   - Configure CORS settings: Allow Origins ["*"], Allow Methods ["GET", "POST"], Allow Headers ["*"]
   - Enable proper authentication mode

8. **Configuration Management**
   - Use Pulumi config for S3 bucket names
   - Set environment variables for INPUT_BUCKET and OUTPUT_BUCKET on each Lambda
   - Make configuration easy to change across environments

9. **S3 Infrastructure**
   - Create input bucket for source images
   - Create output bucket for processed images
   - Configure appropriate bucket policies for Lambda access

10. **Resource Naming and Tagging**
    - All named resources must include **environmentSuffix** for uniqueness
    - Follow naming convention: `{resource-type}-{purpose}-${environmentSuffix}`
    - Tag all resources with Environment, Project, and ManagedBy tags

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **AWS Lambda** with ARM64 architecture for all functions
- Use **CloudWatch Logs** with 7-day retention
- Use **AWS X-Ray** for tracing
- Use **Lambda Layers** for shared dependencies
- Use **Lambda Function URLs** for direct invocation
- **Thumbnail Generator**: Node.js runtime (nodejs20.x recommended), 1024MB, concurrency 50
- **Watermark Applier**: Java runtime (java17 or java21), 512MB, concurrency 25, SnapStart enabled
- **Metadata Extractor**: Node.js runtime (nodejs20.x recommended), 256MB, concurrency 25
- Resource names must include **environmentSuffix** for uniqueness
- Deploy to **us-east-1** region
- All resources must be destroyable (no Retain policies)

### Deployment Requirements (CRITICAL)

- **environmentSuffix Requirement**: All named resources MUST include environmentSuffix parameter
- **Destroyability**: No DeletionProtection, no Retain policies - all resources must be cleanable after testing
- **Node.js 18+ SDK Warning**: If using Node.js 18 or higher runtime, note that aws-sdk v2 is not available - use AWS SDK v3 or include sdk as layer
- **Java SnapStart**: Only available on java11 and later runtimes, requires PublishedVersion configuration
- **Lambda Reserved Concurrency**: Ensure account has sufficient unreserved concurrency remaining (minimum 10 reserved for account)

### Constraints

- No hardcoded bucket names or AWS account IDs
- All resources must be properly tagged for cost tracking
- Function code should be placeholder but syntactically valid
- System must be deployable across different environments using config
- Include proper error handling in Lambda functions
- Ensure CORS configuration allows for web-based testing

## Success Criteria

- **Architecture**: All three Lambda functions using ARM64 architecture
- **Performance**: SnapStart enabled for Java function, appropriate memory and concurrency settings
- **Cost Optimization**: Lambda layers reduce package sizes, 7-day log retention prevents unlimited log growth
- **Observability**: X-Ray tracing active on all functions with performance insights
- **Security**: Least privilege IAM roles, proper S3 access controls
- **Functionality**: Function URLs working with proper CORS configuration
- **Configuration**: Bucket names configurable via Pulumi config, environment variables set correctly
- **Resource Naming**: All resources include environmentSuffix for multi-environment deployment
- **Code Quality**: TypeScript implementation, well-structured, properly documented

## What to deliver

- Complete Pulumi TypeScript implementation in lib/tap-stack.ts
- Three Lambda functions with proper configuration (ARM64, memory, concurrency)
- Lambda SnapStart configuration for Java watermark function
- Lambda layers for shared dependencies
- CloudWatch Log Groups with 7-day retention for all functions
- X-Ray tracing configuration for all functions
- IAM roles with least privilege access to S3
- Lambda Function URLs with CORS configuration
- S3 buckets for input and output
- Environment variables configured from Pulumi config
- Placeholder Lambda function code in lib/lambda/ directory
- Proper resource naming with environmentSuffix
- Comprehensive tagging for all resources
- Documentation and deployment instructions
