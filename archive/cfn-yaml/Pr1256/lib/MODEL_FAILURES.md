# Model Failures

This document lists the issues in the `MODEL_RESPONSE.md` file that were fixed in the `TapStack.yml` file.

## **1. Missing `IsLogging` Property in CloudTrail**
- **Issue**: The `CloudTrail` resource in `MODEL_RESPONSE.md` does not include the `IsLogging` property, which is required to enable logging.
- **Fix**: Added the `IsLogging: true` property in the `CloudTrail` resource in `TapStack.yml`.

## **2. Incorrect RDS Engine Version**
- **Issue**: The RDS PostgreSQL instance in `MODEL_RESPONSE.md` uses an outdated engine version (`13.7`).
- **Fix**: Updated the engine version to `15.7` in `TapStack.yml`.

## **3. Incorrect Parameter Default Values**
- **Issue**: The `Environment` and `Project` parameters in `MODEL_RESPONSE.md` have default values of `Dev` and `MyProject`, which do not align with the deployment standards.
- **Fix**: Updated the default values to `dev` and `myproject` in `TapStack.yml`.

## **4. Missing DomainName Parameter**
- **Issue**: The `DomainName` parameter is included in `MODEL_RESPONSE.md` but is not used in the resources, leading to unnecessary complexity.
- **Fix**: Removed the unused `DomainName` parameter in `TapStack.yml`.

## **5. Incorrect S3 Bucket Policy Resource Reference**
- **Issue**: The `CloudTrailBucketPolicy` in `MODEL_RESPONSE.md` uses an incorrect reference for the bucket resource (`${CloudTrailBucket}/*`).
- **Fix**: Corrected the resource reference to `arn:aws:s3:::${CloudTrailBucket}/*` in `TapStack.yml`.

## **6. Missing `DeletionProtection` Property in RDS**
- **Issue**: The `RDSInstance` resource in `MODEL_RESPONSE.md` does not include the `DeletionProtection` property.
- **Fix**: Added `DeletionProtection: false` in `TapStack.yml`.

## **7. Incorrect IAM Policy Resource Reference**
- **Issue**: The IAM policy for S3 access in `MODEL_RESPONSE.md` uses an incorrect reference for the bucket resource (`${S3Bucket}/*`).
- **Fix**: Corrected the resource reference to `arn:aws:s3:::${S3Bucket}/*` in `TapStack.yml`.

## **8. Missing Tags in CloudTrail**
- **Issue**: The `CloudTrail` resource in `MODEL_RESPONSE.md` does not include tags for `Environment` and `Project`.
- **Fix**: Added the necessary tags in `TapStack.yml`.

## **9. Missing Outputs**
- **Issue**: The `MODEL_RESPONSE.md` file is missing outputs for `CloudTrailBucketName` and `WebACLId`.
- **Fix**: Added these outputs in `TapStack.yml`.

## **10. Incorrect Case in AllowedValues**
- **Issue**: The `AllowedValues` for the `Environment` parameter in `MODEL_RESPONSE.md` uses uppercase values (`Dev`, `Staging`, `Prod`).
- **Fix**: Updated the `AllowedValues` to lowercase (`dev`, `staging`, `prod`) in `TapStack.yml`.

## **11. Missing Multi-AZ Configuration for RDS**
- **Issue**: The `RDSInstance` resource in `MODEL_RESPONSE.md` does not include the `MultiAZ` property.
- **Fix**: Added `MultiAZ: true` in `TapStack.yml`.

## **12. Missing PublicAccessBlockConfiguration in S3**
- **Issue**: The `S3Bucket` resource in `MODEL_RESPONSE.md` does not include the `PublicAccessBlockConfiguration` property.
- **Fix**: Added `PublicAccessBlockConfiguration` to block public access in `TapStack.yml`.

## **13. Incorrect Health Check Configuration in ALB**
- **Issue**: The `TargetGroup` resource in `MODEL_RESPONSE.md` does not include proper health check configurations.
- **Fix**: Added `HealthCheckPath`, `HealthCheckProtocol`, `HealthCheckIntervalSeconds`, `HealthCheckTimeoutSeconds`, `HealthyThresholdCount`, and `UnhealthyThresholdCount` in `TapStack.yml`.

## **14. Missing WAF Web ACL Association**
- **Issue**: The `MODEL_RESPONSE.md` file does not associate the WAF Web ACL with the Application Load Balancer.
- **Fix**: Added the `WebACLAssociation` resource in `TapStack.yml`.

## **15. Missing CloudWatch Agent Installation**
- **Issue**: The `LaunchTemplate` in `MODEL_RESPONSE.md` does not include the installation and configuration of the CloudWatch Agent.
- **Fix**: Added the necessary commands to install and configure the CloudWatch Agent in the `UserData` section of the `LaunchTemplate` in

### **16. Incorrect Dynamic Reference Syntax
- **Issue**: E1029 Found an embedded parameter "${ProjectName}" outside of an "Fn::Sub" at Resources/Database/Properties/MasterUserPassword
- **Fix**: Corrected syntax** to use `!Sub` function:
  ```yaml
  MasterUserPassword: !Sub '{{resolve:secretsmanager:${ProjectName}/database/${Environment}:SecretString:password}}'
  ```

### **17. CAPABILITY_IAM Compatibility Issue
- **Issue**: `InsufficientCapabilitiesException: Requires capabilities : [CAPABILITY_NAMED_IAM]`
- **Fix**: Removed `RoleName` and `GroupName` properties to use auto-generated names compatible with `CAPABILITY_IAM`