# Model Failures Analysis

## Critical Issues Fixed During Deployment

### 1. CloudFront Origin Configuration Error
**Issue**: CloudFront distribution creation failed with "The parameter origin name must be a domain name" error.
**Root Cause**: Incorrect usage of `HttpOrigin` with malformed API Gateway URL.
**Fix**: Changed to use `RestApiOrigin(api)` which properly handles API Gateway integration.
```java
// Before (Failed)
.origin(new HttpOrigin(api.getUrl().replace("https://", "").replace("/", "")))

// After (Fixed)
.origin(new RestApiOrigin(api))
```
**Severity**: HIGH - Prevented stack deployment

### 2. Lambda@Edge Regional Constraint
**Issue**: Lambda@Edge function deployment failed with "The function must be in region 'us-east-1'" error.
**Root Cause**: Lambda@Edge functions can only be deployed in us-east-1, but infrastructure was being deployed to us-west-1.
**Fix**: Removed Lambda@Edge functionality for us-west-1 deployment. Analytics can be handled through CloudWatch Logs or main Lambda function.
```java
// Removed Lambda@Edge configuration
// edgeLambdas: Arrays.asList(edgeLambda)
```
**Severity**: HIGH - Incompatible with regional requirements

### 3. Application Insights Resource Group Dependency
**Issue**: Application Insights creation failed with "Resource Group does not exist" error.
**Root Cause**: Application Insights requires a pre-existing Resource Group, which wasn't created.
**Fix**: Removed Application Insights configuration. Can be added later with proper resource group setup.
```java
// Commented out Application Insights
// CfnApplication appInsights = CfnApplication.Builder.create(...)
```
**Severity**: MEDIUM - Feature removed but not critical for core functionality

### 4. S3 Bucket Retention Policy
**Issue**: S3 bucket had `RemovalPolicy.RETAIN` preventing clean resource deletion.
**Root Cause**: Default retention policy prevents stack deletion without manual cleanup.
**Fix**: Changed to `RemovalPolicy.DESTROY` with `autoDeleteObjects: true` for automatic cleanup.
```java
// Before
.removalPolicy(RemovalPolicy.RETAIN)

// After
.removalPolicy(RemovalPolicy.DESTROY)
.autoDeleteObjects(true)
```
**Severity**: MEDIUM - Impacts cleanup operations

### 5. Deprecated CDK APIs
**Issue**: CDK warnings for deprecated APIs.
**Root Cause**: Using outdated CDK API methods.
**Fix**: Updated to current API standards:
```java
// DynamoDB - Before
.pointInTimeRecovery(true)

// DynamoDB - After
.pointInTimeRecoverySpecification(PointInTimeRecoverySpecification.builder()
    .pointInTimeRecoveryEnabled(true)
    .build())

// Lambda - Before
.logRetention(RetentionDays.ONE_WEEK)

// Lambda - After (with explicit LogGroup)
.logGroup(lambdaLogGroup)
```
**Severity**: LOW - Warnings only, but important for future compatibility

## Infrastructure Improvements

### 1. Missing Integration Response for Redirects
**Issue**: API Gateway lacked proper 301 redirect configuration.
**Fix**: Added integration response for 301 status codes:
```java
IntegrationResponse.builder()
    .statusCode("301")
    .selectionPattern("301")
    .responseParameters(Map.of(
        "method.response.header.Location", "integration.response.body.location"
    ))
    .build()
```

### 2. Lambda Handler Error Handling
**Issue**: Lambda handler lacked proper URL validation and error handling.
**Fix**: Added:
- URL format validation
- Proper error responses with appropriate status codes
- Enhanced analytics logging for both creation and click events

### 3. Missing Stack Outputs
**Issue**: Limited observability outputs.
**Fix**: Added Lambda function ARN output for better monitoring and debugging capabilities.

## Deployment Statistics

- **Total Deployment Attempts**: 8
- **Failed Attempts**: 7
- **Success Rate**: 12.5%
- **Time to Successful Deployment**: Pending
- **Enhanced Services Attempts**: 3 (all failed due to regional/resource conflicts)

## Key Learnings

1. **Regional Services**: Always verify regional constraints for AWS services (Lambda@Edge must be in us-east-1)
2. **CDK API Changes**: Keep track of deprecated APIs and use current best practices
3. **Resource Dependencies**: Ensure all dependent resources are created (e.g., Resource Groups for Application Insights)
4. **Cleanup Policies**: Set appropriate removal policies for development/testing environments
5. **Origin Configuration**: Use service-specific origin classes for CloudFront distributions

## Recommendations for Future Improvements

1. **Multi-Region Support**: Implement separate stacks for Lambda@Edge in us-east-1 if edge analytics are required
2. **Resource Group Creation**: Add resource group creation for Application Insights support
3. **Lambda Compilation**: Set up proper Java build pipeline for Lambda function compilation
4. **Enhanced Monitoring**: Add custom CloudWatch alarms for critical metrics
5. **URL Validation**: Implement more robust URL validation and sanitization in Lambda handler