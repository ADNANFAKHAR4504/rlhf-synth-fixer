# CloudFormation Template Fixes

## 1. Parameter Definitions

- **Added missing parameter types and constraints** for `EnvironmentType` to restrict values to `development`, `testing`, and `production`.
- **Added description fields** to parameters for better clarity.

## 2. S3 Bucket Configuration

- Updated bucket names to **include environment identifiers** using `!Sub`.
- Added **`DeletionPolicy: Retain`** to avoid accidental data loss in production.
- Added `BucketEncryption` configuration for security.

## 3. DynamoDB Table

- Added environment-specific **table name suffix**.
- Added **BillingMode** and environment-based **provisioned throughput configuration**.

## 4. IAM Roles and Policies

- Fixed incorrect `PolicyDocument` syntax.
- Implemented **environment-specific resource ARNs** to restrict access only to relevant environment resources.
- Added **`AssumeRolePolicyDocument`** to allow AWS services to assume the role.

## 5. Centralized S3 for Shared Configurations

- Added a **centralized configuration bucket**.
- Created a **read-only IAM policy** granting access to shared configuration files.

## 6. CloudWatch Logs

- Added environment-specific **log group naming convention**.
- Added **retention period parameter** for flexibility.

## 7. AWS Systems Manager Parameter Store

- Added secure string parameters for **environment-specific sensitive data**.
- Applied **`NoEcho: true`** for sensitive parameter inputs.

## 8. General Fixes

- Fixed all **YAML indentation issues**.
- Ensured **`!Ref` and `!Sub` usage correctness**.
- Removed unused and redundant resources.
- Added **Outputs** section to export key resource names and ARNs.
