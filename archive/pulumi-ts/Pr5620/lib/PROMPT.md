Hey team,

Our company's image processing service has been running on Lambda for a while now, but we're seeing some issues with cold starts and costs are climbing higher than expected. The service processes images uploaded to S3 through three separate Lambda functions - one generates thumbnails, another applies watermarks, and a third extracts metadata. The current setup uses x86_64 architecture with oversized memory allocations, and we're keeping CloudWatch logs forever which is adding unnecessary costs.

After doing some profiling and cost analysis, we've identified several optimization opportunities. We can cut costs by about 40 percent through a combination of switching to ARM64 architecture, right-sizing memory allocations, implementing reserved concurrency limits, and cleaning up our logging strategy. The Java-based watermark function is also experiencing cold start delays that we can address with SnapStart.

I've been asked to refactor this using **Pulumi with TypeScript** since that's our infrastructure-as-code standard. We need to maintain functionality while implementing these optimizations, and we want to add X-Ray tracing so we can identify any remaining performance bottlenecks.

## What we need to build

Create an optimized Lambda-based image processing infrastructure using **Pulumi with TypeScript** for the ap-northeast-2 region.

### Core Requirements

1. **Lambda Function Optimization**
   - Refactor thumbnail generator function to use ARM64 architecture with 1024MB memory
   - Refactor watermark applier function to use ARM64 architecture with 512MB memory
   - Refactor metadata extractor function to use ARM64 architecture with 256MB memory
   - Implement Lambda SnapStart for the Java-based watermark function to reduce cold starts
   - Configure reserved concurrency of 50 for thumbnail function
   - Configure reserved concurrency of 25 for watermark and metadata functions
   - Total reserved concurrency must not exceed 100 across all functions

2. **Lambda Layers**
   - Create Lambda layers for shared dependencies to reduce deployment package sizes
   - Ensure layers are under 50MB unzipped to meet AWS limits
   - Share common libraries across functions where applicable

3. **CloudWatch Logs Management**
   - Configure CloudWatch log retention to 7 days for all Lambda functions
   - Replace current never-expire setting to control costs

4. **Observability and Tracing**
   - Add X-Ray tracing to all Lambda functions to identify performance bottlenecks
   - Configure X-Ray sampling at 10 percent to control costs
   - Enable proper instrumentation for request tracking

5. **Lambda Function URLs**
   - Set up Lambda function URLs for all three functions
   - Configure CORS for direct invocation from web applications
   - Use IAM authentication, not public access

6. **IAM Security**
   - Implement proper IAM roles with least privilege access to S3 buckets
   - Ensure functions can only read from input bucket and write to output bucket
   - No wildcard permissions on S3 operations

7. **Encryption**
   - Configure all Lambda functions to use the same KMS key for environment variable encryption
   - Ensure secure handling of configuration data

8. **Configuration Management**
   - Configure environment variables for S3 bucket names using Pulumi config
   - Use Pulumi stack configuration for deployment-specific values
   - Resource names must include **environmentSuffix** for uniqueness
   - Follow naming convention: lambda-function-name-environment-suffix

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **AWS Lambda** with ARM64 architecture (Graviton2)
- Use **Lambda SnapStart** for Java runtime watermark function only
- Use **Lambda Layers** for shared dependencies
- Use **CloudWatch Logs** with 7-day retention
- Use **AWS X-Ray** for distributed tracing with 10 percent sampling
- Use **Lambda Function URLs** with IAM authentication and CORS
- Use **IAM Roles** with least privilege policies
- Use **AWS KMS** for environment variable encryption
- Deploy to **ap-northeast-2** region
- Resource names must include **environmentSuffix** for uniqueness
- All resources must be destroyable with no Retain policies
- Include proper error handling and logging

### Constraints

- Lambda layers must be under 50MB unzipped to meet AWS limits
- Function URLs must use IAM authentication, not public access
- X-Ray tracing must sample at 10 percent to control costs
- All Lambda functions must use the same KMS key for environment variable encryption
- Reserved concurrency total across all functions cannot exceed 100
- Lambda SnapStart can only be applied to Java runtime functions
- Functions must have access to S3 buckets in the same region
- Memory allocations must match profiling data: thumbnail (1024MB), watermark (512MB), metadata (256MB)
- Architecture must be ARM64 for all functions
- No over-provisioned resources that increase costs unnecessarily

## Success Criteria

- **Cost Optimization**: Lambda functions use ARM64 architecture reducing compute costs by approximately 20 percent
- **Memory Right-Sizing**: Functions allocated based on profiling data with no over-provisioning
- **Concurrency Control**: Reserved concurrency properly limits concurrent executions preventing runaway costs
- **Cold Start Performance**: Java watermark function uses SnapStart reducing cold start times
- **Deployment Efficiency**: Lambda layers reduce deployment package sizes and enable faster updates
- **Log Management**: CloudWatch logs configured with 7-day retention preventing indefinite storage costs
- **Observability**: X-Ray tracing enabled with cost-effective 10 percent sampling
- **Security**: IAM roles follow least privilege with specific S3 bucket permissions
- **Accessibility**: Function URLs configured with CORS and IAM authentication for secure direct invocation
- **Configuration**: S3 bucket names and other settings managed through Pulumi config
- **Resource Naming**: All resources include environmentSuffix in their names
- **Encryption**: Environment variables encrypted using shared KMS key
- **Code Quality**: Clean TypeScript code, well-typed, follows Pulumi best practices

## What to deliver

- Complete Pulumi TypeScript implementation in the lib/ directory
- Three Lambda functions: thumbnail generator, watermark applier, metadata extractor
- Lambda function configurations with ARM64 architecture and memory allocations (1024MB, 512MB, 256MB)
- Lambda SnapStart configuration for Java-based watermark function
- Reserved concurrency settings (50 for thumbnail, 25 for others)
- Lambda layers for shared dependencies under 50MB unzipped
- CloudWatch log groups with 7-day retention for all functions
- X-Ray tracing configuration with 10 percent sampling rate
- Lambda function URLs with CORS and IAM authentication
- IAM roles and policies with least privilege S3 access
- KMS key for environment variable encryption
- Pulumi config usage for S3 bucket names
- Stack outputs exposing function URLs and ARNs
- Unit tests verifying resource creation and configuration
- Documentation explaining the optimization approach and architecture
