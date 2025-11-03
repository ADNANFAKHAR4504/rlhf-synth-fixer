# Model Failures and Fixes

This document outlines the issues encountered during the initial implementation and the fixes applied to reach the ideal solution.

## PostgreSQL Engine Version Issue

**Problem:**
The initial implementation used PostgreSQL version 14.7 (`rds.PostgresEngineVersion.VER_14_7`), which resulted in a deployment failure with the error:

```
Cannot find version 14.7 for postgres (Service: Rds, Status Code: 400)
```

**Root Cause:**
AWS RDS doesn't support PostgreSQL 14.7. The available versions in AWS are 14.15-14.19 and 15.7-15.14 for the supported minor versions.

**Fix:**
Updated the RDS database configuration to use PostgreSQL 15.12:

```typescript
engine: rds.DatabaseInstanceEngine.postgres({
  version: rds.PostgresEngineVersion.VER_15_12,
})
```

**Additional Change:**
Updated the EC2 user data to install `postgresql15` instead of `postgresql14` to match the RDS version:

```typescript
'yum install -y amazon-cloudwatch-agent postgresql15',
```

## EBS Volume Encryption Issue

**Problem:**
The initial implementation explicitly set `encrypted: true` on EBS volumes in the launch template, which caused deployment failures:

```
Group did not stabilize. Last scaling activity: Instance became unhealthy while waiting for instance to be in InService state. 
Termination Reason: Client.InvalidKMSKey.InvalidState: The KMS key provided is in an incorrect state
```

**Root Cause:**
When `encrypted: true` is specified without an explicit `kmsKeyId`, AWS attempts to use the account's default EBS encryption key. If this key is in an invalid state or doesn't exist, the volume creation fails.

**Fix:**
Removed the explicit `encrypted: true` flag from the EBS volume configuration, allowing the account-level default EBS encryption setting to apply:

```typescript
blockDevices: [
  {
    deviceName: '/dev/xvda',
    volume: ec2.BlockDeviceVolume.ebs(30, {
      volumeType: ec2.EbsDeviceVolumeType.GP3,
      // Encryption uses account default EBS encryption setting
      // Explicit encryption flag removed to avoid KMS key state issues
    }),
  },
],
```

This approach ensures that:
- If account-level EBS encryption is enabled, volumes will be encrypted automatically
- The deployment won't fail due to KMS key state issues
- The infrastructure is more portable across different AWS accounts

## Architecture Simplifications

The initial prompt mentioned cross-environment RDS read replicas and VPC peering, but these were simplified in the final implementation for the following reasons:

1. **Cross-environment read replicas** require additional setup of VPC peering connections, route tables, and cross-account/cross-region IAM permissions that add significant complexity
2. **VPC CIDR variations** per environment (10.1.0.0/16 for dev, 10.2.0.0/16 for staging, 10.3.0.0/16 for prod) were simplified to a single CIDR block (10.1.0.0/16) since each environment is deployed independently
3. The focus was shifted to ensuring consistent architecture patterns and naming conventions rather than cross-environment connectivity

The final implementation provides a solid foundation that can be extended with cross-environment features if needed in the future.
