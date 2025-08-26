# Model Failures and Issues Encountered

## 1. Pulumi API Compatibility Issues

### Failure: Incorrect Pulumi.all() Usage
**Issue**: Attempted to use `Pulumi.all()` method that doesn't exist in the current Pulumi Java SDK version.
```java
// FAILED - Method doesn't exist
ctx.export("publicSubnetIds", Pulumi.all(publicSubnetA.id(), publicSubnetB.id()));
```
**Solution**: Export individual resources separately:
```java
// SUCCESS - Individual exports
ctx.export("publicSubnetIdA", publicSubnetA.id());
ctx.export("publicSubnetIdB", publicSubnetB.id());
```

### Failure: Pulumi.json() Method Not Available
**Issue**: Attempted to use `Pulumi.json()` method for creating JSON outputs.
```java
// FAILED - Method doesn't exist
ctx.export("testConfiguration", Pulumi.json(Map.of(...)));
```
**Solution**: Use String.format() or remove complex JSON exports.

### Failure: Exporting Non-Output Objects
**Issue**: Attempted to export String values that are not Output objects.
```java
// FAILED - Not Output objects
ctx.export("environment", config.getEnvironment());
ctx.export("companyName", config.getCompanyName());
```
**Solution**: Only export Pulumi Output objects, not plain Java objects.

## 2. Import Resolution Failures

### Failure: AWS Config Import Issues
**Issue**: AWS Config imports not resolving correctly in Pulumi Java SDK.
```java
// FAILED - Imports not available
import com.pulumi.aws.config.ConfigurationRecorder;
import com.pulumi.aws.config.ConfigurationRecorderArgs;
```
**Solution**: Use available Config classes or implement Config functionality differently.

### Failure: S3 Advanced Features Not Available
**Issue**: Advanced S3 features like BucketVersioning and BucketServerSideEncryptionConfiguration not available.
```java
// FAILED - Classes not available
import com.pulumi.aws.s3.BucketVersioning;
import com.pulumi.aws.s3.BucketServerSideEncryptionConfiguration;
```
**Solution**: Use basic S3 bucket creation and configure encryption through AWS console or CLI.

## 3. Build Configuration Issues

### Failure: Source Directory Configuration
**Issue**: Incorrect source directory configuration in build.gradle.
```gradle
// FAILED - Wrong source structure
sourceSets {
    main.java {
        srcDirs = ['src/main/java']
    }
}
```
**Solution**: Update to correct source location:
```gradle
// SUCCESS - Correct source structure
sourceSets {
    main {
        java {
            srcDirs = ['lib/src/main/java']
        }
    }
}
```

### Failure: Main Class Configuration
**Issue**: build.gradle configured for wrong main class name.
```gradle
// FAILED - Wrong class name
mainClass = 'app.App'
```
**Solution**: Update to correct class name:
```gradle
// SUCCESS - Correct class name
mainClass = 'app.Main'
```

## 4. Package and Import Issues

### Failure: Package Declaration Mismatch
**Issue**: Package declarations didn't match directory structure.
```java
// FAILED - Wrong package
package com.company.infrastructure;
```
**Solution**: Use correct package:
```java
// SUCCESS - Correct package
package app;
```

### Failure: Import Path Issues
**Issue**: Import statements referenced non-existent packages.
```java
// FAILED - Wrong imports
import com.company.infrastructure.*;
```
**Solution**: Use correct imports:
```java
// SUCCESS - Correct imports
import app.*;
```

## 5. Test Configuration Issues

### Failure: Test Logic Errors
**Issue**: Incorrect test logic for checking forbidden policies.
```java
// FAILED - Wrong assertion logic
assertFalse(policy.contains("AdministratorAccess"));
```
**Solution**: Fix test logic to properly validate forbidden policies:
```java
// SUCCESS - Correct test logic
String[] actualPolicies = {...};
for (String policy : actualPolicies) {
    assertFalse(policy.contains("AdministratorAccess"));
}
```

## 6. Configuration Variable Issues

### Failure: Double Prefixing in Pulumi Config
**Issue**: Pulumi automatically prefixes configuration variables, causing double prefixing.
```yaml
# FAILED - Double prefixing
config:
  TapStack:environment: production
  TapStack:companyName: YourCompany
```
**Solution**: Remove project prefix from configuration:
```yaml
# SUCCESS - No double prefixing
config:
  environment: production
  companyName: YourCompany
```

### Failure: Configuration Variable Access
**Issue**: Incorrect configuration variable access in code.
```java
// FAILED - Wrong config access
this.environment = ctx.config().require("TapStack:environment");
```
**Solution**: Use correct configuration access:
```java
// SUCCESS - Correct config access
this.environment = ctx.config().require("environment");
```

## 7. Resource Naming and Tagging Issues

### Failure: Resource Name Generation
**Issue**: Resource names not following consistent naming conventions.
**Solution**: Implement consistent naming helper method:
```java
private static String getResourceName(InfrastructureConfig config, String service, String resource) {
    return String.format("%s-%s-%s-%s", config.getCompanyName(), config.getEnvironment(), service, resource);
}
```

### Failure: Tagging Inconsistencies
**Issue**: Tags not consistently applied across all resources.
**Solution**: Implement standardized tagging helper methods:
```java
private static Map<String, String> getStandardTags(InfrastructureConfig config, String service) {
    var tags = new java.util.HashMap<>(Map.of(
        "Environment", config.getEnvironment(),
        "Company", config.getCompanyName(),
        "ManagedBy", "Pulumi",
        "Compliance", "FinancialServices"
    ));
    tags.put("Service", service);
    return tags;
}
```

## 8. Architecture Design Issues

### Failure: Over-Complex Architecture
**Issue**: Initially designed with multiple separate stack classes that were difficult to maintain.
**Solution**: Consolidate into single Main.java file for simplicity and maintainability.

### Failure: Missing Stack Outputs
**Issue**: No stack outputs for live testing and monitoring.
**Solution**: Add comprehensive stack outputs for all infrastructure resources:
```java
// Export all outputs for testing and monitoring
ctx.export("vpcId", vpc.id());
ctx.export("vpcCidrBlock", vpc.cidrBlock());
// ... additional exports
```

## 9. Testing Strategy Issues

### Failure: Insufficient Test Coverage
**Issue**: Initially had only basic tests without comprehensive coverage.
**Solution**: Implement comprehensive test suite with 46 test methods covering all components.

### Failure: No Integration Test Support
**Issue**: No way to test actual deployed infrastructure.
**Solution**: Add stack outputs and integration tests that can validate live resources.

## 10. Security and Compliance Issues

### Failure: Missing CloudTrail Implementation
**Issue**: CloudTrail not implemented despite being a requirement.
**Solution**: Add complete CloudTrail implementation with KMS encryption and S3 logging.

### Failure: Incomplete KMS Key Management
**Issue**: Not all required KMS keys were implemented.
**Solution**: Implement all 4 KMS keys (S3, RDS, Lambda, CloudTrail) with proper rotation.

## 11. S3 Bucket Naming Issues

### Failure: Invalid S3 Bucket Names
**Issue**: S3 bucket names generated using general resource naming method don't follow AWS S3 naming requirements.
```java
// FAILED - Invalid bucket name
var cloudTrailBucket = new Bucket("bucket-cloudtrail-logs", BucketArgs.builder()
    .bucket(getResourceName(config, "cloudtrail", "logs"))  // Creates "YourCompany-production-cloudtrail-logs"
    .build());
```
**Error**: `InvalidBucketName: The specified bucket is not valid.`

**Solution**: Create specific S3 bucket naming method that follows AWS requirements:
```java
// SUCCESS - Valid bucket name
var cloudTrailBucket = new Bucket("bucket-cloudtrail-logs", BucketArgs.builder()
    .bucket(getS3BucketName(config, "cloudtrail", "logs"))
    .build());

private static String getS3BucketName(InfrastructureConfig config, String service, String resource) {
    // Create base name and convert to lowercase (S3 requirement)
    String baseName = String.format("%s-%s-%s-%s", 
        config.getCompanyName(), 
        config.getEnvironment(), 
        service, 
        resource).toLowerCase();
    
    // Replace any invalid characters and ensure proper format
    String bucketName = baseName
        .replaceAll("[^a-z0-9.-]", "-")  // Replace invalid chars with hyphens
        .replaceAll("-+", "-")           // Replace consecutive hyphens with single hyphen
        .replaceAll("^-+|-+$", "");      // Remove leading/trailing hyphens
    
    // Ensure bucket name is between 3-63 characters
    if (bucketName.length() > 63) {
        bucketName = bucketName.substring(0, 63);
    }
    if (bucketName.length() < 3) {
        bucketName = bucketName + "bucket";
    }
    
    // Add timestamp for global uniqueness
    String timestamp = String.valueOf(System.currentTimeMillis()).substring(8);
    bucketName = bucketName + "-" + timestamp;
    
    // Final length check
    if (bucketName.length() > 63) {
        bucketName = bucketName.substring(0, 63);
    }
    
    return bucketName;
}
```

**AWS S3 Bucket Naming Requirements**:
- Must be globally unique
- Must be 3-63 characters long
- Must contain only lowercase letters, numbers, hyphens, and periods
- Must start and end with a letter or number
- Cannot contain consecutive hyphens
- Cannot be formatted as an IP address

## 12. CloudTrail KMS ARN Issues

### Failure: Invalid KMS Key ID for CloudTrail
**Issue**: CloudTrail expects a KMS key ARN but was provided with a KMS key ID.
```java
// FAILED - Using key ID instead of ARN
var cloudTrail = new Trail("cloudtrail-main", TrailArgs.builder()
    .kmsKeyId(cloudTrailKey.keyId())  // Returns key ID like "95f48135-b5b9-4ad7-b170-0fb1a5498f06"
    .build());
```
**Error**: `"kms_key_id" is an invalid ARN: arn: invalid prefix.`

**Solution**: Use KMS key ARN instead of key ID:
```java
// SUCCESS - Using key ARN
var cloudTrail = new Trail("cloudtrail-main", TrailArgs.builder()
    .kmsKeyId(cloudTrailKey.arn())  // Returns ARN like "arn:aws:kms:us-east-1:123456789012:key/95f48135-b5b9-4ad7-b170-0fb1a5498f06"
    .build());
```

**Key Differences**:
- **Key ID**: `95f48135-b5b9-4ad7-b170-0fb1a5498f06` (UUID format)
- **Key ARN**: `arn:aws:kms:us-east-1:123456789012:key/95f48135-b5b9-4ad7-b170-0fb1a5498f06` (Full ARN format)

**AWS Service Requirements**:
- **CloudTrail**: Requires KMS key ARN for encryption
- **S3 Bucket Encryption**: Can use either key ID or ARN
- **RDS Encryption**: Can use either key ID or ARN
- **Lambda Environment Variables**: Can use either key ID or ARN

## 13. IAM Policy ARN Issues

### Failure: Incorrect AWS Config Policy ARN
**Issue**: Used incorrect IAM policy ARN for AWS Config service role.
```java
// FAILED - Incorrect policy ARN
new RolePolicyAttachment("rpa-config-service", RolePolicyAttachmentArgs.builder()
    .role(configServiceRole.name())
    .policyArn("arn:aws:iam::aws:policy/service-role/ConfigRole")  // Wrong policy name
    .build());
```
**Error**: `Policy arn:aws:iam::aws:policy/service-role/ConfigRole does not exist or is not attachable.`

**Solution**: Use correct AWS Config policy ARN:
```java
// SUCCESS - Correct policy ARN
new RolePolicyAttachment("rpa-config-service", RolePolicyAttachmentArgs.builder()
    .role(configServiceRole.name())
    .policyArn("arn:aws:iam::aws:policy/service-role/AWS_ConfigRole")  // Correct policy name
    .build());
```

**Common AWS Managed Policy ARNs**:
- **AWS Config**: `arn:aws:iam::aws:policy/service-role/AWS_ConfigRole`
- **Lambda Basic**: `arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole`
- **Lambda VPC**: `arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole`
- **CloudWatch**: `arn:aws:iam::aws:policy/service-role/CloudWatchAgentServerPolicy`

**Verification**: Always verify policy ARNs exist in AWS IAM console or using AWS CLI:
```bash
aws iam get-policy --policy-arn arn:aws:iam::aws:policy/service-role/AWS_ConfigRole
```

## Key Lessons Learned

1. **API Compatibility**: Always verify Pulumi Java SDK method availability before implementation
2. **Configuration Management**: Understand Pulumi's automatic prefixing behavior
3. **Testing Strategy**: Implement comprehensive testing from the start
4. **Stack Outputs**: Always include outputs for monitoring and testing
5. **Architecture Simplicity**: Single-file approach can be more maintainable than complex multi-file structures
6. **Error Handling**: Proper error handling and validation in tests
7. **Documentation**: Keep documentation updated with actual implementation details