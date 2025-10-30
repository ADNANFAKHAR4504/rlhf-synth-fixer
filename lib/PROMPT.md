Hey team,

We need to build a multi-environment static content hosting infrastructure for a media company. They're deploying the same content delivery setup across development, staging, and production environments, and they need consistency across all three while maintaining environment-specific customizations. This is for hosting static content with global delivery through CloudFront.

The business wants us to implement this using **Pulumi with TypeScript** to manage all their AWS infrastructure in the us-east-1 region. The key challenge here is creating a reusable component that can be instantiated for each environment with minimal configuration changes, ensuring identical infrastructure patterns while allowing for environment-specific settings like cache TTLs.

## What we need to build

Create a multi-environment static content hosting system using **Pulumi with TypeScript** that deploys consistent infrastructure across dev, staging, and production environments using CloudFront's default SSL certificates.

### Core Requirements

1. **Environment Configuration**
   - Accept an environment parameter (dev/staging/prod) to control resource naming and configuration
   - All resource names must include the environment suffix for uniqueness

2. **S3 Bucket Setup**
   - Create S3 buckets with versioning enabled
   - Follow naming pattern: myapp-{environment}-content (e.g., myapp-dev-content)
   - Configure bucket policies that restrict access to CloudFront Origin Access Identity only
   - Enable S3 bucket public access block for security

3. **CloudFront Distribution**
   - Deploy CloudFront distribution with Origin Access Identity for secure S3 access
   - Use CloudFront's default SSL certificate (no custom domain setup)
   - Configure custom error pages for 403 and 404 errors redirecting to /404.html
   - Set up environment-specific cache behaviors with TTL values:
     - dev: 60 seconds
     - staging: 300 seconds
     - prod: 86400 seconds
   - Enable IPv6 support and compression

4. **No Custom Domain Configuration**
   - Use CloudFront's default domain names (*.cloudfront.net)
   - No Route53 or ACM certificate management required
   - Distribution URLs will be https://{random-id}.cloudfront.net format

5. **Resource Tagging**
   - Tag all resources with mandatory tags: Environment, Project, and ManagedBy
   - Environment tag should reflect the current environment (dev/staging/prod)
   - Project tag set to "myapp"
   - ManagedBy tag set to "Pulumi"

6. **IAM Access Control**
   - Implement Origin Access Identity for CloudFront to access S3 securely
   - Configure S3 bucket policies allowing only CloudFront OAI access
   - Block all public access to S3 buckets

7. **Stack Outputs**
   - Export the CloudFront distribution URL (https://{id}.cloudfront.net format)
   - Export the CloudFront distribution domain name ({id}.cloudfront.net)
   - Export the S3 bucket name for each environment

8. **Reusable Component Design**
   - Create a Pulumi ComponentResource that can be instantiated for each environment
   - Minimal configuration changes needed per environment
   - Maintain identical infrastructure patterns across environments

9. **Resource Management**
    - All resources must be destroyable without manual intervention
    - No Retain deletion policies
    - No DeletionProtection flags

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **S3** for static content storage with versioning and public access blocking
- Use **CloudFront** with Origin Access Identity and default SSL certificates
- Use **IAM** for bucket access policies
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: {project}-{environment}-content for buckets
- Deploy to **us-east-1** region
- Use Pulumi ComponentResource pattern for reusable infrastructure

### Component Architecture

1. **TapStack** - Main component that orchestrates infrastructure
   - Accepts environmentSuffix and tags as input
   - Instantiates ContentHostingStack component
   - Exposes outputs for bucketName, distributionUrl, and distributionDomainName

2. **ContentHostingStack** - Reusable component for CDN infrastructure
   - Creates S3 bucket with versioning and security settings
   - Creates CloudFront distribution with default SSL certificate
   - Creates Origin Access Identity for secure S3 access
   - Implements environment-specific cache TTL logic

### Security Requirements

1. **S3 Security**
   - Enable bucket public access block (all settings set to true)
   - Bucket policy allows only CloudFront OAI access
   - No public read permissions on bucket or objects

2. **CloudFront Security**
   - Use Origin Access Identity for S3 access
   - Redirect all HTTP traffic to HTTPS
   - No custom domain aliases (uses CloudFront default certificate)

### Testing Requirements

1. **Unit Tests**
   - Mock Pulumi resources for testing component logic
   - Validate resource creation with correct properties
   - Test environment-specific configurations (cache TTL)
   - Verify output consistency across different environments

2. **Integration Tests**
   - Test against real AWS resources after deployment
   - Validate S3 bucket configuration (versioning, security, tags)
   - Verify CloudFront distribution settings (SSL, OAI, cache behavior)
   - Test resource naming conventions and tagging
   - Validate security configurations (no public access)

### Constraints

1. S3 bucket names must follow the pattern: myapp-{environment}-content
2. CloudFront cache TTLs must vary by environment: dev=60s, staging=300s, prod=86400s
3. All resources must be tagged with mandatory tags: Environment, Project, ManagedBy
4. No custom domain names - use CloudFront default domains only
5. All resources must be destroyable (no Retain policies, no DeletionProtection)
6. CloudFront must use Origin Access Identity, not public bucket access
7. S3 buckets must have public access blocked

## Success Criteria

- **Functionality**: Reusable component deploys complete CDN infrastructure for any environment
- **Consistency**: All three environments have identical infrastructure patterns
- **Customization**: Environment-specific cache TTLs work correctly
- **Security**: S3 buckets only accessible through CloudFront OAI, public access blocked
- **SSL**: CloudFront uses default SSL certificate without custom domain setup
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Tagging**: All resources tagged with Environment, Project, ManagedBy
- **Code Quality**: TypeScript with proper types, error handling, and validation
- **Testing**: Unit tests with mocks and integration tests with real AWS resources
- **Destroyability**: All resources can be destroyed cleanly without errors

## What to deliver

- Complete Pulumi TypeScript implementation in lib/ directory
  - `tap-stack.ts` - Main TapStack component
  - `content-hosting-stack.ts` - Reusable ContentHostingStack component
- S3 buckets with versioning, public access blocking, and OAI-only access policies
- CloudFront distributions with Origin Access Identity, default SSL certificate, custom error pages, and environment-specific cache settings
- IAM policies for secure CloudFront to S3 access
- Proper resource tagging and naming with environmentSuffix
- Stack outputs for CloudFront URLs and S3 bucket names
- Comprehensive test suite:
  - `tap-stack.unit.test.ts` - Unit tests with Pulumi mocks
  - `tap-stack.int.test.ts` - Integration tests using AWS SDK
- Documentation for deploying to each environment
- Support for cfn-outputs/flat-outputs.json for integration testing
