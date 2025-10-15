# CloudFormation Template Model Failures

## Problem 1: CloudTrail EventSelector Invalid S3 ARN Format
**Problem:** CloudTrail EventSelector S3 ARN ended with `/` instead of `/*` preventing object-level event capture.
**Solution:** Changed `!Sub '${S3Bucket.Arn}/'` to `!Sub '${S3Bucket.Arn}/*'` to properly capture S3 object events.
**Area Affected:** Security, Compliance

## Problem 2: ALBTargetGroup Static Instance Registration
**Problem:** ALBTargetGroup used static `Targets` property causing deployment issues and production concerns.
**Solution:** Removed static `Targets` property and added proper target registration via `Targets` array with EC2 instance reference.
**Area Affected:** Reliability, Operations

## Problem 3: Missing SSH Access Configuration
**Problem:** EC2SecurityGroup missing SSH ingress rule on port 22 despite KeyPairName parameter requirement.
**Solution:** Added SSH ingress rule allowing port 22 access from VPC CIDR block (10.0.0.0/16).
**Area Affected:** Operations, Accessibility

## Problem 4: RDS Data Protection Missing
**Problem:** RDSInstance missing UpdateReplacePolicy leaving data unprotected during stack updates causing replacement.
**Solution:** Added `UpdateReplacePolicy: Snapshot` to protect data during stack updates that trigger resource replacement.
**Area Affected:** Data Protection, Reliability

## Problem 5: Hardcoded Database Credentials
**Problem:** RDS credentials hardcoded as parameters (DBMasterUsername/DBMasterPassword) creating security vulnerability.
**Solution:** Implemented AWS Secrets Manager with auto-generated credentials and updated RDS to use Secrets Manager resolution.
**Area Affected:** Security, Compliance

## Problem 6: Manual Key Pair Dependency
**Problem:** EC2 Key Pair required as external parameter (KeyPairName) forcing manual pre-creation and breaking automation.
**Solution:** Created `AWS::EC2::KeyPair` resource within template eliminating external dependencies.
**Area Affected:** Automation, Operations

## Problem 7: Hardcoded AMI ID Requirement
**Problem:** AMI ID hardcoded as parameter (LatestAmiId) requiring manual updates and maintenance overhead.
**Solution:** Used SSM Parameter Store dynamic resolution `{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}`.
**Area Affected:** Automation, Maintenance

## Problem 8: Missing ALB Target Registration
**Problem:** EC2 instance not registered with ALB target group causing 503 Service Unavailable errors.
**Solution:** Added `Targets` property to ALBTargetGroup with proper EC2 instance registration on port 80.
**Area Affected:** Availability, Reliability

## Problem 9: ALB Subnet Requirement Violation
**Problem:** ALB had only one public subnet violating AWS requirement for minimum two subnets in different AZs.
**Solution:** Added `PublicSubnet2` in different AZ and updated ALB to use both public subnets for high availability.
**Area Affected:** High Availability, Compliance

---

## Summary
**Total Problems Identified:** 9
**Critical Issues:** 3 (Security credentials, Missing target registration, ALB availability)
**High Issues:** 4 (Data protection, SSH access, Subnet requirements, Automation dependencies)
**Medium Issues:** 2 (CloudTrail logging, AMI management)