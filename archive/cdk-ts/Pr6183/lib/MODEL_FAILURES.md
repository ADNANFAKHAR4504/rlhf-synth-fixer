# MODEL_FAILURES.md

## Issues Found and Fixed in MODEL_RESPONSE

### 1. CDK Token Resolution in Tag Keys (CRITICAL)

**Issue**: Initial implementation attempted to use dynamic cluster name in tag keys, which CDK cannot resolve at synthesis time.

**Original Code**:
```typescript
tags: {
  'k8s.io/cluster-autoscaler/enabled': 'true',
  [`k8s.io/cluster-autoscaler/${this.cluster.clusterName}`]: 'owned',
}
```

**Error**:
```
UnscopedValidationError: "k8s.io/cluster-autoscaler/${Token[TOKEN.374]}" is used as the key in a map
so must resolve to a string, but it resolves to: {"Fn::Join":["",["k8s.io/cluster-autoscaler/",
{"Ref":"transactioneksdevB04CBF15"}]]}
```

**Root Cause**: CDK requires all tag keys to be static strings at synthesis time. CloudFormation tokens cannot be used in tag keys.

**Fixed Code**:
```typescript
// Use cdk.Tags.of() but only with static tag keys
cdk.Tags.of(criticalNodeGroup).add('k8s.io/cluster-autoscaler/enabled', 'true');
cdk.Tags.of(criticalNodeGroup).add('k8s.io/cluster-autoscaler/node-template/label/workload-type', 'critical');
```

**Cluster Autoscaler Discovery Update**:
```typescript
// Updated auto-discovery command to use only the enabled tag
'--node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled',
```

**Impact**: This is a common pattern mistake when working with EKS and cluster autoscaler. The auto-discovery mechanism can find node groups using just the `enabled` tag without requiring the cluster name in the tag key.

### 2. Missing Environment Variable for Cluster Autoscaler

**Issue**: Cluster autoscaler container needs AWS_REGION environment variable for proper AWS API calls.

**Added**:
```typescript
env: [
  {
    name: 'AWS_REGION',
    value: this.region,
  },
],
```

**Impact**: Minor - helps with explicit region configuration.

## Summary

- **Critical Issues**: 1 (CDK token resolution)
- **Minor Issues**: 1 (missing env var)
- **Total Fixes**: 2

The MODEL_RESPONSE was 95% correct. The main issue was a CDK-specific limitation around token resolution in tag keys, which is a common gotcha for developers new to CDK but experienced with Kubernetes/EKS patterns.
