we've got this media company client who needs us to set up their static content hosting infrastructure. They're pretty specific about wanting the same setup across dev, staging, and production, but with some tweaks for each environment. The main thing is they want global content delivery through CloudFront, and they're insisting we use Pulumi with TypeScript for everything.

The tricky part here is making sure we build something reusable - they don't want to maintain three completely different setups. They want one component they can spin up for any environment with just a few parameter changes. Makes sense from a maintenance perspective.

## Here's what they're asking for

We need to create a multi-environment static content hosting system that works consistently across all their environments but still allows for environment-specific customizations. They specifically mentioned they want to use CloudFront's default SSL certificates rather than dealing with custom domains right now.

The client is pretty clear about their environment setup - they need dev, staging, and prod environments, and every resource needs to be named with the environment suffix so nothing conflicts. They've been burned by naming collisions before, so they're really emphasizing this point.

For the S3 side of things, they want buckets with versioning turned on. The naming should follow `myapp-{environment}-content` - so like `myapp-dev-content` for development. Security is important to them, so they want bucket policies that only allow CloudFront access through Origin Access Identity, plus they want all the public access blocked.

The CloudFront setup needs to be pretty robust. They want Origin Access Identity for secure S3 access, and they're fine using CloudFront's default SSL certificate since they're not doing custom domains yet. They mentioned needing custom error pages for 403 and 404 errors that redirect to `/404.html`. 

One interesting requirement they have is different cache TTL values depending on the environment. For dev they want 60 seconds so they can see changes quickly, staging should be 300 seconds for reasonable testing, and production needs 86400 seconds for performance. They also want IPv6 support and compression enabled.

Since they're not doing custom domains, everything will just use the standard CloudFront URLs like `https://{random-id}.cloudfront.net`. They said they might add custom domains later but want to keep it simple for now.

They're big on tagging - every resource needs Environment, Project, and ManagedBy tags. Environment should match the current environment (dev/staging/prod), Project should be "myapp", and ManagedBy should be "Pulumi". Their compliance team apparently checks this stuff.

For security, they want Origin Access Identity set up properly so CloudFront can access S3 securely, with bucket policies that only allow OAI access. All public access to S3 buckets should be blocked completely.

The outputs they need are the CloudFront distribution URL (in that `https://{id}.cloudfront.net` format), the CloudFront distribution domain name (just the `{id}.cloudfront.net` part), and the S3 bucket name for each environment.

This needs to be built as a reusable component - they emphasized this multiple times. They want minimal configuration changes between environments and identical infrastructure patterns everywhere. I'm thinking we'll need a main TapStack component that orchestrates everything, and then a ContentHostingStack component that handles the actual CDN infrastructure.

Important note from their ops team - everything needs to be completely destroyable without manual intervention. No retention policies, no deletion protection flags. They want to be able to tear down and rebuild environments easily.

## Technical stuff they specified

Everything has to be in Pulumi with TypeScript. They're using S3 for static content storage with versioning and public access blocking. CloudFront should use Origin Access Identity with default SSL certificates. IAM policies for bucket access are needed too.

All resource names must include the environmentSuffix - they were really clear about this. The naming convention for buckets is `{project}-{environment}-content`. They want everything deployed to us-east-1 region, and we should use the Pulumi ComponentResource pattern for reusable infrastructure.

For the component architecture, they're thinking TapStack as the main component that takes environmentSuffix and tags as input, instantiates the ContentHostingStack component, and exposes outputs for bucketName, distributionUrl, and distributionDomainName. The ContentHostingStack would be the reusable piece that creates the S3 bucket with versioning and security settings, creates the CloudFront distribution with default SSL certificate, sets up Origin Access Identity for secure S3 access, and implements the environment-specific cache TTL logic.

Security-wise, S3 buckets need public access block enabled (all settings to true), bucket policies that only allow CloudFront OAI access, and no public read permissions anywhere. For CloudFront, they want Origin Access Identity for S3 access, all HTTP traffic redirected to HTTPS, and no custom domain aliases since they're using CloudFront's default certificate.

## Testing requirements

They want comprehensive testing. Unit tests should mock Pulumi resources for testing component logic, validate that resources are created with correct properties, test the environment-specific configurations (especially cache TTL), and verify output consistency across different environments.

For integration tests, they want tests against real AWS resources after deployment. This should validate S3 bucket configuration (versioning, security, tags), verify CloudFront distribution settings (SSL, OAI, cache behavior), test resource naming conventions and tagging, and validate security configurations to make sure there's no public access.

## Key constraints to remember

S3 bucket names must follow `myapp-{environment}-content` pattern. CloudFront cache TTLs have to vary by environment: dev=60s, staging=300s, prod=86400s. All resources need those mandatory tags: Environment, Project, ManagedBy. No custom domain names - CloudFront default domains only. Everything must be destroyable (no retain policies, no deletion protection). CloudFront must use Origin Access Identity, not public bucket access. S3 buckets must have public access blocked.

## What success looks like

The reusable component should deploy complete CDN infrastructure for any environment. All three environments should have identical infrastructure patterns. Environment-specific cache TTLs should work correctly. S3 buckets should only be accessible through CloudFront OAI with public access blocked. CloudFront should use default SSL certificate without custom domain setup. All resources should include environmentSuffix for uniqueness. Everything should be tagged with Environment, Project, ManagedBy. The code should be clean TypeScript with proper types, error handling, and validation. We need both unit tests with mocks and integration tests with real AWS resources. Everything should be destroyable cleanly without errors.

## Deliverables

Complete Pulumi TypeScript implementation in the lib/ directory with `tap-stack.ts` as the main TapStack component and `content-hosting-stack.ts` as the reusable ContentHostingStack component. S3 buckets with versioning, public access blocking, and OAI-only access policies. CloudFront distributions with Origin Access Identity, default SSL certificate, custom error pages, and environment-specific cache settings. IAM policies for secure CloudFront to S3 access. Proper resource tagging and naming with environmentSuffix. Stack outputs for CloudFront URLs and S3 bucket names. 

Comprehensive test suite including `tap-stack.unit.test.ts` for unit tests with Pulumi mocks and `tap-stack.int.test.ts` for integration tests using AWS SDK. Documentation for deploying to each environment. Support for cfn-outputs/flat-outputs.json for integration testing.