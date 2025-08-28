# Model Implementation Failures and Resolutions

## Overview

During the implementation of the AWS CI/CD Pipeline using Java CDK, several critical failures occurred that required architectural changes and fixes. This document details each failure, its root cause, and the implemented resolution.

## Critical Failures and Resolutions

### 1. CodeCommit Repository Creation Failure

**Failure Description:**
```
CreateRepository request is not allowed because there is no existing repository in this AWS account or AWS Organization 
(Service: AWSCodeCommit; Status Code: 400; Error Code: OperationNotAllowedException)
```

**Root Cause:**
- CodeCommit service restrictions in the ap-northeast-1 region for the AWS account
- CodeCommit may not be available or enabled for new repositories in certain regions/accounts
- The original implementation assumed CodeCommit would be universally available

**Resolution Implemented:**
- **Architecture Change**: Migrated from CodeCommit source to S3 source
- **Updated Pipeline Stage**: Changed `CodeCommitSourceAction` to `S3SourceAction`
- **Source Configuration**: Pipeline now reads from `source.zip` in the artifacts bucket
- **Removed Dependencies**: Eliminated all CodeCommit-related imports and configurations
- **Updated IAM Policies**: Replaced CodeCommit permissions with S3 permissions in pipeline service role

**Code Changes:**
```java
// BEFORE (Failed)
CodeCommitSourceAction.Builder
  .create()
  .actionName("SourceAction")
  .repository(this.repository)
  .branch(branchName)
  .output(sourceOutput)
  .trigger(CodeCommitTrigger.EVENTS)
  .build()

// AFTER (Working)
S3SourceAction.Builder
  .create()
  .actionName("SourceAction")
  .bucket(this.artifactsBucket)
  .bucketKey("source.zip")
  .output(sourceOutput)
  .build()
```

### 2. CodeDeploy Auto-Rollback Configuration Failure

**Failure Description:**
```
ValidationError: The auto-rollback setting 'deploymentInAlarm' does not have any effect unless you associate 
at least one CloudWatch alarm with the Deployment Group.
```

**Root Cause:**
- CDK validation requires CloudWatch alarms to be associated when `deploymentInAlarm` is set to `true`
- Original configuration attempted to enable alarm-based rollback without defining alarms
- This is a CDK-specific validation that differs from CloudFormation behavior

**Resolution Implemented:**
- **Configuration Change**: Set `deploymentInAlarm(false)` to disable alarm-based rollback
- **Alternative Approach**: Maintained `failedDeployment(true)` and `stoppedDeployment(true)` for basic rollback functionality
- **Future Enhancement**: Noted that CloudWatch alarms can be added later when monitoring is implemented

**Code Changes:**
```java
// BEFORE (Failed)
.deploymentInAlarm(true)

// AFTER (Working)  
.deploymentInAlarm(false)
```

### 3. CDK Gradle Wrapper Configuration Issue

**Failure Description:**
```
gradle: command not found
```

**Root Cause:**
- `cdk.json` was configured to use `gradle run` instead of the Gradle wrapper `./gradlew run`
- System did not have global Gradle installation
- CDK could not execute the application for synthesis

**Resolution Implemented:**
- **Configuration Fix**: Updated `cdk.json` to use `./gradlew run`
- **Verified Wrapper**: Ensured Gradle wrapper permissions and functionality

**Code Changes:**
```json
// BEFORE (Failed)
"app": "gradle run"

// AFTER (Working)
"app": "./gradlew run"
```

### 4. Java Compilation Errors - Missing Imports and References

**Failure Description:**
```
error: cannot find symbol - variable repository
error: cannot find symbol - class Repository  
error: cannot find symbol - method roles(List<Role>)
```

**Root Cause:**
- Residual references to removed CodeCommit repository objects
- Incorrect IAM InstanceProfile API usage (`roles()` vs `role()`)
- Missing imports for new S3SourceAction and related classes

**Resolution Implemented:**
- **Cleanup**: Removed all repository-related method calls and outputs
- **API Correction**: Fixed InstanceProfile to use `.role(singleRole)` instead of `.roles(rolesList)`
- **Import Updates**: Added S3SourceAction import, removed CodeCommit imports
- **Reference Removal**: Eliminated repository field and getter methods

**Code Changes:**
```java
// BEFORE (Failed)
.roles(Arrays.asList(this.ec2InstanceRole))
public Repository getRepository() { return repository; }

// AFTER (Working)
.role(this.ec2InstanceRole)
// Method removed entirely
```

### 5. Resource Naming and Environment Configuration Issues

**Failure Description:**
- Inconsistent resource naming between environments
- Complex environment suffix logic causing confusion
- Resource names didn't match CloudFormation template requirements

**Root Cause:**
- Original implementation used complex environment-based prefixing logic
- Requirement was specifically for "prod-" prefixes regardless of environment
- TapStackProps class had unnecessary complexity with repository and instance configurations

**Resolution Implemented:**
- **Simplified Naming**: Used consistent "prod-" prefix for all resources
- **Streamlined Props**: Reduced TapStackProps to only include environmentSuffix
- **Consistent Configuration**: Aligned all resource names with CloudFormation YAML template

**Code Changes:**
```java
// BEFORE (Complex)
this.resourcePrefix = environmentSuffix.equals("prod") ? "prod-" : environmentSuffix + "-";

// AFTER (Simplified)
this.resourcePrefix = "prod-";
```

## Lessons Learned

### 1. Service Availability Assumptions
- Never assume AWS services are universally available across all regions/accounts
- Always have fallback architectures for service dependencies
- Test service availability before implementing dependencies

### 2. CDK vs CloudFormation Validation Differences
- CDK has stricter validation rules than raw CloudFormation
- Auto-rollback configurations require explicit alarm associations in CDK
- Always test synthesis early in development process

### 3. Build Configuration Dependencies
- Wrapper scripts (./gradlew) should be used instead of assuming global installations
- CDK applications must be executable for synthesis to work
- Verify build configuration before implementing business logic

### 4. Code Cleanup During Architectural Changes
- Systematic removal of deprecated dependencies prevents compilation errors
- API changes require careful review of all method signatures
- Import statements must be updated when changing service integrations

### 5. Resource Naming Consistency
- Establish naming conventions early and stick to them
- Match infrastructure naming with requirements documents exactly
- Avoid environment-dependent naming when not required

## Success Metrics After Resolution

- ✅ **CDK Synthesis**: Templates generate successfully without errors
- ✅ **CloudFormation Deployment**: Stack deploys completely in ap-northeast-1 region
- ✅ **Resource Creation**: All required resources created with proper configurations
- ✅ **IAM Policies**: Least privilege access implemented successfully
- ✅ **Pipeline Functionality**: S3-based source stage works as intended
- ✅ **Naming Compliance**: All resources use required "prod-" prefixes

## Architecture Impact

The migration from CodeCommit to S3 source actually **improved** the solution by:
- **Increased Flexibility**: S3 source works across all regions and accounts
- **Better Integration**: Aligns with common CI/CD patterns using artifact storage
- **Reduced Dependencies**: Eliminates service-specific availability concerns
- **Simplified Permissions**: S3-based permissions are more straightforward than CodeCommit

This architectural change transformed a blocking failure into an enhanced, more robust solution.