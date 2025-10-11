# Infrastructure Changes from Model Response to Ideal Response

## 1. Stack Architecture Simplification

**Model Response Issue**: Created a complex two-stack architecture with separate TapEdgeStack and TapMainStack requiring cross-region references and SSM Parameter Store for communication.

**Required Change**: Simplified to a single stack that handles Lambda@Edge functions automatically. CDK's EdgeFunction construct manages us-east-1 deployment internally without requiring separate stacks.

## 2. Resource Deletion Policies

**Model Response Issue**: Used `removalPolicy: cdk.RemovalPolicy.RETAIN` for DynamoDB table and S3 buckets.

**Required Change**: Changed to `removalPolicy: cdk.RemovalPolicy.DESTROY` with `autoDeleteObjects: true` for S3 buckets to ensure complete cleanup in test environments.

## 3. Route53 and ACM Certificate Removal

**Model Response Issue**: Included Route53 hosted zone lookup and ACM certificate creation with DNS validation, which are not practical for automated testing.

**Required Change**: Removed Route53 and ACM certificate resources. CloudFront uses default cloudfront.net domain for testing purposes.

## 4. CloudFront Distribution Construct

**Model Response Issue**: Used deprecated `CloudFrontWebDistribution` construct with complex originConfigs structure.

**Required Change**: Migrated to modern `Distribution` construct with cleaner defaultBehavior configuration.

## 5. Origin Access Control Implementation

**Model Response Issue**: Used L1 `CfnOriginAccessControl` construct requiring manual wiring to distribution.

**Required Change**: Used L2 `S3OriginAccessControl` with `S3BucketOrigin.withOriginAccessControl()` for proper integration.

## 6. DynamoDB Table Configuration

**Model Response Issue**: Added unnecessary Global Secondary Index (PreferenceTypeIndex) and Point-in-Time Recovery which increase costs and complexity.

**Required Change**: Removed GSI and PITR. Basic partition key on userId is sufficient for the use case.

## 7. Cross-Stack Reference Mechanism

**Model Response Issue**: Used SSM Parameter Store to pass Lambda@Edge function ARNs between stacks, requiring valueForStringParameter lookups.

**Required Change**: Eliminated cross-stack references entirely by using single-stack architecture where EdgeFunction automatically handles us-east-1 deployment.

## 8. IAM Role Management

**Model Response Issue**: Created role in edge stack, exported via SSM, then imported in main stack with hardcoded ARN patterns.

**Required Change**: Created role directly in main stack and granted permissions inline using `grantReadData()` method.

## 9. Environment Variable Handling

**Model Response Issue**: Did not pass DynamoDB table name to Lambda@Edge viewer request function.

**Required Change**: Added `environment.TABLE_NAME` to viewer request function configuration for runtime table access.

## 10. Props Interface Alignment

**Model Response Issue**: Created custom props interface with stackType, domainName, and edgeFunctionVersions that don't align with existing codebase patterns.

**Required Change**: Used standard TapStackProps with only environmentSuffix to match existing bin/tap.ts implementation pattern.

## 11. Context Configuration Removal

**Model Response Issue**: Added domain and subdomain context variables in cdk.json.

**Required Change**: Removed domain-specific context as it's not needed without Route53/ACM configuration.

## 12. Lambda Runtime Version

**Model Response Issue**: Used `lambda.Runtime.NODEJS_18_X`.

**Required Change**: Updated to `lambda.Runtime.NODEJS_20_X` for latest stable runtime.

## 13. CloudWatch Metrics

**Model Response Issue**: Created standalone Metric objects without alarms and included cache hit rate metric with comparison operator that could trigger false alarms.

**Required Change**: Focused on essential alarms only - DDB throttles/latency, CloudFront errors, Lambda errors/throttles with appropriate thresholds.

## 14. S3 Bucket Policy

**Model Response Issue**: Added bucket policy separately after distribution creation with manual ARN construction.

**Required Change**: Implemented bucket policy using `addToResourcePolicy()` with proper condition checking distribution ARN.

## 15. Logging Configuration

**Model Response Issue**: Used loggingConfig object within CloudFrontWebDistribution with inline log bucket creation.

**Required Change**: Used separate logBucket parameter with Distribution construct for cleaner separation of concerns.

## 16. S3 Log Bucket ACL Configuration

**Model Response Issue**: Log bucket created without ACL support, causing CloudFront logging to fail with error "The S3 bucket that you specified for CloudFront logs does not enable ACL access".

**Required Change**: Added `objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED` to the log bucket configuration to enable ACL access required by CloudFront for writing logs.