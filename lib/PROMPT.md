Hey team,

We need to build a multi-environment static content hosting infrastructure for a media company. They're deploying the same content delivery setup across development, staging, and production environments, and they need consistency across all three while maintaining environment-specific customizations. This is for hosting static content with global delivery through CloudFront.

The business wants us to implement this using **Pulumi with TypeScript** to manage all their AWS infrastructure in the eu-west-1 region. The key challenge here is creating a reusable component that can be instantiated for each environment with minimal configuration changes, ensuring identical infrastructure patterns while allowing for environment-specific settings like cache TTLs and domain names.

## What we need to build

Create a multi-environment static content hosting system using **Pulumi with TypeScript** that deploys consistent infrastructure across dev, staging, and production environments.

### Core Requirements

1. **Environment Configuration**
   - Accept an environment parameter (dev/staging/prod) to control resource naming and configuration
   - All resource names must include the environment suffix for uniqueness

2. **S3 Bucket Setup**
   - Create S3 buckets with versioning enabled
   - Follow naming pattern: myapp-{environment}-content (e.g., myapp-dev-content)
   - Configure bucket policies that restrict access to CloudFront Origin Access Identity only

3. **CloudFront Distribution**
   - Deploy CloudFront distribution with Origin Access Identity for secure S3 access
   - Configure custom error pages for 403 and 404 errors
   - Set up environment-specific cache behaviors with TTL values:
     - dev: 60 seconds
     - staging: 300 seconds
     - prod: 86400 seconds

4. **SSL Certificate Management**
   - Create or use existing ACM certificate for *.myapp.com wildcard domain
   - Ensure certificate validation completes before CloudFront distribution creation
   - Certificate must be in us-east-1 for CloudFront compatibility

5. **DNS Configuration**
   - Configure Route53 records mapping environment-specific subdomains:
     - dev.myapp.com for development
     - staging.myapp.com for staging
     - myapp.com for production
   - Use existing Route53 hosted zone for myapp.com

6. **Resource Tagging**
   - Tag all resources with mandatory tags: Environment, Project, and ManagedBy
   - Environment tag should reflect the current environment (dev/staging/prod)

7. **IAM Access Control**
   - Implement proper IAM roles and policies for cross-environment access
   - Set up Origin Access Identity for CloudFront to access S3 securely

8. **Stack Outputs**
   - Export the CloudFront distribution URL for each environment
   - Export the S3 bucket name for each environment

9. **Reusable Component Design**
   - Create a Pulumi component that can be instantiated for each environment
   - Minimal configuration changes needed per environment
   - Maintain identical infrastructure patterns across environments

10. **Resource Management**
    - All resources must be destroyable without manual intervention
    - No Retain deletion policies
    - No DeletionProtection flags

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **S3** for static content storage with versioning
- Use **CloudFront** with Origin Access Identity for content delivery
- Use **Route53** for DNS management
- Use **ACM** for SSL certificate management
- Use **IAM** for access control policies
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: {project}-{environment}-content for buckets
- Deploy to **eu-west-1** region (with ACM certificates in us-east-1)
- Use Pulumi ComponentResource pattern for reusable infrastructure

### Constraints

1. S3 bucket names must follow the pattern: myapp-{environment}-content
2. CloudFront cache TTLs must vary by environment: dev=60s, staging=300s, prod=86400s
3. All resources must be tagged with mandatory tags: Environment, Project, ManagedBy
4. Route53 hosted zone for myapp.com must already exist
5. ACM certificate validation must complete before CloudFront distribution creation
6. All resources must be destroyable (no Retain policies, no DeletionProtection)
7. CloudFront must use Origin Access Identity, not public bucket access

## Success Criteria

- **Functionality**: Reusable component deploys complete CDN infrastructure for any environment
- **Consistency**: All three environments have identical infrastructure patterns
- **Customization**: Environment-specific cache TTLs and domain names work correctly
- **Security**: S3 buckets only accessible through CloudFront OAI, not public
- **DNS**: Route53 records correctly point to environment-specific CloudFront distributions
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Tagging**: All resources tagged with Environment, Project, ManagedBy
- **Code Quality**: TypeScript with proper types, error handling, and validation
- **Destroyability**: All resources can be destroyed cleanly without errors

## What to deliver

- Complete Pulumi TypeScript implementation in lib/ directory
- Reusable component for multi-environment deployment
- S3 buckets with versioning and restricted access policies
- CloudFront distributions with Origin Access Identity, custom error pages, and environment-specific cache settings
- Route53 DNS records for environment-specific subdomains
- ACM certificate management for *.myapp.com
- IAM roles and policies for secure access
- Proper resource tagging and naming with environmentSuffix
- Stack outputs for CloudFront URLs and S3 bucket names
- Documentation for deploying to each environment