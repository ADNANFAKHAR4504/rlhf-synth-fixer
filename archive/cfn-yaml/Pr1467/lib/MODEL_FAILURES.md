# Model Failures Analysis

The original CloudFormation template implementation had multiple issues that reduced its security posture, maintainability, and alignment with best practices.  
Below are the key issues identified and the fixes applied in the improved template.

## Key Issues Fixed

### 1. No Environment or Project Parameterization
- **Issue**: The original template hardcoded resource names (e.g., `SecurityVPC`, `SecureDataBucket`) without environment or project variables, making deployments across multiple environments difficult.
- **Fix**: Added `Environment` and `Project` parameters and used them in resource names and tags for consistent multi-environment support.

---

### 2. KMS Key Policy Too Permissive and Incomplete
- **Issue**: KMS key policy used `kms:*` for root account and did not explicitly grant access to all intended AWS services (e.g., RDS).
- **Fix**: Scoped key permissions by service (CloudTrail, S3, RDS) with explicit allowed actions

---

### 3. Missing Public/Private Networking Segmentation
- **Issue**: Only private subnets existed; there was no public subnet or NAT Gateway for controlled internet access from private resources.
- **Fix**: Added two public subnets, NAT Gateways in each AZ, and route tables for proper public/private network segregation and redundancy.

---

### 4. No Internet Gateway for Public Connectivity
- **Issue**: Template lacked an Internet Gateway and route configurations for public subnets.
- **Fix**: Added `AWS::EC2::InternetGateway` and attached it to the VPC with corresponding public route tables.

---

### 5. Weak Resource Tagging
- **Issue**: Tags were inconsistent and lacked key identifiers like `Environment` and `Project`.
- **Fix**: Added consistent tagging (`Name`, `Environment`, `Project`) across all resources for better governance and cost tracking.

---

### 6. Hardcoded Database Credentials
- **Issue**: Database username/password were provided as CloudFormation parameters, risking exposure in stack events and templates.
- **Fix**: Stored database credentials in AWS Secrets Manager with automatic password generation, and resolved them at deployment time using `{{resolve:secretsmanager:...}}`.

---

### 7. RDS Instance Not Multi-AZ
- **Issue**: `MultiAZ` was set to `false`, reducing availability in production.
- **Fix**: Enabled `MultiAZ: true` for higher availability and fault tolerance.

---

### 8. RDS Deletion Protection Handling
- **Issue**: `DeletionProtection` was set to `true`, which could block stack deletions during testing environments.
- **Fix**: Parameterized deletion protection or disabled it in non-production environments for flexibility.

---

### 9. Missing NAT Gateway EIPs
- **Issue**: NAT Gateways had no associated Elastic IPs, breaking outbound internet access from private subnets.
- **Fix**: Created `AWS::EC2::EIP` resources for each NAT Gateway.

---

### 10. Missing S3 Access Logging and Policies
- **Issue**: Logging buckets lacked bucket policies to allow AWS log delivery services.
- **Fix**: Added explicit `BucketPolicy` statements granting required permissions to `delivery.logs.amazonaws.com` and CloudTrail.

---

### 11. S3 Bucket Name Collisions
- **Issue**: Bucket names were static and not unique across accounts/regions.
- **Fix**: Parameterized bucket names to include `${AWS::AccountId}` and `${AWS::Region}` for global uniqueness.

---

### 12. Overly Permissive IAM Policies
- **Issue**: IAM roles allowed wildcard (`*`) resources and broad actions without restriction.
- **Fix**: Scoped IAM policies to specific ARNs (S3 buckets, log groups, KMS keys, RDS instances) instead of allowing all resources.

---

### 13. No Secrets for Lambda Environment Variables
- **Issue**: Lambda environment variables included sensitive references (e.g., KMS Key ID) directly.
- **Fix**: Integrated Lambda with Secrets Manager or parameterized environment variables to avoid direct exposure in the template.

---

### 14. Missing RDS Backup and Maintenance Windows
- **Issue**: No preferred backup or maintenance windows were set for RDS, leaving them at AWS defaults.
- **Fix**: Added `PreferredBackupWindow` and `PreferredMaintenanceWindow` for predictable scheduling.

---

### 15. Lack of High Availability in Subnet Design
- **Issue**: Original template had only two private subnets without matching public/private subnet pairs in multiple AZs for redundancy.
- **Fix**: Created a four-subnet architecture (two public, two private) across two AZs with NAT Gateways in each.

---

### 16. CloudTrail Policy Missing `GetBucketLocation`
- **Issue**: CloudTrail bucket policy lacked the `s3:GetBucketLocation` permission, which can cause logging failures.
- **Fix**: Added missing permission to CloudTrail bucket policy.

---
