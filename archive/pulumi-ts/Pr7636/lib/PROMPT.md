Hey team,

We've got an existing static content delivery infrastructure that's running, but it's not optimized at all. The current setup has way too many redundant resources, security issues with overly permissive policies, and hardcoded configurations that make it a pain to manage. The business is asking us to refactor and optimize this whole thing to reduce costs and improve maintainability.

I've been tasked to rebuild this using **Pulumi with TypeScript** to consolidate resources, tighten security, and make it more cost-effective. The current infrastructure has multiple S3 buckets doing similar jobs, three separate CloudFront distributions when we really only need one, and four Lambda@Edge functions that are doing overlapping work. Plus, the S3 bucket policies are wide open which is a security risk.

The operations team also mentioned that the current stack has hardcoded regions everywhere, making it difficult to deploy to different regions. They want this fixed so we can be region-agnostic going forward.

## What we need to build

Create a refactored and optimized static content delivery infrastructure using **Pulumi with TypeScript**. This is an optimization task, so we're consolidating existing resources and improving the architecture while maintaining all functionality.

### Core Requirements

1. **S3 Bucket Consolidation**
   - Replace the multiple existing S3 buckets with a single consolidated bucket
   - Implement intelligent tiering for automatic lifecycle management
   - Configure lifecycle rules to automatically transition objects to appropriate storage classes based on access patterns

2. **CloudFront Distribution Consolidation**
   - Consolidate the three separate CloudFront distributions into a single distribution
   - Configure multiple origins within the single distribution to handle different content sources
   - Set up proper origin grouping and failover behavior for reliability

3. **Cache Behavior Configuration**
   - Implement cache behaviors based on file extensions for optimal performance
   - Configure separate cache policies for .jpg files with appropriate TTL
   - Configure separate cache policies for .png files with appropriate TTL
   - Configure separate cache policies for .css files with appropriate TTL
   - Configure separate cache policies for .js files with appropriate TTL
   - Each file type should have cache settings optimized for its usage pattern

4. **S3 Bucket Policy Security**
   - Fix the current overly permissive S3 bucket policies that allow public access
   - Restrict bucket access exclusively to CloudFront using Origin Access Identity (OAI)
   - Implement principle of least privilege for all bucket access
   - Ensure no public read permissions on the bucket

5. **Lambda@Edge Optimization**
   - Reduce the number of Lambda@Edge functions from 4 down to 2
   - Combine viewer-request logic into a single optimized function
   - Combine origin-request logic into a single optimized function
   - Ensure all original functionality is maintained with the reduced function count

6. **Resource Tagging Strategy**
   - Implement a consistent tagging strategy across all resources
   - Use a centralized tag object for maintainability
   - Include environment tag for environment identification
   - Include team tag for ownership tracking
   - Include cost center tag for billing and cost allocation

7. **Region-Agnostic Configuration**
   - Remove all hardcoded region references from the infrastructure code
   - Use Pulumi configuration to make the stack region-agnostic
   - Support deployment to any AWS region without code changes
   - Default to us-east-1 if no region is specified

8. **CloudFront Price Class Optimization**
   - Change CloudFront price class from PriceClass_All to PriceClass_100
   - This optimizes costs while maintaining coverage for most users
   - PriceClass_100 includes US, Canada, Europe edge locations

9. **Stack Outputs**
   - Export the CloudFront distribution URL for accessing content
   - Export the S3 bucket name for content uploads
   - Provide a cache invalidation command that can be used for easy invalidation

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use AWS CloudFront for content delivery
- Use AWS S3 for content storage with intelligent tiering
- Use Lambda@Edge for request processing (2 functions total)
- Use IAM for Origin Access Identity configuration
- Resource names must include **environmentSuffix** for uniqueness across deployments
- Follow naming convention: resource-type-environment-suffix
- All resources must be destroyable with no Retain policies
- Proper error handling and logging throughout
- Well-typed TypeScript code with interfaces defined
- Code should be modular and maintainable

### Deployment Requirements (CRITICAL)

- **environmentSuffix Requirement**: All resource names MUST include an environmentSuffix parameter to ensure uniqueness across multiple deployments
- **Destroyability Requirement**: All resources MUST be fully destroyable. Do NOT use RemovalPolicy.RETAIN or DeletionPolicy: Retain
- **Lambda@Edge Region**: Lambda@Edge functions MUST be created in us-east-1 region regardless of stack region
- **CloudFront + OAI**: Use Origin Access Identity to restrict S3 access to CloudFront only

### Constraints

- Security: S3 buckets must not be publicly accessible, only via CloudFront with OAI
- Cost optimization: Use intelligent tiering, serverless where possible, PriceClass_100
- Maintainability: Use centralized tagging, modular code structure
- Flexibility: Must support region-agnostic deployment
- All resources must support clean destruction for testing environments

## Success Criteria

- **Functionality**: All 9 optimization requirements fully implemented
- **Resource Consolidation**: Single S3 bucket, single CloudFront distribution, 2 Lambda@Edge functions
- **Performance**: Proper cache behaviors configured for all file types
- **Security**: S3 access restricted to CloudFront only using OAI, no public access
- **Cost Optimization**: Intelligent tiering, PriceClass_100, reduced function count
- **Flexibility**: Region-agnostic configuration using Pulumi config
- **Resource Naming**: All resources include environmentSuffix for deployment uniqueness
- **Tagging**: Consistent tags across all resources (environment, team, cost center)
- **Outputs**: Distribution URL, bucket name, and invalidation command exported
- **Code Quality**: Clean TypeScript, proper types, well-documented, modular structure

## What to deliver

- Complete Pulumi TypeScript implementation in lib/ directory
- CloudFront distribution with consolidated origins and cache behaviors
- S3 bucket with intelligent tiering and secure access via OAI
- 2 Lambda@Edge functions (viewer-request and origin-request)
- IAM configuration for Origin Access Identity
- Centralized tagging object used across all resources
- Region-agnostic configuration using Pulumi config
- Proper stack outputs for distribution URL, bucket name, and invalidation command
- Unit tests for all components
- Clear documentation of the optimization changes
