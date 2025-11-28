# Model Failures

## Deployment Failure Analysis - Task u6j2o0o7

### Summary
Initial deployment failed after 46 minutes with 3 critical errors. 49 out of 53 resources were created successfully, but 4 resources failed due to configuration issues.

### Critical Errors

#### Error 1: Fargate Profile Naming Violation
**Resource**: `eks-fargate-profile-synthu6j2o0o7`

**Error Message**:
```
InvalidParameterException: The fargate profile name starts with the reserved prefix: 'eks-'.
Fargate name: eks-fargate-system-synthu6j2o0o7
```

**Root Cause**:
- AWS reserves the `eks-` prefix for Fargate profile names
- The code incorrectly used `eks-fargate-system-${environmentSuffix}` as the profile name
- This violates AWS naming conventions for Fargate profiles

**Code Location**: `lib/tap-stack.ts:626`

**Original Code**:
```typescript
const fargateProfile = new aws.eks.FargateProfile(
  `eks-fargate-profile-${environmentSuffix}`,
  {
    clusterName: cluster.name,
    fargateProfileName: `eks-fargate-system-${environmentSuffix}`, // INCORRECT
    // ...
  }
);
```

**Fix Applied**:
```typescript
const fargateProfile = new aws.eks.FargateProfile(
  `fargate-profile-${environmentSuffix}`,
  {
    clusterName: cluster.name,
    fargateProfileName: `fargate-system-${environmentSuffix}`, // CORRECT
    // ...
  }
);
```

**Lesson**: Always avoid AWS reserved prefixes (`eks-`, `aws-`, etc.) in user-defined resource names.

---

#### Error 2: KMS Key Configuration - General Node Group
**Resource**: `eks-general-ng-synthu6j2o0o7`

**Error Message**:
```
Client.InvalidKMSKey.InvalidState: The KMS key provided is in an incorrect state
```

**Root Cause**:
- The launch template for the general node group specified `encrypted: 'true'` for EBS volumes
- However, no explicit KMS key was provided for EBS encryption
- The node group attempted to use the cluster's EKS encryption key (`alias/aws/eks`), which is not valid for EBS volumes
- EBS volumes require the EBS-specific AWS-managed key (`alias/aws/ebs`)

**Code Location**: `lib/tap-stack.ts:471`

**Original Code**:
```typescript
blockDeviceMappings: [
  {
    deviceName: '/dev/xvda',
    ebs: {
      volumeSize: 50,
      volumeType: 'gp3',
      encrypted: 'true',
      deleteOnTermination: 'true',
      // No kmsKeyId specified - caused the issue
    },
  },
]
```

**Fix Applied**:
```typescript
blockDeviceMappings: [
  {
    deviceName: '/dev/xvda',
    ebs: {
      volumeSize: 50,
      volumeType: 'gp3',
      encrypted: 'true',
      deleteOnTermination: 'true',
      // Use AWS-managed EBS encryption key (default)
      kmsKeyId: pulumi
        .output(aws.kms.getAlias({ name: 'alias/aws/ebs' }))
        .apply(alias => alias.targetKeyArn),
    },
  },
]
```

**Lesson**: When encrypting EBS volumes in EKS node groups, explicitly specify the AWS-managed EBS KMS key (`alias/aws/ebs`) rather than relying on the cluster's encryption configuration.

---

#### Error 3: KMS Key Configuration - Compute Node Group
**Resource**: `eks-compute-ng-synthu6j2o0o7`

**Error Message**:
```
Client.InvalidKMSKey.InvalidState: The KMS key provided is in an incorrect state
```

**Root Cause**:
Same as Error 2 - the compute-intensive node group had the identical KMS encryption issue.

**Code Location**: `lib/tap-stack.ts:536`

**Original Code**:
```typescript
blockDeviceMappings: [
  {
    deviceName: '/dev/xvda',
    ebs: {
      volumeSize: 100,
      volumeType: 'gp3',
      encrypted: 'true',
      deleteOnTermination: 'true',
      // No kmsKeyId specified - caused the issue
    },
  },
]
```

**Fix Applied**:
```typescript
blockDeviceMappings: [
  {
    deviceName: '/dev/xvda',
    ebs: {
      volumeSize: 100,
      volumeType: 'gp3',
      encrypted: 'true',
      deleteOnTermination: 'true',
      // Use AWS-managed EBS encryption key (default)
      kmsKeyId: pulumi
        .output(aws.kms.getAlias({ name: 'alias/aws/ebs' }))
        .apply(alias => alias.targetKeyArn),
    },
  },
]
```

**Lesson**: Apply consistent encryption configuration across all node groups to ensure uniform security posture.

---

## Key Insights

### AWS Service-Specific Encryption Keys
- **EKS Secrets**: Use `alias/aws/eks` for encrypting Kubernetes secrets
- **EBS Volumes**: Use `alias/aws/ebs` for encrypting EBS volumes attached to EC2 instances
- **Important**: These keys are NOT interchangeable

### Naming Convention Best Practices
- Avoid AWS reserved prefixes: `eks-`, `aws-`, `amazon-`
- Use descriptive names: `fargate-system-`, `nodegroup-general-`, etc.
- Include environment suffix for uniqueness: `-${environmentSuffix}`

### Deployment Time Considerations
- Full EKS cluster deployment: ~45-50 minutes
- Most time spent on:
  - VPC networking setup (NAT gateways, route tables)
  - EKS cluster control plane provisioning
  - Node group auto-scaling configuration
  - Fargate profile activation
- Failed resources detected late in deployment cycle
- **Recommendation**: Validate naming conventions and KMS configurations before deployment to avoid long feedback loops

---

## Prevention Strategies

### For Future Implementations
1. **Pre-Deployment Validation**: Add linting rules to check for reserved AWS prefixes
2. **KMS Key Validation**: Verify correct KMS key aliases for each service
3. **Template Testing**: Test launch templates independently before node group creation
4. **Incremental Deployment**: Deploy VPC → Cluster → Node Groups separately to identify issues faster

### Testing Recommendations
1. Use AWS CloudFormation/Pulumi preview to catch naming violations
2. Test with minimal node group sizes first (desiredSize: 1)
3. Validate KMS key accessibility in target AWS account
4. Review AWS service documentation for reserved prefixes and naming rules

---

## Fixed Resources Summary

| Resource | Error Type | Status |
|----------|-----------|--------|
| Fargate Profile | Naming Violation | Fixed ✓ |
| General Node Group | KMS Configuration | Fixed ✓ |
| Compute Node Group | KMS Configuration | Fixed ✓ |

All fixes applied and validated. Ready for re-deployment.
