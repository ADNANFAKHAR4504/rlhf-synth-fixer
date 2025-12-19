Hey team,

We've got an urgent issue with our Lambda-based image processing system that's causing problems in production. The current setup has several configuration issues that are leading to timeouts, access errors, and unnecessary costs. I need help refactoring and optimizing the existing infrastructure to fix these pain points.

The system processes images uploaded to S3 buckets, and we've identified eight specific problems that need immediate attention. Some are causing outright failures like the 3-second timeout issue, while others are more about best practices like the unlimited log retention that's costing us money. The business wants us to implement environment-specific configurations so we can tune dev and prod independently.

I've been asked to create this using **Pulumi with TypeScript** to match our existing infrastructure patterns. This is a refactoring task, so we need to maintain the core functionality while addressing all the optimization points.

## What we need to build

Refactor the existing Lambda-based image processing system using **Pulumi with TypeScript** to address eight critical optimization points.

### Core Optimization Requirements

1. **Memory Configuration**
   - Replace hardcoded Lambda memory sizes (currently 128MB)
   - Use environment-specific configurations: dev environments get 512MB, prod environments get 1024MB
   - Make memory configurable per stack/environment

2. **Timeout Fix**
   - Fix Lambda timeout issue where functions are timing out at 3 seconds
   - Increase timeout to 30 seconds to allow proper processing time
   - This is causing production failures right now

3. **Error Handling**
   - Add missing error handling for S3 bucket permissions
   - Current implementation causes AccessDenied errors
   - Need proper IAM policy validation and error messages

4. **Log Retention**
   - Implement proper CloudWatch log retention (currently unlimited)
   - Set to 7 days for dev environments
   - Set to 30 days for prod environments
   - This will significantly reduce logging costs

5. **IAM Permissions**
   - Fix Lambda execution role with overly permissive S3 access (currently uses wildcard *)
   - Restrict to specific bucket ARNs only
   - Follow least privilege principle

6. **Environment Variables**
   - Add missing environment variables that Lambda code expects
   - IMAGE_QUALITY setting for image processing optimization
   - MAX_FILE_SIZE to prevent processing oversized files

7. **X-Ray Tracing**
   - Enable X-Ray tracing which was accidentally removed in a previous commit
   - Need this for debugging and performance monitoring

8. **Concurrency Fix**
   - Fix Lambda reserved concurrent executions (currently set to 0)
   - This is causing throttling issues in production
   - Set reasonable concurrency limits to prevent throttling

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **AWS Lambda** for image processing functions
- Use **Amazon S3** for image storage and triggering
- Use **AWS CloudWatch Logs** for log management with proper retention
- Use **AWS IAM** for execution roles with least privilege access
- Use **AWS X-Ray** for distributed tracing and monitoring
- Resource names must include **environmentSuffix** for uniqueness across dev/prod
- Follow naming convention: `image-processor-{environmentSuffix}`
- Deploy to **us-east-1** region
- Support multiple environments (dev, prod) with different configurations

### Environment-Specific Configuration

The solution must support environment-specific values:

**Dev Environment:**
- Lambda memory: 512MB
- Log retention: 7 days
- Lower concurrency limits

**Prod Environment:**
- Lambda memory: 1024MB
- Log retention: 30 days
- Higher concurrency limits

### Deployment Requirements (CRITICAL)

- All resources must include **environmentSuffix** parameter for unique naming
- All resources must be destroyable (RemovalPolicy: DESTROY, no RETAIN policies)
- Lambda functions must use Node.js 18.x or higher runtime (note: Node.js 18+ requires AWS SDK v3)
- S3 bucket permissions must use specific bucket ARNs, not wildcards
- IAM policies must follow least privilege principle with explicit resource ARNs
- CloudWatch log groups must have explicit retention periods (no unlimited retention)

### Constraints

- Fix all eight optimization points without breaking existing functionality
- Maintain image processing capability while improving performance
- Keep costs under control with proper resource sizing and log retention
- All resources must be destroyable for clean teardown in test environments
- Include proper error handling and logging
- Code must be type-safe with proper TypeScript types

## Success Criteria

- **Functionality**: All eight optimization points addressed and working
- **Performance**: Lambda timeout fixed, proper memory allocation per environment
- **Reliability**: No more AccessDenied errors, proper error handling
- **Security**: IAM policies follow least privilege with specific ARNs
- **Cost Optimization**: Log retention configured, no unlimited logs
- **Observability**: X-Ray tracing enabled for monitoring
- **Scalability**: Concurrency properly configured to prevent throttling
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Code Quality**: TypeScript, well-tested, documented

## What to deliver

- Complete Pulumi TypeScript implementation with Pulumi.yaml
- Lambda function with proper configuration (memory, timeout, environment variables)
- S3 bucket configuration with proper permissions
- IAM execution role with least privilege policies for specific bucket ARNs
- CloudWatch log groups with environment-specific retention (7 days dev, 30 days prod)
- X-Ray tracing configuration
- Lambda concurrency configuration
- Unit tests for all components
- Documentation and deployment instructions in README.md
