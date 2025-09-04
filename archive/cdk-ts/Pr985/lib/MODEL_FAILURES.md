# Infrastructure Fixes Required for Production Deployment

The following critical infrastructure issues were identified and corrected in the CDK TypeScript implementation:

## 1. Deployment Configuration Issues

### Missing Environment Suffix Management

**Problem**: The infrastructure lacked proper environment suffix handling, preventing multi-environment deployments and causing resource naming conflicts.

**Fix**: Added `environmentSuffix` context variable retrieval and applied it to all resource names:

```typescript
const environmentSuffix = this.node.tryGetContext('environmentSuffix') || 'dev';
```

## 2. Resource Destruction Blockers

### Retain Policies Preventing Cleanup

**Problem**: Multiple resources had `RETAIN` removal policies and deletion protection enabled, preventing stack cleanup and causing deployment conflicts.

**Fixes Applied**:

- Changed S3 bucket from `RETAIN` to `DESTROY` with `autoDeleteObjects: true`
- Set RDS `deletionProtection: false` and `removalPolicy: DESTROY`
- Updated CloudWatch log groups to use `DESTROY` policy

## 3. API Configuration Errors

### Incorrect API Method References

**Problem**: Several CDK API calls used incorrect method names or properties that don't exist in CDK v2.

**Fixes**:

- Changed `LogGroupLogDestination.logGroup()` to `new LogGroupLogDestination()`
- Fixed `contextResponseTime()` to `contextResponseLatency()`
- Removed non-existent `description` property from RDS credentials
- Removed unsupported `kubernetesAuditLogs` from GuardDuty dataSources

## 4. IAM Policy Structure Issues

### Invalid Principal Specification

**Problem**: MFA enforcement policy incorrectly specified principals in an identity-based policy.

**Fix**: Restructured MFA policy to use `notActions` pattern without principals:

```typescript
new iam.PolicyStatement({
  sid: 'DenyAllExceptListedIfNoMFA',
  effect: iam.Effect.DENY,
  notActions: [
    'iam:CreateVirtualMFADevice',
    'iam:EnableMFADevice',
    // ... MFA-related actions
  ],
  resources: ['*'],
  conditions: {
    BoolIfExists: {
      'aws:MultiFactorAuthPresent': 'false',
    },
  },
});
```

## 5. VPC Configuration Issues

### Missing NAT Gateway Configuration

**Problem**: VPC had private subnets with egress (`PRIVATE_WITH_EGRESS`) but no public subnets for NAT gateways.

**Fix**: Added public subnet configuration to support NAT gateways:

```typescript
subnetConfiguration: [
  {
    cidrMask: 24,
    name: 'corp-public-subnet',
    subnetType: ec2.SubnetType.PUBLIC,
  },
  {
    cidrMask: 24,
    name: 'corp-private-subnet',
    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
  },
];
```

## 6. CDK Feature Flag Issues

### Deprecated CDK v1 Feature Flags

**Problem**: The cdk.json contained deprecated feature flags from CDK v1 that cause errors in CDK v2.

**Fix**: Removed `@aws-cdk/core:enableStackNameDuplicates` flag from cdk.json.

## 7. Missing Stack Outputs

### Insufficient Integration Points

**Problem**: Limited stack outputs prevented proper integration testing and resource discovery.

**Fix**: Added comprehensive outputs with export names for all major resources:

- S3 bucket name and ARN
- Database endpoint and port
- API Gateway URL
- GuardDuty detector ID
- VPC ID
- Lambda function details
- IAM user and role information

## 8. Missing Dependencies

### Source Map Support

**Problem**: The bin/tap.ts file imported 'source-map-support' without it being installed.

**Fix**: Added source-map-support to package.json dependencies.

## 9. PostgreSQL Version Compatibility Issues

### Deprecated PostgreSQL Engine Version

**Problem**: PostgreSQL version 15.4 was specified but is not available in all AWS regions, causing deployment failures with error "Cannot find version 15.4 for postgres".

**Fix**: Updated to use the more widely supported `rds.PostgresEngineVersion.VER_15` which automatically selects the latest available 15.x version in the region:

```typescript
engine: rds.DatabaseInstanceEngine.postgres({
  version: rds.PostgresEngineVersion.VER_15, // Instead of VER_15_4
}),
```

**Note**: Using `VER_15` allows AWS to automatically select the best available 15.x version for the region, ensuring compatibility across all AWS regions.

## 10. GuardDuty Detector Resource Conflicts

### Single Detector Per Account Limitation

**Problem**: GuardDuty only allows one detector per AWS account per region. Attempting to create a new detector when one already exists causes deployment failures with error "The request is rejected because a detector already exists for the current account".

**Fix**: Implemented a custom resource Lambda function that intelligently manages GuardDuty detectors:

```typescript
// Custom resource to handle existing GuardDuty detector
const guardDutyHandler = new cdk.CustomResource(this, 'guardduty-handler', {
  serviceToken: new lambda.Function(this, 'guardduty-lambda', {
    // Lambda function that checks for existing detector and reuses it
    // or creates new one if none exists
  }).functionArn,
});
```

**Benefits of this approach**:

- **Reuses existing detectors** instead of failing on deployment
- **Enables desired features** on existing detectors (S3 data events, EKS audit logs, EBS malware protection, RDS login events, Lambda network logs)
- **Handles both scenarios**: existing detector reuse or new detector creation
- **Maintains detector across deployments** without conflicts
- **Follows AWS best practices** for resource management

**Implementation details**:

- Lambda function checks `guardduty.list_detectors()` for existing detectors
- If detector exists: updates it with desired configuration and features
- If no detector exists: creates new one with all specified features
- Returns actual detector ID for stack outputs
- Preserves detector on stack deletion (doesn't delete existing infrastructure)

## Summary

These fixes transform the infrastructure from a non-deployable state to a production-ready, fully testable, and maintainable solution that:

- Supports multi-environment deployments
- Can be cleanly destroyed and recreated
- Follows AWS and CDK best practices
- Provides comprehensive monitoring and security
- Includes proper resource tagging and naming conventions
- Enables full integration testing with real AWS resources
- Handles region-specific PostgreSQL version compatibility
- Intelligently manages GuardDuty detectors to avoid resource conflicts
- Reuses existing infrastructure when possible while maintaining security standards
