# Issues Identified and Recommendations

This document lists the issues found and the optimizations recommended for the CloudFormation `TapStack.yml` file based on the current implementation.

---

## 1. Hardcoded Availability Zones
- Issue: YAML 1 used hardcoded Availability Zones (`us-east-1a`, `us-east-1b`), which reduced portability.  
- Fix in YAML 2: Replaced with `!Select` and `!GetAZs` to dynamically resolve AZs.

**Fixed Example:**
```yaml
AvailabilityZone: !Select [ 0, !GetAZs '' ]
```

---

## 2. Redundant Route Tables
- Issue: YAML 1 created multiple identical private route tables.  
- Fix in YAML 2: Consolidated into a single `ProdEnvPrivateRouteTable` associated with both private subnets.

---

## 3. Missing DeletionPolicy for S3 Bucket
- Issue: In YAML 1, S3 bucket had no `DeletionPolicy`, risking data loss.  
- Fix in YAML 2: Added `DeletionPolicy: Retain` and `UpdateReplacePolicy: Retain`.

---

## 4. Fn::Sub Usage in UserData
- Issue: YAML 1 used unnecessary `Fn::Sub` wrappers around static UserData.  
- Fix in YAML 2: Cleaned up to use only `Fn::Base64`.

---

## 5. CAPABILITY_NAMED_IAM Errors
- Issue: YAML 1 explicitly set `RoleName` / `GroupName`, requiring `CAPABILITY_NAMED_IAM`.  
- Fix in YAML 2: Removed hardcoded names so `CAPABILITY_IAM` is sufficient.

---

## 6. Manual KeyPair Parameter
- Issue: YAML 1 forced `ProdEnvKeyPairName` parameter, breaking automation.  
- Fix in YAML 2: Introduced `AWS::EC2::KeyPair` resource to auto-create the key pair and referenced it in EC2 instances.

---

## 7. Overly Permissive Security Group Egress
- Issue: YAML 1 allowed all outbound traffic (`IpProtocol: -1`).  
- Fix in YAML 2: Restricted egress to port 443 for S3 and CloudWatch VPC endpoints.

---

## 8. Hardcoded AMI IDs
- Issue: YAML 1 hardcoded AMI IDs.  
- Fix in YAML 2: Switched to SSM Parameter Store (`/aws/service/ami-amazon-linux-latest/...`).

---

## 9. Missing VPC Endpoints
- Issue: YAML 1 relied on internet for S3 / CloudWatch.  
- Fix in YAML 2: Added VPC endpoints for S3 and CloudWatch Logs.

---

## 10. CloudWatch Agent Configuration
- Issue: YAML 1 used default CloudWatch agent settings (`-c default`).  
- Fix in YAML 2: YAML 2 provides custom CloudWatch agent JSON config for log collection.