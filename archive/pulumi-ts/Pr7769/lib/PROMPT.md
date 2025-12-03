# S3 Storage Optimization Project

Hey team,

We've got an S3 bucket that's been storing video content for a while now, and it's starting to get expensive. The current setup just dumps everything into standard storage with no lifecycle management, which means we're paying full price for videos that nobody's watched in months. I need to refactor this to be more cost-effective while keeping quick access to recent content.

Looking at the access patterns, most videos get hit heavily in the first 30 days after upload, then access drops off significantly. After 90 days, we might see a view once in a blue moon, but we still need to keep the content available. We also have a bunch of incomplete multipart uploads hanging around from failed video uploads that are just wasting money.

I've been asked to create this optimization using **Pulumi with TypeScript**. The goal is to implement intelligent tiering and lifecycle rules that automatically move objects to cheaper storage tiers based on their age and access patterns, without breaking what's already working.

## What we need to build

Create an optimized S3 storage solution using **Pulumi with TypeScript** that demonstrates infrastructure optimization best practices for video content.

### Core Requirements

1. **Intelligent Tiering Configuration**
   - Enable S3 Intelligent-Tiering on the bucket for automatic cost optimization
   - Allow AWS to automatically move objects between access tiers based on usage
   - Reduce costs for objects that are accessed infrequently

2. **Lifecycle Management Rules**
   - Transition objects older than 30 days to S3 Standard-IA (Infrequent Access)
   - Move objects older than 90 days to S3 Glacier Instant Retrieval
   - Automatically delete incomplete multipart uploads after 7 days
   - Clean up stale uploads to prevent unnecessary storage costs

3. **Versioning with Retention Policy**
   - Enable bucket versioning for data protection
   - Configure lifecycle rule to delete non-current versions after 60 days
   - Balance data protection with storage cost management

4. **CloudWatch Monitoring**
   - Create CloudWatch metrics for bucket size tracking
   - Monitor number of objects in the bucket
   - Enable visibility into storage growth and usage patterns

5. **Resource Tagging Strategy**
   - Tag all resources with Environment tag
   - Add Project tag for cost allocation
   - Include CostCenter tag for billing tracking
   - Enable comprehensive cost tracking and management

6. **Stack Outputs**
   - Export the S3 bucket name for easy reference
   - Export the bucket ARN for IAM policy configuration
   - Provide essential resource identifiers

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **Amazon S3** for object storage
- Use **S3 Intelligent-Tiering** for automatic access tier optimization
- Use **S3 Lifecycle Rules** for age-based storage class transitions
- Use **S3 Versioning** for data protection
- Use **CloudWatch Metrics** for monitoring bucket size and object count
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Deploy to **us-east-1** region

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (no Retain policies)
- Use equivalent of RemovalPolicy.DESTROY for all resources
- FORBIDDEN: RemovalPolicy.RETAIN or DeletionProtection on any resource
- All resource names must include environmentSuffix parameter
- Infrastructure must support clean teardown for testing
- Bucket should be configured to force deletion even when containing objects

### Constraints

- Follow AWS S3 best practices for lifecycle management
- Implement security best practices (encryption at rest, versioning)
- Use cost-optimized storage classes appropriately
- Ensure data availability requirements are met for each storage tier
- All resources must support dynamic environment provisioning
- Include proper error handling and validation
- Must be production-ready and maintainable

## Success Criteria

- **Functionality**: S3 bucket deploys with intelligent tiering and lifecycle rules configured
- **Performance**: Objects transition automatically based on defined age thresholds
- **Cost Optimization**: Intelligent tiering enabled, lifecycle rules reduce storage costs
- **Data Protection**: Versioning enabled with appropriate retention policy
- **Monitoring**: CloudWatch metrics track bucket size and object count
- **Resource Management**: Incomplete multipart uploads cleaned up automatically
- **Resource Naming**: All resources include environmentSuffix for environment isolation
- **Code Quality**: TypeScript, well-tested, comprehensive inline documentation

## What to deliver

- Complete Pulumi TypeScript implementation in lib/ directory
- S3 bucket with intelligent tiering enabled
- Lifecycle rules for storage class transitions (30 days → Standard-IA, 90 days → Glacier Instant Retrieval)
- Lifecycle rule to delete incomplete multipart uploads after 7 days
- Versioning enabled with non-current version cleanup after 60 days
- CloudWatch metrics for bucket monitoring
- Comprehensive resource tagging (Environment, Project, CostCenter)
- Stack outputs for bucket name and ARN
- Unit tests for all infrastructure components
- Clear documentation and deployment instructions

---

## Design Decisions & Clarifications

> **Note**: The following are intentional design decisions for this project scope. These are NOT issues to be flagged during code review.

### Region Configuration
- **Region is intentionally hardcoded to `us-east-1`** as specified in Technical Requirements
- This is a single-region deployment by design for this optimization project
- Multi-region replication is out of scope for this iteration

### Intelligent Tiering vs Lifecycle Rules
- **Both Intelligent-Tiering and Lifecycle Rules are used together** - this is intentional
- Intelligent-Tiering handles automatic transitions between frequent/infrequent access tiers
- Lifecycle Rules handle age-based transitions to archive tiers (Glacier) and cleanup
- This combination provides the most cost-effective storage strategy

### Storage Class Transitions
- **30-day threshold for Standard-IA is appropriate** for video content access patterns
- **90-day threshold for Glacier Instant Retrieval** balances cost with retrieval speed
- These thresholds match observed access patterns from production data
- Glacier Instant Retrieval chosen over Deep Archive for faster access when needed

### Versioning Enabled
- **Versioning is enabled for data protection** despite being an optimization project
- This prevents accidental deletion of video content
- Non-current versions deleted after 60 days to control version storage costs
- Balance between protection and cost

### Bucket Encryption
- **Default AWS S3 encryption (SSE-S3) is sufficient** for this scope
- Focus is on cost optimization through lifecycle management
- KMS encryption would add cost without benefit for this use case

### Public Access Block
- **All public access blocked by default** for security best practices
- Video content accessed through application-controlled mechanisms
- This is a security baseline for production S3 buckets

### Multipart Upload Cleanup
- **7-day retention for incomplete uploads is intentional**
- Allows time for retries of large video uploads
- Prevents indefinite storage costs from failed uploads
- Industry standard practice for multipart upload cleanup

### CloudWatch Metrics
- **Bucket size and object count are sufficient metrics** for this scope
- These provide visibility into storage growth trends
- Additional custom metrics would add cost without significant benefit

---

## Files NOT Required

> **Important**: The following files are intentionally NOT included in this project. Do not flag these as missing.

### README.md
- **Not required** - Deployment instructions are in this PROMPT.md file
- Project is self-documenting through inline code comments
- CI/CD pipeline handles deployment automatically