# Model Failures Analysis

This document analyzes the differences between the ideal CDK code and the issues we encountered during debugging, representing model failures that had to be corrected.

## 1. Pipeline Source Configuration Issues

**Problem**: The initial model response used CodeCommit as the pipeline source, which failed with:
```
CreateRepository request is not allowed because there is no existing repository in this AWS account or AWS Organization
```

**Root Cause**: Model assumed CodeCommit would be available in any AWS account, but CodeCommit requires existing setup and may not be available in all organizations.

**Fix Applied**: Switched to S3 source bucket for pipeline:
```java
// From this (problematic):
CodePipelineSource.codeCommit(Repository.Builder.create(this, "SourceRepo")...)

// To this (working):
CodePipelineSource.s3(sourceBucket, "source.zip")
```

**Model Failure**: Lack of awareness of AWS service availability constraints and account-level restrictions.

## 2. Backup Plan Rule API Usage

**Problem**: Model initially used deprecated/incorrect CDK v2 API for backup plan rules:
```java
// Incorrect approach that failed:
BackupPlan.addRule(BackupPlanRule.daily().moveToColdStorageAfter(Duration.days(30)))
```

**Root Cause**: Model confused CDK v1 and v2 APIs, or used incorrect method signatures.

**Fix Applied**: Used correct CDK v2 high-level constructs:
```java
BackupPlan backupPlan = BackupPlan.Builder.create(this, "BackupPlan")
    .backupPlanRules(Arrays.asList(
        BackupPlanRule.Builder.create()
            .ruleName("DailyBackup")
            .scheduleExpression(software.amazon.awscdk.services.events.Schedule.cron(...))
            .deleteAfter(Duration.days(120))
            .moveToColdStorageAfter(Duration.days(7))
            .build()
    ))
    .build();
```

**Model Failure**: Incorrect API knowledge for CDK v2 backup constructs.

## 3. KMS Key Configuration

**Problem**: Model initially omitted required `KeyUsage` property for KMS keys, causing validation errors.

**Fix Applied**: Added required `KeyUsage.ENCRYPT_DECRYPT`:
```java
kmsKey = Key.Builder.create(this, "KMSKey")
    .keySpec(KeySpec.SYMMETRIC_DEFAULT)
    .keyUsage(KeyUsage.ENCRYPT_DECRYPT)  // This was missing
    .enableKeyRotation(true)
    // ...
```

**Model Failure**: Incomplete knowledge of required KMS key properties in CDK v2.

## 4. VPC Configuration API Changes

**Problem**: Model used deprecated `cidr()` method instead of the new `ipAddresses()` method:
```java
// Old/deprecated (failed):
.cidr("10.0.0.0/16")

// Correct CDK v2 syntax:
.ipAddresses(IpAddresses.cidr("10.0.0.0/16"))
```

**Model Failure**: Using outdated CDK API patterns instead of current v2 syntax.

## 5. S3 Bucket Creation Mismatch

**Problem**: Tests expected two S3 buckets (`S3Bucket0Name`, `S3Bucket1Name`) but model only created one.

**Fix Applied**: Created separate data and logs buckets:
```java
// Data bucket
s3Bucket = Bucket.Builder.create(this, "DataS3Bucket")...

// Logs bucket  
logsBucket = Bucket.Builder.create(this, "LogsS3Bucket")...
```

**Model Failure**: Misunderstanding test requirements and expected infrastructure components.

## 6. Import Management

**Problem**: Model included unused imports that caused compilation warnings:
```java
import software.amazon.awscdk.services.ec2.CfnVPCPeeringConnection; // Never used
import software.amazon.awscdk.services.ec2.IVpc; // Never used
import software.amazon.awscdk.services.sns.Subscription; // Never used
```

**Model Failure**: Poor import hygiene and not cleaning up unused dependencies.

## 7. CloudFormation Output Naming

**Problem**: Model used generic output names that didn't match test expectations:
```java
// Tests expected:
"S3Bucket0Name", "S3Bucket1Name", "KmsKeyId"

// Model initially used different names
```

**Fix Applied**: Updated output names to match exact test expectations.

**Model Failure**: Not analyzing test files to understand expected resource naming conventions.

## Summary

The main categories of model failures were:
1. **AWS Service Constraints**: Not understanding account/organization limitations
2. **API Version Confusion**: Using deprecated CDK v1 patterns in CDK v2 context
3. **Incomplete Property Knowledge**: Missing required properties (KeyUsage, etc.)
4. **Resource Architecture**: Misunderstanding how CDK pipelines create supporting resources

These failures required significant debugging and iteration to resolve, indicating the model needs better:
- Knowledge of current CDK v2 APIs
- Understanding of AWS service availability constraints  
- Analysis of test requirements before code generation
- Awareness of implicit resource creation (pipeline artifact buckets)